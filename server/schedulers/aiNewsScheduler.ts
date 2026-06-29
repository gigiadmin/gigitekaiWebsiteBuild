/**
 * AI News Daily Recap Scheduler
 *
 * Runs every day at 9:00 AM ET.
 * Fetches REAL live news from NewsAPI across 3 categories:
 *   - AI & Technology (2 stories)
 *   - Business (1 story)
 *   - General Tech (1 story)
 * Deduplicates by tracking seen article URLs in the database.
 * Generates a branded HTML recap, then calls the newsletter auto-post endpoint.
 */

import { invokeLLM } from "../_core/llm";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NewsItem {
  title: string;
  summary: string;
  source: string;
  url: string;
  category: string;
}

interface NewsApiArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  source: { name: string };
  publishedAt: string;
}

// ─── Deduplication Helpers ────────────────────────────────────────────────────

/** Load seen article URLs from DB (persisted across restarts) */
async function getSeenUrls(): Promise<Set<string>> {
  try {
    const { getSetting } = await import("../db");
    const raw = await getSetting("ai_news_seen_urls");
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed);
  } catch {
    return new Set();
  }
}

/** Save seen article URLs to DB, keeping only the last 200 to avoid bloat */
async function saveSeenUrls(urls: Set<string>): Promise<void> {
  try {
    const { setSetting } = await import("../db");
    const arr = Array.from(urls).slice(-200);
    await setSetting("ai_news_seen_urls", JSON.stringify(arr), "URLs of articles already sent in daily recap");
  } catch (err) {
    console.warn("[AI News Scheduler] Failed to save seen URLs:", err);
  }
}

// ─── News Fetching ────────────────────────────────────────────────────────────

/** Fetch articles from NewsAPI for a given query */
async function fetchFromNewsApi(query: string, pageSize: number): Promise<NewsApiArticle[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return [];

  try {
    const from = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString().split("T")[0];
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=en&pageSize=${pageSize}&from=${from}&apiKey=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json() as { articles?: NewsApiArticle[]; status?: string; message?: string };
    if (data.status !== "ok" || !data.articles) {
      console.warn(`[AI News Scheduler] NewsAPI returned: ${data.message ?? "unknown error"}`);
      return [];
    }
    return data.articles.filter(
      (a) => a.title && a.title !== "[Removed]" && a.url && a.description
    );
  } catch (err) {
    console.warn(`[AI News Scheduler] NewsAPI fetch failed for "${query}":`, err);
    return [];
  }
}

/** Use LLM to write a clean 2-3 sentence summary of a raw article */
async function summarizeArticle(article: NewsApiArticle): Promise<string> {
  try {
    const res = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a business news editor. Write a concise 2-3 sentence summary of the article for a business executive audience. Focus on the business impact. Return only the summary text, no quotes or labels.",
        },
        {
          role: "user",
          content: `Title: ${article.title}\nDescription: ${article.description ?? ""}\nContent: ${(article.content ?? "").slice(0, 500)}`,
        },
      ],
    });
    const content = res?.choices?.[0]?.message?.content;
    return (typeof content === "string" ? content.trim() : "") || article.description || "";
  } catch {
    return article.description ?? "";
  }
}

/**
 * Fetch a mixed set of real news: 2 AI/tech + 1 business + 1 general tech.
 * Skips any URLs already seen in previous recaps.
 */
async function fetchMixedNews(seenUrls: Set<string>): Promise<NewsItem[]> {
  const results: NewsItem[] = [];

  // Define the 3 category queries
  const categories: { query: string; label: string; count: number }[] = [
    { query: "artificial intelligence enterprise AI agent automation", label: "AI & Technology", count: 2 },
    { query: "business technology digital transformation cloud", label: "Business & Tech", count: 1 },
    { query: "cybersecurity Microsoft 365 productivity software", label: "Tech & Security", count: 1 },
  ];

  for (const cat of categories) {
    const articles = await fetchFromNewsApi(cat.query, 10);
    let added = 0;

    for (const article of articles) {
      if (added >= cat.count) break;
      if (seenUrls.has(article.url)) continue; // skip duplicates

      const summary = await summarizeArticle(article);
      results.push({
        title: article.title,
        summary,
        source: article.source.name,
        url: article.url,
        category: cat.label,
      });
      seenUrls.add(article.url);
      added++;
    }

    // If NewsAPI returned nothing new for this category, skip it
    if (added === 0) {
      console.warn(`[AI News Scheduler] No fresh articles for category: ${cat.label}`);
    }
  }

  return results;
}

/** Fallback news items if NewsAPI is unavailable */
function getFallbackNews(): NewsItem[] {
  return [
    {
      title: "AI Agents Are Reshaping Enterprise Operations",
      summary: "Organizations are rapidly deploying AI agents to automate Tier 1 and Tier 2 workflows, reducing operational costs by up to 40% and freeing hundreds of hours monthly.",
      source: "GigitekAI Insights",
      url: "https://gigitekai.com/blog",
      category: "AI & Technology",
    },
    {
      title: "Microsoft 365 Copilot Adoption Accelerates Across SMBs",
      summary: "Microsoft 365 Copilot is seeing record adoption among small and mid-sized businesses, with early adopters reporting significant productivity gains in email, meetings, and documents.",
      source: "GigitekAI Insights",
      url: "https://gigitekai.com/blog",
      category: "Business & Tech",
    },
    {
      title: "Zero Trust Security Becomes the New Standard for Remote Work",
      summary: "As hybrid work becomes permanent, organizations are adopting Zero Trust frameworks to protect distributed workforces. Security-first MSPs are seeing 3x demand for Zero Trust assessments.",
      source: "GigitekAI Insights",
      url: "https://gigitekai.com/blog",
      category: "Tech & Security",
    },
  ];
}

// ─── HTML Generation ──────────────────────────────────────────────────────────

const categoryIcons: Record<string, string> = {
  "AI & Technology": "🤖",
  "Business & Tech": "💼",
  "Tech & Security": "🔐",
};

function generateNewsletterHtml(newsItems: NewsItem[]): string {
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const newsHtml = newsItems
    .map(
      (item, index) => `
    <div style="margin-bottom:24px;padding:16px;background:#f8fafc;border-left:4px solid #00D4FF;border-radius:4px;">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#00D4FF;letter-spacing:0.05em;margin-bottom:6px;">
        ${categoryIcons[item.category] ?? "📰"} ${item.category}
      </div>
      <h3 style="margin-top:0;margin-bottom:8px;color:#0A0E1A;font-size:16px;">${index + 1}. ${item.title}</h3>
      <p style="color:#1a202c;line-height:1.6;margin-bottom:8px;">${item.summary}</p>
      <p style="margin-bottom:0;font-size:13px;"><em>Source: <a href="${item.url}" style="color:#00D4FF;text-decoration:none;">${item.source}</a></em></p>
    </div>`
    )
    .join("");

  return `
<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a202c;">
  <div style="background:linear-gradient(135deg,#0A0E1A 0%,#0F1A30 100%);padding:32px;border-radius:8px 8px 0 0;text-align:center;">
    <h1 style="color:#00D4FF;margin:0;font-size:24px;">🚀 GigitekAI Daily Recap</h1>
    <p style="color:#cbd5e0;margin:8px 0 0;">The Future of Work is Here &mdash; ${dateStr}</p>
  </div>

  <div style="padding:32px;background:#ffffff;">
    <p style="font-size:16px;color:#4a5568;">Your daily briefing on AI, business, and technology — curated to keep you ahead of the curve. Today's recap covers the most impactful developments shaping enterprise operations.</p>

    <h2 style="color:#0A0E1A;border-bottom:2px solid #00D4FF;padding-bottom:8px;">📰 Today's Top Stories</h2>
    ${newsHtml}

    <div style="margin-top:40px;padding:24px;background:linear-gradient(135deg,#0A0E1A 0%,#0F1A30 100%);color:#ffffff;border-radius:8px;text-align:center;">
      <h2 style="color:#00D4FF;margin-top:0;">💡 Why This Matters for Your Business</h2>
      <p style="color:#cbd5e0;">The shift from "AI-enhanced" to "AI-first" operations is happening now. The bottleneck is no longer the technology — it's the expertise to integrate it securely and effectively.</p>
      <p style="color:#e2e8f0;"><strong>Are your Tier 1 and Tier 2 workflows still manual?</strong></p>
      <p style="color:#cbd5e0;">GigitekAI specializes in replacing manual processes with intelligent AI agents, reducing operational costs by up to 40% and freeing hundreds of hours monthly.</p>
      <a href="https://gigitekai.com/contact" style="display:inline-block;background:#00D4FF;color:#0A0E1A;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:700;margin-top:16px;">👉 Schedule Your Free AI Strategy Call</a>
    </div>

    <p style="margin-top:32px;text-align:center;color:#718096;font-size:14px;">
      <em>Stay ahead of the curve. See you tomorrow for the next GigitekAI Daily Recap.</em>
    </p>
  </div>
</div>`;
}

// ─── Main Runner ──────────────────────────────────────────────────────────────

/** Track last successful run date to prevent duplicates */
let lastRunDate: string | null = null;

/** Get last run date from database (persisted across server restarts) */
async function getLastRunDateFromDb(): Promise<string | null> {
  try {
    const { getSetting } = await import("../db");
    const value = await getSetting("ai_news_last_run_date");
    return value ?? null;
  } catch (err) {
    console.warn("[AI News Scheduler] Failed to get last run date from DB:", err);
    return null;
  }
}

/** Save last run date to database (persisted across server restarts) */
async function saveLastRunDateToDb(date: string): Promise<void> {
  try {
    const { setSetting } = await import("../db");
    await setSetting("ai_news_last_run_date", date, "Last date when AI News recap was generated");
  } catch (err) {
    console.warn("[AI News Scheduler] Failed to save last run date to DB:", err);
  }
}

export async function runAiNewsRecap(): Promise<void> {
  // Get today's date in ET
  const now = new Date();
  const etNow = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const todayET = etNow.toISOString().split("T")[0]; // YYYY-MM-DD

  // Check if already ran today (from memory or database)
  if (lastRunDate === todayET) {
    console.log(`[AI News Scheduler] Already ran today (${todayET}) in memory — skipping duplicate`);
    return;
  }

  const dbLastRunDate = await getLastRunDateFromDb();
  if (dbLastRunDate === todayET) {
    lastRunDate = todayET;
    console.log(`[AI News Scheduler] Already ran today (${todayET}) per database — skipping duplicate`);
    return;
  }

  console.log("[AI News Scheduler] Starting daily mixed news recap generation...");

  try {
    // Load seen URLs for deduplication
    const seenUrls = await getSeenUrls();

    // Fetch real mixed news (AI + Business + Tech)
    let newsItems = await fetchMixedNews(seenUrls);

    // Fall back if we couldn't get enough real news
    if (newsItems.length < 2) {
      console.warn("[AI News Scheduler] Not enough real news articles — using fallback");
      newsItems = getFallbackNews();
    }

    // Save updated seen URLs to prevent future duplicates
    await saveSeenUrls(seenUrls);

    const bodyHtml = generateNewsletterHtml(newsItems);

    const dateStr = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const subject = `🚀 GigitekAI Daily Recap: AI, Business & Tech — ${dateStr}`;

    // Call the auto-post endpoint (creates blog post + sends newsletter)
    const apiKey = process.env.NEWSLETTER_AUTO_POST_KEY;
    if (!apiKey) {
      console.error("[AI News Scheduler] NEWSLETTER_AUTO_POST_KEY not set — cannot auto-post");
      return;
    }

    const baseUrl = process.env.INTERNAL_API_URL ?? "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/newsletter/auto-post`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        subject,
        content: bodyHtml,
        contentFormat: "html",
        category: "AI News",
        authorName: "GigitekAI Team",
      }),
    });

    const result = (await response.json()) as {
      success: boolean;
      blog?: { id: number; slug: string; url: string };
      newsletter?: { campaignId: number; sentCount: number; recipientCount: number };
      error?: string;
    };

    if (!result.success) {
      console.error("[AI News Scheduler] Auto-post failed:", result.error);
      return;
    }

    // Mark run as successful for today
    lastRunDate = todayET;
    await saveLastRunDateToDb(todayET);
    console.log(
      `[AI News Scheduler] ✅ Done — Blog: ${result.blog?.url ?? "skipped"} | Newsletter: ${result.newsletter?.sentCount ?? 0}/${result.newsletter?.recipientCount ?? 0} delivered`
    );
  } catch (err) {
    console.error("[AI News Scheduler] Unexpected error:", err);
    // Don't mark as run on error — allow retry
  }
}

// ─── Scheduler ────────────────────────────────────────────────────────────────

let _intervalId: NodeJS.Timeout | null = null;

/** Milliseconds until next 9:00 AM Eastern Time */
function msUntilNext9amET(): number {
  const now = new Date();
  const etNow = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const target = new Date(etNow);
  target.setHours(9, 0, 0, 0);
  if (etNow >= target) target.setDate(target.getDate() + 1);
  const etOffset = etNow.getTime() - now.getTime();
  return target.getTime() - etOffset - now.getTime();
}

export function startAiNewsScheduler(): void {
  const ms = msUntilNext9amET();
  const hours = (ms / 3_600_000).toFixed(1);
  console.log(`[AI News Scheduler] Scheduled — first run in ${hours}h (9:00 AM ET daily)`);

  const scheduleNextRun = () => {
    const delayMs = msUntilNext9amET();
    const nextHours = (delayMs / 3_600_000).toFixed(1);
    console.log(`[AI News Scheduler] Next run scheduled in ${nextHours}h (9:00 AM ET)`);

    _intervalId = setTimeout(() => {
      runAiNewsRecap()
        .catch((e) => console.error("[AI News Scheduler] Scheduled run failed:", e))
        .finally(() => scheduleNextRun());
    }, delayMs);
  };

  scheduleNextRun();
}

export function stopAiNewsScheduler(): void {
  if (_intervalId) {
    clearTimeout(_intervalId);
    _intervalId = null;
    console.log("[AI News Scheduler] Stopped.");
  }
}
