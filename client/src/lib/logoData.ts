/**
 * Logo Data — served from client/public as a static file
 *
 * PERMANENT: This path is served directly from the origin server with no expiry,
 * no S3 signing, and no CDN dependency. The file lives at client/public/gigitekai-logo.jpg
 * and is available at /gigitekai-logo.jpg on all domains.
 *
 * DO NOT use manus-storage.s3.us-east-1.amazonaws.com or signed CloudFront URLs —
 * those expire and will cause the logo to break in production.
 *
 * To update the logo: replace client/public/gigitekai-logo.jpg and save a checkpoint.
 */
export const LOGO_DATA_URL = "/gigitekai-logo.jpg";
