import { useState } from "react";
import { useLocation } from "wouter";
import {
  LayoutDashboard,
  BarChart3,
  Ticket,
  Users,
  MessageSquare,
  BookOpen,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Zap,
  Star,
  TrendingUp,
  Headphones,
  FileText,
  Bell,
  Bot,
  Mail,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPage: string;
}

export function AdminLayoutWithSidebar({ children, currentPage }: AdminLayoutProps) {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const handleLogout = async () => {
    await logout();
    window.location.href = getLoginUrl();
  };

  const menuSections = [
    {
      title: "OVERVIEW",
      items: [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
        { id: "metrics", label: "Metrics", icon: BarChart3, path: "/admin/metrics" },
      ],
    },
    {
      title: "OPERATIONS",
      items: [
        { id: "helpdesk", label: "Helpdesk", icon: Ticket, path: "/admin/helpdesk" },
        { id: "closed-tickets", label: "Closed Tickets", icon: FileText, path: "/admin/closed-tickets" },
        { id: "agent-dashboard", label: "Agent Dashboard", icon: Headphones, path: "/admin/agent-dashboard" },
        { id: "canned-responses", label: "Canned Responses", icon: MessageSquare, path: "/admin/canned-responses" },
        { id: "live-chat", label: "Live Chat", icon: MessageSquare, path: "/admin/live-chat" },
        { id: "ai-agents", label: "AI Agents", icon: Bot, path: "/admin/ai-agents" },
        { id: "notifications", label: "Notifications", icon: Bell, path: "/admin/notifications" },
      ],
    },
    {
      title: "CONTENT",
      items: [
        { id: "blog", label: "Blog", icon: FileText, path: "/admin/blog" },
        { id: "newsletter", label: "Newsletter", icon: Mail, path: "/admin/newsletter" },
        { id: "knowledge-base", label: "Knowledge Base", icon: BookOpen, path: "/admin/knowledge-base" },
      ],
    },
    {
      title: "ANALYTICS",
      items: [
        { id: "surveys", label: "Surveys", icon: Star, path: "/admin/surveys" },
        { id: "workload", label: "Workload", icon: Zap, path: "/admin/workload" },
        { id: "kb-analytics", label: "KB Analytics", icon: TrendingUp, path: "/admin/kb-analytics" },
      ],
    },
    {
      title: "SETTINGS",
      items: [
        { id: "users", label: "Users", icon: Users, path: "/admin/users" },
        { id: "settings", label: "Settings", icon: Settings, path: "/admin/settings" },
      ],
    },
  ];

  const isItemActive = (itemId: string) => {
    return currentPage === itemId;
  };

  return (
    <div className="flex h-screen bg-[#0A0E1A]">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } bg-[#0F1419] border-r border-gray-800/40 transition-all duration-300 overflow-hidden flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-800/40">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-[#00D4FF]/20 rounded-lg flex items-center justify-center">
              <span className="text-[#00D4FF] font-bold text-sm">G</span>
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">GigitekAI</p>
              <p className="text-gray-500 text-xs">Admin Portal</p>
            </div>
          </div>
        </div>

        {/* Sidebar Menu */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {menuSections.map((section) => (
            <div key={section.title} className="mb-4">
              <p className="text-gray-600 text-xs font-semibold uppercase px-3 mb-2">{section.title}</p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = isItemActive(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.path)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                        isActive
                          ? "bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-gray-800/40 p-3 space-y-2">
          <div className="px-3 py-2 text-xs text-gray-500 truncate">
            {user?.email}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-[#0F1419] border-b border-gray-800/40 px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="text-sm text-gray-400">
            <span className="text-[#00D4FF]">{user?.email}</span>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
