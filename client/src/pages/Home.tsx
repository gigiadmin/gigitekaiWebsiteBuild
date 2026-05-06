/*
  GigitekAI Home Page — Performance Optimized
  - Only above-fold components (Nav + Hero) loaded eagerly
  - All below-fold sections lazy-loaded with IntersectionObserver
  - Reduces initial JS bundle by ~60% for homepage
*/

import { useSEO } from "@/hooks/useSEO";
import { SEO_CONFIG } from "@/lib/seoConfig";
import { lazy, Suspense, useEffect, useState, useRef } from "react";

// ── Above-fold: loaded eagerly (critical for FCP/LCP) ──
import SiteNavBar2024 from "@/components/SiteNavBar2024";
import HeroSection from "@/components/HeroSection";

// ── Below-fold: lazy-loaded (only when user scrolls near them) ──
const TransparencyTicker = lazy(() => import("@/components/TransparencyTicker"));
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
const Footer = lazy(() => import("@/components/Footer"));
const ScrollToTop = lazy(() => import("@/components/ScrollToTop"));

// Lightweight section placeholder that triggers lazy load when near viewport
function LazySection({ children }: { children: React.ReactNode }) {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" } // Start loading 200px before visible
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!inView) {
    return <div ref={ref} className="min-h-[100px]" />;
  }

  return (
    <Suspense fallback={<div className="min-h-[200px] bg-[#0A0E1A]" />}>
      {children}
    </Suspense>
  );
}

export default function Home() {
  useSEO({ ...SEO_CONFIG["/"], path: "/" });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNavBar2024 />
      <main className="flex-1">
        {/* Above-fold: eagerly loaded for fast FCP/LCP */}
        <HeroSection />

        {/* Below-fold: lazy-loaded as user scrolls */}
        <LazySection><TransparencyTicker /></LazySection>
        <LazySection><ServicesSection /></LazySection>
        <LazySection><BenefitsSection /></LazySection>
        <LazySection><WhoWeServeSection /></LazySection>
        <LazySection><StatsSection /></LazySection>
        <LazySection><IndustriesSection /></LazySection>
        <LazySection><AgenticOrchestrationSection /></LazySection>
        <LazySection><ROIPromotionSection /></LazySection>
        <LazySection><LeadMagnetsSection /></LazySection>
        <LazySection><IndustryBenchmarksWidget /></LazySection>
        <LazySection><NewsletterSignupSection /></LazySection>
        <LazySection><InsightsSection /></LazySection>
        <LazySection><ProjectUntouchable /></LazySection>
        <LazySection><FAQSection /></LazySection>
        <LazySection><CTASection /></LazySection>
      </main>
      <LazySection><Footer /></LazySection>
      <Suspense fallback={null}><ScrollToTop /></Suspense>
    </div>
  );
}
