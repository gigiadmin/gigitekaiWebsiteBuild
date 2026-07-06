import z from "zod";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { kbArticles, kbCommonIssues } from "../../drizzle/schema";
import { eq, like, or, desc, and, sql, asc } from "drizzle-orm";
import { sendEmail } from "../_core/email";
import { seedKBArticles } from "../kb-seeder";

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
        .where(showAll ? undefined : eq(kbArticles.isPublished, 1))
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

  /** Search published KB articles with improved phrase-based relevance ranking */
  search: publicProcedure
    .input(z.object({ query: z.string().min(1), limit: z.number().int().min(1).max(50).default(20) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const queryLower = input.query.toLowerCase();
      // Split query into individual terms (ignore very short words)
      const terms = queryLower
        .split(/\s+/)
        .filter((t) => t.length >= 2)
        .slice(0, 8); // cap at 8 terms

      if (terms.length === 0) return [];

      // Fetch ALL published articles for client-side fuzzy matching
      const rows = await db
        .select()
        .from(kbArticles)
        .where(eq(kbArticles.isPublished, 1))
        .orderBy(desc(kbArticles.updatedAt))
        .limit(500); // fetch all articles for comprehensive search

      // Count how many query terms appear in text
      const countTermMatches = (text: string): number => {
        if (!text) return 0;
        const textLower = text.toLowerCase();
        return terms.filter(term => textLower.includes(term)).length;
      };

      // Score each article using improved phrase-based ranking
      const scored = rows.map((article) => {
        let score = 0;
        const titleLower = (article.title || "").toLowerCase();
        const categoryLower = (article.category || "").toLowerCase();
        const tagsLower = (article.tags || "").toLowerCase();
        const contentLower = (article.content || "").toLowerCase();

        // CRITICAL: Full query phrase match in title (highest priority)
        if (titleLower.includes(queryLower)) {
          score += 500; // Massive bonus for exact phrase in title
        }

        // CRITICAL: Full query phrase match in content (high priority)
        if (contentLower.includes(queryLower)) {
          score += 300; // Strong bonus for exact phrase in content
        }

        // Count how many terms from the query appear in title (phrase relevance)
        const titleTermCount = countTermMatches(titleLower);
        if (titleTermCount === terms.length) {
          score += 250; // All terms in title = strong relevance
        } else if (titleTermCount > 0) {
          score += titleTermCount * 60; // Partial term matches in title
        }

        // Count how many terms from the query appear in content
        const contentTermCount = countTermMatches(contentLower);
        if (contentTermCount === terms.length) {
          score += 150; // All terms in content
        } else if (contentTermCount > 0) {
          score += contentTermCount * 30; // Partial term matches in content
        }

        // Category/tags matches (lower weight than title/content)
        const categoryTermCount = countTermMatches(categoryLower);
        if (categoryTermCount > 0) score += categoryTermCount * 40;
        
        const tagsTermCount = countTermMatches(tagsLower);
        if (tagsTermCount > 0) score += tagsTermCount * 35;

        // Recency bonus (articles updated recently rank slightly higher)
        const updatedAtTime = article.updatedAt ? new Date(article.updatedAt).getTime() : 0;
        const daysSinceUpdate = (Date.now() - updatedAtTime) / (1000 * 60 * 60 * 24);
        const recencyBonus = Math.max(0, 15 - Math.min(daysSinceUpdate, 15)); // 0-15 bonus
        score += recencyBonus;

        // View count bonus (popular articles rank higher)
        const viewBonus = Math.min((article.viewCount ?? 0) / 10, 20); // 0-20 bonus
        score += viewBonus;

        return { ...article, _score: score };
      });

      // Filter out articles with score 0 (no match)
      const filtered = scored.filter(a => a._score > 0);

      // Sort by score descending
      filtered.sort((a, b) => b._score - a._score);

      // Strip internal _score field and return top N
      return filtered.slice(0, input.limit).map(({ _score, ...article }) => article);
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
        isPublished: input.isPublished ? 1 : 0,
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
      const updates: any = {};
      if (input.title) updates.title = input.title;
      if (input.content) updates.content = input.content;
      if (input.category) updates.category = input.category;
      if (input.tags) updates.tags = input.tags;
      if (input.isPublished !== undefined) updates.isPublished = input.isPublished ? 1 : 0;
      updates.updatedAt = new Date();
      await db.update(kbArticles).set(updates).where(eq(kbArticles.id, input.id));
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

  /** Bulk insert KB articles (admin only) */
  bulkInsert: adminProcedure
    .input(
      z.object({
        articles: z.array(
          z.object({
            title: z.string().min(3),
            content: z.string().min(10),
            category: z.string().min(1),
            tags: z.string().optional(),
            isPublished: z.boolean().default(true),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const values = input.articles.map(a => ({
        title: a.title,
        content: a.content,
        category: a.category,
        tags: a.tags || "",
        isPublished: a.isPublished ? 1 : 0,
        createdBy: ctx.user.id,
      }));
      const result = await db.insert(kbArticles).values(values);
      return { inserted: values.length };
    }),

  /** Get categories list with counts */
  getCategories: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db
      .select({ 
        category: kbArticles.category,
        count: sql`COUNT(*)`
      })
      .from(kbArticles)
      .where(eq(kbArticles.isPublished, 1))
      .groupBy(kbArticles.category)
      .orderBy(asc(kbArticles.category));
    return rows.filter(r => r.category).map(r => ({ category: r.category, count: r.count || 0 }));
  }),

  /** List articles by category with pagination */
  listByCategory: publicProcedure
    .input(z.object({ 
      category: z.string().min(1),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(24)
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { articles: [], total: 0, pages: 0 };
      
      const offset = (input.page - 1) * input.pageSize;
      
      // Get total count
      const countResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(kbArticles)
        .where(and(
          eq(kbArticles.isPublished, 1),
          eq(kbArticles.category, input.category)
        ));
      
      const total = countResult[0]?.count || 0;
      const pages = Math.ceil(total / input.pageSize);
      
      // Get paginated articles
      const articles = await db
        .select()
        .from(kbArticles)
        .where(and(
          eq(kbArticles.isPublished, 1),
          eq(kbArticles.category, input.category)
        ))
        .orderBy(desc(kbArticles.updatedAt))
        .limit(input.pageSize)
        .offset(offset);
      
      return { articles, total, pages };
    }),

  /** List all articles with pagination (for browse) */
  listPaginated: publicProcedure
    .input(z.object({ 
      category: z.string().optional(),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(24)
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { articles: [], total: 0, pages: 0 };
      
      const offset = (input.page - 1) * input.pageSize;
      
      const whereConditions: any[] = [eq(kbArticles.isPublished, 1)];
      if (input.category) {
        whereConditions.push(eq(kbArticles.category, input.category));
      }
      
      const countResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(kbArticles)
        .where(and(...whereConditions));
      
      const total = countResult[0]?.count || 0;
      const pages = Math.ceil(total / input.pageSize);
      
      const articles = await db
        .select()
        .from(kbArticles)
        .where(and(...whereConditions))
        .orderBy(desc(kbArticles.updatedAt))
        .limit(input.pageSize)
        .offset(offset);
      
      return { articles, total, pages };
    }),

  /** Get common issues (top KB articles) */
  getCommonIssues: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db
      .select()
      .from(kbArticles)
      .where(eq(kbArticles.isPublished, 1))
      .orderBy(desc(kbArticles.viewCount))
      .limit(6);
    return rows;
  }),

  /** Get trending articles */
  getTrendingArticles: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(6) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db
        .select()
        .from(kbArticles)
        .where(eq(kbArticles.isPublished, 1))
        .orderBy(desc(kbArticles.updatedAt))
        .limit(input.limit);
      return rows;
    }),

  /** Toggle publish status of an article (admin only) */
  togglePublish: adminProcedure
    .input(z.object({ id: z.number().int().positive(), isPublished: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db
        .update(kbArticles)
        .set({ isPublished: input.isPublished ? 1 : 0, updatedAt: new Date().toISOString() })
        .where(eq(kbArticles.id, input.id));
      return { success: true };
    }),

  /** Email an article link to a recipient */
  emailArticle: protectedProcedure
    .input(z.object({ articleId: z.number().int().positive(), recipientEmail: z.string().email(), articleTitle: z.string().optional(), articleContent: z.string().optional(), articleCategory: z.string().optional() }))
    .mutation(async ({ input }) => {
      // Placeholder — integrate with SendGrid/ACS when needed
      console.log(`[KB] Email article ${input.articleId} to ${input.recipientEmail}`);
      return { success: true };
    }),

  /** Seed KB with initial articles (admin only) */
  seed: adminProcedure.mutation(async ({ ctx }) => {
    const result = await seedKBArticles();
    return result;
  }),
});
