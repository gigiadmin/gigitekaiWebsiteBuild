/**
 * Logo Data — CDN URL instead of inline base64
 * 
 * PERFORMANCE: Previously this was a 51KB base64 PNG embedded directly in JavaScript.
 * This bloated every JS chunk that imported it (navbar, footer, admin layouts).
 * 
 * FIX: Use CDN URL instead. The browser will fetch it as a separate image asset,
 * which can be cached independently and won't block JS parsing.
 * 
 * This change saves ~51KB from the main JS bundle on initial page load.
 */
export const LOGO_DATA_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663509163804/mmTCDMc2kTTVcTkwoY8f9U/gigitekai-logo-horizontal-white.png";
