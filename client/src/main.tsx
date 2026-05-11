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
// MSAL is only needed on /admin routes.
// We lazy-load it to avoid adding ~300KB to the public bundle.
// On admin routes, we initialize MSAL before mounting React.
// On public routes, we mount immediately without MSAL overhead.
// ============================================================

const isAdminRoute = window.location.pathname.startsWith("/admin") ||
                     window.location.pathname === "/redirect.html";

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

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      // Force update check on every page load
      registration.update();
    }).catch((error) => {
      console.warn('[PWA] Service worker registration failed:', error);
    });
  });
}

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  // Admin routes use Azure AD auth, not Manus OAuth — don't redirect to Manus login
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

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

function mountApp(MsalProvider?: React.ComponentType<{ instance: any; children: React.ReactNode }>, msalInstance?: any) {
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

    reactRoot.render(
      MsalProvider && msalInstance
        ? <MsalProvider instance={msalInstance}>{appContent}</MsalProvider>
        : appContent
    );
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

        retryRoot.render(
          MsalProvider && msalInstance
            ? <MsalProvider instance={msalInstance}>{appContent}</MsalProvider>
            : appContent
        );
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

if (isAdminRoute) {
  // Admin route: load MSAL dynamically before mounting
  Promise.all([
    import("@azure/msal-browser"),
    import("@azure/msal-react"),
    import("@/lib/msalConfig"),
  ]).then(([{ PublicClientApplication }, { MsalProvider }, { MSAL_CONFIG }]) => {
    const msalInstance = new PublicClientApplication(MSAL_CONFIG);

    // Helper: clear all stale MSAL localStorage entries
    const clearMsalCache = () => {
      try {
        const keysToRemove = Object.keys(localStorage).filter(k =>
          k.startsWith('msal.') || k.startsWith('server-telemetry-')
        );
        keysToRemove.forEach(k => localStorage.removeItem(k));
        console.log('[MSAL] Cleared', keysToRemove.length, 'stale cache entries');
      } catch (e) {
        console.warn('[MSAL] Could not clear cache:', e);
      }
    };

    return msalInstance.initialize()
      .then(() => msalInstance.handleRedirectPromise())
      .then((response) => {
        if (response) {
          // Successfully processed Microsoft redirect — account is now populated
          console.log('[MSAL] Redirect processed for:', response.account?.username);
        }
        // No response = normal page load (not returning from Microsoft)
      })
      .catch((err) => {
        // handleRedirectPromise failed — nonce/state mismatch or expired auth code.
        // This leaves a ghost nonce entry in localStorage that makes MSAL think
        // an account exists (hasEmail=false), causing "Signing in..." to get stuck.
        // Fix: clear the stale cache so the user gets a clean login button.
        console.warn('[MSAL] Redirect processing failed, clearing stale cache:', err?.message || err);
        clearMsalCache();
      })
      .then(() => mountApp(MsalProvider, msalInstance));
  }).catch((err) => {
    console.error('[MSAL] Failed to load, mounting without MSAL:', err);
    mountApp();
  });
} else {
  // Public route: mount immediately without MSAL for fastest load
  mountApp();
}
