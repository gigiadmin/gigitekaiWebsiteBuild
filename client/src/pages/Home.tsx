/*
  GigitekAI Home Page — Assembles all sections
  Design: Cyberpunk Minimalism meets Enterprise Precision
  Colors: Deep navy-black (#0A0E1A) + Electric cyan (#00D4FF)
  Fonts: Space Grotesk (display) + DM Sans (body)
*/

import { lazy, Suspense } from "react";
import { useSEO } from "@/hooks/useSEO";
import { SEO_CONFIG } from "@/lib/seoConfig";

// ─── Critical above-fold sections (eager) ───────────────────────────────────
import SiteNavBar2024 from "@/components/SiteNavBar2024";
import HeroSection from "@/components/HeroSection";
import TransparencyTicker from "@/components/TransparencyTicker";
import ServicesSection from "@/components/ServicesSection";
import BenefitsSection from "@/components/BenefitsSection";

// ─── Below-fold sections (lazy-loaded) ──────────────────────────────────────
// These are not visible on initial paint, so we defer their JS download.
const WhoWeServeSection = lazy(() => import("@/components/WhoWeServeSection"));
const StatsSection = lazy(() => import("@/components/StatsSection"));
const IndustriesSection = lazy(() => import("@/components/IndustriesSection"));
const AgenticOrchestrationSection = lazy(() => import("@/components/AgenticOrchestrationSection"));
const ROIPromotionSection = lazy(() => import("@/components/ROIPromotionSection"));
const LeadMagnetsSection = lazy(() => import("@/components/LeadMagnetsSection"));
const IndustryBenchmarksWidget = lazy(() => import("@/components/IndustryBenchmarksWidget"));
const NewsletterSignupSection = lazy(() => import("@/components/NewsletterSignupSection").then(m => ({ default: m.NewsletterSignupSection })));
const InsightsSection = lazy(() => import("@/components/InsightsSection"));
const ProjectUntouchable = lazy(() => import("@/components/ProjectUntouchable"));
const FAQSection = lazy(() => import("@/components/FAQSection"));
const CTASection = lazy(() => import("@/components/CTASection"));
const Footer = lazy(() => import("@/components/Footer"));
const ScrollToTop = lazy(() => import("@/components/ScrollToTop"));

// Minimal placeholder that preserves layout height while section loads
function SectionPlaceholder() {
  return <div style={{ minHeight: "200px" }} aria-hidden="true" />;
}

export default function Home() {
  useSEO({ ...SEO_CONFIG["/"], path: "/" });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNavBar2024 />
      <main className="flex-1">
        {/* Above-fold: eager load */}
        <HeroSection />
        <TransparencyTicker />
        <ServicesSection />
        <BenefitsSection />

        {/* Below-fold: lazy load with Suspense */}
        <Suspense fallback={<SectionPlaceholder />}>
          <WhoWeServeSection />
        </Suspense>
        <Suspense fallback={<SectionPlaceholder />}>
          <StatsSection />
        </Suspense>
        <Suspense fallback={<SectionPlaceholder />}>
          <IndustriesSection />
        </Suspense>
        <Suspense fallback={<SectionPlaceholder />}>
          <AgenticOrchestrationSection />
        </Suspense>
        <Suspense fallback={<SectionPlaceholder />}>
          <ROIPromotionSection />
        </Suspense>
        <Suspense fallback={<SectionPlaceholder />}>
          <LeadMagnetsSection />
        </Suspense>
        <Suspense fallback={<SectionPlaceholder />}>
          <IndustryBenchmarksWidget />
        </Suspense>
        <Suspense fallback={<SectionPlaceholder />}>
          <NewsletterSignupSection />
        </Suspense>
        <Suspense fallback={<SectionPlaceholder />}>
          <InsightsSection />
        </Suspense>
        <Suspense fallback={<SectionPlaceholder />}>
          <ProjectUntouchable />
        </Suspense>
        <Suspense fallback={<SectionPlaceholder />}>
          <FAQSection />
        </Suspense>
        <Suspense fallback={<SectionPlaceholder />}>
          <CTASection />
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
      <Suspense fallback={null}>
        <ScrollToTop />
      </Suspense>
    </div>
  );
}
