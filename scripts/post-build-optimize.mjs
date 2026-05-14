/**
 * Post-build optimization script
 * Runs AFTER `vite build` completes to apply performance fixes that
 * Vite plugins cannot reliably apply (due to plugin ordering issues with vitePluginManusRuntime).
 *
 * Fixes applied:
 * 1. Convert render-blocking CSS to async preload (saves ~640ms on mobile LCP)
 * 2. Add preload hints for critical JS chunks (main + react-core)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distHtml = path.join(__dirname, '../dist/public/index.html');

if (!fs.existsSync(distHtml)) {
  console.error('[post-build] ERROR: dist/public/index.html not found. Run vite build first.');
  process.exit(1);
}

let html = fs.readFileSync(distHtml, 'utf-8');
const original = html;

// ─── Fix 1: Convert blocking CSS to async preload ───────────────────────────
// Pattern: <link rel="stylesheet" crossorigin href="/assets/main-HASH.css">
// OR:      <link rel="stylesheet" href="/assets/main-HASH.css">
let cssFixed = 0;
const seenCss = new Set();

html = html.replace(
  /<link rel="stylesheet"(?: crossorigin)? href="(\/assets\/[^"]+\.css)">/g,
  (match, cssHref) => {
    if (seenCss.has(cssHref)) {
      // Duplicate — remove it entirely
      console.log(`[post-build] Removed duplicate CSS link: ${cssHref}`);
      return '';
    }
    seenCss.add(cssHref);
    cssFixed++;
    console.log(`[post-build] Made async: ${cssHref}`);
    return [
      `<link rel="preload" as="style" href="${cssHref}" onload="this.onload=null;this.rel='stylesheet'">`,
      `<noscript><link rel="stylesheet" href="${cssHref}"></noscript>`
    ].join('\n    ');
  }
);

// ─── Fix 2: Add preload hints for critical JS chunks ─────────────────────────
// Find main chunk hash
const mainMatch = html.match(/<script[^>]*src="\/assets\/main-([a-zA-Z0-9_]+)\.js"/);
const reactMatch = html.match(/\/assets\/react-core-([a-zA-Z0-9_]+)\.js/);

if (mainMatch && reactMatch) {
  const mainChunk = `/assets/main-${mainMatch[1]}.js`;
  const reactChunk = `/assets/react-core-${reactMatch[1]}.js`;

  // Only add if not already present
  if (!html.includes(`rel="preload" as="script" href="${mainChunk}"`)) {
    const preloadHints = [
      `<link rel="preload" as="script" crossorigin href="${mainChunk}">`,
      `<link rel="preload" as="script" crossorigin href="${reactChunk}">`,
    ].join('\n    ');

    // Inject right before the first <script type="module"> tag
    html = html.replace(
      `<script type="module" crossorigin src="${mainChunk}">`,
      `${preloadHints}\n    <script type="module" crossorigin src="${mainChunk}">`
    );
    console.log(`[post-build] Added preload hints for: ${mainChunk}, ${reactChunk}`);
  }
} else {
  console.warn('[post-build] WARNING: Could not find main or react-core chunk for preload hints');
}

// ─── Write result ─────────────────────────────────────────────────────────────
if (html !== original) {
  fs.writeFileSync(distHtml, html, 'utf-8');
  console.log(`[post-build] ✅ Optimized dist/public/index.html (${cssFixed} CSS links made async)`);
} else {
  console.log('[post-build] No changes needed (already optimized)');
}
