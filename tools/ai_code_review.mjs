// 「어때?」 AI 코드 리뷰 — PR head마다 Devin 세션에 diff를 주고 "코드가 맞는지·안전한지"를 판정받는다.
// 규칙 봇(tools/pr_review_bot.mjs)은 규칙 위반·충돌·CI만 보므로, 내용 검토는 이 스크립트가 맡는다.
//
// 결과 반영:
//   - PR 코멘트: 리뷰 본문 + 마커 <!-- ai-review:{sha10}:{PASS|FAIL|ERROR} -->
//   - 커밋 상태(statuses) context "ai-review": success / failure / error — 규칙 봇의 머지 게이트
// 재실행: 새 push, 또는 협력자가 PR에 `/ai-review` 댓글 (ai-review.yml)
//
// 실행: GitHub Actions(ai-review.yml)에서 DEVIN_API_KEY·DEVIN_ORG_ID·GITHUB_TOKEN·PR_NUMBER로 실행.
// 로컬 점검: DRY_RUN=1 PR_NUMBER=27 node tools/ai_code_review.mjs — Devin을 부르지 않고 프롬프트만 출력.
const { DEVIN_API_KEY, DEVIN_ORG_ID, GITHUB_TOKEN, PR_NUMBER } = process.env;
const REPO = process.env.GITHUB_REPOSITORY || "sterran123/eottae";
const DRY = process.env.DRY_RUN === "1";
const CONTEXT = "ai-review";
// 리뷰는 대화형 답변보다 오래 걸린다 — 잡 timeout(30분)보다 짧게 잡아 결과를 항상 기록한다
const DEADLINE_MS = 25 * 60_000;
const MAX_DIFF_CHARS = 60_000;
// 자동 생성 파일만 바뀐 PR은 리뷰할 코드가 없다 (team-sync 봇 PR)
const GENERATED = new Set([
  "0. 소스코드/eottae-web/docs/TEAM_ACTIVITY.md",
  "FILE_INDEX.csv",
  "MANIFEST.sha256",
]);

if (!PR_NUMBER) throw new Error("PR_NUMBER 필요");
if (!DRY && (!GITHUB_TOKEN || !DEVIN_API_KEY || !DEVIN_ORG_ID)) {
  // 시크릿이 없으면 판정 불가 — 머지 게이트가 열리지 않도록 error 상태를 남긴다(fail-closed)
  console.error("GITHUB_TOKEN·DEVIN_API_KEY·DEVIN_ORG_ID 필요");
}

const GH = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "eottae-ai-review",
  "Content-Type": "application/json",
  ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
};
const gh = async (path, { method = "GET", body } = {}) => {
  const r = await fetch(`https://api.github.com/${path}`, {
    method,
    headers: GH,
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`GitHub ${r.status} ${method} ${path}: ${t.slice(0, 200)}`);
  return t ? JSON.parse(t) : null;
};
const ghAll = async (path) => {
  const out = [];
  for (let page = 1; page <= 30; page++) {
    const items = await gh(`${path}${path.includes("?") ? "&" : "?"}per_page=100&page=${page}`);
    out.push(...items);
    if (items.length < 100) break;
  }
  return out;
};

const DH = { Authorization: `Bearer ${DEVIN_API_KEY}`, "Content-Type": "application/json" };
// 4xx(키·권한·잘못된 경로)는 기다려도 안 풀린다 — 예외로 올려 즉시 error로 끝낸다. 5xx·네트워크는 재시도 대상.
const devin = async (p, init = {}) => {
  const r = await fetch(`https://api.devin.ai/v3/organizations/${DEVIN_ORG_ID}/${p}`, { headers: DH, ...init });
  const body = await r.json().catch(() => ({}));
  if (r.status >= 400 && r.status < 500) {
    const e = new Error(`Devin API ${r.status} ${p}: ${JSON.stringify(body).slice(0, 200)}`);
    e.fatal = true;
    throw e;
  }
  return r.ok ? body : {};
};
// 판정은 비어 있지 않은 **마지막 줄**만 인정한다 — 본문 중간·진행 메시지의 "VERDICT: PASS"를
// 판정으로 읽으면 머지 게이트가 잘못 열린다(fail-open). (PR #31 AI 리뷰 지적)
const lastLine = (m) => String(m || "").trimEnd().split("\n").pop().trim();
const verdictOf = (m) => lastLine(m).match(/^VERDICT:\s*(PASS|CHANGES_REQUESTED)$/)?.[1];

const pr = await gh(`repos/${REPO}/pulls/${PR_NUMBER}`);
const sha = pr.head.sha;
const marker = (v) => `<!-- ai-review:${sha.slice(0, 10)}:${v} -->`;

const setStatus = async (state, description, target_url) => {
  if (DRY) return console.log(`[DRY] status ${state}: ${description}`);
  await gh(`repos/${REPO}/statuses/${sha}`, {
    method: "POST",
    body: { state, context: CONTEXT, description: description.slice(0, 140), ...(target_url ? { target_url } : {}) },
  });
};
// 코멘트 실패(권한·일시 오류)가 판정 기록을 막지 않게 — 상태는 항상 먼저 남기고 코멘트는 best-effort
const comment = async (verdict, body) => {
  const full = `${marker(verdict)}\n${body}`;
  if (DRY) return console.log(`[DRY] comment ${verdict}\n${full.slice(0, 600)}`);
  try {
    await gh(`repos/${REPO}/issues/${PR_NUMBER}/comments`, { method: "POST", body: { body: full } });
  } catch (e) {
    console.error(`코멘트 실패(판정 상태는 기록됨): ${e.message}`);
    process.exitCode = 1;
  }
};

// 같은 head sha를 이미 판정했으면 반복하지 않는다 (재실행은 /ai-review 댓글이 FORCE로 요청)
const prior = (await ghAll(`repos/${REPO}/issues/${PR_NUMBER}/comments`)).find((c) =>
  String(c.body).includes(`<!-- ai-review:${sha.slice(0, 10)}:`),
);
if (prior && process.env.FORCE !== "1") {
  console.log(`이미 판정한 sha(${sha.slice(0, 7)}) — 생략`);
  process.exit(0);
}

const files = await ghAll(`repos/${REPO}/pulls/${PR_NUMBER}/files`);
const names = files.map((f) => f.filename);
if (names.length && names.every((f) => GENERATED.has(f))) {
  await setStatus("success", "자동 생성 파일만 변경 — 코드 리뷰 대상 없음");
  console.log("생성 파일만 변경 — success");
  process.exit(0);
}

// diff 구성 — 바이너리(이미지 등)는 patch가 없으니 목록만, 길면 잘라서 나머지는 링크로 확인시킨다
let diff = "";
let truncated = false;
for (const f of files) {
  const head = `\n### ${f.status} ${f.filename}${f.previous_filename ? ` (← ${f.previous_filename})` : ""} +${f.additions}/-${f.deletions}\n`;
  const body = f.patch ? "```diff\n" + f.patch + "\n```\n" : "(바이너리 또는 대용량 — patch 없음)\n";
  if (diff.length + head.length + body.length > MAX_DIFF_CHARS) {
    truncated = true;
    diff += head + "(길이 제한으로 생략 — 저장소에서 직접 확인)\n";
    continue;
  }
  diff += head + body;
}

const prompt = [
  `너는 「어때?」 팀 프로젝트(github.com/${REPO})의 코드 리뷰어다. PR #${PR_NUMBER} "${pr.title}" (작성자 @${pr.user.login}, head ${sha.slice(0, 7)})를 리뷰한다.`,
  `PR 링크: ${pr.html_url}/files`,
  "",
  "## 판정 기준 (이 저장소 규칙)",
  "1. **정확성**: 명백한 버그, 타입·런타임 오류 가능성, 요구사항(2. 프로젝트 설계서/요구사항_마스터.md의 해당 ID) 완료 기준과 어긋나는 구현, PR 설명과 실제 코드의 불일치.",
  "2. **보안·개인정보**(가장 중요):",
  "   - ADR-005: 백엔드는 Supabase + GitHub Pages 정적 배포. 보안 경계는 RLS. 브라우저 코드에 service_role·비밀키·서명 키가 들어가면 안 된다. 자체 세션 토큰/서명 금지(Supabase Auth 사용). Next API 라우트는 Pages에서 실행되지 않는다.",
  "   - ADR-002: 성인 인증은 fail-closed. 환경변수가 없을 때 알려진 기본값으로 동작하는 코드 금지. 클라이언트 조건은 UI 편의일 뿐이다.",
  "   - ADR-003: 채팅·추천은 match 구성원·차단 상태를 서버(RLS)에서 검사.",
  "   - 실제 개인정보·연락처·키를 Git에 올리지 않는다.",
  "3. **저장소 규칙**: 색상은 CSS 토큰만(tsx·css에 hex 하드코딩 금지 — match 영역은 match-tokens.css), prefers-reduced-motion 존중, 터치 영역 44px·키보드 포커스 표시, 한국어 UI, 담당 영역 밖 파일 변경 여부(CODEOWNERS), docs/AI_REPORT_LOG.md에 실행/미실행 구분 기록.",
  "",
  "## 출력 형식 (이 세션의 마지막 메시지가 PR 코멘트로 그대로 게시된다 — 질문하지 말고 완결하라)",
  "한국어로, 다음 순서:",
  "- 첫 줄: `## AI 코드 리뷰 — ✅ 통과` 또는 `## AI 코드 리뷰 — ❌ 수정 필요`",
  "- `### 반드시 고칠 것` — 보안 문제·버그만. 각 항목: `파일:라인` · 왜 문제인지 · 어떻게 고칠지(가능하면 코드 예시). 없으면 '없음'.",
  "- `### 권장 사항` — 규칙 위반·개선 제안(머지를 막지 않음).",
  "- `### 확인한 것` — 무엇을 검토했는지 한두 줄.",
  "- 마지막 줄에 정확히 `VERDICT: PASS` 또는 `VERDICT: CHANGES_REQUESTED` (반드시 고칠 것이 하나라도 있으면 CHANGES_REQUESTED).",
  "",
  "커밋·push·승인·머지·코멘트 작성 같은 쓰기 작업은 하지 않는다(응답 전용).",
  truncated ? "\n※ diff가 길어 일부 파일은 생략됐다 — 위 PR 링크에서 직접 읽고 판정하라." : "",
  "",
  `## PR 설명\n${(pr.body || "(없음)").slice(0, 4000)}`,
  "",
  `## 변경 파일 (${files.length}개)${diff}`,
].join("\n");

if (DRY) {
  console.log(prompt.slice(0, 3000));
  console.log(`\n… (프롬프트 ${prompt.length}자, diff 생략 여부: ${truncated})`);
  process.exit(0);
}

if (!DEVIN_API_KEY || !DEVIN_ORG_ID) {
  await setStatus("error", "DEVIN 시크릿 없음 — AI 리뷰 불가");
  process.exit(1);
}

await setStatus("pending", "Devin이 코드를 리뷰하는 중");
// 4xx는 예외로 올라온다 — 아래 실패 경로(error 상태 + 재시도 안내)로 합친다
const sess = await devin("sessions", {
  method: "POST",
  body: JSON.stringify({ prompt, title: `AI 리뷰: PR #${PR_NUMBER} @ ${sha.slice(0, 7)}` }),
}).catch((e) => ({ error: e.message }));
if (!sess.session_id) {
  console.error("세션 생성 실패:", JSON.stringify(sess).slice(0, 300));
  await setStatus("error", "Devin 세션 생성 실패 — /ai-review 댓글로 재시도");
  await comment(
    "ERROR",
    `🤖 **AI 코드 리뷰를 시작하지 못했습니다** (Devin 세션 생성 실패).\n\n자동 머지는 AI 리뷰 통과 전까지 보류됩니다. 잠시 후 이 PR에 \`/ai-review\` 댓글을 달면 다시 시도합니다.`,
  );
  process.exit(1);
}
const url = sess.url ?? `https://app.devin.ai/sessions/${sess.session_id}`;
console.log("session:", sess.session_id, url);

let answer = null;
const deadline = Date.now() + DEADLINE_MS;
// Devin은 답을 다 쓴 뒤에도 세션을 running으로 열어 둘 때가 있다 — 상태만 기다리면 시간 초과가 난다.
// 매 주기 메시지를 읽어 마지막 줄이 VERDICT인 응답이 나오면 바로 채택하고, 세션이 끝나면 마지막 응답을 쓴다.
let fatal = null;
while (Date.now() < deadline) {
  await new Promise((r) => setTimeout(r, 30_000));
  try {
    const msgs = await devin(`sessions/${sess.session_id}/messages`);
    const said = (msgs.items ?? []).filter((m) => m.source === "devin").map((m) => m.message?.trim() || "");
    const done = [...said].reverse().find((m) => verdictOf(m));
    if (done) {
      answer = done;
      break;
    }
    const s = await devin(`sessions/${sess.session_id}`);
    if (s.status && s.status !== "running") {
      answer = said.pop() || null;
      break;
    }
  } catch (e) {
    if (e.fatal) {
      fatal = e;
      break;
    }
    console.error(`일시 오류 — 재시도: ${e.message}`);
  }
}
if (fatal) {
  console.error(fatal.message);
  await setStatus("error", "Devin API 오류 — /ai-review로 재시도", url);
  await comment(
    "ERROR",
    `🤖 **AI 코드 리뷰 중 Devin API 오류가 났습니다** (\`${fatal.message.slice(0, 120)}\`).\n\n자동 머지는 보류됩니다. 이 PR에 \`/ai-review\` 댓글을 달면 다시 리뷰합니다. [Devin 세션](${url})`,
  );
  process.exit(1);
}

const verdict = verdictOf(answer);
if (!answer || !verdict) {
  await setStatus("error", answer ? "판정 형식 없음 — /ai-review로 재시도" : "시간 초과 — /ai-review로 재시도", url);
  await comment(
    "ERROR",
    `🤖 **AI 코드 리뷰 판정을 받지 못했습니다** (${answer ? "응답에 VERDICT 줄 없음" : "25분 시간 초과"}).\n\n` +
      (answer ? `<details><summary>받은 응답</summary>\n\n${answer}\n\n</details>\n\n` : "") +
      `자동 머지는 보류됩니다. 이 PR에 \`/ai-review\` 댓글을 달면 다시 리뷰합니다. [Devin 세션](${url})`,
  );
  process.exit(0);
}

const pass = verdict === "PASS";
await setStatus(pass ? "success" : "failure", pass ? "AI 리뷰 통과" : "AI 리뷰 — 수정 필요", url);
await comment(
  pass ? "PASS" : "FAIL",
  `${answer.trimEnd().split("\n").slice(0, -1).join("\n").trim()}\n\n---\n` +
    (pass
      ? `🤖 판정: **통과** (head \`${sha.slice(0, 7)}\`) — 규칙 봇이 나머지 조건을 확인해 머지합니다.`
      : `🤖 판정: **수정 필요** (head \`${sha.slice(0, 7)}\`) — 「반드시 고칠 것」을 수정해 push하면 자동으로 다시 리뷰합니다. 판정에 동의하지 않으면 담당자가 PR을 Approve하면 사람 판단이 우선합니다.`) +
    ` · [Devin 세션](${url})`,
);
console.log("verdict:", verdict);
