/*
  GigitekAI Home Page — Assembles all sections
  Design: Cyberpunk Minimalism meets Enterprise Precision
  Colors: Deep navy-black (#0A0E1A) + Electric cyan (#00D4FF)
  Fonts: Space Grotesk (display) + DM Sans (body)

  Performance strategy:
  - Only Navbar + Hero are eagerly loaded (they're above the fold on mobile)
  - Everything else uses IntersectionObserver-based TRUE deferred loading
  - import() is NOT called until the user scrolls near the section
  - This eliminates the "Reduce unused JavaScript" Lighthouse penalty
*/

import { useSEO } from "@/hooks/useSEO";
import { SEO_CONFIG } from "@/lib/seoConfig";
import LazySection from "@/components/LazySection";

// ─── Critical above-fold (eager) ────────────────────────────────────────────
// Only the navbar and hero are visible on first paint (hero is min-h-[90vh])
import SiteNavBar2024 from "@/components/SiteNavBar2024";
import HeroSection from "@/components/HeroSection";

export default function Home() {
  useSEO({ ...SEO_CONFIG["/"], path: "/" });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNavBar2024 />
      <main className="flex-1">
        {/* Above-fold: eager load — visible on first paint (hero = 90vh) */}
        <HeroSection />

        {/* Just below hero — load early with generous rootMargin */}
        <LazySection factory={() => import("@/components/TransparencyTicker")} minHeight="60px" rootMargin="600px" />
        <LazySection factory={() => import("@/components/ServicesSection")} minHeight="400px" rootMargin="600px" />
        <LazySection factory={() => import("@/components/BenefitsSection")} minHeight="300px" rootMargin="500px" />

        {/* Below-fold: TRUE deferred loading — import() only fires on scroll */}
        <LazySection factory={() => import("@/components/WhoWeServeSection")} minHeight="300px" />
        <LazySection factory={() => import("@/components/StatsSection")} minHeight="250px" />
        <LazySection factory={() => import("@/components/IndustriesSection")} minHeight="300px" />
        <LazySection factory={() => import("@/components/AgenticOrchestrationSection")} minHeight="300px" />
        <LazySection factory={() => import("@/components/ROIPromotionSection")} minHeight="250px" />
        <LazySection factory={() => import("@/components/LeadMagnetsSection")} minHeight="300px" />
        <LazySection factory={() => import("@/components/IndustryBenchmarksWidget")} minHeight="250px" />
        <LazySection factory={() => import("@/components/NewsletterSignupSection").then(m => ({ default: m.NewsletterSignupSection }))} minHeight="200px" />
        <LazySection factory={() => import("@/components/InsightsSection")} minHeight="300px" />
        <LazySection factory={() => import("@/components/ProjectUntouchable")} minHeight="250px" />
        <LazySection factory={() => import("@/components/FAQSection")} minHeight="300px" />
        <LazySection factory={() => import("@/components/CTASection")} minHeight="200px" />
      </main>
      <LazySection factory={() => import("@/components/Footer")} minHeight="200px" rootMargin="600px" />
      <LazySection factory={() => import("@/components/ScrollToTop")} minHeight="0px" rootMargin="0px" />
    </div>
  );
}
