/*
  AdminGuide — Step-by-step guide for creating admin accounts on GigitekAI
  Design: Matches GigitekAI brand — deep navy-black + electric cyan accents
*/

import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Shield,
  UserPlus,
  Users,
  KeyRound,
  UserX,
  ChevronRight,
  CheckCircle2,
  Info,
  Lock,
  Eye,
  Headphones,
} from "lucide-react";

const steps = {
  methodA: [
    {
      num: 1,
      text: 'Open the GigitekAI Management UI and click the **Database** panel in the right sidebar.',
    },
    {
      num: 2,
      text: 'In the table list on the left, click **users**.',
    },
    {
      num: 3,
      text: 'Find the row for the email you want to promote. Use the search/filter at the top of the table.',
    },
    {
      num: 4,
      text: 'Click the row to open the edit view. Change the `role` field from `user` to `admin`.',
    },
    {
      num: 5,
      text: 'Click **Save**. The change is immediate — no restart required.',
    },
  ],
  methodB: [
    {
      num: 1,
      text: 'Go to `gigitekai.com/admin` and log in with your Manus account.',
    },
    {
      num: 2,
      text: 'Click the **Account** tab (gear icon, far right of the tab bar).',
    },
    {
      num: 3,
      text: 'Scroll down to the **Create Account** section.',
    },
    {
      num: 4,
      text: 'Fill in Full Name, Email, Password (min 8 characters), and Role.',
    },
    {
      num: 5,
      text: 'Click **Create Account**. The account is created immediately.',
    },
    {
      num: 6,
      text: 'Share access. Staff log in at `gigitekai.com/admin` via Manus OAuth.',
    },
  ],
  reset: [
    { num: 1, text: 'Log into `/admin` as Admin.' },
    { num: 2, text: 'Go to **Account** tab → **Manage Accounts** section.' },
    { num: 3, text: 'Find the account, click **Edit**, enter a new password, and click **Save**.' },
  ],
};

const roles = [
  {
    name: "Admin",
    icon: Shield,
    color: "text-cyan-400",
    bg: "bg-cyan-900/20 border-cyan-700/40",
    perms: ["Metrics", "Notifications", "Users", "Chat", "Tickets", "Agents", "Account"],
    denied: [],
  },
  {
    name: "Agent",
    icon: Headphones,
    color: "text-emerald-400",
    bg: "bg-emerald-900/20 border-emerald-700/40",
    perms: ["Metrics", "Notifications", "Chat", "Tickets", "Own Account"],
    denied: ["Users", "Agents", "Full Account"],
  },
  {
    name: "Viewer",
    icon: Eye,
    color: "text-amber-400",
    bg: "bg-amber-900/20 border-amber-700/40",
    perms: ["Metrics", "Notifications", "Own Account"],
    denied: ["Users", "Chat", "Tickets", "Agents", "Full Account"],
  },
];

function StepCard({ num, text }: { num: number; text: string }) {
  // Parse bold (**text**) and inline code (`text`) in step text
  const parsed = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded text-sm font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });

  return (
    <div className="flex gap-4 group">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold text-sm mt-0.5 group-hover:bg-cyan-500/30 transition-colors">
        {num}
      </div>
      <p className="text-gray-300 leading-relaxed pt-1">{parsed}</p>
    </div>
  );
}

export default function AdminGuide() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      {/* Top nav bar */}
      <header className="border-b border-slate-800 bg-[#0A0E1A]/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setLocation("/admin")}
            className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin Portal
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <span className="text-sm font-semibold text-white">Admin Guide</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-16">

        {/* Hero */}
        <section className="text-center space-y-4">
          <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-xs uppercase tracking-widest px-3 py-1">
            Admin Documentation
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Creating a Second{" "}
            <span className="text-cyan-400">Admin Account</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Two methods are available depending on whether the person has a Manus account or not.
            Choose the method that fits your use case.
          </p>
        </section>

        {/* Method A */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Method A</h2>
              <p className="text-gray-400 text-sm">Promote an Existing Manus OAuth User to Admin</p>
            </div>
            <Badge className="ml-auto bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-xs">
              Recommended
            </Badge>
          </div>

          <p className="text-gray-400 leading-relaxed">
            Use this when the person already logs in via Manus — for example, another email you own or a trusted partner.
          </p>

          <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6 space-y-5">
            {steps.methodA.map((s) => (
              <StepCard key={s.num} num={s.num} text={s.text} />
            ))}
          </div>

          {/* Result callout */}
          <div className="flex gap-3 bg-cyan-900/15 border border-cyan-700/30 rounded-lg p-4">
            <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <p className="text-gray-300 text-sm leading-relaxed">
              <strong className="text-white">Result:</strong> That person can go to{" "}
              <code className="bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded text-xs font-mono">
                gigitekai.com/admin
              </code>{" "}
              after logging in via Manus OAuth and will have full Admin access immediately.
            </p>
          </div>

          {/* Note */}
          <div className="flex gap-3 bg-amber-900/15 border border-amber-700/30 rounded-lg p-4">
            <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-gray-300 text-sm leading-relaxed">
              <strong className="text-white">Note:</strong> If the person has never logged into the helpdesk before, they won't have a row in the{" "}
              <code className="bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded text-xs font-mono">users</code>{" "}
              table yet. Have them visit{" "}
              <code className="bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded text-xs font-mono">gigitekai.com/helpdesk</code>{" "}
              first to trigger account creation, then promote them using the steps above.
            </p>
          </div>
        </section>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-[#0A0E1A] px-4 text-gray-500 text-sm">or</span>
          </div>
        </div>

        {/* Method B */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-700/40 border border-slate-600/40 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-gray-300" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Method B</h2>
              <p className="text-gray-400 text-sm">Create a Custom Login Account</p>
            </div>
            <Badge className="ml-auto bg-slate-700/30 text-gray-400 border-slate-600/40 text-xs">
              No Manus Account Required
            </Badge>
          </div>

          <p className="text-gray-400 leading-relaxed">
            Use this for staff members (agents, technicians, viewers) who do not have a Manus account.
          </p>

          <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6 space-y-5">
            {steps.methodB.map((s) => (
              <StepCard key={s.num} num={s.num} text={s.text} />
            ))}
          </div>

          {/* Account fields table */}
          <div className="overflow-x-auto rounded-xl border border-slate-700/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800/60 border-b border-slate-700/50">
                  <th className="text-left px-5 py-3 text-gray-400 font-medium">Field</th>
                  <th className="text-left px-5 py-3 text-gray-400 font-medium">Example</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {[
                  ["Full Name", "Nick Crespo"],
                  ["Email", "nick@gigitekai.com"],
                  ["Password", "Minimum 8 characters"],
                  ["Role", "Admin / Agent / Viewer"],
                ].map(([field, example]) => (
                  <tr key={field} className="bg-slate-900/40 hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3 text-white font-medium">{field}</td>
                    <td className="px-5 py-3 text-gray-400 font-mono text-xs">{example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Role Permissions */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
              <Lock className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Role Permissions</h2>
              <p className="text-gray-400 text-sm">What each role can access in the Admin Portal</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <div key={role.name} className={`rounded-xl border p-5 space-y-4 ${role.bg}`}>
                  <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${role.color}`} />
                    <span className={`font-bold text-lg ${role.color}`}>{role.name}</span>
                  </div>
                  <div className="space-y-1.5">
                    {role.perms.map((p) => (
                      <div key={p} className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        {p}
                      </div>
                    ))}
                    {role.denied.map((p) => (
                      <div key={p} className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-3.5 h-3.5 rounded-full border border-gray-700 flex-shrink-0" />
                        {p}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Password Reset */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-700/40 border border-slate-600/40 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-gray-300" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Resetting a Password</h2>
              <p className="text-gray-400 text-sm">For custom-login staff accounts only</p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6 space-y-5">
            {steps.reset.map((s) => (
              <StepCard key={s.num} num={s.num} text={s.text} />
            ))}
          </div>
        </section>

        {/* Revoking Access */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-900/20 border border-red-700/30 flex items-center justify-center">
              <UserX className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Revoking Access</h2>
              <p className="text-gray-400 text-sm">Remove or downgrade an account</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold text-white text-sm">Manus OAuth Users</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Go to <strong className="text-white">Database</strong> → <code className="bg-slate-800 text-cyan-300 px-1 py-0.5 rounded text-xs font-mono">users</code> table → change <code className="bg-slate-800 text-cyan-300 px-1 py-0.5 rounded text-xs font-mono">role</code> back to <code className="bg-slate-800 text-cyan-300 px-1 py-0.5 rounded text-xs font-mono">user</code>.
              </p>
            </div>
            <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-gray-300" />
                <span className="font-semibold text-white text-sm">Custom Login Accounts</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Go to <strong className="text-white">Account</strong> tab → <strong className="text-white">Manage Accounts</strong> → toggle the account to <strong className="text-white">Inactive</strong> or click <strong className="text-red-400">Delete</strong>.
              </p>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="border-t border-slate-800 pt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            Last updated: April 10, 2026 — GigitekAI Admin Guide
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => setLocation("/admin")}
              variant="outline"
              className="border-cyan-700 text-cyan-400 hover:bg-cyan-900/30 hover:text-cyan-300 gap-2"
            >
              Go to Admin Portal
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
