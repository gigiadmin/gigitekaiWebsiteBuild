import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { ariaCustomIntents, ariaIntentExamples } from "../../drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";

export const ariaIntentsRouter = router({
  /**
   * List all custom intents with their examples
   */
  listIntents: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const intents = await db.select().from(ariaCustomIntents).orderBy(desc(ariaCustomIntents.createdAt));
    const examples = await db.select().from(ariaIntentExamples);

    return intents.map((intent) => ({
      ...intent,
      examples: examples.filter((ex) => ex.intentId === intent.id),
    }));
  }),

  /**
   * Create a new custom intent with examples
   */
  createIntent: protectedProcedure
    .input(z.object({
      intentName: z.string().min(1).max(100),
      description: z.string().optional(),
      responseTemplate: z.string().optional(),
      action: z.string().default("respond"),
      actionTarget: z.string().optional(),
      examples: z.array(z.string()).min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [result] = await db.insert(ariaCustomIntents).values({
        intentName: input.intentName,
        description: input.description || null,
        responseTemplate: input.responseTemplate || null,
        action: input.action,
        actionTarget: input.actionTarget || null,
        isActive: 1,
        createdBy: ctx.user.id,
      });

      const intentId = result.insertId;

      // Insert examples
      if (input.examples.length > 0) {
        await db.insert(ariaIntentExamples).values(
          input.examples.map((phrase) => ({
            intentId,
            examplePhrase: phrase,
          }))
        );
      }

      return { id: intentId };
    }),

  /**
   * Toggle intent active/inactive
   */
  toggleIntent: protectedProcedure
    .input(z.object({ intentId: z.number(), isActive: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db
        .update(ariaCustomIntents)
        .set({ isActive: input.isActive ? 1 : 0, updatedAt: sql`NOW()` })
        .where(eq(ariaCustomIntents.id, input.intentId));

      return { success: true };
    }),

  /**
   * Delete an intent and its examples
   */
  deleteIntent: protectedProcedure
    .input(z.object({ intentId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db.delete(ariaIntentExamples).where(eq(ariaIntentExamples.intentId, input.intentId));
      await db.delete(ariaCustomIntents).where(eq(ariaCustomIntents.id, input.intentId));

      return { success: true };
    }),

  /**
   * Add an example phrase to an existing intent
   */
  addExample: protectedProcedure
    .input(z.object({ intentId: z.number(), phrase: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db.insert(ariaIntentExamples).values({
        intentId: input.intentId,
        examplePhrase: input.phrase,
      });

      return { success: true };
    }),

  /**
   * Delete an example phrase
   */
  deleteExample: protectedProcedure
    .input(z.object({ exampleId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db.delete(ariaIntentExamples).where(eq(ariaIntentExamples.id, input.exampleId));

      return { success: true };
    }),

  /**
   * Get all active custom intents for Aria's intent detection
   * (called internally by the Aria router)
   */
  getActiveIntentsForDetection: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const intents = await db
      .select()
      .from(ariaCustomIntents)
      .where(eq(ariaCustomIntents.isActive, 1));

    const examples = await db.select().from(ariaIntentExamples);

    return intents.map((intent) => ({
      ...intent,
      examples: examples
        .filter((ex) => ex.intentId === intent.id)
        .map((ex) => ex.examplePhrase.toLowerCase()),
    }));
  }),
});
