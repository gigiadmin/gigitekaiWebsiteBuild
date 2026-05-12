import { useEffect } from "react";
import FreeAuditPricingPage from "./FreeAuditPricingPage";
import FreeAuditForm from "./FreeAuditForm";
import TestimonialsSection from "./TestimonialsSection";
import FAQSection from "./FAQSection";

export default function FreeAuditLandingPage() {
  useEffect(() => {
    // Update page title
    document.title = "Free IT Audit + 50% Off | GigitekAI";
    
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
    
    updateMetaTag("description", "Get a free comprehensive IT audit and save 50% on your first month of managed IT services. Limited time offer - 1 month only!");
    updateMetaTag("keywords", "free IT audit, managed IT services, MSP, IT consulting, Tampa, Florida");
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#0A0E1A]/95 backdrop-blur border-b border-gray-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img
              src="https://cdn.gigitekai.com/gigitekai-logo.webp"
              alt="GigitekAI"
              className="h-8 w-auto"
            />
          </a>
          <a
            href="https://gigitekai.com"
            className="text-sm text-gray-400 hover:text-[#00D4FF] transition-colors"
          >
            Back to GigitekAI
          </a>
        </div>
      </nav>

      {/* Main Content */}
      <FreeAuditPricingPage />
      <FreeAuditForm />
      <TestimonialsSection />
      <FAQSection />

      {/* Footer CTA */}
      <div className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-gray-900/40 border-t border-gray-800/40">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Transform Your IT?</h2>
          <p className="text-xl text-gray-400 mb-8">
            Get your free audit today and discover how much you could save
          </p>
          <button
            onClick={() =>
              document.getElementById("audit-form")?.scrollIntoView({ behavior: "smooth" })
            }
            className="inline-block px-8 py-4 bg-[#00D4FF] text-black font-bold rounded-lg hover:bg-[#00D4FF]/90 transition-colors text-lg"
          >
            Get Your Free Audit Now
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-800/40 bg-gray-900/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-400">
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
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="https://gigitekai.com/services" className="hover:text-[#00D4FF]">
                    Helpdesk
                  </a>
                </li>
                <li>
                  <a href="https://gigitekai.com/services" className="hover:text-[#00D4FF]">
                    Cloud Infrastructure
                  </a>
                </li>
                <li>
                  <a href="https://gigitekai.com/services" className="hover:text-[#00D4FF]">
                    AI Automation
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="mailto:support@gigitekai.com" className="hover:text-[#00D4FF]">
                    Email Support
                  </a>
                </li>
                <li>
                  <a href="tel:+16096764483" className="hover:text-[#00D4FF]">
                    (609) 676-4483
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
              <h3 className="font-bold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="https://gigitekai.com/privacy-policy" className="hover:text-[#00D4FF]">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="https://gigitekai.com/terms-of-service" className="hover:text-[#00D4FF]">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800/40 pt-8 text-center text-sm text-gray-500">
            <p>
              © 2026 GigitekAI. All rights reserved. | 
              <span className="ml-2">
                Offer valid for 1 month only. 30-day money-back guarantee applies.
              </span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
