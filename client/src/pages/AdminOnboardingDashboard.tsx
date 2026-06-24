import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Eye } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useLocation } from "wouter";

export default function AdminOnboardingDashboard() {
  const [, navigate] = useLocation();
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: dashboardData, isLoading, refetch } = trpc.clientOnboarding.getOnboardingDashboard.useQuery(undefined, {
    refetchInterval: autoRefresh ? 10000 : false, // Auto-refresh every 10 seconds if enabled
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "onboarding":
        return "bg-blue-100 text-blue-800";
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "paused":
        return "bg-gray-100 text-gray-800";
      case "churned":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStepColor = (step: string) => {
    switch (step) {
      case "submitted":
        return "bg-purple-100 text-purple-800";
      case "kickoff_scheduled":
        return "bg-blue-100 text-blue-800";
      case "discovery":
        return "bg-indigo-100 text-indigo-800";
      case "implementation":
        return "bg-cyan-100 text-cyan-800";
      case "training":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with stats */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">New Clients (Last 30 Days)</h2>
            <p className="text-gray-600 mt-1">Real-time onboarding status and progress</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? "Auto-Refresh ON" : "Auto-Refresh OFF"}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {dashboardData && (
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total New Clients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{dashboardData.totalNewClients}</div>
                <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Onboarding</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {dashboardData.clients.filter(c => c.status === "onboarding").length}
                </div>
                <p className="text-xs text-gray-500 mt-1">In progress</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Active</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {dashboardData.clients.filter(c => c.status === "active").length}
                </div>
                <p className="text-xs text-gray-500 mt-1">Live clients</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Last Updated</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-mono">
                  {new Date(dashboardData.lastUpdated).toLocaleTimeString()}
                </div>
                <p className="text-xs text-gray-500 mt-1">Just now</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Clients List */}
        <Card>
          <CardHeader>
            <CardTitle>New Client Onboardings</CardTitle>
            <CardDescription>All clients onboarded in the last 30 days with their current status</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : dashboardData && dashboardData.clients.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.clients.map((client) => (
                  <div
                    key={client.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{client.companyName}</h3>
                        <p className="text-sm text-gray-600">{client.companyDomain}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(client.status)}>
                          {client.status}
                        </Badge>
                        {client.onboardingStep && (
                          <Badge className={getStepColor(client.onboardingStep)}>
                            {client.onboardingStep.replace(/_/g, " ")}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                      <div>
                        <p className="text-gray-600">Contact</p>
                        <p className="font-medium">{client.contactFirstName} {client.contactLastName}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Email</p>
                        <p className="font-medium text-blue-600">{client.contactEmail}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Service Type</p>
                        <p className="font-medium">{client.serviceType}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Annual Value</p>
                        <p className="font-medium">${parseFloat(client.annualContractValue).toLocaleString()}</p>
                      </div>
                    </div>

                    {client.kickoffMeetingDate && (
                      <div className="mb-3 text-sm">
                        <p className="text-gray-600">Kickoff Meeting</p>
                        <p className="font-medium">
                          {new Date(client.kickoffMeetingDate).toLocaleDateString()} at{" "}
                          {new Date(client.kickoffMeetingDate).toLocaleTimeString()}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/clients/${client.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No new clients in the last 30 days
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
