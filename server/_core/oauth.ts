import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function parseState(state: string): { origin?: string; returnPath?: string } {
  try {
    return JSON.parse(atob(state));
  } catch {
    return {};
  }
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

      // Parse origin from state — the frontend encodes window.location.origin in state
      const parsed = parseState(state);

      // CRITICAL: Must use origin from state, NOT req.get('host')
      // req.get('host') returns the internal sandbox domain (e.g. dvfjapih3g-4udy2jbea-ue.a.run.app)
      // which is NOT registered as a valid redirect_uri in Manus OAuth
      // The state contains the actual frontend origin (e.g. https://gigitekai.com)
      const origin = parsed.origin;
      if (!origin) {
        console.error("[OAuth] No origin in state — cannot redirect safely");
        res.status(400).json({ error: "Invalid state: missing origin" });
        return;
      }

      // Determine returnPath based on user role:
      // - Admins ALWAYS go to /admin (cannot be overridden)
      // - Non-admins use returnPath from state or default to /helpdesk
      let returnPath: string;

      if (isAdmin) {
        returnPath = "/admin";
      } else {
        const statePath = parsed.returnPath;
        if (statePath && statePath.startsWith("/") && !statePath.startsWith("//")) {
          returnPath = statePath;
        } else {
          returnPath = "/helpdesk";
        }
      }

      const redirectUrl = `${origin}${returnPath}`;
      console.log("[OAuth] User:", userInfo.email, "| Role:", isAdmin ? "admin" : "user", "| Origin:", origin, "| Redirect:", redirectUrl);
      res.redirect(302, redirectUrl);
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
