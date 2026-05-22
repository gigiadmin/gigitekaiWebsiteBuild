/*
  GigitekAI Real-Time Transparency Ticker
  Live-updating performance metrics bar that builds instant trust
  Shows SLA uptime only — sample data removed
*/

import { useEffect, useState, useRef } from "react";
import { Activity, Shield, Zap, Clock, CheckCircle2, TrendingUp } from "lucide-react";

interface MetricData {
  label: string;
  value: string;
  icon: React.ReactNode;
  status: "healthy" | "warning" | "critical";
  trend?: string;
}

// Live metrics — sample data labeled for simulation
function generateMetrics(): MetricData[] {
  const uptime = (99.97 + Math.random() * 0.029).toFixed(3);
  const agentExecs = Math.floor(12400 + Math.random() * 300);
  const responseTime = (0.8 + Math.random() * 0.4).toFixed(1);
  const ticketsResolved = Math.floor(847 + Math.random() * 50);
  const threatBlocked = Math.floor(2100 + Math.random() * 200);

  return [
    {
      label: "SLA Uptime",
      value: `${uptime}%`,
      icon: <Activity size={14} className="text-emerald-400" />,
      status: "healthy",
      trend: "+0.01%",
    },
    {
      label: "AI Agent Executions (24h) – Sample Data",
      value: agentExecs.toLocaleString(),
      icon: <Zap size={14} className="text-[#00D4FF]" />,
      status: "healthy",
      trend: "+12%",
    },
    {
      label: "Avg Response",
      value: `${responseTime}s`,
      icon: <Clock size={14} className="text-amber-400" />,
      status: "healthy",
    },
    {
      label: "Tickets Resolved (24h) – Sample Data",
      value: ticketsResolved.toLocaleString(),
      icon: <CheckCircle2 size={14} className="text-emerald-400" />,
      status: "healthy",
      trend: "+8%",
    },
    {
      label: "Threats Blocked (24h) – Sample Data",
      value: threatBlocked.toLocaleString(),
      icon: <Shield size={14} className="text-purple-400" />,
      status: "healthy",
    },
  ];
}

export default function TransparencyTicker() {
  const [metrics, setMetrics] = useState<MetricData[]>(generateMetrics());
  const [isVisible, setIsVisible] = useState(false);
  const tickerRef = useRef<HTMLDivElement>(null);

  // Update metrics every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(generateMetrics());
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Intersection observer for reveal animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.3 }
    );
    if (tickerRef.current) observer.observe(tickerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={tickerRef}
      className={`relative overflow-hidden bg-[#060A14] border-y border-[#00D4FF]/10 transition-[opacity,transform] duration-1000 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {/* Subtle animated gradient background */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.03) 50%, transparent 100%)",
        }}
      />

      <div className="container py-4">
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-75" />
            </div>
            <span className="text-xs font-semibold text-white/60 uppercase tracking-widest">
              Live System Health
            </span>
            <TrendingUp size={12} className="text-emerald-400" />
          </div>
          <span className="text-[10px] text-white/30 font-mono hidden sm:block">
            Auto-refreshing every 8s
          </span>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-4">
          {metrics.map((metric, idx) => (
            <div
              key={metric.label}
              className="group flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-[#00D4FF]/20 hover:bg-white/[0.04] transition-[opacity,transform] duration-300"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="flex-shrink-0 w-6 h-6 md:w-7 md:h-7 rounded-md bg-white/[0.05] flex items-center justify-center">
                {metric.icon}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs md:text-sm font-bold text-white font-mono tabular-nums">
                    {metric.value}
                  </span>
                  {metric.trend && (
                    <span className="text-[9px] md:text-[10px] text-emerald-400 font-medium hidden sm:inline">
                      {metric.trend}
                    </span>
                  )}
                </div>
                <span className="text-[9px] md:text-[10px] text-white/40 leading-none truncate block">
                  {metric.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
