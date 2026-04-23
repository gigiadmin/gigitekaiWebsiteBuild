/*
  GigitekAI Partners Page
  Design: Cyberpunk Minimalism meets Enterprise Precision
  Colors: Deep navy-black (#0A0E1A) + Electric cyan (#00D4FF)
*/

import SiteNavBar2024 from "@/components/SiteNavBar2024";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { useSEO } from "@/hooks/useSEO";
import { SEO_CONFIG } from "@/lib/seoConfig";

interface Partner {
  id: number;
  name: string;
  category: string;
  description: string;
  capabilities: string[];
}

const partners: Partner[] = [
  {
    id: 1,
    name: "Microsoft",
    category: "Cloud Platform",
    description: "Enterprise cloud services, Microsoft 365, Azure infrastructure, and AI solutions.",
    capabilities: ["Azure", "Microsoft 365", "Dynamics 365", "AI Services"],
  },
  {
    id: 2,
    name: "Amazon Web Services (AWS)",
    category: "Cloud Platform",
    description: "Comprehensive cloud computing services and infrastructure solutions.",
    capabilities: ["EC2", "S3", "Lambda", "Machine Learning"],
  },
  {
    id: 3,
    name: "Google Cloud",
    category: "Cloud Platform",
    description: "Data analytics, AI/ML, and cloud infrastructure services.",
    capabilities: ["BigQuery", "Vertex AI", "Cloud Run", "Workspace"],
  },
  {
    id: 4,
    name: "Commvault",
    category: "Data Protection",
    description: "Enterprise backup, disaster recovery, and data management solutions.",
    capabilities: ["Backup & Recovery", "Disaster Recovery", "Data Governance"],
  },
  {
    id: 5,
    name: "Harmony/Avanan",
    category: "Email Security",
    description: "Advanced email and collaboration security for Microsoft 365 and cloud applications.",
    capabilities: ["Email Security", "DLP", "Threat Protection", "Compliance"],
  },
  {
    id: 6,
    name: "ConnectSecure",
    category: "Network Security",
    description: "Zero-trust network access and secure remote connectivity solutions.",
    capabilities: ["Zero Trust", "VPN", "Network Access", "Endpoint Security"],
  },
  {
    id: 7,
    name: "NordStellar",
    category: "Cybersecurity",
    description: "Advanced threat detection and response for enterprise environments.",
    capabilities: ["Threat Detection", "Incident Response", "Security Monitoring"],
  },
  {
    id: 8,
    name: "NordLayer",
    category: "Network Security",
    description: "Enterprise VPN and network security for distributed teams.",
    capabilities: ["Enterprise VPN", "Network Security", "Access Control"],
  },
  {
    id: 9,
    name: "NordPass",
    category: "Identity Management",
    description: "Enterprise password management and identity security solutions.",
    capabilities: ["Password Management", "Identity Security", "Access Management"],
  },
  {
    id: 10,
    name: "DefensX",
    category: "Email Security",
    description: "Email security and anti-phishing solutions for enterprise organizations.",
    capabilities: ["Anti-Phishing", "Email Security", "Threat Prevention"],
  },
  {
    id: 11,
    name: "Afi",
    category: "IT Management",
    description: "Integrated IT management and automation platform.",
    capabilities: ["IT Automation", "Service Management", "Workflow Automation"],
  },
  {
    id: 12,
    name: "Sherweb",
    category: "Licensing & Distribution",
    description: "Microsoft licensing and cloud services distribution partner.",
    capabilities: ["Microsoft Licensing", "Cloud Services", "Vendor Management"],
  },
];

const categories = Array.from(new Set(partners.map((p) => p.category)));

export default function Partners() {
  useSEO({ ...SEO_CONFIG["/partners"], path: "/partners" });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#0A0E1A] to-[#0F1428]">
      <SiteNavBar2024 />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6 font-display">
                Our Partners
              </h1>
              <p className="text-xl text-gray-300">
                Strategic partnerships with industry-leading technology providers
              </p>
            </div>
          </div>
        </section>

        {/* Partnership Value */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-cyan-500/20">
          <div className="max-w-4xl mx-auto">
            <p className="text-gray-300 text-lg text-center mb-12">
              We've carefully selected strategic partnerships with best-in-class technology providers to deliver comprehensive solutions for our clients. Our partner ecosystem enables us to offer cutting-edge capabilities across cloud infrastructure, cybersecurity, data protection, and AI/ML.
            </p>
          </div>
        </section>

        {/* Partners by Category */}
        {categories.map((category) => (
          <section key={category} className="py-12 px-4 sm:px-6 lg:px-8 border-t border-cyan-500/20">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-bold text-cyan-400 mb-8">{category}</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {partners
                  .filter((p) => p.category === category)
                  .map((partner) => (
                    <div
                      key={partner.id}
                      className="p-6 rounded-lg border border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-transparent hover:border-cyan-400/50 hover:bg-cyan-500/10 transition"
                    >
                      <h3 className="text-lg font-bold text-white mb-2">{partner.name}</h3>
                      <p className="text-gray-300 mb-4">{partner.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {partner.capabilities.map((capability, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                          >
                            {capability}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </section>
        ))}

        {/* Partnership Benefits */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-cyan-500/5 border-y border-cyan-500/20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">Why Our Partnerships Matter</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-xl font-bold text-cyan-400 mb-3">Best-in-Class Solutions</h3>
                <p className="text-gray-300">
                  We partner with industry leaders to ensure our clients have access to the most advanced and reliable technologies.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-cyan-400 mb-3">Integrated Ecosystem</h3>
                <p className="text-gray-300">
                  Our partnerships create a seamless ecosystem where solutions work together to deliver maximum value and efficiency.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-cyan-400 mb-3">Expert Support</h3>
                <p className="text-gray-300">
                  Through our partnerships, we provide expert implementation, support, and optimization of partner technologies.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Become a Partner CTA */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Interested in Partnering with GigitekAI?</h2>
            <p className="text-gray-300 text-lg mb-8">
              We're always exploring strategic partnerships to expand our capabilities and better serve our clients.
            </p>
            <a
              href="/contact"
              className="inline-block px-8 py-3 bg-cyan-500 text-white font-semibold rounded-lg hover:bg-cyan-600 transition"
            >
              Contact Our Partnership Team
            </a>
          </div>
        </section>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
