import { protectedProcedure, adminProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { tickets, kbArticles, ticketReplies } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";

export const helpdeskAiRepliesRouter = router({
  /**
   * Get AI-suggested reply based on ticket content and knowledge base
   */
  suggestReply: protectedProcedure
    .input(
      z.object({
        ticketId: z.number(),
        includeKB: z.boolean().default(true),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Get ticket
      const ticketList = await db.select().from(tickets).where(eq(tickets.id, input.ticketId));
      const ticket = ticketList[0];

      if (!ticket) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
      }

      // Get relevant KB articles
      let kbContext = "";
      if (input.includeKB) {
        const kbList = await db.select().from(kbArticles).where(eq(kbArticles.isPublished, 1));

        // Find relevant articles based on ticket keywords
        const keywords = ticket.title.toLowerCase().split(" ");
        const relevant = kbList.filter((article) => {
          const articleText = (article.title + " " + article.content).toLowerCase();
          return keywords.some((keyword) => articleText.includes(keyword) && keyword.length > 3);
        });

        if (relevant.length > 0) {
          kbContext = `\n\nRelevant Knowledge Base Articles:\n${relevant
            .slice(0, 3)
            .map((a) => `- ${a.title}: ${a.content.substring(0, 200)}...`)
            .join("\n")}`;
        }
      }

      try {
        const prompt = `You are a helpful support agent. Based on the following ticket, provide a professional and empathetic reply.

Ticket Title: ${ticket.title}
Ticket Description: ${ticket.description}
Priority: ${ticket.priority}
Category: ${ticket.category}
${kbContext}

Provide a concise, professional reply that:
1. Acknowledges the customer's issue
2. Provides helpful guidance or next steps
3. Is empathetic and professional
4. References KB articles if relevant

Keep the reply to 2-3 sentences.`;

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                "You are a helpful support agent. Provide professional, empathetic replies to customer support tickets.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
        });

        const content = response.choices[0]?.message.content;
        if (!content || typeof content !== "string") {
          throw new Error("No response from LLM");
        }

        return {
          success: true,
          suggestedReply: content,
          ticketId: input.ticketId,
          usedKB: input.includeKB && kbContext.length > 0,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to generate reply",
          suggestedReply: "Thank you for contacting support. We'll look into this and get back to you shortly.",
          ticketId: input.ticketId,
          usedKB: false,
        };
      }
    }),

  /**
   * Get multiple suggested replies for comparison
   */
  suggestMultipleReplies: protectedProcedure
    .input(
      z.object({
        ticketId: z.number(),
        count: z.number().min(2).max(5).default(3),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const ticketList = await db.select().from(tickets).where(eq(tickets.id, input.ticketId));
      const ticket = ticketList[0];

      if (!ticket) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
      }

      const replies: string[] = [];

      for (let i = 0; i < input.count; i++) {
        try {
          const tone = ["professional", "friendly", "technical", "empathetic"][i % 4];

          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `You are a support agent with a ${tone} tone. Provide a reply to the customer's support ticket.`,
              },
              {
                role: "user",
                content: `Ticket: ${ticket.title}\n\n${ticket.description}\n\nProvide a ${tone} reply (2-3 sentences).`,
              },
            ],
          });

          const content = response.choices[0]?.message.content;
          if (content && typeof content === "string") {
            replies.push(content);
          }
        } catch (error) {
          // Continue to next reply
        }
      }

      return {
        success: replies.length > 0,
        ticketId: input.ticketId,
        replies,
        count: replies.length,
      };
    }),

  /**
   * Apply suggested reply to ticket
   */
  applySuggestedReply: protectedProcedure
    .input(
      z.object({
        ticketId: z.number(),
        reply: z.string(),
        userId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify ticket exists
      const ticketList = await db.select().from(tickets).where(eq(tickets.id, input.ticketId));
      if (!ticketList.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
      }

      // Add reply
      await db.insert(ticketReplies).values({
        ticketId: input.ticketId,
        userId: input.userId,
        message: input.reply,
        isStaffReply: 1,
        createdAt: new Date().toISOString(),
      });

      return {
        success: true,
        ticketId: input.ticketId,
        message: "Reply added to ticket",
      };
    }),

  /**
   * Get AI reply suggestions statistics
   */
  getReplyStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const allReplies = await db.select().from(ticketReplies);
    const staffReplies = allReplies.filter((r) => r.isStaffReply === 1);

    return {
      totalReplies: allReplies.length,
      staffReplies: staffReplies.length,
      customerReplies: allReplies.length - staffReplies.length,
      averageReplyLength: Math.round(
        staffReplies.reduce((sum, r) => sum + r.message.length, 0) / (staffReplies.length || 1)
      ),
      replyRate: allReplies.length > 0 ? (staffReplies.length / allReplies.length) * 100 : 0,
    };
  }),

  /**
   * Get KB articles for a ticket
   */
  getRelevantKBArticles: protectedProcedure
    .input(
      z.object({
        ticketId: z.number(),
        limit: z.number().min(1).max(10).default(5),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const ticketList = await db.select().from(tickets).where(eq(tickets.id, input.ticketId));
      const ticket = ticketList[0];

      if (!ticket) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
      }

      const kbList = await db.select().from(kbArticles).where(eq(kbArticles.isPublished, 1));

      // Find relevant articles
      const keywords = ticket.title.toLowerCase().split(" ").filter((w) => w.length > 3);
      const scored = kbList.map((article) => {
        const articleText = (article.title + " " + article.content).toLowerCase();
        const matches = keywords.filter((keyword) => articleText.includes(keyword)).length;
        return { article, score: matches };
      });

      const relevant = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).slice(0, input.limit);

      return {
        ticketId: input.ticketId,
        articles: relevant.map((r) => ({
          id: r.article.id,
          title: r.article.title,
          content: r.article.content.substring(0, 300),
          category: r.article.category,
          relevanceScore: r.score,
        })),
        count: relevant.length,
      };
    }),
});
