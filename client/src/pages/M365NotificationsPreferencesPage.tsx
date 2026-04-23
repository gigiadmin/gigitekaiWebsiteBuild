import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail,
  Bell,
  MessageSquare,
  Trash2,
  Plus,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

const SERVICES = [
  { id: "Exchange", name: "Exchange Online" },
  { id: "Teams", name: "Microsoft Teams" },
  { id: "SharePoint", name: "SharePoint Online" },
  { id: "OneDrive", name: "OneDrive for Business" },
  { id: "Dynamics", name: "Dynamics 365" },
  { id: "PowerBI", name: "Power BI" },
];

export default function M365NotificationsPreferencesPage() {
  const [email, setEmail] = useState("");
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [notifyOnHealthy, setNotifyOnHealthy] = useState(true);
  const [notifyOnDegraded, setNotifyOnDegraded] = useState(true);
  const [notifyOnCritical, setNotifyOnCritical] = useState(true);
  const [notifyOnOffline, setNotifyOnOffline] = useState(true);
  const [teamsNotificationsEnabled, setTeamsNotificationsEnabled] = useState(true);

  // Fetch existing subscriptions
  const { data: subscriptions = [], refetch: refetchSubscriptions } = trpc.m365Health.getNotificationSubscriptions.useQuery({});

  // Add subscription mutation
  const addSubscriptionMutation = trpc.m365Health.addNotificationSubscription.useMutation({
    onSuccess: () => {
      setEmail("");
      setSelectedServices(new Set());
      refetchSubscriptions();
      toast.success("Subscription added successfully");
    },
    onError: (err) => {
      toast.error("Failed to add subscription: " + err.message);
    },
  });

  // Update subscription mutation
  const updateSubscriptionMutation = trpc.m365Health.updateNotificationPreferences.useMutation({
    onSuccess: () => {
      refetchSubscriptions();
      toast.success("Preferences updated");
    },
    onError: (err) => {
      toast.error("Failed to update preferences: " + err.message);
    },
  });

  // Delete subscription mutation
  const deleteSubscriptionMutation = trpc.m365Health.deleteNotificationSubscription.useMutation({
    onSuccess: () => {
      refetchSubscriptions();
      toast.success("Subscription removed");
    },
    onError: (err) => {
      toast.error("Failed to delete subscription: " + err.message);
    },
  });

  // Update Teams notifications setting
  const updateTeamsSettingMutation = trpc.m365Health.updateTeamsNotificationSetting.useMutation({
    onSuccess: () => {
      toast.success("Teams notification setting updated");
    },
    onError: (err) => {
      toast.error("Failed to update Teams setting: " + err.message);
    },
  });

  function handleAddSubscription() {
    if (!email || selectedServices.size === 0) {
      toast.error("Please enter an email and select at least one service");
      return;
    }

    addSubscriptionMutation.mutate({
      email,
      services: Array.from(selectedServices),
      notifyOnHealthy,
      notifyOnDegraded,
      notifyOnCritical,
      notifyOnOffline,
    });
  }

  function handleToggleService(serviceId: string) {
    const newServices = new Set(selectedServices);
    if (newServices.has(serviceId)) {
      newServices.delete(serviceId);
    } else {
      newServices.add(serviceId);
    }
    setSelectedServices(newServices);
  }

  return (
    <AdminLayout title="M365 Service Health Notifications">
      <div className="space-y-6">
        <Tabs defaultValue="subscriptions" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="subscriptions" className="flex items-center gap-2">
              <Mail size={14} />
              Email Subscriptions
            </TabsTrigger>
            <TabsTrigger value="teams" className="flex items-center gap-2">
              <MessageSquare size={14} />
              Teams Notifications
            </TabsTrigger>
          </TabsList>

          {/* Email Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-6">
            {/* Add New Subscription */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus size={18} />
                  Add Email Subscription
                </CardTitle>
                <CardDescription>
                  Subscribe to service health alerts for specific Microsoft 365 services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="admin@gigitekai.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-3 block">
                    Services to Monitor
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {SERVICES.map((service) => (
                      <button
                        key={service.id}
                        onClick={() => handleToggleService(service.id)}
                        className={`p-3 rounded border text-sm text-left transition ${
                          selectedServices.has(service.id)
                            ? "bg-cyan-900/30 border-cyan-500/50 text-cyan-400"
                            : "bg-slate-700/50 border-slate-600 text-slate-300 hover:border-slate-500"
                        }`}
                      >
                        {service.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-3 block">
                    Notification Preferences
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
                      <span className="text-sm text-slate-300">Notify when service is healthy</span>
                      <input
                        type="checkbox"
                        checked={notifyOnHealthy}
                        onChange={(e) => setNotifyOnHealthy(e.target.checked)}
                        className="w-4 h-4"
                      />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
                      <span className="text-sm text-slate-300">Notify on degradation</span>
                      <input
                        type="checkbox"
                        checked={notifyOnDegraded}
                        onChange={(e) => setNotifyOnDegraded(e.target.checked)}
                        className="w-4 h-4"
                      />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
                      <span className="text-sm text-slate-300">Notify on critical issues</span>
                      <input
                        type="checkbox"
                        checked={notifyOnCritical}
                        onChange={(e) => setNotifyOnCritical(e.target.checked)}
                        className="w-4 h-4"
                      />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
                      <span className="text-sm text-slate-300">Notify when service is offline</span>
                      <input
                        type="checkbox"
                        checked={notifyOnOffline}
                        onChange={(e) => setNotifyOnOffline(e.target.checked)}
                        className="w-4 h-4"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleAddSubscription}
                  disabled={addSubscriptionMutation.isPending}
                  className="w-full"
                >
                  {addSubscriptionMutation.isPending ? "Adding..." : "Add Subscription"}
                </Button>
              </CardContent>
            </Card>

            {/* Existing Subscriptions */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Active Subscriptions</h3>
              {subscriptions.length === 0 ? (
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="pt-6">
                    <p className="text-slate-400 text-center">No active subscriptions yet</p>
                  </CardContent>
                </Card>
              ) : (
                subscriptions.map((sub) => (
                  <Card key={sub.id} className="bg-slate-800 border-slate-700">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-base">{sub.email}</CardTitle>
                          <CardDescription>
                            {sub.services?.length || 0} services monitored
                          </CardDescription>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteSubscriptionMutation.mutate({ id: sub.id })}
                          disabled={deleteSubscriptionMutation.isPending}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {sub.services?.map((service) => (
                          <Badge key={service} variant="outline" className="bg-cyan-900/30 text-cyan-400 border-cyan-700/30">
                            {SERVICES.find((s) => s.id === service)?.name || service}
                          </Badge>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          {sub.notifyOnHealthy ? (
                            <CheckCircle size={14} className="text-green-400" />
                          ) : (
                            <AlertCircle size={14} className="text-slate-500" />
                          )}
                          <span className="text-slate-300">Healthy</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {sub.notifyOnDegraded ? (
                            <CheckCircle size={14} className="text-green-400" />
                          ) : (
                            <AlertCircle size={14} className="text-slate-500" />
                          )}
                          <span className="text-slate-300">Degraded</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {sub.notifyOnCritical ? (
                            <CheckCircle size={14} className="text-green-400" />
                          ) : (
                            <AlertCircle size={14} className="text-slate-500" />
                          )}
                          <span className="text-slate-300">Critical</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {sub.notifyOnOffline ? (
                            <CheckCircle size={14} className="text-green-400" />
                          ) : (
                            <AlertCircle size={14} className="text-slate-500" />
                          )}
                          <span className="text-slate-300">Offline</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Teams Notifications Tab */}
          <TabsContent value="teams" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare size={18} />
                  Teams Channel Notifications
                </CardTitle>
                <CardDescription>
                  Send M365 service health alerts to your Teams channel
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded">
                  <div>
                    <p className="font-semibold text-white">Enable Teams Notifications</p>
                    <p className="text-sm text-slate-400">
                      Send critical service alerts to your Teams channel
                    </p>
                  </div>
                  <Switch
                    checked={teamsNotificationsEnabled}
                    onCheckedChange={(checked) => {
                      setTeamsNotificationsEnabled(checked);
                      updateTeamsSettingMutation.mutate({
                        enabled: checked,
                      });
                    }}
                  />
                </div>

                {teamsNotificationsEnabled && (
                  <div className="p-4 bg-cyan-900/20 border border-cyan-700/30 rounded">
                    <p className="text-sm text-cyan-300">
                      ✅ Teams notifications are enabled. Critical service alerts will be posted to your configured Teams channel.
                    </p>
                  </div>
                )}

                <div className="p-4 bg-slate-700/30 rounded space-y-2">
                  <p className="text-sm font-semibold text-slate-300">Notification Types</p>
                  <ul className="text-sm text-slate-400 space-y-1">
                    <li>• 🔴 Critical service interruptions</li>
                    <li>• ⚠️ Service degradation alerts</li>
                    <li>• ✅ Service recovery notifications</li>
                    <li>• 🔧 Maintenance announcements</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
