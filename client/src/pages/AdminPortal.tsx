import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, BarChart3, Bell, Mail, Users, MessageSquare, Ticket } from "lucide-react";

// Import all admin pages
import AdminMetrics from "./AdminMetrics";
import AdminNotifications from "./AdminNotifications";
import EmailDigestSettings from "./EmailDigestSettings";
import AdminUserPreferences from "./AdminUserPreferences";
import AdminChat from "./AdminChat";
import AdminPanel from "./AdminPanel";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { initializePWA } from "@/lib/pwa";

export default function AdminPortal() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("metrics");

  // Initialize PWA features on mount
  useEffect(() => {
    initializePWA().catch((err) => console.error('[AdminPortal] PWA init error:', err));
  }, []);

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-slate-700 bg-slate-900">
          <CardContent className="pt-6 text-center">
            <div className="text-cyan-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-white mb-2">Admin Access Required</h2>
            <p className="text-gray-400 mb-6">You must be an admin to access the admin portal.</p>
            <Button 
              onClick={() => logout()}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log Out & Try Another Account
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
              <p className="text-sm text-gray-400 mt-1">Logged in as: {user.email}</p>
            </div>
            <Button 
              onClick={() => logout()}
              variant="outline"
              className="border-slate-600 hover:bg-slate-800"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-slate-900 border border-slate-700 overflow-x-auto">
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
              className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
            >
              <Ticket className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Tickets</span>
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
        </Tabs>
      </div>
    </div>
  );
}
