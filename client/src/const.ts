export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
// returnPath: the path to redirect to after successful login (defaults to /admin)
//
// IMPORTANT: The SDK's decodeState() uses atob(state) expecting a plain base64-encoded
// redirectUri string. We therefore encode the redirectUri as the state value (plain btoa),
// and pass returnPath as a query parameter on the redirectUri so the OAuth callback can read it.
export const getLoginUrl = (returnPath: string = "/admin") => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;

  // Build redirectUri with returnPath as query param so the callback can extract it
  const callbackUrl = new URL(`${window.location.origin}/api/oauth/callback`);
  callbackUrl.searchParams.set("returnPath", returnPath);
  const redirectUri = callbackUrl.toString();

  // State must be plain btoa(redirectUri) — this is what sdk.decodeState() expects
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
