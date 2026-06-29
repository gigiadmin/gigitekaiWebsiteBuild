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

interface ArticleAnalysis {
  summary: string;
  keyTakeaways: string[];
  gigitekAiAngle: string;
  readMoreText: string;
}

/** Use LLM to write a deep, engaging analysis of an article for blog readers */
async function analyzeArticle(article: NewsApiArticle, category: string): Promise<ArticleAnalysis> {
  try {
    const res = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a senior technology analyst and content writer for GigitekAI, an AI-first Managed Services Provider. 
Write a rich, engaging analysis of this news article for a blog post targeting IT decision-makers, business owners, and tech executives.

Return a JSON object with these exact fields:
- summary: A compelling 3-4 paragraph analysis (200-250 words) that explains what happened, why it matters, and the broader industry implications. Write in an authoritative, engaging tone — not just a summary, but real insight.
- keyTakeaways: An array of exactly 3 specific, actionable bullet points (each 15-25 words) that a business leader should take away from this story.
- gigitekAiAngle: 2-3 sentences explaining how GigitekAI helps clients navigate this specific trend or challenge. Be specific, not generic.
- readMoreText: A compelling 1-sentence call-to-action to read the original article.

Return ONLY valid JSON, no markdown code blocks.`,
        },
        {
          role: "user",
          content: `Category: ${category}\nTitle: ${article.title}\nDescription: ${article.description ?? ""}\nContent: ${(article.content ?? "").slice(0, 800)}\nSource: ${article.source.name}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "article_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              summary: { type: "string" },
              keyTakeaways: { type: "array", items: { type: "string" } },
              gigitekAiAngle: { type: "string" },
              readMoreText: { type: "string" },
            },
            required: ["summary", "keyTakeaways", "gigitekAiAngle", "readMoreText"],
            additionalProperties: false,
          },
        },
      },
    });
    const content = res?.choices?.[0]?.message?.content;
    if (typeof content === "string") {
      const parsed = JSON.parse(content) as ArticleAnalysis;
      return parsed;
    }
  } catch (err) {
    console.warn("[AI News Scheduler] LLM analysis failed:", err);
  }
  // Fallback
  return {
    summary: article.description ?? "",
    keyTakeaways: ["Stay informed on this developing story.", "Consider how this impacts your business operations.", "Consult with your IT team on implications."],
    gigitekAiAngle: "GigitekAI helps businesses navigate technology changes with expert guidance and AI-powered solutions.",
    readMoreText: "Read the full article for more details.",
  };
}

/** Use LLM to write a clean 2-3 sentence summary of a raw article (kept for backwards compat) */
async function summarizeArticle(article: NewsApiArticle): Promise<string> {
  const analysis = await analyzeArticle(article, "General");
  return analysis.summary;
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

interface EnrichedNewsItem extends NewsItem {
  analysis?: ArticleAnalysis;
}

function generateNewsletterHtml(newsItems: EnrichedNewsItem[]): string {
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const newsHtml = newsItems
    .map(
      (item, index) => {
        const analysis = item.analysis;
        const takeaways = analysis?.keyTakeaways ?? [];
        const takeawaysHtml = takeaways.length > 0
          ? `<div style="background:#f0fffe;border:1px solid #b2f5ea;border-radius:6px;padding:16px;margin:16px 0;">
              <p style="margin:0 0 8px;font-weight:700;color:#0A0E1A;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;">🎯 Key Takeaways</p>
              <ul style="margin:0;padding-left:20px;">
                ${takeaways.map(t => `<li style="color:#1a202c;line-height:1.7;margin-bottom:4px;">${t}</li>`).join("")}
              </ul>
            </div>`
          : "";

        const gigitekAngleHtml = analysis?.gigitekAiAngle
          ? `<div style="background:#fffbeb;border-left:4px solid #f6ad55;padding:12px 16px;margin:16px 0;border-radius:0 6px 6px 0;">
              <p style="margin:0;font-size:13px;color:#744210;"><strong>💡 GigitekAI Perspective:</strong> ${analysis.gigitekAiAngle}</p>
            </div>`
          : "";

        const summaryParagraphs = (analysis?.summary ?? item.summary)
          .split(/\n+/)
          .filter(p => p.trim())
          .map(p => `<p style="color:#2d3748;line-height:1.8;margin-bottom:14px;font-size:15px;">${p.trim()}</p>`)
          .join("");

        return `
    <article style="margin-bottom:48px;padding-bottom:48px;border-bottom:1px solid #e2e8f0;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
        <span style="font-size:11px;font-weight:700;text-transform:uppercase;color:#00a3bf;letter-spacing:0.08em;background:#e6f9fc;padding:3px 10px;border-radius:20px;">
          ${categoryIcons[item.category] ?? "📰"} ${item.category}
        </span>
        <span style="font-size:12px;color:#a0aec0;">Story ${index + 1} of ${newsItems.length}</span>
      </div>
      <h2 style="margin:0 0 16px;color:#0A0E1A;font-size:20px;line-height:1.4;font-weight:700;">${item.title}</h2>
      ${summaryParagraphs}
      ${takeawaysHtml}
      ${gigitekAngleHtml}
      <p style="margin:12px 0 0;font-size:13px;color:#718096;">
        📰 Source: <a href="${item.url}" style="color:#0078d4;text-decoration:none;font-weight:600;">${item.source}</a>
        &nbsp;·&nbsp; <a href="${item.url}" style="color:#0078d4;text-decoration:none;">${analysis?.readMoreText ?? "Read the full article →"}</a>
      </p>
    </article>`;
      }
    )
    .join("");

  return `
<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:680px;margin:0 auto;background:#ffffff;color:#1a202c;">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#0A0E1A 0%,#0F1A30 100%);padding:40px 32px;text-align:center;">
    <p style="color:#00D4FF;margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;">GigitekAI Intelligence</p>
    <h1 style="color:#ffffff;margin:0 0 8px;font-size:28px;font-weight:800;">🚀 Daily Recap</h1>
    <p style="color:#94a3b8;margin:0;font-size:15px;">AI, Business &amp; Tech — ${dateStr}</p>
    <div style="margin-top:20px;height:2px;background:linear-gradient(90deg,transparent,#00D4FF,transparent);"></div>
  </div>

  <!-- Intro -->
  <div style="padding:32px 40px 0;background:#ffffff;">
    <p style="font-size:16px;color:#4a5568;line-height:1.8;margin:0 0 8px;">Good morning. Here's your curated briefing on the most important developments in AI, business technology, and cybersecurity — everything you need to stay ahead of the curve today.</p>
    <p style="font-size:13px;color:#a0aec0;border-bottom:1px solid #e2e8f0;padding-bottom:24px;margin:0;">📅 ${dateStr} &nbsp;·&nbsp; ${newsItems.length} stories &nbsp;·&nbsp; ~${newsItems.length * 3} min read</p>
  </div>

  <!-- Stories -->
  <div style="padding:32px 40px;background:#ffffff;">
    ${newsHtml}
  </div>

  <!-- CTA Block -->
  <div style="margin:0 40px 40px;padding:32px;background:linear-gradient(135deg,#0A0E1A 0%,#0F1A30 100%);border-radius:12px;text-align:center;">
    <h2 style="color:#00D4FF;margin:0 0 12px;font-size:20px;">💡 Is Your Business AI-Ready?</h2>
    <p style="color:#cbd5e0;margin:0 0 12px;line-height:1.7;">The shift from <em>AI-enhanced</em> to <em>AI-first</em> operations is happening now. Organizations that act today will outpace competitors by 3–5x within 18 months.</p>
    <p style="color:#e2e8f0;margin:0 0 20px;"><strong>Are your Tier 1 and Tier 2 workflows still manual?</strong></p>
    <a href="https://gigitekai.com/contact" style="display:inline-block;background:#00D4FF;color:#0A0E1A;padding:14px 36px;border-radius:6px;text-decoration:none;font-weight:800;font-size:15px;">👉 Schedule Your Free AI Strategy Call</a>
    <p style="color:#718096;font-size:12px;margin:16px 0 0;">No commitment required · 30-minute session · Immediate value</p>
  </div>

  <!-- Footer -->
  <div style="padding:24px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
    <p style="color:#718096;font-size:13px;margin:0 0 8px;">You're receiving this because you subscribed to GigitekAI Daily Recap.</p>
    <p style="color:#a0aec0;font-size:12px;margin:0;">© ${new Date().getFullYear()} GigitekAI LLC · <a href="https://gigitekai.com" style="color:#0078d4;">gigitekai.com</a></p>
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

    // Fetch real mixed news (AI + Business + Tech) with deep analysis
    let newsItems: EnrichedNewsItem[] = await fetchMixedNews(seenUrls) as EnrichedNewsItem[];
    // Enrich each article with LLM analysis
    for (const item of newsItems) {
      const rawArticle: NewsApiArticle = {
        title: item.title,
        description: item.summary,
        content: item.summary,
        url: item.url,
        source: { name: item.source },
        publishedAt: new Date().toISOString(),
      };
      item.analysis = await analyzeArticle(rawArticle, item.category);
    }

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
