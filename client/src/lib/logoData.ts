/**
 * Logo Data — served from client/public as a static file
 *
 * PERMANENT: This path is served directly from the origin server with no expiry,
 * no S3 signing, and no CDN dependency. The file lives at client/public/
 * and is available at /gigitekai-admin-logo.webp on all domains.
 * WebP version: 24KB vs 255KB JPG — 90% smaller, same visual quality.
 *
 * To update the logo: replace client/public/gigitekai-admin-logo.jpg,
 * regenerate .webp with Pillow (quality=85), and save a checkpoint.
 */
export const LOGO_DATA_URL = "/gigitekai-admin-logo.webp";
