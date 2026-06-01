/**
 * Ticket AI Analysis Router
 * Provides AI-powered ticket analysis: auto-categorization, KB solution matching,
 * priority scoring, sentiment detection, and draft reply generation.
 */

import { router, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { callLLM } from "../_core/multiLLM";
import { getDb } from "../db";
import { eq, desc, inArray } from "drizzle-orm";
import { tickets, ticketReplies, kbArticles } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

/**
 * Fetch KB articles relevant to a ticket description
 */
async function fetchRelevantKB(
  description: string,
  _category: string,
  limit = 5
): Promise<Array<{ id: number; title: string; content: string; category: string }>> {
  const db = await getDb();
  if (!db) return [];

  const articles = await db
    .select({
      id: kbArticles.id,
      title: kbArticles.title,
      content: kbArticles.content,
      category: kbArticles.category,
    })
    .from(kbArticles)
    .where(eq(kbArticles.isPublished, 1))
    .orderBy(desc(kbArticles.viewCount))
    .limit(20);

  // Simple keyword matching to find relevant articles
  const descWords = description.toLowerCase().split(/\s+/);
  const scored = articles.map((a) => {
    const text = `${a.title} ${a.content} ${a.category}`.toLowerCase();
    const score = descWords.filter((w) => w.length > 3 && text.includes(w)).length;
    return { ...a, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ score: _score, ...rest }) => rest);
}

/**
 * Fetch ticket with replies for context
 */
async function fetchTicketWithReplies(ticketId: number) {
  const db = await getDb();
  if (!db) return null;

  const [ticket] = await db
    .select()
    .from(tickets)
    .where(eq(tickets.id, ticketId))
    .limit(1);

  if (!ticket) return null;

  const replies = await db
    .select()
    .from(ticketReplies)
    .where(eq(ticketReplies.ticketId, ticketId))
    .orderBy(desc(ticketReplies.createdAt))
    .limit(10);

  return { ticket, replies };
}

export const ticketAIRouter = router({
  /**
   * Analyze a single ticket: categorize, score priority, detect sentiment,
   * and suggest KB solutions.
   */
  analyzeTicket: adminProcedure
    .input(
      z.object({
        ticketId: z.number().int().positive(),
        model: z.enum(["claude", "manus", "gemini"]).default("claude"),
      })
    )
    .mutation(async ({ input }) => {
      const data = await fetchTicketWithReplies(input.ticketId);
      if (!data) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
      }

      const { ticket, replies } = data;
      const kbContext = await fetchRelevantKB(ticket.description, ticket.category);

      const replyHistory =
        replies.length > 0
          ? replies
              .map((r) => `[${r.isStaffReply ? "Staff" : "User"}] ${r.message}`)
              .join("\n")
          : "No replies yet.";

      const kbSummary =
        kbContext.length > 0
          ? kbContext
              .map((a) => `KB #${a.id}: ${a.title}\n${a.content.slice(0, 300)}`)
              .join("\n---\n")
          : "No relevant KB articles found.";

      const systemPrompt = `You are an expert IT helpdesk AI for GigitekAI, an MSP specializing in Microsoft 365, cloud infrastructure, and cybersecurity.

Analyze the following support ticket and return a JSON object with these exact fields:
- category: string (one of: email, printer, internet, network, bug_report, feature_request, billing, general_support, other)
- priority: string (one of: low, medium, high, critical)
- priorityScore: number (1-10, where 10 is most urgent)
- sentiment: string (one of: positive, neutral, frustrated, angry, urgent)
- sentimentScore: number (1-10, where 10 is most negative/urgent)
- summary: string (1-2 sentence summary of the issue)
- rootCause: string (likely root cause based on description)
- suggestedSolutions: array of strings (2-4 actionable steps to resolve)
- relevantKBIds: array of numbers (IDs of KB articles that apply)
- escalationRequired: boolean (true if needs senior tech or vendor escalation)
- estimatedResolutionTime: string (e.g., "15 minutes", "1-2 hours", "1 day")
- confidence: number (0-1, your confidence in this analysis)

Respond ONLY with valid JSON, no markdown or explanation.`;

      const userPrompt = `TICKET #${ticket.id}
Title: ${ticket.title}
Category: ${ticket.category}
Priority: ${ticket.priority}
Status: ${ticket.status}
Description: ${ticket.description}
Steps Attempted: ${ticket.stepsAttempted || "None provided"}

REPLY HISTORY:
${replyHistory}

RELEVANT KB ARTICLES:
${kbSummary}`;

      const llmResponse = await callLLM(input.model, [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ]);

      let analysis: Record<string, unknown>;
      try {
        const jsonStr = llmResponse.content
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();
        analysis = JSON.parse(jsonStr);
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "AI returned invalid JSON. Please try again.",
        });
      }

      // Persist AI analysis back to ticket
      const db = await getDb();
      if (db) {
        await db
          .update(tickets)
          .set({
            aiCategory: String(analysis.category || ticket.category),
            aiPriority: String(analysis.priority || ticket.priority),
            aiReasoning: String(analysis.summary || ""),
          })
          .where(eq(tickets.id, ticket.id));
      }

      return {
        ticketId: ticket.id,
        model: input.model,
        analysis,
        kbArticlesUsed: kbContext.map((a) => ({ id: a.id, title: a.title })),
      };
    }),

  /**
   * Generate a draft reply for a ticket using KB context and ticket history
   */
  suggestResponse: adminProcedure
    .input(
      z.object({
        ticketId: z.number().int().positive(),
        tone: z.enum(["professional", "friendly", "technical"]).default("professional"),
        model: z.enum(["claude", "manus", "gemini"]).default("claude"),
      })
    )
    .mutation(async ({ input }) => {
      const data = await fetchTicketWithReplies(input.ticketId);
      if (!data) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
      }

      const { ticket, replies } = data;
      const kbContext = await fetchRelevantKB(ticket.description, ticket.category, 3);

      const replyHistory =
        replies.length > 0
          ? replies
              .map((r) => `[${r.isStaffReply ? "Staff" : "User"}] ${r.message}`)
              .join("\n")
          : "No previous replies.";

      const kbSummary =
        kbContext.length > 0
          ? kbContext
              .map((a) => `KB: ${a.title}\n${a.content.slice(0, 400)}`)
              .join("\n---\n")
          : "";

      const toneInstructions: Record<string, string> = {
        professional: "formal and professional, suitable for enterprise clients",
        friendly: "warm and approachable while remaining helpful",
        technical: "detailed and technical, assuming the user has IT knowledge",
      };

      const systemPrompt = `You are a senior IT support technician at GigitekAI, an MSP specializing in Microsoft 365, cloud infrastructure, and cybersecurity.

Write a ${toneInstructions[input.tone]} reply to the following support ticket. The reply should:
1. Acknowledge the issue empathetically
2. Provide clear, actionable steps to resolve it
3. Reference any relevant KB solutions
4. Set expectations for resolution time
5. End with a professional closing

Keep the reply concise (under 300 words). Do not use markdown headers. Use numbered lists for steps.`;

      const userPrompt = `TICKET #${ticket.id}: ${ticket.title}

User's issue: ${ticket.description}
Steps they've tried: ${ticket.stepsAttempted || "None"}
Priority: ${ticket.priority}

CONVERSATION HISTORY:
${replyHistory}

${kbSummary ? `RELEVANT KB SOLUTIONS:\n${kbSummary}` : ""}

Write a helpful reply to this ticket.`;

      const llmResponse = await callLLM(input.model, [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ]);

      return {
        ticketId: ticket.id,
        model: input.model,
        tone: input.tone,
        draftReply: llmResponse.content,
        kbArticlesUsed: kbContext.map((a) => ({ id: a.id, title: a.title })),
      };
    }),

  /**
   * Batch analyze multiple tickets (up to 20 at once)
   * Returns priority scores and categories for quick triage
   */
  batchAnalyze: adminProcedure
    .input(
      z.object({
        ticketIds: z.array(z.number().int().positive()).min(1).max(20),
        model: z.enum(["claude", "manus", "gemini"]).default("manus"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      const ticketList = await db
        .select({
          id: tickets.id,
          title: tickets.title,
          description: tickets.description,
          category: tickets.category,
          priority: tickets.priority,
          status: tickets.status,
        })
        .from(tickets)
        .where(inArray(tickets.id, input.ticketIds));

      if (ticketList.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No tickets found" });
      }

      const ticketSummaries = ticketList
        .map(
          (t) =>
            `ID:${t.id} | ${t.title} | Category:${t.category} | Priority:${t.priority}\n${t.description.slice(0, 200)}`
        )
        .join("\n\n---\n\n");

      const systemPrompt = `You are an IT helpdesk AI for GigitekAI. Quickly triage the following support tickets.

For each ticket, return a JSON array where each item has:
- id: number (ticket ID)
- category: string (email/printer/internet/network/bug_report/feature_request/billing/general_support/other)
- priority: string (low/medium/high/critical)
- priorityScore: number (1-10)
- sentiment: string (positive/neutral/frustrated/angry/urgent)
- summary: string (one sentence)
- escalationRequired: boolean

Respond ONLY with a valid JSON array, no markdown.`;

      const llmResponse = await callLLM(input.model, [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Triage these tickets:\n\n${ticketSummaries}` },
      ]);

      let results: Array<Record<string, unknown>>;
      try {
        const jsonStr = llmResponse.content
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();
        results = JSON.parse(jsonStr);
        if (!Array.isArray(results)) results = [results];
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "AI returned invalid JSON for batch analysis.",
        });
      }

      // Persist AI analysis for each ticket
      for (const result of results) {
        const ticketId = Number(result.id);
        if (!ticketId) continue;
        await db
          .update(tickets)
          .set({
            aiCategory: String(result.category || ""),
            aiPriority: String(result.priority || ""),
            aiReasoning: String(result.summary || ""),
          })
          .where(eq(tickets.id, ticketId));
      }

      return {
        model: input.model,
        analyzed: results.length,
        results,
      };
    }),

  /**
   * Get stored AI analysis for a ticket (read-only, uses persisted AI fields)
   */
  getAnalysis: adminProcedure
    .input(z.object({ ticketId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      const [ticket] = await db
        .select({
          id: tickets.id,
          title: tickets.title,
          category: tickets.category,
          priority: tickets.priority,
          status: tickets.status,
          aiCategory: tickets.aiCategory,
          aiPriority: tickets.aiPriority,
          aiConfidence: tickets.aiConfidence,
          aiReasoning: tickets.aiReasoning,
        })
        .from(tickets)
        .where(eq(tickets.id, input.ticketId))
        .limit(1);

      if (!ticket) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
      }

      return {
        ticketId: ticket.id,
        hasAnalysis: !!(ticket.aiCategory || ticket.aiReasoning),
        aiCategory: ticket.aiCategory,
        aiPriority: ticket.aiPriority,
        aiConfidence: ticket.aiConfidence ? Number(ticket.aiConfidence) : null,
        aiReasoning: ticket.aiReasoning,
      };
    }),
});
