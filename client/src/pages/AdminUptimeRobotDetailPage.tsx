import AdminLayout from "@/components/AdminLayout";
/**
 * AdminUptimeRobotDetailPage.tsx
 * Detailed monitor view with response time graph and incident history
 * Enterprise-grade monitoring dashboard
 */

import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ArrowLeft, RefreshCw, AlertCircle, CheckCircle, TrendingUp, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface ResponseTime {
  datetime: number;
  response_time: number;
}

interface MonitorDetail {
  id: number;
  name: string;
  url: string;
  status: string;
  statusCode: number;
  uptime24h: string;
  uptime7d: string;
  uptime30d: string;
  uptime365d: string;
  totalUptime: string;
  averageResponseTime: number;
  responseTimes: ResponseTime[];
  createdAt: Date;
}

export default function AdminUptimeRobotDetailPage() {
  const { user } = useAuth();
  const [, params] = useRoute("/admin/uptime/:monitorId");
  const monitorId = params?.monitorId ? parseInt(params.monitorId) : null;

  const [monitor, setMonitor] = useState<MonitorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const getMonitorDetailsQuery = trpc.uptime.getMonitorDetails.useQuery(
    { monitorId: monitorId! },
    {
      enabled: !!user && !!monitorId,
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  useEffect(() => {
    if (getMonitorDetailsQuery.data) {
      setMonitor(getMonitorDetailsQuery.data.monitor);
      setLoading(false);
      setLastRefresh(new Date());
    }
    if (getMonitorDetailsQuery.error) {
      setError(getMonitorDetailsQuery.error.message);
      setLoading(false);
    }
  }, [getMonitorDetailsQuery.data, getMonitorDetailsQuery.error]);

  const handleRefresh = () => {
    setLoading(true);
    getMonitorDetailsQuery.refetch();
  };

  if (!monitorId) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-300">Invalid monitor ID</p>
      </div>
    );
  }

  if (loading && !monitor) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-slate-300">Loading monitor details...</p>
        </div>
      </div>
    );
  }

  if (error || !monitor) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-300 mb-1">Error Loading Monitor</h3>
            <p className="text-red-200 text-sm">{error || "Monitor not found"}</p>
            <Button
              onClick={handleRefresh}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (statusCode: number): string => {
    switch (statusCode) {
      case 2:
        return "text-green-300";
      case 8:
        return "text-orange-300";
      case 9:
        return "text-red-300";
      default:
        return "text-slate-300";
    }
  };

  const getStatusBgColor = (statusCode: number): string => {
    switch (statusCode) {
      case 2:
        return "bg-green-900/20 border-green-500/30";
      case 8:
        return "bg-orange-900/20 border-orange-500/30";
      case 9:
        return "bg-red-900/20 border-red-500/30";
      default:
        return "bg-slate-900/20 border-slate-500/30";
    }
  };

  const getResponseTimeColor = (time: number, avg: number): string => {
    if (time < avg * 0.8) return "#10B981"; // green
    if (time < avg * 1.2) return "#00D4FF"; // cyan
    if (time < avg * 1.5) return "#F59E0B"; // amber
    return "#EF4444"; // red
  };

  // Calculate response time stats
  const responseTimes = monitor.responseTimes || [];
  const minResponseTime = responseTimes.length > 0 ? Math.min(...responseTimes.map((r) => r.response_time)) : 0;
  const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes.map((r) => r.response_time)) : 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/uptime">
            <a className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </a>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Last Updated</p>
            <p className="text-sm text-slate-300">{lastRefresh.toLocaleTimeString()}</p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={loading}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Header */}
      <div className={`rounded-lg border p-8 ${getStatusBgColor(monitor.statusCode)}`}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{monitor.name}</h1>
            <p className="text-slate-400 break-all">{monitor.url}</p>
          </div>
          <div className={`px-4 py-2 rounded-lg font-semibold ${getStatusColor(monitor.statusCode)}`}>
            {monitor.status === "Up" && <CheckCircle className="w-6 h-6 inline mr-2" />}
            {monitor.status !== "Up" && <AlertCircle className="w-6 h-6 inline mr-2" />}
            {monitor.status}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">24h Uptime</p>
            <p className="text-2xl font-bold text-white">{monitor.uptime24h}%</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">7d Uptime</p>
            <p className="text-2xl font-bold text-white">{monitor.uptime7d}%</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">30d Uptime</p>
            <p className="text-2xl font-bold text-white">{monitor.uptime30d}%</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">365d Uptime</p>
            <p className="text-2xl font-bold text-white">{monitor.totalUptime}%</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Avg Response</p>
            <p className="text-2xl font-bold text-white">{monitor.averageResponseTime}ms</p>
          </div>
        </div>
      </div>

      {/* Response Time Graph */}
      <div className="bg-slate-900/40 border border-cyan-500/20 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          Response Time (Last 24 Hours)
        </h2>

        {responseTimes.length > 0 ? (
          <div className="space-y-4">
            {/* Mini Chart */}
            <div className="h-32 flex items-end justify-between gap-1 bg-slate-900/50 rounded p-4">
              {responseTimes.map((rt, idx) => (
                <div
                  key={idx}
                  className="flex-1 rounded-t transition-[opacity,transform] hover:opacity-80"
                  style={{
                    height: `${(rt.response_time / maxResponseTime) * 100}%`,
                    backgroundColor: getResponseTimeColor(rt.response_time, monitor.averageResponseTime),
                    minHeight: "2px",
                  }}
                  title={`${rt.response_time}ms at ${new Date(rt.datetime * 1000).toLocaleTimeString()}`}
                />
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Average</p>
                <p className="text-2xl font-bold text-cyan-300">{monitor.averageResponseTime}ms</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Minimum</p>
                <p className="text-2xl font-bold text-green-300">{minResponseTime}ms</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Maximum</p>
                <p className="text-2xl font-bold text-red-300">{maxResponseTime}ms</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-slate-400 text-center py-8">No response time data available</p>
        )}
      </div>

      {/* Monitor Info */}
      <div className="bg-slate-900/40 border border-cyan-500/20 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-cyan-400" />
          Monitor Information
        </h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Monitor ID</p>
            <p className="text-white font-mono">{monitor.id}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Created</p>
            <p className="text-white">{new Date(monitor.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
