/*
  GigitekAI Benefits Section — Professional Enterprise Layout
  Full-width centering, proper spacing, Fortune 100 quality
*/

import { useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";

const TEAM_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663509163804/mmTCDMc2kTTVcTkwoY8f9U/gigitekai-team-cta-PY3uvsu8QsxmiZuTiMiXda.webp";

const benefits = [
  "Reduce operational costs by up to 40% with optimized cloud architecture",
  "Deploy AI models 10x faster with our pre-built enterprise frameworks",
  "24/7 monitoring and proactive incident response across all environments",
  "Compliance-ready infrastructure for HIPAA, SOC 2, PCI-DSS, and CMMC",
  "Dedicated cloud architects and AI engineers embedded in your team",
];

export default function BenefitsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative w-full bg-[#0A0E1A] py-20 sm:py-32 lg:py-40">
      {/* Background gradient */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#00D4FF]/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center" ref={ref}>
            {/* Image side */}
            <div
              className={`relative rounded-2xl overflow-hidden h-96 md:h-[420px] transition-all duration-700 ${
                visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
              }`}
            >
              <img src={TEAM_IMG} alt="GigitekAI team collaborating" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
              {/* Overlay card */}
              <div className="absolute bottom-6 left-6 right-6 bg-[#0A0E1A]/90 backdrop-blur-sm border border-[#00D4FF]/30 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#00D4FF]/20 flex items-center justify-center text-[#00D4FF] text-lg">
                    🤖
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      AI-Driven Insights
                    </p>
                    <p className="text-gray-400 text-xs">Real-time analytics powering smarter decisions</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Text side */}
            <div
              className={`transition-all duration-700 delay-200 ${visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}
            >
              <div className="inline-flex items-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-[#00D4FF]" />
                <span className="text-xs font-semibold uppercase tracking-widest text-[#00D4FF]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Benefits of Cloud & AI
                </span>
              </div>
              <h2
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Drive Better Business Outcomes
              </h2>
              <p className="text-lg text-gray-400 leading-relaxed mb-8">
                Technology shouldn't be a burden — it should be your competitive advantage. GigitekAI's cloud and AI solutions give you the infrastructure and intelligence to evolve your business for sustained growth.
              </p>

              {/* Benefits list */}
              <div className="space-y-4">
                {benefits.map((benefit, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 size={24} className="text-[#00D4FF] flex-shrink-0 mt-1" />
                    <p className="text-gray-300 leading-relaxed">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
