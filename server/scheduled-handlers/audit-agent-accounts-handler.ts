import { Request, Response } from "express";
import { auditAgentAccounts } from "../jobs/audit-agent-accounts";
import { sdk } from "../_core/sdk";

/**
 * Scheduled handler for weekly agent account audit
 * Runs every Monday at 2 AM UTC
 */
export async function auditAgentAccountsHandler(req: Request, res: Response) {
  try {
    // Authenticate as cron
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron) {
      return res.status(403).json({ error: "cron-only" });
    }

    console.log("[Scheduled] Starting agent account audit...");

    // Run the audit
    const result = await auditAgentAccounts();

    if (!result.success) {
      return res.status(500).json({
        error: result.error || "Audit failed",
        timestamp: new Date().toISOString(),
        taskUid: user.taskUid,
      });
    }

    // Return success
    res.json({
      ok: true,
      audit: result,
      timestamp: new Date().toISOString(),
      taskUid: user.taskUid,
    });
  } catch (error) {
    console.error("[Scheduled] Audit handler error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      context: {
        url: req.originalUrl,
        taskUid: (req as any).user?.taskUid,
      },
      timestamp: new Date().toISOString(),
    });
  }
}
