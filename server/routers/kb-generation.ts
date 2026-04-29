import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  kbGenerations,
  kbGenerationQueue,
  kbArticles,
  tickets,
  ticketKbSuggestions,
  kbGenerationMetrics,
} from "../../drizzle/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

/**
 * KB Generation Router
 * Handles auto-generation of KB articles from resolved tickets using AI
 */
export const kbGenerationRouter = router({
  /**
   * Generate KB article from a resolved ticket
   * Uses Copilot to analyze ticket and create suggested KB article
   */
  generateFromTicket: adminProcedure
    .input(
      z.object({
        ticketId: z.number().int().positive(),
        forceRegenerate: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get ticket details
      const [ticket] = await db
        .select()
        .from(tickets)
        .where(eq(tickets.id, input.ticketId))
        .limit(1);

      if (!ticket) throw new Error("Ticket not found");
      if (ticket.status !== "resolved" && ticket.status !== "closed") {
        throw new Error("Only resolved/closed tickets can generate KB articles");
      }

      // Check if generation already exists
      if (!input.forceRegenerate) {
        const [existing] = await db
          .select()
          .from(kbGenerations)
          .where(eq(kbGenerations.ticketId, input.ticketId))
          .limit(1);
        if (existing) return existing;
      }

      try {
        // Prepare ticket content for AI
        const ticketContent = `
Title: ${ticket.title}
Category: ${ticket.category}
Priority: ${ticket.priority}
Description: ${ticket.description}
Status: ${ticket.status}
`;

        // Call Copilot to generate KB article
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are an expert technical writer. Analyze the support ticket and create a comprehensive KB article that could help prevent similar issues in the future.

Return a JSON object with:
- title: Clear, searchable title (max 100 chars)
- content: Well-structured markdown content (2-5 paragraphs)
- category: One of: general, troubleshooting, setup, security, performance, integration
- tags: Comma-separated relevant tags (5-10 tags)
- confidence: Your confidence score (0-100) that this is a good KB article

Focus on:
1. Clear problem statement
2. Root cause explanation
3. Step-by-step resolution
4. Prevention tips
5. Related resources or links if applicable`,
            },
            {
              role: "user",
              content: `Create a KB article from this support ticket:\n\n${ticketContent}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "kb_article",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  content: { type: "string" },
                  category: { type: "string" },
                  tags: { type: "string" },
                  confidence: { type: "number" },
                },
                required: ["title", "content", "category", "tags", "confidence"],
                additionalProperties: false,
              },
            },
          },
        });

        const responseText =
          typeof response.choices[0].message.content === "string"
            ? response.choices[0].message.content
            : "";
        const generated = JSON.parse(responseText);

        // Save generated KB article
        const [result] = await db.insert(kbGenerations).values({
          ticketId: input.ticketId,
          sourceTicketTitle: ticket.title,
          sourceTicketContent: ticket.description,
          generatedTitle: generated.title,
          generatedContent: generated.content,
          suggestedCategory: generated.category,
          suggestedTags: generated.tags,
          confidence: Math.min(100, Math.max(0, Math.round(generated.confidence))),
          status: "pending_approval",
          generatedBy: "copilot",
        });

        return {
          id: (result as any).insertId,
          title: generated.title,
          content: generated.content,
          category: generated.category,
          tags: generated.tags,
          confidence: generated.confidence,
          status: "pending_approval",
        };
      } catch (error) {
        console.error("[KB Generation] Error generating KB:", error);
        throw new Error("Failed to generate KB article");
      }
    }),

  /**
   * List pending KB generations awaiting approval
   */
  listPending: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(kbGenerations)
      .where(eq(kbGenerations.status, "pending_approval"))
      .orderBy(desc(kbGenerations.generatedAt))
      .limit(50);
  }),

  /**
   * Approve and publish a generated KB article
   */
  approve: adminProcedure
    .input(
      z.object({
        generationId: z.number().int().positive(),
        publish: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [generation] = await db
        .select()
        .from(kbGenerations)
        .where(eq(kbGenerations.id, input.generationId))
        .limit(1);

      if (!generation) throw new Error("Generation not found");

      // Create KB article
      const [articleResult] = await db.insert(kbArticles).values({
        title: generation.generatedTitle || "Untitled",
        content: generation.generatedContent || "",
        category: generation.suggestedCategory || "general",
        tags: generation.suggestedTags || "",
        isPublished: input.publish,
        createdBy: ctx.user.id,
      });

      const articleId = (articleResult as any).insertId;

      // Update generation record
      await db
        .update(kbGenerations)
        .set({
          status: input.publish ? "published" : "approved",
          approvedBy: ctx.user.id,
          approvedAt: new Date(),
          publishedArticleId: articleId,
          publishedAt: input.publish ? new Date() : null,
        })
        .where(eq(kbGenerations.id, input.generationId));

      return { success: true, articleId };
    }),

  /**
   * Reject a generated KB article
   */
  reject: adminProcedure
    .input(
      z.object({
        generationId: z.number().int().positive(),
        reason: z.string().min(3),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify generation exists before rejecting
      const [existing] = await db
        .select({ id: kbGenerations.id })
        .from(kbGenerations)
        .where(eq(kbGenerations.id, input.generationId))
        .limit(1);

      if (!existing) throw new Error("Generation not found");

      await db
        .update(kbGenerations)
        .set({
          status: "rejected",
          rejectionReason: input.reason,
          rejectedBy: ctx.user.id,
          rejectedAt: new Date(),
        })
        .where(eq(kbGenerations.id, input.generationId));

      return { success: true };
    }),

  /**
   * Suggest KB articles for a ticket (used when viewing/creating tickets)
   */
  suggestForTicket: protectedProcedure
    .input(z.object({ ticketId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      // Get ticket details
      const [ticket] = await db
        .select()
        .from(tickets)
        .where(eq(tickets.id, input.ticketId))
        .limit(1);

      if (!ticket) return [];

      try {
        // Use AI to find relevant KB articles
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a support AI. Given a ticket, suggest relevant KB article keywords to search for. Return a JSON array of 3-5 search keywords.`,
            },
            {
              role: "user",
              content: `Ticket: ${ticket.title || "Untitled"}\n\nDescription: ${ticket.description || "No description"}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "kb_keywords",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  keywords: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: ["keywords"],
                additionalProperties: false,
              },
            },
          },
        });

        const responseText =
          typeof response.choices[0].message.content === "string"
            ? response.choices[0].message.content
            : "";
        const { keywords } = JSON.parse(responseText);

        // Search for matching KB articles
        const suggestions = [];
        for (const keyword of keywords) {
          const articles = await db
            .select()
            .from(kbArticles)
            .where(
              and(
                eq(kbArticles.isPublished, true),
                sql`MATCH(${kbArticles.title}, ${kbArticles.content}) AGAINST(${keyword} IN BOOLEAN MODE)`
              )
            )
            .limit(2);
          suggestions.push(...articles);
        }

        // Deduplicate and limit
        const unique = Array.from(new Map(suggestions.map((s) => [s.id, s])).values()).slice(0, 5);

        // Save suggestions
        for (const article of unique) {
          await db.insert(ticketKbSuggestions).values({
            ticketId: input.ticketId,
            articleId: article.id,
            suggestedBy: "ai",
            relevanceScore: 75,
          });
        }

        return unique;
      } catch (error) {
        console.error("[KB Suggestions] Error suggesting articles:", error);
        return [];
      }
    }),

  /**
   * Get KB generation metrics
   */
  getMetrics: adminProcedure
    .input(
      z.object({
        days: z.number().int().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      const metrics = await db
        .select()
        .from(kbGenerationMetrics)
        .where(gte(kbGenerationMetrics.date, startDate))
        .orderBy(desc(kbGenerationMetrics.date));

      // Calculate totals
      const totals = {
        totalGenerated: metrics.reduce((sum, m) => sum + (m.totalGenerated ?? 0), 0),
        totalApproved: metrics.reduce((sum, m) => sum + (m.totalApproved ?? 0), 0),
        totalPublished: metrics.reduce((sum, m) => sum + (m.totalPublished ?? 0), 0),
        totalRejected: metrics.reduce((sum, m) => sum + (m.totalRejected ?? 0), 0),
        avgConfidenceScore: metrics.length
          ? Math.round(
              metrics.reduce((sum, m) => sum + (m.avgConfidenceScore ?? 0), 0) / metrics.length
            )
          : 0,
        approvalRate: metrics.length
          ? Math.round(
              (metrics.reduce((sum, m) => sum + (m.totalApproved ?? 0), 0) /
                metrics.reduce((sum, m) => sum + (m.totalGenerated ?? 0), 0)) *
                100
            )
          : 0,
      };

      return {
        metrics,
        totals,
      };
    }),

  /**
   * Bulk generate KB articles from all unprocessed resolved tickets
   */
  bulkGenerateFromResolved: adminProcedure
    .mutation(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get all resolved/closed tickets that don't have a KB generation yet
      const { or } = require("drizzle-orm");
      const resolvedTickets = await db
        .select()
        .from(tickets)
        .where(
          or(
            eq(tickets.status, "resolved"),
            eq(tickets.status, "closed")
          )
        );

      let queued = 0;
      for (const ticket of resolvedTickets) {
        const [existing] = await db
          .select()
          .from(kbGenerations)
          .where(eq(kbGenerations.ticketId, ticket.id))
          .limit(1);

        if (!existing) {
          try {
            await db.insert(kbGenerations).values({
              ticketId: ticket.id,
              sourceTicketTitle: ticket.title || "",
              sourceTicketContent: ticket.description || "",
              generatedTitle: "",
              generatedContent: "",
              suggestedCategory: "general",
              suggestedTags: "",
              confidence: 0,
              status: "draft",
            });
            queued++;
          } catch (err) {
            console.warn(`Failed to queue KB generation for ticket ${ticket.id}:`, err);
          }
        }
      }

      return { queued, total: resolvedTickets.length };
    }),

  /**
   * Mark KB suggestion as helpful/unhelpful
   */
  rateSuggestion: protectedProcedure
    .input(
      z.object({
        suggestionId: z.number().int().positive(),
        helpful: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(ticketKbSuggestions)
        .set({ helpful: input.helpful })
        .where(eq(ticketKbSuggestions.id, input.suggestionId));

      return { success: true };
    }),
});
