// 「어때?」 PR 리뷰 봇 — 열린 PR을 점검해 괜찮으면 승인·머지, 문제면 코멘트를 단다.
//
// 주기 실행: .github/workflows/pr-review.yml (2시간 주기 + Actions 탭 수동 실행)
// 로컬 수동 실행: node tools/pr_review_bot.mjs
//   GH_TOKEN/GITHUB_TOKEN 필요, 저장소는 GITHUB_REPOSITORY에서 감지
//   DRY_RUN=1 이면 조회·판정만 하고 쓰기(코멘트/승인/머지)는 전부 건너뛴다
//
// 판정 규칙 (보수적 — 애매하면 사람에게 넘긴다). 모든 코멘트는 같은 검사 표
// (작성자·보호 영역·보안 스캔·머지 가능성·빌드 CI·AI 리뷰·연결 이슈)와 다시 시도하는 방법을 담는다.
//   0. base가 main이 아닌 PR → 자동 판정 범위 밖, 안내 코멘트(sha당 1회)
//   1. draft PR → 끝까지 판정하되 머지하지 않고 "Ready for review로 바꾸면 머지" 안내.
//      team-sync 봇 PR → 자동 생성 파일(TEAM_ACTIVITY·FILE_INDEX·MANIFEST)만 허용, AI 리뷰 생략,
//      충돌이면 다음 team-sync가 덮어쓰니 대기. 봇은 자기 PR을 승인할 수 없어 머지가 거부되면
//      사람 승인 1번을 요청한다. 다른 외부 봇 PR은 스킵.
//   2. 외부 비협력자(OWNER/MEMBER/COLLABORATOR 아님) → 사람 확인 요청 코멘트
//   3. 보호 영역(.github/ 전체·CODEOWNERS·자동화 스크립트·패키지/빌드 설정·환경설정/키 파일·
//      인증/DB/RLS 보안 코드) → 멈추지 않고 나머지 검사를 끝까지 한 뒤, 모두 통과하면
//      "사람 승인 대기" 코멘트. 작성자 외 사람이 이 head sha에 Approve하면 머지한다.
//      rename된 파일은 옛 경로(previous_filename)도 함께 검사 — filename만 보면
//      '.github/workflows/x.yml' → 'x.yml' rename으로 보호 영역 삭제를 숨길 수 있다
//   4. 보안 스캔(추가된 줄): 키·토큰·JWT 하드코딩, 브라우저 코드의 service_role, 비밀값 기본값,
//      NEXT_PUBLIC 비밀값, eval → 차단(사람 승인이 있어도 차단 — 공개 저장소라 키는 재발급이 먼저).
//      dangerouslySetInnerHTML·토큰 브라우저 저장·tsx 색 하드코딩 → 경고만
//   5. 머지 가능 상태 계산 중(mergeable null/unknown) → 이번 라운드 보류
//      (목록 API 응답은 지연 계산된 값일 수 있어 PR 상세를 따로 조회한다)
//   6. main과 머지 충돌 → 충돌 파일·해결 명령 코멘트. push하면 재판정
//   7. behind 상태 → 별도 갱신 없이 그대로 머지 진행. head sha의 CI는 작성자 push 때
//      이미 검증됐고, "최신화 요구" 보호 규칙이 켜져 있으면 merge API가 거부해
//      자연히 사람에게 넘어간다. update-branch(main을 PR에 머지)는 쓰지 않는다 —
//      GITHUB_TOKEN으로 한 갱신 push는 pull_request 워크플로를 트리거하지 못해
//      새 sha에 check가 영원히 없는 고착 상태를 만들고, check가 필수 상태면
//      사람의 머지 버튼까지 막힌다.
//   8. 빌드 CI 'check'(npm ci→typecheck→build) 없음 → 커밋 시각 기준 유예 후 안내, 실패 → 재현 절차.
//      (다른 워크플로의 성공만으로 필수 CI를 대체 판정하지 않는다)
//   9. AI 코드 리뷰(커밋 상태 `ai-review`, tools/ai_code_review.mjs) → 통과해야 머지.
//      수정 필요·오류·장시간 없음이면 사유 코멘트. 사람 승인이 있으면 사람 판단이 우선한다.
//  10. 전부 통과 → 승인(sha별 1회, commit_id 고정) + squash 머지 시도.
//      머지는 판정한 head sha를 조건으로 걸어 중간에 새 push가 오면 API가 거부한다
//      (승인의 commit_id는 거부되지 않고 stale 리뷰로 기록된다 — 차단은 머지 가드가 담당).
//      CODEOWNERS 등 보호 규칙에 막히면 "승인 완료·사람 머지 필요" 코멘트
//  연결 이슈: 본문에 Closes #번호가 없으면 표에 안내(머지는 막지 않음)
// 모든 목록 조회(files/comments/reviews/check-runs)는 전 페이지를 따라간다 —
// 첫 페이지만 보면 100개 이후 위치에 민감 파일을 숨겨 검사를 우회할 수 있다.
// 머지가 한 건이라도 성공하면 deploy-pages·team-sync를 dispatch해 사이트/매니페스트를 갱신한다.
// (GITHUB_TOKEN 머지는 push 이벤트를 트리거하지 못하므로 dispatch가 필요)
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// .env 자동 로드 — 루트 .env 또는 .devin/.env(gitignore·매니페스트 제외 대상)에서
// GH_TOKEN 등을 읽는다. 이미 잡힌 환경변수가 우선.
for (const envPath of [join(ROOT, ".env"), join(ROOT, ".devin", ".env")]) {
  if (!existsSync(envPath)) continue;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_]\w*)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const REPO = process.env.GITHUB_REPOSITORY || "sterran123/eottae";
const TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || "";
const DRY = process.env.DRY_RUN === "1";
// FORCE_COMMENT=1 — 같은 sha의 기존 봇 코멘트를 찾아 내용을 갱신한다
// (코멘트 형식을 바꿨을 때 옛 코멘트를 새 형식으로 바꾸는 용도)
const FORCE = process.env.FORCE_COMMENT === "1";
const BOT = "github-actions[bot]";

const MEMBER_ASSOC = new Set(["OWNER", "MEMBER", "COLLABORATOR"]);
// 자동 승인 금지 영역 — CI/배포 파이프라인·리뷰 정책·시크릿류는 사람이 검토해야 한다
const FORBIDDEN = /^\.github\//; // 워크플로·CODEOWNERS·기타 Actions 설정 전부 (루트 .github만 GitHub이 인식)
const CODEOWNERS = /(^|\/)CODEOWNERS$/i; // GitHub는 루트·docs/·.github/ 위치를 모두 인식
// 크리덴셜류 — 공개 저장소라 실수로 올린 키가 자동 머지되면 그대로 공개된다.
// 세그먼트 단위로 넓게 잡는다(오탐은 수동 리뷰 요청 코멘트로 끝나므로 안전 쪽으로).
const SENSITIVE =
  /(^|\/)(\.env(\.|$)|[^/]*secrets?[^/]*|[^/]*credentials?[^/]*|[^/]*id_(rsa|ed25519|ecdsa|dsa)[^/]*|\.(netrc|htpasswd|pgpass|pypirc)$|[^/]*\.(pem|key|p12|pfx|p8|keystore|jks|asc|tfvars|ovpn|kdbx)$)/i;
// 패키지 매니저·빌드 설정 — 스케줄 잡(team-sync·deploy-pages)의 `npm ci`/`npm run`/`next build`가
// 이 파일들이 정의한 코드(lifecycle 스크립트·next.config 등)를 실행한다.
// 진입점 스크립트만 막으면 postinstall 한 줄로 쓰기 토큰 작업에 코드를 심을 수 있다.
const BUILD_CONTROL =
  /(^|\/)(package\.json|package-lock\.json|npm-shrinkwrap\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb?|\.npmrc|\.yarnrc(\.yml)?|\.pnpmfile\.cjs|next\.config\.[cm]?[jt]s|tsconfig[^/]*\.json|jsconfig[^/]*\.json|babel\.config\.[cm]?[jt]s|\.babelrc(\..*)?$|postcss\.config\.[cm]?[jt]s|tailwind\.config\.[cm]?[jt]s)$/i;
// 스케줄 워크플로가 write 권한 토큰으로 실행하는 자동화 진입점 —
// 워크플로 YAML을 막아도 이 스크립트들이 열려 있으면 같은 우회가 된다
const PIPELINE_TOOLS = new Set([
  "tools/pr_review_bot.mjs",
  "tools/team_activity_report.mjs",
  "tools/update_package_manifest.py",
  "tools/devin_pr_watch.mjs",
  "tools/ai_code_review.mjs", // DEVIN 시크릿으로 실행 — 판정 로직 자체가 머지 게이트
  "tools/devin_mention_bridge.mjs",
]);
// 인증·DB·RLS 보안 코드 (ADR-005) — CI는 동작 여부만 보고 '안전한지'는 못 본다.
// 위조 가능한 세션 서명·하드코딩 키가 CI 통과만으로 자동 머지된 사례(#24) 이후 사람 리뷰 필수.
const SECURITY_CODE =
  /^0\. 소스코드\/eottae-web\/(supabase\/|src\/lib\/(server|auth|supabase)\/|src\/app\/api\/)/;
// 봇(team-sync)이 만드는 자동 생성 파일 — 봇 PR은 이 파일만 바꿀 수 있다
const GENERATED = new Set([
  "0. 소스코드/eottae-web/docs/TEAM_ACTIVITY.md",
  "FILE_INDEX.csv",
  "MANIFEST.sha256",
]);
// 추가된 줄 정적 보안 스캔 — block은 자동 머지 차단, warn은 판정 코멘트에 안내만.
// code: true면 코드 파일(ts/tsx/js/mjs/cjs/sql)에만 적용, path로 경로를 더 좁힌다.
const SAFETY_RULES = [
  { id: "개인키", sev: "block", re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/, fix: "키 파일을 저장소에서 지우고 키를 재발급" },
  { id: "AWS 키", sev: "block", re: /\bAKIA[0-9A-Z]{16}\b/, fix: "키를 폐기·재발급하고 Secrets로 이동" },
  { id: "GitHub 토큰", sev: "block", re: /\b(ghp|gho|ghs|ghu)_[A-Za-z0-9]{36}\b|\bgithub_pat_[A-Za-z0-9_]{40,}/, fix: "토큰을 폐기하고 Secrets로 이동" },
  { id: "결제·Slack 키", sev: "block", re: /\b(sk|rk)_(live|test)_[A-Za-z0-9]{16,}|\bxox[abprs]-[A-Za-z0-9-]{10,}/, fix: "키를 폐기하고 Secrets로 이동" },
  { id: "JWT·Supabase 키 하드코딩", sev: "block", re: /\beyJ[A-Za-z0-9_-]{15,}\.eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}/, fix: "코드에 넣지 말고 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 환경변수(GitHub Secrets)로 주입 — ADR-005" },
  { id: "service_role 사용", sev: "block", re: /service_role|SERVICE_ROLE/, path: /^0\. 소스코드\/eottae-web\/(src|public)\//, fix: "브라우저 코드에서 제거 — service_role은 Edge Function 시크릿에만 (ADR-005)" },
  { id: "비밀값 기본값(fail-open)", sev: "block", code: true, re: /process\.env\.[A-Z0-9_]*(SECRET|KEY|TOKEN|PASSWORD)[A-Z0-9_]*\s*(\|\||\?\?)\s*['"`]/, fix: "기본값을 없애고 값이 없으면 에러로 막기 (ADR-002 fail-closed)" },
  { id: "비밀값 하드코딩", sev: "block", code: true, re: /\b[A-Z0-9_]*(SECRET|PASSWORD|PRIVATE_KEY|API_KEY)[A-Z0-9_]*\s*[:=]\s*['"`][^'"`\s]{8,}['"`]/, fix: "값을 코드에서 지우고 환경변수·Secrets로 (테스트도 가짜 값을 env로 주입)" },
  { id: "공개 변수에 비밀값", sev: "block", re: /NEXT_PUBLIC_[A-Z0-9_]*(SECRET|SERVICE_ROLE|PRIVATE)/, fix: "NEXT_PUBLIC_*은 브라우저에 노출된다 — 비밀값은 Edge Function 시크릿으로" },
  { id: "eval/new Function", sev: "block", code: true, re: /\beval\s*\(|\bnew\s+Function\s*\(/, fix: "동적 코드 실행 제거" },
  { id: "dangerouslySetInnerHTML", sev: "warn", code: true, re: /dangerouslySetInnerHTML/, fix: "사용자 입력이 들어가지 않는지 확인 (XSS)" },
  { id: "토큰을 브라우저 저장소에", sev: "warn", code: true, re: /(localStorage|sessionStorage)\.setItem\([^)]*(token|session|jwt|auth)/i, fix: "세션은 Supabase Auth가 관리 — 직접 저장하지 않기 (ADR-005)" },
  { id: "색상 하드코딩", sev: "warn", re: /['"`]#[0-9a-fA-F]{3,8}['"`]/, path: /\.tsx$/, fix: "globals.css / match-tokens.css 토큰으로" },
];
const CODE_FILE = /\.(ts|tsx|js|jsx|mjs|cjs|sql)$/;
// PR 본문의 이슈 자동 종료 키워드 — 머지 때 GitHub이 해당 이슈를 닫는다
const CLOSES = /\b(close[sd]?|fix(e[sd])?|resolve[sd]?)\s*:?\s+#(\d+)/gi;
const AI_CONTEXT = "ai-review"; // tools/ai_code_review.mjs가 남기는 커밋 상태
// AI 리뷰는 수 분~25분 걸린다 — 이 시간을 넘겨도 상태가 없으면 재실행 안내
const AI_GRACE_MS = 45 * 60 * 1000;
const MAX_PAGES = 30; // 목록 페이지네이션 상한 (3000건 — GitHub PR 파일 표시 한도와 동일)
// push 직후에는 check-run 등록이 지연될 수 있다 — 이 시간을 넘겨도 check가 없으면
// CI가 안 도는 것으로 보고 작성자에게 코멘트한다 (봇이 올린 head에는 check가 영원히 없다)
const CI_GRACE_MS = 30 * 60 * 1000;
// 판정 코멘트를 단 PR이 이 기간 동안 아무 변동 없이 열려 있으면 작성자에게 핑을 보낸다
const REMIND_MS = 3 * 24 * 60 * 60 * 1000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 같은 커밋에 같은 종류의 코멘트를 반복하지 않기 위한 마커
const mark = (sha, cat) => `<!-- pr-review-bot:${sha.slice(0, 10)}:${cat} -->`;

// 검사 결과 표 — 모든 코멘트에 어떤 검사를 했고 어디서 걸렸는지 보여준다
const table = (rows) =>
  ["| 검사 항목 | 결과 |", "|---|---|", ...rows.map(([k, v]) => `| ${k} | ${v} |`)].join("\n");

// 민감 파일이 어떤 규칙에 걸렸는지 라벨 — 작성자가 왜 막혔는지 알아야 옮길 수 있다
const whyBlocked = (f) => {
  if (FORBIDDEN.test(f)) return "`.github/` — 워크플로·권한 설정은 사람이 검토";
  if (CODEOWNERS.test(f)) return "`CODEOWNERS` — 리뷰 정책 파일";
  if (PIPELINE_TOOLS.has(f)) return "자동화 진입점 스크립트 — 스케줄 잡이 write 토큰으로 실행";
  if (BUILD_CONTROL.test(f)) return "패키지·빌드 설정 — npm/next가 정의한 코드를 실행";
  if (SECURITY_CODE.test(f)) return "인증·DB·RLS 보안 코드 — 담당자·김민기 리뷰 필요 (ADR-005)";
  if (SENSITIVE.test(f)) return "환경설정·키류 — 공개 저장소라 즉시 공개됨";
  return "보호 영역";
};

// 추가된 줄만 스캔 — patch의 hunk 헤더(@@ -a,b +c,d @@)로 새 파일 기준 줄 번호를 계산한다.
// patch가 없는 파일(바이너리·대용량)은 검사할 수 없으니 건너뛴다.
function scanSafety(files) {
  const hits = [];
  for (const f of files || []) {
    if (!f.patch || f.status === "removed") continue;
    let line = 0;
    for (const raw of f.patch.split("\n")) {
      const h = raw.match(/^@@ -\d+(?:,\d+)? \+(\d+)/);
      if (h) {
        line = Number(h[1]);
        continue;
      }
      if (raw.startsWith("-")) continue;
      if (raw.startsWith("+")) {
        const text = raw.slice(1);
        for (const r of SAFETY_RULES) {
          if (r.code && !CODE_FILE.test(f.filename)) continue;
          if (r.path && !r.path.test(f.filename)) continue;
          if (r.re.test(text)) hits.push({ ...r, file: f.filename, line });
        }
      }
      line++;
    }
  }
  return hits;
}

// 연결 이슈 — 본문에 Closes #번호가 있으면 머지 때 GitHub이 그 이슈를 자동으로 닫는다
const linkedIssues = (body) => [...String(body || "").matchAll(CLOSES)].map((m) => `#${m[3]}`);

// 모든 판정 코멘트에 같은 표를 쓴다 — 아직 안 본 항목은 ⏸️로 남겨 어디까지 검사했는지 보이게
const ROW_ORDER = [
  ["author", "작성자"],
  ["scope", "보호 영역"],
  ["scan", "보안 스캔(추가된 줄)"],
  ["merge", "머지 가능성"],
  ["ci", "빌드 CI `check`"],
  ["ai", "AI 코드 리뷰"],
  ["issue", "연결 이슈"],
];
const statusTable = (st) => table(ROW_ORDER.map(([k, label]) => [label, st[k] ?? "⏸️ 미검사"]));

// 실제 충돌 파일 목록 — git merge-tree로 로컬에서 시험 머지(작업트리는 안 건드림).
// git이 없거나 sha fetch가 안 되면 API 비교로 '양쪽이 다 건드린 파일'로 근사한다.
function conflictFilesViaGit(prNum) {
  try {
    // 얕은 체크아웃(Actions 기본 fetch-depth=1)이면 공통 조상이 없어 merge가 거부된다
    const shallow =
      execFileSync("git", ["rev-parse", "--is-shallow-repository"], {
        cwd: ROOT,
        encoding: "utf8",
      }).trim() === "true";
    if (shallow) {
      execFileSync("git", ["fetch", "--unshallow", "origin"], {
        cwd: ROOT,
        stdio: ["ignore", "pipe", "ignore"],
      });
    }
    execFileSync("git", ["fetch", "origin", `refs/pull/${prNum}/head`], {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "ignore"],
    });
    let out = "";
    try {
      // quotePath=false — 한글 경로가 \354\206 옥탯 이스케이프로 나오는 것을 막는다
      out = execFileSync(
        "git",
        ["-c", "core.quotePath=false", "merge-tree", "--write-tree", "origin/main", "FETCH_HEAD"],
        { cwd: ROOT, encoding: "utf8" },
      );
    } catch (e) {
      out = e.stdout?.toString() || ""; // 충돌이 있으면 exit 1이지만 출력은 온다
    }
    const paths = new Set();
    for (const line of out.split("\n")) {
      const m = line.match(/^\d+ [0-9a-f]{40} \d+\t(.+)$/); // "<mode> <sha> <stage>\t<path>"
      if (m) paths.add(m[1].replace(/^"|"$/g, ""));
    }
    return [...paths];
  } catch {
    return null;
  }
}

async function conflictFilesViaApi(headSha, prFiles) {
  try {
    const cmp = await api(`repos/${REPO}/compare/main...${headSha}`);
    const base = cmp?.merge_base_commit?.sha;
    if (!base) return null;
    const side = await api(`repos/${REPO}/compare/${base}...main`);
    const mainChanged = new Set(
      (side?.files || []).flatMap((f) => [f.filename, f.previous_filename].filter(Boolean)),
    );
    const hits = [
      ...new Set(
        (prFiles || [])
          .flatMap((f) => [f.filename, f.previous_filename].filter(Boolean))
          .filter((f) => mainChanged.has(f)),
      ),
    ];
    return hits;
  } catch {
    return null;
  }
}

// 코멘트 작성 주체 로그인 — Actions에서는 github-actions[bot], 로컬 GH_TOKEN 실행에서는
// 그 사용자. 로컬 반복 실행에서도 마커 dedupe가 동작하도록 자기 로그인을 함께 인정한다.
// (GITHUB_TOKEN 같은 앱 토큰은 /user가 403이라 조용히 BOT만 남는다)
let authorLogins = null;
async function authors() {
  if (!authorLogins) {
    authorLogins = new Set([BOT]);
    // gh 인증·토큰·앱 토큰(→403) 어느 쪽이든 실패하면 BOT만 남는다
    const me = await api("user").catch(() => null);
    if (me?.login) authorLogins.add(me.login);
  }
  return authorLogins;
}

async function api(path, { method = "GET", fields = {} } = {}) {
  // 1순위: gh CLI (런너·로컬 공통) — 읽기는 인증 없어도 fetch로 폴백
  const args = ["api", path];
  if (method !== "GET") args.push("-X", method);
  for (const [k, v] of Object.entries(fields)) args.push("-f", `${k}=${v}`);
  try {
    const out = execFileSync("gh", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return out.trim() ? JSON.parse(out) : null;
  } catch (e) {
    if (method !== "GET" && !TOKEN) throw e; // 쓰기는 토큰 필수
    // GET은 공개 레포 무인증 fetch로, 쓰기는 토큰 fetch로 폴백
  }
  const res = await fetch(`https://api.github.com/${path}`, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "eottae-pr-review-bot",
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
      ...(method !== "GET" ? { "Content-Type": "application/json" } : {}),
    },
    body: method !== "GET" ? JSON.stringify(fields) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`GitHub API ${res.status} — ${method} ${path}: ${text.slice(0, 200)}`);
    err.status = res.status;
    throw err;
  }
  return text ? JSON.parse(text) : null;
}

// 페이지네이션 — GitHub 목록 API는 per_page 최대 100이라 첫 페이지만 보면
// 100번째 이후 위치에 민감 파일을 숨겨 자동 승인 검사를 우회할 수 있다.
// key를 주면 {key: [...]} 형태 응답(check-runs)에서 배열을 꺼낸다.
async function apiAll(path, key) {
  const out = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const sep = path.includes("?") ? "&" : "?";
    const data = await api(`${path}${sep}per_page=100&page=${page}`);
    const items = key ? data?.[key] || [] : Array.isArray(data) ? data : [];
    out.push(...items);
    if (items.length < 100) break;
  }
  return out;
}

async function main() {
  const prs = await apiAll(`repos/${REPO}/pulls?state=open`);
  console.log(`열린 PR ${prs.length}건 점검 (${REPO}${DRY ? ", DRY_RUN" : ""})`);

  let approved = 0;
  let merged = 0;
  let commented = 0;

  for (const pr of prs) {
    const n = pr.number;
    const title = `#${n} ${pr.title} (@${pr.user?.login})`;
    try {
      // draft·봇 PR도 끝까지 판정한다 — draft는 머지만 안 하고, 봇 PR은 생성 파일만 허용
      const isDraft = Boolean(pr.draft);
      const isBot = pr.user?.login === BOT;
      if (pr.user?.login?.endsWith("[bot]") && !isBot) {
        console.log(`- ${title}: 외부 봇 PR — 스킵 (사람이 리뷰)`);
        continue;
      }

      // 코멘트 마커는 head sha 기준 — 목록 응답의 sha로 먼저 잡고 상세 조회 후 최신으로 갱신한다
      let sha = pr.head?.sha || "";
      const comments = await apiAll(`repos/${REPO}/issues/${n}/comments`);
      const findMarked = async (cat) => {
        const who = await authors();
        return (comments || []).find(
          (c) =>
            who.has(c.user?.login) &&
            typeof c.body === "string" &&
            c.body.includes(mark(sha, cat)),
        );
      };
      const say = async (cat, body) => {
        const full = `${mark(sha, cat)}\n🤖 PR 리뷰 봇 — ${body}`;
        const existing = await findMarked(cat);
        if (existing && !FORCE) {
          console.log(`- ${title}: '${cat}' 코멘트 이미 존재 — 생략`);
          return false;
        }
        commented++;
        if (DRY) {
          console.log(`- ${title}: [DRY] ${existing ? "코멘트 갱신" : "코멘트"} 예정 — ${cat}`);
          return true;
        }
        if (existing) {
          // FORCE 모드 — 같은 마커의 기존 코멘트를 새 내용으로 갱신(중복 생성 안 함)
          await api(`repos/${REPO}/issues/comments/${existing.id}`, {
            method: "PATCH",
            fields: { body: full },
          });
          console.log(`- ${title}: 코멘트 갱신 (${cat})`);
        } else {
          await api(`repos/${REPO}/issues/${n}/comments`, {
            method: "POST",
            fields: { body: full },
          });
          console.log(`- ${title}: 코멘트 작성 (${cat})`);
        }
        return true;
      };

      // 오래된 열린 PR 리마인드 — 이 sha에 이미 판정 코멘트를 달았는데 일정 기간
      // 변동이 없으면 작성자 핑을 보낸다(sha당 1회). 리마인드 후에도 아래 판정은 계속한다.
      const judged = (comments || []).some(
        (c) =>
          typeof c.body === "string" &&
          c.body.includes(`<!-- pr-review-bot:${sha.slice(0, 10)}`),
      );
      const staleMs = Date.now() - Date.parse(pr.updated_at || "");
      if (judged && Number.isFinite(staleMs) && staleMs > REMIND_MS) {
        const days = Math.floor(staleMs / 86400000);
        await say(
          "remind",
          `**${days}일째 변동 없이 열려 있습니다.** @${pr.user?.login} — 위 코멘트의 조치(충돌 해결·CI 수정·수동 리뷰 요청 등)를 확인하고 push하거나 답글을 남겨 주세요. push하면 자동으로 다시 판정합니다. 더 이상 진행하지 않는 PR이면 닫아 주세요.`,
        );
      }

      // 자동 판정 범위는 main 대상 PR — 다른 base 대상은 방치하지 않고 한 번 안내만 한다
      if (pr.base?.ref !== "main") {
        await say(
          "base",
          `**자동 판정 범위 밖입니다 — base 브랜치가 \`${pr.base?.ref}\`입니다.**\n\n` +
            `이 봇은 **main 대상 PR만** 자동 승인·머지합니다. base를 바꿔야 하면 PR 상단 Edit에서 base를 \`main\`으로 변경하거나, 의도된 base라면 담당 팀원이 직접 리뷰·머지해 주세요.`,
        );
        continue;
      }

      // 상세 조회 — 목록 응답의 mergeable/mergeable_state는 지연 계산(null/unknown)될 수 있다.
      // 상세 GET이 계산을 트리거하고 최신 head sha도 얻는다. null이면 잠시 기다렸다 재조회.
      let detail = await api(`repos/${REPO}/pulls/${n}`);
      for (let i = 0; detail.mergeable === null && i < 2; i++) {
        await sleep(2000);
        detail = await api(`repos/${REPO}/pulls/${n}`);
      }
      // 판정은 이 sha에 대해 한다 — 중간에 새 push가 오면 승인·머지 조건 불일치로 API가 거부한다
      sha = detail.head.sha;

      if (!isBot && !MEMBER_ASSOC.has(detail.author_association)) {
        await say(
          "external",
          `**자동 승인 불가 — 작성자가 저장소 협력자가 아닙니다.**\n\n` +
            table([
              ["작성자 권한", `❌ \`${detail.author_association}\` (@${pr.user?.login}) — OWNER·MEMBER·COLLABORATOR만 자동 승인`],
            ]) +
            `\n\n외부 기여는 코드를 실제로 읽은 팀원의 수동 리뷰가 필요합니다. 승인 전 확인할 것: 실행 가능한 스크립트·외부 URL·환경변수 참조가 숨어 있지 않은지.`,
        );
        continue;
      }

      const [files, reviews] = await Promise.all([
        apiAll(`repos/${REPO}/pulls/${n}/files`),
        apiAll(`repos/${REPO}/pulls/${n}/reviews`),
      ]);
      // rename된 파일은 새 경로(filename)와 옛 경로(previous_filename) 둘 다 검사한다 —
      // filename만 보면 보호 영역 파일을 무해한 이름으로 rename해 스캔을 우회할 수 있다
      const names = (files || []).flatMap((f) =>
        [f.filename, f.previous_filename].filter(Boolean),
      );
      const issues = linkedIssues(detail.body);
      const st = {
        author: isBot ? "✅ team-sync 봇 (자동 생성 PR)" : `✅ 협력자 (@${pr.user?.login})`,
        issue: isBot
          ? "— (봇 PR)"
          : issues.length
            ? `✅ ${issues.join(" ")} — 머지되면 자동으로 닫힘`
            : "ℹ️ 없음 — 본문에 `Closes #이슈번호`를 쓰면 머지 때 이슈가 자동으로 닫힙니다",
      };
      // 사람 승인 — 봇·작성자 본인이 아닌 사람이 이 head sha에 남긴 Approve.
      // 보호 영역 PR의 머지 조건이고, AI 리뷰 판정보다 사람 판단이 우선한다.
      const humanApprovers = [
        ...new Set(
          (reviews || [])
            .filter(
              (r) =>
                r.state === "APPROVED" &&
                r.commit_id === sha &&
                r.user?.type !== "Bot" &&
                r.user?.login !== BOT &&
                r.user?.login !== pr.user?.login,
            )
            .map((r) => `@${r.user.login}`),
        ),
      ];
      const humanOk = humanApprovers.length > 0;

      // 파일 목록이 조회 한계로 잘렸으면 민감 파일 검사를 신뢰할 수 없다 → 수동 리뷰.
      // 잘림 판정은 엔트리 건수(files.length)로 한다 — names는 rename당 2건라 부적합
      if ((files || []).length < (detail.changed_files ?? (files || []).length)) {
        st.scope = `⚠️ 판정 불가 — ${detail.changed_files}개 중 ${(files || []).length}개만 조회됨`;
        await say(
          "scope",
          `**자동 승인 불가 — 변경 파일 전부를 조회하지 못했습니다.**\n\n` +
            statusTable(st) +
            `\n\nAPI 조회 한계를 넘는 대형 PR이라 보이지 않는 파일에 보호 영역 변경이 숨어 있을 수 있습니다. PR을 나눠 다시 올리거나, 민감 파일 포함 여부를 사람이 확인해 주세요.`,
        );
        continue;
      }

      // 봇 PR은 자동 생성 파일만 바꿀 수 있다 — 그 밖의 파일이 섞이면 위반
      if (isBot) {
        const extra = names.filter((f) => !GENERATED.has(f));
        if (extra.length) {
          st.scope = `❌ 자동 생성 파일 외 ${extra.length}개`;
          await say(
            "bot-scope",
            `**규칙 위반 — 봇 PR에 자동 생성 파일이 아닌 변경이 있습니다.**\n\n` +
              statusTable(st) +
              `\n\n**허용 파일:** ${[...GENERATED].map((f) => `\`${f}\``).join(", ")}\n**벗어난 파일:**\n` +
              extra.map((f) => `- \`${f}\``).join("\n") +
              `\n\n**처리:** 자동화가 의도치 않은 파일을 건드렸습니다. 이 PR을 닫고 \`team-sync\` 워크플로를 다시 실행해 주세요.`,
          );
          continue;
        }
        st.scope = "✅ 자동 생성 파일만";
      }

      const protectedFiles = [
        ...new Set(
          names.filter(
            (f) =>
              FORBIDDEN.test(f) ||
              SENSITIVE.test(f) ||
              CODEOWNERS.test(f) ||
              BUILD_CONTROL.test(f) ||
              SECURITY_CODE.test(f) ||
              PIPELINE_TOOLS.has(f),
          ),
        ),
      ];
      if (!isBot) {
        st.scope = protectedFiles.length
          ? humanOk
            ? `✅ ${protectedFiles.length}개 — ${humanApprovers.join(" ")} 승인`
            : `⚠️ ${protectedFiles.length}개 — 사람 승인 필요`
          : `✅ 없음 (${(files || []).length}개 검사)`;
      }
      const protectedList =
        `**보호 영역 파일과 사유:**\n` +
        protectedFiles.map((f) => `- \`${f}\` — ${whyBlocked(f)}`).join("\n");

      // 보안 스캔 — 추가된 줄에서 키·비밀값·위험 패턴. block은 사람 승인이 있어도 막는다
      // (이미 공개 저장소에 올라간 키는 승인으로 되돌릴 수 없다 — 지우고 재발급이 먼저)
      const hits = scanSafety(files);
      const blockHits = hits.filter((h) => h.sev === "block");
      const warnHits = hits.filter((h) => h.sev === "warn");
      const hitLine = (h) => `- \`${h.file}:${h.line}\` — **${h.id}** → ${h.fix}`;
      st.scan = blockHits.length
        ? `❌ 위험 ${blockHits.length}건`
        : warnHits.length
          ? `⚠️ 경고 ${warnHits.length}건 (머지는 막지 않음)`
          : "✅ 문제 없음";
      const warnText = warnHits.length
        ? `\n\n**보안 스캔 경고 (확인 권장):**\n` + warnHits.slice(0, 20).map(hitLine).join("\n")
        : "";
      if (blockHits.length) {
        await say(
          "safety",
          `**규칙 위반 — 보안 스캔에서 위험한 코드가 발견됐습니다.**\n\n` +
            statusTable(st) +
            `\n\n**발견 위치:**\n` +
            blockHits.slice(0, 30).map(hitLine).join("\n") +
            warnText +
            `\n\n**처리:** 위 줄을 고쳐 push하면 자동으로 다시 판정합니다. 키·토큰이 이미 올라갔다면 **커밋에서 지우는 것만으로는 부족합니다** — 공개 저장소라 즉시 노출되므로 해당 키를 폐기·재발급하세요.`,
        );
        continue;
      }

      // 아직 머지 가능 상태 계산 중 — 결과를 모르면 판정하지 않는다
      if (detail.mergeable === null || detail.mergeable_state === "unknown") {
        console.log(`- ${title}: 머지 가능 상태 계산 중(mergeable_state=${detail.mergeable_state}) — 다음 주기 재점검`);
        continue;
      }

      if (detail.mergeable === false || detail.mergeable_state === "dirty") {
        st.merge = `❌ **충돌** (\`${detail.mergeable_state}\`)`;
        if (isBot) {
          // 봇 PR은 사람이 충돌을 풀 필요가 없다 — 다음 team-sync가 최신 main 기준으로 덮어쓴다
          await say(
            "conflict",
            `**자동 생성 PR이 최신 main과 충돌합니다 — 그대로 두면 됩니다.**\n\n` +
              statusTable(st) +
              `\n\n이 PR이 만들어진 뒤 main이 바뀌어 리포트·매니페스트가 낡았습니다. 다음 \`team-sync\` 실행(머지 직후 자동 실행 또는 매주 월요일)이 같은 브랜치를 최신 내용으로 덮어쓰면 자동으로 다시 판정합니다. 급하면 Actions → \`team-sync\` → Run workflow.`,
          );
          continue;
        }
        // 실제 충돌 파일 목록 — git 시험 머지가 정확, 안 되면 API 근사치
        let cfiles = conflictFilesViaGit(n);
        let exact = true;
        if (cfiles === null) {
          cfiles = await conflictFilesViaApi(sha, files);
          exact = false;
        }
        const runsNow = await apiAll(`repos/${REPO}/commits/${sha}/check-runs`, "check_runs").catch(
          () => [],
        );
        const checkNow = runsNow.filter((r) => r.name === "check");
        st.ci = !checkNow.length
          ? "⚠️ 기록 없음 — GitHub은 충돌이 있는 PR에 CI를 돌리지 않습니다"
          : checkNow.some((r) => r.status !== "completed")
            ? "⏳ 진행 중"
            : checkNow.every((r) => ["success", "skipped", "neutral"].includes(r.conclusion))
              ? "✅ 통과"
              : "❌ 실패 — 충돌 해결과 별개로 수정 필요";
        await say(
          "conflict",
          `**main과 머지 충돌이 있어 자동 머지할 수 없습니다.**\n\n` +
            statusTable(st) +
            (cfiles?.length
              ? `\n\n**충돌${exact ? "" : " 추정"} 파일 (${cfiles.length}개):**\n` +
                cfiles.map((f) => `- \`${f}\``).join("\n")
              : `\n\n충돌 파일 목록을 추출하지 못했습니다 — 로컬에서 \`git merge origin/main\`을 실행하면 충돌 위치가 표시됩니다.`) +
            `\n\n**해결 방법 (택 1):**\n` +
            "```bash\n" +
            "# A. 최신 main을 이 브랜치에 머지\n" +
            `git checkout ${detail.head.ref}\n` +
            "git fetch origin\n" +
            "git merge origin/main          # <<<<< 표시된 충돌 수정\n" +
            "git add <해결한 파일>\n" +
            "git commit\n" +
            "git push\n\n" +
            "# B. 리베이스 (커밋 이력을 최신 main 위로)\n" +
            `git checkout ${detail.head.ref}\n` +
            "git fetch origin\n" +
            "git rebase origin/main         # 충돌 해결 → git add → git rebase --continue\n" +
            "git push --force-with-lease\n" +
            "```\n" +
            `push되면 빌드·AI 리뷰를 다시 돌리고 자동으로 재판정합니다.` +
            (protectedFiles.length ? `\n\n${protectedList}` : ""),
        );
        continue;
      }
      st.merge = `✅ \`${detail.mergeable_state}\``;

      // 'behind'를 포함해 mergeable이면 여기까지 진행 — behind는 head sha의 CI를 그대로 쓰고
      // 머지를 시도한다. update-branch로 main을 머지하면 GITHUB_TOKEN push라 CI가 재실행되지
      // 않아 새 sha에 check가 영원히 없어지므로(고착) 갱신 단계를 두지 않는다.
      // "최신화 요구" 보호 규칙이 켜져 있으면 아래 merge API가 거부 → 사람에게 넘긴다.

      // ci.yml 잡 이름은 'check' — head sha의 check-run 중 이 이름만 본다.
      // 'check'가 없으면 미실행으로 본다 — 다른 워크플로의 성공으로 대체 판정하지 않는다.
      const runs = (await apiAll(`repos/${REPO}/commits/${sha}/check-runs`, "check_runs")).filter(
        (r) => r.name === "check",
      );
      // team-sync 봇 PR은 GITHUB_TOKEN push라 ci.yml이 돌지 않는다 — 대신 team-sync 잡이 같은
      // 빌드(npm ci→typecheck→build)를 돌리고 커밋 상태 `check`를 남긴다. 봇 PR에만 이를 인정한다.
      if (isBot && !runs.length) {
        const s = (await apiAll(`repos/${REPO}/commits/${sha}/statuses`).catch(() => [])).find(
          (x) => x.context === "check" && x.creator?.login === BOT,
        );
        if (s && s.state !== "pending") {
          runs.push({
            status: "completed",
            conclusion: s.state === "success" ? "success" : "failure",
            html_url: s.target_url || `https://github.com/${REPO}/commit/${sha}`,
          });
        }
      }
      const commit = await api(`repos/${REPO}/commits/${sha}`).catch(() => null);
      const pushedAt = Date.parse(commit?.commit?.committer?.date || "") || Date.now();
      const minutes = Math.round((Date.now() - pushedAt) / 60000);
      if (!runs.length) {
        // push 직후 check-run 등록 지연과 구분하기 위해 커밋 시각으로 유예를 둔다.
        // 유예를 넘겨도 없으면 CI가 안 도는 것 — 사람이 재push/확인해야 한다.
        if (Date.now() - pushedAt > CI_GRACE_MS) {
          st.ci = `❌ check-run 미등록 (커밋 후 ${minutes}분 경과)`;
          await say(
            "ci-missing",
            `**자동 승인 불가 — 필수 빌드 CI(\`check\`) 기록이 없습니다.**\n\n` +
              statusTable(st) +
              `\n\n**가능한 원인:**\n` +
              `- push가 워크플로를 트리거하지 못함(봇 계정 push·Actions 비활성)\n` +
              `- ci.yml이 이 브랜치/main에 없거나 구문 오류로 시작 실패\n\n` +
              `**처리:** 최신 커밋을 다시 push하거나, Actions 탭에서 \`ci\` 워크플로가 이 커밋(\`${sha.slice(0, 7)}\`)에서 실행됐는지 확인해 주세요.`,
          );
        } else {
          console.log(`- ${title}: CI(check) 미등록(유예 중) — 다음 주기에 재점검`);
        }
        continue;
      }
      if (runs.some((r) => r.status !== "completed")) {
        console.log(`- ${title}: CI(check) 진행 중 — 다음 주기에 재점검`);
        continue;
      }
      const failed = runs.filter(
        (r) => !["success", "skipped", "neutral"].includes(r.conclusion),
      );
      if (failed.length) {
        st.ci = `❌ ${failed.map((r) => `\`${r.conclusion}\``).join(", ")}`;
        await say(
          "ci-fail",
          `**자동 승인 불가 — 빌드 CI(\`check\`: npm ci → typecheck → build) 실패.**\n\n` +
            statusTable(st) +
            `\n\n**실패한 잡 로그:**\n` +
            failed.map((r) => `- [check — ${r.conclusion}](${r.html_url})`).join("\n") +
            `\n\n**로컬 재현 절차:**\n` +
            "```bash\n" +
            "cd \"0. 소스코드/eottae-web\"\n" +
            "npm ci\n" +
            "npm run typecheck\n" +
            "npm run build\n" +
            "```\n" +
            `로그에서 실패한 단계의 오류를 수정해 push하면 자동으로 재판정합니다.`,
        );
        continue;
      }
      st.ci = "✅ 통과 (npm ci → typecheck → build)";

      // AI 코드 리뷰 게이트 — tools/ai_code_review.mjs가 head sha에 남긴 커밋 상태 `ai-review`.
      // 봇 PR(생성 파일만)은 리뷰할 코드가 없어 제외. 사람 승인이 있으면 사람 판단이 우선한다.
      if (!isBot) {
        const statuses = await apiAll(`repos/${REPO}/commits/${sha}/statuses`).catch(() => []);
        const ai = statuses.find((s) => s.context === AI_CONTEXT); // 최신순 정렬
        const aiLink = ai?.target_url ? ` ([세션](${ai.target_url}))` : "";
        if (!ai || ai.state === "pending") {
          if (humanOk) {
            st.ai = `⏭️ ${ai ? "진행 중" : "기록 없음"} — 사람 승인(${humanApprovers.join(" ")})으로 대체`;
          } else if (Date.now() - pushedAt > AI_GRACE_MS) {
            st.ai = `❌ ${ai ? "진행 중에서 멈춤" : "기록 없음"} (커밋 후 ${minutes}분)`;
            await say(
              "ai-missing",
              `**자동 승인 불가 — AI 코드 리뷰 결과가 없습니다.**\n\n` +
                statusTable(st) +
                `\n\n**처리:** 이 PR에 \`/ai-review\` 댓글을 달면 다시 리뷰합니다. 계속 실패하면 담당자가 직접 코드를 읽고 Approve해 주세요 — 사람 승인이 있으면 머지됩니다.`,
            );
            continue;
          } else {
            console.log(`- ${title}: AI 리뷰 ${ai ? "진행 중" : "대기"} — 다음 주기에 재점검`);
            continue;
          }
        } else if (ai.state !== "success") {
          if (humanOk) {
            st.ai = `⚠️ ${ai.state === "failure" ? "수정 필요" : "오류"}였으나 ${humanApprovers.join(" ")} 승인으로 진행${aiLink}`;
          } else {
            const fail = ai.state === "failure";
            st.ai = fail ? `❌ 수정 필요${aiLink}` : `❌ 오류 — ${ai.description || ""}${aiLink}`;
            await say(
              fail ? "ai-fail" : "ai-error",
              (fail
                ? `**자동 승인 불가 — AI 코드 리뷰에서 수정이 필요하다고 판정했습니다.**\n\n`
                : `**자동 승인 불가 — AI 코드 리뷰를 끝내지 못했습니다.**\n\n`) +
                statusTable(st) +
                (fail
                  ? `\n\n**처리:** 위 「AI 코드 리뷰」 코멘트의 **반드시 고칠 것**을 수정해 push하면 다시 리뷰합니다. 판정이 틀렸다고 보면 담당자가 코드를 확인하고 Approve하세요 — 사람 승인이 우선합니다.`
                  : `\n\n**처리:** 이 PR에 \`/ai-review\` 댓글을 달면 다시 리뷰합니다.`),
            );
            continue;
          }
        } else {
          st.ai = `✅ 통과${aiLink}`;
        }
      } else {
        st.ai = "— (자동 생성 파일만 — 리뷰 대상 없음)";
      }

      // 보호 영역 — 다른 검사는 다 통과했으니 사람 승인만 남았다
      if (protectedFiles.length && !humanOk) {
        await say(
          "scope",
          `**사람 승인 대기 — 보호 영역 파일이 포함돼 있습니다 (다른 검사는 모두 통과).**\n\n` +
            statusTable(st) +
            `\n\n${protectedList}` +
            warnText +
            `\n\n**처리:** 담당자(작성자 본인 제외)가 변경을 확인하고 **Approve**하면 봇이 바로 머지합니다. 저장소 관리자는 관리자 권한으로 머지할 수도 있습니다. 보호 영역 변경을 빼고 별도 PR로 나누면 나머지는 자동 판정됩니다.`,
        );
        continue;
      }

      // draft — 판정만 하고 머지하지 않는다
      if (isDraft) {
        await say(
          "draft",
          `**Draft PR 판정 — 지금 상태로 머지 조건을 모두 충족합니다.**\n\n` +
            statusTable(st) +
            warnText +
            `\n\n「Ready for review」로 바꾸면 봇이 승인하고 자동 머지합니다. 더 작업할 게 있으면 push할 때마다 다시 판정합니다.`,
        );
        continue;
      }

      // 전부 통과 — 승인(이 sha에 이미 승인했으면 건너뜀). 봇 PR은 자기 승인이 불가능하다
      const approvedOnSha = (reviews || []).some(
        (r) => r.user?.login === BOT && r.state === "APPROVED" && r.commit_id === sha,
      );
      if (!isBot && !approvedOnSha) {
        approved++;
        if (!DRY) {
          await api(`repos/${REPO}/pulls/${n}/reviews`, {
            method: "POST",
            fields: {
              event: "APPROVE",
              // 승인을 판정한 head에 고정 — GitHub은 옛 commit_id를 거부하지 않고 stale 리뷰로
              // 기록하므로, 새 push 차단의 실제 게이트는 아래 merge의 sha 조건이다
              commit_id: sha,
              body: `🤖 PR 리뷰 봇 — **모든 검사 통과, 자동 승인합니다.**\n\n` + statusTable(st) + warnText,
            },
          });
        }
        console.log(`- ${title}: 승인`);
      } else {
        console.log(`- ${title}: ${isBot ? "봇 PR — 승인 없이" : "이미 승인됨 —"} 머지 단계로`);
      }

      try {
        if (DRY) {
          console.log(`- ${title}: [DRY] squash 머지 예정`);
          merged++;
          continue;
        }
        await api(`repos/${REPO}/pulls/${n}/merge`, {
          method: "PUT",
          fields: {
            merge_method: "squash",
            commit_title: `${pr.title} (#${n})`,
            sha, // 판정한 head와 다르면(중간에 새 push) GitHub이 머지를 거부한다
          },
        });
        merged++;
        console.log(`- ${title}: 머지 완료`);
      } catch (e) {
        st.merge += ` · 자동 머지 ❌ API 거부 (${e.status || "오류"})`;
        await say(
          "await-merge",
          (isBot
            ? `**검사 통과 — 봇이 만든 PR은 봇이 스스로 승인할 수 없어 사람 승인 1번이 필요합니다.**\n\n`
            : `**승인 완료 — 자동 머지는 GitHub이 거부했습니다.**\n\n`) +
            statusTable(st) +
            (isBot
              ? `\n\n**처리:** 저장소 관리자나 팀원이 이 PR을 **Approve**하면 봇이 바로 머지합니다.`
              : `\n\n**가능한 원인:** CODEOWNERS 지정 리뷰어 승인 요구 · '브랜치 최신화 필수' 보호 규칙 · 판정과 머지 사이 새 push.` +
                `\n\n조건이 충족되면 다음 점검에서 다시 시도합니다 — 급하면 보호 규칙을 충족한 뒤 사람이 머지 버튼을 눌러 주세요.`),
        );
      }
    } catch (e) {
      console.log(`- ${title}: 처리 오류 — ${e.message}`);
    }
  }

  // 머지된 PR이 있으면 배포·리포트 파이프라인을 수동 트리거
  // (GITHUB_TOKEN으로 한 머지는 push 이벤트를 발생시키지 않는다)
  if (merged > 0 && !DRY) {
    for (const wf of ["deploy-pages.yml", "team-sync.yml"]) {
      await api(`repos/${REPO}/actions/workflows/${wf}/dispatches`, {
        method: "POST",
        fields: { ref: "main" },
      }).catch((e) => console.log(`! ${wf} dispatch 실패: ${e.message}`));
    }
    console.log("deploy-pages·team-sync dispatch 완료");
  }

  console.log(`완료 — 승인 ${approved}건, 머지 ${merged}건, 코멘트 ${commented}건`);
}

main().catch((e) => {
  console.error(`치명 오류: ${e.message}`);
  if (e.status === 403 || e.status === 429) {
    console.error("힌트: GH_TOKEN(또는 gh 로그인)을 설정하면 인증 한도로 조회한다 — 비인증은 시간당 60회 제한");
  }
  // process.exit()는 진행 중인 fetch 소켓 정리를 끊어 Windows에서 libuv assert로 죽는다
  process.exitCode = 1;
});
