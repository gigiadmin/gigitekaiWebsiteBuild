/**
 * socialEngagementPoller.ts — Fetches likes, comments, shares from each platform
 * for recently published posts. Runs every hour.
 */
import { getDb } from "../db";
import { socialPosts, socialConnections } from "../../drizzle/schema";
import { and, eq, isNotNull, gte } from "drizzle-orm";

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

async function fetchLinkedInEngagement(postId: string): Promise<{ likes: number; comments: number; shares: number }> {
  const conn = await getConnection("linkedin");
  const token = conn?.accessToken ?? process.env.LINKEDIN_ACCESS_TOKEN;
  if (!token || !postId) return { likes: 0, comments: 0, shares: 0 };

  try {
    // LinkedIn Social Actions API
    const encoded = encodeURIComponent(postId);
    const [likesRes, commentsRes] = await Promise.all([
      fetch(`https://api.linkedin.com/v2/socialActions/${encoded}/likes?count=0`, {
        headers: { Authorization: `Bearer ${token}`, "X-Restli-Protocol-Version": "2.0.0" },
      }),
      fetch(`https://api.linkedin.com/v2/socialActions/${encoded}/comments?count=0`, {
        headers: { Authorization: `Bearer ${token}`, "X-Restli-Protocol-Version": "2.0.0" },
      }),
    ]);

    const likes = likesRes.ok ? ((await likesRes.json()) as any).paging?.total ?? 0 : 0;
    const comments = commentsRes.ok ? ((await commentsRes.json()) as any).paging?.total ?? 0 : 0;
    return { likes, comments, shares: 0 };
  } catch {
    return { likes: 0, comments: 0, shares: 0 };
  }
}

async function fetchTwitterEngagement(postId: string): Promise<{ likes: number; comments: number; shares: number }> {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  if (!bearerToken || !postId) return { likes: 0, comments: 0, shares: 0 };

  try {
    const res = await fetch(
      `https://api.twitter.com/2/tweets/${postId}?tweet.fields=public_metrics`,
      { headers: { Authorization: `Bearer ${bearerToken}` } }
    );
    if (!res.ok) return { likes: 0, comments: 0, shares: 0 };
    const data = (await res.json()) as any;
    const m = data.data?.public_metrics ?? {};
    return {
      likes: m.like_count ?? 0,
      comments: m.reply_count ?? 0,
      shares: m.retweet_count ?? 0,
    };
  } catch {
    return { likes: 0, comments: 0, shares: 0 };
  }
}

async function fetchFacebookEngagement(postId: string): Promise<{ likes: number; comments: number; shares: number }> {
  const conn = await getConnection("facebook");
  const pageToken = conn?.accessToken ?? process.env.FACEBOOK_PAGE_TOKEN;
  if (!pageToken || !postId) return { likes: 0, comments: 0, shares: 0 };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${postId}?fields=likes.summary(true),comments.summary(true),shares&access_token=${pageToken}`
    );
    if (!res.ok) return { likes: 0, comments: 0, shares: 0 };
    const data = (await res.json()) as any;
    return {
      likes: data.likes?.summary?.total_count ?? 0,
      comments: data.comments?.summary?.total_count ?? 0,
      shares: data.shares?.count ?? 0,
    };
  } catch {
    return { likes: 0, comments: 0, shares: 0 };
  }
}

export async function runEngagementPoller() {
  const db = await getDb();
  if (!db) return;

  // Only poll posts published in the last 30 days that have a platform postId
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const posts = await db
    .select()
    .from(socialPosts)
    .where(
      and(
        eq(socialPosts.status, "published"),
        isNotNull(socialPosts.postId),
        gte(socialPosts.publishedAt, cutoff.toISOString())
      )
    );

  if (posts.length === 0) return;
  console.log(`[EngagementPoller] Refreshing engagement for ${posts.length} post(s)`);

  for (const post of posts) {
    if (!post.postId) continue;
    let engagement = { likes: 0, comments: 0, shares: 0 };

    try {
      if (post.platform === "linkedin") {
        engagement = await fetchLinkedInEngagement(post.postId);
      } else if (post.platform === "twitter") {
        engagement = await fetchTwitterEngagement(post.postId);
      } else if (post.platform === "facebook") {
        engagement = await fetchFacebookEngagement(post.postId);
      }

      await db
        .update(socialPosts)
        .set({
          engagementLikes: engagement.likes,
          engagementComments: engagement.comments,
          engagementShares: engagement.shares,
          engagementLastFetched: new Date().toISOString(),
        })
        .where(eq(socialPosts.id, post.id));
    } catch (err) {
      console.error(`[EngagementPoller] Error for post #${post.id}:`, err);
    }
  }
  console.log(`[EngagementPoller] Done`);
}

export function startEngagementPoller() {
  const INTERVAL_MS = 60 * 60 * 1000; // every hour
  console.log("[EngagementPoller] Started — polling every hour");
  runEngagementPoller().catch((err) => console.error("[EngagementPoller] Initial run error:", err));
  setInterval(() => {
    runEngagementPoller().catch((err) => console.error("[EngagementPoller] Error:", err));
  }, INTERVAL_MS);
}
