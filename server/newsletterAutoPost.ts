/**
 * Newsletter Auto-Post API
 * POST /api/newsletter/auto-post
 *
 * Accepts AI Daily Recap content (markdown or HTML), then:
 * 1. Creates a blog post on the site (published immediately)
 * 2. Creates a newsletter campaign and sends it to all active subscribers
 *
 * Auth: Bearer token via NEWSLETTER_AUTO_POST_KEY env var
 * Called by the Manus scheduled task that generates the daily AI recap.
 */

import { Router } from "express";
import { getDb } from "./db";
import { blogPosts, newsletterCampaigns, newsletterSubscribers } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { executeCampaignSend } from "./routers/newsletter";
import { notifyOwner } from "./_core/notification";

const router = Router();

/** Convert markdown-ish content to simple HTML for email */
function markdownToHtml(md: string): string {
  let html = md
    // Headers
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#00D4FF;">$1</a>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;"/>')
    // Line breaks (double newline = paragraph)
    .replace(/\n\n/g, "</p><p>")
    // Single newlines
    .replace(/\n/g, "<br/>");

  // Wrap in paragraph tags
  html = `<p>${html}</p>`;
  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, "");
  // Fix headers inside paragraphs
  html = html.replace(/<p>(<h[1-3]>)/g, "$1");
  html = html.replace(/(<\/h[1-3]>)<\/p>/g, "$1");
  // Fix hr inside paragraphs
  html = html.replace(/<p>(<hr[^>]*\/>)/g, "$1");
  html = html.replace(/(<hr[^>]*\/>)<\/p>/g, "$1");

  return html;
}

/** Generate a URL-friendly slug from a title */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 200);
}

/** Estimate read time from text content */
function estimateReadTime(text: string): string {
  const words = text.replace(/<[^>]*>/g, "").split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

/**
 * POST /api/newsletter/auto-post
 *
 * Body (JSON):
 * {
 *   "subject": "🚀 Gigitek AI Daily Recap: ...",
 *   "content": "# Markdown content...",          // Markdown or HTML
 *   "contentFormat": "markdown" | "html",         // default: "markdown"
 *   "category": "AI News",                        // blog category (default: "AI News")
 *   "authorName": "GigitekAI Team",               // optional
 *   "skipBlog": false,                            // optional: skip blog post creation
 *   "skipNewsletter": false                       // optional: skip newsletter send
 * }
 */
router.post("/auto-post", async (req, res) => {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const apiKey = process.env.NEWSLETTER_AUTO_POST_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: "NEWSLETTER_AUTO_POST_KEY not configured on server",
      });
    }

    const authHeader = req.headers.authorization;
    const providedKey =
      authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : req.body?.apiKey;

    if (!providedKey || providedKey !== apiKey) {
      return res.status(401).json({
        success: false,
        error: "Invalid or missing API key",
      });
    }

    // ── Validate input ───────────────────────────────────────────────────
    const {
      subject,
      content,
      contentFormat = "markdown",
      category = "AI News",
      authorName = "GigitekAI Team",
      skipBlog = false,
      skipNewsletter = false,
    } = req.body;

    if (!subject || typeof subject !== "string" || subject.trim().length === 0) {
      return res.status(400).json({ success: false, error: "subject is required" });
    }
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return res.status(400).json({ success: false, error: "content is required" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(503).json({ success: false, error: "Database unavailable" });
    }

    // ── Prepare HTML content ─────────────────────────────────────────────
    const bodyHtml =
      contentFormat === "html" ? content : markdownToHtml(content);

    const results: {
      blog?: { id: number; slug: string; url: string };
      newsletter?: { campaignId: number; sentCount: number; failedCount: number; recipientCount: number };
    } = {};

    // ── 1. Create Blog Post ──────────────────────────────────────────────
    if (!skipBlog) {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
      // Use a short, clean slug: daily-recap-YYYY-MM-DD
      // For non-recap posts, use a truncated subject slug
      // Detect recap posts by category OR by the legacy subject pattern
      const isRecap = category?.toLowerCase() === 'ai news' || subject.toLowerCase().includes('recap') || subject.toLowerCase().includes('briefing');
      let slug = isRecap
        ? `daily-recap-${dateStr}`
        : `${slugify(subject).slice(0, 60)}-${dateStr}`;

      // Ensure unique slug
      const [existing] = await db
        .select({ id: blogPosts.id })
        .from(blogPosts)
        .where(eq(blogPosts.slug, slug))
        .limit(1);

      if (existing) {
        // Already ran today — append hour to make unique
        slug = `${slug}-${now.getHours().toString().padStart(2, '0')}`;
      }

      // Extract first ~200 chars as excerpt
      const plainText = content.replace(/<[^>]*>/g, "").replace(/[#*_\[\]()]/g, "");
      const excerpt =
        plainText.slice(0, 200).trim() + (plainText.length > 200 ? "..." : "");

      const readTime = estimateReadTime(content);

      const [insertResult] = await db.insert(blogPosts).values({
        slug,
        title: subject.replace(/^🚀\s*/, ""), // Strip leading emoji for clean title
        excerpt,
        content: contentFormat === "markdown" ? content : bodyHtml, // Store original format
        category,
        readTime,
        authorName,
        published: 1,
        publishedAt: new Date().toISOString(),
      });

      const blogId = (insertResult as any).insertId as number;
      results.blog = {
        id: blogId,
        slug,
        url: `https://gigitekai.com/blog/${slug}`,
      };

      console.log(`[Newsletter Auto-Post] Blog post created: id=${blogId} slug=${slug}`);
    }

    // ── 2. Send Newsletter ───────────────────────────────────────────────
    if (!skipNewsletter) {
      // Check subscriber count first
      const subscribers = await db
        .select({ id: newsletterSubscribers.id })
        .from(newsletterSubscribers)
        .where(eq(newsletterSubscribers.active, 1));

      if (subscribers.length === 0) {
        console.log("[Newsletter Auto-Post] No active subscribers — skipping send");
        results.newsletter = { campaignId: 0, sentCount: 0, failedCount: 0, recipientCount: 0 };
      } else {
        // Create campaign record
        const [campaignResult] = await db.insert(newsletterCampaigns).values({
          subject,
          body: bodyHtml,
          status: "sending",
          sentBy: "auto-post-api",
          recipientCount: subscribers.length,
        });

        const campaignId = (campaignResult as any).insertId as number;

        // Send to all subscribers
        const sendResult = await executeCampaignSend({
          campaignId,
          subject,
          bodyHtml,
          siteUrl: "https://gigitekai.com",
          sentBy: "auto-post-api",
        });

        results.newsletter = {
          campaignId,
          ...sendResult,
        };

        console.log(
          `[Newsletter Auto-Post] Campaign sent: id=${campaignId} delivered=${sendResult.sentCount}/${sendResult.recipientCount}`
        );
      }
    }

    // ── Notify owner ─────────────────────────────────────────────────────
    await notifyOwner({
      title: `📰 Auto-Post: "${subject}"`,
      content: [
        results.blog ? `Blog: ${results.blog.url}` : "Blog: skipped",
        results.newsletter
          ? `Newsletter: ${results.newsletter.sentCount}/${results.newsletter.recipientCount} delivered`
          : "Newsletter: skipped",
      ].join("\n"),
    }).catch(() => {});

    return res.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error("[Newsletter Auto-Post] Error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/newsletter/auto-post/health
 * Health check for the auto-post endpoint
 */
router.get("/auto-post/health", (_req, res) => {
  return res.json({
    success: true,
    service: "newsletter-auto-post",
    timestamp: new Date().toISOString(),
    configured: !!process.env.NEWSLETTER_AUTO_POST_KEY,
  });
});

export default router;
