/**
 * Logo Data — served from client/public as a static file
 *
 * PERMANENT: This path is served directly from the origin server with no expiry,
 * no S3 signing, and no CDN dependency. The file lives at client/public/
 * and is available at /gigitekai-logo.webp on all domains.
 *
 * DO NOT use expired S3 or signed CloudFront URLs —
 * those expire and will cause the logo to break in production.
 *
 * To update the logo: replace client/public/gigitekai-logo.webp and save a checkpoint.
 */
export const LOGO_DATA_URL = "/gigitekai-logo.webp";
