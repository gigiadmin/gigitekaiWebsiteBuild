import { useState, useEffect } from "react";
import { Clock, CheckCircle, AlertCircle, Zap } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface WorkflowRun {
  id: string;
  name: string;
  status: "completed" | "running" | "failed";
  startedAt: Date;
  duration: number;
  systemsAffected: number;
}

export function WorkflowHistoryPanel() {
  const [runs, setRuns] = useState<WorkflowRun[]>([
    {
      id: "exec-1720776600000",
      name: "Multi-tenant provisioning",
      status: "completed",
      startedAt: new Date(Date.now() - 2 * 60 * 1000),
      duration: 120,
      systemsAffected: 5,
    },
    {
      id: "exec-1720776480000",
      name: "Client onboarding",
      status: "completed",
      startedAt: new Date(Date.now() - 15 * 60 * 1000),
      duration: 340,
      systemsAffected: 8,
    },
    {
      id: "exec-1720776300000",
      name: "Security hardening",
      status: "completed",
      startedAt: new Date(Date.now() - 45 * 60 * 1000),
      duration: 180,
      systemsAffected: 3,
    },
    {
      id: "exec-1720776000000",
      name: "Backup & recovery",
      status: "failed",
      startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      duration: 45,
      systemsAffected: 2,
    },
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "running":
        return <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 border-green-500/30";
      case "running":
        return "bg-cyan-500/10 border-cyan-500/30";
      case "failed":
        return "bg-red-500/10 border-red-500/30";
      default:
        return "bg-slate-700/30 border-slate-600/30";
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="mt-8 p-4 bg-slate-800 border border-slate-700 rounded-lg">
      <h3 className="text-sm font-semibold text-cyan-400 mb-4 flex items-center gap-2">
        <Clock size={14} />
        Recent Orchestration Runs
      </h3>
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {runs.map((run) => (
          <div
            key={run.id}
            className={`p-3 border rounded-lg transition-colors ${getStatusColor(run.status)}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                {getStatusIcon(run.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{run.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {run.startedAt.toLocaleTimeString()} • {formatDuration(run.duration)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-300 bg-slate-700/50 px-2 py-1 rounded">
                  {run.systemsAffected} systems
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
