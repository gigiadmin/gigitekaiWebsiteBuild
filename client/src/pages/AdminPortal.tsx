import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, BarChart3, Bell, Mail, Users, MessageSquare, Ticket, Users2, Settings, Shield, Eye, Lock, LifeBuoy, Home, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";

// Import all admin pages
import AdminMetrics from "./AdminMetrics";
import AdminNotifications from "./AdminNotifications";
import EmailDigestSettings from "./EmailDigestSettings";
import AdminUserPreferences from "./AdminUserPreferences";
import AdminChat from "./AdminChat";
import AdminPanel from "./AdminPanel";
import AdminAgents from "./AdminAgents";
import AdminAccountManagement from "./AdminAccountManagement";

export default function AdminPortal() {
  // Primary: Manus OAuth (same session as /helpdesk)
  const { user: oauthUser, loading: oauthLoading, logout: oauthLogout, isAuthenticated } = useAuth();

  // Fallback: custom admin auth (for agents/viewers without Manus accounts)
  const { data: customAdminUser, isLoading: customAdminLoading } = trpc.adminAuth.me.useQuery(
    undefined,
    { enabled: !oauthLoading && !isAuthenticated } // only check if OAuth didn't authenticate
  );
  const customLogoutMutation = trpc.adminAuth.logout.useMutation();

  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("metrics");
  const [guideDismissed, setGuideDismissed] = useState(() => localStorage.getItem('adminGuideBannerDismissed') === '1');

  const isLoading = oauthLoading || (!isAuthenticated && customAdminLoading);

  // Determine the active user — OAuth takes priority
  const activeUser = isAuthenticated && oauthUser
    ? {
        email: oauthUser.email ?? "",
        name: oauthUser.name ?? "",
        role: oauthUser.role === "admin" ? "admin" as const : "viewer" as const,
        authType: "oauth" as const,
      }
    : customAdminUser
    ? {
        email: customAdminUser.email,
        name: customAdminUser.name,
        role: customAdminUser.role as "admin" | "agent" | "viewer",
        authType: "custom" as const,
      }
    : null;

  const handleLogout = async () => {
    if (activeUser?.authType === "oauth") {
      await oauthLogout();
    } else {
      await customLogoutMutation.mutateAsync();
      setLocation("/login");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not authenticated via either system — redirect to Manus OAuth login
  if (!activeUser) {
    window.location.href = getLoginUrl();
    return null;
  }

  // OAuth user without admin role — show access denied
  if (activeUser.authType === "oauth" && activeUser.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Lock className="w-16 h-16 text-red-400 mx-auto mb-4 opacity-70" />
          <h1 className="text-2xl font-bold text-white mb-2">Admin Access Required</h1>
          <p className="text-gray-400 mb-6">
            Your account (<span className="text-cyan-400">{activeUser.email}</span>) does not have admin privileges.
            Contact your administrator to request access.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => setLocation("/")} variant="outline" className="border-slate-600">
              Back to Home
            </Button>
            <Button onClick={handleLogout} className="bg-cyan-600 hover:bg-cyan-700">
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = activeUser.role === "admin";
  const isAgent = activeUser.role === "agent" || isAdmin;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
                {activeUser.role === "admin" && (
                  <Badge className="bg-red-900/40 text-red-400 border border-red-800 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Admin
                  </Badge>
                )}
                {activeUser.role === "agent" && (
                  <Badge className="bg-cyan-900/40 text-cyan-400 border border-cyan-800 flex items-center gap-1">
                    <Users className="w-3 h-3" /> Agent
                  </Badge>
                )}
                {activeUser.role === "viewer" && (
                  <Badge className="bg-gray-800 text-gray-400 border border-gray-700 flex items-center gap-1">
                    <Eye className="w-3 h-3" /> Viewer
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-400 mt-1">Logged in as: {activeUser.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setLocation("/admin/guide")}
                variant="outline"
                size="sm"
                className="border-purple-700 text-purple-400 hover:bg-purple-900/30 hover:text-purple-300 hidden sm:flex items-center gap-1.5"
              >
                <BookOpen className="w-4 h-4" />
                Admin Guide
              </Button>
              <Button
                onClick={() => setLocation("/helpdesk")}
                variant="outline"
                size="sm"
                className="border-cyan-700 text-cyan-400 hover:bg-cyan-900/30 hover:text-cyan-300 hidden sm:flex items-center gap-1.5"
              >
                <LifeBuoy className="w-4 h-4" />
                Helpdesk
              </Button>
              <Button
                onClick={() => setLocation("/")}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white hidden sm:flex"
              >
                <Home className="w-4 h-4 mr-1" />
                Home
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-slate-600 hover:bg-slate-800"
                disabled={customLogoutMutation.isPending}
              >
                <LogOut className="w-4 h-4 mr-2" />
                {customLogoutMutation.isPending ? "Logging out..." : "Logout"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Admin Guide Banner */}
        {isAdmin && !guideDismissed && (
          <div
            onClick={() => setLocation("/admin/guide")}
            className="mb-6 flex items-center justify-between gap-4 bg-gradient-to-r from-purple-900/30 to-slate-900/60 border border-purple-700/40 rounded-xl px-5 py-4 cursor-pointer hover:border-purple-500/60 hover:from-purple-900/40 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Admin Account Guide</p>
                <p className="text-gray-400 text-xs mt-0.5">Step-by-step instructions for creating admin, agent, and viewer accounts — including role permissions and access revocation.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="flex items-center gap-1 text-purple-400 text-sm font-medium group-hover:text-purple-300">
                <span className="hidden sm:inline">View Guide</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setGuideDismissed(true); localStorage.setItem('adminGuideBannerDismissed', '1'); }}
                className="text-gray-500 hover:text-gray-300 text-xs px-2.5 py-1 rounded border border-slate-700 hover:border-slate-500 transition-colors bg-slate-900/60"
              >
                Got it
              </button>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-wrap w-full bg-slate-900 border border-slate-700 overflow-x-auto gap-0.5 p-1 h-auto">
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
              className="flex items-center gap-2 data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
            >
              <Ticket className="w-4 h-4" />
              <span className="hidden sm:inline">Tickets</span>
            </TabsTrigger>
            <TabsTrigger
              value="agents"
              className="flex items-center gap-2 data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
            >
              <Users2 className="w-4 h-4" />
              <span className="hidden sm:inline">Agents</span>
            </TabsTrigger>
            <TabsTrigger
              value="account"
              className="flex items-center gap-2 data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
          </TabsList>

          {/* Metrics Tab — all roles */}
          <TabsContent value="metrics" className="mt-6">
            <AdminMetrics />
          </TabsContent>

          {/* Notifications Tab — all roles */}
          <TabsContent value="notifications" className="mt-6">
            <AdminNotifications />
          </TabsContent>

          {/* Digest Settings Tab — all roles */}
          <TabsContent value="digest-settings" className="mt-6">
            <EmailDigestSettings />
          </TabsContent>

          {/* User Preferences Tab — admin only */}
          <TabsContent value="user-preferences" className="mt-6">
            {isAdmin ? (
              <AdminUserPreferences />
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Settings className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>Admin access required to manage user preferences.</p>
              </div>
            )}
          </TabsContent>

          {/* Chat Tab — admin and agents */}
          <TabsContent value="chat" className="mt-6">
            {isAgent ? (
              <AdminChat />
            ) : (
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>Agent or Admin access required to view chat.</p>
              </div>
            )}
          </TabsContent>

          {/* Helpdesk Tab — admin and agents */}
          <TabsContent value="helpdesk" className="mt-6">
            {isAgent ? (
              <AdminPanel />
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Ticket className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>Agent or Admin access required to manage tickets.</p>
              </div>
            )}
          </TabsContent>

          {/* Agents Tab — admin only */}
          <TabsContent value="agents" className="mt-6">
            {isAdmin ? (
              <AdminAgents />
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Users2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>Admin access required to manage agents.</p>
              </div>
            )}
          </TabsContent>

          {/* Account Management Tab — all roles */}
          <TabsContent value="account" className="mt-6">
            <AdminAccountManagement currentRole={activeUser.role} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
