import { Express } from "express";
import { auditAgentAccountsHandler } from "./audit-agent-accounts-handler";

/**
 * Register all scheduled handlers
 * Must be called in server/_core/index.ts BEFORE the Vite/static fallthrough
 */
export function registerScheduledHandlers(app: Express) {
  console.log("[Scheduled] Registering scheduled handlers...");

  // Weekly agent account audit
  app.post("/api/scheduled/audit-agent-accounts", auditAgentAccountsHandler);

  console.log("[Scheduled] Scheduled handlers registered");
}
