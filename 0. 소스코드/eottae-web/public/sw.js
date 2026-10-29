/* 어때? 오프라인 셸 서비스워커 (CORE-003)
   전략: 정적 셸 precache(홈·오프라인 페이지의 JS·CSS 포함) + 문서 network-first(실패 시 캐시→/offline/)
   + 정적자산 cache-first. 런타임 청크·방문 페이지는 상한만 남기고, 셸이 참조하는 자산은 지우지 않는다.
   푸시·백그라운드 동기화·API 캐시는 구현하지 않는다(향후 별도 과제).

   경로는 루트('/')가 아니라 등록 스코프 기준으로 계산한다 — GitHub Pages의
   '/eottae/' 하위 배포와 로컬 루트 서빙을 같은 파일로 지원하기 위해서다.
   trailingSlash: true라 페이지 주소는 항상 '/'로 끝난다 — '/offline'처럼 쓰면
   Pages가 301을 주고, 리다이렉트된 응답은 오프라인 페이지 이동에 쓸 수 없다(ERR_FAILED). */
// v6 유지: 이름은 v5의 쿼리 키·옛 해시 청크를 activate 때 통째로 지우려고 올린 값이다.
// 이번엔 올리지 않는다. sw.js 바이트가 바뀌면 브라우저가 새 워커를 설치하므로 activate는 다시 돈다.
// 이름을 그대로 두고 그 정리로 v6 항목만 줄이면, 이미 받아 둔 오프라인 셸이 통째로 지워지지 않는다.
const CACHE = 'eottae-shell-v6';
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
// remember()가 저장하는 정적 자산. 방문 페이지와 가를 때도 같은 판정을 쓴다.
const STATIC_ASSET = /^\/(icons\/|fonts\/|brand\/|eottae-|manifest\.webmanifest$|_next\/static\/)/;
// 런타임 상한. PRECACHE·SHELL_PAGES·셸 HTML이 참조하는 청크는 세지 않고 지우지 않는다.
// 청크 80: 공통 런타임은 셸이라 제외다. 매칭 온보딩·추천·문답·채팅처럼 화면마다
//   _next/static 청크·CSS가 수 개라, 그 몇 장과 직전 배포의 옛 해시가 겹쳐도 남길 자리다.
// 페이지 30: 셸 두 장(홈·오프라인)은 빼고, 지금 라우트(매칭·소개·안전·개인정보, 10여 개)와
//   앞으로 늘 경로를 오프라인으로 다시 열 여유. 쿼리는 키에 없으므로 경로 수만큼만 늘어난다.
const MAX_CHUNKS = 80;
const MAX_PAGES = 30;

// 셸 페이지 HTML이 참조하는 /_next/static/ 자산 경로를 모은다 (상대 경로는 그 페이지 주소 기준)
function staticAssetsIn(html, page) {
  const found = new Set();
  const base = new URL(page, self.location.origin);
  const re = /(?:src|href)="([^"]*\/_next\/static\/[^"]+)"/g;
  let m;
  while ((m = re.exec(html))) found.add(new URL(m[1], base).pathname);
  return [...found];
}

// 스코프 접두사를 뗀 경로 — 루트 배포와 '/eottae/' 배포를 같은 패턴으로 본다
function relFromBase(pathname) {
  return pathname.startsWith(BASE) ? `/${pathname.slice(BASE.length)}` : pathname;
}

function isChunkPath(pathname) {
  return relFromBase(pathname).startsWith('/_next/static/');
}

// 진행 중인 정리가 있으면 새로 돌리지 않고, 끝난 뒤 한 번 더 돌리도록 합친다.
let trimming = null;
let trimQueued = false;

// 캐시에 있는 셸 HTML이 가리키는 청크까지 보호 목록에 넣는다. 읽기에 실패하면 예외를 올려
// 이번 정리를 통째로 건너뛴다 — 참조를 모르는 채로 청크를 지우면 오프라인 첫 화면이 깨진다.
async function shellKeepPaths(cache) {
  const keep = new Set([...PRECACHE, ...SHELL_PAGES]);
  for (const page of SHELL_PAGES) {
    const hit = await cache.match(page);
    if (!hit) continue;
    staticAssetsIn(await hit.text(), page).forEach((asset) => keep.add(asset));
  }
  return keep;
}

// keys()는 넣은 순서라 앞쪽을 오래된 것으로 본다. 같은 키를 다시 put해도 맨 뒤로 간다고 보지 않는다.
async function trimCache() {
  const cache = await caches.open(CACHE);
  const requests = await cache.keys();
  const keep = await shellKeepPaths(cache);
  const chunks = [];
  const pages = [];
  for (const request of requests) {
    const pathname = new URL(request.url).pathname;
    if (keep.has(pathname)) continue;
    if (isChunkPath(pathname)) chunks.push(request);
    else if (!STATIC_ASSET.test(relFromBase(pathname))) pages.push(request);
  }
  const stale = [
    ...chunks.slice(0, Math.max(0, chunks.length - MAX_CHUNKS)),
    ...pages.slice(0, Math.max(0, pages.length - MAX_PAGES)),
  ];
  // 목록을 만든 뒤 셸 HTML이 바뀌었으면 그 자산은 빼 둔다
  const keepNow = await shellKeepPaths(cache);
  await Promise.all(
    stale
      .filter((request) => !keepNow.has(new URL(request.url).pathname))
      .map((request) => cache.delete(request)),
  );
}

function scheduleTrim() {
  if (trimming) {
    trimQueued = true;
    return trimming;
  }
  trimming = (async () => {
    try {
      do {
        trimQueued = false;
        try {
          await trimCache();
        } catch {
          // 이번 패스는 포기한다. 화면과는 무관하고, 다음 저장에서 다시 한다.
        }
      } while (trimQueued);
    } finally {
      trimming = null;
    }
  })();
  return trimming;
}

// 홈·오프라인 문서 이동으로 셸 HTML을 저장한 뒤, 그 HTML이 참조하는데 캐시에 없는 청크만 받아 둔다.
// 바뀌지 않았어도 이전 받기가 실패한 구멍은 채운다. 클라이언트 라우팅(RSC)은 셸 HTML을 갈아끼우지 않는다.
async function warmShellAssets(cache, page, html) {
  await Promise.all(
    staticAssetsIn(html, page).map(async (asset) => {
      try {
        if (await cache.match(asset)) return;
        const res = await fetch(asset, { cache: 'no-cache' });
        if (res.ok && !res.redirected) await cache.put(asset, res);
      } catch {
        // 자산 하나 실패가 나머지 정리를 막지 않는다
      }
    }),
  );
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
        // 같은 출처(sterran123.github.io)를 쓰는 다른 Pages 프로젝트 캐시는 건드리지 않는다
        Promise.all(
          keys
            .filter((key) => key.startsWith('eottae-shell-') && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => scheduleTrim())
      .then(() => self.clients.claim()),
  );
});

// 정상 응답만 캐시한다 — 리다이렉트된 응답은 나중에 페이지 이동에 돌려줄 수 없다.
// 응답을 돌려준 뒤 워커가 종료돼도 저장이 끝나도록 waitUntil로 묶는다.
function remember(event, request, response) {
  if (response.ok && !response.redirected) {
    const copy = response.clone();
    // 저장 뒤에 상한 정리. 워커가 안 바뀌는 배포에서도 청크가 쌓이지 않게 한다. 실패는 삼킨다.
    event.waitUntil(
      caches
        .open(CACHE)
        .then((cache) => cache.put(request, copy))
        .then(() => scheduleTrim())
        .catch(() => {}),
    );
  }
  return response;
}

// 페이지 이동 응답은 본문·헤더만으로 다시 만들어 저장한다 — fetch 응답을 그대로 넣으면
// 키를 경로로 줘도 응답 객체의 url(쿼리 포함)이 CacheStorage에 함께 남는다.
// 새로 만든 Response는 url이 빈 문자열로 저장되고, 페이지 이동 응답으로 돌려줘도 문제없다.
function rememberPage(event, path, response) {
  if (response.ok && !response.redirected) {
    const copy = response.clone();
    // 셸만 본문을 한 번 더 읽는다. 캐시에 넣는 응답은 기존과 같이 스트림으로 만든다.
    const shellCopy = SHELL_PAGES.includes(path) ? response.clone() : null;
    event.waitUntil(
      (async () => {
        try {
          const cache = await caches.open(CACHE);
          const clean = new Response(copy.body, {
            status: copy.status,
            statusText: copy.statusText,
            headers: copy.headers,
          });
          await cache.put(path, clean);
          if (shellCopy) {
            try {
              await warmShellAssets(cache, path, await shellCopy.text());
            } catch {
              // 새 셸 청크를 못 받아도 정리는 계속한다
            }
          }
          await scheduleTrim();
        } catch {
          // 저장·정리 실패가 화면 표시를 막으면 안 된다
        }
      })(),
    );
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
  // searchParams로 다시 쓰면 공백이 %20 → +로 바뀐다 — URLSearchParams로 읽으면 같은 값이다.
  if (request.mode === 'navigate' && url.pathname.endsWith('/index.txt')) {
    url.pathname = url.pathname.slice(0, -'index.txt'.length);
    url.searchParams.delete('_rsc');
    event.respondWith(Response.redirect(url.href, 302));
    return;
  }

  // 페이지 이동: 네트워크 우선, 실패 시 캐시 → 오프라인 폴백.
  // 정적 export라 HTML은 쿼리와 무관하다 — 경로만 키로, 응답은 rememberPage로 다시 만들어 저장해
  // 쿼리(질문 내용·인증 콜백 code 등)가 키에도 응답 url에도 남지 않게 하고, 쿼리마다 항목이 늘어나지 않게 한다.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => rememberPage(event, url.pathname, response))
        .catch(() =>
          caches.match(request, { ignoreSearch: true }).then((hit) => hit || caches.match(OFFLINE)),
        ),
    );
    return;
  }

  // 클라이언트 이동용 RSC 페이로드(…/index.txt)는 캐시하지 않는다 — 페이로드만 있고 그 페이지 JS 청크가
  // 없으면 화면이 깨진다. 오프라인이면 실패 → Next가 브라우저 이동 → 위 index.txt 처리 → 캐시/오프라인 폴백.

  // 동일 출처 정적 자산: 캐시 우선 (스코프 접두사를 떼고 패턴 비교)
  const path = relFromBase(url.pathname);
  if (STATIC_ASSET.test(path)) {
    event.respondWith(
      caches.match(request).then((hit) => hit || fetch(request).then((response) => remember(event, request, response))),
    );
  }
});
