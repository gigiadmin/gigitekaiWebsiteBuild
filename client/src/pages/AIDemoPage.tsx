/*
 * GigitekAI — Interactive Agentic AI Demo Page (/ai-demo)
 * 1-click workflow simulation showing AI agents in action
 * Design: Cyberpunk Minimalism — dark navy + electric cyan
 */

import { useState, useEffect, useRef } from "react";
import SiteNavBar2024 from "@/components/SiteNavBar2024";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSEO } from "@/hooks/useSEO";
import {
  Bot,
  Zap,
  CheckCircle2,
  Clock,
  ArrowRight,
  Play,
  RotateCcw,
  Ticket,
  Mail,
  Shield,
  Brain,
  Users,
  AlertTriangle,
  ChevronRight,
  Activity,
  Database,
  GitBranch,
  Globe,
  Layers,
  MessageSquare,
  RefreshCw,
  Server,
  Workflow,
  UserMinus,
  Lock,
  BarChart3,
  Cpu,
  Code2,
  X,
  ChevronDown,
  ChevronUp,
  Send,
  User,
  Building2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Link } from "wouter";

import { trpc } from "@/lib/trpc";
// ── Demo Scenarios ────────────────────────────────────────────────────────────
const SCENARIOS = [
  {
    id: "helpdesk",
    icon: Ticket,
    title: "AI Helpdesk Agent",
    subtitle: "Tier-1 ticket auto-resolution",
    description:
      "Watch an AI agent receive, classify, and resolve a password reset ticket — without a human touching it.",
    color: "cyan",
    steps: [
      {
        agent: "Intake Agent",
        icon: Mail,
        action: "New ticket received",
        detail: "User: 'I can't log into my Microsoft 365 account'",
        duration: 800,
        status: "processing",
      },
      {
        agent: "Classifier Agent",
        icon: Brain,
        action: "Classifying issue",
        detail: "Category: Identity & Access → Password Reset (confidence: 98%)",
        duration: 600,
        status: "processing",
      },
      {
        agent: "Policy Agent",
        icon: Shield,
        action: "Checking user permissions",
        detail: "User verified in Entra ID. MFA enrolled. Reset authorized.",
        duration: 700,
        status: "processing",
      },
      {
        agent: "Action Agent",
        icon: Zap,
        action: "Executing password reset",
        detail: "Triggered Microsoft Graph API → Temporary password generated",
        duration: 900,
        status: "processing",
      },
      {
        agent: "Notification Agent",
        icon: Mail,
        action: "Sending resolution email",
        detail: "Email sent with temp password + MFA re-enrollment link",
        duration: 500,
        status: "processing",
      },
      {
        agent: "Ticket Agent",
        icon: CheckCircle2,
        action: "Ticket auto-closed",
        detail: "Resolution time: 4.2 seconds. CSAT survey sent. Zero human touch.",
        duration: 400,
        status: "complete",
      },
    ],
    codeSnippet: `// GigitekAI Helpdesk Agent — Tier-1 Auto-Resolution
// Runtime: Azure Functions + Microsoft Graph API

async function handleTicket(ticket) {
  // Step 1: Classify with LLM
  const category = await classifyAgent.run({
    input: ticket.description,
    model: "gpt-4o",
    confidence_threshold: 0.95
  });

  // Step 2: Policy check via Entra ID
  const user = await graphClient
    .api("/users/" + ticket.userId)
    .select("id,displayName,mfaEnabled")
    .get();

  // Step 3: Execute resolution
  if (category.type === "password_reset" && user.mfaEnabled) {
    await graphClient
      .api("/users/" + ticket.userId + "/authentication/methods")
      .post({ resetPassword: true });
    await notificationAgent.sendEmail({
      to: ticket.userEmail,
      template: "password_reset_success"
    });
  }

  // Step 4: Auto-close ticket
  await ticketingSystem.close(ticket.id, {
    resolution: category.suggestedResolution,
    humanTouches: 0
  });
}`,
  },
  {
    id: "security",
    icon: Shield,
    title: "Security Threat Response",
    subtitle: "Zero-trust incident automation",
    description:
      "An AI agent detects a suspicious login, isolates the threat, and notifies the security team — in under 10 seconds.",
    color: "red",
    steps: [
      {
        agent: "Detection Agent",
        icon: AlertTriangle,
        action: "Anomaly detected",
        detail: "Impossible travel: User login from Moscow 2 min after London logout",
        duration: 500,
        status: "processing",
      },
      {
        agent: "Verification Agent",
        icon: Brain,
        action: "Risk scoring",
        detail: "Risk level: CRITICAL (95% confidence). MFA bypass attempt detected.",
        duration: 600,
        status: "processing",
      },
      {
        agent: "Isolation Agent",
        icon: Lock,
        action: "Immediate containment",
        detail: "User session revoked. All active tokens invalidated. Device flagged.",
        duration: 400,
        status: "processing",
      },
      {
        agent: "Incident Agent",
        icon: AlertTriangle,
        action: "Incident ticket created",
        detail: "Severity: P1. Assigned to security team. Evidence attached.",
        duration: 700,
        status: "processing",
      },
      {
        agent: "Notification Agent",
        icon: Mail,
        action: "Alert sent",
        detail: "Email + Slack + SMS to security team with full context",
        duration: 300,
        status: "complete",
      },
    ],
    codeSnippet: `// GigitekAI Security Threat Response Agent
// Runtime: Azure Sentinel + Microsoft Graph

async function detectAndRespond(loginEvent) {
  // Step 1: Analyze login anomaly
  const riskScore = await riskEngine.analyze({
    previousLocation: loginEvent.lastLocation,
    newLocation: loginEvent.currentLocation,
    timeDelta: loginEvent.timeSinceLastLogin,
    mfaUsed: loginEvent.mfaUsed
  });

  // Step 2: If critical, isolate immediately
  if (riskScore > 0.9) {
    await graphClient.api("/me/revokeSignInSessions").post({});
    await sentinelClient.createIncident({
      severity: "High",
      title: "Suspicious Login Detected",
      description: \`Impossible travel from \${loginEvent.lastLocation} to \${loginEvent.currentLocation}\`
    });
  }
}`,
  },
  {
    id: "onboarding",
    icon: Users,
    title: "Employee Onboarding",
    subtitle: "Zero-touch M365 provisioning",
    description:
      "A new hire is added to HR — and an AI agent signs a contract, provisions 8 systems, and sends welcome packages in under 12 minutes.",
    color: "emerald",
    steps: [
      {
        agent: "Intake Agent",
        icon: Users,
        action: "New hire detected",
        detail: "HR system: New employee 'Sarah Chen' hired at Acme Corp",
        duration: 600,
        status: "processing",
      },
      {
        agent: "Contract Agent",
        icon: GitBranch,
        action: "Generating contracts",
        detail: "Employment agreement + IT security policy auto-generated and signed",
        duration: 800,
        status: "processing",
      },
      {
        agent: "Identity Agent",
        icon: Lock,
        action: "Creating Entra ID account",
        detail: "User sarah.chen@acme.com created. MFA enrolled. SSO configured.",
        duration: 500,
        status: "processing",
      },
      {
        agent: "M365 Agent",
        icon: Layers,
        action: "Provisioning M365",
        detail: "Exchange mailbox, Teams, OneDrive, SharePoint access configured",
        duration: 700,
        status: "processing",
      },
      {
        agent: "Device Agent",
        icon: Cpu,
        action: "Device enrollment",
        detail: "Intune enrollment link sent. Auto-config profile applied.",
        duration: 600,
        status: "processing",
      },
      {
        agent: "Orchestrator Agent",
        icon: CheckCircle2,
        action: "Full environment live — 8 systems connected",
        detail: "M365 · Azure · D365 · Intune · ConnectSecure · DefensX · Billing · Helpdesk all provisioned. Time: 11 min 23 sec.",
        duration: 400,
        status: "complete",
      },
    ],
    codeSnippet: `// GigitekAI Multi-System Orchestrator Agent
// Runtime: Azure Durable Functions (Fan-out/Fan-in pattern)

async function orchestrateClientOnboarding(contract) {
  // Orchestrator spawns 7 parallel sub-agents (fan-out)
  const results = await Promise.all([
    identityAgent.provisionTenant(contract),      // Entra ID
    azureAgent.deployInfrastructure(contract),    // Azure IaaS
    m365Agent.configureWorkloads(contract),       // M365 + Copilot
    securityAgent.deployStack(contract),          // ConnectSecure + DefensX
    crmAgent.createRecords(contract),             // Dynamics 365
    billingAgent.activateSubscription(contract),  // Billing system
    helpdeskAgent.provisionPortal(contract)       // Support portal
  ]);

  // Orchestrator validates all results (fan-in)
  const validation = await orchestratorAgent.validate({
    results,
    checks: ["dns_propagation", "sso_federation", "backup_policy", "mfa_enforced"]
  });

  if (validation.allPassed) {
    await welcomeAgent.sendOnboardingPackage(contract.clientEmail, {
      portalUrl: results[6].portalUrl,
      adminCredentials: results[0].adminCreds,
      systemsProvisioned: 8
    });
  }
}`,
  },
];

// ── Color maps ────────────────────────────────────────────────────────────────
const COLOR_MAP: Record<string, { border: string; text: string; bg: string; glow: string; badge: string }> = {
  cyan: {
    border: "border-cyan-500/50",
    text: "text-cyan-400",
    bg: "bg-cyan-500/10",
    glow: "shadow-cyan-500/20",
    badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  },
  red: {
    border: "border-red-500/50",
    text: "text-red-400",
    bg: "bg-red-500/10",
    glow: "shadow-red-500/20",
    badge: "bg-red-500/20 text-red-300 border-red-500/30",
  },
  emerald: {
    border: "border-emerald-500/50",
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    glow: "shadow-emerald-500/20",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  },
  orange: {
    border: "border-orange-500/50",
    text: "text-orange-400",
    bg: "bg-orange-500/10",
    glow: "shadow-orange-500/20",
    badge: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  },
  violet: {
    border: "border-violet-500/50",
    text: "text-violet-400",
    bg: "bg-violet-500/10",
    glow: "shadow-violet-500/20",
    badge: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  },
  purple: {
    border: "border-purple-500/50",
    text: "text-purple-400",
    bg: "bg-purple-500/10",
    glow: "shadow-purple-500/20",
    badge: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  },
};

// ── Step Component ────────────────────────────────────────────────────────────
function WorkflowStep({
  step,
  index,
  visible,
  isLast,
  color,
}: {
  step: (typeof SCENARIOS)[0]["steps"][0];
  index: number;
  visible: boolean;
  isLast: boolean;
  color: string;
}) {
  const c = COLOR_MAP[color];
  const Icon = step.icon;
  const isComplete = step.status === "complete";

  return (
    <div
      className={`flex gap-4 transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
      style={{ transitionDelay: visible ? `${index * 80}ms` : "0ms" }}
    >
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border ${
            visible
              ? isComplete
                ? "bg-emerald-500/20 border-emerald-500"
                : `${c.bg} ${c.border}`
              : "bg-slate-800 border-slate-700"
          } transition-all duration-500`}
        >
          {isComplete ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <Icon className={`w-4 h-4 ${visible ? c.text : "text-slate-600"}`} />
          )}
        </div>
        {!isLast && (
          <div
            className={`w-px flex-1 mt-1 min-h-[2rem] transition-all duration-700 ${
              visible ? `${c.bg} border-l ${c.border}` : "border-l border-slate-800"
            }`}
          />
        )}
      </div>

      {/* Content */}
      <div className="pb-5 flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className={`text-xs font-mono font-semibold ${visible ? c.text : "text-slate-600"}`}>
            {step.agent}
          </span>
          {visible && (
            <Badge
              className={`text-xs border ${
                isComplete ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : c.badge
              }`}
            >
              {isComplete ? "Complete" : "Processing"}
            </Badge>
          )}
        </div>
        <p className={`text-sm font-medium ${visible ? "text-white" : "text-slate-600"}`}>{step.action}</p>
        <p className={`text-xs mt-1 ${visible ? "text-slate-400" : "text-slate-700"}`}>{step.detail}</p>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AIDemoPage() {
  useSEO({
    title: "Watch AI Agents Work in Real Time | GigitekAI",
    description: "See live AI agent workflows running inside GigitekAI client environments. Watch helpdesk automation, security response, and employee onboarding in action.",
  });

  const [activeScenario, setActiveScenario] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadCompany, setLeadCompany] = useState("");
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  const scenario = SCENARIOS[activeScenario];
  const c = COLOR_MAP[scenario.color];
  const notifyOwnerMutation = trpc.system.notifyOwner.useMutation();

  // Voice support check
  useEffect(() => {
    const supported = "speechSynthesis" in window;
    setVoiceSupported(supported);
  }, []);

  // Play scenario
  const handleScenarioChange = (idx: number) => {
    setActiveScenario(idx);
    setPlaying(true);
    setEnded(false);
  };

  const handlePlayClick = () => {
    setPlaying(true);
    setEnded(false);
  };

  const handleRestartClick = () => {
    setPlaying(false);
    setEnded(false);
  };

  // Lead capture
  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || !leadEmail) return;

    setLeadSubmitting(true);
    try {
      await notifyOwnerMutation.mutateAsync({
        title: "New AI Demo Lead",
        content: `Name: ${leadName}\nEmail: ${leadEmail}\nCompany: ${leadCompany || "N/A"}`,
      });
      setLeadSubmitted(true);
    } catch (err) {
      console.error("Failed to submit lead:", err);
    } finally {
      setLeadSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <SiteNavBar2024 />

      {/* ── Hero ── */}
      <section className="pt-24 pb-12 text-center" style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
        <div className="max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-4 py-1.5 mb-6">
            <Bot className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-400 text-sm font-medium">Live Agent Demo — No Sign-Up Required</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Watch AI Agents{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Work in Real Time
            </span>
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-8">
            These are the same agentic workflows running inside GigitekAI client environments today.
            Pick a scenario and hit Play — see exactly how AI replaces manual IT work.
          </p>
        </div>
      </section>

      {/* ── Scenario Selector ── */}
      <section className="mb-10" style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-4">
            {SCENARIOS.map((s, idx) => {
              const Icon = s.icon;
              const sc = COLOR_MAP[s.color];
              const isActive = activeScenario === idx;
              return (
                <button
                  key={s.id}
                  onClick={() => handleScenarioChange(idx)}
                  className={`text-left p-5 rounded-xl border transition-all duration-200 ${
                    isActive
                      ? `${sc.border} ${sc.bg} shadow-lg ${sc.glow}`
                      : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isActive ? sc.bg : "bg-slate-700"}`}>
                      <Icon className={`w-5 h-5 ${isActive ? sc.text : "text-slate-400"}`} />
                    </div>
                    <div>
                      <p className={`font-bold text-sm ${isActive ? "text-white" : "text-slate-300"}`}>{s.title}</p>
                      <p className="text-xs text-slate-500">{s.subtitle}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{s.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Demo Terminal ── */}
      <section className="mb-16" style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
        <div className="max-w-4xl mx-auto">
          <div className={`rounded-2xl border ${c.border} bg-slate-900/80 overflow-hidden shadow-2xl ${c.glow}`}>
            {/* Terminal header */}
            <div className="flex items-center justify-between px-5 py-3 bg-slate-800/80 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
              </div>
              <span className="text-xs text-slate-500 font-mono">gigitekai-agent-runtime ~ AI Helpdesk Agent</span>
              <div className="flex items-center gap-2">
                {voiceSupported && (
                  <button
                    onClick={() => setVoiceEnabled(!voiceEnabled)}
                    className="p-1.5 hover:bg-slate-700 rounded transition-colors"
                    title={voiceEnabled ? "Disable voice" : "Enable voice"}
                  >
                    {voiceEnabled ? (
                      <Volume2 className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Terminal content */}
            <div className="p-6 min-h-[420px]">
              {!playing && !ended ? (
                <div className="flex flex-col items-center justify-center h-80 gap-4">
                  <div className={`w-16 h-16 rounded-full ${c.bg} border ${c.border} flex items-center justify-center`}>
                    <Play className={`w-8 h-8 ${c.text}`} />
                  </div>
                  <p className="text-slate-400 text-center">Press <span className="font-bold">Run Demo</span> to watch the agent workflow execute step-by-step in real time.</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {scenario.steps.map((step, i) => (
                    <WorkflowStep
                      key={i}
                      step={step}
                      index={i}
                      visible={playing}
                      isLast={i === scenario.steps.length - 1}
                      color={scenario.color}
                    />
                  ))}
                </div>
              )}

              {ended && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 text-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                  <p className="text-emerald-300 font-medium">Workflow completed successfully!</p>
                  <p className="text-emerald-300/70 text-sm mt-1">This is a live workflow running in GigitekAI client environments.</p>
                </div>
              )}

              {playing && !ended && (
                <div className="border-t border-slate-700 bg-[#0d1117]">
                  <div className="flex items-center justify-between px-5 py-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs text-slate-500 font-mono">LIVE EXECUTION</span>
                    </div>
                  </div>
                  <pre className="p-4 text-xs text-slate-400 font-mono overflow-x-auto max-h-[120px]">
                    <code>{(scenario as any).codeSnippet}</code>
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-4 justify-center flex-wrap mt-6">
            <Button
              onClick={handlePlayClick}
              disabled={playing}
              className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 font-semibold"
            >
              <Play className="w-4 h-4 mr-2" />
              Run Demo
            </Button>
            <Button
              onClick={handleRestartClick}
              variant="outline"
              className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 px-6 py-2"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Restart
            </Button>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="mb-16" style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: "< 10s", label: "Avg ticket resolution" },
              { value: "94%", label: "Tier-1 auto-resolution rate" },
              { value: "0", label: "Human touches on routine tasks" },
              { value: "24/7", label: "Agent availability" },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 text-center hover:border-cyan-500/30 transition-colors"
              >
                <p className="text-3xl font-bold text-cyan-400 mb-1">{stat.value}</p>
                <p className="text-xs text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Lead Capture Form ── */}
      <section className="mb-16" style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-2xl overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="p-8 md:p-10">
                <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-3 py-1 mb-4">
                  <Bot className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-cyan-400 text-xs font-medium">Free Consultation</span>
                </div>
                <h2 className="text-2xl font-bold mb-3">
                  Want this running in your business?
                </h2>
                <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                  These aren't demos — they're live workflows deployed for GigitekAI clients today. Book a 30-minute AI architecture session and we'll map out your first agent.
                </p>
                <ul className="space-y-2">
                  {[
                    "First agent live in under 30 days",
                    "Zero-touch IT automation from day one",
                    "Microsoft 365 & Azure native — no new tools",
                    "ROI analysis included at no cost",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-8 md:p-10 bg-slate-900/60 border-l border-slate-700/50">
                {leadSubmitted ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
                      <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white">You're on the list!</h3>
                    <p className="text-slate-400 text-sm">
                      An AI architect from GigitekAI will reach out within 1 business day to schedule your session.
                    </p>
                    <Link href="/contact">
                      <Button variant="outline" className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 mt-2">
                        View full contact options
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleLeadSubmit} className="space-y-4">
                    <h3 className="text-lg font-bold text-white mb-5">Get a Personalized Demo</h3>
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium">Full Name *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          value={leadName}
                          onChange={e => setLeadName(e.target.value)}
                          placeholder="Harry Henry"
                          required
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium">Work Email *</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="email"
                          value={leadEmail}
                          onChange={e => setLeadEmail(e.target.value)}
                          placeholder="you@company.com"
                          required
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium">Company</label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          value={leadCompany}
                          onChange={e => setLeadCompany(e.target.value)}
                          placeholder="Acme Corp"
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      disabled={leadSubmitting || !leadName || !leadEmail}
                      className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2.5 disabled:opacity-50"
                    >
                      {leadSubmitting ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Send className="w-4 h-4" />
                          Request My Personalized Demo
                        </span>
                      )}
                    </Button>
                    <p className="text-xs text-slate-600 text-center">No spam. No sales pressure. Just AI architecture.</p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-16" style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/contact">
              <Button className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-3 text-base font-semibold">
                Talk to an AI Architect
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 px-8 py-3 text-base">
                View Pricing
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      <ScrollToTop />
    </div>
  );
}
