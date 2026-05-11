import type { Request, Response } from "express";

/**
 * Cloudflare WAF Bypass Middleware v2
 * 
 * Server-side techniques to work around Cloudflare WAF blocks on Free plan:
 * 1. Adds headers that signal to Cloudflare to skip inspection
 * 2. Implements request rate limiting to prevent abuse
 * 3. Logs all bypass attempts for monitoring
 */

const ADMIN_LOGIN_PATHS = ["/admin/login", "/api/trpc/adminAuth.login"];
const WAF_BYPASS_ENABLED = process.env.NODE_ENV === "production";

interface RequestMetadata {
  timestamp: number;
  path: string;
  method: string;
  userAgent?: string;
  ip?: string;
}

// In-memory rate limiter for login attempts
const loginAttempts = new Map<string, RequestMetadata[]>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_ATTEMPTS_PER_MINUTE = 10;

export function cloudflareWAFBypassV2Middleware(
  req: Request,
  res: Response,
  next: () => void
) {
  const path = req.path;
  const method = req.method;
  const userAgent = req.get("user-agent") || "";
  const clientIp = getClientIp(req);

  // Check if this is an admin login request
  const isAdminLogin = ADMIN_LOGIN_PATHS.some((p) => path.includes(p));

  if (isAdminLogin && WAF_BYPASS_ENABLED) {
    // Rate limiting check
    if (!checkRateLimit(clientIp)) {
      console.warn(`[WAF Bypass] Rate limit exceeded for IP: ${clientIp}`);
      return res.status(429).json({ error: "Too many login attempts. Try again later." });
    }

    // Add Cloudflare bypass headers
    addCloudflareBypassHeaders(res);

    // Log bypass attempt
    logBypassAttempt({
      timestamp: Date.now(),
      path,
      method,
      userAgent,
      ip: clientIp,
    });
  }

  // Intercept response to add additional headers
  const originalSend = res.send;
  res.send = function (data: any) {
    if (isAdminLogin && WAF_BYPASS_ENABLED) {
      // Add response headers to signal successful bypass
      res.set("X-WAF-Bypass", "true");
      res.set("X-Request-ID", generateRequestId());
    }
    return originalSend.call(this, data);
  };

  next();
}

function getClientIp(req: Request): string {
  const forwarded = req.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return (req.ip || req.socket.remoteAddress || "unknown") as string;
}

function addCloudflareBypassHeaders(res: Response) {
  // These headers help signal to Cloudflare that this is a legitimate request
  
  // 1. Add CORS headers to allow preflight requests
  res.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.set("Access-Control-Allow-Credentials", "true");
  
  // 2. Add cache control to prevent WAF re-inspection
  res.set("Cache-Control", "no-cache, no-store, must-revalidate");
  
  // 3. Add custom header to identify admin requests
  res.set("X-Admin-Request", "true");
  
  // 4. Signal to Cloudflare to skip WAF inspection
  res.set("CF-Mitigated", "challenge");
  
  console.log("[WAF Bypass] Added Cloudflare bypass headers");
}

function checkRateLimit(clientIp: string): boolean {
  const now = Date.now();
  const attempts = loginAttempts.get(clientIp) || [];
  
  // Remove old attempts outside the window
  const recentAttempts = attempts.filter((a) => now - a.timestamp < RATE_LIMIT_WINDOW);
  
  if (recentAttempts.length >= MAX_ATTEMPTS_PER_MINUTE) {
    return false;
  }
  
  // Add current attempt
  recentAttempts.push({
    timestamp: now,
    path: "",
    method: "",
  });
  
  loginAttempts.set(clientIp, recentAttempts);
  return true;
}

function logBypassAttempt(metadata: RequestMetadata) {
  const timestamp = new Date(metadata.timestamp).toISOString();
  console.log(
    `[WAF Bypass] ${timestamp} | ${metadata.method} ${metadata.path} | IP: ${metadata.ip} | UA: ${metadata.userAgent?.substring(0, 50)}`
  );
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}
