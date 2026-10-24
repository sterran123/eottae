// 「어때?」 Devin PR 자동화 등록기 — Devin v3 Automations API로 2개 자동화를 만든다.
//
//   1) eottae-pr-watch    — 2시간 주기 스케줄 + github:pull_request 이벤트
//                          (opened·synchronize·reopened·ready_for_review) 실시간 트리거로
//                          열린 PR 점검 세션 실행. 이벤트 실행은 페이로드의 PR 하나만 본다.
//   2) eottae-pr-mentions — github:issue_comment·pull_request_review_comment 이벤트에서
//                          mentioned=true(@devin 멘션)일 때만 세션 실행, post_response로
//                          해당 댓글 스레드에 자동 답글. 응답 전용 — 승인·머지는 안 한다.
//
// 사용: node tools/devin_pr_watch.mjs
//   필요 환경변수:
//     DEVIN_API_KEY  — app.devin.ai > Settings > Devin API > Service users 탭에서
//                      발급한 서비스 사용자 키(ManageOrgAutomations 권한 역할 필요)
//                      또는 같은 권한의 개인 액세스 토큰
//     DEVIN_ORG_ID   — 같은 페이지 상단의 조직 ID (org-*)
//   ※ 두 값을 셸 환경변수 대신 루트 .env 또는 .devin/.env에 적어도 된다
//     (gitignore·매니페스트 제외 파일이라 커밋되지 않는다)
//   선택: INTERVAL_HOURS(기본 2), RUN_AS(organization|creator, 기본 자동 감지),
//         DRY_RUN=1(페이로드만 출력), UPDATE=1(같은 이름 자동화가 있으면 트리거·프롬프트 갱신)
//
// 키가 없으면? — 스크립트가 페이로드와 함께 UI 등록 절차를 출력한다.
//   app.devin.ai > Automations > Create automation에서 같은 트리거를 수동으로 만들면 된다.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// .env 자동 로드 — 루트 .env 또는 .devin/.env(gitignore·매니페스트 제외 대상)에서
// DEVIN_API_KEY/DEVIN_ORG_ID를 읽는다. 이미 잡힌 환경변수가 우선.
for (const envPath of [join(ROOT, ".env"), join(ROOT, ".devin", ".env")]) {
  if (!existsSync(envPath)) continue;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_]\w*)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

const PROMPT_DIR = join(ROOT, ".devin", "automations");
const API = "https://api.devin.ai/v3";
const REPO = "sterran123/eottae";

const INTERVAL = Math.max(1, Number(process.env.INTERVAL_HOURS || 2) || 2);
const RRULE = `FREQ=HOURLY;INTERVAL=${INTERVAL}`;
const TOKEN = process.env.DEVIN_API_KEY || process.env.DEVIN_TOKEN || "";
const ORG = process.env.DEVIN_ORG_ID || process.env.DEVIN_ORG || "";
const DRY = process.env.DRY_RUN === "1";

// 트리거 조건 공통 조각 — 이 저장소로 범위를 고정한다
const thisRepo = { field: "repository.full_name", operator: "eq", value: REPO };

const AUTOMATIONS = [
  {
    name: "eottae-pr-watch",
    file: "eottae-pr-watch.md",
    purpose: "periodic-and-realtime-pr-review",
    triggers: [
      {
        event_type: "schedule:recurring",
        conditions: {
          any: [{ all: [{ field: "rrule", operator: "recurrence", value: RRULE }] }],
        },
      },
      {
        // PR 생성·새 push·리뷰 전환 즉시 세션 — 스케줄 사이 공백을 실시간으로 메운다
        event_type: "github:pull_request",
        conditions: {
          any: [
            {
              all: [
                thisRepo,
                {
                  field: "action",
                  operator: "in",
                  value: ["opened", "synchronize", "reopened", "ready_for_review"],
                },
              ],
            },
          ],
        },
      },
    ],
  },
  {
    name: "eottae-pr-mentions",
    file: "eottae-pr-mentions.md",
    purpose: "mention-reply",
    // mentioned=true — 본문이 Devin 명령 접두사로 시작하는 댓글만. 모든 댓글에 반응하면
    // 세션 비용이 늘고 봇끼리 답글을 주고받는 루프가 생길 수 있다.
    triggers: [
      {
        event_type: "github:issue_comment",
        conditions: {
          any: [
            {
              all: [
                thisRepo,
                { field: "action", operator: "in", value: ["created", "edited"] },
                { field: "mentioned", operator: "eq", value: true },
              ],
            },
          ],
        },
        replies: [{ type: "post_response" }],
      },
      {
        event_type: "github:pull_request_review_comment",
        conditions: {
          any: [
            {
              all: [
                thisRepo,
                { field: "action", operator: "in", value: ["created", "edited"] },
                { field: "mentioned", operator: "eq", value: true },
              ],
            },
          ],
        },
        replies: [{ type: "post_response" }],
      },
    ],
  },
];

// 프롬프트 원본 파일에서 '---' 구분선 이후 본문만 추출한다 (앞부분은 사람용 안내 헤더)
function loadPrompt(file) {
  const raw = readFileSync(join(PROMPT_DIR, file), "utf8");
  const idx = raw.indexOf("\n---\n");
  return (idx >= 0 ? raw.slice(idx + 5) : raw).trim();
}

async function req(path, { method = "GET", body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`Devin API ${res.status} — ${method} ${path}: ${text.slice(0, 300)}`);
    err.status = res.status;
    throw err;
  }
  return text ? JSON.parse(text) : null;
}

// 호출자 유형 감지 — 서비스 사용자 자동화는 run_as=organization,
// 개인 토큰(UsePersonalAutomations 권한 필요)은 creator로만 만들 수 있다
async function detectRunAs() {
  const forced = process.env.RUN_AS;
  if (forced === "organization" || forced === "creator") return forced;
  try {
    const me = await req("/self");
    return me?.service_user_name || me?.type === "service_user" ? "organization" : "creator";
  } catch {
    return "organization"; // /self 실패 시 서비스 사용자 기본값
  }
}

function buildPayload(runAs, spec) {
  return {
    name: spec.name,
    enabled: true,
    run_as: { type: runAs },
    // 같은 자동화의 세션이 겹쳐 돌지 않도록 직렬화
    concurrency: { max_concurrent_runs: 1 },
    metadata: { repo: REPO, purpose: spec.purpose },
    triggers: spec.triggers,
    actions: [{ type: "start_session", prompt: loadPrompt(spec.file) }],
  };
}

if (!TOKEN || !ORG || DRY) {
  console.log(`${DRY ? "[DRY_RUN] " : ""}API 키·조직 ID ${!TOKEN || !ORG ? "미설정" : ""} — 두 가지 방법:
[A] 자동 등록 — 루트 .env에 아래 두 줄을 적고 이 스크립트를 다시 실행:
      DEVIN_API_KEY=<서비스 사용자 키>
      DEVIN_ORG_ID=<org-* 조직 ID>
[B] 수동 등록 — app.devin.ai > Automations > Create automation에서 아래 페이로드와 동일하게 생성
`);
  for (const spec of AUTOMATIONS) {
    console.log(`=== ${spec.name} (프롬프트 원본: .devin/automations/${spec.file}, '---' 이후 본문) ===`);
    console.log(
      JSON.stringify(buildPayload(process.env.RUN_AS || "organization", spec), null, 2),
    );
    console.log();
  }
  if (!TOKEN || !ORG) process.exit(2); // 키 없이 종료 — CI에서 실수로 돌리면 알아차리게
  process.exit(0);
}

const runAs = await detectRunAs();

// 같은 이름의 자동화가 이미 있으면 재생성하지 않는다 (UPDATE=1이면 트리거·프롬프트 갱신)
let items = [];
try {
  const list = await req(`/organizations/${ORG}/automations`);
  items = Array.isArray(list) ? list : list?.automations || list?.items || [];
} catch (e) {
  console.log(`자동화 목록 조회 실패(${e.message}) — 생성 시도로 진행`);
}

for (const spec of AUTOMATIONS) {
  const payload = buildPayload(runAs, spec);
  const existing = items.find((a) => a?.name === spec.name) || null;
  if (existing && process.env.UPDATE !== "1") {
    console.log(`${spec.name}: 이미 존재(${existing.automation_id || existing.id}) — 갱신하려면 UPDATE=1`);
  } else if (existing) {
    const id = existing.automation_id || existing.id;
    const res = await req(`/organizations/${ORG}/automations/${id}`, {
      method: "PATCH",
      body: { ...payload, name: undefined },
    }).catch((e) => {
      console.log(`${spec.name}: 갱신 실패(${e.message}) — UI에서 직접 수정하거나 삭제 후 재실행`);
      return null;
    });
    if (res) console.log(`${spec.name}: 갱신 완료 — id=${id}`);
  } else {
    const created = await req(`/organizations/${ORG}/automations`, {
      method: "POST",
      body: payload,
    });
    console.log(
      `${spec.name}: 생성 완료 — id=${created?.automation_id || created?.id || "?"}, run_as=${runAs}`,
    );
  }
}
