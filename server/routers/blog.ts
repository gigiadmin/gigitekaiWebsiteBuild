/**
 * Blog Router — public read + admin write/delete
 * Public procedures: listPosts, getPostBySlug
 * Admin procedures: createPost, updatePost, deletePost, togglePublished, adminListPosts
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { blogPosts } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { storagePut } from "../storage";

// ─── helpers ────────────────────────────────────────────────────────────────

function requireAdmin(role: string | undefined) {
  if (role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
}

// ─── router ─────────────────────────────────────────────────────────────────

export const blogRouter = router({
  /** List all published posts (public, newest first) */
  listPosts: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const posts = await db
      .select({
        id: blogPosts.id,
        slug: blogPosts.slug,
        title: blogPosts.title,
        excerpt: blogPosts.excerpt,
        category: blogPosts.category,
        readTime: blogPosts.readTime,
        authorName: blogPosts.authorName,
        featuredImage: blogPosts.featuredImage,
        publishedAt: blogPosts.publishedAt,
        createdAt: blogPosts.createdAt,
      })
      .from(blogPosts)
      .where(eq(blogPosts.published, true))
      .orderBy(desc(blogPosts.publishedAt));
    return posts;
  }),

  /** Get a single published post by slug (public) */
  getPostBySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
      const [post] = await db
        .select()
        .from(blogPosts)
        .where(and(eq(blogPosts.slug, input.slug), eq(blogPosts.published, true)))
        .limit(1);
      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
      }
      return post;
    }),

  /** List ALL posts including drafts (admin only) */
  adminListPosts: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.user.role);
    const db = await getDb();
    if (!db) return [];
    const posts = await db
      .select()
      .from(blogPosts)
      .orderBy(desc(blogPosts.createdAt));
    return posts;
  }),

  /** Create a new blog post (admin only) */
  createPost: protectedProcedure
    .input(
      z.object({
        slug: z.string().min(1).max(255),
        title: z.string().min(1).max(500),
        excerpt: z.string().min(1),
        content: z.string().min(1),
        category: z.string().min(1).max(100),
        readTime: z.string().min(1).max(50),
        authorName: z.string().max(255).optional(),
        authorTitle: z.string().max(255).optional(),
        authorBio: z.string().optional(),
        authorAvatar: z.string().url().optional(),
        featuredImage: z.string().url().optional(),
        published: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [existing] = await db
        .select({ id: blogPosts.id })
        .from(blogPosts)
        .where(eq(blogPosts.slug, input.slug))
        .limit(1);
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "A post with this slug already exists" });
      }
      const [result] = await db.insert(blogPosts).values({
        slug: input.slug,
        title: input.title,
        excerpt: input.excerpt,
        content: input.content,
        category: input.category,
        readTime: input.readTime,
        authorName: input.authorName ?? "GigitekAI Team",
        authorTitle: input.authorTitle ?? null,
        authorBio: input.authorBio ?? null,
        authorAvatar: input.authorAvatar ?? null,
        featuredImage: input.featuredImage ?? null,
        published: input.published,
        publishedAt: input.published ? new Date() : null,
      });
      return { id: (result as any).insertId as number };
    }),

  /** Update an existing blog post (admin only) */
  updatePost: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        slug: z.string().min(1).max(255).optional(),
        title: z.string().min(1).max(500).optional(),
        excerpt: z.string().min(1).optional(),
        content: z.string().min(1).optional(),
        category: z.string().min(1).max(100).optional(),
        readTime: z.string().min(1).max(50).optional(),
        authorName: z.string().max(255).optional(),
        authorTitle: z.string().max(255).nullable().optional(),
        authorBio: z.string().nullable().optional(),
        authorAvatar: z.string().url().nullable().optional(),
        featuredImage: z.string().url().nullable().optional(),
        published: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const { id, ...fields } = input;
      const [existing] = await db
        .select({ id: blogPosts.id, published: blogPosts.published })
        .from(blogPosts)
        .where(eq(blogPosts.id, id))
        .limit(1);
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
      }
      // If publishing for the first time, set publishedAt
      const publishedAt =
        fields.published === true && !existing.published ? new Date() : undefined;
      await db
        .update(blogPosts)
        .set({
          ...fields,
          ...(publishedAt !== undefined ? { publishedAt } : {}),
        })
        .where(eq(blogPosts.id, id));
      return { success: true };
    }),

  /** Delete a blog post (admin only) */
  deletePost: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await db.delete(blogPosts).where(eq(blogPosts.id, input.id));
      return { success: true };
    }),

  /** Upload a blog image to S3 (admin only) */
  uploadImage: protectedProcedure
    .input(
      z.object({
        base64: z.string().min(1),
        mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
        fileName: z.string().min(1).max(255),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const buffer = Buffer.from(input.base64, "base64");
      if (buffer.byteLength > 5 * 1024 * 1024) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Image must be under 5 MB" });
      }
      const ext = input.mimeType.split("/")[1];
      const key = `blog-images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      return { url };
    }),

  /** Toggle published status (admin only) */
  togglePublished: protectedProcedure
    .input(z.object({ id: z.number().int().positive(), published: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const publishedAt = input.published ? new Date() : null;
      await db
        .update(blogPosts)
        .set({ published: input.published, publishedAt })
        .where(eq(blogPosts.id, input.id));
      return { success: true };
    }),
});
