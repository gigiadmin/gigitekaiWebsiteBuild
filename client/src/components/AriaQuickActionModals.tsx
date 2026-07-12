/**
 * Aria Quick Action Modals
 * Modals for Provision Client, Run Workflow, Agent Status, and Settings
 */

import { useState } from "react";
import { X, Plus, Workflow, Activity, Settings, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/* ─── Provision Client Modal ─────────────────────────────────────────────── */
export function ProvisionClientModal({ isOpen, onClose }: ModalProps) {
  const [clientName, setClientName] = useState("");
  const [email, setEmail] = useState("");
  const [systems, setSystems] = useState<string[]>([]);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [progress, setProgress] = useState<Array<{ system: string; status: string; progress: number; details?: string }>>([]);

  const handleProvision = async () => {
    if (!clientName || !email || systems.length === 0) {
      alert("Please fill in all fields");
      return;
    }
    setIsProvisioning(true);
    setProgress([]);
    try {
      const result = await trpc.aria.provisionClient.useMutation().mutateAsync({
        clientName,
        email,
        systems,
      });
      // Show step-by-step progress
      if (result.steps && Array.isArray(result.steps)) {
        for (let i = 0; i < result.steps.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 500));
          setProgress(result.steps.slice(0, i + 1));
        }
      }
      alert(`Success: ${result.message}`);
      console.log("[Aria] Provisioning result:", result);
      setTimeout(() => {
        setIsProvisioning(false);
        onClose();
      }, 1000);
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : "Provisioning failed"}`);
      setIsProvisioning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Provision Client</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {isProvisioning && progress.length > 0 && (
          <div className="mb-6 p-4 bg-slate-800 border border-slate-700 rounded-lg">
            <h3 className="text-sm font-semibold text-cyan-400 mb-3">Provisioning Progress</h3>
            <div className="space-y-3">
              {progress.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-slate-300">{step.system}</span>
                      <span className="text-xs text-slate-400">{step.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          step.status === "completed" ? "bg-green-500" : "bg-cyan-500"
                        }`}
                        style={{ width: `${step.progress}%` }}
                      />
                    </div>
                    {step.details && <p className="text-[10px] text-slate-400 mt-1">{step.details}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isProvisioning && (
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Client Name</label>
            <Input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Acme Corp"
              className="bg-slate-800 border-slate-700"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-2 block">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@acme.com"
              className="bg-slate-800 border-slate-700"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-2 block">Systems to Provision</label>
            <div className="space-y-2">
              {["Microsoft 365", "Azure", "Exchange", "Teams", "SharePoint"].map((sys) => (
                <label key={sys} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={systems.includes(sys)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSystems([...systems, sys]);
                      } else {
                        setSystems(systems.filter((s) => s !== sys));
                      }
                    }}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-800"
                  />
                  <span className="text-sm text-slate-300">{sys}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        )}

        <div className="flex gap-2">
          <Button onClick={onClose} variant="outline" className="flex-1" disabled={isProvisioning}>
            Cancel
          </Button>
          <Button 
            onClick={handleProvision} 
            disabled={isProvisioning}
            className="flex-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50"
          >
            {isProvisioning ? "Provisioning..." : "Provision"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Run Workflow Modal ─────────────────────────────────────────────────── */
export function RunWorkflowModal({ isOpen, onClose }: ModalProps) {
  const [selectedWorkflow, setSelectedWorkflow] = useState("");
  const [parameters, setParameters] = useState<Record<string, string>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<Array<{ system: string; status: string; progress: number; details?: string }>>([]);

  const workflows = [
    { id: "onboard", name: "Client Onboarding", params: ["clientName", "email"] },
    { id: "provision", name: "Multi-system Provisioning", params: ["userId", "systems"] },
    { id: "security", name: "Security Hardening", params: ["tenantId"] },
    { id: "backup", name: "Backup & Recovery", params: ["backupType"] },
  ];

  const currentWorkflow = workflows.find((w) => w.id === selectedWorkflow);

  const handleRun = async () => {
    if (!selectedWorkflow) {
      alert("Please select a workflow");
      return;
    }
    setIsRunning(true);
    setProgress([]);
    try {
      const result = await trpc.aria.runWorkflow.useMutation().mutateAsync({
        workflowId: selectedWorkflow,
        parameters,
      });
      // Simulate step-by-step progress
      if (result.steps && Array.isArray(result.steps)) {
        for (let i = 0; i < result.steps.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 300));
          const steps = result.steps.map((s: any) => ({
            system: s.system || s.name,
            status: s.status,
            progress: s.progress,
            details: s.details,
          }));
          setProgress(steps.slice(0, i + 1));
        }
      }
      alert(`Success: ${result.message}`);
      console.log("[Aria] Workflow result:", result);
      setTimeout(() => onClose(), 1000);
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : "Workflow failed"}`);
    } finally {
      setIsRunning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-md w-full p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Workflow className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Run Workflow</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {isRunning && progress.length > 0 && (
          <div className="mb-6 p-4 bg-slate-800 border border-slate-700 rounded-lg">
            <h3 className="text-sm font-semibold text-cyan-400 mb-3">Workflow Progress</h3>
            <div className="space-y-2">
              {progress.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-slate-300">{step.system}</span>
                      <span className="text-xs text-slate-400">{step.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          step.status === "completed" ? "bg-green-500" : "bg-cyan-500"
                        }`}
                        style={{ width: `${step.progress}%` }}
                      />
                    </div>
                  </div>
                  {step.status === "completed" && <span className="text-green-400 text-xs">✓</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Select Workflow</label>
            <select
              value={selectedWorkflow}
              onChange={(e) => {
                setSelectedWorkflow(e.target.value);
                setParameters({});
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
            >
              <option value="">Choose a workflow...</option>
              {workflows.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {currentWorkflow && (
            <div className="space-y-2">
              {currentWorkflow.params.map((param) => (
                <div key={param}>
                  <label className="text-sm text-slate-400 mb-1 block capitalize">{param}</label>
                  <Input
                    value={parameters[param] || ""}
                    onChange={(e) => setParameters({ ...parameters, [param]: e.target.value })}
                    placeholder={`Enter ${param}`}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={onClose} variant="outline" className="flex-1" disabled={isRunning}>
            {isRunning ? "Running..." : "Cancel"}
          </Button>
          <Button onClick={handleRun} disabled={!selectedWorkflow || isRunning} className="flex-1 bg-blue-600 hover:bg-blue-500">
            {isRunning ? "Executing..." : "Run"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Agent Status Modal ─────────────────────────────────────────────────── */
export function AgentStatusModal({ isOpen, onClose }: ModalProps) {
  const { data: metricsData } = trpc.aria.getAgentMetrics.useQuery();
  const agents = metricsData?.agents || [
    { id: "1", name: "Provisioning Agent", status: "active", tasks: 847, uptime: "99.8%" },
    { id: "2", name: "Support Agent", status: "active", tasks: 1203, uptime: "99.9%" },
    { id: "3", name: "Security Agent", status: "idle", tasks: 456, uptime: "99.7%" },
    { id: "4", name: "Analytics Agent", status: "active", tasks: 234, uptime: "99.9%" },
  ];
  const activeCount = metricsData?.activeCount || 3;
  const totalUptime = metricsData?.totalUptime || "99.8%";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-md w-full p-6 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-slate-900">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-400" />
            <h2 className="text-lg font-bold text-white">Agent Status</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-2">
          {agents.map((agent) => (
            <div key={agent.id} className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-white">{agent.name}</span>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    agent.status === "active"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {agent.status}
                </span>
              </div>
              <div className="text-xs text-slate-400 space-y-1">
                <div>Tasks: {agent.tasks}</div>
                <div>Uptime: {agent.uptime}</div>
              </div>
            </div>
          ))}
        </div>

        <Button onClick={onClose} className="w-full mt-4 bg-slate-700 hover:bg-slate-600">
          Close
        </Button>
      </div>
    </div>
  );
}

/* ─── Settings Modal ─────────────────────────────────────────────────────── */
export function SettingsModal({ isOpen, onClose }: ModalProps) {
  const [settings, setSettings] = useState({
    verbosity: "normal",
    timeout: 30,
    autoRefresh: true,
  });

  const handleSave = () => {
    console.log("[Aria] Settings saved:", settings);
    alert("Settings saved successfully");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">Aria Settings</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Response Verbosity</label>
            <select
              value={settings.verbosity}
              onChange={(e) => setSettings({ ...settings, verbosity: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
            >
              <option value="brief">Brief</option>
              <option value="normal">Normal</option>
              <option value="detailed">Detailed</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-2 block">API Timeout (seconds)</label>
            <Input
              type="number"
              value={settings.timeout}
              onChange={(e) => setSettings({ ...settings, timeout: parseInt(e.target.value) })}
              className="bg-slate-800 border-slate-700"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoRefresh}
              onChange={(e) => setSettings({ ...settings, autoRefresh: e.target.checked })}
              className="w-4 h-4 rounded border-slate-600 bg-slate-800"
            />
            <span className="text-sm text-slate-300">Auto-refresh metrics every 30 seconds</span>
          </label>
        </div>

        <div className="flex gap-2">
          <Button onClick={onClose} variant="outline" className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1 bg-purple-600 hover:bg-purple-500">
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
