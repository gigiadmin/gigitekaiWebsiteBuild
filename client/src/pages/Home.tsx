/*
  GigitekAI Home Page — Assembles all sections
  Design: Cyberpunk Minimalism meets Enterprise Precision
  Colors: Deep navy-black (#0A0E1A) + Electric cyan (#00D4FF)
  Fonts: Space Grotesk (display) + DM Sans (body)

  Performance strategy:
  - Navbar + Hero + Critical sections (Services, Benefits, Stats) are EAGERLY loaded
    for Server-Side Rendering (SSR) — Google and users see full content immediately
  - Below-fold sections use IntersectionObserver-based TRUE deferred loading
  - import() is NOT called until the user scrolls near the section
*/

import { Suspense, lazy } from "react";
import { useSEO } from "@/hooks/useSEO";
import { SEO_CONFIG } from "@/lib/seoConfig";
import LazySection from "@/components/LazySection";

// ─── Critical above-fold (lazy-loaded to reduce initial bundle) ──────────────
// These are lazy-loaded but render quickly via React.lazy + Suspense
const SiteNavBar2024 = lazy(() => import("@/components/SiteNavBar2024"));
const HeroSection = lazy(() => import("@/components/HeroSection"));

// ─── Below-fold sections (lazy-loaded) ────────────────────────────────────────
// Lazy-load all sections to minimize initial bundle and improve LCP/FCP
const ServicesSection = lazy(() => import("@/components/ServicesSection"));
const BenefitsSection = lazy(() => import("@/components/BenefitsSection"));
const StatsSection = lazy(() => import("@/components/StatsSection"));
const Footer = lazy(() => import("@/components/Footer"));

export default function Home() {
  useSEO({ ...SEO_CONFIG["/"], path: "/" });

  return (
    <div className="min-h-screen flex flex-col">
      <Suspense fallback={<div style={{ minHeight: "60px" }} />}>
        <SiteNavBar2024 />
      </Suspense>
      <main className="flex-1">
        {/* Above-fold: lazy-loaded but renders quickly */}
        <Suspense fallback={<div style={{ minHeight: "90vh" }} />}>
          <HeroSection />
        </Suspense>

        {/* Below-fold sections: lazy-loaded */}
        <Suspense fallback={<div style={{ minHeight: "400px" }} />}>
          <ServicesSection />
        </Suspense>
        <Suspense fallback={<div style={{ minHeight: "300px" }} />}>
          <BenefitsSection />
        </Suspense>
        <Suspense fallback={<div style={{ minHeight: "250px" }} />}>
          <StatsSection />
        </Suspense>

        {/* Below-fold: TRUE deferred loading — import() only fires on scroll */}
        <LazySection factory={() => import("@/components/WhoWeServeSection")} minHeight="300px" />
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
      <Suspense fallback={<div style={{ minHeight: "400px" }} />}>
        <Footer />
      </Suspense>
      <LazySection factory={() => import("@/components/ScrollToTop")} minHeight="0px" rootMargin="0px" />
    </div>
  );
}
