import ScrollToTop from "@/components/ScrollToTop";
import SiteNavBar2024 from "@/components/SiteNavBar2024";
import Footer from "@/components/Footer";
import ROIRoadmapGenerator from "@/components/ROIRoadmapGenerator";
import Breadcrumb from "@/components/Breadcrumb";
import { useSEO } from "@/hooks/useSEO";
import { SEO_CONFIG } from "@/lib/seoConfig";

export default function ROICalculatorPage() {
  useSEO({ ...SEO_CONFIG["/roi-calculator"], path: "/roi-calculator", schemaType: "WebPage" });

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0E1A]">
      <SiteNavBar2024 />
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "ROI & Roadmap Generator", href: "/roi-calculator" }]} />
      <main className="flex-1 py-12 md:py-20">
        <ROIRoadmapGenerator />
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
