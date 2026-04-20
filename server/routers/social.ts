/**
 * social.ts — Social Publishing Hub router.
 *
 * Publishes content to LinkedIn, Twitter/X, and Facebook via their APIs.
 *
 * Required secrets (set via webdev_request_secrets):
 *   LINKEDIN_ACCESS_TOKEN  — OAuth 2.0 access token with w_member_social scope
 *   LINKEDIN_PERSON_URN    — e.g. "urn:li:person:XXXXXXXX"
 *   TWITTER_BEARER_TOKEN   — App-only bearer token
 *   TWITTER_API_KEY        — API key
 *   TWITTER_API_SECRET     — API secret
 *   TWITTER_ACCESS_TOKEN   — User access token
 *   TWITTER_ACCESS_SECRET  — User access token secret
 *   FACEBOOK_PAGE_ID       — Facebook Page ID
 *   FACEBOOK_PAGE_TOKEN    — Page access token with pages_manage_posts scope
 */
import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { socialPosts, socialConnections } from "../../drizzle/schema";
import { desc, eq, and, gte, lte } from "drizzle-orm";
import { createHmac, randomBytes } from "crypto";

// ── Helpers to get stored tokens from DB ──────────────────────────────────
async function getConnection(platform: "linkedin" | "twitter" | "facebook") {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(socialConnections)
    .where(eq(socialConnections.platform, platform))
    .limit(1);
  return rows[0] ?? null;
}

// ── Platform publishers ────────────────────────────────────────────────────

async function publishToLinkedIn(content: string, link?: string): Promise<{ postId: string; url: string }> {
  const conn = await getConnection("linkedin");
  // Fall back to env vars if no DB connection stored
  const token = conn?.accessToken ?? process.env.LINKEDIN_ACCESS_TOKEN;
  const personUrn = conn?.personUrn ?? process.env.LINKEDIN_PERSON_URN;
  if (!token || !personUrn) throw new Error("LinkedIn not connected — click Connect LinkedIn in the Social Hub");

  const body: any = {
    author: personUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: content },
        shareMediaCategory: link ? "ARTICLE" : "NONE",
        ...(link && {
          media: [
            {
              status: "READY",
              originalUrl: link,
            },
          ],
        }),
      },
    },
    visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
  };

  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LinkedIn API error ${res.status}: ${err}`);
  }

  const data = await res.json() as any;
  const postId = data.id ?? "";
  const url = `https://www.linkedin.com/feed/update/${postId}`;
  return { postId, url };
}

async function publishToTwitter(content: string): Promise<{ postId: string; url: string }> {
  const conn = await getConnection("twitter");
  const apiKey = process.env.TWITTER_API_KEY;
  const apiSecret = process.env.TWITTER_API_SECRET;
  const accessToken = conn?.accessToken ?? process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = conn?.accessTokenSecret ?? process.env.TWITTER_ACCESS_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    throw new Error("Twitter not connected — click Connect Twitter in the Social Hub");
  }

  // OAuth 1.0a signature
  const oauthTimestamp = Math.floor(Date.now() / 1000).toString();
  const oauthNonce = Math.random().toString(36).substring(2);
  const method = "POST";
  const url = "https://api.twitter.com/2/tweets";

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: apiKey,
    oauth_nonce: oauthNonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: oauthTimestamp,
    oauth_token: accessToken,
    oauth_version: "1.0",
  };

  // Build signature base string
  const paramStr = Object.entries(oauthParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

  const sigBase = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(paramStr)}`;
  const sigKey = `${encodeURIComponent(apiSecret)}&${encodeURIComponent(accessSecret)}`;

  const { createHmac } = await import("crypto");
  const signature = createHmac("sha1", sigKey).update(sigBase).digest("base64");

  const authHeader =
    "OAuth " +
    Object.entries({ ...oauthParams, oauth_signature: signature })
      .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
      .join(", ");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: content.slice(0, 280) }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Twitter API error ${res.status}: ${err}`);
  }

  const data = await res.json() as any;
  const postId = data.data?.id ?? "";
  const url2 = `https://twitter.com/i/web/status/${postId}`;
  return { postId, url: url2 };
}

async function publishToFacebook(content: string, link?: string): Promise<{ postId: string; url: string }> {
  const conn = await getConnection("facebook");
  const pageId = conn?.pageId ?? process.env.FACEBOOK_PAGE_ID;
  const pageToken = conn?.accessToken ?? process.env.FACEBOOK_PAGE_TOKEN;
  if (!pageId || !pageToken) throw new Error("Facebook not connected — click Connect Facebook in the Social Hub");

  const params = new URLSearchParams({
    message: content,
    access_token: pageToken,
    ...(link && { link }),
  });

  const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Facebook API error ${res.status}: ${err}`);
  }

  const data = await res.json() as any;
  const postId = data.id ?? "";
  const url = `https://www.facebook.com/${postId.replace("_", "/posts/")}`;
  return { postId, url };
}

// ── Router ─────────────────────────────────────────────────────────────────

export const socialRouter = router({
  /** Publish to one or more platforms */
  publish: adminProcedure
    .input(
      z.object({
        content: z.string().min(5).max(3000),
        link: z.string().url().optional(),
        platforms: z.array(z.enum(["linkedin", "twitter", "facebook"])).min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const results: Array<{
        platform: string;
        success: boolean;
        url?: string;
        error?: string;
      }> = [];

      for (const platform of input.platforms) {
        let postId = "";
        let url = "";
        let errorMessage = "";
        let status: "published" | "failed" = "published";

        try {
          if (platform === "linkedin") {
            ({ postId, url } = await publishToLinkedIn(input.content, input.link));
          } else if (platform === "twitter") {
            ({ postId, url } = await publishToTwitter(input.content));
          } else if (platform === "facebook") {
            ({ postId, url } = await publishToFacebook(input.content, input.link));
          }
        } catch (err: any) {
          status = "failed";
          errorMessage = err?.message ?? String(err);
          console.error(`[Social] ${platform} publish failed:`, errorMessage);
        }

        await db.insert(socialPosts).values({
          title: input.content.slice(0, 100),
          platform,
          postId: postId || null,
          content: input.content,
          url: url || null,
          status,
          errorMessage: errorMessage || null,
          publishedAt: status === "published" ? new Date() : null,
          createdBy: ctx.user.id,
        });

        results.push({
          platform,
          success: status === "published",
          url: url || undefined,
          error: errorMessage || undefined,
        });
      }

      return { results };
    }),

  /** Get connection status for all platforms */
  getConnections: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db.select().from(socialConnections);
    return rows.map((r) => ({
      platform: r.platform,
      screenName: r.screenName,
      connectedAt: r.connectedAt,
      expiresAt: r.expiresAt,
      isExpired: r.expiresAt ? r.expiresAt < new Date() : false,
    }));
  }),

  /** Disconnect a platform (delete stored token) */
  disconnect: adminProcedure
    .input(z.object({ platform: z.enum(["linkedin", "twitter", "facebook"]) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db
        .delete(socialConnections)
        .where(eq(socialConnections.platform, input.platform));
      return { success: true };
    }),

  /** Get recent social post history (published + failed only) */
  history: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(20) }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(socialPosts)
        .where(eq(socialPosts.status, "published"))
        .orderBy(desc(socialPosts.createdAt))
        .limit(input?.limit ?? 20);
    }),

  /** Save a draft (no publishing) */
  saveDraft: adminProcedure
    .input(
      z.object({
        id: z.number().int().optional(), // if set, update existing draft
        content: z.string().min(1).max(3000),
        link: z.string().url().optional(),
        platforms: z.array(z.enum(["linkedin", "twitter", "facebook"])).min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      if (input.id) {
        await db
          .update(socialPosts)
          .set({
            content: input.content,
            link: input.link ?? null,
            platforms: JSON.stringify(input.platforms),
            title: input.content.slice(0, 100),
          })
          .where(and(eq(socialPosts.id, input.id), eq(socialPosts.status, "draft")));
        return { id: input.id };
      }
      const [result] = await db.insert(socialPosts).values({
        title: input.content.slice(0, 100),
        platform: input.platforms[0],
        content: input.content,
        link: input.link ?? null,
        platforms: JSON.stringify(input.platforms),
        status: "draft",
        createdBy: ctx.user.id,
      });
      return { id: (result as any).insertId };
    }),

  /** Schedule a post for future publishing */
  schedulePost: adminProcedure
    .input(
      z.object({
        content: z.string().min(5).max(3000),
        link: z.string().url().optional(),
        platforms: z.array(z.enum(["linkedin", "twitter", "facebook"])).min(1),
        scheduledAt: z.date(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      if (input.scheduledAt <= new Date()) throw new Error("Scheduled time must be in the future");
      const [result] = await db.insert(socialPosts).values({
        title: input.content.slice(0, 100),
        platform: input.platforms[0],
        content: input.content,
        link: input.link ?? null,
        platforms: JSON.stringify(input.platforms),
        status: "scheduled",
        scheduledAt: input.scheduledAt,
        createdBy: ctx.user.id,
      });
      return { id: (result as any).insertId };
    }),

  /** Get all drafts */
  getDrafts: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(socialPosts)
      .where(eq(socialPosts.status, "draft"))
      .orderBy(desc(socialPosts.createdAt));
  }),

  /** Get all scheduled posts */
  getScheduled: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(socialPosts)
      .where(eq(socialPosts.status, "scheduled"))
      .orderBy(socialPosts.scheduledAt);
  }),

  /** Delete a draft */
  deleteDraft: adminProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db
        .delete(socialPosts)
        .where(and(eq(socialPosts.id, input.id), eq(socialPosts.status, "draft")));
      return { success: true };
    }),

  /** Cancel a scheduled post */
  cancelScheduled: adminProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db
        .update(socialPosts)
        .set({ status: "draft" })
        .where(and(eq(socialPosts.id, input.id), eq(socialPosts.status, "scheduled")));
      return { success: true };
    }),

  /** Get engagement analytics (published posts with engagement data) */
  getEngagement: adminProcedure
    .input(z.object({ days: z.number().int().min(1).max(365).default(30) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { posts: [], totals: { likes: 0, comments: 0, shares: 0 } };
      const cutoff = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);
      const posts = await db
        .select()
        .from(socialPosts)
        .where(
          and(
            eq(socialPosts.status, "published"),
            gte(socialPosts.publishedAt, cutoff)
          )
        )
        .orderBy(desc(socialPosts.publishedAt));

      const totals = posts.reduce(
        (acc, p) => ({
          likes: acc.likes + (p.engagementLikes ?? 0),
          comments: acc.comments + (p.engagementComments ?? 0),
          shares: acc.shares + (p.engagementShares ?? 0),
        }),
        { likes: 0, comments: 0, shares: 0 }
      );

      return { posts, totals };
    }),

  /** Reschedule a scheduled post to a new date/time */
  reschedulePost: adminProcedure
    .input(z.object({
      id: z.number().int(),
      scheduledAt: z.number(), // UTC timestamp ms
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db
        .update(socialPosts)
        .set({ scheduledAt: new Date(input.scheduledAt) })
        .where(and(eq(socialPosts.id, input.id), eq(socialPosts.status, "scheduled")));
      return { success: true };
    }),

  /** Analyze past engagement to suggest optimal posting hours and days of week */
  getOptimalPostingTimes: adminProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return { bestHours: [] as number[], bestDays: [] as number[] };
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const posts = await db
        .select()
        .from(socialPosts)
        .where(
          and(
            eq(socialPosts.status, "published"),
            gte(socialPosts.publishedAt, thirtyDaysAgo)
          )
        );

      if (posts.length === 0) return { bestHours: [] as number[], bestDays: [] as number[] };

      // Group by hour and day-of-week, sum engagement
      const hourScores: Record<number, number> = {};
      const dayScores: Record<number, number> = {};
      for (const p of posts) {
        if (!p.publishedAt) continue;
        const d = new Date(p.publishedAt);
        const hour = d.getHours();
        const day = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
        const score = (p.engagementLikes ?? 0) + (p.engagementComments ?? 0) + (p.engagementShares ?? 0);
        hourScores[hour] = (hourScores[hour] ?? 0) + score;
        dayScores[day] = (dayScores[day] ?? 0) + score;
      }

      const top3 = (obj: Record<number, number>) =>
        Object.entries(obj)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([k]) => Number(k));

      return { bestHours: top3(hourScores), bestDays: top3(dayScores) };
    }),

  /** Edit the content of a scheduled post */
  updateScheduledPost: adminProcedure
    .input(z.object({
      id: z.number().int(),
      content: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db
        .update(socialPosts)
        .set({ content: input.content })
        .where(and(eq(socialPosts.id, input.id), eq(socialPosts.status, "scheduled")));
      return { success: true };
    }),

  /** Generate platform-specific social copy from blog content using AI */
  generateSocialCopy: adminProcedure
    .input(z.object({
      title: z.string().min(1),
      excerpt: z.string().min(1),
      content: z.string().min(1),
      url: z.string().url(),
    }))
    .mutation(async ({ input }) => {
      const { invokeLLM } = await import("../_core/llm");

      const prompt = `You are a social media expert for GigitekAI, a Microsoft 365 and AI solutions company.

Generate platform-specific social media posts from the following blog article:

Title: ${input.title}
Excerpt: ${input.excerpt}
Content: ${input.content}
URL: ${input.url}

Return a JSON object with three keys: "linkedin", "twitter", "facebook"

Rules:
- LinkedIn (max 1300 chars): Professional, thought-leadership tone. Include 2-3 relevant hashtags. Add the URL at the end.
- Twitter/X (max 280 chars): Catchy, engaging, conversational. Include 1-2 hashtags. Add shortened URL or "Read more: [URL]".
- Facebook (max 500 chars): Friendly, accessible tone. Include a call-to-action. Add the URL.

Return ONLY valid JSON, no markdown formatting.`;

      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        });

        const rawContent = response.choices[0]?.message?.content;
        const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent);
        const parsed = JSON.parse(content);

        return {
          success: true,
          linkedin: parsed.linkedin || "",
          twitter: parsed.twitter || "",
          facebook: parsed.facebook || "",
        };
      } catch (error) {
        console.error("[Social Copy Generation] Error:", error);
        throw new Error("Failed to generate social copy. Please try again.");
      }
    }),
});
