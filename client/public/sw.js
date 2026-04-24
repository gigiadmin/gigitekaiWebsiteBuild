// GigitekAI Service Worker v4 — Safari/iOS PWA Compatible
// Key Safari fixes:
//   1. Never cache OAuth/auth redirects (causes redirect loops in Safari standalone mode)
//   2. Never cache API responses that set cookies (Safari ITP strips cookies from cached responses)
//   3. Use network-first for all navigation requests (prevents stale auth state)
//   4. Skip caching for opaque responses (Safari handles these differently)

const CACHE_NAME = 'gigitekai-v4';
const RUNTIME_CACHE = 'gigitekai-runtime-v4';

// Only cache truly static assets (no HTML pages that require auth)
const STATIC_ASSETS = [
  '/manifest.json',
];

// Paths that must NEVER be cached — auth, OAuth, API calls
const NO_CACHE_PATHS = [
  '/api/',
  '/oauth',
  '/callback',
  '/login',
  '/logout',
  '/auth',
];

// Check if a URL should never be cached
function shouldSkipCache(url) {
  return NO_CACHE_PATHS.some(path => url.pathname.includes(path));
}

// Install event — only cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Cache addAll partial error (non-fatal):', err);
      });
    })
  );
  // Take control immediately — important for Safari PWA
  self.skipWaiting();
});

// Activate event — clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event — Safari-safe strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests entirely (POST, PUT, DELETE etc.)
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (CDN, analytics, fonts — let browser handle them)
  if (url.origin !== self.location.origin) return;

  // CRITICAL: Never intercept auth/OAuth paths — causes redirect loops in Safari
  if (shouldSkipCache(url)) return;

  // CRITICAL: Never cache navigation requests that could be auth-protected pages
  // Safari PWA in standalone mode loses cookies on navigation if cached
  // Use network-first for ALL HTML navigation requests
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Don't cache redirects — these cause loops in Safari
          if (response.type === 'opaqueredirect' || response.redirected) {
            return response;
          }
          // Only cache successful non-redirect responses
          if (response.ok && response.status === 200) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // Offline fallback — serve cached index.html
          return caches.match('/index.html').then(cached => {
            return cached || new Response('Offline', { status: 503 });
          });
        })
    );
    return;
  }

  // Static assets (JS, CSS, images, fonts) — cache-first with network fallback
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        // Don't cache opaque responses (cross-origin without CORS) — Safari issue
        if (!response || response.type === 'opaque' || response.status !== 200) {
          return response;
        }

        const clone = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
        return response;
      }).catch(() => {
        // Return nothing for failed asset requests — don't break the page
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
