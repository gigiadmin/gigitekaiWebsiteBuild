import { Configuration, RedirectRequest } from "@azure/msal-browser";

// Azure AD App Registration details for GigitekAI Admin Portal
export const MSAL_CONFIG: Configuration = {
  auth: {
    clientId: "c8ec9f2c-a3df-4bfb-a5dd-badf653aa04d",
    authority: "https://login.microsoftonline.com/b7595a11-d451-46a6-aff1-c98ee3bda4f9",
    redirectUri: `${window.location.origin}/redirect.html`,
    postLogoutRedirectUri: `${window.location.origin}/admin/login`,
  },
  cache: {
    // CRITICAL: Must use localStorage (not sessionStorage) for redirect flow on iOS.
    // sessionStorage is cleared when the browser navigates away to Microsoft login,
    // causing MSAL to lose its state and loop on return. localStorage persists across navigation.
    cacheLocation: "localStorage",
  },
};

// Login request scopes — openid + profile gives us name and email
export const LOGIN_REQUEST: RedirectRequest = {
  scopes: ["openid", "profile", "email", "User.Read"],
  loginHint: "harry@gigitekai.com",
};

// Allowed admin emails — only these can access the admin portal
export const ALLOWED_ADMIN_EMAILS = [
  "harry@gigitekai.com",
];
