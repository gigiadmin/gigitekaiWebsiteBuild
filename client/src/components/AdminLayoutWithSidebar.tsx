import { LOGO_DATA_URL } from "@/lib/logoData";
import { useState, useMemo, useEffect, useContext } from "react";
import { AdminLayoutContext } from "@/components/AdminLayout";
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
  RefreshCw,
  Trophy,
  Trash2,
  Wifi,
  Home,
  Wrench,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import NotificationBell from "./NotificationBell";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

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
  // If we're already inside an AdminLayout, just render children (prevents duplicate sidebar)
  const isNested = useContext(AdminLayoutContext);
  if (isNested) {
    return <>{children}</>;
  }

  return (
    <AdminLayoutContext.Provider value={true}>
      <AdminLayoutWithSidebarInner currentPage={currentPage}>{children}</AdminLayoutWithSidebarInner>
    </AdminLayoutContext.Provider>
  );
}

function AdminLayoutWithSidebarInner({ children, currentPage }: AdminLayoutProps) {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Start closed on mobile
  // Auto-expand ANALYTICS if on M365 Health page
  const [expandedSection, setExpandedSection] = useState<string | null>(() => {
    if (currentPage === "m365-health") return "ANALYTICS";
    return "OPERATIONS";
  });
  const [searchQuery, setSearchQuery] = useState("");

  // Auto-expand ANALYTICS when navigating to M365 Health
  useEffect(() => {
    if (currentPage === "m365-health") {
      setExpandedSection("ANALYTICS");
    }
  }, [currentPage]);

  const handleLogout = async () => {
    await logout();
    window.location.href = getLoginUrl();
  };

  const handleClearCache = async () => {
    try {
      // Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(r => r.unregister()));
      }
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      // Hard reload
      window.location.reload();
    } catch (err) {
      console.error('[ClearCache] Error:', err);
      window.location.reload();
    }
  };

  const allMenuItems = [
    { id: "home", label: "Back to Home", section: "MAIN SITE", icon: LayoutDashboard, path: "/" },
    { id: "dashboard", label: "Dashboard", section: "OVERVIEW", icon: LayoutDashboard, path: "/admin" },
    { id: "metrics", label: "Metrics", section: "OVERVIEW", icon: BarChart3, path: "/admin/metrics" },
    { id: "helpdesk", label: "Helpdesk", section: "OPERATIONS", icon: Ticket, path: "/admin/helpdesk" },
    { id: "closed-tickets", label: "Closed Tickets", section: "OPERATIONS", icon: FileText, path: "/admin/closed-tickets" },
    { id: "agent-leaderboard", label: "Agent Leaderboard", section: "OPERATIONS", icon: Trophy, path: "/admin/agent-leaderboard" },
    { id: "canned-responses", label: "Canned Responses", section: "OPERATIONS", icon: MessageSquare, path: "/admin/canned-responses" },
    { id: "live-chat", label: "Live Chat", section: "OPERATIONS", icon: MessageSquare, path: "/admin/chat" },
    { id: "ai-agents", label: "AI Agents", section: "OPERATIONS", icon: Bot, path: "/admin/agents" },
    { id: "notifications", label: "Notifications", section: "OPERATIONS", icon: Bell, path: "/admin/notifications" },
    { id: "blog", label: "Blog", section: "CONTENT", icon: FileText, path: "/admin/blog" },
    { id: "newsletter", label: "Newsletter", section: "CONTENT", icon: Mail, path: "/admin/newsletter" },
    { id: "knowledge-base", label: "Knowledge Base", section: "CONTENT", icon: BookOpen, path: "/admin/kb" },
    { id: "ms-learn-sync", label: "MS Learn Sync", section: "CONTENT", icon: RefreshCw, path: "/admin/ms-learn-sync" },
    { id: "surveys", label: "Surveys", section: "ANALYTICS", icon: Star, path: "/admin/surveys" },
    { id: "workload", label: "Workload", section: "ANALYTICS", icon: Zap, path: "/admin/workload" },
    { id: "kb-analytics", label: "KB Analytics", section: "ANALYTICS", icon: TrendingUp, path: "/admin/kb-analytics" },
    { id: "m365-health", label: "M365 Health Status", section: "ANALYTICS", icon: TrendingUp, path: "/admin/m365-health" },
    { id: "escalation-patterns", label: "Escalation Patterns", section: "ANALYTICS", icon: BarChart3, path: "/admin/escalation-patterns" },
    { id: "jira", label: "Jira Dashboard", section: "ANALYTICS", icon: Wrench, path: "/admin/jira" },
    { id: "uptime", label: "Uptime Status", section: "ANALYTICS", icon: Wifi, path: "/admin/uptime" },
    { id: "uptime-tools", label: "Uptime Status", section: "TOOLS", icon: Wifi, path: "/admin/uptime" },
    { id: "hub", label: "Admin Hub", section: "TOOLS", icon: Home, path: "/admin/hub" },
    { id: "users", label: "Users", section: "SETTINGS", icon: Users, path: "/admin/users" },
    { id: "team-members", label: "Team Members", section: "SETTINGS", icon: Users, path: "/admin/team-members" },
    { id: "settings", label: "Settings", section: "SETTINGS", icon: Settings, path: "/admin/settings" },
  ];

  const filteredItems = useMemo(() => {
    if (!searchQuery) return allMenuItems;
    const query = searchQuery.toLowerCase();
    return allMenuItems.filter(item => item.label.toLowerCase().includes(query));
  }, [searchQuery]);

  const menuSections = [
    {
      title: "MAIN SITE",
      items: filteredItems.filter(i => i.section === "MAIN SITE"),
    },
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
      title: "TOOLS",
      items: filteredItems.filter(i => i.section === "TOOLS"),
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
    <div className="flex h-screen bg-[#0A0E1A] overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } bg-[#0F1419] border-r border-gray-800/40 transition-[opacity,transform] duration-300 overflow-hidden flex flex-col fixed lg:static h-full z-50 lg:z-auto`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-800/40">
          <div className="flex items-center gap-2 mb-4">
            <img
              src={LOGO_DATA_URL}
              alt="GigitekAI logo"
              className="h-10 w-auto object-contain max-w-[160px]"
              width="200"
              height="57"
              decoding="async"
            />
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
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-[opacity,transform] ${
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
        <div className="border-t border-gray-800/40 p-3 space-y-1">
          <div className="px-3 py-2 text-xs text-gray-500 truncate">
            {user?.email}
          </div>
          {/* Uptime Status Link */}
          <a
            href="https://stats.uptimerobot.com/gigitekai"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-[opacity,transform]"
          >
            <Wifi className="w-4 h-4 text-green-400" />
            <span>Site Status</span>
            <span className="ml-auto w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          </a>
          {/* Clear Cache Button */}
          <button
            onClick={handleClearCache}
            title="Clears service worker cache and reloads — fixes stale/offline page issues on iOS"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-amber-400 hover:bg-amber-400/5 transition-[opacity,transform]"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Cache</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-[opacity,transform]"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Bar */}
        <div className="bg-[#0F1419] border-b border-gray-800/40 px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link href="/admin">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Go to admin home"
                aria-label="Go to admin home"
              >
                <Home size={16} />
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="text-sm text-gray-400">
              <span className="text-[#00D4FF]">{user?.email}</span>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
