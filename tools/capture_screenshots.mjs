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
  const targets = await (await fetch(`${CDP}/json/list`)).json();
  let page = targets.find((t) => t.type === "page");
  if (!page) {
    page = await (await fetch(`${CDP}/json/new?about:blank`, { method: "PUT" })).json();
  }
  return page.webSocketDebuggerUrl;
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

const cdp = await connect(await getTarget());
await cdp.send("Page.enable");
mkdirSync(OUT, { recursive: true });

for (const s of SHOTS) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: s.w, height: s.h, deviceScaleFactor: s.dsf, mobile: s.mobile,
  });
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-color-scheme", value: s.dark ? "dark" : "light" }],
  });
  await cdp.send("Page.navigate", { url: BASE + s.url });
  await sleep(3500); // dev 서버 컴파일·폰트 로딩 대기
  const { data } = await cdp.send("Page.captureScreenshot", {
    format: "png", captureBeyondViewport: true,
  });
  writeFileSync(join(OUT, `${s.name}.png`), Buffer.from(data, "base64"));
  console.log(`✓ ${s.name}.png (${s.w}x${s.h} ${s.dark ? "dark" : "light"})`);
}
console.log("done");
process.exit(0);
