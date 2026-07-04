/**
 * Admin Search — Master AI Operations Brain
 *
 * Provides real-time intelligence across all GigitekAI systems:
 * - Helpdesk tickets (open/closed/in-progress counts, recent activity)
 * - Knowledge Base articles (search, stats)
 * - Contact submissions & leads
 * - Blog & newsletter stats
 * - UptimeRobot website monitoring
 * - Call logs & analytics
 * - Client roster
 * - System health summary
 */
import { router, adminProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { callLLM, getAvailableModels } from "../_core/multiLLM";
import { getDb } from "../db";
import { searchKBArticles } from "../search";
import { eq, like, or, count, and, desc, gte, sql } from "drizzle-orm";
import {
  kbArticles,
  tickets,
  contactSubmissions,
  blogPosts,
  chatLeads,
  callLogs,
  clients,
  users,
  ticketReplies,
  freeAuditSubmissions,
} from "../../drizzle/schema";

// ─── Uptime Robot helper ────────────────────────────────────────────────────
async function fetchUptimeRobotStatus(): Promise<string> {
  try {
    const apiKey = process.env.UPTIMEROBOT_API_KEY;
    if (!apiKey) return "UptimeRobot API key not configured.";

    const res = await fetch("https://api.uptimerobot.com/v2/getMonitors", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        api_key: apiKey,
        format: "json",
        logs: "0",
      }),
    });

    if (!res.ok) return "UptimeRobot API unavailable.";
    const data = await res.json() as any;

    if (data.stat !== "ok" || !data.monitors?.length) {
      return "No monitors found in UptimeRobot.";
    }

    const statusMap: Record<number, string> = {
      0: "⏸ Paused",
      1: "⚠️ Not Checked",
      2: "✅ Up",
      8: "⚠️ Seems Down",
      9: "🔴 Down",
    };

    const lines = data.monitors.map((m: any) => {
      const status = statusMap[m.status] ?? `Status ${m.status}`;
      const uptime = m.all_time_uptime_ratio ? ` | Uptime: ${parseFloat(m.all_time_uptime_ratio).toFixed(2)}%` : "";
      return `  - ${m.friendly_name}: ${status}${uptime}`;
    });

    const downCount = data.monitors.filter((m: any) => m.status === 9).length;
    const upCount = data.monitors.filter((m: any) => m.status === 2).length;

    return `UptimeRobot (${upCount} up, ${downCount} down of ${data.monitors.length} monitors):\n${lines.join("\n")}`;
  } catch {
    return "UptimeRobot data unavailable.";
  }
}

// ─── Live data aggregator ────────────────────────────────────────────────────
async function buildLiveContext(scope: {
  kb: boolean;
  tickets: boolean;
  system: boolean;
  docs: boolean;
  customers: boolean;
  leads: boolean;
  calls: boolean;
  blog: boolean;
}, query: string): Promise<{ sections: string[]; stats: Record<string, any> }> {
  const db = await getDb();
  if (!db) return { sections: ["Database unavailable."], stats: {} };

  const sections: string[] = [];
  const stats: Record<string, any> = {};
  // All timestamps in DB are stored as strings (mode: 'string')
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
  void sevenDaysAgo; // used in getQuickStats

  // ── TICKETS ────────────────────────────────────────────────────────────────
  if (scope.tickets) {
    try {
      // Counts by status
      const [openCount] = await db.select({ c: count() }).from(tickets).where(eq(tickets.status, "open"));
      const [inProgressCount] = await db.select({ c: count() }).from(tickets).where(eq(tickets.status, "in_progress"));
      const [resolvedCount] = await db.select({ c: count() }).from(tickets).where(eq(tickets.status, "resolved"));
      const [closedCount] = await db.select({ c: count() }).from(tickets).where(eq(tickets.status, "closed"));
      const [totalCount] = await db.select({ c: count() }).from(tickets);
      const [criticalCount] = await db.select({ c: count() }).from(tickets).where(sql`${tickets.priority} = 'critical' AND ${tickets.status} = 'open'`);

      // Recent tickets (last 30 days)
      const recentTickets = await db
        .select({ title: tickets.title, status: tickets.status, priority: tickets.priority, category: tickets.category, createdAt: tickets.createdAt })
        .from(tickets)
        .where(sql`${tickets.createdAt} >= ${thirtyDaysAgo}`)
        .orderBy(desc(tickets.createdAt))
        .limit(10);

      // Keyword search
      const searchResults = query.length > 2
        ? await db.select({ title: tickets.title, status: tickets.status, priority: tickets.priority, description: tickets.description })
            .from(tickets)
            .where(or(like(tickets.title, `%${query}%`), like(tickets.description, `%${query}%`)))
            .limit(5)
        : [];

      stats.tickets = {
        open: openCount.c, inProgress: inProgressCount.c,
        resolved: resolvedCount.c, closed: closedCount.c,
        total: totalCount.c, criticalOpen: criticalCount.c,
      };

      let ticketSection = `HELPDESK TICKET SUMMARY:\n`;
      ticketSection += `  Total: ${totalCount.c} | Open: ${openCount.c} | In Progress: ${inProgressCount.c} | Resolved: ${resolvedCount.c} | Closed: ${closedCount.c}\n`;
      ticketSection += `  Critical Open: ${criticalCount.c}\n`;

      if (recentTickets.length > 0) {
        ticketSection += `\nRecent Tickets (last 30 days):\n`;
        ticketSection += recentTickets.map(t =>
          `  - [${t.status?.toUpperCase()}] ${t.title} | Priority: ${t.priority} | Category: ${t.category}`
        ).join("\n");
      }

      if (searchResults.length > 0) {
        ticketSection += `\nTickets matching "${query}":\n`;
        ticketSection += searchResults.map(t =>
          `  - [${t.status}] ${t.title} | ${t.description?.substring(0, 150)}`
        ).join("\n");
      }

      sections.push(ticketSection);
    } catch (e) {
      sections.push("Ticket data temporarily unavailable.");
    }
  }

  // ── KNOWLEDGE BASE ─────────────────────────────────────────────────────────
  if (scope.kb) {
    try {
      const [kbTotal] = await db.select({ c: count() }).from(kbArticles);
      const [kbPublished] = await db.select({ c: count() }).from(kbArticles).where(eq(kbArticles.isPublished, 1));

      // Use semantic search to find relevant KB articles (returns up to 20 results)
      const kbSearch = await searchKBArticles(query, 20);


      const recentKb = await db
        .select({ title: kbArticles.title, category: kbArticles.category, isPublished: kbArticles.isPublished })
        .from(kbArticles)
        .orderBy(desc(kbArticles.createdAt))
        .limit(5);

      stats.kb = { total: kbTotal.c, published: kbPublished.c, searchResults: kbSearch.length };

      let kbSection = `KNOWLEDGE BASE:\n  Total Articles: ${kbTotal.c} | Published: ${kbPublished.c}\n`;

      if (kbSearch.length > 0) {
        kbSection += `\nTop ${kbSearch.length} Relevant KB Articles for "${query}":\n`;
        kbSection += kbSearch.map((a, idx) => {
          const metadata = a.metadata ? (typeof a.metadata === 'string' ? JSON.parse(a.metadata) : a.metadata) : {};
          const content = (a.content || a.excerpt || 'No content available').substring(0, 500);
          const articleLink = `[${a.title}](${a.url})`;
          return `\n${idx + 1}. ${articleLink}\n   Category: ${metadata.category || 'General'} | Difficulty: ${metadata.difficulty || 'intermediate'}\n   Content:\n${content.split('\n').map(line => `   ${line}`).join('\n')}`;
        }).join("\n");
      } else {
        kbSection += `\nNo KB articles found matching "${query}". Showing recent articles:\n`;
        if (recentKb.length > 0) {
          kbSection += recentKb.map(a => `  - [${a.isPublished ? 'published' : 'draft'}] ${a.title} (${a.category})`).join("\n");
        }
      }

      // Add note about clicking links to view full articles
      kbSection += `\n\n📖 **Click on article titles to view full content**`;

      sections.push(kbSection);
    } catch {
      sections.push("KB data temporarily unavailable.");
    }
  }

  // ── LEADS & CONTACTS ───────────────────────────────────────────────────────
  if (scope.leads || scope.customers) {
    try {
      const [contactTotal] = await db.select({ c: count() }).from(contactSubmissions);
      const [contactRecent] = await db.select({ c: count() }).from(contactSubmissions)        .where(sql`${contactSubmissions.createdAt} >= ${thirtyDaysAgo}`);
      const [chatLeadTotal] = await db.select({ c: count() }).from(chatLeads);
      const [auditTotal] = await db.select({ c: count() }).from(freeAuditSubmissions);

      const recentContacts = await db
        .select({ name: contactSubmissions.name, email: contactSubmissions.email, subject: contactSubmissions.subject, createdAt: contactSubmissions.createdAt })
        .from(contactSubmissions)
        .orderBy(desc(contactSubmissions.createdAt))
        .limit(5);

      stats.leads = { contacts: contactTotal.c, recentContacts: contactRecent.c, chatLeads: chatLeadTotal.c, auditRequests: auditTotal.c };

      let leadsSection = `LEADS & CONTACTS:\n`;
      leadsSection += `  Contact Form Submissions: ${contactTotal.c} (${contactRecent.c} in last 30 days)\n`;
      leadsSection += `  Chat Leads: ${chatLeadTotal.c} | Free Audit Requests: ${auditTotal.c}\n`;

      if (recentContacts.length > 0) {
        leadsSection += `\nRecent Contact Submissions:\n`;
        leadsSection += recentContacts.map(c =>
          `  - ${c.name} (${c.email}) | Subject: ${c.subject} | ${new Date(c.createdAt!).toLocaleDateString()}`
        ).join("\n");
      }

      sections.push(leadsSection);
    } catch {
      sections.push("Lead/contact data temporarily unavailable.");
    }
  }

  // ── BLOG ──────────────────────────────────────────────────────────────────
  if (scope.blog || scope.docs) {
    try {
      const [blogTotal] = await db.select({ c: count() }).from(blogPosts);
      const [blogPublished] = await db.select({ c: count() }).from(blogPosts).where(eq(blogPosts.published, 1));

      const recentBlogs = await db
        .select({ title: blogPosts.title, published: blogPosts.published, publishedAt: blogPosts.publishedAt })
        .from(blogPosts)
        .orderBy(desc(blogPosts.createdAt))
        .limit(5);

      stats.blog = { total: blogTotal.c, published: blogPublished.c };

      let blogSection = `BLOG:\n  Total Posts: ${blogTotal.c} | Published: ${blogPublished.c}\n`;
      if (recentBlogs.length > 0) {
        blogSection += `Recent Posts:\n`;
        blogSection += recentBlogs.map(b => `  - [${b.published ? 'published' : 'draft'}] ${b.title}`).join("\n");
      }
      sections.push(blogSection);
    } catch {
      sections.push("Blog data temporarily unavailable.");
    }
  }

  // ── CALLS ─────────────────────────────────────────────────────────────────
  if (scope.calls) {
    try {
      const [callTotal] = await db.select({ c: count() }).from(callLogs);
      const [callRecent] = await db.select({ c: count() }).from(callLogs)        .where(sql`${callLogs.createdAt} >= ${thirtyDaysAgo}`);

      stats.calls = { total: callTotal.c, recent: callRecent.c };

      sections.push(`CALL LOGS:\n  Total Calls: ${callTotal.c} | Last 30 Days: ${callRecent.c}`);
    } catch {
      sections.push("Call data temporarily unavailable.");
    }
  }

  // ── CLIENTS ───────────────────────────────────────────────────────────────
  if (scope.customers) {
    try {
      const [clientTotal] = await db.select({ c: count() }).from(clients);
      const clientList = await db
        .select({ companyName: clients.companyName, serviceType: clients.serviceType, status: clients.status, annualContractValue: clients.annualContractValue })
        .from(clients)
        .limit(20);

      stats.clients = { total: clientTotal.c };

      let clientSection = `CLIENTS:\n  Total Clients: ${clientTotal.c}\n`;
      if (clientList.length > 0) {
        clientSection += `Client List:\n`;
        clientSection += clientList.map(c =>
          `  - ${c.companyName} | Service: ${c.serviceType ?? "N/A"} | Status: ${c.status ?? "N/A"} | ACV: $${c.annualContractValue ?? "N/A"}`
        ).join("\n");
      }
      sections.push(clientSection);
    } catch {
      sections.push("Client data temporarily unavailable.");
    }
  }

  // ── SYSTEM / UPTIME ────────────────────────────────────────────────────────
  if (scope.system) {
    const uptimeStatus = await fetchUptimeRobotStatus();
    sections.push(`SYSTEM STATUS:\n${uptimeStatus}\n  Server Time: ${new Date().toISOString()}`);
  }

  return { sections, stats };
}

// ─── Router ──────────────────────────────────────────────────────────────────
export const adminSearchRouter = router({
  /**
   * Master AI search — queries all live data sources and answers with full context
   */
  search: adminProcedure
    .input(
      z.object({
        query: z.string().min(1).max(1000),
        model: z.enum(["claude", "manus", "gemini"]),
        scope: z.object({
          kb: z.boolean().default(true),
          tickets: z.boolean().default(true),
          system: z.boolean().default(true),
          docs: z.boolean().default(false),
          customers: z.boolean().default(false),
          leads: z.boolean().default(true),
          calls: z.boolean().default(false),
          blog: z.boolean().default(false),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { sections, stats } = await buildLiveContext(input.scope, input.query);

      const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

      const systemPrompt = `You are ARIA — the Master AI Operations Brain for GigitekAI, an AI-first Managed Services Provider.
You have real-time access to live operational data from the GigitekAI platform as of ${today}.

LIVE OPERATIONAL DATA:
${sections.join("\n\n")}

QUICK STATS SUMMARY:
${JSON.stringify(stats, null, 2)}

YOUR ROLE:
- Answer questions about tickets, leads, clients, KB articles, blog, calls, and system status
- Provide actionable insights and recommendations
- Be concise but complete — use bullet points and numbers
- When asked for counts or stats, always cite the exact numbers from the live data above
- If data for a requested topic is not in scope, say so clearly and suggest enabling that scope
- You are speaking to GigitekAI admins and technicians — be professional and direct
- For "status report" or "full summary" requests, provide a structured overview of all available data
- Always mention the data is live and as of today's date

KNOWLEDGE BASE INSTRUCTIONS:
- When the user asks about KB articles or topics, use the "Relevant KB Articles" section from LIVE OPERATIONAL DATA
- IMPORTANT: Display ALL search results provided, not just a few
- List each article with its title, URL, category, and difficulty level
- Format each article as: **[Title]** - Category: X, Difficulty: Y, URL: /kb/ID
- If KB search found results, list them ALL with their URLs
- If no KB results are shown, it means no matching articles were found in the search

CAPABILITIES YOU CAN REPORT ON:
✅ Helpdesk tickets (counts by status, recent activity, critical tickets)
✅ Knowledge Base (article counts, search, categories)
✅ Contact form submissions & chat leads
✅ Free audit requests
✅ Blog post counts
✅ UptimeRobot website monitoring
✅ Client roster
✅ Call log counts

Respond concisely. Use markdown formatting with headers and bullet points for readability.`;

      const llmResponse = await callLLM(input.model, [
        { role: "system", content: systemPrompt },
        { role: "user", content: input.query },
      ]);

      const answer = llmResponse.content || "No response from AI. Please try again.";

      return {
        query: input.query,
        model: input.model,
        answer,
        stats,
        context: sections.length,
        sources: input.scope,
      };
    }),

  /**
   * Get quick stats for the dashboard header
   */
  getQuickStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');

    try {
      const [openTickets] = await db.select({ c: count() }).from(tickets).where(eq(tickets.status, "open"));
      const [criticalTickets] = await db.select({ c: count() }).from(tickets).where(sql`${tickets.priority} = 'critical' AND ${tickets.status} = 'open'`);
      const [kbTotal] = await db.select({ c: count() }).from(kbArticles);
      const [contactRecent] = await db.select({ c: count() }).from(contactSubmissions)
        .where(sql`${contactSubmissions.createdAt} >= ${sevenDaysAgo}`);
      const [totalTickets] = await db.select({ c: count() }).from(tickets);
      const [resolvedTickets] = await db.select({ c: count() }).from(tickets).where(eq(tickets.status, "resolved"));

      return {
        openTickets: openTickets.c,
        criticalTickets: criticalTickets.c,
        kbArticles: kbTotal.c,
        newLeads: contactRecent.c,
        totalTickets: totalTickets.c,
        resolvedTickets: resolvedTickets.c,
        resolutionRate: totalTickets.c > 0 ? Math.round((resolvedTickets.c / totalTickets.c) * 100) : 0,
      };
    } catch {
      return null;
    }
  }),

  /**
   * Get available search scopes
   */
  getScopes: protectedProcedure.query(async () => {
    return {
      tickets: { label: "Helpdesk Tickets", enabled: true, icon: "🎫" },
      kb: { label: "Knowledge Base", enabled: true, icon: "📚" },
      leads: { label: "Leads & Contacts", enabled: true, icon: "📬" },
      system: { label: "System & Uptime", enabled: true, icon: "🖥️" },
      customers: { label: "Clients & Customers", enabled: true, icon: "🏢" },
      calls: { label: "Call Logs", enabled: true, icon: "📞" },
      blog: { label: "Blog & Content", enabled: true, icon: "✍️" },
      docs: { label: "Documentation", enabled: false, icon: "📄" },
    };
  }),

  /**
   * Get available LLM models
   */
  getModels: protectedProcedure.query(async () => {
    return getAvailableModels();
  }),
});
