import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { AlertCircle, MessageSquare, Ticket, Bell, Activity } from "lucide-react";
import { useNavigate } from "wouter";
import AdminChat from "./AdminChat";
import AdminPanel from "./AdminPanel";
import AdminNotifications from "./AdminNotifications";
import AdminLayout from "@/components/AdminLayout";

type TabType = "chat" | "helpdesk" | "notifications";

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("chat");

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin mb-4">
              <MessageSquare className="w-8 h-8 text-[#00D4FF]" />
            </div>
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
          <div className="bg-[#1A1F2E] border border-[rgba(0,212,255,0.1)] p-8 text-center max-w-md rounded-lg">
            <AlertCircle className="w-12 h-12 text-[#00D4FF] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-gray-400">Admin access required</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const navigate = useNavigate();

  const tabs = [
    { id: "chat" as TabType, label: "Live Chat", icon: <MessageSquare className="w-5 h-5" /> },
    { id: "helpdesk" as TabType, label: "Helpdesk", icon: <Ticket className="w-5 h-5" /> },
    { id: "notifications" as TabType, label: "Notifications", icon: <Bell className="w-5 h-5" /> },
  ];

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#0A0E1A] text-white">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-[#0A0E1A]/95 backdrop-blur border-b border-[rgba(0,212,255,0.1)]">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between py-4 mb-4">
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <span className="text-sm text-gray-400">Welcome, {user.name}</span>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-[rgba(0,212,255,0.1)]">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-all ${
                    activeTab === tab.id
                      ? "border-[#00D4FF] text-[#00D4FF]"
                      : "border-transparent text-gray-400 hover:text-gray-300"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Access Cards */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* M365 Health Card */}
            <div
              onClick={() => navigate("/admin/m365-health")}
              className="bg-[#141B2D]/80 border border-gray-800/60 rounded-xl p-5 hover:border-[#00D4FF]/30 hover:bg-[#141B2D] transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <Activity className="w-5 h-5 text-[#00D4FF]" />
                <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">Operational</span>
              </div>
              <h3 className="text-white font-semibold text-sm mb-1">M365 Health Status</h3>
              <p className="text-gray-400 text-xs">Monitor service health and incidents</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          {activeTab === "chat" && <AdminChat />}
          {activeTab === "helpdesk" && <AdminPanel />}
          {activeTab === "notifications" && <AdminNotifications />}
        </div>
      </div>
    </AdminLayout>
  );
}
