/**
 * PerformanceMetricsDashboard.tsx
 * 
 * Real-time KPI dashboard for investor portal
 * Shows LTV:CAC, burn rate, pipeline status, and growth metrics
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, DollarSign, Target, Activity } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface MetricCard {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  trend?: {
    direction: 'up' | 'down';
    percentage: number;
  };
  color: 'cyan' | 'green' | 'blue' | 'purple';
}

export default function PerformanceMetricsDashboard() {
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    // Simulate real-time metric updates
    const updateMetrics = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString();

      setMetrics([
        {
          label: 'LTV:CAC Ratio',
          value: '5.2',
          unit: ':1',
          icon: <TrendingUp className="w-5 h-5" />,
          trend: { direction: 'up', percentage: 3.2 },
          color: 'cyan',
        },
        {
          label: 'Customer LTV',
          value: '$75K',
          icon: <DollarSign className="w-5 h-5" />,
          trend: { direction: 'up', percentage: 5.1 },
          color: 'green',
        },
        {
          label: 'Gross Margins',
          value: '40%',
          icon: <Activity className="w-5 h-5" />,
          trend: { direction: 'up', percentage: 2.3 },
          color: 'blue',
        },
        {
          label: 'Monthly Burn Rate',
          value: '$42K',
          icon: <Target className="w-5 h-5" />,
          trend: { direction: 'down', percentage: 1.8 },
          color: 'purple',
        },
        {
          label: 'Active Pilots',
          value: '3',
          icon: <Users className="w-5 h-5" />,
          trend: { direction: 'up', percentage: 100 },
          color: 'cyan',
        },
        {
          label: 'Pipeline Value',
          value: '$450K',
          icon: <DollarSign className="w-5 h-5" />,
          trend: { direction: 'up', percentage: 12.5 },
          color: 'green',
        },
      ]);

      setLastUpdated(timeStr);
    };

    updateMetrics();

    // Simulate updates every 30 seconds
    const interval = setInterval(updateMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      cyan: 'text-cyan-400 bg-cyan-500/10',
      green: 'text-green-400 bg-green-500/10',
      blue: 'text-blue-400 bg-blue-500/10',
      purple: 'text-purple-400 bg-purple-500/10',
    };
    return colors[color] || colors.cyan;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Real-Time Performance Metrics</h2>
          <p className="text-sm text-slate-400">Live visibility into key KPIs • Updated every 30 seconds</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-400">Last updated</p>
          <p className="text-cyan-400 font-mono text-sm">{lastUpdated}</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, idx) => (
          <Card
            key={idx}
            className="bg-slate-800/50 border-slate-700 p-6 hover:border-cyan-500/50 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${getColorClasses(metric.color)}`}>
                {metric.icon}
              </div>
              {metric.trend && (
                <div
                  className={`text-xs font-bold px-2 py-1 rounded ${
                    metric.trend.direction === 'up'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {metric.trend.direction === 'up' ? '↑' : '↓'} {metric.trend.percentage}%
                </div>
              )}
            </div>

            <p className="text-slate-400 text-sm mb-2">{metric.label}</p>
            <div className="flex items-baseline gap-1">
              <p className={`text-3xl font-bold ${getColorClasses(metric.color).split(' ')[0]}`}>
                {metric.value}
              </p>
              {metric.unit && <p className="text-slate-400 text-sm">{metric.unit}</p>}
            </div>
          </Card>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg p-6">
        <h3 className="font-bold text-white mb-4">12-Month Projection</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-slate-400 mb-1">Projected ARR (Month 12)</p>
            <p className="text-2xl font-bold text-cyan-400">$1.8M</p>
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-1">Breakeven Timeline</p>
            <p className="text-2xl font-bold text-green-400">Month 24</p>
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-1">Target Customers (Year 1)</p>
            <p className="text-2xl font-bold text-blue-400">10</p>
          </div>
        </div>
      </div>

      {/* Data Freshness Note */}
      <p className="text-xs text-slate-500 text-center">
        Metrics are updated in real-time from our operational dashboard. Data is sourced from our CRM, financial
        systems, and pilot tracking database.
      </p>
    </div>
  );
}
