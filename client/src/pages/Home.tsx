/*
  GigitekAI Home Page — Assembles all sections
  Design: Cyberpunk Minimalism meets Enterprise Precision
  Colors: Deep navy-black (#0A0E1A) + Electric cyan (#00D4FF)
  Fonts: Space Grotesk (display) + DM Sans (body)

  Performance Strategy:
  - Above-fold (first 3 sections): eagerly loaded, no Suspense overhead
  - Below-fold (remaining sections): IntersectionObserver-deferred, loaded only when near viewport
  - This keeps TBT low while still deferring non-critical JS
*/

import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import { SEO_CONFIG } from "@/lib/seoConfig";

// Above-fold: eagerly loaded (critical for LCP/FCP)
import SiteNavBar2024 from "@/components/SiteNavBar2024";
import HeroSection from "@/components/HeroSection";
import TransparencyTicker from "@/components/TransparencyTicker";
import ServicesSection from "@/components/ServicesSection";

// Below-fold: lazy loaded (deferred until near viewport)
const BenefitsSection = lazy(() => import("@/components/BenefitsSection"));
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
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import LocalBusinessSchema from "@/components/LocalBusinessSchema";

// IntersectionObserver-based deferred section wrapper
// Only renders children when the placeholder enters the viewport
function DeferredSection({ children, minHeight = "200px" }: { children: React.ReactNode; minHeight?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px" } // Start loading 400px before entering viewport
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ minHeight: visible ? undefined : minHeight }}>
      {visible && <Suspense fallback={<div style={{ minHeight }} />}>{children}</Suspense>}
    </div>
  );
}

export default function Home() {
  useSEO({ ...SEO_CONFIG["/"], path: "/" });

  return (
    <div className="min-h-screen flex flex-col">
      <LocalBusinessSchema />
      <SiteNavBar2024 />
      <main className="flex-1">
        {/* Above-fold: eagerly loaded, no lazy overhead */}
        <HeroSection />
        <TransparencyTicker />
        <ServicesSection />

        {/* Below-fold: deferred via IntersectionObserver */}
        <DeferredSection minHeight="600px">
          <BenefitsSection />
        </DeferredSection>
        <DeferredSection minHeight="500px">
          <WhoWeServeSection />
        </DeferredSection>
        <DeferredSection minHeight="400px">
          <StatsSection />
        </DeferredSection>
        <DeferredSection minHeight="600px">
          <IndustriesSection />
        </DeferredSection>
        <DeferredSection minHeight="500px">
          <AgenticOrchestrationSection />
        </DeferredSection>
        <DeferredSection minHeight="400px">
          <ROIPromotionSection />
        </DeferredSection>
        <DeferredSection minHeight="400px">
          <LeadMagnetsSection />
        </DeferredSection>
        <DeferredSection minHeight="400px">
          <IndustryBenchmarksWidget />
        </DeferredSection>
        <DeferredSection minHeight="300px">
          <NewsletterSignupSection />
        </DeferredSection>
        <DeferredSection minHeight="500px">
          <InsightsSection />
        </DeferredSection>
        <DeferredSection minHeight="400px">
          <ProjectUntouchable />
        </DeferredSection>
        <DeferredSection minHeight="400px">
          <FAQSection />
        </DeferredSection>
        <DeferredSection minHeight="300px">
          <CTASection />
        </DeferredSection>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
