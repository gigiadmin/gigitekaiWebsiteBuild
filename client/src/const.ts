export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
// returnPath: the path to redirect to after successful login (defaults to /admin)
//
// CRITICAL FIX: Do NOT set oauth_return_path during render! This function is called
// during render in multiple places (AdminLayout, HelpDesk, etc.), causing oauth_return_path
// to be clobbered before the OAuth callback completes, creating a redirect loop.
// Instead, encode returnPath directly into the OAuth URL as a query parameter.
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
  // Encode returnPath into the URL so it survives the OAuth redirect
  url.searchParams.set("returnPath", returnPath);

  return url.toString();
};
