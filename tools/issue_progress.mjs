// 「어때?」 이슈 진행 동기화 — 머지된 PR이 어느 이슈의 어느 체크 항목을 끝냈는지 판정해
// 체크박스를 체크하고, 이슈의 모든 항목이 체크되면 이슈를 닫는다.
// PR 본문에 Closes/Refs가 없어도 작성자 담당 이슈·요구사항 ID로 후보를 찾는다.
//
// 엄격 판정 (AI 말만 믿지 않는다 — 셋 다 통과한 항목만 체크):
//   1. 게이트: 협력자 브랜치 PR이고, head에 AI 코드 리뷰(`ai-review`) 통과 또는
//      작성자 외 협력자가 그 head sha에 남긴 Approve가 있어야 한다
//   2. Devin 판정: 항목별 done / partial / not_done / needs_human. 일부만·애매·사람 확인 필요는 done 아님.
//      "46곳·모든·전부" 같은 전수 항목은 done이어도 체크하지 않는다(근거 몇 줄로 증명 불가)
//   3. 근거 기계 검증: done 항목은 근거(파일·줄·인용)가 필요하고, 인용은 **이 PR이 추가한 줄**에
//      있어야 하며 **머지 커밋의 해당 파일**에도 그대로 있어야 한다 — 하나라도 어긋나면 체크하지 않는다
//      (한계: 인용이 '진짜 이 PR의 코드'인지는 보장하지만, 그 줄이 항목과 관련 있는지는 AI 판정에 맡긴다.
//       그래서 1·2의 게이트·엄격 판정과 아래의 id·문구 일치 검사를 함께 건다)
//   4. id와 문구: 판정의 체크박스 id와 옮겨 적은 문구가 그 줄과 맞아야 한다
// 닫기: 체크 후 이슈 본문의 체크박스가 전부 [x]일 때만 닫는다(사람이 직접 체크한 항목 포함).
//   Closes 키워드로 GitHub이 이미 닫았는데 남은 항목이 있으면 담당자에게 알린다(다시 열지는 않음).
//
// 모드
//   PR_NUMBER=N    머지된 PR 처리 (issue-progress.yml: 사람 머지 이벤트 / 규칙 봇 머지 후 dispatch)
//   ISSUE_NUMBER=N 사람이 이슈 본문을 고쳤을 때 — 체크박스가 전부 체크됐으면 닫기만 (AI 호출 없음)
// 로컬 점검: DRY_RUN=1 PR_NUMBER=27 node tools/issue_progress.mjs — 쓰기·Devin 호출 없이 후보·프롬프트만 출력
const { DEVIN_API_KEY, DEVIN_ORG_ID, GITHUB_TOKEN } = process.env;
const REPO = process.env.GITHUB_REPOSITORY || "sterran123/eottae";
const DRY = process.env.DRY_RUN === "1";
const FORCE = process.env.FORCE === "1";
const PR_NUMBER = /^\d+$/.test(process.env.PR_NUMBER || "") ? process.env.PR_NUMBER : "";
const ISSUE_NUMBER = /^\d+$/.test(process.env.ISSUE_NUMBER || "") ? process.env.ISSUE_NUMBER : "";
const BOT = "github-actions[bot]";
const DEADLINE_MS = 25 * 60_000;
const MAX_DIFF_CHARS = 60_000;
const MAX_ISSUES = 5;
const END = "ISSUE_PROGRESS_END";
// 이슈 연결 키워드 — Closes류는 머지 때 GitHub이 닫고, Refs류는 연결만 한다
const LINKS = /\b(close[sd]?|fix(e[sd])?|resolve[sd]?|refs?|related\s+to|part\s+of)\s*:?\s+#(\d+)/gi;
// 요구사항_마스터·테스트_케이스_마스터의 접두어만 — ADR-005 같은 결정 기록 번호는 거의 모든 PR이 언급해 후보가 폭증한다
// SEC-001·002(보안·QA 증빙)는 인프라 PR 거의 전부가 표기해 후보 근거로 쓰지 않는다
const REQ_ID = /\b(MATCH|ACT|INV|CORE|FR|TC)-\d{3}\b/g;
const MEMBER_ASSOC = new Set(["OWNER", "MEMBER", "COLLABORATOR"]);
// 체크박스 줄: "- [ ] 내용" / "* [x] 내용"
// GitHub이 체크박스로 그리는 형식 전부 — 번호 목록("1. [ ]")·인용("> - [ ]")을 빠뜨리면
// 그 항목이 남아 있어도 '전부 체크'로 보고 이슈를 일찍 닫는다
const BOX = /^(\s*(?:>\s*)*(?:[-*+]|\d+[.)])\s+\[)([ xX])(\]\s+)(.*)$/;
// 전수 항목(여러 곳을 전부 고쳐야 끝나는 항목) — AI가 done이라 해도 자동 체크하지 않는다
const SWEEP = /\d+\s*곳|모든|전부|전체|전수/;

const GH = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "eottae-issue-progress",
  "Content-Type": "application/json",
  ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
};
const gh = async (path, { method = "GET", body, raw = false } = {}) => {
  const r = await fetch(`https://api.github.com/${path}`, {
    method,
    headers: raw ? { ...GH, Accept: "application/vnd.github.raw+json" } : GH,
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  if (!r.ok) {
    const e = new Error(`GitHub ${r.status} ${method} ${path}: ${t.slice(0, 200)}`);
    e.status = r.status;
    throw e;
  }
  return raw ? t : t ? JSON.parse(t) : null;
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
const write = async (path, opts, what) => {
  if (DRY) return console.log(`[DRY] ${what}`);
  return gh(path, opts);
};

// 본문의 체크박스 목록 — id는 본문 안에서 몇 번째 체크박스인지(1부터).
// 코드 펜스 안의 "- [ ]"는 예시일 뿐이라 세지 않는다(전부 체크 판정이 영원히 안 끝나는 것 방지)
const boxes = (body) => {
  const out = [];
  let fence = false;
  String(body || "")
    .split("\n")
    .forEach((line, i) => {
      const l = line.replace(/\r$/, "");
      if (/^\s*(```|~~~)/.test(l)) fence = !fence;
      const m = !fence && l.match(BOX);
      if (m) out.push({ id: out.length + 1, lineNo: i, checked: m[2] !== " ", text: m[4].trim() });
    });
  return out;
};
const allChecked = (body) => {
  const b = boxes(body);
  return b.length > 0 && b.every((x) => x.checked);
};

const closeIssue = async (n, body) => {
  // PR 판정과 이슈 수정 실행은 concurrency 그룹이 달라 동시에 닫을 수 있다 — 이미 닫혔으면 코멘트도 생략
  if ((await gh(`repos/${REPO}/issues/${n}`)).state !== "open") return console.log(`#${n} 이미 닫힘`);
  await write(`repos/${REPO}/issues/${n}/comments`, { method: "POST", body: { body } }, `comment #${n}`);
  await write(`repos/${REPO}/issues/${n}`, { method: "PATCH", body: { state: "closed", state_reason: "completed" } }, `close #${n}`);
  console.log(`#${n} 닫음`);
};

// ── 모드 2: 사람이 이슈 본문을 고쳤을 때 — 마지막 체크박스까지 체크했으면 닫는다 ──
if (ISSUE_NUMBER && !PR_NUMBER) {
  const issue = await gh(`repos/${REPO}/issues/${ISSUE_NUMBER}`);
  // 이번 수정으로 '마지막 체크'가 된 경우만 — 전부 체크된 채 Reopen한 이슈를 오타 수정마다 다시 닫지 않게
  const prev = process.env.PREV_BODY;
  if (issue.pull_request || issue.state !== "open" || !allChecked(issue.body) || (prev != null && allChecked(prev))) {
    console.log(`#${ISSUE_NUMBER}: 닫을 조건 아님 (열림=${issue.state === "open"}, 전부 체크=${allChecked(issue.body)})`);
    process.exit(0);
  }
  await closeIssue(
    ISSUE_NUMBER,
    `🤖 **체크리스트 ${boxes(issue.body).length}개가 모두 체크돼 이슈를 자동으로 닫습니다.**\n\n아직 남은 일이 있으면 **Reopen**하고 해당 항목의 체크를 풀어 주세요.`,
  );
  process.exit(0);
}

if (!PR_NUMBER) throw new Error("PR_NUMBER 또는 ISSUE_NUMBER 필요");

// ── 모드 1: 머지된 PR 처리 ──
const pr = await gh(`repos/${REPO}/pulls/${PR_NUMBER}`);
if (!pr.merged_at) {
  console.log(`PR #${PR_NUMBER}: 머지되지 않음 — 생략`);
  process.exit(0);
}
if (pr.user?.login?.endsWith("[bot]")) {
  console.log(`PR #${PR_NUMBER}: 봇 PR — 이슈 작업 아님`);
  process.exit(0);
}
// 비협력자·포크 PR은 팀 이슈를 진행시키지 않는다 (포크 PR 이벤트의 토큰은 읽기 전용이기도 하다)
if (!MEMBER_ASSOC.has(pr.author_association) || pr.head.repo?.full_name !== REPO) {
  console.log(`PR #${PR_NUMBER}: 협력자 브랜치 PR 아님(${pr.author_association}) — 생략`);
  process.exit(0);
}
const mergeSha = pr.merge_commit_sha;
// MARK는 판정을 끝낸 코멘트에만 — 생략·실패 안내(NOTE)는 재실행을 막지 않는다
const MARK = `<!-- issue-progress:pr${PR_NUMBER} -->`;
const NOTE = `<!-- issue-progress-note:pr${PR_NUMBER} -->`;
const prComments = await ghAll(`repos/${REPO}/issues/${PR_NUMBER}/comments`);
if (!FORCE && prComments.some((c) => c.user?.login === BOT && String(c.body).includes(MARK))) {
  console.log(`PR #${PR_NUMBER}: 이미 처리함 — 생략 (FORCE=1로 재실행)`);
  process.exit(0);
}

// 후보 이슈 — 명시 키워드 > 작성자 담당 > 요구사항 ID 일치. 체크박스가 있는 이슈만
// HTML 주석은 화면에 안 보이는 안내문 — PR 템플릿 주석의 예시 "Closes #20"을 실제 연결로 읽지 않는다
const body = String(pr.body || "").replace(/<!--[\s\S]*?-->/g, "");
const text = `${pr.title}\n${pr.head.ref}\n${body}`;
const explicit = new Set([...body.matchAll(LINKS)].map((m) => Number(m[3])));
const ids = new Set(text.match(REQ_ID) || []);
// 팀원이 쓴 이슈만 — 공개 저장소라 누구나 요구사항 ID·체크박스를 넣은 이슈를 열 수 있고,
// 그 본문은 Devin 프롬프트에 그대로 들어간다(프롬프트 인젝션). 이슈 본문은 작성자·triage 이상만 고칠 수 있다
const teamIssue = (i) => Boolean(i) && !i.pull_request && MEMBER_ASSOC.has(i.author_association);
const open = (await ghAll(`repos/${REPO}/issues?state=open`)).filter(teamIssue);
const pool = new Map(open.map((i) => [i.number, i]));
for (const n of explicit) {
  if (!pool.has(n)) {
    const i = await gh(`repos/${REPO}/issues/${n}`).catch(() => null);
    if (teamIssue(i)) pool.set(n, i); // Closes로 방금 닫힌 이슈도 체크 대상
  }
}
const why = new Map();
for (const i of pool.values()) {
  const r = [];
  if (explicit.has(i.number)) r.push("PR 본문에 명시");
  if (i.assignees?.some((a) => a.login === pr.user.login)) r.push(`@${pr.user.login} 담당`);
  const shared = [...ids].filter((id) => `${i.title}\n${i.body}`.includes(id));
  if (shared.length) r.push(`요구사항 ID ${shared.join("·")}`);
  if (r.length && boxes(i.body).some((b) => !b.checked)) why.set(i.number, r);
}
const candidates = [...why.keys()]
  .sort((a, b) => Number(explicit.has(b)) - Number(explicit.has(a)) || why.get(b).length - why.get(a).length)
  .slice(0, MAX_ISSUES)
  .map((n) => pool.get(n));
if (!candidates.length) {
  console.log(`PR #${PR_NUMBER}: 남은 체크 항목이 있는 후보 이슈 없음`);
  process.exit(0);
}
console.log("후보:", candidates.map((i) => `#${i.number}(${why.get(i.number).join(", ")})`).join(" "));

const prComment = async (body, mark = MARK) => {
  await write(`repos/${REPO}/issues/${PR_NUMBER}/comments`, { method: "POST", body: { body: `${mark}\n${body}` } }, `comment PR #${PR_NUMBER}`);
};

// 게이트 — 코드가 맞는지 확인된 PR만 이슈를 진행시킨다.
// 사람 승인은 규칙 봇과 같은 기준: 머지된 head sha에 남은, 협력자(작성자·봇 제외)의 Approve.
// 공개 저장소라 아무 GitHub 계정이나 Approve를 남길 수 있고, 옛 커밋 승인은 지금 코드를 본 게 아니다.
const statuses = await ghAll(`repos/${REPO}/commits/${pr.head.sha}/statuses`).catch(() => []);
// ai-review 상태는 우리 워크플로(github-actions[bot])가 남긴 것만 인정 — 상태 쓰기 권한만 있으면 누구나 success를 남길 수 있다.
// (협력자 브랜치의 다른 워크플로도 같은 봇 이름으로 쓸 수 있다 — 협력자는 신뢰 범위로 보고, 규칙 봇의 머지 게이트와 같은 수준)
const aiOk =
  statuses.find((s) => s.context === "ai-review" && s.creator?.login === BOT)?.state === "success"; // 최신순
const reviews = await ghAll(`repos/${REPO}/pulls/${PR_NUMBER}/reviews`);
const humanOk = reviews.some(
  (r) =>
    r.state === "APPROVED" &&
    r.commit_id === pr.head.sha &&
    MEMBER_ASSOC.has(r.author_association) &&
    r.user?.type !== "Bot" &&
    r.user?.login !== BOT &&
    r.user?.login !== pr.user.login,
);
const refs = candidates.map((i) => `#${i.number}`).join(" ");
if (!aiOk && !humanOk) {
  await prComment(
    `🤖 **이슈 진행 판정 생략** — 관련 이슈로 보이는 ${refs}의 체크 항목을 자동으로 체크하지 않았습니다.\n\n` +
      `AI 코드 리뷰 통과나 작성자 외 팀원 승인이 없는 PR은 "끝났다"고 인정하지 않습니다. 끝낸 항목은 이슈에서 직접 체크해 주세요 — 모두 체크되면 이슈가 자동으로 닫힙니다.`,
    NOTE,
  );
  process.exit(0);
}

// diff — 근거 검증에 쓰는 "이 PR이 추가한 줄"도 여기서 모은다
const files = await ghAll(`repos/${REPO}/pulls/${PR_NUMBER}/files`);
const added = new Map(); // filename → 추가된 줄(공백 정리)
let diff = "";
let truncated = false;
for (const f of files) {
  if (f.patch) {
    added.set(
      f.filename,
      f.patch
        .split("\n")
        .filter((l) => l.startsWith("+") && !l.startsWith("+++"))
        .map((l) => l.slice(1).trim()),
    );
  }
  const head = `\n### ${f.status} ${f.filename} +${f.additions}/-${f.deletions}\n`;
  const body = f.patch ? "```diff\n" + f.patch + "\n```\n" : "(바이너리 또는 대용량 — patch 없음)\n";
  if (diff.length + head.length + body.length > MAX_DIFF_CHARS) {
    truncated = true;
    diff += head + "(길이 제한으로 생략 — 저장소에서 직접 확인)\n";
    continue;
  }
  diff += head + body;
}

// 이슈 본문에 체크박스 id를 붙여 넘긴다 — 판정은 id로 받는다.
// id는 반드시 boxes()에서 만든다(펜스 안 예시 체크박스를 따로 세면 id가 밀려 엉뚱한 항목을 체크한다)
const ISSUE_CHARS = 6000;
const annotated = (body) => {
  const byLine = new Map(boxes(body).map((b) => [b.lineNo, b.id]));
  const text = String(body || "")
    .split("\n")
    .map((l, i) => (byLine.has(i) ? `[id=${byLine.get(i)}] ${l}` : l))
    .join("\n");
  return text.length > ISSUE_CHARS
    ? `${text.slice(0, ISSUE_CHARS)}\n(… 이슈 본문이 길어 잘림 — 뒤쪽 항목은 판정하지 말 것)`
    : text;
};
const prompt = [
  `너는 「어때?」 팀 프로젝트(github.com/${REPO})의 이슈 진행 검증자다. 방금 머지된 PR #${PR_NUMBER} "${pr.title}"(@${pr.user.login})이 아래 이슈의 체크 항목 중 무엇을 **완전히** 끝냈는지 판정한다.`,
  `머지 커밋: https://github.com/${REPO}/tree/${mergeSha} — 필요하면 이 커밋의 파일을 직접 읽어라.`,
  "",
  "## 판정 규칙 (엄격 — 틀리게 체크하면 할 일이 사라진다. 애매하면 done이 아니다)",
  "- `done`: 이 PR의 변경만으로 항목의 **완료 기준 전체**를 충족한다. 여러 곳을 고쳐야 하는 항목(예: '46곳', '모든 버튼')은 남은 곳이 하나도 없음을 머지 커밋에서 확인했을 때만.",
  "- `partial`: 일부만 했다. `not_done`: 관련은 있지만 끝나지 않았다.",
  "- `needs_human`: 코드로 확인할 수 없는 항목(검토·확인·합의·실기기 테스트·Secrets 등록·다른 팀원과 맞추기 등). 코드가 바뀌었어도 done으로 하지 않는다.",
  "- 이 PR과 무관한 항목은 쓰지 않는다. 이 PR과 무관한 이슈는 `related: false`.",
  "- 각 항목의 `text`에는 그 id 줄의 체크박스 문구 앞부분(20자 이상)을 그대로 옮긴다 — id와 문구가 맞지 않으면 체크하지 않는다.",
  "- done 항목의 `evidence`는 **이 PR이 추가하거나 바꾼 줄**을 그대로 인용한다(quote는 한 줄의 일부, 8자 이상, 공백 외 수정 금지). file은 저장소 루트 기준 전체 경로, line은 머지 커밋 기준 줄 번호. 근거는 기계로 다시 대조해서 맞지 않으면 체크하지 않는다.",
  "",
  "## 출력 형식 (마지막 메시지 하나로 끝낸다. 질문하지 않는다. 쓰기 작업 금지 — 응답 전용)",
  "```json",
  '{"issues":[{"number":20,"related":true,"items":[{"id":4,"text":"**MATCH-009 거절 가능** — 완료 기준이","status":"done","why":"한 줄 이유","evidence":[{"file":"0. 소스코드/eottae-web/src/app/match/match-recommend.css","line":120,"quote":"min-height: 44px;"}]}]}]}',
  "```",
  `JSON 코드블록 뒤 마지막 줄에 정확히 \`${END}\``,
  truncated ? "\n※ diff가 길어 일부 파일은 생략됐다 — 머지 커밋에서 직접 읽어라." : "",
  "",
  `## PR 설명\n${(pr.body || "(없음)").slice(0, 3000)}`,
  "",
  ...candidates.flatMap((i) => [`## 이슈 #${i.number} ${i.title} (후보 사유: ${why.get(i.number).join(", ")})`, annotated(i.body), ""]),
  `## 변경 파일 (${files.length}개)${diff}`,
].join("\n");

if (DRY) {
  console.log(prompt.slice(0, 4000));
  console.log(`\n… (프롬프트 ${prompt.length}자)`);
  process.exit(0);
}
if (!GITHUB_TOKEN || !DEVIN_API_KEY || !DEVIN_ORG_ID) throw new Error("GITHUB_TOKEN·DEVIN_API_KEY·DEVIN_ORG_ID 필요");

const DH = { Authorization: `Bearer ${DEVIN_API_KEY}`, "Content-Type": "application/json" };
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
const finished = (m) => String(m || "").trimEnd().split("\n").pop().trim() === END;

const sess = await devin("sessions", {
  method: "POST",
  body: JSON.stringify({ prompt, title: `이슈 진행: PR #${PR_NUMBER} → ${refs}` }),
}).catch((e) => ({ error: e.message }));
const failNote = (reason) =>
  prComment(
    `🤖 **이슈 진행 판정 실패** (${reason}) — 관련 이슈로 보이는 ${refs}를 체크하지 않았습니다.\n\n` +
      `끝낸 항목은 이슈에서 직접 체크해 주세요(모두 체크되면 자동으로 닫힘). 관리자는 Actions → \`issue-progress\` → Run workflow(pr=${PR_NUMBER})로 다시 판정할 수 있습니다.`,
    NOTE,
  );
if (!sess.session_id) {
  console.error("세션 생성 실패:", JSON.stringify(sess).slice(0, 300));
  await failNote("Devin 세션 생성 실패");
  process.exit(1);
}
const url = sess.url ?? `https://app.devin.ai/sessions/${sess.session_id}`;
console.log("session:", url);

let answer = null;
const deadline = Date.now() + DEADLINE_MS;
while (Date.now() < deadline) {
  await new Promise((r) => setTimeout(r, 30_000));
  try {
    const msgs = await devin(`sessions/${sess.session_id}/messages`);
    const said = (msgs.items ?? []).filter((m) => m.source === "devin").map((m) => m.message?.trim() || "");
    answer = [...said].reverse().find(finished) ?? null;
    if (answer) break;
    const s = await devin(`sessions/${sess.session_id}`);
    if (s.status && s.status !== "running") break;
  } catch (e) {
    if (e.fatal) {
      console.error(e.message);
      break;
    }
    console.error(`일시 오류 — 재시도: ${e.message}`);
  }
}
// 마지막 json 코드블록만 판정으로 쓴다 — 예시·중간 초안 블록을 판정으로 읽지 않게
const json = [...String(answer || "").matchAll(/```json\s*([\s\S]*?)```/g)].pop()?.[1];
let result = null;
try {
  result = json ? JSON.parse(json) : null;
} catch {
  result = null;
}
if (!Array.isArray(result?.issues)) {
  await failNote(answer ? "판정 형식 오류" : "시간 초과 또는 API 오류");
  process.exit(1);
}

// 근거 기계 검증 — 인용이 이 PR의 추가 줄에 있고, 머지 커밋 파일에도 있어야 한다
const fileCache = new Map();
const fileAt = async (path) => {
  if (!fileCache.has(path)) {
    const enc = path.split("/").map(encodeURIComponent).join("/");
    fileCache.set(path, await gh(`repos/${REPO}/contents/${enc}?ref=${mergeSha}`, { raw: true }).catch(() => null));
  }
  return fileCache.get(path);
};
const norm = (s) => String(s || "").replace(/\s+/g, " ").trim();
const verify = async (ev) => {
  const quote = norm(ev?.quote);
  if (quote.length < 8) return { ok: false, why: "인용이 너무 짧음" };
  const lines = added.get(ev.file);
  if (!lines) return { ok: false, why: `\`${ev.file}\`은 이 PR의 diff에 없음` };
  if (!lines.some((l) => norm(l).includes(quote))) return { ok: false, why: "인용이 이 PR의 추가 줄에 없음" };
  const content = await fileAt(ev.file);
  if (content == null) return { ok: false, why: "머지 커밋에서 파일을 읽지 못함" };
  const hits = content.split("\n").flatMap((l, i) => (norm(l).includes(quote) ? [i + 1] : []));
  if (!hits.length) return { ok: false, why: "머지 커밋 파일에 인용이 없음(이후 덮어씀?)" };
  const line = hits.reduce((a, b) => (Math.abs(b - ev.line) < Math.abs(a - ev.line) ? b : a));
  return { ok: true, file: ev.file, line };
};
const blob = (f, l) =>
  `[\`${f.split("/").pop()}:${l}\`](https://github.com/${REPO}/blob/${mergeSha}/${f.split("/").map(encodeURIComponent).join("/")}#L${l})`;

const summary = [];
for (const r of result.issues) {
  const issue = candidates.find((i) => i.number === Number(r.number));
  if (!issue || !r.related) continue;
  const before = boxes(issue.body);
  const verified = [];
  const rejected = [];
  const partial = [];
  const human = [];
  for (const it of r.items || []) {
    const box = before.find((b) => b.id === Number(it.id));
    if (!box || box.checked) continue;
    // id와 함께 옮겨 적은 문구가 그 줄과 맞아야 한다 — id가 어긋난 판정으로 다른 항목을 체크하지 않게
    const said = norm(it.text);
    const sameItem = said.length >= Math.min(20, norm(box.text).length) && norm(box.text).startsWith(said);
    if (!sameItem) {
      // 진행 중·사람 확인 판정도 id가 어긋났으면 엉뚱한 항목 이름으로 보고되니 done만 기록하고 나머지는 버린다
      if (it.status === "done") rejected.push({ box, why: it.why, fail: "판정의 id와 항목 문구가 맞지 않음" });
    } else if (it.status === "partial" || it.status === "not_done") partial.push({ box, why: it.why });
    else if (it.status === "needs_human") human.push({ box, why: it.why });
    else if (it.status === "done" && SWEEP.test(box.text)) {
      // "46곳 → 토큰", "모든 버튼"처럼 전수 항목은 인용 몇 줄로 '남은 곳 없음'을 증명할 수 없다
      rejected.push({ box, why: it.why, fail: "전수 항목 — 근거 몇 줄로 완료를 증명할 수 없어 사람이 확인 후 체크" });
    } else if (it.status === "done") {
      const evs = Array.isArray(it.evidence) ? it.evidence : [];
      const checks = await Promise.all(evs.map(verify));
      const bad = checks.find((c) => !c.ok);
      if (!evs.length || bad) rejected.push({ box, why: it.why, fail: bad?.why || "근거 없음" });
      else verified.push({ box, why: it.why, links: checks.map((c) => blob(c.file, c.line)) });
    }
  }
  if (!verified.length && !rejected.length && !partial.length && !human.length) continue;

  // 체크 — 판정 사이에 사람이 본문을 고쳤을 수 있으니 최신 본문에서 같은 문구의 줄을 찾아 바꾼다.
  // GitHub에는 조건부 PATCH가 없어, 쓰기 직전에 다시 읽어 그대로일 때만 쓴다(바뀌었으면 새 본문으로 재시도)
  let fresh = await gh(`repos/${REPO}/issues/${issue.number}`);
  let applied = new Set(); // 실제로 [x]로 바꾼 항목만 "체크함"으로 보고한다
  for (let attempt = 0; verified.length && attempt < 3; attempt++) {
    const lines = String(fresh.body || "").split("\n");
    const cur = boxes(fresh.body);
    const now = new Set();
    for (const v of verified) {
      // 같은 자리(id+문구)가 1순위, id가 바뀌었으면 같은 문구가 정확히 하나일 때만 따라간다
      const same = cur.filter((b) => b.text === v.box.text);
      const target = cur.find((b) => b.id === v.box.id && b.text === v.box.text) ?? (same.length === 1 ? same[0] : null);
      if (!target || target.checked) continue;
      // 웹 편집기로 쓴 본문은 CRLF — \r을 떼고 바꾼 뒤 되붙인다(정규식 .은 \r에 안 맞는다)
      const cr = lines[target.lineNo].endsWith("\r") ? "\r" : "";
      lines[target.lineNo] = lines[target.lineNo].replace(/\r$/, "").replace(BOX, "$1x$3$4") + cr;
      target.checked = true;
      now.add(v);
    }
    if (!now.size) break;
    const latest = await gh(`repos/${REPO}/issues/${issue.number}`);
    if (latest.body !== fresh.body) {
      fresh = latest;
      continue;
    }
    const body = lines.join("\n");
    await write(`repos/${REPO}/issues/${issue.number}`, { method: "PATCH", body: { body } }, `check ${now.size} in #${issue.number}`);
    fresh = { ...fresh, body };
    applied = now;
    break;
  }
  const checked = verified.filter((v) => applied.has(v));
  const missed = verified.filter((v) => !applied.has(v));
  const after = boxes(fresh.body);
  const left = after.filter((b) => !b.checked);
  // AI가 쓴 이유는 그대로 게시하지 않는다 — 멘션·링크 무력화, 한 줄·길이 제한
  const safe = (t) => String(t || "").replace(/@/g, "@\u200b").replace(/\]\(/g, "] (").replace(/\s+/g, " ").slice(0, 200);
  const line = (x) => `- ${x.box.text.slice(0, 120)}${x.why ? ` — ${safe(x.why)}` : ""}`;
  const sections = [
    checked.length && `**✅ 체크함 (${checked.length})** — 근거 대조 통과\n` + checked.map((v) => `${line(v)} · ${v.links.join(" ")}`).join("\n"),
    missed.length && `**⚠️ 검증은 통과했지만 체크 못 함 (${missed.length})** — 판정 중 이슈 본문이 바뀌었거나 이미 체크됨. 확인 후 직접 체크해 주세요\n` + missed.map((v) => `${line(v)} · ${v.links.join(" ")}`).join("\n"),
    rejected.length && `**🔎 AI는 완료로 봤지만 근거 대조 실패 → 체크 안 함 (${rejected.length})**\n` + rejected.map((v) => `${line(v)} · _${safe(v.fail)}_`).join("\n"),
    partial.length && `**◐ 진행 중 (${partial.length})**\n` + partial.map(line).join("\n"),
    human.length && `**👤 사람 확인 필요 (${human.length})** — 확인한 뒤 직접 체크해 주세요\n` + human.map(line).join("\n"),
  ].filter(Boolean);
  const assignees = (fresh.assignees || []).map((a) => `@${a.login}`).join(" ");
  const head = `${MARK}\n🤖 **PR #${PR_NUMBER} 머지 — 이 이슈의 항목을 검증했습니다.** ([판정 세션](${url}))\n\n`;
  if (fresh.state === "open" && allChecked(fresh.body)) {
    await closeIssue(
      issue.number,
      head + sections.join("\n\n") + `\n\n**체크리스트 ${after.length}개가 모두 체크돼 이슈를 자동으로 닫습니다.** 아직 남은 일이 있으면 **Reopen**하고 해당 항목의 체크를 풀어 주세요.`,
    );
    summary.push(`#${issue.number} — ${checked.length}개 체크 · **모든 항목 완료로 닫음**`);
  } else {
    const tail =
      fresh.state === "closed" && left.length
        ? `\n\n⚠️ ${assignees} 이 이슈는 \`Closes\` 키워드로 닫혔지만 **남은 항목이 ${left.length}개** 있습니다. 끝나지 않았다면 Reopen해 주세요 — 다음부터는 일부만 끝낸 PR에 \`Refs #${issue.number}\`를 쓰면 이슈가 열린 채로 연결됩니다.`
        : fresh.state === "closed"
          ? `\n\n체크리스트 ${after.length}개가 모두 체크됐습니다 (이슈는 이미 닫혀 있음).`
          : `\n\n남은 항목 ${left.length}/${after.length}개 — 모두 체크되면 자동으로 닫힙니다.`;
    await write(`repos/${REPO}/issues/${issue.number}/comments`, { method: "POST", body: { body: head + sections.join("\n\n") + tail } }, `comment #${issue.number}`);
    summary.push(`#${issue.number} — ${checked.length}개 체크 · 남은 항목 ${left.length}개`);
  }
}

await prComment(
  summary.length
    ? `🤖 **이슈 진행 반영** ([판정 세션](${url}))\n\n${summary.map((s) => `- ${s}`).join("\n")}\n\n자세한 근거는 각 이슈 코멘트에 있습니다. 근거(이 PR이 추가한 줄)를 대조한 항목만 체크했습니다.`
    : `🤖 **이슈 진행 판정** — 후보 ${refs} 중 이 PR이 끝낸 항목은 없다고 판정했습니다. ([판정 세션](${url}))`,
);
console.log(summary.join("\n") || "반영 없음");
