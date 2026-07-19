/*
  GigitekAI Services Section — Tampa Bay SMB Focus
  4 clear service packages with SMB-friendly language
  Emphasizes security, compliance, and risk reduction
*/

import { useEffect, useRef, useState } from "react";
import { Shield, Lock, Brain, Zap, ArrowRight } from "lucide-react";

const services = [
  {
    id: "essential",
    icon: Shield,
    title: "Essential Security",
    description: "Core managed IT + security for small teams. Includes 24/7 monitoring, backup, antivirus, and basic compliance support. Perfect for 10-50 person teams.",
    features: ["24/7 Monitoring & Alerts", "Daily Backups", "Antivirus & Malware Protection", "User Support", "Basic Compliance"],
    price: "Starting at $99/user/month",
    href: "/pricing",
    cta: "Learn More",
  },
  {
    id: "professional",
    icon: Lock,
    title: "Professional Compliance",
    description: "Advanced security + compliance for regulated industries. HIPAA, legal, construction compliance built-in. Includes security audits and policy management.",
    features: ["Everything in Essential", "Compliance Management (HIPAA/Legal)", "Security Audits", "Policy Documentation", "Incident Response"],
    price: "Starting at $149/user/month",
    href: "/pricing",
    cta: "Learn More",
  },
  {
    id: "elite",
    icon: Brain,
    title: "Elite + Governed AI",
    description: "Professional tier + managed Copilot for Microsoft 365. AI automation with governance, security, and compliance. For teams ready to work smarter.",
    features: ["Everything in Professional", "Managed Copilot (M365)", "AI Governance & Oversight", "Automation Workflows", "Advanced Analytics"],
    price: "Starting at $199/user/month",
    href: "/pricing",
    cta: "Learn More",
  },
  {
    id: "enterprise",
    icon: Zap,
    title: "Enterprise Custom",
    description: "Full-stack managed IT, security, AI, and infrastructure. Custom solutions for complex environments. Dedicated account team and strategic planning.",
    features: ["Everything in Elite", "Custom Infrastructure", "Dedicated Account Team", "Strategic IT Planning", "Multi-system Integration"],
    price: "Custom Quote",
    href: "/contact",
    cta: "Schedule Consultation",
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
      className={`group relative overflow-hidden rounded-xl border border-gray-700 bg-gradient-to-br from-gray-900 to-black p-8 transition-all duration-500 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Background accent */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-3xl -mr-20 -mt-20 group-hover:from-cyan-500/20 transition-all duration-300" />

      {/* Icon */}
      <div className="relative z-10 mb-6">
        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 flex items-center justify-center group-hover:from-cyan-500/30 transition-all duration-300">
          <Icon className="w-7 h-7 text-cyan-400" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">
          {service.title}
        </h3>
        <p className="text-gray-300 text-sm mb-6 leading-relaxed">
          {service.description}
        </p>

        {/* Features list */}
        <ul className="space-y-2 mb-6">
          {service.features.map((feature, i) => (
            <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
              <span className="text-cyan-400 mt-1">•</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* Price */}
        <div className="mb-6 pb-6 border-t border-gray-700">
          <p className="text-cyan-400 font-semibold text-sm mt-4">{service.price}</p>
        </div>

        {/* CTA */}
        <a
          href={service.href}
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold text-sm transition-colors group/link"
        >
          {service.cta}
          <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
        </a>
      </div>
    </div>
  );
}

export default function ServicesSection() {
  return (
    <section id="services" className="relative py-20 bg-black overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,212,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,212,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="container relative z-10">
        {/* Header */}
        <div className="max-w-2xl mb-16">
          <div className="section-label mb-4">OUR SERVICES</div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Clear Pricing.{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #00D4FF, #00EEFF)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              No Surprises.
            </span>
          </h2>
          <p className="text-lg text-gray-300">
            Four service tiers designed for SMBs and enterprises. From essential security to full-stack managed IT with AI. Pick what you need, scale as you grow.
          </p>
        </div>

        {/* Service cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <ServiceCard key={service.id} service={service} index={index} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-300 mb-6">
            Not sure which tier is right for you?
          </p>
          <a href="/contact" className="btn-cyan inline-flex items-center gap-2">
            Schedule a Free Audit
            <ArrowRight size={18} />
          </a>
        </div>
      </div>
    </section>
  );
}
