/*
  /managed-it-services-miami — Local SEO Landing Page
  Targets: "managed IT services Miami", "IT support Miami", "Miami MSP"
  Design: Matches site-wide cyberpunk dark theme
*/

import { useSEO } from "@/hooks/useSEO";
import SiteNavBar2024 from "@/components/SiteNavBar2024";
import Footer from "@/components/Footer";
import { Link } from "wouter";
import {
  Shield,
  Cloud,
  Headphones,
  Clock,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  CheckCircle2,
  Building2,
  Users,
  Zap,
  Server,
  Brain,
} from "lucide-react";

const LOCAL_SERVICES = [
  {
    icon: Server,
    title: "Managed IT Support",
    desc: "24/7 proactive monitoring, patch management, and Tier 1–3 helpdesk for Miami businesses.",
  },
  {
    icon: Cloud,
    title: "Cloud Migration",
    desc: "Seamless Azure and Microsoft 365 migrations with zero downtime for your Miami office.",
  },
  {
    icon: Shield,
    title: "Cybersecurity",
    desc: "Zero Trust architecture, endpoint protection, and NIST-aligned security for South Florida businesses.",
  },
  {
    icon: Brain,
    title: "AI Automation",
    desc: "Intelligent workflows, AI-powered helpdesk, and process automation to reduce manual work.",
  },
  {
    icon: Headphones,
    title: "Microsoft 365 Architecture",
    desc: "Exchange Online, Teams deployment, license optimization, and Entra ID management.",
  },
  {
    icon: Zap,
    title: "IT Strategy Consulting",
    desc: "vCIO services, technology roadmaps, and IT budgeting aligned to your business goals.",
  },
];

const WHY_LOCAL = [
  {
    icon: MapPin,
    title: "Miami-Based Operations",
    desc: "Headquartered in South Florida, we understand the Miami business landscape and can provide on-site support when needed.",
  },
  {
    icon: Clock,
    title: "Rapid Response Times",
    desc: "Local presence means faster response. Our 99.9% uptime SLA ensures your business stays operational.",
  },
  {
    icon: Users,
    title: "Dedicated Account Team",
    desc: "You get a named account manager who knows your business, not a rotating call center.",
  },
  {
    icon: Building2,
    title: "Industry Expertise",
    desc: "We serve healthcare, financial services, legal, manufacturing, and professional services across Miami and South Florida.",
  },
];

export default function ManagedITMiami() {
  useSEO({
    title: "Managed IT Services Miami | Local IT Support | GigitekAI",
    description:
      "Miami's trusted managed IT provider. 24/7 support, cloud migration, cybersecurity, and Microsoft 365 for local businesses. Free IT assessment — (727) 382-5776.",
    path: "/managed-it-services-miami",
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0E1A]">
      <SiteNavBar2024 />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative pt-32 pb-20 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0A0E1A] via-[#0D1528] to-[#0A0E1A]" />
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300D4FF' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
          <div className="relative max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-[#00D4FF]/10 border border-[#00D4FF]/20 rounded-full px-4 py-1.5 mb-6">
              <MapPin className="w-4 h-4 text-[#00D4FF]" />
              <span className="text-[#00D4FF] text-sm font-medium font-['Space_Grotesk']">Serving Miami & All of South Florida</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white font-['Space_Grotesk'] leading-tight mb-6">
              Managed IT Services for{" "}
              <span className="text-[#00D4FF]">Miami</span> Businesses
            </h1>
            <p className="text-lg md:text-xl text-gray-300 font-['DM_Sans'] max-w-3xl mx-auto mb-8 leading-relaxed">
              GigitekAI provides enterprise-grade managed IT support, cloud infrastructure, cybersecurity, and AI automation to businesses across Miami, Coral Gables, Brickell, Wynwood, and the greater Miami metropolitan area.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 bg-[#00D4FF] text-[#0A0E1A] px-8 py-3.5 rounded-lg font-semibold font-['Space_Grotesk'] hover:bg-[#00D4FF]/90 transition-colors"
              >
                Get a Free Miami IT Assessment
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="tel:+17273825776"
                className="inline-flex items-center justify-center gap-2 border border-[#00D4FF]/30 text-[#00D4FF] px-8 py-3.5 rounded-lg font-semibold font-['Space_Grotesk'] hover:bg-[#00D4FF]/10 transition-colors"
              >
                <Phone className="w-5 h-5" />
                (727) 382-5776
              </a>
            </div>
          </div>
        </section>

        {/* Why Miami Businesses Choose GigitekAI */}
        <section className="py-20 px-4 bg-[#0D1528]">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white font-['Space_Grotesk'] text-center mb-4">
              Why Miami Businesses Choose <span className="text-[#00D4FF]">GigitekAI</span>
            </h2>
            <p className="text-gray-400 text-center font-['DM_Sans'] max-w-2xl mx-auto mb-14">
              Unlike national IT providers, we combine enterprise-grade technology with local expertise and personalized service.
            </p>
            <div className="grid md:grid-cols-2 gap-8">
              {WHY_LOCAL.map((item) => (
                <div key={item.title} className="flex gap-5 p-6 bg-[#0A0E1A]/60 border border-white/5 rounded-xl">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#00D4FF]/10 rounded-lg flex items-center justify-center">
                    <item.icon className="w-6 h-6 text-[#00D4FF]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white font-['Space_Grotesk'] mb-2">{item.title}</h3>
                    <p className="text-gray-400 font-['DM_Sans'] text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white font-['Space_Grotesk'] text-center mb-4">
              IT Services for Miami
            </h2>
            <p className="text-gray-400 text-center font-['DM_Sans'] max-w-2xl mx-auto mb-14">
              From day-to-day IT support to strategic cloud migrations, we cover every aspect of your technology needs.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {LOCAL_SERVICES.map((svc) => (
                <div key={svc.title} className="group p-6 bg-[#0D1528] border border-white/5 rounded-xl hover:border-[#00D4FF]/20 transition-colors">
                  <div className="w-12 h-12 bg-[#00D4FF]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#00D4FF]/20 transition-colors">
                    <svc.icon className="w-6 h-6 text-[#00D4FF]" />
                  </div>
                  <h3 className="text-lg font-semibold text-white font-['Space_Grotesk'] mb-2">{svc.title}</h3>
                  <p className="text-gray-400 font-['DM_Sans'] text-sm leading-relaxed">{svc.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Miami Service Coverage Area */}
        <section className="py-20 px-4 bg-[#0D1528]">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white font-['Space_Grotesk'] text-center mb-4">
              Miami Service Coverage
            </h2>
            <p className="text-gray-400 text-center font-['DM_Sans'] max-w-2xl mx-auto mb-12">
              We provide on-site and remote IT support across Miami, Dade County, and South Florida.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                "Miami", "Coral Gables", "Brickell",
                "Wynwood", "Allapattah", "Buena Vista",
                "Coconut Grove", "Downtown Miami", "Little Havana",
                "Midtown Miami", "Overtown", "Edgewater",
                "Aventura", "Kendall", "Pinecrest",
              ].map((city) => (
                <div key={city} className="flex items-center gap-3 px-4 py-3 bg-[#0A0E1A]/60 border border-white/5 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-[#00D4FF] flex-shrink-0" />
                  <span className="text-gray-300 font-['DM_Sans'] text-sm">{city}, FL</span>
                </div>
              ))}
            </div>
            <p className="text-gray-500 text-center font-['DM_Sans'] text-sm mt-6">
              Remote support available nationwide across the United States and Canada.
            </p>
          </div>
        </section>

        {/* Industries We Serve */}
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white font-['Space_Grotesk'] text-center mb-4">
              Industries We Serve in Miami
            </h2>
            <p className="text-gray-400 text-center font-['DM_Sans'] max-w-2xl mx-auto mb-12">
              Our managed IT services are tailored to the compliance, security, and operational needs of each industry.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: "Healthcare & Medical", link: "/industries/healthcare", desc: "HIPAA compliance, EHR integration, secure patient data" },
                { name: "Financial Services", link: "/industries/financial-services", desc: "SOC 2 compliance, encrypted communications, fraud prevention" },
                { name: "Legal & Professional", link: "/contact", desc: "Document security, eDiscovery, client confidentiality" },
                { name: "Manufacturing", link: "/industries/manufacturing", desc: "IoT integration, OT security, supply chain systems" },
                { name: "Retail & E-Commerce", link: "/industries/retail-ecommerce", desc: "PCI compliance, omnichannel infrastructure, uptime" },
                { name: "Education", link: "/industries/education", desc: "FERPA compliance, remote learning, campus networks" },
              ].map((ind) => (
                <Link
                  key={ind.name}
                  href={ind.link}
                  className="block p-5 bg-[#0D1528] border border-white/5 rounded-xl hover:border-[#00D4FF]/20 transition-colors"
                >
                  <h3 className="text-white font-['Space_Grotesk'] font-semibold mb-1">{ind.name}</h3>
                  <p className="text-gray-500 font-['DM_Sans'] text-sm">{ind.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 bg-gradient-to-r from-[#00D4FF]/10 via-[#0D1528] to-[#00D4FF]/10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white font-['Space_Grotesk'] mb-4">
              Ready to Upgrade Your Miami IT?
            </h2>
            <p className="text-gray-300 font-['DM_Sans'] mb-8 text-lg">
              Schedule a free IT assessment with our Miami-based team. We'll evaluate your current infrastructure and show you how to reduce costs while improving security and performance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 bg-[#00D4FF] text-[#0A0E1A] px-8 py-3.5 rounded-lg font-semibold font-['Space_Grotesk'] hover:bg-[#00D4FF]/90 transition-colors"
              >
                Schedule Free Assessment
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="mailto:support@gigitekai.com"
                className="inline-flex items-center justify-center gap-2 border border-[#00D4FF]/30 text-[#00D4FF] px-8 py-3.5 rounded-lg font-semibold font-['Space_Grotesk'] hover:bg-[#00D4FF]/10 transition-colors"
              >
                <Mail className="w-5 h-5" />
                support@gigitekai.com
              </a>
            </div>
            <p className="text-gray-500 font-['DM_Sans'] text-sm mt-6">
              GigitekAI — Miami, FL | (727) 382-5776 | Serving Miami and South Florida
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
