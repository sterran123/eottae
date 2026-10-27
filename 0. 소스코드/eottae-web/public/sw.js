/* 어때? 오프라인 셸 서비스워커 (CORE-003)
   전략: 정적 셸 precache + 문서 network-first(실패 시 캐시→/offline) + 정적자산 cache-first.
   푸시·백그라운드 동기화·API 캐시는 구현하지 않는다(향후 별도 과제).

   경로는 루트('/')가 아니라 등록 스코프 기준으로 계산한다 — GitHub Pages의
   '/eottae/' 하위 배포와 로컬 루트 서빙을 같은 파일로 지원하기 위해서다. */
const CACHE = 'eottae-shell-v4';
// 등록 스코프 URL의 경로 — 로컬 루트는 '/', Pages는 '/eottae/'. 항상 '/'로 끝난다.
const BASE = new URL(self.registration.scope).pathname;
const PRECACHE = [
  BASE,
  `${BASE}offline`,
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

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
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

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // 페이지 이동: 네트워크 우선, 실패 시 캐시 → 오프라인 폴백
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((hit) => hit || caches.match(`${BASE}offline`)),
        ),
    );
    return;
  }

  // 동일 출처 정적 자산: 캐시 우선 (스코프 접두사를 떼고 패턴 비교)
  const path = url.pathname.startsWith(BASE)
    ? `/${url.pathname.slice(BASE.length)}`
    : url.pathname;
  if (/^\/(icons\/|fonts\/|brand\/|eottae-|manifest\.webmanifest$|_next\/static\/)/.test(path)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
  }
});
