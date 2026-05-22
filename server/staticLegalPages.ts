/**
 * Static HTML routes for legal pages.
 * These routes serve full HTML content server-side so crawlers and raw HTTP
 * fetches see complete content without needing JavaScript.
 */

import { Router } from "express";

const router = Router();

const COMMON_HEAD = `
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="index, follow" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #0A0E1A; color: #e2e8f0; line-height: 1.7; }
    .site-header { background: #0A0E1A; border-bottom: 1px solid #1e2a3a; padding: 1rem 2rem; display: flex; align-items: center; justify-content: space-between; }
    .site-header a.logo { color: #00D4FF; font-size: 1.4rem; font-weight: 700; text-decoration: none; }
    .site-header nav a { color: #94a3b8; text-decoration: none; margin-left: 1.5rem; font-size: 0.9rem; }
    .site-header nav a:hover { color: #00D4FF; }
    .container { max-width: 860px; margin: 0 auto; padding: 3rem 1.5rem; }
    h1 { font-size: 2.5rem; font-weight: 700; color: #fff; margin-bottom: 0.5rem; }
    .subtitle { color: #64748b; margin-bottom: 3rem; font-size: 0.95rem; }
    h2 { font-size: 1.4rem; font-weight: 600; color: #00D4FF; margin: 2.5rem 0 0.75rem; }
    h3 { font-size: 1.1rem; font-weight: 600; color: #cbd5e1; margin: 1.5rem 0 0.5rem; }
    p { color: #94a3b8; margin-bottom: 1rem; }
    ul { color: #94a3b8; padding-left: 1.5rem; margin-bottom: 1rem; }
    ul li { margin-bottom: 0.4rem; }
    .contact-box { background: #141B2D; border: 1px solid #1e2a3a; border-radius: 8px; padding: 1.5rem; margin: 1rem 0; }
    .contact-box p { margin-bottom: 0.5rem; }
    .contact-box a { color: #00D4FF; text-decoration: none; }
    .site-footer { background: #060912; border-top: 1px solid #1e2a3a; padding: 2rem; text-align: center; color: #475569; font-size: 0.875rem; margin-top: 4rem; }
    .site-footer a { color: #00D4FF; text-decoration: none; margin: 0 0.75rem; }
    @media (max-width: 600px) { h1 { font-size: 1.8rem; } .container { padding: 2rem 1rem; } }
  </style>
`;

const SITE_HEADER = `
  <header class="site-header">
    <a href="/" class="logo">GigitekAI</a>
    <nav>
      <a href="/">Home</a>
      <a href="/services">Services</a>
      <a href="/contact">Contact</a>
    </nav>
  </header>
`;

const SITE_FOOTER = `
  <footer class="site-footer">
    <p>
      <a href="/privacy-policy">Privacy Policy</a>
      <a href="/terms-of-service">Terms of Service</a>
      <a href="/contact">Contact</a>
    </p>
    <p style="margin-top:0.75rem;">
      &copy; ${new Date().getFullYear()} GigitekAI LLC &mdash; Tampa, FL &mdash;
      <a href="tel:+1727-382-6909">(727) 382-6909</a> &mdash;
      <a href="mailto:support@gigitekai.com">support@gigitekai.com</a>
    </p>
  </footer>
`;

router.get("/privacy-policy", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=86400"); // 1 day
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <title>Privacy Policy — GigitekAI</title>
  <meta name="description" content="GigitekAI Privacy Policy — How we collect, use, and protect your personal information." />
  <link rel="canonical" href="https://gigitekai.com/privacy-policy" />
  ${COMMON_HEAD}
</head>
<body>
  ${SITE_HEADER}
  <div class="container">
    <h1>Privacy Policy</h1>
    <p class="subtitle">Last updated: April 2026</p>

    <h2>1. Introduction</h2>
    <p>GigitekAI LLC ("Company," "we," "us," or "our") operates the website gigitekai.com (the "Website") and provides cloud infrastructure, AI implementation, managed IT services, and related solutions (collectively, the "Services"). We are committed to protecting your privacy and ensuring you have a positive experience on our Website and when using our Services.</p>
    <p>This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our Website and use our Services. Please read this Privacy Policy carefully. If you do not agree with our policies and practices, please do not use our Website or Services.</p>

    <h2>2. Information We Collect</h2>
    <h3>2.1 Information You Provide Directly</h3>
    <p>We collect information you voluntarily provide when you:</p>
    <ul>
      <li>Complete contact forms on our Website</li>
      <li>Request a consultation or assessment</li>
      <li>Subscribe to our newsletter or email communications</li>
      <li>Create an account or log in to our Services</li>
      <li>Communicate with us via email, phone, or chat</li>
      <li>Submit support tickets or requests</li>
    </ul>
    <p>This information may include your name, email address, phone number, company name, job title, industry, and any other information you choose to provide.</p>

    <h3>2.2 Information Collected Automatically</h3>
    <p>When you visit our Website, we automatically collect certain information about your device and browsing activity:</p>
    <ul>
      <li>IP address and device identifiers</li>
      <li>Browser type and version</li>
      <li>Operating system</li>
      <li>Pages visited and time spent on each page</li>
      <li>Referral source and links clicked</li>
      <li>Cookies and similar tracking technologies</li>
    </ul>

    <h3>2.3 Information from Third Parties</h3>
    <p>We may receive information about you from third-party sources, including business partners, marketing partners, and publicly available sources, which we may combine with other information we collect about you.</p>

    <h2>3. How We Use Your Information</h2>
    <p>We use the information we collect for the following purposes:</p>
    <ul>
      <li>Providing, maintaining, and improving our Services</li>
      <li>Processing your requests and responding to inquiries</li>
      <li>Sending you marketing communications and promotional materials (with your consent)</li>
      <li>Conducting analytics and understanding how you use our Website</li>
      <li>Personalizing your experience on our Website</li>
      <li>Detecting and preventing fraud, abuse, and security incidents</li>
      <li>Complying with legal obligations and enforcing our agreements</li>
      <li>Conducting business operations, including billing and account management</li>
    </ul>

    <h2>4. Data Sharing and Disclosure</h2>
    <h3>4.1 Service Providers</h3>
    <p>We may share your information with third-party service providers who assist us in operating our Website and providing our Services, including cloud infrastructure providers, payment processors, email service providers, and analytics platforms. These service providers are contractually obligated to use your information only as necessary to provide services to us.</p>

    <h3>4.2 Business Partners</h3>
    <p>We may share information with our business partners, vendors, and resellers who help us deliver our Services. These partners are bound by confidentiality agreements and are prohibited from using your information for any purpose other than providing services to us.</p>

    <h3>4.3 Legal Requirements</h3>
    <p>We may disclose your information when required by law or when we believe in good faith that disclosure is necessary to:</p>
    <ul>
      <li>Comply with applicable laws, regulations, or legal processes</li>
      <li>Enforce our Terms of Service and other agreements</li>
      <li>Protect the security or integrity of our Website and Services</li>
      <li>Protect the rights, privacy, safety, or property of GigitekAI, our users, or the public</li>
    </ul>

    <h3>4.4 Business Transfers</h3>
    <p>In the event of a merger, acquisition, bankruptcy, or sale of assets, your information may be transferred as part of that transaction. We will provide notice before your information becomes subject to a different privacy policy.</p>

    <h2>5. Data Security</h2>
    <p>We implement comprehensive technical, administrative, and physical security measures to protect your information against unauthorized access, alteration, disclosure, or destruction. These measures include:</p>
    <ul>
      <li>Encryption of data in transit and at rest using industry-standard protocols</li>
      <li>Secure authentication mechanisms and access controls</li>
      <li>Regular security audits and vulnerability assessments</li>
      <li>Employee training on data protection and privacy practices</li>
      <li>Incident response procedures for potential data breaches</li>
    </ul>
    <p>However, no method of transmission over the Internet or electronic storage is completely secure. While we strive to protect your information, we cannot guarantee absolute security.</p>

    <h2>6. Cookies and Tracking Technologies</h2>
    <p>We use cookies, web beacons, and similar tracking technologies to enhance your experience on our Website and to collect information about your browsing behavior. You can control cookie settings through your browser. Most browsers allow you to refuse cookies or alert you when cookies are being sent. However, blocking cookies may affect the functionality of our Website.</p>

    <h2>7. Your Privacy Rights</h2>
    <h3>7.1 CCPA Rights (California Residents)</h3>
    <p>If you are a California resident, you have the following rights under the California Consumer Privacy Act (CCPA): right to know, right to delete, right to opt-out of sale, and right to non-discrimination.</p>

    <h3>7.2 GDPR Rights (EU Residents)</h3>
    <p>If you are located in the European Union or United Kingdom, you have rights under GDPR including: right to access, rectification, erasure, restrict processing, data portability, and to object to processing.</p>

    <h3>7.3 How to Exercise Your Rights</h3>
    <p>To exercise any of these rights, please contact us at <a href="mailto:support@gigitekai.com">support@gigitekai.com</a> or call <a href="tel:+1727-382-6909">(727) 382-6909</a>. We will respond within 30 days.</p>

    <h2>8. Data Retention</h2>
    <p>We retain your personal information for as long as necessary to provide our Services, comply with legal obligations, resolve disputes, and enforce our agreements. When information is no longer needed, we securely delete or anonymize it.</p>

    <h2>9. Third-Party Links and Services</h2>
    <p>Our Website may contain links to third-party websites, applications, and services that are not operated by GigitekAI. This Privacy Policy does not apply to third-party services, and we are not responsible for their privacy practices.</p>

    <h2>10. SMS Communications</h2>
    <p>If you opt in to receive SMS text messages from GigitekAI, we will send you service updates, promotional offers, and support information. You can opt out at any time by replying "STOP" to any text message. Standard message and data rates apply.</p>

    <h2>11. Children's Privacy</h2>
    <p>Our Website and Services are not intended for children under the age of 13. We do not knowingly collect personal information from children under 13.</p>

    <h2>12. International Data Transfers</h2>
    <p>GigitekAI is based in the United States. Your information may be transferred to, stored in, and processed in the United States or other countries where we or our service providers operate.</p>

    <h2>13. Contact Us</h2>
    <div class="contact-box">
      <p><strong>GigitekAI LLC</strong></p>
      <p>Email: <a href="mailto:support@gigitekai.com">support@gigitekai.com</a></p>
      <p>Phone: <a href="tel:+1727-382-6909">(727) 382-6909</a></p>
      <p>Website: <a href="https://gigitekai.com">https://gigitekai.com</a></p>
      <p>Tampa, FL — United States</p>
    </div>
  </div>
  ${SITE_FOOTER}
</body>
</html>`);
});

router.get("/terms-of-service", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=86400"); // 1 day
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <title>Terms of Service — GigitekAI</title>
  <meta name="description" content="GigitekAI Terms of Service — The terms and conditions governing your use of our website and services." />
  <link rel="canonical" href="https://gigitekai.com/terms-of-service" />
  ${COMMON_HEAD}
</head>
<body>
  ${SITE_HEADER}
  <div class="container">
    <h1>Terms of Service</h1>
    <p class="subtitle">Last updated: April 2026</p>

    <h2>1. Acceptance of Terms</h2>
    <p>By accessing or using the GigitekAI website (gigitekai.com) or any of our services, you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Website or Services. GigitekAI LLC ("Company," "we," "us," or "our") reserves the right to update these Terms at any time.</p>

    <h2>2. Description of Services</h2>
    <p>GigitekAI provides AI-first managed IT services, including but not limited to:</p>
    <ul>
      <li>Microsoft 365 architecture, deployment, and optimization</li>
      <li>AI workflow automation and LLM integration</li>
      <li>Managed IT services and 24/7 helpdesk support</li>
      <li>Cybersecurity solutions (Zero Trust, SIEM, endpoint protection)</li>
      <li>Cloud infrastructure management (AWS, Azure, Google Cloud)</li>
      <li>IT consulting and strategic advisory services</li>
    </ul>

    <h2>3. Use of Website</h2>
    <p>You agree to use our Website only for lawful purposes and in a manner that does not infringe the rights of others. You must not:</p>
    <ul>
      <li>Use the Website in any way that violates applicable laws or regulations</li>
      <li>Transmit any unsolicited or unauthorized advertising or promotional material</li>
      <li>Attempt to gain unauthorized access to any part of the Website or its systems</li>
      <li>Engage in any conduct that restricts or inhibits anyone's use of the Website</li>
      <li>Use automated tools to scrape or harvest data from our Website</li>
    </ul>

    <h2>4. Intellectual Property</h2>
    <p>All content on the GigitekAI website, including text, graphics, logos, images, and software, is the property of GigitekAI LLC and is protected by applicable intellectual property laws. You may not reproduce, distribute, modify, or create derivative works without our prior written consent.</p>

    <h2>5. Service Agreements</h2>
    <p>Use of GigitekAI's managed services is governed by separate Service Level Agreements (SLAs) and Master Service Agreements (MSAs) entered into between GigitekAI and each client. These Terms govern general use of our Website and do not supersede any executed service agreements.</p>

    <h2>6. Privacy</h2>
    <p>Your use of our Website is also governed by our <a href="/privacy-policy">Privacy Policy</a>, which is incorporated into these Terms by reference. Please review our Privacy Policy to understand our practices.</p>

    <h2>7. Disclaimers</h2>
    <p>THE WEBSITE AND ITS CONTENT ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. GIGITEKAI DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</p>
    <p>We do not warrant that the Website will be uninterrupted, error-free, or free of viruses or other harmful components. We do not warrant the accuracy, completeness, or usefulness of any information on the Website.</p>

    <h2>8. Limitation of Liability</h2>
    <p>TO THE FULLEST EXTENT PERMITTED BY LAW, GIGITEKAI LLC SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE WEBSITE OR SERVICES, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</p>
    <p>Our total liability to you for any claims arising from these Terms or your use of the Website shall not exceed the amount you paid to us in the twelve (12) months preceding the claim.</p>

    <h2>9. Indemnification</h2>
    <p>You agree to indemnify, defend, and hold harmless GigitekAI LLC, its officers, directors, employees, agents, and partners from and against any claims, liabilities, damages, losses, costs, and expenses (including reasonable attorneys' fees) arising out of or related to your use of the Website or violation of these Terms.</p>

    <h2>10. Third-Party Links</h2>
    <p>Our Website may contain links to third-party websites. These links are provided for your convenience only. GigitekAI has no control over the content of those websites and accepts no responsibility for them or for any loss or damage that may arise from your use of them.</p>

    <h2>11. Governing Law</h2>
    <p>These Terms shall be governed by and construed in accordance with the laws of the State of Florida, United States, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts located in Hillsborough County, Florida.</p>

    <h2>12. Changes to Terms</h2>
    <p>We reserve the right to modify these Terms at any time. We will notify you of significant changes by posting the new Terms on this page with an updated date. Your continued use of the Website after any changes constitutes your acceptance of the new Terms.</p>

    <h2>13. Contact Us</h2>
    <div class="contact-box">
      <p><strong>GigitekAI LLC</strong></p>
      <p>Email: <a href="mailto:support@gigitekai.com">support@gigitekai.com</a></p>
      <p>Phone: <a href="tel:+1727-382-6909">(727) 382-6909</a></p>
      <p>Website: <a href="https://gigitekai.com">https://gigitekai.com</a></p>
      <p>Tampa, FL — United States</p>
    </div>
  </div>
  ${SITE_FOOTER}
</body>
</html>`);
});

export default router;
