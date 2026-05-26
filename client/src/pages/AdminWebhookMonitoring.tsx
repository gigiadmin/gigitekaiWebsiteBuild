import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, RefreshCw, TrendingUp } from 'lucide-react';

interface WebhookStatus {
  endpoint: {
    id: number;
    name: string;
    type: string;
    isActive: number;
  };
  state: {
    alertStatus: string;
    consecutiveFailures: number;
    lastFailureTime: string | null;
    lastSuccessTime: string | null;
  };
  recentChecks: Array<{
    httpStatus: number | null;
    responseTime: number;
    isSuccess: number;
    errorMessage: string | null;
    checkTimestamp: string;
  }>;
  uptime: {
    totalChecks: number;
    successCount: number;
    failureCount: number;
    uptime: number;
  };
}

export default function AdminWebhookMonitoring() {
  const [webhooks, setWebhooks] = useState<WebhookStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch webhook statuses
  const { data: webhookData } = trpc.webhooks.getAllStatuses.useQuery();
  const testWebhookMutation = trpc.webhooks.testWebhook.useMutation();

  useEffect(() => {
    if (webhookData) {
      setWebhooks(webhookData as WebhookStatus[]);
      setLoading(false);
    }
  }, [webhookData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Trigger manual health check
      await testWebhookMutation.mutateAsync({ webhookId: undefined });
      // Refetch data
      window.location.reload();
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'degraded':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading webhook monitoring...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Webhook Monitoring</h1>
            <p className="text-gray-600 mt-2">
              Monitor the health and performance of your webhooks
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Checking...' : 'Check Now'}
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="text-sm text-gray-600">Total Webhooks</div>
            <div className="text-3xl font-bold mt-2">{webhooks.length}</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-gray-600">Healthy</div>
            <div className="text-3xl font-bold text-green-600 mt-2">
              {webhooks.filter((w) => w.state?.alertStatus === 'healthy').length}
            </div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-gray-600">Degraded</div>
            <div className="text-3xl font-bold text-yellow-600 mt-2">
              {webhooks.filter((w) => w.state?.alertStatus === 'degraded').length}
            </div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-gray-600">Critical</div>
            <div className="text-3xl font-bold text-red-600 mt-2">
              {webhooks.filter((w) => w.state?.alertStatus === 'critical').length}
            </div>
          </Card>
        </div>

        {/* Webhook Details */}
        <div className="space-y-6">
          {webhooks.map((webhook) => (
            <Card key={webhook.endpoint.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  {getStatusIcon(webhook.state?.alertStatus || 'unknown')}
                  <div>
                    <h2 className="text-xl font-semibold">{webhook.endpoint.name}</h2>
                    <p className="text-sm text-gray-600">{webhook.endpoint.type}</p>
                  </div>
                </div>
                <Badge className={getStatusColor(webhook.state?.alertStatus || 'unknown')}>
                  {webhook.state?.alertStatus || 'unknown'}
                </Badge>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <div className="text-sm text-gray-600">Uptime (24h)</div>
                  <div className="text-2xl font-bold mt-1">
                    {webhook.uptime?.uptime.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                  <div className="text-2xl font-bold text-green-600 mt-1">
                    {webhook.uptime?.successCount}/{webhook.uptime?.totalChecks}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Failures</div>
                  <div className="text-2xl font-bold text-red-600 mt-1">
                    {webhook.state?.consecutiveFailures || 0}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Last Check</div>
                  <div className="text-sm font-mono mt-1">
                    {webhook.recentChecks?.[0]?.checkTimestamp
                      ? new Date(webhook.recentChecks[0].checkTimestamp).toLocaleTimeString()
                      : 'Never'}
                  </div>
                </div>
              </div>

              {/* Recent Checks */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Recent Checks (Last 10)
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {webhook.recentChecks?.map((check, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded text-sm"
                    >
                      <div className="flex items-center gap-3">
                        {check.isSuccess === 1 ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        )}
                        <div>
                          <div className="font-mono">
                            {check.isSuccess === 1 ? 'Success' : 'Failed'} - HTTP{' '}
                            {check.httpStatus || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-600">
                            {new Date(check.checkTimestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-gray-600">{check.responseTime}ms</div>
                        {check.errorMessage && (
                          <div className="text-xs text-red-600 truncate max-w-xs">
                            {check.errorMessage}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Last Status Change */}
              <div className="mt-4 pt-4 border-t text-sm text-gray-600">
                {webhook.state?.lastSuccessTime && (
                  <div>
                    Last success: {new Date(webhook.state.lastSuccessTime).toLocaleString()}
                  </div>
                )}
                {webhook.state?.lastFailureTime && (
                  <div className="text-red-600">
                    Last failure: {new Date(webhook.state.lastFailureTime).toLocaleString()}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
