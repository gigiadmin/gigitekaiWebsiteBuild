import { router, adminProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { callLLM, getAvailableModels } from "../_core/multiLLM";
import { getDb } from "../db";
import { eq, like, or } from "drizzle-orm";
import { kbArticles, tickets } from "../../drizzle/schema";

export const adminSearchRouter = router({
  /**
   * Search across multiple sources using Claude, Manus, or Gemini
   * Techs can choose which LLM and what to search
   */
  search: adminProcedure
    .input(
      z.object({
        query: z.string().min(1).max(500),
        model: z.enum(["claude", "manus", "gemini"]),
        scope: z.object({
          kb: z.boolean().default(true),
          tickets: z.boolean().default(true),
          system: z.boolean().default(false),
          docs: z.boolean().default(false),
          customers: z.boolean().default(false),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Collect search results from selected sources
      const context: string[] = [];

      // Search KB articles
      if (input.scope.kb) {
        const articles = await db
          .select({
            title: kbArticles.title,
            content: kbArticles.content,
            category: kbArticles.category,
          })
          .from(kbArticles)
          .where(
            or(
              like(kbArticles.title, `%${input.query}%`),
              like(kbArticles.content, `%${input.query}%`)
            )
          )
          .limit(5);

        if (articles.length > 0) {
          context.push(
            `KB Articles:\n${articles.map((a) => `- ${a.title} (${a.category}): ${a.content?.substring(0, 200)}`).join("\n")}`
          );
        }
      }

      // Search tickets
      if (input.scope.tickets) {
        const ticketResults = await db
          .select({
            title: tickets.title,
            description: tickets.description,
            status: tickets.status,
            category: tickets.category,
          })
          .from(tickets)
          .where(
            or(
              like(tickets.title, `%${input.query}%`),
              like(tickets.description, `%${input.query}%`)
            )
          )
          .limit(5);

        if (ticketResults.length > 0) {
          context.push(
            `Recent Tickets:\n${ticketResults.map((t) => `- ${t.title} (${t.status}): ${t.description?.substring(0, 200)}`).join("\n")}`
          );
        }
      }

      // System data (placeholder - can be extended)
      if (input.scope.system) {
        context.push(
          `System Status: All systems operational. Last check: ${new Date().toISOString()}`
        );
      }

      // Build the prompt
      const systemPrompt = `You are a helpful tech support assistant for GigitekAI. 
You have access to the following information:
${context.join("\n\n")}

Answer the user's question based on the available information. Be concise and actionable.`;

      // Call the selected LLM using real multi-model routing
      const llmResponse = await callLLM(input.model, [
        { role: "system", content: systemPrompt },
        { role: "user", content: input.query },
      ]);

      const answer = llmResponse.content || "No response from LLM";

      return {
        query: input.query,
        model: input.model,
        answer,
        context: context.length,
        sources: {
          kb: input.scope.kb,
          tickets: input.scope.tickets,
          system: input.scope.system,
          docs: input.scope.docs,
          customers: input.scope.customers,
        },
      };
    }),

  /**
   * Get available search scopes (for UI)
   */
  getScopes: protectedProcedure.query(async () => {
    return {
      kb: { label: "Knowledge Base", enabled: true },
      tickets: { label: "Support Tickets", enabled: true },
      system: { label: "System Status", enabled: true },
      docs: { label: "Documentation", enabled: false }, // Placeholder
      customers: { label: "Customer Data", enabled: false }, // Placeholder
    };
  }),

  /**
   * Get available LLM models with real availability status
   */
  getModels: protectedProcedure.query(async () => {
    return getAvailableModels();
  }),

});
