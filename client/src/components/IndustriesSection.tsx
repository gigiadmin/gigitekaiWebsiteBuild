/*
  GigitekAI Industries Section — "Find Solutions Designed for Your Industry"
  White background, industry cards grid
  Mirrors appliedtech.us "Focus Industries" section
*/

import { useEffect, useRef, useState } from "react";
import { Heart, DollarSign, Factory, ShoppingCart, Truck, GraduationCap, Building, Landmark } from "lucide-react";

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
    <section id="industries" className="py-20 bg-white dark:bg-[#0F1629]" ref={ref}>
      <div className="container">
        {/* Header */}
        <div
          className={`max-w-2xl mb-14 transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="section-label">Focus Industries</div>
          <h2
            className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight mb-4"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Cloud & AI Solutions Designed for Your Industry
          </h2>
          <p className="text-gray-400 dark:text-gray-300 text-lg leading-relaxed">
            With deep sector expertise across regulated and high-growth industries, GigitekAI delivers technology strategies that align with your specific compliance requirements, operational challenges, and growth objectives.
          </p>
        </div>

        {/* Industry cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {industries.map((industry, i) => {
            const Icon = industry.icon;
            return (
              <div
                key={industry.name}
                className={`group p-6 rounded-xl border border-gray-100 dark:border-[rgba(0,212,255,0.15)] hover:border-[#00D4FF]/30 hover:shadow-lg hover:bg-gray-50 dark:hover:bg-[#141B2D] transition-all duration-300 cursor-pointer ${
                  visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <div className="w-10 h-10 rounded-lg bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center mb-4 group-hover:bg-[#00D4FF]/15 transition-colors">
                  <Icon size={18} className="text-[#00D4FF]" />
                </div>
                <h3
                  className="text-gray-900 dark:text-white font-bold text-sm mb-2 group-hover:text-[#00D4FF] transition-colors"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {industry.name}
                </h3>
                <p className="text-gray-500 dark:text-gray-300 text-xs leading-relaxed">{industry.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
