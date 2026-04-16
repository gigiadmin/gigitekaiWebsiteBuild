/**
 * SlaTimer — Live countdown to SLA breach for a ticket.
 * Thresholds: critical=1h, high=2h, medium=4h, low=8h since last update.
 */
import { useEffect, useState } from "react";
import { Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

const SLA_THRESHOLDS_MS: Record<string, number> = {
  critical: 1 * 60 * 60 * 1000,
  high: 2 * 60 * 60 * 1000,
  medium: 4 * 60 * 60 * 1000,
  low: 8 * 60 * 60 * 1000,
};

interface SlaTimerProps {
  priority: string;
  updatedAt: Date | string;
  status: string;
}

function formatDuration(ms: number): string {
  if (ms <= 0) return "0m";
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function SlaTimer({ priority, updatedAt, status }: SlaTimerProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30_000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  // Only show for open/in_progress tickets
  if (status === "resolved" || status === "closed" || status === "on_hold") {
    return null;
  }

  const threshold = SLA_THRESHOLDS_MS[priority] ?? SLA_THRESHOLDS_MS.medium;
  const lastUpdate = new Date(updatedAt).getTime();
  const elapsed = now - lastUpdate;
  const remaining = threshold - elapsed;
  const isBreached = remaining <= 0;
  const isWarning = !isBreached && remaining < threshold * 0.25; // last 25% = warning

  const pct = Math.min(100, (elapsed / threshold) * 100);

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium ${
        isBreached
          ? "bg-red-500/10 border-red-500/30 text-red-400"
          : isWarning
          ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
          : "bg-[#00D4FF]/5 border-[#00D4FF]/20 text-[#00D4FF]"
      }`}
      title={`SLA threshold for ${priority} priority: ${formatDuration(threshold)}`}
    >
      {isBreached ? (
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
      ) : isWarning ? (
        <Clock className="w-3.5 h-3.5 shrink-0 animate-pulse" />
      ) : (
        <Clock className="w-3.5 h-3.5 shrink-0" />
      )}
      <span>
        {isBreached
          ? `SLA breached ${formatDuration(Math.abs(remaining))} ago`
          : `SLA: ${formatDuration(remaining)} left`}
      </span>
      {/* Progress bar */}
      <div className="flex-1 h-1.5 rounded-full bg-gray-800 overflow-hidden min-w-[40px]">
        <div
          className={`h-full rounded-full transition-all ${
            isBreached ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-[#00D4FF]"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
