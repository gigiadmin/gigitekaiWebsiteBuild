/**
 * Homepage SSG (Static Site Generation) Script
 * 
 * Optimizes the static HTML file for SEO and crawlers.
 * React renders the hero section normally without SSR shell injection.
 * This prevents hero section duplication while maintaining performance.
 * 
 * Run: node scripts/prerender-homepage-ssg.mjs
 * (Called automatically as part of the build pipeline)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distHtml = path.join(__dirname, '../dist/public/index.html');

if (!fs.existsSync(distHtml)) {
  console.error('[ssg] ERROR: dist/public/index.html not found. Run vite build first.');
  process.exit(1);
}

// Image URLs (must match HeroSection.tsx constants)
const HERO_BG_DESKTOP = '/manus-storage/hero-bg-desktop-opt_74642977.webp';
const HERO_BG_MOBILE  = '/manus-storage/hero-bg-mobile_d1ad476e.webp';
const HERO_VIDEO_POSTER = '/manus-storage/hero-video-poster-opt_e727c5ba.webp';
const LOGO_URL = '/manus-storage/gigitekai-logo-optimized_0b6c5e05.webp';

// SSR shell injection disabled — was causing hero duplication
// React renders the hero section directly without pre-rendered wrapper
const PRERENDERED_HTML = '';

let html = fs.readFileSync(distHtml, 'utf-8');
const original = html;

// Check if already processed
if (html.includes('data-ssg-processed')) {
  console.log('[ssg] Homepage already processed, skipping.');
  process.exit(0);
}

// SSG now only optimizes the static HTML file for SEO/crawlers
// No runtime injection — React renders normally
html = html.replace('<head>', '<head>\n  <!-- SSG processed -->');

// Also add Google Fonts preconnect if not already present (for faster font loading)
if (!html.includes('fonts.googleapis.com') && !html.includes('fonts.gstatic.com')) {
  html = html.replace(
    '<head>',
    `<head>\n  <link rel="preconnect" href="https://fonts.googleapis.com">\n  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`
  );
}

fs.writeFileSync(distHtml, html, 'utf-8');
console.log(`[ssg] ✅ Homepage optimized for static delivery (${(html.length / 1024).toFixed(1)} KB total)`);
console.log('[ssg] React renders hero section normally without SSR shell duplication');
