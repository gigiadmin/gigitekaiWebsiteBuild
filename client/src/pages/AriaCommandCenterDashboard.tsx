/**
 * Aria Command Center Dashboard
 * Central intelligence hub for AI orchestration, agent management, and quick-launch workflows
 * Accessible via ⌘K / Ctrl+K from anywhere in the admin panel
 */

import { useState, useEffect } from 'react';
import { Activity, Zap, Users, Workflow, Settings, Plus, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Agent {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'offline';
  tasksCompleted: number;
  uptime: string;
}

interface OrchestrationRun {
  id: string;
  workflow: string;
  status: 'running' | 'completed' | 'failed';
  startTime: string;
  duration: string;
  systemsProvisioned: number;
}

interface QuickLaunchAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

export default function AriaCommandCenterDashboard() {
  const handleQuickLaunch = (actionId: string, actionLabel: string) => {
    // Show toast notification
    const toastMessage = `${actionLabel} feature coming soon. Keyboard shortcut: ⌘K / Ctrl+K to return to Aria.`;
    alert(toastMessage); // Replace with toast component if available
    
    // Log action for analytics
    console.log(`[Aria] Quick launch: ${actionLabel}`);
    
    // TODO: Wire to actual features
    // - Provision Client → open provisioning modal
    // - Run Workflow → open workflow selector
    // - Agent Status → scroll to agents section
    // - Settings → open settings panel
  };
  const [agents, setAgents] = useState<Agent[]>([
    { id: '1', name: 'Provisioning Agent', status: 'active', tasksCompleted: 847, uptime: '99.8%' },
    { id: '2', name: 'Support Agent', status: 'active', tasksCompleted: 1203, uptime: '99.9%' },
    { id: '3', name: 'Security Agent', status: 'idle', tasksCompleted: 456, uptime: '99.7%' },
    { id: '4', name: 'Analytics Agent', status: 'active', tasksCompleted: 621, uptime: '99.8%' },
  ]);

  const [orchestrationRuns, setOrchestrationRuns] = useState<OrchestrationRun[]>([
    { id: '1', workflow: 'Multi-tenant provisioning', status: 'completed', startTime: '2 min ago', duration: '3.4s', systemsProvisioned: 8 },
    { id: '2', workflow: 'Client onboarding', status: 'running', startTime: 'Now', duration: '1.2s', systemsProvisioned: 5 },
    { id: '3', workflow: 'Security hardening', status: 'completed', startTime: '15 min ago', duration: '8.7s', systemsProvisioned: 12 },
  ]);

  const quickLaunchActions: QuickLaunchAction[] = [
    { id: '1', label: 'Provision Client', icon: <Plus size={18} />, description: 'Launch multi-system provisioning', color: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' },
    { id: '2', label: 'Run Workflow', icon: <Workflow size={18} />, description: 'Execute orchestration workflow', color: 'bg-blue-500/20 border-blue-500/40 text-blue-300' },
    { id: '3', label: 'Agent Status', icon: <Activity size={18} />, description: 'View all agent health metrics', color: 'bg-green-500/20 border-green-500/40 text-green-300' },
    { id: '4', label: 'Settings', icon: <Settings size={18} />, description: 'Configure Aria parameters', color: 'bg-purple-500/20 border-purple-500/40 text-purple-300' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'running':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'completed':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'idle':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'offline':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'failed':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'active':
      case 'running':
      case 'completed':
        return 'bg-green-400 animate-pulse';
      case 'idle':
        return 'bg-yellow-400';
      case 'offline':
      case 'failed':
        return 'bg-red-400';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#0F1629] to-[#0A0E1A] p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="relative">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-pulse opacity-30"></div>
          </div>
          <h1 className="text-3xl font-bold text-white">Aria Command Center</h1>
        </div>
        <p className="text-gray-400">AI Orchestrator · Always On · Keyboard Shortcut: ⌘K / Ctrl+K</p>
      </div>

      {/* Quick Launch Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {quickLaunchActions.map((action) => (
          <button
            key={action.id}
            onClick={() => handleQuickLaunch(action.id, action.label)}
            className={`p-4 rounded-lg border transition-all hover:shadow-lg hover:shadow-cyan-500/20 cursor-pointer active:scale-95 ${action.color}`}
          >
            <div className="flex items-center gap-3 mb-2">
              {action.icon}
              <span className="text-sm font-semibold">{action.label}</span>
            </div>
            <p className="text-xs opacity-80">{action.description}</p>
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Agents */}
        <div className="lg:col-span-2 bg-[#0F1629]/50 border border-cyan-500/10 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users size={20} className="text-cyan-400" />
            <h2 className="text-xl font-bold text-white">Active Agents</h2>
            <span className="ml-auto text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded border border-green-500/30">
              {agents.filter(a => a.status === 'active').length} Active
            </span>
          </div>

          <div className="space-y-3">
            {agents.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between p-3 bg-[#0A0E1A]/50 rounded-lg border border-slate-700/50 hover:border-cyan-500/30 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-2.5 h-2.5 rounded-full ${getStatusDot(agent.status)}`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{agent.name}</p>
                    <p className="text-xs text-gray-500">{agent.tasksCompleted} tasks completed</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className={`text-xs font-semibold px-2 py-1 rounded border ${getStatusColor(agent.status)}`}>
                      {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 w-12 text-right">{agent.uptime}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Stats */}
        <div className="bg-[#0F1629]/50 border border-cyan-500/10 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Zap size={20} className="text-cyan-400" />
            System Stats
          </h2>

          <div className="space-y-4">
            <div className="bg-[#0A0E1A]/50 rounded-lg p-4 border border-slate-700/50">
              <p className="text-xs text-gray-400 mb-1">Uptime SLA</p>
              <p className="text-2xl font-bold text-green-400">99.9%</p>
            </div>

            <div className="bg-[#0A0E1A]/50 rounded-lg p-4 border border-slate-700/50">
              <p className="text-xs text-gray-400 mb-1">Avg Response Time</p>
              <p className="text-2xl font-bold text-cyan-400">340ms</p>
            </div>

            <div className="bg-[#0A0E1A]/50 rounded-lg p-4 border border-slate-700/50">
              <p className="text-xs text-gray-400 mb-1">Workflows Today</p>
              <p className="text-2xl font-bold text-blue-400">47</p>
            </div>

            <div className="bg-[#0A0E1A]/50 rounded-lg p-4 border border-slate-700/50">
              <p className="text-xs text-gray-400 mb-1">Systems Provisioned</p>
              <p className="text-2xl font-bold text-purple-400">280+</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orchestration Runs */}
      <div className="mt-6 bg-[#0F1629]/50 border border-cyan-500/10 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={20} className="text-cyan-400" />
          <h2 className="text-xl font-bold text-white">Recent Orchestration Runs</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Workflow</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Started</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Duration</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Systems</th>
              </tr>
            </thead>
            <tbody>
              {orchestrationRuns.map((run) => (
                <tr key={run.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                  <td className="py-3 px-4 text-white font-medium">{run.workflow}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-semibold px-2 py-1 rounded border ${getStatusColor(run.status)}`}>
                      {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400">{run.startTime}</td>
                  <td className="py-3 px-4 text-gray-400">{run.duration}</td>
                  <td className="py-3 px-4 text-cyan-400 font-semibold">{run.systemsProvisioned}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Hint */}
      <div className="mt-8 text-center text-xs text-gray-500">
        <p>Press <kbd className="bg-slate-700 px-2 py-1 rounded text-gray-300 font-mono">⌘K</kbd> or <kbd className="bg-slate-700 px-2 py-1 rounded text-gray-300 font-mono">Ctrl+K</kbd> from anywhere to return to Aria Command Center</p>
      </div>
    </div>
  );
}
