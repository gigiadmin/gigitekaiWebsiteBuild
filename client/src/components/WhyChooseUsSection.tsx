/*
  Why Choose Us Section — Core Values & Expertise
  Highlights GigitekAI's competitive advantages and core competencies
*/

import { Shield, Zap, Users, TrendingUp, Lock, Headphones } from "lucide-react";

const coreValues = [
  {
    icon: Shield,
    title: "Security-First Approach",
    description: "Zero Trust architecture, HIPAA/SOC 2/PCI-DSS compliance, and governed AI—not experimentation.",
  },
  {
    icon: Zap,
    title: "AI Agents as Employees",
    description: "Intelligent automation that replaces manual workflows. Multi-system provisioning in ~3.4 seconds.",
  },
  {
    icon: Users,
    title: "Dedicated Support",
    description: "24/7 AI-powered helpdesk with human escalation. Your success is our mission.",
  },
  {
    icon: TrendingUp,
    title: "Proven ROI",
    description: "40% operational cost reduction, 280+ hours freed monthly, 3-4 month payback period.",
  },
  {
    icon: Lock,
    title: "Enterprise-Grade Infrastructure",
    description: "99.9% uptime SLA, multi-cloud support (AWS, Azure, Google Cloud), and compliance-ready.",
  },
  {
    icon: Headphones,
    title: "Industry Expertise",
    description: "Deep experience with healthcare, legal, construction, and financial services firms.",
  },
];

export default function WhyChooseUsSection() {
  return (
    <section className="py-20 bg-[#0A0E1A]">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-cyan-400 text-sm font-semibold uppercase tracking-widest mb-3">Why Choose GigitekAI</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Built for Modern MSPs & Enterprises
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            We combine security-first principles, AI-driven automation, and enterprise reliability to deliver measurable business outcomes.
          </p>
        </div>

        {/* Core Values Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {coreValues.map((value, index) => {
            const Icon = value.icon;
            return (
              <div
                key={index}
                className="group relative overflow-hidden rounded-xl border border-gray-700 bg-gradient-to-br from-gray-900/50 to-black/50 p-8 hover:border-cyan-500/50 transition-all duration-300"
              >
                {/* Background accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-3xl -mr-16 -mt-16 group-hover:from-cyan-500/20 transition-all duration-300" />

                <div className="relative z-10">
                  {/* Icon */}
                  <div className="mb-4">
                    <Icon className="w-10 h-10 text-cyan-400" />
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-white mb-3">{value.title}</h3>

                  {/* Description */}
                  <p className="text-gray-400 text-sm leading-relaxed">{value.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-300 mb-6">
            Ready to transform your IT operations with AI-first managed services?
          </p>
          <a
            href="/contact"
            className="inline-block px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-black font-semibold rounded-lg transition-colors duration-300"
          >
            Get Started Today
          </a>
        </div>
      </div>
    </section>
  );
}
