/*
  GigitekAI Services Section — Deloitte-Inspired Professional Design
  - Clean, minimal service cards with proper spacing
  - Professional font sizes (not oversized)
  - Proper whitespace without excess
*/

import { useEffect, useRef, useState } from "react";
import { Cloud, Brain, Shield, TrendingUp, Database, Cpu, ArrowRight, CheckCircle } from "lucide-react";

const services = [
  {
    id: "cloud",
    icon: Cloud,
    title: "Cloud Infrastructure",
    description: "Enterprise cloud migration and management on AWS, Azure, and Google Cloud with cost optimization and 24/7 support.",
    href: "/services/cloud",
    cta: "Explore Cloud Services",
    features: ["Multi-cloud management", "Cost optimization", "24/7 support"],
  },
  {
    id: "ai",
    icon: Brain,
    title: "AI & Machine Learning",
    description: "AI implementation including predictive analytics, business automation, and custom AI models to transform operations.",
    href: "/services/ai",
    cta: "Explore AI Solutions",
    features: ["Predictive analytics", "Business automation", "Custom AI models"],
  },
  {
    id: "security",
    icon: Shield,
    title: "Cybersecurity",
    description: "Enterprise cybersecurity with threat detection, compliance management, and data protection frameworks.",
    href: "/services/security",
    cta: "Explore Cybersecurity",
    features: ["Threat detection", "Compliance management", "Data protection"],
  },
  {
    id: "strategy",
    icon: TrendingUp,
    title: "IT Strategy & Growth",
    description: "Align technology investments with business goals through proactive planning, roadmapping, and vCIO advisory.",
    href: "/services/strategy",
    cta: "Explore IT Strategy",
    features: ["Strategic planning", "Roadmapping", "vCIO services"],
  },
  {
    id: "data",
    icon: Database,
    title: "Data & Analytics",
    description: "Modern data warehousing, predictive analytics, and AI-powered insights for enterprise decision-making.",
    href: "/services/data",
    cta: "Explore Data Analytics",
    features: ["Data warehousing", "BI solutions", "AI insights"],
  },
  {
    id: "managed",
    icon: Cpu,
    title: "Managed IT Services",
    description: "24/7 monitoring, helpdesk support, and proactive maintenance for your cloud infrastructure and business systems.",
    href: "/services/managed",
    cta: "Explore Managed IT",
    features: ["24/7 monitoring", "Helpdesk support", "Proactive maintenance"],
  },
];

function ServiceCard({ service, index }: { service: typeof services[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const Icon = service.icon;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      id={service.id}
      ref={ref}
      className={`group relative bg-[#0F1629] rounded-xl border border-[rgba(0,212,255,0.08)] p-8 hover:border-[rgba(0,212,255,0.2)] transition-all duration-300 scroll-mt-24 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      {/* Icon */}
      <div className="w-12 h-12 rounded-lg bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center mb-5 group-hover:border-[#00D4FF]/40 transition-colors">
        <Icon size={24} className="text-[#00D4FF]" />
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#00D4FF] transition-colors" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        {service.title}
      </h3>

      {/* Description */}
      <p className="text-gray-400 text-sm leading-relaxed mb-6">
        {service.description}
      </p>

      {/* Features */}
      <div className="space-y-2 mb-6">
        {service.features.map((feature, idx) => (
          <div key={idx} className="flex items-center gap-2 text-sm text-gray-300">
            <CheckCircle size={14} className="text-[#00D4FF] flex-shrink-0" />
            <span>{feature}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <a
        href={service.href}
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#00D4FF] hover:text-[#00EEFF] transition-colors group/link"
      >
        {service.cta}
        <ArrowRight size={16} className="group-hover/link:translate-x-1 transition-transform" />
      </a>
    </div>
  );
}

export default function ServicesSection() {
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
    <section id="services" className="py-20 lg:py-28 bg-[#0A0E1A]">
      <div className="container">
        {/* Section Header */}
        <div className="grid lg:grid-cols-2 gap-12 items-end mb-16">
          <div ref={ref}>
            <div className={`section-label mb-4 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              WHAT WE DO
            </div>
            <h2
              className={`text-3xl lg:text-4xl font-bold text-white leading-tight transition-all duration-700 delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Enterprise Solutions
            </h2>
          </div>
          <div className={`transition-all duration-700 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <p className="text-gray-400 text-base leading-relaxed mb-6">
              GigitekAI provides enterprise cloud infrastructure, AI solutions, and managed services on AWS, Azure, and Google Cloud to accelerate growth.
            </p>
            <a href="/services" className="btn-cyan inline-flex items-center gap-2 font-semibold px-6 py-3 text-sm rounded-lg hover:scale-[1.02] transition-transform">
              Explore All Capabilities <ArrowRight size={16} />
            </a>
          </div>
        </div>

        {/* Service Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {services.map((service, i) => (
            <ServiceCard key={service.title} service={service} index={i} />
          ))}
        </div>

        {/* Helpdesk Pricing CTA */}
        <div className="bg-[#0F1629] border border-[rgba(0,212,255,0.1)] rounded-xl p-8 lg:p-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                24/7 Managed Help Desk
              </h3>
              <p className="text-gray-400 text-sm mb-2">
                Three pricing tiers: Essential ($69/user/month), Professional ($119/user/month), Elite ($189/user/month)
              </p>
              <p className="text-xs text-gray-500">
                ✓ Volume discounts available • ✓ No hidden fees • ✓ Flat monthly rates
              </p>
            </div>
            <a href="/helpdesk-pricing" className="btn-cyan whitespace-nowrap font-semibold flex items-center gap-2 px-6 py-3 text-sm rounded-lg hover:scale-[1.02] transition-transform">
              View Pricing <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
