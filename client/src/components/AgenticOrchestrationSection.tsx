/**
 * AgenticOrchestrationSection — Homepage highlight for Multi-System Agentic AI
 * Showcases the complexity of the orchestration demo to drive /ai-demo conversions
 */
import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Bot,
  ArrowRight,
  Zap,
  Database,
  Shield,
  Users,
  Globe,
  BarChart3,
  Cpu,
  GitBranch,
  Play,
  CheckCircle2,
} from "lucide-react";

const SYSTEMS = [
  { icon: Globe, label: "Microsoft 365", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30" },
  { icon: Database, label: "Azure AD", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/30" },
  { icon: Shield, label: "ConnectSecure", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
  { icon: Cpu, label: "Intune MDM", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/30" },
  { icon: BarChart3, label: "Dynamics 365", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30" },
  { icon: Users, label: "DefensX", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30" },
  { icon: GitBranch, label: "Helpdesk", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30" },
  { icon: Zap, label: "Billing API", color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/30" },
];

const AGENT_STEPS = [
  { agent: "Orchestrator Agent", action: "Receives new client provisioning request", time: "0.0s" },
  { agent: "Identity Agent", action: "Creates Azure AD accounts + assigns M365 licenses", time: "1.2s" },
  { agent: "Security Agent", action: "Enrolls device in ConnectSecure + DefensX policies", time: "1.4s" },
  { agent: "Device Agent", action: "Pushes Intune MDM profile + compliance baseline", time: "1.6s" },
  { agent: "CRM Agent", action: "Creates Dynamics 365 contact + opportunity record", time: "1.8s" },
  { agent: "Helpdesk Agent", action: "Opens onboarding ticket + assigns to tech team", time: "2.0s" },
  { agent: "Billing Agent", action: "Activates subscription + generates first invoice", time: "2.1s" },
  { agent: "Orchestrator Agent", action: "Validates all 7 systems — sends welcome email", time: "3.4s" },
];

export default function AgenticOrchestrationSection() {
  const [videoVisible, setVideoVisible] = React.useState(false);
  const videoRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVideoVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current);
      }
    };
  }, []);

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-[#0A0E1A] to-[#060810] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto relative">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-4 py-1.5 mb-5">
            <Bot className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-400 text-sm font-medium">Multi-System Agentic AI</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            8 Systems. 10 Agents.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              One Orchestrated Workflow.
            </span>
          </h2>
          <p className="text-slate-300 max-w-2xl mx-auto text-lg">
            Watch a single AI Orchestrator spawn 7 parallel sub-agents that simultaneously provision a new client across your entire tech stack — in under 4 seconds.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left: Systems grid */}
          <div>
            <p className="text-xs font-mono text-slate-300 uppercase tracking-widest mb-4">Systems Connected Simultaneously</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {SYSTEMS.map((sys, i) => {
                const Icon = sys.icon;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-3 rounded-xl border ${sys.bg} backdrop-blur-sm`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-slate-900/60`}>
                      <Icon className={`w-4 h-4 ${sys.color}`} />
                    </div>
                    <span className="text-sm font-medium text-slate-200">{sys.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "3.4s", label: "Full provisioning" },
                { value: "10", label: "AI agents spawned" },
                { value: "0", label: "Manual steps" },
              ].map((stat, i) => (
                <div key={i} className="text-center p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <p className="text-2xl font-bold text-cyan-400">{stat.value}</p>
                  <p className="text-xs text-slate-300 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Agent execution log */}
          <div className="rounded-2xl border border-slate-700 bg-slate-900/80 overflow-hidden shadow-2xl shadow-cyan-500/5">
            {/* Terminal header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/80 border-b border-slate-700">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
              <span className="ml-2 text-xs font-mono text-slate-300">gigitekai-orchestrator — client-provisioning</span>
            </div>
            {/* Steps */}
            <div className="p-4 space-y-2">
              {AGENT_STEPS.map((step, i) => (
                <div key={i} className="flex items-start gap-3 group">
                  <div className="flex-shrink-0 mt-0.5">
                    {i === AGENT_STEPS.length - 1 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-cyan-500/50 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-cyan-400">[{step.time}]</span>
                      <span className="text-xs font-semibold text-slate-300">{step.agent}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">{step.action}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Footer */}
            <div className="px-4 py-3 bg-slate-800/50 border-t border-slate-700 flex items-center justify-between">
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                COMPLETE — 3.4s total
              </span>
              <span className="text-xs text-slate-400">8 systems provisioned</span>
            </div>
          </div>
        </div>

        {/* AI Live Demo Video Section */}
        <div ref={videoRef} className="mt-16 pt-8 border-t border-slate-700/50">
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
              See AI Agents in Action
            </h3>
            <p className="text-slate-300 max-w-2xl mx-auto">
              Watch a live demonstration of our multi-system agentic AI orchestrator provisioning a complete client environment.
            </p>
          </div>
          {videoVisible && (
            <div className="relative max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/20 bg-slate-900/50 border border-slate-700/50">
              <video
                className="w-full h-auto"
                controls
                preload="metadata"
                poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1280 720'%3E%3Crect fill='%23060810' width='1280' height='720'/%3E%3C/svg%3E"
              >
                <source
                  src="https://gigitekai-mmtcdmc2.manus.space/assets/ai-demo-video.mp4"
                  type="video/mp4"
                />
                Your browser does not support the video tag.
              </video>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-slate-300 mb-5 text-sm">
            This is one of 6 live scenarios you can run interactively — no login required.
          </p>
          <Link href="/ai-demo">
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-3 text-base font-semibold shadow-lg shadow-cyan-500/25">
              <Play className="w-4 h-4 mr-2" />
              Try the Live Demo
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
