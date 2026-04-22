import { useState } from "react";
import { ArrowRight, CheckCircle2, TrendingUp, Zap, Shield, Users, BarChart3, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function CaseStudiesPage() {
  const [selectedCase, setSelectedCase] = useState<number | null>(null);

  const caseStudies = [
    {
      id: 1,
      title: "Regional MSP: 40% Helpdesk Cost Reduction",
      company: "TechServe Solutions",
      industry: "Managed IT Services",
      challenge:
        "A mid-sized MSP was struggling with high helpdesk costs and slow ticket resolution times. Manual ticket categorization and routing were causing delays, and their team was spending 60% of time on repetitive tasks.",
      solution:
        "Implemented GigitekAI's intelligent ticket automation and AI agents for first-line support. Deployed automated categorization, intelligent routing, and AI-powered response suggestions using Microsoft Copilot integration.",
      results: [
        "40% reduction in helpdesk operational costs",
        "65% faster average ticket resolution time",
        "Freed up 12 FTEs to focus on strategic projects",
        "98% customer satisfaction score maintained",
      ],
      metrics: {
        costReduction: "40%",
        speedImprovement: "65%",
        staffProductivity: "+45%",
        roi: "280% in Year 1",
      },
      technologies: ["AI Agents", "Microsoft Copilot", "Automation", "Intelligent Routing"],
      timeline: "6 months to full deployment",
      impact: "high",
    },
    {
      id: 2,
      title: "Enterprise: AI-Powered Security Operations",
      company: "Fortune 500 Financial Services",
      industry: "Financial Services",
      challenge:
        "Large enterprise needed to modernize security operations and reduce incident response time. Manual threat analysis and slow escalation procedures were creating compliance risks.",
      solution:
        "Deployed GigitekAI's AI agents for security monitoring, threat analysis, and incident response automation. Integrated with existing SIEM and Microsoft Defender stack for real-time threat intelligence.",
      results: [
        "72% faster incident detection and response",
        "89% reduction in false positives",
        "Zero critical incidents missed",
        "Full compliance audit pass with zero findings",
      ],
      metrics: {
        incidentResponse: "72% faster",
        falsePositiveReduction: "89%",
        complianceScore: "100%",
        threatDetection: "+156%",
      },
      technologies: ["AI Agents", "SIEM Integration", "Threat Intelligence", "Compliance Automation"],
      timeline: "4 months to production",
      impact: "critical",
    },
    {
      id: 3,
      title: "SaaS Startup: Scaling Support Without Scaling Headcount",
      company: "CloudFlow Analytics",
      industry: "SaaS / Analytics",
      challenge:
        "Rapidly growing SaaS company was facing exponential support ticket volume. Hiring support staff couldn't keep pace with customer growth, leading to declining satisfaction scores.",
      solution:
        "Implemented GigitekAI's conversational AI agents for customer support. Used intelligent triage, knowledge base integration, and escalation workflows to handle 80% of tickets without human intervention.",
      results: [
        "Handled 10x ticket volume with same team size",
        "92% first-contact resolution rate",
        "Support costs per ticket reduced by 75%",
        "Customer satisfaction increased to 4.8/5 stars",
      ],
      metrics: {
        volumeCapacity: "10x increase",
        firstContactResolution: "92%",
        costPerTicket: "-75%",
        satisfaction: "4.8/5 stars",
      },
      technologies: ["Conversational AI", "Knowledge Base Integration", "Intelligent Triage", "Escalation Workflows"],
      timeline: "3 months to launch",
      impact: "high",
    },
    {
      id: 4,
      title: "Healthcare Provider: Compliance & Patient Support Automation",
      company: "MediCare Network",
      industry: "Healthcare",
      challenge:
        "Healthcare provider needed to automate patient support while maintaining HIPAA compliance. Manual appointment scheduling and patient inquiry handling were consuming significant staff time.",
      solution:
        "Deployed GigitekAI's healthcare-compliant AI agents for appointment scheduling, patient education, and support ticket routing. Integrated with EHR systems and Microsoft 365 for secure communication.",
      results: [
        "50% reduction in administrative staff workload",
        "95% of appointments scheduled automatically",
        "100% HIPAA compliance maintained",
        "Patient satisfaction improved by 35%",
      ],
      metrics: {
        administrativeEfficiency: "50% reduction",
        automatedAppointments: "95%",
        complianceScore: "100%",
        patientSatisfaction: "+35%",
      },
      technologies: ["Healthcare AI", "EHR Integration", "HIPAA Compliance", "Secure Messaging"],
      timeline: "5 months with compliance review",
      impact: "critical",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0E1A] to-[#141B2D]">
      {/* Header */}
      <div className="border-b border-gray-800/40 bg-[#0A0E1A]/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Case Studies
              </h1>
              <p className="text-gray-400">See how GigitekAI transforms MSP operations</p>
            </div>
            <Button
              onClick={() => (window.location.href = "/contact")}
              className="bg-[#00D4FF] hover:bg-[#00B8E0] text-black font-semibold hidden sm:flex items-center gap-2"
            >
              Schedule Consultation <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-[#141B2D]/60 border border-gray-800/40 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm font-medium">Avg Cost Reduction</span>
              <TrendingUp className="w-5 h-5 text-[#00D4FF]" />
            </div>
            <p className="text-2xl font-bold text-white">38%</p>
          </div>
          <div className="bg-[#141B2D]/60 border border-gray-800/40 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm font-medium">Avg Speed Gain</span>
              <Zap className="w-5 h-5 text-[#00D4FF]" />
            </div>
            <p className="text-2xl font-bold text-white">68%</p>
          </div>
          <div className="bg-[#141B2D]/60 border border-gray-800/40 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm font-medium">Satisfaction</span>
              <Users className="w-5 h-5 text-[#00D4FF]" />
            </div>
            <p className="text-2xl font-bold text-white">96%</p>
          </div>
          <div className="bg-[#141B2D]/60 border border-gray-800/40 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm font-medium">Avg ROI</span>
              <BarChart3 className="w-5 h-5 text-[#00D4FF]" />
            </div>
            <p className="text-2xl font-bold text-white">240%</p>
          </div>
        </div>

        {/* Case Studies Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {caseStudies.map((caseStudy) => (
            <div
              key={caseStudy.id}
              onClick={() => setSelectedCase(selectedCase === caseStudy.id ? null : caseStudy.id)}
              className="bg-[#141B2D]/60 border border-gray-800/40 rounded-xl p-6 cursor-pointer hover:border-[#00D4FF]/40 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">{caseStudy.title}</h3>
                  <p className="text-gray-400 text-sm mb-2">{caseStudy.company}</p>
                  <Badge variant="secondary" className="bg-[#00D4FF]/10 text-[#00D4FF] border-[#00D4FF]/20">
                    {caseStudy.industry}
                  </Badge>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  caseStudy.impact === "critical"
                    ? "bg-red-900/40 text-red-300 border border-red-800/40"
                    : "bg-amber-900/40 text-amber-300 border border-amber-800/40"
                }`}>
                  {caseStudy.impact === "critical" ? "Critical Impact" : "High Impact"}
                </div>
              </div>

              {/* Expanded View */}
              {selectedCase === caseStudy.id && (
                <div className="mt-6 pt-6 border-t border-gray-800/40 space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Challenge</h4>
                    <p className="text-sm text-gray-400">{caseStudy.challenge}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Solution</h4>
                    <p className="text-sm text-gray-400">{caseStudy.solution}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-3">Results</h4>
                    <div className="space-y-2">
                      {caseStudy.results.map((result, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#00D4FF] flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-300">{result}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Key Metrics</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(caseStudy.metrics).map(([key, value]) => (
                        <div key={key} className="bg-[#0A0E1A]/40 rounded-lg p-3">
                          <p className="text-xs text-gray-400 capitalize mb-1">{key.replace(/([A-Z])/g, " $1")}</p>
                          <p className="text-sm font-bold text-[#00D4FF]">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Technologies</h4>
                    <div className="flex flex-wrap gap-2">
                      {caseStudy.technologies.map((tech, idx) => (
                        <Badge key={idx} variant="outline" className="bg-[#00D4FF]/5 text-[#00D4FF] border-[#00D4FF]/20">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 pt-2">Timeline: {caseStudy.timeline}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-[#00D4FF]/10 to-[#00D4FF]/5 border border-[#00D4FF]/20 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to Transform Your Operations?</h2>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            See how GigitekAI can help your organization achieve similar results. Schedule a consultation with our AI strategy team.
          </p>
          <Button
            onClick={() => (window.location.href = "/contact")}
            className="bg-[#00D4FF] hover:bg-[#00B8E0] text-black font-semibold"
          >
            Schedule Your Consultation <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
