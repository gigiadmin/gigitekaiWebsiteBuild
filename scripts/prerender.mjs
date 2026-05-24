#!/usr/bin/env node
/**
 * Pre-render script for critical pages (homepage, privacy, terms)
 * Runs after build to generate static HTML files with full content
 * This ensures Google and users see complete content in initial HTML response
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist', 'public');
const DEV_SERVER_URL = process.env.DEV_SERVER_URL || 'http://localhost:5173';

// Pages to pre-render
const PAGES_TO_PRERENDER = [
  { path: '/', filename: 'index.html' },
  { path: '/privacy-policy', filename: 'privacy-policy.html' },
  { path: '/terms-of-service', filename: 'terms-of-service.html' },
];

async function prerender() {
  console.log('[Prerender] Starting pre-rendering of critical pages...');
  
  let browser;
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    for (const page of PAGES_TO_PRERENDER) {
      try {
        console.log(`[Prerender] Rendering ${page.path}...`);
        
        const browserPage = await browser.newPage();
        
        // Set viewport
        await browserPage.setViewport({ width: 1920, height: 1080 });
        
        // Navigate to the page
        const url = `${DEV_SERVER_URL}${page.path}`;
        await browserPage.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Wait for React to render
        await browserPage.waitForFunction(() => {
          const app = document.getElementById('gigitekai-app');
          return app && app.children.length > 0;
        }, { timeout: 10000 });
        
        // Get the full HTML
        const html = await browserPage.content();
        
        // Write to dist
        const outputPath = path.join(DIST_DIR, page.filename);
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, html, 'utf-8');
        
        console.log(`[Prerender] ✓ ${page.path} → ${page.filename} (${html.length} bytes)`);
        
        await browserPage.close();
      } catch (error) {
        console.error(`[Prerender] ✗ Failed to render ${page.path}:`, error.message);
      }
    }

    console.log('[Prerender] Pre-rendering complete!');
  } catch (error) {
    console.error('[Prerender] Fatal error:', error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run if executed directly
prerender().catch(err => {
  console.error(err);
  process.exit(1);
});
