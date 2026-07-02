/**
 * Scheduled Handler: Sync AI News to Blog
 * Runs daily to sync new AI News articles to the blog as draft posts
 * Endpoint: POST /api/scheduled/sync-ai-news-to-blog
 */

import { Request, Response } from "express";
import { getDb } from "../../db";
import { aiNewsArticles, blogPosts } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { sdk } from "../sdk";

export async function syncAiNewsToBlogHandler(req: Request, res: Response) {
  try {
    // Authenticate as cron
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database unavailable" });
    }

    // Get all non-archived AI News articles
    const articles = await db
      .select()
      .from(aiNewsArticles)
      .where(eq(aiNewsArticles.isArchived, 0));

    let synced = 0;
    let skipped = 0;

    for (const article of articles) {
      try {
        // Create slug from title
        const slug = article.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");

        // Check if blog post already exists
        const [existing] = await db
          .select()
          .from(blogPosts)
          .where(eq(blogPosts.slug, slug))
          .limit(1);

        if (existing) {
          skipped++;
          continue;
        }

        // Create new blog post from AI News article (as draft)
        const now = new Date().toISOString();
        const pubDate = article.publishedAt ? new Date(article.publishedAt).toISOString() : now;

        await db.insert(blogPosts).values({
          title: article.title,
          slug,
          excerpt: article.summary || article.title,
          content: article.content || article.summary || "",
          category: "AI News",
          authorName: "GigitekAI Team",
          readTime: "5 min",
          published: 0, // Draft - admin must approve
          publishedAt: null,
          createdAt: now,
        });

        synced++;
      } catch (err) {
        console.error(`Failed to sync AI News article "${article.title}":`, err);
      }
    }

    res.json({
      ok: true,
      synced,
      skipped,
      total: articles.length,
      message: `Synced ${synced} AI News articles to blog as drafts`,
    });
  } catch (err) {
    console.error("[syncAiNewsToBlogHandler] Error:", err);
    res.status(500).json({
      error: String(err),
      stack: err instanceof Error ? err.stack : undefined,
      context: { url: req.url, taskUid: (req as any).taskUid },
      timestamp: new Date().toISOString(),
    });
  }
}
