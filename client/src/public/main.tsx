/**
 * Public marketing site entry (client/site.html).
 *
 * Deliberately minimal: no Sentry, no service worker, no analytics, no tRPC
 * provider, no chat widget. The admin application has its own entry
 * (client/src/main.tsx) and is unaffected by this file.
 */
import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App";
import "./site.css";

const root = document.getElementById("root")!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// Prerendered pages (scripts/prerender-public-site.mjs) are marked so we hydrate
// instead of re-rendering; client-only routes (blog) mount fresh.
if (root.dataset.prerendered === "true") {
  hydrateRoot(root, app);
} else {
  createRoot(root).render(app);
}

// NOTE: The application's service worker (/sw.js, scope "/") is intentionally
// left alone. It uses a network-first strategy for navigations, so returning
// visitors receive the new pages, and unregistering it here would destroy the
// admin push-notification subscription.
