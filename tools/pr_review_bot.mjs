// 「어때?」 PR 리뷰 봇 — 열린 PR을 점검해 괜찮으면 승인·머지, 문제면 코멘트를 단다.
//
// 주기 실행: .github/workflows/pr-review.yml (2시간 주기 + Actions 탭 수동 실행)
// 로컬 수동 실행: node tools/pr_review_bot.mjs
//   GH_TOKEN/GITHUB_TOKEN 필요, 저장소는 GITHUB_REPOSITORY에서 감지
//   DRY_RUN=1 이면 조회·판정만 하고 쓰기(코멘트/승인/머지)는 전부 건너뛴다
//
// 판정 규칙 (보수적 — 애매하면 사람에게 넘긴다):
//   0. base가 main이 아닌 PR → 자동 판정 범위 밖, 안내 코멘트(sha당 1회)
//   1. 드래프트 PR, 봇이 연 PR(자기 승인 불가) → 조용히 스킵
//   2. 외부 비협력자(OWNER/MEMBER/COLLABORATOR 아님) → 사람 확인 요청 코멘트
//   3. .github/ 전체·임의 위치 CODEOWNERS·스케줄 잡이 실행하는 자동화 스크립트·
//      패키지/빌드 설정·환경설정/키 파일 변경 → 자동 승인 금지, 수동 리뷰 요청 코멘트
//      (진입점 스크립트만 막으면 package.json postinstall·next.config 한 줄로 같은 우회)
//      rename된 파일은 옛 경로(previous_filename)도 함께 검사 — filename만 보면
//      '.github/workflows/x.yml' → 'x.yml' rename으로 보호 영역 삭제를 숨길 수 있다
//   4. 머지 가능 상태 계산 중(mergeable null/unknown) → 이번 라운드 보류
//      (목록 API 응답은 지연 계산된 값일 수 있어 PR 상세를 따로 조회한다)
//   5. main과 머지 충돌 → 충돌 해결 요청 코멘트
//   6. behind 상태 → 별도 갱신 없이 그대로 머지 진행. head sha의 CI는 작성자 push 때
//      이미 검증됐고, "최신화 요구" 보호 규칙이 켜져 있으면 merge API가 거부해
//      자연히 사람에게 넘어간다. update-branch(main을 PR에 머지)는 쓰지 않는다 —
//      GITHUB_TOKEN으로 한 갱신 push는 pull_request 워크플로를 트리거하지 못해
//      새 sha에 check가 영원히 없는 고착 상태를 만들고, check가 필수 상태면
//      사람의 머지 버튼까지 막힌다.
//   7. 'check' check-run 없음 → push 직후 등록 지연을 고려해 커밋 시각 기준 유예 후에도
//      없으면 안내 코멘트. 진행 중이면 조용히 다음 주기.
//      (다른 워크플로의 성공만으로 필수 CI를 대체 판정하지 않는다)
//   8. check-run 실패 → 실패 안내 코멘트
//   9. 전부 통과 → 승인(sha별 1회, commit_id 고정) + squash 머지 시도.
//      머지는 판정한 head sha를 조건으로 걸어 중간에 새 push가 오면 API가 거부한다
//      (승인의 commit_id는 거부되지 않고 stale 리뷰로 기록된다 — 차단은 머지 가드가 담당).
//      CODEOWNERS 등 보호 규칙에 막히면 "승인 완료·사람 머지 필요" 코멘트
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
]);
// 인증·DB·RLS 보안 코드 (ADR-005) — CI는 동작 여부만 보고 '안전한지'는 못 본다.
// 위조 가능한 세션 서명·하드코딩 키가 CI 통과만으로 자동 머지된 사례(#24) 이후 사람 리뷰 필수.
const SECURITY_CODE =
  /^0\. 소스코드\/eottae-web\/(supabase\/|src\/lib\/(server|auth|supabase)\/|src\/app\/api\/)/;
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
      if (pr.draft) {
        console.log(`- ${title}: draft — 스킵`);
        continue;
      }
      if (pr.user?.login?.endsWith("[bot]")) {
        console.log(`- ${title}: 봇 작성 PR — 스킵 (자기 승인 불가)`);
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

      if (!MEMBER_ASSOC.has(detail.author_association)) {
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

      // 파일 목록이 조회 한계로 잘렸으면 민감 파일 검사를 신뢰할 수 없다 → 수동 리뷰.
      // 잘림 판정은 엔트리 건수(files.length)로 한다 — names는 rename당 2건라 부적합
      if ((files || []).length < (detail.changed_files ?? (files || []).length)) {
        await say(
          "scope",
          `**자동 승인 불가 — 변경 파일 전부를 조회하지 못했습니다.**\n\n` +
            table([
              ["작성자 권한", `✅ 협력자 (@${pr.user?.login})`],
              ["민감 파일", `⚠️ 판정 불가 — ${detail.changed_files}개 중 ${(files || []).length}개만 조회됨`],
            ]) +
            `\n\nAPI 조회 한계를 넘는 대형 PR이라 보이지 않는 파일에 보호 영역 변경이 숨어 있을 수 있습니다. 민감 파일 포함 여부를 사람이 확인해 주세요.`,
        );
        continue;
      }

      const blocked = names.filter(
        (f) =>
          FORBIDDEN.test(f) ||
          SENSITIVE.test(f) ||
          CODEOWNERS.test(f) ||
          BUILD_CONTROL.test(f) ||
          SECURITY_CODE.test(f) ||
          PIPELINE_TOOLS.has(f),
      );
      if (blocked.length) {
        await say(
          "scope",
          `**자동 승인 불가 — 보호 영역 파일이 포함돼 있습니다.**\n\n` +
            table([
              ["작성자 권한", `✅ 협력자 (@${pr.user?.login})`],
              ["민감 파일", `❌ ${blocked.length}개 발견`],
              ["머지 가능성", "⏸️ 미검사"],
              ["CI `check`", "⏸️ 미검사"],
            ]) +
            `\n\n**걸린 파일과 사유:**\n` +
            [...new Set(blocked)].map((f) => `- \`${f}\` — ${whyBlocked(f)}`).join("\n") +
            `\n\n**처리 방법:** 이 파일들은 자동화 우회·시크릿 유출을 막기 위해 사람만 승인할 수 있습니다. ` +
            `① 의도된 변경이면 담당자 수동 리뷰를 요청하거나, ② 해당 파일 변경을 이 PR에서 빼고 별도 PR로 분리하면 나머지는 자동 판정됩니다.`,
        );
        continue;
      }

      // 아직 머지 가능 상태 계산 중 — 결과를 모르면 판정하지 않는다
      if (detail.mergeable === null || detail.mergeable_state === "unknown") {
        console.log(`- ${title}: 머지 가능 상태 계산 중(mergeable_state=${detail.mergeable_state}) — 다음 주기 재점검`);
        continue;
      }

      if (detail.mergeable === false || detail.mergeable_state === "dirty") {
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
        const ciState = !checkNow.length
          ? "⚠️ 기록 없음 — push 후 등록 지연이면 다음 점검에서 확인"
          : checkNow.some((r) => r.status !== "completed")
            ? "⏳ 진행 중"
            : checkNow.every((r) => ["success", "skipped", "neutral"].includes(r.conclusion))
              ? "✅ 통과"
              : "❌ 실패 — 충돌 해결과 별개로 수정 필요";
        await say(
          "conflict",
          `**main과 머지 충돌이 있어 자동 머지할 수 없습니다.**\n\n` +
            table([
              ["작성자 권한", `✅ 협력자 (@${pr.user?.login})`],
              ["민감 파일", `✅ 없음 (${(files || []).length}개 검사)`],
              ["머지 가능성", `❌ **충돌** (\`${detail.mergeable_state}\`)`],
              ["CI `check`", ciState],
            ]) +
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
            `push되면 다음 점검에서 자동으로 다시 판정합니다.`,
        );
        continue;
      }

      // 'behind'를 포함해 mergeable이면 여기까지 진행 — behind는 head sha의 CI를 그대로 쓰고
      // 머지를 시도한다. update-branch로 main을 머지하면 GITHUB_TOKEN push라 CI가 재실행되지
      // 않아 새 sha에 check가 영원히 없어지므로(고착) 갱신 단계를 두지 않는다.
      // "최신화 요구" 보호 규칙이 켜져 있으면 아래 merge API가 거부 → 사람에게 넘긴다.

      // ci.yml 잡 이름은 'check' — head sha의 check-run 중 이 이름만 본다.
      // 'check'가 없으면 미실행으로 본다 — 다른 워크플로의 성공으로 대체 판정하지 않는다.
      const runs = (await apiAll(`repos/${REPO}/commits/${sha}/check-runs`, "check_runs")).filter(
        (r) => r.name === "check",
      );
      if (!runs.length) {
        // push 직후 check-run 등록 지연과 구분하기 위해 커밋 시각으로 유예를 둔다.
        // 유예를 넘겨도 없으면 CI가 안 도는 것 — 사람이 재push/확인해야 한다.
        const commit = await api(`repos/${REPO}/commits/${sha}`).catch(() => null);
        const pushedAt = Date.parse(commit?.commit?.committer?.date || "") || Date.now();
        if (Date.now() - pushedAt > CI_GRACE_MS) {
          await say(
            "ci-missing",
            `**자동 승인 불가 — 필수 CI(\`check\`) 기록이 없습니다.**\n\n` +
              table([
                ["작성자 권한", `✅ 협력자 (@${pr.user?.login})`],
                ["민감 파일", `✅ 없음 (${(files || []).length}개 검사)`],
                ["머지 가능성", "✅ 충돌 없음"],
                ["CI `check`", `❌ check-run 미등록 (커밋 후 ${Math.round((Date.now() - pushedAt) / 60000)}분 경과)`],
              ]) +
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
        await say(
          "ci-fail",
          `**자동 승인 불가 — CI(\`check\`) 실패.**\n\n` +
            table([
              ["작성자 권한", `✅ 협력자 (@${pr.user?.login})`],
              ["민감 파일", `✅ 없음 (${(files || []).length}개 검사)`],
              ["머지 가능성", "✅ 충돌 없음"],
              ["CI `check`", `❌ ${failed.map((r) => `\`${r.conclusion}\``).join(", ")}`],
            ]) +
            `\n\n**실패한 잡 로그:**\n` +
            failed.map((r) => `- [check — ${r.conclusion}](${r.html_url})`).join("\n") +
            `\n\n**로컬 재현 절차:**\n` +
            "```bash\n" +
            "cd \"0. 소스코드/eottae-web\"\n" +
            "npm ci\n" +
            "npm run typecheck\n" +
            "npm run build\n" +
            "```\n" +
            `로그에서 실패한 단계의 오류를 수정해 push하면 다음 점검에서 자동 재판정합니다.`,
        );
        continue;
      }

      // 전부 통과 — 승인(이 sha에 이미 승인했으면 건너뜀)
      const approvedOnSha = (reviews || []).some(
        (r) => r.user?.login === BOT && r.state === "APPROVED" && r.commit_id === sha,
      );
      if (!approvedOnSha) {
        approved++;
        if (!DRY) {
          await api(`repos/${REPO}/pulls/${n}/reviews`, {
            method: "POST",
            fields: {
              event: "APPROVE",
              // 승인을 판정한 head에 고정 — GitHub은 옛 commit_id를 거부하지 않고 stale 리뷰로
              // 기록하므로, 새 push 차단의 실제 게이트는 아래 merge의 sha 조건이다
              commit_id: sha,
              body:
                `🤖 PR 리뷰 봇 — **자동 승인합니다.**\n\n` +
                table([
                  ["작성자 권한", `✅ 협력자 (@${pr.user?.login}, ${detail.author_association})`],
                  ["민감 파일", `✅ 없음 (${(files || []).length}개 파일 검사)`],
                  ["머지 가능성", `✅ \`${detail.mergeable_state}\``],
                  ["CI `check`", "✅ 통과"],
                ]) +
                `\n\n코드 품질 리뷰는 Devin 세션(eottae-pr-watch)에서 별도 진행됩니다.`,
            },
          });
        }
        console.log(`- ${title}: 승인`);
      } else {
        console.log(`- ${title}: 이미 승인됨 — 머지 단계로`);
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
        await say(
          "await-merge",
          `**승인 완료 — 자동 머지는 GitHub이 거부했습니다.**\n\n` +
            table([
              ["작성자 권한", `✅ 협력자 (@${pr.user?.login})`],
              ["민감 파일", `✅ 없음 (${(files || []).length}개 검사)`],
              ["머지 가능성", `✅ \`${detail.mergeable_state}\``],
              ["CI `check`", "✅ 통과"],
              ["자동 머지", `❌ API 거부 (${e.status || "오류"})`],
            ]) +
            `\n\n**가능한 원인:** CODEOWNERS 지정 리뷰어 승인 요구 · '브랜치 최신화 필수' 보호 규칙 · 판정과 머지 사이 새 push.` +
            `\n\n조건이 충족되면 다음 점검에서 다시 시도합니다 — 급하면 보호 규칙을 충족한 뒤 사람이 머지 버튼을 눌러 주세요.`,
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
