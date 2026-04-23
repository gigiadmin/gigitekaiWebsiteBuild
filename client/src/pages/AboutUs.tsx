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
                Today, GigitekAI serves 500+ clients across North America, with a team of 50+ specialists dedicated to cloud infrastructure, AI implementation, cybersecurity, and IT modernization. We partner with industry leaders including Microsoft, AWS, Google Cloud, and best-in-class security vendors to deliver comprehensive solutions.
              </p>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
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
                <div className="text-4xl font-bold text-cyan-400 mb-2">500+</div>
                <p className="text-gray-300">Clients Transformed</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-cyan-400 mb-2">50+</div>
                <p className="text-gray-300">Team Members</p>
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
