import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Loader2, Users, Zap, TrendingDown, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export function AgentWorkloadOptimizer() {
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);

  // Fetch all agents
  const { data: allAgents, isLoading: agentsLoading } = trpc.agents.getAllAgents.useQuery();

  // Fetch workload for selected agent
  const { data: agentWorkload, isLoading: workloadLoading } = trpc.helpdeskAgentSla.getAgentWorkload.useQuery(
    { agentId: selectedAgentId || 0 },
    { enabled: !!selectedAgentId }
  );

  // Fetch SLA breaches
  const { data: slaBreaches, isLoading: breachesLoading } = trpc.helpdeskAgentSla.getSLABreaches.useQuery();

  // Assign ticket mutation
  const assignMutation = trpc.helpdeskAgentSla.assignTicket.useMutation({
    onSuccess: () => {
      toast.success("Ticket assigned successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to assign ticket");
    },
  });

  const getWorkloadPercentage = (workload: any) => {
    const total = (workload?.totalTickets || 0);
    const maxCapacity = 20;
    return Math.round((total / maxCapacity) * 100);
  };

  const getWorkloadColor = (percentage: number) => {
    if (percentage < 50) return "text-green-400 bg-green-500/10";
    if (percentage < 75) return "text-yellow-400 bg-yellow-500/10";
    if (percentage < 90) return "text-orange-400 bg-orange-500/10";
    return "text-red-400 bg-red-500/10";
  };

  if (agentsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
        <span className="text-gray-400 ml-3">Loading agent data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Agent Workload Optimizer</h2>
          <p className="text-gray-400 text-sm">Monitor and optimize ticket distribution across agents</p>
        </div>
        <div className="flex items-center gap-3 bg-[#141B2D]/60 border border-gray-800/30 rounded-lg p-3">
          <span className="text-sm text-gray-400">Auto-Assign</span>
          <button
            onClick={() => setAutoAssignEnabled(!autoAssignEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              autoAssignEnabled ? "bg-cyan-500/30" : "bg-gray-800/40"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                autoAssignEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Agents List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allAgents && allAgents.length > 0 ? (
          allAgents.map((agent: any) => {
            const workload = agentWorkload && selectedAgentId === agent.id ? agentWorkload : null;
            const totalTickets = workload?.totalTickets || 0;
            const percentage = getWorkloadPercentage(workload);

            return (
              <Card
                key={agent.id}
                onClick={() => setSelectedAgentId(agent.id)}
                className={`bg-[#141B2D]/60 border-gray-800/30 p-4 cursor-pointer hover:border-cyan-500/30 transition-all ${
                  selectedAgentId === agent.id ? "border-cyan-500/50" : ""
                } ${percentage > 90 ? "border-red-500/30" : ""}`}
              >
                <div className="space-y-3">
                  {/* Agent Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-white font-medium">{agent.name || `Agent ${agent.id}`}</h3>
                      <p className="text-xs text-gray-500 mt-1">ID: {agent.id}</p>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  </div>

                  {/* Workload Bar */}
                  {workload && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400">Workload</span>
                        <span className={`text-sm font-semibold ${getWorkloadColor(percentage).split(" ")[0]}`}>
                          {percentage}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-800/40 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            percentage < 50
                              ? "bg-green-500"
                              : percentage < 75
                                ? "bg-yellow-500"
                                : percentage < 90
                                  ? "bg-orange-500"
                                  : "bg-red-500"
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Metrics */}
                  {workload && (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-gray-800/20 rounded-lg p-2">
                        <p className="text-xs text-gray-500">Open</p>
                        <p className="text-lg font-bold text-blue-400">{workload.openTickets || 0}</p>
                      </div>
                      <div className="bg-gray-800/20 rounded-lg p-2">
                        <p className="text-xs text-gray-500">In Progress</p>
                        <p className="text-lg font-bold text-yellow-400">{workload.inProgressTickets || 0}</p>
                      </div>
                      <div className="bg-gray-800/20 rounded-lg p-2">
                        <p className="text-xs text-gray-500">Closed</p>
                        <p className="text-lg font-bold text-green-400">{workload.closedTickets || 0}</p>
                      </div>
                    </div>
                  )}

                  {/* Status */}
                  <div className="text-xs">
                    <span
                      className={`px-2 py-1 rounded ${
                        percentage < 50
                          ? "bg-green-500/20 text-green-400"
                          : percentage < 75
                            ? "bg-yellow-500/20 text-yellow-400"
                            : percentage < 90
                              ? "bg-orange-500/20 text-orange-400"
                              : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {percentage < 50
                        ? "Available"
                        : percentage < 75
                          ? "Moderate"
                          : percentage < 90
                            ? "Busy"
                            : "Overloaded"}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <Card className="bg-[#141B2D]/40 border-gray-800/30 p-8 col-span-full text-center">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No agents found</p>
          </Card>
        )}
      </div>

      {/* SLA Breaches Alert */}
      {slaBreaches && slaBreaches.length > 0 && (
        <Card className="bg-red-500/10 border-red-500/30 p-5">
          <h3 className="text-sm font-semibold text-red-300 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            SLA Breaches ({slaBreaches.length})
          </h3>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {slaBreaches.map((breach: any, idx: number) => (
              <div key={idx} className="text-xs bg-gray-800/20 border border-red-500/20 rounded-lg p-2">
                <p className="text-red-200">
                  Ticket #{breach.ticketId} - SLA deadline: {new Date(breach.slaDeadline).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Optimization Insights */}
      <Card className="bg-[#141B2D]/40 border-gray-800/30 p-5">
        <h3 className="text-sm font-semibold text-cyan-300 mb-4">Optimization Insights</h3>

        <div className="space-y-3 text-sm">
          {allAgents && allAgents.length > 0 && (
            <>
              {(() => {
                const overloaded = allAgents.filter((a: any) => {
                  // Estimate based on agent name or status
                  return false; // Placeholder
                });

                const underutilized = allAgents.filter((a: any) => {
                  // Estimate based on agent name or status
                  return false; // Placeholder
                });

                return (
                  <>
                    {overloaded.length > 0 && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-red-300 font-medium mb-1">⚠️ Overloaded Agents</p>
                        <p className="text-xs text-red-200">
                          {overloaded.length} agent(s) at {">"}90% capacity. Consider reassigning tickets.
                        </p>
                      </div>
                    )}

                    {underutilized.length > 0 && (
                      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <p className="text-blue-300 font-medium mb-1">💡 Underutilized Agents</p>
                        <p className="text-xs text-blue-200">
                          {underutilized.length} agent(s) below 30% capacity. Ready to take more tickets.
                        </p>
                      </div>
                    )}

                    {slaBreaches && slaBreaches.length > 0 && (
                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <p className="text-yellow-300 font-medium mb-1">📊 SLA at Risk</p>
                        <p className="text-xs text-yellow-200">
                          {slaBreaches.length} ticket(s) at risk of SLA breach. Prioritize these tickets.
                        </p>
                      </div>
                    )}
                  </>
                );
              })()}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
