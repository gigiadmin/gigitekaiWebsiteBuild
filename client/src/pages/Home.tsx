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

import { Suspense } from "react";
import { useSEO } from "@/hooks/useSEO";
import { SEO_CONFIG } from "@/lib/seoConfig";
import LazySection from "@/components/LazySection";

// ─── Critical above-fold (eager) ────────────────────────────────────────────
// Only the navbar and hero are visible on first paint (hero is min-h-[90vh])
import SiteNavBar2024 from "@/components/SiteNavBar2024";
import HeroSection from "@/components/HeroSection";

// ─── Critical for SEO & Server-Side Rendering (eager) ────────────────────────
// These sections must render server-side so Google and users see content
// without waiting for JavaScript. They're critical for SEO and UX.
import ServicesSection from "@/components/ServicesSection";
import BenefitsSection from "@/components/BenefitsSection";
import StatsSection from "@/components/StatsSection";
import Footer from "@/components/Footer";

export default function Home() {
  useSEO({ ...SEO_CONFIG["/"], path: "/" });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNavBar2024 />
      <main className="flex-1">
        {/* Above-fold: eager load — visible on first paint (hero = 90vh) */}
        <HeroSection />

        {/* Critical for SEO: Render server-side (no lazy loading) */}
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
      <Footer />
      <LazySection factory={() => import("@/components/ScrollToTop")} minHeight="0px" rootMargin="0px" />
    </div>
  );
}
