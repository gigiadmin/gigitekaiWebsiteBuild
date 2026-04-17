import MainNavigation from "@/components/MainNavigation";
import Footer from "@/components/Footer";
import ROICalculator from "@/components/ROICalculator";
import Breadcrumb from "@/components/Breadcrumb";

export default function ROICalculatorPage() {
  // This page is public-facing, no auth required
  return (
    <div className="min-h-screen flex flex-col bg-[#0A0E1A]">
      <MainNavigation />
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "ROI Calculator", href: "/roi-calculator" }]} />
      <main className="flex-1 py-12 md:py-20">
        <ROICalculator />
      </main>
      <Footer />
    </div>
  );
}
