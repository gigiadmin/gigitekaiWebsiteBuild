/*
  GigitekAI About Us Page
  Design: Cyberpunk Minimalism meets Enterprise Precision
  Colors: Deep navy-black (#0A0E1A) + Electric cyan (#00D4FF)
*/

import { useSEO } from "@/hooks/useSEO";
import { SEO_CONFIG } from "@/lib/seoConfig";
import SiteNavBar2024 from "@/components/SiteNavBar2024";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";

export default function AboutUs() {
  useSEO({ ...SEO_CONFIG["/about-us"], path: "/about-us" });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#0A0E1A] to-[#0F1428]">
      <SiteNavBar2024 />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6 font-display">
                About GigitekAI
              </h1>
              <p className="text-xl text-gray-300">
                Transforming enterprises through cloud infrastructure, AI innovation, and intelligent automation
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-cyan-500/20">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h2 className="text-3xl font-bold text-cyan-400 mb-6">Our Mission</h2>
                <p className="text-gray-300 text-lg leading-relaxed mb-4">
                  At GigitekAI, we believe that intelligent technology should be accessible to every organization. Our mission is to empower businesses to modernize their infrastructure, leverage artificial intelligence, and automate their operations to achieve unprecedented growth.
                </p>
                <p className="text-gray-300 text-lg leading-relaxed">
                  We're not just a Managed Services Provider—we're your strategic technology partner dedicated to transforming how you work.
                </p>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-cyan-400 mb-6">Our Vision</h2>
                <p className="text-gray-300 text-lg leading-relaxed mb-4">
                  We envision a future where AI-powered agents function as full employees, handling complex tasks with precision and intelligence. Where cloud infrastructure enables unlimited scalability, and where automation eliminates repetitive work.
                </p>
                <p className="text-gray-300 text-lg leading-relaxed">
                  We're building an AI-first technology firm that leads this transformation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Company Story */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-cyan-500/5 border-y border-cyan-500/20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-8">Our Story</h2>
            <div className="space-y-6 text-gray-300 text-lg leading-relaxed">
              <p>
                Founded in 2024, GigitekAI was born from a simple observation: enterprises struggle to modernize their technology infrastructure while simultaneously adopting AI and automation. Most MSPs focus on reactive support; we focus on strategic transformation.
              </p>
              <p>
                Our founder, Harry Henry Santiago, is a Microsoft 365 Architect with over two decades of IT experience. His vision was to build an MSP that doesn't just manage technology—it transforms it. An organization where intelligent agents augment human expertise, where cloud-native architecture is the default, and where automation drives profitability.
              </p>
              <p>
                Today, GigitekAI serves a growing roster of clients across North America, backed by a dedicated team of cloud, AI, and cybersecurity specialists. We partner with industry leaders including Microsoft, Sherweb, ConnectSecure, DefensX, and best-in-class security vendors to deliver comprehensive solutions.
              </p>
            </div>
          </div>
        </section>

        {/* Founder Spotlight */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-8">Founder Spotlight</h2>
            <div className="grid md:grid-cols-3 gap-8 items-start">
              <div className="md:col-span-2 space-y-4 text-gray-300 text-lg leading-relaxed">
                <p>
                  <strong className="text-cyan-400">Harry Henry Santiago</strong> is a Microsoft 365 Subject Matter Expert with 20+ years designing, securing, and modernizing enterprise messaging environments for global organizations. His core focus areas include Exchange Online, email security (Proofpoint, SPF/DKIM/DMARC), multi-tenant Azure AD administration, hybrid migrations, and PowerShell/Graph API automation.
                </p>
                <p>
                  Harry has supported environments ranging from 100,000+ user global deployments to mid-size businesses transitioning to the cloud. Career highlights include serving as a <strong className="text-white">Sr. Microsoft Escalation Engineer at Microsoft</strong> (Premier Support), a <strong className="text-white">Global Messaging Consultant at HCL America</strong> supporting 100k+ users across multiple continents, and currently as <strong className="text-white">Associate Manager (Senior M365 Engineer) at Avanade</strong> — a joint venture between Accenture and Microsoft.
                </p>
                <p>
                  Born in Manatí, Puerto Rico, and raised in New Brunswick, NJ, Harry served in the U.S. Army as a Legal Specialist (MOS 71D) from 1993 to 1997 before transitioning into IT in the late 1990s. He founded GigitekAI in 2024 with a clear mission: build an AI-first MSP where intelligent agents function as full employees — replacing manual workflows with automation and intelligence.
                </p>
                <p>
                  Harry holds 10 Proofpoint certifications (TRAP, TAP, PPS series) and MCSA + Messaging, and is actively integrating Agentic AI frameworks into enterprise IT workflows.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {["Exchange Online", "Entra ID", "Proofpoint", "PowerShell", "Graph API", "Hybrid Migration", "Agentic AI", "Zero Trust"].map((tag) => (
                    <span key={tag} className="px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="text-center">
                <div className="w-40 h-40 mx-auto rounded-full overflow-hidden border-2 border-cyan-500/40">
                  <img
                    src="/manus-storage/harry-headshot_df3577a8.jpeg"
                    alt="Harry Henry Santiago — CEO & Founder, GigitekAI"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-cyan-400 font-semibold mt-4">Harry Henry Santiago</p>
                <p className="text-gray-400 text-sm mt-1">CEO & Founder</p>
                <p className="text-gray-400 text-sm">Microsoft 365 SME</p>
                <p className="text-gray-500 text-sm mt-2">U.S. Army Veteran</p>
                <p className="text-gray-500 text-sm">📍 Tampa, Florida</p>
                <a
                  href="https://www.linkedin.com/in/gigitekinc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-3 text-xs text-cyan-400 hover:text-cyan-300 transition underline"
                >
                  linkedin.com/in/gigitekinc
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Vendor Ecosystem */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-cyan-500/5 border-y border-cyan-500/20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4 text-center">Our Vendor Ecosystem</h2>
            <p className="text-gray-400 text-center mb-10">We partner with industry-leading vendors to deliver best-in-class solutions</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[
                "Microsoft", "Sherweb", "ConnectSecure", "DefensX",
                "Harmony / Avanan", "NordLayer", "NordPass", "NordStellar",
                "Afi Backup", "Commvault", "AWS", "Google Cloud"
              ].map((vendor) => (
                <div key={vendor} className="p-4 rounded-lg border border-cyan-500/20 bg-[#0A0E1A]/50 text-center">
                  <span className="text-gray-300 font-medium text-sm">{vendor}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Frameworks & Certifications */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">Frameworks & Standards</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-5 rounded-lg border border-cyan-500/20 bg-cyan-500/5">
                <h3 className="text-lg font-bold text-cyan-400 mb-2">NIST Cybersecurity</h3>
                <p className="text-gray-400 text-sm">Our security practices align with the NIST Cybersecurity Framework for identify, protect, detect, respond, and recover.</p>
              </div>
              <div className="p-5 rounded-lg border border-cyan-500/20 bg-cyan-500/5">
                <h3 className="text-lg font-bold text-cyan-400 mb-2">Zero Trust Architecture</h3>
                <p className="text-gray-400 text-sm">We implement Zero Trust principles across all client environments — never trust, always verify, least privilege access.</p>
              </div>
              <div className="p-5 rounded-lg border border-cyan-500/20 bg-cyan-500/5">
                <h3 className="text-lg font-bold text-cyan-400 mb-2">ITIL Best Practices</h3>
                <p className="text-gray-400 text-sm">Our service delivery follows ITIL frameworks for incident management, change management, and continuous improvement.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-cyan-500/5 border-y border-cyan-500/20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-12 text-center">Our Core Values</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 rounded-lg border border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 transition">
                <h3 className="text-xl font-bold text-cyan-400 mb-3">Innovation First</h3>
                <p className="text-gray-300">
                  We embrace cutting-edge technologies and continuously explore new ways to solve complex business challenges through AI and automation.
                </p>
              </div>
              <div className="p-6 rounded-lg border border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 transition">
                <h3 className="text-xl font-bold text-cyan-400 mb-3">Reliability</h3>
                <p className="text-gray-300">
                  Your technology is critical to your business. We deliver enterprise-grade reliability with 99.9% uptime SLAs and 24/7 support.
                </p>
              </div>
              <div className="p-6 rounded-lg border border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 transition">
                <h3 className="text-xl font-bold text-cyan-400 mb-3">Partnership</h3>
                <p className="text-gray-300">
                  We're invested in your success. Our team works as an extension of yours, aligned with your goals and committed to your growth.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-cyan-500/5 border-y border-cyan-500/20">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-cyan-400 mb-2">Growing</div>
                <p className="text-gray-300">Client Base</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-cyan-400 mb-2">AI-First</div>
                <p className="text-gray-300">Team Model</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-cyan-400 mb-2">99.9%</div>
                <p className="text-gray-300">Uptime SLA</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-cyan-400 mb-2">20+</div>
                <p className="text-gray-300">Years Experience</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Ready to Transform Your Technology?</h2>
            <p className="text-gray-300 text-lg mb-8">
              Let's discuss how GigitekAI can help your organization modernize, automate, and scale.
            </p>
            <a
              href="/contact"
              className="inline-block px-8 py-3 bg-cyan-500 text-white font-semibold rounded-lg hover:bg-cyan-600 transition"
            >
              Get in Touch
            </a>
          </div>
        </section>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
