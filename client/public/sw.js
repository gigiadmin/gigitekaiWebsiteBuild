// GigitekAI Service Worker v6 — Network-first for EVERYTHING
// Key fixes in v6:
//   1. Bumped cache version to force eviction of ALL v5 stale caches
//   2. ALL requests use network-first strategy (no cache-first for JS/CSS)
//   3. This prevents stale JavaScript chunks from causing React crashes
//   4. Hashed assets (e.g. index-DpchgxQM.js) are safe to cache after fetch
//   5. On activate: immediately delete ALL old caches to prevent stale content
const CACHE_NAME = 'gigitekai-v6';

// Paths that must NEVER be cached — auth, OAuth, API calls, admin pages
const NO_CACHE_PATHS = [
  '/api/',
  '/oauth',
  '/callback',
  '/login',
  '/logout',
  '/auth',
  '/admin',
  '/helpdesk',
];

// Check if a URL should never be cached
function shouldSkipCache(url) {
  return NO_CACHE_PATHS.some(path => url.pathname.startsWith(path) || url.pathname.includes(path));
}

// Install event — skip waiting immediately to take control
self.addEventListener('install', (event) => {
  // Take control immediately
  self.skipWaiting();
});

// Activate event — AGGRESSIVELY clean up ALL old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW v6] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event — NETWORK-FIRST for everything
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests entirely (POST, PUT, DELETE etc.)
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (CDN, analytics, fonts — let browser handle them)
  if (url.origin !== self.location.origin) return;

  // CRITICAL: Never intercept auth/OAuth paths
  if (shouldSkipCache(url)) return;

  // NETWORK-FIRST for ALL requests
  // This prevents stale JS chunks from causing React dual-instance crashes
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Don't cache redirects
        if (response.type === 'opaqueredirect' || response.redirected) {
          return response;
        }
        // Only cache successful responses for hashed assets (safe to cache)
        if (response.ok && response.status === 200) {
          // Only cache hashed static assets (they have content-based hashes in filename)
          const isHashedAsset = url.pathname.match(/\/assets\/[^/]+-[a-zA-Z0-9]{8}\.(js|css|woff2?)$/);
          if (isHashedAsset) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
        }
        return response;
      })
      .catch(() => {
        // Network failed — try cache as fallback for hashed assets only
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          // For navigation requests, don't serve anything — let browser show error
          if (request.mode === 'navigate') {
            return new Response('', { status: 503 });
          }
          return new Response('', { status: 503 });
        });
      })
  );
});

// Handle Web Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.warn('[SW] Push event with no data');
    return;
  }

  let notificationData = {};
  try {
    notificationData = event.data.json();
  } catch {
    notificationData = {
      title: 'GigitekAI',
      body: event.data.text(),
    };
  }

  const { title, body, icon, badge, tag, data } = notificationData;

  event.waitUntil(
    self.registration.showNotification(title || 'GigitekAI', {
      body: body || 'You have a new notification',
      icon: icon || 'https://d2xsxph8kpxj0f.cloudfront.net/310519663509163804/mmTCDMc2kTTVcTkwoY8f9U/icon-192_a8893ff4.png',
      badge: badge || 'https://d2xsxph8kpxj0f.cloudfront.net/310519663509163804/mmTCDMc2kTTVcTkwoY8f9U/icon-72_19b3738f.png',
      tag: tag || 'gigitekai-notification',
      data: data || {},
      requireInteraction: false,
    })
  );
});

// Handle notification clicks — open or focus the admin panel
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url)
    ? new URL(event.notification.data.url, self.location.origin).href
    : new URL('/admin', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if already open
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle messages from clients (e.g. force update)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(names => Promise.all(names.map(n => caches.delete(n))));
  }
});
