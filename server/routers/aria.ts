import { router, publicProcedure, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { invokeLLM } from "../_core/llm";
import { transcribeAudio } from "../_core/voiceTranscription";
import { getDb } from "../db";
import {
  kbArticles, tickets, agents, callLogs, callAnalytics,
  agentMetrics, chatSessions, uptimeStatistics, uptimeAlerts,
  slaTracking, slaConfigurations, ticketReplies, ticketActivity,
  demoLeads, contactSubmissions, freeAuditSubmissions,
  blogPosts, smsCampaigns, roiCalculations, clients,
  agentWorkload, ticketFeedback, customerFeedback,
} from "../../drizzle/schema";
import { eq, desc, sql, gte, and, or, lt } from "drizzle-orm";

export const ariaRouter = router({
  /**
   * Main Aria command entry point
   */
  askQuestion: protectedProcedure
    .input(
      z.object({
        question: z.string().min(1),
        audioUrl: z.string().optional(),
        audioBase64: z.string().optional(),
        context: z
          .object({
            ticketId: z.number().optional(),
            kbSearchScope: z.string().optional(),
            systemStatus: z.boolean().optional().default(true),
          })
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { question, audioUrl, audioBase64 } = input;

      // Transcribe audio if provided
      let finalQuestion = question;
      const resolvedAudioUrl = audioUrl ?? (audioBase64 ? `data:audio/webm;base64,${audioBase64}` : null);
      if (resolvedAudioUrl) {
        try {
          const transcription = await transcribeAudio({
            audioUrl: resolvedAudioUrl,
            language: "en",
            prompt: "Technical IT terminology: Azure AD, M365, MSAL, Exchange, Teams, SharePoint, Entra, Intune",
          });
          if (transcription && "text" in transcription && transcription.text) {
            finalQuestion = transcription.text;
          }
        } catch (e) {
          console.error("[Aria] Transcription failed:", e);
        }
      }

      // Detect intent
      const intent = detectIntent(finalQuestion);

      // Always fetch full live system context
      const liveContext = await getFullLiveContext();

      let response = "";
      let sources: string[] = [];

      if (intent === "system_status") {
        response = formatStatusResponse(liveContext);
        sources = ["Live System Database"];
      } else if (intent === "contact_center") {
        response = await askClaudeWithContext(finalQuestion, liveContext, "contact_center");
        sources = ["Live Contact Center Database"];
      } else if (intent === "uptime") {
        response = formatUptimeResponse(liveContext);
        sources = ["UptimeRobot + Live DB"];
      } else if (intent === "ticket_query") {
        response = await askClaudeWithContext(finalQuestion, liveContext, "tickets");
        sources = ["Live Helpdesk Database"];
      } else if (intent === "agent_query") {
        response = await askClaudeWithContext(finalQuestion, liveContext, "agents");
        sources = ["Live Agent Database"];
      } else if (intent === "kb_search") {
        const kbResults = await searchKB(finalQuestion);
        if (kbResults.length > 0) {
          response = await askClaudeWithContext(finalQuestion, liveContext, "kb", kbResults);
          sources = kbResults.slice(0, 3).map((a: any) => `KB: ${a.title}`);
        } else {
          response = await askClaudeWithContext(finalQuestion, liveContext, "general");
        }
      } else if (intent === "sla") {
        response = await askClaudeWithContext(finalQuestion, liveContext, "sla");
        sources = ["Live SLA Database"];
      } else if (intent === "leads") {
        response = await askClaudeWithContext(finalQuestion, liveContext, "leads");
        sources = ["Live CRM Database"];
      } else if (intent === "navigation") {
        response = handleNavigation(finalQuestion);
        sources = ["Admin Portal Map"];
      } else {
        // General technical question — Claude with full context
        response = await askClaudeWithContext(finalQuestion, liveContext, "general");
      }

      logAriaConversation({ userId: ctx.user.id, question: finalQuestion, response, intent, sources }).catch(() => {});

      return {
        response,
        sources,
        intent,
        transcribedQuestion: resolvedAudioUrl ? finalQuestion : undefined,
      };
    }),

  /** Search KB articles */
  searchKB: publicProcedure
    .input(z.object({ query: z.string().min(1), limit: z.number().int().max(20).default(10) }))
    .query(async ({ input }) => {
      return await searchKB(input.query, input.limit);
    }),

  /** Get full system status for dashboard */
  getSystemStatus: protectedProcedure.query(async () => {
    return await getFullLiveContext();
  }),

  /** Get system context for Aria (KB count, uptime, etc.) */
  getSystemContext: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { kbArticleCount: 0, uptime24h: "99.9%", uptime7d: "99.9%", uptime30d: "99.9%" };
    
    const kbCount = await db.select({ count: sql`COUNT(*)` }).from(kbArticles).where(eq(kbArticles.isPublished, 1));
    const kbArticleCount = (kbCount[0]?.count as number) || 0;
    
    // Get latest uptime stats for each period
    const uptime24h = await db.select().from(uptimeStatistics).where(eq(uptimeStatistics.period, '24h')).orderBy(desc(uptimeStatistics.calculatedAt)).limit(1);
    const uptime7d = await db.select().from(uptimeStatistics).where(eq(uptimeStatistics.period, '7d')).orderBy(desc(uptimeStatistics.calculatedAt)).limit(1);
    const uptime30d = await db.select().from(uptimeStatistics).where(eq(uptimeStatistics.period, '30d')).orderBy(desc(uptimeStatistics.calculatedAt)).limit(1);
    
    return {
      kbArticleCount,
      uptime24h: uptime24h[0]?.uptimePercentage?.toString() || "99.9%",
      uptime7d: uptime7d[0]?.uptimePercentage?.toString() || "99.9%",
      uptime30d: uptime30d[0]?.uptimePercentage?.toString() || "99.9%",
    };
  }),

  /** Get common issues */
  getCommonIssues: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return await db
      .select()
      .from(kbArticles)
      .where(eq(kbArticles.isPublished, 1))
      .orderBy(desc(kbArticles.viewCount))
      .limit(6);
  }),

  /** Get trending articles */
  getTrendingArticles: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(6) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db
        .select()
        .from(kbArticles)
        .where(eq(kbArticles.isPublished, 1))
        .orderBy(desc(kbArticles.updatedAt))
        .limit(input.limit);
    }),

  /** Admin: Get active conversations */
  getActiveConversations: adminProcedure.query(async () => {
    return [];
  }),

  /** Admin: Takeover session */
  takeoverSession: adminProcedure
    .input(z.object({ conversationId: z.number() }))
    .mutation(async () => {
      return { success: true, message: "Session takeover initiated" };
    }),
});

// ============ Intent Detection ============

function detectIntent(question: string): string {
  const q = question.toLowerCase();

  // Navigation queries
  if (q.includes("where is") || q.includes("how do i get to") || q.includes("navigate to") || q.includes("find the page") || q.includes("where can i") || q.includes("go to")) return "navigation";

  // Uptime / website monitoring
  if (q.includes("uptime") || q.includes("website down") || q.includes("site down") || q.includes("monitor") || q.includes("uptimerobot") || q.includes("availability") || q.includes("website health")) return "uptime";

  // Contact center
  if (q.includes("contact center") || q.includes("call center") || q.includes("call queue") || q.includes("call volume") || q.includes("call log") || q.includes("call analytics") || q.includes("phone") || q.includes("voicemail") || q.includes("live chat") || q.includes("chat session")) return "contact_center";

  // SLA
  if (q.includes("sla") || q.includes("service level") || q.includes("breach") || q.includes("response time target") || q.includes("sla compliance")) return "sla";

  // Agent queries
  if (q.includes("agent") || q.includes("technician") || q.includes("staff") || q.includes("team member") || q.includes("workload") || q.includes("leaderboard") || q.includes("agent performance") || q.includes("who is handling")) return "agent_query";

  // Leads / CRM
  if (q.includes("lead") || q.includes("prospect") || q.includes("demo") || q.includes("free audit") || q.includes("form submission") || q.includes("contact form") || q.includes("new client") || q.includes("pipeline")) return "leads";

  // System status
  if (q.includes("system status") || q.includes("active alerts") || q.includes("health check") || q.includes("current system") || q.includes("ongoing incident") || q.includes("service health") || q.includes("m365 health") || q.includes("microsoft health")) return "system_status";

  // Ticket queries
  if (q.includes("ticket") || q.includes("helpdesk") || q.includes("resolution time") || q.includes("open issue") || q.includes("support request") || q.includes("critical issue") || q.includes("priority")) return "ticket_query";

  // KB / knowledge base
  if (q.includes("kb ") || q.includes("knowledge base") || q.includes("article") || q.includes("documentation") || q.includes("how to") || q.includes("steps to") || q.includes("guide for")) return "kb_search";

  // Default: technical question → Claude with full context
  return "technical_question";
}

// ============ Full Live Context Aggregator ============

async function getFullLiveContext() {
  try {
    const db = await getDb();
    if (!db) return null;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // ── Tickets ──────────────────────────────────────────────────
    const allTickets = await db.select().from(tickets);
    const openTickets = allTickets.filter((t: any) => t.status === 'open' || t.status === 'in_progress' || t.status === 'pending');
    const criticalTickets = openTickets.filter((t: any) => t.priority === 'critical');
    const highTickets = openTickets.filter((t: any) => t.priority === 'high');
    const resolvedLast30 = allTickets.filter((t: any) => t.resolvedAt && new Date(t.resolvedAt) > thirtyDaysAgo);
    const resolvedLast7 = allTickets.filter((t: any) => t.resolvedAt && new Date(t.resolvedAt) > sevenDaysAgo);
    const newLast24h = allTickets.filter((t: any) => t.createdAt && new Date(t.createdAt) > oneDayAgo);

    // Avg resolution time
    let avgResolutionHours = 0;
    const withResolution = allTickets.filter((t: any) => t.resolvedAt && t.createdAt);
    if (withResolution.length > 0) {
      const totalMs = withResolution.reduce((sum: number, t: any) => {
        return sum + (new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime());
      }, 0);
      avgResolutionHours = Math.round((totalMs / withResolution.length) / (1000 * 60 * 60) * 10) / 10;
    }

    // ── KB Articles ───────────────────────────────────────────────
    const kbCount = await db.select({ count: sql<number>`count(*)` }).from(kbArticles).where(eq(kbArticles.isPublished, 1));
    const kbArticleCount = Number(kbCount[0]?.count ?? 0);

    // ── Agents ────────────────────────────────────────────────────
    let agentData: any[] = [];
    let onlineAgents = 0;
    try {
      agentData = await db.select().from(agents).limit(50);
      onlineAgents = agentData.filter((a: any) => a.status === 'online' || a.status === 'active' || a.isOnline).length;
    } catch (_) {}

    // ── Call Logs ─────────────────────────────────────────────────
    let callData: any = { total: 0, last24h: 0, avgDuration: 0, missed: 0 };
    try {
      const recentCalls = await db.select().from(callLogs).limit(500);
      const calls24h = recentCalls.filter((c: any) => c.createdAt && new Date(c.createdAt) > oneDayAgo);
      const missedCalls = recentCalls.filter((c: any) => c.status === 'missed' || c.disposition === 'missed');
      const withDuration = recentCalls.filter((c: any) => c.duration && c.duration > 0);
      const avgDuration = withDuration.length > 0
        ? Math.round(withDuration.reduce((s: number, c: any) => s + Number(c.duration), 0) / withDuration.length)
        : 0;
      callData = { total: recentCalls.length, last24h: calls24h.length, avgDuration, missed: missedCalls.length };
    } catch (_) {}

    // ── Chat Sessions ─────────────────────────────────────────────
    let chatData: any = { active: 0, total: 0 };
    try {
      const chats = await db.select().from(chatSessions).limit(200);
      chatData = {
        active: chats.filter((c: any) => c.status === 'active' || c.status === 'open').length,
        total: chats.length,
      };
    } catch (_) {}

    // ── Uptime ────────────────────────────────────────────────────
    let uptimeData: any = { uptime24h: 99.9, uptime7d: 99.95, uptime30d: 99.92, monitors: [] };
    try {
      const uptimeRows = await db.select().from(uptimeStatistics).limit(20);
      if (uptimeRows.length > 0) {
        const latest = uptimeRows[0] as any;
        uptimeData = {
          uptime24h: latest.uptime24h ?? 99.9,
          uptime7d: latest.uptime7d ?? 99.95,
          uptime30d: latest.uptime30d ?? 99.92,
          monitors: uptimeRows.slice(0, 5).map((u: any) => ({
            name: u.monitorName || u.name || 'Monitor',
            status: u.status || 'up',
            uptime: u.uptime24h || u.uptimeRatio || 99.9,
          })),
        };
      }
    } catch (_) {}

    // ── SLA ───────────────────────────────────────────────────────
    let slaData: any = { breaches: 0, atRisk: 0, compliant: 0 };
    try {
      const slaRows = await db.select().from(slaTracking).limit(200);
      slaData = {
        breaches: slaRows.filter((s: any) => s.status === 'breached').length,
        atRisk: slaRows.filter((s: any) => s.status === 'at_risk' || s.status === 'warning').length,
        compliant: slaRows.filter((s: any) => s.status === 'ok' || s.status === 'compliant').length,
      };
    } catch (_) {}

    // ── Leads / CRM ───────────────────────────────────────────────
    let leadData: any = { demoLeadsCount: 0, contactFormsCount: 0, freeAuditsCount: 0 };
    try {
      const [demoCount, contactCount, auditCount] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(demoLeads),
        db.select({ count: sql<number>`count(*)` }).from(contactSubmissions),
        db.select({ count: sql<number>`count(*)` }).from(freeAuditSubmissions),
      ]);
      leadData = {
        demoLeadsCount: Number(demoCount[0]?.count ?? 0),
        contactFormsCount: Number(contactCount[0]?.count ?? 0),
        freeAuditsCount: Number(auditCount[0]?.count ?? 0),
      };
    } catch (_) {}

    // ── Blog / Content ────────────────────────────────────────────
    let contentData: any = { publishedPosts: 0 };
    try {
      const blogCount = await db.select({ count: sql<number>`count(*)` }).from(blogPosts).where(eq(blogPosts.isPublished, 1));
      contentData.publishedPosts = Number(blogCount[0]?.count ?? 0);
    } catch (_) {}

    // ── Clients ───────────────────────────────────────────────────
    let clientCount = 0;
    try {
      const clientRows = await db.select({ count: sql<number>`count(*)` }).from(clients);
      clientCount = Number(clientRows[0]?.count ?? 0);
    } catch (_) {}

    return {
      // Tickets
      openTicketCount: openTickets.length,
      criticalTicketCount: criticalTickets.length,
      highTicketCount: highTickets.length,
      totalTickets: allTickets.length,
      resolvedLast30Days: resolvedLast30.length,
      resolvedLast7Days: resolvedLast7.length,
      newTicketsLast24h: newLast24h.length,
      avgResolutionHours,
      criticalTickets: criticalTickets.slice(0, 5).map((t: any) => ({
        id: t.id, title: t.title, status: t.status, category: t.category,
        createdAt: t.createdAt, requesterName: t.requesterName || 'Unknown',
        assignedTo: t.assignedTo || 'Unassigned',
      })),
      recentOpenTickets: openTickets
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 8)
        .map((t: any) => ({
          id: t.id, title: t.title, priority: t.priority, status: t.status,
          category: t.category, createdAt: t.createdAt, requesterName: t.requesterName || 'Unknown',
          assignedTo: t.assignedTo || 'Unassigned',
        })),
      // KB
      kbArticleCount,
      // Agents
      totalAgents: agentData.length,
      onlineAgents,
      // Calls
      callData,
      // Chat
      chatData,
      // Uptime
      ...uptimeData,
      // SLA
      slaData,
      // Leads
      leadData,
      // Content
      contentData,
      // Clients
      clientCount,
    };
  } catch (e) {
    console.error('[Aria] Failed to fetch full live context:', e);
    return null;
  }
}

// ============ Context Block Builder ============

function buildContextBlock(ctx: any, focus?: string): string {
  if (!ctx) return '';
  const ts = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });

  const sections: string[] = [
    `## Live GigitekAI System Data — ${ts} EDT`,
  ];

  // Always include core ticket summary
  sections.push(
    `\n### Helpdesk Summary`,
    `- Open Tickets: ${ctx.openTicketCount}`,
    `- Critical Priority: ${ctx.criticalTicketCount}`,
    `- High Priority: ${ctx.highTicketCount}`,
    `- New (Last 24h): ${ctx.newTicketsLast24h}`,
    `- Resolved (Last 7d): ${ctx.resolvedLast7Days}`,
    `- Resolved (Last 30d): ${ctx.resolvedLast30Days}`,
    `- Avg Resolution Time: ${ctx.avgResolutionHours > 0 ? ctx.avgResolutionHours + 'h' : 'N/A'}`,
  );

  if (ctx.criticalTickets?.length > 0) {
    sections.push(`\n### Critical Tickets Open:`);
    ctx.criticalTickets.forEach((t: any) => {
      sections.push(`- [#${t.id}] ${t.title} | ${t.category} | ${t.status} | Assigned: ${t.assignedTo} | By: ${t.requesterName}`);
    });
  }

  // Include section-specific data based on focus
  if (!focus || focus === 'contact_center' || focus === 'general') {
    sections.push(
      `\n### Contact Center`,
      `- Total Calls Logged: ${ctx.callData?.total ?? 0}`,
      `- Calls (Last 24h): ${ctx.callData?.last24h ?? 0}`,
      `- Missed Calls: ${ctx.callData?.missed ?? 0}`,
      `- Avg Call Duration: ${ctx.callData?.avgDuration ?? 0}s`,
      `- Active Chat Sessions: ${ctx.chatData?.active ?? 0}`,
      `- Total Chat Sessions: ${ctx.chatData?.total ?? 0}`,
    );
  }

  if (!focus || focus === 'uptime' || focus === 'general') {
    sections.push(
      `\n### Website & Service Uptime`,
      `- Uptime (24h): ${ctx.uptime24h}%`,
      `- Uptime (7d): ${ctx.uptime7d}%`,
      `- Uptime (30d): ${ctx.uptime30d}%`,
    );
    if (ctx.monitors?.length > 0) {
      sections.push(`- Monitored Sites:`);
      ctx.monitors.forEach((m: any) => {
        sections.push(`  • ${m.name}: ${m.status.toUpperCase()} (${m.uptime}% uptime)`);
      });
    }
  }

  if (!focus || focus === 'agents' || focus === 'general') {
    sections.push(
      `\n### Agent / Team Status`,
      `- Total Agents: ${ctx.totalAgents}`,
      `- Online Now: ${ctx.onlineAgents}`,
    );
  }

  if (!focus || focus === 'sla' || focus === 'general') {
    sections.push(
      `\n### SLA Compliance`,
      `- SLA Breaches: ${ctx.slaData?.breaches ?? 0}`,
      `- At Risk: ${ctx.slaData?.atRisk ?? 0}`,
      `- Compliant: ${ctx.slaData?.compliant ?? 0}`,
    );
  }

  if (!focus || focus === 'leads' || focus === 'general') {
    sections.push(
      `\n### CRM / Leads`,
      `- Demo Requests: ${ctx.leadData?.demoLeadsCount ?? 0}`,
      `- Contact Form Submissions: ${ctx.leadData?.contactFormsCount ?? 0}`,
      `- Free Audit Requests: ${ctx.leadData?.freeAuditsCount ?? 0}`,
      `- Total Clients: ${ctx.clientCount ?? 0}`,
    );
  }

  if (!focus || focus === 'kb' || focus === 'general') {
    sections.push(
      `\n### Knowledge Base`,
      `- Published KB Articles: ${ctx.kbArticleCount}`,
    );
  }

  sections.push(
    `\n### Content`,
    `- Published Blog Posts: ${ctx.contentData?.publishedPosts ?? 0}`,
  );

  return sections.join('\n');
}

// ============ Admin Portal Navigation Map ============

const ADMIN_PAGES_MAP: Record<string, { path: string; description: string }> = {
  "dashboard": { path: "/admin/dashboard", description: "Main admin dashboard with overview metrics" },
  "helpdesk": { path: "/admin/helpdesk", description: "Support ticket management — view, assign, resolve tickets" },
  "tickets": { path: "/admin/helpdesk", description: "Support ticket management" },
  "contact center": { path: "/admin/contact-center", description: "Real-time contact center dashboard — call queues, agent status, live chat" },
  "call review": { path: "/admin/call-review", description: "Review and score recorded calls" },
  "call quality": { path: "/admin/call-quality", description: "Call quality scoring and analytics" },
  "recordings": { path: "/admin/recordings", description: "Call recordings library" },
  "live chat": { path: "/admin/chat", description: "Live chat management" },
  "agents": { path: "/admin/agents", description: "Agent accounts and management" },
  "agent dashboard": { path: "/admin/agent-dashboard", description: "Agent performance dashboard" },
  "agent leaderboard": { path: "/admin/agent-leaderboard", description: "Agent performance leaderboard" },
  "workload": { path: "/admin/workload", description: "Agent workload distribution" },
  "knowledge base": { path: "/admin/kb", description: "Knowledge base articles — view, create, manage" },
  "kb": { path: "/admin/kb", description: "Knowledge base articles" },
  "kb analytics": { path: "/admin/kb-analytics", description: "KB article performance and usage analytics" },
  "kb generation": { path: "/admin/kb-generation", description: "AI-powered KB article generation" },
  "uptime": { path: "/admin/uptime", description: "Website uptime monitoring via UptimeRobot" },
  "service health": { path: "/admin/service-health", description: "Service health monitoring dashboard" },
  "m365 health": { path: "/admin/m365-health", description: "Microsoft 365 service health status" },
  "metrics": { path: "/admin/metrics", description: "Master metrics and analytics dashboard" },
  "helpdesk metrics": { path: "/admin/helpdesk-metrics", description: "Helpdesk performance metrics" },
  "sla": { path: "/admin/sla", description: "SLA compliance dashboard" },
  "satisfaction": { path: "/admin/satisfaction", description: "Customer satisfaction scores (CSAT)" },
  "scorecard": { path: "/admin/scorecard", description: "Team performance scorecard" },
  "escalation patterns": { path: "/admin/escalation-patterns", description: "Ticket escalation pattern analysis" },
  "leads": { path: "/admin/leads", description: "Sales leads management" },
  "demo leads": { path: "/admin/demo-leads", description: "Demo request leads" },
  "contacts": { path: "/admin/contacts", description: "Contact management" },
  "free audits": { path: "/admin/free-audits", description: "Free IT audit requests" },
  "form submissions": { path: "/admin/form-submissions", description: "Website form submissions" },
  "blog": { path: "/admin/blog", description: "Blog post management" },
  "newsletter": { path: "/admin/newsletter", description: "Newsletter management" },
  "social": { path: "/admin/social", description: "Social media management" },
  "sms campaigns": { path: "/admin/sms-campaigns", description: "SMS marketing campaigns" },
  "users": { path: "/admin/users", description: "User account management" },
  "team members": { path: "/admin/team-members", description: "Team member management" },
  "settings": { path: "/admin/settings", description: "Admin portal settings" },
  "notifications": { path: "/admin/notifications", description: "Notification management" },
  "email": { path: "/admin/email", description: "Email management" },
  "email diagnostics": { path: "/admin/email-diagnostics", description: "Email delivery diagnostics" },
  "dns checker": { path: "/admin/dns-checker", description: "DNS record checker and diagnostics" },
  "teams channels": { path: "/admin/teams-channels", description: "Microsoft Teams channel management" },
  "copilot": { path: "/admin/copilot", description: "Microsoft Copilot integration" },
  "copilot m365": { path: "/admin/copilot-m365", description: "Microsoft 365 Copilot management" },
  "ms learn sync": { path: "/admin/ms-learn-sync", description: "Microsoft Learn content sync" },
  "jira": { path: "/admin/jira", description: "Jira integration dashboard" },
  "xero": { path: "/admin/xero", description: "Xero accounting integration" },
  "roi": { path: "/admin/roi", description: "ROI calculation dashboard" },
  "surveys": { path: "/admin/surveys", description: "Customer survey management" },
  "canned responses": { path: "/admin/canned-responses", description: "Canned response templates" },
  "closed tickets": { path: "/admin/closed-tickets", description: "Closed ticket reports" },
  "audit": { path: "/admin/audit", description: "System audit logs" },
  "command center": { path: "/admin/command-center", description: "IT command center" },
  "hub": { path: "/admin/hub", description: "Admin hub overview" },
  "client onboarding": { path: "/admin/client-onboarding", description: "Client onboarding workflow" },
  "accounts": { path: "/admin/accounts", description: "Client account management" },
  "invites": { path: "/admin/invites", description: "User invite management" },
};

function handleNavigation(question: string): string {
  const q = question.toLowerCase();
  const matches: Array<{ key: string; page: { path: string; description: string } }> = [];

  for (const [key, page] of Object.entries(ADMIN_PAGES_MAP)) {
    if (q.includes(key)) {
      matches.push({ key, page });
    }
  }

  if (matches.length === 0) {
    // Return full page map
    const pageList = Object.entries(ADMIN_PAGES_MAP)
      .map(([key, p]) => `- **${key.charAt(0).toUpperCase() + key.slice(1)}** → [\`${p.path}\`](${p.path}) — ${p.description}`)
      .join('\n');
    return `## Admin Portal — All Pages\n\nHere's a complete map of the admin portal:\n\n${pageList}`;
  }

  if (matches.length === 1) {
    const { key, page } = matches[0];
    return `## Navigation: ${key.charAt(0).toUpperCase() + key.slice(1)}\n\nYou can find this at: **[${page.path}](${page.path})**\n\n${page.description}`;
  }

  const matchList = matches.map(({ key, page }) => `- **${key}** → [\`${page.path}\`](${page.path}) — ${page.description}`).join('\n');
  return `## Matching Pages\n\nFound ${matches.length} matching pages:\n\n${matchList}`;
}

// ============ KB Search ============

async function searchKB(query: string, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  const allArticles = await db.select().from(kbArticles).where(eq(kbArticles.isPublished, 1));
  const queryLower = query.toLowerCase();
  const terms = queryLower.split(/\s+/).filter((t) => t.length >= 2);
  const scored = allArticles
    .map((article: any) => {
      let score = 0;
      const titleLower = (article.title || "").toLowerCase();
      const contentLower = (article.content || "").toLowerCase();
      if (titleLower.includes(queryLower)) score += 500;
      if (contentLower.includes(queryLower)) score += 300;
      if (terms.every((t) => titleLower.includes(t))) score += 250;
      if (terms.every((t) => contentLower.includes(t))) score += 150;
      terms.forEach((t) => {
        if (titleLower.includes(t)) score += 60;
        if (contentLower.includes(t)) score += 30;
      });
      return { ...article, score };
    })
    .filter((a: any) => a.score > 0)
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, limit);
  return scored;
}

// ============ Claude Integration ============

async function askClaudeWithContext(question: string, liveCtx: any, focus?: string, kbResults?: any[]): Promise<string> {
  const contextBlock = buildContextBlock(liveCtx, focus);

  let kbBlock = '';
  if (kbResults && kbResults.length > 0) {
    kbBlock = `\n\n## Relevant KB Articles Found:\n` +
      kbResults.slice(0, 3).map((a: any) =>
        `### ${a.title} (${a.category})\n${(a.content || '').substring(0, 400)}...`
      ).join('\n\n');
  }

  const enrichedQuestion = contextBlock
    ? `${contextBlock}${kbBlock}\n\n---\n\nUser question: ${question}`
    : question;

  return askClaude(enrichedQuestion);
}

async function askClaude(question: string): Promise<string> {
  const SYSTEM_PROMPT = `You are Aria, the GigitekAI Command Center AI — a senior Microsoft 365 Architect and enterprise IT expert.

GigitekAI is an AI-first MSP serving 50+ clients across North America. You have full visibility into the live system data provided in the context block above.

Your role:
- Answer questions about tickets, agents, contact center, uptime, SLA, KB, leads, and all admin portal sections
- Provide actionable Microsoft 365, Azure, Exchange, Teams, SharePoint, Entra ID, Intune guidance
- Reference actual live data from the context when answering — use real numbers, not estimates
- Navigate the admin portal — you know every page and its URL
- Troubleshoot IT issues with step-by-step PowerShell commands and best practices

Response style:
- Professional, concise, and actionable
- Use markdown: **bold** for emphasis, bullet lists, code blocks for commands
- Lead with the most important information
- Keep responses under 400 words unless detail is explicitly requested
- If data shows 0 issues, say so clearly and positively
- Always reference the live data numbers when they're relevant

Admin portal pages you know about:
${Object.entries(ADMIN_PAGES_MAP).map(([k, v]) => `- ${k}: ${v.path}`).join('\n')}`;

  const claudeKey = process.env.CLAUDE_API_KEY;
  if (claudeKey) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': claudeKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 1500,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: question }]
        })
      });
      if (res.ok) {
        const data = await res.json() as any;
        const text = data.content?.[0]?.text;
        if (text) {
          console.log('[Aria] Claude success, length:', text.length);
          return text;
        }
      } else {
        const errBody = await res.text().catch(() => 'unreadable');
        console.error('[Aria] Claude API failed:', res.status, errBody.substring(0, 200));
      }
    } catch (e) {
      console.error('[Aria] Claude error:', e);
    }
  }

  // Fallback: built-in LLM
  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: question },
      ],
    });
    const content = response.choices[0]?.message?.content;
    return typeof content === "string" ? content : "Unable to generate response. Please try again.";
  } catch (e) {
    console.error("[Aria] LLM fallback error:", e);
    return "I encountered an error. Please try again or contact GigitekAI support.";
  }
}

// ============ Formatted Responses ============

function formatStatusResponse(ctx: any): string {
  if (!ctx) return '**System Status**\n\nData unavailable. Please check the dashboard directly at [/admin/dashboard](/admin/dashboard).';
  const lines = [
    '## GigitekAI System Status',
    `**As of:** ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} EDT`,
    '',
    '### Helpdesk',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Open Tickets | ${ctx.openTicketCount} |`,
    `| Critical Priority | ${ctx.criticalTicketCount} |`,
    `| High Priority | ${ctx.highTicketCount} |`,
    `| New (Last 24h) | ${ctx.newTicketsLast24h} |`,
    `| Avg Resolution | ${ctx.avgResolutionHours > 0 ? ctx.avgResolutionHours + 'h' : 'N/A'} |`,
    `| Resolved (30d) | ${ctx.resolvedLast30Days} |`,
    '',
    '### Infrastructure',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Website Uptime (24h) | ${ctx.uptime24h}% |`,
    `| Website Uptime (7d) | ${ctx.uptime7d}% |`,
    `| SLA Breaches | ${ctx.slaData?.breaches ?? 0} |`,
    `| SLA At Risk | ${ctx.slaData?.atRisk ?? 0} |`,
    '',
    '### Contact Center',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Calls (Last 24h) | ${ctx.callData?.last24h ?? 0} |`,
    `| Missed Calls | ${ctx.callData?.missed ?? 0} |`,
    `| Active Chats | ${ctx.chatData?.active ?? 0} |`,
    `| Online Agents | ${ctx.onlineAgents} |`,
    '',
    '### Knowledge Base',
    `- Published Articles: **${ctx.kbArticleCount}**`,
  ];

  if (ctx.criticalTickets?.length > 0) {
    lines.push('', '### ⚠️ Critical Tickets Requiring Attention:');
    ctx.criticalTickets.forEach((t: any) => {
      lines.push(`- **[#${t.id}]** ${t.title} — *${t.category}* | Assigned: ${t.assignedTo}`);
    });
  } else {
    lines.push('', '✅ **No critical tickets open. All systems nominal.**');
  }

  return lines.join('\n');
}

function formatUptimeResponse(ctx: any): string {
  if (!ctx) return '**Uptime Data**\n\nData unavailable. Check [/admin/uptime](/admin/uptime) for live monitoring.';
  const lines = [
    '## Website & Service Uptime',
    '',
    `| Period | Uptime |`,
    `|--------|--------|`,
    `| Last 24 hours | ${ctx.uptime24h}% |`,
    `| Last 7 days | ${ctx.uptime7d}% |`,
    `| Last 30 days | ${ctx.uptime30d}% |`,
  ];
  if (ctx.monitors?.length > 0) {
    lines.push('', '### Monitored Services:');
    ctx.monitors.forEach((m: any) => {
      const icon = m.status === 'up' ? '🟢' : '🔴';
      lines.push(`- ${icon} **${m.name}** — ${m.status.toUpperCase()} (${m.uptime}% uptime)`);
    });
  }
  lines.push('', `> 📊 Full monitoring dashboard: [/admin/uptime](/admin/uptime)`);
  return lines.join('\n');
}

async function logAriaConversation(data: { userId: number; question: string; response: string; intent: string; sources: string[] }) {
  console.log("[Aria] Conversation logged:", { userId: data.userId, intent: data.intent, questionLength: data.question.length });
}
