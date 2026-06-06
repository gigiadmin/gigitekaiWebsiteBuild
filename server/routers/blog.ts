/**
 * Blog Router — public read + admin write/delete
 * Public procedures: listPosts, getPostBySlug
 * Admin procedures: createPost, updatePost, deletePost, togglePublished, adminListPosts
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { blogPosts, blogTags, blogPostTags } from "../../drizzle/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { storagePut } from "../storage";
import { sendEmail } from "../_core/email";

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
      .where(eq(blogPosts.published, 1))
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
        .where(and(eq(blogPosts.slug, input.slug), eq(blogPosts.published, 1)))
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
        published: input.published ? 1 : 0,
        publishedAt: input.published ? new Date().toISOString() : null,
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
      const mappedFields = { ...fields, ...(fields.published !== undefined && { published: fields.published ? 1 : 0 }) };
      await db
        .update(blogPosts)
        .set({
          ...(mappedFields as any),
          ...(publishedAt !== undefined ? { publishedAt: publishedAt ? new Date(publishedAt as any).toISOString() : null } : {}),
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
      const publishedAt = input.published ? new Date().toISOString() : null;
      await db
        .update(blogPosts)
        .set({ published: input.published ? 1 : 0, publishedAt })
        .where(eq(blogPosts.id, input.id));
      return { success: true };
    }),

  /** Get all blog tags (public) */
  getTags: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const tags = await db
      .select()
      .from(blogTags)
      .orderBy(blogTags.name);
    return tags;
  }),

  /** Get posts by category (public) */
  getByCategory: publicProcedure
    .input(z.object({ category: z.string().min(1) }))
    .query(async ({ input }) => {
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
        .where(and(eq(blogPosts.published, 1), eq(blogPosts.category, input.category)))
        .orderBy(desc(blogPosts.publishedAt));
      return posts;
    }),

  /** Get posts by tag (public) */
  getByTag: publicProcedure
    .input(z.object({ tagSlug: z.string().min(1) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const [tag] = await db.select().from(blogTags).where(eq(blogTags.slug, input.tagSlug)).limit(1);
      if (!tag) return [];
      const postIds = await db
        .select({ postId: blogPostTags.postId })
        .from(blogPostTags)
        .where(eq(blogPostTags.tagId, tag.id));
      if (postIds.length === 0) return [];
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
        .where(and(eq(blogPosts.published, 1), inArray(blogPosts.id, postIds.map(p => p.postId))))
        .orderBy(desc(blogPosts.publishedAt));
      return posts;
    }),

  /** Search blog posts (public) */
  search: publicProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const searchTerm = `%${input.query}%`;
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
        .where(and(eq(blogPosts.published, 1)))
        .orderBy(desc(blogPosts.publishedAt));
      // Filter in-memory for title and excerpt matches
      return posts.filter(p => 
        p.title.toLowerCase().includes(input.query.toLowerCase()) ||
        p.excerpt.toLowerCase().includes(input.query.toLowerCase())
      );
    }),

  /** Admin: Generate a daily AI blog post */
  generateDaily: protectedProcedure.mutation(async ({ ctx }) => {
    requireAdmin(ctx.user.role);
    try {
      const { generateDailyAIBlogPost, saveBlogPost } = await import("../services/dailyAIBlogGenerator");
      const post = await generateDailyAIBlogPost();
      await saveBlogPost(post);
      return {
        success: true,
        post,
        message: `Blog post created: "${post.title}"`,
      };
    } catch (error) {
      console.error("[Blog] Generation failed:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate blog post",
      });
    }
  }),

  /** Admin: Send blog post to all newsletter subscribers */
  sendToSubscribers: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        excerpt: z.string(),
        slug: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      try {
        const { sendBlogToSubscribers } = await import("../services/dailyAIBlogGenerator");
        const result = await sendBlogToSubscribers(input);
        return {
          success: true,
          sent: result.sent,
          failed: result.failed,
          message: `Sent to ${result.sent} subscribers (${result.failed} failed)`,
        };
      } catch (error) {
        console.error("[Blog] Send to subscribers failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send blog post to subscribers",
        });
      }
    }),

  /** Send blog post via email (admin only) */
  sendBlogEmail: protectedProcedure
    .input(
      z.object({
        postId: z.number().int().positive(),
        recipientEmail: z.string().email("Invalid email address"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Get the blog post
      const [post] = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.id, input.postId))
        .limit(1);

      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Blog post not found" });
      }

      if (!post.published) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Can only share published posts" });
      }

      // Build the blog post URL
      const baseUrl = process.env.VITE_APP_ID ? `https://gigitekai.com` : `http://localhost:3000`;
      const postUrl = `${baseUrl}/blog/${post.slug}`;

      // Send email with blog post link
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #00D4FF;">Check out this blog post</h2>
          <p>Hi,</p>
          <p>I wanted to share this interesting article with you:</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">${post.title}</h3>
            <p style="color: #666; margin: 10px 0;">${post.excerpt}</p>
            <p style="color: #999; font-size: 14px; margin: 10px 0;">
              Category: ${post.category} | Read time: ${post.readTime}
            </p>
            <a href="${postUrl}" style="display: inline-block; background-color: #00D4FF; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 10px;">
              Read the full article
            </a>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            This email was sent from GigitekAI Blog
          </p>
        </div>
      `;

      await sendEmail({
        to: input.recipientEmail,
        subject: `Check out: ${post.title}`,
        html: emailHtml,
      });

      return { success: true, message: "Blog post shared successfully" };
    }),
});
