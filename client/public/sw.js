/**
 * Service Worker — Network-first strategy for dynamic imports
 * 
 * Prevents stale chunk errors by:
 * 1. Always trying network first for /assets/ (dynamic imports)
 * 2. Falling back to cache only if network fails
 * 3. Clearing all caches on activation to prevent stale chunks
 */

const CACHE_NAME = 'gigitekai-v1';
const ASSETS_PATH = '/assets/';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(names.map((name) => caches.delete(name))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll())
      .then((clients) => clients.forEach((client) => client.navigate(client.url)))
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Network-first strategy for dynamic imports (/assets/)
  // This prevents "Failed to fetch dynamically imported module" errors
  if (url.pathname.startsWith(ASSETS_PATH)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache successful responses
          if (response && response.status === 200) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, cloned);
            });
          }
          return response;
        })
        .catch(() => {
          // Fall back to cache if network fails
          return caches.match(request);
        })
    );
    return;
  }

  // For other requests, use default browser behavior
  // (don't cache, let browser handle)
});
