/**
 * Security headers middleware.
 * Adds CSP, X-Frame-Options, and other protective headers.
 */
import type { Request, Response, NextFunction } from "express";

export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Content Security Policy — restrict resource loading
  const cspDirectives = [
    "default-src 'self'",
    // Scripts: self + inline (needed for Vite HMR in dev) + CDNs
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://www.google.com https://www.gstatic.com",
    // Styles: self + inline (Tailwind) + Google Fonts
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // Fonts: self + Google Fonts CDN
    "font-src 'self' https://fonts.gstatic.com data:",
    // Images: self + CDN + S3 + data URIs
    "img-src 'self' data: blob: https: http:",
    // Connect: self + API + WebSocket + CDN
    "connect-src 'self' https: wss: ws:",
    // Frames: Google reCAPTCHA
    "frame-src 'self' https://www.google.com",
    // Media
    "media-src 'self' https: blob:",
    // Object: none (block Flash, Java, etc.)
    "object-src 'none'",
    // Base URI: self only
    "base-uri 'self'",
    // Form action: self only
    "form-action 'self'",
    // Upgrade insecure requests in production
    ...(process.env.NODE_ENV === "production" ? ["upgrade-insecure-requests"] : []),
  ];

  res.setHeader("Content-Security-Policy", cspDirectives.join("; "));

  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "SAMEORIGIN");

  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Enable XSS filter (legacy browsers)
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Control referrer information
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions Policy — restrict browser features
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );

  // Strict Transport Security (HTTPS only, 1 year)
  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }

  next();
}
