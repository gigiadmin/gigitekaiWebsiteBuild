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

      // Fetch user record to check role
      const userRecord = await db.getUserByOpenId(userInfo.openId);
      const isAdmin = userRecord?.role === "admin";

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Extract origin from the state (which is btoa(redirectUri))
      // The redirectUri contains the origin (e.g. https://gigitekai.com/api/oauth/callback?returnPath=/admin)
      let origin: string;
      let returnPath: string;

      try {
        const decodedRedirectUri = atob(state);
        const redirectUrl = new URL(decodedRedirectUri);
        origin = redirectUrl.origin; // e.g. https://gigitekai.com
        returnPath = redirectUrl.searchParams.get("returnPath") || "/admin";
      } catch {
        // Fallback: use request headers
        const proto = req.get("x-forwarded-proto") || req.protocol || "https";
        const host = req.get("x-forwarded-host") || req.get("host") || "gigitekai.com";
        origin = `${proto}://${host}`;
        returnPath = getQueryParam(req, "returnPath") || "/admin";
      }

      // Admins ALWAYS go to /admin
      if (isAdmin) {
        returnPath = "/admin";
      }

      const redirectUrl = `${origin}${returnPath}`;
      console.log("[OAuth] User:", userInfo.email, "| Role:", isAdmin ? "admin" : "user", "| Redirect:", redirectUrl);
      res.redirect(302, redirectUrl);
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
