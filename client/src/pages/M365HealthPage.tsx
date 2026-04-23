import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Clock,
  Search,
  RefreshCw,
  TrendingDown,
  Zap,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export default function M365HealthPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "critical" | "operational">("all");

  // Fetch service health
  const { data: services = [], isLoading: servicesLoading, refetch: refetchServices } = trpc.m365Health.getServiceHealth.useQuery({});

  // Fetch critical issues
  const { data: criticalIssues = [] } = trpc.m365Health.getCriticalIssues.useQuery({});

  // Fetch health summary
  const { data: healthSummary } = trpc.m365Health.getHealthSummary.useQuery({});

  // Fetch issues for selected service
  const { data: serviceIssues = [], isLoading: issuesLoading } = trpc.m365Health.getServiceIssues.useQuery(
    { serviceId: selectedService || "" },
    { enabled: !!selectedService }
  );

  // Filter services based on search and status
  const filteredServices = useMemo(() => {
    let result = services;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.service.toLowerCase().includes(query) ||
          s.id.toLowerCase().includes(query)
      );
    }

    if (statusFilter === "critical") {
      result = result.filter((s) => ["serviceInterruption", "serviceDegradation", "extendedRecovery"].includes(s.status));
    } else if (statusFilter === "operational") {
      result = result.filter((s) => s.status === "serviceOperational");
    }

    return result;
  }, [services, searchQuery, statusFilter]);

  // Get status badge color
  function getStatusColor(status: string) {
    switch (status) {
      case "serviceOperational":
        return "bg-green-900/30 text-green-400 border-green-700/30";
      case "investigating":
      case "restoringService":
        return "bg-yellow-900/30 text-yellow-400 border-yellow-700/30";
      case "serviceDegradation":
        return "bg-orange-900/30 text-orange-400 border-orange-700/30";
      case "serviceInterruption":
      case "extendedRecovery":
        return "bg-red-900/30 text-red-400 border-red-700/30";
      default:
        return "bg-slate-700/30 text-slate-400 border-slate-600/30";
    }
  }

  // Get status icon
  function getStatusIcon(status: string) {
    switch (status) {
      case "serviceOperational":
        return <CheckCircle size={16} />;
      case "investigating":
      case "restoringService":
        return <Clock size={16} />;
      case "serviceDegradation":
        return <AlertTriangle size={16} />;
      case "serviceInterruption":
      case "extendedRecovery":
        return <AlertCircle size={16} />;
      default:
        return <TrendingDown size={16} />;
    }
  }

  // Format status text
  function formatStatus(status: string) {
    return status
      .replace(/([A-Z])/g, " $1")
      .trim()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  return (
    <AdminLayout title="M365 Health Status">
      <div className="space-y-6">
        {/* Health Summary Cards */}
        {healthSummary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <p className="text-xs text-slate-400 mb-1">Total Services</p>
                <p className="text-2xl font-bold text-white">{healthSummary.total}</p>
              </CardContent>
            </Card>
            <Card className="bg-green-900/20 border-green-700/30">
              <CardContent className="pt-6">
                <p className="text-xs text-green-400 mb-1">Operational</p>
                <p className="text-2xl font-bold text-green-400">{healthSummary.operational}</p>
              </CardContent>
            </Card>
            <Card className="bg-orange-900/20 border-orange-700/30">
              <CardContent className="pt-6">
                <p className="text-xs text-orange-400 mb-1">Degraded</p>
                <p className="text-2xl font-bold text-orange-400">{healthSummary.degraded}</p>
              </CardContent>
            </Card>
            <Card className="bg-red-900/20 border-red-700/30">
              <CardContent className="pt-6">
                <p className="text-xs text-red-400 mb-1">Down</p>
                <p className="text-2xl font-bold text-red-400">{healthSummary.down}</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-900/20 border-yellow-700/30">
              <CardContent className="pt-6">
                <p className="text-xs text-yellow-400 mb-1">Investigating</p>
                <p className="text-2xl font-bold text-yellow-400">{healthSummary.investigating}</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="services" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="services" className="flex items-center gap-2">
              <Zap size={14} />
              Services
              {criticalIssues.length > 0 && (
                <Badge className="ml-1 h-4 px-1 text-xs bg-red-500 text-white">{criticalIssues.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="incidents" className="flex items-center gap-2">
              <AlertCircle size={14} />
              Incidents
            </TabsTrigger>
          </TabsList>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-4">
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <Input
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-sm text-white"
              >
                <option value="all">All Status</option>
                <option value="operational">Operational</option>
                <option value="critical">Critical</option>
              </select>
              <Button
                size="sm"
                variant="outline"
                onClick={() => refetchServices()}
                disabled={servicesLoading}
              >
                <RefreshCw size={14} className={servicesLoading ? "animate-spin" : ""} />
              </Button>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredServices.map((service) => (
                <Card
                  key={service.id}
                  className={`bg-slate-800 border-slate-700 cursor-pointer hover:border-slate-600 transition ${
                    selectedService === service.id ? "border-cyan-500/50 ring-1 ring-cyan-500/30" : ""
                  }`}
                  onClick={() => setSelectedService(service.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-semibold text-white truncate">
                          {service.service}
                        </CardTitle>
                      </div>
                      {getStatusIcon(service.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="outline" className={`border ${getStatusColor(service.status)}`}>
                      {formatStatus(service.status)}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Service Detail Panel */}
            {selectedService && (
              <Card className="bg-slate-800 border-slate-700 mt-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      {services.find((s) => s.id === selectedService)?.service}
                    </CardTitle>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedService(null)}
                    >
                      Close
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {issuesLoading ? (
                    <p className="text-slate-400">Loading issues...</p>
                  ) : serviceIssues.length === 0 ? (
                    <p className="text-slate-400">No active issues for this service.</p>
                  ) : (
                    <div className="space-y-3">
                      {serviceIssues.map((issue) => (
                        <div
                          key={issue.id}
                          className="bg-slate-700/50 rounded p-3 space-y-2 border border-slate-600/30"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-white text-sm">{issue.title}</h4>
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                issue.severity === "critical"
                                  ? "bg-red-900/30 text-red-400 border-red-700/30"
                                  : issue.severity === "major"
                                  ? "bg-orange-900/30 text-orange-400 border-orange-700/30"
                                  : issue.severity === "minor"
                                  ? "bg-yellow-900/30 text-yellow-400 border-yellow-700/30"
                                  : "bg-slate-700/30 text-slate-400 border-slate-600/30"
                              }`}
                            >
                              {issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-300">{issue.description}</p>
                          <div className="flex items-center gap-4 text-xs text-slate-400 pt-2">
                            <span>
                              Started:{" "}
                              {formatDistanceToNow(new Date(issue.startDateTime), {
                                addSuffix: true,
                              })}
                            </span>
                            {issue.endDateTime && (
                              <span>
                                Resolved:{" "}
                                {formatDistanceToNow(new Date(issue.endDateTime), {
                                  addSuffix: true,
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Incidents Tab */}
          <TabsContent value="incidents" className="space-y-4">
            {criticalIssues.length === 0 ? (
              <Card className="bg-green-900/20 border-green-700/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-green-400" />
                    <div>
                      <p className="font-semibold text-green-400">All Systems Operational</p>
                      <p className="text-sm text-green-300">No critical incidents detected.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {criticalIssues.map((issue) => (
                  <Card key={issue.id} className="bg-red-900/20 border-red-700/30">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-red-400 flex items-center gap-2">
                            <AlertCircle size={18} />
                            {issue.service}
                          </CardTitle>
                          <CardDescription className="text-red-300/70">
                            {formatStatus(issue.status)}
                          </CardDescription>
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-red-900/30 text-red-400 border-red-700/30"
                        >
                          {issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
                        </Badge>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
