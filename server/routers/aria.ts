import { router, publicProcedure, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { invokeLLM } from "../_core/llm";
import { transcribeAudio } from "../_core/voiceTranscription";
import { getDb } from "../db";
import { kbArticles } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

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
      const { question, audioUrl, context } = input;

      // If audio provided, transcribe first
      let finalQuestion = question;
      if (audioUrl) {
        try {
      const transcription = await transcribeAudio({
        audioUrl,
        language: "en",
        prompt: "Technical IT terminology: Azure AD, M365, MSAL, Exchange, Teams, SharePoint",
      });
      if ('text' in transcription) {
        finalQuestion = transcription.text;
      }
        } catch (e) {
          console.error("[Aria] Transcription failed:", e);
          // Fall back to text question
        }
      }

      // Detect intent and route
      const intent = detectIntent(finalQuestion);

      let response = "";
      let sources: string[] = [];

      switch (intent) {
        case "kb_search":
          const kbResults = await searchKB(finalQuestion);
          response = formatKBResponse(kbResults);
          sources = kbResults.map((a: any) => `KB-${a.id}: ${a.title}`);
          break;

        case "system_status":
          const status = await getSystemStatus(ctx.user.id);
          response = formatStatusResponse(status);
          sources = ["System Dashboard"];
          break;

        case "ticket_query":
          // TODO: Implement ticket search
          response = "Ticket search coming soon.";
          sources = [];
          break;

        case "technical_question":
        default:
          // Use Claude AI for complex technical questions
          const claudeResponse = await askClaude(finalQuestion, sources);
          response = typeof claudeResponse === "string" ? claudeResponse : JSON.stringify(claudeResponse);
          break;
      }

      // Log conversation
      await logAriaConversation({
        userId: ctx.user.id,
        question: finalQuestion,
        response,
        intent,
        sources,
      });

      return {
        response,
        sources,
        intent,
        transcribedQuestion: audioUrl ? finalQuestion : undefined,
      };
    }),

  /**
   * Search KB articles with phrase-based ranking
   */
  searchKB: publicProcedure
    .input(z.object({ query: z.string().min(1), limit: z.number().int().max(20).default(10) }))
    .query(async ({ input }) => {
      return await searchKB(input.query, input.limit);
    }),

  /**
   * Get system status (uptime, alerts, metrics)
   */
  getSystemStatus: protectedProcedure.query(async ({ ctx }) => {
    return await getSystemStatus(ctx.user.id);
  }),

  /**
   * Get common issues (top KB articles)
   */
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

  /**
   * Get trending articles
   */
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

  /**
   * Admin monitoring: Get active Aria conversations
   */
  getActiveConversations: adminProcedure.query(async () => {
    // TODO: Implement when ariaConversations table is created
    return [];
  }),

  /**
   * Admin takeover: Switch from Aria to human
   */
  takeoverSession: adminProcedure
    .input(z.object({ conversationId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // TODO: Implement session takeover logic
      return { success: true, message: "Session takeover initiated" };
    }),
});

// ============ Helper Functions ============

function detectIntent(question: string): "kb_search" | "system_status" | "ticket_query" | "technical_question" {
  const q = question.toLowerCase();

  if (q.includes("uptime") || q.includes("status") || q.includes("alert") || q.includes("health")) {
    return "system_status";
  }

  if (q.includes("ticket") || q.includes("issue") || q.includes("problem") || q.includes("error")) {
    return "ticket_query";
  }

  if (
    q.includes("how") ||
    q.includes("what") ||
    q.includes("why") ||
    q.includes("powershell") ||
    q.includes("exchange") ||
    q.includes("azure")
  ) {
    return "technical_question";
  }

  return "kb_search";
}

async function searchKB(query: string, limit = 10) {
  const db = await getDb();
  if (!db) return [];

  const allArticles = await db.select().from(kbArticles).where(eq(kbArticles.isPublished, 1));

  const queryTerms = query.toLowerCase().split(/\s+/);
  const scored = allArticles
    .map((article: any) => {
      let score = 0;

      // Exact phrase match in title (highest priority)
      if (article.title.toLowerCase().includes(query.toLowerCase())) {
        score += 500;
      }

      // Exact phrase match in content
      if (article.content.toLowerCase().includes(query.toLowerCase())) {
        score += 300;
      }

      // All terms present in title
      if (queryTerms.every((term: string) => article.title.toLowerCase().includes(term))) {
        score += 250;
      }

      // All terms present in content
      if (queryTerms.every((term: string) => article.content.toLowerCase().includes(term))) {
        score += 150;
      }

      // Individual term matches
      queryTerms.forEach((term: string) => {
        if (article.title.toLowerCase().includes(term)) score += 60;
        if (article.content.toLowerCase().includes(term)) score += 30;
      });

      return { ...article, score };
    })
    .filter((a: any) => a.score > 0)
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, limit);

  return scored;
}

async function getSystemStatus(userId: number) {
  // TODO: Integrate with uptime dashboard, alerts, metrics
  return {
    uptime24h: 99.9,
    uptime7d: 99.95,
    uptime30d: 99.92,
    activeAlerts: 0,
    openTickets: 0,
    kbArticles: 932,
  };
}

async function askClaude(question: string, sources: string[]) {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are Aria, the GigitekAI Command Center AI. You are an expert in Microsoft 365, Azure, Exchange, Teams, SharePoint, Entra ID, and enterprise IT. 
          
          Provide concise, actionable answers to technical questions. When answering:
          1. Be specific with steps or commands
          2. Include PowerShell/CLI examples when relevant
          3. Mention best practices
          4. Keep responses under 200 words unless the user asks for more detail
          
          If you don't know something, say so and suggest checking the KB or escalating to support.`,
        },
        {
          role: "user",
          content: question,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    return typeof content === "string" ? content : "Unable to generate response";
  } catch (e) {
    console.error("[Aria] Claude API error:", e);
    return "I encountered an error processing your question. Please try again or escalate to support.";
  }
}

function formatKBResponse(articles: any[]) {
  if (articles.length === 0) {
    return "No matching KB articles found. Try a different search or ask a technical question.";
  }

  return (
    `Found ${articles.length} relevant KB articles:\n\n` +
    articles
      .slice(0, 5)
      .map((a, i) => `${i + 1}. **${a.title}** (${a.category})\n   ${a.content.substring(0, 100)}...`)
      .join("\n\n")
  );
}

function formatStatusResponse(status: any) {
  return `**System Status:**
- Uptime (24h): ${status.uptime24h}%
- Uptime (7d): ${status.uptime7d}%
- Uptime (30d): ${status.uptime30d}%
- Active Alerts: ${status.activeAlerts}
- Open Tickets: ${status.openTickets}
- KB Articles: ${status.kbArticles}`;
}

async function logAriaConversation(data: any) {
  // TODO: Implement when ariaConversations table is created
  console.log("[Aria] Conversation logged:", data);
}
