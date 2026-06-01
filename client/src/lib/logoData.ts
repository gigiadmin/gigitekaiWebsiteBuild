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
export const LOGO_DATA_URL = "https://manus-storage.s3.us-east-1.amazonaws.com/gigitekai-logo-optimized_0b6c5e05(1)_2f33f309.jpg";
