/*
  GigitekAI Who We Serve Section — "Solutions Built for You"
  Dark background, left text + right option cards
  Mirrors appliedtech.us "IT Support Built for You" section
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
    <section className="py-20 bg-gray-50 dark:bg-[#0F1629]" ref={ref}>
      <div className="container">
        <div className="grid lg:grid-cols-5 gap-12 items-start">
          {/* Left text */}
          <div
            className={`lg:col-span-2 transition-[opacity,transform] duration-700 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="section-label">Solutions Built for You</div>
            <h2
              className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight mb-6"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              GigitekAI Makes Your Business Stronger
            </h2>
            <p className="text-gray-300 text-lg leading-relaxed mb-6">
              Whether you're a startup scaling fast, an enterprise modernizing legacy systems, or a regulated business navigating compliance — we have the cloud and AI expertise to match your exact needs.
            </p>
            <a href="/contact" className="btn-outline-cyan text-sm">
              Find Your Solution
            </a>
          </div>

          {/* Right option cards */}
          <div className="lg:col-span-3 space-y-4">
            {options.map((option, i) => {
              const Icon = option.icon;
              return (
                <div
                  key={option.title}
                  className={`bg-white dark:bg-[#141B2D] border border-gray-200 dark:border-[rgba(0,212,255,0.15)] hover:border-[#00D4FF]/30 hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(0,212,255,0.1)] rounded-xl p-6 group cursor-pointer transition-[opacity,transform] duration-500 ${
                    visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
                  }`}
                  style={{ transitionDelay: `${200 + i * 100}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="hex-icon flex-shrink-0">
                      <Icon size={20} />
                    </div>
                    <div className="flex-1">
                      <h3
                        className="text-gray-900 dark:text-white font-bold text-lg mb-2 group-hover:text-[#00D4FF] transition-colors"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        {option.title}
                      </h3>
                      <p className="text-gray-300 text-sm leading-relaxed mb-3">
                        {option.description}
                      </p>
                      <a
                        href="/contact"
                        className="inline-flex items-center gap-1 text-sm font-semibold text-[#00D4FF] hover:gap-2 transition-colors"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        {option.cta} <ArrowRight size={14} />
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
