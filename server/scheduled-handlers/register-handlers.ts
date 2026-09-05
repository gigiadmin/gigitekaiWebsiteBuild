import { Express } from "express";
import { auditAgentAccountsHandler } from "./audit-agent-accounts-handler";
import { syncAiNewsToBlogHandler } from "../_core/handlers/syncAiNewsToBlogHandler";
import { ariaWeeklyDigestHandler } from "./aria-weekly-digest-handler";
import { dailyInsightsHandler } from "./daily-insights-handler";

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

  // Daily published Insights recap
  app.post("/api/scheduled/daily-insights", dailyInsightsHandler);

  // Weekly Aria digest email
  app.post("/api/scheduled/aria-weekly-digest", ariaWeeklyDigestHandler);

  console.log("[Scheduled] Scheduled handlers registered");
}
