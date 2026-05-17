import { useEffect } from "react";
import SiteNavBar2024 from "@/components/SiteNavBar2024";
import HelpdeskPricingComponent from "@/components/HelpdeskPricing";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { useSEO } from "@/hooks/useSEO";
import { SEO_CONFIG } from "@/lib/seoConfig";

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is included in the Essential helpdesk plan?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The Essential plan at $69/user/month includes Tier 1 & 2 support, 8x5 coverage, 4-hour response SLA, Microsoft 365 support, and up to 20 users."
      }
    },
    {
      "@type": "Question",
      "name": "What does the Professional helpdesk plan include?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The Professional plan at $119/user/month includes Tier 1-3 support, 12x7 coverage, 2-hour response SLA, AI-assisted ticketing, Teams integration, and up to 50 users."
      }
    },
    {
      "@type": "Question",
      "name": "What is the Elite helpdesk plan?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The Elite plan at $189/user/month includes 24x7 support, 30-minute critical response SLA, dedicated account manager, custom AI agents, unlimited users, and full Microsoft 365 architecture."
      }
    },
    {
      "@type": "Question",
      "name": "Is there a discount for annual billing?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Annual billing saves 2 months — you pay for 10 months and get 12. The annual price is calculated as the monthly rate multiplied by 10."
      }
    },
    {
      "@type": "Question",
      "name": "Do you offer a free IT assessment?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. GigitekAI offers a free IT assessment for Tampa Bay businesses. Call (727) 382-6909 or email support@gigitekai.com to schedule."
      }
    }
  ]
};

export default function HelpdeskPricingPage() {
  useSEO({ ...SEO_CONFIG["/helpdesk-pricing"], path: "/helpdesk-pricing" });

  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "faq-schema-helpdesk";
    script.text = JSON.stringify(FAQ_SCHEMA);
    document.head.appendChild(script);
    return () => { document.getElementById("faq-schema-helpdesk")?.remove(); };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteNavBar2024 />
      <main className="flex-1">
        <HelpdeskPricingComponent />
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
