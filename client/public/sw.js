// GigitekAI Service Worker v4 — Network-first for all page/asset requests
// Only caches for offline fallback, never serves stale JS/CSS
const CACHE_NAME = 'gigitekai-v4';

// Install: skip waiting immediately to take over from old SW
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate: delete ALL old caches to prevent stale asset issues
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          console.log('[SW v4] Deleting old cache:', name);
          return caches.delete(name);
        })
      );
    }).then(() => {
      console.log('[SW v4] All old caches cleared, claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch: network-first for everything, no caching of assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (CDN images, analytics, etc.)
  if (url.origin !== self.location.origin) return;

  // API requests: always go to network, no caching
  if (url.pathname.startsWith('/api/')) return;

  // Hashed assets (/assets/*): always go to network
  // These have content hashes in filenames so browser HTTP cache handles them
  if (url.pathname.startsWith('/assets/')) return;

  // HTML pages: network-first, fallback to cache for offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the latest HTML for offline fallback
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || caches.match('/index.html');
          });
        })
    );
    return;
  }

  // Everything else: let the browser handle it normally
});

// Handle Web Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.warn('[SW] Push event received with no data');
    return;
  }

  let notificationData = {};
  try {
    notificationData = event.data.json();
  } catch (error) {
    console.error('[SW] Failed to parse push data:', error);
    notificationData = {
      title: 'GigitekAI Notification',
      body: event.data.text(),
    };
  }

  const { title, body, icon, badge, tag, data } = notificationData;

  event.waitUntil(
    self.registration.showNotification(title || 'GigitekAI', {
      body: body || 'You have a new notification',
      icon: icon || '/logo.png',
      badge: badge || '/badge.png',
      tag: tag || 'gigitekai-notification',
      data: data || {},
      requireInteraction: false,
    })
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = new URL('/admin', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
