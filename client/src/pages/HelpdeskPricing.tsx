import MainNavigation from "@/components/MainNavigation";
import HelpdeskPricingComponent from "@/components/HelpdeskPricing";
import Footer from "@/components/Footer";

export default function HelpdeskPricingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MainNavigation />
      <main className="flex-1">
        <HelpdeskPricingComponent />
      </main>
      <Footer />
    </div>
  );
}
