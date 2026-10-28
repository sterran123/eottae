// 「어때?」 로컬 Grok 작업자 — 김민기 PC에서 돌며, Devin이 하던 AI 작업을 Grok CLI(구독 로그인)로 처리한다.
// 저장소 변수 AI_REVIEW_ENGINE=grok-local일 때 Actions는 Devin을 부르지 않고 대기 표시만 남긴다. 이 작업자가 찾는 것:
//   1. AI 리뷰 — head sha의 pending "로컬 Grok 리뷰 대기"(ai-review.yml) → PR head 체크아웃 → tools/ai_code_review.mjs
//      → 통과/수정 필요/오류 상태 + 코멘트. 머지 판단은 지금처럼 규칙 봇(pr_review_bot.mjs)이 한다.
//   2. 이슈 진행 — 머지된 PR의 대기 표시 코멘트(issue-progress.yml) → 머지 커밋 체크아웃 → tools/issue_progress.mjs
//   3. @grok — 팀원(write 권한 이상 협력자)이 이슈·PR 댓글에 쓴 `@grok 요청` → tools/grok_mention.mjs가 답 댓글 (Devin 멘션 대체)
// PC가 꺼져 있으면 기다린다 — AI 리뷰 게이트는 열리지 않는다(fail-closed).
//
// 사용 (전용 클론의 main에서 — 실행 스크립트는 이 클론의 것을 쓰고, 주기마다 origin/main으로 빨리감기한다):
//   tools\grok_worker_loop.cmd                   상시 실행(종료되면 다시 띄움 — 로그인 때 자동 시작에 등록)
//   node tools/grok_review_worker.mjs            5분마다 대기 작업 처리 (Ctrl+C로 종료)
//   node tools/grok_review_worker.mjs --once     한 번만 처리
//   node tools/grok_review_worker.mjs --pr 46    그 PR을 지금 리뷰 (대기 표시 없어도) · --force 같은 sha 재리뷰
//   DRY_RUN=2를 주면 Grok까지 실행하고 GitHub에는 쓰지 않는다.
// 필요: grok 로그인(grok login), GitHub 토큰(GITHUB_TOKEN 없으면 `gh auth token`).
// 선택: INTERVAL_MIN(기본 5), MAX_PER_CYCLE(기본 3), REVIEW_ROOT(worktree·기록 위치), GROK_MODEL
// 종료 코드: 3 로그인·사용량 문제, 4 잠금·클론 상태 문제, 0 작업자 코드 갱신(다시 띄우면 됨)
//
// 사용량 절약: 대기 표시가 있는 작업만 본다(처리하면 표시가 바뀌어 다시 잡히지 않는다),
// 한 번에 하나, 주기당 큐별 최대 MAX_PER_CYCLE건, 로그인·사용량 문제면 즉시 멈춘다(재시도 반복 없음).
// 실행 기록: REVIEW_ROOT/runs.jsonl (시각·작업·sha·결과·소요·토큰)
import { execFileSync, spawn } from "node:child_process";
import { appendFileSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = process.env.GITHUB_REPOSITORY || "sterran123/eottae";
const LOCAL_WAIT = "로컬 Grok 리뷰 대기"; // ai_code_review.mjs와 같은 문구
const REVIEWING = "로컬 Grok이 코드를 리뷰하는 중"; // ai_code_review.mjs가 리뷰 시작 때 남기는 문구
const INTERVAL_MIN = Number(process.env.INTERVAL_MIN || 5);
const MAX_PER_CYCLE = Number(process.env.MAX_PER_CYCLE || 3);
// 홈 밖에 둔다 — 엔진이 홈 디렉터리 전체를 읽기 금지로 막기 때문(grok_review_engine.mjs)
const REVIEW_ROOT =
  process.env.REVIEW_ROOT || (process.platform === "win32" ? "C:\\eottae-grok-review" : "/var/tmp/eottae-grok-review");
// 어떤 프로세스(gh·git·grok)를 띄우기 전에: Windows의 cmd·Node는 실행 파일을 현재 폴더에서 PATH보다 먼저 찾는다.
// 클론에는 팀원이 머지한 파일(node.cmd·git.bat 등)이 들어오므로, 현재 폴더 검색을 끄고 클론 밖으로 옮긴다.
// (스크립트·저장소 경로는 import.meta.url·git -C로 정하므로 현재 폴더와 무관하다)
process.env.NoDefaultCurrentDirectoryInExePath = "1";
mkdirSync(REVIEW_ROOT, { recursive: true });
process.chdir(REVIEW_ROOT);
// PR이 들고 온 에이전트 설정 — 신뢰 전이라 실행되지 않지만, 읽히지도 않게 지운다
// 이름 비교는 소문자로 — Windows에서는 .Grok·agents.md도 같은 파일로 열린다
const AGENT_CONFIG = new Set([".grok", ".claude", ".cursor", ".mcp.json"]);
// Grok이 규칙으로 자동 로드하는 파일 — PR이 바꾼 지시가 리뷰어 규칙이 되지 않게 이름만 바꾼다(내용은 읽을 수 있다)
const AUTO_RULES = new Set(["agents.md", "agent.md", "claude.md", "claude.local.md"]);
const RULES_SUFFIX = ".pr-content";
// 리뷰 도중 작업자가 죽어 "리뷰하는 중"으로 남은 상태는 이 시간이 지나면 다시 집는다
const STALE_MS = 40 * 60_000;
const BOT = "github-actions[bot]";

const argv = process.argv.slice(2);
const ONLY = argv.includes("--pr") ? Number(argv[argv.indexOf("--pr") + 1]) : null;
const FORCE = argv.includes("--force");
// 시험 모드는 상태를 안 바꿔 대기 표시가 남는다 — 반복하면 같은 PR을 주기마다 다시 리뷰하므로 한 번만 돈다
const ONCE = argv.includes("--once") || process.env.DRY_RUN === "2";

const ghToken = () => {
  for (const bin of ["gh", "C:\\Program Files\\GitHub CLI\\gh.exe"]) {
    try {
      return execFileSync(bin, ["auth", "token"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    } catch {}
  }
  throw new Error("GitHub 토큰 없음 — `gh auth login` 하거나 GITHUB_TOKEN 지정");
};
const token = process.env.GITHUB_TOKEN || ghToken();
const gh = async (path) => {
  const r = await fetch(`https://api.github.com/${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "eottae-grok-worker",
    },
    signal: AbortSignal.timeout(60_000), // 연결이 멈춰도 잠금을 쥔 채 서 있지 않게
  });
  if (!r.ok) throw new Error(`GitHub ${r.status} ${path}`);
  return r.json();
};
const git = (...args) =>
  execFileSync("git", ["-C", ROOT, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 5 * 60_000 });

// PR 트리 정리: 링크는 링크 자체만 지운다(따라가지 않는다 — `링크/.grok`을 지우면 실제 ~/.grok이 지워지고,
// 남겨 두면 리뷰어가 링크를 통해 홈 파일을 읽는다). 에이전트 설정은 지우고, 자동 로드 규칙 파일은 이름을 바꾼다.
const sanitize = (dir) => {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === ".git") continue;
    const p = join(dir, ent.name);
    const name = ent.name.toLowerCase();
    if (ent.isSymbolicLink()) unlinkSync(p);
    else if (AGENT_CONFIG.has(name)) rmSync(p, { recursive: true, force: true });
    else if (ent.isFile() && AUTO_RULES.has(name)) {
      rmSync(p + RULES_SUFFIX, { force: true }); // 같은 이름이 이미 있으면 Windows rename이 실패한다
      renameSync(p, p + RULES_SUFFIX);
    } else if (ent.isDirectory()) sanitize(p);
  }
};

// 리뷰할 PR: 같은 저장소 브랜치의 열린 PR(draft·포크 제외) 중, head sha의 최신 ai-review 상태가
//   - 우리 워크플로(github-actions[bot])가 남긴 "로컬 Grok 리뷰 대기" — 협력자가 직접 단 대기 표시로 소유자 구독을 쓰지 못하게
//   - 또는 이 작업자가 남긴 "리뷰하는 중"이 STALE_MS 넘게 그대로인 것(작업자가 도중에 죽은 경우)
const OWNER = REPO.split("/")[0];
async function waitingReviews() {
  if (ONLY) {
    // 수동 실행 — draft도 리뷰한다. 포크 PR은 소유자 구독·PC로 돌리지 않는다
    const pr = await gh(`repos/${REPO}/pulls/${ONLY}`);
    if (pr.head.repo?.full_name !== REPO) throw new Error(`PR #${ONLY}은 포크에서 온 PR — 로컬 리뷰 대상 아님`);
    return [{ pr, force: FORCE }];
  }
  const out = [];
  for (let page = 1; page <= 5; page++) {
    const prs = await gh(`repos/${REPO}/pulls?state=open&base=main&per_page=100&page=${page}`);
    for (const pr of prs) {
      if (pr.draft || pr.head.repo?.full_name !== REPO) continue;
      // 규칙 봇의 머지 게이트와 같이 봇·소유자 상태만 본다 — 협력자 상태가 대기 표시를 가리지 못하게
      const st = (await gh(`repos/${REPO}/commits/${pr.head.sha}/statuses?per_page=100`)).find(
        (s) => s.context === "ai-review" && (s.creator?.login === BOT || s.creator?.login === OWNER),
      );
      if (st?.state !== "pending") continue;
      const queued = st.creator?.login === BOT && st.description?.startsWith(LOCAL_WAIT);
      const stale =
        st.creator?.login === OWNER &&
        st.description?.startsWith(REVIEWING) &&
        Date.now() - Date.parse(st.updated_at) > STALE_MS;
      if (queued || stale) out.push({ pr, force: stale || st.description.includes("(재실행)") });
    }
    if (prs.length < 100) break;
  }
  return out.slice(0, MAX_PER_CYCLE);
}

// 이슈 진행 판정 대기: 최근 머지된 PR 중, 봇이 남긴 대기 표시(issue_progress.mjs의 WAIT) 뒤에
// 봇·소유자의 판정(MARK)이나 안내(NOTE) 코멘트가 아직 없는 것 — 실패 안내가 달리면 다시 집지 않는다(재시도 반복 없음)
async function waitingProgress() {
  if (ONLY) return [];
  const out = [];
  const recent = Date.now() - 7 * 24 * 3600_000;
  for (const pr of await gh(`repos/${REPO}/pulls?state=closed&base=main&sort=updated&direction=desc&per_page=30`)) {
    if (!pr.merged_at || Date.parse(pr.merged_at) < recent) continue;
    const comments = await gh(`repos/${REPO}/issues/${pr.number}/comments?per_page=100`);
    const trusted = (c) => c.user?.login === BOT || c.user?.login === OWNER;
    // 가장 최근 대기 표시 기준 — 재판정(Run workflow force)은 새 표시를 남기고, " force"가 붙어 있으면 FORCE로 넘긴다
    const waitRe = new RegExp(`<!-- issue-progress-wait:pr${pr.number}( force)? -->`);
    const wait = comments.filter((c) => c.user?.login === BOT && waitRe.test(String(c.body))).at(-1);
    if (!wait) continue;
    const done = comments.some(
      (c) =>
        trusted(c) &&
        c.created_at >= wait.created_at &&
        (String(c.body).includes(`<!-- issue-progress:pr${pr.number} -->`) ||
          String(c.body).includes(`<!-- issue-progress-note:pr${pr.number} -->`)),
    );
    if (!done) out.push({ pr, force: String(wait.body).match(waitRe)?.[1] === " force" });
  }
  return out.slice(0, MAX_PER_CYCLE);
}

// @grok 요청: 처음 실행한 뒤 팀원이 단 이슈·PR 댓글 중 `@grok`이 들어 있고 아직 답(<!-- grok-answer:id -->)이 없는 것.
// 처음 실행 전의 옛 댓글에는 답하지 않는다(state.json의 mentionsSince).
// 팀원 = 저장소 write 권한 이상 협력자(소유자 포함) — 공개 저장소라 아무나 댓글을 달 수 있어 그 밖은 무시한다.
// 권한은 GitHub에 묻는다(팀원이 바뀌어도 코드 수정 없음). 외부인은 공개 저장소라 "read"로 나온다.
// grok_mention.mjs도 같은 검사를 한 번 더 한다(이 파일은 import하면 작업자가 돌기 시작해 함수를 나누지 않는다)
const TEAM_ROLES = new Set(["admin", "maintain", "write"]);
async function isTeam(user) {
  if (!user?.login || user.type === "Bot") return false;
  let p;
  try {
    p = await gh(`repos/${REPO}/collaborators/${encodeURIComponent(user.login)}/permission`);
  } catch (e) {
    // 없는 계정(404)만 팀원 아님. 그 밖의 실패는 던져 이번 주기 조회를 멈춘다 — "팀원 아님"으로 넘기면
    // 조회 시작점이 그 요청 뒤로 옮겨져 다시 집히지 않는다(던지면 시작점을 저장하기 전에 끝난다)
    if (/^GitHub 404 /.test(e.message)) return false;
    throw e;
  }
  return TEAM_ROLES.has(p?.permission) || TEAM_ROLES.has(p?.role_name);
}
const STATE = join(REVIEW_ROOT, "state.json");
const loadState = () => {
  try {
    return JSON.parse(readFileSync(STATE, "utf8"));
  } catch {
    return {};
  }
};
async function waitingMentions() {
  if (ONLY) return [];
  const state = loadState();
  if (!state.mentionsSince) {
    state.mentionsSince = new Date().toISOString();
    writeFileSync(STATE, JSON.stringify(state));
    return [];
  }
  // 봇 댓글이 많아 한 페이지(100개)로는 모자란다 — 끝까지 넘기고(최대 1000개), 조회 시작점은 아래에서 앞으로 옮긴다.
  // 7일보다 오래된 요청은 보지 않는다(작업자가 오래 꺼져 있었을 때 옛 요청에 몰아서 답하지 않게)
  const since = new Date(Math.max(Date.parse(state.mentionsSince), Date.now() - 7 * 24 * 3600_000)).toISOString();
  const recentComments = [];
  for (let page = 1; page <= 10; page++) {
    const items = await gh(
      `repos/${REPO}/issues/comments?since=${encodeURIComponent(since)}&sort=created&direction=asc&per_page=100&page=${page}`,
    );
    recentComments.push(...items);
    if (items.length < 100) break;
  }
  const answered = new Set(
    recentComments.flatMap((c) => [...String(c.body).matchAll(/<!-- grok-answer:(\d+) -->/g)].map((m) => m[1])),
  );
  const asks = recentComments.filter(
    (c) =>
      /(^|\s)@grok\b/i.test(String(c.body)) &&
      !String(c.body).includes("<!-- grok-answer:") && // 작업자 자신의 답 댓글
      !answered.has(String(c.id)),
  );
  // 권한 조회는 @grok 댓글 작성자만, 한 번씩
  const team = new Map();
  for (const c of asks) if (!team.has(c.user?.login)) team.set(c.user?.login, await isTeam(c.user));
  const pending = asks.filter((c) => team.get(c.user?.login));
  // 시작점 이동: 남은 요청이 있으면 가장 오래된 요청 시각(그 답도 범위 안에 들어온다), 없으면 마지막으로 본 댓글 시각
  const last = recentComments.at(-1)?.created_at;
  const next = pending[0]?.created_at ?? last;
  if (next && next > state.mentionsSince) writeFileSync(STATE, JSON.stringify({ ...state, mentionsSince: next }));
  return pending
    .slice(0, MAX_PER_CYCLE)
    .map((c) => ({ comment: c, number: Number(String(c.issue_url).split("/").pop()) }));
}

const removeWorktree = (wt) => {
  try {
    git("worktree", "remove", "--force", wt);
  } catch {
    rmSync(wt, { recursive: true, force: true });
  }
};

// 공통 실행: 대상 커밋을 홈 밖 worktree에 체크아웃·정리 → 스크립트 실행 → worktree 삭제·기록
async function runIn({ label, fetchRef, sha, script, env }) {
  const wt = join(REVIEW_ROOT, `${label}-${sha.slice(0, 7)}`);
  // 준비 단계 실패(fetch·체크아웃·정리)는 이 작업만 건너뛴다 — 작업자 전체가 같은 작업에서 반복해 죽지 않게
  try {
    git("fetch", "--quiet", "origin", fetchRef);
    rmSync(wt, { recursive: true, force: true });
    git("worktree", "prune");
    git("worktree", "add", "--quiet", "--detach", wt, sha);
    sanitize(wt);
  } catch (e) {
    console.error(`${label} 준비 실패 — 건너뜀: ${e.message.split("\n")[0]}`);
    removeWorktree(wt);
    return 1;
  }
  const started = Date.now();
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [join(ROOT, "tools", script)], {
      env: { ...process.env, AI_ENGINE: "grok", GITHUB_REPOSITORY: REPO, GITHUB_TOKEN: token, REVIEW_CWD: wt, ...env },
      stdio: ["ignore", "pipe", "inherit"],
    });
    let out = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (d) => {
      out += d;
      process.stdout.write(d);
    });
    child.on("close", (code) => {
      removeWorktree(wt);
      const rec = {
        at: new Date().toISOString(),
        job: label,
        sha: sha.slice(0, 10),
        exit: code,
        sec: Math.round((Date.now() - started) / 1000),
        grok: out.match(/^grok: (.*)$/m)?.[1] ?? null,
        verdict: out.match(/^verdict: (\w+)/m)?.[1] ?? null,
      };
      appendFileSync(join(REVIEW_ROOT, "runs.jsonl"), JSON.stringify(rec) + "\n");
      resolve(code);
    });
  });
}

const review = ({ pr, force }) =>
  runIn({
    label: `pr-${pr.number}`,
    fetchRef: `pull/${pr.number}/head`,
    sha: pr.head.sha,
    script: "ai_code_review.mjs",
    env: { PR_NUMBER: String(pr.number), FORCE: force ? "1" : "" },
  });
const progress = ({ pr, force }) =>
  runIn({
    label: `progress-${pr.number}`,
    fetchRef: "main",
    sha: pr.merge_commit_sha,
    script: "issue_progress.mjs",
    env: { PR_NUMBER: String(pr.number), FORCE: force ? "1" : "" },
  });
const mention = async ({ comment, number }) => {
  const issue = await gh(`repos/${REPO}/issues/${number}`);
  const pr = issue.pull_request ? await gh(`repos/${REPO}/pulls/${number}`) : null;
  // 포크 PR 스레드는 main 기준으로 답한다(포크 코드를 소유자 PC로 가져오지 않는다)
  const own = pr && pr.head.repo?.full_name === REPO;
  return runIn({
    label: `mention-${comment.id}`,
    fetchRef: own ? `pull/${number}/head` : "main",
    sha: own ? pr.head.sha : git("rev-parse", "origin/main").trim(),
    script: "grok_mention.mjs",
    env: { COMMENT_ID: String(comment.id) },
  });
};

// 리뷰 스크립트는 이 클론의 것을 소유자 쓰기 토큰으로 실행한다 — 리뷰를 거쳐 머지된 main 코드일 때만 돈다.
// 전용 클론(main, 깨끗한 상태)이면 origin/main으로 빨리감기해 최신을 따른다. 작업자 파일이 바뀌면 끝내서
// 감싸는 스크립트(tools/grok_worker_loop.cmd)가 새 코드로 다시 띄우게 한다.
const SELF = "tools/grok_review_worker.mjs";
function followMain() {
  git("fetch", "--quiet", "origin", "main");
  const here = git("rev-parse", "HEAD").trim();
  const main = git("rev-parse", "origin/main").trim();
  if (here === main) return;
  const branch = git("rev-parse", "--abbrev-ref", "HEAD").trim();
  const dirty = git("status", "--porcelain", "--untracked-files=no").trim();
  let ancestor = true;
  try {
    git("merge-base", "--is-ancestor", here, main);
  } catch {
    ancestor = false;
  }
  if (branch !== "main" || dirty || !ancestor) {
    console.error(
      `작업자 클론이 origin/main(${main.slice(0, 7)})을 따라갈 수 없음(브랜치 ${branch}, 현재 ${here.slice(0, 7)}` +
        `${dirty ? ", 수정 있음" : ""}${ancestor ? "" : ", 갈라짐"}) — 전용 클론(main)에서 실행하세요. (시험은 DRY_RUN=2)`,
    );
    process.exit(4);
  }
  const selfChanged = git("diff", "--name-only", here, main, "--", SELF).trim();
  git("merge", "--quiet", "--ff-only", "origin/main");
  console.log(`origin/main(${main.slice(0, 7)})으로 갱신`);
  if (selfChanged) {
    console.log("작업자 코드가 바뀜 — 다시 시작합니다");
    process.exit(0);
  }
}
if (process.env.DRY_RUN !== "2") followMain();

mkdirSync(REVIEW_ROOT, { recursive: true });
// 작업자는 하나만 — 둘이 같은 대기 PR을 집으면 Grok이 두 번 돈다
const LOCK = join(REVIEW_ROOT, "worker.lock");
const alive = (pid) => {
  try {
    process.kill(pid, 0); // 신호 0 — 프로세스가 있는지만 본다
    return true;
  } catch (e) {
    return e.code === "EPERM"; // 권한이 없을 뿐 프로세스는 있다
  }
};
// "wx"(없을 때만 생성)로 잡는다 — 읽고 나서 쓰면 동시에 띄운 두 작업자가 모두 통과한다.
// 이미 있는데 주인이 죽었으면 지우고 한 번 더 시도한다.
const takeLock = () => {
  try {
    writeFileSync(LOCK, String(process.pid), { flag: "wx" });
    return true;
  } catch (e) {
    if (e.code !== "EEXIST") throw e;
    return false;
  }
};
if (!takeLock()) {
  let held = 0;
  try {
    held = Number(readFileSync(LOCK, "utf8")) || 0;
  } catch {}
  if (held && alive(held)) {
    console.error(`다른 작업자(pid ${held})가 실행 중 — 종료합니다`);
    process.exit(4);
  }
  rmSync(LOCK, { force: true });
  if (!takeLock()) {
    console.error("작업자 잠금을 잡지 못함(동시에 시작됨) — 종료합니다");
    process.exit(4);
  }
}
const unlock = () => rmSync(LOCK, { force: true });
process.on("exit", unlock);
process.on("SIGINT", () => process.exit(130));

const QUEUES = [
  { name: "AI 리뷰", find: waitingReviews, run: review, show: (j) => `PR #${j.pr.number} @ ${j.pr.head.sha.slice(0, 7)}${j.force ? " (재리뷰)" : ""}` },
  { name: "이슈 진행", find: waitingProgress, run: progress, show: (j) => `PR #${j.pr.number} 머지 ${j.pr.merge_commit_sha.slice(0, 7)}` },
  { name: "@grok", find: waitingMentions, run: mention, show: (j) => `#${j.number} 댓글 ${j.comment.id}` },
];
for (;;) {
  for (const q of QUEUES) {
    let jobs = [];
    try {
      jobs = await q.find();
    } catch (e) {
      console.error(`${q.name} 대기 조회 실패 — 다음 주기에 다시: ${e.message}`);
    }
    for (const job of jobs) {
      console.log(`▶ ${q.name}: ${q.show(job)}`);
      const code = await q.run(job);
      if (code === 3) {
        console.error("Grok 로그인·사용량 문제 — 작업자를 멈춥니다. `grok login` 또는 사용량을 확인한 뒤 다시 실행하세요.");
        process.exit(3);
      }
    }
  }
  if (ONCE || ONLY) break;
  await new Promise((r) => setTimeout(r, INTERVAL_MIN * 60_000));
  if (process.env.DRY_RUN !== "2") {
    try {
      followMain();
    } catch (e) {
      console.error(`main 갱신 실패 — 다음 주기에 다시: ${e.message.split("\n")[0]}`);
    }
  }
}
