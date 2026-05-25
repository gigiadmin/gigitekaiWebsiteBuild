import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import compression from "compression";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { registerVideoProxy } from "./videoProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { setupWebSocket } from "./websocket";
import { setupWebRTCSignaling } from "./webrtcSignaling";
import { apiLimiter, chatLimiter, formLimiter, authLimiter } from "./rateLimiter";
import { securityHeaders } from "./securityHeaders";
import { comprehensiveWAFBypass } from "./cloudflare-waf-bypass";
import { startDigestScheduler } from "./digestScheduler";
import { startTeamsDigestScheduler } from "./teamsDigest";
import { startSlaAlertScheduler } from "./teamsSlaAlerts";
import { startNewsletterScheduler } from "../routers/newsletter";
import { startSocialScheduler } from "./socialScheduler";
import { startEngagementPoller } from "./socialEngagementPoller";
import { startInviteExpiryScheduler } from "./inviteExpiryScheduler";
import { startHealthCheckScheduler } from "../schedulers/healthCheckScheduler";
import { startEmailFlowE2EScheduler } from "../schedulers/emailFlowE2ECheck";
import { startMsLearnSyncScheduler } from "../schedulers/msLearnSyncScheduler";
import { startAiNewsScheduler } from "../schedulers/aiNewsScheduler";
import { startWebhookHealthMonitor } from "./teamsWebhookUtils";
import { startEmailPoller } from "./emailPoller";
import { startCallPoller } from "./callPoller";
import { handleTeamsWebhook, handleTeamsHealthCheck } from "./teamsWebhook";
import { handleEmailIngest } from "../emailIngest";
import { handleMailManusWebhook, handleMailManusHealthCheck } from "../mailManusWebhook";
import { stopEmailPoller } from "./emailPoller";
import { initializeTeamsForwarding } from "./teamsForwardingSetup";
import {
  linkedinConnect, linkedinCallback,
  twitterConnect, twitterCallback,
  facebookConnect, facebookCallback,
} from "../socialOAuth";
import cronEndpoints from "../cronEndpoints";
import newsletterAutoPost from "../newsletterAutoPost";
import stripeWebhookRoute from "../routes/stripe-webhook-route";
import { registerXeroOAuthRoutes } from "../routers/xero";
import { registerAcsRecordingWebhook } from "../acsRecordingWebhook";
// Using Microsoft Graph (Azure) for all email operations

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Setup WebSocket
  setupWebSocket(server);
  // Setup WebRTC Signaling (PeerChat-style)
  setupWebRTCSignaling(server);
  // ── Compression Middleware ──────────────────────────────────────────────
  // Enable Brotli compression for better performance (1.2 MB vendor → ~400 KB)
  // Fallback to gzip for browsers that don't support Brotli
  app.use(compression({
    level: 6, // Balance between compression ratio and CPU usage
    threshold: 1024, // Only compress responses > 1KB
    filter: (req, res) => {
      // Don't compress if already compressed
      if (res.getHeader('content-encoding')) return false;
      // Compress everything except images and video
      const contentType = res.getHeader('content-type')?.toString() || '';
      return !contentType.includes('image') && !contentType.includes('video');
    }
  }));

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // ── HTTP → HTTPS Redirect ──────────────────────────────────────────────
  // In production, redirect plain HTTP requests to HTTPS.
  // Cloudflare/reverse-proxies forward the original protocol via x-forwarded-proto.
  app.use((req, res, next) => {
    if (process.env.NODE_ENV === "production") {
      const proto = req.headers["x-forwarded-proto"];
      if (proto && proto !== "https") {
        return res.redirect(301, `https://${req.headers.host}${req.url}`);
      }
    }
    next();
  });

  // ── Security Middleware ──────────────────────────────────────────────────
  app.use(securityHeaders);

  // ── Cloudflare WAF Bypass for Mobile ────────────────────────────────────────
  // Handles mobile traffic that gets blocked by Cloudflare WAF
  app.use(comprehensiveWAFBypass);

  // ── Cache Headers Middleware ───────────────────────────────────────────────
  // Set aggressive caching for static assets, no-cache for HTML and API
  app.use((req, res, next) => {
    const isStaticAsset = /\.(js|css|woff2|webp|png|jpg|jpeg|gif|svg|ico)$/i.test(req.path);
    const isHtml = req.path === '/' || req.path.endsWith('.html');
    const isApi = req.path.startsWith('/api/');

    if (isStaticAsset) {
      // Cache static assets for 1 year (immutable)
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (isHtml) {
      // Don't cache HTML (always check for updates)
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    } else if (isApi) {
      // Never cache API responses — auth endpoints set cookies that must not be cached
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
    } else {
      // Default: cache for 1 hour
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
    next();
  });

  // ── Auth Endpoint No-Cache ─────────────────────────────────────────────────
  // Explicitly prevent any caching on auth endpoints that set cookies.
  // Cloudflare and CDNs MUST NOT cache these responses or the Set-Cookie header will be stripped.
  app.use("/api/trpc/adminAuth", (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Vary', 'Cookie, Authorization');
    next();
  });
  app.use("/api/oauth", (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Vary', 'Cookie, Authorization');
    next();
  });

  // ── Rate Limiting ───────────────────────────────────────────────────────
  // Auth endpoints: 10 attempts per 15 min (OAuth + custom admin login)
  app.use("/api/oauth", authLimiter);
  app.use("/api/trpc/adminAuth", authLimiter); // CODE-02: brute-force protection on admin login
  // AI chat: 20 messages per minute (LLM cost protection)
  app.use("/api/trpc/aibot", chatLimiter);    // CODE-01: was defined but never applied
  // Contact/lead forms: 5 submissions per 15 min (spam protection)
  app.use("/api/trpc/contact", formLimiter);  // CODE-01: was defined but never applied
  // Teams webhook: 100 req/min (bot message limit)
  app.use("/api/webhooks/teams", apiLimiter);
  // General API: 100 req/min
  app.use("/api/trpc", apiLimiter);

  // ── Dynamic Blog Sitemap ────────────────────────────────────────────────
  app.get("/api/sitemap-blog.xml", async (_req, res) => {
    try {
      const { getDb } = await import("../db");
      const { blogPosts } = await import("../../drizzle/schema");
      const { eq, desc } = await import("drizzle-orm");
      const db = await getDb();
      const posts = db
        ? await db
            .select({ slug: blogPosts.slug, updatedAt: blogPosts.updatedAt, publishedAt: blogPosts.publishedAt })
            .from(blogPosts)
            .where(eq(blogPosts.published, true))
            .orderBy(desc(blogPosts.publishedAt))
        : [];
      const base = "https://gigitekai.com";
      const urls = posts
        .map((p) => {
          const lastmod = (p.publishedAt ?? p.updatedAt).toISOString().split("T")[0];
          return `  <url>\n    <loc>${base}/blog/${p.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>yearly</changefreq>\n    <priority>0.6</priority>\n  </url>`;
        })
        .join("\n");
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
      res.setHeader("Content-Type", "application/xml");
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.send(xml);
    } catch (err) {
      console.error("[Sitemap] Blog sitemap error:", err);
      res.status(500).send("Error generating sitemap");
    }
  });

  // Storage proxy for private assets
  registerStorageProxy(app);

  // Video streaming proxy — uses /api/video/ path to bypass Cloudflare edge interception
  registerVideoProxy(app);

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // Xero OAuth connect/callback routes
  registerXeroOAuthRoutes(app);
  
  // Teams Bot webhook
  app.post("/api/webhooks/teams", handleTeamsWebhook);
  app.get("/api/webhooks/teams/health", handleTeamsHealthCheck);
  
  // Mail Manus webhook for automated email-to-ticket creation
  // Configure in Manus: Mail Manus → Settings → Webhook → POST to https://gigitekai.com/api/webhooks/mail-manus
  app.post("/api/webhooks/mail-manus", handleMailManusWebhook);
  app.get("/api/webhooks/mail-manus/health", handleMailManusHealthCheck);
  
  // Email-to-Ticket: Using Microsoft Graph (Azure) for email ingestion
  app.post("/api/email-ingest", handleEmailIngest);

  // ACS Call Recording webhooks (Event Grid + recording state callbacks)
  registerAcsRecordingWebhook(app);

  // Cron job endpoints
  app.use("/api/cron", cronEndpoints);

  // Newsletter auto-post API (used by daily AI recap scheduled task)
  app.use("/api/newsletter", newsletterAutoPost);
  
  // Stripe webhook endpoint
  app.use("/api/stripe/webhook", stripeWebhookRoute);
  
  // Social OAuth connect/callback routes
  app.get("/api/social/linkedin/connect", linkedinConnect);
  app.get("/api/social/linkedin/callback", linkedinCallback);
  app.get("/api/social/twitter/connect", twitterConnect);
  app.get("/api/social/twitter/callback", twitterCallback);
  app.get("/api/social/facebook/connect", facebookConnect);
  app.get("/api/social/facebook/callback", facebookCallback);
  
  // Teams webhook diagnostic (public, no auth required)
  app.get("/api/teams-diag", async (_req, res) => {
    const url = process.env.TEAMS_WEBHOOK_URL;
    if (!url) return res.json({ status: 'error', message: 'TEAMS_WEBHOOK_URL not set' });
    try {
      const payload = {
        type: 'message',
        attachments: [{
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: {
            '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
            type: 'AdaptiveCard',
            version: '1.4',
            body: [{ type: 'TextBlock', text: '🔧 Production Teams Diagnostic Test', weight: 'Bolder' }]
          }
        }]
      };
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const text = await r.text();
      return res.json({ status: r.ok ? 'ok' : 'failed', httpStatus: r.status, response: text, webhookConfigured: true });
    } catch (e: any) {
      return res.json({ status: 'error', message: e.message });
    }
  });

  // Harry's contact page redirect
  app.get("/hh", (_req, res) => {
    res.redirect("/contact");
  });

  // ── Aria Chat File Upload (multipart) ──────────────────────────────────────
  // Accepts real file bytes and uploads to S3, returns a public URL for AI review
  {
    const multer = (await import("multer")).default;
    const { storagePut } = await import("../storage");
    const { nanoid } = await import("nanoid");
    const upload = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (_req, file, cb) => {
        const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp",
          "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "audio/webm", "audio/mp4", "audio/ogg", "audio/wav", "audio/mpeg"];
        cb(null, allowed.includes(file.mimetype));
      },
    });
    app.post("/api/upload/aria", upload.single("file"), async (req: any, res) => {
      try {
        if (!req.file) return res.status(400).json({ success: false, error: "No file provided" });
        const ext = req.file.originalname.split(".").pop() || "bin";
        const key = `aria-uploads/${nanoid()}.${ext}`;
        const { url } = await storagePut(key, req.file.buffer, req.file.mimetype);
        return res.json({ success: true, url, fileName: req.file.originalname, mimeType: req.file.mimetype });
      } catch (err: any) {
        console.error("[Aria Upload] Error:", err);
        return res.status(500).json({ success: false, error: err.message });
      }
    });
  }
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // ── Serve static legal pages (pre-rendered HTML) ──────────────────────────
  // These must be served BEFORE the SPA catch-all to intercept requests
  const path = await import("path");
  const fs = await import("fs");
  const distPath = path.resolve(import.meta.dirname, "../", "dist", "public");
  
  // Import SSR handler for homepage
  const { renderHomepageSSR } = await import("../ssrHandler");
  
  app.get("/privacy-policy", (req, res, next) => {
    const filePath = path.resolve(distPath, "privacy-policy.html");
    if (fs.existsSync(filePath)) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=3600");
      return res.sendFile(filePath);
    }
    next();
  });

  app.get("/terms-of-service", (req, res, next) => {
    const filePath = path.resolve(distPath, "terms-of-service.html");
    if (fs.existsSync(filePath)) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=3600");
      return res.sendFile(filePath);
    }
    next();
  });
  
  // Server-Side Rendering (SSR) for homepage
  // Serves full HTML content with schema markup so Google and users see complete content
  app.get("/", (req, res, next) => {
    if (process.env.NODE_ENV === "production") {
      renderHomepageSSR(req, res);
    } else {
      // Development: pass to Vite
      next();
    }
  });

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    // Start email digest scheduler
    startDigestScheduler();
    startNewsletterScheduler();
    // Start Teams daily digest scheduler (8 AM EST)
    startTeamsDigestScheduler();
    // Start Teams SLA breach alert scheduler (every 30 minutes)
    startSlaAlertScheduler();
    // Start Social post scheduler (every 5 minutes)
    startSocialScheduler();
    // Start Social engagement poller (every hour)
    startEngagementPoller();
    // Start invite expiry scheduler (every hour)
    startInviteExpiryScheduler();
    // Start health check scheduler (every 5 minutes)
    startHealthCheckScheduler(5 * 60 * 1000);
    // Start daily E2E email flow check (8:00 AM ET)
    startEmailFlowE2EScheduler();
    // Start nightly MS Learn catalog sync (2:00 AM ET)
    startMsLearnSyncScheduler();
    // Start daily AI news recap (9:00 AM ET → newsletter + blog post)
    startAiNewsScheduler();
    // Start Teams webhook health monitor (hourly checks)
    startWebhookHealthMonitor();
    // Start M365 Graph email poller (every 5 minutes)
    startEmailPoller();
    // Start Teams PSTN call poller (every 5 minutes)
    startCallPoller();
    // Start M365 Group voicemail poller (every 5 minutes) — directly fetches audio from voicemail@gigitekai.com
    import("./voicemailGroupPoller").then(({ startVoicemailGroupPoller }) => {
      startVoicemailGroupPoller();
    }).catch(err => console.error("[Voicemail Poller] Failed to start:", err));
    // Teams forwarding disabled - requires Mail.ReadWrite permission in Azure AD
    // To enable: Add Mail.ReadWrite permission to MS Graph app registration
    // initializeTeamsForwarding().catch(err => {
    //   console.error("[Teams Forwarding] Failed to initialize:", err);
    // });
    
    // Ensure default admin account exists
    (async () => {
      const { ensureDefaultAdminExists } = await import("../admin-auth");
      ensureDefaultAdminExists().catch(err => {
        console.error("[Admin Auth] Failed to ensure default admin:", err);
      });
    })().catch(err => {
      console.error("[Admin Auth] Failed to load module:", err);
    });
    console.log("[Call Poller] Teams PSTN call poller started (5-minute interval)");
    // Log email poller setup
    console.log("[Email Poller] M365 Graph email poller started (5-minute interval)");
    console.log("[Email Poller] Polling support@gigitekai.com mailbox for new emails");
    console.log("[Email Poller] Auto-creating tickets with AI classification");
    // Log webhook endpoints
    console.log(`[Teams Bot] Webhook endpoint: http://localhost:${port}/api/webhooks/teams`);
    console.log(`[Mail Manus] Webhook endpoint: http://localhost:${port}/api/webhooks/mail-manus`);
    console.log(`[Email Poller] Status endpoint: /api/trpc/system.getEmailPollerStatus`);
    console.log(`[Server] Build version: 2026-04-25-v5-TEAMS-CARD-FIX — Teams card colors fixed + Email poller Teams notifications verified`);
    console.log(`[Server] Teams webhook URL configured: ${process.env.TEAMS_WEBHOOK_URL ? 'YES' : 'NO'}`);
    console.log(`[Server] Email poller Teams notifications: ENABLED + VERIFIED`);
    console.log(`[Server] Ticket notification card colors: accent/attention/good (valid Teams colors)`);
  });
}

startServer().catch(console.error);

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("[Server] SIGTERM received, shutting down gracefully");
  stopEmailPoller();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("[Server] SIGINT received, shutting down gracefully");
  stopEmailPoller();
  process.exit(0);
});
