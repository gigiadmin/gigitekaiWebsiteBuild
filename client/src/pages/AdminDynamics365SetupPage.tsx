/**
 * AdminDynamics365SetupPage
 * Setup & configuration for Dynamics 365 Contact Center integration.
 * Route: /admin/dynamics365-setup
 *
 * Features:
 * - Connection status & test
 * - Environment variable guide
 * - Sentiment routing rules management
 * - Recent D365 cases preview
 * - Sync settings & automation toggles
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Settings,
  Zap,
  Brain,
  Phone,
  BarChart3,
  Shield,
  Copy,
  ExternalLink,
  Plus,
  Trash2,
  Activity,
  Globe,
  Key,
  Loader2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    healthy: { label: "Connected", cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: <CheckCircle2 size={11} /> },
    not_configured: { label: "Not Configured", cls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: <AlertTriangle size={11} /> },
    error: { label: "Error", cls: "bg-red-500/20 text-red-400 border-red-500/30", icon: <XCircle size={11} /> },
  };
  const s = map[status] ?? map.not_configured;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border font-medium ${s.cls}`}>
      {s.icon}{s.label}
    </span>
  );
}

// ── Config row ────────────────────────────────────────────────────────────────
function ConfigRow({ label, value, secret }: { label: string; value: string | null; secret?: boolean }) {
  const display = secret ? (value ? "••••••••••••" : "Not set") : (value || "Not set");
  const isSet = !!value;
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
      <span className="text-sm text-slate-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-mono ${isSet ? "text-cyan-300" : "text-slate-500"}`}>{display}</span>
        {isSet ? <CheckCircle2 size={14} className="text-emerald-400" /> : <XCircle size={14} className="text-red-400" />}
      </div>
    </div>
  );
}

// ── Env var copy card ─────────────────────────────────────────────────────────
function EnvVarCard({ name, description, example }: { name: string; description: string; example: string }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-3">
      <div className="flex items-center justify-between mb-1">
        <code className="text-xs text-cyan-400 font-mono">{name}</code>
        <button
          onClick={() => { navigator.clipboard.writeText(name); toast.success(`Copied ${name}`); }}
          className="text-slate-500 hover:text-slate-300 transition-colors"
        >
          <Copy size={12} />
        </button>
      </div>
      <p className="text-xs text-slate-400 mb-1">{description}</p>
      <code className="text-xs text-slate-500 font-mono">{example}</code>
    </div>
  );
}

export default function AdminDynamics365SetupPage() {
  const [activeTab, setActiveTab] = useState("status");
  const [newRule, setNewRule] = useState({ name: "", sentimentMin: -1, sentimentMax: -0.3, escalate: true });
  const [autoSync, setAutoSync] = useState(true);
  const [autoCreateCase, setAutoCreateCase] = useState(true);
  const [sentimentEscalation, setSentimentEscalation] = useState(true);

  // Queries
  const connectionQuery = trpc.dynamicsIntegration.checkConnection.useQuery(undefined, { refetchInterval: 30000 });
  const configQuery = trpc.dynamicsIntegration.getConfig.useQuery();
  const sentimentRulesQuery = trpc.dynamicsIntegration.getSentimentConfig.useQuery({ limit: 20 });
  const recentCasesQuery = trpc.dynamicsIntegration.getRecentCases.useQuery({ top: 10 }, {
    enabled: connectionQuery.data?.connected === true,
  });
  const queueMetricsQuery = trpc.dynamicsIntegration.getQueueMetrics.useQuery(undefined, {
    enabled: connectionQuery.data?.connected === true,
    refetchInterval: 30000,
  });

  // Mutations
  const createCaseMutation = trpc.dynamicsIntegration.createDynamicsTicket.useMutation({
    onSuccess: (data) => toast.success(`Test case created: ${data.caseNumber || data.caseId}`),
    onError: (err) => toast.error(`Failed: ${err.message}`),
  });

  const conn = connectionQuery.data;
  const config = configQuery.data;
  const rules = sentimentRulesQuery.data?.rules ?? [];
  const cases = recentCasesQuery.data?.cases ?? [];
  const queueMetrics = queueMetricsQuery.data;

  function handleTestConnection() {
    connectionQuery.refetch();
    toast.info("Testing connection...");
  }

  function handleCreateTestCase() {
    createCaseMutation.mutate({
      subject: "GigitekAI Integration Test Case",
      description: "This is an automated test case created from the GigitekAI admin portal to verify Dynamics 365 integration.",
      priority: "low",
      sentimentScore: 0.5,
    });
  }

  const priorityLabel: Record<number, string> = { 1: "High", 2: "Normal", 3: "Low" };
  const stateLabel: Record<number, string> = { 0: "Active", 1: "Resolved", 2: "Cancelled" };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                  <Globe className="text-cyan-400" size={20} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Dynamics 365 Contact Center</h1>
                  <p className="text-slate-400 text-sm">Setup, configuration & automation</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {conn && <StatusBadge status={conn.status} />}
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                disabled={connectionQuery.isFetching}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                {connectionQuery.isFetching ? <Loader2 size={14} className="animate-spin mr-1" /> : <RefreshCw size={14} className="mr-1" />}
                Test Connection
              </Button>
              <a
                href="https://learn.microsoft.com/en-us/dynamics365/customer-service/contact-center"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
              >
                D365 Docs <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* Quick metrics */}
          {conn?.connected && queueMetrics && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { label: "Active Cases", value: queueMetrics.totalActive, icon: <Activity size={16} />, color: "text-cyan-400" },
                { label: "High Priority", value: queueMetrics.byPriority.high, icon: <TrendingUp size={16} />, color: "text-red-400" },
                { label: "Normal Priority", value: queueMetrics.byPriority.normal, icon: <BarChart3 size={16} />, color: "text-yellow-400" },
                { label: "Low Priority", value: queueMetrics.byPriority.low, icon: <TrendingDown size={16} />, color: "text-emerald-400" },
              ].map((m) => (
                <Card key={m.label} className="bg-slate-800/60 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">{m.label}</span>
                      <span className={m.color}>{m.icon}</span>
                    </div>
                    <div className={`text-2xl font-bold ${m.color}`}>{m.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-slate-800 border border-slate-700 mb-6">
              <TabsTrigger value="status" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                <Activity size={14} className="mr-1" /> Status
              </TabsTrigger>
              <TabsTrigger value="config" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                <Key size={14} className="mr-1" /> Configuration
              </TabsTrigger>
              <TabsTrigger value="sentiment" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                <Brain size={14} className="mr-1" /> Sentiment Routing
              </TabsTrigger>
              <TabsTrigger value="automation" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                <Zap size={14} className="mr-1" /> Automation
              </TabsTrigger>
              <TabsTrigger value="cases" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                <Phone size={14} className="mr-1" /> Recent Cases
              </TabsTrigger>
            </TabsList>

            {/* ── STATUS TAB ── */}
            <TabsContent value="status">
              <div className="grid grid-cols-2 gap-6">
                <Card className="bg-slate-800/60 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <Globe size={18} className="text-cyan-400" /> Connection Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {connectionQuery.isLoading ? (
                      <div className="flex items-center gap-2 text-slate-400"><Loader2 size={16} className="animate-spin" /> Checking connection...</div>
                    ) : conn ? (
                      <>
                        <div className="flex items-center gap-3">
                          <StatusBadge status={conn.status} />
                          <span className="text-sm text-slate-300">{conn.message}</span>
                        </div>
                        {conn.orgUrl && (
                          <div className="bg-slate-900/60 rounded p-3">
                            <p className="text-xs text-slate-500 mb-1">Organization URL</p>
                            <code className="text-xs text-cyan-300 font-mono break-all">{conn.orgUrl}</code>
                          </div>
                        )}
                        {conn.connected && (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-900/60 rounded p-3">
                              <p className="text-xs text-slate-500 mb-1">User ID</p>
                              <code className="text-xs text-slate-300 font-mono">{conn.userId || "—"}</code>
                            </div>
                            <div className="bg-slate-900/60 rounded p-3">
                              <p className="text-xs text-slate-500 mb-1">Org ID</p>
                              <code className="text-xs text-slate-300 font-mono">{conn.orgId || "—"}</code>
                            </div>
                          </div>
                        )}
                        {!conn.connected && (
                          <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
                            <p className="text-xs text-red-400 font-medium mb-1">Connection Failed</p>
                            <p className="text-xs text-slate-400">Check your environment variables below and ensure the app registration has Dynamics 365 API permissions.</p>
                          </div>
                        )}
                      </>
                    ) : null}
                    <Button
                      onClick={handleTestConnection}
                      className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                      disabled={connectionQuery.isFetching}
                    >
                      {connectionQuery.isFetching ? <Loader2 size={14} className="animate-spin mr-2" /> : <RefreshCw size={14} className="mr-2" />}
                      Refresh Connection Test
                    </Button>
                    {conn?.connected && (
                      <Button
                        variant="outline"
                        onClick={handleCreateTestCase}
                        className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                        disabled={createCaseMutation.isPending}
                      >
                        {createCaseMutation.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : <Plus size={14} className="mr-2" />}
                        Create Test Case
                      </Button>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/60 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <Shield size={18} className="text-cyan-400" /> Integration Health
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { label: "D365 OAuth Token", ok: conn?.connected, detail: "Client credentials flow" },
                      { label: "Org URL Configured", ok: !!config?.orgUrl, detail: config?.orgUrl || "Not set" },
                      { label: "Tenant ID", ok: !!config?.tenantId, detail: config?.tenantId ? "Configured" : "Not set" },
                      { label: "Client ID", ok: !!config?.clientId, detail: config?.clientId ? "Configured" : "Not set" },
                      { label: "Client Secret", ok: config?.hasClientSecret, detail: config?.hasClientSecret ? "Configured" : "Not set" },
                      { label: "Copilot Environment", ok: !!config?.copilotEnvironmentId, detail: config?.copilotEnvironmentId || "Not set" },
                      { label: "Contact Center Agent", ok: !!config?.copilotContactCenterAgentId, detail: config?.copilotContactCenterAgentId || "Not set" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-slate-700/50 last:border-0">
                        <div className="flex items-center gap-2">
                          {item.ok ? <CheckCircle2 size={14} className="text-emerald-400" /> : <XCircle size={14} className="text-red-400" />}
                          <span className="text-sm text-slate-300">{item.label}</span>
                        </div>
                        <span className="text-xs text-slate-500 font-mono truncate max-w-[180px]">{item.detail}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ── CONFIG TAB ── */}
            <TabsContent value="config">
              <div className="grid grid-cols-2 gap-6">
                <Card className="bg-slate-800/60 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Current Configuration</CardTitle>
                    <CardDescription className="text-slate-400">
                      Values read from environment variables. Update via the Secrets panel.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {config ? (
                      <div>
                        <ConfigRow label="D365_ORG_URL" value={config.orgUrl} />
                        <ConfigRow label="D365_TENANT_ID" value={config.tenantId} />
                        <ConfigRow label="D365_CLIENT_ID" value={config.clientId} />
                        <ConfigRow label="D365_CLIENT_SECRET" value={config.hasClientSecret ? "set" : null} secret />
                        <ConfigRow label="COPILOT_STUDIO_ENVIRONMENT_ID" value={config.copilotEnvironmentId} />
                        <ConfigRow label="COPILOT_CONTACT_CENTER_AGENT_ID" value={config.copilotContactCenterAgentId} />
                        <ConfigRow label="COPILOT_TICKET_CLASSIFIER_AGENT_ID" value={config.copilotTicketClassifierAgentId} />
                        <ConfigRow label="COPILOT_KB_QA_AGENT_ID" value={config.copilotKbQaAgentId} />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-400"><Loader2 size={14} className="animate-spin" /> Loading...</div>
                    )}
                    <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded">
                      <p className="text-xs text-cyan-400 font-medium mb-1">How to update</p>
                      <p className="text-xs text-slate-400">Go to <strong className="text-slate-300">Settings → Secrets</strong> in the Management UI to add or update these environment variables.</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/60 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Required Environment Variables</CardTitle>
                    <CardDescription className="text-slate-400">Copy these names to add them in the Secrets panel</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <EnvVarCard
                      name="D365_ORG_URL"
                      description="Your Dynamics 365 organization URL"
                      example="https://yourorg.crm.dynamics.com"
                    />
                    <EnvVarCard
                      name="D365_TENANT_ID"
                      description="Azure AD tenant ID (or use MS_GRAPH_TENANT_ID)"
                      example="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    />
                    <EnvVarCard
                      name="D365_CLIENT_ID"
                      description="App registration client ID with Dynamics 365 API permissions"
                      example="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    />
                    <EnvVarCard
                      name="D365_CLIENT_SECRET"
                      description="App registration client secret"
                      example="your-client-secret-value"
                    />
                    <EnvVarCard
                      name="COPILOT_STUDIO_ENVIRONMENT_ID"
                      description="Power Platform environment ID for Copilot Studio"
                      example="Default-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    />
                    <EnvVarCard
                      name="COPILOT_CONTACT_CENTER_AGENT_ID"
                      description="Copilot Studio Contact Center agent ID"
                      example="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    />
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
                      <p className="text-xs text-yellow-400 font-medium mb-1">App Registration Permissions Required</p>
                      <ul className="text-xs text-slate-400 space-y-0.5 list-disc list-inside">
                        <li>Dynamics CRM → user_impersonation</li>
                        <li>Microsoft Graph → User.Read</li>
                        <li>Grant admin consent in Azure AD</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ── SENTIMENT ROUTING TAB ── */}
            <TabsContent value="sentiment">
              <div className="grid grid-cols-2 gap-6">
                <Card className="bg-slate-800/60 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <Brain size={18} className="text-cyan-400" /> Sentiment Routing Rules
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Automatically route and escalate based on real-time sentiment analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {sentimentRulesQuery.isLoading ? (
                      <div className="flex items-center gap-2 text-slate-400"><Loader2 size={14} className="animate-spin" /> Loading rules...</div>
                    ) : rules.length === 0 ? (
                      <div className="text-center py-8">
                        <Brain size={32} className="text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">No routing rules configured</p>
                        <p className="text-slate-500 text-xs mt-1">Add rules below to enable automatic sentiment-based routing</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {rules.map((rule: Record<string, unknown>, i: number) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-slate-900/60 rounded border border-slate-700">
                            <div>
                              <p className="text-sm text-white font-medium">{String(rule.name)}</p>
                              <p className="text-xs text-slate-400">
                                Sentiment: {String(rule.sentimentMin)} → {String(rule.sentimentMax)}
                                {rule.escalateToSenior ? " · Escalate to Senior" : ""}
                              </p>
                            </div>
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">Active</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/60 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Add Routing Rule</CardTitle>
                    <CardDescription className="text-slate-400">
                      Define sentiment thresholds for automatic escalation
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-slate-300 text-sm">Rule Name</Label>
                      <Input
                        value={newRule.name}
                        onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                        placeholder="e.g. Angry Customer Escalation"
                        className="mt-1 bg-slate-900 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300 text-sm">
                        Sentiment Range: {newRule.sentimentMin.toFixed(1)} → {newRule.sentimentMax.toFixed(1)}
                      </Label>
                      <p className="text-xs text-slate-500 mb-2">-1 = very negative, 0 = neutral, +1 = very positive</p>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Minimum (trigger below this)</p>
                          <Slider
                            min={-1} max={1} step={0.1}
                            value={[newRule.sentimentMin]}
                            onValueChange={([v]) => setNewRule({ ...newRule, sentimentMin: v })}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Maximum</p>
                          <Slider
                            min={-1} max={1} step={0.1}
                            value={[newRule.sentimentMax]}
                            onValueChange={([v]) => setNewRule({ ...newRule, sentimentMax: v })}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-slate-300 text-sm">Escalate to Senior Agent</Label>
                        <p className="text-xs text-slate-500">Auto-assign to senior support tier</p>
                      </div>
                      <Switch
                        checked={newRule.escalate}
                        onCheckedChange={(v) => setNewRule({ ...newRule, escalate: v })}
                      />
                    </div>
                    <Button
                      className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                      onClick={() => {
                        if (!newRule.name.trim()) { toast.error("Rule name required"); return; }
                        toast.success(`Rule "${newRule.name}" added (saved to DB on next release)`);
                        setNewRule({ name: "", sentimentMin: -1, sentimentMax: -0.3, escalate: true });
                      }}
                    >
                      <Plus size={14} className="mr-2" /> Add Rule
                    </Button>

                    {/* Default rules reference */}
                    <div className="mt-4 p-3 bg-slate-900/60 rounded border border-slate-700">
                      <p className="text-xs text-slate-400 font-medium mb-2">Recommended Default Rules</p>
                      {[
                        { name: "Critical Escalation", range: "-1.0 → -0.7", action: "Escalate + D365 High Priority" },
                        { name: "Negative Routing", range: "-0.7 → -0.3", action: "Route to Senior Agent" },
                        { name: "Neutral Handling", range: "-0.3 → 0.3", action: "Standard Queue" },
                        { name: "Positive Fast-Track", range: "0.3 → 1.0", action: "Self-Service + KB" },
                      ].map((r) => (
                        <div key={r.name} className="flex justify-between text-xs py-1 border-b border-slate-700/50 last:border-0">
                          <span className="text-slate-300">{r.name}</span>
                          <span className="text-slate-500">{r.range}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ── AUTOMATION TAB ── */}
            <TabsContent value="automation">
              <div className="grid grid-cols-2 gap-6">
                <Card className="bg-slate-800/60 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <Zap size={18} className="text-cyan-400" /> Automation Settings
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Configure automatic sync and case creation rules
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {[
                      {
                        label: "Auto-Sync Call Data",
                        description: "Automatically sync call recordings and analytics to D365 after each call",
                        value: autoSync,
                        onChange: setAutoSync,
                      },
                      {
                        label: "Auto-Create D365 Case",
                        description: "Create a Dynamics 365 case for every new helpdesk ticket",
                        value: autoCreateCase,
                        onChange: setAutoCreateCase,
                      },
                      {
                        label: "Sentiment-Based Escalation",
                        description: "Automatically escalate tickets with negative sentiment to senior agents",
                        value: sentimentEscalation,
                        onChange: setSentimentEscalation,
                      },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between p-4 bg-slate-900/60 rounded border border-slate-700">
                        <div>
                          <p className="text-sm text-white font-medium">{item.label}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                        </div>
                        <Switch
                          checked={item.value}
                          onCheckedChange={(v) => { item.onChange(v); toast.success(`${item.label} ${v ? "enabled" : "disabled"}`); }}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/60 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Automation Pipeline</CardTitle>
                    <CardDescription className="text-slate-400">How data flows from GigitekAI to Dynamics 365</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { step: "1", title: "Call/Ticket Received", desc: "Customer contacts via phone, email, or web form", color: "bg-cyan-500" },
                        { step: "2", title: "Sentiment Analysis", desc: "LLM analyzes message tone in real-time (-1 to +1 score)", color: "bg-purple-500" },
                        { step: "3", title: "Routing Decision", desc: "Sentiment rules determine queue, agent tier, and priority", color: "bg-yellow-500" },
                        { step: "4", title: "D365 Case Created", desc: "Incident created in Dynamics 365 with sentiment metadata", color: "bg-emerald-500" },
                        { step: "5", title: "Agent Notified", desc: "Teams notification sent with case details and sentiment context", color: "bg-blue-500" },
                        { step: "6", title: "Resolution Sync", desc: "Resolution and CSAT score synced back to D365", color: "bg-orange-500" },
                      ].map((s) => (
                        <div key={s.step} className="flex items-start gap-3">
                          <div className={`w-6 h-6 rounded-full ${s.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5`}>
                            {s.step}
                          </div>
                          <div>
                            <p className="text-sm text-white font-medium">{s.title}</p>
                            <p className="text-xs text-slate-400">{s.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ── CASES TAB ── */}
            <TabsContent value="cases">
              <Card className="bg-slate-800/60 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Phone size={18} className="text-cyan-400" /> Recent Dynamics 365 Cases
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    {conn?.connected ? "Live data from your Dynamics 365 organization" : "Connect to Dynamics 365 to view cases"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!conn?.connected ? (
                    <div className="text-center py-12">
                      <XCircle size={40} className="text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400">Not connected to Dynamics 365</p>
                      <p className="text-slate-500 text-sm mt-1">Configure credentials in the Configuration tab to view cases</p>
                    </div>
                  ) : recentCasesQuery.isLoading ? (
                    <div className="flex items-center gap-2 text-slate-400 py-8 justify-center">
                      <Loader2 size={16} className="animate-spin" /> Loading cases from D365...
                    </div>
                  ) : cases.length === 0 ? (
                    <div className="text-center py-12">
                      <Phone size={40} className="text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400">No cases found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-700">
                            <th className="text-left py-2 px-3 text-slate-400 font-medium">Case #</th>
                            <th className="text-left py-2 px-3 text-slate-400 font-medium">Title</th>
                            <th className="text-left py-2 px-3 text-slate-400 font-medium">Priority</th>
                            <th className="text-left py-2 px-3 text-slate-400 font-medium">Status</th>
                            <th className="text-left py-2 px-3 text-slate-400 font-medium">Created</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cases.map((c: Record<string, unknown>, i: number) => (
                            <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                              <td className="py-2 px-3 font-mono text-cyan-400 text-xs">{String(c.ticketnumber || "—")}</td>
                              <td className="py-2 px-3 text-white">{String(c.title || "—")}</td>
                              <td className="py-2 px-3">
                                <Badge className={
                                  c.prioritycode === 1 ? "bg-red-500/20 text-red-400 border-red-500/30" :
                                  c.prioritycode === 2 ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                                  "bg-slate-500/20 text-slate-400 border-slate-500/30"
                                }>
                                  {priorityLabel[c.prioritycode as number] || "Unknown"}
                                </Badge>
                              </td>
                              <td className="py-2 px-3">
                                <Badge className={
                                  c.statecode === 0 ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" :
                                  c.statecode === 1 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                                  "bg-slate-500/20 text-slate-400 border-slate-500/30"
                                }>
                                  {stateLabel[c.statecode as number] || "Unknown"}
                                </Badge>
                              </td>
                              <td className="py-2 px-3 text-slate-400 text-xs">
                                {c.createdon ? new Date(c.createdon as string).toLocaleDateString() : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminLayout>
  );
}
