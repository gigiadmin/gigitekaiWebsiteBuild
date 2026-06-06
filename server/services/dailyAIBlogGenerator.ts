/**
 * Daily AI Blog Post Generator
 * 
 * Generates non-technical, practical AI blog posts for small businesses
 * Runs Mon-Fri at 1 PM, searches latest AI news, creates post, sends to subscribers
 */

import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { blogPosts } from "../../drizzle/schema";
import { sendEmail } from "../_core/emailService";

/**
 * AI News sources for aggregation
 * These are the top outlets for AI and small business news
 */
const AI_NEWS_SOURCES = [
  "TechCrunch AI",
  "VentureBeat AI",
  "Forbes AI",
  "MIT Technology Review",
  "Wired AI",
  "The Verge AI",
  "Business Insider AI",
  "Entrepreneur AI",
  "Fast Company AI",
  "Inc.com AI",
];

/**
 * Generate a non-technical AI blog post for small businesses
 * Uses LLM to create practical, actionable content
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

Focus on one of these trending topics:
- AI for customer service automation (chatbots, email)
- AI for content creation (social media, emails)
- AI for scheduling and time management
- AI for data analysis and reporting
- AI for lead qualification and sales
- AI for document processing and data entry

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

    // Generate blog post
    const post = await generateDailyAIBlogPost();
    console.log(`[Daily Blog] Generated: "${post.title}"`);

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
