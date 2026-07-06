/**
 * Security headers middleware.
 * Adds CSP, X-Frame-Options, and other protective headers.
 */
import type { Request, Response, NextFunction } from "express";

export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  const isProd = process.env.NODE_ENV === "production";

  // Content Security Policy — restrict resource loading
  // In production: remove unsafe-inline/unsafe-eval from script-src (SEC-01)
  // In development: keep them for Vite HMR to work
  const cspDirectives = [
    "default-src 'self'",
    // Allow inline scripts (needed for bootstrap loader, analytics, and manus-runtime)
    // and all CDN sources used by the app
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://www.google.com https://www.gstatic.com https://files.manuscdn.com https://manus-analytics.com https://plausible.io https://umami.is https://www.googletagmanager.com https://tagmanager.google.com https://www.google-analytics.com https://ssl.google-analytics.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://unpkg.com https://static.cloudflareinsights.com",
    // Styles: inline is required for Tailwind CSS (CSS-in-JS) in both environments
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
  // Allow microphone for Aria Command Center voice input
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(self), geolocation=(), payment=()"
  );

  // Cross-Origin-Opener-Policy — prevent cross-origin opener access (COOP)
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");

  // Cross-Origin-Resource-Policy — restrict cross-origin resource sharing (CORP)
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

  // Cross-Origin-Embedder-Policy — disabled (unsafe-none) because manus-storage
  // uses 307 redirects to CloudFront signed URLs which don't include CORP headers.
  // With require-corp, all cross-origin resources must have CORP: cross-origin,
  // but we can't control CloudFront's response headers.
  res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");

  // Strict Transport Security (HTTPS only, 1 year + preload)
  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  next();
}
