import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, User, AlertCircle } from "lucide-react";

interface AgentAssignmentModalProps {
  ticketId: number;
  currentAssignedTo?: number;
  isOpen: boolean;
  onClose: () => void;
  onAssignmentSuccess?: () => void;
}

export function AgentAssignmentModal({
  ticketId,
  currentAssignedTo,
  isOpen,
  onClose,
  onAssignmentSuccess,
}: AgentAssignmentModalProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(
    currentAssignedTo?.toString() || ""
  );

  // Fetch list of agents
  const { data: agents, isLoading: agentsLoading } =
    trpc.agents.getAllAgents.useQuery();

  // Assign ticket mutation
  const assignMutation = trpc.helpdeskAgentSla.assignTicket.useMutation({
    onSuccess: () => {
      toast.success("Ticket assigned successfully!");
      setSelectedAgentId("");
      onClose();
      onAssignmentSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to assign ticket");
    },
  });

  const handleAssign = () => {
    if (!selectedAgentId) {
      toast.error("Please select an agent");
      return;
    }

    assignMutation.mutate({
      ticketId,
      agentId: parseInt(selectedAgentId),
    });
  };

  const handleUnassign = () => {
    // Call unassign by passing undefined or by calling a separate unassign endpoint
    // For now, we'll just close the modal and show a message
    toast.info("Unassign feature coming soon");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-gray-900 to-gray-800 border border-cyan-500/20">
        <DialogHeader>
          <DialogTitle className="text-cyan-400 flex items-center gap-2">
            <User className="w-5 h-5" />
            Assign Ticket to Agent
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Assignment Info */}
          {currentAssignedTo && (
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-300">
                <p className="font-medium text-blue-400">Currently Assigned</p>
                <p className="text-xs mt-1">
                  This ticket is already assigned to an agent. Select a new agent to reassign.
                </p>
              </div>
            </div>
          )}

          {/* Agent Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Select Agent
            </label>
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Choose an agent..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {agentsLoading ? (
                  <div className="p-2 text-center text-gray-400 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  </div>
                ) : agents && agents.length > 0 ? (
                  agents.map((agent) => (
                    <SelectItem
                      key={agent.id}
                      value={agent.id.toString()}
                      className="text-white"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            agent.status === "available"
                              ? "bg-green-500"
                              : agent.status === "busy"
                                ? "bg-orange-500"
                                : "bg-gray-500"
                          }`}
                        />
                        <span>
                          {agent.specialization || `Agent #${agent.id}`}
                        </span>
                        {agent.status && (
                          <span className="text-xs text-gray-400">
                            {agent.status}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-center text-gray-400 text-sm">
                    No agents available
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Agent Workload Info */}
          {selectedAgentId && agents && (
            <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <p className="text-xs text-gray-400">
                Agent workload and availability info would display here
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            Cancel
          </Button>

          {currentAssignedTo && (
            <Button
              variant="destructive"
              onClick={handleUnassign}
              disabled={assignMutation.isPending}
              className="bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30"
            >
              {assignMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Unassigning...
                </>
              ) : (
                "Unassign"
              )}
            </Button>
          )}

          <Button
            onClick={handleAssign}
            disabled={!selectedAgentId || assignMutation.isPending}
            className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold"
          >
            {assignMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : (
              "Assign Agent"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
