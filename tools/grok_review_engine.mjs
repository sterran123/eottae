// 「어때?」 로컬 Grok 리뷰 엔진 — Grok CLI 헤드리스 실행(구독 로그인)을 감싼다. tools/ai_code_review.mjs가 쓴다.
//
// 공식 기능만 쓴다 (Grok CLI 1.0.70 기준, docs: user-guide 02-authentication·14-headless-mode):
//   grok --prompt-file · --output-format json · --cwd · --tools(허용 목록) · --disable-web-search · --max-turns
//   - 읽기 도구만 허용(read_file,grep) — 셸·편집·웹 없음. 리뷰는 읽기 전용이다.
//   - 홈 디렉터리 전체를 읽기·검색 금지(--deny) — Windows에는 sandbox가 없어 이것이 작업 폴더 밖 읽기를 막는다.
//   - --trust를 주지 않는다 — PR 안의 .grok/hooks·MCP는 신뢰 전이라 실행되지 않는다(작업자가 설정 폴더도 지운다).
//   - XAI_API_KEY를 자식 환경에서 지운다 — 로그인이 풀려도 토큰당 과금 API로 넘어가지 않게(로그인 없으면 실패).
//   - GitHub·Devin 토큰도 자식 환경에 넘기지 않는다.
//   - 응답에 인증 정보로 보이는 값(auth.json의 값, 토큰 패턴)이 있으면 게시하지 않는다(프롬프트 주입 대비 마지막 방어선).
//
// 반환: { ok: true, answer, info } | { ok: false, kind: "account" | "run" | "blocked", reason, info }
//   account — 로그인·사용량 문제(작업자를 멈춘다), run — 이 PR 실행 실패, blocked — 응답 게시 거부
// 시험: GROK_BIN에 .mjs 경로를 주면 node로 실행한다(가짜 grok으로 실패 경로 점검).
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";

const BIN = process.env.GROK_BIN || "grok";
const GROK_HOME = process.env.GROK_HOME || join(homedir(), ".grok");
// list_dir은 뺀다 — deny 규칙을 붙일 수 없어(unknown tool prefix) 홈 폴더 목록이 보인다. 파일 찾기는 grep으로.
const TOOLS = "read_file,grep";
const MAX_TURNS = Number(process.env.GROK_MAX_TURNS || 40);
const slash = (p) => p.replace(/\\/g, "/");
// 리뷰어가 읽으면 안 되는 위치 — 홈 전체와 GROK_HOME(홈 밖으로 옮긴 경우)
const DENY_ROOTS = [...new Set([slash(homedir()), slash(GROK_HOME)])];
const HIDDEN_ENV = /^(XAI_API_KEY|GITHUB_TOKEN|GH_TOKEN|DEVIN_API_KEY|DEVIN_ORG_ID)$/i;
const TOKEN_LIKE =
  /\b(gh[pousr]_[A-Za-z0-9]{20,}|github_pat_\w{20,}|sb_secret_[\w-]{10,}|xai-[A-Za-z0-9]{20,}|cog_[A-Za-z0-9]{20,}|eyJ[\w-]{10,}\.[\w-]{10,}\.[\w-]{10,})/;

const run = (bin, args, timeoutMs) =>
  new Promise((resolve) => {
    const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !HIDDEN_ENV.test(k)));
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
    return { ok: false, kind: "account", reason: "작업 폴더가 홈 안에 있음 — REVIEW_ROOT를 홈 밖으로", info: "실행 안 함" };
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
    // Windows에는 sandbox가 없다 — 홈 디렉터리 전체(인증 파일·.env·SSH 키 등)를 읽기·검색 금지로 막는다.
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
