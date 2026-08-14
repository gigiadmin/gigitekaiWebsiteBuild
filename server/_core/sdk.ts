import { AXIOS_TIMEOUT_MS, COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";
import type {
  ExchangeTokenResponse,
  GetUserInfoResponse,
  GetUserInfoWithJwtResponse,
} from "./types/manusTypes";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export type SessionPayload = {
  openId: string;
  appId: string;
  name: string;
};

const CRON_OPEN_ID_PREFIX = "cron_";

export type AuthenticatedUser = User & {
  taskUid?: string;
  isCron?: boolean;
};

function buildCronUser(session: SessionPayload): AuthenticatedUser {
  const now = new Date();
  return {
    id: -1,
    openId: session.openId,
    name: session.name || "GigitekAI Scheduled Task",
    email: null,
    loginMethod: null,
    role: "user",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    lastSignedIn: now.toISOString(),
    approved: 1,
    deletedAt: null,
    taskUid: session.openId.replace(CRON_OPEN_ID_PREFIX, ""),
    isCron: true,
  } as AuthenticatedUser;
}

function deriveLoginMethod(
  platforms: unknown,
  fallback: string | null | undefined
): string | null {
  if (fallback && fallback.length > 0) return fallback;
  if (!Array.isArray(platforms) || platforms.length === 0) return null;
  const set = new Set<string>(
    platforms.filter((p): p is string => typeof p === "string")
  );
  if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
  if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
  if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
  if (
    set.has("REGISTERED_PLATFORM_MICROSOFT") ||
    set.has("REGISTERED_PLATFORM_AZURE")
  )
    return "microsoft";
  if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
  const first = Array.from(set)[0];
  return first ? first.toLowerCase() : null;
}

class SDKServer {
  constructor() {
    if (ENV.oAuthServerUrl) {
      console.warn(
        "[OAuth] OAUTH_SERVER_URL is still set but the Manus OAuth server is no longer used. " +
          "The owned JWT/session flow is active."
      );
    }
  }

  /**
   * Legacy OAuth code exchange is no longer supported.
   * This method now throws because the Manus OAuth server has been removed.
   */
  async exchangeCodeForToken(
    _code: string,
    _state: string
  ): Promise<ExchangeTokenResponse> {
    throw new Error(
      "Manus OAuth server is no longer available. " +
        "Use the owned identity flow (admin portal / Microsoft Entra / custom session)."
    );
  }

  /**
   * Legacy user info lookup via Manus access token is no longer supported.
   */
  async getUserInfo(_accessToken: string): Promise<GetUserInfoResponse> {
    throw new Error(
      "Manus OAuth user info lookup is no longer available. " +
        "Resolve the user from the local database or the owned identity provider."
    );
  }

  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) return new Map<string, string>();
    const parsed: Record<string, string> = {};
    const pairs = cookieHeader.split(";");
    for (const pair of pairs) {
      const [key, ...rest] = pair.trim().split("=");
      if (key && rest.length > 0) {
        parsed[key] = decodeURIComponent(rest.join("="));
      }
    }
    return new Map(Object.entries(parsed));
  }

  private getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }

  async createSessionToken(
    openId: string,
    options: { expiresInMs?: number; name?: string } = {}
  ): Promise<string> {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || "",
      },
      options
    );
  }

  async signSession(
    payload: SessionPayload,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    const secretKey = this.getSessionSecret();

    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<SessionPayload | null> {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }

    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"],
      });
      const { openId, appId, name } = payload as Record<string, unknown>;

      if (!isNonEmptyString(openId) || !isNonEmptyString(appId)) {
        console.warn("[Auth] Session payload missing required fields (openId or appId)");
        return null;
      }

      if (typeof name !== "string") {
        console.warn("[Auth] Session payload name field is not a string");
        return null;
      }

      return { openId, appId, name };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }

  /**
   * Resolve user info from the owned session cookie and local database.
   * No external Manus OAuth server call is made.
   */
  async getUserInfoWithJwt(jwtToken: string): Promise<GetUserInfoWithJwtResponse> {
    const session = await this.verifySession(jwtToken);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }

    const user = await db.getUserByOpenId(session.openId);
    return {
      openId: session.openId,
      name: user?.name || session.name || "",
      email: user?.email || null,
      platform: deriveLoginMethod(null, user?.loginMethod),
      loginMethod: deriveLoginMethod(null, user?.loginMethod),
      taskUid: session.openId.startsWith(CRON_OPEN_ID_PREFIX)
        ? session.openId.replace(CRON_OPEN_ID_PREFIX, "")
        : undefined,
    } as GetUserInfoWithJwtResponse;
  }

  async authenticateRequest(req: Request): Promise<AuthenticatedUser> {
    console.log("[Auth] authenticateRequest called for:", req.path);
    console.log("[Auth] Cookie header:", req.headers.cookie ? "present" : "MISSING");
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    console.log("[Auth] Session cookie found:", sessionCookie ? "yes" : "NO");
    const session = await this.verifySession(sessionCookie);
    console.log("[Auth] Session verified:", session ? "yes" : "NO");

    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }

    // Cron short-circuit: no DB user needed, just a valid owned session
    if (session.openId.startsWith(CRON_OPEN_ID_PREFIX)) {
      return buildCronUser(session);
    }

    const signedInAt = new Date().toISOString();
    let user = await db.getUserByOpenId(session.openId);

    if (!user) {
      // If the session is valid but the user is not in the DB, create a minimal
      // local record. This replaces the previous Manus OAuth sync fallback.
      try {
        await db.upsertUser({
          openId: session.openId,
          name: session.name || null,
          email: null,
          loginMethod: null,
          lastSignedIn: signedInAt,
        });
        user = await db.getUserByOpenId(session.openId);
      } catch (error) {
        console.error("[Auth] Failed to create local user record:", error);
        throw ForbiddenError("Failed to create local user record");
      }
    }

    if (!user) {
      throw ForbiddenError("User not found");
    }

    await db.upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt,
    });

    return user as AuthenticatedUser;
  }
}

export const sdk = new SDKServer();

// Keep AXIOS_TIMEOUT_MS import if any downstream code references it; otherwise
// the constant is unused in this file but harmless.
console.log("[OAuth] SDK initialized with owned session flow (AXIOS_TIMEOUT_MS:", AXIOS_TIMEOUT_MS, ")");
