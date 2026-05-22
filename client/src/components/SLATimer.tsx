import { useEffect, useState } from "react";
import { AlertCircle, Clock, CheckCircle2 } from "lucide-react";

interface SLATimerProps {
  createdAt: Date;
  priority: "low" | "medium" | "high" | "critical";
  status?: "open" | "in_progress" | "on_hold" | "resolved" | "closed";
}

const SLA_CONFIG = {
  critical: { response: 30, resolution: 120 },
  high: { response: 60, resolution: 480 },
  medium: { response: 240, resolution: 1440 },
  low: { response: 480, resolution: 2880 },
};

export function SLATimer({ createdAt, priority, status = "open" }: SLATimerProps) {
  const [slaStatus, setSlaStatus] = useState<{
    responseBreached: boolean;
    resolutionBreached: boolean;
    timeToResponseDeadline: number;
    timeToResolutionDeadline: number;
    responsePercentage: number;
    resolutionPercentage: number;
  } | null>(null);

  useEffect(() => {
    const updateSLA = () => {
      const config = SLA_CONFIG[priority];
      const now = new Date();
      const responseDeadline = new Date(createdAt.getTime() + config.response * 60000);
      const resolutionDeadline = new Date(createdAt.getTime() + config.resolution * 60000);

      const responseBreached = now > responseDeadline;
      const resolutionBreached = now > resolutionDeadline;

      setSlaStatus({
        responseBreached,
        resolutionBreached,
        timeToResponseDeadline: Math.max(0, responseDeadline.getTime() - now.getTime()),
        timeToResolutionDeadline: Math.max(0, resolutionDeadline.getTime() - now.getTime()),
        responsePercentage: Math.min(100, Math.max(0,
          ((now.getTime() - createdAt.getTime()) / (config.response * 60000)) * 100
        )),
        resolutionPercentage: Math.min(100, Math.max(0,
          ((now.getTime() - createdAt.getTime()) / (config.resolution * 60000)) * 100
        )),
      });
    };

    updateSLA();
    const interval = setInterval(updateSLA, 1000);
    return () => clearInterval(interval);
  }, [createdAt, priority]);

  if (!slaStatus || status === "closed" || status === "resolved") {
    return (
      <div className="flex items-center gap-2 text-green-400">
        <CheckCircle2 className="w-4 h-4" />
        <span className="text-sm">Resolved</span>
      </div>
    );
  }

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const getStatusColor = (breached: boolean, percentage: number) => {
    if (breached) return "text-red-400 bg-red-500/20 px-2 py-1 rounded";
    if (percentage > 80) return "text-orange-400 bg-orange-500/20 px-2 py-1 rounded";
    if (percentage > 50) return "text-yellow-400 bg-yellow-500/20 px-2 py-1 rounded";
    return "text-green-400 bg-green-500/20 px-2 py-1 rounded";
  };

  const getProgressColor = (breached: boolean, percentage: number) => {
    if (breached) return "bg-red-500";
    if (percentage > 80) return "bg-orange-500";
    if (percentage > 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="space-y-3 p-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5">
      {/* Response SLA */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-medium text-gray-300">Response SLA</span>
            {slaStatus.responseBreached && (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}
          </div>
          <span className={`text-xs font-mono whitespace-nowrap ${getStatusColor(slaStatus.responseBreached, slaStatus.responsePercentage)}`}>
            {slaStatus.responseBreached ? "BREACHED" : formatTime(slaStatus.timeToResponseDeadline)}
          </span>
        </div>
        <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-[opacity,transform] duration-1000 ${getProgressColor(slaStatus.responseBreached, slaStatus.responsePercentage)}`}
            style={{ width: `${Math.min(100, slaStatus.responsePercentage)}%` }}
          />
        </div>
      </div>

      {/* Resolution SLA */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-medium text-gray-300">Resolution SLA</span>
            {slaStatus.resolutionBreached && (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}
          </div>
          <span className={`text-xs font-mono whitespace-nowrap ${getStatusColor(slaStatus.resolutionBreached, slaStatus.resolutionPercentage)}`}>
            {slaStatus.resolutionBreached ? "BREACHED" : formatTime(slaStatus.timeToResolutionDeadline)}
          </span>
        </div>
        <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-[opacity,transform] duration-1000 ${getProgressColor(slaStatus.resolutionBreached, slaStatus.resolutionPercentage)}`}
            style={{ width: `${Math.min(100, slaStatus.resolutionPercentage)}%` }}
          />
        </div>
      </div>

      {/* Priority Badge */}
      <div className="flex items-center gap-2 pt-2 border-t border-cyan-500/10">
        <span className="text-xs text-gray-400">Priority:</span>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
          priority === "critical" ? "bg-red-500/20 text-red-400" :
          priority === "high" ? "bg-orange-500/20 text-orange-400" :
          priority === "medium" ? "bg-yellow-500/20 text-yellow-400" :
          "bg-blue-500/20 text-blue-400"
        }`}>
          {priority.toUpperCase()}
        </span>
      </div>
    </div>
  );
}
