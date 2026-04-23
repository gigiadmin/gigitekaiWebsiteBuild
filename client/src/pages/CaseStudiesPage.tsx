/*
  GigitekAI Case Studies Page — Anonymized real-world success stories
  Uses GigitekAI's actual vendor stack and service capabilities
  Design: Cyberpunk Minimalism meets Enterprise Precision
*/

import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  TrendingDown,
  Clock,
  Shield,
  Users,
  BarChart3,
  Zap,
  Building2,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSEO } from "@/hooks/useSEO";
import SiteNavBar2024 from "@/components/SiteNavBar2024";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";

interface CaseStudy {
  id: number;
  industry: string;
  title: string;
  challenge: string;
  solution: string;
  results: { metric: string; value: string; icon: any }[];
  technologies: string[];
  timeline: string;
  teamSize: string;
}

const caseStudies: CaseStudy[] = [
  {
    id: 1,
    industry: "Healthcare",
    title: "Multi-Site Healthcare Provider — M365 Migration & Security Hardening",
    challenge:
      "A regional healthcare network with 12 clinic locations was running on-premises Exchange 2013 with no MFA, outdated compliance controls, and frequent downtime impacting patient scheduling. HIPAA audit findings required immediate remediation.",
    solution:
      "GigitekAI executed a phased migration to Exchange Online with zero-downtime cutover, implemented Conditional Access policies and MFA across all 450+ users, deployed Microsoft Purview for DLP and sensitivity labels, and configured Defender for Office 365 to block phishing threats targeting clinical staff.",
    results: [
      { metric: "Downtime Reduction", value: "99.2%", icon: TrendingDown },
      { metric: "Migration Duration", value: "6 weeks", icon: Clock },
      { metric: "HIPAA Findings Resolved", value: "100%", icon: Shield },
      { metric: "Phishing Blocked (Month 1)", value: "2,400+", icon: Shield },
    ],
    technologies: [
      "Exchange Online",
      "Entra ID",
      "Conditional Access",
      "Microsoft Purview",
      "Defender for Office 365",
    ],
    timeline: "6 weeks",
    teamSize: "Lead architect + 2 engineers",
  },
  {
    id: 2,
    industry: "Legal",
    title: "Mid-Size Law Firm — Zero Trust Security Transformation",
    challenge:
      "A 120-attorney law firm handling sensitive litigation discovered unauthorized access attempts on their legacy VPN. Client confidentiality was at risk, and their cyber insurance provider demanded a Zero Trust architecture within 90 days or premiums would triple.",
    solution:
      "GigitekAI designed and deployed a Zero Trust framework: replaced the legacy VPN with Entra ID Application Proxy, implemented device compliance policies via Intune, deployed NordLayer for encrypted network access, configured ConnectSecure for continuous vulnerability scanning, and established DefensX browser isolation for high-risk web activity.",
    results: [
      { metric: "Unauthorized Access", value: "0 post-deploy", icon: Shield },
      { metric: "Insurance Savings", value: "~40%", icon: TrendingDown },
      { metric: "Deployment Time", value: "8 weeks", icon: Clock },
      { metric: "Compliance Score", value: "98/100", icon: BarChart3 },
    ],
    technologies: [
      "Entra ID",
      "Intune",
      "NordLayer",
      "ConnectSecure",
      "DefensX",
      "Conditional Access",
    ],
    timeline: "8 weeks",
    teamSize: "Lead architect + security engineer",
  },
  {
    id: 3,
    industry: "Managed Services",
    title: "Growing MSP — AI-Powered Helpdesk & Ticket Automation",
    challenge:
      "An MSP managing 35 client environments was drowning in ticket volume — 200+ tickets/day with 3 technicians. Average response time exceeded 4 hours, SLA breaches were climbing, and client churn reached 15% annually. Manual triage consumed 40% of technician time.",
    solution:
      "GigitekAI deployed its AI-powered helpdesk platform with automated ticket classification, priority routing, and SLA monitoring. Integrated Microsoft Teams for real-time notifications, built email-to-ticket automation via Microsoft Graph, and implemented AI-suggested responses that technicians could approve with one click.",
    results: [
      { metric: "Avg Response Time", value: "< 30 min", icon: Clock },
      { metric: "Manual Triage Eliminated", value: "85%", icon: Zap },
      { metric: "Client Retention", value: "97%", icon: Users },
      { metric: "Tickets/Tech Capacity", value: "3x increase", icon: BarChart3 },
    ],
    technologies: [
      "GigitekAI Helpdesk",
      "Microsoft Graph API",
      "Teams Integration",
      "AI Classification",
      "SLA Engine",
    ],
    timeline: "4 weeks",
    teamSize: "Lead architect + AI engineer",
  },
  {
    id: 4,
    industry: "Manufacturing",
    title: "Industrial Manufacturer — Hybrid Cloud Infrastructure Modernization",
    challenge:
      "A 500-employee manufacturer with 3 production facilities relied on aging on-premises servers running Windows Server 2012 R2. ERP and production monitoring systems experienced frequent outages, and disaster recovery was limited to tape backups with a 72-hour RTO.",
    solution:
      "GigitekAI architected a hybrid cloud solution: migrated non-critical workloads to Azure, kept latency-sensitive production systems on-premises with Azure Arc management, deployed Commvault for unified backup across hybrid environments, and implemented Afi for M365 backup. Achieved a 4-hour RTO with automated failover.",
    results: [
      { metric: "RTO Improvement", value: "72h → 4h", icon: Clock },
      { metric: "Infrastructure Savings", value: "~35%", icon: TrendingDown },
      { metric: "Unplanned Downtime", value: "< 2h/quarter", icon: BarChart3 },
      { metric: "Backup Coverage", value: "100%", icon: Shield },
    ],
    technologies: [
      "Azure",
      "Azure Arc",
      "Commvault",
      "Afi Backup",
      "Windows Server 2022",
      "Hyper-V",
    ],
    timeline: "12 weeks",
    teamSize: "Lead architect + 2 engineers + PM",
  },
];

export default function CaseStudiesPage() {
  useSEO({
    title: "Case Studies | GigitekAI — Real Results for Real Businesses",
    description:
      "See how GigitekAI delivers measurable results: M365 migrations, Zero Trust security, AI helpdesk automation, and hybrid cloud modernization for healthcare, legal, MSP, and manufacturing clients.",
    path: "/case-studies",
  });

  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNavBar2024 />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-[#0A0E1A] py-20 lg:py-28 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,212,255,0.08),transparent_60%)]" />
          <div className="container relative z-10 max-w-4xl text-center">
            <div
              className="inline-block px-4 py-1.5 rounded-full border border-[rgba(0,212,255,0.3)] text-[#00D4FF] text-xs font-bold uppercase tracking-widest mb-6"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Case Studies
            </div>
            <h1
              className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Real Results for Real Businesses
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed max-w-2xl mx-auto">
              Anonymized case studies showcasing how GigitekAI helps organizations across
              healthcare, legal, managed services, and manufacturing achieve measurable
              outcomes through cloud modernization, security hardening, and AI automation.
            </p>
          </div>
        </section>

        {/* Case Studies */}
        <section className="bg-[#0D1117] py-20">
          <div className="container max-w-5xl">
            {caseStudies.map((cs, idx) => (
              <div
                key={cs.id}
                className={`mb-12 last:mb-0 ${idx > 0 ? "pt-12 border-t border-[rgba(0,212,255,0.1)]" : ""}`}
              >
                {/* Industry badge + title */}
                <div className="flex items-center gap-3 mb-4">
                  <Building2 size={18} className="text-[#00D4FF]" />
                  <span className="text-[#00D4FF] text-xs font-bold uppercase tracking-widest">
                    {cs.industry}
                  </span>
                </div>
                <h2
                  className="text-2xl lg:text-3xl font-bold text-white mb-2"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {cs.title}
                </h2>
                <p className="text-gray-500 text-sm mb-6">
                  {cs.timeline} · {cs.teamSize}
                </p>

                {/* Results grid — always visible */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {cs.results.map((r) => {
                    const RIcon = r.icon;
                    return (
                      <div
                        key={r.metric}
                        className="bg-[#1a1f2e] rounded-lg p-5 border border-[rgba(0,212,255,0.08)]"
                      >
                        <RIcon size={20} className="text-[#00D4FF] mb-2" />
                        <div
                          className="text-2xl font-bold text-white mb-1"
                          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                        >
                          {r.value}
                        </div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">
                          {r.metric}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Expand/Collapse for details */}
                <button
                  onClick={() => setExpandedId(expandedId === cs.id ? null : cs.id)}
                  className="flex items-center gap-2 text-[#00D4FF] text-sm font-medium hover:underline mb-4"
                >
                  {expandedId === cs.id ? "Hide Details" : "Read Full Case Study"}
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-300 ${expandedId === cs.id ? "rotate-180" : ""}`}
                  />
                </button>

                {expandedId === cs.id && (
                  <div className="grid lg:grid-cols-2 gap-8 mb-6 animate-in fade-in duration-300">
                    <div>
                      <h3
                        className="text-sm font-bold uppercase tracking-widest text-red-400 mb-3"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        The Challenge
                      </h3>
                      <p className="text-gray-400 leading-relaxed">{cs.challenge}</p>
                    </div>
                    <div>
                      <h3
                        className="text-sm font-bold uppercase tracking-widest text-[#00D4FF] mb-3"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        Our Solution
                      </h3>
                      <p className="text-gray-400 leading-relaxed">{cs.solution}</p>
                    </div>
                  </div>
                )}

                {/* Technologies */}
                <div className="flex flex-wrap gap-2">
                  {cs.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-[rgba(0,212,255,0.08)] text-[#00D4FF] border border-[rgba(0,212,255,0.15)]"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#0A0E1A] py-20 border-t border-[rgba(0,212,255,0.1)]">
          <div className="container max-w-3xl text-center">
            <h2
              className="text-3xl font-bold text-white mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Ready to Become Our Next Success Story?
            </h2>
            <p className="text-gray-400 mb-8">
              Schedule a free Cloud & AI Readiness Assessment and discover how GigitekAI
              can deliver measurable results for your organization.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => (window.location.href = "/contact")}
                className="bg-[#00D4FF] hover:bg-[#00B8E0] text-black font-semibold inline-flex items-center gap-2"
              >
                Schedule Assessment <ArrowRight size={16} />
              </Button>
              <Button
                onClick={() => (window.location.href = "/services")}
                variant="outline"
                className="border-[rgba(0,212,255,0.3)] text-[#00D4FF] hover:bg-[rgba(0,212,255,0.05)] inline-flex items-center gap-2"
              >
                View Our Services
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
