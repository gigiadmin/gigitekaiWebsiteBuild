/*
  GigitekAI Services Overview — /services
  Parent landing page for all service offerings
*/

import { useRef, useState, useEffect } from "react";
import { useSEO } from "@/hooks/useSEO";
import SiteNavBar2024 from "@/components/SiteNavBar2024";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import {
  Cloud,
  Brain,
  Shield,
  TrendingUp,
  Database,
  Cpu,
  ArrowRight,
  Monitor,
  CheckCircle2,
  Phone,
} from "lucide-react";

const services = [
  {
    icon: Cloud,
    title: "Cloud Infrastructure",
    description:
      "Enterprise cloud migration and management on AWS, Azure, and Google Cloud with cost optimization and 24/7 support.",
    href: "/services/cloud",
    cta: "Explore Cloud Services",
  },
  {
    icon: Brain,
    title: "AI & Machine Learning",
    description:
      "AI implementation including predictive analytics, business automation, and custom AI models to transform operations.",
    href: "/services/ai",
    cta: "Explore AI Solutions",
  },
  {
    icon: Shield,
    title: "Cybersecurity",
    description:
      "Zero Trust security, threat detection, compliance management, and data protection frameworks for enterprise defense.",
    href: "/services/security",
    cta: "Explore Cybersecurity",
  },
  {
    icon: TrendingUp,
    title: "IT Strategy & Growth",
    description:
      "Align technology investments with business goals through proactive planning, roadmapping, and vCIO advisory.",
    href: "/services/strategy",
    cta: "Explore IT Strategy",
  },
  {
    icon: Database,
    title: "Data & Analytics",
    description:
      "Modern data warehousing, predictive analytics, and AI-powered insights for enterprise decision-making.",
    href: "/services/data",
    cta: "Explore Data Analytics",
  },
  {
    icon: Cpu,
    title: "Managed IT Services",
    description:
      "24/7 monitoring, helpdesk support, and proactive maintenance for your cloud infrastructure and business systems.",
    href: "/services/managed",
    cta: "Explore Managed IT",
  },
  {
    icon: Monitor,
    title: "Microsoft 365",
    description:
      "M365 architecture, migration, Teams deployment, and licensing optimization from a certified Microsoft 365 Architect.",
    href: "/services/microsoft-365",
    cta: "Explore M365 Services",
  },
];

const differentiators = [
  "20+ years of enterprise IT experience",
  "Certified Microsoft 365 Architect on staff",
  "AI-first approach to managed services",
  "99.9% managed uptime SLA",
  "Flat-rate pricing — no hidden fees",
  "Serving North America & Canada",
];

export default function Services() {
  useSEO({
    title: "Enterprise Cloud & AI Services | GigitekAI",
    description:
      "Explore GigitekAI's full suite of enterprise services: cloud infrastructure, AI, cybersecurity, managed IT, Microsoft 365, and data analytics.",
    path: "/services",
  });

  const heroRef = useRef<HTMLDivElement>(null);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setHeroVisible(true);
      },
      { threshold: 0.1 }
    );
    if (heroRef.current) observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0E1A]">
      <SiteNavBar2024 />
      <main className="flex-1">
        {/* Hero */}
        <section className="py-20 bg-gradient-to-b from-[#0A0E1A] to-[#141B2D]">
          <div className="container" ref={heroRef}>
            <div
              className={`max-w-3xl transition-[opacity,transform] duration-700 ${
                heroVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-6"
              }`}
            >
              <div
                className="text-xs font-bold uppercase tracking-[0.2em] text-[#00D4FF] mb-4"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                OUR SERVICES
              </div>
              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Enterprise Cloud & AI Services
              </h1>
              <p className="text-gray-400 text-lg md:text-xl leading-relaxed mb-8">
                From cloud migration to AI automation, GigitekAI delivers the
                full spectrum of enterprise technology services. Built on 20+
                years of IT experience and powered by an AI-first methodology.
              </p>
              <a
                href="/contact"
                className="inline-flex items-center gap-2 bg-[#00D4FF] text-[#0A0E1A] font-bold px-6 py-3 rounded-lg hover:bg-[#00D4FF]/90 transition-[opacity,transform]"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Get a Free Assessment <ArrowRight size={18} />
              </a>
            </div>
          </div>
        </section>

        {/* Service Grid */}
        <section className="py-20 bg-[#141B2D]">
          <div className="container">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => {
                const Icon = service.icon;
                return (
                  <a
                    key={service.title}
                    href={service.href}
                    className="group bg-white/5 rounded-xl border border-white/10 p-6 hover:border-[#00D4FF]/30 hover:shadow-lg hover:shadow-[#00D4FF]/5 transition-[opacity,transform] duration-300"
                  >
                    <div className="w-12 h-12 rounded-lg bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center mb-4 group-hover:bg-[#00D4FF]/15 transition-colors">
                      <Icon size={22} className="text-[#00D4FF]" />
                    </div>
                    <h2
                      className="text-lg font-bold text-white mb-2 group-hover:text-[#00D4FF] transition-colors"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      {service.title}
                    </h2>
                    <p className="text-gray-400 text-sm leading-relaxed mb-4">
                      {service.description}
                    </p>
                    <span
                      className="inline-flex items-center gap-1 text-sm font-semibold text-[#00D4FF] group-hover:gap-2 transition-[opacity,transform]"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      {service.cta} <ArrowRight size={14} />
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        {/* Why GigitekAI */}
        <section className="py-20 bg-[#0A0E1A]">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <div
                  className="text-xs font-bold uppercase tracking-[0.2em] text-[#00D4FF] mb-4"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  WHY GIGITEKAI
                </div>
                <h2
                  className="text-3xl md:text-4xl font-bold text-white mb-6"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Built Different. Built Better.
                </h2>
                <p className="text-gray-400 text-lg leading-relaxed mb-8">
                  GigitekAI combines decades of enterprise IT expertise with an
                  AI-first approach to managed services. We don't just support
                  your infrastructure — we transform it.
                </p>
                <div className="space-y-4">
                  {differentiators.map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2
                        size={20}
                        className="text-[#00D4FF] mt-0.5 shrink-0"
                      />
                      <span className="text-gray-300">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gradient-to-br from-[#00D4FF]/10 to-transparent border border-[#00D4FF]/20 rounded-2xl p-8">
                <h3
                  className="text-2xl font-bold text-white mb-4"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Ready to Transform Your IT?
                </h3>
                <p className="text-gray-400 mb-6">
                  Schedule a free IT assessment with our team. We'll evaluate
                  your current infrastructure and recommend a tailored roadmap
                  for growth.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a
                    href="/contact"
                    className="inline-flex items-center justify-center gap-2 bg-[#00D4FF] text-[#0A0E1A] font-bold px-6 py-3 rounded-lg hover:bg-[#00D4FF]/90 transition-[opacity,transform]"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    Schedule Assessment
                  </a>
                  <a
                    href="tel:+1727-382-5776"
                    className="inline-flex items-center justify-center gap-2 border border-[#00D4FF]/30 text-[#00D4FF] font-bold px-6 py-3 rounded-lg hover:bg-[#00D4FF]/10 transition-[opacity,transform]"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    <Phone size={16} /> (727) 382-5776
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
