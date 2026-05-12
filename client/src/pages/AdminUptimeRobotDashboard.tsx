/**
 * AdminUptimeRobotDashboard.tsx
 * Real-time uptime monitoring dashboard for client sites
 * Admin-only access (harry@gigitekai.com, nas@gigitekai.com)
 */

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { AlertCircle, CheckCircle, Clock, TrendingUp, RefreshCw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

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

  const getMonitorsQuery = trpc.uptime.getMonitors.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 60000, // Refresh every 60 seconds
  });

  useEffect(() => {
    if (getMonitorsQuery.data) {
      setMonitors(getMonitorsQuery.data.monitors);
      setLoading(false);
      setLastRefresh(new Date());
    }
    if (getMonitorsQuery.error) {
      setError(getMonitorsQuery.error.message);
      setLoading(false);
    }
  }, [getMonitorsQuery.data, getMonitorsQuery.error]);

  const handleRefresh = () => {
    setLoading(true);
    getMonitorsQuery.refetch();
  };

  const getStatusIcon = (statusCode: number) => {
    switch (statusCode) {
      case 2: // Up
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 8: // Seems Down
        return <AlertCircle className="w-5 h-5 text-orange-400" />;
      case 9: // Down
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = (statusCode: number): string => {
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

  const getStatusBadgeColor = (statusCode: number): string => {
    switch (statusCode) {
      case 2:
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case 8:
        return "bg-orange-500/20 text-orange-300 border-orange-500/30";
      case 9:
        return "bg-red-500/20 text-red-300 border-red-500/30";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/30";
    }
  };

  if (loading && monitors.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-slate-300">Loading uptime data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
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
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Uptime Monitoring</h1>
          <p className="text-slate-400">Real-time status of monitored client sites</p>
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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Total Monitors</p>
          <p className="text-3xl font-bold text-cyan-300">{monitors.length}</p>
        </div>
        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Up</p>
          <p className="text-3xl font-bold text-green-300">
            {monitors.filter((m) => m.statusCode === 2).length}
          </p>
        </div>
        <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Seems Down</p>
          <p className="text-3xl font-bold text-orange-300">
            {monitors.filter((m) => m.statusCode === 8).length}
          </p>
        </div>
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Down</p>
          <p className="text-3xl font-bold text-red-300">
            {monitors.filter((m) => m.statusCode === 9).length}
          </p>
        </div>
      </div>

      {/* Monitors List */}
      <div className="space-y-4">
        {monitors.map((monitor) => (
          <Link key={monitor.id} href={`/admin/uptime/${monitor.id}`}>
            <a className={`block rounded-lg border p-6 transition-all hover:scale-[1.01] cursor-pointer ${getStatusColor(monitor.statusCode)}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="mt-1">{getStatusIcon(monitor.statusCode)}</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                      {monitor.name}
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-sm text-slate-400 break-all">{monitor.url}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeColor(monitor.statusCode)}`}>
                  {monitor.status}
                </div>
              </div>

            {/* Uptime Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t border-white/10">
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
            </a>
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
  );
}
