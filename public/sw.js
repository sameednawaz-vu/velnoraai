const CACHE_VERSION = 'velnora-cache-v1';
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const LIB_CACHE = `${CACHE_VERSION}-libs`;

const PRE_CACHE_URLS = ['/', '/sw.js'];

const LIB_HOSTS = new Set(['cdn.jsdelivr.net', 'unpkg.com', 'cdnjs.cloudflare.com']);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(IMAGE_CACHE)
      .then((cache) => cache.addAll(PRE_CACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => !key.startsWith(CACHE_VERSION)).map((key) => caches.delete(key)));
      await self.clients.claim();
    })()
  );
});

function isImageRequest(request, url) {
  return request.destination === 'image' || url.pathname.startsWith('/images/');
}

function isHeavyLibraryRequest(url) {
  if (!LIB_HOSTS.has(url.hostname)) {
    return false;
  }

  const path = url.pathname.toLowerCase();
  return (
    path.includes('@ffmpeg/core') ||
    path.includes('ffmpeg-core.js') ||
    path.includes('ffmpeg-core.wasm') ||
    path.includes('ffmpeg-core.worker.js')
  );
}

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  if (isImageRequest(request, url)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  if (isHeavyLibraryRequest(url)) {
    event.respondWith(staleWhileRevalidate(request, LIB_CACHE));
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  if (response && (response.ok || response.type === 'opaque')) {
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (response && (response.ok || response.type === 'opaque')) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || networkPromise;
}
