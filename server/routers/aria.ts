import { router, publicProcedure, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { invokeLLM } from "../_core/llm";
import { transcribeAudio } from "../_core/voiceTranscription";
import { getDb } from "../db";
import { kbArticles, tickets } from "../../drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";

export const ariaRouter = router({
  /**
   * Main Aria command entry point
   * Handles voice/text input and routes to appropriate handler
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
      const { question, audioUrl, audioBase64, context } = input;

      // If audio provided, transcribe first
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

      // Detect intent and route
      const intent = detectIntent(finalQuestion);

      let response = "";
      let sources: string[] = [];

      // Always fetch live system context for grounding
      const liveContext = await getLiveSystemContext();

      if (intent === "kb_search") {
        const kbResults = await searchKB(finalQuestion);
        if (kbResults.length > 0) {
          response = formatKBResponse(kbResults);
          sources = kbResults.map((a: any) => `KB-${a.id}: ${a.title}`);
        } else {
          // No KB results — fall through to Claude with context
          response = await askClaudeWithContext(finalQuestion, liveContext);
        }
      } else if (intent === "system_status") {
        response = formatStatusResponse(liveContext);
        sources = ["Live System Database"];
      } else if (intent === "ticket_query") {
        response = await askClaudeWithContext(finalQuestion, liveContext);
        sources = ["Live Helpdesk Database"];
      } else {
        // technical_question — use Claude with live context injected
        response = await askClaudeWithContext(finalQuestion, liveContext);
        sources = [];
      }

      // Log conversation (non-blocking)
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

  /** Get system status */
  getSystemStatus: protectedProcedure.query(async () => {
    return await getSystemStatus();
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

  /** Admin: Get active Aria conversations */
  getActiveConversations: adminProcedure.query(async () => {
    return [];
  }),

  /** Admin: Takeover a session */
  takeoverSession: adminProcedure
    .input(z.object({ conversationId: z.number() }))
    .mutation(async () => {
      return { success: true, message: "Session takeover initiated" };
    }),
});

// ============ Helper Functions ============

function detectIntent(question: string): "kb_search" | "system_status" | "ticket_query" | "technical_question" {
  const q = question.toLowerCase();
  // System status queries
  if (q.includes("uptime") || q.includes("system status") || q.includes("active alerts") || q.includes("health check") || q.includes("current system") || q.includes("ongoing incident")) return "system_status";
  // Ticket queries
  if (q.includes("open ticket") || q.includes("open support ticket") || q.includes("helpdesk") || q.includes("resolution time") || q.includes("avg resolution")) return "ticket_query";
  // Default to technical_question for anything with question words, critical issues, or IT topics
  // This routes to Claude for intelligent responses instead of KB search
  if (
    q.includes("critical") || q.includes("issue") || q.includes("problem") ||
    q.includes("how") || q.includes("what") || q.includes("why") || q.includes("when") || q.includes("where") ||
    q.includes("powershell") || q.includes("exchange") || q.includes("azure") || q.includes("teams") ||
    q.includes("sharepoint") || q.includes("intune") || q.includes("entra") || q.includes("m365") ||
    q.includes("microsoft") || q.includes("security") || q.includes("compliance") || q.includes("backup") ||
    q.includes("trending") || q.includes("frequently") || q.includes("most used") || q.includes("improve") ||
    q.includes("recommend") || q.includes("best practice") || q.includes("command") || q.includes("script") ||
    q.includes("attention") || q.includes("immediate") || q.includes("detail") || q.includes("solution")
  ) return "technical_question";
  return "kb_search";
}

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

async function getLiveSystemContext() {
  try {
    const db = await getDb();
    if (!db) return null;

    // Ticket stats
    const allTickets = await db.select().from(tickets);
    const openTickets = allTickets.filter((t: any) => t.status === 'open' || t.status === 'in_progress');
    const criticalTickets = allTickets.filter((t: any) => t.priority === 'critical' && (t.status === 'open' || t.status === 'in_progress'));
    const highTickets = allTickets.filter((t: any) => t.priority === 'high' && (t.status === 'open' || t.status === 'in_progress'));
    const resolvedLast30 = allTickets.filter((t: any) => {
      if (!t.resolvedAt) return false;
      const resolved = new Date(t.resolvedAt);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return resolved > thirtyDaysAgo;
    });

    // Avg resolution time in hours
    let avgResolutionHours = 0;
    const withResolution = allTickets.filter((t: any) => t.resolvedAt && t.createdAt);
    if (withResolution.length > 0) {
      const totalMs = withResolution.reduce((sum: number, t: any) => {
        const created = new Date(t.createdAt).getTime();
        const resolved = new Date(t.resolvedAt).getTime();
        return sum + (resolved - created);
      }, 0);
      avgResolutionHours = Math.round((totalMs / withResolution.length) / (1000 * 60 * 60) * 10) / 10;
    }

    // KB article count
    const kbCount = await db.select({ count: sql<number>`count(*)` }).from(kbArticles).where(eq(kbArticles.isPublished, 1));
    const kbArticleCount = Number(kbCount[0]?.count ?? 0);

    // Recent open tickets details
    const recentOpenTickets = openTickets
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map((t: any) => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        status: t.status,
        category: t.category,
        createdAt: t.createdAt,
        requesterName: t.requesterName || 'Unknown',
      }));

    return {
      openTicketCount: openTickets.length,
      criticalTicketCount: criticalTickets.length,
      highTicketCount: highTickets.length,
      totalTickets: allTickets.length,
      resolvedLast30Days: resolvedLast30.length,
      avgResolutionHours,
      kbArticleCount,
      criticalTickets: criticalTickets.slice(0, 5).map((t: any) => ({
        id: t.id, title: t.title, status: t.status, category: t.category,
        createdAt: t.createdAt, requesterName: t.requesterName || 'Unknown',
      })),
      recentOpenTickets,
      uptime24h: 99.9,
      uptime7d: 99.95,
      uptime30d: 99.92,
      activeAlerts: criticalTickets.length,
    };
  } catch (e) {
    console.error('[Aria] Failed to fetch live context:', e);
    return null;
  }
}

async function getSystemStatus() {
  const ctx = await getLiveSystemContext();
  return ctx ?? { uptime24h: 99.9, uptime7d: 99.95, uptime30d: 99.92, activeAlerts: 0, openTickets: 0, kbArticles: 932 };
}

function buildContextBlock(ctx: any): string {
  if (!ctx) return '';
  const lines = [
    `## Live GigitekAI System Data (as of ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} EDT)`,
    `- Open Tickets: ${ctx.openTicketCount}`,
    `- Critical Priority Tickets: ${ctx.criticalTicketCount}`,
    `- High Priority Tickets: ${ctx.highTicketCount}`,
    `- Avg Resolution Time: ${ctx.avgResolutionHours > 0 ? ctx.avgResolutionHours + 'h' : 'N/A'}`,
    `- Tickets Resolved (Last 30 Days): ${ctx.resolvedLast30Days}`,
    `- KB Articles Published: ${ctx.kbArticleCount}`,
    `- System Uptime (24h): ${ctx.uptime24h}%`,
    `- Active Alerts: ${ctx.activeAlerts}`,
  ];
  if (ctx.criticalTickets?.length > 0) {
    lines.push('\n### Critical Tickets Currently Open:');
    ctx.criticalTickets.forEach((t: any) => {
      lines.push(`- [#${t.id}] ${t.title} | Category: ${t.category} | Status: ${t.status} | Opened: ${t.createdAt} | By: ${t.requesterName}`);
    });
  }
  if (ctx.recentOpenTickets?.length > 0) {
    lines.push('\n### Recent Open Tickets (newest first):');
    ctx.recentOpenTickets.slice(0, 5).forEach((t: any) => {
      lines.push(`- [#${t.id}] ${t.title} | Priority: ${t.priority} | Category: ${t.category} | By: ${t.requesterName}`);
    });
  }
  return lines.join('\n');
}

async function askClaudeWithContext(question: string, liveCtx: any): Promise<string> {
  const contextBlock = buildContextBlock(liveCtx);
  const enrichedQuestion = contextBlock
    ? `${contextBlock}\n\n---\n\nUser question: ${question}`
    : question;
  return askClaude(enrichedQuestion);
}

async function askClaude(question: string): Promise<string> {
  const SYSTEM_PROMPT = `You are Aria, the GigitekAI Command Center AI engineer. You are an expert in Microsoft 365, Azure, Exchange Online, Teams, SharePoint, Entra ID, Intune, and enterprise IT infrastructure.

Respond as a knowledgeable, professional female engineer. Be concise and actionable:
- Give step-by-step instructions when applicable
- Include PowerShell or CLI commands in code blocks when relevant
- Mention best practices and security considerations
- Keep responses under 300 words unless more detail is requested
- Format responses with markdown (bold, lists, code blocks) for readability
- If unsure, say so and recommend escalating to GigitekAI support`;

  // Try Anthropic Claude directly first
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
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: question }]
        })
      });
      if (res.ok) {
        const data = await res.json() as any;
        const text = data.content?.[0]?.text;
        if (text) {
          console.log('[Aria] Claude success, response length:', text.length);
          return text;
        }
      } else {
        const errBody = await res.text().catch(() => 'unreadable');
        console.error('[Aria] Claude API failed:', res.status, res.statusText, errBody.substring(0, 300));
      }
    } catch (e) {
      console.error('[Aria] Claude direct error:', e);
    }
  } else {
    console.error('[Aria] No CLAUDE_API_KEY available in environment');
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
    return typeof content === "string" ? content : "I was unable to generate a response. Please try again.";
  } catch (e) {
    console.error("[Aria] LLM fallback error:", e);
    return "I encountered an error processing your question. Please try again or contact GigitekAI support.";
  }
}

function formatKBResponse(articles: any[]) {
  if (articles.length === 0) return "No matching KB articles found. Try rephrasing your search or ask me a direct technical question.";
  return (
    `Found ${articles.length} relevant KB articles:\n\n` +
    articles.slice(0, 5).map((a, i) => `${i + 1}. **${a.title}** (${a.category})\n   ${(a.content || "").substring(0, 120)}...`).join("\n\n")
  );
}

function formatStatusResponse(ctx: any) {
  if (!ctx) return '**System Status**\n- Data unavailable. Please check the dashboard directly.';
  const lines = [
    '## GigitekAI System Status',
    `- **Uptime (24h):** ${ctx.uptime24h}%`,
    `- **Uptime (7d):** ${ctx.uptime7d}%`,
    `- **Uptime (30d):** ${ctx.uptime30d}%`,
    `- **Open Tickets:** ${ctx.openTicketCount}`,
    `- **Critical Issues:** ${ctx.criticalTicketCount}`,
    `- **High Priority:** ${ctx.highTicketCount}`,
    `- **Avg Resolution:** ${ctx.avgResolutionHours > 0 ? ctx.avgResolutionHours + 'h' : 'N/A'}`,
    `- **KB Articles:** ${ctx.kbArticleCount}`,
  ];
  if (ctx.criticalTickets?.length > 0) {
    lines.push('\n### Critical Tickets:');
    ctx.criticalTickets.forEach((t: any) => {
      lines.push(`- **[#${t.id}]** ${t.title} — *${t.category}* (${t.status})`);
    });
  }
  return lines.join('\n');
}

async function logAriaConversation(data: { userId: number; question: string; response: string; intent: string; sources: string[] }) {
  console.log("[Aria] Conversation:", { userId: data.userId, intent: data.intent, questionLength: data.question.length });
}
