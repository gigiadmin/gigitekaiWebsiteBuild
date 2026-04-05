import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { AlertCircle, MessageSquare, Ticket, Bell } from "lucide-react";
import AdminChat from "./AdminChat";
import AdminPanel from "./AdminPanel";
import AdminNotifications from "./AdminNotifications";

type TabType = "chat" | "helpdesk" | "notifications";

export default function AdminPortal() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("chat");

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <MessageSquare className="w-8 h-8 text-[#00D4FF]" />
          </div>
          <p className="text-gray-400">Loading admin portal...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
        <Card className="bg-[#1A1F2E] border-[rgba(0,212,255,0.1)] p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-[#00D4FF] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Admin Access Required</h2>
          <p className="text-gray-400">You must be an admin to access this portal.</p>
        </Card>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "chat", label: "Live Chat", icon: <MessageSquare className="w-5 h-5" /> },
    { id: "helpdesk", label: "Helpdesk", icon: <Ticket className="w-5 h-5" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      {/* Header with Tabs */}
      <div className="sticky top-0 z-40 bg-[#0A0E1A]/95 backdrop-blur border-b border-[rgba(0,212,255,0.1)]">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-4 mb-4">
            <h1 className="text-3xl font-bold">Admin Portal</h1>
            <div className="text-sm text-gray-400">
              Welcome, {user.name}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-[rgba(0,212,255,0.1)] overflow-x-auto pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-all border-b-2 whitespace-nowrap ${
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

      {/* Tab Content */}
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {activeTab === "chat" && <AdminChat />}
        {activeTab === "helpdesk" && <AdminPanel />}
        {activeTab === "notifications" && <AdminNotifications />}
      </div>
    </div>
  );
}
