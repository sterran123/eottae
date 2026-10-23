// 「어때?」 팀 활동 리포트 생성기 — GitHub REST API로 팀원 활동을 모아
// 0. 소스코드/eottae-web/docs/TEAM_ACTIVITY.md 를 한국어로 갱신한다.
//
// 사용: node tools/team_activity_report.mjs
//   Actions: GITHUB_TOKEN 자동 주입, 저장소는 GITHUB_REPOSITORY에서 감지
//   로컬:    gh CLI 로그인 상태면 그대로 동작, 아니면 GH_TOKEN 환경변수,
//            둘 다 없으면 public 저장소 한정 비인증 조회(시간당 60회 제한)
//   환경변수 REPORT_DAYS(기본 7)로 집계 기간 조절
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "0. 소스코드", "eottae-web", "docs", "TEAM_ACTIVITY.md");
const REPO = process.env.GITHUB_REPOSITORY || "sterran123/eottae";
const daysInput = Number(process.env.REPORT_DAYS || 7);
// workflow_dispatch days 입력은 자유 텍스트 — 숫자가 아니면 NaN → toISOString이 RangeError로 잡을 죽인다
const DAYS = Number.isFinite(daysInput) && daysInput >= 1 ? Math.floor(daysInput) : 7;
const TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || "";

// GitHub ID → 팀원 실명 매핑 (HANDOFF_김민기.md 초대 표와 동기화)
const MEMBERS = {
  sterran123: "김민기",
  HaYul0611: "오하율",
  "gksxogksxo1001-sketch": "주한태",
  sonjunhyek2: "손준혁",
};
const BOTS = {
  "devin-ai-integration[bot]": "Devin(AI)",
  "github-actions[bot]": "GitHub Actions",
};
const nameOf = (login) => MEMBERS[login] || BOTS[login] || login || "알 수 없음";

const REQ_RE = /\b(CORE|BRAND|MATCH|ACT|INV|SEC)-\d{3}\b/g;
const reqIdsOf = (text) => [...new Set(String(text).match(REQ_RE) || [])].sort();

let usedAuth = "anonymous";
async function api(path) {
  // 1순위: gh CLI (Actions 러너·로컬 공통)
  try {
    const out = execFileSync("gh", ["api", path], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    usedAuth = "gh";
    return JSON.parse(out);
  } catch { /* gh 미설치·미인증 시 fetch 경로로 */ }
  const res = await fetch(`https://api.github.com/${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
      "User-Agent": "eottae-team-sync",
    },
  });
  if (TOKEN) usedAuth = "token";
  if (!res.ok) throw new Error(`GitHub API ${res.status} — ${path}`);
  return res.json();
}

const since = new Date(Date.now() - DAYS * 864e5);
const sinceIso = since.toISOString();
const kst = (d) => new Date(d).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", hour12: false });
const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date());

// --- 수집 ---
const [commits, prs, openPrs, branches] = await Promise.all([
  api(`repos/${REPO}/commits?sha=main&since=${sinceIso}&per_page=100`).catch(() => []),
  api(`repos/${REPO}/pulls?state=all&sort=updated&direction=desc&per_page=50`).catch(() => []),
  // 오래된 열린 PR은 updated 기준 top-50 밖으로 밀려날 수 있어 state=open으로 따로 가져온다
  api(`repos/${REPO}/pulls?state=open&per_page=100`).catch(() => []),
  api(`repos/${REPO}/branches?per_page=100`).catch(() => []),
]);

const mainHead = commits[0];
const mainChecks = await api(`repos/${REPO}/commits/main/check-runs?per_page=20`).catch(() => null);
const mainCi = mainChecks?.check_runs?.find((r) => r.name === "check") || mainChecks?.check_runs?.[0];

const mergedPrs = prs.filter((p) => p.merged_at && new Date(p.merged_at) >= since);
const recentPrs = prs.filter((p) => new Date(p.updated_at) >= since);

// 열린 PR의 헤드 커밋 CI 상태 (최대 10건까지만 조회 — rate limit 보호)
const prCi = new Map();
for (const p of openPrs.slice(0, 10)) {
  const cr = await api(`repos/${REPO}/commits/${p.head.sha}/check-runs?per_page=20`).catch(() => null);
  const runs = cr?.check_runs || [];
  prCi.set(p.number, runs.length === 0 ? "없음" : runs.every((r) => r.conclusion === "success") ? "✅ 통과" : `⚠️ ${runs.find((r) => r.conclusion !== "success")?.conclusion || "대기"}`);
}

// --- 팀원별 집계 (봇 제외 4인) ---
const stat = Object.fromEntries(Object.keys(MEMBERS).map((id) => [id, { commits: 0, prsOpened: 0, prsMerged: 0, reqs: new Set() }]));
const otherActivity = [];
for (const c of commits) {
  const login = c.author?.login;
  const ids = reqIdsOf(c.commit.message);
  if (login && stat[login]) {
    stat[login].commits++;
    ids.forEach((i) => stat[login].reqs.add(i));
  } else if (login && !BOTS[login]) {
    otherActivity.push(`${nameOf(login)} — ${String(c.commit.message).split("\n")[0]}`);
  }
}
// 열린 PR과 기간 내 갱신 PR을 번호 기준으로 합쳐 한 번만 집계한다
const seenPrs = new Map();
for (const p of [...openPrs, ...recentPrs]) if (!seenPrs.has(p.number)) seenPrs.set(p.number, p);
for (const p of seenPrs.values()) {
  const login = p.user?.login;
  if (!login || !stat[login]) continue;
  if (p.state === "open") stat[login].prsOpened++;
  if (p.merged_at && new Date(p.merged_at) >= since) stat[login].prsMerged++;
  reqIdsOf(`${p.title}\n${p.head.ref}\n${p.body || ""}`).forEach((i) => stat[login].reqs.add(i));
}

const ciBadge = mainCi
  ? mainCi.conclusion === "success" ? `✅ ${mainCi.name} 통과 (${kst(mainCi.completed_at)})`
  : mainCi.status !== "completed" ? `⏳ ${mainCi.name} 진행 중`
  : `❌ ${mainCi.name} — ${mainCi.conclusion}`
  : "⚠️ 기록 없음";

const idleMembers = Object.entries(MEMBERS).filter(([id]) => stat[id].commits === 0 && stat[id].prsOpened === 0 && stat[id].prsMerged === 0);
const actions = [];
if (openPrs.length) actions.push(`리뷰 대기 중인 PR ${openPrs.length}건 — CODEOWNERS 담당 리뷰어 확인 필요`);
if ([...prCi.values()].some((v) => v.startsWith("⚠️"))) actions.push("CI 실패·대기 상태 PR 존재 — 작성자가 로컬에서 `npm run typecheck && npm run build` 재확인");
if (idleMembers.length) actions.push(`기간 내 활동이 잡히지 않은 팀원: ${idleMembers.map(([, n]) => n).join(", ")} — 진행 상황 확인 또는 작업 배정 점검`);
if (mainCi && mainCi.conclusion && mainCi.conclusion !== "success") actions.push("main CI 실패 상태 — 기능 작업 전에 원인부터 해결할 것");
if (!actions.length) actions.push("특이사항 없음 — 계획된 다음 요구사항 ID로 브랜치를 만들어 진행");

// --- 마크다운 생성 ---
const row = (id) => {
  const s = stat[id];
  return `| ${MEMBERS[id]} (@${id}) | ${s.commits} | ${s.prsOpened} | ${s.prsMerged} | ${[...s.reqs].join(", ") || "—"} |`;
};
const md = `# 팀 활동 리포트 — ${today} (자동 생성)

> 생성: \`.github/workflows/team-sync.yml\` → \`tools/team_activity_report.mjs\`
> 집계 기간: 최근 ${DAYS}일 (${kst(since)} ~ ${kst(Date.now())}) · 저장소: ${REPO} · 조회 방식: ${usedAuth}

## main 브랜치 건강 상태
- 최신 커밋: \`${mainHead ? mainHead.sha.slice(0, 7) : "—"}\` ${mainHead ? String(mainHead.commit.message).split("\n")[0] : "조회 실패"} (${mainHead ? nameOf(mainHead.author?.login) + ", " + kst(mainHead.commit.author.date) : ""})
- CI 상태: ${ciBadge}

## 팀원별 활동 (최근 ${DAYS}일)

| 팀원 | main 커밋 | 열린 PR | 머지된 PR | 다룬 요구사항 ID |
|---|---|---|---|---|
${Object.keys(MEMBERS).map(row).join("\n")}
${otherActivity.length ? `\n비팀원 활동: ${otherActivity.join("; ")}` : ""}

## 열린 PR (${openPrs.length}건)

${openPrs.length ? "| # | 제목 | 작성자 | CI | 최근 갱신 |\n|---|---|---|---|---|\n" + openPrs.map((p) => `| #${p.number} | ${p.title} | ${nameOf(p.user?.login)} | ${prCi.get(p.number) || "—"} | ${kst(p.updated_at)} |`).join("\n") : "현재 열린 PR이 없습니다."}

## 최근 ${DAYS}일 머지된 PR (${mergedPrs.length}건)

${mergedPrs.length ? mergedPrs.map((p) => `- #${p.number} ${p.title} — ${nameOf(p.user?.login)} (${kst(p.merged_at)})`).join("\n") : "기간 내 머지된 PR이 없습니다."}

## 활성 브랜치 (${branches.length}개)

${branches.length ? branches.map((b) => `- \`${b.name}\`${b.protected ? " 🔒" : ""}`).join("\n") : "조회 실패"}

## 다음 액션 제안

${actions.map((a) => `- ${a}`).join("\n")}

---
이 파일은 스케줄 워크플로가 자주 갱신하므로 수동 편집 대신 스크립트를 고쳐 주세요.
`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, md, "utf8");
console.log(`TEAM_ACTIVITY.md 갱신 완료 — ${REPO}, 최근 ${DAYS}일, main 커밋 ${commits.length}건, 열린 PR ${openPrs.length}건 (${usedAuth})`);
