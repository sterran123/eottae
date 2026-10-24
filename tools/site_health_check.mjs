// 「어때?」 실사이트 헬스체크 — Pages 배포 후/매일 실제 URL이 살아있는지 확인한다.
// 실패 시 이슈를 열고(중복 열지 않음), 복구되면 열린 이슈를 닫는다.
//
// 실행: .github/workflows/site-health.yml (deploy-pages 완료 후 + 매일 + 수동)
// 로컬: GH_TOKEN=... node tools/site_health_check.mjs  (토큰 없으면 읽기만 — 이슈 안 엶)
const REPO = process.env.GITHUB_REPOSITORY || "sterran123/eottae";
const TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || "";
const BASE = (process.env.SITE_BASE || "https://sterran123.github.io/eottae").replace(/\/$/, "");
const MARKER = "<!-- site-health-alert -->";

// Pages 정적 export 기준 핵심 경로 — 하나라도 깨지면 사이트 장애로 본다
const CHECKS = [
  ["/", "text/html"],
  ["/match/", "text/html"],
  ["/offline/", "text/html"],
  ["/manifest.webmanifest", "application/manifest"],
  ["/sw.js", "javascript"],
  ["/api/health", "application/octet-stream"],
  ["/icons/icon-192.png", "image/png"],
  ["/fonts/PretendardVariable.woff2", "font/woff2"],
];

const api = async (path, init = {}) => {
  const res = await fetch(`https://api.github.com/${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "eottae-site-health",
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status} — ${path}`);
  return res.status === 204 ? null : res.json();
};

const results = [];
for (const [path, wantType] of CHECKS) {
  const url = BASE + path;
  try {
    const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(15000) });
    const type = res.headers.get("content-type") || "";
    const ok = res.status === 200 && type.includes(wantType);
    results.push({ path, url, status: res.status, type, ok });
    console.log(`${ok ? "OK " : "NG "}${res.status} ${path} (${type})`);
  } catch (e) {
    results.push({ path, url, status: 0, type: String(e.message || e).slice(0, 120), ok: false });
    console.log(`NG --- ${path} (${e.message})`);
  }
}

const failed = results.filter((r) => !r.ok);
const issues = await api(`repos/${REPO}/issues?state=open&per_page=100`).catch(() => []);
const open = (issues || []).find(
  (i) => typeof i.body === "string" && i.body.includes(MARKER),
);

const table = (rows) =>
  ["| 경로 | 상태 | content-type |", "|---|---|---|", ...rows.map((r) => `| \`${r.path}\` | ${r.status || "연결 실패"} | ${r.type} |`)].join("\n");

if (failed.length) {
  console.log(`실패 ${failed.length}건 — 이슈 ${open ? "갱신" : "생성"}`);
  const body =
    `${MARKER}\n🚨 **실사이트 헬스체크 실패** — ${new Date().toISOString().slice(0, 16)}Z\n\n` +
    table(results) +
    `\n\n실패 ${failed.length}/${results.length}건. 최근 deploy-pages 실행 로그와 \`out/\` 산출물을 확인해 주세요.\n` +
    `모두 복구되면 이 이슈는 자동으로 닫힙니다.`;
  if (TOKEN) {
    if (open) {
      await api(`repos/${REPO}/issues/${open.number}`, {
        method: "PATCH",
        body: JSON.stringify({ body }),
      });
    } else {
      await api(`repos/${REPO}/issues`, {
        method: "POST",
        body: JSON.stringify({ title: `🚨 사이트 장애 — 헬스체크 ${failed.length}건 실패`, body, labels: ["bug"] }),
      });
    }
  } else {
    console.log("(토큰 없음 — 이슈 작성 건너뜀)");
  }
  process.exitCode = 1;
} else {
  console.log(`전부 정상 (${results.length}건)`);
  if (open && TOKEN) {
    await api(`repos/${REPO}/issues/${open.number}/comments`, {
      method: "POST",
      body: JSON.stringify({ body: `${MARKER}\n✅ 복구 확인 — ${new Date().toISOString().slice(0, 16)}Z 기준 전 경로 정상. 이슈를 닫습니다.` }),
    });
    await api(`repos/${REPO}/issues/${open.number}`, {
      method: "PATCH",
      body: JSON.stringify({ state: "closed" }),
    });
    console.log(`열린 장애 이슈 #${open.number} 닫음 (복구됨)`);
  }
}
