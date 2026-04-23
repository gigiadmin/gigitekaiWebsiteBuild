/*
  GigitekAI Manufacturing Industry Page
*/

import SiteNavBar2024 from "@/components/SiteNavBar2024";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { useSEO } from "@/hooks/useSEO";
import { SEO_CONFIG } from "@/lib/seoConfig";

export default function IndustryManufacturing() {
  useSEO({ ...SEO_CONFIG["/industries/manufacturing"], path: "/industries/manufacturing" });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#0A0E1A] to-[#0F1428]">
      <SiteNavBar2024 />
      <main className="flex-1">
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6 font-display">
              Manufacturing Solutions
            </h1>
            <p className="text-xl text-gray-300">
              IoT-enabled cloud infrastructure and AI analytics for smart manufacturing
            </p>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-cyan-500/20">
          <div className="max-w-4xl mx-auto">
            <p className="text-gray-300 text-lg leading-relaxed mb-8">
              Modern manufacturers need real-time visibility into operations, predictive maintenance, and supply chain optimization. GigitekAI provides IoT integration, edge computing, and AI-powered analytics enabling Industry 4.0 transformation.
            </p>
            
            <h2 className="text-3xl font-bold text-cyan-400 mb-6">Manufacturing Capabilities</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-lg border border-cyan-500/30 bg-cyan-500/5">
                <h3 className="text-xl font-bold text-white mb-3">IoT Integration</h3>
                <p className="text-gray-300">Connect sensors and devices for real-time production monitoring and control.</p>
              </div>
              <div className="p-6 rounded-lg border border-cyan-500/30 bg-cyan-500/5">
                <h3 className="text-xl font-bold text-white mb-3">Predictive Maintenance</h3>
                <p className="text-gray-300">AI models predicting equipment failures before they occur, reducing downtime.</p>
              </div>
              <div className="p-6 rounded-lg border border-cyan-500/30 bg-cyan-500/5">
                <h3 className="text-xl font-bold text-white mb-3">Supply Chain Visibility</h3>
                <p className="text-gray-300">End-to-end supply chain tracking and optimization powered by AI.</p>
              </div>
              <div className="p-6 rounded-lg border border-cyan-500/30 bg-cyan-500/5">
                <h3 className="text-xl font-bold text-white mb-3">Quality Control</h3>
                <p className="text-gray-300">Computer vision and AI for automated quality inspection and defect detection.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-cyan-500/5 border-t border-cyan-500/20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Modernize Your Manufacturing Operations</h2>
            <a href="/contact" className="inline-block px-8 py-3 bg-cyan-500 text-white font-semibold rounded-lg hover:bg-cyan-600 transition">
              Schedule a Consultation
            </a>
          </div>
        </section>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
