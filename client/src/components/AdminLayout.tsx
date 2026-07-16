import { LOGO_DATA_URL } from "@/lib/logoData";
/**
 * AdminLayout — Unified SaaS-style admin portal layout
 * Inspired by Atera RMM: persistent dark sidebar, grouped nav sections,
 * top bar with notifications/user, breadcrumbs, collapsible sidebar
 */
import { useState, useEffect, createContext, useContext } from "react";
import { Link, useLocation } from "wouter";

// Context to detect nested AdminLayout — prevents duplicate sidebars
// Exported so AdminLayoutWithSidebar can also check/set it
export const AdminLayoutContext = createContext(false);
import { useRecentlyViewed } from "@/_core/hooks/useRecentlyViewed";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import NotificationBell from "@/components/NotificationBell";
import {
  LayoutDashboard,
  BarChart3,
  Ticket,
  MessageSquare,
  Bot,
  FileText,
  Mail,
  Users,
  UserCog,
  Settings,
  BookOpen,
  Sparkles,
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
  Building2,
  Send,
  Zap,
  TrendingUp,
  CheckCircle2,
  Inbox,
  MessageSquareText,
  Clock,
  Trash2,
  Video,
  Phone,
  Headphones,
  Grid3X3,
  Home,
  FileCheck,
  Star,
  Command,
  Search,
  Globe,
  Brain,
} from "lucide-react";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number | string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Main Site",
    items: [
      { label: "Back to Home", icon: <Building2 size={16} />, href: "/" },
    ],
  },
  {
    title: "Overview",
    items: [
      { label: "Dashboard", icon: <LayoutDashboard size={16} />, href: "/admin" },
      { label: "Metrics", icon: <BarChart3 size={16} />, href: "/admin/metrics" },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Support Services", icon: <Ticket size={16} />, href: "/admin/helpdesk" },
      { label: "Call Review", icon: <Phone size={16} />, href: "/admin/call-review" },
      // { label: "Call Quality", icon: <Star size={16} />, href: "/admin/call-quality" }, // HIDDEN - may use later
      { label: "Contact Center", icon: <Headphones size={16} />, href: "/admin/contact-center" },
      // { label: "Command Center", icon: <Command size={16} />, href: "/admin/command-center" }, // DISABLED
      { label: "Closed Tickets", icon: <CheckCircle2 size={16} />, href: "/admin/closed-tickets" },
      { label: "Canned Responses", icon: <MessageSquareText size={16} />, href: "/admin/canned-responses" },
      { label: "Live Chat", icon: <MessageSquare size={16} />, href: "/admin/chat" },
      { label: "AI Agents", icon: <Bot size={16} />, href: "/admin/agents" },
      { label: "Notifications", icon: <Bell size={16} />, href: "/admin/notifications" },
    ],
  },
  {
    title: "Content",
    items: [
      { label: "Blog", icon: <FileText size={16} />, href: "/admin/blog" },
      { label: "Newsletter", icon: <Mail size={16} />, href: "/admin/newsletter" },
      { label: "Knowledge Base", icon: <BookOpen size={16} />, href: "/admin/kb" },
    ],
  },

  {
    title: "Customers",
    items: [
      { label: "Free Audits", icon: <FileCheck size={16} />, href: "/admin/audit" },
      { label: "Client Onboarding", icon: <Sparkles size={16} />, href: "/admin/client-onboarding" },
      { label: "Form Submissions", icon: <FileText size={16} />, href: "/admin/form-submissions" },
      { label: "Leads", icon: <TrendingUp size={16} />, href: "/admin/leads" },
      { label: "Contacts", icon: <Inbox size={16} />, href: "/admin/contacts" },
      { label: "Accounts", icon: <Building2 size={16} />, href: "/admin/accounts" },
      { label: "Invites", icon: <Send size={16} />, href: "/admin/invites" },
      { label: "Email", icon: <Mail size={16} />, href: "/admin/email" },
    ],
  },
  {
    title: "Integrations",
    items: [
      { label: "Teams Channels", icon: <Video size={16} />, href: "/admin/teams-channels" },
    ],
  },
  {
    title: "Tools",
    items: [
      { label: "Admin Hub", icon: <Grid3X3 size={16} />, href: "/admin/hub" },
      { label: "🧠 Aria AI Dashboard", icon: <Brain size={16} />, href: "/admin/aria-dashboard" },
      { label: "Aria Command Center", icon: <Brain size={16} />, href: "/admin/aria" },
      { label: "DNS Checker", icon: <Globe size={16} />, href: "/admin/dns-checker" },
      { label: "Email Diagnostics", icon: <Mail size={16} />, href: "/admin/email-diagnostics" },
      { label: "M365 Health Status", icon: <TrendingUp size={16} />, href: "/admin/m365-health" },
      { label: "Uptime Status", icon: <Zap size={16} />, href: "/admin/uptime" },
    ],
  },
  {
    title: "Settings",
    items: [
      { label: "Preferences", icon: <UserCog size={16} />, href: "/admin/preferences" },
      { label: "Admin Guide", icon: <BookOpen size={16} />, href: "/admin/guide" },
    ],
  },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  /** Remove padding from main content area (for full-bleed modules like AdminPanel/AdminChat) */
  noPadding?: boolean;
}

export default function AdminLayout({ children, title, noPadding }: AdminLayoutProps) {
  // If we're already inside an AdminLayout, just render children (prevents duplicate sidebar)
  const isNested = useContext(AdminLayoutContext);
  if (isNested) {
    return <>{children}</>;
  }

  return (
    <AdminLayoutContext.Provider value={true}>
      <AdminLayoutInner title={title} noPadding={noPadding}>{children}</AdminLayoutInner>
    </AdminLayoutContext.Provider>
  );
}

function AdminLayoutInner({ children, title, noPadding }: AdminLayoutProps) {
  const [location, navigate] = useLocation();
  // Use custom admin JWT auth (not Manus OAuth) — admin portal has its own email/password login
  // retry: 2 handles the mobile race condition where the cookie hasn't committed yet on first load
  const { data: adminUser, isLoading: loading } = trpc.adminAuth.me.useQuery(undefined, {
    retry: 2,
    retryDelay: 400,
    staleTime: 30_000,
  });
  const logoutMutation = trpc.adminAuth.logout.useMutation();
  const logout = async () => {
    await logoutMutation.mutateAsync();
    navigate("/admin/login");
  };
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { items: recentItems, addItem: addRecentItem, clearAll: clearRecentItems } = useRecentlyViewed();

  // Close mobile sidebar on route change — must be before any early return
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  // Redirect to admin login if not authenticated.
  // We only redirect after all retries are exhausted (isLoading=false, no data).
  // This prevents a false redirect when the cookie is present but the first
  // request races against the browser committing the Set-Cookie header on mobile.
  useEffect(() => {
    if (!loading && !adminUser) {
      navigate("/admin/login");
    }
  }, [loading, adminUser]);

  const isActive = (href: string) => {
    if (href === "/admin") return location === "/admin";
    return location.startsWith(href);
  };

  const getCurrentTitle = () => {
    if (title) return title;
    for (const section of NAV_SECTIONS) {
      for (const item of section.items) {
        if (isActive(item.href)) return item.label;
      }
    }
    return "Admin";
  };

  // Track current page in recently viewed
  useEffect(() => {
    if (location.startsWith("/admin") && location !== "/admin") {
      const currentTitle = getCurrentTitle();
      addRecentItem(location, currentTitle);
    }
  }, [location]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#00D4FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo / Brand */}
      <div className={`flex items-center gap-3 px-4 py-4 border-b border-cyan-500/10 ${collapsed ? "justify-center" : ""}`}>
        {collapsed ? (
          <img
            src={LOGO_DATA_URL}
            alt="GigitekAI"
            className="h-8 w-8 object-contain flex-shrink-0"
            width="32"
            height="32"
            decoding="async"
          />
        ) : (
          <img
            src={LOGO_DATA_URL}
            alt="GigitekAI logo"
            className="h-10 w-auto object-contain max-w-[160px]"
            width="200"
            height="57"
            decoding="async"
          />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {/* Aria Command Center — Primary AI Orchestrator */}
        <div className="mb-4 px-1">
          <a href="/admin/aria">
            <div
              className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-150 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(0,212,255,0.15) 0%, rgba(99,102,241,0.15) 100%)',
                border: '1px solid rgba(0,212,255,0.4)',
                boxShadow: '0 0 16px rgba(0,212,255,0.12)',
              }}
            >
              {/* Subtle glow pulse behind icon */}
              <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 20% 50%, rgba(0,212,255,0.4) 0%, transparent 60%)' }} />
              <div className="relative flex-shrink-0">
                <Brain size={collapsed ? 20 : 18} className="text-cyan-400" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-cyan-300 leading-tight">Aria Command Center</div>
                  <div className="text-xs text-cyan-500/80 mt-0.5">AI Orchestrator · Always On</div>
                </div>
              )}
              {!collapsed && (
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" className="flex-shrink-0 text-cyan-500">
                  <path d="M1 7H13M7 1L13 7L7 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          </a>
        </div>

        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-4">
            {!collapsed && (
              <div className="px-3 mb-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {section.title}
                </span>
              </div>
            )}
            {collapsed && <div className="border-t border-cyan-500/10 my-2" />}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                // Use anchor tag for external/public routes, Link for admin routes
                const isExternalRoute = !item.href.startsWith("/admin");
                const NavElement = isExternalRoute ? "a" : Link;
                const navProps = isExternalRoute ? { href: item.href, target: "_self" } : { href: item.href };

                return (
                  <NavElement key={item.href} {...navProps}>
                    <div
                      className={`
                        flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-[opacity,transform] duration-150 group relative
                        ${active
                          ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                        }
                        ${collapsed ? "justify-center" : ""}
                      `}
                      title={collapsed ? item.label : undefined}
                    >
                      <span className={`flex-shrink-0 ${active ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300"}`}>
                        {item.icon}
                      </span>
                      {!collapsed && (
                        <span className="text-sm font-medium flex-1">{item.label}</span>
                      )}

                    </div>
                  </NavElement>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Recently Viewed Section - REMOVED */}

      {/* User Profile */}
      <div className={`border-t border-cyan-500/10 p-3 ${collapsed ? "flex justify-center" : ""}`}>
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {adminUser?.name?.charAt(0)?.toUpperCase() ?? "A"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-medium truncate">{adminUser?.name ?? "Admin"}</div>
              <div className="text-slate-500 text-xs truncate">Admin</div>
            </div>
            <div className="group relative">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-[opacity,transform] duration-200"
                onClick={logout}
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut size={14} />
              </Button>
              <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none border border-slate-700">
                Sign out
                <div className="absolute top-full right-2 w-2 h-2 bg-slate-900 transform rotate-45 border-r border-b border-slate-700"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="group relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-[opacity,transform] duration-200"
              onClick={logout}
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut size={14} />
            </Button>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none border border-slate-700">
              Sign out
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-slate-900 transform rotate-45 border-r border-b border-slate-700"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#0D1117] text-white overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — desktop */}
      <aside
        className={`
          hidden lg:flex flex-col flex-shrink-0 bg-gradient-to-b from-[#0F1419] via-[#0A0E1A] to-[#050709] border-r border-cyan-500/10
          transition-[opacity,transform] duration-200 ease-in-out
          ${collapsed ? "w-16" : "w-56"}
        `}
      >
        <SidebarContent />
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute left-0 top-1/2 -translate-y-1/2 translate-x-full w-5 h-10 bg-gradient-to-r from-[#0A0E1A] to-[#0F1419] border border-cyan-500/10 border-l-0 rounded-r-md flex items-center justify-center text-slate-500 hover:text-cyan-400 transition-colors z-10"
          style={{ left: collapsed ? "3.5rem" : "13.5rem" }}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* Sidebar — mobile drawer */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-[#0F1419] via-[#0A0E1A] to-[#050709] border-r border-cyan-500/10 z-50
          transform transition-transform duration-200 ease-in-out lg:hidden
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <SidebarContent />
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex-shrink-0 h-14 bg-[#161B22] border-b border-slate-700/50 flex items-center gap-4 px-4">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8 text-slate-400"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
          </Button>

          {/* Home button + Breadcrumb / Page title */}
          <div className="flex items-center gap-2 text-sm">
            <Link href="/admin">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                title="Go to admin home"
                aria-label="Go to admin home"
              >
                <Home size={16} />
              </Button>
            </Link>
            <span className="text-slate-500">Admin</span>
            <ChevronRight size={12} className="text-slate-600" />
            <span className="text-white font-medium">{getCurrentTitle()}</span>
          </div>

          <div className="flex-1" />

          {/* Top bar actions */}
          <div className="flex items-center gap-3">
            {/* Aria Status Indicator */}
            <Link href="/admin/aria">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 hover:bg-green-500/15 transition-colors cursor-pointer">
                <div className="relative flex-shrink-0">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <span className="text-xs font-semibold text-green-300">Aria Active</span>
              </div>
            </Link>

            {/* Real-time notification bell */}
            <NotificationBell />
            <Link href="/" target="_blank">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-slate-400 hover:text-white text-xs gap-1.5"
              >
                View Site
              </Button>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className={`flex-1 ${noPadding ? 'overflow-hidden flex flex-col min-h-0' : 'overflow-y-auto p-4 sm:p-6'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
