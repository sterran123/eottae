// 「어때?」 검증 스크린샷 캡처 — Chrome DevTools Protocol 직접 사용 (Node 22+ 내장 WebSocket)
// 사용: Chrome을 --remote-debugging-port=9222로 띄운 뒤
//   node tools/capture_screenshots.mjs [baseUrl] [출력폴더]
// 예: node tools/capture_screenshots.mjs http://localhost:3001 "0. 소스코드/eottae-web/docs/screenshots"
import { writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

const BASE = process.argv[2] ?? "http://localhost:3001";
const OUT = resolve(process.argv[3] ?? "screenshots");
const CDP = "http://localhost:9222";

const SHOTS = [
  { url: "/",            name: "01_home_mobile390_light",       w: 390,  h: 844, dsf: 3, mobile: true,  dark: false },
  { url: "/",            name: "02_home_desktop1440_light",     w: 1440, h: 900, dsf: 1, mobile: false, dark: false },
  { url: "/",            name: "03_home_desktop1440_dark",      w: 1440, h: 900, dsf: 1, mobile: false, dark: true  },
  { url: "/match",       name: "04_match_mobile390_light",      w: 390,  h: 844, dsf: 3, mobile: true,  dark: false },
  { url: "/activities",  name: "05_activities_mobile390_light", w: 390,  h: 844, dsf: 3, mobile: true,  dark: false },
  { url: "/invitations", name: "06_invitations_mobile390_light",w: 390,  h: 844, dsf: 3, mobile: true,  dark: false },
  { url: "/offline",     name: "07_offline_mobile390_light",    w: 390,  h: 844, dsf: 3, mobile: true,  dark: false },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getTarget() {
  // 항상 새 탭을 열어 쓴다 — 기존 탭이 렌더러 고착·다른 클라이언트 점유 상태면 명령이 무응답이 된다.
  const page = await (
    await fetch(`${CDP}/json/new?about:blank`, { method: "PUT" })
  ).json();
  return { ws: page.webSocketDebuggerUrl, id: page.id };
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const pending = new Map();
    let seq = 0;
    ws.onopen = () => resolve({
      send(method, params = {}) {
        return new Promise((res, rej) => {
          const id = ++seq;
          pending.set(id, { res, rej });
          ws.send(JSON.stringify({ id, method, params }));
        });
      },
    });
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
      }
    };
    ws.onerror = reject;
  });
}

const withTimeout = (p, ms, tag) =>
  Promise.race([
    p,
    new Promise((_, rej) => setTimeout(() => rej(new Error(`timeout: ${tag}`)), ms)),
  ]);

console.log("cdp 새 탭 생성…");
const target = await getTarget();
const cdp = await withTimeout(connect(target.ws), 10000, "ws-connect");
console.log("ws 연결됨");
await withTimeout(cdp.send("Page.enable"), 10000, "Page.enable");
console.log("Page.enable 완료");
mkdirSync(OUT, { recursive: true });

for (const s of SHOTS) {
  console.log(`→ ${s.name} 에뮬레이션 설정`);
  await withTimeout(
    cdp.send("Emulation.setDeviceMetricsOverride", {
      width: s.w, height: s.h, deviceScaleFactor: s.dsf, mobile: s.mobile,
    }), 10000, `metrics ${s.name}`
  );
  await withTimeout(
    cdp.send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-color-scheme", value: s.dark ? "dark" : "light" }],
    }), 10000, `media ${s.name}`
  );
  await withTimeout(
    cdp.send("Page.navigate", { url: BASE + s.url }), 20000, `navigate ${s.name}`
  );
  console.log(`… ${s.name} 렌더 대기`);
  await sleep(3500); // dev 서버 컴파일·폰트 로딩 대기
  // 뷰포트를 페이지 전체 높이로 확장: IntersectionObserver 리빌이 자연 발동하고,
  // captureBeyondViewport에서 transformed 애니메이션·sticky 요소가 빠지는 결함을 회피한다.
  const { result } = await withTimeout(
    cdp.send("Runtime.evaluate", {
      expression: "document.documentElement.scrollHeight",
      returnByValue: true,
    }), 10000, `height ${s.name}`
  );
  const fullH = Math.min(Math.max(result.value || s.h, s.h), 8000);
  await withTimeout(
    cdp.send("Emulation.setDeviceMetricsOverride", {
      width: s.w, height: fullH, deviceScaleFactor: s.dsf, mobile: s.mobile,
    }), 10000, `resize ${s.name}`
  );
  await sleep(1400); // 리빌 트랜지션·리플로 완료 대기
  const { data } = await withTimeout(
    cdp.send("Page.captureScreenshot", { format: "png" }),
    20000,
    `capture ${s.name}`
  );
  writeFileSync(join(OUT, `${s.name}.png`), Buffer.from(data, "base64"));
  console.log(`✓ ${s.name}.png (${s.w}x${s.h} ${s.dark ? "dark" : "light"})`);
}
await fetch(`${CDP}/json/close/${target.id}`).catch(() => {});
console.log("done");
process.exit(0);
