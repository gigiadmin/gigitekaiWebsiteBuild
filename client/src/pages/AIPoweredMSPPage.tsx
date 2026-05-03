/*
  GigitekAI — AI-Powered MSP Landing Page
  Dedicated landing page targeting "AI managed service provider Tampa" keywords
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
import { ArrowRight, CheckCircle2, Bot, Zap, Clock, Shield, BarChart3, Users, Brain, Cpu, TrendingUp, Building2, HeadphonesIcon, Server } from "lucide-react";
import { useLocation } from "wouter";

const AI_MSP_FAQS = [
  {
    question: "What is an AI-powered managed service provider?",
    answer: "An AI-powered MSP uses artificial intelligence agents to automate IT support, security monitoring, and infrastructure management. Unlike traditional MSPs that rely entirely on human technicians, AI-powered MSPs like GigitekAI deploy intelligent agents that auto-resolve tickets, detect threats in real-time, and provision new employees across multiple systems in seconds."
  },
  {
    question: "How is GigitekAI different from a traditional MSP?",
    answer: "Traditional MSPs rely on human technicians for every task, creating bottlenecks and inconsistent response times. GigitekAI uses AI agents as full employees — they handle Tier-1 tickets instantly, classify and route complex issues, monitor security 24/7, and provision new users across 8+ systems in 3.4 seconds. Humans focus on strategic work while AI handles the repetitive tasks."
  },
  {
    question: "What kind of ROI can I expect from an AI-powered MSP?",
    answer: "GigitekAI clients typically see: 40% reduction in IT operational costs, 280+ hours freed monthly (for a 100-employee company), 3-4 month payback period, and 99.9% uptime vs. the industry average of 99.5%. Our AI agents resolve tickets in minutes instead of hours, dramatically reducing mean time to resolution."
  },
  {
    question: "Is AI support as reliable as human support?",
    answer: "For Tier-1 issues (password resets, access requests, common troubleshooting), AI agents are more reliable — they respond instantly 24/7, never take breaks, and follow consistent procedures every time. For complex Tier-2/3 issues, our AI automatically escalates to human engineers with full context, reducing resolution time even for complex problems."
  },
  {
    question: "What industries do you serve in Tampa Bay?",
    answer: "GigitekAI serves Tampa Bay businesses across healthcare (HIPAA-compliant), financial services (SOC 2, PCI-DSS), legal, manufacturing, retail & hospitality, and government. Our compliance-ready infrastructure supports HIPAA, SOC 2, PCI-DSS, and CMMC frameworks out of the box."
  },
  {
    question: "How quickly can GigitekAI onboard my business?",
    answer: "Typical onboarding takes 2-4 weeks depending on complexity. Our agentic orchestrator can provision new employees across 8+ systems in approximately 3.4 seconds. We handle the full transition from your current provider with zero downtime, including documentation, training, and a 30-day parallel support period."
  }
];

const aiCapabilities = [
  {
    icon: Bot,
    title: "AI Helpdesk Agent",
    description: "Tier-1 tickets auto-resolved in seconds. Password resets, access requests, and common troubleshooting handled without human intervention.",
    metric: "85%",
    metricLabel: "auto-resolution rate"
  },
  {
    icon: Shield,
    title: "AI Security Operations",
    description: "Real-time threat detection, automated incident response, and Zero Trust enforcement. AI monitors your environment 24/7/365.",
    metric: "<10s",
    metricLabel: "threat response time"
  },
  {
    icon: Zap,
    title: "Agentic Provisioning",
    description: "New employee onboarding across Microsoft 365, Azure AD, security tools, and 8+ systems in approximately 3.4 seconds.",
    metric: "3.4s",
    metricLabel: "provisioning time"
  },
  {
    icon: Brain,
    title: "Intelligent Routing",
    description: "AI classifies tickets by category, priority, and required expertise — routing to the right specialist instantly with full context.",
    metric: "0s",
    metricLabel: "wait time"
  },
  {
    icon: BarChart3,
    title: "Predictive Analytics",
    description: "AI monitors infrastructure trends and predicts failures before they happen. Proactive remediation prevents downtime.",
    metric: "99.9%",
    metricLabel: "uptime SLA"
  },
  {
    icon: HeadphonesIcon,
    title: "24/7 AI Support",
    description: "No waiting for business hours. AI agents respond instantly to any issue, any time. Human escalation available when needed.",
    metric: "24/7",
    metricLabel: "instant response"
  }
];

const comparisonData = [
  { feature: "Response Time", traditional: "15-60 minutes", gigitekai: "Instant (< 10 seconds)" },
  { feature: "Tier-1 Resolution", traditional: "30-120 minutes", gigitekai: "Auto-resolved in seconds" },
  { feature: "Availability", traditional: "Business hours + on-call", gigitekai: "24/7/365 AI + human" },
  { feature: "New User Provisioning", traditional: "1-3 business days", gigitekai: "3.4 seconds" },
  { feature: "Threat Detection", traditional: "Hours to days", gigitekai: "Real-time (< 10 seconds)" },
  { feature: "Monthly Cost Savings", traditional: "Baseline", gigitekai: "Up to 40% reduction" },
  { feature: "Uptime SLA", traditional: "99.5% average", gigitekai: "99.9% guaranteed" },
  { feature: "Scalability", traditional: "Add headcount", gigitekai: "AI scales instantly" },
];

export default function AIPoweredMSPPage() {
  const [, navigate] = useLocation();
  const seoConfig = SEO_CONFIG["/ai-powered-msp"] ?? {
    title: "AI-Powered Managed Service Provider Tampa Bay | GigitekAI",
    description: "GigitekAI is Tampa Bay's AI-first MSP. AI agents handle helpdesk, security, and provisioning — delivering 40% cost reduction and 99.9% uptime.",
  };
  useSEO(seoConfig);

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0E1A]">
      <SiteNavBar2024 />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A0E1A] via-[#0F1629] to-[#0A0E1A]" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-10 w-72 h-72 bg-emerald-500 rounded-full blur-[120px]" />
          <div className="absolute bottom-10 left-20 w-96 h-96 bg-[#00D4FF] rounded-full blur-[150px]" />
        </div>

        <div className="container relative z-10 max-w-6xl mx-auto px-4">
          <Breadcrumb items={[
            { label: "Home", href: "/" },
            { label: "AI-Powered MSP" },
          ]} />

          <div className="max-w-4xl mt-8">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2 mb-6">
              <Bot className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 text-sm font-medium">AI Agents as Full Employees</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              The AI-Powered MSP
              <span className="text-[#00D4FF]"> That Replaces Manual IT</span>
            </h1>

            <p className="text-lg text-gray-300 mb-8 leading-relaxed max-w-3xl">
              GigitekAI deploys intelligent AI agents that handle helpdesk tickets, security monitoring, and employee provisioning — delivering enterprise-grade IT support at a fraction of traditional MSP costs. Serving 50+ businesses across Tampa Bay and North America.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {[
                { value: "40%", label: "Cost Reduction" },
                { value: "280+", label: "Hours Freed/Mo" },
                { value: "3.4s", label: "Provisioning" },
                { value: "99.9%", label: "Uptime SLA" },
              ].map((stat, i) => (
                <div key={i} className="bg-[#111827]/60 border border-gray-800 rounded-xl p-4 text-center">
                  <div className="text-2xl md:text-3xl font-bold text-[#00D4FF]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{stat.value}</div>
                  <div className="text-gray-400 text-xs mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate("/contact")}
                className="inline-flex items-center justify-center gap-2 bg-[#00D4FF] text-[#0A0E1A] px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[#00D4FF]/90 transition-all"
              >
                Get Free IT Assessment
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate("/ai-demo")}
                className="inline-flex items-center justify-center gap-2 border border-[#00D4FF]/30 text-[#00D4FF] px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[#00D4FF]/10 transition-all"
              >
                Watch AI Agents Work Live
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* AI Capabilities Grid */}
      <section className="py-20 bg-[#0F1629]">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              AI Agents That <span className="text-[#00D4FF]">Work Like Employees</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Our multi-system agentic AI orchestrator handles the work that used to require a team of technicians.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {aiCapabilities.map((cap, i) => (
              <div key={i} className="bg-[#0A0E1A]/60 border border-gray-800 rounded-xl p-6 hover:border-[#00D4FF]/30 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#00D4FF]/10 rounded-lg flex items-center justify-center">
                    <cap.icon className="w-5 h-5 text-[#00D4FF]" />
                  </div>
                  <h3 className="text-white text-lg font-semibold">{cap.title}</h3>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">{cap.description}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-[#00D4FF]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{cap.metric}</span>
                  <span className="text-gray-500 text-sm">{cap.metricLabel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 bg-[#0A0E1A]">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Traditional MSP vs. <span className="text-[#00D4FF]">AI-Powered MSP</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              See why Tampa Bay businesses are switching from traditional IT support to AI-powered managed services.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-gray-400 text-sm font-medium py-4 px-4">Feature</th>
                  <th className="text-left text-gray-400 text-sm font-medium py-4 px-4">Traditional MSP</th>
                  <th className="text-left text-[#00D4FF] text-sm font-medium py-4 px-4">GigitekAI (AI-Powered)</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, i) => (
                  <tr key={i} className="border-b border-gray-800/50">
                    <td className="text-white text-sm font-medium py-4 px-4">{row.feature}</td>
                    <td className="text-gray-500 text-sm py-4 px-4">{row.traditional}</td>
                    <td className="text-[#00D4FF] text-sm font-medium py-4 px-4">{row.gigitekai}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-[#0F1629]">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              How GigitekAI <span className="text-[#00D4FF]">Transforms Your IT</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: BarChart3,
                title: "Free IT Assessment",
                description: "We audit your current infrastructure, security posture, and IT spend. You get a detailed report with ROI projections and a technology roadmap — no obligation."
              },
              {
                step: "02",
                icon: Server,
                title: "Seamless Onboarding",
                description: "We migrate your systems, deploy AI agents, configure security, and train your team. Zero downtime transition with 30-day parallel support from your current provider."
              },
              {
                step: "03",
                icon: TrendingUp,
                title: "Continuous Optimization",
                description: "AI agents learn and improve over time. Monthly reporting, quarterly business reviews, and proactive recommendations keep your IT ahead of the curve."
              }
            ].map((item, i) => (
              <div key={i} className="text-center p-8 bg-[#0A0E1A]/60 border border-gray-800 rounded-xl relative overflow-hidden">
                <div className="absolute top-4 right-4 text-6xl font-bold text-[#00D4FF]/5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{item.step}</div>
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-[#00D4FF]/10 rounded-xl flex items-center justify-center mx-auto mb-6">
                    <item.icon className="w-7 h-7 text-[#00D4FF]" />
                  </div>
                  <h3 className="text-white text-xl font-semibold mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{item.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries Served */}
      <section className="py-20 bg-[#0A0E1A]">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Industries We Serve in <span className="text-[#00D4FF]">Tampa Bay</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: Building2, name: "Healthcare", compliance: "HIPAA" },
              { icon: TrendingUp, name: "Financial", compliance: "SOC 2" },
              { icon: Shield, name: "Legal", compliance: "CJIS" },
              { icon: Cpu, name: "Manufacturing", compliance: "CMMC" },
              { icon: Users, name: "Retail", compliance: "PCI-DSS" },
              { icon: Building2, name: "Government", compliance: "FedRAMP" },
            ].map((ind, i) => (
              <div key={i} className="text-center p-4 bg-[#111827]/40 border border-gray-800 rounded-xl hover:border-[#00D4FF]/20 transition-all">
                <ind.icon className="w-8 h-8 text-[#00D4FF] mx-auto mb-2" />
                <div className="text-white text-sm font-medium">{ind.name}</div>
                <div className="text-[#00D4FF] text-xs mt-1">{ind.compliance}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-[#0F1629]">
        <div className="container max-w-4xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Frequently Asked <span className="text-[#00D4FF]">Questions</span>
          </h2>

          <div className="space-y-4">
            {AI_MSP_FAQS.map((faq, i) => (
              <details key={i} className="group bg-[#0A0E1A]/60 border border-gray-800 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between p-6 cursor-pointer text-white font-medium hover:text-[#00D4FF] transition-colors">
                  {faq.question}
                  <ArrowRight className="w-5 h-5 text-gray-500 group-open:rotate-90 transition-transform flex-shrink-0 ml-4" />
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
            Ready to Replace Manual IT <span className="text-[#00D4FF]">with AI?</span>
          </h2>
          <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
            Get a free IT assessment for your Tampa Bay business. We'll show you exactly how AI agents can reduce costs, improve uptime, and free your team to focus on growth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/contact")}
              className="inline-flex items-center justify-center gap-2 bg-[#00D4FF] text-[#0A0E1A] px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[#00D4FF]/90 transition-all"
            >
              Get Free IT Assessment
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

      <FAQSchema faqs={AI_MSP_FAQS} />
      <StructuredData data={{
        "@context": "https://schema.org",
        "@type": "Service",
        "name": "AI-Powered Managed IT Services",
        "provider": {
          "@type": "Organization",
          "name": "GigitekAI",
          "url": "https://gigitekai.com"
        },
        "areaServed": {
          "@type": "City",
          "name": "Tampa Bay"
        },
        "description": "AI-first managed service provider delivering enterprise-grade IT support, cybersecurity, Microsoft 365 management, and AI automation for Tampa Bay businesses.",
        "serviceType": "AI-Powered Managed IT Services"
      }} />

      <Footer />
      <ScrollToTop />
      <LeadCapturePopup />
    </div>
  );
}
