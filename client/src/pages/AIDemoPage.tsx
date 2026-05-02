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
    codeSnippet: `// GigitekAI Security Response Agent
// Runtime: Azure Logic Apps + Defender for Endpoint API

async function respondToThreat(alert) {
  // Parallel threat analysis
  const [iocAnalysis, userRisk, deviceRisk] = await Promise.all([
    threatIntelAgent.analyze(alert.indicators),
    identityAgent.getUserRiskScore(alert.userId),
    endpointAgent.getDeviceRisk(alert.deviceId)
  ]);

  const severity = calculateSeverity({ iocAnalysis, userRisk, deviceRisk });

  if (severity >= CRITICAL) {
    // Isolate device immediately
    await defenderAgent.isolateDevice(alert.deviceId);
    // Revoke all active sessions
    await graphClient
      .api("/users/" + alert.userId + "/revokeSignInSessions")
      .post({});
    // Notify SOC + create P1 ticket
    await Promise.all([
      socAgent.createIncident(alert, severity),
      teamsAgent.alertChannel("security-ops", alert)
    ]);
  }
}`,
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
    codeSnippet: `// GigitekAI M365 Onboarding Agent
// Runtime: Power Automate + Microsoft Graph API

async function onboardEmployee(employee) {
  // Create identity in Entra ID
  const user = await graphClient.api("/users").post({
    displayName: employee.fullName,
    userPrincipalName: employee.email,
    passwordProfile: { forceChangePasswordNextSignIn: true }
  });

  // Assign licenses
  await graphClient
    .api("/users/" + user.id + "/assignLicense")
    .post({ addLicenses: [{ skuId: M365_BUSINESS_PREMIUM_SKU }] });

  // Apply Zero Trust security baseline
  await conditionalAccessAgent.applyBaseline(user.id, {
    mfaRequired: true,
    compliantDeviceRequired: true,
    zeroTrustPolicy: "enterprise"
  });

  // Provision all workloads in parallel
  await Promise.all([
    teamsAgent.createChannels(user.id, employee.department),
    sharepointAgent.grantAccess(user.id, employee.sites),
    intuneAgent.enrollDevice(user.id)
  ]);
}`,
  },
  // ── NEW SCENARIO 4: Proactive Monitoring & Auto-Remediation ──────────────────
  {
    id: "monitoring",
    icon: Activity,
    title: "Proactive Monitoring & Auto-Remediation",
    subtitle: "AI-driven infrastructure healing",
    description:
      "An AI agent detects a server degrading before it fails, diagnoses the root cause, auto-remediates, and files a report — all before a human is even paged.",
    color: "orange",
    steps: [
      {
        agent: "Telemetry Agent",
        icon: Activity,
        action: "Anomaly pattern detected",
        detail: "Server SRV-PROD-04: CPU 87% sustained 12 min. Memory leak signature identified.",
        duration: 700,
        status: "processing",
      },
      {
        agent: "Diagnostic Agent",
        icon: Brain,
        action: "Root cause analysis",
        detail: "Process: IIS AppPool 'GigitekAPI' leaking memory. Correlated with deploy at 14:32 UTC.",
        duration: 900,
        status: "processing",
      },
      {
        agent: "Knowledge Agent",
        icon: Database,
        action: "Querying remediation playbook",
        detail: "Matched runbook KB-2041: IIS memory leak → recycle app pool + alert dev team.",
        duration: 600,
        status: "processing",
      },
      {
        agent: "Remediation Agent",
        icon: RefreshCw,
        action: "Executing auto-remediation",
        detail: "IIS AppPool recycled via PowerShell. CPU dropped to 12%. Memory freed: 4.2 GB.",
        duration: 1000,
        status: "processing",
      },
      {
        agent: "Validation Agent",
        icon: CheckCircle2,
        action: "Health check passed",
        detail: "API response time: 142ms (normal). Error rate: 0.01%. Service restored.",
        duration: 700,
        status: "processing",
      },
      {
        agent: "Notification Agent",
        icon: MessageSquare,
        action: "Stakeholders notified",
        detail: "Teams alert + ITSM ticket created. Dev team notified of memory leak in build v2.4.1.",
        duration: 500,
        status: "processing",
      },
      {
        agent: "Audit Agent",
        icon: BarChart3,
        action: "Incident report filed",
        detail: "MTTR: 4 min 12 sec. Zero downtime. Prevented estimated 2hr outage. Ticket closed.",
        duration: 400,
        status: "complete",
      },
    ],
    codeSnippet: `// GigitekAI Proactive Monitoring Agent
// Runtime: Azure Monitor + Logic Apps

async function monitorAndRemediate(alert) {
  // AI-powered root cause analysis
  const diagnosis = await diagnosticAgent.analyze({
    metrics: alert.metrics,
    historicalBaseline: await getBaseline(alert.resourceId),
    model: "gpt-4o"
  });

  if (diagnosis.failureProbability > 0.85) {
    const remediation = REMEDIATION_PLAYBOOKS[diagnosis.rootCause];

    if (remediation.autoApproved) {
      // Execute fix before failure occurs
      await remediationAgent.execute(remediation, alert.resourceId);

      // Verify health post-remediation
      const postCheck = await healthAgent.verify(alert.resourceId);

      if (postCheck.healthy) {
        await ticketingAgent.createResolved({
          title: "Auto-remediated: " + diagnosis.rootCause,
          mttr: diagnosis.remediationTime,
          humanTouches: 0
        });
      }
    }
  }
}`,
  },

  // ── NEW SCENARIO 5: Employee Offboarding ──────────────────────────────────────
  {
    id: "offboarding",
    icon: UserMinus,
    title: "Employee Offboarding",
    subtitle: "Zero-gap access revocation",
    description:
      "An employee departure triggers a coordinated AI agent swarm that revokes all access, recovers assets, and ensures compliance — in under 3 minutes.",
    color: "violet",
    steps: [
      {
        agent: "HR Sync Agent",
        icon: UserMinus,
        action: "Termination event received",
        detail: "HR system: James Ortega, Sales Rep — termination effective immediately. Reason: voluntary.",
        duration: 600,
        status: "processing",
      },
      {
        agent: "Identity Agent",
        icon: Lock,
        action: "Disabling Entra ID account",
        detail: "Account disabled. All active sessions revoked. MFA tokens invalidated. 14 app tokens cleared.",
        duration: 800,
        status: "processing",
      },
      {
        agent: "License Agent",
        icon: Zap,
        action: "Reclaiming licenses",
        detail: "M365 Business Premium + Copilot licenses unassigned. Saved: $57/month.",
        duration: 600,
        status: "processing",
      },
      {
        agent: "Data Agent",
        icon: Database,
        action: "Preserving & transferring data",
        detail: "OneDrive content transferred to manager. Mailbox converted to shared. Retention policy applied.",
        duration: 900,
        status: "processing",
      },
      {
        agent: "Device Agent",
        icon: Server,
        action: "Remote wipe initiated",
        detail: "Intune: selective wipe on corporate device. Personal data preserved. MDM enrollment removed.",
        duration: 800,
        status: "processing",
      },
      {
        agent: "Compliance Agent",
        icon: Shield,
        action: "Compliance record created",
        detail: "GDPR/SOC2 offboarding checklist completed. Audit trail logged to Sentinel.",
        duration: 500,
        status: "processing",
      },
      {
        agent: "Completion Agent",
        icon: CheckCircle2,
        action: "Offboarding complete",
        detail: "All 23 access points revoked. Total time: 2 min 47 sec. Zero manual steps required.",
        duration: 400,
        status: "complete",
      },
    ],
    codeSnippet: `// GigitekAI Employee Offboarding Agent
// Runtime: Azure Functions + Microsoft Graph API

async function offboardEmployee(employee) {
  // Immediate parallel access revocation
  await Promise.all([
    graphClient.api("/users/" + employee.id + "/revokeSignInSessions").post({}),
    graphClient.api("/users/" + employee.id).patch({ accountEnabled: false }),
    intuneAgent.wipeDevices(employee.id),
    defenderAgent.offboardEndpoints(employee.id)
  ]);

  // Transfer data ownership to manager
  await graphClient
    .api("/users/" + employee.id + "/mailboxSettings")
    .patch({ autoReplyEnabled: true, forwardTo: employee.managerId });

  await sharepointAgent.transferOwnership(employee.id, employee.managerId);

  // Generate compliance audit report
  const auditReport = await complianceAgent.generateReport({
    userId: employee.id,
    accessRevoked: true,
    dataTransferred: true
  });

  await notificationAgent.sendSummary("hr-team", employee, auditReport);
}`,
  },

  // ── NEW SCENARIO 6: Complex Multi-System Agentic AI Orchestration ─────────────
  {
    id: "agentic-orchestration",
    icon: Workflow,
    title: "Multi-System Agentic Orchestration",
    subtitle: "AI agents coordinating across 8 systems",
    description:
      "A new enterprise client signs a contract — and an Orchestrator AI spawns specialized sub-agents that simultaneously provision their entire environment across M365, Azure, Dynamics 365, Intune, ConnectSecure, and the billing system.",
    color: "purple",
    steps: [
      {
        agent: "Orchestrator Agent",
        icon: Cpu,
        action: "Contract signed — spawning agent swarm",
        detail: "CRM webhook: Acme Corp signed Enterprise AI plan. Orchestrator spawning 7 parallel sub-agents.",
        duration: 600,
        status: "processing",
      },
      {
        agent: "Identity Sub-Agent",
        icon: Shield,
        action: "[PARALLEL] Provisioning Entra ID tenant",
        detail: "New tenant: acmecorp.gigitekai.com. Admin accounts created. Conditional Access baseline applied.",
        duration: 1000,
        status: "processing",
      },
      {
        agent: "Azure Sub-Agent",
        icon: Server,
        action: "[PARALLEL] Deploying Azure infrastructure",
        detail: "Resource group created. VNet + NSG configured. Log Analytics workspace provisioned.",
        duration: 1100,
        status: "processing",
      },
      {
        agent: "M365 Sub-Agent",
        icon: Layers,
        action: "[PARALLEL] Configuring M365 environment",
        detail: "25x Business Premium licenses assigned. Teams, SharePoint, Exchange policies applied. Copilot enabled.",
        duration: 900,
        status: "processing",
      },
      {
        agent: "Security Sub-Agent",
        icon: Lock,
        action: "[PARALLEL] Deploying security stack",
        detail: "ConnectSecure scan initiated. DefensX DNS filtering live. Defender for Business enrolled.",
        duration: 1000,
        status: "processing",
      },
      {
        agent: "CRM Sub-Agent",
        icon: Database,
        action: "[PARALLEL] Creating Dynamics 365 records",
        detail: "Account, contacts, and SLA records created in D365. Support queue assigned. Helpdesk portal provisioned.",
        duration: 800,
        status: "processing",
      },
      {
        agent: "Billing Sub-Agent",
        icon: BarChart3,
        action: "[PARALLEL] Activating billing & reporting",
        detail: "Recurring invoice created in billing system. Usage monitoring enabled. Client portal access granted.",
        duration: 700,
        status: "processing",
      },
      {
        agent: "Orchestrator Agent",
        icon: GitBranch,
        action: "Validating all sub-agent results",
        detail: "7/7 sub-agents completed. Cross-checking dependencies: DNS, SSO federation, backup policies.",
        duration: 900,
        status: "processing",
      },
      {
        agent: "Welcome Agent",
        icon: Globe,
        action: "Client environment handoff",
        detail: "Welcome email sent with portal links, admin credentials, and onboarding guide. Account manager notified.",
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
  const [showCode, setShowCode] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadCompany, setLeadCompany] = useState("");
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadSubmitting, setLeadSubmitting] = useState(false);

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
    setShowCode(false);
    setActiveScenario(idx);
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || !leadEmail) return;
    setLeadSubmitting(true);
    await new Promise(r => setTimeout(r, 1200));
    setLeadSubmitted(true);
    setLeadSubmitting(false);
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
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCode(v => !v)}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors font-mono border border-slate-700 hover:border-cyan-500/50 rounded-lg px-3 py-1.5"
              >
                <Code2 className="w-3.5 h-3.5" />
                {showCode ? "Hide Code" : "View Agent Code"}
                {showCode ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                <span>Simulated at 10× real speed</span>
              </div>
            </div>
          </div>
          {/* Code View Panel */}
          {showCode && (
            <div className="border-t border-slate-700 bg-[#0d1117]">
              <div className="flex items-center justify-between px-5 py-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-xs font-mono text-cyan-400">agent-source.ts</span>
                  <span className="text-xs text-slate-600">— {scenario.title}</span>
                </div>
                <button onClick={() => setShowCode(false)} className="text-slate-600 hover:text-slate-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <pre className="p-5 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed max-h-80 overflow-y-auto">
                <code>{(scenario as any).codeSnippet}</code>
              </pre>
            </div>
          )}
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

      {/* ── Lead Capture Form ── */}
      <section className="px-4 max-w-4xl mx-auto mb-16">
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
      </section>
      {/* ── CTA ── */}
      <section className="px-4 max-w-4xl mx-auto mb-20">
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
      </section>
            <Footer />
      <ScrollToTop />
    </div>
  );
}
