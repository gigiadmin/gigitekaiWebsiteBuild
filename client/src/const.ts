export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
// returnPath: the path to redirect to after successful login (defaults to /admin)
//
// IMPORTANT: The SDK's decodeState() uses atob(state) expecting a plain base64-encoded
// redirectUri string. We therefore encode the redirectUri as the state value (plain btoa),
// and pass returnPath as a separate query parameter so the OAuth callback can restore it.
export const getLoginUrl = (returnPath: string = "/admin") => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;

  // State must be plain btoa(redirectUri) — this is what sdk.decodeState() expects
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  // Pass returnPath as a separate query param so the callback can redirect correctly
  // The OAuth callback reads this from the query string as a fallback
  if (returnPath && returnPath !== "/admin") {
    url.searchParams.set("returnPath", returnPath);
  }

  return url.toString();
};
