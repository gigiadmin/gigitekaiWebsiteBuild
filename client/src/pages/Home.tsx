/*
  GigitekAI Home Page — Assembles all sections
  Design: Cyberpunk Minimalism meets Enterprise Precision
  Colors: Deep navy-black (#0A0E1A) + Electric cyan (#00D4FF)
  Fonts: Space Grotesk (display) + DM Sans (body)

  PERFORMANCE: Only HeroSection + SiteNavBar2024 are eagerly loaded.
  All below-fold sections are lazy-loaded via React.lazy() + IntersectionObserver
  to minimize the initial JS bundle and reduce TBT on mobile.
*/
import { lazy, Suspense, useRef, useState, useEffect } from "react";
import { useSEO } from "@/hooks/useSEO";
import { SEO_CONFIG } from "@/lib/seoConfig";
import SiteNavBar2024 from "@/components/SiteNavBar2024";
import HeroSection from "@/components/HeroSection";

// ── Below-fold sections — lazy loaded to minimize initial bundle ──────────
const ServicesSection = lazy(() => import("@/components/ServicesSection"));
const BenefitsSection = lazy(() => import("@/components/BenefitsSection"));
const StatsSection = lazy(() => import("@/components/StatsSection"));
const WhoWeServeSection = lazy(() => import("@/components/WhoWeServeSection"));
const IndustriesSection = lazy(() => import("@/components/IndustriesSection"));
const AgenticOrchestrationSection = lazy(() => import("@/components/AgenticOrchestrationSection"));
const ROIPromotionSection = lazy(() => import("@/components/ROIPromotionSection"));
const LeadMagnetsSection = lazy(() => import("@/components/LeadMagnetsSection"));
const FreeAuditCTA = lazy(() => import("@/components/FreeAuditCTA"));
const IndustryBenchmarksWidget = lazy(() => import("@/components/IndustryBenchmarksWidget"));
const NewsletterSignupSection = lazy(() =>
  import("@/components/NewsletterSignupSection").then(m => ({ default: m.NewsletterSignupSection }))
);
const InsightsSection = lazy(() => import("@/components/InsightsSection"));
const ProjectUntouchable = lazy(() => import("@/components/ProjectUntouchable"));
const FAQSection = lazy(() => import("@/components/FAQSection"));
const CTASection = lazy(() => import("@/components/CTASection"));
const Footer = lazy(() => import("@/components/Footer"));
const ScrollToTop = lazy(() => import("@/components/ScrollToTop"));

/**
 * LazySection: Renders a placeholder div until the section enters the viewport,
 * then swaps in the real component. Prevents below-fold sections from blocking
 * the main thread during initial page load, reducing TBT on mobile.
 */
function LazySection({
  children,
  minHeight = "400px",
  rootMargin = "200px",
}: {
  children: React.ReactNode;
  minHeight?: string;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Already in/near viewport on mount
    if (el.getBoundingClientRect().top < window.innerHeight + 200) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  if (!visible) {
    return <div ref={ref} style={{ minHeight }} aria-hidden="true" />;
  }

  return (
    <div ref={ref}>
      <Suspense fallback={<div style={{ minHeight }} />}>
        {children}
      </Suspense>
    </div>
  );
}

export default function Home() {
  useSEO({ ...SEO_CONFIG["/"], path: "/" });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNavBar2024 />
      <main className="flex-1">
        {/* Hero is above-fold — loaded eagerly, no lazy wrapper */}
        <HeroSection />

        {/* All below-fold sections lazy-loaded with IntersectionObserver */}
        <LazySection minHeight="500px">
          <ServicesSection />
        </LazySection>

        <LazySection minHeight="400px">
          <BenefitsSection />
        </LazySection>

        <LazySection minHeight="300px">
          <StatsSection />
        </LazySection>

        <LazySection minHeight="400px">
          <WhoWeServeSection />
        </LazySection>

        <LazySection minHeight="400px">
          <IndustriesSection />
        </LazySection>

        <LazySection minHeight="500px">
          <AgenticOrchestrationSection />
        </LazySection>

        <LazySection minHeight="300px">
          <ROIPromotionSection />
        </LazySection>

        <LazySection minHeight="400px">
          <LeadMagnetsSection />
        </LazySection>

        <LazySection minHeight="500px">
          <FreeAuditCTA />
        </LazySection>

        <LazySection minHeight="300px">
          <IndustryBenchmarksWidget />
        </LazySection>

        <LazySection minHeight="200px">
          <NewsletterSignupSection />
        </LazySection>

        <LazySection minHeight="400px">
          <InsightsSection />
        </LazySection>

        <LazySection minHeight="300px">
          <ProjectUntouchable />
        </LazySection>

        <LazySection minHeight="400px">
          <FAQSection />
        </LazySection>

        <LazySection minHeight="300px">
          <CTASection />
        </LazySection>
      </main>

      <LazySection minHeight="400px" rootMargin="100px">
        <Footer />
      </LazySection>

      <Suspense fallback={null}>
        <ScrollToTop />
      </Suspense>
    </div>
  );
}
