/*
  GigitekAI Services Section — Fortune 500 Quality Professional Design
  - Professional card styling with depth and hover effects
  - Enhanced typography hierarchy and spacing
  - Visual showcase with professional overlays
  - Proper responsive design for all devices
*/

import { useEffect, useRef, useState } from "react";
import { Cloud, Brain, Shield, TrendingUp, Database, Cpu, ArrowRight, CheckCircle } from "lucide-react";

const CLOUD_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663509163804/mmTCDMc2kTTVcTkwoY8f9U/gigitekai-cloud-services-RDPBQDkRZRbpsWy2UNcbqf.webp";
const AI_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663509163804/mmTCDMc2kTTVcTkwoY8f9U/gigitekai-ai-solutions-BoVHfmFw3tdkqwMF7iT2YX.webp";

const services = [
  {
    id: "cloud",
    icon: Cloud,
    title: "Cloud Infrastructure",
    description: "Enterprise cloud migration and management services on AWS, Azure, and Google Cloud. Our cloud infrastructure solutions deliver scalable, resilient cloud computing with cost optimization and 24/7 support.",
    href: "/services/cloud",
    cta: "Explore Cloud Services",
    features: ["Multi-cloud management", "Cost optimization", "24/7 support"],
  },
  {
    id: "ai",
    icon: Brain,
    title: "AI & Machine Learning",
    description: "AI implementation and machine learning solutions including predictive analytics, business automation, and custom AI models. Transform your business with AI-powered intelligence and intelligent automation.",
    href: "/services/ai",
    cta: "Explore AI Solutions",
    features: ["Predictive analytics", "Business automation", "Custom AI models"],
  },
  {
    id: "security",
    icon: Shield,
    title: "Cybersecurity",
    description: "Enterprise cybersecurity solutions with cloud security services, threat detection, compliance management, and data protection frameworks for secure cloud infrastructure.",
    href: "/services/security",
    cta: "Explore Cybersecurity",
    features: ["Threat detection", "Compliance management", "Data protection"],
  },
  {
    id: "strategy",
    icon: TrendingUp,
    title: "IT Strategy & Growth",
    description: "Align technology investments with business goals through proactive planning, roadmapping, and vCIO advisory services.",
    href: "/services/strategy",
    cta: "Explore IT Strategy",
    features: ["Strategic planning", "Roadmapping", "vCIO services"],
  },
  {
    id: "data",
    icon: Database,
    title: "Data & Analytics",
    description: "Data analytics and business intelligence solutions with modern data warehousing, predictive analytics, and AI-powered insights for enterprise decision-making.",
    href: "/services/data",
    cta: "Explore Data Analytics",
    features: ["Data warehousing", "BI solutions", "AI insights"],
  },
  {
    id: "managed",
    icon: Cpu,
    title: "Managed IT Services",
    description: "Managed IT services and enterprise IT solutions with 24/7 monitoring, helpdesk support, and proactive maintenance for your cloud infrastructure and business systems.",
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
      className={`group relative bg-[#0F1629] rounded-xl border border-[rgba(0,212,255,0.15)] p-8 shadow-lg hover:shadow-2xl hover:border-[rgba(0,212,255,0.3)] transition-all duration-300 scroll-mt-24 overflow-hidden ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      {/* Gradient background on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#00D4FF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Icon container with professional styling */}
        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-[#00D4FF]/20 to-[#00D4FF]/5 border border-[#00D4FF]/30 flex items-center justify-center mb-6 group-hover:border-[#00D4FF]/50 transition-all duration-300">
          <Icon size={28} className="text-[#00D4FF]" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#00D4FF] transition-colors duration-300" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {service.title}
        </h3>

        {/* Description */}
        <p className="text-gray-400 text-base leading-relaxed mb-6">
          {service.description}
        </p>

        {/* Features list */}
        <div className="space-y-2 mb-8">
          {service.features.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-gray-300">
              <CheckCircle size={16} className="text-[#00D4FF] flex-shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        {/* CTA Link */}
        <a
          href={service.href}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#00D4FF] hover:text-[#00EEFF] transition-all duration-200 group/link"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {service.cta}
          <ArrowRight size={16} className="group-hover/link:translate-x-1 transition-transform duration-200" />
        </a>
      </div>
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
    <section id="services" className="py-24 bg-[#0A0E1A]">
      <div className="container">
        {/* Section Header */}
        <div className="grid lg:grid-cols-2 gap-12 items-start mb-20">
          <div ref={ref}>
            <div className={`section-label transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              WHAT WE DO
            </div>
            <h2
              className={`text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight transition-all duration-700 delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Enterprise Solutions
            </h2>
          </div>
          <div className={`transition-all duration-700 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <p className="text-gray-400 text-lg leading-relaxed mb-8">
              GigitekAI provides enterprise cloud infrastructure, AI solutions, and machine learning services on AWS, Azure, and Google Cloud. Our cloud computing expertise includes cloud migration, digital transformation, and business automation to accelerate growth.
            </p>
            <a href="/services" className="btn-cyan inline-flex items-center gap-2 font-semibold">
              Explore All Capabilities <ArrowRight size={18} />
            </a>
          </div>
        </div>

        {/* Service Cards Grid - Professional 3-column layout */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {services.map((service, i) => (
            <ServiceCard key={service.title} service={service} index={i} />
          ))}
        </div>

        {/* Helpdesk Pricing CTA - Professional styling */}
        <div className="mb-20 bg-gradient-to-r from-[#0F1629] to-[#141B2D] border border-[rgba(0,212,255,0.2)] rounded-xl p-10 shadow-lg hover:shadow-xl hover:border-[rgba(0,212,255,0.4)] transition-all duration-300">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                24/7 Managed Help Desk
              </h3>
              <p className="text-gray-400 text-lg mb-3">
                Three pricing tiers: Essential ($69/user/month), Professional ($119/user/month), Elite ($189/user/month)
              </p>
              <p className="text-sm text-gray-500">
                ✓ Volume discounts available • ✓ No hidden fees • ✓ Flat monthly rates
              </p>
            </div>
            <a href="/helpdesk-pricing" className="btn-cyan whitespace-nowrap font-semibold flex items-center gap-2 px-8 py-3.5">
              View Pricing <ArrowRight size={18} />
            </a>
          </div>
        </div>

        {/* Visual showcase - Professional image cards */}
        <div className="grid md:grid-cols-2 gap-8 rounded-2xl overflow-hidden">
          <div className="relative h-64 md:h-80 overflow-hidden rounded-xl group cursor-pointer">
            <img
              src={CLOUD_IMG}
              alt="Cloud Infrastructure - AWS, Azure, Google Cloud services for enterprise digital transformation"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E1A]/90 via-[#0A0E1A]/40 to-transparent flex items-end p-8">
              <div>
                <p className="text-[#00D4FF] text-xs font-semibold uppercase tracking-widest mb-2">Cloud Infrastructure</p>
                <p className="text-white font-bold text-2xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Scalable. Resilient. Always On.
                </p>
              </div>
            </div>
          </div>
          <div className="relative h-64 md:h-80 overflow-hidden rounded-xl group cursor-pointer">
            <img
              src={AI_IMG}
              alt="AI Solutions - Machine Learning, Artificial Intelligence, and predictive analytics for business automation"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E1A]/90 via-[#0A0E1A]/40 to-transparent flex items-end p-8">
              <div>
                <p className="text-[#00D4FF] text-xs font-semibold uppercase tracking-widest mb-2">Artificial Intelligence</p>
                <p className="text-white font-bold text-2xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Intelligent. Adaptive. Transformative.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
