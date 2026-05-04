export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
// returnPath: the path to redirect to after successful login (defaults to /admin)
//
// IMPORTANT: The SDK's decodeState() uses atob(state) expecting a plain base64-encoded
// redirectUri string. The redirectUri MUST NOT contain query params because the OAuth server
// appends ?code=...&state=... to it, and having existing query params breaks parsing.
//
// Strategy: Store returnPath in sessionStorage before redirecting to OAuth.
// The OAuth callback will redirect to /admin by default (server-side).
// For non-admin paths, the ApprovalGuard/useAuth handles it client-side.
export const getLoginUrl = (returnPath: string = "/admin") => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;

  // Store returnPath in sessionStorage so we can retrieve it after OAuth
  if (typeof window !== "undefined") {
    sessionStorage.setItem("oauth_return_path", returnPath);
  }

  // State must be plain btoa(redirectUri) — this is what sdk.decodeState() expects
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
