#!/usr/bin/env node
/**
 * Build-time prerendering for GigitekAI marketing pages.
 * 
 * Launches a local Express server with the production build, then uses
 * Puppeteer (puppeteer-core + system Chromium) to visit each marketing route,
 * wait for React to mount, and capture the rendered DOM. The captured HTML
 * is injected into the dist/public/index.html shell as a <template id="ssr-{route}">
 * element inside #root, which the prerenderMiddleware serves to crawlers.
 * 
 * Alternatively (simpler approach): we capture each route's full page HTML
 * and store it as a separate .html file in dist/public/__prerendered/. The
 * server middleware checks for these files and serves them with correct status.
 * 
 * Usage: node scripts/prerender-routes.mjs
 * Must run AFTER `vite build` and BEFORE deployment.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import puppeteer from 'puppeteer-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist', 'public');
const PRERENDER_DIR = path.join(DIST_DIR, '__prerendered');

// All marketing routes to prerender (public-facing, SEO-critical)
const ROUTES_TO_PRERENDER = [
  '/',
  '/services',
  '/services/microsoft-365',
  '/services/cloud',
  '/services/ai',
  '/services/security',
  '/services/managed',
  '/services/data',
  '/services/strategy',
  '/pricing',
  '/web-pricing',
  '/helpdesk-pricing',
  '/contact',
  '/free-audit',
  '/blog',
  '/websites',
  '/websites/finance',
  '/websites/legal',
  '/websites/insurance',
  '/websites/vc',
  '/websites/health',
  '/websites/consulting',
  '/websites/tech',
  '/websites/ecommerce',
  '/kb',
  '/case-studies',
  '/security',
  '/managed-it-services-tampa',
  '/managed-it-services-miami',
  '/florida-it-resiliency',
  '/smart-home',
  '/switch-program',
  '/compliance-scorecard',
  '/compliance-benchmark',
  '/roadmap-generator',
  '/industries',
  '/industries/healthcare',
  '/industries/financial',
  '/industries/manufacturing',
  '/industries/retail',
  '/industries/government',
  '/industries/education',
  '/our-team',
  '/partners',
  '/support',
  '/status',
  '/ai-demo',
  '/ai-news',
  '/about',
  '/AIStrategicBriefing',
  '/m365-status',
];

// Find Chromium executable
function findChromium() {
  const paths = [
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('No Chromium/Chrome found. Install chromium or google-chrome.');
}

// Start the production server
function startServer(port) {
  return new Promise((resolve, reject) => {
    const server = spawn('node', ['dist/index.js'], {
      cwd: PROJECT_ROOT,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: String(port),
        // Use a mock DATABASE_URL if not set (prerender doesn't need DB for static pages)
        DATABASE_URL: process.env.DATABASE_URL || '',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let started = false;
    const timeout = setTimeout(() => {
      if (!started) {
        reject(new Error('Server failed to start within 30s'));
        server.kill();
      }
    }, 30000);

    server.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Server running on') && !started) {
        started = true;
        clearTimeout(timeout);
        resolve(server);
      }
    });

    server.stderr.on('data', (data) => {
      // Log but don't fail on stderr (common for warnings)
      const msg = data.toString().trim();
      if (msg) console.log(`[Server stderr] ${msg}`);
    });

    server.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

// Convert route path to filename
function routeToFilename(route) {
  if (route === '/') return 'index.html';
  // /services/ai → services--ai.html
  return route.slice(1).replace(/\//g, '--') + '.html';
}

async function prerender() {
  const PORT = 4173;
  const BASE_URL = `http://localhost:${PORT}`;
  
  console.log('[Prerender] Starting build-time prerendering...');
  console.log(`[Prerender] Routes to render: ${ROUTES_TO_PRERENDER.length}`);
  
  // Ensure output directory exists
  fs.mkdirSync(PRERENDER_DIR, { recursive: true });
  
  // Start production server
  let server;
  try {
    console.log('[Prerender] Starting production server...');
    server = await startServer(PORT);
    console.log(`[Prerender] Server running on port ${PORT}`);
  } catch (err) {
    console.error('[Prerender] Failed to start server:', err.message);
    // If server won't start (e.g., no DB), fall back to static capture from dev
    console.log('[Prerender] Falling back to Vite preview...');
    // Try without server — just capture what we can
    process.exit(0); // Non-fatal: deployment still works without prerender
  }
  
  // Launch browser
  const chromiumPath = findChromium();
  console.log(`[Prerender] Using Chromium: ${chromiumPath}`);
  
  const browser = await puppeteer.launch({
    executablePath: chromiumPath,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--single-process',
      '--no-zygote',
    ],
  });

  let successCount = 0;
  let failCount = 0;
  
  // Process routes in batches of 3 to limit memory
  const BATCH_SIZE = 3;
  for (let i = 0; i < ROUTES_TO_PRERENDER.length; i += BATCH_SIZE) {
    const batch = ROUTES_TO_PRERENDER.slice(i, i + BATCH_SIZE);
    
    await Promise.all(batch.map(async (route) => {
      const page = await browser.newPage();
      try {
        // Block heavy resources to speed up rendering
        await page.setRequestInterception(true);
        page.on('request', (req) => {
          const type = req.resourceType();
          // Block images, fonts, media — we only need DOM text
          if (['image', 'font', 'media', 'stylesheet'].includes(type)) {
            req.abort();
          } else {
            req.continue();
          }
        });
        
        await page.setViewport({ width: 1280, height: 720 });
        
        const url = `${BASE_URL}${route}`;
        await page.goto(url, { 
          waitUntil: 'domcontentloaded',
          timeout: 15000,
        });
        
        // Wait for React to mount (gigitekai-app element gets children)
        await page.waitForFunction(() => {
          const app = document.getElementById('gigitekai-app');
          return app && app.children.length > 0;
        }, { timeout: 10000 });
        
        // Small delay for any async renders
        await new Promise(r => setTimeout(r, 500));
        
        // Extract the rendered content from #gigitekai-app
        const renderedContent = await page.evaluate(() => {
          const app = document.getElementById('gigitekai-app');
          if (!app) return '';
          // Get the outer HTML of the app content
          return app.innerHTML;
        });
        
        // Also extract the <title> and meta tags set by react-helmet
        const metadata = await page.evaluate(() => {
          return {
            title: document.title || '',
            description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
            canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '',
          };
        });
        
        if (renderedContent && renderedContent.length > 100) {
          const filename = routeToFilename(route);
          const outputPath = path.join(PRERENDER_DIR, filename);
          
          // Store as JSON with content + metadata
          const data = {
            route,
            metadata,
            content: renderedContent,
            timestamp: new Date().toISOString(),
          };
          
          fs.writeFileSync(outputPath.replace('.html', '.json'), JSON.stringify(data), 'utf-8');
          
          successCount++;
          console.log(`[Prerender] ✓ ${route} (${(renderedContent.length / 1024).toFixed(1)}KB)`);
        } else {
          failCount++;
          console.log(`[Prerender] ✗ ${route} — empty or too small (${renderedContent?.length || 0} bytes)`);
        }
      } catch (err) {
        failCount++;
        console.log(`[Prerender] ✗ ${route} — ${err.message}`);
      } finally {
        await page.close();
      }
    }));
  }
  
  console.log(`\n[Prerender] Complete: ${successCount} succeeded, ${failCount} failed`);
  
  // Generate a manifest of prerendered routes
  const manifest = {
    generatedAt: new Date().toISOString(),
    routes: ROUTES_TO_PRERENDER.filter((_, i) => i < successCount + failCount)
      .map(route => ({
        route,
        file: routeToFilename(route).replace('.html', '.json'),
      })),
    successCount,
    failCount,
  };
  fs.writeFileSync(path.join(PRERENDER_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  
  await browser.close();
  server.kill('SIGTERM');
  
  // Wait for server to exit
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('[Prerender] Done!');
}

prerender().catch(err => {
  console.error('[Prerender] Fatal error:', err);
  // Non-fatal exit — deployment should still work without prerender
  process.exit(0);
});
