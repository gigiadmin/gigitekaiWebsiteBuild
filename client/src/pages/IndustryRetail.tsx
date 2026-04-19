/*
  GigitekAI Retail & eCommerce Industry Page
*/

import SiteNavBar2024 from "@/components/SiteNavBar2024";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";

export default function IndustryRetail() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#0A0E1A] to-[#0F1428]">
      <SiteNavBar2024 />
      <main className="flex-1">
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6 font-display">
              Retail & eCommerce Solutions
            </h1>
            <p className="text-xl text-gray-300">
              Scalable cloud infrastructure and AI-powered personalization for retail and eCommerce
            </p>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-cyan-500/20">
          <div className="max-w-4xl mx-auto">
            <p className="text-gray-300 text-lg leading-relaxed mb-8">
              Retail and eCommerce businesses face intense competition and rapidly changing customer expectations. GigitekAI provides scalable infrastructure, AI-powered personalization, inventory optimization, and fraud prevention enabling seamless omnichannel experiences.
            </p>
            
            <h2 className="text-3xl font-bold text-cyan-400 mb-6">Retail & eCommerce Capabilities</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-lg border border-cyan-500/30 bg-cyan-500/5">
                <h3 className="text-xl font-bold text-white mb-3">Personalization Engine</h3>
                <p className="text-gray-300">AI-powered recommendations increasing conversion rates and customer lifetime value.</p>
              </div>
              <div className="p-6 rounded-lg border border-cyan-500/30 bg-cyan-500/5">
                <h3 className="text-xl font-bold text-white mb-3">Inventory Optimization</h3>
                <p className="text-gray-300">Predictive analytics optimizing stock levels across channels and locations.</p>
              </div>
              <div className="p-6 rounded-lg border border-cyan-500/30 bg-cyan-500/5">
                <h3 className="text-xl font-bold text-white mb-3">Fraud Prevention</h3>
                <p className="text-gray-300">Real-time fraud detection protecting revenue and customer trust.</p>
              </div>
              <div className="p-6 rounded-lg border border-cyan-500/30 bg-cyan-500/5">
                <h3 className="text-xl font-bold text-white mb-3">Global Scalability</h3>
                <p className="text-gray-300">Infrastructure scaling automatically to handle peak traffic and seasonal demands.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-cyan-500/5 border-t border-cyan-500/20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Accelerate Your Retail Transformation</h2>
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
