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

// Register service worker for PWA — force update check on every page load
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      console.log('[PWA] Service worker registered:', registration);
      // Force check for new SW version on every page load
      registration.update();
      // If a new SW is waiting, tell it to activate immediately
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              console.log('[PWA] New service worker activated, reloading...');
              window.location.reload();
            }
          });
        }
      });
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

// Defensive mount: handle potential manus-runtime conflict in production
const rootEl = document.getElementById("root");
if (rootEl) {
  // Clear any content that manus-runtime may have injected
  rootEl.innerHTML = '';
  
  try {
    const root = createRoot(rootEl);
    root.render(
      <HelmetProvider>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </trpc.Provider>
      </HelmetProvider>
    );
  } catch (err) {
    console.error('[GigitekAI] React mount failed:', err);
    // Fallback: try again after a short delay
    setTimeout(() => {
      try {
        rootEl.innerHTML = '';
        const root = createRoot(rootEl);
        root.render(
          <HelmetProvider>
            <trpc.Provider client={trpcClient} queryClient={queryClient}>
              <QueryClientProvider client={queryClient}>
                <App />
              </QueryClientProvider>
            </trpc.Provider>
          </HelmetProvider>
        );
      } catch (retryErr) {
        console.error('[GigitekAI] React mount retry failed:', retryErr);
      }
    }, 100);
  }
} else {
  console.error('[GigitekAI] #root element not found');
}
