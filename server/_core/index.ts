import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { setupWebSocket } from "./websocket";
import { apiLimiter, chatLimiter, formLimiter, authLimiter } from "./rateLimiter";
import { securityHeaders } from "./securityHeaders";
import { startDigestScheduler } from "./digestScheduler";

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
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // ── Security Middleware ──────────────────────────────────────────────────
  app.use(securityHeaders);

  // ── Rate Limiting ───────────────────────────────────────────────────────
  // Auth endpoints: 10 attempts per 15 min (OAuth + custom admin login)
  app.use("/api/oauth", authLimiter);
  app.use("/api/trpc/adminAuth", authLimiter); // CODE-02: brute-force protection on admin login
  // AI chat: 20 messages per minute (LLM cost protection)
  app.use("/api/trpc/aibot", chatLimiter);    // CODE-01: was defined but never applied
  // Contact/lead forms: 5 submissions per 15 min (spam protection)
  app.use("/api/trpc/contact", formLimiter);  // CODE-01: was defined but never applied
  // General API: 100 req/min
  app.use("/api/trpc", apiLimiter);

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
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
  });
}

startServer().catch(console.error);
