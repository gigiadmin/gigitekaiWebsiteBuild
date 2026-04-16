import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { kbArticles } from "../../drizzle/schema";
import { eq, like, or, desc, and } from "drizzle-orm";

export const kbRouter = router({
  /** List all KB articles (admin: all; public: published only) */
  list: publicProcedure
    .input(z.object({ includeUnpublished: z.boolean().optional().default(false) }).optional())
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const isAdmin = ctx.user?.role === "admin" || ctx.user?.role === "technician";
      const showAll = isAdmin && input?.includeUnpublished;
      const rows = await db
        .select()
        .from(kbArticles)
        .where(showAll ? undefined : eq(kbArticles.isPublished, true))
        .orderBy(desc(kbArticles.updatedAt));
      return rows;
    }),

  /** Get a single KB article by ID */
  get: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [article] = await db
        .select()
        .from(kbArticles)
        .where(eq(kbArticles.id, input.id))
        .limit(1);
      return article ?? null;
    }),

  /** Search published KB articles by keyword */
  search: publicProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const kw = `%${input.query}%`;
      return db
        .select()
        .from(kbArticles)
        .where(
          and(
            eq(kbArticles.isPublished, true),
            or(
              like(kbArticles.title, kw),
              like(kbArticles.content, kw),
              like(kbArticles.tags, kw)
            )
          )
        )
        .orderBy(desc(kbArticles.updatedAt))
        .limit(10);
    }),

  /** Create a new KB article (admin only) */
  create: adminProcedure
    .input(
      z.object({
        title: z.string().min(3),
        content: z.string().min(10),
        category: z.string().min(1).default("general"),
        tags: z.string().optional(),
        isPublished: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [result] = await db.insert(kbArticles).values({
        title: input.title,
        content: input.content,
        category: input.category,
        tags: input.tags,
        isPublished: input.isPublished,
        createdBy: ctx.user.id,
      });
      return { id: (result as any).insertId };
    }),

  /** Update a KB article (admin only) */
  update: adminProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        title: z.string().min(3).optional(),
        content: z.string().min(10).optional(),
        category: z.string().optional(),
        tags: z.string().optional(),
        isPublished: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { id, ...updates } = input;
      await db.update(kbArticles).set(updates).where(eq(kbArticles.id, id));
      return { success: true };
    }),

  /** Toggle publish/unpublish (admin only) */
  togglePublish: adminProcedure
    .input(z.object({ id: z.number().int().positive(), isPublished: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db
        .update(kbArticles)
        .set({ isPublished: input.isPublished })
        .where(eq(kbArticles.id, input.id));
      return { success: true };
    }),

  /** Delete a KB article (admin only) */
  delete: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.delete(kbArticles).where(eq(kbArticles.id, input.id));
      return { success: true };
    }),
});
