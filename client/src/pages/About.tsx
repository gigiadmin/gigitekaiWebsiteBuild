/*
  GigitekAI About Page
*/

import { useLocation } from "wouter";
import SiteNavBar2024 from "@/components/SiteNavBar2024";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { ArrowLeft, Users, Target, Zap } from "lucide-react";

export default function About() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNavBar2024 />
      <main className="flex-1">
        {/* Header */}
        <section className="py-16 bg-white border-b border-gray-100">
          <div className="container">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-[#00D4FF] hover:gap-3 transition-all mb-6"
            >
              <ArrowLeft size={18} />
              Back to Home
            </button>
            <h1
              className="text-5xl font-bold text-gray-900 mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              About GigitekAI
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl">
              Enterprise cloud infrastructure and AI solutions built by engineers who understand what it takes to scale.
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="py-16 bg-gray-50">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2
                  className="text-4xl font-bold text-gray-900 mb-6"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Our Mission
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed mb-4">
                  At GigitekAI, we believe that technology should be a competitive advantage, not a burden. We're on a mission to help enterprises harness the power of cloud infrastructure and artificial intelligence to drive measurable business outcomes.
                </p>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Founded in 2024 by Harry Henry Santiago — a Microsoft 365 Subject Matter Expert with 20+ years of enterprise IT experience and a U.S. Army veteran — GigitekAI brings deep technical expertise combined with genuine business acumen. We don't just implement technology — we partner with our clients to transform how they operate.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-8 border border-gray-100">
                <div className="space-y-6">
                  {[
                    { icon: Users, title: "Team-First Approach", desc: "We embed our engineers in your team" },
                    { icon: Target, title: "Results-Driven", desc: "Every project is measured by business impact" },
                    { icon: Zap, title: "Innovation-Focused", desc: "We stay ahead of the curve on emerging tech" },
                  ].map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="flex gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center flex-shrink-0">
                        <Icon size={18} className="text-[#00D4FF]" />
                      </div>
                      <div>
                        <h4
                          className="font-bold text-gray-900"
                          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                        >
                          {title}
                        </h4>
                        <p className="text-gray-600 text-sm">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16 bg-white">
          <div className="container">
            <h2
              className="text-4xl font-bold text-gray-900 mb-12 text-center"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Why Choose GigitekAI?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Microsoft 365 Deep Expertise",
                  desc: "Our founder is a certified Microsoft 365 SME with 20+ years in Exchange Online, Entra ID, Teams, and hybrid cloud migrations.",
                },
                {
                  title: "Enterprise-Proven",
                  desc: "We've delivered solutions for organizations ranging from mid-size businesses to Fortune 500 enterprises with 100,000+ users.",
                },
                {
                  title: "Security-First",
                  desc: "We specialize in email security (Proofpoint, SPF/DKIM/DMARC), Zero Trust architecture, and Microsoft Purview compliance.",
                },
                {
                  title: "AI-First Approach",
                  desc: "We don't just migrate to the cloud — we architect for AI from day one.",
                },
                {
                  title: "Dedicated Partnership",
                  desc: "You get a dedicated cloud architect and account manager who understands your business.",
                },
                {
                  title: "Measurable ROI",
                  desc: "We focus on delivering tangible business outcomes: cost savings, performance gains, and competitive advantage.",
                },
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-xl border border-gray-100 hover:border-[#00D4FF]/30 hover:shadow-lg transition-all">
                  <h3
                    className="font-bold text-gray-900 mb-2"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gray-50">
          <div className="container text-center">
            <h2
              className="text-3xl font-bold text-gray-900 mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Ready to Partner with GigitekAI?
            </h2>
            <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
              Let's discuss how we can help you accelerate your cloud and AI transformation.
            </p>
            <button
              onClick={() => navigate("/#contact")}
              className="btn-cyan"
            >
              Get in Touch
            </button>
          </div>
        </section>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
