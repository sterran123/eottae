// 「어때?」 이슈 진행 동기화 — 머지된 PR이 어느 이슈의 어느 체크 항목을 끝냈는지 판정해
// 체크박스를 체크하고, 이슈의 모든 항목이 체크되면 이슈를 닫는다.
// PR 본문에 Closes/Refs가 없어도 작성자 담당 이슈·요구사항 ID로 후보를 찾는다.
//
// 엄격 판정 (AI 말만 믿지 않는다 — 셋 다 통과한 항목만 체크):
//   1. 게이트: PR head에 AI 코드 리뷰(`ai-review`) 통과 또는 작성자 외 사람 Approve가 있어야 한다
//   2. Devin 판정: 항목별 done / partial / not_done / needs_human. 일부만·애매·사람 확인 필요는 done 아님
//   3. 근거 기계 검증: done 항목은 근거(파일·줄·인용)가 필요하고, 인용은 **이 PR이 추가한 줄**에
//      있어야 하며 **머지 커밋의 해당 파일**에도 그대로 있어야 한다 — 하나라도 어긋나면 체크하지 않는다
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
const REQ_ID = /\b[A-Z]{2,6}-\d{3}\b/g;
// 체크박스 줄: "- [ ] 내용" / "* [x] 내용"
const BOX = /^(\s*[-*+]\s+\[)([ xX])(\]\s+)(.*)$/;

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

// 본문의 체크박스 목록 — id는 본문 안에서 몇 번째 체크박스인지(1부터)
const boxes = (body) => {
  const out = [];
  String(body || "")
    .split("\n")
    .forEach((line, i) => {
      const m = line.replace(/\r$/, "").match(BOX);
      if (m) out.push({ id: out.length + 1, lineNo: i, checked: m[2] !== " ", text: m[4].trim() });
    });
  return out;
};
const allChecked = (body) => {
  const b = boxes(body);
  return b.length > 0 && b.every((x) => x.checked);
};

const closeIssue = async (n, body) => {
  await write(`repos/${REPO}/issues/${n}/comments`, { method: "POST", body: { body } }, `comment #${n}`);
  await write(`repos/${REPO}/issues/${n}`, { method: "PATCH", body: { state: "closed", state_reason: "completed" } }, `close #${n}`);
  console.log(`#${n} 닫음`);
};

// ── 모드 2: 사람이 이슈 본문을 고쳤을 때 — 마지막 체크박스까지 체크했으면 닫는다 ──
if (ISSUE_NUMBER && !PR_NUMBER) {
  const issue = await gh(`repos/${REPO}/issues/${ISSUE_NUMBER}`);
  if (issue.pull_request || issue.state !== "open" || !allChecked(issue.body)) {
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
const mergeSha = pr.merge_commit_sha;
const MARK = `<!-- issue-progress:pr${PR_NUMBER} -->`;
const prComments = await ghAll(`repos/${REPO}/issues/${PR_NUMBER}/comments`);
if (!FORCE && prComments.some((c) => c.user?.login === BOT && String(c.body).includes(MARK))) {
  console.log(`PR #${PR_NUMBER}: 이미 처리함 — 생략 (FORCE=1로 재실행)`);
  process.exit(0);
}

// 후보 이슈 — 명시 키워드 > 작성자 담당 > 요구사항 ID 일치. 체크박스가 있는 이슈만
const text = `${pr.title}\n${pr.head.ref}\n${pr.body || ""}`;
const explicit = new Set([...String(pr.body || "").matchAll(LINKS)].map((m) => Number(m[3])));
const ids = new Set(text.match(REQ_ID) || []);
const open = (await ghAll(`repos/${REPO}/issues?state=open`)).filter((i) => !i.pull_request);
const pool = new Map(open.map((i) => [i.number, i]));
for (const n of explicit) {
  if (!pool.has(n)) {
    const i = await gh(`repos/${REPO}/issues/${n}`).catch(() => null);
    if (i && !i.pull_request) pool.set(n, i); // Closes로 방금 닫힌 이슈도 체크 대상
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

const prComment = async (body) => {
  await write(`repos/${REPO}/issues/${PR_NUMBER}/comments`, { method: "POST", body: { body: `${MARK}\n${body}` } }, `comment PR #${PR_NUMBER}`);
};

// 게이트 — 코드가 맞는지 확인된 PR만 이슈를 진행시킨다
const statuses = await ghAll(`repos/${REPO}/commits/${pr.head.sha}/statuses`).catch(() => []);
const aiOk = statuses.find((s) => s.context === "ai-review")?.state === "success"; // 최신순
const reviews = await ghAll(`repos/${REPO}/pulls/${PR_NUMBER}/reviews`);
const humanOk = reviews.some(
  (r) => r.state === "APPROVED" && r.user?.type !== "Bot" && r.user?.login !== pr.user.login,
);
const refs = candidates.map((i) => `#${i.number}`).join(" ");
if (!aiOk && !humanOk) {
  await prComment(
    `🤖 **이슈 진행 판정 생략** — 관련 이슈로 보이는 ${refs}의 체크 항목을 자동으로 체크하지 않았습니다.\n\n` +
      `AI 코드 리뷰 통과나 작성자 외 사람 승인이 없는 PR은 "끝났다"고 인정하지 않습니다. 끝낸 항목은 이슈에서 직접 체크해 주세요 — 모두 체크되면 이슈가 자동으로 닫힙니다.`,
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

// 이슈 본문에 체크박스 id를 붙여 넘긴다 — 판정은 id로 받는다
const annotated = (body) => {
  let k = 0;
  return String(body || "")
    .split("\n")
    .map((l) => (BOX.test(l.replace(/\r$/, "")) ? `[id=${++k}] ${l}` : l))
    .join("\n");
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
  "- done 항목의 `evidence`는 **이 PR이 추가하거나 바꾼 줄**을 그대로 인용한다(quote는 한 줄의 일부, 8자 이상, 공백 외 수정 금지). file은 저장소 루트 기준 전체 경로, line은 머지 커밋 기준 줄 번호. 근거는 기계로 다시 대조해서 맞지 않으면 체크하지 않는다.",
  "",
  "## 출력 형식 (마지막 메시지 하나로 끝낸다. 질문하지 않는다. 쓰기 작업 금지 — 응답 전용)",
  "```json",
  '{"issues":[{"number":20,"related":true,"items":[{"id":4,"status":"done","why":"한 줄 이유","evidence":[{"file":"0. 소스코드/eottae-web/src/app/match/match-recommend.css","line":120,"quote":"min-height: 44px;"}]}]}]}',
  "```",
  `JSON 코드블록 뒤 마지막 줄에 정확히 \`${END}\``,
  truncated ? "\n※ diff가 길어 일부 파일은 생략됐다 — 머지 커밋에서 직접 읽어라." : "",
  "",
  `## PR 설명\n${(pr.body || "(없음)").slice(0, 3000)}`,
  "",
  ...candidates.flatMap((i) => [`## 이슈 #${i.number} ${i.title} (후보 사유: ${why.get(i.number).join(", ")})`, annotated(i.body).slice(0, 6000), ""]),
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
    if (it.status === "partial" || it.status === "not_done") partial.push({ box, why: it.why });
    else if (it.status === "needs_human") human.push({ box, why: it.why });
    else if (it.status === "done") {
      const evs = Array.isArray(it.evidence) ? it.evidence : [];
      const checks = await Promise.all(evs.map(verify));
      const bad = checks.find((c) => !c.ok);
      if (!evs.length || bad) rejected.push({ box, why: it.why, fail: bad?.why || "근거 없음" });
      else verified.push({ box, why: it.why, links: checks.map((c) => blob(c.file, c.line)) });
    }
  }
  if (!verified.length && !rejected.length && !partial.length && !human.length) continue;

  // 체크 — 판정 사이에 사람이 본문을 고쳤을 수 있으니 최신 본문에서 같은 문구의 줄을 찾아 바꾼다
  let fresh = await gh(`repos/${REPO}/issues/${issue.number}`);
  if (verified.length) {
    const lines = String(fresh.body || "").split("\n");
    let changed = 0;
    for (const v of verified) {
      const cur = boxes(fresh.body);
      const target = cur.find((b) => b.id === v.box.id && b.text === v.box.text) ?? cur.find((b) => b.text === v.box.text);
      if (!target || target.checked) continue;
      // 웹 편집기로 쓴 본문은 CRLF — \r을 떼고 바꾼 뒤 되붙인다(정규식 .은 \r에 안 맞는다)
      const cr = lines[target.lineNo].endsWith("\r") ? "\r" : "";
      lines[target.lineNo] = lines[target.lineNo].replace(/\r$/, "").replace(BOX, "$1x$3$4") + cr;
      changed++;
    }
    if (changed) {
      const body = lines.join("\n");
      await write(`repos/${REPO}/issues/${issue.number}`, { method: "PATCH", body: { body } }, `check ${changed} in #${issue.number}`);
      fresh = { ...fresh, body };
    }
  }
  const after = boxes(fresh.body);
  const left = after.filter((b) => !b.checked);
  const line = (x) => `- ${x.box.text.slice(0, 120)}${x.why ? ` — ${x.why}` : ""}`;
  const sections = [
    verified.length && `**✅ 체크함 (${verified.length})** — 근거 대조 통과\n` + verified.map((v) => `${line(v)} · ${v.links.join(" ")}`).join("\n"),
    rejected.length && `**🔎 AI는 완료로 봤지만 근거 대조 실패 → 체크 안 함 (${rejected.length})**\n` + rejected.map((v) => `${line(v)} · _${v.fail}_`).join("\n"),
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
    summary.push(`#${issue.number} — ${verified.length}개 체크 · **모든 항목 완료로 닫음**`);
  } else {
    const tail =
      fresh.state === "closed" && left.length
        ? `\n\n⚠️ ${assignees} 이 이슈는 \`Closes\` 키워드로 닫혔지만 **남은 항목이 ${left.length}개** 있습니다. 끝나지 않았다면 Reopen해 주세요 — 다음부터는 일부만 끝낸 PR에 \`Refs #${issue.number}\`를 쓰면 이슈가 열린 채로 연결됩니다.`
        : `\n\n남은 항목 ${left.length}/${after.length}개 — 모두 체크되면 자동으로 닫힙니다.`;
    await write(`repos/${REPO}/issues/${issue.number}/comments`, { method: "POST", body: { body: head + sections.join("\n\n") + tail } }, `comment #${issue.number}`);
    summary.push(`#${issue.number} — ${verified.length}개 체크 · 남은 항목 ${left.length}개`);
  }
}

await prComment(
  summary.length
    ? `🤖 **이슈 진행 반영** ([판정 세션](${url}))\n\n${summary.map((s) => `- ${s}`).join("\n")}\n\n자세한 근거는 각 이슈 코멘트에 있습니다. 근거(이 PR이 추가한 줄)를 대조한 항목만 체크했습니다.`
    : `🤖 **이슈 진행 판정** — 후보 ${refs} 중 이 PR이 끝낸 항목은 없다고 판정했습니다. ([판정 세션](${url}))`,
);
console.log(summary.join("\n") || "반영 없음");
