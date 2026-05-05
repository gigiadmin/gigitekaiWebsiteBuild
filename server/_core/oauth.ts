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

      // Determine returnPath (where to redirect after login):
      // Priority 1: query string returnPath param (set by getLoginUrl for non-admin routes e.g. /helpdesk)
      // Priority 2: JSON-encoded state (legacy format used before the SDK fix)
      // Priority 3: default to /admin
      let returnPath = "/admin";

      const queryReturnPath = getQueryParam(req, "returnPath");
      if (queryReturnPath && queryReturnPath.startsWith("/") && !queryReturnPath.startsWith("//")) {
        // New format: returnPath passed as explicit query param
        returnPath = queryReturnPath;
      } else {
        try {
          const decoded = JSON.parse(atob(state));
          if (decoded.returnPath && typeof decoded.returnPath === "string") {
            const path = decoded.returnPath;
            if (path.startsWith("/") && !path.startsWith("//")) {
              returnPath = path;
            }
          }
        } catch {
          // Current format: state is plain btoa(redirectUri) — default to /admin
          returnPath = "/admin";
        }
      }

      res.redirect(302, returnPath);
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
