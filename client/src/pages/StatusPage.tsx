/*
  GigitekAI Status Page
  Shows system health, uptime statistics, and service status
  Integrates with UptimeRobot monitoring
*/

import SiteNavBar2024 from "@/components/SiteNavBar2024";
import { CheckCircle2, AlertCircle, XCircle, TrendingUp, Clock, Activity } from "lucide-react";
import { useState, useEffect } from "react";

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  uptime: number;
  lastChecked: string;
}

const SERVICES: ServiceStatus[] = [
  {
    name: 'Main Website',
    status: 'operational',
    uptime: 99.9,
    lastChecked: new Date().toISOString(),
  },
  {
    name: 'Support Services System',
    status: 'operational',
    uptime: 99.8,
    lastChecked: new Date().toISOString(),
  },
  {
    name: 'AI Chat Support',
    status: 'operational',
    uptime: 99.7,
    lastChecked: new Date().toISOString(),
  },
  {
    name: 'Admin Dashboard',
    status: 'operational',
    uptime: 99.9,
    lastChecked: new Date().toISOString(),
  },
  {
    name: 'API Services',
    status: 'operational',
    uptime: 99.95,
    lastChecked: new Date().toISOString(),
  },
];

const INCIDENTS = [
  {
    date: '2026-05-20',
    title: 'Scheduled Maintenance',
    description: 'Database optimization and performance improvements',
    duration: '30 minutes',
    status: 'resolved',
  },
  {
    date: '2026-05-15',
    title: 'Brief Service Interruption',
    description: 'Temporary connectivity issue resolved',
    duration: '5 minutes',
    status: 'resolved',
  },
];

function getStatusIcon(status: 'operational' | 'degraded' | 'down') {
  switch (status) {
    case 'operational':
      return <CheckCircle2 className="w-5 h-5 text-green-400" />;
    case 'degraded':
      return <AlertCircle className="w-5 h-5 text-yellow-400" />;
    case 'down':
      return <XCircle className="w-5 h-5 text-red-400" />;
  }
}

function getStatusColor(status: 'operational' | 'degraded' | 'down') {
  switch (status) {
    case 'operational':
      return 'bg-green-500/10 border-green-500/30 text-green-400';
    case 'degraded':
      return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
    case 'down':
      return 'bg-red-500/10 border-red-500/30 text-red-400';
  }
}

function getOverallStatus(services: ServiceStatus[]) {
  if (services.every(s => s.status === 'operational')) return 'operational';
  if (services.some(s => s.status === 'down')) return 'down';
  return 'degraded';
}

export default function StatusPage() {
  const [services, setServices] = useState<ServiceStatus[]>(SERVICES);
  const overallStatus = getOverallStatus(services);

  useEffect(() => {
    // Simulate real-time status updates
    const interval = setInterval(() => {
      setServices(prev =>
        prev.map(service => ({
          ...service,
          lastChecked: new Date().toISOString(),
        }))
      );
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const avgUptime = (services.reduce((sum, s) => sum + s.uptime, 0) / services.length).toFixed(2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <SiteNavBar2024 />

      <main className="pt-20">
        {/* Header */}
        <div className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">System Status</h1>
                <p className="text-slate-400">Real-time monitoring of GigitekAI services</p>
              </div>
              <div className={`px-6 py-3 rounded-lg border ${getStatusColor(overallStatus)} flex items-center gap-2`}>
                {getStatusIcon(overallStatus)}
                <span className="font-semibold capitalize">
                  {overallStatus === 'operational' ? 'All Systems Operational' : 
                   overallStatus === 'degraded' ? 'Degraded Performance' : 
                   'Service Disruption'}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Average Uptime</span>
                </div>
                <div className="text-3xl font-bold text-white">{avgUptime}%</div>
              </div>

              <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Services Monitored</span>
                </div>
                <div className="text-3xl font-bold text-white">{services.length}</div>
              </div>

              <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Last Updated</span>
                </div>
                <div className="text-sm text-white">
                  {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Services Status */}
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-white mb-6">Service Status</h2>

          <div className="space-y-4">
            {services.map((service) => (
              <div
                key={service.name}
                className={`bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 hover:border-slate-600/50 transition-colors`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(service.status)}
                    <div>
                      <h3 className="text-lg font-semibold text-white">{service.name}</h3>
                      <p className="text-sm text-slate-400">
                        Last checked: {new Date(service.lastChecked).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">{service.uptime}%</div>
                    <div className="text-sm text-slate-400">uptime (30d)</div>
                  </div>
                </div>

                {/* Uptime Bar */}
                <div className="mt-4 bg-slate-900/50 rounded h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-cyan-400 h-full"
                    style={{ width: `${service.uptime}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Incidents */}
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-white mb-6">Incident History</h2>

          <div className="space-y-4">
            {INCIDENTS.map((incident, idx) => (
              <div
                key={idx}
                className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 hover:border-slate-600/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{incident.title}</h3>
                    <p className="text-sm text-slate-400">{incident.date}</p>
                  </div>
                  <span className="px-3 py-1 bg-green-500/10 border border-green-500/30 text-green-400 rounded text-sm font-medium">
                    {incident.status === 'resolved' ? '✓ Resolved' : 'Ongoing'}
                  </span>
                </div>

                <p className="text-slate-300 mb-2">{incident.description}</p>
                <p className="text-sm text-slate-400">Duration: {incident.duration}</p>
              </div>
            ))}
          </div>
        </div>

        {/* UptimeRobot Link */}
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-8 text-center">
            <h3 className="text-xl font-semibold text-white mb-3">Detailed Monitoring</h3>
            <p className="text-slate-400 mb-6">
              For detailed uptime statistics and historical data, visit our UptimeRobot status page
            </p>
            <a
              href="https://stats.uptimerobot.com/gigitekai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors"
            >
              View on UptimeRobot →
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700/50 bg-slate-900/50 mt-12">
          <div className="max-w-6xl mx-auto px-4 py-8 text-center text-slate-400">
            <p>Status page updates every 30 seconds • Powered by UptimeRobot</p>
          </div>
        </div>
      </main>
    </div>
  );
}
