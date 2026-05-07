import ScrollToTop from "@/components/ScrollToTop";
import React from 'react';
import Navbar from '@/components/SiteNavBar2024';
import Footer from '@/components/Footer';
import { useSEO } from "@/hooks/useSEO";
import { SEO_CONFIG } from "@/lib/seoConfig";

export default function PrivacyPolicy() {
  useSEO({ ...SEO_CONFIG["/privacy-policy"], path: "/privacy-policy" });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#0A0E1A]">
      <Navbar />
      <main className="flex-1">
        <div className="container py-16 max-w-4xl">
          <div className="mb-12">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Privacy Policy
            </h1>
            <p className="text-gray-400 dark:text-gray-400">
              Last updated: April 2026
            </p>
          </div>

          <div className="prose prose-invert max-w-none">
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                1. Introduction
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                GigitekAI LLC ("Company," "we," "us," or "our") operates the website gigitekai.com (the "Website") and provides cloud infrastructure, AI implementation, managed IT services, and related solutions (collectively, the "Services"). We are committed to protecting your privacy and ensuring you have a positive experience on our Website and when using our Services.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our Website and use our Services. Please read this Privacy Policy carefully. If you do not agree with our policies and practices, please do not use our Website or Services.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                2. Information We Collect
              </h2>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                2.1 Information You Provide Directly
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We collect information you voluntarily provide when you:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4">
                <li>Complete contact forms on our Website</li>
                <li>Request a consultation or assessment</li>
                <li>Subscribe to our newsletter or email communications</li>
                <li>Create an account or log in to our Services</li>
                <li>Communicate with us via email, phone, or chat</li>
                <li>Submit support tickets or requests</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                This information may include your name, email address, phone number, company name, job title, industry, and any other information you choose to provide.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                2.2 Information Collected Automatically
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                When you visit our Website, we automatically collect certain information about your device and browsing activity:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4">
                <li>IP address and device identifiers</li>
                <li>Browser type and version</li>
                <li>Operating system</li>
                <li>Pages visited and time spent on each page</li>
                <li>Referral source and links clicked</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                2.3 Information from Third Parties
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                We may receive information about you from third-party sources, including business partners, marketing partners, and publicly available sources, which we may combine with other information we collect about you.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                3. How We Use Your Information
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We use the information we collect for the following purposes:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4">
                <li>Providing, maintaining, and improving our Services</li>
                <li>Processing your requests and responding to inquiries</li>
                <li>Sending you marketing communications and promotional materials (with your consent)</li>
                <li>Conducting analytics and understanding how you use our Website</li>
                <li>Personalizing your experience on our Website</li>
                <li>Detecting and preventing fraud, abuse, and security incidents</li>
                <li>Complying with legal obligations and enforcing our agreements</li>
                <li>Conducting business operations, including billing and account management</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                4. Data Sharing and Disclosure
              </h2>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                4.1 Service Providers
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We may share your information with third-party service providers who assist us in operating our Website and providing our Services, including cloud infrastructure providers, payment processors, email service providers, and analytics platforms. These service providers are contractually obligated to use your information only as necessary to provide services to us.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                4.2 Business Partners
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We may share information with our business partners, vendors, and resellers who help us deliver our Services. These partners are bound by confidentiality agreements and are prohibited from using your information for any purpose other than providing services to us.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                4.3 Legal Requirements
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We may disclose your information when required by law or when we believe in good faith that disclosure is necessary to:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4">
                <li>Comply with applicable laws, regulations, or legal processes</li>
                <li>Enforce our Terms of Service and other agreements</li>
                <li>Protect the security or integrity of our Website and Services</li>
                <li>Protect the rights, privacy, safety, or property of GigitekAI, our users, or the public</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                4.4 Business Transfers
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                In the event of a merger, acquisition, bankruptcy, or sale of assets, your information may be transferred as part of that transaction. We will provide notice before your information becomes subject to a different privacy policy.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                5. Data Security
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We implement comprehensive technical, administrative, and physical security measures to protect your information against unauthorized access, alteration, disclosure, or destruction. These measures include:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4">
                <li>Encryption of data in transit and at rest using industry-standard protocols</li>
                <li>Secure authentication mechanisms and access controls</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Employee training on data protection and privacy practices</li>
                <li>Incident response procedures for potential data breaches</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300">
                However, no method of transmission over the Internet or electronic storage is completely secure. While we strive to protect your information, we cannot guarantee absolute security. You acknowledge the inherent risks of transmitting information online.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                6. Cookies and Tracking Technologies
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We use cookies, web beacons, and similar tracking technologies to enhance your experience on our Website and to collect information about your browsing behavior. These technologies allow us to:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4">
                <li>Remember your preferences and settings</li>
                <li>Understand how you interact with our Website</li>
                <li>Deliver personalized content and advertisements</li>
                <li>Analyze Website performance and user behavior</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You can control cookie settings through your browser. Most browsers allow you to refuse cookies or alert you when cookies are being sent. However, blocking cookies may affect the functionality of our Website.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                7. Your Privacy Rights
              </h2>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                7.1 CCPA Rights (California Residents)
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you are a California resident, you have the following rights under the California Consumer Privacy Act (CCPA):
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4">
                <li>Right to know what personal information is collected, used, shared, or sold</li>
                <li>Right to delete personal information collected from you</li>
                <li>Right to opt-out of the sale or sharing of your personal information</li>
                <li>Right to non-discrimination for exercising your CCPA rights</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                7.2 GDPR Rights (EU Residents)
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you are located in the European Union or United Kingdom, you have the following rights under the General Data Protection Regulation (GDPR):
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4">
                <li>Right to access your personal data</li>
                <li>Right to rectification of inaccurate data</li>
                <li>Right to erasure (right to be forgotten)</li>
                <li>Right to restrict processing</li>
                <li>Right to data portability</li>
                <li>Right to object to processing</li>
                <li>Rights related to automated decision-making and profiling</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                7.3 How to Exercise Your Rights
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                To exercise any of these rights, please contact us at support@gigitekai.com or call (727) 382-5776. We will respond to your request within 30 days or as required by applicable law.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                8. Data Retention
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We retain your personal information for as long as necessary to provide our Services, comply with legal obligations, resolve disputes, and enforce our agreements. The retention period may vary depending on the context of the processing and our legal obligations.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                When information is no longer needed, we securely delete or anonymize it. If deletion is not possible, we will securely store your information and isolate it from any further processing.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                9. Third-Party Links and Services
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Our Website may contain links to third-party websites, applications, and services that are not operated by GigitekAI. This Privacy Policy does not apply to third-party services, and we are not responsible for their privacy practices. We encourage you to review the privacy policies of any third-party services before providing your information.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                10. SMS Communications and Text Message Marketing
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>Opt-In Consent:</strong> If you provide your phone number and opt in to receive SMS text messages from GigitekAI, we will send you service updates, promotional offers, account notifications, and support information via SMS. By checking the "Opt in to SMS updates" box on our contact form, you explicitly consent to receive text messages at the phone number you provide.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>TCPA Compliance:</strong> We comply with the Telephone Consumer Protection Act (TCPA) and all applicable SMS regulations. You will only receive SMS messages if you have provided explicit written consent. We maintain a record of your opt-in consent and will honor your preferences.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>Opting Out:</strong> You can opt out of SMS communications at any time by replying "STOP" to any text message you receive from us. We will remove your phone number from our SMS list within 24 hours of receiving your opt-out request. You may also contact us at support@gigitekai.com or call (727) 382-5776 to request removal from our SMS list.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>Message Frequency:</strong> Message frequency varies based on your preferences and the campaigns you are enrolled in. Standard message and data rates apply. We typically send 1–2 messages per week during active campaigns.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Support:</strong> If you have questions about SMS communications or need assistance, reply "HELP" to any text message, or contact us at support@gigitekai.com or (727) 382-5776.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                11. Children's Privacy
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                Our Website and Services are not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will promptly delete such information and take appropriate steps to notify the parent or guardian.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                12. International Data Transfers
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                GigitekAI is based in the United States. Your information may be transferred to, stored in, and processed in the United States or other countries where we or our service providers operate. These countries may have data protection laws that differ from your country of residence.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                By using our Website and Services, you consent to the transfer of your information to countries outside your country of residence, which may have different data protection rules. We implement appropriate safeguards, such as Standard Contractual Clauses, to protect your information during international transfers.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                13. Contact Us
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you have questions about this Privacy Policy or our privacy practices, please contact us:
              </p>
              <div className="bg-gray-100 dark:bg-[#141B2D] p-6 rounded-lg text-gray-700 dark:text-gray-300">
                <p className="mb-2"><strong>GigitekAI LLC</strong></p>
                <p className="mb-2">Email: support@gigitekai.com</p>
                <p className="mb-2">Phone: (727) 382-5776</p>
                <p>Website: https://gigitekai.com</p>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                14. Changes to This Privacy Policy
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of material changes by posting the updated Privacy Policy on our Website and updating the "Last updated" date at the top of this page. Your continued use of our Website and Services after any changes constitutes your acceptance of the updated Privacy Policy.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
          <ScrollToTop />
      </div>
  );
}
