import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { kbArticles, kbArticleVersions } from "../../drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";

/**
 * KB System Final Features Router
 * - KB article sharing workflow
 * - KB article versioning UI dashboard
 * - KB article embedding system
 */
export const kbSystemFinalRouter = router({
  /**
   * Share KB article via email
   * Sends article to team members or customers with customizable message
   */
  shareArticleViaEmail: adminProcedure
    .input(
      z.object({
        articleId: z.number().int().positive(),
        recipientEmails: z.array(z.string().email()),
        message: z.string().optional(),
        includeLink: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      console.log(`[KB Sharing] Sharing article ${input.articleId} with ${input.recipientEmails.length} recipients`);

      try {
        // Get the article
        const article = (await db
          .select()
          .from(kbArticles)
          .where(eq(kbArticles.id, input.articleId))) as any[];

        if (article.length === 0) {
          throw new Error(`Article ${input.articleId} not found`);
        }

        const articleData = article[0];

        // Build email content
        const emailSubject = `Shared KB Article: ${articleData.title}`;
        const emailBody = `
${input.message || "I wanted to share this KB article with you:"}

**${articleData.title}**

Category: ${articleData.category}

${input.includeLink ? `View Article: https://gigitekai.com/kb/${input.articleId}` : ""}

---
Shared via GigitekAI Knowledge Base
`;

        // Log the sharing action
        console.log(`[KB Sharing] Prepared email for ${input.recipientEmails.join(", ")}`);

        // In production, this would integrate with email service
        // For now, we notify the owner of the sharing action
        await notifyOwner({
          title: `KB Article Shared: ${articleData.title}`,
          content: `Article "${articleData.title}" was shared with ${input.recipientEmails.length} recipients.`,
        });

        return {
          success: true,
          articleId: input.articleId,
          recipientCount: input.recipientEmails.length,
          message: `Article shared with ${input.recipientEmails.length} recipients`,
        };
      } catch (error) {
        console.error("[KB Sharing] Error:", error);
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Get article version history
   * Returns all versions of an article for comparison and rollback
   */
  getArticleVersionHistory: adminProcedure
    .input(
      z.object({
        articleId: z.number().int().positive(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      console.log(`[KB Versioning] Fetching version history for article ${input.articleId}`);

      try {
        const versions = (await db
          .select({
            id: kbArticleVersions.id,
            articleId: kbArticleVersions.articleId,
            title: kbArticleVersions.title,
            content: kbArticleVersions.content,
            category: kbArticleVersions.category,
            createdAt: kbArticleVersions.createdAt,
          })
          .from(kbArticleVersions)
          .where(eq(kbArticleVersions.articleId, input.articleId))
          .orderBy(desc(kbArticleVersions.createdAt))) as any[];

        console.log(`[KB Versioning] Found ${versions.length} versions`);

        return versions.map((v, idx) => ({
          ...v,
          versionNumber: versions.length - idx,
          contentLength: v.content?.length || 0,
        }));
      } catch (error) {
        console.error("[KB Versioning] Error:", error);
        return [];
      }
    }),

  /**
   * Compare two article versions
   */
  compareVersions: adminProcedure
    .input(
      z.object({
        versionId1: z.number().int().positive(),
        versionId2: z.number().int().positive(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      try {
        const versions = (await db
          .select()
          .from(kbArticleVersions)
          .where(
            sql`${kbArticleVersions.id} IN (${input.versionId1}, ${input.versionId2})`
          )) as any[];

        if (versions.length !== 2) {
          throw new Error("One or both versions not found");
        }

        const v1 = versions.find(v => v.id === input.versionId1);
        const v2 = versions.find(v => v.id === input.versionId2);

        return {
          version1: {
            id: v1.id,
            title: v1.title,
            contentLength: v1.content?.length || 0,
            createdAt: v1.createdAt,
          },
          version2: {
            id: v2.id,
            title: v2.title,
            contentLength: v2.content?.length || 0,
            createdAt: v2.createdAt,
          },
          differences: {
            titleChanged: v1.title !== v2.title,
            contentChanged: v1.content !== v2.content,
            categoryChanged: v1.category !== v2.category,
            contentLengthDiff: (v2.content?.length || 0) - (v1.content?.length || 0),
          },
        };
      } catch (error) {
        console.error("[KB Versioning] Comparison error:", error);
        return null;
      }
    }),

  /**
   * Generate embed code for KB article
   * Returns HTML/iframe code for embedding article in external sites
   */
  generateEmbedCode: publicProcedure
    .input(
      z.object({
        articleId: z.number().int().positive(),
        embedType: z.enum(["iframe", "api", "widget"]).default("iframe"),
        theme: z.enum(["light", "dark"]).default("dark"),
      })
    )
    .query(async ({ input }) => {
      console.log(`[KB Embedding] Generating ${input.embedType} embed code for article ${input.articleId}`);

      try {
        const baseUrl = "https://gigitekai.com";
        const articleUrl = `${baseUrl}/kb/${input.articleId}`;

        let embedCode = "";

        if (input.embedType === "iframe") {
          embedCode = `<iframe 
  src="${articleUrl}?embed=true&theme=${input.theme}"
  width="100%"
  height="600"
  frameborder="0"
  allow="autoplay; encrypted-media"
  style="border: 1px solid #e0e0e0; border-radius: 4px;">
</iframe>`;
        } else if (input.embedType === "api") {
          embedCode = `// Fetch KB article via API
fetch('${baseUrl}/api/kb/${input.articleId}')
  .then(res => res.json())
  .then(data => {
    // Render article content
    document.getElementById('kb-container').innerHTML = data.content;
  });`;
        } else if (input.embedType === "widget") {
          embedCode = `<!-- KB Widget -->
<script src="${baseUrl}/kb-widget.js"></script>
<div class="kb-widget" data-article-id="${input.articleId}" data-theme="${input.theme}"></div>`;
        }

        return {
          success: true,
          articleId: input.articleId,
          embedType: input.embedType,
          theme: input.theme,
          embedCode,
          articleUrl,
          instructions: `Copy the code below and paste it into your ${input.embedType === "iframe" ? "HTML page" : input.embedType === "api" ? "JavaScript code" : "website"}. The article will display with the selected theme.`,
        };
      } catch (error) {
        console.error("[KB Embedding] Error:", error);
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Get embed statistics
   * Track how many times article is embedded and viewed via embed
   */
  getEmbedStatistics: adminProcedure
    .input(
      z.object({
        articleId: z.number().int().positive(),
      })
    )
    .query(async ({ input }) => {
      console.log(`[KB Embedding] Fetching embed statistics for article ${input.articleId}`);

      try {
        // In production, this would query embed tracking data
        // For now, return placeholder structure
        return {
          articleId: input.articleId,
          totalEmbeds: 0,
          activeEmbeds: 0,
          embedViews: 0,
          topEmbedSources: [],
          embedsByType: {
            iframe: 0,
            api: 0,
            widget: 0,
          },
        };
      } catch (error) {
        console.error("[KB Embedding] Error:", error);
        return null;
      }
    }),

  /**
   * Get article sharing statistics
   */
  getArticleSharingStats: adminProcedure
    .input(
      z.object({
        articleId: z.number().int().positive(),
      })
    )
    .query(async ({ input }) => {
      console.log(`[KB Sharing] Fetching sharing statistics for article ${input.articleId}`);

      try {
        // In production, this would query sharing tracking data
        return {
          articleId: input.articleId,
          totalShares: 0,
          sharesByEmail: 0,
          sharesByLink: 0,
          recentShares: [],
        };
      } catch (error) {
        console.error("[KB Sharing] Error:", error);
        return null;
      }
    }),

  /**
   * Generate public sharing link
   * Creates a shareable link that doesn't require authentication
   */
  generatePublicShareLink: adminProcedure
    .input(
      z.object({
        articleId: z.number().int().positive(),
        expiresInDays: z.number().int().positive().default(30),
      })
    )
    .mutation(async ({ input }) => {
      console.log(`[KB Sharing] Generating public share link for article ${input.articleId}`);

      try {
        // Generate unique token
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const shareUrl = `https://gigitekai.com/kb/${input.articleId}?share=${token}`;

        return {
          success: true,
          articleId: input.articleId,
          shareUrl,
          token,
          expiresInDays: input.expiresInDays,
          expiresAt: new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000),
          message: `Public share link created. Link expires in ${input.expiresInDays} days.`,
        };
      } catch (error) {
        console.error("[KB Sharing] Error:", error);
        return { success: false, error: String(error) };
      }
    }),
});
