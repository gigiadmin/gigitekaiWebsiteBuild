import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Loader2, AlertCircle, TrendingUp, Clock, CheckCircle2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function AgentAssignmentDashboard() {
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);

  // Fetch all agents
  const { data: agents, isLoading: agentsLoading } = trpc.agents.getAllAgents.useQuery();

  // Fetch agent workload
  const { data: workload, isLoading: workloadLoading } = trpc.helpdeskAgentSla.getAgentWorkload.useQuery(
    { agentId: selectedAgentId || 0 },
    { enabled: !!selectedAgentId }
  );

  // Fetch dashboard metrics
  const { data: metrics, isLoading: metricsLoading } = trpc.helpdeskDashboardMetrics.getOverallMetrics.useQuery();

  if (agentsLoading || metricsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
        <span className="text-gray-400 ml-3">Loading dashboard...</span>
      </div>
    );
  }

  const agentList = agents || [];
  const selectedAgent = agentList.find((a: any) => a.id === selectedAgentId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Agent Assignment Dashboard</h2>
        <p className="text-gray-400 text-sm">Monitor agent workload and ticket assignments</p>
      </div>

      {/* Overall Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#141B2D]/60 border border-gray-800/40 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide font-semibold">Total Tickets</p>
                <p className="text-2xl font-bold text-white mt-1">{metrics.totalTickets}</p>
              </div>
              <Users className="w-8 h-8 text-cyan-400/30" />
            </div>
          </div>

          <div className="bg-[#141B2D]/60 border border-gray-800/40 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide font-semibold">In Progress</p>
                <p className="text-2xl font-bold text-orange-400 mt-1">{metrics.status?.inProgress || 0}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-400/30" />
            </div>
          </div>

          <div className="bg-[#141B2D]/60 border border-gray-800/40 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide font-semibold">Resolved</p>
                <p className="text-2xl font-bold text-green-400 mt-1">{metrics.status?.resolved || 0}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-400/30" />
            </div>
          </div>

          <div className="bg-[#141B2D]/60 border border-gray-800/40 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide font-semibold">Critical</p>
                <p className="text-2xl font-bold text-red-400 mt-1">{metrics.priority?.critical || 0}</p>
              </div>
              <Clock className="w-8 h-8 text-red-400/30" />
            </div>
          </div>
        </div>
      )}

      {/* Agent Selector */}
      <div className="bg-[#141B2D]/40 border border-gray-800/30 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Select Agent</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          {agentList.map((agent: any) => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgentId(agent.id)}
              className={`p-3 rounded-lg border transition-all text-left ${
                selectedAgentId === agent.id
                  ? "bg-cyan-500/20 border-cyan-500/50"
                  : "bg-gray-800/20 border-gray-700/30 hover:bg-gray-800/40"
              }`}
            >
              <p className="text-sm font-medium text-white truncate">{`Agent #${agent.id}`}</p>
              <p className="text-xs text-gray-500 mt-0.5">User ID: {agent.userId}</p>
              {agent.status && (
                <span className={`inline-block text-xs mt-1 px-2 py-0.5 rounded ${
                  agent.status === "available" 
                    ? "bg-green-500/20 text-green-400" 
                    : "bg-yellow-500/20 text-yellow-400"
                }`}>
                  {agent.status}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Agent Workload Details */}
      {selectedAgent && workload && !workloadLoading && (
        <div className="bg-[#141B2D]/40 border border-cyan-500/20 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-cyan-300">
              Workload: Agent #{selectedAgent.id}
            </h3>
            <span className="text-xs text-gray-500">{new Date().toLocaleDateString()}</span>
          </div>

          {/* Workload Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[#0A0E1A]/60 border border-gray-800/30 rounded-lg p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Total Assigned</p>
              <p className="text-2xl font-bold text-white mt-1">{workload.totalTickets || 0}</p>
            </div>

            <div className="bg-[#0A0E1A]/60 border border-gray-800/30 rounded-lg p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Open</p>
              <p className="text-2xl font-bold text-blue-400 mt-1">{workload.openTickets || 0}</p>
            </div>

            <div className="bg-[#0A0E1A]/60 border border-gray-800/30 rounded-lg p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">In Progress</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">{workload.inProgressTickets || 0}</p>
            </div>

            <div className="bg-[#0A0E1A]/60 border border-gray-800/30 rounded-lg p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Closed</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{workload.closedTickets || 0}</p>
            </div>
          </div>

          {/* Average Resolution Time */}
          {workload.avgResolutionTime && (
            <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-lg p-4 flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-cyan-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Average Resolution Time</p>
                <p className="text-lg font-semibold text-cyan-300">
                  {Math.round(workload.avgResolutionTime)} minutes
                </p>
              </div>
            </div>
          )}

          {/* Workload Status */}
          <div className="bg-gray-800/20 border border-gray-700/20 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-2">Workload Status</p>
            <div className="w-full bg-gray-900/50 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  (workload.totalTickets || 0) > 15
                    ? "bg-red-500"
                    : (workload.totalTickets || 0) > 10
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
                style={{
                  width: `${Math.min(((workload.totalTickets || 0) / 20) * 100, 100)}%`,
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {(workload.totalTickets || 0) > 15
                ? "⚠️ High workload - consider reassigning"
                : (workload.totalTickets || 0) > 10
                ? "⚡ Moderate workload"
                : "✓ Healthy workload"}
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!selectedAgentId && (
        <div className="bg-gray-800/20 border border-gray-700/30 rounded-lg p-8 text-center">
          <Users className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Select an agent to view their workload details</p>
        </div>
      )}
    </div>
  );
}
