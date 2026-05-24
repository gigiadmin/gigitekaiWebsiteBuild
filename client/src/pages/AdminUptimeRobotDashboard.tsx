/**
 * AdminUptimeRobotDashboard.tsx
 * Real-time uptime monitoring dashboard for client sites
 * Admin-only access (harry@gigitekai.com, nas@gigitekai.com)
 */

import { useEffect, useState } from "react";
import { Link } from "wouter";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { AlertCircle, CheckCircle, Clock, TrendingUp, RefreshCw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Monitor {
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
  lastCheck: number | null;
  lastResponseTime: number | null;
}

export default function AdminUptimeRobotDashboard() {
  const { user } = useAuth();
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // getMonitors uses publicProcedure — no auth required.
  // Previously `enabled: !!user` caused infinite loading for unauthenticated visitors.
  const getMonitorsQuery = trpc.uptime.getMonitors.useQuery(undefined, {
    refetchInterval: 60000, // Refresh every 60 seconds
  });

  useEffect(() => {
    if (getMonitorsQuery.data) {
      // Always set monitors from data - even if empty array
      setMonitors(getMonitorsQuery.data.monitors || []);
      setLoading(false);
      setError(null);
    }
  }, [getMonitorsQuery.data]);

  useEffect(() => {
    if (getMonitorsQuery.error) {
      const errorMsg = getMonitorsQuery.error instanceof Error ? getMonitorsQuery.error.message : "Failed to load uptime data";
      setError(errorMsg);
      setLoading(false);
    }
  }, [getMonitorsQuery.error]);

  const handleRefresh = () => {
    getMonitorsQuery.refetch();
    setLastRefresh(new Date());
  };

  // Show loading only while the query is actually fetching (not stuck due to auth guard)
  if (getMonitorsQuery.isLoading && monitors.length === 0) {
    return (
      <AdminLayout title="Uptime Monitoring">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-4" />
            <p className="text-slate-300">Loading uptime data...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Uptime Monitoring">
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-300 mb-1">Error Loading Data</h3>
              <p className="text-red-200 text-sm">{error}</p>
              <Button
                onClick={handleRefresh}
                className="mt-4 bg-red-600 hover:bg-red-700 text-white"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Uptime Monitoring">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Uptime Monitoring</h1>
            <p className="text-slate-400">Real-time status of monitored client sites</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Last Updated</p>
              <p className="text-sm text-slate-300">{lastRefresh.toLocaleTimeString()}</p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={getMonitorsQuery.isFetching}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${getMonitorsQuery.isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Total Monitors</p>
            <p className="text-3xl font-bold text-cyan-300">{monitors.length}</p>
          </div>
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Up</p>
            <p className="text-3xl font-bold text-green-300">{monitors.filter((m) => m.status === "up").length}</p>
          </div>
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Paused</p>
            <p className="text-3xl font-bold text-yellow-300">{monitors.filter((m) => m.status === "paused").length}</p>
          </div>
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Down</p>
            <p className="text-3xl font-bold text-red-300">{monitors.filter((m) => m.status === "down" || m.status === "seems_down").length}</p>
          </div>
        </div>

        {/* Monitors Grid */}
        <div className="grid gap-4">
          {monitors.map((monitor) => (
            <Link
              key={monitor.id}
              href={`/admin/uptime/${monitor.id}`}
              className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-6 hover:border-cyan-500/50 transition-colors cursor-pointer group block"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${
                    monitor.status === "up" ? "bg-green-500" :
                    monitor.status === "down" || monitor.status === "seems_down" ? "bg-red-500" :
                    monitor.status === "paused" ? "bg-yellow-500" :
                    "bg-gray-500"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white group-hover:text-cyan-300 transition-colors">{monitor.name}</h3>
                    <p className="text-sm text-slate-400 truncate">{monitor.url}</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">24h Uptime</p>
                  <p className="text-lg font-semibold text-white">{monitor.uptime24h}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">7d Uptime</p>
                  <p className="text-lg font-semibold text-white">{monitor.uptime7d}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">30d Uptime</p>
                  <p className="text-lg font-semibold text-white">{monitor.uptime30d}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total Uptime</p>
                  <p className="text-lg font-semibold text-white">{monitor.totalUptime}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Avg Response</p>
                  <p className="text-lg font-semibold text-white">{monitor.averageResponseTime}ms</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
        {monitors.length === 0 && (
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
            <p className="text-slate-400">No monitors configured</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
