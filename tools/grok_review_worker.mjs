// 「어때?」 로컬 Grok 리뷰 작업자 — 김민기 PC에서 돌며, Actions가 "로컬 Grok 리뷰 대기"로 남긴 PR을
// Grok CLI(구독 로그인)로 리뷰해 기존과 같은 `ai-review` 상태·코멘트를 남긴다.
//
// 흐름: ai-review.yml(저장소 변수 AI_REVIEW_ENGINE=grok-local) → head sha에 pending "로컬 Grok 리뷰 대기"
//   → 이 작업자가 주기적으로 찾아 PR head를 별도 worktree에 체크아웃 → tools/ai_code_review.mjs(AI_ENGINE=grok)
//   → 통과/수정 필요/오류 상태 + 코멘트. 머지 판단은 지금처럼 규칙 봇(pr_review_bot.mjs)이 한다.
// PC가 꺼져 있으면 PR은 pending으로 기다린다(게이트가 열리지 않는다 — fail-closed).
//
// 사용 (저장소 루트, main 최신 상태에서 — 리뷰 스크립트는 이 체크아웃의 것을 쓴다):
//   node tools/grok_review_worker.mjs            5분마다 대기 PR 처리 (Ctrl+C로 종료)
//   node tools/grok_review_worker.mjs --once     한 번만 처리
//   node tools/grok_review_worker.mjs --pr 46    그 PR을 지금 리뷰 (대기 표시 없어도) · --force 같은 sha 재리뷰
//   DRY_RUN=2를 주면 Grok까지 실행하고 GitHub에는 쓰지 않는다.
// 필요: grok 로그인(grok login), GitHub 토큰(GITHUB_TOKEN 없으면 `gh auth token`).
// 선택: INTERVAL_MIN(기본 5), MAX_PER_CYCLE(기본 3), REVIEW_ROOT(worktree·기록 위치), GROK_MODEL
//
// 사용량 절약: 대기 표시가 있는 PR만 본다(같은 sha는 리뷰 후 상태가 바뀌어 다시 잡히지 않는다),
// 한 번에 한 PR, 주기당 최대 MAX_PER_CYCLE건, 로그인·사용량 문제면 즉시 멈춘다(재시도 반복 없음).
// 실행 기록: REVIEW_ROOT/runs.jsonl (시각·PR·sha·결과·소요·토큰)
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
async function waiting() {
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

const removeWorktree = (wt) => {
  try {
    git("worktree", "remove", "--force", wt);
  } catch {
    rmSync(wt, { recursive: true, force: true });
  }
};

async function review({ pr, force }) {
  const sha = pr.head.sha;
  const wt = join(REVIEW_ROOT, `pr-${pr.number}-${sha.slice(0, 7)}`);
  // 준비 단계 실패(fetch·체크아웃·정리)는 이 PR만 건너뛴다 — 작업자 전체가 같은 PR에서 반복해 죽지 않게
  try {
    git("fetch", "--quiet", "origin", `pull/${pr.number}/head`);
    rmSync(wt, { recursive: true, force: true });
    git("worktree", "prune");
    git("worktree", "add", "--quiet", "--detach", wt, sha);
    sanitize(wt);
  } catch (e) {
    console.error(`PR #${pr.number} 준비 실패 — 건너뜀: ${e.message.split("\n")[0]}`);
    removeWorktree(wt);
    return 1;
  }
  const started = Date.now();
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [join(ROOT, "tools", "ai_code_review.mjs")], {
      env: {
        ...process.env,
        AI_ENGINE: "grok",
        GITHUB_REPOSITORY: REPO,
        GITHUB_TOKEN: token,
        PR_NUMBER: String(pr.number),
        REVIEW_CWD: wt,
        FORCE: force ? "1" : "",
      },
      stdio: ["ignore", "pipe", "inherit"],
    });
    let out = "";
    child.stdout.on("data", (d) => {
      out += d;
      process.stdout.write(d);
    });
    child.on("close", (code) => {
      removeWorktree(wt);
      const rec = {
        at: new Date().toISOString(),
        pr: pr.number,
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

mkdirSync(REVIEW_ROOT, { recursive: true });
// 작업자는 하나만 — 둘이 같은 대기 PR을 집으면 Grok이 두 번 돈다
const LOCK = join(REVIEW_ROOT, "worker.lock");
const alive = (pid) => {
  try {
    process.kill(pid, 0); // 신호 0 — 프로세스가 있는지만 본다
    return true;
  } catch {
    return false;
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
for (;;) {
  let jobs = [];
  try {
    jobs = await waiting();
  } catch (e) {
    console.error(`PR 조회 실패 — 다음 주기에 다시: ${e.message}`);
  }
  for (const job of jobs) {
    console.log(`▶ PR #${job.pr.number} @ ${job.pr.head.sha.slice(0, 7)}${job.force ? " (재리뷰)" : ""}`);
    const code = await review(job);
    if (code === 3) {
      console.error("Grok 로그인·사용량 문제 — 작업자를 멈춥니다. `grok login` 또는 사용량을 확인한 뒤 다시 실행하세요.");
      process.exit(3);
    }
  }
  if (ONCE || ONLY) break;
  await new Promise((r) => setTimeout(r, INTERVAL_MIN * 60_000));
}
