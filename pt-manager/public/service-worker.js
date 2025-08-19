/* global self, caches, fetch */
// Precache de Workbox (inyectado en build)
self.__WB_MANIFEST = self.__WB_MANIFEST || [];

const CACHE_NAME = 'pt-manager-static-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : undefined))))
  );
  self.clients.claim();
});

function isApiRequest(url) {
  try {
    const api = new URL('/api', self.location.origin);
    return url.origin === api.origin && url.pathname.startsWith('/api');
  } catch (e) {
    return false;
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/index.html')));
    return;
  }

  if (isApiRequest(url)) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request).then((res) => res || new Response('Offline', { status: 503 })))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((res) => {
      return (
        res ||
        fetch(request).then((networkRes) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, networkRes.clone());
            return networkRes;
          });
        })
      );
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});


