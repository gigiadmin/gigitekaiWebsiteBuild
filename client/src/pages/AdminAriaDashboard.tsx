/**
 * Aria AI Dashboard — Central Hub for All Aria Features
 * Organizes Command Center, voice control, intents, sessions, logs, and analytics
 * Provides quick access, real-time status, and feature toggles
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import {
  Brain,
  Zap,
  Settings,
  BarChart3,
  MessageSquare,
  Users,
  Clock,
  Activity,
  ChevronRight,
  Plus,
  Play,
  Pause,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Mic,
  BookOpen,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface FeatureCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  status: 'active' | 'idle' | 'offline';
  stats?: { label: string; value: string | number }[];
  action?: { label: string; onClick: () => void };
}

interface SystemMetric {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
}

export default function AdminAriaDashboard() {
  const [, navigate] = useLocation();
  const [refreshing, setRefreshing] = useState(false);
  const [ariaStatus, setAriaStatus] = useState<'online' | 'degraded' | 'offline'>('online');
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([
    { label: 'Uptime', value: '99.8%', trend: 'stable', trendValue: '+0.1%' },
    { label: 'Response Time', value: '245ms', unit: 'avg', trend: 'down', trendValue: '-12ms' },
    { label: 'Active Sessions', value: 12, trend: 'up', trendValue: '+3' },
    { label: 'LLM Cache Hit Rate', value: '68%', trend: 'up', trendValue: '+8%' },
    { label: 'TTS Cache Hit Rate', value: '72%', trend: 'up', trendValue: '+5%' },
    { label: 'Email Polling Interval', value: '8h', unit: '3x daily', trend: 'stable' },
  ]);

  const featureCards: FeatureCard[] = [
    {
      id: 'command-center',
      title: 'Command Center',
      description: 'AI orchestrator for system management and automation',
      icon: <Brain size={24} className="text-cyan-400" />,
      href: '/admin/aria',
      status: 'active',
      stats: [
        { label: 'Active Conversations', value: 3 },
        { label: 'Avg Response Time', value: '245ms' },
        { label: 'Session Duration', value: '18min' },
      ],
      action: { label: 'Open', onClick: () => navigate('/admin/aria') },
    },
    {
      id: 'voice-control',
      title: 'Voice Control',
      description: 'Voice input/output with transcription and TTS',
      icon: <Mic size={24} className="text-cyan-400" />,
      href: '#voice',
      status: 'active',
      stats: [
        { label: 'Transcription Accuracy', value: '94.2%' },
        { label: 'TTS Cache Hit Rate', value: '72%' },
        { label: 'Avg Audio Latency', value: '120ms' },
      ],
      action: { label: 'Settings', onClick: () => {} },
    },
    {
      id: 'custom-intents',
      title: 'Custom Intents',
      description: 'Train and manage custom AI intents for specific workflows',
      icon: <Zap size={24} className="text-cyan-400" />,
      href: '/admin/aria-intents',
      status: 'active',
      stats: [
        { label: 'Total Intents', value: 24 },
        { label: 'Training Examples', value: 156 },
        { label: 'Accuracy', value: '91.3%' },
      ],
      action: { label: 'Manage', onClick: () => navigate('/admin/aria-intents') },
    },
    {
      id: 'sessions',
      title: 'Live Sessions',
      description: 'Monitor and manage active Aria conversations',
      icon: <MessageSquare size={24} className="text-cyan-400" />,
      href: '/admin/aria-sessions',
      status: 'active',
      stats: [
        { label: 'Active Sessions', value: 12 },
        { label: 'Avg Duration', value: '18min' },
        { label: 'Satisfaction', value: '4.7/5' },
      ],
      action: { label: 'View All', onClick: () => navigate('/admin/aria-sessions') },
    },
    {
      id: 'logs',
      title: 'Activity Logs',
      description: 'Audit trail of all Aria interactions and system events',
      icon: <Clock size={24} className="text-cyan-400" />,
      href: '/admin/aria-logs',
      status: 'active',
      stats: [
        { label: 'Total Events', value: '12.4K' },
        { label: 'Last 24h', value: '2.1K' },
        { label: 'Error Rate', value: '0.3%' },
      ],
      action: { label: 'View Logs', onClick: () => navigate('/admin/aria-logs') },
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'Performance metrics, usage patterns, and insights',
      icon: <BarChart3 size={24} className="text-cyan-400" />,
      href: '#analytics',
      status: 'active',
      stats: [
        { label: 'Total Queries', value: '8.2K' },
        { label: 'Avg Satisfaction', value: '4.6/5' },
        { label: 'Cost Savings', value: '73%' },
      ],
      action: { label: 'View Analytics', onClick: () => {} },
    },
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    await new Promise(r => setTimeout(r, 1000));
    setRefreshing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
              <Brain size={32} className="text-cyan-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                Aria AI Dashboard
                <Badge variant={ariaStatus === 'online' ? 'default' : 'destructive'} className="ml-2">
                  {ariaStatus === 'online' ? '🟢 Online' : ariaStatus === 'degraded' ? '🟡 Degraded' : '🔴 Offline'}
                </Badge>
              </h1>
              <p className="text-slate-400 mt-1">Central hub for AI orchestration and management</p>
            </div>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2 bg-cyan-600 hover:bg-cyan-700"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {/* System Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {systemMetrics.map((metric, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/30 transition-colors"
            >
              <div className="text-xs text-slate-400 mb-1">{metric.label}</div>
              <div className="flex items-end justify-between">
                <div className="text-lg font-bold text-white">
                  {metric.value}
                  {metric.unit && <span className="text-xs text-slate-400 ml-1">{metric.unit}</span>}
                </div>
                {metric.trend && (
                  <div className={`text-xs flex items-center gap-0.5 ${
                    metric.trend === 'up' ? 'text-green-400' :
                    metric.trend === 'down' ? 'text-orange-400' :
                    'text-slate-400'
                  }`}>
                    {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}
                    {metric.trendValue}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {featureCards.map((card) => (
          <div
            key={card.id}
            className="group relative rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 hover:border-cyan-500/50 transition-all hover:shadow-lg hover:shadow-cyan-500/10 overflow-hidden"
          >
            {/* Background glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Content */}
            <div className="relative p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-700/50 group-hover:bg-cyan-500/20 transition-colors">
                    {card.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{card.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{card.description}</p>
                  </div>
                </div>
                <Badge
                  variant={card.status === 'active' ? 'default' : card.status === 'idle' ? 'secondary' : 'destructive'}
                  className="text-xs"
                >
                  {card.status === 'active' ? '✓ Active' : card.status === 'idle' ? 'Idle' : 'Offline'}
                </Badge>
              </div>

              {/* Stats */}
              {card.stats && card.stats.length > 0 && (
                <div className="mb-4 space-y-1.5 text-xs">
                  {card.stats.map((stat, idx) => (
                    <div key={idx} className="flex justify-between text-slate-300">
                      <span className="text-slate-400">{stat.label}</span>
                      <span className="font-semibold text-cyan-400">{stat.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Button */}
              {card.action && (
                <Button
                  onClick={card.action.onClick}
                  className="w-full gap-2 bg-cyan-600/80 hover:bg-cyan-600 text-white text-sm h-8"
                >
                  {card.action.label}
                  <ChevronRight size={14} />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* Cost Optimization */}
        <div className="lg:col-span-2 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <TrendingUp size={18} className="text-green-400" />
              Cost Optimization
            </h3>
            <Badge variant="outline" className="text-green-400 border-green-400/50">
              73% Savings Active
            </Badge>
          </div>
          <div className="space-y-2 text-sm text-slate-300">
            <div className="flex items-center justify-between p-2 rounded bg-slate-700/30">
              <span>Email Polling Frequency</span>
              <span className="text-cyan-400 font-semibold">3x daily (8h interval)</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-700/30">
              <span>LLM Response Caching</span>
              <span className="text-cyan-400 font-semibold">40-60% savings</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-700/30">
              <span>TTS Audio Caching</span>
              <span className="text-cyan-400 font-semibold">30-50% savings</span>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 p-5">
          <h3 className="font-bold text-white flex items-center gap-2 mb-4">
            <Activity size={18} className="text-green-400" />
            System Health
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Uptime</span>
              <span className="text-green-400 font-semibold">99.8%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Response Time</span>
              <span className="text-green-400 font-semibold">245ms</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Error Rate</span>
              <span className="text-green-400 font-semibold">0.3%</span>
            </div>
            <Button
              variant="outline"
              className="w-full mt-3 text-xs border-slate-600 hover:border-cyan-500/50"
              onClick={() => navigate('/admin/uptime')}
            >
              View Full Status
            </Button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 p-5">
        <h3 className="font-bold text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[
            { time: '2 min ago', action: 'Aria responded to ticket #2847', status: 'success' },
            { time: '8 min ago', action: 'LLM cache hit: 68% (3.2K queries)', status: 'success' },
            { time: '15 min ago', action: 'TTS audio cached: 2.1MB', status: 'success' },
            { time: '1 hour ago', action: 'Email polling completed (3x daily)', status: 'success' },
            { time: '2 hours ago', action: 'Custom intent trained: M365 Provisioning', status: 'success' },
          ].map((activity, idx) => (
            <div key={idx} className="flex items-center gap-3 p-2 rounded hover:bg-slate-700/30 transition-colors">
              <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-300 truncate">{activity.action}</p>
                <p className="text-xs text-slate-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
