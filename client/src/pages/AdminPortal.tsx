import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, BarChart3, Bell, Mail, Users, MessageSquare, Ticket, Users2 } from "lucide-react";

// Import all admin pages
import AdminMetrics from "./AdminMetrics";
import AdminNotifications from "./AdminNotifications";
import EmailDigestSettings from "./EmailDigestSettings";
import AdminUserPreferences from "./AdminUserPreferences";
import AdminChat from "./AdminChat";
import AdminPanel from "./AdminPanel";
import AdminAgents from "./AdminAgents";
// PWA disabled due to OAuth conflicts - users can add to home screen via Safari Share menu

export default function AdminPortal() {
  const { data: adminUser, isLoading } = trpc.adminAuth.me.useQuery();
  const logoutMutation = trpc.adminAuth.logout.useMutation();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("metrics");

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    setLocation("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!adminUser) {
    setLocation("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
              <p className="text-sm text-gray-400 mt-1">Logged in as: {adminUser.email}</p>
            </div>
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="border-slate-600 hover:bg-slate-800"
              disabled={logoutMutation.isPending}
            >
              <LogOut className="w-4 h-4 mr-2" />
              {logoutMutation.isPending ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </div>
      </div>



      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7 bg-slate-900 border border-slate-700 overflow-x-auto">
            <TabsTrigger 
              value="metrics"
              className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Metrics</span>
            </TabsTrigger>
            <TabsTrigger 
              value="notifications"
              className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
            >
              <Bell className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger 
              value="digest-settings"
              className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
            >
              <Mail className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">My Digest</span>
            </TabsTrigger>
            <TabsTrigger 
              value="user-preferences"
              className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
            >
              <Users className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger 
              value="chat"
              className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Chat</span>
            </TabsTrigger>
            <TabsTrigger 
              value="helpdesk"
              className="flex items-center gap-2 data-[state=active]:text-cyan-400"
            >
              <Ticket className="w-4 h-4" />
              Tickets
            </TabsTrigger>
            <TabsTrigger 
              value="agents"
              className="flex items-center gap-2 data-[state=active]:text-cyan-400"
            >
              <Users2 className="w-4 h-4" />
              Agents
            </TabsTrigger>
          </TabsList>

          {/* Metrics Tab */}
          <TabsContent value="metrics" className="mt-6">
            <AdminMetrics />
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="mt-6">
            <AdminNotifications />
          </TabsContent>

          {/* Digest Settings Tab */}
          <TabsContent value="digest-settings" className="mt-6">
            <EmailDigestSettings />
          </TabsContent>

          {/* User Preferences Tab */}
          <TabsContent value="user-preferences" className="mt-6">
            <AdminUserPreferences />
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat" className="mt-6">
            <AdminChat />
          </TabsContent>

          {/* Helpdesk Tab */}
          <TabsContent value="helpdesk" className="mt-6">
            <AdminPanel />
          </TabsContent>
          <TabsContent value="agents" className="mt-6">
            <AdminAgents />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
