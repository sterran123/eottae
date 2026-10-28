// 「어때?」 로컬 Grok 리뷰 엔진 — Grok CLI 헤드리스 실행(구독 로그인)을 감싼다. tools/ai_code_review.mjs가 쓴다.
//
// 공식 기능만 쓴다 (Grok CLI 1.0.70 기준, docs: user-guide 02-authentication·14-headless-mode):
//   grok --prompt-file · --output-format json · --cwd · --tools(허용 목록) · --disable-web-search · --max-turns
//   - 읽기 도구만 허용(read_file,grep) — 셸·편집·웹 없음. 리뷰는 읽기 전용이다.
//   - 사용자 프로필 전체(C:/Users)·메인 클론을 읽기·검색 금지(--deny) — Windows에는 sandbox가 없다.
//     그 밖의 절대 경로(다른 드라이브 등)는 막지 못한다 — 작업자 PC에 비밀 파일을 그런 곳에 두지 않는다.
//   - --trust를 주지 않는다 — PR 안의 .grok/hooks·MCP는 신뢰 전이라 실행되지 않는다(작업자가 설정 폴더도 지운다).
//   - 자식 환경변수는 허용 목록(PATH·시스템·프로필 경로 등)만 — XAI_API_KEY·GitHub·Devin 토큰은 넘어가지 않아
//     로그인이 풀려도 토큰당 과금 API로 넘어가지 않는다(로그인 없으면 실패).
//   - 응답에 인증 정보로 보이는 값(auth.json의 값, 토큰 패턴)이 있으면 게시하지 않는다(프롬프트 주입 대비 마지막 방어선).
//
// 반환: { ok: true, answer, info } | { ok: false, kind: "account" | "run" | "blocked", reason, info }
//   account — 로그인·사용량 문제(작업자를 멈춘다), run — 이 PR 실행 실패, blocked — 응답 게시 거부
// 시험: GROK_BIN에 .mjs 경로를 주면 node로 실행한다(가짜 grok으로 실패 경로 점검).
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BIN = process.env.GROK_BIN || "grok";
const GROK_HOME = process.env.GROK_HOME || join(homedir(), ".grok");
// list_dir은 뺀다 — deny 규칙을 붙일 수 없어(unknown tool prefix) 홈 폴더 목록이 보인다. 파일 찾기는 grep으로.
const TOOLS = "read_file,grep";
const MAX_TURNS = Number(process.env.GROK_MAX_TURNS || 40);
const slash = (p) => p.replace(/\\/g, "/");
// 리뷰어가 읽으면 안 되는 위치 — 홈 전체, GROK_HOME(홈 밖으로 옮긴 경우), 이 스크립트가 있는 메인 클론
// (메인 클론에는 .env·.devin/.env가 있을 수 있고, worktree의 .git 파일이 그 경로를 알려 준다)
const MAIN_CLONE = slash(join(dirname(fileURLToPath(import.meta.url)), ".."));
// Windows는 모든 사용자 프로필(C:/Users) 전체 — 내 홈만 막으면 다른 프로필은 열린다
const PROFILES = process.platform === "win32" ? slash(dirname(homedir())) : slash(homedir());
const DENY_ROOTS = [...new Set([PROFILES, slash(GROK_HOME), MAIN_CLONE])];
// 자식에게 넘기는 환경변수는 허용 목록으로 — 빼는 목록은 DATABASE_URL·npm _authToken 같은 이름을 놓친다.
// XAI_API_KEY가 없으므로 로그인이 풀려도 토큰당 과금 API로 넘어가지 않는다.
const PASS_ENV =
  /^(PATH|PATHEXT|SYSTEMROOT|SYSTEMDRIVE|WINDIR|COMSPEC|TEMP|TMP|TMPDIR|HOME|USERPROFILE|HOMEDRIVE|HOMEPATH|APPDATA|LOCALAPPDATA|PROGRAMDATA|PROGRAMFILES|PROGRAMFILES\(X86\)|USERNAME|USER|LANG|LC_ALL|TERM|OS|NUMBER_OF_PROCESSORS|PROCESSOR_ARCHITECTURE|GROK_(HOME|NO_AUTO_UPDATE)|NODEFAULTCURRENTDIRECTORYINEXEPATH)$/i;
const TOKEN_LIKE =
  /\b(gh[pousr]_[A-Za-z0-9]{20,}|github_pat_\w{20,}|sb_secret_[\w-]{10,}|xai-[A-Za-z0-9]{20,}|cog_[A-Za-z0-9]{20,}|eyJ[\w-]{10,}\.[\w-]{10,}\.[\w-]{10,})/;

const run = (bin, args, timeoutMs) =>
  new Promise((resolve) => {
    const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => PASS_ENV.test(k)));
    const [cmd, argv] = bin.endsWith(".mjs") ? [process.execPath, [bin, ...args]] : [bin, args];
    const child = spawn(cmd, argv, { env, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
    let out = "";
    let err = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      // Windows의 kill()은 자식만 끊어 grok 하위 프로세스가 남는다 — 트리째 종료
      if (process.platform === "win32") spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
      else child.kill();
    }, timeoutMs);
    // 문자열로 받는다 — 바이트 덩어리를 이어 붙이면 청크 경계의 한글(UTF-8)이 깨져 JSON 파싱이 실패할 수 있다
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("error", (e) => {
      clearTimeout(timer);
      resolve({ code: -1, out, err: `${err}${e.message}`, timedOut });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code, out, err, timedOut });
    });
  });

// --output-format json은 응답이 끝난 뒤 JSON 객체 하나를 낸다. 앞에 다른 줄이 섞여도 마지막 객체를 쓴다.
const lastJson = (out) => {
  const t = out.trim();
  for (const cand of [t, ...t.split("\n").reverse().filter((l) => l.trim().startsWith("{"))]) {
    try {
      const v = JSON.parse(cand);
      if (v && typeof v === "object") return v;
    } catch {}
  }
  return null;
};

// 계정 오류는 CLI의 JSON 오류 메시지로만 판단한다(stderr 전체에서 단어를 찾으면 오탐한다)
const ACCOUNT_AUTH = /not signed in|grok login|unauthori[sz]ed|\b401\b|(token|session) (has )?expired/i;
const ACCOUNT_LIMIT = /usage limit|weekly limit|quota|\b429\b|rate limit|insufficient (credit|balance)/i;
// 공개되는 상태·코멘트에는 고정 문구만 쓴다 — CLI 메시지 원문은 작업자 콘솔에만 남긴다
const classify = (message) =>
  ACCOUNT_AUTH.test(message)
    ? { kind: "account", reason: "Grok 로그인 필요(grok login)" }
    : ACCOUNT_LIMIT.test(message)
      ? { kind: "account", reason: "Grok 사용량 한도 — 추가 결제 없이 중단" }
      : { kind: "run", reason: "Grok 실행 오류" };

// auth.json 안의 긴 문자열 값(토큰류)을 모은다 — 응답에 그대로 나오면 유출이다
const authValues = () => {
  const file = join(GROK_HOME, "auth.json");
  if (!existsSync(file)) return [];
  const vals = [];
  const walk = (v) => {
    if (typeof v === "string" && v.length >= 16) vals.push(v);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  try {
    walk(JSON.parse(readFileSync(file, "utf8")));
  } catch {}
  return vals;
};

export async function runGrok(prompt, { cwd, timeoutMs }) {
  // 작업 폴더가 막힌 위치 안에 있으면 리뷰할 코드도 못 읽는다 — 실행 전에 거절
  const lower = slash(cwd).toLowerCase();
  if (DENY_ROOTS.some((root) => lower === root.toLowerCase() || lower.startsWith(`${root.toLowerCase()}/`))) {
    return { ok: false, kind: "run", reason: "작업 폴더가 읽기 금지 위치 안에 있음 — REVIEW_ROOT 확인", info: "실행 안 함" };
  }
  // 프롬프트는 파일로 넘긴다 — Windows 명령줄 길이 제한(약 32k자)보다 diff가 길 수 있다
  const dir = mkdtempSync(join(tmpdir(), "eottae-grok-"));
  const file = join(dir, "prompt.md");
  writeFileSync(file, prompt);
  const args = [
    "--prompt-file", file,
    "--cwd", cwd,
    "--output-format", "json",
    "--no-auto-update",
    "--tools", TOOLS,
    "--disable-web-search",
    "--max-turns", String(MAX_TURNS),
    // Windows에는 sandbox가 없다 — 사용자 프로필 전체(인증 파일·.env·SSH 키 등)를 읽기·검색 금지로 막는다.
    // 그래서 작업 폴더(REVIEW_ROOT)는 홈 밖에 둔다(grok_review_worker.mjs). deny가 allow보다 우선한다.
    ...DENY_ROOTS.flatMap((root) => ["--deny", `Read(${root}/**)`, "--deny", `Grep(${root}/**)`]),
    ...(process.env.GROK_MODEL ? ["--model", process.env.GROK_MODEL] : []),
  ];
  const started = Date.now();
  const r = await run(BIN, args, timeoutMs);
  rmSync(dir, { recursive: true, force: true });
  const sec = Math.round((Date.now() - started) / 1000);
  const j = lastJson(r.out);

  if (r.timedOut) return { ok: false, kind: "run", reason: `Grok 시간 초과(${sec}초)`, info: `${sec}초` };
  if (j?.type === "error" || (!j && r.code !== 0)) {
    console.error(`grok 오류 원문(비공개): ${String(j?.message || r.err || r.out || "").trim().slice(0, 500)}`);
    const verdict = j?.type === "error" ? classify(String(j.message || "")) : { kind: "run", reason: "Grok 실행 오류" };
    return { ok: false, ...verdict, info: `${sec}초, exit ${r.code}` };
  }
  if (!j || typeof j.text !== "string") {
    return { ok: false, kind: "run", reason: "Grok 응답 JSON 형식 이상", info: `${sec}초` };
  }

  const u = j.usage || {};
  const input = (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0);
  const info = [
    `${sec}초`,
    j.num_turns != null ? `${j.num_turns}턴` : null,
    `입력 ${input.toLocaleString("en-US")}·출력 ${(u.output_tokens || 0).toLocaleString("en-US")} 토큰`,
    j.stopReason ? `종료 ${j.stopReason}` : null,
    // 구독 로그인이어도 CLI가 API 단가로 환산한 값을 준다 — 실제 청구액이 아니라 사용량 비교용
    typeof j.total_cost_usd === "number" ? `API 환산 $${j.total_cost_usd.toFixed(2)}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  const leaked = authValues().some((v) => j.text.includes(v)) || TOKEN_LIKE.test(j.text);
  if (leaked) return { ok: false, kind: "blocked", reason: "응답에 인증 정보로 보이는 값 — 게시하지 않음", info };
  // 최종 답 앞에 진행 문구("먼저 확인합니다…")가 붙어 나온다 — 제목 줄부터 쓴다
  const start = j.text.indexOf("## AI 코드 리뷰");
  return { ok: true, answer: start > 0 ? j.text.slice(start) : j.text, info };
}
