/*
  GigitekAI Services Section — Theme-aware
  Service cards with technology expertise
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
    description: "Enterprise cloud migration and management services on AWS, Azure, and Google Cloud. Our cloud infrastructure solutions deliver scalable, resilient cloud computing with cost optimization and 24/7 support.",
    href: "/services/cloud",
  },
  {
    id: "ai",
    icon: Brain,
    title: "AI & Machine Learning",
    description: "AI implementation and machine learning solutions including predictive analytics, business automation, and custom AI models. Transform your business with AI-powered intelligence and intelligent automation.",
    href: "/services/ai",
  },
  {
    id: "security",
    icon: Shield,
    title: "Cybersecurity",
    description: "Enterprise cybersecurity solutions with cloud security services, threat detection, compliance management, and data protection frameworks for secure cloud infrastructure.",
    href: "/services/security",
  },
  {
    id: "strategy",
    icon: TrendingUp,
    title: "IT Strategy & Growth",
    description: "Align technology investments with business goals through proactive planning, roadmapping, and vCIO advisory services.",
    href: "/services/strategy",
  },
  {
    id: "data",
    icon: Database,
    title: "Data & Analytics",
    description: "Data analytics and business intelligence solutions with modern data warehousing, predictive analytics, and AI-powered insights for enterprise decision-making.",
    href: "/services/data",
  },
  {
    id: "managed",
    icon: Cpu,
    title: "Managed IT Services",
    description: "Managed IT services and enterprise IT solutions with 24/7 monitoring, helpdesk support, and proactive maintenance for your cloud infrastructure and business systems.",
    href: "/services/managed",
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
      className={`group bg-white dark:bg-[#141B2D] rounded-xl border border-gray-100 dark:border-[rgba(0,212,255,0.15)] p-6 shadow-sm hover:shadow-lg hover:border-[#00D4FF]/30 transition-all duration-300 scroll-mt-24 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className="w-12 h-12 rounded-lg bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center mb-4 group-hover:bg-[#00D4FF]/15 transition-colors">
        <Icon size={22} className="text-[#00D4FF]" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        {service.title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">{service.description}</p>
      <a
        href={service.href}
        className="inline-flex items-center gap-1 text-sm font-semibold text-[#00D4FF] hover:gap-2 transition-all"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        Learn more <ArrowRight size={14} />
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
    <section id="services" className="py-20 bg-white dark:bg-[#0F1629]">
      <div className="container">
        {/* Header */}
        <div className="grid lg:grid-cols-2 gap-12 items-start mb-16">
          <div ref={ref}>
            <div className={`section-label transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              Technology Expertise
            </div>
            <h2
              className={`text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight transition-all duration-700 delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Enterprise Cloud Infrastructure & AI Solutions
            </h2>
          </div>
          <div className={`transition-all duration-700 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-6">
              GigitekAI provides enterprise cloud infrastructure, AI solutions, and machine learning services on AWS, Azure, and Google Cloud. Our cloud computing expertise includes cloud migration, digital transformation, and business automation to accelerate growth.
            </p>
            <a href="#contact" className="btn-cyan text-sm">
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

        {/* Visual showcase */}
        <div className="grid md:grid-cols-2 gap-6 rounded-2xl overflow-hidden">
          <div className="relative h-64 md:h-80 overflow-hidden rounded-xl">
            <img
              src={CLOUD_IMG}
              alt="Cloud Infrastructure - AWS, Azure, Google Cloud services for enterprise digital transformation"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E1A]/80 to-transparent flex items-end p-6">
              <div>
                <p className="text-[#00D4FF] text-xs font-semibold uppercase tracking-widest mb-1">Cloud Infrastructure</p>
                <p className="text-white font-bold text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Scalable. Resilient. Always On.
                </p>
              </div>
            </div>
          </div>
          <div className="relative h-64 md:h-80 overflow-hidden rounded-xl">
            <img
              src={AI_IMG}
              alt="AI Solutions - Machine Learning, Artificial Intelligence, and predictive analytics for business automation"
              className="w-full h-full object-cover"
            />
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
    </section>
  );
}
