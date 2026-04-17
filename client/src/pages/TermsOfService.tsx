import React from 'react';
import Navbar from '@/components/SiteNavBar2024';
import Footer from '@/components/Footer';

export default function TermsOfService() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#0A0E1A]">
      <Navbar />
      <main className="flex-1">
        <div className="container py-16 max-w-4xl">
          <div className="mb-12">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Terms of Service
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Last updated: April 2026
            </p>
          </div>

          <div className="prose prose-invert max-w-none">
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                1. Agreement to Terms
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                These Terms of Service ("Terms") constitute a legally binding agreement between you ("User," "you," or "your") and GigitekAI LLC ("Company," "we," "us," or "our"). By accessing, browsing, or using our website gigitekai.com (the "Website") and our cloud infrastructure, AI implementation, managed IT services, and related solutions (collectively, the "Services"), you agree to be bound by these Terms.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you do not agree to these Terms, you must not access or use our Website or Services. If you are using our Services on behalf of an organization, you represent and warrant that you have the authority to bind that organization to these Terms.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                2. Use License
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Subject to your compliance with these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to access and use our Website and Services for lawful purposes. This license does not include the right to:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose or for any public display</li>
                <li>Attempt to decompile or reverse engineer any software contained on the Website</li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
                <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
                <li>Engage in any conduct that restricts or inhibits anyone's use or enjoyment of the Website</li>
                <li>Obtain or attempt to obtain any materials or information through any means not intentionally provided by us</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                3. Disclaimer of Warranties
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                The materials on our Website and Services are provided on an "as-is" basis. GigitekAI makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                We do not warrant that the functions contained in the materials will be uninterrupted or error-free, that defects will be corrected, or that our Website or the server that makes it available are free of viruses or other harmful components.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                4. Limitations of Liability
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                In no event shall GigitekAI or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on the Website or Services, even if we or an authorized representative has been notified orally or in writing of the possibility of such damage.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Some jurisdictions do not allow limitations on implied warranties or limitations of liability for incidental or consequential damages, so these limitations may not apply to you.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                5. Accuracy of Materials
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                The materials appearing on our Website and Services could include technical, typographical, or photographic errors. GigitekAI does not warrant that any of the materials on our Website or Services are accurate, complete, or current. We may make changes to the materials contained on our Website or Services at any time without notice.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                6. Materials and Content
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                GigitekAI has not reviewed all of the sites linked to its Website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by GigitekAI of the site. Use of any such linked website is at the user's own risk.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                If you believe that your work has been copied in a way that constitutes copyright infringement, please provide us with a written notice containing the information specified in the Digital Millennium Copyright Act (DMCA).
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                7. Modifications to Terms
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                GigitekAI may revise these Terms of Service for our Website and Services at any time without notice. By using this Website or Services, you are agreeing to be bound by the then current version of these Terms of Service. We will notify you of material changes by posting the updated Terms on our Website and updating the "Last updated" date.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                8. Governing Law
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                These Terms of Service and any separate agreements we may enter into to provide the Services are governed by and construed in accordance with the laws of the State of Florida, United States, without regard to its conflict of law provisions. You agree to submit to the exclusive jurisdiction of the courts located in Hillsborough County, Florida.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                9. User Responsibilities
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You agree that you will not use our Website or Services to:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4">
                <li>Violate any applicable laws, regulations, or third-party rights</li>
                <li>Transmit any unlawful, threatening, abusive, defamatory, obscene, or otherwise objectionable material</li>
                <li>Impersonate any person or entity or misrepresent your affiliation with a person or entity</li>
                <li>Upload viruses or other malicious code</li>
                <li>Collect or track personal information of others without consent</li>
                <li>Spam, phish, or engage in any form of harassment</li>
                <li>Interfere with or disrupt the integrity or performance of our Website or Services</li>
                <li>Attempt to gain unauthorized access to our systems or networks</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                10. Intellectual Property Rights
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                All content on our Website and Services, including text, graphics, logos, images, audio clips, digital downloads, and data compilations, is the property of GigitekAI or its content suppliers and is protected by international copyright laws. All rights are reserved.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                You may not reproduce, distribute, transmit, display, or perform any content from our Website or Services without our prior written permission, except as permitted by applicable law.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                11. Payment and Billing
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you purchase our Services, you agree to pay the fees and charges as stated in your service agreement or quote. Payment terms and conditions are specified in your contract with GigitekAI. All fees are exclusive of applicable taxes unless otherwise stated.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We may change our fees and charges at any time, provided that such changes will not apply to Services already purchased unless you agree to the new pricing terms.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                If you dispute any charges, you must notify us in writing within thirty (30) days of the charge appearing on your invoice.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                12. Data Processing and Compliance
              </h2>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                12.1 GDPR Compliance
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you are located in the European Union or United Kingdom and provide personal data to us, we will process that data in accordance with the General Data Protection Regulation (GDPR). We maintain a Data Processing Agreement (DPA) with customers who require it, which outlines our obligations as a data processor.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                12.2 HIPAA Compliance
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you are a covered entity or business associate under the Health Insurance Portability and Accountability Act (HIPAA) and require our Services to handle protected health information (PHI), we will execute a Business Associate Agreement (BAA) with you. Our Services include appropriate safeguards for PHI as required by HIPAA.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                12.3 SOC 2 Compliance
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                GigitekAI maintains SOC 2 Type II compliance, demonstrating our commitment to security, availability, processing integrity, confidentiality, and privacy controls. Audit reports are available upon request to qualified customers.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                13. Service Level Agreement (SLA)
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                GigitekAI commits to maintaining 99.5% uptime for our managed services, measured on a monthly basis. Uptime is defined as the percentage of time during which our Services are available and functioning properly.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Scheduled maintenance windows and events beyond our reasonable control (force majeure events) are excluded from uptime calculations. If we fail to meet the SLA, you may be eligible for service credits as specified in your service agreement.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                14. Termination
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Either party may terminate the Services by providing written notice to the other party. Upon termination, your right to use the Services will immediately cease. We will make reasonable efforts to return or securely delete your data within thirty (30) days of termination, unless otherwise required by law.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                We may terminate or suspend your access to our Services immediately if you violate these Terms or engage in conduct that we reasonably believe violates applicable law or harms our business, users, or reputation.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                15. Limitation of Liability
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                To the fullest extent permitted by applicable law, in no event shall GigitekAI be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to damages for loss of profits, goodwill, use, data, or other intangible losses, even if we have been advised of the possibility of such damages.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Our total liability under these Terms shall not exceed the amount paid by you for the Services in the twelve (12) months preceding the claim.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                16. Indemnification
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                You agree to indemnify, defend, and hold harmless GigitekAI and its officers, directors, employees, and agents from and against any and all claims, damages, losses, costs, and expenses (including reasonable attorneys' fees) arising out of or related to your use of our Website or Services, your violation of these Terms, or your violation of any third-party rights.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                17. Severability
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                If any provision of these Terms is found to be invalid or unenforceable, that provision shall be modified to the minimum extent necessary to make it valid and enforceable, or if such modification is not possible, the provision shall be severed. The remaining provisions shall continue in full force and effect.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                18. Entire Agreement
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                These Terms of Service, together with any other agreements you have entered into with GigitekAI, constitute the entire agreement between you and GigitekAI regarding your use of our Website and Services and supersede all prior negotiations, representations, and agreements, whether written or oral.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                19. Contact Information
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you have questions about these Terms of Service or our Services, please contact us:
              </p>
              <div className="bg-gray-100 dark:bg-[#141B2D] p-6 rounded-lg text-gray-700 dark:text-gray-300">
                <p className="mb-2"><strong>GigitekAI LLC</strong></p>
                <p className="mb-2">Email: support@gigitekai.com</p>
                <p className="mb-2">Phone: (727) 382-5776</p>
                <p>Website: https://gigitekai.com</p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
