/**
 * Admin M365 Health Dashboard
 * Real-time Microsoft 365 service status monitoring
 * Shows all services with status, search, filtering, and critical alerts
 * Click on degraded/down services to see detailed incident information
 */

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, CheckCircle2, AlertTriangle, Clock, Search, RefreshCw, Filter, AlertOctagon, Wrench, ExternalLink } from "lucide-react";
import { toast } from "sonner";

type ServiceHealthStatus = 
  | "serviceOperational"
  | "investigating"
  | "serviceDegradation"
  | "serviceInterruption"
  | "restoringService"
  | "verifyingService"
  | "serviceRestored"
  | "postIncidentReviewPublished"
  | "extendedRecovery"
  | "falsePositive"
  | "investigationSuspended"
  | "resolved"
  | "mitigatedExternal"
  | "mitigated"
  | "resolvedExternal"
  | "confirmed"
  | "reported"
  | "unknownFutureValue";

interface ServiceHealth {
  id: string;
  service: string;
  status: ServiceHealthStatus;
}

interface ServiceHealthIssue {
  id: string;
  title: string;
  description: string;
  startDateTime: string;
  endDateTime?: string;
  lastModifiedDateTime: string;
  severity: "critical" | "major" | "minor" | "informational";
  status: ServiceHealthStatus;
  affectedServices: string[];
}

// Status display configuration
const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  serviceOperational: {
    label: "Operational",
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    icon: <CheckCircle2 size={16} />,
  },
  investigating: {
    label: "Investigating",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    icon: <Clock size={16} />,
  },
  serviceDegradation: {
    label: "Degraded",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    icon: <AlertTriangle size={16} />,
  },
  serviceInterruption: {
    label: "Down",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    icon: <AlertCircle size={16} />,
  },
  restoringService: {
    label: "Restoring",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    icon: <Clock size={16} />,
  },
  verifyingService: {
    label: "Verifying",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    icon: <Clock size={16} />,
  },
  serviceRestored: {
    label: "Restored",
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    icon: <CheckCircle2 size={16} />,
  },
  postIncidentReviewPublished: {
    label: "Review Published",
    color: "text-gray-400",
    bgColor: "bg-gray-500/10",
    icon: <CheckCircle2 size={16} />,
  },
  extendedRecovery: {
    label: "Extended Recovery",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    icon: <AlertCircle size={16} />,
  },
  falsePositive: {
    label: "False Positive",
    color: "text-gray-400",
    bgColor: "bg-gray-500/10",
    icon: <CheckCircle2 size={16} />,
  },
  investigationSuspended: {
    label: "Investigation Suspended",
    color: "text-gray-400",
    bgColor: "bg-gray-500/10",
    icon: <Clock size={16} />,
  },
  resolved: {
    label: "Resolved",
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    icon: <CheckCircle2 size={16} />,
  },
  mitigatedExternal: {
    label: "Mitigated (External)",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    icon: <AlertTriangle size={16} />,
  },
  mitigated: {
    label: "Mitigated",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    icon: <AlertTriangle size={16} />,
  },
  resolvedExternal: {
    label: "Resolved (External)",
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    icon: <CheckCircle2 size={16} />,
  },
  confirmed: {
    label: "Confirmed",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    icon: <AlertTriangle size={16} />,
  },
  reported: {
    label: "Reported",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    icon: <AlertTriangle size={16} />,
  },
  unknownFutureValue: {
    label: "Unknown",
    color: "text-gray-400",
    bgColor: "bg-gray-500/10",
    icon: <AlertCircle size={16} />,
  },
};

function isCriticalStatus(status: ServiceHealthStatus): boolean {
  return (
    status === "serviceInterruption" ||
    status === "serviceDegradation" ||
    status === "extendedRecovery" ||
    status === "investigating"
  );
}

export default function AdminM365Health() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ServiceHealthStatus | "all">("all");
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);

  // Fetch service health
  const { data: services, isLoading, refetch } = trpc.m365Health.getServiceHealth.useQuery();
  
  // Fetch critical issues for admin
  const { data: criticalIssues } = trpc.m365Health.getCriticalIssues.useQuery();

  // Fetch issues for selected service
  const { data: serviceIssues, isLoading: issuesLoading, error: issuesError } = trpc.m365Health.getServiceIssues.useQuery(
    { serviceId: selectedService || "" },
    { enabled: !!selectedService }
  );

  // Filter and search services
  const filteredServices = useMemo(() => {
    if (!services) return [];

    let filtered = services;

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.service.toLowerCase().includes(query) ||
          s.id.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [services, statusFilter, searchQuery]);

  // Get status summary
  const summary = useMemo(() => {
    if (!services) return { total: 0, operational: 0, degraded: 0, down: 0, investigating: 0 };

    return {
      total: services.length,
      operational: services.filter((s) => s.status === "serviceOperational").length,
      degraded: services.filter((s) => s.status === "serviceDegradation").length,
      down: services.filter((s) => s.status === "serviceInterruption").length,
      investigating: services.filter((s) => s.status === "investigating").length,
    };
  }, [services]);

  const handleRefresh = async () => {
    toast.loading("Refreshing M365 service health...");
    await refetch();
    toast.dismiss();
    toast.success("Service health updated");
  };

  const selectedServiceData = services?.find(s => s.id === selectedService);
  // Check if we're showing demo data (permissions not yet granted)
  const isDemo = services && services.length > 0 && (services[0] as any)._demo === true;

  return (
    <AdminLayout>
        <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#0F1428] to-[#0A0E1A] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Permission Warning Banner */}
        {isDemo && (
          <div className="mb-6 p-4 rounded-lg border border-yellow-500/40 bg-yellow-500/10 flex items-start gap-3">
            <AlertCircle size={20} className="text-yellow-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-yellow-400 font-semibold text-sm">Azure Permission Required — Showing Demo Data</p>
              <p className="text-yellow-300/80 text-xs mt-1">
                The app registration is missing the <code className="bg-yellow-500/20 px-1 rounded">ServiceHealth.Read.All</code> permission.
                Go to <strong>Azure Portal → App Registrations → API Permissions</strong> and grant admin consent for <code className="bg-yellow-500/20 px-1 rounded">ServiceHealth.Read.All</code> (Application permission).
              </p>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Microsoft 365 Service Health</h1>
              <p className="text-gray-400">{isDemo ? "Demo data — connect Azure to see live status" : "Real-time monitoring of Microsoft cloud services"}</p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={isLoading}
              className="bg-[#00D4FF] hover:bg-[#00B8D4] text-black font-semibold"
            >
              <RefreshCw size={16} className={isLoading ? "animate-spin mr-2" : "mr-2"} />
              Refresh
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="bg-[#1a1f3a] border-[#00D4FF]/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-2">Total Services</p>
                  <p className="text-2xl font-bold text-white">{summary.total}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#1a1f3a] border-green-500/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-2">Operational</p>
                  <p className="text-2xl font-bold text-green-400">{summary.operational}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#1a1f3a] border-yellow-500/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-2">Investigating</p>
                  <p className="text-2xl font-bold text-yellow-400">{summary.investigating}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#1a1f3a] border-orange-500/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-2">Degraded</p>
                  <p className="text-2xl font-bold text-orange-400">{summary.degraded}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#1a1f3a] border-red-500/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-2">Down</p>
                  <p className="text-2xl font-bold text-red-400">{summary.down}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Critical Alerts */}
        {criticalIssues && criticalIssues.length > 0 && (
          <Card className="mb-8 border-red-500/30 bg-red-500/5">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center gap-2">
                <AlertCircle size={20} />
                Critical Issues ({criticalIssues.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {criticalIssues.map((issue) => (
                  <div key={issue.id} className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                    <span className="text-red-400 font-medium">{issue.service}</span>
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                      {STATUS_CONFIG[issue.status as ServiceHealthStatus].label}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-500" size={18} />
            <Input
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#1a1f3a] border-[#00D4FF]/20 text-white placeholder-gray-500"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => setStatusFilter("all")}
              className={statusFilter === "all" ? "bg-[#00D4FF] text-black" : ""}
            >
              All
            </Button>
            <Button
              variant={statusFilter === "serviceOperational" ? "default" : "outline"}
              onClick={() => setStatusFilter("serviceOperational")}
              className={statusFilter === "serviceOperational" ? "bg-green-500 text-white" : ""}
            >
              Operational
            </Button>
            <Button
              variant={statusFilter === "serviceDegradation" ? "default" : "outline"}
              onClick={() => setStatusFilter("serviceDegradation")}
              className={statusFilter === "serviceDegradation" ? "bg-orange-500 text-white" : ""}
            >
              Degraded
            </Button>
            <Button
              variant={statusFilter === "serviceInterruption" ? "default" : "outline"}
              onClick={() => setStatusFilter("serviceInterruption")}
              className={statusFilter === "serviceInterruption" ? "bg-red-500 text-white" : ""}
            >
              Down
            </Button>
          </div>
        </div>

        {/* Service Detail Modal */}
        {selectedService && selectedServiceData && (
          <Dialog open={!!selectedService} onOpenChange={(open) => !open && setSelectedService(null)}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-[#1a1f3a] border-[#00D4FF]/20">
              <DialogHeader>
                <div className="flex items-center justify-between w-full">
                  <DialogTitle className="text-white text-xl flex items-center gap-2">
                    {STATUS_CONFIG[selectedServiceData.status as ServiceHealthStatus]?.icon}
                    {selectedServiceData.service}
                  </DialogTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        window.open(
                          `https://status.cloud.microsoft/m365/en-US/status/history?serviceName=${selectedServiceData.id}`,
                          "_blank"
                        );
                      }}
                      className="text-xs"
                    >
                      View on Status Page
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => refetch()}
                      className="text-xs"
                    >
                      <RefreshCw size={14} className="mr-1" />
                      Refresh
                    </Button>
                  </div>
                </div>
              </DialogHeader>
              
              {issuesLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">Loading incident details...</p>
                </div>
              ) : issuesError ? (
                <div className="space-y-6 pb-4">
                  <div className="text-center py-8 bg-red-500/10 rounded-lg border border-red-500/20">
                    <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                    <p className="text-red-400 font-semibold mb-2">Unable to load incident details</p>
                    <p className="text-sm text-gray-400 mb-4">{issuesError.message || 'Failed to fetch service issues from Microsoft Graph'}</p>
                    <Button
                      size="sm"
                      onClick={() => refetch()}
                      className="bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    >
                      <RefreshCw size={14} className="mr-1" />
                      Retry
                    </Button>
                  </div>
                </div>
              ) : serviceIssues && serviceIssues.length > 0 ? (
                <div className="space-y-6 pb-4">
                  {serviceIssues.map((issue) => (
                    <div key={issue.id} className="space-y-4 pb-4 border-b border-[#00D4FF]/10 last:border-b-0">
                      {/* Issue Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-white font-semibold text-lg mb-2">{issue.title}</h3>
                          <p className="text-gray-400 text-sm mb-3">{issue.description}</p>
                        </div>
                        <Badge className={`${
                          issue.severity === "critical" ? "bg-red-500/20 text-red-400" :
                          issue.severity === "major" ? "bg-orange-500/20 text-orange-400" :
                          issue.severity === "minor" ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-blue-500/20 text-blue-400"
                        }`}>
                          {issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
                        </Badge>
                      </div>
                      
                      {/* Timeline */}
                      <div className="bg-[#0F1428] rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2 text-[#00D4FF]">
                          <Clock size={16} />
                          <span className="font-semibold">Timeline</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Started:</span>
                            <span className="text-white">{new Date(issue.startDateTime).toLocaleString()}</span>
                          </div>
                          {issue.endDateTime && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Resolved:</span>
                              <span className="text-green-400">{new Date(issue.endDateTime).toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-400">Last Updated:</span>
                            <span className="text-white">{new Date(issue.lastModifiedDateTime).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Affected Services */}
                      {issue.affectedServices && issue.affectedServices.length > 0 && (
                        <div className="bg-[#0F1428] rounded-lg p-4 space-y-3">
                          <div className="flex items-center gap-2 text-orange-400">
                            <AlertOctagon size={16} />
                            <span className="font-semibold">Affected Features</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {issue.affectedServices.map((service) => (
                              <Badge key={service} className="bg-orange-500/20 text-orange-400 border-0">
                                {service}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Workarounds */}
                      <div className="bg-[#0F1428] rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2 text-green-400">
                          <Wrench size={16} />
                          <span className="font-semibold">Workarounds & Recommendations</span>
                        </div>
                        <ul className="space-y-2 text-sm text-gray-300">
                          <li className="flex gap-2">
                            <span className="text-[#00D4FF] flex-shrink-0">•</span>
                            <span>Monitor the Microsoft 365 status page for real-time updates</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="text-[#00D4FF] flex-shrink-0">•</span>
                            <span>Check your organization's admin center for any additional guidance</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="text-[#00D4FF] flex-shrink-0">•</span>
                            <span>Contact Microsoft Support if the issue persists after resolution</span>
                          </li>
                        </ul>
                      </div>
                      
                      {/* Status Info */}
                      <div className="bg-[#0F1428] rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Current Status:</span>
                          <Badge className={`${
                            issue.status === "serviceOperational" ? "bg-green-500/20 text-green-400" :
                            issue.status === "investigating" ? "bg-yellow-500/20 text-yellow-400" :
                            issue.status === "serviceDegradation" ? "bg-orange-500/20 text-orange-400" :
                            issue.status === "serviceInterruption" ? "bg-red-500/20 text-red-400" :
                            "bg-blue-500/20 text-blue-400"
                          }`}>
                            {STATUS_CONFIG[issue.status as ServiceHealthStatus]?.label || issue.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">No active incidents for this service</p>
                    <p className="text-sm text-gray-500 mb-6">The service may be experiencing issues that haven't been reported yet, or the incident details are being updated.</p>
                  </div>
                  
                  {/* Service Details Card */}
                  <div className="bg-[#0F1428] rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 text-[#00D4FF]">
                      <Clock size={16} />
                      <span className="font-semibold">Service Information</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Service Name:</span>
                        <span className="text-white font-medium">{selectedServiceData.service}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Service ID:</span>
                        <span className="text-white font-mono text-xs">{selectedServiceData.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Current Status:</span>
                        <Badge className={`${
                          selectedServiceData.status === "serviceOperational" ? "bg-green-500/20 text-green-400" :
                          selectedServiceData.status === "investigating" ? "bg-yellow-500/20 text-yellow-400" :
                          selectedServiceData.status === "serviceDegradation" ? "bg-orange-500/20 text-orange-400" :
                          selectedServiceData.status === "serviceInterruption" ? "bg-red-500/20 text-red-400" :
                          "bg-blue-500/20 text-blue-400"
                        }`}>
                          {STATUS_CONFIG[selectedServiceData.status as ServiceHealthStatus]?.label || selectedServiceData.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Last Checked:</span>
                        <span className="text-white">{new Date().toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Recommendations */}
                  <div className="bg-[#0F1428] rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 text-green-400">
                      <Wrench size={16} />
                      <span className="font-semibold">Recommended Actions</span>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex gap-2">
                        <span className="text-[#00D4FF] flex-shrink-0">•</span>
                        <span>Check the Microsoft 365 status page for real-time updates</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-[#00D4FF] flex-shrink-0">•</span>
                        <span>Monitor your organization's admin center for guidance</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-[#00D4FF] flex-shrink-0">•</span>
                        <span>Contact Microsoft Support if you experience service issues</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-[#00D4FF] flex-shrink-0">•</span>
                        <span>Refresh this page to get the latest incident information</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-400">Loading service health...</p>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-400">No services found matching your criteria</p>
            </div>
          ) : (
            filteredServices.map((service) => {
              const config = STATUS_CONFIG[service.status];
              const isExpanded = expandedService === service.id;
              const isCritical = isCriticalStatus(service.status);

              return (
                <Card
                  key={service.id}
                  className={`cursor-pointer transition-[opacity,transform] border-2 ${
                    isExpanded
                      ? `border-[#00D4FF] ${config.bgColor}`
                      : `border-[#00D4FF]/20 hover:border-[#00D4FF]/50`
                  } ${isCritical ? "ring-1 ring-red-500/50" : ""}`}
                  onClick={() => {
                    if (isCritical) {
                      setSelectedService(service.id);
                    } else {
                      setExpandedService(isExpanded ? null : service.id);
                    }
                  }}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">{service.service}</h3>
                        <p className="text-xs text-gray-500">{service.id}</p>
                      </div>
                      <div className={`flex items-center gap-1 ${config.color}`}>
                        {config.icon}
                      </div>
                    </div>
                    <Badge className={`${config.bgColor} ${config.color} border-0`}>
                      {config.label}
                    </Badge>
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-[#00D4FF]/20">
                        <p className="text-xs text-gray-400">
                          Last updated: {new Date().toLocaleTimeString()}
                        </p>
                        {isCritical && (
                          <p className="text-xs text-[#00D4FF] mt-2 font-semibold">Click for details →</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Data refreshes automatically every 5 minutes</p>
          <p className="mt-1">
            <a
              href="https://status.cloud.microsoft/m365"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#00D4FF] hover:underline"
            >
              View full Microsoft 365 status page
            </a>
          </p>
        </div>
        </div>
      </div>
      </AdminLayout>
  );
}
