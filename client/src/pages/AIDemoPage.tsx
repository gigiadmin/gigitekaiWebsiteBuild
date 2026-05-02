/**
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
} from "lucide-react";
import { Link } from "wouter";

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
        agent: "SIEM Agent",
        icon: AlertTriangle,
        action: "Anomaly detected",
        detail: "Login from unrecognized IP: 185.220.101.x (Tor exit node)",
        duration: 600,
        status: "processing",
      },
      {
        agent: "Threat Intel Agent",
        icon: Brain,
        action: "Cross-referencing threat feeds",
        detail: "IP flagged in 3 threat databases. Risk score: 94/100 (CRITICAL)",
        duration: 800,
        status: "processing",
      },
      {
        agent: "Identity Agent",
        icon: Shield,
        action: "Revoking active sessions",
        detail: "All sessions terminated via Microsoft Graph. Conditional Access policy applied.",
        duration: 700,
        status: "processing",
      },
      {
        agent: "Isolation Agent",
        icon: Zap,
        action: "Quarantining endpoint",
        detail: "DefensX + Defender for Endpoint: device isolated from network",
        duration: 900,
        status: "processing",
      },
      {
        agent: "Escalation Agent",
        icon: Users,
        action: "Notifying security team",
        detail: "Teams alert sent to #security-incidents with full context + evidence",
        duration: 500,
        status: "processing",
      },
      {
        agent: "Audit Agent",
        icon: CheckCircle2,
        action: "Incident report generated",
        detail: "Full timeline logged to Sentinel. Compliance record created. MTTR: 8.7 seconds.",
        duration: 400,
        status: "complete",
      },
    ],
  },
  {
    id: "onboarding",
    icon: Users,
    title: "Employee Onboarding",
    subtitle: "Zero-touch M365 provisioning",
    description:
      "A new hire is added to HR — and within minutes, their entire Microsoft 365 environment is fully provisioned by AI agents.",
    color: "emerald",
    steps: [
      {
        agent: "HR Integration Agent",
        icon: Users,
        action: "New employee detected",
        detail: "HR system webhook: Sarah Chen, Marketing Manager, Start: June 1",
        duration: 600,
        status: "processing",
      },
      {
        agent: "Identity Agent",
        icon: Shield,
        action: "Creating Entra ID account",
        detail: "UPN: s.chen@gigitekai.com | Licenses: M365 Business Premium + Copilot",
        duration: 900,
        status: "processing",
      },
      {
        agent: "Access Agent",
        icon: Brain,
        action: "Applying role-based access",
        detail: "Marketing group added. SharePoint sites provisioned. Teams channels joined.",
        duration: 800,
        status: "processing",
      },
      {
        agent: "Device Agent",
        icon: Zap,
        action: "Enrolling device in Intune",
        detail: "Autopilot profile assigned. Compliance policies applied. Apps deploying.",
        duration: 1000,
        status: "processing",
      },
      {
        agent: "Welcome Agent",
        icon: Mail,
        action: "Sending welcome package",
        detail: "Personalized email with credentials, IT guide, and Copilot quick-start sent",
        duration: 500,
        status: "processing",
      },
      {
        agent: "Completion Agent",
        icon: CheckCircle2,
        action: "Onboarding complete",
        detail: "Full M365 environment ready in 6.3 minutes. Zero IT tickets required.",
        duration: 400,
        status: "complete",
      },
    ],
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
                isComplete
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                  : c.badge
              }`}
            >
              {isComplete ? "✓ Done" : "● Running"}
            </Badge>
          )}
        </div>
        <p className={`font-semibold text-sm mb-0.5 ${visible ? "text-white" : "text-slate-700"}`}>
          {step.action}
        </p>
        {visible && (
          <p className="text-xs text-slate-400 leading-relaxed">{step.detail}</p>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AIDemoPage() {
  useSEO({
    title: "Live AI Agent Demo — See GigitekAI Automation in Action",
    description:
      "Watch GigitekAI's Agentic AI workflows live: helpdesk auto-resolution, zero-trust threat response, and zero-touch M365 onboarding. No sign-up required.",
    path: "/ai-demo",
  });

  const [activeScenario, setActiveScenario] = useState(0);
  const [running, setRunning] = useState(false);
  const [visibleSteps, setVisibleSteps] = useState<number[]>([]);
  const [completed, setCompleted] = useState(false);
  const [totalTime, setTotalTime] = useState(0);
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  const scenario = SCENARIOS[activeScenario];
  const c = COLOR_MAP[scenario.color];

  const resetDemo = () => {
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];
    setRunning(false);
    setVisibleSteps([]);
    setCompleted(false);
    setTotalTime(0);
  };

  const runDemo = () => {
    resetDemo();
    setRunning(true);

    let elapsed = 0;
    scenario.steps.forEach((step, i) => {
      elapsed += step.duration;
      const t = setTimeout(() => {
        setVisibleSteps((prev) => [...prev, i]);
        if (i === scenario.steps.length - 1) {
          setCompleted(true);
          setRunning(false);
          setTotalTime(elapsed);
        }
      }, elapsed);
      timeoutRefs.current.push(t);
    });
  };

  // Cleanup on unmount or scenario change
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(clearTimeout);
    };
  }, [activeScenario]);

  const handleScenarioChange = (idx: number) => {
    resetDemo();
    setActiveScenario(idx);
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <SiteNavBar2024 />

      {/* ── Hero ── */}
      <section className="pt-24 pb-12 px-4 max-w-6xl mx-auto text-center">
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
      </section>

      {/* ── Scenario Selector ── */}
      <section className="px-4 max-w-6xl mx-auto mb-10">
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
      </section>

      {/* ── Demo Terminal ── */}
      <section className="px-4 max-w-4xl mx-auto mb-16">
        <div className={`rounded-2xl border ${c.border} bg-slate-900/80 overflow-hidden shadow-2xl ${c.glow}`}>
          {/* Terminal header */}
          <div className="flex items-center justify-between px-5 py-3 bg-slate-800/80 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
              <span className="ml-3 text-xs font-mono text-slate-400">
                gigitekai-agent-runtime — {scenario.title}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {running && (
                <span className={`text-xs font-mono ${c.text} flex items-center gap-1`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  RUNNING
                </span>
              )}
              {completed && (
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  COMPLETE — {(totalTime / 1000).toFixed(1)}s
                </span>
              )}
            </div>
          </div>

          {/* Workflow steps */}
          <div className="p-6 min-h-[420px]">
            {visibleSteps.length === 0 && !running ? (
              <div className="flex flex-col items-center justify-center h-80 gap-4">
                <div className={`w-16 h-16 rounded-full ${c.bg} border ${c.border} flex items-center justify-center`}>
                  <Play className={`w-7 h-7 ${c.text}`} />
                </div>
                <p className="text-slate-400 text-sm text-center max-w-xs">
                  Press <strong className="text-white">Run Demo</strong> to watch the AI agent workflow execute step-by-step in real time.
                </p>
              </div>
            ) : (
              <div className="space-y-0">
                {scenario.steps.map((step, i) => (
                  <WorkflowStep
                    key={i}
                    step={step}
                    index={i}
                    visible={visibleSteps.includes(i)}
                    isLast={i === scenario.steps.length - 1}
                    color={scenario.color}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="px-6 py-4 bg-slate-800/50 border-t border-slate-700 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Button
                onClick={runDemo}
                disabled={running}
                className={`${running ? "opacity-60 cursor-not-allowed" : ""} bg-cyan-500 hover:bg-cyan-600 text-white font-semibold`}
              >
                <Play className="w-4 h-4 mr-2" />
                {running ? "Running..." : completed ? "Run Again" : "Run Demo"}
              </Button>
              {(visibleSteps.length > 0 || completed) && (
                <Button
                  variant="outline"
                  onClick={resetDemo}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5" />
              <span>Simulated at 10× real speed for demo purposes</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="px-4 max-w-6xl mx-auto mb-16">
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
      </section>

      {/* ── CTA ── */}
      <section className="px-4 max-w-4xl mx-auto mb-20">
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-2xl p-10 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Ready to deploy AI agents in your business?
          </h2>
          <p className="text-slate-300 mb-8 max-w-xl mx-auto">
            These workflows are live in GigitekAI client environments today. We can have your first agent running in under 30 days.
          </p>
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
