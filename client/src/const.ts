export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
// returnPath: the path to redirect to after successful login (defaults to /admin)
export const getLoginUrl = (returnPath: string = "/admin") => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;

  // State is a JSON object containing origin and returnPath, then base64-encoded
  // The OAuth callback will parse this to extract both values
  const stateObj = {
    origin: window.location.origin,
    returnPath: returnPath,
  };
  const state = btoa(JSON.stringify(stateObj));

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
