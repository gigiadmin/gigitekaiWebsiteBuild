/**
 * MS 365 OAuth Admin Authentication
 * Replaces hardcoded username/password with Azure AD authentication
 */

import { SignJWT, jwtVerify } from "jose";
import axios from "axios";

const ADMIN_JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "admin-fallback-secret-change-in-prod"
);
const ADMIN_SESSION_COOKIE = "admin_session";
const SESSION_DURATION = "7d";

export interface AdminTokenPayload {
  adminId: string;
  email: string;
  name: string;
  role: "admin" | "agent" | "viewer";
}

/**
 * Get MS 365 OAuth authorization URL
 */
export function getMsOAuthUrl(redirectUri: string): string {
  const clientId = process.env.AZURE_CLIENT_ID;
  const tenantId = process.env.AZURE_TENANT_ID;

  if (!clientId || !tenantId) {
    throw new Error("Missing AZURE_CLIENT_ID or AZURE_TENANT_ID");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid profile email",
    prompt: "select_account",
  });

  return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<string> {
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  const tenantId = process.env.AZURE_TENANT_ID;

  if (!clientId || !clientSecret || !tenantId) {
    throw new Error("Missing Azure credentials");
  }

  try {
    const response = await axios.post(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        scope: "openid profile email",
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error("[MS365 Auth] Token exchange failed:", error);
    throw new Error("Failed to exchange authorization code");
  }
}

/**
 * Get user info from access token
 */
export async function getUserFromToken(accessToken: string): Promise<{
  id: string;
  email: string;
  name: string;
}> {
  try {
    const response = await axios.get("https://graph.microsoft.com/v1.0/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return {
      id: response.data.id,
      email: response.data.userPrincipalName || response.data.mail,
      name: response.data.displayName,
    };
  } catch (error) {
    console.error("[MS365 Auth] Failed to get user info:", error);
    throw new Error("Failed to retrieve user information");
  }
}

/**
 * Check if user is authorized admin
 * For now, allow any user from the tenant
 * In production, check against a list of authorized admins
 */
export async function isAuthorizedAdmin(email: string): Promise<boolean> {
  // TODO: Check against admin list in database
  // For now, allow any user from your tenant
  const tenantDomain = process.env.AZURE_TENANT_ID;
  
  // You can add specific email checks here
  const authorizedEmails = process.env.ADMIN_EMAILS?.split(",") || [];
  
  if (authorizedEmails.length > 0) {
    return authorizedEmails.includes(email);
  }

  // Default: allow (restrict in production)
  return true;
}

/**
 * Sign admin JWT token
 */
export async function signAdminToken(payload: AdminTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(ADMIN_JWT_SECRET);
}

/**
 * Verify admin JWT token
 */
export async function verifyAdminToken(token: string): Promise<AdminTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, ADMIN_JWT_SECRET);
    return payload as unknown as AdminTokenPayload;
  } catch {
    return null;
  }
}

/**
 * Build admin session cookie header
 */
export function buildAdminSessionCookieHeader(token: string, isSecure = true, domain?: string): string {
  const maxAge = 7 * 24 * 60 * 60; // 7 days in seconds
  const securePart = isSecure ? "; Secure" : "";
  const domainPart = domain ? `; Domain=${domain}` : "";
  return `${ADMIN_SESSION_COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}${domainPart}${securePart}`;
}

/**
 * Clear admin session cookie
 */
export function clearAdminSessionCookieHeader(isSecure = true): string {
  const securePart = isSecure ? "; Secure" : "";
  return `${ADMIN_SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${securePart}`;
}

/**
 * Get admin session from cookies
 */
export function getAdminSessionCookie(cookies: Record<string, string>): string | undefined {
  return cookies[ADMIN_SESSION_COOKIE];
}
