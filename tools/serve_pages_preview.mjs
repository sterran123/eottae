// 「어때?」 GitHub Pages 로컬 미리보기 — out/ 정적 산출물을 '/eottae/' 경로로 서빙한다.
//
// 사용: cd "0. 소스코드/eottae-web" && npm run build && npm run start
//   → http://localhost:3000/eottae/ (PORT 환경변수로 포트 변경)
//
// 왜 필요한가: output:'export'에는 `next start`를 쓸 수 없고(런타임 서버가 없다),
// out/을 루트로 서빙하면 '/eottae/' 접두사 자산·링크가 전부 404다.
// Pages와 같은 경로 체계로 서빙해야 서비스워커 스코프(/eottae/)까지 실환경과 같아진다.
import { existsSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = normalize(join(ROOT, "0. 소스코드", "eottae-web", "out"));
const BASE = "/eottae"; // next.config.mjs의 basePath와 반드시 같게 유지
const PORT = Number(process.env.PORT || 3000);
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  console.error(`유효하지 않은 PORT 값: ${process.env.PORT}`);
  process.exit(1);
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

const notFound = async (res) => {
  // Pages와 동일하게 커스텀 404.html을 반환한다
  try {
    const body = await readFile(join(OUT, "404.html"));
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("404 — out/이 없습니다. 먼저 npm run build를 실행하세요.");
  }
};

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    const pathname = decodeURIComponent(url.pathname);
    if (pathname === "/" || pathname === BASE) {
      res.writeHead(302, { Location: `${BASE}/` });
      return res.end();
    }
    if (!pathname.startsWith(`${BASE}/`)) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end(`Not Found — 미리보기는 ${BASE}/ 아래만 서빙합니다`);
    }
    const rel = pathname.slice(BASE.length); // '/match/' 등
    const file = normalize(join(OUT, rel.endsWith("/") ? `${rel}index.html` : rel));
    // %2e%2e 등으로 out/ 밖을 빠져나가는 요청 차단
    if (!file.startsWith(OUT + sep)) {
      res.writeHead(403);
      return res.end();
    }
    // GitHub Pages와 동일하게 디렉터리 URL은 trailing slash로 301 — 직접 서빙하면
    // 상대경로 해석이 깨지고 sw.js precache의 '/eottae/offline' 같은 요청이 404가 된다
    if (!rel.endsWith("/") && (await stat(file).catch(() => null))?.isDirectory()) {
      res.writeHead(301, { Location: `${url.pathname}/${url.search}` });
      return res.end();
    }
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": MIME[extname(file).toLowerCase()] || "application/octet-stream" });
    res.end(body);
  } catch {
    await notFound(res);
  }
}).listen(PORT, "127.0.0.1", () => {
  console.log(`Pages 미리보기 — http://localhost:${PORT}${BASE}/`);
  if (!existsSync(OUT)) console.log("주의: out/이 없습니다. 먼저 npm run build를 실행하세요.");
});
