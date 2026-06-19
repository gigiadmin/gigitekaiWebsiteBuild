import AdminLayout from "@/components/AdminLayout";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Users, Plus, Trash2, Activity, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AdminAgents() {
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [newAgentSpecialization, setNewAgentSpecialization] = useState("");

  // Fetch all users for the dropdown
  const { data: allUsers = [] } = trpc.agents.getUsers.useQuery();

  // Fetch all agents
  const { data: agents = [], isLoading, refetch } = trpc.agents.getAllAgents.useQuery();

  // Create agent mutation
  const createAgentMutation = trpc.agents.createAgent.useMutation({
    onSuccess: () => {
      toast.success("Agent created successfully");
      setSelectedUserId(null);
      setNewAgentSpecialization("");
      setShowAddAgent(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create agent");
    },
  });

  // Delete agent mutation
  const deleteAgentMutation = trpc.agents.deleteAgent.useMutation({
    onSuccess: () => {
      toast.success("Agent deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete agent");
    },
  });

  const handleAddAgent = async () => {
    if (!selectedUserId) {
      toast.error("Please select a user");
      return;
    }

    createAgentMutation.mutate({
      userId: selectedUserId,
      specialization: newAgentSpecialization || undefined,
    });
  };

  const handleDeleteAgent = (agentId: number) => {
    if (confirm("Are you sure you want to delete this agent?")) {
      deleteAgentMutation.mutate({ agentId });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-500";
      case "busy":
        return "bg-yellow-500";
      case "on-break":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400" />
            Agent Management
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Manage support agents and their assignments
          </p>
        </div>

        <Dialog open={showAddAgent} onOpenChange={setShowAddAgent}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold">
              <Plus className="w-4 h-4 mr-2" />
              Add Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Add New Agent</DialogTitle>
              <DialogDescription className="text-gray-400">
                Create a new support agent from an existing user
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select User
                </label>
                <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={userSearchOpen}
                      className="w-full justify-between bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                    >
                      {selectedUserId
                        ? (() => {
                            const u = allUsers.find((u) => u.id === selectedUserId);
                            return u ? `${u.name} (${u.email})` : "Select user...";
                          })()
                        : "Search by name or email..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 bg-slate-800 border-slate-700" align="start">
                    <Command className="bg-slate-800">
                      <CommandInput
                        placeholder="Search name or email..."
                        className="text-white placeholder:text-gray-400"
                      />
                      <CommandList>
                        <CommandEmpty className="text-gray-400 py-4 text-center text-sm">
                          No users found.
                        </CommandEmpty>
                        <CommandGroup>
                          {allUsers.map((u) => (
                            <CommandItem
                              key={u.id}
                              value={`${u.name} ${u.email}`}
                              onSelect={() => {
                                setSelectedUserId(u.id);
                                setUserSearchOpen(false);
                              }}
                              className="text-white hover:bg-slate-700 cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedUserId === u.id ? "opacity-100 text-cyan-400" : "opacity-0"
                                )}
                              />
                              <div>
                                <p className="font-medium">{u.name}</p>
                                <p className="text-xs text-gray-400">{u.email}</p>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Specialization (Optional)
                </label>
                <Input
                  placeholder="e.g., Microsoft 365, Security, Cloud"
                  value={newAgentSpecialization}
                  onChange={(e) => setNewAgentSpecialization(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowAddAgent(false)}
                  className="border-slate-700 text-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddAgent}
                  disabled={createAgentMutation.isPending}
                  className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold"
                >
                  {createAgentMutation.isPending ? "Creating..." : "Create Agent"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-400">Loading agents...</div>
        </div>
      ) : agents.length === 0 ? (
        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No agents yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Add your first agent to get started
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {agents.map((agent) => (
            <Card key={agent.id} className="bg-slate-900 border-slate-700 hover:border-slate-600 transition">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                        <Users className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">
                          {allUsers.find(u => u.id === agent.userId)?.name || `Agent #${agent.userId}`}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {allUsers.find(u => u.id === agent.userId)?.email || "Unknown email"}
                        </p>
                        {agent.specialization && (
                          <p className="text-sm text-gray-400">
                            {agent.specialization}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">
                          Status
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div
                            className={`w-2 h-2 rounded-full ${getStatusColor(
                              agent.status
                            )}`}
                          />
                          <span className="text-sm text-white capitalize">
                            {agent.status}
                          </span>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">
                          Current Tickets
                        </p>
                        <p className="text-sm text-white font-semibold mt-1">
                          {agent.currentTicketCount}/{agent.maxConcurrentTickets}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">
                          Resolved
                        </p>
                        <p className="text-sm text-white font-semibold mt-1">
                          {agent.totalTicketsResolved}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">
                          Satisfaction
                        </p>
                        <p className="text-sm text-white font-semibold mt-1">
                          {agent.customerSatisfactionScore
                            ? `${agent.customerSatisfactionScore}/5`
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteAgent(agent.id)}
                    disabled={deleteAgentMutation.isPending}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Agent Statistics */}
      {agents.length > 0 && (
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              Team Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-800 rounded-lg p-4">
                <p className="text-sm text-gray-400">Total Agents</p>
                <p className="text-2xl font-bold text-cyan-400 mt-1">
                  {agents.length}
                </p>
              </div>
              <div className="bg-slate-800 rounded-lg p-4">
                <p className="text-sm text-gray-400">Available</p>
                <p className="text-2xl font-bold text-green-400 mt-1">
                  {agents.filter((a) => a.status === "available").length}
                </p>
              </div>
              <div className="bg-slate-800 rounded-lg p-4">
                <p className="text-sm text-gray-400">Busy</p>
                <p className="text-2xl font-bold text-yellow-400 mt-1">
                  {agents.filter((a) => a.status === "busy").length}
                </p>
              </div>
              <div className="bg-slate-800 rounded-lg p-4">
                <p className="text-sm text-gray-400">Total Resolved</p>
                <p className="text-2xl font-bold text-cyan-400 mt-1">
                  {agents.reduce((sum, a) => sum + a.totalTicketsResolved, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
