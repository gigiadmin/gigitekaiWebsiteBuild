/*
  GigitekAI Industries Landing Page
  Shows all industry verticals we serve
  Design: Cyberpunk Minimalism meets Enterprise Precision
*/
import SiteNavBar2024 from "@/components/SiteNavBar2024";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { useSEO } from "@/hooks/useSEO";
import { Link } from "wouter";

const industries = [
  {
    name: "Healthcare",
    href: "/industries/healthcare",
    icon: "🏥",
    description: "HIPAA-compliant cloud infrastructure and AI solutions for modern healthcare organizations. Patient data security, diagnostics support, and operational efficiency.",
    highlights: ["HIPAA Compliance", "AI Diagnostics", "Secure Data Management"],
  },
  {
    name: "Financial Services",
    href: "/industries/financial",
    icon: "🏦",
    description: "Secure, compliant fintech infrastructure with real-time analytics, fraud detection, and regulatory compliance for banks, insurance, and investment firms.",
    highlights: ["PCI-DSS Compliance", "Fraud Detection", "Real-time Analytics"],
  },
  {
    name: "Manufacturing",
    href: "/industries/manufacturing",
    icon: "🏭",
    description: "Smart factory solutions with IoT integration, predictive maintenance, supply chain optimization, and AI-driven quality control.",
    highlights: ["IoT Integration", "Predictive Maintenance", "Supply Chain AI"],
  },
  {
    name: "Retail & E-Commerce",
    href: "/industries/retail",
    icon: "🛒",
    description: "Omnichannel commerce platforms, inventory intelligence, customer analytics, and AI-powered personalization engines.",
    highlights: ["Omnichannel", "Inventory AI", "Customer Analytics"],
  },
  {
    name: "Government & Public Sector",
    href: "/industries/government",
    icon: "🏛️",
    description: "FedRAMP-ready cloud solutions, citizen services automation, secure communications, and compliance-first infrastructure for government agencies.",
    highlights: ["CMMC Compliance", "Citizen Services", "Secure Infrastructure"],
  },
  {
    name: "Education",
    href: "/industries/education",
    icon: "🎓",
    description: "Digital campus transformation, LMS integration, student analytics, and AI-powered learning tools for K-12 and higher education.",
    highlights: ["Digital Campus", "LMS Integration", "AI Learning Tools"],
  },
];

export default function IndustriesPage() {
  useSEO({
    title: "Industries We Serve | GigitekAI",
    description: "GigitekAI delivers enterprise cloud infrastructure, AI solutions, and managed IT services across healthcare, financial services, manufacturing, retail, government, and education.",
    path: "/industries",
  });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#0A0E1A] to-[#0F1428]">
      <SiteNavBar2024 />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6 font-display">
              Industries We Serve
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Enterprise-grade cloud infrastructure, AI solutions, and managed IT services
              tailored to your industry's unique challenges and compliance requirements.
            </p>
          </div>
        </section>

        {/* Industries Grid */}
        <section className="pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {industries.map((industry) => (
              <Link
                key={industry.name}
                href={industry.href}
                className="group block p-8 rounded-xl border border-[rgba(0,212,255,0.15)] bg-[rgba(15,20,40,0.6)] hover:border-[rgba(0,212,255,0.4)] hover:bg-[rgba(15,20,40,0.8)] transition-all duration-300"
              >
                <div className="text-4xl mb-4">{industry.icon}</div>
                <h2 className="text-2xl font-bold text-white mb-3 font-display group-hover:text-[#00D4FF] transition-colors">
                  {industry.name}
                </h2>
                <p className="text-gray-400 mb-4 text-sm leading-relaxed">
                  {industry.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {industry.highlights.map((h) => (
                    <span
                      key={h}
                      className="text-xs px-2 py-1 rounded-full bg-[rgba(0,212,255,0.1)] text-[#00D4FF] border border-[rgba(0,212,255,0.2)]"
                    >
                      {h}
                    </span>
                  ))}
                </div>
                <div className="mt-4 text-[#00D4FF] text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more →
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-[rgba(0,212,255,0.1)]">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4 font-display">
              Don't See Your Industry?
            </h2>
            <p className="text-gray-400 mb-8">
              We work with businesses across all sectors. Our solutions are customized to meet
              your specific compliance, security, and operational requirements.
            </p>
            <a
              href="/contact"
              className="inline-block px-8 py-4 bg-[#00D4FF] text-[#0A0E1A] font-bold rounded-lg hover:bg-[#00b8d9] transition-colors"
            >
              Get In Touch →
            </a>
          </div>
        </section>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
