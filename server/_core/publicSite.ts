/**
 * Public marketing site — server-side helpers.
 *
 * Decides which HTML entry serves a request:
 *   - public marketing routes → dist/public/site-prerendered/<route>.html
 *     (falls back to dist/public/site.html for client-rendered routes such as
 *     blog posts)
 *   - everything else (admin, helpdesk, support, kb, legacy pages) → the
 *     existing application entry, dist/public/index.html (unchanged)
 *
 * Also holds the permanent redirects for retired public marketing URLs.
 * Admin, API, auth and operational prefixes are never matched here.
 */
import fs from "fs";
import path from "path";
import { PAGE_SEO, PUBLIC_SITE_ROUTES, SITE } from "../../client/src/public/site.config";

export { PAGE_SEO };

/** Prefixes that must never be touched by public-site routing or redirects. */
const PROTECTED_PREFIXES = [
  "/admin",
  "/mainx",
  "/api",
  "/helpdesk",
  "/support",
  "/kb",
  "/client",
  "/remote-session",
  "/cancel-meeting",
  "/reschedule-meeting",
  "/assessment",
  "/accept-invite",
  "/logout",
  "/login",
  "/redirect",
  "/manus-storage",
];

export function isProtectedPath(pathname: string): boolean {
  const p = normalize(pathname);
  return PROTECTED_PREFIXES.some((prefix) => p === prefix || p.startsWith(prefix + "/"));
}

function normalize(pathname: string): string {
  const p = pathname.replace(/\/+$/, "");
  return p === "" ? "/" : p;
}

/** True when the request should be served by the public site bundle. */
export function isPublicSiteRoute(pathname: string): boolean {
  const p = normalize(pathname);
  if (isProtectedPath(p)) return false;
  if (PUBLIC_SITE_ROUTES.includes(p)) return true;
  if (/^\/blog\/[^/]+$/.test(p)) return true;
  return false;
}

/**
 * Permanent redirects for retired public marketing URLs (exact paths only).
 * Each retired page points at the most relevant replacement. Pages with no
 * meaningful replacement are not listed and return a real 404 from the
 * existing middleware.
 */
export const PUBLIC_REDIRECTS: Record<string, string> = {
  // Duplicates / aliases of retained pages
  "/about-us": "/about",
  "/our-team": "/about",
  "/partners": "/about",
  "/privacy": "/privacy-policy",
  "/security": "/services/security",
  // Interactive tools, demos, assessments and calculators (removed from the marketing site)
  "/ai-demo": "/services/ai",
  "/ai-workflows": "/services/ai",
  "/AIStrategicBriefing": "/services/ai",
  "/roi-calculator": "/contact",
  "/technology-assessment": "/contact",
  "/roadmap-generator": "/contact",
  "/free-audit": "/contact",
  "/audit-results": "/contact",
  "/compliance-scorecard": "/services/security",
  "/compliance-benchmark": "/services/security",
  "/trust-center": "/services/security",
  "/service-comparison": "/services",
  "/switch-program": "/contact",
  "/resources": "/blog",
  // Offerings folded into the five core services
  "/fractional-cto-ai-strategy": "/services",
  "/business-technology-launch": "/services",
  "/services/data": "/services",
  "/services/strategy": "/services",
};

export function getPublicRedirect(pathname: string): string | null {
  const p = normalize(pathname);
  if (isProtectedPath(p)) return null;
  return PUBLIC_REDIRECTS[p] ?? null;
}

/** Map a public route to its prerendered file name (mirrors scripts/prerender-public-site.mjs). */
function prerenderedFileFor(pathname: string): string {
  const p = normalize(pathname);
  return p === "/" ? "index.html" : `${p.replace(/^\//, "").replace(/\//g, "__")}.html`;
}

const fileCache = new Map<string, string>();

/**
 * Read the HTML for a public-site route: the prerendered page when one exists,
 * otherwise the client-rendered shell. Returns null if the public build is missing.
 */
export function readPublicSiteHtml(distPath: string, pathname: string): string | null {
  const candidates = [path.resolve(distPath, "site-prerendered", prerenderedFileFor(pathname)), path.resolve(distPath, "site.html")];
  for (const file of candidates) {
    if (fileCache.has(file)) return fileCache.get(file)!;
    if (fs.existsSync(file)) {
      const html = fs.readFileSync(file, "utf-8");
      if (process.env.NODE_ENV === "production") fileCache.set(file, html);
      return html;
    }
  }
  return null;
}

export function publicCanonical(pathname: string): string {
  const p = normalize(pathname);
  return p === "/" ? `${SITE.url}/` : `${SITE.url}${p}`;
}
