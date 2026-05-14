#!/usr/bin/env node

/**
 * Pre-render critical pages for SEO
 * Generates static HTML for: Contact, Services, Pricing
 * Runs at build time to ensure crawlers see full content
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'client', 'public');

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Pre-rendered HTML pages
const pages = {
  'contact.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contact Us | GigitekAI</title>
    <meta name="description" content="Get in touch with GigitekAI. Contact us for Microsoft 365 architecture, AI automation, and managed IT services.">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="https://gigitekai.com/contact">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0A0E1A; color: #e0e0e0; line-height: 1.6; }
        .container { max-width: 900px; margin: 0 auto; padding: 2rem; }
        h1 { font-size: 3rem; font-weight: bold; margin-bottom: 1rem; color: #fff; }
        h2 { font-size: 1.5rem; font-weight: bold; margin-top: 2rem; margin-bottom: 1rem; color: #fff; }
        p { margin-bottom: 1rem; color: #b0b0b0; }
        .contact-info { background: #161B22; padding: 2rem; border-radius: 8px; margin: 2rem 0; }
        .contact-item { margin-bottom: 1.5rem; }
        .contact-label { color: #00D4FF; font-weight: 600; }
        .contact-value { color: #e0e0e0; }
        a { color: #00D4FF; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Contact GigitekAI</h1>
        <p>We're here to help. Reach out to discuss your cloud infrastructure, AI automation, or managed IT service needs.</p>
        
        <div class="contact-info">
            <div class="contact-item">
                <div class="contact-label">Phone</div>
                <div class="contact-value"><a href="tel:+17273825776">(727) 382-5776</a></div>
            </div>
            <div class="contact-item">
                <div class="contact-label">Email</div>
                <div class="contact-value"><a href="mailto:support@gigitekai.com">support@gigitekai.com</a></div>
            </div>
            <div class="contact-item">
                <div class="contact-label">Location</div>
                <div class="contact-value">Egg Harbor City, New Jersey, USA</div>
            </div>
            <div class="contact-item">
                <div class="contact-label">Service Area</div>
                <div class="contact-value">United States & Canada</div>
            </div>
        </div>

        <h2>Get in Touch</h2>
        <p>Fill out our contact form on the main website to schedule a consultation or request more information about our services.</p>
        <p><a href="https://gigitekai.com">← Back to GigitekAI</a></p>
    </div>
</body>
</html>`,

  'services.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Services | GigitekAI</title>
    <meta name="description" content="GigitekAI services: Cloud Infrastructure, AI & Machine Learning, Managed IT Services, Cybersecurity, and Data Analytics.">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="https://gigitekai.com/services">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0A0E1A; color: #e0e0e0; line-height: 1.6; }
        .container { max-width: 900px; margin: 0 auto; padding: 2rem; }
        h1 { font-size: 3rem; font-weight: bold; margin-bottom: 1rem; color: #fff; }
        h2 { font-size: 1.5rem; font-weight: bold; margin-top: 2rem; margin-bottom: 1rem; color: #fff; }
        h3 { font-size: 1.2rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #00D4FF; }
        p { margin-bottom: 1rem; color: #b0b0b0; }
        .service { background: #161B22; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem; border-left: 4px solid #00D4FF; }
        ul { margin-left: 2rem; margin-bottom: 1rem; }
        li { margin-bottom: 0.5rem; color: #b0b0b0; }
        a { color: #00D4FF; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Our Services</h1>
        <p>GigitekAI delivers enterprise-grade cloud infrastructure and AI solutions that transform how businesses operate, innovate, and scale.</p>

        <div class="service">
            <h3>Cloud Infrastructure</h3>
            <p>Enterprise-grade cloud infrastructure spanning AWS, Azure, and Google Cloud with 99.9% uptime SLA.</p>
            <ul>
                <li>Multi-cloud architecture design</li>
                <li>Infrastructure as Code (IaC)</li>
                <li>Disaster recovery & business continuity</li>
                <li>Cloud cost optimization</li>
            </ul>
        </div>

        <div class="service">
            <h3>AI & Machine Learning</h3>
            <p>AI workflow automation with multi-system agentic orchestration. Deploy AI agents across 8+ systems in 3.4 seconds.</p>
            <ul>
                <li>LLM integration & fine-tuning</li>
                <li>Copilot Studio automation</li>
                <li>AI agent development</li>
                <li>Prompt engineering & optimization</li>
            </ul>
        </div>

        <div class="service">
            <h3>Managed IT Services</h3>
            <p>24/7 AI-powered helpdesk and managed IT services with SLA guarantees and proactive monitoring.</p>
            <ul>
                <li>Help desk & ticketing</li>
                <li>Proactive monitoring & alerting</li>
                <li>Patch management</li>
                <li>User support & training</li>
            </ul>
        </div>

        <div class="service">
            <h3>Cybersecurity</h3>
            <p>Comprehensive security solutions with compliance-ready infrastructure (HIPAA, SOC 2, PCI-DSS, CMMC).</p>
            <ul>
                <li>Zero Trust architecture</li>
                <li>Threat detection & response</li>
                <li>Compliance auditing</li>
                <li>Security awareness training</li>
            </ul>
        </div>

        <div class="service">
            <h3>Data Analytics</h3>
            <p>Business intelligence and data analytics to drive informed decision-making.</p>
            <ul>
                <li>Data warehouse design</li>
                <li>Business intelligence dashboards</li>
                <li>Predictive analytics</li>
                <li>Data visualization</li>
            </ul>
        </div>

        <p style="margin-top: 2rem;"><a href="https://gigitekai.com">← Back to GigitekAI</a></p>
    </div>
</body>
</html>`,

  'pricing.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pricing | GigitekAI</title>
    <meta name="description" content="GigitekAI pricing plans for cloud infrastructure, managed IT services, and AI automation. Flexible plans for businesses of all sizes.">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="https://gigitekai.com/pricing">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0A0E1A; color: #e0e0e0; line-height: 1.6; }
        .container { max-width: 900px; margin: 0 auto; padding: 2rem; }
        h1 { font-size: 3rem; font-weight: bold; margin-bottom: 1rem; color: #fff; }
        h2 { font-size: 1.5rem; font-weight: bold; margin-top: 2rem; margin-bottom: 1rem; color: #fff; }
        p { margin-bottom: 1rem; color: #b0b0b0; }
        .pricing-card { background: #161B22; padding: 2rem; border-radius: 8px; margin-bottom: 1.5rem; border: 1px solid #00D4FF; }
        .plan-name { font-size: 1.3rem; font-weight: 600; color: #00D4FF; margin-bottom: 0.5rem; }
        .plan-price { font-size: 2rem; font-weight: bold; color: #fff; margin-bottom: 1rem; }
        .plan-description { color: #b0b0b0; margin-bottom: 1rem; }
        ul { margin-left: 2rem; margin-bottom: 1rem; }
        li { margin-bottom: 0.5rem; color: #b0b0b0; }
        a { color: #00D4FF; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Pricing Plans</h1>
        <p>Flexible pricing designed for businesses of all sizes. Custom enterprise plans available.</p>

        <div class="pricing-card">
            <div class="plan-name">Starter</div>
            <div class="plan-price">Custom Quote</div>
            <div class="plan-description">Perfect for small businesses getting started with cloud infrastructure.</div>
            <ul>
                <li>Cloud infrastructure setup</li>
                <li>Basic monitoring & support</li>
                <li>Up to 10 users</li>
                <li>Email support</li>
            </ul>
        </div>

        <div class="pricing-card">
            <div class="plan-name">Professional</div>
            <div class="plan-price">Custom Quote</div>
            <div class="plan-description">For growing businesses needing managed IT and AI automation.</div>
            <ul>
                <li>All Starter features</li>
                <li>24/7 help desk support</li>
                <li>AI agent automation</li>
                <li>Up to 50 users</li>
                <li>Phone & email support</li>
            </ul>
        </div>

        <div class="pricing-card">
            <div class="plan-name">Enterprise</div>
            <div class="plan-price">Custom Quote</div>
            <div class="plan-description">For large organizations with advanced security and compliance needs.</div>
            <ul>
                <li>All Professional features</li>
                <li>Dedicated account manager</li>
                <li>Advanced security & compliance</li>
                <li>Unlimited users</li>
                <li>24/7 priority support</li>
                <li>Custom SLA agreements</li>
            </ul>
        </div>

        <h2>What's Included</h2>
        <ul>
            <li>99.9% uptime SLA</li>
            <li>Multi-cloud support (AWS, Azure, Google Cloud)</li>
            <li>Compliance-ready infrastructure</li>
            <li>Proactive monitoring & alerting</li>
            <li>Regular security audits</li>
        </ul>

        <p style="margin-top: 2rem;">Ready to get started? <a href="https://gigitekai.com/contact">Contact us</a> for a custom quote.</p>
        <p><a href="https://gigitekai.com">← Back to GigitekAI</a></p>
    </div>
</body>
</html>`
};

// Write all pages
let written = 0;
for (const [filename, html] of Object.entries(pages)) {
  const filePath = path.join(publicDir, filename);
  try {
    fs.writeFileSync(filePath, html, 'utf-8');
    console.log(`✅ Pre-rendered: ${filename} (${html.length} bytes)`);
    written++;
  } catch (error) {
    console.error(`❌ Failed to write ${filename}:`, error.message);
  }
}

console.log(`\n✅ Pre-rendered ${written}/${Object.keys(pages).length} pages successfully`);
console.log(`📁 Output directory: ${publicDir}`);
