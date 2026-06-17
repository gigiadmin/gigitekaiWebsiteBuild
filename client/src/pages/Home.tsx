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
const WhyChooseUsSection = lazy(() => import("@/components/WhyChooseUsSection"));
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
        
        {/* Static SEO content for server-side rendering */}
        <noscript>
          <section className="bg-[#0A0E1A] py-16 px-4">
            <div className="container max-w-4xl">
              <h2 className="text-3xl font-bold text-white mb-6">Enterprise Cloud Infrastructure & AI Solutions</h2>
              <p className="text-gray-300 mb-4">GigitekAI provides enterprise-grade cloud infrastructure, AI solutions, and managed IT services that transform how businesses operate, innovate, and scale.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
                <div><p className="text-2xl font-bold text-cyan-400">30+</p><p className="text-gray-300 text-sm">ClientServe</p></div>
                <div><p className="text-2xl font-bold text-cyan-400">99.9%</p><p className="text-gray-300 text-sm">Uptime SLA</p></div>
                <div><p className="text-2xl font-bold text-cyan-400">24/7</p><p className="text-gray-300 text-sm">AI Support</p></div>
                <div><p className="text-2xl font-bold text-cyan-400">3.4s</p><p className="text-gray-300 text-sm">AI Deployment</p></div>
              </div>
              <h3 className="text-xl font-bold text-white mb-4 mt-8">Our Services</h3>
              <ul className="grid grid-cols-2 gap-2 text-gray-300 mb-8">
                <li>Cloud Infrastructure</li>
                <li>AI & Machine Learning</li>
                <li>Microsoft 365 Solutions</li>
                <li>Managed IT Services</li>
                <li>Cybersecurity</li>
                <li>Data Analytics</li>
              </ul>
              <p className="text-gray-400 text-sm">GigitekAI is an AI-first Managed Services Provider specializing in enterprise cloud infrastructure, intelligent automation, cybersecurity, and 24/7 managed IT services. We serve 30+ clients across North America with 99.9% uptime SLA and 24/7 AI-powered support.</p>
            </div>
          </section>
        </noscript>

        {/* Critical sections for SEO — rendered immediately (not lazy-loaded) */}
        <ServicesSection />
        <WhyChooseUsSection />
        <BenefitsSection />
        <StatsSection />

        {/* Below-fold sections lazy-loaded with IntersectionObserver */}

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
