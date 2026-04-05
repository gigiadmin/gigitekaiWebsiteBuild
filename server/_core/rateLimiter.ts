/**
 * In-memory rate limiter middleware for Express.
 * Protects API endpoints from abuse without external dependencies.
 *
 * Uses a sliding window approach with automatic cleanup.
 */
import type { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  message?: string;      // Custom error message
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

// Cleanup expired entries every 60 seconds
setInterval(() => {
  const now = Date.now();
  stores.forEach((store) => {
    store.forEach((entry, key) => {
      if (now > entry.resetAt) {
        store.delete(key);
      }
    });
  });
}, 60_000);

function getClientIP(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket.remoteAddress || "unknown";
}

// Track IPs that have been rate-limited for admin notification
const notifiedIPs = new Map<string, number>(); // ip -> last notification timestamp
const NOTIFY_COOLDOWN_MS = 30 * 60_000; // Only notify once per 30 min per IP

async function notifySecurityEvent(ip: string, limiterName: string, path: string) {
  const now = Date.now();
  const key = `${ip}:${limiterName}`;
  const lastNotified = notifiedIPs.get(key);
  if (lastNotified && now - lastNotified < NOTIFY_COOLDOWN_MS) return;

  notifiedIPs.set(key, now);

  try {
    // Dynamic import to avoid circular dependencies
    const { notifyOwner } = await import("./notification");
    await notifyOwner({
      title: `Security Alert: Rate Limit Exceeded`,
      content: `**Rate limit triggered**\n\n- **Limiter:** ${limiterName}\n- **IP Address:** ${ip}\n- **Endpoint:** ${path}\n- **Time:** ${new Date().toISOString()}\n\nThis IP has exceeded the allowed request rate. If this is suspicious, consider blocking this IP.`,
    });
  } catch (err) {
    console.warn("[Security] Failed to send rate limit notification:", err);
  }
}

export function createRateLimiter(name: string, config: RateLimitConfig) {
  const store = new Map<string, RateLimitEntry>();
  stores.set(name, store);

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = getClientIP(req);
    const now = Date.now();
    const entry = store.get(ip);

    if (!entry || now > entry.resetAt) {
      // New window
      store.set(ip, { count: 1, resetAt: now + config.windowMs });
      res.setHeader("X-RateLimit-Limit", config.maxRequests);
      res.setHeader("X-RateLimit-Remaining", config.maxRequests - 1);
      return next();
    }

    if (entry.count >= config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader("Retry-After", retryAfter);
      res.setHeader("X-RateLimit-Limit", config.maxRequests);
      res.setHeader("X-RateLimit-Remaining", 0);

      // Notify admin of rate limit abuse
      notifySecurityEvent(ip, name, req.path);

      return res.status(429).json({
        error: config.message || "Too many requests. Please try again later.",
        retryAfter,
      });
    }

    entry.count++;
    res.setHeader("X-RateLimit-Limit", config.maxRequests);
    res.setHeader("X-RateLimit-Remaining", config.maxRequests - entry.count);
    next();
  };
}

// ─── Pre-configured limiters ────────────────────────────────────────────────

/** General API: 100 requests per minute */
export const apiLimiter = createRateLimiter("api", {
  windowMs: 60_000,
  maxRequests: 100,
  message: "Too many API requests. Please slow down.",
});

/** AI Chat: 20 messages per minute (protects LLM costs) */
export const chatLimiter = createRateLimiter("chat", {
  windowMs: 60_000,
  maxRequests: 20,
  message: "Too many chat messages. Please wait a moment before sending more.",
});

/** Contact form / Lead capture: 5 submissions per 15 minutes */
export const formLimiter = createRateLimiter("form", {
  windowMs: 15 * 60_000,
  maxRequests: 5,
  message: "Too many form submissions. Please try again in a few minutes.",
});

/** Auth endpoints: 10 attempts per 15 minutes */
export const authLimiter = createRateLimiter("auth", {
  windowMs: 15 * 60_000,
  maxRequests: 10,
  message: "Too many authentication attempts. Please try again later.",
});

/** File upload: 10 uploads per 5 minutes */
export const uploadLimiter = createRateLimiter("upload", {
  windowMs: 5 * 60_000,
  maxRequests: 10,
  message: "Too many file uploads. Please wait before uploading more.",
});
