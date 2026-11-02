#!/usr/bin/env node
/**
 * Pre-render legal pages to static HTML for SEO
 * Generates static HTML files that can be served directly by the server
 * This ensures Google crawlers see full content without JavaScript execution
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Privacy Policy HTML Template
const privacyPolicyHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy | GigitekAI</title>
    <meta name="description" content="GigitekAI Privacy Policy - Learn how we protect your data and privacy.">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="https://gigitekai.com/privacy-policy">
    <meta name="theme-color" content="#0b0b0c">
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="preload" href="/fonts/inter-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
    <style>
        /* Public-site legal page styling (matches client/src/public/site.css) */
        @font-face { font-family: "Inter"; font-style: normal; font-weight: 100 900; font-display: swap; src: url("/fonts/inter-latin-wght-normal.woff2") format("woff2"); }
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; background: #0b0b0c; color: #a1a1a6; line-height: 1.6; font-size: 17px; -webkit-font-smoothing: antialiased; }
        a { color: #5ec8f4; text-decoration: none; } a:hover { color: #8ed9f8; }
        .site-header { position: sticky; top: 0; z-index: 50; background: rgba(11,11,12,0.86); -webkit-backdrop-filter: saturate(180%) blur(16px); backdrop-filter: saturate(180%) blur(16px); border-bottom: 1px solid rgba(255,255,255,0.08); }
        .site-nav { max-width: 1120px; margin: 0 auto; padding: 0 24px; height: 56px; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
        .site-nav img { width: 110px; height: auto; display: block; }
        .site-nav ul { list-style: none; margin: 0; padding: 0; display: flex; gap: 28px; }
        .site-nav ul a { color: #d2d2d7; font-size: 14px; min-height: 44px; display: inline-flex; align-items: center; }
        .site-nav ul a:hover { color: #f5f5f7; }
        .container { max-width: 760px; margin: 0 auto; padding: 96px 24px 112px; }
        h1 { font-size: clamp(36px, 4vw, 52px); font-weight: 600; letter-spacing: -0.025em; line-height: 1.08; margin: 0 0 12px; color: #f5f5f7; }
        h2 { font-size: 24px; font-weight: 600; letter-spacing: -0.015em; margin: 48px 0 12px; color: #f5f5f7; }
        h3 { font-size: 18px; font-weight: 600; margin: 28px 0 10px; color: #f5f5f7; }
        p { margin: 0 0 16px; }
        ul, ol { margin: 0 0 16px 24px; padding: 0; }
        li { margin-bottom: 8px; }
        .meta { color: #86868b; font-size: 15px; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.12); }
        section { margin-bottom: 8px; }
        .site-footer { border-top: 1px solid rgba(255,255,255,0.12); padding: 40px 24px; }
        .site-footer div { max-width: 1120px; margin: 0 auto; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px 24px; font-size: 12px; color: #86868b; }
        .site-footer a { color: #86868b; margin-right: 20px; } .site-footer a:hover { color: #f5f5f7; }
        @media (max-width: 640px) { .site-nav ul { gap: 18px; } .container { padding: 64px 20px 80px; } }
    </style>
</head>
<body>
    <header class="site-header">
        <nav class="site-nav" aria-label="Main">
            <a href="/" aria-label="GigitekAI home"><img src="/gigitekai-wordmark.png" alt="GigitekAI" width="490" height="124"></a>
            <ul>
                <li><a href="/services">Services</a></li>
                <li><a href="/about">About</a></li>
                <li><a href="/contact">Contact</a></li>
            </ul>
        </nav>
    </header>
    <main class="container">
        <div class="mb-12">
            <h1>Privacy Policy</h1>
            <p class="meta">Last updated: April 2026</p>
        </div>

        <section>
            <h2>1. Introduction</h2>
            <p>GigitekAI LLC ("Company," "we," "us," or "our") operates the website gigitekai.com (the "Website") and provides cloud infrastructure, AI implementation, managed IT services, and related solutions (collectively, the "Services"). We are committed to protecting your privacy and ensuring you have a positive experience on our Website and when using our Services.</p>
            <p>This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our Website and use our Services. Please read this Privacy Policy carefully. If you do not agree with our policies and practices, please do not use our Website or Services.</p>
        </section>

        <section>
            <h2>2. Information We Collect</h2>
            <h3>2.1 Information You Provide Directly</h3>
            <p>We collect information you voluntarily provide when you:</p>
            <ul>
                <li>Complete contact forms on our Website</li>
                <li>Request a consultation or assessment</li>
                <li>Subscribe to our newsletter or mailing list</li>
                <li>Use our Services or interact with our support team</li>
                <li>Provide feedback or participate in surveys</li>
            </ul>
            <p>This information may include:</p>
            <ul>
                <li>Name, email address, phone number, company name</li>
                <li>Job title, industry, company size</li>
                <li>Details about your business needs and challenges</li>
                <li>Any other information you choose to provide</li>
            </ul>

            <h3>2.2 Information Collected Automatically</h3>
            <p>When you visit our Website, we automatically collect certain information about your device and browsing behavior, including:</p>
            <ul>
                <li>IP address and geolocation data</li>
                <li>Browser type, operating system, and device type</li>
                <li>Pages visited, time spent on each page, and referral source</li>
                <li>Clickstream data and interaction patterns</li>
                <li>Cookies and similar tracking technologies</li>
            </ul>

            <h3>2.3 Information from Third Parties</h3>
            <p>We may receive information about you from:</p>
            <ul>
                <li>Business partners and vendors</li>
                <li>Public databases and data providers</li>
                <li>Social media platforms (if you connect your account)</li>
                <li>Third-party analytics providers</li>
            </ul>
        </section>

        <section>
            <h2>3. How We Use Your Information</h2>
            <p>We use the information we collect for various purposes, including:</p>
            <ul>
                <li>Providing and improving our Services</li>
                <li>Responding to your inquiries and requests</li>
                <li>Sending marketing communications and promotional materials</li>
                <li>Analyzing Website usage and performance</li>
                <li>Personalizing your experience</li>
                <li>Complying with legal obligations</li>
                <li>Detecting and preventing fraud or security issues</li>
                <li>Conducting research and analytics</li>
            </ul>
        </section>

        <section>
            <h2>4. Information Sharing and Disclosure</h2>
            <p>We may share your information in the following circumstances:</p>
            <ul>
                <li><strong>Service Providers:</strong> We share information with third-party vendors who assist in operating our Website and providing Services (e.g., cloud hosting, email services, analytics).</li>
                <li><strong>Business Partners:</strong> With your consent, we may share information with partners who offer complementary services.</li>
                <li><strong>Legal Requirements:</strong> We may disclose information if required by law or in response to legal requests.</li>
                <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</li>
                <li><strong>Aggregate Data:</strong> We may share anonymized, aggregated data for marketing and research purposes.</li>
            </ul>
        </section>

        <section>
            <h2>5. Data Security</h2>
            <p>We implement industry-standard security measures to protect your information, including:</p>
            <ul>
                <li>Encryption of data in transit (HTTPS/TLS)</li>
                <li>Secure data storage and access controls</li>
                <li>Regular security audits and penetration testing</li>
                <li>Employee training on data protection</li>
                <li>Incident response procedures</li>
            </ul>
            <p>However, no security system is completely impenetrable. We cannot guarantee absolute security of your information.</p>
        </section>

        <section>
            <h2>6. Your Privacy Rights</h2>
            <p>Depending on your location, you may have the following rights:</p>
            <ul>
                <li><strong>Access:</strong> Request access to the personal information we hold about you.</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information.</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal obligations).</li>
                <li><strong>Opt-Out:</strong> Opt out of marketing communications or data processing.</li>
                <li><strong>Data Portability:</strong> Request a copy of your information in a portable format.</li>
            </ul>
            <p>To exercise any of these rights, please contact us at <a href="mailto:privacy@gigitekai.com">privacy@gigitekai.com</a>.</p>
        </section>

        <section>
            <h2>7. Cookies and Tracking Technologies</h2>
            <p>We use cookies and similar technologies to enhance your experience and analyze Website usage. You can control cookie preferences through your browser settings. Some cookies are essential for Website functionality, while others are used for analytics and marketing.</p>
        </section>

        <section>
            <h2>8. Third-Party Links</h2>
            <p>Our Website may contain links to third-party websites. We are not responsible for the privacy practices of external sites. Please review their privacy policies before providing any information.</p>
        </section>

        <section>
            <h2>9. Children's Privacy</h2>
            <p>Our Services are not intended for children under 13 years of age. We do not knowingly collect information from children. If we become aware of such collection, we will delete the information promptly.</p>
        </section>

        <section>
            <h2>10. International Data Transfers</h2>
            <p>Your information may be transferred to, stored in, and processed in countries other than your country of residence. These countries may have data protection laws different from your home country. By using our Services, you consent to such transfers.</p>
        </section>

        <section>
            <h2>11. Policy Updates</h2>
            <p>We may update this Privacy Policy periodically. Changes will be effective immediately upon posting to the Website. Your continued use of our Services constitutes acceptance of the updated policy.</p>
        </section>

        <section>
            <h2>12. Contact Us</h2>
            <p>If you have questions about this Privacy Policy or our privacy practices, please contact us:</p>
            <ul>
                <li><strong>Email:</strong> <a href="mailto:privacy@gigitekai.com">privacy@gigitekai.com</a></li>
                <li><strong>Phone:</strong> <a href="tel:+16096764483">609-676-4483</a></li>
                <li><strong>Address:</strong> GigitekAI LLC, Egg Harbor City, NJ 08215</li>
            </ul>
        </section>
    </main>
    <footer class="site-footer">
        <div>
            <span>&copy; 2026 GigitekAI LLC. All rights reserved.</span>
            <span><a href="/privacy-policy">Privacy Policy</a><a href="/terms-of-service">Terms of Service</a><a href="/contact">Contact</a></span>
        </div>
    </footer>
</body>
</html>`;

// Terms of Service HTML Template
const termsOfServiceHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Terms of Service | GigitekAI</title>
    <meta name="description" content="GigitekAI Terms of Service - Read our terms and conditions for using our services.">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="https://gigitekai.com/terms-of-service">
    <meta name="theme-color" content="#0b0b0c">
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="preload" href="/fonts/inter-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
    <style>
        /* Public-site legal page styling (matches client/src/public/site.css) */
        @font-face { font-family: "Inter"; font-style: normal; font-weight: 100 900; font-display: swap; src: url("/fonts/inter-latin-wght-normal.woff2") format("woff2"); }
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; background: #0b0b0c; color: #a1a1a6; line-height: 1.6; font-size: 17px; -webkit-font-smoothing: antialiased; }
        a { color: #5ec8f4; text-decoration: none; } a:hover { color: #8ed9f8; }
        .site-header { position: sticky; top: 0; z-index: 50; background: rgba(11,11,12,0.86); -webkit-backdrop-filter: saturate(180%) blur(16px); backdrop-filter: saturate(180%) blur(16px); border-bottom: 1px solid rgba(255,255,255,0.08); }
        .site-nav { max-width: 1120px; margin: 0 auto; padding: 0 24px; height: 56px; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
        .site-nav img { width: 110px; height: auto; display: block; }
        .site-nav ul { list-style: none; margin: 0; padding: 0; display: flex; gap: 28px; }
        .site-nav ul a { color: #d2d2d7; font-size: 14px; min-height: 44px; display: inline-flex; align-items: center; }
        .site-nav ul a:hover { color: #f5f5f7; }
        .container { max-width: 760px; margin: 0 auto; padding: 96px 24px 112px; }
        h1 { font-size: clamp(36px, 4vw, 52px); font-weight: 600; letter-spacing: -0.025em; line-height: 1.08; margin: 0 0 12px; color: #f5f5f7; }
        h2 { font-size: 24px; font-weight: 600; letter-spacing: -0.015em; margin: 48px 0 12px; color: #f5f5f7; }
        h3 { font-size: 18px; font-weight: 600; margin: 28px 0 10px; color: #f5f5f7; }
        p { margin: 0 0 16px; }
        ul, ol { margin: 0 0 16px 24px; padding: 0; }
        li { margin-bottom: 8px; }
        .meta { color: #86868b; font-size: 15px; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.12); }
        section { margin-bottom: 8px; }
        .site-footer { border-top: 1px solid rgba(255,255,255,0.12); padding: 40px 24px; }
        .site-footer div { max-width: 1120px; margin: 0 auto; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px 24px; font-size: 12px; color: #86868b; }
        .site-footer a { color: #86868b; margin-right: 20px; } .site-footer a:hover { color: #f5f5f7; }
        @media (max-width: 640px) { .site-nav ul { gap: 18px; } .container { padding: 64px 20px 80px; } }
    </style>
</head>
<body>
    <header class="site-header">
        <nav class="site-nav" aria-label="Main">
            <a href="/" aria-label="GigitekAI home"><img src="/gigitekai-wordmark.png" alt="GigitekAI" width="490" height="124"></a>
            <ul>
                <li><a href="/services">Services</a></li>
                <li><a href="/about">About</a></li>
                <li><a href="/contact">Contact</a></li>
            </ul>
        </nav>
    </header>
    <main class="container">
        <div class="mb-12">
            <h1>Terms of Service</h1>
            <p class="meta">Last updated: April 2026</p>
        </div>

        <section>
            <h2>1. Agreement to Terms</h2>
            <p>By accessing and using the GigitekAI website (gigitekai.com) and services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
        </section>

        <section>
            <h2>2. Use License</h2>
            <p>Permission is granted to temporarily download one copy of the materials (information or software) on GigitekAI's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
            <ul>
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose or for any public display</li>
                <li>Attempt to decompile or reverse engineer any software contained on GigitekAI's website</li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
                <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
                <li>Use the materials for any illegal purpose or in violation of any applicable laws or regulations</li>
            </ul>
        </section>

        <section>
            <h2>3. Disclaimer</h2>
            <p>The materials on GigitekAI's website are provided on an 'as is' basis. GigitekAI makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
        </section>

        <section>
            <h2>4. Limitations</h2>
            <p>In no event shall GigitekAI or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on GigitekAI's website, even if GigitekAI or an authorized representative has been notified orally or in writing of the possibility of such damage.</p>
        </section>

        <section>
            <h2>5. Accuracy of Materials</h2>
            <p>The materials appearing on GigitekAI's website could include technical, typographical, or photographic errors. GigitekAI does not warrant that any of the materials on its website are accurate, complete, or current. GigitekAI may make changes to the materials contained on its website at any time without notice.</p>
        </section>

        <section>
            <h2>6. Materials and Content</h2>
            <p>GigitekAI has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by GigitekAI of the site. Use of any such linked website is at the user's own risk.</p>
        </section>

        <section>
            <h2>7. Modifications</h2>
            <p>GigitekAI may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.</p>
        </section>

        <section>
            <h2>8. Governing Law</h2>
            <p>These terms and conditions are governed by and construed in accordance with the laws of the State of New Jersey, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.</p>
        </section>

        <section>
            <h2>9. Intellectual Property Rights</h2>
            <p>All content on the GigitekAI website, including but not limited to text, graphics, logos, images, audio clips, and software, is the property of GigitekAI or its content suppliers and is protected by international copyright laws. You may not reproduce, distribute, transmit, or display any content without the prior written permission of GigitekAI.</p>
        </section>

        <section>
            <h2>10. User Conduct</h2>
            <p>You agree not to use the GigitekAI website for any unlawful purposes or in any way that could damage, disable, or impair the website. Prohibited behavior includes:</p>
            <ul>
                <li>Harassment or causing distress or inconvenience to any person</li>
                <li>Transmitting obscene or offensive content</li>
                <li>Disrupting the normal flow of dialogue within our website</li>
                <li>Attempting to gain unauthorized access to our systems</li>
                <li>Engaging in any form of spam or phishing</li>
            </ul>
        </section>

        <section>
            <h2>11. Limitation of Liability</h2>
            <p>In no event shall GigitekAI, its directors, employees, or agents be liable to you for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the website or services, even if GigitekAI has been advised of the possibility of such damages.</p>
        </section>

        <section>
            <h2>12. Indemnification</h2>
            <p>You agree to indemnify and hold harmless GigitekAI and its officers, directors, employees, and agents from any claim, demand, loss, liability, or expense (including attorneys' fees) arising from or related to your use of the website or violation of these terms of service.</p>
        </section>

        <section>
            <h2>13. Severability</h2>
            <p>If any provision of these terms of service is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.</p>
        </section>

        <section>
            <h2>14. Contact Information</h2>
            <p>If you have any questions about these Terms of Service, please contact us:</p>
            <ul>
                <li><strong>Email:</strong> <a href="mailto:legal@gigitekai.com">legal@gigitekai.com</a></li>
                <li><strong>Phone:</strong> <a href="tel:+16096764483">609-676-4483</a></li>
                <li><strong>Address:</strong> GigitekAI LLC, Egg Harbor City, NJ 08215</li>
            </ul>
        </section>
    </main>
    <footer class="site-footer">
        <div>
            <span>&copy; 2026 GigitekAI LLC. All rights reserved.</span>
            <span><a href="/privacy-policy">Privacy Policy</a><a href="/terms-of-service">Terms of Service</a><a href="/contact">Contact</a></span>
        </div>
    </footer>
</body>
</html>`;

async function generateStaticPages() {
  try {
    console.log('🔄 Generating static HTML for legal pages...');

    // Create public directory if it doesn't exist
    const publicDir = path.join(projectRoot, 'client', 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Write Privacy Policy
    const privacyPath = path.join(publicDir, 'privacy-policy.html');
    fs.writeFileSync(privacyPath, privacyPolicyHTML, 'utf-8');
    console.log(`✅ Generated: ${privacyPath}`);

    // Write Terms of Service
    const termsPath = path.join(publicDir, 'terms-of-service.html');
    fs.writeFileSync(termsPath, termsOfServiceHTML, 'utf-8');
    console.log(`✅ Generated: ${termsPath}`);

    console.log('\n✨ Static legal pages generated successfully!');
    console.log('📊 These will be served as static files (fastest possible)');
    console.log('🔍 Google crawlers will see full content immediately');
    console.log('\n📝 Next steps:');
    console.log('1. Update server to serve these static files');
    console.log('2. Add redirects from React routes to static files');
    console.log('3. Test with: curl -s https://gigitekai.com/privacy-policy | head -50');

    return true;
  } catch (error) {
    console.error('❌ Error generating static pages:', error.message);
    return false;
  }
}

generateStaticPages().then(success => {
  process.exit(success ? 0 : 1);
});
