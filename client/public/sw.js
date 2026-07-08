/**
 * Service Worker — Intelligent Caching Strategy for GigitekAI
 * 
 * Caching Strategies:
 * 1. Static Assets (/assets/*) — Cache-first (immutable, hashed filenames)
 * 2. API Requests (/api/*) — Network-first with offline fallback
 * 3. Navigation Requests (/) — Network-first with offline.html fallback
 * 4. Third-party Resources — Network-first with cache fallback
 * 5. Fonts — Cache-first (immutable)
 * 
 * Features:
 * - Automatic cache cleanup on activation
 * - Version-based cache management
 * - Offline fallback page for navigation
 * - Background sync for failed requests (future enhancement)
 */

const CACHE_VERSION = 'gigitekai-v2';
const ASSETS_CACHE = `${CACHE_VERSION}-assets`;
const API_CACHE = `${CACHE_VERSION}-api`;
const PAGES_CACHE = `${CACHE_VERSION}-pages`;

// Critical assets to precache on install
const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
];

// Patterns for different caching strategies
const PATTERNS = {
  assets: /\/assets\//,
  api: /\/api\//,
  fonts: /fonts\.googleapis\.com|fonts\.gstatic\.com/,
  thirdParty: /cloudfront\.net|googletagmanager\.com|stripe\.com|graph\.microsoft\.com/,
};

const CACHE_DURATIONS = {
  api: 5 * 60 * 1000, // 5 minutes
  pages: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * Install Event: Precache critical assets
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(ASSETS_CACHE).then((cache) => {
      console.log('[SW] Precaching critical assets');
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[SW] Precache failed (some assets may not be available yet):', err);
        // Don't fail install if precache fails — assets will be cached on first request
      });
    })
  );
  self.skipWaiting();
});

/**
 * Activate Event: Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete caches that don't match current version
          if (!cacheName.startsWith(CACHE_VERSION)) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Cache cleanup complete');
      return self.clients.claim();
    })
  );
});

/**
 * Fetch Event: Route requests to appropriate caching strategy
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions and other non-http(s) protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Route to appropriate handler based on request type
  if (PATTERNS.assets.test(url.pathname)) {
    // Static assets: Cache-first (immutable, hashed filenames)
    event.respondWith(cacheFirstStrategy(request, ASSETS_CACHE));
  } else if (PATTERNS.api.test(url.pathname)) {
    // API requests: Network-first with cache fallback
    event.respondWith(networkFirstStrategy(request, API_CACHE));
  } else if (PATTERNS.fonts.test(url.hostname)) {
    // Fonts: Cache-first
    event.respondWith(cacheFirstStrategy(request, ASSETS_CACHE));
  } else if (PATTERNS.thirdParty.test(url.hostname)) {
    // Third-party resources: Network-first with cache fallback
    event.respondWith(networkFirstStrategy(request, API_CACHE));
  } else if (request.mode === 'navigate') {
    // Navigation requests: Network-first with offline.html fallback
    event.respondWith(navigationStrategy(request));
  } else {
    // Default: Network-first with cache fallback
    event.respondWith(networkFirstStrategy(request, PAGES_CACHE));
  }
});

/**
 * Cache-first strategy: Use cache if available, fall back to network
 * Best for: Static assets, fonts, immutable resources
 */
async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    console.log('[SW] Cache hit:', request.url);
    return cached;
  }

  try {
    console.log('[SW] Fetching from network:', request.url);
    const response = await fetch(request);

    // Only cache successful responses
    if (response && response.status === 200) {
      const cloned = response.clone();
      cache.put(request, cloned);
    }

    return response;
  } catch (error) {
    console.warn('[SW] Fetch failed:', request.url, error);
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return cache.match('/offline.html');
    }
    throw error;
  }
}

/**
 * Network-first strategy: Try network first, fall back to cache
 * Best for: API calls, dynamic content, frequently updated resources
 */
async function networkFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    console.log('[SW] Fetching from network:', request.url);
    const response = await fetch(request);

    // Cache successful responses
    if (response && response.status === 200) {
      const cloned = response.clone();
      cache.put(request, cloned);
    }

    return response;
  } catch (error) {
    console.warn('[SW] Network request failed, trying cache:', request.url);
    const cached = await cache.match(request);

    if (cached) {
      console.log('[SW] Cache hit (fallback):', request.url);
      return cached;
    }

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return cache.match('/offline.html');
    }

    throw error;
  }
}

/**
 * Navigation strategy: Handle page navigation with offline fallback
 */
async function navigationStrategy(request) {
  const cache = await caches.open(PAGES_CACHE);

  try {
    console.log('[SW] Navigating to:', request.url);
    const response = await fetch(request);

    // Cache successful HTML responses
    if (response && response.status === 200) {
      const cloned = response.clone();
      cache.put(request, cloned);
    }

    return response;
  } catch (error) {
    console.warn('[SW] Navigation failed, showing offline page:', request.url);
    const offline = await cache.match('/offline.html');
    if (offline) {
      return offline;
    }

    // Fallback if offline.html is not cached
    return new Response('Offline - Unable to load page', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain',
      }),
    });
  }
}

/**
 * Message handler: Allow clients to control cache behavior
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
    });
  }
});
