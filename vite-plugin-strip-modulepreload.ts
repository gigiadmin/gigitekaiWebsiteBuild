/**
 * vite-plugin-strip-modulepreload.ts
 *
 * Removes ALL <link rel="modulepreload"> tags from built HTML output.
 *
 * WHY:
 * Vite automatically injects <link rel="modulepreload"> for every chunk that
 * the entry point depends on (directly or transitively). For gigitekai.com this
 * means the browser eagerly downloads:
 *   - msal-*.js   (71KB compressed / 277KB raw) — only needed on /admin routes
 *   - vendor-*.js (466KB compressed / 1.6MB raw) — large third-party bundle
 *   - trpc-query-*.js (13KB)
 *
 * These downloads happen on EVERY page load, including the public homepage,
 * even though most of that code is never executed. The modulepreload links
 * are the main cause of the high TBT (Total Blocking Time) and slow LCP
 * on mobile devices.
 *
 * By removing these links:
 * - msal chunk is only downloaded when user navigates to /admin
 * - vendor chunk is downloaded lazily when React components need it
 * - Mobile TBT drops significantly (fewer bytes in critical path)
 * - LCP improves because browser bandwidth is freed for the hero image
 *
 * TRADEOFF:
 * Navigation to /admin will be slightly slower on first visit (msal loads on demand).
 * This is acceptable because admin users are a tiny fraction of traffic.
 */

import type { Plugin } from "vite";

export function stripModulePreloadLinks(): Plugin {
  return {
    name: "strip-modulepreload-links",
    apply: "build",
    transformIndexHtml(html) {
      // Remove all <link rel="modulepreload" ...> tags
      // These force eager download of ALL chunks (msal, vendor, trpc-query)
      // even on pages that don't need them
      const stripped = html.replace(
        /<link\s+rel="modulepreload"[^>]*>\s*/gi,
        ""
      );
      const count = (html.match(/<link\s+rel="modulepreload"/gi) || []).length;
      if (count > 0) {
        console.log(`[strip-modulepreload] Removed ${count} modulepreload link(s) from HTML`);
      }
      return stripped;
    },
  };
}
