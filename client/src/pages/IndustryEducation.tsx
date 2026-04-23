/*
  GigitekAI Education Industry Page
*/

import SiteNavBar2024 from "@/components/SiteNavBar2024";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { useSEO } from "@/hooks/useSEO";
import { SEO_CONFIG } from "@/lib/seoConfig";

export default function IndustryEducation() {
  useSEO({ ...SEO_CONFIG["/industries/education"], path: "/industries/education" });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#0A0E1A] to-[#0F1428]">
      <SiteNavBar2024 />
      <main className="flex-1">
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6 font-display">
              Education Solutions
            </h1>
            <p className="text-xl text-gray-300">
              Cloud infrastructure and AI-powered learning platforms for K-12, higher education, and EdTech
            </p>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-cyan-500/20">
          <div className="max-w-4xl mx-auto">
            <p className="text-gray-300 text-lg leading-relaxed mb-8">
              Educational institutions need reliable, secure infrastructure supporting hybrid learning, student data protection, and personalized education. GigitekAI provides FERPA-compliant cloud services, AI tutoring systems, and analytics enabling better student outcomes.
            </p>
            
            <h2 className="text-3xl font-bold text-cyan-400 mb-6">Education Capabilities</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-lg border border-cyan-500/30 bg-cyan-500/5">
                <h3 className="text-xl font-bold text-white mb-3">FERPA Compliance</h3>
                <p className="text-gray-300">Secure infrastructure protecting student privacy and meeting all FERPA requirements.</p>
              </div>
              <div className="p-6 rounded-lg border border-cyan-500/30 bg-cyan-500/5">
                <h3 className="text-xl font-bold text-white mb-3">AI Tutoring Systems</h3>
                <p className="text-gray-300">Personalized learning experiences powered by adaptive AI tutors.</p>
              </div>
              <div className="p-6 rounded-lg border border-cyan-500/30 bg-cyan-500/5">
                <h3 className="text-xl font-bold text-white mb-3">Learning Analytics</h3>
                <p className="text-gray-300">Data-driven insights into student progress and learning outcomes.</p>
              </div>
              <div className="p-6 rounded-lg border border-cyan-500/30 bg-cyan-500/5">
                <h3 className="text-xl font-bold text-white mb-3">Hybrid Learning Support</h3>
                <p className="text-gray-300">Seamless infrastructure supporting in-person and remote learning experiences.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-cyan-500/5 border-t border-cyan-500/20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Transform Education with Technology</h2>
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
