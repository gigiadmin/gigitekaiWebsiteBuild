/**
 * Server-Side Prerender Middleware for SEO
 * 
 * Solves the critical P0 issue: Google/AI crawlers see an empty shell because
 * all content is client-rendered. This middleware intercepts crawler requests
 * and injects unique per-route titles, descriptions, canonicals, and OG tags
 * into the HTML before sending it to the client.
 * 
 * For human visitors, the SPA still works normally (client JS overwrites meta).
 * For crawlers, they get proper SEO signals in the initial HTML response.
 * 
 * Also handles:
 * - Real HTTP 404 status codes for unknown routes
 * - Blog slug validation against DB (cached 5 min)
 * - AI news ID validation against DB (cached 5 min)
 * - 301 trailing slash redirects
 * - /insights → /blog redirect
 */

import { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";

// ─── Route SEO Data ──────────────────────────────────────────────────────────
// Each marketing route gets unique title, description, and canonical
interface RouteSEO {
  title: string;
  description: string;
  h1?: string;
  ogImage?: string;
  noindex?: boolean;
}

const BASE_URL = "https://gigitekai.com";
const DEFAULT_OG_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663509163804/mmTCDMc2kTTVcTkwoY8f9U/gigitekai-social-share-PcGTfHXSqszP86JZVvvsxv.png";

const ROUTE_SEO: Record<string, RouteSEO> = {
  "/": {
    title: "GigitekAI — AI-First MSP | Microsoft 365, Managed IT & AI Automation",
    description: "GigitekAI delivers enterprise cloud, AI automation & managed IT for Tampa Bay SMBs. 99.9% uptime SLA, 24/7 support, 40% cost reduction.",
    h1: "AI-First Managed IT & Cloud Solutions for SMBs",
  },
  "/services": {
    title: "IT Services | Cloud, AI, Cybersecurity & Microsoft 365 | GigitekAI",
    description: "Enterprise cloud infrastructure, AI automation, cybersecurity, and Microsoft 365 architecture. Managed IT services with 99.9% uptime for Florida SMBs.",
  },
  "/pricing": {
    title: "IT Services Pricing | Managed IT & Helpdesk Plans | GigitekAI",
    description: "Transparent pricing for managed IT, helpdesk, and AI automation services. Plans starting at $69/user/month with 24/7 support and 99.9% uptime SLA.",
  },
  "/web-pricing": {
    title: "Website-as-a-Service Pricing | $199-$799/mo | GigitekAI",
    description: "Professional websites built and managed for you. Starter $199/mo, Growth $399/mo, Pro $799/mo. Includes hosting, maintenance, SEO, and AI-powered features.",
  },
  "/helpdesk-pricing": {
    title: "Helpdesk & IT Support Pricing | Per-User Plans | GigitekAI",
    description: "24/7 AI-powered helpdesk: Essential $69, Professional $119, Elite $189/user/mo. Ticket management, remote support & SLA guarantees.",
  },
  "/contact": {
    title: "Contact GigitekAI | Get a Free IT Consultation",
    description: "Contact GigitekAI for a free IT consultation. Call (727) 382-6909 or email support@gigitekai.com. Serving SMBs across Florida and North America.",
  },
  "/free-audit": {
    title: "Free IT Security Audit | Compliance Assessment | GigitekAI",
    description: "Get a free IT security and compliance audit. Identify vulnerabilities, assess M365 configuration, and receive a prioritized remediation roadmap.",
  },
  "/blog": {
    title: "IT Insights & Blog | Cloud, AI & Cybersecurity | GigitekAI",
    description: "Expert insights on managed IT, Microsoft 365, AI automation, cybersecurity, and cloud infrastructure for SMBs. Stay informed with GigitekAI.",
  },
  "/insights": {
    title: "IT Insights & Blog | Cloud, AI & Cybersecurity | GigitekAI",
    description: "Expert insights on managed IT, Microsoft 365, AI automation, cybersecurity, and cloud infrastructure for SMBs. Stay informed with GigitekAI.",
  },
  "/websites": {
    title: "Website Portfolio | Professional Web Design | GigitekAI",
    description: "View our portfolio of professional websites built for SMBs. Modern, fast, SEO-optimized, and conversion-focused designs with AI-powered features.",
  },
  "/kb": {
    title: "Knowledge Base | IT Support Articles | GigitekAI",
    description: "Browse 2,000+ IT support articles covering Microsoft 365, Azure, Windows, networking, security, and more. Self-service solutions for common IT issues.",
  },
  "/case-studies": {
    title: "Case Studies | IT Success Stories | GigitekAI",
    description: "Real results from real clients. See how GigitekAI helped SMBs reduce costs by 40%, improve uptime to 99.9%, and automate IT workflows with AI.",
  },
  "/security": {
    title: "Cybersecurity Services | Zero Trust & Compliance | GigitekAI",
    description: "Enterprise cybersecurity for SMBs. Zero Trust architecture, SIEM/SOC, endpoint protection, email security. HIPAA, SOC 2, PCI-DSS, CMMC compliant.",
  },
  "/managed-it-services-tampa": {
    title: "Managed IT Services in Tampa, FL | Local IT Support | GigitekAI",
    description: "Tampa's premier managed IT provider. 24/7 support, Microsoft 365, cloud infrastructure, and cybersecurity for Tampa Bay businesses. Call (727) 382-6909.",
  },
  "/managed-it-services-miami": {
    title: "Managed IT Services in Miami, FL | Local IT Support | GigitekAI",
    description: "Miami's trusted managed IT provider. 24/7 support, Microsoft 365, cloud infrastructure, and cybersecurity for South Florida businesses.",
  },
  "/florida-it-resiliency": {
    title: "Florida IT Resiliency | Hurricane-Proof Infrastructure | GigitekAI",
    description: "Protect your Florida business from hurricanes and disasters. Cloud-based disaster recovery, redundant infrastructure, and business continuity planning.",
  },
  "/smart-home": {
    title: "Smart Home IT Services | Home Automation | GigitekAI",
    description: "Professional smart home setup and management. Network optimization, security cameras, smart devices, and home automation for tech-savvy homeowners.",
  },
  "/switch-program": {
    title: "Switch to GigitekAI | MSP Migration Program",
    description: "Switch from your current MSP to GigitekAI with zero downtime. Free migration assessment, dedicated onboarding team, and 90-day satisfaction guarantee.",
  },
  "/compliance-scorecard": {
    title: "IT Compliance Scorecard | Free Assessment | GigitekAI",
    description: "Rate your IT compliance posture across email security, backup, access control, and more. Get a personalized remediation roadmap in minutes.",
  },
  "/compliance-benchmark": {
    title: "Compliance Benchmark | Industry Comparison | GigitekAI",
    description: "Compare your IT compliance posture against industry benchmarks. See how your organization stacks up in security, backup, and access control.",
  },
  "/industries": {
    title: "Industries We Serve | Healthcare, Finance, Legal & More | GigitekAI",
    description: "Specialized IT solutions for healthcare, finance, legal, manufacturing, and professional services. Industry-specific compliance and security expertise.",
  },
  "/our-team": {
    title: "Our Team | IT Experts & Engineers | GigitekAI",
    description: "Meet the GigitekAI team. Certified Microsoft, AWS, and cybersecurity professionals with 25+ years of enterprise IT experience.",
  },
  "/partners": {
    title: "Technology Partners | Microsoft, AWS, Azure | GigitekAI",
    description: "Strategic partnerships with Microsoft, AWS, Azure, and leading security vendors. Enterprise-grade solutions backed by industry leaders.",
  },
  "/support": {
    title: "IT Support Portal | Submit a Ticket | GigitekAI",
    description: "Get IT support fast. Submit a ticket, check status, or access our knowledge base. 24/7 AI-powered support with guaranteed response times.",
  },
  "/status": {
    title: "System Status | Service Health Dashboard | GigitekAI",
    description: "Real-time system status and service health for GigitekAI infrastructure. Monitor uptime, incidents, and scheduled maintenance.",
  },
  "/privacy-policy": {
    title: "Privacy Policy | GigitekAI",
    description: "GigitekAI privacy policy. Learn how we collect, use, and protect your personal information in compliance with applicable data protection laws.",
  },
  "/terms-of-service": {
    title: "Terms of Service | GigitekAI",
    description: "GigitekAI terms of service. Read our service agreement, acceptable use policy, and liability limitations.",
  },
  "/ai-demo": {
    title: "AI Demo | See AI Automation in Action | GigitekAI",
    description: "Experience GigitekAI's AI capabilities live. See how AI agents automate IT workflows, resolve tickets, and optimize operations in real-time.",
  },
  "/ai-news": {
    title: "AI News & Updates | Latest in AI Technology | GigitekAI",
    description: "Stay current with AI news, breakthroughs, and enterprise AI trends. Curated updates on LLMs, automation, and AI-first business strategies.",
  },
  "/web-discovery-intake": {
    title: "Website Project Discovery | Start Your Web Project | GigitekAI",
    description: "Tell us about your website project. Complete our discovery form and get a custom proposal for your professional website within 48 hours.",
  },
  "/exchange": {
    title: "Client Exchange Portal | Secure File Sharing | GigitekAI",
    description: "Secure client file exchange portal. Upload and download documents, share credentials, and collaborate with your GigitekAI team securely.",
  },
  "/m365-status": {
    title: "Microsoft 365 Health Status | Service Dashboard | GigitekAI",
    description: "Real-time Microsoft 365 service health. Monitor Exchange, Teams, SharePoint, and other M365 services for your organization.",
  },
  "/about": {
    title: "About GigitekAI | AI-First MSP in Tampa, FL",
    description: "GigitekAI is an AI-first managed services provider founded by a 25+ year IT veteran. We deliver enterprise cloud, AI automation & managed IT for SMBs.",
  },
  "/about-us": {
    title: "About GigitekAI | AI-First MSP in Tampa, FL",
    description: "GigitekAI is an AI-first managed services provider founded by a 25+ year IT veteran. We deliver enterprise cloud, AI automation & managed IT for SMBs.",
  },
  "/roadmap-generator": {
    title: "IT Roadmap Generator | Strategic Planning Tool | GigitekAI",
    description: "Generate a customized IT roadmap for your business. AI-powered strategic planning tool for cloud migration, security, and digital transformation.",
  },
};

// Service detail pages
const SERVICE_SLUGS: Record<string, RouteSEO> = {
  "microsoft-365": {
    title: "Microsoft 365 Services | Licensing & Architecture | GigitekAI",
    description: "Expert Microsoft 365 architecture, licensing optimization, Teams deployment, SharePoint, Exchange, Intune, and Copilot configuration for SMBs.",
  },
  "cloud": {
    title: "Cloud Infrastructure | AWS, Azure & Google Cloud | GigitekAI",
    description: "Enterprise cloud architecture on AWS, Azure, and Google Cloud. Migration, optimization, and 24/7 management with 99.9% uptime SLA.",
  },
  "security": {
    title: "Cybersecurity Services | Zero Trust & Compliance | GigitekAI",
    description: "Enterprise cybersecurity for SMBs. Zero Trust, SIEM/SOC, endpoint protection, email security. HIPAA, SOC 2, PCI-DSS compliant.",
  },
  "ai": {
    title: "AI & Automation Services | Custom AI Agents | GigitekAI",
    description: "Custom AI agents, LLM integration, workflow automation, and Copilot Studio deployment. Transform operations with intelligent automation.",
  },
  "managed": {
    title: "Managed IT Services | 24/7 Support & Monitoring | GigitekAI",
    description: "Fully managed IT with 24/7 helpdesk, endpoint management, monitoring, patching, and proactive maintenance. 99.9% uptime guaranteed.",
  },
  "data": {
    title: "Data & Analytics | Power BI & Business Intelligence | GigitekAI",
    description: "Business intelligence, Power BI dashboards, data pipelines, and AI-driven insights. Turn your data into actionable business decisions.",
  },
  "strategy": {
    title: "IT Strategy & Consulting | Digital Transformation | GigitekAI",
    description: "Strategic IT consulting and digital transformation. Technology roadmaps, vendor management, and IT governance for growing businesses.",
  },
};

// Industry pages
const INDUSTRY_SLUGS: Record<string, RouteSEO> = {
  "healthcare": {
    title: "Healthcare IT Services | HIPAA Compliant | GigitekAI",
    description: "HIPAA-compliant IT services for healthcare. EHR integration, telemedicine support, medical device security, and 24/7 clinical IT support.",
  },
  "financial": {
    title: "Financial Services IT | SOC 2 & PCI-DSS | GigitekAI",
    description: "Secure IT for financial services. SOC 2 and PCI-DSS compliance, encrypted communications, audit-ready infrastructure, and fraud prevention.",
  },
  "financial-services": {
    title: "Financial Services IT | SOC 2 & PCI-DSS | GigitekAI",
    description: "Secure IT for financial services. SOC 2 and PCI-DSS compliance, encrypted communications, audit-ready infrastructure, and fraud prevention.",
  },
  "manufacturing": {
    title: "Manufacturing IT Services | OT/IT Convergence | GigitekAI",
    description: "IT solutions for manufacturers. OT/IT convergence, SCADA security, supply chain visibility, and Industry 4.0 digital transformation.",
  },
  "retail": {
    title: "Retail & E-Commerce IT | PCI Compliant | GigitekAI",
    description: "IT solutions for retail and e-commerce. PCI-DSS compliance, POS security, inventory systems, and omnichannel infrastructure.",
  },
  "retail-ecommerce": {
    title: "Retail & E-Commerce IT | PCI Compliant | GigitekAI",
    description: "IT solutions for retail and e-commerce. PCI-DSS compliance, POS security, inventory systems, and omnichannel infrastructure.",
  },
  "government": {
    title: "Government IT Services | CMMC & FedRAMP | GigitekAI",
    description: "IT services for government agencies. CMMC, FedRAMP, and NIST compliance. Secure cloud, endpoint management, and zero trust architecture.",
  },
  "education": {
    title: "Education IT Services | K-12 & Higher Ed | GigitekAI",
    description: "IT solutions for education. LMS integration, campus networking, student data protection, and FERPA-compliant cloud infrastructure.",
  },
};

// Valid portfolio demo slugs (from App.tsx routes)
const VALID_PORTFOLIO_SLUGS = new Set([
  "finance", "legal", "insurance", "vc", "health",
  "consulting", "tech", "gigitekai", "divinesounds", "ecommerce",
]);

// ─── Crawler Detection ───────────────────────────────────────────────────────
const CRAWLER_USER_AGENTS = [
  "googlebot", "bingbot", "yandexbot", "baiduspider",
  "duckduckbot", "slurp", "facebot", "facebookexternalhit",
  "twitterbot", "linkedinbot", "whatsapp", "telegrambot",
  "gptbot", "claudebot", "perplexitybot", "oai-searchbot",
  "google-extended", "applebot", "bytespider",
  "semrushbot", "ahrefsbot", "mj12bot", "dotbot",
  "petalbot", "rogerbot", "screaming frog",
];

function isCrawler(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return CRAWLER_USER_AGENTS.some(bot => ua.includes(bot));
}

// ─── HTML Injection ──────────────────────────────────────────────────────────
function injectSEO(html: string, seo: RouteSEO, canonicalUrl: string): string {
  let result = html;

  // Replace the generic title
  result = result.replace(
    /<title>[^<]*<\/title>/,
    `<title>${seo.title}</title>`
  );

  // Replace or inject meta description
  result = result.replace(
    /<meta name="description" content="[^"]*"[^>]*>/,
    `<meta name="description" content="${seo.description.substring(0, 155)}">`
  );

  // Fix canonical URL (replace homepage canonical with self-referencing)
  result = result.replace(
    /<link rel="canonical" href="[^"]*"[^>]*>/,
    `<link rel="canonical" href="${canonicalUrl}">`
  );

  // Fix og:url
  result = result.replace(
    /<meta property="og:url" content="[^"]*"[^>]*>/,
    `<meta property="og:url" content="${canonicalUrl}">`
  );

  // Fix og:title
  result = result.replace(
    /<meta property="og:title" content="[^"]*"[^>]*>/,
    `<meta property="og:title" content="${seo.title}">`
  );

  // Fix og:description
  result = result.replace(
    /<meta property="og:description" content="[^"]*"[^>]*>/,
    `<meta property="og:description" content="${seo.description.substring(0, 155)}">`
  );

  // If no og:locale, add it
  if (!result.includes('og:locale')) {
    result = result.replace(
      '</head>',
      `<meta property="og:locale" content="en_US">\n</head>`
    );
  }

  // Add noindex for thin/auto-generated content
  if (seo.noindex) {
    result = result.replace(
      '</head>',
      `<meta name="robots" content="noindex, follow">\n</head>`
    );
  }

  return result;
}

// ─── Route Matching ──────────────────────────────────────────────────────────
async function getRouteSEO(pathname: string): Promise<RouteSEO | null> {
  // Normalize: remove trailing slash (except root)
  const normalized = pathname === "/" ? "/" : pathname.replace(/\/$/, "");

  // Direct match
  if (ROUTE_SEO[normalized]) {
    return ROUTE_SEO[normalized];
  }

  // Service detail pages: /services/:slug
  const serviceMatch = normalized.match(/^\/services\/(.+)$/);
  if (serviceMatch && SERVICE_SLUGS[serviceMatch[1]]) {
    return SERVICE_SLUGS[serviceMatch[1]];
  }

  // Industry pages: /industries/:slug
  const industryMatch = normalized.match(/^\/industries\/(.+)$/);
  if (industryMatch && INDUSTRY_SLUGS[industryMatch[1]]) {
    return INDUSTRY_SLUGS[industryMatch[1]];
  }

  // Portfolio demo pages (only valid slugs)
  const portfolioMatch = normalized.match(/^\/(websites|portfolio)\/(.+)$/);
  if (portfolioMatch && VALID_PORTFOLIO_SLUGS.has(portfolioMatch[2])) {
    const slug = portfolioMatch[2];
    return {
      title: `${slug.charAt(0).toUpperCase() + slug.slice(1)} Website Demo | GigitekAI Portfolio`,
      description: `Professional ${slug} website demo by GigitekAI. See our web design capabilities for the ${slug} industry.`,
    };
  }

  // Blog detail pages: /blog/:slug — SEO data generated from slug
  // (actual existence check is done in isKnownRouteAsync)
  const blogMatch = normalized.match(/^\/blog\/(.+)$/);
  if (blogMatch) {
    const slug = blogMatch[1];
    // Noindex auto-generated "Daily Recap" posts — thin content
    const isDailyRecap = slug.includes('daily-recap') || slug.includes('daily-ai-recap');
    
    // Try to get the actual post title from the blog slug cache
    let title = slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    try {
      const { getDb } = await import("../db");
      const { blogPosts } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      if (db) {
        const [post] = await db
          .select({ title: blogPosts.title })
          .from(blogPosts)
          .where(eq(blogPosts.slug, slug))
          .limit(1);
        if (post?.title) {
          title = post.title;
        }
      }
    } catch {
      // Fall back to slug-derived title
    }
    
    return {
      title: `${title} | GigitekAI Blog`,
      description: `Read ${title} on the GigitekAI blog. Expert insights on managed IT, cloud, AI, and cybersecurity.`,
      noindex: isDailyRecap,
    };
  }

  // KB article pages: /kb/:id
  if (normalized.match(/^\/kb\/.+$/)) {
    return {
      title: "Knowledge Base Article | IT Support | GigitekAI",
      description: "IT support knowledge base article. Step-by-step solutions for common IT issues including Microsoft 365, networking, and security.",
    };
  }

  // AI News detail: /ai-news/:id
  if (normalized.match(/^\/ai-news\/\d+$/)) {
    return {
      title: "AI News Article | Latest AI Technology Updates | GigitekAI",
      description: "AI news article with analysis and GigitekAI perspective. Stay current with AI breakthroughs and enterprise AI trends.",
    };
  }

  return null;
}

// ─── Known Routes (for 404 detection) ────────────────────────────────────────
// These are EXACT static routes from App.tsx that should always return 200
const KNOWN_STATIC_ROUTES = new Set([
  "/", "/services", "/pricing", "/web-pricing", "/helpdesk-pricing",
  "/contact", "/free-audit", "/audit-results", "/blog", "/insights",
  "/websites", "/portfolio", "/kb", "/case-studies", "/security",
  "/managed-it-services-tampa", "/managed-it-services-miami",
  "/florida-it-resiliency", "/smart-home", "/switch-program",
  "/compliance-scorecard", "/compliance-benchmark", "/roadmap-generator",
  "/industries", "/our-team", "/partners", "/support", "/status",
  "/privacy-policy", "/privacy", "/terms-of-service", "/ai-demo",
  "/ai-news", "/web-discovery-intake", "/exchange", "/m365-status",
  "/m365-notifications", "/helpdesk", "/investor-portal",
  "/accept-invite", "/logout", "/contact-card", "/search",
  "/AIStrategicBriefing", "/404", "/about", "/about-us",
  "/scripts", "/call-transcripts",
]);

// Route prefixes that accept any sub-path (token-based or app routes)
// These always return 200 regardless of the sub-path value
const ALWAYS_200_PREFIXES = [
  "/admin",           // Admin portal (has its own auth)
  "/helpdesk",        // Helpdesk app (ticket IDs, dashboard, etc.)
  "/cancel-meeting",  // Token-based meeting cancellation
  "/reschedule-meeting", // Token-based meeting reschedule
  "/remote-session",  // Room-based remote sessions
  "/support",         // Support portal (ticket lookup, etc.)
  "/kb",              // Knowledge base articles (any ID)
];

// ─── Blog Slug Cache ─────────────────────────────────────────────────────────
// Cache published blog slugs in memory for 5 minutes to avoid DB hit on every request
let blogSlugCache: Set<string> = new Set();
let blogSlugCacheTime: number = 0;
const BLOG_SLUG_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function loadBlogSlugs(): Promise<Set<string>> {
  const now = Date.now();
  if (blogSlugCache.size > 0 && (now - blogSlugCacheTime) < BLOG_SLUG_CACHE_TTL) {
    return blogSlugCache;
  }
  
  try {
    const { getDb } = await import("../db");
    const { blogPosts } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    if (!db) return blogSlugCache;
    
    const posts = await db
      .select({ slug: blogPosts.slug })
      .from(blogPosts)
      .where(eq(blogPosts.published, 1));
    
    blogSlugCache = new Set(posts.map(p => p.slug));
    blogSlugCacheTime = now;
    console.log(`[Prerender] Blog slug cache refreshed: ${blogSlugCache.size} slugs`);
  } catch (err) {
    console.error("[Prerender] Failed to load blog slugs:", err);
    // Keep stale cache if DB fails
  }
  
  return blogSlugCache;
}

// ─── AI News ID Cache ────────────────────────────────────────────────────────
let aiNewsIdCache: Set<number> = new Set();
let aiNewsIdCacheTime: number = 0;
const AI_NEWS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function loadAiNewsIds(): Promise<Set<number>> {
  const now = Date.now();
  if (aiNewsIdCache.size > 0 && (now - aiNewsIdCacheTime) < AI_NEWS_CACHE_TTL) {
    return aiNewsIdCache;
  }
  
  try {
    const { getDb } = await import("../db");
    const { aiNewsArticles } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    if (!db) return aiNewsIdCache;
    
    const articles = await db
      .select({ id: aiNewsArticles.id })
      .from(aiNewsArticles)
      .where(eq(aiNewsArticles.isArchived, 0));
    
    aiNewsIdCache = new Set(articles.map(a => a.id));
    aiNewsIdCacheTime = now;
    console.log(`[Prerender] AI News ID cache refreshed: ${aiNewsIdCache.size} articles`);
  } catch (err) {
    console.error("[Prerender] Failed to load AI news IDs:", err);
  }
  
  return aiNewsIdCache;
}

// ─── Async Route Validation ──────────────────────────────────────────────────
async function isKnownRouteAsync(pathname: string): Promise<boolean> {
  const normalized = pathname.replace(/\/$/, "") || "/";
  
  // 1. Exact static route match
  if (KNOWN_STATIC_ROUTES.has(normalized)) return true;
  
  // 2. Always-200 prefix match (admin, helpdesk, meeting tokens, etc.)
  for (const prefix of ALWAYS_200_PREFIXES) {
    if (normalized === prefix || normalized.startsWith(prefix + "/")) return true;
  }
  
  // 3. Service detail: /services/:slug — validate against known service slugs
  const serviceMatch = normalized.match(/^\/services\/(.+)$/);
  if (serviceMatch) {
    return serviceMatch[1] in SERVICE_SLUGS;
  }
  
  // 4. Industry pages: /industries/:slug — validate against known industry slugs
  const industryMatch = normalized.match(/^\/industries\/(.+)$/);
  if (industryMatch) {
    return industryMatch[1] in INDUSTRY_SLUGS;
  }
  
  // 5. Portfolio demos: /websites/:slug or /portfolio/:slug — validate against known demos
  const portfolioMatch = normalized.match(/^\/(websites|portfolio)\/(.+)$/);
  if (portfolioMatch) {
    return VALID_PORTFOLIO_SLUGS.has(portfolioMatch[2]);
  }
  
  // 6. Blog posts: /blog/:slug — validate against published slugs in DB
  const blogMatch = normalized.match(/^\/blog\/(.+)$/);
  if (blogMatch) {
    const slugs = await loadBlogSlugs();
    return slugs.has(blogMatch[1]);
  }
  
  // 7. AI News: /ai-news/:id — validate against non-archived article IDs
  const aiNewsMatch = normalized.match(/^\/ai-news\/(\d+)$/);
  if (aiNewsMatch) {
    const ids = await loadAiNewsIds();
    return ids.has(parseInt(aiNewsMatch[1], 10));
  }
  
  // 8. Non-numeric /ai-news sub-paths are invalid
  if (normalized.match(/^\/ai-news\/.+$/)) {
    return false;
  }
  
  return false;
}

// Legacy sync version for backward compatibility
function isKnownRoute(pathname: string): boolean {
  const normalized = pathname.replace(/\/$/, "") || "/";
  if (KNOWN_STATIC_ROUTES.has(normalized)) return true;
  for (const prefix of ALWAYS_200_PREFIXES) {
    if (normalized === prefix || normalized.startsWith(prefix + "/")) return true;
  }
  // For sync checks, allow blog/ai-news/portfolio/services/industries sub-paths
  // (the async version does the real DB validation)
  const serviceMatch = normalized.match(/^\/services\/(.+)$/);
  if (serviceMatch) return serviceMatch[1] in SERVICE_SLUGS;
  const industryMatch = normalized.match(/^\/industries\/(.+)$/);
  if (industryMatch) return industryMatch[1] in INDUSTRY_SLUGS;
  const portfolioMatch = normalized.match(/^\/(websites|portfolio)\/(.+)$/);
  if (portfolioMatch) return VALID_PORTFOLIO_SLUGS.has(portfolioMatch[2]);
  // Blog and AI news — sync version can't check DB, so return true (async will validate)
  if (normalized.match(/^\/blog\/.+$/)) return true;
  if (normalized.match(/^\/ai-news\/\d+$/)) return true;
  return false;
}

// ─── Prerendered Content Cache ───────────────────────────────────────────────
// Load prerendered route content from __prerendered/ directory at startup
const prerenderedCache: Map<string, string> = new Map();

function loadPrerenderedContent(distPath: string): void {
  const prerenderDir = path.resolve(distPath, '__prerendered');
  if (!fs.existsSync(prerenderDir)) {
    console.log('[Prerender] No __prerendered directory found — skipping content injection');
    return;
  }
  
  const files = fs.readdirSync(prerenderDir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(prerenderDir, file), 'utf-8'));
      if (data.route && data.content) {
        prerenderedCache.set(data.route, data.content);
      }
    } catch {
      // Skip malformed files
    }
  }
  console.log(`[Prerender] Loaded ${prerenderedCache.size} prerendered routes`);
}

function injectPrerenderedContent(html: string, route: string): string {
  const content = prerenderedCache.get(route);
  if (!content) return html;
  
  // Inject the prerendered content inside #root so crawlers see real DOM
  // React will clear #root on mount anyway, so this doesn't affect UX
  return html.replace(
    '<div id="root"></div>',
    `<div id="root"><div id="gigitekai-app" style="min-height:100vh;">${content}</div></div>`
  );
}

// ─── Middleware Export ────────────────────────────────────────────────────────
export function prerenderMiddleware(distPath: string) {
  // Load prerendered content on startup
  loadPrerenderedContent(distPath);
  
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip API routes, static assets, and storage proxy
    if (
      req.path.startsWith("/api/") ||
      req.path.startsWith("/manus-storage/") ||
      req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot|map|json|xml|txt)$/)
    ) {
      return next();
    }

    // ─── Trailing Slash Redirect (301) ───────────────────────────────────
    if (req.path !== "/" && req.path.endsWith("/")) {
      const cleanPath = req.path.replace(/\/+$/, "");
      return res.redirect(301, cleanPath + (req.url.includes("?") ? "?" + req.url.split("?")[1] : ""));
    }

    // ─── /insights → /blog redirect ─────────────────────────────────────
    if (req.path === "/insights") {
      return res.redirect(301, "/blog");
    }

    // ─── 404 Detection (async — validates blog slugs & AI news IDs) ─────
    const known = await isKnownRouteAsync(req.path);
    if (!known) {
      // Serve 404 page with proper HTTP status
      const indexPath = path.resolve(distPath, "index.html");
      try {
        let html = fs.readFileSync(indexPath, "utf-8");
        html = injectSEO(html, {
          title: "Page Not Found | GigitekAI",
          description: "The page you're looking for doesn't exist. Return to GigitekAI homepage for managed IT, cloud, and AI services.",
          noindex: true,
        }, `${BASE_URL}/404`);
        res.status(404).setHeader("Content-Type", "text/html; charset=utf-8");
        return res.send(html);
      } catch {
        return res.status(404).send("Not Found");
      }
    }

        // ─── SEO Injection & HTML Serving (for ALL known routes) ─────────────
    // This middleware ALWAYS serves index.html for known routes.
    // If SEO data exists, inject it. Otherwise serve plain index.html.
    // This prevents the serveStatic catch-all from ever handling HTML pages.
    const seo = await getRouteSEO(req.path);
    const canonicalUrl = req.path === "/" ? `${BASE_URL}/` : `${BASE_URL}${req.path}`;
    const indexPath = path.resolve(distPath, "index.html");
    try {
      let html = fs.readFileSync(indexPath, "utf-8");
      if (seo) {
        html = injectSEO(html, seo, canonicalUrl);
      }
      // Inject prerendered content into #root for crawlers to see real DOM
      html = injectPrerenderedContent(html, req.path);
      // Fix Cache-Control for HTML (allow caching with revalidation)
      res.setHeader("Cache-Control", "no-cache, max-age=0, must-revalidate");
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);
    } catch {
      return next();
    }
  };
}

export { ROUTE_SEO, SERVICE_SLUGS, INDUSTRY_SLUGS, isKnownRoute, isKnownRouteAsync, getRouteSEO };
