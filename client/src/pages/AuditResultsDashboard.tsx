import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, CheckCircle, Clock, AlertCircle, TrendingUp, Shield, Cpu, DollarSign } from "lucide-react";
import SiteNavBar2024 from "@/components/SiteNavBar2024";
import Footer from "@/components/Footer";
import { Link } from "wouter";

// Status badge color mapping
const statusColors: Record<string, string> = {
  submitted: "bg-blue-500/20 text-blue-300 border-blue-500/50",
  contacted: "bg-yellow-500/20 text-yellow-300 border-yellow-500/50",
  in_progress: "bg-cyan-500/20 text-cyan-300 border-cyan-500/50",
  completed: "bg-green-500/20 text-green-300 border-green-500/50",
  archived: "bg-slate-500/20 text-slate-300 border-slate-500/50",
};

const statusLabels: Record<string, string> = {
  submitted: "Submitted",
  contacted: "Contacted",
  in_progress: "In Progress",
  completed: "Completed",
  archived: "Archived",
};

const statusIcons: Record<string, React.ReactNode> = {
  submitted: <Clock className="w-4 h-4" />,
  contacted: <CheckCircle className="w-4 h-4" />,
  in_progress: <Loader2 className="w-4 h-4 animate-spin" />,
  completed: <CheckCircle className="w-4 h-4" />,
  archived: <AlertCircle className="w-4 h-4" />,
};

// AI Readiness Score component
function AIReadinessScore({ auditType }: { auditType: string | null }) {
  // Score based on audit type (simulated for display)
  const scores: Record<string, number> = {
    general: 62,
    m365: 74,
    security: 58,
    ai: 45,
    cost: 68,
  };
  const score = scores[auditType || "general"] || 62;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  const getScoreColor = (s: number) => {
    if (s >= 75) return "#22d3ee"; // cyan
    if (s >= 50) return "#f59e0b"; // amber
    return "#ef4444"; // red
  };

  const getScoreLabel = (s: number) => {
    if (s >= 75) return "Good";
    if (s >= 50) return "Moderate";
    return "Needs Work";
  };

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="140" className="transform -rotate-90">
        <circle cx="70" cy="70" r="54" fill="none" stroke="#1e293b" strokeWidth="12" />
        <circle
          cx="70"
          cy="70"
          r="54"
          fill="none"
          stroke={getScoreColor(score)}
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ marginTop: "-100px" }}>
        <span className="text-3xl font-bold text-white">{score}</span>
        <span className="text-xs text-slate-400">/ 100</span>
      </div>
      <p className="mt-2 text-sm font-semibold" style={{ color: getScoreColor(score) }}>
        {getScoreLabel(score)}
      </p>
    </div>
  );
}

// Cost Savings Estimate
function CostSavingsCard({ auditType }: { auditType: string | null }) {
  const savings: Record<string, { monthly: number; annual: number; areas: string[] }> = {
    general: { monthly: 2400, annual: 28800, areas: ["Cloud rightsizing", "License optimization", "Automation"] },
    m365: { monthly: 1800, annual: 21600, areas: ["Unused licenses", "Storage optimization", "Feature adoption"] },
    security: { monthly: 3200, annual: 38400, areas: ["Incident prevention", "Compliance automation", "Tool consolidation"] },
    ai: { monthly: 4500, annual: 54000, areas: ["Manual task automation", "Agent deployment", "Workflow optimization"] },
    cost: { monthly: 3800, annual: 45600, areas: ["Cloud waste elimination", "Reserved instances", "License right-sizing"] },
  };
  const data = savings[auditType || "general"] || savings.general;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-4 text-center border border-slate-700">
          <p className="text-xs text-slate-400 mb-1">Est. Monthly Savings</p>
          <p className="text-2xl font-bold text-cyan-400">${data.monthly.toLocaleString()}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 text-center border border-slate-700">
          <p className="text-xs text-slate-400 mb-1">Est. Annual Savings</p>
          <p className="text-2xl font-bold text-green-400">${data.annual.toLocaleString()}</p>
        </div>
      </div>
      <div>
        <p className="text-sm text-slate-400 mb-2">Key Savings Areas:</p>
        <ul className="space-y-1">
          {data.areas.map((area) => (
            <li key={area} className="flex items-center gap-2 text-sm text-slate-300">
              <CheckCircle className="w-3 h-3 text-cyan-400 flex-shrink-0" />
              {area}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Recommendations based on audit type
function RecommendationsCard({ auditType }: { auditType: string | null }) {
  const recommendations: Record<string, { title: string; priority: "High" | "Medium" | "Low"; impact: string }[]> = {
    general: [
      { title: "Enable Multi-Factor Authentication", priority: "High", impact: "Reduces breach risk by 99.9%" },
      { title: "Implement Cloud Cost Monitoring", priority: "High", impact: "Avg. 30% cost reduction" },
      { title: "Automate Backup Verification", priority: "Medium", impact: "Ensures data recovery readiness" },
      { title: "Deploy AI-Powered Helpdesk", priority: "Medium", impact: "280+ hours saved/month" },
      { title: "Consolidate Security Tools", priority: "Low", impact: "15-20% tool cost savings" },
    ],
    m365: [
      { title: "Audit Unused M365 Licenses", priority: "High", impact: "Avg. $18/user/month savings" },
      { title: "Enable Copilot for M365", priority: "High", impact: "2-3 hours saved per user/week" },
      { title: "Configure Conditional Access", priority: "High", impact: "Zero Trust security baseline" },
      { title: "Migrate to SharePoint Online", priority: "Medium", impact: "Eliminate file server costs" },
      { title: "Enable Teams Phone System", priority: "Low", impact: "Replace legacy PBX" },
    ],
    security: [
      { title: "Deploy Zero Trust Architecture", priority: "High", impact: "Eliminate lateral movement" },
      { title: "Enable Defender for Endpoint", priority: "High", impact: "Real-time threat protection" },
      { title: "Implement SIEM Solution", priority: "High", impact: "24/7 security monitoring" },
      { title: "Conduct Phishing Simulation", priority: "Medium", impact: "Reduce human error risk" },
      { title: "Achieve SOC 2 Compliance", priority: "Medium", impact: "Enterprise customer trust" },
    ],
    ai: [
      { title: "Deploy AI Helpdesk Agent", priority: "High", impact: "80% ticket auto-resolution" },
      { title: "Implement Process Automation", priority: "High", impact: "40% operational cost reduction" },
      { title: "Enable Predictive Analytics", priority: "Medium", impact: "Proactive issue prevention" },
      { title: "Build AI Knowledge Base", priority: "Medium", impact: "Self-service resolution" },
      { title: "Integrate Copilot Studio", priority: "Low", impact: "Custom AI workflows" },
    ],
    cost: [
      { title: "Right-size Cloud Resources", priority: "High", impact: "Avg. 35% compute savings" },
      { title: "Purchase Reserved Instances", priority: "High", impact: "Up to 72% discount vs on-demand" },
      { title: "Eliminate Shadow IT", priority: "Medium", impact: "10-15% SaaS cost reduction" },
      { title: "Optimize Data Transfer Costs", priority: "Medium", impact: "Reduce egress fees" },
      { title: "Implement FinOps Practice", priority: "Low", impact: "Ongoing cost governance" },
    ],
  };

  const recs = recommendations[auditType || "general"] || recommendations.general;
  const priorityColors = { High: "text-red-400 bg-red-500/10 border-red-500/30", Medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30", Low: "text-green-400 bg-green-500/10 border-green-500/30" };

  return (
    <div className="space-y-3">
      {recs.map((rec, i) => (
        <div key={i} className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded border flex-shrink-0 mt-0.5 ${priorityColors[rec.priority]}`}>
            {rec.priority}
          </span>
          <div>
            <p className="text-sm font-medium text-white">{rec.title}</p>
            <p className="text-xs text-slate-400">{rec.impact}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AuditResultsDashboard() {
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [lookupAttempted, setLookupAttempted] = useState(false);

  // Look up audit submission by email
  const { data: submission, isLoading } = trpc.audit.getByEmail.useQuery(
    { email: submittedEmail },
    { enabled: !!submittedEmail }
  );

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return;
    setSubmittedEmail(email.trim());
    setLookupAttempted(true);
  };

  const handleDownloadPDF = () => {
    if (!submission) return;
    // Generate a simple PDF report using browser print
    const printContent = `
      GigitekAI Free Audit Report
      ===========================
      Company: ${submission.companyName}
      Contact: ${submission.contactName}
      Email: ${submission.contactEmail}
      Audit Type: ${submission.auditType || "General"}
      Status: ${statusLabels[submission.status] || submission.status}
      Submitted: ${new Date(submission.submittedAt).toLocaleDateString()}
      
      Current Challenges:
      ${submission.currentChallenges || "Not provided"}
      
      Goals:
      ${submission.goals || "Not provided"}
      
      Next Steps:
      Our team will contact you within 24 hours to schedule your personalized audit.
      
      Contact GigitekAI:
      Phone: (727) 382-6909
      Email: support@gigitekai.com
      Website: https://gigitekai.com
    `;
    const blob = new Blob([printContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `GigitekAI-Audit-Report-${submission.companyName.replace(/\s+/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex flex-col">
      <SiteNavBar2024 />
      <main className="flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-block px-4 py-2 bg-cyan-500/20 border border-cyan-500/50 rounded-full mb-4">
              <span className="text-cyan-300 text-sm font-semibold">AUDIT RESULTS</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">
              Your <span className="text-cyan-400">Audit Dashboard</span>
            </h1>
            <p className="text-slate-300 max-w-xl mx-auto">
              Track your audit status, view AI readiness scores, and access cost savings recommendations.
            </p>
          </div>

          {/* Email Lookup */}
          {!submission && (
            <div className="max-w-md mx-auto mb-10">
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Look Up Your Audit</h2>
                <form onSubmit={handleLookup} className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Email Address Used to Submit</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@company.com"
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Looking up...</> : "View My Audit"}
                  </Button>
                </form>

                {lookupAttempted && !isLoading && !submission && submittedEmail && (
                  <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <p className="text-amber-300 text-sm">
                      No audit found for <strong>{submittedEmail}</strong>. 
                      <Link href="/free-audit" className="text-cyan-400 hover:underline ml-1">Submit a free audit →</Link>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Audit Results */}
          {submission && (
            <div className="space-y-6">
              {/* Status Header */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{submission.companyName}</h2>
                    <p className="text-slate-400 mt-1">{submission.contactName} · {submission.contactEmail}</p>
                    <p className="text-slate-500 text-sm mt-1">
                      Submitted {new Date(submission.submittedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${statusColors[submission.status] || statusColors.submitted}`}>
                      {statusIcons[submission.status]}
                      {statusLabels[submission.status] || submission.status}
                    </span>
                    <Button
                      onClick={handleDownloadPDF}
                      variant="outline"
                      size="sm"
                      className="border-slate-600 text-slate-300 hover:text-white hover:border-cyan-500"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Report
                    </Button>
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* AI Readiness Score */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Cpu className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-lg font-semibold text-white">AI Readiness</h3>
                  </div>
                  <div className="relative flex justify-center">
                    <AIReadinessScore auditType={submission.auditType} />
                  </div>
                  <p className="text-xs text-slate-400 text-center mt-4">
                    Based on your {submission.auditType || "general"} audit focus
                  </p>
                </div>

                {/* Cost Savings */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="w-5 h-5 text-green-400" />
                    <h3 className="text-lg font-semibold text-white">Cost Savings</h3>
                  </div>
                  <CostSavingsCard auditType={submission.auditType} />
                </div>

                {/* Security Score */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">Security Posture</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: "Identity & Access", score: 65 },
                      { label: "Data Protection", score: 72 },
                      { label: "Threat Detection", score: 48 },
                      { label: "Compliance", score: 80 },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400">{item.label}</span>
                          <span className="text-slate-300">{item.score}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${item.score}%`,
                              background: item.score >= 70 ? "#22d3ee" : item.score >= 50 ? "#f59e0b" : "#ef4444",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-semibold text-white">Top Recommendations</h3>
                  <Badge variant="outline" className="ml-auto border-cyan-500/50 text-cyan-300 text-xs">
                    {submission.auditType ? submission.auditType.toUpperCase() : "GENERAL"} AUDIT
                  </Badge>
                </div>
                <RecommendationsCard auditType={submission.auditType} />
              </div>

              {/* Next Steps */}
              <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Next Steps</h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    { step: "1", title: "Schedule Call", desc: "Our team will contact you within 24 hours to discuss findings." },
                    { step: "2", title: "Deep Dive Audit", desc: "We conduct a thorough review of your environment and systems." },
                    { step: "3", title: "Action Plan", desc: "Receive a prioritized roadmap with ROI projections." },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center flex-shrink-0">
                        <span className="text-cyan-300 text-sm font-bold">{item.step}</span>
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{item.title}</p>
                        <p className="text-slate-400 text-xs mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex flex-col sm:flex-row gap-3">
                  <a href="tel:+17273826909">
                    <Button className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold">
                      Call (727) 382-6909
                    </Button>
                  </a>
                  <a href="mailto:support@gigitekai.com">
                    <Button variant="outline" className="border-slate-600 text-slate-300 hover:text-white hover:border-cyan-500">
                      Email support@gigitekai.com
                    </Button>
                  </a>
                </div>
              </div>

              {/* Reset / Look up another */}
              <div className="text-center">
                <button
                  onClick={() => { setSubmittedEmail(""); setEmail(""); setLookupAttempted(false); }}
                  className="text-slate-400 hover:text-cyan-400 text-sm underline"
                >
                  Look up a different audit
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
