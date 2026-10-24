#!/usr/bin/env node
// origin/main 기준 로컬 동기화 — fetch 후 뒤처졌고 작업트리가 깨끗하면 --ff-only만.
// Devin SessionStart 훅 + Windows 작업 스케줄러 공용. stdout은 hook용 JSON 1줄.
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const git = (args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
const say = (msg) =>
  console.log(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: `[repo-sync] ${msg}` },
    }),
  );

try {
  git(["fetch", "origin", "--prune"]);
  const branch = git(["rev-parse", "--abbrev-ref", "HEAD"]);
  const behind = Number(git(["rev-list", "--count", "HEAD..origin/main"])) || 0;
  const ahead = Number(git(["rev-list", "--count", "origin/main..HEAD"])) || 0;
  const dirty = git(["status", "--porcelain", "--untracked-files=no"]) !== "";

  if (branch !== "main") {
    say(`현재 브랜치 '${branch}' — main은 origin 대비 ahead ${ahead}/behind ${behind}. pull은 건너뜀`);
  } else if (behind === 0 && ahead === 0) {
    say("origin/main과 동일 — 최신 상태");
  } else if (ahead > 0) {
    say(`로컬 main이 origin 대비 ahead ${ahead}/behind ${behind} — 분기 상태라 pull 건너뜀 (push/rebase 필요)`);
  } else if (dirty) {
    say(`origin/main보다 ${behind}커밋 뒤처짐 — 미커밋 변경이 있어 pull 건너뜀. 커밋/스태시 후 'git pull --ff-only'`);
  } else {
    git(["merge", "--ff-only", "origin/main"]);
    say(`origin/main에서 ${behind}커밋 fast-forward 완료 — 로컬 최신화됨`);
  }
} catch (e) {
  say(`동기화 확인 실패: ${String(e?.message || e).split("\n")[0]}`);
}
