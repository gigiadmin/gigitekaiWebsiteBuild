/**
 * Daily AI Blog Post Generator
 * 
 * Generates non-technical, practical AI blog posts for small businesses
 * Runs Mon-Fri at 1 PM, searches latest AI news, creates post, sends to subscribers
 */

import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { blogPosts, settings } from "../../drizzle/schema";
import { sendEmail } from "../_core/emailService";
import { eq } from "drizzle-orm";
import crypto from "crypto";

/**
 * Fetch real AI news from multiple sources
 */
async function fetchLatestAINews(): Promise<string[]> {
  const newsItems: string[] = [];
  
  try {
    // Try to fetch from NewsAPI or similar service
    const newsApiKey = process.env.NEWS_API_KEY;
    if (newsApiKey) {
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=AI+artificial+intelligence&sortBy=publishedAt&language=en&pageSize=5&apiKey=${newsApiKey}`
      );
      const data = await response.json();
      if (data.articles) {
        data.articles.forEach((article: any) => {
          newsItems.push(`${article.title} - Source: ${article.source.name}`);
        });
      }
    }
  } catch (err) {
    console.warn("[Daily Blog] Failed to fetch real news:", err);
  }

  // Fallback: Return generic trending topics if no real news available
  if (newsItems.length === 0) {
    newsItems.push(
      "AI for customer service automation (chatbots, email)",
      "AI for content creation (social media, emails)",
      "AI for scheduling and time management",
      "AI for data analysis and reporting",
      "AI for lead qualification and sales"
    );
  }

  return newsItems;
}

/**
 * Generate content hash for deduplication
 */
function generateContentHash(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * Check if this content was already sent today
 */
async function isDuplicateContent(contentHash: string, db: any): Promise<boolean> {
  try {
    const result = await db
      .select()
      .from(settings)
      .where(eq(settings.key, "last_newsletter_content_hash"));
    
    if (result.length > 0) {
      const lastHash = result[0].value;
      return lastHash === contentHash;
    }
  } catch (err) {
    console.warn("[Daily Blog] Failed to check duplicate content:", err);
  }
  return false;
}

/**
 * Save content hash to prevent duplicates
 */
async function saveContentHash(contentHash: string, db: any): Promise<void> {
  try {
    // Delete old entry
    await db.delete(settings).where(eq(settings.key, "last_newsletter_content_hash"));
    
    // Insert new entry
    await db.insert(settings).values({
      key: "last_newsletter_content_hash",
      value: contentHash,
      description: "Hash of last sent newsletter content for deduplication",
    });
  } catch (err) {
    console.warn("[Daily Blog] Failed to save content hash:", err);
  }
}

/**
 * Generate a non-technical AI blog post for small businesses
 * Uses LLM to create practical, actionable content with real news
 */
export async function generateDailyAIBlogPost(): Promise<{
  title: string;
  excerpt: string;
  content: string;
  slug: string;
}> {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Fetch real AI news
  const latestNews = await fetchLatestAINews();
  const newsContext = latestNews.slice(0, 3).join("\n- ");

  const systemPrompt = `You are a non-technical AI expert writing for small business owners (1-50 employees).
Your goal is to explain how AI can help their business in simple, practical terms.

IMPORTANT RULES:
- Write for a 6th-grade reading level (no jargon)
- Focus on REAL, PRACTICAL use cases (not hype)
- Include 3-4 concrete examples small businesses can implement TODAY
- Emphasize SAFETY and RESPONSIBLE AI use
- Include a "Getting Started" section with 3 simple steps
- Make it actionable - readers should feel they can do this
- Include a "Common Mistakes to Avoid" section
- Use short sentences and paragraphs
- Include a "ROI" section: "What You'll Save" (time/money)

Format your response as valid JSON with this structure:
{
  "title": "...",
  "excerpt": "...",
  "content": "..."
}

Content should be HTML (use <p>, <h2>, <h3>, <ul>, <li> tags).`;

  const userPrompt = `Today is ${today}. Create a blog post about how small businesses can use AI safely and effectively.

Base your post on these latest AI news items:
- ${newsContext}

Make it practical, actionable, and non-scary. Include real examples of small businesses using AI successfully.
Emphasize that AI is a TOOL, not a replacement for humans.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) throw new Error("No content generated");

    // Parse JSON response
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    const parsed = JSON.parse(contentStr);
    
    // Generate slug from title
    const slug = parsed.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim();

    // Generate content hash for deduplication
    const contentHash = generateContentHash(parsed.content);

    return {
      title: parsed.title,
      excerpt: parsed.excerpt,
      content: parsed.content,
      slug,
    };
  } catch (error) {
    console.error("[Daily Blog] Generation failed:", error);
    throw error;
  }
}

/**
 * Save generated blog post to database
 */
export async function saveBlogPost(post: {
  title: string;
  excerpt: string;
  content: string;
  slug: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const result = await db.insert(blogPosts).values({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    category: "AI for Business",
    readTime: estimateReadTime(post.content),
    authorName: "GigitekAI Team",
    authorTitle: "AI Strategy",
    authorBio: "Daily AI insights for small business owners",
    authorAvatar: "https://gigitekai.com/logo.png",
    published: 1 as any,
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return result;
}

/**
 * Send blog post to all subscribers
 * TODO: Implement when blogSubscribers table is created
 */
export async function sendBlogToSubscribers(post: {
  title: string;
  excerpt: string;
  slug: string;
}) {
  // Placeholder for future subscriber email functionality
  console.log("[Daily Blog] Subscriber email sending not yet implemented");
  return { sent: 0, failed: 0 };
}

/**
 * Estimate reading time from HTML content
 */
function estimateReadTime(html: string): string {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const words = text.split(" ").filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

/**
 * Check if today is a weekday (Mon-Fri)
 */
export function isWeekday(): boolean {
  const day = new Date().getDay();
  return day >= 1 && day <= 5; // 1 = Monday, 5 = Friday
}

/**
 * Check if current time is 1 PM (13:00)
 */
export function isOneOClockPM(): boolean {
  const hour = new Date().getHours();
  return hour === 13; // 1 PM in 24-hour format
}

/**
 * Main function: Generate and send daily blog post
 */
export async function runDailyBlogPost() {
  try {
    // Check if it's a weekday and 1 PM
    if (!isWeekday()) {
      console.log("[Daily Blog] Skipping - not a weekday");
      return;
    }

    if (!isOneOClockPM()) {
      console.log("[Daily Blog] Skipping - not 1 PM");
      return;
    }

    console.log("[Daily Blog] Starting daily blog generation...");

    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Generate blog post
    const post = await generateDailyAIBlogPost();
    console.log(`[Daily Blog] Generated: "${post.title}"`);

    // Check for duplicate content
    const contentHash = generateContentHash(post.content);
    const isDuplicate = await isDuplicateContent(contentHash, db);
    
    if (isDuplicate) {
      console.log("[Daily Blog] ⚠️ DUPLICATE CONTENT DETECTED - Skipping send");
      return { success: false, error: "Duplicate content detected", post };
    }

    // Save content hash
    await saveContentHash(contentHash, db);

    // Save to database
    await saveBlogPost(post);
    console.log("[Daily Blog] Saved to database");

    // Send to subscribers
    const result = await sendBlogToSubscribers(post);
    console.log(`[Daily Blog] Sent to ${result.sent} subscribers (${result.failed} failed)`);

    return { success: true, post, subscribers: result };
  } catch (error) {
    console.error("[Daily Blog] Error:", error);
    throw error;
  }
}
