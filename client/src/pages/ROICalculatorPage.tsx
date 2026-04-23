import ScrollToTop from "@/components/ScrollToTop";
import SiteNavBar2024 from "@/components/SiteNavBar2024";
import Footer from "@/components/Footer";
import ROICalculator from "@/components/ROICalculator";
import Breadcrumb from "@/components/Breadcrumb";
import { useSEO } from "@/hooks/useSEO";
import { SEO_CONFIG } from "@/lib/seoConfig";

export default function ROICalculatorPage() {
  useSEO({ ...SEO_CONFIG["/roi-calculator"], path: "/roi-calculator" });

  // This page is public-facing, no auth required
  return (
    <div className="min-h-screen flex flex-col bg-[#0A0E1A]">
      <SiteNavBar2024 />
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "ROI Calculator", href: "/roi-calculator" }]} />
      <main className="flex-1 py-12 md:py-20">
        <ROICalculator />
      </main>
      <Footer />
          <ScrollToTop />
      </div>
  );
}
