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
    root.innerHTML = '';
    root.appendChild(el);
  } else {
    // Fallback: append directly to body
    document.body.appendChild(el);
  }

  return el;
}

// Register service worker for PWA — deferred to requestIdleCallback to avoid TBT
if ('serviceWorker' in navigator) {
  const registerSW = () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      // Force update check on every page load
      registration.update();
    }).catch((error) => {
      console.warn('[PWA] Service worker registration failed:', error);
    });
  };
  
  // Use requestIdleCallback if available, otherwise defer to load event
  const win = window as Window & typeof globalThis & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void };
  if (win.requestIdleCallback) {
    win.requestIdleCallback(registerSW, { timeout: 2000 });
  } else {
    (window as Window).addEventListener('load', registerSW);
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
        document.body.innerHTML = `
          <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0A0E1A;color:white;font-family:sans-serif;text-align:center;padding:2rem;">
            <div>
              <h1 style="color:#00D4FF;font-size:2.5rem;margin-bottom:1rem;">GigitekAI</h1>
              <p style="font-size:1.2rem;margin-bottom:2rem;">We're experiencing a temporary issue. Please try refreshing the page.</p>
              <button onclick="location.reload()" style="background:#00D4FF;color:#0A0E1A;border:none;padding:12px 32px;font-size:1rem;border-radius:8px;cursor:pointer;font-weight:600;">Refresh Page</button>
            </div>
          </div>
        `;
      }
    }, 100);
  }
}

// Mount immediately — no MSAL overhead
mountApp();
