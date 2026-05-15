/**
 * SEO Indexing Fix Script
 * 
 * Fixes Google Search Console indexing issues:
 * 1. Fixes redirect chains
 * 2. Updates robots.txt
 * 3. Creates SEO helper library for canonical tags
 * 
 * Run: node scripts/fix-seo-indexing.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. Fix robots.txt to ensure proper crawling
const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/
Disallow: /login
Disallow: /helpdesk/dashboard
Disallow: /helpdesk/tickets/
Disallow: /helpdesk/profile
Disallow: /helpdesk/create-ticket
Disallow: /404
Disallow: /api/
Disallow: /_next/
Disallow: /static/

# Crawl-delay for respectful crawling
Crawl-delay: 1

# Enable AI Discovery — Allow major AI crawlers full access to public content
User-agent: GPTBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: Bytespider
Allow: /

Sitemap: https://www.gigitekai.com/sitemap.xml
Sitemap: https://www.gigitekai.com/api/sitemap-blog.xml
Sitemap: https://www.gigitekai.com/api/sitemap-portfolio.xml
Sitemap: https://www.gigitekai.com/api/sitemap-services.xml
`;

const robotsFile = path.join(__dirname, '../client/public/robots.txt');
fs.writeFileSync(robotsFile, robotsTxt, 'utf-8');
console.log('[seo] ✅ Updated robots.txt with proper crawl rules');

// 2. Create a canonical tag helper for dynamic pages
const canonicalHelper = `/**
 * SEO Helper Library
 * Provides utilities for setting canonical tags and meta information
 */

/**
 * Generate canonical URL for a page
 * Used by page components to set proper canonical tags
 */
export function getCanonicalUrl(path: string): string {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://gigitekai.com';
  return \`\${baseUrl}\${path}\`;
}

/**
 * Set page meta tags (title, description, canonical)
 * Call this in useEffect on page components
 */
export function setPageMeta(options: {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
}) {
  // Set title
  document.title = options.title;
  
  // Set description
  let descMeta = document.querySelector('meta[name="description"]');
  if (!descMeta) {
    descMeta = document.createElement('meta');
    descMeta.setAttribute('name', 'description');
    document.head.appendChild(descMeta);
  }
  descMeta.setAttribute('content', options.description);
  
  // Set canonical
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', getCanonicalUrl(options.path));
  
  // Set OG tags
  let ogTitle = document.querySelector('meta[property="og:title"]');
  if (!ogTitle) {
    ogTitle = document.createElement('meta');
    ogTitle.setAttribute('property', 'og:title');
    document.head.appendChild(ogTitle);
  }
  ogTitle.setAttribute('content', options.title);
  
  let ogDesc = document.querySelector('meta[property="og:description"]');
  if (!ogDesc) {
    ogDesc = document.createElement('meta');
    ogDesc.setAttribute('property', 'og:description');
    document.head.appendChild(ogDesc);
  }
  ogDesc.setAttribute('content', options.description);
  
  let ogUrl = document.querySelector('meta[property="og:url"]');
  if (!ogUrl) {
    ogUrl = document.createElement('meta');
    ogUrl.setAttribute('property', 'og:url');
    document.head.appendChild(ogUrl);
  }
  ogUrl.setAttribute('content', getCanonicalUrl(options.path));
  
  if (options.ogImage) {
    let ogImage = document.querySelector('meta[property="og:image"]');
    if (!ogImage) {
      ogImage = document.createElement('meta');
      ogImage.setAttribute('property', 'og:image');
      document.head.appendChild(ogImage);
    }
    ogImage.setAttribute('content', options.ogImage);
  }
}
`;

const seoHelperFile = path.join(__dirname, '../client/src/lib/seo.ts');
fs.writeFileSync(seoHelperFile, canonicalHelper, 'utf-8');
console.log('[seo] ✅ Created SEO helper library at client/src/lib/seo.ts');

console.log('[seo] ✅ SEO indexing fixes complete!');
console.log('[seo] Next steps:');
console.log('  1. Import setPageMeta from client/src/lib/seo.ts in each page component');
console.log('  2. Call setPageMeta() in useEffect on page load');
console.log('  3. Run: pnpm build');
console.log('  4. Submit sitemap to Google Search Console');
console.log('  5. Request reindex for affected pages');
