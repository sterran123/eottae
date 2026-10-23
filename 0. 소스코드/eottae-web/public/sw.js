/* 어때? 오프라인 셸 서비스워커 (CORE-003)
   전략: 정적 셸 precache + 문서 network-first(실패 시 캐시→/offline) + 정적자산 cache-first.
   푸시·백그라운드 동기화·API 캐시는 구현하지 않는다(향후 별도 과제). */
const CACHE = 'eottae-shell-v2';
const PRECACHE = [
  '/',
  '/offline',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/eottae-logo-light.png',
  '/eottae-logo-dark-transparent.png',
  '/fonts/PretendardVariable.woff2',
  '/brand/hero-visual.webp',
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

  // 페이지 이동: 네트워크 우선, 실패 시 캐시 → /offline
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
          caches.match(request).then((hit) => hit || caches.match('/offline')),
        ),
    );
    return;
  }

  // 동일 출처 정적 자산: 캐시 우선
  if (/^\/(icons\/|fonts\/|brand\/|eottae-|manifest\.webmanifest$|_next\/static\/)/.test(url.pathname)) {
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
