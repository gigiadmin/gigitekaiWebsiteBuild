import { router, publicProcedure, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { scripts, scriptExecutions, scriptFeedback } from "../../drizzle/schema";
import { eq, like, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const scriptsRouter = router({
  // Query procedures
  list: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        search: z.string().optional(),
        sort: z.enum(["name", "date", "popularity"]).optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      // Build conditions
      const conditions = [];
      if (input.category) conditions.push(eq(scripts.category, input.category));
      if (input.search) conditions.push(like(scripts.name, `%${input.search}%`));

      // Build order
      const orderBy = input.sort === "date"
        ? desc(scripts.updated_at)
        : input.sort === "popularity"
        ? desc(scripts.download_count)
        : scripts.name;

      const result = await db
        .select()
        .from(scripts)
        .where(conditions.length > 0 ? (conditions.length === 1 ? conditions[0] : sql`${conditions[0]} AND ${conditions[1]}`) : undefined)
        .orderBy(orderBy)
        .limit(input.limit)
        .offset(input.offset);

      return result;
    }),

  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });
      const script = await db
        .select()
        .from(scripts)
        .where(eq(scripts.id, input.id))
        .limit(1);

      if (!script || script.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Script not found",
        });
      }

      return script[0];
    }),

  search: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      const results = await db
        .select()
        .from(scripts)
        .where(like(scripts.name, `%${input.query}%`))
        .limit(10);

      return results;
    }),

  getCategories: publicProcedure.query(async () => {
    return [
      "Teams",
      "Azure",
      "M365",
      "Intune",
      "Automation",
      "Exchange",
      "SharePoint",
    ];
  }),

  // Mutation procedures
  download: protectedProcedure
    .input(z.object({ scriptId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      // Increment download count
      await db
        .update(scripts)
        .set({
          download_count: sql`${scripts.download_count} + 1`,
        })
        .where(eq(scripts.id, input.scriptId));

      // Log execution
      await db.insert(scriptExecutions).values({
        script_id: input.scriptId,
        user_id: ctx.user.id,
        status: "Success",
        duration_ms: 0,
      });

      return { success: true };
    }),

  logExecution: protectedProcedure
    .input(
      z.object({
        scriptId: z.number(),
        status: z.enum(["Success", "Failed", "Running"]),
        duration_ms: z.number(),
        error_message: z.string().optional(),
        result: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      await db.insert(scriptExecutions).values({
        script_id: input.scriptId,
        user_id: ctx.user.id,
        status: input.status,
        duration_ms: input.duration_ms,
        error_message: input.error_message,
        result: input.result ? JSON.stringify(input.result) : null,
      });

      return { success: true };
    }),

  getExecutionHistory: protectedProcedure
    .input(
      z.object({
        scriptId: z.number(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      const executions = await db
        .select()
        .from(scriptExecutions)
        .where(eq(scriptExecutions.script_id, input.scriptId))
        .orderBy(desc(scriptExecutions.executed_at))
        .limit(input.limit)
        .offset(input.offset);

      return executions;
    }),

  submitFeedback: protectedProcedure
    .input(
      z.object({
        scriptId: z.number(),
        type: z.enum(["Bug", "Feature Request", "General"]),
        message: z.string().min(10).max(1000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      await db.insert(scriptFeedback).values({
        script_id: input.scriptId,
        user_id: ctx.user.id,
        feedback_type: input.type as 'Bug' | 'Feature Request' | 'General',
        message: input.message,
        status: "Open",
      });

      return { success: true };
    }),

  getFeedback: adminProcedure
    .input(
      z.object({
        scriptId: z.number().optional(),
        status: z.enum(["Open", "In Progress", "Resolved"]).optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      const conditions = [];
      if (input.scriptId) conditions.push(eq(scriptFeedback.script_id, input.scriptId));
      if (input.status) conditions.push(eq(scriptFeedback.status, input.status as 'Open' | 'In Progress' | 'Resolved'));

      const feedback = await db
        .select()
        .from(scriptFeedback)
        .where(conditions.length > 0 ? (conditions.length === 1 ? conditions[0] : sql`${conditions[0]} AND ${conditions[1]}`) : undefined)
        .orderBy(desc(scriptFeedback.created_at))
        .limit(input.limit)
        .offset(input.offset);

      return feedback;
    }),

  updateFeedbackStatus: adminProcedure
    .input(
      z.object({
        feedbackId: z.number(),
        status: z.enum(["Open", "In Progress", "Resolved"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      await db
        .update(scriptFeedback)
        .set({ status: input.status })
        .where(eq(scriptFeedback.id, input.feedbackId));

      return { success: true };
    }),

  getStats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    const totalScripts = await db.select().from(scripts);
    const totalDownloads = totalScripts.reduce(
      (sum, s) => sum + (s.download_count || 0),
      0
    );
    const categories = [...new Set(totalScripts.map((s) => s.category))];

    return {
      totalScripts: totalScripts.length,
      totalDownloads,
      categories: categories.length,
      topScripts: totalScripts
        .sort((a: typeof totalScripts[0], b: typeof totalScripts[0]) => (b.download_count || 0) - (a.download_count || 0))
        .slice(0, 5),
    };
  }),

  // Admin procedures
  create: adminProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
        category: z.string(),
        version: z.string(),
        author: z.string(),
        difficulty_level: z.enum(["Beginner", "Intermediate", "Advanced"]),
        tags: z.array(z.string()),
        documentation: z.string(),
        github_url: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      const result = await db.insert(scripts).values({
        name: input.name,
        description: input.description,
        category: input.category,
        version: input.version,
        author: input.author,
        created_at: sql`NOW()`,
        updated_at: sql`NOW()`,
        download_count: 0,
        rating: '0.00',
        difficulty_level: input.difficulty_level,
        tags: JSON.stringify(input.tags),
        documentation: input.documentation,
        github_url: input.github_url,
      });

      return { success: true, id: (result as any).insertId || 0 };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        version: z.string().optional(),
        documentation: z.string().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      await db
        .update(scripts)
        .set({
          ...(input.name && { name: input.name }),
          ...(input.description && { description: input.description }),
          ...(input.version && { version: input.version }),
          ...(input.documentation && { documentation: input.documentation }),
          ...(input.tags && { tags: JSON.stringify(input.tags) }),
          updated_at: sql`NOW()`,
        })
        .where(eq(scripts.id, input.id))

      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      await db.delete(scripts).where(eq(scripts.id, input.id));

      return { success: true };
    }),
});
