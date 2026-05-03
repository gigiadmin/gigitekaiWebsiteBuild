/*
  GigitekAI — Microsoft Copilot for Business Service Page
  Dedicated landing page targeting "Microsoft Copilot Tampa Bay" keywords
  Design: Cyberpunk Minimalism meets Enterprise Precision
*/

import SiteNavBar2024 from "@/components/SiteNavBar2024";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import LeadCapturePopup from "@/components/LeadCapturePopup";
import Breadcrumb from "@/components/Breadcrumb";
import { useSEO } from "@/hooks/useSEO";
import { SEO_CONFIG } from "@/lib/seoConfig";
import StructuredData from "@/components/StructuredData";
import { FAQSchema } from "@/components/FAQSchema";
import { ArrowRight, CheckCircle2, Sparkles, Brain, Shield, BarChart3, Users, Zap, Clock, DollarSign, Building2, Cpu } from "lucide-react";
import { useLocation } from "wouter";

const COPILOT_FAQS = [
  {
    question: "What is Microsoft Copilot for Business?",
    answer: "Microsoft Copilot is an AI-powered assistant integrated into Microsoft 365 apps (Word, Excel, PowerPoint, Outlook, Teams). It uses large language models to help employees draft documents, analyze data, summarize meetings, create presentations, and automate repetitive tasks — all within the tools they already use."
  },
  {
    question: "How much does Microsoft Copilot cost per user?",
    answer: "Microsoft 365 Copilot is available starting at $30/user/month as an add-on to qualifying Microsoft 365 plans (Business Standard, Business Premium, E3, E5). GigitekAI can help optimize your licensing through our Sherweb partnership to reduce overall costs."
  },
  {
    question: "Do I need a specific Microsoft 365 plan for Copilot?",
    answer: "Yes, Copilot requires Microsoft 365 Business Standard, Business Premium, E3, or E5. If you're on Business Basic, you'll need to upgrade. GigitekAI can audit your current licensing and recommend the most cost-effective path to Copilot readiness."
  },
  {
    question: "How long does it take to deploy Microsoft Copilot?",
    answer: "A typical deployment takes 2-4 weeks. This includes tenant readiness assessment, security and compliance configuration, pilot group rollout, training, and full organization deployment. GigitekAI handles the entire process end-to-end."
  },
  {
    question: "Is Microsoft Copilot secure for business use?",
    answer: "Yes. Copilot inherits your Microsoft 365 security and compliance policies. It only accesses data the user already has permission to see. GigitekAI configures proper data governance, sensitivity labels, and access controls before deployment to ensure your data stays protected."
  },
  {
    question: "What ROI can I expect from Microsoft Copilot?",
    answer: "According to a Forrester Total Economic Impact study, organizations see up to 353% ROI from Microsoft 365 Copilot. Users report 70% productivity increases and complete tasks 29% faster. GigitekAI helps measure and maximize your specific ROI through adoption tracking and optimization."
  }
];

const deploymentPhases = [
  {
    phase: "01",
    title: "Readiness Assessment",
    duration: "Week 1",
    description: "We audit your Microsoft 365 tenant, licensing, security posture, and data governance to ensure Copilot readiness.",
    items: ["Tenant health check", "License audit & optimization", "Security posture review", "Data classification assessment"]
  },
  {
    phase: "02",
    title: "Security & Governance",
    duration: "Week 1-2",
    description: "Configure data loss prevention, sensitivity labels, and access controls to ensure Copilot only surfaces appropriate data.",
    items: ["DLP policy configuration", "Sensitivity labels setup", "Conditional access policies", "SharePoint permissions audit"]
  },
  {
    phase: "03",
    title: "Pilot Deployment",
    duration: "Week 2-3",
    description: "Roll out Copilot to a pilot group of 10-25 power users, gather feedback, and optimize the experience.",
    items: ["Pilot group selection", "License assignment", "Hands-on training sessions", "Feedback collection & analysis"]
  },
  {
    phase: "04",
    title: "Full Rollout & Adoption",
    duration: "Week 3-4",
    description: "Deploy to the entire organization with role-specific training, adoption tracking, and ongoing optimization.",
    items: ["Organization-wide deployment", "Role-specific training", "Adoption dashboard setup", "Monthly optimization reviews"]
  }
];

const useCases = [
  {
    icon: Sparkles,
    title: "Document Creation",
    description: "Draft proposals, reports, and emails in seconds. Copilot in Word generates first drafts from prompts, existing documents, or meeting notes.",
    stat: "50% faster",
    statLabel: "document creation"
  },
  {
    icon: BarChart3,
    title: "Data Analysis",
    description: "Ask questions about your Excel data in plain English. Copilot creates formulas, pivot tables, and visualizations without manual work.",
    stat: "4x faster",
    statLabel: "data insights"
  },
  {
    icon: Users,
    title: "Meeting Summaries",
    description: "Never miss action items again. Copilot in Teams summarizes meetings, captures decisions, and assigns follow-ups automatically.",
    stat: "3.8 hrs",
    statLabel: "saved per week"
  },
  {
    icon: Zap,
    title: "Email Management",
    description: "Copilot in Outlook drafts replies, summarizes long threads, and prioritizes your inbox so you focus on what matters.",
    stat: "70%",
    statLabel: "productivity boost"
  },
  {
    icon: Brain,
    title: "Presentation Design",
    description: "Create polished PowerPoint presentations from a simple prompt or Word document. Copilot handles layout, design, and speaker notes.",
    stat: "29% faster",
    statLabel: "task completion"
  },
  {
    icon: Shield,
    title: "Security & Compliance",
    description: "Copilot respects your existing security policies. It only accesses data users are authorized to see, with full audit logging.",
    stat: "100%",
    statLabel: "policy compliant"
  }
];

export default function MicrosoftCopilotPage() {
  const [, navigate] = useLocation();
  const seoConfig = SEO_CONFIG["/services/microsoft-copilot"] ?? {
    title: "Microsoft Copilot for Business | Tampa Bay Deployment | GigitekAI",
    description: "Expert Microsoft Copilot deployment and optimization for Tampa Bay businesses. GigitekAI delivers end-to-end Copilot setup, training, and ROI tracking.",
  };
  useSEO(seoConfig);

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0E1A]">
      <SiteNavBar2024 />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A0E1A] via-[#0F1629] to-[#0A0E1A]" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#00D4FF] rounded-full blur-[120px]" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-purple-500 rounded-full blur-[150px]" />
        </div>

        <div className="container relative z-10 max-w-6xl mx-auto px-4">
          <Breadcrumb items={[
            { label: "Home", href: "/" },
            { label: "Services", href: "/services" },
            { label: "Microsoft Copilot" },
          ]} />

          <div className="grid lg:grid-cols-2 gap-12 items-center mt-8">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#00D4FF]/10 border border-[#00D4FF]/20 rounded-full px-4 py-2 mb-6">
                <Sparkles className="w-4 h-4 text-[#00D4FF]" />
                <span className="text-[#00D4FF] text-sm font-medium">Microsoft Copilot Certified Partner</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Microsoft Copilot
                <span className="text-[#00D4FF]"> for Business</span>
              </h1>

              <p className="text-lg text-gray-300 mb-8 leading-relaxed max-w-xl">
                Deploy AI-powered productivity across your entire organization. GigitekAI handles the complete Copilot journey — from tenant readiness and security configuration to training and adoption tracking — for Tampa Bay businesses.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate("/contact")}
                  className="inline-flex items-center justify-center gap-2 bg-[#00D4FF] text-[#0A0E1A] px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[#00D4FF]/90 transition-all"
                >
                  Get Copilot Assessment
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => navigate("/roi-calculator")}
                  className="inline-flex items-center justify-center gap-2 border border-[#00D4FF]/30 text-[#00D4FF] px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[#00D4FF]/10 transition-all"
                >
                  Calculate Your ROI
                </button>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="bg-[#111827]/80 border border-[#00D4FF]/10 rounded-2xl p-8">
                <h3 className="text-white text-xl font-semibold mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Copilot ROI at a Glance</h3>
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { value: "353%", label: "Average ROI", source: "Forrester TEI Study" },
                    { value: "70%", label: "Productivity Boost", source: "Microsoft Data" },
                    { value: "29%", label: "Faster Tasks", source: "Microsoft Data" },
                    { value: "3.8 hrs", label: "Saved Per Week", source: "Per User Average" },
                  ].map((stat, i) => (
                    <div key={i} className="text-center p-4 bg-[#0A0E1A]/50 rounded-xl">
                      <div className="text-3xl font-bold text-[#00D4FF] mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{stat.value}</div>
                      <div className="text-white text-sm font-medium">{stat.label}</div>
                      <div className="text-gray-500 text-xs mt-1">{stat.source}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Copilot Does Section */}
      <section className="py-20 bg-[#0F1629]">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              What Microsoft Copilot <span className="text-[#00D4FF]">Does for Your Team</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              AI-powered assistance embedded directly in the Microsoft 365 apps your team uses every day.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {useCases.map((uc, i) => (
              <div key={i} className="bg-[#0A0E1A]/60 border border-gray-800 rounded-xl p-6 hover:border-[#00D4FF]/30 transition-all group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#00D4FF]/10 rounded-lg flex items-center justify-center">
                    <uc.icon className="w-5 h-5 text-[#00D4FF]" />
                  </div>
                  <h3 className="text-white text-lg font-semibold">{uc.title}</h3>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">{uc.description}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-[#00D4FF]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{uc.stat}</span>
                  <span className="text-gray-500 text-sm">{uc.statLabel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deployment Process */}
      <section className="py-20 bg-[#0A0E1A]">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Our 4-Week <span className="text-[#00D4FF]">Copilot Deployment</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              A proven, structured approach to deploying Microsoft Copilot across your organization with minimal disruption and maximum adoption.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {deploymentPhases.map((phase, i) => (
              <div key={i} className="bg-[#111827]/60 border border-gray-800 rounded-xl p-8 relative overflow-hidden">
                <div className="absolute top-4 right-4 text-6xl font-bold text-[#00D4FF]/5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{phase.phase}</div>
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 bg-[#00D4FF]/10 rounded-full px-3 py-1 mb-4">
                    <Clock className="w-3 h-3 text-[#00D4FF]" />
                    <span className="text-[#00D4FF] text-xs font-medium">{phase.duration}</span>
                  </div>
                  <h3 className="text-white text-xl font-semibold mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{phase.title}</h3>
                  <p className="text-gray-400 text-sm mb-4">{phase.description}</p>
                  <ul className="space-y-2">
                    {phase.items.map((item, j) => (
                      <li key={j} className="flex items-center gap-2 text-gray-300 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-[#00D4FF] flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-[#0F1629]">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Copilot <span className="text-[#00D4FF]">Pricing & Plans</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Transparent pricing for Microsoft Copilot deployment and management. All plans include GigitekAI's expert support.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Copilot Readiness",
                price: "One-Time",
                priceDetail: "Contact for quote",
                description: "Prepare your tenant for Copilot deployment",
                features: [
                  "M365 tenant health assessment",
                  "License audit & recommendations",
                  "Security posture review",
                  "Data governance assessment",
                  "Readiness report with action items",
                ],
                cta: "Get Assessment",
                popular: false
              },
              {
                name: "Copilot Deployment",
                price: "Per User",
                priceDetail: "$30/mo + deployment",
                description: "Full end-to-end Copilot deployment",
                features: [
                  "Everything in Readiness",
                  "Security & DLP configuration",
                  "Pilot group deployment",
                  "Organization-wide rollout",
                  "Role-specific training sessions",
                  "30-day post-deployment support",
                ],
                cta: "Deploy Copilot",
                popular: true
              },
              {
                name: "Copilot Managed",
                price: "Per User/Mo",
                priceDetail: "Contact for pricing",
                description: "Ongoing Copilot optimization & support",
                features: [
                  "Everything in Deployment",
                  "Monthly adoption reporting",
                  "Quarterly optimization reviews",
                  "New feature rollout management",
                  "Priority support for Copilot issues",
                  "Custom Copilot agent development",
                ],
                cta: "Get Managed Plan",
                popular: false
              }
            ].map((plan, i) => (
              <div key={i} className={`relative bg-[#0A0E1A]/60 border rounded-xl p-8 ${plan.popular ? 'border-[#00D4FF] ring-1 ring-[#00D4FF]/20' : 'border-gray-800'}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#00D4FF] text-[#0A0E1A] text-xs font-bold px-4 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="text-white text-xl font-semibold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{plan.name}</h3>
                <div className="text-[#00D4FF] text-sm font-medium mb-1">{plan.price}</div>
                <div className="text-gray-400 text-xs mb-4">{plan.priceDetail}</div>
                <p className="text-gray-400 text-sm mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-gray-300 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-[#00D4FF] flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate("/contact")}
                  className={`w-full py-3 rounded-lg font-semibold text-sm transition-all ${plan.popular ? 'bg-[#00D4FF] text-[#0A0E1A] hover:bg-[#00D4FF]/90' : 'border border-[#00D4FF]/30 text-[#00D4FF] hover:bg-[#00D4FF]/10'}`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why GigitekAI Section */}
      <section className="py-20 bg-[#0A0E1A]">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Why Tampa Bay Businesses <span className="text-[#00D4FF]">Choose GigitekAI</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Cpu, title: "Certified M365 Architect", desc: "25+ years of Microsoft expertise. We know M365 inside and out." },
              { icon: Building2, title: "Tampa Bay Local", desc: "Headquartered in Tampa. On-site support when you need it." },
              { icon: DollarSign, title: "Sherweb Partner Pricing", desc: "Save 15-30% on licensing through our strategic partnership." },
              { icon: Shield, title: "Security-First", desc: "Zero Trust, HIPAA, SOC 2, PCI-DSS compliance built in." },
            ].map((item, i) => (
              <div key={i} className="text-center p-6">
                <div className="w-14 h-14 bg-[#00D4FF]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-7 h-7 text-[#00D4FF]" />
                </div>
                <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-[#0F1629]">
        <div className="container max-w-4xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Copilot <span className="text-[#00D4FF]">FAQ</span>
          </h2>

          <div className="space-y-4">
            {COPILOT_FAQS.map((faq, i) => (
              <details key={i} className="group bg-[#0A0E1A]/60 border border-gray-800 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between p-6 cursor-pointer text-white font-medium hover:text-[#00D4FF] transition-colors">
                  {faq.question}
                  <ArrowRight className="w-5 h-5 text-gray-500 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="px-6 pb-6 text-gray-400 text-sm leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#0A0E1A]">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Ready to Deploy <span className="text-[#00D4FF]">Microsoft Copilot?</span>
          </h2>
          <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
            Get a free Copilot readiness assessment for your Tampa Bay business. We'll evaluate your M365 tenant and provide a deployment roadmap with ROI projections.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/contact")}
              className="inline-flex items-center justify-center gap-2 bg-[#00D4FF] text-[#0A0E1A] px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[#00D4FF]/90 transition-all"
            >
              Schedule Free Assessment
              <ArrowRight className="w-5 h-5" />
            </button>
            <a
              href="tel:+17273825776"
              className="inline-flex items-center justify-center gap-2 border border-[#00D4FF]/30 text-[#00D4FF] px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[#00D4FF]/10 transition-all"
            >
              Call (727) 382-5776
            </a>
          </div>
        </div>
      </section>

      <FAQSchema faqs={COPILOT_FAQS} />
      <StructuredData data={{
        "@context": "https://schema.org",
        "@type": "Service",
        "name": "Microsoft Copilot Deployment & Management",
        "provider": {
          "@type": "Organization",
          "name": "GigitekAI",
          "url": "https://gigitekai.com"
        },
        "areaServed": {
          "@type": "City",
          "name": "Tampa Bay"
        },
        "description": "Expert Microsoft Copilot deployment, training, and ongoing management for Tampa Bay businesses. Includes readiness assessment, security configuration, and adoption tracking.",
        "serviceType": "Microsoft Copilot Deployment"
      }} />

      <Footer />
      <ScrollToTop />
      <LeadCapturePopup />
    </div>
  );
}
