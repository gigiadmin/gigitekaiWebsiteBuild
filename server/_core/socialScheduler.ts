/**
 * socialScheduler.ts — Publishes scheduled social posts when their scheduledAt time arrives.
 * Runs every 5 minutes. Picks up all posts with status="scheduled" and scheduledAt <= now.
 */
import { getDb } from "../db";
import { socialPosts, socialConnections } from "../../drizzle/schema";
import { and, eq, lte, isNotNull } from "drizzle-orm";
import { createHmac } from "crypto";

// ── Re-use publisher helpers from social router ────────────────────────────

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

async function publishToLinkedIn(content: string, link?: string): Promise<{ postId: string; url: string }> {
  const conn = await getConnection("linkedin");
  const token = conn?.accessToken ?? process.env.LINKEDIN_ACCESS_TOKEN;
  const personUrn = conn?.personUrn ?? process.env.LINKEDIN_PERSON_URN;
  if (!token || !personUrn) throw new Error("LinkedIn not connected");

  const body: any = {
    author: personUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: content },
        shareMediaCategory: link ? "ARTICLE" : "NONE",
        ...(link && { media: [{ status: "READY", originalUrl: link }] }),
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
  if (!res.ok) throw new Error(`LinkedIn API error ${res.status}: ${await res.text()}`);
  const data = await res.json() as any;
  const postId = data.id ?? "";
  return { postId, url: `https://www.linkedin.com/feed/update/${postId}` };
}

async function publishToTwitter(content: string): Promise<{ postId: string; url: string }> {
  const conn = await getConnection("twitter");
  const apiKey = process.env.TWITTER_API_KEY;
  const apiSecret = process.env.TWITTER_API_SECRET;
  const accessToken = conn?.accessToken ?? process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = conn?.accessTokenSecret ?? process.env.TWITTER_ACCESS_SECRET;
  if (!apiKey || !apiSecret || !accessToken || !accessSecret) throw new Error("Twitter not connected");

  const oauthTimestamp = Math.floor(Date.now() / 1000).toString();
  const oauthNonce = Math.random().toString(36).substring(2);
  const url = "https://api.twitter.com/2/tweets";
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: apiKey,
    oauth_nonce: oauthNonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: oauthTimestamp,
    oauth_token: accessToken,
    oauth_version: "1.0",
  };
  const paramStr = Object.entries(oauthParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  const sigBase = `POST&${encodeURIComponent(url)}&${encodeURIComponent(paramStr)}`;
  const sigKey = `${encodeURIComponent(apiSecret)}&${encodeURIComponent(accessSecret)}`;
  const signature = createHmac("sha1", sigKey).update(sigBase).digest("base64");
  const authHeader =
    "OAuth " +
    Object.entries({ ...oauthParams, oauth_signature: signature })
      .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
      .join(", ");

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: authHeader, "Content-Type": "application/json" },
    body: JSON.stringify({ text: content.slice(0, 280) }),
  });
  if (!res.ok) throw new Error(`Twitter API error ${res.status}: ${await res.text()}`);
  const data = await res.json() as any;
  const postId = data.data?.id ?? "";
  return { postId, url: `https://twitter.com/i/web/status/${postId}` };
}

async function publishToFacebook(content: string, link?: string): Promise<{ postId: string; url: string }> {
  const conn = await getConnection("facebook");
  const pageId = conn?.pageId ?? process.env.FACEBOOK_PAGE_ID;
  const pageToken = conn?.accessToken ?? process.env.FACEBOOK_PAGE_TOKEN;
  if (!pageId || !pageToken) throw new Error("Facebook not connected");

  const params = new URLSearchParams({ message: content, access_token: pageToken, ...(link && { link }) });
  const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (!res.ok) throw new Error(`Facebook API error ${res.status}: ${await res.text()}`);
  const data = await res.json() as any;
  const postId = data.id ?? "";
  return { postId, url: `https://www.facebook.com/${postId.replace("_", "/posts/")}` };
}

// ── Main scheduler function ────────────────────────────────────────────────

export async function runSocialScheduler() {
  const db = await getDb();
  if (!db) return;

  const now = new Date();

  // Find all scheduled posts due for publishing
  const duePosts = await db
    .select()
    .from(socialPosts)
    .where(
      and(
        eq(socialPosts.status, "scheduled"),
        isNotNull(socialPosts.scheduledAt),
        lte(socialPosts.scheduledAt, now)
      )
    );

  if (duePosts.length === 0) return;

  console.log(`[SocialScheduler] ${duePosts.length} post(s) due for publishing`);

  for (const post of duePosts) {
    // Parse platforms array (stored as JSON string)
    let platforms: Array<"linkedin" | "twitter" | "facebook"> = [];
    try {
      platforms = JSON.parse(post.platforms ?? "[]");
    } catch {
      platforms = [post.platform as "linkedin" | "twitter" | "facebook"];
    }

    let anySuccess = false;
    let lastError = "";

    for (const platform of platforms) {
      let postId = "";
      let url = "";
      let errorMessage = "";
      let status: "published" | "failed" = "published";

      try {
        if (platform === "linkedin") {
          ({ postId, url } = await publishToLinkedIn(post.content, post.link ?? undefined));
        } else if (platform === "twitter") {
          ({ postId, url } = await publishToTwitter(post.content));
        } else if (platform === "facebook") {
          ({ postId, url } = await publishToFacebook(post.content, post.link ?? undefined));
        }
        anySuccess = true;
        console.log(`[SocialScheduler] ✅ Published post #${post.id} to ${platform}: ${url}`);
      } catch (err: any) {
        status = "failed";
        errorMessage = err?.message ?? String(err);
        lastError = errorMessage;
        console.error(`[SocialScheduler] ❌ Failed post #${post.id} to ${platform}: ${errorMessage}`);
      }

      // Insert a new published/failed record per platform (same pattern as immediate publish)
      await db.insert(socialPosts).values({
        title: post.title,
        platform,
        postId: postId || null,
        content: post.content,
        url: url || null,
        link: post.link,
        platforms: null,
        status,
        errorMessage: errorMessage || null,
        publishedAt: status === "published" ? new Date() : null,
        createdBy: post.createdBy,
      });
    }

    // Mark the original scheduled post as published or failed
    await db
      .update(socialPosts)
      .set({
        status: anySuccess ? "published" : "failed",
        publishedAt: anySuccess ? new Date() : null,
        errorMessage: anySuccess ? null : lastError,
      })
      .where(eq(socialPosts.id, post.id));
  }
}

// ── Start scheduler (called from server startup) ───────────────────────────

export function startSocialScheduler() {
  const INTERVAL_MS = 5 * 60 * 1000; // every 5 minutes
  console.log("[SocialScheduler] Started — checking every 5 minutes");
  runSocialScheduler().catch((err) => console.error("[SocialScheduler] Initial run error:", err));
  setInterval(() => {
    runSocialScheduler().catch((err) => console.error("[SocialScheduler] Error:", err));
  }, INTERVAL_MS);
}
