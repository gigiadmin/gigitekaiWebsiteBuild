/*
  GigitekAI Benefits Section — Deloitte-Inspired Professional Design
  - Clean split layout with proper spacing
  - Professional font sizes
*/

import { useEffect, useRef, useState } from "react";
import { TrendingUp, Zap, Shield, Users, ArrowRight } from "lucide-react";

const TEAM_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663509163804/mmTCDMc2kTTVcTkwoY8f9U/gigitekai-team-cta-PY3uvsu8QsxmiZuTiMiXda.webp";

const benefits = [
  {
    icon: TrendingUp,
    title: "Reduce Costs",
    description: "Up to 40% reduction in operational costs with optimized cloud architecture",
  },
  {
    icon: Zap,
    title: "Deploy Faster",
    description: "10x faster AI model deployment with pre-built enterprise frameworks",
  },
  {
    icon: Shield,
    title: "24/7 Monitoring",
    description: "Proactive incident response across all environments",
  },
  {
    icon: Users,
    title: "Compliance Ready",
    description: "HIPAA, SOC 2, PCI-DSS, and CMMC compliant infrastructure",
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
    <section className="py-20 lg:py-28 bg-[#0A0E1A]">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center" ref={ref}>
          {/* Image side */}
          <div
            className={`relative rounded-xl overflow-hidden h-[400px] lg:h-[480px] transition-all duration-700 group ${
              visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"
            }`}
          >
            <img
              src={TEAM_IMG}
              alt="GigitekAI team collaborating on cloud and AI solutions"
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E1A]/70 via-transparent to-transparent" />
            
            {/* Overlay card */}
            <div className="absolute bottom-6 left-6 right-6 bg-[#0F1629]/90 backdrop-blur-sm border border-[rgba(0,212,255,0.15)] rounded-lg p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center text-lg flex-shrink-0">
                  🤖
                </div>
                <div>
                  <p className="text-white text-sm font-bold">AI-Driven Insights</p>
                  <p className="text-gray-400 text-xs mt-0.5">Real-time analytics powering smarter decisions</p>
                </div>
              </div>
            </div>
          </div>

          {/* Text side */}
          <div
            className={`transition-all duration-700 delay-200 ${
              visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6"
            }`}
          >
            <div className="section-label mb-4">BENEFITS OF CLOUD & AI</div>
            
            <h2
              className="text-3xl lg:text-4xl font-bold text-white leading-tight mb-5"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Drive Better Business Outcomes
            </h2>
            
            <p className="text-gray-400 text-base leading-relaxed mb-8">
              Technology shouldn't be a burden — it should be your competitive advantage. GigitekAI's cloud and AI solutions give you the infrastructure and intelligence to evolve your business.
            </p>

            {/* Benefits grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {benefits.map((benefit, i) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={i}
                    className={`bg-[#0F1629] border border-[rgba(0,212,255,0.08)] rounded-lg p-5 hover:border-[rgba(0,212,255,0.2)] transition-all duration-300 ${
                      visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                    }`}
                    style={{ transitionDelay: `${300 + i * 80}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center flex-shrink-0">
                        <Icon size={18} className="text-[#00D4FF]" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-sm mb-1">{benefit.title}</h3>
                        <p className="text-gray-400 text-xs leading-relaxed">{benefit.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <a 
              href="/contact" 
              className="btn-cyan inline-flex items-center gap-2 font-semibold px-6 py-3 text-sm rounded-lg hover:scale-[1.02] transition-transform"
            >
              Start Your Transformation
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
