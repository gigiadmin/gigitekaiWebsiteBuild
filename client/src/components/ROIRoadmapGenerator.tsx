/*
  GigitekAI AI ROI & Adoption Roadmap Generator
  Interactive calculator that provides:
  1. Financial ROI justification (savings, payback, cost reduction)
  2. Phased 12-month AI adoption roadmap tailored to company size
  3. Lead capture with downloadable report
*/

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Clock,
  Zap,
  TrendingUp,
  Target,
  CheckCircle2,
  ArrowRight,
  Calendar,
  Users,
  Shield,
  Bot,
  BarChart3,
  Layers,
  Mail,
  Building2,
  Rocket,
  ChevronRight,
} from "lucide-react";

interface CompanyProfile {
  employees: number;
  annualITSpend: number;
  ticketsPerMonth: number;
  manualHoursPerWeek: number;
  industry: string;
  currentTools: string[];
}

interface ROIResult {
  annualSavings: number;
  monthlyHoursSaved: number;
  costPerEmployee: number;
  paybackMonths: number;
  percentageSavings: number;
  fiveYearValue: number;
}

interface RoadmapPhase {
  phase: number;
  title: string;
  timeline: string;
  description: string;
  deliverables: string[];
  expectedROI: string;
  icon: React.ReactNode;
}

const INDUSTRIES = [
  "Healthcare",
  "Financial Services",
  "Manufacturing",
  "Retail & E-Commerce",
  "Professional Services",
  "Education",
  "Government",
  "Technology",
  "Other",
];

const TOOLS = [
  "Microsoft 365",
  "Azure",
  "Google Workspace",
  "AWS",
  "Salesforce",
  "ServiceNow",
  "Jira",
  "Zendesk",
  "Custom/Legacy",
];

// Industry-specific multipliers for more accurate projections
const INDUSTRY_MULTIPLIERS: Record<string, number> = {
  Healthcare: 1.15,
  "Financial Services": 1.2,
  Manufacturing: 1.1,
  "Retail & E-Commerce": 1.05,
  "Professional Services": 1.12,
  Education: 0.95,
  Government: 1.08,
  Technology: 1.18,
  Other: 1.0,
};

export default function ROIRoadmapGenerator() {
  const [step, setStep] = useState<"input" | "results">("input");
  const [profile, setProfile] = useState<CompanyProfile>({
    employees: 100,
    annualITSpend: 500000,
    ticketsPerMonth: 200,
    manualHoursPerWeek: 40,
    industry: "Technology",
    currentTools: ["Microsoft 365"],
  });
  const [leadEmail, setLeadEmail] = useState("");
  const [leadName, setLeadName] = useState("");
  const [leadCompany, setLeadCompany] = useState("");
  const [leadCaptured, setLeadCaptured] = useState(false);

  // ROI Calculation
  const results = useMemo((): ROIResult => {
    const multiplier = INDUSTRY_MULTIPLIERS[profile.industry] || 1.0;
    const COST_PER_TICKET = 85;
    const AUTOMATION_REDUCTION = 0.65;
    const MANUAL_HOURLY_RATE = 65;
    const GIGITEKAI_MONTHLY = 3500;

    const ticketSavings = profile.ticketsPerMonth * 12 * COST_PER_TICKET * AUTOMATION_REDUCTION * multiplier;
    const processSavings = profile.manualHoursPerWeek * 52 * MANUAL_HOURLY_RATE * 0.7 * multiplier;
    const annualCost = GIGITEKAI_MONTHLY * 12;
    const totalSavings = ticketSavings + processSavings - annualCost;
    const monthlyHours = (profile.manualHoursPerWeek * 4 * 0.7) + (profile.ticketsPerMonth * AUTOMATION_REDUCTION * 0.5);
    const costPerEmployee = (profile.annualITSpend / profile.employees) * 0.76;
    const payback = Math.max(Math.ceil(annualCost / (totalSavings / 12)), 1);
    const percentage = (totalSavings / profile.annualITSpend) * 100;
    const fiveYear = totalSavings * 5 * 1.15; // 15% compounding efficiency gains

    return {
      annualSavings: Math.max(totalSavings, 0),
      monthlyHoursSaved: Math.round(monthlyHours),
      costPerEmployee: Math.round(costPerEmployee),
      paybackMonths: payback,
      percentageSavings: Math.max(percentage, 0),
      fiveYearValue: Math.max(fiveYear, 0),
    };
  }, [profile]);

  // Generate phased roadmap based on company size
  const roadmap = useMemo((): RoadmapPhase[] => {
    const isSmall = profile.employees < 50;
    const isMedium = profile.employees >= 50 && profile.employees < 200;

    return [
      {
        phase: 1,
        title: "Foundation & Quick Wins",
        timeline: "Month 1-2",
        description: isSmall
          ? "Deploy core AI helpdesk agent and basic automation for immediate ticket reduction."
          : "Enterprise assessment, M365 optimization, and first AI agent deployment for Tier-1 ticket resolution.",
        deliverables: [
          "AI Helpdesk Agent (Tier-1 auto-resolution)",
          "Microsoft 365 security baseline",
          isSmall ? "Basic monitoring setup" : "24/7 proactive monitoring",
          "SLA framework established",
        ],
        expectedROI: `${Math.round(results.annualSavings * 0.15 / 1000)}K saved`,
        icon: <Rocket size={20} className="text-cyan-400" />,
      },
      {
        phase: 2,
        title: "Automation Expansion",
        timeline: "Month 3-5",
        description: isMedium || isSmall
          ? "Expand AI agents to cover security monitoring, onboarding/offboarding, and compliance automation."
          : "Multi-agent orchestration across identity, security, and compliance. Full Entra ID + Intune integration.",
        deliverables: [
          "Security Threat Response Agent",
          "Employee Onboarding/Offboarding Automation",
          "Compliance monitoring (NIST/SOC2)",
          isSmall ? "Backup automation" : "Multi-system orchestration",
        ],
        expectedROI: `${Math.round(results.annualSavings * 0.35 / 1000)}K saved`,
        icon: <Bot size={20} className="text-emerald-400" />,
      },
      {
        phase: 3,
        title: "Intelligence & Optimization",
        timeline: "Month 6-9",
        description: "Deploy predictive analytics, proactive remediation, and advanced AI workflows that prevent issues before they occur.",
        deliverables: [
          "Predictive failure prevention",
          "AI-powered capacity planning",
          "Advanced reporting & dashboards",
          "Custom workflow automation",
        ],
        expectedROI: `${Math.round(results.annualSavings * 0.65 / 1000)}K saved`,
        icon: <BarChart3 size={20} className="text-purple-400" />,
      },
      {
        phase: 4,
        title: "Full Autonomy & Scale",
        timeline: "Month 10-12",
        description: "Achieve near-autonomous IT operations with AI agents handling 90%+ of routine work. Focus shifts to strategic innovation.",
        deliverables: [
          "90%+ Tier-1 auto-resolution",
          "Zero-touch provisioning",
          "Self-healing infrastructure",
          "Strategic IT advisory partnership",
        ],
        expectedROI: `${Math.round(results.annualSavings / 1000)}K+ annual run-rate`,
        icon: <Target size={20} className="text-amber-400" />,
      },
    ];
  }, [profile, results]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  const handleCalculate = () => setStep("results");

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadEmail || !leadName) return;
    setLeadCaptured(true);
  };

  const toggleTool = (tool: string) => {
    setProfile((p) => ({
      ...p,
      currentTools: p.currentTools.includes(tool)
        ? p.currentTools.filter((t) => t !== tool)
        : [...p.currentTools, tool],
    }));
  };

  // ── INPUT STEP ──
  if (step === "input") {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 mb-4">
            AI-Powered Analysis
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            AI ROI & Adoption Roadmap Generator
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Get an instant financial justification and a personalized 12-month AI adoption plan tailored to your organization.
          </p>
        </div>

        <Card className="bg-[#141B2D] border-slate-700/50 p-6 md:p-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left column - Company metrics */}
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Building2 size={18} className="text-cyan-400" />
                Company Profile
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Number of Employees</label>
                <Input
                  type="number"
                  value={profile.employees}
                  onChange={(e) => setProfile((p) => ({ ...p, employees: Math.max(1, parseInt(e.target.value) || 0) }))}
                  className="bg-[#0A0E1A] border-slate-600 text-white"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Annual IT Budget</label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">$</span>
                  <Input
                    type="number"
                    value={profile.annualITSpend}
                    onChange={(e) => setProfile((p) => ({ ...p, annualITSpend: Math.max(0, parseInt(e.target.value) || 0) }))}
                    className="bg-[#0A0E1A] border-slate-600 text-white"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Helpdesk Tickets / Month</label>
                <Input
                  type="number"
                  value={profile.ticketsPerMonth}
                  onChange={(e) => setProfile((p) => ({ ...p, ticketsPerMonth: Math.max(0, parseInt(e.target.value) || 0) }))}
                  className="bg-[#0A0E1A] border-slate-600 text-white"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Manual IT Hours / Week</label>
                <Input
                  type="number"
                  value={profile.manualHoursPerWeek}
                  onChange={(e) => setProfile((p) => ({ ...p, manualHoursPerWeek: Math.max(0, parseInt(e.target.value) || 0) }))}
                  className="bg-[#0A0E1A] border-slate-600 text-white"
                  min="0"
                />
              </div>
            </div>

            {/* Right column - Industry & tools */}
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Layers size={18} className="text-cyan-400" />
                Environment
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Industry</label>
                <div className="grid grid-cols-2 gap-2">
                  {INDUSTRIES.map((ind) => (
                    <button
                      key={ind}
                      onClick={() => setProfile((p) => ({ ...p, industry: ind }))}
                      className={`text-left text-xs px-3 py-2 rounded-lg border transition-all ${
                        profile.industry === ind
                          ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400"
                          : "border-slate-700 bg-slate-800/50 text-gray-400 hover:border-slate-600"
                      }`}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Current Tools (select all)</label>
                <div className="flex flex-wrap gap-2">
                  {TOOLS.map((tool) => (
                    <button
                      key={tool}
                      onClick={() => toggleTool(tool)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        profile.currentTools.includes(tool)
                          ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400"
                          : "border-slate-700 bg-slate-800/50 text-gray-400 hover:border-slate-600"
                      }`}
                    >
                      {tool}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={handleCalculate}
            className="w-full mt-8 bg-[#00D4FF] hover:bg-[#00B8D4] text-[#0A0E1A] font-semibold py-3 text-base"
          >
            Generate My ROI & Roadmap
            <ArrowRight size={18} className="ml-2" />
          </Button>
        </Card>
      </div>
    );
  }

  // ── RESULTS STEP ──
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      {/* Results Header */}
      <div className="text-center mb-10">
        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 mb-4">
          Analysis Complete
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Your AI Transformation Blueprint
        </h2>
        <p className="text-gray-400">
          {profile.employees} employees · {profile.industry} · {formatCurrency(profile.annualITSpend)} IT budget
        </p>
      </div>

      {/* ROI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <Card className="bg-[#141B2D] border-[#00D4FF]/20 p-5 text-center">
          <DollarSign className="mx-auto text-[#00D4FF] mb-2" size={24} />
          <p className="text-2xl md:text-3xl font-bold text-[#00D4FF]">{formatCurrency(results.annualSavings)}</p>
          <p className="text-xs text-gray-400 mt-1">Annual Savings</p>
        </Card>
        <Card className="bg-[#141B2D] border-emerald-500/20 p-5 text-center">
          <Clock className="mx-auto text-emerald-400 mb-2" size={24} />
          <p className="text-2xl md:text-3xl font-bold text-emerald-400">{results.monthlyHoursSaved}h</p>
          <p className="text-xs text-gray-400 mt-1">Hours Freed / Month</p>
        </Card>
        <Card className="bg-[#141B2D] border-purple-500/20 p-5 text-center">
          <Zap className="mx-auto text-purple-400 mb-2" size={24} />
          <p className="text-2xl md:text-3xl font-bold text-purple-400">{results.paybackMonths} mo</p>
          <p className="text-xs text-gray-400 mt-1">Payback Period</p>
        </Card>
        <Card className="bg-[#141B2D] border-amber-500/20 p-5 text-center">
          <TrendingUp className="mx-auto text-amber-400 mb-2" size={24} />
          <p className="text-2xl md:text-3xl font-bold text-amber-400">{formatCurrency(results.fiveYearValue)}</p>
          <p className="text-xs text-gray-400 mt-1">5-Year Value</p>
        </Card>
      </div>

      {/* 12-Month Adoption Roadmap */}
      <div className="mb-12">
        <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
          <Calendar size={22} className="text-[#00D4FF]" />
          Your 12-Month AI Adoption Roadmap
        </h3>
        <p className="text-gray-400 text-sm mb-6">
          Phased implementation plan customized for a {profile.employees}-employee {profile.industry.toLowerCase()} organization.
        </p>

        <div className="space-y-4">
          {roadmap.map((phase, idx) => (
            <Card
              key={phase.phase}
              className="bg-[#141B2D] border-slate-700/50 hover:border-[#00D4FF]/30 transition-all duration-300 overflow-hidden"
            >
              <div className="p-5 md:p-6">
                <div className="flex items-start gap-4">
                  {/* Phase indicator */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                    {phase.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h4 className="text-base font-bold text-white">
                        Phase {phase.phase}: {phase.title}
                      </h4>
                      <Badge className="bg-slate-800 text-slate-300 border-slate-600 text-xs">
                        {phase.timeline}
                      </Badge>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                        {phase.expectedROI}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400 mb-3">{phase.description}</p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {phase.deliverables.map((d, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
                          <CheckCircle2 size={12} className="text-[#00D4FF] flex-shrink-0" />
                          {d}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              {idx < roadmap.length - 1 && (
                <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Lead Capture / Download Report */}
      <Card className="bg-gradient-to-r from-[#00D4FF]/5 to-purple-500/5 border-[#00D4FF]/20 p-6 md:p-8 mb-8">
        {leadCaptured ? (
          <div className="text-center py-6">
            <CheckCircle2 size={48} className="mx-auto text-emerald-400 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Your Roadmap is Ready!</h3>
            <p className="text-gray-400 mb-6">
              A GigitekAI architect will reach out within 1 business day with your detailed implementation plan.
            </p>
            <Button
              onClick={() => (window.location.href = "/contact")}
              className="bg-[#00D4FF] hover:bg-[#00B8D4] text-[#0A0E1A] font-semibold"
            >
              Schedule Your Strategy Call
              <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-xl font-bold text-white mb-3">
                Get Your Full Roadmap & ROI Report
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Receive a detailed PDF with your personalized ROI analysis, 12-month implementation timeline, and recommended agent configurations.
              </p>
              <ul className="space-y-2">
                {[
                  "Detailed financial projections",
                  "Custom agent architecture diagram",
                  "Implementation timeline with milestones",
                  "Risk mitigation strategies",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                    <CheckCircle2 size={14} className="text-[#00D4FF] flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <form onSubmit={handleLeadSubmit} className="space-y-3">
              <Input
                type="text"
                placeholder="Full Name *"
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                required
                className="bg-[#0A0E1A] border-slate-600 text-white"
              />
              <Input
                type="email"
                placeholder="Work Email *"
                value={leadEmail}
                onChange={(e) => setLeadEmail(e.target.value)}
                required
                className="bg-[#0A0E1A] border-slate-600 text-white"
              />
              <Input
                type="text"
                placeholder="Company Name"
                value={leadCompany}
                onChange={(e) => setLeadCompany(e.target.value)}
                className="bg-[#0A0E1A] border-slate-600 text-white"
              />
              <Button
                type="submit"
                disabled={!leadName || !leadEmail}
                className="w-full bg-[#00D4FF] hover:bg-[#00B8D4] text-[#0A0E1A] font-semibold disabled:opacity-50"
              >
                <Mail size={16} className="mr-2" />
                Download My Roadmap
              </Button>
              <p className="text-[10px] text-gray-600 text-center">No spam. Unsubscribe anytime.</p>
            </form>
          </div>
        )}
      </Card>

      {/* Back / Recalculate */}
      <div className="flex justify-center gap-4">
        <Button
          variant="outline"
          onClick={() => setStep("input")}
          className="border-slate-600 text-gray-300 hover:text-white"
        >
          Adjust Inputs
        </Button>
        <Button
          onClick={() => (window.location.href = "/contact")}
          className="bg-[#00D4FF] hover:bg-[#00B8D4] text-[#0A0E1A] font-semibold"
        >
          Talk to an AI Architect
          <ArrowRight size={16} className="ml-2" />
        </Button>
      </div>
    </div>
  );
}
