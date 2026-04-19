/*
  GigitekAI Healthcare Industry Page
  Design: Cyberpunk Minimalism meets Enterprise Precision
*/

import SiteNavBar2024 from "@/components/SiteNavBar2024";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";

export default function IndustryHealthcare() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#0A0E1A] to-[#0F1428]">
      <SiteNavBar2024 />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6 font-display">
                Healthcare Solutions
              </h1>
              <p className="text-xl text-gray-300">
                HIPAA-compliant cloud infrastructure and AI solutions for modern healthcare organizations
              </p>
            </div>
          </div>
        </section>

        {/* Industry Overview */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-cyan-500/20">
          <div className="max-w-4xl mx-auto">
            <p className="text-gray-300 text-lg leading-relaxed mb-8">
              Healthcare organizations face unique challenges: regulatory compliance, patient data security, operational efficiency, and the need for rapid innovation. GigitekAI provides enterprise-grade cloud infrastructure, AI-powered diagnostics support, and secure data management tailored to healthcare's demanding requirements.
            </p>
            
            <h2 className="text-3xl font-bold text-cyan-400 mb-6">Key Solutions for Healthcare</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-lg border border-cyan-500/30 bg-cyan-500/5">
                <h3 className="text-xl font-bold text-white mb-3">HIPAA-Compliant Cloud</h3>
                <p className="text-gray-300">Secure, encrypted infrastructure meeting all HIPAA requirements for patient data protection.</p>
              </div>
              <div className="p-6 rounded-lg border border-cyan-500/30 bg-cyan-500/5">
                <h3 className="text-xl font-bold text-white mb-3">AI-Powered Analytics</h3>
                <p className="text-gray-300">Machine learning models for patient outcomes prediction, resource optimization, and clinical decision support.</p>
              </div>
              <div className="p-6 rounded-lg border border-cyan-500/30 bg-cyan-500/5">
                <h3 className="text-xl font-bold text-white mb-3">Disaster Recovery</h3>
                <p className="text-gray-300">Enterprise-grade backup and recovery ensuring zero downtime for critical healthcare systems.</p>
              </div>
              <div className="p-6 rounded-lg border border-cyan-500/30 bg-cyan-500/5">
                <h3 className="text-xl font-bold text-white mb-3">Cybersecurity</h3>
                <p className="text-gray-300">Advanced threat protection and zero-trust architecture safeguarding sensitive patient information.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-cyan-500/5 border-t border-cyan-500/20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Transform Your Healthcare Operations</h2>
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
