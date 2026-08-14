import { COOKIE_NAME } from "@shared/const";
import type { Express, Request, Response } from "express";
import { getSessionCookieOptions } from "./cookies";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function deriveReturnPath(state: string, queryReturnPath?: string): string {
  if (queryReturnPath && queryReturnPath.startsWith("/") && !queryReturnPath.startsWith("//")) {
    return queryReturnPath;
  }
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64").toString("utf-8"));
    if (decoded.returnPath && typeof decoded.returnPath === "string" && decoded.returnPath.startsWith("/") && !decoded.returnPath.startsWith("//")) {
      return decoded.returnPath;
    }
  } catch {
    // fall through
  }
  return "/admin";
}

export function registerOAuthRoutes(app: Express) {
  // Legacy Manus OAuth callback is replaced with an owned fallback route.
  // If the Manus identity provider is still configured, this route would normally
  // exchange the code. During migration we redirect back to the admin dashboard
  // and authenticate the caller via the existing admin_session JWT if present.
  // Public anonymous routes remain unaffected.
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const returnPath = state ? deriveReturnPath(state, getQueryParam(req, "returnPath")) : "/admin";

    // If there is already an admin session, return to the app.
    const cookies = req.cookies as Record<string, string> | undefined;
    if (cookies?.admin_session) {
      return res.redirect(302, returnPath);
    }

    // No Manus OAuth configured or no admin session. Redirect to the dedicated
    // admin login page with a migration-safe message.
    return res.redirect(302, `/admin/login?next=${encodeURIComponent(returnPath)}&reason=oauth_deprecated`);
  });

  // Optional: owned Microsoft Entra OIDC callback (if you want to enable
  // Entra-based admin login). Register this only after configuring the Entra app.
  app.get("/api/oauth/entra/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      return res.status(400).json({ error: "code and state are required" });
    }
    // Entra token exchange should be implemented here using @azure/msal-node.
    // For now, redirect to admin login.
    return res.redirect(302, "/admin/login");
  });
}
