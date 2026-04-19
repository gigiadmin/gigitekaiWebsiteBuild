import { useState, useMemo } from "react";
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

interface MenuItem {
  id: string;
  label: string;
  section: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
  collapsible?: boolean;
}

export function AdminLayoutWithSidebar({ children, currentPage }: AdminLayoutProps) {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>("OPERATIONS");
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = async () => {
    await logout();
    window.location.href = getLoginUrl();
  };

  const allMenuItems = [
    { id: "dashboard", label: "Dashboard", section: "OVERVIEW", icon: LayoutDashboard, path: "/admin" },
    { id: "metrics", label: "Metrics", section: "OVERVIEW", icon: BarChart3, path: "/admin/metrics" },
    { id: "helpdesk", label: "Helpdesk", section: "OPERATIONS", icon: Ticket, path: "/admin/helpdesk" },
    { id: "closed-tickets", label: "Closed Tickets", section: "OPERATIONS", icon: FileText, path: "/admin/closed-tickets" },
    { id: "agent-dashboard", label: "Agent Dashboard", section: "OPERATIONS", icon: Headphones, path: "/admin/agent-dashboard" },
    { id: "canned-responses", label: "Canned Responses", section: "OPERATIONS", icon: MessageSquare, path: "/admin/canned-responses" },
    { id: "live-chat", label: "Live Chat", section: "OPERATIONS", icon: MessageSquare, path: "/admin/live-chat" },
    { id: "ai-agents", label: "AI Agents", section: "OPERATIONS", icon: Bot, path: "/admin/ai-agents" },
    { id: "notifications", label: "Notifications", section: "OPERATIONS", icon: Bell, path: "/admin/notifications" },
    { id: "blog", label: "Blog", section: "CONTENT", icon: FileText, path: "/admin/blog" },
    { id: "newsletter", label: "Newsletter", section: "CONTENT", icon: Mail, path: "/admin/newsletter" },
    { id: "knowledge-base", label: "Knowledge Base", section: "CONTENT", icon: BookOpen, path: "/admin/knowledge-base" },
    { id: "surveys", label: "Surveys", section: "ANALYTICS", icon: Star, path: "/admin/surveys" },
    { id: "workload", label: "Workload", section: "ANALYTICS", icon: Zap, path: "/admin/workload" },
    { id: "kb-analytics", label: "KB Analytics", section: "ANALYTICS", icon: TrendingUp, path: "/admin/kb-analytics" },
    { id: "users", label: "Users", section: "SETTINGS", icon: Users, path: "/admin/users" },
    { id: "settings", label: "Settings", section: "SETTINGS", icon: Settings, path: "/admin/settings" },
  ];

  const filteredItems = useMemo(() => {
    if (!searchQuery) return allMenuItems;
    const query = searchQuery.toLowerCase();
    return allMenuItems.filter(item => item.label.toLowerCase().includes(query));
  }, [searchQuery]);

  const menuSections = [
    {
      title: "OVERVIEW",
      items: filteredItems.filter(i => i.section === "OVERVIEW"),
    },
    {
      title: "OPERATIONS",
      items: filteredItems.filter(i => i.section === "OPERATIONS"),
      collapsible: true,
    },
    {
      title: "CONTENT",
      items: filteredItems.filter(i => i.section === "CONTENT"),
    },
    {
      title: "ANALYTICS",
      items: filteredItems.filter(i => i.section === "ANALYTICS"),
      collapsible: true,
    },
    {
      title: "SETTINGS",
      items: filteredItems.filter(i => i.section === "SETTINGS"),
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

        {/* Search Bar */}
        <div className="px-3 py-3 border-b border-gray-800/40">
          <div className="relative">
            <input
              type="text"
              placeholder="Search pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-gray-700/40 rounded-lg text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#00D4FF]/50"
            />
          </div>
        </div>

        {/* Sidebar Menu */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {menuSections.map((section) => {
            const isExpanded = expandedSection === section.title;
            const isCollapsible = (section as any).collapsible;
            const hasItems = section.items.length > 0;

            if (!hasItems && searchQuery) return null;

            return (
              <div key={section.title} className="mb-4">
                <button
                  onClick={() => {
                    if (isCollapsible) {
                      setExpandedSection(isExpanded ? null : section.title);
                    }
                  }}
                  className="w-full flex items-center justify-between px-3 mb-2 group"
                >
                  <p className="text-gray-600 text-xs font-semibold uppercase">{section.title}</p>
                  {isCollapsible && (
                    <ChevronDown
                      className={`w-3 h-3 text-gray-600 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  )}
                </button>
                {(!isCollapsible || isExpanded) && (
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
                )}
              </div>
            );
          })}
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
