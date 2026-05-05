import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Extract origin from the decoded state (which is btoa(redirectUri))
      // The redirectUri is like https://gigitekai.com/api/oauth/callback
      let origin: string;
      try {
        const decodedRedirectUri = atob(state);
        const redirectUrl = new URL(decodedRedirectUri);
        origin = redirectUrl.origin;
      } catch {
        // Fallback: use forwarded headers
        const proto = req.get("x-forwarded-proto") || req.protocol || "https";
        const host = req.get("x-forwarded-host") || req.get("host") || "gigitekai.com";
        origin = `${proto}://${host}`;
      }

      // Redirect to /oauth-callback page which waits for cookie to be processed
      // Then redirects to the final destination (/admin or stored returnPath)
      const redirectUrl = `${origin}/oauth-callback`;
      console.log("[OAuth] User:", userInfo.email, "| Redirect:", redirectUrl);
      res.redirect(302, redirectUrl);
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
