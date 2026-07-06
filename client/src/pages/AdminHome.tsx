/**
 * AdminHome — Unified Admin Portal Dashboard
 * Live KPI cards, activity feed, quick actions with collapsible categories
 * Rendered inside AdminLayout
 */
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Ticket,
  MessageSquare,
  Mail,
  FileText,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Bot,
  ArrowRight,
  RefreshCw,
  Activity,
  Zap,
  Inbox,
  MessageSquareText,
  Phone,
  BarChart3,
  Shield,
  Settings,
  ChevronDown,
  Search,
} from "lucide-react";
import { SupportTicketWidget } from "@/components/SupportTicketWidget";

const [DAYS] = [30];

// Quick actions organized by category
const QUICK_ACTIONS_CATEGORIES = [
  {
    id: "content",
    label: "Content & Communications",
    icon: <FileText size={14} />,
    color: "text-emerald-400",
    actions: [
      { label: "New Blog Post", href: "/admin/blog", icon: <FileText size={14} />, color: "text-emerald-400" },
      { label: "Send Newsletter", href: "/admin/newsletter", icon: <Mail size={14} />, color: "text-violet-400" },
      { label: "SMS Campaigns", href: "/admin/sms-campaigns", icon: <MessageSquareText size={14} />, color: "text-pink-400" },
    ],
  },
  {
    id: "helpdesk",
    label: "Support Services",
    icon: <Ticket size={14} />,
    color: "text-amber-400",
    actions: [
      { label: "View Support Services", href: "/admin/helpdesk", icon: <Ticket size={14} />, color: "text-amber-400" },
      { label: "Call Review", href: "/admin/call-review", icon: <Phone size={14} />, color: "text-[#00D4FF]" },
      { label: "Call Quality", href: "/admin/call-quality", icon: <Activity size={14} />, color: "text-orange-400" },
      { label: "Live Chat", href: "/admin/chat", icon: <MessageSquare size={14} />, color: "text-cyan-400" },
      { label: "Contact Center", href: "/admin/contact-center", icon: <Inbox size={14} />, color: "text-blue-400" },
      { label: "Recordings", href: "/admin/recordings", icon: <MessageSquareText size={14} />, color: "text-purple-400" },
    ],
  },
  {
    id: "analytics",
    label: "Analytics & Insights",
    icon: <TrendingUp size={14} />,
    color: "text-green-400",
    actions: [
      { label: "KB Analytics", href: "/admin/kb-analytics", icon: <TrendingUp size={14} />, color: "text-green-400" },
      { label: "SLA Dashboard", href: "/admin/sla", icon: <CheckCircle size={14} />, color: "text-emerald-400" },
      { label: "Satisfaction", href: "/admin/satisfaction", icon: <TrendingUp size={14} />, color: "text-yellow-400" },
      { label: "Scorecard", href: "/admin/scorecard", icon: <TrendingUp size={14} />, color: "text-pink-400" },
      { label: "Uptime Monitor", href: "/admin/uptime", icon: <Activity size={14} />, color: "text-cyan-400" },
      { label: "Service Health", href: "/admin/service-health", icon: <Activity size={14} />, color: "text-green-400" },
      { label: "M365 Health", href: "/admin/m365-health", icon: <Zap size={14} />, color: "text-blue-400" },
      { label: "Escalation Patterns", href: "/admin/escalation-patterns", icon: <AlertCircle size={14} />, color: "text-red-400" },
    ],
  },
  {
    id: "customers",
    label: "Customer Management",
    icon: <Users size={14} />,
    color: "text-blue-400",
    actions: [
      { label: "Invite Customer", href: "/admin/invites", icon: <Users size={14} />, color: "text-blue-400" },
      { label: "View Leads", href: "/admin/leads", icon: <TrendingUp size={14} />, color: "text-green-400" },
      { label: "Contact Submissions", href: "/admin/contacts", icon: <Inbox size={14} />, color: "text-orange-400" },
      { label: "Demo Leads", href: "/admin/demo-leads", icon: <TrendingUp size={14} />, color: "text-purple-400" },
      { label: "Client Onboarding", href: "/admin/client-onboarding", icon: <Users size={14} />, color: "text-violet-400" },
    ],
  },
  {
    id: "tools",
    label: "Tools & Integrations",
    icon: <Zap size={14} />,
    color: "text-yellow-400",
    actions: [
      { label: "Canned Responses", href: "/admin/canned-responses", icon: <MessageSquareText size={14} />, color: "text-purple-400" },
      { label: "Copilot Dashboard", href: "/admin/copilot", icon: <Bot size={14} />, color: "text-cyan-400" },
      { label: "Copilot M365", href: "/admin/copilot-m365", icon: <Zap size={14} />, color: "text-yellow-400" },
      { label: "Jira Dashboard", href: "/admin/jira", icon: <Activity size={14} />, color: "text-blue-400" },
      { label: "Teams Channels", href: "/admin/teams-channels", icon: <MessageSquare size={14} />, color: "text-cyan-400" },
      { label: "Xero", href: "/admin/xero", icon: <TrendingUp size={14} />, color: "text-green-400" },
      { label: "MS Learn Sync", href: "/admin/ms-learn-sync", icon: <FileText size={14} />, color: "text-emerald-400" },
    ],
  },
  {
    id: "diagnostics",
    label: "Diagnostics & Admin",
    icon: <Settings size={14} />,
    color: "text-slate-400",
    actions: [
      { label: "Email Diagnostics", href: "/admin/email-diagnostics", icon: <Mail size={14} />, color: "text-violet-400" },
      { label: "DNS Checker", href: "/admin/dns-checker", icon: <Activity size={14} />, color: "text-pink-400" },
      { label: "Form Submissions", href: "/admin/form-submissions", icon: <Inbox size={14} />, color: "text-orange-400" },
      { label: "Audit Log", href: "/admin/audit", icon: <FileText size={14} />, color: "text-slate-400" },
      { label: "View Metrics", href: "/admin/metrics", icon: <TrendingUp size={14} />, color: "text-pink-400" },
    ],
  },
];

export default function AdminHome() {
  const [days] = useState(DAYS);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");

  // Load expanded state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("adminQuickActionsExpanded");
    if (saved) {
      setExpandedCategories(JSON.parse(saved));
    } else {
      // Default: expand first 2 categories
      setExpandedCategories({
        content: true,
        helpdesk: true,
        analytics: false,
        customers: false,
        tools: false,
        diagnostics: false,
      });
    }
  }, []);

  // Save expanded state to localStorage
  const toggleCategory = (id: string) => {
    const newState = { ...expandedCategories, [id]: !expandedCategories[id] };
    setExpandedCategories(newState);
    localStorage.setItem("adminQuickActionsExpanded", JSON.stringify(newState));
  };

  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = trpc.helpdesk.getMetrics.useQuery(undefined, {
    refetchInterval: 60_000,
  });
  const { data: chatAnalytics, isLoading: chatLoading } = trpc.chat.getAnalytics.useQuery({ days }, {
    refetchInterval: 60_000,
  });
  const { data: subscriberStats, isLoading: subLoading } = trpc.newsletter.subscriberStats.useQuery(undefined, {
    refetchInterval: 120_000,
  });
  const { data: blogData, isLoading: blogLoading } = trpc.blog.adminListPosts.useQuery(undefined, {
    refetchInterval: 120_000,
  });
  const { data: invitesData, isLoading: invitesLoading } = trpc.customerInvites.listCustomerInvites.useQuery(undefined, {
    refetchInterval: 120_000,
  });

  const isLoading = metricsLoading || chatLoading || subLoading || blogLoading || invitesLoading;

  const openTickets = (metrics?.open ?? 0) + (metrics?.inProgress ?? 0);
  const resolvedTickets = (metrics?.resolved ?? 0) + (metrics?.closed ?? 0);
  const totalTickets = metrics?.total ?? 0;
  const resolutionRate = totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0;

  const kpiCards = [
    {
      label: "Open Tickets",
      value: openTickets,
      sub: `${metrics?.open ?? 0} open · ${metrics?.inProgress ?? 0} in progress`,
      icon: <Ticket size={18} />,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      href: "/admin/helpdesk",
      trend: openTickets > 5 ? "high" : "normal",
    },
    {
      label: "Active Chats",
      value: chatAnalytics?.activeSessions ?? 0,
      sub: `${chatAnalytics?.totalSessions ?? 0} total · ${chatAnalytics?.totalLeads ?? 0} leads`,
      icon: <MessageSquare size={18} />,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      href: "/admin/chat",
      trend: "normal",
    },
    {
      label: "Subscribers",
      value: subscriberStats?.total ?? 0,
      sub: `${subscriberStats?.active ?? 0} active subscribers`,
      icon: <Mail size={18} />,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
      href: "/admin/newsletter",
      trend: "normal",
    },
    {
      label: "Blog Posts",
      value: Array.isArray(blogData) ? blogData.length : 0,
      sub: "Published articles",
      icon: <FileText size={18} />,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      href: "/admin/blog",
      trend: "normal",
    },
  ];

  // Filter categories and actions based on search
  const filteredCategories = QUICK_ACTIONS_CATEGORIES.map((cat) => ({
    ...cat,
    actions: cat.actions.filter((action) =>
      action.label.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((cat) => cat.actions.length > 0 || searchQuery === "");

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">Command Center</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              GigitekAI Admin Portal · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-slate-400 hover:text-white gap-2 text-xs"
            onClick={() => refetchMetrics()}
            disabled={isLoading}
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((card) => (
            <Link key={card.label} href={card.href}>
              <Card className="bg-[#161B22] border-slate-700/50 hover:border-slate-600 transition-[opacity,transform] duration-200 cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`${card.bg} ${card.color} p-1.5 rounded-md`}>
                          {card.icon}
                        </div>
                        <span className="text-slate-400 text-xs font-medium">{card.label}</span>
                      </div>
                      <div className={`text-2xl font-bold ${card.color} mb-0.5`}>{card.value}</div>
                      <div className="text-slate-500 text-xs truncate">{card.sub}</div>
                    </div>
                    <ArrowRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors mt-1 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Support Ticket Widget */}
        <SupportTicketWidget />

        {/* Quick Actions with Collapsible Categories */}
        <Card className="bg-[#161B22] border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
              <Zap size={14} className="text-cyan-400" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {/* Search bar */}
            <div className="relative mb-4">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <Input
                placeholder="Search actions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8 text-xs bg-slate-800/50 border-slate-700 text-slate-300 placeholder:text-slate-500"
              />
            </div>

            {/* Categories */}
            <div className="space-y-2">
              {filteredCategories.map((category) => (
                <div key={category.id} className="border border-slate-700/50 rounded-lg overflow-hidden">
                  {/* Category header */}
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="w-full flex items-center justify-between p-3 bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className={category.color}>{category.icon}</span>
                      <span className="text-slate-300 text-sm font-medium">{category.label}</span>
                      <Badge variant="outline" className="text-xs bg-slate-700/50 border-slate-600 text-slate-400">
                        {category.actions.length}
                      </Badge>
                    </div>
                    <ChevronDown
                      size={14}
                      className={`text-slate-500 transition-transform ${expandedCategories[category.id] ? "rotate-180" : ""}`}
                    />
                  </button>

                  {/* Category actions */}
                  {expandedCategories[category.id] && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-900/20">
                      {category.actions.map((action) => (
                        <Link key={action.label} href={action.href}>
                          <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors cursor-pointer group">
                            <span className={`${action.color} flex-shrink-0`}>{action.icon}</span>
                            <span className="text-slate-300 text-xs font-medium group-hover:text-white transition-colors truncate">
                              {action.label}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* No results message */}
            {filteredCategories.every((cat) => cat.actions.length === 0) && searchQuery && (
              <div className="text-center py-4">
                <p className="text-slate-500 text-xs">No actions found matching "{searchQuery}"</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-[#161B22] border-slate-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
                <Activity size={14} className="text-cyan-400" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {[
                {
                  label: "Support Services",
                  status: openTickets > 10 ? "warning" : "operational",
                  detail: openTickets > 10 ? `${openTickets} tickets need attention` : "All systems normal",
                },
                {
                  label: "Live Chat",
                  status: "operational",
                  detail: `${chatAnalytics?.activeSessions ?? 0} active sessions`,
                },
                {
                  label: "AI Agents",
                  status: "operational",
                  detail: `${chatAnalytics?.aiChatSessions ?? 0} AI sessions (30d)`,
                },
                {
                  label: "Newsletter",
                  status: "operational",
                  detail: `${subscriberStats?.total ?? 0} active subscribers`,
                },
                {
                  label: "Email (SendGrid)",
                  status: "operational",
                  detail: "support@gigitekai.com · Verified",
                },
                {
                  label: "M365 Services",
                  status: "operational",
                  detail: "View health status",
                  href: "/admin/m365-health",
                },
              ].map((item: any) => (
                <Link key={item.label} href={item.href || "#"}>
                  <div className="flex items-center justify-between hover:opacity-80 transition-opacity cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          item.status === "operational"
                            ? "bg-emerald-400"
                            : item.status === "warning"
                            ? "bg-amber-400 animate-pulse"
                            : "bg-red-400"
                        }`}
                      />
                      <div>
                        <div className="text-slate-300 text-xs font-medium">{item.label}</div>
                        <div className="text-slate-500 text-xs">{item.detail}</div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Ticket Priority Breakdown */}
          {metrics && (
            <Card className="bg-[#161B22] border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
                  <BarChart3 size={14} className="text-cyan-400" />
                  Ticket Priority Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Critical", value: metrics?.byPriority?.critical ?? 0, color: "text-red-400", bg: "bg-red-500/10" },
                    { label: "High", value: metrics?.byPriority?.high ?? 0, color: "text-orange-400", bg: "bg-orange-500/10" },
                    { label: "Medium", value: metrics?.byPriority?.medium ?? 0, color: "text-amber-400", bg: "bg-amber-500/10" },
                    { label: "Low", value: metrics?.byPriority?.low ?? 0, color: "text-green-400", bg: "bg-green-500/10" },
                  ].map((p) => (
                    <div key={p.label} className={`${p.bg} rounded-lg p-3 text-center`}>
                      <div className={`text-xl font-bold ${p.color}`}>{p.value}</div>
                      <div className="text-slate-400 text-xs mt-0.5">{p.label}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-end">
                  <Link href="/admin/metrics">
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-400 hover:text-white gap-1.5">
                      View Full Metrics
                      <ArrowRight size={12} />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer note */}
        <div className="text-center text-slate-600 text-xs">
          GigitekAI Admin Portal · Data auto-refreshes every 60 seconds
        </div>
      </div>
    </AdminLayout>
  );
}
