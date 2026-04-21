/**
 * Admin Teams Channels Page
 * Manage client companies and provision dedicated Teams channels for each client.
 * Enterprise tier clients get their own channel for isolated support visibility.
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Building2, Plus, Radio, CheckCircle, XCircle, Wifi, WifiOff,
  RefreshCw, Trash2, AlertTriangle, Hash, Activity, Settings
} from "lucide-react";

export default function AdminTeamsChannelsPage() {
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [showProvisionDialog, setShowProvisionDialog] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [channelNameOverride, setChannelNameOverride] = useState("");
  const [newCompany, setNewCompany] = useState({
    name: "", domain: "", contactEmail: "", contactPhone: "",
    industry: "", tier: "starter" as "starter" | "professional" | "enterprise", notes: ""
  });

  const utils = trpc.useUtils();

  const { data: companies, isLoading: loadingCompanies } = trpc.teamsChannels.listCompanies.useQuery();
  const { data: channels, isLoading: loadingChannels } = trpc.teamsChannels.listChannels.useQuery();
  const { data: routingSummary } = trpc.teamsChannels.getChannelRoutingSummary.useQuery();
  const { data: webhookHealth, refetch: refetchHealth } = trpc.teamsChannels.getWebhookHealth.useQuery();

  const createCompany = trpc.teamsChannels.createCompany.useMutation({
    onSuccess: () => {
      utils.teamsChannels.listCompanies.invalidate();
      setShowAddCompany(false);
      setNewCompany({ name: "", domain: "", contactEmail: "", contactPhone: "", industry: "", tier: "starter", notes: "" });
      toast.success("✅ Company created", { description: "You can now provision a Teams channel for this client." });
    },
    onError: (err) => toast.error(err.message),
  });

  const provisionChannel = trpc.teamsChannels.provisionChannel.useMutation({
    onSuccess: (data) => {
      utils.teamsChannels.listCompanies.invalidate();
      utils.teamsChannels.listChannels.invalidate();
      setShowProvisionDialog(false);
toast.success("🎉 Channel Provisioned!", { description: `#${data.channelName} is ready in Teams.` });
    },
    onError: (err) => toast.error(`Provisioning Failed: ${err.message}`),
  });

  const deactivateChannel = trpc.teamsChannels.deactivateChannel.useMutation({
    onSuccess: () => {
      utils.teamsChannels.listCompanies.invalidate();
      utils.teamsChannels.listChannels.invalidate();
toast.success("Channel deactivated");
    },
    onError: (err) => toast.error(err.message),
  });

  const pingWebhook = trpc.teamsChannels.pingWebhook.useMutation({
    onSuccess: (data) => {
      refetchHealth();
      if (data.healthy) {
        toast.success("✅ Webhook Healthy", { description: "Teams webhook is responding normally." });
      } else {
        toast.error("⚠️ Webhook Unreachable", { description: "Check your Teams webhook URL configuration." });
      }
    },
  });

  const clearDLQ = trpc.teamsChannels.clearDeadLetterQueue.useMutation({
    onSuccess: () => {
      refetchHealth();
toast.success("Dead-letter queue cleared");
    },
  });

  const tierColor: Record<string, string> = {
    starter: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    professional: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    enterprise: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  };

  const health = webhookHealth?.health;
  const dlq = webhookHealth?.deadLetterQueue ?? [];

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-cyan-400" />
            Teams Channels
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage client companies and provision dedicated Teams support channels
          </p>
        </div>
        <Button
          onClick={() => setShowAddCompany(true)}
          className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Company
        </Button>
      </div>

      {/* Webhook Health Bar */}
      <div className={`rounded-lg border p-3 mb-6 flex items-center justify-between ${
        health?.healthy !== false
          ? "bg-green-500/10 border-green-500/30"
          : "bg-red-500/10 border-red-500/30"
      }`}>
        <div className="flex items-center gap-3">
          {health?.healthy !== false
            ? <Wifi className="w-5 h-5 text-green-400" />
            : <WifiOff className="w-5 h-5 text-red-400" />
          }
          <div>
            <p className="text-sm font-medium">
              Webhook Status: {health?.configured ? (health?.healthy !== false ? "Healthy" : "Unreachable") : "Not Configured"}
            </p>
            <p className="text-xs text-slate-400">
              {health?.lastCheckedAt
                ? `Last checked: ${new Date(health.lastCheckedAt).toLocaleString()}`
                : "Not yet checked"}
              {dlq.length > 0 && ` · ${dlq.length} failed notification(s) in dead-letter queue`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {dlq.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => clearDLQ.mutate()}
              className="border-red-500/30 text-red-300 hover:bg-red-500/10 text-xs"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear Queue ({dlq.length})
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => pingWebhook.mutate()}
            disabled={pingWebhook.isPending}
            className="border-slate-600 text-slate-300 hover:bg-slate-700 text-xs"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${pingWebhook.isPending ? "animate-spin" : ""}`} />
            Ping
          </Button>
        </div>
      </div>

      <Tabs defaultValue="companies">
        <TabsList className="bg-slate-800 border border-slate-700 mb-6">
          <TabsTrigger value="companies" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
            Companies ({companies?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="channels" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
            Provisioned Channels ({channels?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="routing" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
            Category Routing
          </TabsTrigger>
        </TabsList>

        {/* Companies Tab */}
        <TabsContent value="companies">
          {loadingCompanies ? (
            <div className="text-center text-slate-400 py-12">Loading companies...</div>
          ) : companies?.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">No companies yet</p>
              <p className="text-sm">Add your first client company to get started</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {companies?.map((company) => (
                <div key={company.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{company.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${tierColor[company.tier ?? "starter"]}`}>
                          {company.tier}
                        </span>
                        {!company.isActive && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">inactive</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {company.domain && <span className="mr-3">🌐 {company.domain}</span>}
                        {company.contactEmail && <span className="mr-3">✉️ {company.contactEmail}</span>}
                        {company.industry && <span>🏢 {company.industry}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {company.teamsChannelId ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-green-300">#{company.teamsChannelName}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deactivateChannel.mutate({ companyId: company.id })}
                          className="border-red-500/30 text-red-300 hover:bg-red-500/10 text-xs h-7"
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedCompanyId(company.id);
                          setChannelNameOverride(`Support - ${company.name}`);
                          setShowProvisionDialog(true);
                        }}
                        className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs h-7"
                      >
                        <Radio className="w-3 h-3 mr-1" />
                        Provision Channel
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Provisioned Channels Tab */}
        <TabsContent value="channels">
          {loadingChannels ? (
            <div className="text-center text-slate-400 py-12">Loading channels...</div>
          ) : channels?.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Hash className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">No channels provisioned yet</p>
              <p className="text-sm">Provision channels from the Companies tab</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {channels?.map((ch) => (
                <div key={ch.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Hash className="w-5 h-5 text-cyan-400" />
                      <div>
                        <p className="font-semibold text-white">{ch.teamsChannelName}</p>
                        <p className="text-xs text-slate-400">
                          Client: {ch.companyName} · Channel ID: {ch.teamsChannelId.slice(0, 20)}...
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right text-xs text-slate-400">
                        <p>{ch.notificationCount ?? 0} notifications sent</p>
                        <p>Provisioned {ch.provisionedAt ? new Date(ch.provisionedAt).toLocaleDateString() : "—"}</p>
                      </div>
                      {ch.isActive
                        ? <CheckCircle className="w-5 h-5 text-green-400" />
                        : <XCircle className="w-5 h-5 text-red-400" />
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Category Routing Tab */}
        <TabsContent value="routing">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-cyan-400" />
              <h3 className="font-semibold text-white">Category → Channel Routing</h3>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Configure environment variables to route tickets to category-specific channels.
              Set <code className="bg-slate-700 px-1 rounded text-cyan-300">TEAMS_WEBHOOK_&lt;CATEGORY&gt;</code> for each category.
            </p>
            <div className="grid gap-2">
              {routingSummary?.map((route) => (
                <div key={route.category} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-mono text-white uppercase">{route.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {route.configured
                      ? <CheckCircle className="w-4 h-4 text-green-400" />
                      : <AlertTriangle className="w-4 h-4 text-amber-400" />
                    }
                    <span className={`text-xs ${route.configured ? "text-green-300" : "text-amber-300"}`}>
                      {route.channelLabel}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-4">
              Example: Set <code className="bg-slate-700 px-1 rounded text-cyan-300">TEAMS_WEBHOOK_SECURITY</code> to route all security tickets to your #security-tickets channel.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Company Dialog */}
      <Dialog open={showAddCompany} onOpenChange={setShowAddCompany}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-cyan-400" />
              Add Client Company
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Company Name *</Label>
                <Input
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                  placeholder="Acme Corp"
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Domain</Label>
                <Input
                  value={newCompany.domain}
                  onChange={(e) => setNewCompany({ ...newCompany, domain: e.target.value })}
                  placeholder="acme.com"
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Contact Email</Label>
                <Input
                  value={newCompany.contactEmail}
                  onChange={(e) => setNewCompany({ ...newCompany, contactEmail: e.target.value })}
                  placeholder="it@acme.com"
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Contact Phone</Label>
                <Input
                  value={newCompany.contactPhone}
                  onChange={(e) => setNewCompany({ ...newCompany, contactPhone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Industry</Label>
                <Input
                  value={newCompany.industry}
                  onChange={(e) => setNewCompany({ ...newCompany, industry: e.target.value })}
                  placeholder="Healthcare, Finance, etc."
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Service Tier</Label>
                <Select value={newCompany.tier} onValueChange={(v) => setNewCompany({ ...newCompany, tier: v as any })}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Notes</Label>
              <Textarea
                value={newCompany.notes}
                onChange={(e) => setNewCompany({ ...newCompany, notes: e.target.value })}
                placeholder="Any notes about this client..."
                className="bg-slate-800 border-slate-600 text-white resize-none"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCompany(false)} className="border-slate-600 text-slate-300">
              Cancel
            </Button>
            <Button
              onClick={() => createCompany.mutate(newCompany)}
              disabled={!newCompany.name || createCompany.isPending}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
            >
              {createCompany.isPending ? "Creating..." : "Create Company"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Provision Channel Dialog */}
      <Dialog open={showProvisionDialog} onOpenChange={setShowProvisionDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-cyan-400" />
              Provision Teams Channel
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <p className="text-sm text-slate-400">
              This will create a dedicated Teams channel for this client via Microsoft Graph API.
              All support tickets from this client will be routed to their channel.
            </p>
            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Channel Name</Label>
              <Input
                value={channelNameOverride}
                onChange={(e) => setChannelNameOverride(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white"
              />
              <p className="text-xs text-slate-500 mt-1">Will appear as #{channelNameOverride.toLowerCase().replace(/\s+/g, "-")} in Teams</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-300">
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              Requires MS_GRAPH_TENANT_ID, MS_GRAPH_CLIENT_ID, MS_GRAPH_CLIENT_SECRET, and TEAMS_BOT_TEAM_ID to be configured.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProvisionDialog(false)} className="border-slate-600 text-slate-300">
              Cancel
            </Button>
            <Button
              onClick={() => selectedCompanyId && provisionChannel.mutate({
                companyId: selectedCompanyId,
                channelNameOverride,
              })}
              disabled={!channelNameOverride || provisionChannel.isPending}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
            >
              {provisionChannel.isPending ? "Provisioning..." : "Provision Channel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
