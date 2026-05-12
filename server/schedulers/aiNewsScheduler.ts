/**
 * AI News Daily Recap Scheduler
 *
 * Runs every day at 9:00 AM ET.
 * Fetches the latest AI news, generates a branded HTML recap,
 * then calls the newsletter auto-post endpoint to:
 *   1. Publish a blog post on gigitekai.com
 *   2. Send the recap to all active newsletter subscribers
 */

import { invokeLLM } from "../_core/llm";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NewsItem {
  title: string;
  summary: string;
  source: string;
  url: string;
}

// ─── News Fetching ────────────────────────────────────────────────────────────

/**
 * Uses the built-in LLM to research and return today's top AI news items.
 */
async function fetchAiNews(): Promise<NewsItem[]> {
  try {
    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an AI news researcher. Return ONLY a valid JSON object with an "items" array containing the 4 most impactful AI business news items from the past 48 hours (as of ${today}). Focus on: enterprise AI deployments, AI agent automation, Microsoft/OpenAI/Anthropic/Google AI updates, AI ROI for businesses. Each item must have: title, summary (2-3 sentences), source (publication name), url (real URL if known, otherwise use https://gigitekai.com/blog). Return ONLY raw JSON, no markdown code blocks, no explanation.`,
        },
        {
          role: "user",
          content: `Give me the top 4 AI business news items for ${today} as a JSON object: {"items": [{"title": "...", "summary": "...", "source": "...", "url": "..."}]}`,
        },
      ],
    });

    const raw = response?.choices?.[0]?.message?.content;
    if (!raw || typeof raw !== "string") return getFallbackNews();

    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```[\w]*\n?/m, "").replace(/\n?```$/m, "").trim();
    const parsed = JSON.parse(cleaned);
    const items: NewsItem[] = parsed.items ?? parsed;
    if (!Array.isArray(items) || items.length === 0) return getFallbackNews();
    return items.slice(0, 4);
  } catch (err) {
    console.error("[AI News Scheduler] Error fetching AI news via LLM:", err);
    return getFallbackNews();
  }
}

/** Fallback news items if LLM call fails */
function getFallbackNews(): NewsItem[] {
  return [
    {
      title: "AI Agents Are Reshaping Enterprise Operations",
      summary:
        "Organizations are rapidly deploying AI agents to automate Tier 1 and Tier 2 workflows, reducing operational costs by up to 40% and freeing hundreds of hours monthly.",
      source: "GigitekAI Insights",
      url: "https://gigitekai.com/blog",
    },
    {
      title: "Microsoft 365 Copilot Adoption Accelerates Across SMBs",
      summary:
        "Microsoft 365 Copilot is seeing record adoption among small and mid-sized businesses, with early adopters reporting significant productivity gains in email management, meeting summaries, and document generation.",
      source: "GigitekAI Insights",
      url: "https://gigitekai.com/blog",
    },
  ];
}

// ─── HTML Generation ──────────────────────────────────────────────────────────

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
      <h3 style="margin-top:0;color:#0A0E1A;">${index + 1}. ${item.title}</h3>
      <p style="color:#1a202c;line-height:1.6;">${item.summary}</p>
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
    <p style="font-size:16px;color:#4a5568;">Welcome to your daily briefing on the most impactful AI developments shaping business. At GigitekAI, we cut through the noise to bring you actionable insights on how AI agents and tech giants are redefining enterprise operations.</p>

    <h2 style="color:#0A0E1A;border-bottom:2px solid #00D4FF;padding-bottom:8px;">📰 Top AI News &amp; Strategic Moves</h2>
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

export async function runAiNewsRecap(): Promise<void> {
  console.log("[AI News Scheduler] Starting daily AI news recap generation...");

  try {
    const newsItems = await fetchAiNews();
    const bodyHtml = generateNewsletterHtml(newsItems);

    const dateStr = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const subject = `🚀 GigitekAI Daily Recap: The Future of Work is Here (${dateStr})`;

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

    console.log(
      `[AI News Scheduler] ✅ Done — Blog: ${result.blog?.url ?? "skipped"} | Newsletter: ${result.newsletter?.sentCount ?? 0}/${result.newsletter?.recipientCount ?? 0} delivered`
    );
  } catch (err) {
    console.error("[AI News Scheduler] Unexpected error:", err);
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

  setTimeout(() => {
    runAiNewsRecap().catch((e) =>
      console.error("[AI News Scheduler] Scheduled run failed:", e)
    );
    _intervalId = setInterval(() => {
      runAiNewsRecap().catch((e) =>
        console.error("[AI News Scheduler] Scheduled run failed:", e)
      );
    }, 24 * 60 * 60 * 1000);
  }, ms);
}

export function stopAiNewsScheduler(): void {
  if (_intervalId) {
    clearInterval(_intervalId);
    _intervalId = null;
    console.log("[AI News Scheduler] Stopped.");
  }
}
