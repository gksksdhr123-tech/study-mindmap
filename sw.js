const CACHE_NAME = 'study-mindmap-v16';
const CDN_URLS = [
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js',
];
const SAME_ORIGIN_URLS = [
  './mindmap-notes.html',
  './manifest.json',
  './icon.svg',
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(SAME_ORIGIN_URLS);
    for (const url of CDN_URLS) {
      try {
        const res = await fetch(new Request(url, { mode: 'no-cors' }));
        await cache.put(url, res);
      } catch (e) {
        // 오프라인 상태에서 최초 설치되면 CDN 캐싱은 실패할 수 있음 — 다음 온라인 방문 때 재시도됨
      }
    }
    self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    self.clients.claim();
  })());
});

// 캐시 우선 응답 + 백그라운드에서 최신 버전으로 캐시 갱신 (오프라인에서도 항상 즉시 응답)
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    const networkFetch = fetch(event.request).then(async res => {
      if (res && (res.ok || res.type === 'opaque')) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, res.clone());
      }
      return res;
    }).catch(() => cached);
    return cached || networkFetch;
  })());
});
