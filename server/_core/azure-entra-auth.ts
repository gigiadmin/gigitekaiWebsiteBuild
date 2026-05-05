/**
 * Azure Entra ID Authentication for Admin Portal
 * Uses Microsoft Graph API to authenticate admin users via Azure AD
 * Enterprise-grade, Microsoft-first approach
 */

import { PublicClientApplication, AuthorizationUrlRequest, AuthorizationCodeRequest } from "@azure/msal-node";
// Graph client will be initialized on-demand
import jwt from "jsonwebtoken";
import { Request, Response } from "express";


const ADMIN_EMAILS = [
  "harry@gigitekai.com",
  "harry.henry.santiago@gigitekai.com",
  "hhenry23@gmail.com",
];

const ADMIN_GROUPS = [
  "admin",
  "gigitekai-admins",
];

// Initialize MSAL (Microsoft Authentication Library)
const msalConfig = {
  auth: {
    clientId: process.env.MS_GRAPH_CLIENT_ID || "",
    authority: `https://login.microsoftonline.com/${process.env.MS_GRAPH_TENANT_ID || "common"}`,
    clientSecret: process.env.MS_GRAPH_CLIENT_SECRET || "",
  },
  system: {
    loggerOptions: {
      loggerCallback(loglevel: any, message: string) {
        if (process.env.NODE_ENV === "development") {
          console.log(`[MSAL] ${message}`);
        }
      },
      piiLoggingEnabled: false,
      logLevel: 3,
    },
  },
};

const pca = new PublicClientApplication(msalConfig);

// Microsoft Graph client will be initialized on-demand if needed

/**
 * Generate Azure Entra ID login URL
 */
export function getAzureLoginUrl(redirectUri: string): string {
  const authCodeUrlParameters: AuthorizationUrlRequest = {
    scopes: [
      "https://graph.microsoft.com/.default",
      "openid",
      "profile",
      "email",
    ],
    redirectUri,
    prompt: "select_account",
  };

  try {
    const url = pca.getAuthCodeUrl(authCodeUrlParameters);
    return url;
  } catch (error) {
    console.error("[Azure Auth] Error generating login URL:", error);
    throw error;
  }
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForToken(code: string, redirectUri: string) {
  const tokenRequest: AuthorizationCodeRequest = {
    code,
    scopes: [
      "https://graph.microsoft.com/.default",
      "openid",
      "profile",
      "email",
    ],
    redirectUri,
  };

  try {
    const response = await pca.acquireTokenByCode(tokenRequest);
    return response;
  } catch (error) {
    console.error("[Azure Auth] Error exchanging code for token:", error);
    throw error;
  }
}

/**
 * Verify user is admin via Microsoft Graph
 */
export async function verifyAdminAccess(accessToken: string, userEmail: string): Promise<boolean> {
  try {
    // Check if user is in admin email list
    if (ADMIN_EMAILS.includes(userEmail.toLowerCase())) {
      return true;
    }

    // Optional: Check Azure AD group membership
    // This requires additional Graph API permissions
    // For now, rely on email whitelist

    return false;
  } catch (error) {
    console.error("[Azure Auth] Error verifying admin access:", error);
    return false;
  }
}

/**
 * Extract user info from ID token
 */
export function extractUserFromToken(idToken: string): { email: string; name: string; oid: string } | null {
  try {
    // Decode without verification (we trust Azure's token)
    const decoded = jwt.decode(idToken, { complete: true });
    if (!decoded || !decoded.payload) return null;

    const payload = decoded.payload as any;
    return {
      email: payload.email || payload.preferred_username || "",
      name: payload.name || payload.given_name || "",
      oid: payload.oid || "",
    };
  } catch (error) {
    console.error("[Azure Auth] Error extracting user from token:", error);
    return null;
  }
}

/**
 * Create admin session cookie
 */
export function createAdminSessionCookie(
  res: Response,
  userEmail: string,
  userName: string,
  userOid: string
) {
  const sessionData = {
    email: userEmail,
    name: userName,
    oid: userOid,
    role: "admin",
    iat: Math.floor(Date.now() / 1000),
  };

  // Sign session token
  const sessionToken = jwt.sign(sessionData, process.env.JWT_SECRET || "secret", {
    expiresIn: "24h",
  });

  // Set secure cookie
  res.cookie("admin_session", sessionToken, {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });

  return sessionToken;
}

/**
 * Verify admin session cookie
 */
export function verifyAdminSession(req: Request): { email: string; name: string; oid: string; role: string } | null {
  try {
    const cookie = req.cookies?.admin_session;
    if (!cookie) return null;

    const decoded = jwt.verify(cookie, process.env.JWT_SECRET || "secret") as any;
    return {
      email: decoded.email,
      name: decoded.name,
      oid: decoded.oid,
      role: decoded.role,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Clear admin session
 */
export function clearAdminSession(res: Response) {
  res.clearCookie("admin_session", {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
}
