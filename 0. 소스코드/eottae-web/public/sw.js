/* 어때? 오프라인 셸 서비스워커 (CORE-003)
   전략: 정적 셸 precache(홈·오프라인 페이지의 JS·CSS 포함) + 문서 network-first(실패 시 캐시→/offline/)
   + 정적자산 cache-first.
   푸시·백그라운드 동기화·API 캐시는 구현하지 않는다(향후 별도 과제).

   경로는 루트('/')가 아니라 등록 스코프 기준으로 계산한다 — GitHub Pages의
   '/eottae/' 하위 배포와 로컬 루트 서빙을 같은 파일로 지원하기 위해서다.
   trailingSlash: true라 페이지 주소는 항상 '/'로 끝난다 — '/offline'처럼 쓰면
   Pages가 301을 주고, 리다이렉트된 응답은 오프라인 페이지 이동에 쓸 수 없다(ERR_FAILED). */
const CACHE = 'eottae-shell-v5';
// 등록 스코프 URL의 경로 — 로컬 루트는 '/', Pages는 '/eottae/'. 항상 '/'로 끝난다.
const BASE = new URL(self.registration.scope).pathname;
const OFFLINE = `${BASE}offline/`;
// HTML과 함께 JS·CSS 청크까지 받아 두는 셸 페이지 — 처음 설치한 뒤 바로 오프라인으로 열어도 화면이 깨지지 않게
const SHELL_PAGES = [BASE, OFFLINE];
const PRECACHE = [
  `${BASE}manifest.webmanifest`,
  `${BASE}favicon.ico`,
  `${BASE}icons/favicon-32x32.png`,
  `${BASE}icons/icon-192.png`,
  `${BASE}icons/icon-512.png`,
  `${BASE}icons/apple-touch-icon.png`,
  `${BASE}eottae-logo-light.png`,
  `${BASE}eottae-logo-dark-transparent.png`,
  `${BASE}fonts/PretendardVariable.woff2`,
  `${BASE}brand/hero-visual.webp`,
];

// 셸 페이지 HTML이 참조하는 /_next/static/ 자산 경로를 모은다 (상대 경로는 그 페이지 주소 기준)
function staticAssetsIn(html, page) {
  const found = new Set();
  const base = new URL(page, self.location.origin);
  const re = /(?:src|href)="([^"]*\/_next\/static\/[^"]+)"/g;
  let m;
  while ((m = re.exec(html))) found.add(new URL(m[1], base).pathname);
  return [...found];
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(async (cache) => {
        await cache.addAll(PRECACHE);
        const assets = new Set();
        for (const page of SHELL_PAGES) {
          const response = await fetch(page, { cache: 'no-cache' });
          if (!response.ok || response.redirected) throw new Error(`precache ${page}: ${response.status}`);
          await cache.put(page, response.clone());
          staticAssetsIn(await response.text(), page).forEach((asset) => assets.add(asset));
        }
        await cache.addAll([...assets]);
      })
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

// 정상 응답만 캐시한다 — 리다이렉트된 응답은 나중에 페이지 이동에 돌려줄 수 없다.
// 응답을 돌려준 뒤 워커가 종료돼도 저장이 끝나도록 waitUntil로 묶는다.
function remember(event, request, response) {
  if (response.ok && !response.redirected) {
    const copy = response.clone();
    event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request, copy)));
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // RSC 페이로드 주소(…/index.txt)로 페이지 이동: Next가 오프라인에서 RSC 요청에 실패하면
  // 페이로드 주소 그대로 브라우저 이동을 한다(output: export 동작). 페이지 주소로 돌려보낸다.
  // 쿼리(?partner=&q= 등)는 페이지가 쓰므로 남기고, Next처럼 _rsc만 지운다.
  if (request.mode === 'navigate' && url.pathname.endsWith('/index.txt')) {
    url.pathname = url.pathname.slice(0, -'index.txt'.length);
    url.searchParams.delete('_rsc');
    event.respondWith(Response.redirect(url.href, 302));
    return;
  }

  // 페이지 이동: 네트워크 우선, 실패 시 캐시 → 오프라인 폴백
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => remember(event, request, response))
        .catch(() =>
          caches.match(request, { ignoreSearch: true }).then((hit) => hit || caches.match(OFFLINE)),
        ),
    );
    return;
  }

  // 클라이언트 이동용 RSC 페이로드(…/index.txt)는 캐시하지 않는다 — 페이로드만 있고 그 페이지 JS 청크가
  // 없으면 화면이 깨진다. 오프라인이면 실패 → Next가 브라우저 이동 → 위 index.txt 처리 → 캐시/오프라인 폴백.

  // 동일 출처 정적 자산: 캐시 우선 (스코프 접두사를 떼고 패턴 비교)
  const path = url.pathname.startsWith(BASE)
    ? `/${url.pathname.slice(BASE.length)}`
    : url.pathname;
  if (/^\/(icons\/|fonts\/|brand\/|eottae-|manifest\.webmanifest$|_next\/static\/)/.test(path)) {
    event.respondWith(
      caches.match(request).then((hit) => hit || fetch(request).then((response) => remember(event, request, response))),
    );
  }
});
