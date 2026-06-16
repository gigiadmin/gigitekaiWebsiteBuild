/*
  GigitekAI Case Studies Page — Placeholder
  Real case studies will be added once client success stories are documented.
*/

import SiteNavBar2024 from "@/components/SiteNavBar2024";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { useSEO } from "@/hooks/useSEO";

export default function CaseStudiesPage() {
  useSEO({
    title: "Case Studies | GigitekAI",
    description: "Real-world success stories from GigitekAI clients.",
  });

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <SiteNavBar2024 />

      <main className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Client Success Stories
            </h1>
            <p className="text-gray-300 text-lg leading-relaxed">
              Real case studies showcasing how GigitekAI helps organizations transform their IT infrastructure and operations.
            </p>
            <p className="text-gray-400 text-base mt-6">
              Case studies coming soon. We're documenting success stories from our growing client base.
            </p>
          </div>
        </div>
      </main>

      <Footer />
      <ScrollToTop />
    </div>
  );
}
