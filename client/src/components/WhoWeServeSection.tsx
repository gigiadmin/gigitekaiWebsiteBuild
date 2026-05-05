/*
  GigitekAI Who We Serve Section — Fortune 500 Quality Professional Design
  - Professional option cards with enhanced styling
  - Improved typography hierarchy and spacing
  - Professional hover effects and transitions
  - Left-right layout with proper alignment
*/

import { useEffect, useRef, useState } from "react";
import { Building2, Users, ShieldCheck, ArrowRight } from "lucide-react";

const options = [
  {
    icon: Building2,
    title: "My IT team needs reinforcement",
    description: "Give your in-house IT team the cloud and AI expertise they need to deliver on ambitious business goals without hiring additional headcount.",
    cta: "Co-Managed Solutions",
  },
  {
    icon: Users,
    title: "I need a full technology partner",
    description: "Growth demands better technology. We become your dedicated cloud and AI team — from strategy to implementation to ongoing management.",
    cta: "Fully Managed Services",
  },
  {
    icon: ShieldCheck,
    title: "We operate in a regulated industry",
    description: "Advanced cloud security and AI governance designed for healthcare, finance, government, and other compliance-heavy sectors.",
    cta: "Regulated Industry Solutions",
  },
];

export default function WhoWeServeSection() {
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
    <section className="py-24 bg-[#0A0E1A]" ref={ref}>
      <div className="container">
        <div className="grid lg:grid-cols-5 gap-16 items-start">
          {/* Left text - Professional header */}
          <div
            className={`lg:col-span-2 transition-all duration-700 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="section-label mb-6">SOLUTIONS BUILT FOR YOU</div>
            <h2
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-8"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              GigitekAI Makes Your Business Stronger
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-10">
              Whether you're a startup scaling fast, an enterprise modernizing legacy systems, or a regulated business navigating compliance — we have the cloud and AI expertise to match your exact needs.
            </p>
            <a href="/contact" className="btn-cyan inline-flex items-center gap-2 font-semibold px-8 py-3.5 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200">
              Find Your Solution
              <ArrowRight size={18} />
            </a>
          </div>

          {/* Right option cards - Professional styling */}
          <div className="lg:col-span-3 space-y-5">
            {options.map((option, i) => {
              const Icon = option.icon;
              return (
                <div
                  key={option.title}
                  className={`bg-gradient-to-br from-[#0F1629] to-[#141B2D] border border-[rgba(0,212,255,0.15)] hover:border-[rgba(0,212,255,0.3)] hover:shadow-2xl hover:shadow-[#00D4FF]/10 rounded-lg p-8 group cursor-pointer transition-all duration-300 overflow-hidden ${
                    visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
                  }`}
                  style={{ transitionDelay: `${200 + i * 100}ms` }}
                >
                  {/* Background gradient on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#00D4FF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  
                  {/* Content */}
                  <div className="relative z-10 flex items-start gap-6">
                    {/* Icon container */}
                    <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-[#00D4FF]/20 to-[#00D4FF]/5 border border-[#00D4FF]/30 flex items-center justify-center flex-shrink-0 group-hover:border-[#00D4FF]/50 group-hover:from-[#00D4FF]/30 transition-all duration-300">
                      <Icon size={24} className="text-[#00D4FF]" />
                    </div>
                    
                    {/* Text content */}
                    <div className="flex-1">
                      <h3
                        className="text-white font-bold text-lg mb-3 group-hover:text-[#00D4FF] transition-colors duration-300"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        {option.title}
                      </h3>
                      <p className="text-gray-400 text-base leading-relaxed mb-5">
                        {option.description}
                      </p>
                      <a
                        href="/contact"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[#00D4FF] hover:text-[#00EEFF] transition-all duration-200 group/link"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        {option.cta}
                        <ArrowRight size={16} className="group-hover/link:translate-x-1 transition-transform duration-200" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
