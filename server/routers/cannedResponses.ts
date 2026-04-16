import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { cannedResponses } from "../../drizzle/schema";
import { eq, like, or, desc, and } from "drizzle-orm";

export const cannedResponsesRouter = router({
  /** List all canned responses (all admins/technicians can read) */
  list: protectedProcedure
    .input(z.object({ category: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db
        .select()
        .from(cannedResponses)
        .where(input?.category ? eq(cannedResponses.category, input.category) : undefined)
        .orderBy(cannedResponses.category, desc(cannedResponses.updatedAt));
      return rows;
    }),

  /** Search canned responses by keyword */
  search: protectedProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const kw = `%${input.query}%`;
      return db
        .select()
        .from(cannedResponses)
        .where(
          or(
            like(cannedResponses.title, kw),
            like(cannedResponses.body, kw)
          )
        )
        .orderBy(desc(cannedResponses.updatedAt))
        .limit(10);
    }),

  /** Create a canned response (admin only) */
  create: adminProcedure
    .input(
      z.object({
        title: z.string().min(2),
        body: z.string().min(5),
        category: z.string().default("general"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [result] = await db.insert(cannedResponses).values({
        title: input.title,
        body: input.body,
        category: input.category,
        createdBy: ctx.user.id,
      });
      return { id: (result as any).insertId };
    }),

  /** Update a canned response (admin only) */
  update: adminProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        title: z.string().min(2).optional(),
        body: z.string().min(5).optional(),
        category: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { id, ...updates } = input;
      await db.update(cannedResponses).set(updates).where(eq(cannedResponses.id, id));
      return { success: true };
    }),

  /** Delete a canned response (admin only) */
  delete: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.delete(cannedResponses).where(eq(cannedResponses.id, input.id));
      return { success: true };
    }),
});
