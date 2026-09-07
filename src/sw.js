/**
 * The service worker, emitted to /sw.js with the build id stamped in — see the
 * emit-build-id plugin in vite.config.ts.
 *
 * Why this exists: Chrome is entitled to answer a restore or history
 * navigation from its HTTP cache without asking the origin at all, whatever
 * Cache-Control says. An installed app relaunched after Android has dropped it
 * takes exactly that path, so the app came back on whatever build was cached —
 * sometimes a very old one, and it stayed there. A worker sits in front of
 * those navigations and decides for itself.
 *
 * Kill switch, should this ever misbehave: /sw.js is served no-cache, so
 * replacing this file with one that calls registration.unregister() and clears
 * caches is a normal deploy away. Nothing here can outlive the next one.
 */

const BUILD = '__BUILD_ID__';
const CACHE = `liftgauge-${BUILD}`;

/** What an offline launch falls back to: the app's own HTML, whatever the path. */
const SHELL = '/';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.add(SHELL))
      // A failed precache is not worth refusing to install over: the worker is
      // still useful for everything except an offline cold start.
      .catch(() => undefined),
  );
  // The point of this worker is that stale code stops being served. Waiting for
  // every tab to close first would be the same problem wearing a hat.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      // Each build gets its own cache, so the previous one leaves with it.
      await Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n)));
      await clients.claim();
    })(),
  );
});

/**
 * The document, fresh whenever the network can be reached.
 *
 * Fetched by URL rather than by passing the navigation request through: a
 * history navigation carries a cache mode that would let the HTTP cache answer
 * it, which is the whole bug. `no-cache` still allows a 304, so a document that
 * genuinely hasn't changed costs a revalidation rather than a download.
 */
async function freshDocument(request) {
  try {
    const response = await fetch(request.url, { cache: 'no-cache', credentials: 'same-origin' });
    if (response && response.ok) {
      const cache = await caches.open(CACHE);
      await cache.put(SHELL, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(SHELL, { cacheName: CACHE });
    return cached ?? Response.error();
  }
}

/** Hashed assets never change under their own name, so the first copy is final. */
async function cachedAsset(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  try {
    const response = await fetch(request);
    if (response && response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Firebase, Google Fonts, anything else off-origin: not this worker's
  // business, and caching someone else's auth traffic is how you break sign-in.
  if (url.origin !== self.location.origin) return;
  // The staleness check has to be able to trust this answer, and the worker
  // script itself is how a bad worker gets replaced.
  if (url.pathname === '/version.json' || url.pathname === '/sw.js') return;

  if (request.mode === 'navigate') {
    event.respondWith(freshDocument(request));
    return;
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cachedAsset(request));
  }
  // Everything else — icons, the manifest, exercise pictures — keeps the
  // browser's ordinary handling, which their own headers already describe.
});
