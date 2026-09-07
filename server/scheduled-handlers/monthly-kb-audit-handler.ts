import type { Request, Response } from "express";
import { sdk } from "../_core/sdk";
import { runMonthlyKbQualityAudit } from "../services/kbQualityAudit";

export async function monthlyKbAuditHandler(req: Request, res: Response) {
  let taskUid: string | undefined;
  try {
    const user = await sdk.authenticateRequest(req);
    taskUid = user.taskUid;
    if (!user.isCron || !taskUid) return res.status(403).json({ error: "cron-only" });
    const result = await runMonthlyKbQualityAudit({ taskUid, source: "scheduled" });
    return res.json({ ...result, taskUid, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("[Scheduled] Monthly Knowledge Base audit error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      context: { url: req.originalUrl, taskUid },
      timestamp: new Date().toISOString(),
    });
  }
}
