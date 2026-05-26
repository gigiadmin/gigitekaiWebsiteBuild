/**
 * socialOAuth.ts — OAuth connect/callback routes for LinkedIn, Twitter/X, and Facebook.
 *
 * Routes registered in server/_core/index.ts:
 *   GET /api/social/linkedin/connect   → redirects to LinkedIn auth
 *   GET /api/social/linkedin/callback  → exchanges code for token, stores in DB
 *   GET /api/social/twitter/connect    → requests OAuth 1.0a token, redirects
 *   GET /api/social/twitter/callback   → exchanges verifier for access token
 *   GET /api/social/facebook/connect   → redirects to Facebook auth
 *   GET /api/social/facebook/callback  → exchanges code for page token
 *
 * All callbacks redirect back to /admin/social with ?connected=<platform> or ?error=<msg>
 */

import type { Request, Response } from "express";
import { getDb } from "./db";
import { socialConnections } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { createHmac, randomBytes } from "crypto";

// ── Helpers ────────────────────────────────────────────────────────────────

function getEnv(key: string): string {
  return process.env[key] ?? "";
}

function getOrigin(req: Request): string {
  // Get origin from request headers, fallback to environment
  const origin = req.get('origin') || req.get('referer')?.split('/').slice(0, 3).join('/') || 'https://gigitekai.com';
  return origin.replace(/\/$/, ''); // Remove trailing slash
}

function oauthRedirect(res: Response, platform: string, error?: string, origin?: string) {
  const redirectBase = origin ? `${origin}/admin/social` : 'https://gigitekai.com/admin/social';
  const url = error
    ? `${redirectBase}?error=${encodeURIComponent(error)}&platform=${platform}`
    : `${redirectBase}?connected=${platform}`;
  res.redirect(url);
}

// ── LinkedIn OAuth 2.0 ─────────────────────────────────────────────────────

export async function linkedinConnect(req: Request, res: Response) {
  const clientId = getEnv("LINKEDIN_CLIENT_ID");
  if (!clientId) {
    return res.status(500).send("LINKEDIN_CLIENT_ID not configured");
  }
  const origin = getOrigin(req);
  const redirectUri = `${origin}/api/social/linkedin/callback`;
  const state = randomBytes(16).toString("hex");
  // Store state in session cookie for CSRF protection
  res.cookie("li_oauth_state", state, { httpOnly: true, maxAge: 600_000 });
  res.cookie("li_oauth_origin", origin, { httpOnly: true, maxAge: 600_000 });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: "openid profile w_member_social",
  });

  res.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params}`);
}

export async function linkedinCallback(req: Request, res: Response) {
  const { code, state, error } = req.query as Record<string, string>;

  const origin = (req.cookies as Record<string, string>)?.li_oauth_origin || getOrigin(req);
  if (error) return oauthRedirect(res, "linkedin", error, origin);

  const storedState = (req.cookies as Record<string, string>)?.li_oauth_state;
  if (!storedState || storedState !== state) {
    return oauthRedirect(res, "linkedin", "State mismatch — possible CSRF", origin);
  }
  res.clearCookie("li_oauth_state");
  res.clearCookie("li_oauth_origin");

  const clientId = getEnv("LINKEDIN_CLIENT_ID");
  const clientSecret = getEnv("LINKEDIN_CLIENT_SECRET");
  const redirectUri = `${origin}/api/social/linkedin/callback`;

  try {
    // Exchange code for access token
    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }).toString(),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      return oauthRedirect(res, "linkedin", `Token exchange failed: ${err}`);
    }

    const tokenData = await tokenRes.json() as {
      access_token: string;
      expires_in: number;
      refresh_token?: string;
    };

    // Fetch person URN and name
    const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json() as { sub: string; name?: string };
    const personUrn = `urn:li:person:${profile.sub}`;
    const screenName = profile.name ?? "LinkedIn User";
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    const db = await getDb();
    if (!db) return oauthRedirect(res, "linkedin", "Database unavailable");

    // Upsert connection
    const existing = await db
      .select()
      .from(socialConnections)
      .where(eq(socialConnections.platform, "linkedin"))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(socialConnections)
        .set({
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token ?? null,
          expiresAt: expiresAt.toISOString(),
          personUrn,
          screenName,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(socialConnections.platform, "linkedin"));
    } else {
      await db.insert(socialConnections).values({
        platform: "linkedin",
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token ?? null,
        expiresAt: expiresAt.toISOString(),
        personUrn,
        screenName,
      });
    }

    oauthRedirect(res, "linkedin");
  } catch (err: any) {
    oauthRedirect(res, "linkedin", err?.message ?? "Unknown error");
  }
}

// ── Twitter / X OAuth 1.0a ─────────────────────────────────────────────────

// In-memory store for request tokens (short-lived, single-server)
const twitterRequestTokens = new Map<string, string>();

function buildOAuth1Header(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerKey: string,
  consumerSecret: string,
  tokenSecret = ""
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_version: "1.0",
    ...params,
  };

  const allParams = { ...oauthParams };
  const paramStr = Object.entries(allParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

  const sigBase = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(paramStr)}`;
  const sigKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  const signature = createHmac("sha1", sigKey).update(sigBase).digest("base64");

  return (
    "OAuth " +
    Object.entries({ ...oauthParams, oauth_signature: signature })
      .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
      .join(", ")
  );
}

export async function twitterConnect(req: Request, res: Response) {
  const apiKey = getEnv("TWITTER_API_KEY");
  const apiSecret = getEnv("TWITTER_API_SECRET");
  if (!apiKey || !apiSecret) {
    return res.status(500).send("Twitter API credentials not configured");
  }

  const origin = getOrigin(req);
  const callbackUrl = `${origin}/api/social/twitter/callback`;
  const requestTokenUrl = "https://api.twitter.com/oauth/request_token";

  const authHeader = buildOAuth1Header(
    "POST",
    requestTokenUrl,
    { oauth_callback: callbackUrl },
    apiKey,
    apiSecret
  );
  
  // Store origin in session for callback
  res.cookie("tw_oauth_origin", origin, { httpOnly: true, maxAge: 600_000 });

  try {
    const r = await fetch(requestTokenUrl, {
      method: "POST",
      headers: { Authorization: authHeader },
    });
    const body = await r.text();
    if (!r.ok) return oauthRedirect(res, "twitter", `Request token failed: ${body}`);

    const parsed = Object.fromEntries(new URLSearchParams(body));
    const oauthToken = parsed.oauth_token;
    const oauthTokenSecret = parsed.oauth_token_secret;

    // Store secret for callback
    twitterRequestTokens.set(oauthToken, oauthTokenSecret);
    setTimeout(() => twitterRequestTokens.delete(oauthToken), 600_000);

    res.redirect(`https://api.twitter.com/oauth/authorize?oauth_token=${oauthToken}`);
  } catch (err: any) {
    oauthRedirect(res, "twitter", err?.message ?? "Unknown error");
  }
}

export async function twitterCallback(req: Request, res: Response) {
  const { oauth_token, oauth_verifier, denied } = req.query as Record<string, string>;
  const origin = (req.cookies as Record<string, string>)?.tw_oauth_origin || getOrigin(req);

  if (denied) return oauthRedirect(res, "twitter", "Authorization denied", origin);

  const apiKey = getEnv("TWITTER_API_KEY");
  const apiSecret = getEnv("TWITTER_API_SECRET");
  const tokenSecret = twitterRequestTokens.get(oauth_token) ?? "";
  twitterRequestTokens.delete(oauth_token);

  const accessTokenUrl = "https://api.twitter.com/oauth/access_token";
  const authHeader = buildOAuth1Header(
    "POST",
    accessTokenUrl,
    { oauth_token, oauth_verifier },
    apiKey,
    apiSecret,
    tokenSecret
  );

  try {
    const r = await fetch(accessTokenUrl, {
      method: "POST",
      headers: { Authorization: authHeader },
    });
    const body = await r.text();
    if (!r.ok) return oauthRedirect(res, "twitter", `Access token failed: ${body}`, origin);

    const parsed = Object.fromEntries(new URLSearchParams(body));
    const accessToken = parsed.oauth_token;
    const accessTokenSecretVal = parsed.oauth_token_secret;
    const screenName = parsed.screen_name ?? "Twitter User";

    const db = await getDb();
    if (!db) return oauthRedirect(res, "twitter", "Database unavailable", origin);
    
    // Clear origin cookie
    res.clearCookie("tw_oauth_origin");

    const existing = await db
      .select()
      .from(socialConnections)
      .where(eq(socialConnections.platform, "twitter"))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(socialConnections)
        .set({
          accessToken,
          accessTokenSecret: accessTokenSecretVal,
          screenName,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(socialConnections.platform, "twitter"));
    } else {
      await db.insert(socialConnections).values({
        platform: "twitter",
        accessToken,
        accessTokenSecret: accessTokenSecretVal,
        screenName,
      });
    }

    oauthRedirect(res, "twitter");
  } catch (err: any) {
    oauthRedirect(res, "twitter", err?.message ?? "Unknown error");
  }
}

// ── Facebook OAuth 2.0 ─────────────────────────────────────────────────────

export async function facebookConnect(req: Request, res: Response) {
  const appId = getEnv("FACEBOOK_APP_ID");
  if (!appId) return res.status(500).send("FACEBOOK_APP_ID not configured");

  const origin = getOrigin(req);
  const redirectUri = `${origin}/api/social/facebook/callback`;
  const state = randomBytes(16).toString("hex");
  res.cookie("fb_oauth_state", state, { httpOnly: true, maxAge: 600_000 });
  res.cookie("fb_oauth_origin", origin, { httpOnly: true, maxAge: 600_000 });

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    state,
    scope: "pages_manage_posts,pages_read_engagement",
  });

  res.redirect(`https://www.facebook.com/v19.0/dialog/oauth?${params}`);
}

export async function facebookCallback(req: Request, res: Response) {
  const { code, state, error } = req.query as Record<string, string>;
  const origin = (req.cookies as Record<string, string>)?.fb_oauth_origin || getOrigin(req);

  if (error) return oauthRedirect(res, "facebook", error, origin);

  const storedState = (req.cookies as Record<string, string>)?.fb_oauth_state;
  if (!storedState || storedState !== state) {
    return oauthRedirect(res, "facebook", "State mismatch — possible CSRF", origin);
  }
  res.clearCookie("fb_oauth_state");
  res.clearCookie("fb_oauth_origin");

  const appId = getEnv("FACEBOOK_APP_ID");
  const appSecret = getEnv("FACEBOOK_APP_SECRET");
  const redirectUri = `${origin}/api/social/facebook/callback`;

  try {
    // Exchange code for user access token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
        new URLSearchParams({
          client_id: appId,
          client_secret: appSecret,
          redirect_uri: redirectUri,
          code,
        })
    );
    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      return oauthRedirect(res, "facebook", `Token exchange failed: ${err}`, origin);
    }
    const tokenData = await tokenRes.json() as { access_token: string };
    const userToken = tokenData.access_token;

    // Get list of pages the user manages
    const pagesRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${userToken}`
    );
    const pagesData = await pagesRes.json() as {
      data?: Array<{ id: string; name: string; access_token: string }>;
    };

    const page = pagesData.data?.[0];
    if (!page) {
      return oauthRedirect(res, "facebook", "No Facebook pages found for this account");
    }

    const db = await getDb();
    if (!db) return oauthRedirect(res, "facebook", "Database unavailable");

    const existing = await db
      .select()
      .from(socialConnections)
      .where(eq(socialConnections.platform, "facebook"))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(socialConnections)
        .set({
          accessToken: page.access_token,
          pageId: page.id,
          screenName: page.name,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(socialConnections.platform, "facebook"));
    } else {
      await db.insert(socialConnections).values({
        platform: "facebook",
        accessToken: page.access_token,
        pageId: page.id,
        screenName: page.name,
      });
    }

    oauthRedirect(res, "facebook");
  } catch (err: any) {
    oauthRedirect(res, "facebook", err?.message ?? "Unknown error");
  }
}
