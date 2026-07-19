#!/usr/bin/env node
/**
 * Build-time prerendering for GigitekAI marketing pages.
 * 
 * Launches a local Express server with the production build, then uses
 * Puppeteer (puppeteer-core + system Chromium) to visit each marketing route,
 * wait for React to mount AND data to load, and capture the rendered DOM.
 * 
 * Key improvements over v1:
 * - Waits for network idle (no pending XHR/fetch for 2s) instead of fixed delay
 * - Waits for "Loading" text to disappear from the page
 * - Dynamically fetches published blog slugs from the running server
 * - Scrolls the page to trigger IntersectionObserver lazy sections
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
// Store prerendered content in source tree so it gets deployed with the build
// The server loads these at startup from the server/__prerendered directory
const PRERENDER_DIR = path.join(PROJECT_ROOT, 'server', '__prerendered');

// Static marketing routes to prerender (public-facing, SEO-critical)
const STATIC_ROUTES = [
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
  '/about-us',
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
        DATABASE_URL: process.env.DATABASE_URL || '',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let started = false;
    const timeout = setTimeout(() => {
      if (!started) {
        reject(new Error('Server failed to start within 45s'));
        server.kill();
      }
    }, 45000);

    server.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Server running on') && !started) {
        started = true;
        clearTimeout(timeout);
        resolve(server);
      }
    });

    server.stderr.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg && !msg.includes('ExperimentalWarning')) {
        console.log(`[Server stderr] ${msg}`);
      }
    });

    server.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

// Fetch published blog slugs from the running server
async function fetchBlogSlugs(baseUrl) {
  try {
    // blog.listPosts is a no-input public query that returns an array of posts directly
    const res = await fetch(`${baseUrl}/api/trpc/blog.listPosts`);
    if (!res.ok) {
      console.log(`[Prerender] blog.listPosts returned ${res.status}`);
      return [];
    }
    const data = await res.json();
    // tRPC response format: { result: { data: { json: [...] } } }
    const posts = data?.result?.data?.json || data?.result?.data || [];
    const slugs = (Array.isArray(posts) ? posts : []).map(p => p.slug).filter(Boolean);
    console.log(`[Prerender] Found ${slugs.length} published blog slugs`);
    return slugs;
  } catch (err) {
    console.log(`[Prerender] Could not fetch blog slugs: ${err.message}`);
    return [];
  }
}

// Convert route path to filename
function routeToFilename(route) {
  if (route === '/') return 'index.json';
  // /services/ai → services--ai.json
  return route.slice(1).replace(/\//g, '--') + '.json';
}

async function prerender() {
  const PORT = 4173;
  const BASE_URL = `http://localhost:${PORT}`;
  
  console.log('[Prerender] Starting build-time prerendering...');
  
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
    console.log('[Prerender] Exiting gracefully — deployment will work without prerender');
    process.exit(0);
  }
  
  // Wait a bit for server to fully initialize (DB connections, caches, etc.)
  await new Promise(r => setTimeout(r, 3000));
  
  // Fetch dynamic routes (blog slugs)
  const blogSlugs = await fetchBlogSlugs(BASE_URL);
  const blogRoutes = blogSlugs.map(slug => `/blog/${slug}`);
  console.log(`[Prerender] Found ${blogRoutes.length} published blog posts`);
  
  // Combine all routes
  const ALL_ROUTES = [...STATIC_ROUTES, ...blogRoutes];
  console.log(`[Prerender] Total routes to render: ${ALL_ROUTES.length}`);
  
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
  
  // Process routes in batches of 2 (conservative for memory)
  const BATCH_SIZE = 2;
  for (let i = 0; i < ALL_ROUTES.length; i += BATCH_SIZE) {
    const batch = ALL_ROUTES.slice(i, i + BATCH_SIZE);
    
    await Promise.all(batch.map(async (route) => {
      const page = await browser.newPage();
      try {
        // Only block heavy media — keep stylesheets for layout accuracy
        await page.setRequestInterception(true);
        page.on('request', (req) => {
          const type = req.resourceType();
          if (['image', 'font', 'media'].includes(type)) {
            req.abort();
          } else {
            req.continue();
          }
        });
        
        await page.setViewport({ width: 1280, height: 2000 }); // Tall viewport to trigger more lazy sections
        
        const url = `${BASE_URL}${route}`;
        
        // Use networkidle0 — waits until 0 network connections for 500ms
        await page.goto(url, { 
          waitUntil: 'networkidle0',
          timeout: 25000,
        });
        
        // Wait for React to mount (gigitekai-app element gets children)
        await page.waitForFunction(() => {
          const app = document.getElementById('gigitekai-app');
          return app && app.children.length > 0;
        }, { timeout: 15000 });
        
        // Wait for loading states to clear (no "Loading" text visible)
        await page.waitForFunction(() => {
          const body = document.body.innerText;
          // Check for common loading indicators
          const loadingPatterns = [
            'Loading pricing',
            'Loading articles',
            'Loading article',
            'Loading...',
          ];
          return !loadingPatterns.some(pattern => body.includes(pattern));
        }, { timeout: 10000 }).catch(() => {
          // Non-fatal — some pages may have persistent loading states
          console.log(`[Prerender] ⚠ ${route} — loading state did not clear within 10s`);
        });
        
        // Additional wait for any final renders
        await new Promise(r => setTimeout(r, 1500));
        
        // Scroll to bottom to trigger IntersectionObserver lazy sections (for homepage)
        if (route === '/') {
          await page.evaluate(async () => {
            const scrollStep = 800;
            const maxScroll = document.body.scrollHeight;
            for (let y = 0; y < maxScroll; y += scrollStep) {
              window.scrollTo(0, y);
              await new Promise(r => setTimeout(r, 200));
            }
            window.scrollTo(0, 0); // Reset to top
          });
          // Wait for lazy sections to render
          await new Promise(r => setTimeout(r, 2000));
        }
        
        // Extract the rendered content from #gigitekai-app
        const renderedContent = await page.evaluate(() => {
          const app = document.getElementById('gigitekai-app');
          if (!app) return '';
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
        
        // Verify content is substantial (not just a loading shell)
        const hasLoading = renderedContent.includes('Loading pricing') || 
                          renderedContent.includes('Loading articles') ||
                          renderedContent.includes('Loading article');
        
        if (renderedContent && renderedContent.length > 200 && !hasLoading) {
          const filename = routeToFilename(route);
          const outputPath = path.join(PRERENDER_DIR, filename);
          
          // Store as JSON with content + metadata
          const data = {
            route,
            metadata,
            content: renderedContent,
            timestamp: new Date().toISOString(),
          };
          
          fs.writeFileSync(outputPath, JSON.stringify(data), 'utf-8');
          
          successCount++;
          console.log(`[Prerender] ✓ ${route} (${(renderedContent.length / 1024).toFixed(1)}KB)`);
        } else if (hasLoading) {
          failCount++;
          console.log(`[Prerender] ✗ ${route} — still has loading placeholder`);
        } else {
          failCount++;
          console.log(`[Prerender] ✗ ${route} — content too small (${renderedContent?.length || 0} bytes)`);
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
    totalRoutes: ALL_ROUTES.length,
    successCount,
    failCount,
    routes: ALL_ROUTES.map(route => ({
      route,
      file: routeToFilename(route),
      prerendered: fs.existsSync(path.join(PRERENDER_DIR, routeToFilename(route))),
    })),
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
