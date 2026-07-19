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
}

const BASE_URL = "https://gigitekai.com";
const DEFAULT_OG_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663509163804/mmTCDMc2kTTVcTkwoY8f9U/gigitekai-social-share-PcGTfHXSqszP86JZVvvsxv.png";

const ROUTE_SEO: Record<string, RouteSEO> = {
  "/": {
    title: "GigitekAI — AI-First MSP | Microsoft 365, Managed IT & AI Automation",
    description: "GigitekAI delivers enterprise-grade cloud infrastructure, AI automation, and managed IT services. 99.9% uptime SLA, 24/7 support, 40% cost reduction for SMBs.",
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
    description: "24/7 AI-powered helpdesk support. Essential $69, Professional $119, Elite $189 per user/month. Includes ticket management, remote support, and SLA guarantees.",
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
  "manufacturing": {
    title: "Manufacturing IT Services | OT/IT Convergence | GigitekAI",
    description: "IT solutions for manufacturers. OT/IT convergence, SCADA security, supply chain visibility, and Industry 4.0 digital transformation.",
  },
  "retail": {
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

  return result;
}

// ─── Route Matching ──────────────────────────────────────────────────────────
function getRouteSEO(pathname: string): RouteSEO | null {
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

  // Portfolio demo pages
  const portfolioMatch = normalized.match(/^\/(websites|portfolio)\/(.+)$/);
  if (portfolioMatch) {
    const slug = portfolioMatch[2];
    return {
      title: `${slug.charAt(0).toUpperCase() + slug.slice(1)} Website Demo | GigitekAI Portfolio`,
      description: `Professional ${slug} website demo by GigitekAI. See our web design capabilities for the ${slug} industry.`,
    };
  }

  // Blog detail pages: /blog/:slug
  const blogMatch = normalized.match(/^\/blog\/(.+)$/);
  if (blogMatch) {
    const slug = blogMatch[1];
    const title = slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    return {
      title: `${title} | GigitekAI Blog`,
      description: `Read ${title} on the GigitekAI blog. Expert insights on managed IT, cloud, AI, and cybersecurity.`,
    };
  }

  // KB article pages: /kb/:id
  if (normalized.match(/^\/kb\/.+$/)) {
    return {
      title: "Knowledge Base Article | IT Support | GigitekAI",
      description: "IT support knowledge base article. Step-by-step solutions for common IT issues including Microsoft 365, networking, and security.",
    };
  }

  return null;
}

// ─── Known Routes (for 404 detection) ────────────────────────────────────────
const KNOWN_ROUTE_PREFIXES = [
  "/", "/services", "/pricing", "/web-pricing", "/helpdesk-pricing",
  "/contact", "/free-audit", "/audit-results", "/blog", "/insights",
  "/websites", "/portfolio", "/kb", "/case-studies", "/security",
  "/managed-it-services-tampa", "/managed-it-services-miami",
  "/florida-it-resiliency", "/smart-home", "/switch-program",
  "/compliance-scorecard", "/compliance-benchmark", "/roadmap-generator",
  "/industries", "/our-team", "/partners", "/support", "/status",
  "/privacy-policy", "/privacy", "/terms-of-service", "/ai-demo",
  "/ai-news", "/web-discovery-intake", "/exchange", "/m365-status",
  "/m365-notifications", "/helpdesk", "/admin", "/investor-portal",
  "/accept-invite", "/logout", "/cancel-meeting", "/reschedule-meeting",
  "/remote-session", "/scripts", "/call-transcripts", "/contact-card",
  "/AIStrategicBriefing", "/404",
];

function isKnownRoute(pathname: string): boolean {
  const normalized = pathname.replace(/\/$/, "") || "/";
  
  // Exact match
  if (KNOWN_ROUTE_PREFIXES.includes(normalized)) return true;
  
  // Prefix match for dynamic routes
  for (const prefix of KNOWN_ROUTE_PREFIXES) {
    if (normalized.startsWith(prefix + "/")) return true;
  }
  
  return false;
}

// ─── Middleware Export ────────────────────────────────────────────────────────
export function prerenderMiddleware(distPath: string) {
  return (req: Request, res: Response, next: NextFunction) => {
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

    // ─── 404 Detection ───────────────────────────────────────────────────
    if (!isKnownRoute(req.path)) {
      // Serve 404 page with proper HTTP status
      const indexPath = path.resolve(distPath, "index.html");
      try {
        let html = fs.readFileSync(indexPath, "utf-8");
        html = injectSEO(html, {
          title: "Page Not Found | GigitekAI",
          description: "The page you're looking for doesn't exist. Return to GigitekAI homepage for managed IT, cloud, and AI services.",
        }, `${BASE_URL}/404`);
        res.status(404).setHeader("Content-Type", "text/html; charset=utf-8");
        return res.send(html);
      } catch {
        return res.status(404).send("Not Found");
      }
    }

    // ─── SEO Injection (for ALL requests, not just crawlers) ─────────────
    // This ensures Google sees correct meta even if it renders the page
    const seo = getRouteSEO(req.path);
    if (!seo) {
      return next();
    }

    const canonicalUrl = req.path === "/" ? `${BASE_URL}/` : `${BASE_URL}${req.path}`;
    const indexPath = path.resolve(distPath, "index.html");

    try {
      let html = fs.readFileSync(indexPath, "utf-8");
      html = injectSEO(html, seo, canonicalUrl);

      // Fix Cache-Control for HTML (allow caching with revalidation)
      res.setHeader("Cache-Control", "no-cache, max-age=0, must-revalidate");
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);
    } catch {
      return next();
    }
  };
}

export { ROUTE_SEO, SERVICE_SLUGS, INDUSTRY_SLUGS, isKnownRoute, getRouteSEO };
