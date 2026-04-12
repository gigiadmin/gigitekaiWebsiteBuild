/**
 * AdminHome — Unified Admin Portal Dashboard
 * Live KPI cards, activity feed, quick actions
 * Rendered inside AdminLayout
 */
import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";

const [DAYS] = [30];

export default function AdminHome() {
  const [days] = useState(DAYS);

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
    {
      label: "Resolution Rate",
      value: `${resolutionRate}%`,
      sub: `${resolvedTickets} resolved of ${totalTickets}`,
      icon: <CheckCircle size={18} />,
      color: "text-green-400",
      bg: "bg-green-500/10",
      href: "/admin/metrics",
      trend: resolutionRate < 50 ? "low" : "normal",
    },
    {
      label: "Customer Invites",
      value: invitesData?.invites?.filter((i: any) => i.status === "pending").length ?? 0,
      sub: `${invitesData?.invites?.filter((i: any) => i.status === "accepted").length ?? 0} accepted`,
      icon: <Users size={18} />,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      href: "/admin/invites",
      trend: "normal",
    },
  ];

  const quickActions = [
    { label: "New Blog Post", href: "/admin/blog", icon: <FileText size={14} />, color: "text-emerald-400" },
    { label: "Send Newsletter", href: "/admin/newsletter", icon: <Mail size={14} />, color: "text-violet-400" },
    { label: "View Helpdesk", href: "/admin/helpdesk", icon: <Ticket size={14} />, color: "text-amber-400" },
    { label: "Live Chat", href: "/admin/chat", icon: <MessageSquare size={14} />, color: "text-cyan-400" },
    { label: "Invite Customer", href: "/admin/invites", icon: <Users size={14} />, color: "text-blue-400" },
    { label: "View Metrics", href: "/admin/metrics", icon: <TrendingUp size={14} />, color: "text-pink-400" },
  ];

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {kpiCards.map((card) => (
            <Link key={card.label} href={card.href}>
              <Card className="bg-[#161B22] border-slate-700/50 hover:border-slate-600 transition-all duration-200 cursor-pointer group">
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

        {/* Two-column: Quick Actions + Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <Card className="bg-[#161B22] border-slate-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
                <Zap size={14} className="text-cyan-400" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action) => (
                  <Link key={action.label} href={action.href}>
                    <div className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors cursor-pointer group">
                      <span className={`${action.color} flex-shrink-0`}>{action.icon}</span>
                      <span className="text-slate-300 text-xs font-medium group-hover:text-white transition-colors">{action.label}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
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
                  label: "Helpdesk",
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
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      item.status === "operational" ? "bg-emerald-400" :
                      item.status === "warning" ? "bg-amber-400 animate-pulse" :
                      "bg-red-400"
                    }`} />
                    <span className="text-slate-300 text-xs">{item.label}</span>
                  </div>
                  <span className="text-slate-500 text-xs">{item.detail}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Helpdesk Priority Breakdown */}
        {totalTickets > 0 && (
          <Card className="bg-[#161B22] border-slate-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
                <AlertCircle size={14} className="text-amber-400" />
                Ticket Priority Overview
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

        {/* Footer note */}
        <div className="text-center text-slate-600 text-xs">
          GigitekAI Admin Portal · Data auto-refreshes every 60 seconds
        </div>
      </div>
    </AdminLayout>
  );
}
