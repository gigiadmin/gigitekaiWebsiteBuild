/*
  GigitekAI Services Section — Professional Enterprise Layout
  Full-width centering, proper spacing, Fortune 100 quality
*/

import { useEffect, useRef, useState } from "react";
import { Cloud, Brain, Shield, TrendingUp, Database, Cpu, ArrowRight } from "lucide-react";

const CLOUD_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663509163804/mmTCDMc2kTTVcTkwoY8f9U/gigitekai-cloud-services-RDPBQDkRZRbpsWy2UNcbqf.webp";
const AI_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663509163804/mmTCDMc2kTTVcTkwoY8f9U/gigitekai-ai-solutions-BoVHfmFw3tdkqwMF7iT2YX.webp";

const services = [
  {
    id: "cloud",
    icon: Cloud,
    title: "Cloud Infrastructure",
    description: "Enterprise cloud migration and management services on AWS, Azure, and Google Cloud.",
    href: "/services/cloud",
    cta: "Explore Cloud Services",
  },
  {
    id: "ai",
    icon: Brain,
    title: "AI & Machine Learning",
    description: "AI implementation and machine learning solutions including predictive analytics and business automation.",
    href: "/services/ai",
    cta: "Explore AI Solutions",
  },
  {
    id: "security",
    icon: Shield,
    title: "Cybersecurity",
    description: "Enterprise cybersecurity solutions with cloud security services, threat detection, and compliance management.",
    href: "/services/security",
    cta: "Explore Cybersecurity",
  },
  {
    id: "strategy",
    icon: TrendingUp,
    title: "IT Strategy & Growth",
    description: "Align technology investments with business goals through proactive planning and vCIO advisory services.",
    href: "/services/strategy",
    cta: "Explore IT Strategy",
  },
  {
    id: "data",
    icon: Database,
    title: "Data & Analytics",
    description: "Data analytics and business intelligence solutions with modern data warehousing and predictive analytics.",
    href: "/services/data",
    cta: "Explore Data Analytics",
  },
  {
    id: "managed",
    icon: Cpu,
    title: "Managed IT Services",
    description: "Managed IT services with 24/7 monitoring, helpdesk support, and proactive maintenance.",
    href: "/services/managed",
    cta: "Explore Managed IT",
  },
];

function ServiceCard({ service, index }: { service: typeof services[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const Icon = service.icon;

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
    <div
      ref={ref}
      className={`group relative p-8 rounded-xl border border-[#00D4FF]/20 bg-[#0F1629]/50 hover:bg-[#0F1629]/80 hover:border-[#00D4FF]/50 transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="p-3 rounded-lg bg-[#00D4FF]/10 group-hover:bg-[#00D4FF]/20 transition-colors">
          <Icon size={24} className="text-[#00D4FF]" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        {service.title}
      </h3>
      <p className="text-gray-400 text-sm leading-relaxed mb-6">{service.description}</p>
      <a href={service.href} className="inline-flex items-center gap-2 text-[#00D4FF] hover:text-[#00E5CC] font-semibold transition-colors">
        {service.cta}
        <ArrowRight size={16} />
      </a>
    </div>
  );
}

export default function ServicesSection() {
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
    <section id="services" className="relative w-full bg-[#0A0E1A] py-20 sm:py-32 lg:py-40">
      {/* Background gradient */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00D4FF]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#00D4FF]/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full" style={{ padding: '0 1.5rem' }}>
        <div style={{ maxWidth: '1280px', marginLeft: 'auto', marginRight: 'auto' }}>
          {/* Header section */}
          <div
            ref={ref}
            className={`mb-16 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <div className="inline-flex items-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-[#00D4FF]" />
              <span className="text-xs font-semibold uppercase tracking-widest text-[#00D4FF]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                What We Do
              </span>
            </div>
            <h2
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Enterprise Solutions
            </h2>
            <p className="text-lg text-gray-400 leading-relaxed max-w-2xl">
              GigitekAI provides enterprise cloud infrastructure, AI solutions, and machine learning services on AWS, Azure, and Google Cloud.
            </p>
          </div>

          {/* Service cards grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {services.map((service, i) => (
              <ServiceCard key={service.id} service={service} index={i} />
            ))}
          </div>

          {/* Helpdesk pricing CTA */}
          <div className="mb-16 bg-gradient-to-r from-[#00D4FF]/10 to-[#00D4FF]/5 border border-[#00D4FF]/30 rounded-xl p-8 sm:p-12">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
              <div>
                <h3 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  24/7 Managed Help Desk
                </h3>
                <p className="text-gray-400 mb-2">Three pricing tiers: Essential ($69/user/month), Professional ($119/user/month), Elite ($189/user/month)</p>
                <p className="text-sm text-gray-500">Volume discounts available • No hidden fees • Flat monthly rates</p>
              </div>
              <a href="/helpdesk-pricing" className="inline-flex items-center gap-2 px-8 py-4 bg-[#00D4FF] text-[#0A0E1A] font-semibold rounded-lg hover:bg-[#00E5CC] transition-colors whitespace-nowrap">
                View Pricing
                <ArrowRight size={18} />
              </a>
            </div>
          </div>

          {/* Visual showcase */}
          <div className="grid md:grid-cols-2 gap-8 rounded-2xl overflow-hidden">
            <div className="relative h-64 md:h-80 rounded-xl overflow-hidden group">
              <img src={CLOUD_IMG} alt="Cloud Infrastructure" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E1A]/80 to-transparent flex items-end p-6">
                <div>
                  <p className="text-[#00D4FF] text-xs font-semibold uppercase tracking-widest mb-1">Cloud Infrastructure</p>
                  <p className="text-white font-bold text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    Scalable. Resilient. Always On.
                  </p>
                </div>
              </div>
            </div>
            <div className="relative h-64 md:h-80 rounded-xl overflow-hidden group">
              <img src={AI_IMG} alt="AI Solutions" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E1A]/80 to-transparent flex items-end p-6">
                <div>
                  <p className="text-[#00D4FF] text-xs font-semibold uppercase tracking-widest mb-1">Artificial Intelligence</p>
                  <p className="text-white font-bold text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    Intelligent. Adaptive. Transformative.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
