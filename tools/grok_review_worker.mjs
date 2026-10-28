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
import { appendFileSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = process.env.GITHUB_REPOSITORY || "sterran123/eottae";
const LOCAL_WAIT = "로컬 Grok 리뷰 대기"; // ai_code_review.mjs와 같은 문구
const INTERVAL_MIN = Number(process.env.INTERVAL_MIN || 5);
const MAX_PER_CYCLE = Number(process.env.MAX_PER_CYCLE || 3);
const REVIEW_ROOT = process.env.REVIEW_ROOT || join(process.env.LOCALAPPDATA || homedir(), "eottae-grok-review");
// PR이 들고 온 에이전트 설정 — 신뢰 전이라 실행되지 않지만, 읽히지도 않게 지운다
const AGENT_CONFIG = new Set([".grok", ".claude", ".cursor", ".mcp.json"]);

const argv = process.argv.slice(2);
const ONCE = argv.includes("--once");
const ONLY = argv.includes("--pr") ? Number(argv[argv.indexOf("--pr") + 1]) : null;
const FORCE = argv.includes("--force");

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
  });
  if (!r.ok) throw new Error(`GitHub ${r.status} ${path}`);
  return r.json();
};
const git = (...args) => execFileSync("git", ["-C", ROOT, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

const removeAgentConfig = (dir) => {
  for (const name of readdirSync(dir)) {
    if (name === ".git") continue;
    const p = join(dir, name);
    if (AGENT_CONFIG.has(name)) rmSync(p, { recursive: true, force: true });
    else if (statSync(p).isDirectory()) removeAgentConfig(p);
  }
};

// 리뷰할 PR: 열린 PR 중 head sha의 최신 ai-review 상태가 "로컬 Grok 리뷰 대기"인 것 (draft 제외)
async function waiting() {
  if (ONLY) {
    const pr = await gh(`repos/${REPO}/pulls/${ONLY}`);
    return [{ pr, force: FORCE }];
  }
  const out = [];
  for (const pr of await gh(`repos/${REPO}/pulls?state=open&base=main&per_page=100`)) {
    if (pr.draft) continue;
    const st = (await gh(`repos/${REPO}/commits/${pr.head.sha}/statuses?per_page=100`)).find((s) => s.context === "ai-review");
    if (st?.state === "pending" && st.description?.startsWith(LOCAL_WAIT)) {
      out.push({ pr, force: st.description.includes("(재실행)") });
    }
  }
  return out.slice(0, MAX_PER_CYCLE);
}

function review({ pr, force }) {
  const sha = pr.head.sha;
  const wt = join(REVIEW_ROOT, `pr-${pr.number}-${sha.slice(0, 7)}`);
  git("fetch", "--quiet", "origin", `pull/${pr.number}/head`);
  rmSync(wt, { recursive: true, force: true });
  git("worktree", "prune");
  git("worktree", "add", "--quiet", "--detach", wt, sha);
  removeAgentConfig(wt);
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
      try {
        git("worktree", "remove", "--force", wt);
      } catch {
        rmSync(wt, { recursive: true, force: true });
      }
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
