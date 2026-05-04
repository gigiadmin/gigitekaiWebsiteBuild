/*
  GigitekAI Our Team Page
  Design: Cyberpunk Minimalism meets Enterprise Precision
  Colors: Deep navy-black (#0A0E1A) + Electric cyan (#00D4FF)
*/

import SiteNavBar2024 from "@/components/SiteNavBar2024";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { useSEO } from "@/hooks/useSEO";
import { SEO_CONFIG } from "@/lib/seoConfig";
import { Shield, Cloud, Cpu, Award, Briefcase, Star } from "lucide-react";

export default function OurTeam() {
  useSEO({ ...SEO_CONFIG["/our-team"], path: "/our-team" });

  const expertise = [
    {
      icon: Cloud,
      title: "Microsoft 365 Architecture",
      desc: "20+ years designing, securing, and modernizing enterprise M365 environments. Exchange Online, Entra ID, Teams governance, and Microsoft Purview at scale.",
    },
    {
      icon: Shield,
      title: "Email Security & Compliance",
      desc: "Deep expertise in Proofpoint (TRAP, TAP), SPF/DKIM/DMARC, DLP policies, and email security architecture for Fortune 500 organizations.",
    },
    {
      icon: Cpu,
      title: "PowerShell & Graph API Automation",
      desc: "Advanced automation and reporting through PowerShell scripting and Microsoft Graph API integrations — replacing manual workflows with intelligent agents.",
    },
    {
      icon: Briefcase,
      title: "Enterprise Cloud Migrations",
      desc: "Architected and executed cloud migration strategies for organizations ranging from mid-size businesses to 100,000+ user global deployments.",
    },
    {
      icon: Star,
      title: "Hybrid Infrastructure",
      desc: "Expert in hybrid Exchange/Azure AD environments, multi-tenant administration, cross-forest migrations, and complex mail flow troubleshooting.",
    },
    {
      icon: Award,
      title: "AI & Agentic Automation",
      desc: "Actively integrating Agentic AI frameworks and AGI concepts into enterprise IT workflows — building the AI-first MSP of the future.",
    },
  ];

  const experience = [
    {
      company: "Avanade",
      role: "Associate Manager (Senior M365 Engineer)",
      period: "Nov 2021 – Present",
      desc: "Delivering enterprise messaging, identity, and security solutions for clients across hybrid and cloud-native environments. Administering Exchange Online, Entra ID (AAD Connect), Microsoft Purview, and driving automation through PowerShell and Graph API.",
    },
    {
      company: "Mindtree (for Realogy — Fortune 500)",
      role: "Senior Messaging Engineer",
      period: "Mar 2020 – Sep 2021",
      desc: "Senior Infrastructure Engineer supporting Microsoft 365 and on-premises messaging for one of the largest real estate enterprises in the US. Managed Proofpoint Email Security, Exchange Online, Azure AD, Teams, SharePoint, and Dynamics 365 at enterprise scale.",
    },
    {
      company: "Patriot Talent Solutions",
      role: "Senior Messaging Engineer",
      period: "Jan 2019 – Dec 2019",
      desc: "Architected and executed cloud migration strategies to Microsoft 365, transitioning Exchange Online, Teams, and SharePoint while minimizing business disruption. Managed on-premises Exchange 2013/2016 and Windows Server AD infrastructure.",
    },
    {
      company: "HCL America, Inc.",
      role: "Global Messaging Consultant",
      period: "Oct 2016 – Nov 2018",
      desc: "Senior escalation engineer in a globally distributed hybrid cloud and Exchange environment supporting 100,000+ users across multiple continents. Led infrastructure consolidation, disaster recovery, and complex cross-forest migrations.",
    },
    {
      company: "Microsoft",
      role: "Sr. Microsoft Escalation Engineer",
      period: "Jul 2012 – Jul 2013",
      desc: "Frontline technical expert for Microsoft's Premier Support organization, resolving the most complex and high-visibility customer escalations. Engaged Fortune 500 Premier customers as a trusted technical advisor and drove product quality improvements through direct feedback loops with Microsoft engineering.",
    },
    {
      company: "US Army",
      role: "Legal Specialist (MOS 71D)",
      period: "Mar 1993 – Jan 1997",
      desc: "Certified by the Judge Advocate General's Corps (JAGC) to provide paralegal and legal administrative support. Graduated from Air Assault School. Military discipline and mission-first mindset that carries through every client engagement today.",
    },
  ];

  const certifications = [
    "TRP 104: Threat Response Auto-Pull (TRAP) Integration & Incident Response – Level 1 (Proofpoint, 2023)",
    "TRP 103: Threat Response Auto-Pull (TRAP) Administration – Level 1 (Proofpoint, 2023)",
    "TRP 102: Threat Response Dashboard – Level 1 (Proofpoint, 2023)",
    "TRP 101: Threat Response Auto-Pull (TRAP) Foundations – Level 1 (Proofpoint, 2023)",
    "TAP 103: Targeted Attack Protection Threat Reporting – Level 1 (Proofpoint, 2023)",
    "TAP 102: Targeted Attack Protection Threat Analysis – Level 1 (Proofpoint, 2023)",
    "TAP 101: Targeted Attack Protection (TAP) Foundations – Level 1 (Proofpoint, 2023)",
    "PPS 104: Protection Server Security – Level 1 (Proofpoint, 2023)",
    "Proofpoint Technical Training (Proofpoint, 2023)",
    "MCSA + Messaging (Microsoft)",
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#0A0E1A] to-[#0F1428]">
      <SiteNavBar2024 />
      <main className="flex-1">

        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6 font-display">
                Meet the Founder
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                GigitekAI is led by a Microsoft 365 architect and U.S. Army veteran with over two decades of enterprise IT experience
              </p>
            </div>
          </div>
        </section>

        {/* Founder Profile */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-cyan-500/20">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-10 items-start">

              {/* Avatar & Quick Facts */}
              <div className="text-center md:text-left">
                <div className="w-40 h-40 mx-auto md:mx-0 rounded-full overflow-hidden border-2 border-cyan-500/50 mb-5">
                  <img
                    src="/manus-storage/harry-headshot_68f9f77b.jpeg"
                    alt="Harry Henry Santiago — CEO & Founder, GigitekAI"
                    className="w-full h-full object-cover"
              loading="lazy"
            />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">Harry Henry Santiago</h2>
                <p className="text-cyan-400 font-semibold mb-1">CEO & Founder</p>
                <p className="text-gray-400 text-sm mb-1">Microsoft 365 SME | Exchange Online & Email Security</p>
                <p className="text-gray-400 text-sm mb-1">Cloud Migration | M365 Enterprise Admin Expert</p>
                <p className="text-gray-500 text-sm mt-3">📍 Tampa, Florida</p>
                <p className="text-gray-500 text-sm">🎖️ U.S. Army Veteran (1993–1997)</p>
                <p className="text-gray-500 text-sm">🔗 <a href="https://www.linkedin.com/in/gigitekinc" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 transition">linkedin.com/in/gigitekinc</a></p>
                <p className="text-gray-500 text-sm mt-2">📧 <a href="mailto:harry@gigitekai.com" className="text-cyan-400 hover:text-cyan-300 transition">harry@gigitekai.com</a></p>
              </div>

              {/* Bio */}
              <div className="md:col-span-2 space-y-5 text-gray-300 text-lg leading-relaxed">
                <p>
                  <strong className="text-white">Harry Henry Santiago</strong> is a Microsoft 365 Subject Matter Expert with 20+ years designing, securing, and modernizing enterprise messaging environments for global organizations. His core focus areas include Exchange Online, email security (Proofpoint, SPF/DKIM/DMARC), multi-tenant Azure AD administration, hybrid migrations, and PowerShell/Graph API automation.
                </p>
                <p>
                  Harry has supported environments ranging from 100,000+ user global deployments to mid-size businesses transitioning to the cloud. He brings a hands-on approach to complex infrastructure challenges — from advanced email flow troubleshooting to full tenant migrations — and serves as a trusted SME for teams that need deep Microsoft 365 expertise.
                </p>
                <p>
                  Born in Manatí, Puerto Rico, and raised in New Brunswick, NJ, Harry served in the U.S. Army as a Legal Specialist (MOS 71D) from 1993 to 1997 before transitioning into IT in the late 1990s. He founded GigitekAI in 2024 with a clear mission: build an AI-first MSP where intelligent agents function as full employees, replacing manual workflows with automation and intelligence.
                </p>
                <p>
                  Harry is actively exploring Agentic AI frameworks and AGI concepts as they apply to enterprise automation and intelligent service delivery — positioning GigitekAI at the forefront of the next wave of managed services.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Core Expertise */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-cyan-500/5 border-y border-cyan-500/20">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-10 text-center">Core Expertise</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {expertise.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="p-5 rounded-lg border border-cyan-500/20 bg-[#0A0E1A]/50">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                        <Icon size={18} className="text-cyan-400" />
                      </div>
                      <h3 className="text-base font-bold text-white">{item.title}</h3>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Career Timeline */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-10 text-center">Career Timeline</h2>
            <div className="space-y-6">
              {experience.map((job, idx) => (
                <div key={idx} className="flex gap-5 items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-3 h-3 rounded-full bg-cyan-400 border-2 border-cyan-400/50 mt-1.5" />
                    {idx < experience.length - 1 && (
                      <div className="w-px h-full min-h-[40px] bg-cyan-500/20 mx-auto mt-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex flex-wrap items-baseline gap-2 mb-1">
                      <h3 className="text-lg font-bold text-white">{job.role}</h3>
                      <span className="text-cyan-400 font-semibold text-sm">@ {job.company}</span>
                    </div>
                    <p className="text-gray-500 text-xs mb-2">{job.period}</p>
                    <p className="text-gray-300 text-sm leading-relaxed">{job.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Certifications */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-cyan-500/5 border-y border-cyan-500/20">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-10 text-center">Licenses & Certifications</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {certifications.map((cert, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border border-cyan-500/15 bg-[#0A0E1A]/40">
                  <Award size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300 text-sm leading-snug">{cert}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Skills */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">Technical Skills</h2>
            <div className="flex flex-wrap gap-3 justify-center">
              {[
                "Microsoft Exchange Online", "Microsoft Azure", "Entra ID (AAD)",
                "Microsoft Purview", "Microsoft Teams", "SharePoint Online",
                "Dynamics 365", "PowerShell Automation", "Microsoft Graph API",
                "Proofpoint Email Security", "SPF / DKIM / DMARC", "DLP Policies",
                "Active Directory", "Hybrid Cloud Migration", "Email Management",
                "MCSA + Messaging", "Information Security", "SaaS Platforms",
                "Agentic AI Frameworks", "Engineering Leadership", "ITIL", "Zero Trust"
              ].map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1.5 rounded-full text-sm font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/25"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-cyan-500/5 border-t border-cyan-500/20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Work Directly with the Expert</h2>
            <p className="text-gray-300 text-lg mb-8">
              When you work with GigitekAI, you work directly with Harry — a senior Microsoft 365 architect with a track record of delivering results for Fortune 500 organizations and growing businesses alike.
            </p>
            <a
              href="/contact"
              className="inline-block px-8 py-3 bg-cyan-500 text-white font-semibold rounded-lg hover:bg-cyan-600 transition"
            >
              Schedule a Consultation
            </a>
          </div>
        </section>

      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
