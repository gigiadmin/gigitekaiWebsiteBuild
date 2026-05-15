/*
  GigitekAI — "Project Untouchable" Section
  Three nuclear competitive moats:
  A. Anti-Lock-In Vault (Data Sovereignty)
  B. Accuracy Insurance (Liability Shield)
  C. Open-Source Core (Developer Mindshare)
*/

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Lock,
  Unlock,
  FileCode,
  Scale,
  Globe,
  CheckCircle2,
  ArrowRight,
  Database,
  GitBranch,
  Award,
  Briefcase,
  Code2,
  Users,
  ExternalLink,
} from "lucide-react";


interface Pillar {
  id: string;
  letter: string;
  title: string;
  subtitle: string;
  problem: string;
  solution: string;
  moat: string;
  features: string[];
  icon: React.ReactNode;
  accentColor: string;
  borderColor: string;
  bgColor: string;
  badgeColor: string;
}

const PILLARS: Pillar[] = [
  {
    id: "anti-lock-in",
    letter: "A",
    title: "Anti-Lock-In Vault",
    subtitle: "Data Sovereignty Guarantee",
    problem: "Clients fear being trapped in a proprietary AI ecosystem with no exit strategy.",
    solution:
      "A documented Exit-Strategy Guarantee. GigitekAI provides a 'Portable Vault' containing all Infrastructure as Code (IaC) and agent logic — ensuring you own your intelligence.",
    moat: "By making it easy to leave, we remove the primary psychological barrier to signing high-value, long-term contracts.",
    features: [
      "Full IaC export (Terraform, Bicep, ARM)",
      "Agent logic & workflow portability",
      "Data migration assistance included",
      "90-day transition support guarantee",
    ],
    icon: <Unlock size={28} className="text-cyan-400" />,
    accentColor: "text-cyan-400",
    borderColor: "border-cyan-500/30",
    bgColor: "bg-cyan-500/5",
    badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  },
  {
    id: "accuracy-insurance",
    letter: "B",
    title: "Accuracy Insurance",
    subtitle: "The Liability Shield",
    problem: "Board-level fear of AI hallucinations, compliance failures, and legal liability.",
    solution:
      "Contractual Guardrails that move beyond 'best effort' to a liability-backed SLA where GigitekAI insures the accuracy and adherence of managed agents within defined parameters.",
    moat: "We are no longer selling software — we are selling Accountability. This transforms the conversation from 'cost' to 'risk mitigation.'",
    features: [
      "Liability-backed accuracy SLA",
      "Contractual compliance guardrails",
      "Real-time hallucination detection",
      "Audit-ready decision logging",
    ],
    icon: <Shield size={28} className="text-emerald-400" />,
    accentColor: "text-emerald-400",
    borderColor: "border-emerald-500/30",
    bgColor: "bg-emerald-500/5",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  },
  {
    id: "open-source-core",
    letter: "C",
    title: "Open-Source Core",
    subtitle: "Developer Mindshare",
    problem: "Being viewed as a 'vendor' rather than an industry authority and thought leader.",
    solution:
      "Releasing a Community Edition of our Agentic Framework. When the industry builds on our standards, our competitors become our students.",
    moat: "We own the developer mindshare. The open-source community becomes our R&D department, our evangelists, and our talent pipeline.",
    features: [
      "Community Edition framework",
      "Public agent templates & blueprints",
      "Contributor ecosystem & governance",
      "Enterprise features for paying clients",
    ],
    icon: <Code2 size={28} className="text-purple-400" />,
    accentColor: "text-purple-400",
    borderColor: "border-purple-500/30",
    bgColor: "bg-purple-500/5",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  },
];

export default function ProjectUntouchable() {
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);

  return (
    <section className="py-20 md:py-28 px-4 bg-[#0A0E1A] relative overflow-hidden">
      {/* Subtle background grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "linear-gradient(rgba(0,212,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.3) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-14">
          <Badge className="bg-slate-800 text-slate-300 border-slate-600 mb-4">
            <Lock size={12} className="mr-1" />
            Competitive Architecture
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Project{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-purple-400 bg-clip-text text-transparent">
              Untouchable
            </span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-base md:text-lg">
            Three permanent competitive moats that make GigitekAI a category-of-one enterprise.
            Not features — strategic positions that compound over time.
          </p>
        </div>

        {/* Three Pillars */}
        <div className="grid lg:grid-cols-3 gap-6 mb-14">
          {PILLARS.map((pillar) => {
            const isExpanded = expandedPillar === pillar.id;
            return (
              <div
                key={pillar.id}
                className={`rounded-2xl border ${pillar.borderColor} ${pillar.bgColor} p-6 md:p-7 transition-all duration-300 cursor-pointer hover:shadow-lg ${
                  isExpanded ? "ring-1 ring-offset-0" : ""
                }`}
                style={{}}
                onClick={() => setExpandedPillar(isExpanded ? null : pillar.id)}
              >
                {/* Pillar Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center flex-shrink-0">
                    {pillar.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-mono font-bold ${pillar.accentColor}`}>
                        PILLAR {pillar.letter}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white">{pillar.title}</h3>
                    <p className="text-xs text-gray-500">{pillar.subtitle}</p>
                  </div>
                </div>

                {/* Problem */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-red-400/80 uppercase tracking-wide mb-1">The Problem</p>
                  <p className="text-sm text-gray-400 leading-relaxed">{pillar.problem}</p>
                </div>

                {/* Solution */}
                <div className="mb-4">
                  <p className={`text-xs font-semibold ${pillar.accentColor} uppercase tracking-wide mb-1`}>Our Solution</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{pillar.solution}</p>
                </div>

                {/* Expanded: Moat + Features */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-700/50 animate-in fade-in duration-300">
                    <p className="text-xs font-semibold text-amber-400/80 uppercase tracking-wide mb-1">The Moat</p>
                    <p className="text-sm text-gray-400 leading-relaxed italic mb-4">"{pillar.moat}"</p>

                    <div className="space-y-2">
                      {pillar.features.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
                          <CheckCircle2 size={12} className={pillar.accentColor} />
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expand hint */}
                {!isExpanded && (
                  <p className="text-[10px] text-gray-400 mt-3 text-center">Click to expand</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Stats / Trust Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { icon: <Database size={18} />, label: "Data Portability", value: "100%" },
            { icon: <Scale size={18} />, label: "Accuracy SLA", value: "99.7%" },
            { icon: <GitBranch size={18} />, label: "Open-Source Agents", value: "12+" },
            { icon: <Users size={18} />, label: "Community Members", value: "50+" },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 text-center"
            >
              <div className="flex justify-center text-[#00D4FF] mb-2">{stat.icon}</div>
              <p className="text-xl font-bold text-white">{stat.value}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <a href="/contact" style={{ textDecoration: 'none' }}>
            <Button className="bg-[#00D4FF] hover:bg-[#00B8D4] text-[#0A0E1A] font-semibold px-8 py-3 text-base">
              Learn How We Protect Your Investment
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
