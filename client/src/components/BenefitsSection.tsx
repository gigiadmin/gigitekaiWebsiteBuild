/*
  GigitekAI Benefits Section — "Use Our Solutions for Better Business Outcomes"
  Dark background, split layout (text left, visual right)
  Mirrors appliedtech.us "Benefits of IT Support Services" section
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
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-20 bg-gray-100 dark:bg-[#0A0E1A]">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-16 items-center" ref={ref}>
          {/* Image side */}
          <div
            className={`relative rounded-2xl overflow-hidden h-[420px] transition-all duration-700 ${
              visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
          >
            <img
              src={TEAM_IMG}
              alt="GigitekAI team collaborating"
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Overlay card */}
            <div className="absolute bottom-6 left-6 right-6 bg-white/90 dark:bg-[#0A0E1A]/90 backdrop-blur-sm border border-gray-200 dark:border-[rgba(0,212,255,0.2)] rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#00D4FF]/20 flex items-center justify-center text-[#00D4FF] text-lg">
                  🤖
                </div>
                <div>
                  <p className="text-gray-900 dark:text-white text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    AI-Driven Insights
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">Real-time analytics powering smarter decisions</p>
                </div>
              </div>
            </div>
          </div>

          {/* Text side */}
          <div
            className={`transition-all duration-700 delay-200 ${
              visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            }`}
          >
            <div className="section-label">Benefits of Cloud & AI</div>
            <h2
              className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight mb-6"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Drive Better Business Outcomes with Intelligent Technology
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-8">
              Technology shouldn't be a burden — it should be your competitive advantage. GigitekAI's cloud and AI solutions give you the infrastructure and intelligence to evolve your business for sustained growth.
            </p>

            <ul className="space-y-4 mb-8">
              {benefits.map((benefit, i) => (
                <li
                  key={i}
                  className={`flex items-start gap-3 transition-all duration-500 ${
                    visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                  style={{ transitionDelay: `${300 + i * 80}ms` }}
                >
                  <CheckCircle2 size={20} className="text-[#00D4FF] mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{benefit}</span>
                </li>
              ))}
            </ul>

            <a href="/contact" className="btn-cyan">
              Start Your Transformation
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-label="Arrow icon">
                <path d="M1 8H15M8 1L15 8L8 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
