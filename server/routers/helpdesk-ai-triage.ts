import { protectedProcedure, adminProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { tickets, kbArticles } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";

export const helpdeskAiTriageRouter = router({
  /**
   * Auto-categorize and suggest priority for a ticket using LLM
   */
  suggestCategoryAndPriority: publicProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const prompt = `You are a helpdesk ticket triage assistant. Analyze the following support ticket and suggest:
1. Category (one of: bug_report, feature_request, general_support, billing)
2. Priority (one of: low, medium, high, critical)
3. Confidence score (0-1)
4. Brief reasoning

Ticket Title: ${input.title}
Ticket Description: ${input.description}

Respond in JSON format:
{
  "category": "string",
  "priority": "string",
  "confidence": number,
  "reasoning": "string"
}`;

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are a helpful helpdesk ticket triage assistant. Always respond with valid JSON.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "ticket_triage",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  category: {
                    type: "string",
                    enum: ["bug_report", "feature_request", "general_support", "billing"],
                  },
                  priority: {
                    type: "string",
                    enum: ["low", "medium", "high", "critical"],
                  },
                  confidence: {
                    type: "number",
                    minimum: 0,
                    maximum: 1,
                  },
                  reasoning: {
                    type: "string",
                  },
                },
                required: ["category", "priority", "confidence", "reasoning"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0]?.message.content;
        if (!content || typeof content !== "string") {
          throw new Error("No response from LLM");
        }

        const parsed = JSON.parse(content);
        return {
          success: true,
          category: parsed.category,
          priority: parsed.priority,
          confidence: parsed.confidence,
          reasoning: parsed.reasoning,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to categorize ticket",
          category: "general_support",
          priority: "medium",
          confidence: 0,
          reasoning: "Fallback to defaults due to LLM error",
        };
      }
    }),

  /**
   * Apply auto-categorization to a ticket
   */
  applyAutoTriage: protectedProcedure
    .input(
      z.object({
        ticketId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Get ticket
      const ticketList = await db.select().from(tickets).where(eq(tickets.id, input.ticketId));
      const ticket = ticketList[0];

      if (!ticket) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
      }

      // Get AI suggestion
      const suggestion = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a helpdesk ticket triage assistant. Always respond with valid JSON.",
          },
          {
            role: "user",
            content: `Analyze this ticket and suggest category and priority:
Title: ${ticket.title}
Description: ${ticket.description}

Respond in JSON: {"category": "bug_report|feature_request|general_support|billing", "priority": "low|medium|high|critical", "confidence": 0-1}`,
          },
        ],
      });

      try {
        const content = suggestion.choices[0]?.message.content;
        if (!content || typeof content !== "string") throw new Error("No response");

        const parsed = JSON.parse(content);

        // Update ticket with AI suggestions
        await db
          .update(tickets)
          .set({
            aiCategory: parsed.category,
            aiPriority: parsed.priority,
            aiConfidence: parsed.confidence,
            aiReasoning: `Auto-triaged with ${(parsed.confidence * 100).toFixed(0)}% confidence`,
            updatedAt: new Date(),
          })
          .where(eq(tickets.id, input.ticketId));

        return {
          success: true,
          ticketId: input.ticketId,
          category: parsed.category,
          priority: parsed.priority,
          confidence: parsed.confidence,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to apply triage",
          ticketId: input.ticketId,
        };
      }
    }),

  /**
   * Get AI triage statistics
   */
  getTriageStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const allTickets = await db.select().from(tickets);
    const triaged = allTickets.filter((t) => t.aiCategory !== null);

    const byCategory = {
      bug_report: triaged.filter((t) => t.aiCategory === "bug_report").length,
      feature_request: triaged.filter((t) => t.aiCategory === "feature_request").length,
      general_support: triaged.filter((t) => t.aiCategory === "general_support").length,
      billing: triaged.filter((t) => t.aiCategory === "billing").length,
    };

    const byPriority = {
      low: triaged.filter((t) => t.aiPriority === "low").length,
      medium: triaged.filter((t) => t.aiPriority === "medium").length,
      high: triaged.filter((t) => t.aiPriority === "high").length,
      critical: triaged.filter((t) => t.aiPriority === "critical").length,
    };

    const avgConfidence =
      triaged.length > 0
        ? triaged.reduce((sum, t) => sum + (t.aiConfidence ? parseFloat(t.aiConfidence.toString()) : 0), 0) /
          triaged.length
        : 0;

    return {
      totalTickets: allTickets.length,
      triagedTickets: triaged.length,
      triageRate: allTickets.length > 0 ? (triaged.length / allTickets.length) * 100 : 0,
      byCategory,
      byPriority,
      averageConfidence: parseFloat(avgConfidence.toFixed(2)),
    };
  }),

  /**
   * Bulk auto-triage tickets
   */
  bulkAutoTriage: adminProcedure
    .input(
      z.object({
        ticketIds: z.array(z.number()).min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      let successCount = 0;
      let errorCount = 0;

      for (const ticketId of input.ticketIds) {
        try {
          const ticketList = await db.select().from(tickets).where(eq(tickets.id, ticketId));
          const ticket = ticketList[0];

          if (!ticket) continue;

          const suggestion = await invokeLLM({
            messages: [
              {
                role: "system",
                content: "You are a helpdesk ticket triage assistant. Always respond with valid JSON.",
              },
              {
                role: "user",
                content: `Analyze this ticket:
Title: ${ticket.title}
Description: ${ticket.description}

Respond in JSON: {"category": "bug_report|feature_request|general_support|billing", "priority": "low|medium|high|critical", "confidence": 0-1}`,
              },
            ],
          });

          const content = suggestion.choices[0]?.message.content;
          if (content && typeof content === "string") {
            const parsed = JSON.parse(content);
            await db
              .update(tickets)
              .set({
                aiCategory: parsed.category,
                aiPriority: parsed.priority,
                aiConfidence: parsed.confidence,
                updatedAt: new Date(),
              })
              .where(eq(tickets.id, ticketId));

            successCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }

      return {
        success: true,
        totalProcessed: input.ticketIds.length,
        successCount,
        errorCount,
        message: `Auto-triaged ${successCount}/${input.ticketIds.length} tickets`,
      };
    }),
});
