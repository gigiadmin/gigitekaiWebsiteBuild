/*
  GigitekAI Benefits Section — "Drive Better Business Outcomes"
  Centered layout, single column, professional typography
*/

import { useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";

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
    <section className="py-20 bg-[#0A0E1A]">
      <div className="container max-w-3xl mx-auto px-4" ref={ref}>
        <div className="text-center">
          {/* Label */}
          <div className="section-label mb-6 justify-center">
            BENEFITS OF CLOUD & AI
          </div>

          {/* Heading */}
          <h2
            className={`text-4xl md:text-5xl font-bold text-white leading-tight mb-8 transition-[opacity,transform] duration-700 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Drive Better Business Outcomes with Intelligent Technology
          </h2>

          {/* Description */}
          <p
            className={`text-gray-300 text-lg leading-relaxed mb-12 transition-[opacity,transform] duration-700 delay-100 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            Technology shouldn't be a burden — it should be your competitive advantage. GigitekAI's cloud and AI solutions give you the infrastructure and intelligence to evolve your business for sustained growth.
          </p>

          {/* Benefits List */}
          <ul className="space-y-4 mb-12">
            {benefits.map((benefit, i) => (
              <li
                key={i}
                className={`flex items-start gap-4 transition-[opacity,transform] duration-500 ${
                  visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: `${200 + i * 80}ms` }}
              >
                <CheckCircle2 size={24} className="text-[#00D4FF] mt-1 flex-shrink-0" />
                <span className="text-gray-300 text-base leading-relaxed text-left">{benefit}</span>
              </li>
            ))}
          </ul>

          {/* CTA Button */}
          <div
            className={`transition-[opacity,transform] duration-700 delay-500 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <a href="/contact" className="btn-cyan text-base px-8 py-3 inline-flex items-center gap-2">
              Start Your Transformation
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="5 12 19 12"></polyline>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
