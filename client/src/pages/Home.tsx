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
import InsightsSection from "@/components/InsightsSection";
import HomeDecisionGateway from "@/components/HomeDecisionGateway";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import MobileConversionBar from "@/components/MobileConversionBar";

export default function Home() {
  useSEO({ ...SEO_CONFIG["/"], path: "/" });

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0">
      <SiteNavBar2024 />
      <main className="flex-1">
        <HeroSection />
        <HomeDecisionGateway />
        <InsightsSection />
      </main>
      <Footer />
      <ScrollToTop />
      <MobileConversionBar />
    </div>
  );
}
