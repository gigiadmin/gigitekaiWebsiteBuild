/**
 * Homepage SSG (Static Site Generation) Script
 * 
 * Injects pre-rendered above-fold HTML directly into dist/public/index.html
 * so browsers see real content immediately without waiting for React to boot.
 * 
 * This eliminates the ~1,150ms "element render delay" in LCP breakdown.
 * React then hydrates the page silently in the background.
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

// The pre-rendered above-fold HTML — mirrors what React would render
// Styled with inline styles so it works before the CSS loads
const PRERENDERED_HTML = `
<div id="ssr-shell" aria-hidden="false">
  <!-- Pre-rendered navbar -->
  <header style="position:fixed;top:0;left:0;right:0;z-index:50;background:rgba(10,14,26,0.95);backdrop-filter:blur(12px);border-bottom:1px solid rgba(0,212,255,0.1);">
    <div style="max-width:1280px;margin:0 auto;padding:0 1.5rem;display:flex;align-items:center;justify-content:space-between;height:64px;">
      <a href="/" style="display:flex;align-items:center;text-decoration:none;" aria-label="GigitekAI Home">
        <img src="${LOGO_URL}" alt="GigitekAI logo" width="140" height="40" style="height:40px;width:auto;object-fit:contain;" fetchpriority="high" decoding="async" />
      </a>
      <nav style="display:none;" aria-label="Main navigation">
        <a href="/services" style="color:#e0e0e0;text-decoration:none;padding:0.5rem 0.75rem;font-size:0.875rem;">Services</a>
        <a href="/solutions" style="color:#e0e0e0;text-decoration:none;padding:0.5rem 0.75rem;font-size:0.875rem;">Solutions</a>
        <a href="/blog" style="color:#e0e0e0;text-decoration:none;padding:0.5rem 0.75rem;font-size:0.875rem;">Insights</a>
        <a href="/contact" style="color:#e0e0e0;text-decoration:none;padding:0.5rem 0.75rem;font-size:0.875rem;">Contact</a>
      </nav>
      <a href="/contact" style="display:inline-flex;align-items:center;gap:0.5rem;padding:0.5rem 1.25rem;background:linear-gradient(135deg,#00D4FF,#0099CC);color:#000;font-weight:600;font-size:0.875rem;border-radius:6px;text-decoration:none;">Get Started</a>
    </div>
  </header>

  <!-- Pre-rendered hero section -->
  <section style="position:relative;min-height:90vh;display:flex;flex-direction:column;justify-content:center;overflow:hidden;background:#0A0E1A;padding-top:64px;">
    <!-- Hero background image (LCP element) -->
    <img
      src="${HERO_BG_DESKTOP}"
      srcset="${HERO_BG_MOBILE} 768w, ${HERO_BG_DESKTOP} 1920w"
      sizes="(max-width: 768px) 768px, 1920px"
      alt=""
      aria-hidden="true"
      fetchpriority="high"
      loading="eager"
      decoding="async"
      width="1920"
      height="1080"
      style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;"
    />
    <!-- Dark gradient overlay -->
    <div style="position:absolute;inset:0;background:linear-gradient(to right,rgba(10,14,26,0.97) 0%,rgba(10,14,26,0.75) 60%,rgba(10,14,26,0.4) 100%);z-index:1;"></div>
    <!-- Bottom fade -->
    <div style="position:absolute;bottom:0;left:0;right:0;height:8rem;background:linear-gradient(to top,rgba(10,14,26,1) 0%,transparent 100%);z-index:1;"></div>

    <!-- Hero content -->
    <div style="position:relative;z-index:10;max-width:1280px;margin:0 auto;padding:5rem 1.5rem;width:100%;">
      <div style="max-width:48rem;">
        <!-- Label -->
        <div style="display:inline-flex;align-items:center;gap:0.5rem;padding:0.375rem 1rem;border:1px solid rgba(0,212,255,0.3);border-radius:9999px;background:rgba(0,212,255,0.05);color:#00D4FF;font-size:0.75rem;font-weight:600;letter-spacing:0.1em;margin-bottom:1.5rem;">
          NEXT-GEN CLOUD &amp; AI SOLUTIONS
        </div>
        <!-- Headline -->
        <h1 style="font-size:clamp(2.5rem,6vw,4.5rem);font-weight:700;color:#fff;line-height:1.05;margin-bottom:1.5rem;font-family:'Space Grotesk',sans-serif;">
          Intelligent<br/>
          Cloud &amp; AI <span style="background:linear-gradient(90deg,#00D4FF,#00EEFF);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">Solutions</span>
        </h1>
        <!-- Subtitle -->
        <p style="font-size:clamp(1rem,2vw,1.25rem);color:#d1d5db;max-width:36rem;margin-bottom:2.5rem;line-height:1.6;">
          We architect enterprise-grade cloud infrastructure and AI systems that transform how businesses operate, innovate, and scale.
        </p>
        <!-- CTA Buttons -->
        <div style="display:flex;flex-wrap:wrap;gap:1rem;margin-bottom:1.5rem;">
          <a href="/contact" style="display:inline-flex;align-items:center;gap:0.5rem;padding:0.875rem 2rem;background:linear-gradient(135deg,#00D4FF,#0099CC);color:#000;font-weight:700;font-size:1rem;border-radius:8px;text-decoration:none;">
            Get Started Free
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </a>
          <a href="/ai-demo" style="display:inline-flex;align-items:center;gap:0.5rem;padding:0.875rem 2rem;border:1px solid rgba(0,212,255,0.4);color:#00D4FF;font-weight:600;font-size:1rem;border-radius:8px;text-decoration:none;background:rgba(0,212,255,0.05);">
            Watch AI Work Live
          </a>
        </div>
        <!-- Trust badges -->
        <div style="display:flex;flex-wrap:wrap;gap:1.5rem;align-items:center;">
          <span style="display:flex;align-items:center;gap:0.375rem;color:#9ca3af;font-size:0.8rem;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#00D4FF" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            99.9% Uptime SLA
          </span>
          <span style="display:flex;align-items:center;gap:0.375rem;color:#9ca3af;font-size:0.8rem;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Zero Trust Security
          </span>
          <span style="display:flex;align-items:center;gap:0.375rem;color:#9ca3af;font-size:0.8rem;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            24/7 AI Support
          </span>
        </div>
      </div>
    </div>
  </section>
</div>

<!-- React mounts here and replaces the SSR shell -->
<script>
  // When React hydrates, fade out the SSR shell smoothly
  document.addEventListener('DOMContentLoaded', function() {
    var shell = document.getElementById('ssr-shell');
    if (shell) {
      // React root will take over — hide shell after React renders
      var observer = new MutationObserver(function() {
        var root = document.getElementById('root');
        if (root && root.children.length > 0) {
          shell.style.transition = 'opacity 0.2s';
          shell.style.opacity = '0';
          shell.style.pointerEvents = 'none';
          setTimeout(function() { 
            if (shell.parentNode) shell.parentNode.removeChild(shell); 
          }, 250);
          observer.disconnect();
        }
      });
      var root = document.getElementById('root');
      if (root) observer.observe(root, { childList: true, subtree: false });
    }
  });
</script>
`;

let html = fs.readFileSync(distHtml, 'utf-8');
const original = html;

// Check if already prerendered
if (html.includes('id="ssr-shell"')) {
  console.log('[ssg] Homepage already prerendered, skipping.');
  process.exit(0);
}

// Inject the prerendered HTML right before the React root div
// The React root is <div id="root"></div>
const rootDiv = '<div id="root"></div>';
if (!html.includes(rootDiv)) {
  console.error('[ssg] ERROR: Could not find <div id="root"></div> in index.html');
  process.exit(1);
}

html = html.replace(rootDiv, `${PRERENDERED_HTML}\n  ${rootDiv}`);

// Also add Google Fonts preconnect if not already present (for faster font loading)
if (!html.includes('fonts.googleapis.com') && !html.includes('fonts.gstatic.com')) {
  html = html.replace(
    '<head>',
    `<head>\n  <link rel="preconnect" href="https://fonts.googleapis.com">\n  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`
  );
}

fs.writeFileSync(distHtml, html, 'utf-8');
console.log(`[ssg] ✅ Homepage pre-rendered successfully (${(html.length / 1024).toFixed(1)} KB total)`);
console.log('[ssg] Above-fold content now visible before React boots — LCP element render delay eliminated');
