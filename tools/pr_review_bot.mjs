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
const MAX_PAGES = 30; // 목록 페이지네이션 상한 (3000건 — GitHub PR 파일 표시 한도와 동일)
// push 직후에는 check-run 등록이 지연될 수 있다 — 이 시간을 넘겨도 check가 없으면
// CI가 안 도는 것으로 보고 작성자에게 코멘트한다 (봇이 올린 head에는 check가 영원히 없다)
const CI_GRACE_MS = 30 * 60 * 1000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 같은 커밋에 같은 종류의 코멘트를 반복하지 않기 위한 마커
const mark = (sha, cat) => `<!-- pr-review-bot:${sha.slice(0, 10)}:${cat} -->`;

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
      const already = async (cat) => {
        const who = await authors();
        return (comments || []).some(
          (c) =>
            who.has(c.user?.login) &&
            typeof c.body === "string" &&
            c.body.includes(mark(sha, cat)),
        );
      };
      const say = async (cat, body) => {
        if (await already(cat)) {
          console.log(`- ${title}: '${cat}' 코멘트 이미 존재 — 생략`);
          return false;
        }
        commented++;
        if (DRY) {
          console.log(`- ${title}: [DRY] 코멘트 예정 — ${cat}`);
          return true;
        }
        await api(`repos/${REPO}/issues/${n}/comments`, {
          method: "POST",
          fields: { body: `${mark(sha, cat)}\n🤖 PR 리뷰 봇 — ${body}` },
        });
        console.log(`- ${title}: 코멘트 작성 (${cat})`);
        return true;
      };

      // 자동 판정 범위는 main 대상 PR — 다른 base 대상은 방치하지 않고 한 번 안내만 한다
      if (pr.base?.ref !== "main") {
        await say(
          "base",
          `이 봇은 main 브랜치 대상 PR만 자동 승인·머지합니다(base: \`${pr.base?.ref}\`). 이 PR은 담당 팀원이 직접 리뷰·머지해 주세요.`,
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
          `작성자가 팀 협력자가 아니라 자동 승인하지 않습니다(association=${detail.author_association}). 팀원이 내용을 확인해 주세요.`,
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
          `변경 파일이 ${detail.changed_files}개라 전부 조회하지 못했습니다 — 민감 파일 포함 여부를 사람이 확인해 주세요.`,
        );
        continue;
      }

      const blocked = names.filter(
        (f) =>
          FORBIDDEN.test(f) ||
          SENSITIVE.test(f) ||
          CODEOWNERS.test(f) ||
          BUILD_CONTROL.test(f) ||
          PIPELINE_TOOLS.has(f),
      );
      if (blocked.length) {
        await say(
          "scope",
          `민감 영역 파일이 포함돼 자동 승인하지 않습니다: \`${blocked.join("`, `")}\`. 파이프라인·빌드 설정·리뷰 정책·환경설정·키 관련 변경은 담당자 수동 리뷰가 필요합니다.`,
        );
        continue;
      }

      // 아직 머지 가능 상태 계산 중 — 결과를 모르면 판정하지 않는다
      if (detail.mergeable === null || detail.mergeable_state === "unknown") {
        console.log(`- ${title}: 머지 가능 상태 계산 중(mergeable_state=${detail.mergeable_state}) — 다음 주기 재점검`);
        continue;
      }

      if (detail.mergeable === false || detail.mergeable_state === "dirty") {
        await say(
          "conflict",
          `main과 머지 충돌이 있습니다. 최신 main을 머지하거나 리베이스해서 충돌을 해결한 뒤 push 해주세요.`,
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
            `CI(\`check\`) 기록이 없습니다. ci.yml은 main 대상 PR의 push에서 자동 실행됩니다 — 최신 커밋을 다시 push하거나 Actions 탭에서 워크플로 실행 여부를 확인해 주세요.`,
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
          `CI 실패: ${failed.map((r) => `\`${r.name}\``).join(", ")}. 로컬에서 \`npm ci\` → \`npm run typecheck\` → \`npm run build\`로 재현 확인 후 push 해주세요.`,
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
              body: "🤖 PR 리뷰 봇 — CI 통과·머지 충돌 없음·민감 파일 미포함을 확인해 승인합니다.",
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
          `승인은 완료됐지만 자동 머지가 거부됐습니다 — 보호 규칙(CODEOWNERS 리뷰·브랜치 최신화 요구 등) 또는 판정 중 새 push 때문일 수 있습니다. 조건이 충족되면 다음 점검에서 다시 판정하거나 사람이 머지해 주세요. (${e.status || "오류"})`,
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
