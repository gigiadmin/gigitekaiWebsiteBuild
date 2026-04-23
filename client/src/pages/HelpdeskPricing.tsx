import ScrollToTop from "@/components/ScrollToTop";
import SiteNavBar2024 from "@/components/SiteNavBar2024";
import HelpdeskPricingComponent from "@/components/HelpdeskPricing";
import Footer from "@/components/Footer";
import { useSEO } from "@/hooks/useSEO";
import { SEO_CONFIG } from "@/lib/seoConfig";

export default function HelpdeskPricingPage() {
  useSEO({ ...SEO_CONFIG["/helpdesk-pricing"], path: "/helpdesk-pricing" });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteNavBar2024 />
      <main className="flex-1">
        <HelpdeskPricingComponent />
      </main>
      <Footer />
          <ScrollToTop />
      </div>
  );
}
