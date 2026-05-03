/*
  GigitekAI Home Page — Assembles all sections
  Design: Cyberpunk Minimalism meets Enterprise Precision
  Colors: Deep navy-black (#0A0E1A) + Electric cyan (#00D4FF)
  Fonts: Space Grotesk (display) + DM Sans (body)
*/

import { lazy, Suspense } from "react";
import { useSEO } from "@/hooks/useSEO";
import { SEO_CONFIG } from "@/lib/seoConfig";
import SiteNavBar2024 from "@/components/SiteNavBar2024";
import HeroSection from "@/components/HeroSection";
import TransparencyTicker from "@/components/TransparencyTicker";
const ServicesSection = lazy(() => import("@/components/ServicesSection"));
const BenefitsSection = lazy(() => import("@/components/BenefitsSection"));
const WhoWeServeSection = lazy(() => import("@/components/WhoWeServeSection"));
const StatsSection = lazy(() => import("@/components/StatsSection"));
const IndustriesSection = lazy(() => import("@/components/IndustriesSection"));
const InsightsSection = lazy(() => import("@/components/InsightsSection"));
const ROIPromotionSection = lazy(() => import("@/components/ROIPromotionSection"));
const AgenticOrchestrationSection = lazy(() => import("@/components/AgenticOrchestrationSection"));
const LeadMagnetsSection = lazy(() => import("@/components/LeadMagnetsSection"));
const IndustryBenchmarksWidget = lazy(() => import("@/components/IndustryBenchmarksWidget"));
const NewsletterSignupSection = lazy(() => import("@/components/NewsletterSignupSection").then(m => ({ default: m.NewsletterSignupSection })));
const ProjectUntouchable = lazy(() => import("@/components/ProjectUntouchable"));
const FAQSection = lazy(() => import("@/components/FAQSection"));
const CTASection = lazy(() => import("@/components/CTASection"));
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";

export default function Home() {
  useSEO({ ...SEO_CONFIG["/"], path: "/" });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNavBar2024 />
      <main className="flex-1">
        <Suspense fallback={<div />}>
        <HeroSection />
        <TransparencyTicker />
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
        <ProjectUntouchable />
        <FAQSection />
        <CTASection />
      </Suspense>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
