// 「어때?」 카카오톡 완료 알림 — 작업자(tools/grok_review_worker.mjs)가 큐 작업을 하나 끝낼 때마다
// 카카오톡 "나에게 보내기"로 결과를 보낸다. 설정이 없으면 한 줄 로그만 남기고 건너뛴다(선택 기능).
// 알림 실패는 예외를 던지지 않고 로그만 — 알림 때문에 작업자가 멈추면 안 된다.
// DRY_RUN(1·2)이면 실제로 보내지 않고 출력만 한다(작업자의 DRY_RUN=2는 바깥 쓰기 전부 생략 규칙과 같게).
//
// 최초 한 번 설정 (카카오 디벨로퍼스 앱 + 내 계정 동의 — 수 분 걸림):
//   1. developers.kakao.com → 내 애플리케이션 → 앱 추가 → "카카오 로그인" 활성화·Redirect URI 등록
//      (예 http://localhost:8080) → 동의항목에서 "카카오톡 메시지 전송(talk_message)"을 동의로 설정
//   2. 저장소 루트 .env(또는 환경변수)에 KAKAO_REST_API_KEY={앱의 REST API 키}
//      (.env는 .gitignore 대상 — 커밋 금지. 커스텀 URI를 썼으면 KAKAO_REDIRECT_URI도)
//   3. 브라우저에서 아래 주소를 열어 동의 → 리다이렉트된 주소의 code= 값 복사
//      https://kauth.kakao.com/oauth/authorize?client_id={키}&redirect_uri={URI}&response_type=code&scope=talk_message
//   4. node tools/kakao_notify.mjs --code {code}   → 토큰을 REVIEW_ROOT/kakao_token.json에 저장
//   5. node tools/kakao_notify.mjs 테스트          → 나에게 도착하는지 확인
// 토큰 파일은 클론 밖(REVIEW_ROOT, 작업자의 state.json과 같은 곳)에 둔다 — PR에 토큰이 섞이지 않게.
//
// 토큰 수명: access_token은 몇 시간, refresh_token은 약 두 달. 보낼 때 만료가 가까우면 refresh로 갱신해
// 파일을 덮어쓴다(카카오는 refresh_token이 1개월 미만 남았을 때만 새 것을 준다). refresh까지 만료되면
// 갱신이 실패하니 3~4번을 다시 한다.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REVIEW_ROOT =
  process.env.REVIEW_ROOT || (process.platform === "win32" ? "C:\\eottae-grok-review" : "/var/tmp/eottae-grok-review");
const TOKEN_FILE = process.env.KAKAO_TOKEN_FILE || join(REVIEW_ROOT, "kakao_token.json");
const DRY = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "2";

// 설정은 환경변수가 우선, 없으면 저장소 루트 .env의 KAKAO_* 줄만 본다(다른 키는 읽지 않는다)
const fromDotEnv = () => {
  const out = {};
  try {
    for (const m of readFileSync(join(ROOT, ".env"), "utf8").matchAll(/^\s*(KAKAO_[A-Z_]+)\s*=\s*"?([^"\r\n]*)"?\s*$/gm))
      out[m[1]] = m[2];
  } catch {}
  return out;
};
const CFG = { KAKAO_REST_API_KEY: "", KAKAO_REDIRECT_URI: "", KAKAO_REFRESH_TOKEN: "", ...fromDotEnv() };
for (const k of Object.keys(CFG)) if (process.env[k]) CFG[k] = process.env[k];

const post = async (url, params, headers = {}) => {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8", ...headers },
    body: new URLSearchParams(params),
    signal: AbortSignal.timeout(20_000), // 알림 하나가 작업자 주기를 오래 잡지 않게
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Kakao ${r.status}: ${j.error_description || j.msg || r.statusText}`);
  return j;
};

const readTokens = () => {
  try {
    return JSON.parse(readFileSync(TOKEN_FILE, "utf8"));
  } catch {
    return null;
  }
};
const writeTokens = (t) => {
  mkdirSync(dirname(TOKEN_FILE), { recursive: true });
  writeFileSync(TOKEN_FILE, JSON.stringify(t), { mode: 0o600 });
};

// access_token 확보 — 파일에 1분 이상 남은 것이 있으면 재사용, 아니면 refresh_token(파일 → 환경 순)으로 갱신·저장
async function accessToken() {
  const f = readTokens();
  if (f?.access_token && f.expires_at > Date.now() + 60_000) return f.access_token;
  const refresh = f?.refresh_token || CFG.KAKAO_REFRESH_TOKEN;
  const client = CFG.KAKAO_REST_API_KEY || f?.client_id; // --code 교환 때 client_id를 파일에 같이 둔다
  if (!refresh || !client) return null;
  const j = await post("https://kauth.kakao.com/oauth/token", {
    grant_type: "refresh_token",
    client_id: client,
    refresh_token: refresh,
  });
  writeTokens({
    client_id: client,
    access_token: j.access_token,
    refresh_token: j.refresh_token || refresh, // 새 refresh_token은 1개월 미만 남았을 때만 온다
    expires_at: Date.now() + j.expires_in * 1000,
  });
  return j.access_token;
}

// 나에게 보내기(텍스트 메모). 성공 여부만 돌려준다 — 어떤 실패도 던지지 않는다.
export async function notifyKakao(text, link) {
  try {
    if (DRY) {
      console.log(`[DRY] 카카오 알림: ${String(text).replace(/\n/g, " / ")}`);
      return true;
    }
    const at = await accessToken();
    if (!at) {
      console.log("카카오 알림 미설정 — 건너뜀(KAKAO_REST_API_KEY·토큰 필요, tools/kakao_notify.mjs 머리말 참고)");
      return false;
    }
    await post(
      "https://kapi.kakao.com/v2/api/talk/memo/default/send",
      {
        template_object: JSON.stringify({
          object_type: "text",
          text: String(text).slice(0, 190), // 텍스트 메모 본문 상한(200자) 안쪽
          ...(link ? { link: { web_url: link, mobile_web_url: link }, button_title: "GitHub에서 보기" } : {}),
        }),
      },
      { Authorization: `Bearer ${at}` },
    );
    return true;
  } catch (e) {
    console.error(`카카오 알림 실패 — 작업은 계속: ${e.message}`);
    return false;
  }
}

const USAGE = `카카오톡 "나에게 보내기" 설정이 아직 안 됐거나 시험할 때 쓰는 도구.
  node tools/kakao_notify.mjs --code {인증코드}   동의 코드를 토큰으로 교환해 ${TOKEN_FILE}에 저장
  node tools/kakao_notify.mjs {메시지}           나에게 시험 전송
설정 절차는 파일 머리말 주석 참고 (KAKAO_REST_API_KEY는 .env·환경변수로).`;

// 직접 실행 전용 — import로 쓸 때는 아무것도 보내지 않는다
async function cli() {
  const arg = process.argv.slice(2);
  if (arg[0] === "--code") {
    if (!arg[1] || !CFG.KAKAO_REST_API_KEY) {
      console.error("KAKAO_REST_API_KEY(.env 또는 환경변수)와 --code {인증코드}가 필요합니다");
      return 1;
    }
    try {
      const j = await post("https://kauth.kakao.com/oauth/token", {
        grant_type: "authorization_code",
        client_id: CFG.KAKAO_REST_API_KEY,
        redirect_uri: CFG.KAKAO_REDIRECT_URI || "http://localhost:8080",
        code: arg[1],
      });
      writeTokens({
        client_id: CFG.KAKAO_REST_API_KEY,
        access_token: j.access_token,
        refresh_token: j.refresh_token,
        expires_at: Date.now() + j.expires_in * 1000,
      });
      console.log(`토큰 저장: ${TOKEN_FILE} — 이제 작업자가 작업을 끝낼 때마다 나에게 보냅니다`);
      return 0;
    } catch (e) {
      console.error(`토큰 교환 실패(인증코드는 1회용·수 분만 유효): ${e.message}`);
      return 1;
    }
  }
  if (arg.length) return (await notifyKakao(arg.join(" "))) ? 0 : 1;
  console.log(USAGE);
  return 0;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = await cli();
