import { Express } from "express";
import { auditAgentAccountsHandler } from "./audit-agent-accounts-handler";
import { syncAiNewsToBlogHandler } from "../_core/handlers/syncAiNewsToBlogHandler";

/**
 * Register all scheduled handlers
 * Must be called in server/_core/index.ts BEFORE the Vite/static fallthrough
 */
export function registerScheduledHandlers(app: Express) {
  console.log("[Scheduled] Registering scheduled handlers...");

  // Weekly agent account audit
  app.post("/api/scheduled/audit-agent-accounts", auditAgentAccountsHandler);

  // Daily AI News to Blog sync
  app.post("/api/scheduled/sync-ai-news-to-blog", syncAiNewsToBlogHandler);

  console.log("[Scheduled] Scheduled handlers registered");
}
