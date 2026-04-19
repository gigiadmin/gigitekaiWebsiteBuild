/**
 * Uptime Dashboard Component
 * 
 * Displays uptime statistics and trends for all services
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UptimeChart } from "@/components/UptimeChart";
import { TrendingUp, Clock, AlertCircle } from "lucide-react";

type UptimePeriod = "1h" | "24h" | "7d" | "30d";

interface UptimeStats {
  uptimePercentage: number;
  totalChecks: number;
  healthyChecks: number;
  degradedChecks: number;
  criticalChecks: number;
  offlineChecks: number;
  avgResponseTime: number;
}

export function UptimeDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<UptimePeriod>("24h");

  // Query all uptime statistics
  const { data: allStats, isLoading: statsLoading } = trpc.serviceHealthThresholds.getAllUptimeStats.useQuery(undefined, {
    refetchInterval: 60000, // Refresh every minute
  });

  // Query all trend data
  const { data: allTrends, isLoading: trendsLoading } = trpc.serviceHealthThresholds.getAllUptimeTrendData.useQuery(undefined, {
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const getUptimeColor = (percentage: number) => {
    if (percentage >= 99) return "text-green-500";
    if (percentage >= 95) return "text-yellow-500";
    if (percentage >= 90) return "text-orange-500";
    return "text-red-500";
  };

  const getUptimeBgColor = (percentage: number) => {
    if (percentage >= 99) return "bg-green-500/10 border-green-500/30";
    if (percentage >= 95) return "bg-yellow-500/10 border-yellow-500/30";
    if (percentage >= 90) return "bg-orange-500/10 border-orange-500/30";
    return "bg-red-500/10 border-red-500/30";
  };

  if (statsLoading || trendsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-2"></div>
          <p className="text-gray-400 text-sm">Loading uptime dashboard...</p>
        </div>
      </div>
    );
  }

  const services = ["Email API", "Helpdesk System", "M365 Service Health"];
  const periods: UptimePeriod[] = ["1h", "24h", "7d", "30d"];

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex gap-2 flex-wrap">
        {periods.map((period) => (
          <Button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            variant={selectedPeriod === period ? "default" : "outline"}
            size="sm"
          >
            {period === "1h" && "1 Hour"}
            {period === "24h" && "24 Hours"}
            {period === "7d" && "7 Days"}
            {period === "30d" && "30 Days"}
          </Button>
        ))}
      </div>

      {/* Uptime Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {services.map((service) => {
          const stats = allStats?.[service]?.[selectedPeriod] as UptimeStats | undefined;

          if (!stats) {
            return (
              <Card key={service} className="border border-gray-700/50 bg-gray-900/30 p-4">
                <div className="text-center py-4">
                  <p className="text-gray-400 text-sm">No data available</p>
                </div>
              </Card>
            );
          }

          return (
            <Card
              key={service}
              className={`border p-4 ${getUptimeBgColor(stats.uptimePercentage)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-white text-sm">{service}</h3>
                <TrendingUp className="w-4 h-4 text-cyan-500" />
              </div>

              {/* Uptime Percentage */}
              <div className="mb-4">
                <div className={`text-3xl font-bold ${getUptimeColor(stats.uptimePercentage)}`}>
                  {stats.uptimePercentage.toFixed(2)}%
                </div>
                <p className="text-xs text-gray-400 mt-1">Uptime</p>
              </div>

              {/* Statistics */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Checks:</span>
                  <span className="text-gray-200">{stats.totalChecks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Healthy:</span>
                  <span className="text-green-400">{stats.healthyChecks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Degraded:</span>
                  <span className="text-yellow-400">{stats.degradedChecks}</span>
                </div>
                {(stats.criticalChecks > 0 || stats.offlineChecks > 0) && (
                  <>
                    {stats.criticalChecks > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Critical:</span>
                        <span className="text-red-400">{stats.criticalChecks}</span>
                      </div>
                    )}
                    {stats.offlineChecks > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Offline:</span>
                        <span className="text-red-500">{stats.offlineChecks}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-600/50">
                  <span className="text-gray-400">Avg Response:</span>
                  <span className="text-cyan-400">{stats.avgResponseTime}ms</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Uptime Trend Charts */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-cyan-500" />
          7-Day Uptime Trends
        </h2>

        {services.map((service) => {
          const trendData = allTrends?.[service];

          return (
            <div key={service}>
              <h3 className="text-sm font-semibold text-gray-300 mb-3">{service}</h3>
              <UptimeChart
                service={service}
                trendData={trendData || []}
                isLoading={trendsLoading}
              />
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <Card className="border border-gray-700/50 bg-gray-900/30 p-4">
        <div className="flex items-start gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-400">Excellent (99%+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-gray-400">Good (95-99%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-gray-400">Fair (90-95%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-400">Poor (&lt;90%)</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
