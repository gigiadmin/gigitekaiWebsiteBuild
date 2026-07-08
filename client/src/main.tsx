import React from "react";
import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import { HelmetProvider } from "react-helmet-async";
import "./index.css";

// ============================================================
// SERVICE WORKER REGISTRATION & MANAGEMENT
// Registers the service worker for offline support, caching,
// and background sync capabilities.
// ============================================================
function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('[SW] Service Workers not supported in this browser');
    return;
  }

  // Register service worker on page load
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      console.log('[SW] Service Worker registered successfully:', registration);

      // Check for updates periodically (every 6 hours)
      setInterval(() => {
        registration.update().catch((err) => {
          console.warn('[SW] Update check failed:', err);
        });
      }, 6 * 60 * 60 * 1000);

      // Listen for controller change (new SW activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[SW] New Service Worker activated');
        // Optionally notify user about updates
        notifyUserOfUpdate();
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'CACHE_UPDATED') {
          console.log('[SW] Cache updated:', event.data.payload);
        }
      });
    } catch (error) {
      console.error('[SW] Service Worker registration failed:', error);
    }
  });

  // Handle online/offline events
  window.addEventListener('online', () => {
    console.log('[SW] Connection restored');
    document.body.classList.remove('offline-mode');
  });

  window.addEventListener('offline', () => {
    console.log('[SW] Connection lost');
    document.body.classList.add('offline-mode');
  });
}

// Notify user when a new service worker version is available
function notifyUserOfUpdate() {
  // You can implement a toast notification here
  // For now, just log it
  console.log('[SW] New version available. Page will update on next visit.');
}

// Initialize service worker registration
registerServiceWorker();

// ============================================================
// PRODUCTION FIX: Manus platform injects manus-runtime which
// bundles its own React and targets elements with id="root" or
// id="app". To avoid the dual-React conflict, we create a fresh
// mount point that manus-runtime doesn't know about.
// ============================================================
function getOrCreateMountPoint(): HTMLElement {
  // First try our custom mount point (survives across hot reloads)
  let el = document.getElementById('gigitekai-app');
  if (el) return el;

  // Create a brand new element that manus-runtime won't target
  el = document.createElement('div');
  el.id = 'gigitekai-app';
  el.style.cssText = 'min-height:100vh;';

  // Try to insert into #root if it exists (preserves expected DOM structure)
  const root = document.getElementById('root');
  if (root) {
    // Clear anything manus-runtime may have put in #root
    while (root.firstChild) {
      root.removeChild(root.firstChild);
    }
    root.appendChild(el);
  } else {
    // Fallback: append directly to body
    document.body.appendChild(el);
  }

  return el;
}

// ============================================================
// CHUNK LOAD ERROR AUTO-RELOAD
// After a new deployment, Vite generates new content-hashed chunk
// filenames. If a user has the old app cached and tries to lazy-load
// a chunk that no longer exists, the browser throws a ChunkLoadError.
// We detect this and force a hard reload ONCE to fetch the new build.
// A sessionStorage flag prevents infinite reload loops.
// ============================================================
(function handleChunkLoadErrors() {
  const RELOAD_KEY = 'gigitekai_chunk_reload_v1';

  // Listen for unhandled promise rejections (lazy import failures)
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    if (!error) return;

    const isChunkError =
      error?.name === 'ChunkLoadError' ||
      (typeof error?.message === 'string' &&
        (
          error.message.includes('Failed to fetch dynamically imported module') ||
          error.message.includes('Importing a module script failed') ||
          error.message.includes('error loading dynamically imported module') ||
          error.message.includes('Unable to preload CSS')
        )
      );

    if (!isChunkError) return;

    // Only auto-reload once per session to prevent infinite loops
    const alreadyReloaded = sessionStorage.getItem(RELOAD_KEY);
    if (alreadyReloaded) {
      console.warn('[GigitekAI] Chunk load error persists after reload — skipping auto-reload to prevent loop.');
      return;
    }

    console.warn('[GigitekAI] Stale chunk detected — reloading to fetch new build...', error.message);
    sessionStorage.setItem(RELOAD_KEY, '1');
    // Hard reload bypasses browser cache
    window.location.reload();
  });

  // Also listen for synchronous script errors (e.g. preload link failures)
  window.addEventListener('error', (event) => {
    const target = event.target as HTMLElement;
    if (!target) return;
    const tagName = target.tagName?.toLowerCase();
    if (tagName !== 'script' && tagName !== 'link') return;

    const src = (target as HTMLScriptElement).src || (target as HTMLLinkElement).href || '';
    if (!src.includes('/assets/')) return;

    const alreadyReloaded = sessionStorage.getItem(RELOAD_KEY);
    if (alreadyReloaded) return;

    console.warn('[GigitekAI] Asset load error — reloading to fetch new build...', src);
    sessionStorage.setItem(RELOAD_KEY, '1');
    window.location.reload();
  }, true /* capture phase — fires before React */);
})();

// NOTE: Service worker cleanup removed — we now manage SW lifecycle properly
// The new service worker handles cache cleanup on activation

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  // Admin routes use password auth, not Manus OAuth — don't redirect to Manus login
  if (window.location.pathname.startsWith("/admin")) return;

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

/**
 * Strip empty superjson meta from tRPC GET request URLs.
 * Cloudflare WAF on gigitekai.com blocks requests containing
 * `"meta":{"values":{}}` in the query string (superjson format).
 * When meta.values is empty there are no special types to deserialize,
 * so removing it is safe and the server still processes the request correctly.
 */
function stripEmptySuperjsonMeta(url: string | URL | Request): string | URL | Request {
  if (typeof url !== 'string') return url;
  try {
    const urlObj = new URL(url, window.location.origin);
    const inputParam = urlObj.searchParams.get('input');
    if (!inputParam) return url;
    const parsed = JSON.parse(decodeURIComponent(inputParam));
    let changed = false;
    // Iterate over each batch item ("0", "1", etc.)
    for (const key of Object.keys(parsed)) {
      const item = parsed[key];
      if (item && typeof item === 'object' && item.meta && typeof item.meta === 'object') {
        // Remove meta if values is empty or missing
        const values = item.meta.values;
        if (!values || (typeof values === 'object' && Object.keys(values).length === 0)) {
          delete item.meta;
          changed = true;
        }
      }
    }
    if (changed) {
      urlObj.searchParams.set('input', JSON.stringify(parsed));
      return urlObj.toString();
    }
  } catch {
    // If parsing fails, return original URL unchanged
  }
  return url;
}

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        // NOTE: stripEmptySuperjsonMeta is disabled because it was breaking Date deserialization
        // The server now handles WAF bypass via response headers instead
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

function mountApp() {
  const mountPoint = getOrCreateMountPoint();
  try {
    const reactRoot = createRoot(mountPoint);

    const appContent = (
      <HelmetProvider>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </trpc.Provider>
      </HelmetProvider>
    );

    reactRoot.render(appContent);
    // Hide the pre-rendered static hero now that React has mounted
    const staticHero = document.getElementById('static-hero');
    if (staticHero) staticHero.style.display = 'none';
    console.log('[GigitekAI] React mounted successfully');
  } catch (err) {
    console.error('[GigitekAI] React mount failed, retrying...', err);
    // Retry once with a fresh element
    setTimeout(() => {
      try {
        const freshEl = document.createElement('div');
        freshEl.id = 'gigitekai-app-retry';
        freshEl.style.cssText = 'min-height:100vh;';
        document.body.appendChild(freshEl);
        const retryRoot = createRoot(freshEl);

        const appContent = (
          <HelmetProvider>
            <trpc.Provider client={trpcClient} queryClient={queryClient}>
              <QueryClientProvider client={queryClient}>
                <App />
              </QueryClientProvider>
            </trpc.Provider>
          </HelmetProvider>
        );

        retryRoot.render(appContent);
        const staticHero2 = document.getElementById('static-hero');
        if (staticHero2) staticHero2.style.display = 'none';
        console.log('[GigitekAI] React mounted on retry');
      } catch (retryErr) {
        console.error('[GigitekAI] React mount retry also failed:', retryErr);
        // Build error UI without innerHTML to avoid deprecated API warning
        const errorContainer = document.createElement('div');
        errorContainer.style.cssText = 'min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0A0E1A;color:white;font-family:sans-serif;text-align:center;padding:2rem;';
        
        const errorContent = document.createElement('div');
        
        const heading = document.createElement('h1');
        heading.style.cssText = 'color:#00D4FF;font-size:2.5rem;margin-bottom:1rem;';
        heading.textContent = 'GigitekAI';
        errorContent.appendChild(heading);
        
        const message = document.createElement('p');
        message.style.cssText = 'font-size:1.2rem;margin-bottom:2rem;';
        message.textContent = "We're experiencing a temporary issue. Please try refreshing the page.";
        errorContent.appendChild(message);
        
        const button = document.createElement('button');
        button.style.cssText = 'background:#00D4FF;color:#0A0E1A;border:none;padding:12px 32px;font-size:1rem;border-radius:8px;cursor:pointer;font-weight:600;';
        button.textContent = 'Refresh Page';
        button.addEventListener('click', () => location.reload());
        errorContent.appendChild(button);
        
        errorContainer.appendChild(errorContent);
        document.body.appendChild(errorContainer);
      }
    }, 100);
  }
}

// PERFORMANCE: Mount React immediately. The static hero in index.html
// provides instant FCP. React mounting will happen as soon as the JS
// is parsed, replacing the static hero with the interactive version.
mountApp();

// Log offline status on startup
if (!navigator.onLine) {
  console.log('[App] Starting in offline mode');
  document.body.classList.add('offline-mode');
}
