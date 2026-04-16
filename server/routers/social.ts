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
import { socialPosts } from "../../drizzle/schema";
import { desc, eq } from "drizzle-orm";

// ── Platform publishers ────────────────────────────────────────────────────

async function publishToLinkedIn(content: string, link?: string): Promise<{ postId: string; url: string }> {
  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  const personUrn = process.env.LINKEDIN_PERSON_URN;
  if (!token || !personUrn) throw new Error("LinkedIn credentials not configured");

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
  const apiKey = process.env.TWITTER_API_KEY;
  const apiSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    throw new Error("Twitter credentials not configured");
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
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const pageToken = process.env.FACEBOOK_PAGE_TOKEN;
  if (!pageId || !pageToken) throw new Error("Facebook credentials not configured");

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

  /** Get recent social post history */
  history: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(20) }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(socialPosts)
        .orderBy(desc(socialPosts.createdAt))
        .limit(input?.limit ?? 20);
    }),
});
