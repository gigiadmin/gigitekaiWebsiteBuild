/**
 * Sync AI News Articles to Blog Posts
 * Automatically publishes AI News articles to the blog when they're created
 */

import { getDb } from "../db";
import { aiNewsArticles, blogPosts } from "../../drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";

/**
 * Sync a single AI News article to blogPosts
 * Creates a blog post entry if it doesn't already exist
 */
export async function syncAiNewsToBlog(articleId: number) {
  const db = await getDb();
  if (!db) return null;

  // Get the AI News article
  const [article] = await db
    .select()
    .from(aiNewsArticles)
    .where(eq(aiNewsArticles.id, articleId))
    .limit(1);

  if (!article) return null;

  // Create slug from title
  const slug = article.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // Check if blog post already exists with this slug
  const [existing] = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug))
    .limit(1);

  if (existing) {
    // Update existing post with AI News content
    const pubDate = article.publishedAt ? new Date(article.publishedAt).toISOString() : new Date().toISOString();
    await db
      .update(blogPosts)
      .set({
        content: article.content || article.summary || "",
        published: 1,
        publishedAt: pubDate,
      })
      .where(eq(blogPosts.id, existing.id));

    return existing.id;
  }

  // Create new blog post from AI News article
  const now = new Date().toISOString();
  const pubDate = article.publishedAt ? new Date(article.publishedAt).toISOString() : now;
  
  const result = await db.insert(blogPosts).values({
    title: article.title,
    slug,
    excerpt: article.summary || article.title,
    content: article.content || article.summary || "",
    category: "AI News",
    authorName: "GigitekAI Team",
    readTime: "5 min",
    published: 1,
    publishedAt: pubDate,
    createdAt: now,
  });

  // Return the inserted ID
  return (result as any).insertId || 0;
}

/**
 * Sync all unsynced AI News articles to blog
 * Useful for bulk operations or recovery
 */
export async function syncAllAiNewsToBlog() {
  const db = await getDb();
  if (!db) return { synced: 0, failed: 0 };

  // Get all AI News articles that aren't archived
  const articles = await db
    .select()
    .from(aiNewsArticles)
    .where(eq(aiNewsArticles.isArchived, 0));

  let synced = 0;
  let failed = 0;

  for (const article of articles) {
    try {
      await syncAiNewsToBlog(article.id);
      synced++;
    } catch (err) {
      console.error(`Failed to sync AI News article ${article.id}:`, err);
      failed++;
    }
  }

  return { synced, failed };
}
