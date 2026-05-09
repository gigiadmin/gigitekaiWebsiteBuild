import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, ExternalLink, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface JiraIssue {
  key: string;
  summary: string;
  status: string;
  priority: string;
  assignee?: string;
  created: string;
  updated: string;
}

interface JiraMetrics {
  totalIssues: number;
  openIssues: number;
  inProgressIssues: number;
  doneIssues: number;
  highPriorityIssues: number;
  lastSync: string;
}

export default function JiraDashboard() {
  const [metrics, setMetrics] = useState<JiraMetrics | null>(null);
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Jira data
  const fetchJiraData = async () => {
    try {
      setLoading(true);
      setError(null);

      // In production, this would call a tRPC endpoint
      // For now, show placeholder data
      const mockMetrics: JiraMetrics = {
        totalIssues: 6,
        openIssues: 4,
        inProgressIssues: 1,
        doneIssues: 1,
        highPriorityIssues: 1,
        lastSync: new Date().toISOString()
      };

      const mockIssues: JiraIssue[] = [
        {
          key: 'GBD-1',
          summary: 'Fix Cloudflare WAF blocking mobile access',
          status: 'To Do',
          priority: 'High',
          assignee: 'Harry',
          created: '2026-05-09T22:00:00Z',
          updated: '2026-05-09T22:00:00Z'
        },
        {
          key: 'GBD-2',
          summary: 'Fix LinkedIn OAuth redirect URI mismatch',
          status: 'In Progress',
          priority: 'Medium',
          assignee: 'Harry',
          created: '2026-05-09T22:05:00Z',
          updated: '2026-05-09T22:30:00Z'
        },
        {
          key: 'GBD-3',
          summary: 'Fix Twitter/X OAuth callback error',
          status: 'To Do',
          priority: 'Medium',
          assignee: 'Unassigned',
          created: '2026-05-09T22:10:00Z',
          updated: '2026-05-09T22:10:00Z'
        },
        {
          key: 'GBD-4',
          summary: 'Fix Facebook OAuth connection',
          status: 'To Do',
          priority: 'Medium',
          assignee: 'Unassigned',
          created: '2026-05-09T22:15:00Z',
          updated: '2026-05-09T22:15:00Z'
        },
        {
          key: 'GBD-5',
          summary: 'Test all social OAuth connections',
          status: 'To Do',
          priority: 'Medium',
          assignee: 'Unassigned',
          created: '2026-05-09T22:20:00Z',
          updated: '2026-05-09T22:20:00Z'
        },
        {
          key: 'GBD-6',
          summary: 'Plan TikTok and YouTube integration',
          status: 'Done',
          priority: 'Low',
          assignee: 'Harry',
          created: '2026-05-09T22:25:00Z',
          updated: '2026-05-09T22:40:00Z'
        }
      ];

      setMetrics(mockMetrics);
      setIssues(mockIssues);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch Jira data');
    } finally {
      setLoading(false);
    }
  };

  // Trigger manual sync
  const handleSync = async () => {
    try {
      setSyncing(true);
      // In production, this would call a tRPC endpoint to trigger sync
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      await fetchJiraData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchJiraData();
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-500/20 text-red-700 border-red-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
      case 'low':
        return 'bg-green-500/20 text-green-700 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-700 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Done':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'In Progress':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'To Do':
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Done':
        return 'bg-green-500/20 text-green-700 border-green-500/30';
      case 'In Progress':
        return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
      case 'To Do':
        return 'bg-gray-500/20 text-gray-700 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-700 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Jira Dashboard</h1>
            <p className="text-gray-400">GigitekAI Business Development Project</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleSync}
              disabled={syncing}
              variant="outline"
              className="gap-2"
            >
              {syncing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Sync Now
                </>
              )}
            </Button>
            <a
              href="https://gigitekai.atlassian.net/projects/GBD/backlog"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="gap-2">
                <ExternalLink className="w-4 h-4" />
                Open in Jira
              </Button>
            </a>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-red-500/50 bg-red-500/10">
            <CardContent className="pt-6">
              <p className="text-red-400">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Metrics */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          </div>
        ) : metrics ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <Card className="border-slate-700 bg-slate-800/50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-gray-400 text-sm mb-2">Total Issues</p>
                    <p className="text-3xl font-bold text-white">{metrics.totalIssues}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-700 bg-slate-800/50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-gray-400 text-sm mb-2">Open</p>
                    <p className="text-3xl font-bold text-gray-400">{metrics.openIssues}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-700 bg-slate-800/50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-gray-400 text-sm mb-2">In Progress</p>
                    <p className="text-3xl font-bold text-blue-400">{metrics.inProgressIssues}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-700 bg-slate-800/50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-gray-400 text-sm mb-2">Done</p>
                    <p className="text-3xl font-bold text-green-400">{metrics.doneIssues}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-700 bg-slate-800/50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-gray-400 text-sm mb-2">High Priority</p>
                    <p className="text-3xl font-bold text-red-400">{metrics.highPriorityIssues}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Issues Table */}
            <Card className="border-slate-700 bg-slate-800/50">
              <CardHeader>
                <CardTitle className="text-white">Backlog Issues</CardTitle>
                <CardDescription>
                  Last synced: {new Date(metrics.lastSync).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Issue</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Summary</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Priority</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Assignee</th>
                      </tr>
                    </thead>
                    <tbody>
                      {issues.map((issue) => (
                        <tr key={issue.key} className="border-b border-slate-700 hover:bg-slate-700/30 transition">
                          <td className="py-3 px-4">
                            <a
                              href={`https://gigitekai.atlassian.net/browse/${issue.key}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-400 hover:text-cyan-300 font-mono"
                            >
                              {issue.key}
                            </a>
                          </td>
                          <td className="py-3 px-4 text-white max-w-md truncate">{issue.summary}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(issue.status)}
                              <Badge className={`${getStatusColor(issue.status)} border`}>
                                {issue.status}
                              </Badge>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={`${getPriorityColor(issue.priority)} border`}>
                              {issue.priority}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-gray-400">{issue.assignee}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Sync Info */}
            <Card className="mt-6 border-slate-700 bg-slate-800/50">
              <CardHeader>
                <CardTitle className="text-white">Automated Sync</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-gray-300">
                <p>✅ Daily sync enabled at 8:00 AM EDT</p>
                <p>✅ Syncs todo.md items with Jira backlog</p>
                <p>✅ Creates new issues from uncompleted items</p>
                <p>✅ Updates issue status when items change</p>
                <p className="text-sm text-gray-500 pt-3">
                  Script: <code className="bg-slate-900 px-2 py-1 rounded">gigitekai-jira-sync.mjs</code>
                </p>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </div>
  );
}
