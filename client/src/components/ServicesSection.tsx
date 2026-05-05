/*
  GigitekAI Services Section — Deloitte-Style Professional Design
  - Clean, minimal service cards with professional spacing
  - +25% larger font sizes for better hierarchy
  - Massive whitespace and breathing room
  - Professional simplicity without excessive gradients
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
      className={`group relative bg-white dark:bg-[#0F1629] rounded-xl border border-gray-200 dark:border-[rgba(0,212,255,0.15)] p-12 shadow-md hover:shadow-lg hover:border-gray-300 dark:hover:border-[rgba(0,212,255,0.3)] transition-all duration-300 scroll-mt-24 overflow-hidden ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      {/* Content */}
      <div className="relative z-10">
        {/* Icon container - Clean and minimal */}
        <div className="w-16 h-16 rounded-lg bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center mb-8 group-hover:border-[#00D4FF]/50 transition-all duration-300">
          <Icon size={32} className="text-[#00D4FF]" />
        </div>

        {/* Title - +25% larger */}
        <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-[#00D4FF] transition-colors duration-300" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {service.title}
        </h3>

        {/* Description - +25% larger */}
        <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-8">
          {service.description}
        </p>

        {/* Features list - +25% larger */}
        <div className="space-y-3 mb-10">
          {service.features.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-3 text-base text-gray-700 dark:text-gray-300">
              <CheckCircle size={20} className="text-[#00D4FF] flex-shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        {/* CTA Link - +25% larger */}
        <a
          href={service.href}
          className="inline-flex items-center gap-2 text-lg font-semibold text-[#00D4FF] hover:text-[#00EEFF] transition-all duration-200 group/link"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {service.cta}
          <ArrowRight size={20} className="group-hover/link:translate-x-1 transition-transform duration-200" />
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
    <section id="services" className="py-40 lg:py-56 bg-white dark:bg-[#0A0E1A]">
      <div className="container">
        {/* Section Header - Professional spacing */}
        <div className="grid lg:grid-cols-2 gap-20 items-start mb-32">
          <div ref={ref}>
            <div className={`section-label mb-8 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              WHAT WE DO
            </div>
            <h2
              className={`text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white leading-tight transition-all duration-700 delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Enterprise Solutions
            </h2>
          </div>
          <div className={`transition-all duration-700 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <p className="text-gray-600 dark:text-gray-400 text-xl leading-relaxed mb-10">
              GigitekAI provides enterprise cloud infrastructure, AI solutions, and machine learning services on AWS, Azure, and Google Cloud. Our cloud computing expertise includes cloud migration, digital transformation, and business automation to accelerate growth.
            </p>
            <a href="/services" className="btn-cyan inline-flex items-center gap-3 font-semibold px-10 py-4 text-lg rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200">
              Explore All Capabilities <ArrowRight size={22} />
            </a>
          </div>
        </div>

        {/* Service Cards Grid - Professional 3-column layout with generous spacing */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12 mb-32">
          {services.map((service, i) => (
            <ServiceCard key={service.title} service={service} index={i} />
          ))}
        </div>

        {/* Helpdesk Pricing CTA - Clean and minimal */}
        <div className="mb-20 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-[#0F1629] dark:to-[#141B2D] border border-gray-200 dark:border-[rgba(0,212,255,0.2)] rounded-xl p-16 shadow-md hover:shadow-lg hover:border-gray-300 dark:hover:border-[rgba(0,212,255,0.4)] transition-all duration-300">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex-1">
              <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                24/7 Managed Help Desk
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-xl mb-4">
                Three pricing tiers: Essential ($69/user/month), Professional ($119/user/month), Elite ($189/user/month)
              </p>
              <p className="text-base text-gray-500">
                ✓ Volume discounts available • ✓ No hidden fees • ✓ Flat monthly rates
              </p>
            </div>
            <a href="/helpdesk-pricing" className="btn-cyan whitespace-nowrap font-semibold flex items-center gap-3 px-10 py-4 text-lg rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200">
              View Pricing <ArrowRight size={22} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
