/*
  GigitekAI Industries Section — Fortune 500 Quality Professional Design
  - Professional card grid with enhanced styling
  - Improved typography hierarchy and spacing
  - Professional hover effects and transitions
  - Industry-specific icons and descriptions
*/

import { useEffect, useRef, useState } from "react";
import { Heart, DollarSign, Factory, ShoppingCart, Truck, GraduationCap, Building, Landmark, ArrowRight } from "lucide-react";

const industries = [
  { icon: Heart, name: "Healthcare & Life Sciences", desc: "HIPAA-compliant cloud infrastructure and AI diagnostics for healthcare providers and biotech firms." },
  { icon: DollarSign, name: "Financial Services", desc: "Secure, compliant cloud platforms and AI-powered risk analytics for banks, insurers, and fintechs." },
  { icon: Factory, name: "Manufacturing", desc: "IoT-connected cloud systems and predictive AI for smart manufacturing and supply chain optimization." },
  { icon: ShoppingCart, name: "Retail & eCommerce", desc: "Scalable cloud commerce platforms and AI personalization engines that drive customer loyalty." },
  { icon: Truck, name: "Logistics & Transportation", desc: "Real-time cloud tracking and AI route optimization for modern logistics operations." },
  { icon: GraduationCap, name: "Education", desc: "Cloud-native learning platforms and AI tutoring systems that transform the educational experience." },
  { icon: Building, name: "Real Estate & PropTech", desc: "Data-driven cloud platforms and AI valuation tools for modern real estate businesses." },
  { icon: Landmark, name: "Government & Public Sector", desc: "FedRAMP-compliant cloud solutions and AI analytics for government agencies at all levels." },
];

export default function IndustriesSection() {
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
    <section id="industries" className="py-24 bg-[#0A0E1A]" ref={ref}>
      <div className="container">
        {/* Header */}
        <div
          className={`max-w-3xl mb-16 transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="section-label mb-6">FOCUS INDUSTRIES</div>
          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Cloud & AI Solutions Designed for Your Industry
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            With deep sector expertise across regulated and high-growth industries, GigitekAI delivers technology strategies that align with your specific compliance requirements, operational challenges, and growth objectives.
          </p>
        </div>

        {/* Industry cards grid - Professional 4-column layout */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {industries.map((industry, i) => {
            const Icon = industry.icon;
            return (
              <div
                key={industry.name}
                className={`group relative bg-gradient-to-br from-[#0F1629] to-[#141B2D] p-8 rounded-lg border border-[rgba(0,212,255,0.15)] hover:border-[rgba(0,212,255,0.3)] hover:shadow-2xl hover:shadow-[#00D4FF]/10 transition-all duration-300 cursor-pointer overflow-hidden ${
                  visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                {/* Background gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#00D4FF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                
                {/* Content */}
                <div className="relative z-10">
                  {/* Icon container */}
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#00D4FF]/20 to-[#00D4FF]/5 border border-[#00D4FF]/30 flex items-center justify-center mb-6 group-hover:border-[#00D4FF]/50 group-hover:from-[#00D4FF]/30 transition-all duration-300">
                    <Icon size={24} className="text-[#00D4FF]" />
                  </div>

                  {/* Title */}
                  <h3
                    className="text-white font-bold text-base mb-3 group-hover:text-[#00D4FF] transition-colors duration-300"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {industry.name}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-400 text-sm leading-relaxed mb-6">
                    {industry.desc}
                  </p>

                  {/* Arrow indicator */}
                  <div className="flex items-center gap-2 text-[#00D4FF] text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Learn More
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-200" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
