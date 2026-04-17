import SiteNavBar2024 from "@/components/SiteNavBar2024";
import HelpdeskPricingComponent from "@/components/HelpdeskPricing";
import Footer from "@/components/Footer";

export default function HelpdeskPricingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteNavBar2024 />
      <main className="flex-1">
        <HelpdeskPricingComponent />
      </main>
      <Footer />
    </div>
  );
}
