/**
 * Enterprise Remote Assistance Admin Dashboard
 * Session monitoring, analytics, and compliance reporting
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Activity,
  Users,
  Clock,
  TrendingUp,
  AlertCircle,
  Lock,
  Download,
  Filter,
  Search,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';

/**
 * Session Statistics Card
 */
const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  color?: string;
}> = ({ title, value, icon, trend, color = 'bg-blue-100' }) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {trend !== undefined && (
            <p className={`text-xs mt-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last period
            </p>
          )}
        </div>
        <div className={`${color} p-3 rounded-lg`}>{icon}</div>
      </div>
    </CardContent>
  </Card>
);

/**
 * Main Dashboard Component
 */
export const RemoteAssistanceDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('week');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for charts
  const sessionTrendData = [
    { date: 'Mon', sessions: 12, resolved: 10 },
    { date: 'Tue', sessions: 19, resolved: 15 },
    { date: 'Wed', sessions: 15, resolved: 12 },
    { date: 'Thu', sessions: 25, resolved: 22 },
    { date: 'Fri', sessions: 22, resolved: 20 },
    { date: 'Sat', sessions: 8, resolved: 7 },
    { date: 'Sun', sessions: 5, resolved: 5 },
  ];

  const sessionTypeData = [
    { name: 'Screen Share Only', value: 45 },
    { name: 'Remote Control', value: 35 },
    { name: 'File Transfer', value: 15 },
    { name: 'Collaborative', value: 5 },
  ];

  const technicianPerformance = [
    { name: 'John Smith', sessions: 28, avgResolutionTime: 18, satisfaction: 4.8 },
    { name: 'Sarah Johnson', sessions: 24, avgResolutionTime: 22, satisfaction: 4.7 },
    { name: 'Mike Davis', sessions: 19, avgResolutionTime: 25, satisfaction: 4.5 },
    { name: 'Emily Brown', sessions: 15, avgResolutionTime: 20, satisfaction: 4.9 },
  ];

  const COLORS = ['#00D4FF', '#0EA5E9', '#06B6D4', '#14B8A6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Remote Assistance Dashboard</h1>
          <p className="text-muted-foreground mt-1">Monitor sessions, analytics, and compliance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="flex gap-2">
        {(['today', 'week', 'month'] as const).map((range) => (
          <Button
            key={range}
            variant={dateRange === range ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange(range)}
          >
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </Button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Sessions"
          value="12"
          icon={<Activity className="w-6 h-6 text-blue-600" />}
          trend={15}
          color="bg-blue-100"
        />
        <StatCard
          title="Total Technicians"
          value="24"
          icon={<Users className="w-6 h-6 text-cyan-600" />}
          trend={5}
          color="bg-cyan-100"
        />
        <StatCard
          title="Avg Resolution Time"
          value="21m"
          icon={<Clock className="w-6 h-6 text-green-600" />}
          trend={-8}
          color="bg-green-100"
        />
        <StatCard
          title="Compliance Score"
          value="99.8%"
          icon={<Lock className="w-6 h-6 text-purple-600" />}
          trend={2}
          color="bg-purple-100"
        />
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="types">Session Types</TabsTrigger>
          <TabsTrigger value="technicians">Technicians</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Trends Tab */}
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Session Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={sessionTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="sessions"
                    stroke="#00D4FF"
                    strokeWidth={2}
                    name="Total Sessions"
                  />
                  <Line
                    type="monotone"
                    dataKey="resolved"
                    stroke="#0EA5E9"
                    strokeWidth={2}
                    name="Resolved"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Session Types Tab */}
        <TabsContent value="types">
          <Card>
            <CardHeader>
              <CardTitle>Session Types Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sessionTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sessionTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Technicians Tab */}
        <TabsContent value="technicians">
          <Card>
            <CardHeader>
              <CardTitle>Technician Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {technicianPerformance.map((tech) => (
                  <div key={tech.name} className="flex items-center justify-between p-3 bg-muted rounded">
                    <div>
                      <p className="font-semibold">{tech.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {tech.sessions} sessions • {tech.avgResolutionTime}m avg time
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">{tech.satisfaction}/5</p>
                      <p className="text-xs text-muted-foreground">Satisfaction</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Encryption Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>AES-256-GCM Encrypted</span>
                    <span className="text-green-600 font-semibold">100%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Sessions Audited</span>
                    <span className="text-green-600 font-semibold">100%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Unauthorized Attempts</span>
                    <span className="text-green-600 font-semibold">0</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Compliance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>GDPR Compliant</span>
                    <span className="text-green-600 font-semibold">✓</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>HIPAA Compliant</span>
                    <span className="text-green-600 font-semibold">✓</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>SOC 2 Compliant</span>
                    <span className="text-green-600 font-semibold">✓</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Active Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-border rounded text-sm"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Session ID</th>
                  <th className="text-left py-2 px-3">Technician</th>
                  <th className="text-left py-2 px-3">Client</th>
                  <th className="text-left py-2 px-3">Type</th>
                  <th className="text-left py-2 px-3">Duration</th>
                  <th className="text-left py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    id: 'SES-001',
                    tech: 'John Smith',
                    client: 'Acme Corp',
                    type: 'Remote Control',
                    duration: '18m',
                    status: 'Active',
                  },
                  {
                    id: 'SES-002',
                    tech: 'Sarah Johnson',
                    client: 'TechStart Inc',
                    type: 'Screen Share',
                    duration: '12m',
                    status: 'Active',
                  },
                  {
                    id: 'SES-003',
                    tech: 'Mike Davis',
                    client: 'Global Solutions',
                    type: 'File Transfer',
                    duration: '5m',
                    status: 'Active',
                  },
                ].map((session) => (
                  <tr key={session.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-3 font-mono text-xs">{session.id}</td>
                    <td className="py-3 px-3">{session.tech}</td>
                    <td className="py-3 px-3">{session.client}</td>
                    <td className="py-3 px-3">{session.type}</td>
                    <td className="py-3 px-3">{session.duration}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                        {session.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RemoteAssistanceDashboard;
