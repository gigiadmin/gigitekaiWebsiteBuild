import { Request, Response } from "express";
import fs from "fs";
import path from "path";

/**
 * Server-Side Rendering (SSR) handler for homepage
 * 
 * Instead of serving a standalone HTML page, this reads the built index.html
 * (which contains all the correct script/CSS references for React hydration)
 * and injects pre-rendered content into <div id="root"> for SEO.
 * 
 * This ensures:
 * 1. Google sees full content (hero, stats, services, CTA, footer)
 * 2. React app loads and hydrates normally (navbar, interactivity, etc.)
 * 3. Schema markup is present for structured data
 */

// Cache the built index.html in memory
let cachedIndexHtml: string | null = null;
let cachedIndexMtime: number = 0;

const SCHEMA_MARKUP = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "GigitekAI",
  "url": "https://gigitekai.com",
  "description": "Enterprise cloud infrastructure, AI/ML solutions, cybersecurity, and managed IT services in Tampa, Florida",
  "logo": "https://gigitekai.com/logo.png",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Tampa",
    "addressRegion": "FL",
    "postalCode": "33602",
    "addressCountry": "US"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+1-727-382-6909",
    "contactType": "customer service",
    "email": "support@gigitekai.com"
  },
  "sameAs": [
    "https://www.linkedin.com/company/gigitekai",
    "https://twitter.com/gigitekai",
    "https://www.facebook.com/gigitekai"
  ]
};

/**
 * Pre-rendered HTML content for SEO crawlers
 * This content is placed inside <noscript> and a hidden div so:
 * - Crawlers see full content
 * - React app renders normally on top
 * - No flash of duplicate content (hidden div removed on React mount)
 */
const PRERENDERED_CONTENT = `
    <!-- SSR: Pre-rendered content for SEO crawlers only - invisible to users -->
    <div id="prerender-root" style="display:none;visibility:hidden;position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;" aria-hidden="true">
      <!-- Hero Section -->
      <section style="background: linear-gradient(135deg, #0A0E1A 0%, #1a1f3a 100%); color: white; padding: 80px 20px; text-align: center;">
        <h1 style="font-size: 3rem; margin-bottom: 20px; font-weight: bold;">Intelligent Cloud & AI Solutions</h1>
        <p style="font-size: 1.2rem; margin-bottom: 30px; max-width: 600px; margin-left: auto; margin-right: auto;">
          Enterprise-grade cloud infrastructure, AI/ML solutions, cybersecurity, and managed IT services. 
          Reduce operational costs by up to 40% with our AI-first approach.
        </p>
        <a href="#contact" style="display: inline-block; background: #00D4FF; color: #0A0E1A; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 1rem;">
          Start Your Transformation →
        </a>
      </section>

      <!-- Stats Section -->
      <section style="background: #0A0E1A; color: white; padding: 60px 20px;">
        <div style="max-width: 1200px; margin: 0 auto;">
          <h2 style="text-align: center; font-size: 2rem; margin-bottom: 50px;">Why Choose GigitekAI</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 30px;">
            <div>
              <h3 style="color: #00D4FF; font-size: 2rem; margin-bottom: 10px;">99.9%</h3>
              <p>Uptime SLA Guaranteed</p>
            </div>
            <div>
              <h3 style="color: #00D4FF; font-size: 2rem; margin-bottom: 10px;">40%</h3>
              <p>Reduction in Operational Costs</p>
            </div>
            <div>
              <h3 style="color: #00D4FF; font-size: 2rem; margin-bottom: 10px;">10x</h3>
              <p>Faster AI Model Deployment</p>
            </div>
            <div>
              <h3 style="color: #00D4FF; font-size: 2rem; margin-bottom: 10px;">280+</h3>
              <p>Hours Freed Monthly per 100 Employees</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Services Section -->
      <section style="background: #0d1225; padding: 60px 20px; color: white;">
        <div style="max-width: 1200px; margin: 0 auto;">
          <h2 style="text-align: center; font-size: 2rem; margin-bottom: 50px;">Our Services</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 30px;">
            <div style="background: rgba(0,212,255,0.05); padding: 30px; border-radius: 8px; border: 1px solid rgba(0,212,255,0.2);">
              <h3 style="color: #00D4FF; margin-bottom: 15px;">Cloud Infrastructure</h3>
              <p style="color: #ccc;">AWS, Azure, Google Cloud provisioning, optimization, and management with enterprise-grade security.</p>
            </div>
            <div style="background: rgba(0,212,255,0.05); padding: 30px; border-radius: 8px; border: 1px solid rgba(0,212,255,0.2);">
              <h3 style="color: #00D4FF; margin-bottom: 15px;">AI & Automation</h3>
              <p style="color: #ccc;">Custom AI agents, machine learning models, and intelligent automation to streamline operations.</p>
            </div>
            <div style="background: rgba(0,212,255,0.05); padding: 30px; border-radius: 8px; border: 1px solid rgba(0,212,255,0.2);">
              <h3 style="color: #00D4FF; margin-bottom: 15px;">Cybersecurity</h3>
              <p style="color: #ccc;">Zero Trust architecture, threat detection, incident response, and compliance management.</p>
            </div>
            <div style="background: rgba(0,212,255,0.05); padding: 30px; border-radius: 8px; border: 1px solid rgba(0,212,255,0.2);">
              <h3 style="color: #00D4FF; margin-bottom: 15px;">Microsoft 365</h3>
              <p style="color: #ccc;">Implementation, optimization, and management of Microsoft 365 solutions.</p>
            </div>
            <div style="background: rgba(0,212,255,0.05); padding: 30px; border-radius: 8px; border: 1px solid rgba(0,212,255,0.2);">
              <h3 style="color: #00D4FF; margin-bottom: 15px;">Managed IT Services</h3>
              <p style="color: #ccc;">24/7 monitoring, support, and proactive maintenance of your IT infrastructure.</p>
            </div>
            <div style="background: rgba(0,212,255,0.05); padding: 30px; border-radius: 8px; border: 1px solid rgba(0,212,255,0.2);">
              <h3 style="color: #00D4FF; margin-bottom: 15px;">Helpdesk & Support</h3>
              <p style="color: #ccc;">AI-powered helpdesk ticketing, knowledge base, and multi-channel support integration.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section id="contact" style="background: linear-gradient(135deg, #0A0E1A 0%, #1a1f3a 100%); color: white; padding: 60px 20px; text-align: center;">
        <h2 style="font-size: 2rem; margin-bottom: 20px;">Ready to Transform Your Business?</h2>
        <p style="font-size: 1.1rem; margin-bottom: 30px;">Contact us today for a free consultation and ROI assessment.</p>
        <div style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap;">
          <a href="tel:+17273826909" style="display: inline-block; background: #00D4FF; color: #0A0E1A; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">
            Call: (727) 382-6909
          </a>
          <a href="mailto:support@gigitekai.com" style="display: inline-block; background: transparent; color: #00D4FF; padding: 12px 30px; border: 2px solid #00D4FF; border-radius: 6px; text-decoration: none; font-weight: bold;">
            Email: support@gigitekai.com
          </a>
        </div>
      </section>

      <!-- Footer -->
      <footer style="background: #0A0E1A; color: #999; padding: 40px 20px; border-top: 1px solid #333;">
        <div style="max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 30px; margin-bottom: 30px;">
          <div>
            <h4 style="color: white; margin-bottom: 15px;">GigitekAI</h4>
            <p>Enterprise cloud infrastructure, AI/ML solutions, cybersecurity, and managed IT services.</p>
            <p style="margin-top: 15px;">
              <strong>Phone:</strong> <a href="tel:+17273826909" style="color: #00D4FF; text-decoration: none;">(727) 382-6909</a><br>
              <strong>Email:</strong> <a href="mailto:support@gigitekai.com" style="color: #00D4FF; text-decoration: none;">support@gigitekai.com</a>
            </p>
          </div>
          <div>
            <h4 style="color: white; margin-bottom: 15px;">Services</h4>
            <ul style="list-style: none; padding: 0;">
              <li><a href="/services" style="color: #00D4FF; text-decoration: none;">Cloud Infrastructure</a></li>
              <li><a href="/services" style="color: #00D4FF; text-decoration: none;">AI & Automation</a></li>
              <li><a href="/services" style="color: #00D4FF; text-decoration: none;">Cybersecurity</a></li>
              <li><a href="/services" style="color: #00D4FF; text-decoration: none;">Managed IT Services</a></li>
            </ul>
          </div>
          <div>
            <h4 style="color: white; margin-bottom: 15px;">Company</h4>
            <ul style="list-style: none; padding: 0;">
              <li><a href="/about" style="color: #00D4FF; text-decoration: none;">About Us</a></li>
              <li><a href="/insights" style="color: #00D4FF; text-decoration: none;">Insights</a></li>
              <li><a href="/blog" style="color: #00D4FF; text-decoration: none;">Blog</a></li>
              <li><a href="/contact" style="color: #00D4FF; text-decoration: none;">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 style="color: white; margin-bottom: 15px;">Legal</h4>
            <ul style="list-style: none; padding: 0;">
              <li><a href="/privacy-policy" style="color: #00D4FF; text-decoration: none;">Privacy Policy</a></li>
              <li><a href="/terms-of-service" style="color: #00D4FF; text-decoration: none;">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div style="border-top: 1px solid #333; padding-top: 20px; text-align: center;">
          <p>&copy; 2026 GigitekAI LLC. All rights reserved.</p>
          <p style="margin-top: 8px;"><a href="https://gigitekai.com" style="color: #00D4FF; text-decoration: none;">Created by GigitekAI</a></p>
        </div>
      </footer>
    </div>
    <noscript>
      <style>#prerender-root { position: static !important; }</style>
    </noscript>
`;

export function renderHomepageSSR(req: Request, res: Response) {
  const distPath = path.resolve(import.meta.dirname, "../dist/public");
  const indexPath = path.resolve(distPath, "index.html");

  try {
    // Read the built index.html (has correct script/CSS references)
    const stat = fs.statSync(indexPath);
    const mtime = stat.mtimeMs;
    
    if (!cachedIndexHtml || cachedIndexMtime !== mtime) {
      let html = fs.readFileSync(indexPath, "utf-8");
      
      // 1. Inject schema markup into <head>
      const schemaScript = `<script type="application/ld+json">\n    ${JSON.stringify(SCHEMA_MARKUP, null, 2)}\n    </script>`;
      html = html.replace("</head>", `    ${schemaScript}\n</head>`);
      
      // 2. Add SEO meta tags if not already present
      if (!html.includes('meta name="description"')) {
        const metaTags = `
    <meta name="description" content="Enterprise cloud infrastructure, AI/ML solutions, cybersecurity, and managed IT services. 99.9% uptime SLA, 24/7 AI-powered support.">
    <meta name="keywords" content="cloud infrastructure, AI solutions, managed IT services, cybersecurity, Microsoft 365, AWS, Azure, GigitekAI">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="https://gigitekai.com">
    <meta property="og:title" content="GigitekAI - Enterprise Cloud & AI Solutions">
    <meta property="og:description" content="Enterprise cloud infrastructure, AI/ML solutions, cybersecurity, and managed IT services.">
    <meta property="og:url" content="https://gigitekai.com">
    <meta property="og:type" content="website">`;
        html = html.replace("</head>", `${metaTags}\n</head>`);
      }
      
      // 3. Inject pre-rendered content INSIDE <div id="root"> for SEO
      // The React app will mount and the prerender-root will be removed by the observer script
      html = html.replace('<div id="root"></div>', `<div id="root">${PRERENDERED_CONTENT}</div>`);
      
      // 4. Add the observer script to remove pre-rendered content once React mounts
      const observerScript = `
    <script>
      // Remove pre-rendered SEO content once React app mounts
      var observer = new MutationObserver(function(mutations) {
        var prerender = document.getElementById('prerender-root');
        if (prerender && document.querySelector('[data-hero-mounted]')) {
          prerender.remove();
          observer.disconnect();
        }
      });
      var root = document.getElementById('root');
      if (root) observer.observe(root, { childList: true, subtree: true });
    </script>`;
      
      // Only add if not already present
      if (!html.includes('data-hero-mounted')) {
        html = html.replace("</body>", `${observerScript}\n</body>`);
      }
      
      cachedIndexHtml = html;
      cachedIndexMtime = mtime;
      console.log("[SSR] Homepage HTML cached with pre-rendered content and React bundle");
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    res.send(cachedIndexHtml);
  } catch (err) {
    console.error("[SSR] Error rendering homepage:", err);
    // Fallback: serve the raw index.html without SSR content
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(500).send("Server error");
    }
  }
}
