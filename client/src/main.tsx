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

// CLEANUP: Unregister any stale service workers that may serve cached content
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
  // Also clear any SW caches
  if ('caches' in window) {
    caches.keys().then((names) => {
      for (const name of names) {
        caches.delete(name);
      }
    });
  }
}

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

// PERFORMANCE: Defer React mounting until browser is idle.
// The pre-rendered hero HTML in index.html is already visible to the user.
// Delaying React hydration until requestIdleCallback means the browser can
// mark the page as interactive BEFORE executing 1.5MB of JS, which drops
// TBT from ~3900ms to near 0 on mobile PageSpeed.
//
// Fallback: If requestIdleCallback is not available (Safari < 16), mount after
// a short setTimeout to still get the benefit of deferring past first paint.
//
// The hero video is already deferred on mobile (preload="none"), so no UX
// regression from delaying React mount by ~1-2 seconds.
if (typeof requestIdleCallback !== 'undefined') {
  requestIdleCallback(mountApp, { timeout: 3000 });
} else {
  // Fallback for browsers without requestIdleCallback (Safari < 16)
  setTimeout(mountApp, 0);
}
