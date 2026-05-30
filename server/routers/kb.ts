import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { kbArticles, kbCommonIssues } from "../../drizzle/schema";
import { eq, like, or, desc, and } from "drizzle-orm";
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

  /** Search published KB articles with fuzzy matching and semantic relevance scoring */
  search: publicProcedure
    .input(z.object({ query: z.string().min(1), limit: z.number().int().min(1).max(50).default(20) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      // Split query into individual terms (ignore very short words)
      const terms = input.query
        .toLowerCase()
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

      // Levenshtein distance for fuzzy matching (handles typos and partial matches)
      const levenshteinDistance = (a: string, b: string): number => {
        const matrix: number[][] = [];
        for (let i = 0; i <= b.length; i++) matrix[i] = [i];
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
        for (let i = 1; i <= b.length; i++) {
          for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
              matrix[i][j] = matrix[i - 1][j - 1];
            } else {
              matrix[i][j] = Math.min(
                matrix[i - 1][j - 1] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j] + 1
              );
            }
          }
        }
        return matrix[b.length][a.length];
      };

      // Fuzzy match: returns 0-100 similarity score
      const fuzzyMatch = (haystack: string, needle: string): number => {
        if (!haystack || !needle) return 0;
        haystack = haystack.toLowerCase();
        needle = needle.toLowerCase();
        
        // Exact match = 100
        if (haystack === needle) return 100;
        
        // Substring match = 90
        if (haystack.includes(needle)) return 90;
        
        // Word boundary match (e.g., "lock" matches "lockout")
        const words = haystack.split(/\W+/);
        if (words.some(w => w.startsWith(needle) || needle.startsWith(w))) return 80;
        
        // Levenshtein-based fuzzy match (typo tolerance)
        const distance = levenshteinDistance(haystack, needle);
        const maxLen = Math.max(haystack.length, needle.length);
        const similarity = Math.max(0, 100 - (distance / maxLen) * 100);
        return similarity > 50 ? similarity : 0; // Only return if >50% similar
      };

      // Score each article using fuzzy matching
      const scored = rows.map((article) => {
        let score = 0;
        const titleLower = (article.title || "").toLowerCase();
        const categoryLower = (article.category || "").toLowerCase();
        const tagsLower = (article.tags || "").toLowerCase();
        const contentLower = (article.content || "").toLowerCase();
        const queryLower = input.query.toLowerCase();

        // Fuzzy match each term
        for (const term of terms) {
          // Title matches are weighted heavily (fuzzy)
          const titleMatch = fuzzyMatch(titleLower, term);
          if (titleMatch > 0) score += titleMatch * 2; // 0-200 points
          
          // Category/tags matches (fuzzy)
          const categoryMatch = fuzzyMatch(categoryLower, term);
          if (categoryMatch > 0) score += categoryMatch * 1.5; // 0-150 points
          
          const tagsMatch = fuzzyMatch(tagsLower, term);
          if (tagsMatch > 0) score += tagsMatch * 1.5; // 0-150 points
          
          // Content matches (lower weight)
          const contentMatch = fuzzyMatch(contentLower, term);
          if (contentMatch > 50) score += contentMatch * 0.5; // 25-50 points
        }

        // Bonus: full query match in title (semantic relevance)
        const fullQueryMatch = fuzzyMatch(titleLower, queryLower);
        if (fullQueryMatch > 70) score += 100; // Strong bonus for full query match

        // Recency bonus (articles updated recently rank slightly higher)
        const updatedAtTime = article.updatedAt ? new Date(article.updatedAt).getTime() : 0;
        const daysSinceUpdate = (Date.now() - updatedAtTime) / (1000 * 60 * 60 * 24);
        const recencyBonus = Math.max(0, 20 - Math.min(daysSinceUpdate, 20)); // 0-20 bonus
        score += recencyBonus;

        // View count bonus (popular articles rank higher)
        const viewBonus = Math.min((article.viewCount ?? 0) / 10, 30); // 0-30 bonus
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
      const { id, ...updates } = input;
      await db.update(kbArticles).set(updates as any).where(eq(kbArticles.id, id));
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
        .set({ isPublished: input.isPublished ? 1 : 0 })
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

  /** Get top 6 common issues for KB landing page */
  getCommonIssues: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const issues = await db
      .select()
      .from(kbCommonIssues)
      .orderBy(kbCommonIssues.orderNum)
      .limit(6);
    return issues;
  }),

  /** Seed all 50 KB articles (admin only, one-time) */
  seed: adminProcedure
    .mutation(async () => {
      return await seedKBArticles();
    }),

  /** Bulk insert KB articles (admin only) */
  bulkInsert: adminProcedure
    .input(
      z.object({
        articles: z.array(
          z.object({
            title: z.string(),
            category: z.string(),
            articleCode: z.string().optional(),
            audience: z.enum(["end-user", "technician", "admin"]).optional(),
            difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
            estimatedTime: z.string().optional(),
            symptoms: z.string().optional(),
            rootCause: z.string().optional(),
            resolutionSteps: z.array(z.string()).optional(),
            isPublished: z.boolean().default(true),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let inserted = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const article of input.articles) {
        try {
          const content = [
            article.symptoms ? `**Symptoms:** ${article.symptoms}` : "",
            article.rootCause ? `**Root Cause:** ${article.rootCause}` : "",
            article.resolutionSteps && article.resolutionSteps.length > 0
              ? `**Resolution Steps:**\n${article.resolutionSteps.map((step, i) => `${i + 1}. ${step}`).join("\n")}`
              : "",
          ]
            .filter((s) => s)
            .join("\n\n");

          await db.insert(kbArticles).values({
            title: article.title,
            content: content || article.title,
            category: article.category,
            articleCode: article.articleCode,
            audience: (article.audience as any) || "technician",
            difficulty: (article.difficulty as any) || "intermediate",
            estimatedResolutionTime: article.estimatedTime,
            isPublished: article.isPublished ? 1 : 0,
            createdBy: ctx.user.id,
            ariaEnabled: 1,
          });

          inserted++;
        } catch (err) {
          failed++;
          errors.push(`${article.articleCode || article.title}: ${(err as any).message}`);
        }
      }

      return {
        success: true,
        inserted,
        failed,
        total: input.articles.length,
        errors: errors.length > 0 ? errors : undefined,
      };
    }),

  /** Get trending articles for KB landing page */
  getTrendingArticles: publicProcedure
    .input(z.object({ limit: z.number().default(5) }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const limit = input?.limit || 5;
      return db
        .select()
        .from(kbArticles)
        .where(eq(kbArticles.isPublished, 1))
        .orderBy(desc(kbArticles.viewCount))
        .limit(limit);
    }),

  /** Email a KB article to a recipient */
  emailArticle: publicProcedure
    .input(z.object({
      recipientEmail: z.string().email(),
      articleId: z.number().int().positive(),
      articleTitle: z.string(),
      articleContent: z.string(),
      articleCategory: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <div style="background-color: #0f172a; color: #00d4ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h1 style="margin: 0; font-size: 24px;">${input.articleTitle}</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.8; font-size: 14px;">${input.articleCategory}</p>
            </div>
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #00d4ff;">
              ${input.articleContent}
            </div>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
              <p>This article was shared from GigitekAI Knowledge Base</p>
              <p><a href="https://gigitekai.com/admin/kb" style="color: #00d4ff; text-decoration: none;">View in Knowledge Base</a></p>
            </div>
          </div>
        `;

        const success = await sendEmail({
          to: input.recipientEmail,
          subject: `KB Article: ${input.articleTitle}`,
          html: htmlContent,
          fromName: "GigitekAI Support",
        });

        if (!success) {
          throw new Error("Failed to send email");
        }

        return { success: true, message: `Article sent to ${input.recipientEmail}` };
      } catch (error) {
        console.error("[KB Email] Error sending article:", error);
        throw new Error("Failed to send KB article via email");
      }
    }),
});
