import { Request, Response } from "express";

/**
 * Server-Side Rendering (SSR) handler for homepage
 * Returns full HTML content including hero, stats, services, and schema markup
 * This ensures Google and users see complete content without JavaScript
 */
export function renderHomepageSSR(req: Request, res: Response) {
  const schemaMarkup = {
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

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GigitekAI - Enterprise Cloud & AI Solutions</title>
    <meta name="description" content="Enterprise cloud infrastructure, AI/ML solutions, cybersecurity, and managed IT services. 99.9% uptime SLA, 24/7 AI-powered support.">
    <meta name="keywords" content="cloud infrastructure, AI solutions, managed IT services, cybersecurity, Microsoft 365, AWS, Azure">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="https://gigitekai.com">
    <meta property="og:title" content="GigitekAI - Enterprise Cloud & AI Solutions">
    <meta property="og:description" content="Enterprise cloud infrastructure, AI/ML solutions, cybersecurity, and managed IT services.">
    <meta property="og:url" content="https://gigitekai.com">
    <meta property="og:type" content="website">
    <script type="application/ld+json">
    ${JSON.stringify(schemaMarkup, null, 2)}
    </script>
</head>
<body>
    <div id="root">
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
        <section style="background: #f5f5f5; padding: 60px 20px;">
            <div style="max-width: 1200px; margin: 0 auto;">
                <h2 style="text-align: center; font-size: 2rem; margin-bottom: 50px; color: #0A0E1A;">Our Services</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 30px;">
                    <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <h3 style="color: #0A0E1A; margin-bottom: 15px;">Cloud Infrastructure</h3>
                        <p style="color: #666;">AWS, Azure, Google Cloud provisioning, optimization, and management with enterprise-grade security.</p>
                    </div>
                    <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <h3 style="color: #0A0E1A; margin-bottom: 15px;">AI & Automation</h3>
                        <p style="color: #666;">Custom AI agents, machine learning models, and intelligent automation to streamline operations.</p>
                    </div>
                    <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <h3 style="color: #0A0E1A; margin-bottom: 15px;">Cybersecurity</h3>
                        <p style="color: #666;">Zero Trust architecture, threat detection, incident response, and compliance management.</p>
                    </div>
                    <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <h3 style="color: #0A0E1A; margin-bottom: 15px;">Microsoft 365</h3>
                        <p style="color: #666;">Implementation, optimization, and management of Microsoft 365 solutions.</p>
                    </div>
                    <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <h3 style="color: #0A0E1A; margin-bottom: 15px;">Managed IT Services</h3>
                        <p style="color: #666;">24/7 monitoring, support, and proactive maintenance of your IT infrastructure.</p>
                    </div>
                    <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <h3 style="color: #0A0E1A; margin-bottom: 15px;">Helpdesk & Support</h3>
                        <p style="color: #666;">AI-powered helpdesk ticketing, knowledge base, and multi-channel support integration.</p>
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
            </div>
        </footer>
    </div>
    <script>
        // Placeholder for React app - this SSR version shows full content without JS
        console.log('GigitekAI homepage loaded with full server-side rendered content');
    </script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
  res.send(html);
}
