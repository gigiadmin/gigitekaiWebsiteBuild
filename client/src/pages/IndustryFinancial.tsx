/*
  GigitekAI Financial Services Industry Page
*/

import SiteNavBar2024 from "@/components/SiteNavBar2024";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";

export default function IndustryFinancial() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#0A0E1A] to-[#0F1428]">
      <SiteNavBar2024 />
      <main className="flex-1">
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6 font-display">
              Financial Services Solutions
            </h1>
            <p className="text-xl text-gray-300">
              Secure, compliant cloud infrastructure for banking, insurance, and fintech organizations
            </p>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-cyan-500/20">
          <div className="max-w-4xl mx-auto">
            <p className="text-gray-300 text-lg leading-relaxed mb-8">
              Financial institutions require the highest standards of security, compliance, and reliability. GigitekAI delivers enterprise-grade infrastructure meeting SOC 2, PCI-DSS, and regulatory requirements, with AI-powered fraud detection and real-time analytics.
            </p>
            
            <h2 className="text-3xl font-bold text-cyan-400 mb-6">Financial Services Capabilities</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-lg border border-cyan-500/30 bg-cyan-500/5">
                <h3 className="text-xl font-bold text-white mb-3">Compliance & Audit</h3>
                <p className="text-gray-300">Full SOC 2, PCI-DSS, and regulatory compliance with automated audit trails and reporting.</p>
              </div>
              <div className="p-6 rounded-lg border border-cyan-500/30 bg-cyan-500/5">
                <h3 className="text-xl font-bold text-white mb-3">Fraud Detection AI</h3>
                <p className="text-gray-300">Machine learning models identifying suspicious transactions in real-time.</p>
              </div>
              <div className="p-6 rounded-lg border border-cyan-500/30 bg-cyan-500/5">
                <h3 className="text-xl font-bold text-white mb-3">High Availability</h3>
                <p className="text-gray-300">99.99% uptime SLA with multi-region redundancy and instant failover.</p>
              </div>
              <div className="p-6 rounded-lg border border-cyan-500/30 bg-cyan-500/5">
                <h3 className="text-xl font-bold text-white mb-3">Data Privacy</h3>
                <p className="text-gray-300">End-to-end encryption and zero-trust architecture protecting sensitive financial data.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-cyan-500/5 border-t border-cyan-500/20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Secure Your Financial Infrastructure</h2>
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
