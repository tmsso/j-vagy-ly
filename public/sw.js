// Service worker: makes the game work offline after one online visit.
//
// Hand-written on purpose (ROADMAP Phase 2): the app is a single static page,
// so a few dozen readable lines beat a build plugin. Caching strategy per kind
// of request:
//
//   page (navigation)   network-first, cached copy when offline. Never
//                       cache-first: a cached HTML page points at the JS chunk
//                       hashes of the deploy it came from, and those disappear
//                       after the next deploy.
//   /_next/static/*     cache-first. Content-hashed file names, so a URL's
//                       content never changes.
//   /jly-pairs.json     stale-while-revalidate: instant from cache, refreshed
//                       in the background for the next visit.
//   icons, manifest     stale-while-revalidate.
//
// Bump VERSION only when this file's caching logic changes; old caches are
// deleted on activate. A changed sw.js is picked up by the browser on its own
// (it is served with Cache-Control: no-cache, see next.config.ts).

const VERSION = 'v1';
const PAGE_CACHE = `jly-pages-${VERSION}`;
const STATIC_CACHE = `jly-static-${VERSION}`;
const DATA_CACHE = `jly-data-${VERSION}`;
const CURRENT_CACHES = [PAGE_CACHE, STATIC_CACHE, DATA_CACHE];

// Hashed chunks from every deploy accumulate in STATIC_CACHE; keep it bounded.
const MAX_STATIC_ENTRIES = 80;

const DATA_URLS = ['/jly-pairs.json', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      // Cache the page *and* the chunks it references. The first visit loaded
      // them before this worker existed, so they would not be cached otherwise.
      const response = await fetch('/', { cache: 'no-cache' });
      const html = await response.clone().text();
      await (await caches.open(PAGE_CACHE)).put('/', response);
      const assets = [...new Set(html.match(/\/_next\/static\/[^"'\s)\\]+/g) || [])];
      await (await caches.open(STATIC_CACHE)).addAll(assets);
      await (await caches.open(DATA_CACHE)).addAll(DATA_URLS);
      await self.skipWaiting(); // Activate at once; network-first pages make this safe
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n.startsWith('jly-') && !CURRENT_CACHES.includes(n)).map((n) => caches.delete(n)));
      await self.clients.claim(); // Control the already-open page too
    })()
  );
});

// The page posts the static URLs it loaded (see ServiceWorkerRegister.tsx) so
// lazily loaded chunks get cached as well.
self.addEventListener('message', (event) => {
  const urls = event.data && event.data.type === 'CACHE_URLS' ? event.data.urls : null;
  if (!Array.isArray(urls)) return;
  const safe = urls.filter((u) => typeof u === 'string' && u.startsWith('/_next/static/'));
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => Promise.all(safe.map((u) => cache.match(u).then((hit) => hit || cache.add(u).catch(() => {}))))));
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // e.g. the Google lookup links

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
  } else if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request));
  } else if (DATA_URLS.includes(url.pathname) || url.pathname.startsWith('/icons/')) {
    event.respondWith(staleWhileRevalidate(event, request));
  }
  // Anything else goes straight to the network, untouched.
});

async function networkFirst(request) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const response = await fetch(request);
    // Single-page app: store every navigation under '/', the only page there is.
    if (response.ok) await cache.put('/', response.clone());
    return response;
  } catch {
    return (await cache.match('/')) || Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
    trim(cache, MAX_STATIC_ENTRIES);
  }
  return response;
}

async function staleWhileRevalidate(event, request) {
  const cache = await caches.open(DATA_CACHE);
  const hit = await cache.match(request, { ignoreSearch: true });
  const refresh = fetch(request)
    .then((response) => {
      if (response.ok) return cache.put(request, response.clone()).then(() => response);
      return response;
    })
    .catch(() => undefined);
  if (hit) {
    event.waitUntil(refresh); // Keep the worker alive until the background refresh lands
    return hit;
  }
  return (await refresh) || Response.error();
}

async function trim(cache, max) {
  const keys = await cache.keys(); // Insertion order: oldest first
  await Promise.all(keys.slice(0, Math.max(0, keys.length - max)).map((k) => cache.delete(k)));
}
