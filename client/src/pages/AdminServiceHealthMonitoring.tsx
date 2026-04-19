/**
 * Admin Service Health Monitoring Dashboard
 * 
 * Real-time monitoring for:
 * - Email API (MS Graph + SendGrid)
 * - Helpdesk System
 * - M365 Service Health
 */

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle, AlertTriangle, RefreshCw, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { M365ServiceDegradations } from "@/components/M365ServiceDegradations";
import { UptimeDashboard } from "@/components/UptimeDashboard";
import { AlertThresholdConfig } from "@/components/AlertThresholdConfig";

enum ServiceHealthStatus {
  HEALTHY = "healthy",
  DEGRADED = "degraded",
  CRITICAL = "critical",
  OFFLINE = "offline",
}

interface ServiceHealthCheck {
  service: string;
  status: ServiceHealthStatus;
  lastChecked: Date;
  responseTime: number;
  message: string;
  metrics?: Record<string, unknown>;
}

type DashboardTab = "health" | "uptime" | "thresholds";

export default function AdminServiceHealthMonitoring() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [expandedM365, setExpandedM365] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>("health");

  // Query health dashboard
  const { data: dashboard, isLoading, refetch } = trpc.serviceHealthMonitoring.getSystemHealthDashboard.useQuery(
    undefined,
    {
      refetchInterval: autoRefresh ? refreshInterval : false,
      staleTime: 5000,
    }
  );

  // Query M365 degradations
  const { data: m365Degradations, isLoading: m365Loading, error: m365Error } = trpc.serviceHealthMonitoring.getM365ServiceDegradations.useQuery(
    undefined,
    {
      refetchInterval: autoRefresh ? refreshInterval : false,
      staleTime: 5000,
    }
  );

  // Debug logging
  useEffect(() => {
    console.log("[AdminServiceHealthMonitoring] M365 Degradations:", m365Degradations);
    if (m365Error) console.error("[AdminServiceHealthMonitoring] M365 Error:", m365Error);
  }, [m365Degradations, m365Error]);

  // Get status color
  // Debug logging for dashboard
  useEffect(() => {
    console.log("[AdminServiceHealthMonitoring] Dashboard:", dashboard);
  }, [dashboard]);

  const getStatusColor = (status: ServiceHealthStatus) => {
    switch (status) {
      case ServiceHealthStatus.HEALTHY:
        return "text-green-500";
      case ServiceHealthStatus.DEGRADED:
        return "text-yellow-500";
      case ServiceHealthStatus.CRITICAL:
        return "text-red-500";
      case ServiceHealthStatus.OFFLINE:
        return "text-red-700";
      default:
        return "text-gray-500";
    }
  };

  const getStatusBgColor = (status: ServiceHealthStatus) => {
    switch (status) {
      case ServiceHealthStatus.HEALTHY:
        return "bg-green-500/10 border-green-500/30";
      case ServiceHealthStatus.DEGRADED:
        return "bg-yellow-500/10 border-yellow-500/30";
      case ServiceHealthStatus.CRITICAL:
        return "bg-red-500/10 border-red-500/30";
      case ServiceHealthStatus.OFFLINE:
        return "bg-red-700/10 border-red-700/30";
      default:
        return "bg-gray-500/10 border-gray-500/30";
    }
  };

  const getStatusIcon = (status: ServiceHealthStatus) => {
    switch (status) {
      case ServiceHealthStatus.HEALTHY:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case ServiceHealthStatus.DEGRADED:
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case ServiceHealthStatus.CRITICAL:
      case ServiceHealthStatus.OFFLINE:
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getOverallStatusColor = (status: ServiceHealthStatus) => {
    switch (status) {
      case ServiceHealthStatus.HEALTHY:
        return "text-green-500 bg-green-500/10";
      case ServiceHealthStatus.DEGRADED:
        return "text-yellow-500 bg-yellow-500/10";
      case ServiceHealthStatus.CRITICAL:
      case ServiceHealthStatus.OFFLINE:
        return "text-red-500 bg-red-500/10";
      default:
        return "text-gray-500 bg-gray-500/10";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-cyan-500" />
          <p className="text-gray-400">Loading service health...</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
          <p className="text-gray-400">Failed to load service health data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Service Health Monitoring</h1>
          <p className="text-gray-400 mt-1">Real-time system status and performance metrics</p>
          {/* Tab Navigation */}
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => setActiveTab("health")}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === "health"
                  ? "bg-cyan-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              Real-Time Health
            </button>
            <button
              onClick={() => setActiveTab("uptime")}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === "uptime"
                  ? "bg-cyan-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              Uptime & Trends
            </button>
            <button
              onClick={() => setActiveTab("thresholds")}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === "thresholds"
                  ? "bg-cyan-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              Alert Thresholds
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoRefresh"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-900 cursor-pointer"
            />
            <label htmlFor="autoRefresh" className="text-sm text-gray-400 cursor-pointer">
              Auto-refresh
            </label>
          </div>
          {autoRefresh && (
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="px-3 py-1 bg-gray-900 border border-gray-700 rounded text-sm text-gray-300 cursor-pointer"
            >
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
              <option value={60000}>1m</option>
            </select>
          )}
          <Button
            onClick={() => refetch()}
            disabled={isLoading}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "health" && (
        <>
          {/* Overall Status */}
          <Card className={`border ${getStatusBgColor(dashboard.overallStatus)} p-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon(dashboard.overallStatus)}
            <div>
              <p className="text-gray-400 text-sm">Overall System Status</p>
              <p className={`text-2xl font-bold capitalize ${getStatusColor(dashboard.overallStatus)}`}>
                {dashboard.overallStatus}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-sm flex items-center gap-1 justify-end">
              <Clock className="w-4 h-4" />
              Last updated: {new Date(dashboard.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </Card>

      {/* Critical Alerts */}
      {dashboard.alerts.length > 0 && (
        <Card className="border border-red-500/30 bg-red-500/10 p-6">
          <h2 className="text-lg font-semibold text-red-500 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Active Alerts ({dashboard.alerts.length})
          </h2>
          <div className="space-y-2">
            {dashboard.alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`p-3 rounded border ${
                  alert.severity === "critical"
                    ? "border-red-500/50 bg-red-500/5"
                    : "border-yellow-500/50 bg-yellow-500/5"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`font-semibold ${alert.severity === "critical" ? "text-red-500" : "text-yellow-500"}`}>
                      {alert.service}
                    </p>
                    <p className="text-gray-300 text-sm mt-1">{alert.message}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Service Health Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {dashboard.services.map((service) => (
          <Card key={service.service} className={`border ${getStatusBgColor(service.status)} p-6`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                {getStatusIcon(service.status)}
                <h3 className="font-semibold text-white">{service.service}</h3>
              </div>
              <span className={`text-xs px-2 py-1 rounded capitalize font-semibold ${getStatusColor(service.status)}`}>
                {service.status}
              </span>
            </div>

            <p className="text-gray-300 text-sm mb-4">{service.message}</p>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Response Time:</span>
                <span className="text-white">{service.responseTime}ms</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Last Checked:</span>
                <span className="text-white">{new Date(service.lastChecked).toLocaleTimeString()}</span>
              </div>

              {/* Service-specific metrics */}
              {service.service === "Email API" && service.metrics && (
                <>
                  <div className="border-t border-gray-600/50 pt-2 mt-2">
                    <p className="text-gray-400 font-semibold mb-2">Email Metrics</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>MS Graph:</span>
                        <span className={(service.metrics as any)?.msGraphCredentialsValid ? "text-green-500" : "text-red-500"}>
                          {(service.metrics as any)?.msGraphCredentialsValid ? "✓ Valid" : "✗ Invalid"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>SendGrid:</span>
                        <span className={(service.metrics as any)?.sendgridConfigured ? "text-green-500" : "text-yellow-500"}>
                          {(service.metrics as any)?.sendgridConfigured ? "✓ Configured" : "⚠ Not configured"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Success Rate:</span>
                        <span className="text-white">{(service.metrics as any)?.successRate}%</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {service.service === "Helpdesk System" && service.metrics && (
                <>
                  <div className="border-t border-gray-600/50 pt-2 mt-2">
                    <p className="text-gray-400 font-semibold mb-2">Helpdesk Metrics</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Database:</span>
                        <span className={(service.metrics as any)?.databaseConnected ? "text-green-500" : "text-red-500"}>
                          {(service.metrics as any)?.databaseConnected ? "✓ Connected" : "✗ Disconnected"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Processing Latency:</span>
                        <span className="text-white">{Math.round(((service.metrics as any)?.ticketProcessingLatency ?? 0) / 1000)}s</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Unprocessed Tickets:</span>
                        <span className="text-white">{(service.metrics as any)?.unprocessedTickets}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Agent Availability:</span>
                        <span className="text-white">{Math.round((service.metrics as any)?.agentAvailability ?? 0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Resolution Time:</span>
                        <span className="text-white">{Math.round((service.metrics as any)?.avgTicketResolutionTime ?? 0)}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SLA Compliance:</span>
                        <span className="text-white">{(service.metrics as any)?.slaComplianceRate}%</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {service.service === "M365 Service Health" && service.metrics && (
                <>
                  <div className="border-t border-gray-600/50 pt-2 mt-2">
                    <p className="text-gray-400 font-semibold mb-2">M365 Metrics</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Credentials:</span>
                        <span className={(service.metrics as any)?.credentialsValid ? "text-green-500" : "text-red-500"}>
                          {(service.metrics as any)?.credentialsValid ? "✓ Valid" : "✗ Invalid"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Critical Issues:</span>
                        <span className={((service.metrics as any)?.criticalIssuesCount ?? 0) > 0 ? "text-red-500" : "text-green-500"}>
                          {(service.metrics as any)?.criticalIssuesCount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Degraded Services:</span>
                        <span className={((service.metrics as any)?.degradedServicesCount ?? 0) > 0 ? "text-yellow-500" : "text-green-500"}>
                          {(service.metrics as any)?.degradedServicesCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* M365 Service Degradations Details */}
      {m365Degradations && m365Degradations.length > 0 && (
        <Card className="border border-yellow-500/30 bg-yellow-500/5 p-6">
          <button
            onClick={() => setExpandedM365(!expandedM365)}
            className="w-full flex items-center justify-between hover:bg-yellow-500/10 p-2 rounded transition-colors"
          >
            <h2 className="text-lg font-semibold text-yellow-500 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              M365 Service Degradations ({m365Degradations.length})
            </h2>
            {expandedM365 ? (
              <ChevronUp className="w-5 h-5 text-yellow-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-yellow-500" />
            )}
          </button>

          {expandedM365 && (
            <div className="mt-4 pt-4 border-t border-yellow-500/30">
              <M365ServiceDegradations
                degradations={m365Degradations}
                isLoading={m365Loading}
              />
            </div>
          )}
        </Card>
      )}

          {/* Last Updated */}
          <div className="text-center text-sm text-gray-500">
            Dashboard last updated: {new Date(dashboard.timestamp).toLocaleString()}
          </div>
        </>
      )}

      {/* Uptime Tab */}
      {activeTab === "uptime" && (
        <UptimeDashboard />
      )}

      {/* Thresholds Tab */}
      {activeTab === "thresholds" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Alert Thresholds Configuration</h2>
            <p className="text-gray-400 text-sm">Configure alert thresholds and notification preferences for each service</p>
          </div>
          <AlertThresholdConfig />
        </div>
      )}
    </div>
  );
}
