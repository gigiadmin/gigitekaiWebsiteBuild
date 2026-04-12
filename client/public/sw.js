const CACHE_NAME = 'gigitekai-admin-v1';
const RUNTIME_CACHE = 'gigitekai-admin-runtime';
const STATIC_ASSETS = [
  '/',
  '/admin',
  '/index.html',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event: network-first for API, cache-first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // API requests: network-first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const cache = caches.open(RUNTIME_CACHE);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || new Response('Offline - API not available', { status: 503 });
          });
        })
    );
    return;
  }

  // Static assets: cache-first with network fallback
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (!response || response.status !== 200) return response;
          const cache = caches.open(RUNTIME_CACHE);
          cache.then((c) => c.put(request, response.clone()));
          return response;
        })
        .catch(() => caches.match('/index.html'));
    })
  );
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
