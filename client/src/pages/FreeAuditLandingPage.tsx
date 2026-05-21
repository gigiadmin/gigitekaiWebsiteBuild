import { useEffect } from "react";
import WebsitePricingTiers from "./WebsitePricingTiers";
import WebsiteFeatureComparison from "./WebsiteFeatureComparison";
import WebsiteAddOns from "./WebsiteAddOns";
import WebsiteROICalculator from "./WebsiteROICalculator";
import FreeAuditForm from "./FreeAuditForm";
import TestimonialsSection from "./TestimonialsSection";
import FAQSection from "./FAQSection";

export default function FreeAuditLandingPage() {
  useEffect(() => {
    // Update page title
    document.title = "Free Website Audit + 50% Off | GigitekAI";
    
    // Update meta description
    const updateMetaTag = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", name);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };
    
    updateMetaTag("description", "Get a free comprehensive website audit and save 50% on professional website design & SEO services. Limited time offer - 1 month free on 1-year commitment!");
    updateMetaTag("keywords", "website design, SEO services, website audit, web development, Tampa MSP");
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <main>
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#0A0E1A]/95 backdrop-blur border-b border-gray-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-white">Gigitek<span className="text-[#00D4FF]">AI</span></span>
          </a>
          <a
            href="https://gigitekai.com"
            className="text-sm text-gray-300 hover:text-[#00D4FF] transition-colors"
          >
            Back to GigitekAI
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-900/50 to-transparent border-b border-gray-800/40">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-[#00D4FF] to-[#9D4EDD] bg-clip-text text-transparent">
            Professional Websites Built for Growth
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Get a free website audit + save 50% on professional web design, SEO, and integrations
          </p>
          <div className="inline-block bg-green-900/20 border border-green-700/50 rounded-lg px-6 py-3 mb-8">
            <p className="text-green-300 font-semibold">
              🎁 Limited Time: 50% OFF + 1 Month FREE on 1-Year Commitment
            </p>
          </div>
          <button
            onClick={() =>
              document.getElementById("audit-form")?.scrollIntoView({ behavior: "smooth" })
            }
            className="inline-block px-8 py-4 bg-[#00D4FF] text-black font-bold rounded-lg hover:bg-[#00D4FF]/90 transition-colors text-lg"
          >
            Get Your Free Website Audit
          </button>
        </div>
      </section>

      {/* Main Content */}
      <WebsitePricingTiers />
      <WebsiteFeatureComparison />
      <WebsiteAddOns />
      <WebsiteROICalculator />
      <FreeAuditForm />
      <TestimonialsSection />
      <FAQSection />

      {/* Helpdesk Services CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-gray-900/40 border-t border-gray-800/40">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Also Need Managed IT Services?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Combine your website with our comprehensive helpdesk support, AI automation, and managed IT services
          </p>
          <a
            href="https://gigitekai.com/helpdesk-pricing"
            className="inline-block px-8 py-4 bg-[#9D4EDD] text-white font-bold rounded-lg hover:bg-[#9D4EDD]/90 transition-colors text-lg"
          >
            View Helpdesk Pricing
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-800/40 bg-gray-900/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>
                  <a href="https://gigitekai.com" className="hover:text-[#00D4FF]">
                    About
                  </a>
                </li>
                <li>
                  <a href="https://gigitekai.com/blog" className="hover:text-[#00D4FF]">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="https://gigitekai.com/careers" className="hover:text-[#00D4FF]">
                    Careers
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Services</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>
                  <a href="https://gigitekai.com/services" className="hover:text-[#00D4FF]">
                    Services
                  </a>
                </li>
                <li>
                  <a href="https://gigitekai.com/helpdesk-pricing" className="hover:text-[#00D4FF]">
                    Helpdesk Pricing
                  </a>
                </li>
                <li>
                  <a href="https://gigitekai.com/websites" className="hover:text-[#00D4FF]">
                    Websites
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>
                  <a href="https://gigitekai.com/roi-calculator" className="hover:text-[#00D4FF]">
                    ROI Calculator
                  </a>
                </li>
                <li>
                  <a href="https://gigitekai.com/case-studies" className="hover:text-[#00D4FF]">
                    Case Studies
                  </a>
                </li>
                <li>
                  <a href="https://gigitekai.com/contact" className="hover:text-[#00D4FF]">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Contact</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>
                  <a href="tel:+17273825776" className="hover:text-[#00D4FF]">
                    (727) 382-5776
                  </a>
                </li>
                <li>
                  <a href="mailto:support@gigitekai.com" className="hover:text-[#00D4FF]">
                    support@gigitekai.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800/40 pt-8">
            <p className="text-center text-sm text-gray-300">
              © 2026 GigitekAI LLC. All rights reserved. | 
              <a href="https://gigitekai.com/privacy" className="hover:text-[#00D4FF] ml-2">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </footer>
          </main>
    </div>
  );
}
