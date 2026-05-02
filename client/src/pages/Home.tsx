/*
  GigitekAI Home Page — Assembles all sections
  Design: Cyberpunk Minimalism meets Enterprise Precision
  Colors: Deep navy-black (#0A0E1A) + Electric cyan (#00D4FF)
  Fonts: Space Grotesk (display) + DM Sans (body)
*/

import { useSEO } from "@/hooks/useSEO";
import { SEO_CONFIG } from "@/lib/seoConfig";
import SiteNavBar2024 from "@/components/SiteNavBar2024";
import HeroSection from "@/components/HeroSection";
import ServicesSection from "@/components/ServicesSection";
import BenefitsSection from "@/components/BenefitsSection";
import WhoWeServeSection from "@/components/WhoWeServeSection";
import StatsSection from "@/components/StatsSection";
import IndustriesSection from "@/components/IndustriesSection";
import InsightsSection from "@/components/InsightsSection";
import ROIPromotionSection from "@/components/ROIPromotionSection";
import AgenticOrchestrationSection from "@/components/AgenticOrchestrationSection";
import LeadMagnetsSection from "@/components/LeadMagnetsSection";
import IndustryBenchmarksWidget from "@/components/IndustryBenchmarksWidget";
import { NewsletterSignupSection } from "@/components/NewsletterSignupSection";
import FAQSection from "@/components/FAQSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";

export default function Home() {
  useSEO({ ...SEO_CONFIG["/"], path: "/" });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNavBar2024 />
      <main className="flex-1">
        <HeroSection />
        <ServicesSection />
        <BenefitsSection />
        <WhoWeServeSection />
        <StatsSection />
        <IndustriesSection />
        <AgenticOrchestrationSection />
        <ROIPromotionSection />
        <LeadMagnetsSection />
        <IndustryBenchmarksWidget />
        <NewsletterSignupSection />
        <InsightsSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
