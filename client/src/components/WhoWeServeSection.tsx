/*
  GigitekAI Who We Serve Section — Deloitte-Style Professional Design
  - Professional option cards with enhanced styling
  - +25% larger font sizes
  - Massive whitespace and professional spacing
  - Clean minimal design
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
    <section className="py-40 lg:py-56 bg-white dark:bg-[#0A0E1A]" ref={ref}>
      <div className="container">
        <div className="grid lg:grid-cols-5 gap-24 items-start">
          {/* Left text - Professional header - +25% larger */}
          <div
            className={`lg:col-span-2 transition-all duration-700 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="section-label mb-8">SOLUTIONS BUILT FOR YOU</div>
            <h2
              className="text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white leading-tight mb-10"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              GigitekAI Makes Your Business Stronger
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-xl leading-relaxed mb-12">
              Whether you're a startup scaling fast, an enterprise modernizing legacy systems, or a regulated business navigating compliance — we have the cloud and AI expertise to match your exact needs.
            </p>
            <a href="/contact" className="btn-cyan inline-flex items-center gap-3 font-semibold px-10 py-4 text-lg rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200">
              Find Your Solution
              <ArrowRight size={22} />
            </a>
          </div>

          {/* Right option cards - Professional styling - +25% larger */}
          <div className="lg:col-span-3 space-y-8">
            {options.map((option, i) => {
              const Icon = option.icon;
              return (
                <div
                  key={option.title}
                  className={`bg-white dark:bg-[#0F1629] border border-gray-200 dark:border-[rgba(0,212,255,0.15)] hover:border-gray-300 dark:hover:border-[rgba(0,212,255,0.3)] hover:shadow-lg dark:hover:shadow-[#00D4FF]/10 rounded-lg p-12 group cursor-pointer transition-all duration-300 overflow-hidden ${
                    visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
                  }`}
                  style={{ transitionDelay: `${200 + i * 100}ms` }}
                >
                  {/* Content */}
                  <div className="relative z-10 flex items-start gap-8">
                    {/* Icon container - +25% larger */}
                    <div className="w-16 h-16 rounded-lg bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center flex-shrink-0 group-hover:border-[#00D4FF]/50 transition-all duration-300">
                      <Icon size={28} className="text-[#00D4FF]" />
                    </div>
                    
                    {/* Text content - +25% larger */}
                    <div className="flex-1">
                      <h3
                        className="text-gray-900 dark:text-white font-bold text-xl mb-4 group-hover:text-[#00D4FF] transition-colors duration-300"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        {option.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-6">
                        {option.description}
                      </p>
                      <a
                        href="/contact"
                        className="inline-flex items-center gap-3 text-base font-semibold text-[#00D4FF] hover:text-[#00EEFF] transition-all duration-200 group/link"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        {option.cta}
                        <ArrowRight size={18} className="group-hover/link:translate-x-1 transition-transform duration-200" />
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
