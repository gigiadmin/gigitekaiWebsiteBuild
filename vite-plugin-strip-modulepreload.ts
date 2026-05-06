/**
 * vite-plugin-strip-modulepreload.ts
 *
 * SAFE approach: modifies only the built HTML output.
 * Does NOT modify any JavaScript bundle code — avoids variable name collision crashes.
 *
 * Two optimizations:
 *
 * 1. REMOVE <link rel="modulepreload"> tags
 *    Vite automatically injects modulepreload for every chunk the entry point depends on.
 *    For gigitekai.com this means the browser eagerly downloads:
 *      - msal-*.js   (71KB compressed / 277KB raw) — only needed on /admin routes
 *      - vendor-*.js (466KB compressed / 1.6MB raw) — large third-party bundle
 *    By removing these, the browser only downloads chunks when actually needed.
 *
 * 2. MAKE main CSS non-blocking
 *    Vite injects the hashed CSS as a render-blocking <link rel="stylesheet">.
 *    We convert it to async loading using the media="print" trick:
 *      <link rel="stylesheet" href="..." media="print" onload="this.media='all'">
 *    Critical above-the-fold CSS is already inlined in index.html, so the page
 *    renders correctly before the full CSS loads.
 *    A <noscript> fallback ensures CSS loads for JS-disabled browsers.
 *
 * SAFETY: This only modifies HTML string output, never touches JS bundle code.
 */

import type { Plugin } from "vite";

export function stripModulePreloadLinks(): Plugin {
  return {
    name: "strip-modulepreload-links",
    apply: "build",
    transformIndexHtml(html) {
      let result = html;

      // ── 1. Remove all modulepreload links ───────────────────────────────────
      const preloadCount = (result.match(/<link\s+rel="modulepreload"/gi) || []).length;
      result = result.replace(/<link\s+rel="modulepreload"[^>]*>\s*/gi, "");
      if (preloadCount > 0) {
        console.log(
          `[strip-modulepreload] Removed ${preloadCount} modulepreload link(s)`
        );
      }

      // ── 2. Make Vite-injected CSS non-blocking ───────────────────────────────
      // Match the hashed CSS link Vite injects: <link rel="stylesheet" crossorigin href="/assets/main-HASH.css">
      // Convert to async load + noscript fallback
      const cssLinkRegex = /(<link\s+rel="stylesheet"\s+crossorigin\s+href="(\/assets\/[^"]+\.css)"[^>]*>)/gi;
      const cssMatches = Array.from(result.matchAll(cssLinkRegex));

      for (const match of cssMatches) {
        const original = match[1];
        const href = match[2];
        const asyncVersion = `<link rel="stylesheet" href="${href}" media="print" onload="this.media='all'"><noscript><link rel="stylesheet" href="${href}"></noscript>`;
        result = result.replace(original, asyncVersion);
        console.log(`[strip-modulepreload] Made CSS non-blocking: ${href}`);
      }

      return result;
    },
  };
}
