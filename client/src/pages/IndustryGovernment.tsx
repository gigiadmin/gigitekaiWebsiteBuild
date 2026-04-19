/*
  GigitekAI Government Industry Page
*/

import SiteNavBar2024 from "@/components/SiteNavBar2024";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";

export default function IndustryGovernment() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#0A0E1A] to-[#0F1428]">
      <SiteNavBar2024 />
      <main className="flex-1">
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6 font-display">
              Government Solutions
            </h1>
            <p className="text-xl text-gray-300">
              FedRAMP-compliant cloud infrastructure for federal, state, and local government agencies
            </p>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-cyan-500/20">
          <div className="max-w-4xl mx-auto">
            <p className="text-gray-300 text-lg leading-relaxed mb-8">
              Government agencies require the highest standards of security, compliance, and data sovereignty. GigitekAI delivers FedRAMP-authorized infrastructure, zero-trust architecture, and AI-powered services meeting all federal requirements.
            </p>
            
            <h2 className="text-3xl font-bold text-cyan-400 mb-6">Government Capabilities</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-lg border border-cyan-500/30 bg-cyan-500/5">
                <h3 className="text-xl font-bold text-white mb-3">FedRAMP Compliance</h3>
                <p className="text-gray-300">Full FedRAMP authorization for federal agency workloads and data.</p>
              </div>
              <div className="p-6 rounded-lg border border-cyan-500/30 bg-cyan-500/5">
                <h3 className="text-xl font-bold text-white mb-3">Data Sovereignty</h3>
                <p className="text-gray-300">Data residency guarantees and compliance with government data handling requirements.</p>
              </div>
              <div className="p-6 rounded-lg border border-cyan-500/30 bg-cyan-500/5">
                <h3 className="text-xl font-bold text-white mb-3">Zero-Trust Security</h3>
                <p className="text-gray-300">Advanced security architecture protecting against sophisticated threats.</p>
              </div>
              <div className="p-6 rounded-lg border border-cyan-500/30 bg-cyan-500/5">
                <h3 className="text-xl font-bold text-white mb-3">Citizen Services AI</h3>
                <p className="text-gray-300">AI-powered chatbots and systems improving citizen engagement and service delivery.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-cyan-500/5 border-t border-cyan-500/20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Modernize Government Services</h2>
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
