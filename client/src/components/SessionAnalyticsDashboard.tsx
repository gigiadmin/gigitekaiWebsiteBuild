/**
 * Remote Assistance Session Analytics Dashboard
 * Real-time metrics, performance monitoring, and insights
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, Clock, Users, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface SessionMetrics {
  sessionId: string;
  duration: number;
  resolution: boolean;
  technician: string;
  client: string;
  sessionType: string;
  timestamp: Date;
  quality: number;
}

interface AggregatedMetrics {
  totalSessions: number;
  averageDuration: number;
  resolutionRate: number;
  averageQuality: number;
  activeNow: number;
  technicians: Array<{
    name: string;
    sessions: number;
    resolutionRate: number;
    avgDuration: number;
  }>;
}

export const SessionAnalyticsDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [metrics, setMetrics] = useState<SessionMetrics[]>([]);
  const [aggregated, setAggregated] = useState<AggregatedMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch analytics data
  const { data: analyticsData } = trpc.remoteAssistanceAnalytics.getAnalytics.useQuery(
    { timeRange },
    { enabled: true }
  );

  useEffect(() => {
    if (analyticsData) {
      setMetrics(analyticsData.sessions || []);
      setAggregated(analyticsData.aggregated);
      setLoading(false);
    }
  }, [analyticsData]);

  // Prepare chart data
  const timeSeriesData = prepareTimeSeriesData(metrics, timeRange);
  const technicianPerformance = prepareTechnicianData(aggregated?.technicians || []);
  const resolutionData = [
    { name: 'Resolved', value: Math.round((aggregated?.resolutionRate || 0) * 100) },
    { name: 'Unresolved', value: 100 - Math.round((aggregated?.resolutionRate || 0) * 100) },
  ];

  const COLORS = ['#00D4FF', '#FF6B6B'];

  return (
    <div className="w-full space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Session Analytics</h1>
        <p className="text-muted-foreground">Real-time monitoring and performance insights</p>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2">
        {(['24h', '7d', '30d'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-md transition-colors ${
              timeRange === range
                ? 'bg-cyan-500 text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {range === '24h' ? 'Last 24 Hours' : range === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Active Sessions"
          value={aggregated?.activeNow || 0}
          icon={<Activity className="w-4 h-4" />}
          trend="+12%"
        />
        <MetricCard
          title="Total Sessions"
          value={aggregated?.totalSessions || 0}
          icon={<Users className="w-4 h-4" />}
          trend="+8%"
        />
        <MetricCard
          title="Avg Duration"
          value={`${Math.round(aggregated?.averageDuration || 0)}m`}
          icon={<Clock className="w-4 h-4" />}
          trend="-5%"
        />
        <MetricCard
          title="Resolution Rate"
          value={`${Math.round((aggregated?.resolutionRate || 0) * 100)}%`}
          icon={<CheckCircle className="w-4 h-4" />}
          trend="+3%"
        />
      </div>

      {/* Charts */}
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timeline">Session Timeline</TabsTrigger>
          <TabsTrigger value="technicians">Technician Performance</TabsTrigger>
          <TabsTrigger value="resolution">Resolution Rate</TabsTrigger>
        </TabsList>

        {/* Timeline Chart */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Session Activity Over Time</CardTitle>
              <CardDescription>Number of sessions and average quality</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="sessions"
                    stroke="#00D4FF"
                    name="Sessions"
                  />
                  <Line
                    type="monotone"
                    dataKey="quality"
                    stroke="#4ADE80"
                    name="Avg Quality"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Technician Performance Chart */}
        <TabsContent value="technicians">
          <Card>
            <CardHeader>
              <CardTitle>Technician Performance</CardTitle>
              <CardDescription>Sessions and resolution rates by technician</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={technicianPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sessions" fill="#00D4FF" name="Sessions" />
                  <Bar dataKey="resolution" fill="#4ADE80" name="Resolution Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resolution Rate Chart */}
        <TabsContent value="resolution">
          <Card>
            <CardHeader>
              <CardTitle>Overall Resolution Rate</CardTitle>
              <CardDescription>Percentage of resolved vs unresolved sessions</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={resolutionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {resolutionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detailed Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
          <CardDescription>Detailed view of all sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Session ID</th>
                  <th className="text-left py-2 px-4">Technician</th>
                  <th className="text-left py-2 px-4">Client</th>
                  <th className="text-left py-2 px-4">Duration</th>
                  <th className="text-left py-2 px-4">Type</th>
                  <th className="text-left py-2 px-4">Quality</th>
                  <th className="text-left py-2 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {metrics.slice(0, 10).map((session) => (
                  <tr key={session.sessionId} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-4 font-mono text-xs">{session.sessionId.slice(0, 8)}</td>
                    <td className="py-2 px-4">{session.technician}</td>
                    <td className="py-2 px-4">{session.client}</td>
                    <td className="py-2 px-4">{session.duration}m</td>
                    <td className="py-2 px-4">
                      <span className="px-2 py-1 rounded-md bg-muted text-xs">
                        {session.sessionType}
                      </span>
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cyan-500"
                            style={{ width: `${session.quality}%` }}
                          />
                        </div>
                        <span className="text-xs">{session.quality}%</span>
                      </div>
                    </td>
                    <td className="py-2 px-4">
                      {session.resolution ? (
                        <span className="flex items-center gap-1 text-green-500">
                          <CheckCircle className="w-4 h-4" /> Resolved
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-500">
                          <AlertCircle className="w-4 h-4" /> Unresolved
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quality Alerts */}
      <Card className="border-amber-500/50 bg-amber-50/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Quality Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              • 3 sessions with quality below 70% in the last 24 hours
            </p>
            <p className="text-muted-foreground">
              • Average resolution time increased by 12% this week
            </p>
            <p className="text-muted-foreground">
              • 1 technician with resolution rate below 80%
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Metric Card Component
 */
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, trend }) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-2">{value}</p>
          <p className="text-xs text-green-500 mt-2">{trend} from last period</p>
        </div>
        <div className="p-2 bg-cyan-500/10 rounded-md text-cyan-500">{icon}</div>
      </div>
    </CardContent>
  </Card>
);

/**
 * Prepare time series data for chart
 */
function prepareTimeSeriesData(metrics: SessionMetrics[], timeRange: string) {
  const grouped: Record<string, { sessions: number; quality: number; count: number }> = {};

  metrics.forEach((metric) => {
    const date = new Date(metric.timestamp);
    let key: string;

    if (timeRange === '24h') {
      key = date.getHours() + ':00';
    } else if (timeRange === '7d') {
      key = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } else {
      key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    if (!grouped[key]) {
      grouped[key] = { sessions: 0, quality: 0, count: 0 };
    }

    grouped[key].sessions++;
    grouped[key].quality += metric.quality;
    grouped[key].count++;
  });

  return Object.entries(grouped).map(([time, data]) => ({
    time,
    sessions: data.sessions,
    quality: Math.round(data.quality / data.count),
  }));
}

/**
 * Prepare technician performance data
 */
function prepareTechnicianData(technicians: any[]) {
  return technicians.map((tech) => ({
    name: tech.name,
    sessions: tech.sessions,
    resolution: Math.round(tech.resolutionRate * 100),
  }));
}

export default SessionAnalyticsDashboard;
