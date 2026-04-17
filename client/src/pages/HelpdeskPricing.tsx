import Navbar from "@/components/Navbar";
import HelpdeskPricingComponent from "@/components/HelpdeskPricing";
import Footer from "@/components/Footer";

export default function HelpdeskPricingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <HelpdeskPricingComponent />
      </main>
      <Footer />
    </div>
  );
}
