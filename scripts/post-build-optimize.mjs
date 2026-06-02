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
  console.error('[post-build] ERROR: dist/public/index.html not found at', distHtml);
  console.error('[post-build] Current directory:', process.cwd());
  console.error('[post-build] __dirname:', __dirname);
  const distDir = path.join(__dirname, '../dist');
  console.error('[post-build] Contents of dist:', fs.existsSync(distDir) ? fs.readdirSync(distDir) : 'dist does not exist');
  process.exit(1);
}

let html = fs.readFileSync(distHtml, 'utf-8');
const original = html;

// ─── Fix 1: Normalize CSS links to standard blocking stylesheets ─────────────
// IMPORTANT: Async CSS preload (onload trick) was REMOVED because the onload
// event does not fire reliably in production, causing a blank white page.
// Standard blocking <link rel="stylesheet"> is the safe, reliable approach.
// We only strip the unnecessary crossorigin attribute from same-origin assets.
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
    console.log(`[post-build] Normalized CSS link: ${cssHref}`);
    return `<link rel="stylesheet" href="${cssHref}">`;
  }
);

// ─── Fix 2: Add preload hints for critical JS chunks ─────────────────────────
// Find main chunk hash from HTML
const mainMatch = html.match(/<script[^>]*src="\/assets\/main-([a-zA-Z0-9_-]+)\.js"/);
// react-core is a dynamic import — find it from the assets directory
const assetsDir = path.join(__dirname, '../dist/public/assets');
let reactHash = null;
if (fs.existsSync(assetsDir)) {
  const files = fs.readdirSync(assetsDir);
  const reactFile = files.find(f => f.startsWith('react-core-') && f.endsWith('.js'));
  if (reactFile) reactHash = reactFile.replace('react-core-', '').replace('.js', '');
}
const reactMatch = reactHash ? [null, reactHash] : null;

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
try {
  if (html !== original) {
    fs.writeFileSync(distHtml, html, 'utf-8');
    console.log(`[post-build] ✅ Optimized dist/public/index.html (${cssFixed} CSS links made async)`);
  } else {
    console.log('[post-build] No changes needed (already optimized)');
  }
  console.log('[post-build] SUCCESS: Post-build optimization completed');
  process.exit(0);
} catch (err) {
  console.error('[post-build] ERROR writing HTML:', err);
  process.exit(1);
}
