#!/usr/bin/env node
/**
 * Prerender the public marketing site to static HTML.
 *
 * Runs after `vite build -c vite.public.config.ts` (client bundle) and the SSR
 * build of client/src/public/entry-server.tsx. For every static public route it
 * renders the React tree to HTML, injects it into the built site.html template
 * with per-route <title>/<meta>/canonical, and writes
 *   dist/public/site-prerendered/<route>.html
 * The server (prerenderMiddleware) serves these files for public routes and
 * falls back to dist/public/site.html when a route has no prerendered file
 * (blog posts, 404).
 *
 * Blog routes are not prerendered here: their content comes from the database
 * at request time through the existing blog procedures.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const distPublic = path.join(root, "dist", "public");
const templatePath = path.join(distPublic, "site.html");
const ssrEntry = path.join(root, "dist", "public-ssr", "entry-server.js");
const outDir = path.join(distPublic, "site-prerendered");

if (!fs.existsSync(templatePath)) {
  console.error(`[prerender-public] Missing ${templatePath}. Run the public client build first.`);
  process.exit(1);
}
if (!fs.existsSync(ssrEntry)) {
  console.error(`[prerender-public] Missing ${ssrEntry}. Run the public SSR build first.`);
  process.exit(1);
}

const { render, PAGE_SEO, PUBLIC_SITE_ROUTES, SITE } = await import(pathToFileURL(ssrEntry).href);
const template = fs.readFileSync(templatePath, "utf8");

const escapeAttr = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function applyHead(html, route) {
  const seo = PAGE_SEO[route];
  if (!seo) return html;
  const canonical = route === "/" ? `${SITE.url}/` : `${SITE.url}${route}`;
  const title = escapeAttr(seo.title);
  const desc = escapeAttr(seo.description.slice(0, 155));
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${desc}" />`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${canonical}" />`)
    .replace(/<meta property="og:url" content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${canonical}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${title}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${desc}" />`);
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

let count = 0;
for (const route of PUBLIC_SITE_ROUTES) {
  if (route === "/blog") continue; // data-driven; client-rendered
  const appHtml = render(route);
  let html = applyHead(template, route);
  html = html.replace('<div id="root"></div>', `<div id="root" data-prerendered="true">${appHtml}</div>`);
  const file = route === "/" ? "index.html" : `${route.replace(/^\//, "").replace(/\//g, "__")}.html`;
  fs.writeFileSync(path.join(outDir, file), html, "utf8");
  count++;
}
console.log(`[prerender-public] Wrote ${count} prerendered public pages to ${path.relative(root, outDir)}`);
