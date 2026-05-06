import { useState } from "react";
import { useLocation } from "wouter";
import { LifeBuoy, LogIn, Ticket, MessageSquare, Clock, CheckCircle, AlertCircle, ArrowLeft, Users, Settings, Shield, Eye, BookOpen, Zap, ChevronRight } from "lucide-react";

function StepCard({ number, text }: { number: number; text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <div className="flex gap-4 items-start">
      <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-cyan-400 text-xs font-bold">{number}</span>
      </div>
      <p className="text-gray-300 text-sm leading-relaxed">
        {parts.map((part, i) => {
          if (part.startsWith("**") && part.endsWith("**"))
            return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
          if (part.startsWith("`") && part.endsWith("`"))
            return <code key={i} className="bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded text-xs font-mono">{part.slice(1, -1)}</code>;
          return part;
        })}
      </p>
    </div>
  );
}

function ResultBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 p-4 bg-cyan-900/15 border border-cyan-700/30 rounded-lg flex gap-3">
      <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
      <p className="text-gray-300 text-sm">{children}</p>
    </div>
  );
}

function NoteBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 p-4 bg-amber-900/15 border border-amber-700/30 rounded-lg flex gap-3">
      <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
      <p className="text-gray-300 text-sm">{children}</p>
    </div>
  );
}

export default function HelpdeskAgentGuide() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 border-b border-slate-700/50 bg-slate-950/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setLocation("/helpdesk")}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Helpdesk
          </button>
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>Agent Guide</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-900/30 border border-cyan-700/40 text-cyan-400 text-xs font-medium mb-6">
            <LifeBuoy className="w-3.5 h-3.5" />
            HELPDESK DOCUMENTATION
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
            Helpdesk Agent <span className="text-cyan-400">Onboarding Guide</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Everything you need to get started as a GigitekAI Helpdesk Agent — from logging in to resolving your first ticket.
          </p>
        </div>

        {/* Quick Reference */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { icon: <LogIn className="w-5 h-5" />, label: "Login URL", value: "gigitekai.com/helpdesk", color: "cyan" },
            { icon: <Ticket className="w-5 h-5" />, label: "Ticket Queue", value: "Tickets tab in portal", color: "purple" },
            { icon: <MessageSquare className="w-5 h-5" />, label: "Live Chat", value: "Chat tab in portal", color: "green" },
          ].map(({ icon, label, value, color }) => (
            <div key={label} className={`bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 flex items-center gap-3`}>
              <div className={`w-9 h-9 rounded-lg bg-${color}-500/15 border border-${color}-500/30 flex items-center justify-center text-${color}-400 flex-shrink-0`}>
                {icon}
              </div>
              <div>
                <p className="text-gray-500 text-xs">{label}</p>
                <p className="text-white text-sm font-medium">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Section 1: Logging In */}
        <div className="mb-8">
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                <LogIn className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-white font-semibold">Logging In</h2>
                <p className="text-gray-500 text-xs">Two login methods depending on your account type</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Method A */}
              <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/40">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-cyan-400 bg-cyan-900/30 border border-cyan-800 px-2 py-0.5 rounded-full">Method A</span>
                  <span className="text-gray-400 text-xs">Manus OAuth</span>
                </div>
                <div className="space-y-2.5">
                  <StepCard number={1} text="Go to **gigitekai.com/helpdesk** in your browser." />
                  <StepCard number={2} text="Click **Sign In with Manus** on the login screen." />
                  <StepCard number={3} text="Complete the Manus OAuth flow. You'll be redirected back automatically." />
                </div>
                <ResultBox>You're in — the portal loads your assigned role and permissions immediately.</ResultBox>
              </div>

              {/* Method B */}
              <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/40">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-purple-400 bg-purple-900/30 border border-purple-800 px-2 py-0.5 rounded-full">Method B</span>
                  <span className="text-gray-400 text-xs">Manus OAuth Login</span>
                </div>
                <div className="space-y-2.5">
                  <StepCard number={1} text="Go to **gigitekai.com/admin** in your browser." />
                  <StepCard number={2} text="You'll be redirected to the **Manus OAuth** login page." />
                  <StepCard number={3} text="Sign in with your **Manus account**. You'll be redirected to the portal." />
                </div>
                <NoteBox>All admin and agent access is managed through Manus OAuth. Contact your admin if you need an account.</NoteBox>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Handling Tickets */}
        <div className="mb-8">
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                <Ticket className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <h2 className="text-white font-semibold">Handling Tickets</h2>
                <p className="text-gray-500 text-xs">How to pick up, work, and resolve support tickets</p>
              </div>
            </div>
            <div className="space-y-3">
              <StepCard number={1} text="Click the **Tickets** tab in the portal navigation bar." />
              <StepCard number={2} text="Review the ticket queue. Tickets are sorted by **priority** (Critical → High → Medium → Low) and then by **date submitted**." />
              <StepCard number={3} text="Click a ticket row to open the detail view. Read the full description and any attached files before responding." />
              <StepCard number={4} text="Click **Assign to Me** to take ownership. This removes the ticket from the unassigned queue." />
              <StepCard number={5} text="Use the **Reply** field to communicate with the customer. Keep replies professional and concise." />
              <StepCard number={6} text="Update the **Status** dropdown as work progresses: `Open` → `In Progress` → `Pending Customer` → `Resolved`." />
              <StepCard number={7} text="Once the issue is confirmed resolved, set status to **Resolved** and click **Save**." />
            </div>
            <NoteBox>
              <strong className="text-amber-400">Escalation rule:</strong> If a ticket requires admin access, infrastructure changes, or a vendor call — escalate immediately by setting priority to <strong>Critical</strong> and tagging it with the <code className="bg-slate-800 text-cyan-300 px-1 rounded text-xs font-mono">escalate</code> label. Do not attempt fixes outside your access level.
            </NoteBox>
          </div>
        </div>

        {/* Section 3: Live Chat */}
        <div className="mb-8">
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <h2 className="text-white font-semibold">Live Chat</h2>
                <p className="text-gray-500 text-xs">Real-time customer support via the Chat tab</p>
              </div>
            </div>
            <div className="space-y-3">
              <StepCard number={1} text="Click the **Chat** tab in the portal navigation bar." />
              <StepCard number={2} text="Active chat sessions appear in the left panel. New incoming chats show a **New** badge." />
              <StepCard number={3} text="Click a session to open it. Read the conversation history before responding." />
              <StepCard number={4} text="Type your response in the message box at the bottom and press **Enter** or click **Send**." />
              <StepCard number={5} text="If the issue requires a ticket, click **Create Ticket from Chat** to automatically convert the session into a tracked ticket." />
              <StepCard number={6} text="When the session is resolved, click **Close Chat** to mark it complete." />
            </div>
            <ResultBox>
              Closed chat sessions are archived and searchable. Customers receive a transcript via email if their email was captured during the session.
            </ResultBox>
          </div>
        </div>

        {/* Section 4: Response Time SLAs */}
        <div className="mb-8">
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h2 className="text-white font-semibold">Response Time SLAs</h2>
                <p className="text-gray-500 text-xs">Target response and resolution times by priority</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-800/60">
                    <th className="text-left text-gray-400 font-medium px-4 py-2.5 rounded-tl-lg">Priority</th>
                    <th className="text-left text-gray-400 font-medium px-4 py-2.5">First Response</th>
                    <th className="text-left text-gray-400 font-medium px-4 py-2.5">Resolution Target</th>
                    <th className="text-left text-gray-400 font-medium px-4 py-2.5 rounded-tr-lg">Example</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {[
                    { priority: "Critical", color: "red", first: "15 minutes", resolution: "2 hours", example: "Server down, total outage" },
                    { priority: "High", color: "orange", first: "1 hour", resolution: "4 hours", example: "Email not working, VPN failure" },
                    { priority: "Medium", color: "yellow", first: "4 hours", resolution: "1 business day", example: "Slow PC, printer issue" },
                    { priority: "Low", color: "green", first: "1 business day", resolution: "3 business days", example: "Software request, how-to question" },
                  ].map(({ priority, color, first, resolution, example }) => (
                    <tr key={priority}>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold text-${color}-400 bg-${color}-900/20 border border-${color}-800/40 px-2 py-0.5 rounded-full`}>{priority}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{first}</td>
                      <td className="px-4 py-3 text-gray-300">{resolution}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{example}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Section 5: Role Permissions */}
        <div className="mb-8">
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-slate-700/60 border border-slate-600/50 flex items-center justify-center">
                <Shield className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <h2 className="text-white font-semibold">Your Role Permissions</h2>
                <p className="text-gray-500 text-xs">What each role can access in the portal</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  role: "Admin", colorClass: "red", icon: <Shield className="w-4 h-4" />,
                  can: ["Metrics Dashboard", "Notifications", "Users", "Chat", "Tickets", "Agents", "Account Management"],
                  cannot: [],
                },
                {
                  role: "Agent", colorClass: "cyan", icon: <Users className="w-4 h-4" />,
                  can: ["Metrics (view only)", "Notifications", "Chat", "Tickets"],
                  cannot: ["Users", "Agents", "Full Account Mgmt"],
                },
                {
                  role: "Viewer", colorClass: "gray", icon: <Eye className="w-4 h-4" />,
                  can: ["Metrics (view only)", "Notifications", "Own Account"],
                  cannot: ["Users", "Chat", "Tickets", "Agents", "Full Account Mgmt"],
                },
              ].map(({ role, colorClass, icon, can, cannot }) => (
                <div key={role} className={`bg-slate-800/40 border border-${colorClass}-800/30 rounded-xl p-5`}>
                  <div className={`flex items-center gap-2 mb-4 text-${colorClass}-400`}>
                    {icon}
                    <span className="font-semibold text-sm">{role}</span>
                  </div>
                  <div className="space-y-1.5">
                    {can.map(f => (
                      <div key={f} className="flex items-center gap-2 text-xs text-gray-300">
                        <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" /> {f}
                      </div>
                    ))}
                    {cannot.map(f => (
                      <div key={f} className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="w-3 h-3 flex-shrink-0 text-center leading-none">✕</span> {f}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 6: Tips */}
        <div className="mb-10">
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                <Zap className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-white font-semibold">Quick Tips</h2>
                <p className="text-gray-500 text-xs">Best practices for GigitekAI helpdesk agents</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { tip: "Always acknowledge a ticket within the SLA window — even if you don't have a fix yet. A quick 'I'm looking into this' prevents escalations." },
                { tip: "Use the AI chat assistant (bottom-right bubble) to draft responses or look up Microsoft 365 troubleshooting steps." },
                { tip: "Never share customer credentials in ticket notes. Use secure credential vaults or ask the customer to reset." },
                { tip: "If a ticket is idle for 3+ days pending customer response, send a follow-up and set status to Pending Customer." },
                { tip: "Tag tickets accurately — correct tags feed the Metrics dashboard and help identify recurring issues." },
                { tip: "Log out when you leave your workstation. The portal session is tied to your browser — shared computers are a security risk." },
              ].map(({ tip }, i) => (
                <div key={i} className="flex gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
                  <ChevronRight className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-300 text-xs leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center border-t border-slate-800 pt-8">
          <p className="text-gray-400 text-xs mb-4">Last updated: April 10, 2026 — GigitekAI Helpdesk Agent Guide</p>
          <button
            onClick={() => setLocation("/helpdesk")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg transition-colors text-sm"
          >
            <LifeBuoy className="w-4 h-4" />
            Go to Helpdesk Portal
          </button>
        </div>
      </div>
    </div>
  );
}
