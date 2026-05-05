/*
  GigitekAI Benefits Section — Fortune 500 Quality Professional Design
  - Professional split layout with image and text
  - Enhanced typography hierarchy and spacing
  - Professional benefit cards with icons
  - Smooth animations and transitions
*/

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, TrendingUp, Zap, Shield, Users } from "lucide-react";

const TEAM_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663509163804/mmTCDMc2kTTVcTkwoY8f9U/gigitekai-team-cta-PY3uvsu8QsxmiZuTiMiXda.webp";

const benefits = [
  {
    icon: TrendingUp,
    title: "Reduce Costs",
    description: "Reduce operational costs by up to 40% with optimized cloud architecture",
  },
  {
    icon: Zap,
    title: "Deploy Faster",
    description: "Deploy AI models 10x faster with our pre-built enterprise frameworks",
  },
  {
    icon: Shield,
    title: "24/7 Monitoring",
    description: "24/7 monitoring and proactive incident response across all environments",
  },
  {
    icon: Users,
    title: "Compliance Ready",
    description: "Compliance-ready infrastructure for HIPAA, SOC 2, PCI-DSS, and CMMC",
  },
];

export default function BenefitsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-24 bg-[#0A0E1A]">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-16 items-center" ref={ref}>
          {/* Image side - Professional styling */}
          <div
            className={`relative rounded-2xl overflow-hidden h-[480px] shadow-2xl transition-all duration-700 group ${
              visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
          >
            <img
              src={TEAM_IMG}
              alt="GigitekAI team collaborating on cloud and AI solutions"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            
            {/* Professional gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E1A]/80 via-transparent to-transparent" />
            
            {/* Overlay card with professional styling */}
            <div className="absolute bottom-8 left-8 right-8 bg-[#0F1629]/95 backdrop-blur-md border border-[rgba(0,212,255,0.2)] rounded-xl p-6 shadow-2xl hover:border-[rgba(0,212,255,0.4)] transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#00D4FF]/30 to-[#00D4FF]/10 flex items-center justify-center text-[#00D4FF] text-xl flex-shrink-0">
                  🤖
                </div>
                <div>
                  <p className="text-white text-sm font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    AI-Driven Insights
                  </p>
                  <p className="text-gray-400 text-xs mt-1">Real-time analytics powering smarter decisions</p>
                </div>
              </div>
            </div>
          </div>

          {/* Text side - Professional content */}
          <div
            className={`transition-all duration-700 delay-200 ${
              visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            }`}
          >
            <div className="section-label mb-6">BENEFITS OF CLOUD & AI</div>
            
            <h2
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-8"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Drive Better Business Outcomes
            </h2>
            
            <p className="text-gray-400 text-lg leading-relaxed mb-12">
              Technology shouldn't be a burden — it should be your competitive advantage. GigitekAI's cloud and AI solutions give you the infrastructure and intelligence to evolve your business for sustained growth.
            </p>

            {/* Benefits grid with professional styling */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
              {benefits.map((benefit, i) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={i}
                    className={`bg-[#0F1629] border border-[rgba(0,212,255,0.15)] rounded-lg p-6 hover:border-[rgba(0,212,255,0.3)] hover:shadow-lg transition-all duration-300 group/card ${
                      visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                    }`}
                    style={{ transitionDelay: `${300 + i * 100}ms` }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00D4FF]/20 to-[#00D4FF]/5 flex items-center justify-center flex-shrink-0 group-hover/card:from-[#00D4FF]/30 transition-colors duration-300">
                        <Icon size={20} className="text-[#00D4FF]" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-sm mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                          {benefit.title}
                        </h3>
                        <p className="text-gray-400 text-xs leading-relaxed">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA Button */}
            <a 
              href="/contact" 
              className="btn-cyan inline-flex items-center gap-2 font-semibold px-8 py-3.5 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              Start Your Transformation
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-label="Arrow icon">
                <path d="M1 8H15M8 1L15 8L8 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
