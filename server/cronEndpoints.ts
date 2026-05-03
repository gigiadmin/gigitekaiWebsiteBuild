import { Router } from "express";
import { getAllTickets, getDb } from "./db";
import { tickets } from "../drizzle/schema";
import { desc, gte, eq } from "drizzle-orm";
import { sendEmail } from "./_core/email";

const router = Router();

/**
 * GET /api/cron/new-tickets
 * Fetches newly created tickets from the last N minutes
 * Used by external cron job schedulers (e.g., GitHub Actions, Azure Automation)
 * 
 * Query params:
 * - minutes: number of minutes to look back (default: 5)
 * - limit: max tickets to return (default: 50)
 * 
 * Returns: { success: boolean, count: number, tickets: Ticket[] }
 */
router.get("/new-tickets", async (req, res) => {
  try {
    const minutesRaw = parseInt(req.query.minutes as string);
    const limitRaw = parseInt(req.query.limit as string);
    const minutes = isNaN(minutesRaw) ? 5 : minutesRaw;
    const limit = isNaN(limitRaw) ? 50 : limitRaw;

    // Validate inputs
    if (minutes < 1 || minutes > 1440) {
      return res.status(400).json({
        success: false,
        error: "minutes must be between 1 and 1440",
      });
    }

    if (limit < 1 || limit > 500) {
      return res.status(400).json({
        success: false,
        error: "limit must be between 1 and 500",
      });
    }

    const db = await getDb();
    if (!db) {
      return res.status(503).json({
        success: false,
        error: "Database connection unavailable",
      });
    }

    // Calculate cutoff time
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);

    // Fetch new tickets created since cutoff
    const newTickets = await db
      .select()
      .from(tickets)
      .where(gte(tickets.createdAt, cutoffTime))
      .orderBy(desc(tickets.createdAt))
      .limit(limit);

    return res.json({
      success: true,
      count: newTickets.length,
      minutes,
      cutoffTime: cutoffTime.toISOString(),
      tickets: newTickets,
    });
  } catch (error) {
    console.error("[Cron] Error fetching new tickets:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch new tickets",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/cron/tickets-by-status
 * Fetches tickets filtered by status
 * 
 * Query params:
 * - status: ticket status (open, in_progress, closed, etc.)
 * - limit: max tickets to return (default: 50)
 * 
 * Returns: { success: boolean, count: number, tickets: Ticket[] }
 */
router.get("/tickets-by-status", async (req, res) => {
  try {
    const status = req.query.status as string;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: "status query parameter is required",
      });
    }

    const db = await getDb();
    if (!db) {
      return res.status(503).json({
        success: false,
        error: "Database connection unavailable",
      });
    }

    // Fetch tickets by status
    const ticketsByStatus = await db
      .select()
      .from(tickets)
      .where(eq(tickets.status, status as any))
      .orderBy(desc(tickets.createdAt))
      .limit(limit);

    return res.json({
      success: true,
      count: ticketsByStatus.length,
      status,
      tickets: ticketsByStatus,
    });
  } catch (error) {
    console.error("[Cron] Error fetching tickets by status:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch tickets by status",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/cron/health
 * Health check endpoint for cron job monitoring
 * 
 * Returns: { success: boolean, timestamp: string, uptime: number }
 */
router.get("/health", (req, res) => {
  return res.json({
    success: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: "gigitekai-cron-endpoints",
  });
});

/**
 * POST /api/cron/nps-digest
 * Sends a weekly NPS / customer satisfaction digest email to the owner.
 * Called by the Manus scheduled task every Monday at 8 AM EDT.
 *
 * Auth: uses app_session_id cookie (scheduled-task-level, role=user)
 */
router.post("/nps-digest", async (req, res) => {
  try {
    const db = await getDb();
    if (!db) {
      return res.status(503).json({ success: false, error: "Database unavailable" });
    }

    const { customerFeedback, tickets: ticketsTable, users } = await import("../drizzle/schema");
    const { and, gte: gteOp } = await import("drizzle-orm");

    // Last 7 days window
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Fetch feedback from the last 7 days
    const recentFeedback = await db
      .select()
      .from(customerFeedback)
      .where(gteOp(customerFeedback.createdAt, weekAgo))
      .orderBy(desc(customerFeedback.createdAt));

    // Ticket stats for the week
    const weekTickets = await db
      .select()
      .from(ticketsTable)
      .where(gteOp(ticketsTable.createdAt, weekAgo));

    const totalTickets = weekTickets.length;
    const resolvedTickets = weekTickets.filter((t: any) => t.status === "resolved" || t.status === "closed").length;
    const openTickets = weekTickets.filter((t: any) => t.status === "open").length;
    const inProgressTickets = weekTickets.filter((t: any) => t.status === "in_progress").length;

    // NPS calculation
    const totalFeedback = recentFeedback.length;
    const avgRating = totalFeedback > 0
      ? recentFeedback.reduce((s: number, f: any) => s + f.rating, 0) / totalFeedback
      : 0;
    const promoters = recentFeedback.filter((f: any) => f.rating >= 4).length;
    const detractors = recentFeedback.filter((f: any) => f.rating <= 2).length;
    const npsScore = totalFeedback > 0
      ? Math.round(((promoters - detractors) / totalFeedback) * 100)
      : 0;

    // Top comments
    const topComments = recentFeedback
      .filter((f: any) => f.comment && f.comment.trim().length > 0)
      .slice(0, 5)
      .map((f: any) => ({ rating: f.rating, comment: f.comment }));

    // Build email HTML
    const weekStart = weekAgo.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const weekEnd = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const ratingBar = (rating: number) => {
      const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
      return `<span style="color:#f59e0b">${stars}</span>`;
    };

    const commentsHtml = topComments.length > 0
      ? topComments.map((c: any) => `
          <div style="border-left:3px solid #00D4FF;padding:8px 12px;margin:8px 0;background:#1a1f2e">
            <div style="margin-bottom:4px">${ratingBar(c.rating)}</div>
            <p style="color:#cbd5e1;font-size:14px;margin:0">${c.comment}</p>
          </div>`).join("")
      : `<p style="color:#64748b">No comments this week.</p>`;

    const resolutionRate = totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0A0E1A;font-family:Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px">
    <!-- Header -->
    <div style="background:#0F1419;border:1px solid #1e293b;border-radius:12px;padding:24px;margin-bottom:24px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
        <span style="background:#00D4FF20;border-radius:8px;padding:6px 12px;color:#00D4FF;font-weight:bold;font-size:18px">GigitekAI</span>
        <span style="color:#64748b;font-size:14px">Weekly NPS Digest</span>
      </div>
      <p style="color:#94a3b8;font-size:13px;margin:0">${weekStart} – ${weekEnd}</p>
    </div>

    <!-- NPS Score -->
    <div style="background:#0F1419;border:1px solid #1e293b;border-radius:12px;padding:24px;margin-bottom:16px;text-align:center">
      <p style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px">Net Promoter Score</p>
      <p style="color:${npsScore >= 50 ? '#22c55e' : npsScore >= 0 ? '#f59e0b' : '#ef4444'};font-size:56px;font-weight:bold;margin:0">${npsScore > 0 ? '+' : ''}${npsScore}</p>
      <p style="color:#94a3b8;font-size:13px;margin:8px 0 0">${totalFeedback} responses · Avg rating: ${avgRating.toFixed(1)}/5</p>
    </div>

    <!-- Ticket Stats -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
      <div style="background:#0F1419;border:1px solid #1e293b;border-radius:12px;padding:16px">
        <p style="color:#64748b;font-size:11px;text-transform:uppercase;margin:0 0 4px">New Tickets</p>
        <p style="color:#00D4FF;font-size:28px;font-weight:bold;margin:0">${totalTickets}</p>
      </div>
      <div style="background:#0F1419;border:1px solid #1e293b;border-radius:12px;padding:16px">
        <p style="color:#64748b;font-size:11px;text-transform:uppercase;margin:0 0 4px">Resolution Rate</p>
        <p style="color:${resolutionRate >= 80 ? '#22c55e' : '#f59e0b'};font-size:28px;font-weight:bold;margin:0">${resolutionRate}%</p>
      </div>
      <div style="background:#0F1419;border:1px solid #1e293b;border-radius:12px;padding:16px">
        <p style="color:#64748b;font-size:11px;text-transform:uppercase;margin:0 0 4px">Resolved</p>
        <p style="color:#22c55e;font-size:28px;font-weight:bold;margin:0">${resolvedTickets}</p>
      </div>
      <div style="background:#0F1419;border:1px solid #1e293b;border-radius:12px;padding:16px">
        <p style="color:#64748b;font-size:11px;text-transform:uppercase;margin:0 0 4px">Open</p>
        <p style="color:#f59e0b;font-size:28px;font-weight:bold;margin:0">${openTickets}</p>
      </div>
    </div>

    <!-- Comments -->
    <div style="background:#0F1419;border:1px solid #1e293b;border-radius:12px;padding:24px;margin-bottom:16px">
      <p style="color:#94a3b8;font-size:14px;font-weight:bold;margin:0 0 12px">Recent Customer Feedback</p>
      ${commentsHtml}
    </div>

    <!-- Footer -->
    <p style="color:#334155;font-size:12px;text-align:center">GigitekAI Admin Portal · support@gigitek.com · 609-676-4483</p>
  </div>
</body>
</html>`;

    // Send to owner
    const ownerEmail = process.env.OWNER_EMAIL || "support@gigitek.com";
    const sent = await sendEmail({
      to: ownerEmail,
      subject: `📊 Weekly NPS Digest — ${weekStart} to ${weekEnd} | GigitekAI`,
      html,
    });

    return res.json({
      success: sent,
      period: { from: weekAgo.toISOString(), to: new Date().toISOString() },
      stats: { totalFeedback, avgRating: Math.round(avgRating * 10) / 10, npsScore, totalTickets, resolvedTickets, openTickets, resolutionRate },
      emailSentTo: ownerEmail,
    });
  } catch (error) {
    console.error("[NPS Digest] Error:", error);
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
  }
});

/**
 * GET /api/cron/cleanup-recordings
 * Deletes session recordings older than 90 days from both S3 and the database.
 * GDPR data minimization compliance — run daily via external cron scheduler.
 *
 * Query params:
 * - retentionDays: number of days to retain recordings (default: 90)
 *
 * Returns: { success, deleted, errors, cutoffDate }
 */
router.get("/cleanup-recordings", async (req, res) => {
  try {
    const RETENTION_DAYS = parseInt(req.query.retentionDays as string) || 90;
    if (RETENTION_DAYS < 1 || RETENTION_DAYS > 3650) {
      return res.status(400).json({ success: false, error: "retentionDays must be between 1 and 3650" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(503).json({ success: false, error: "Database connection unavailable" });
    }

    const cutoffDate = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const { sql } = await import("drizzle-orm");

    // Fetch expired recordings
    const result = await db.execute(
      sql`SELECT id, session_id, file_key, recording_url
          FROM session_recordings
          WHERE created_at < ${cutoffDate.toISOString()}
          ORDER BY created_at ASC
          LIMIT 500`
    );
    const expired = (result[0] as unknown as any[]) ?? [];

    if (expired.length === 0) {
      return res.json({
        success: true,
        deleted: 0,
        errors: 0,
        cutoffDate: cutoffDate.toISOString(),
        message: "No expired recordings found",
      });
    }

    // Delete from storage proxy (Manus built-in storage)
    const forgeApiUrl = (process.env.BUILT_IN_FORGE_API_URL || "").replace(/\/+$/, "");
    const forgeApiKey = process.env.BUILT_IN_FORGE_API_KEY || "";

    let deleted = 0;
    let errors = 0;
    const deletedIds: number[] = [];

    for (const rec of expired) {
      try {
        if (rec.file_key && forgeApiUrl && forgeApiKey) {
          const deleteUrl = new URL(`${forgeApiUrl}/v1/storage/delete`);
          deleteUrl.searchParams.set("path", rec.file_key);
          await fetch(deleteUrl.toString(), {
            method: "DELETE",
            headers: { Authorization: `Bearer ${forgeApiKey}` },
          });
        }
        deletedIds.push(rec.id);
        deleted++;
      } catch (storageErr) {
        console.error(`[Cleanup Recordings] Storage delete failed for id=${rec.id}:`, storageErr);
        errors++;
        // Still mark for DB deletion even if storage delete fails
        deletedIds.push(rec.id);
      }
    }

    // Bulk delete from DB
    if (deletedIds.length > 0) {
      await db.execute(
        sql`DELETE FROM session_recordings WHERE id IN (${sql.raw(deletedIds.join(","))})`
      );
    }

    console.log(`[Cleanup Recordings] Deleted ${deleted} recordings older than ${RETENTION_DAYS} days (${errors} S3 errors)`);

    return res.json({
      success: true,
      deleted,
      errors,
      cutoffDate: cutoffDate.toISOString(),
      retentionDays: RETENTION_DAYS,
      message: `Deleted ${deleted} expired recordings`,
    });
  } catch (error) {
    console.error("[Cleanup Recordings] Error:", error);
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
  }
});

/**
 * GET /api/cron/sla-breach-check
 * Checks all open tickets for SLA breaches and sends alerts
 * Called every 15 minutes via Manus scheduled task
 *
 * Returns: { success: boolean, breachesDetected: number, message: string }
 */
router.get("/sla-breach-check", async (req, res) => {
  try {
    const baseUrl = process.env.VITE_APP_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/trpc/slaBreachAlerts.checkSLABreaches`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`SLA check failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`[SLA Breach Check] Detected ${result.result?.breachesDetected || 0} breaches`);
    
    return res.json({
      success: true,
      breachesDetected: result.result?.breachesDetected || 0,
      message: `SLA check completed: ${result.result?.breachesDetected || 0} breaches detected`,
    });
  } catch (error) {
    console.error("[SLA Breach Check] Error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/cron/auto-escalate-tickets
 * Checks for tickets approaching SLA breach and escalates to senior technicians
 * Called every 10 minutes via Manus scheduled task
 */
router.get("/auto-escalate-tickets", async (req, res) => {
  try {
    const baseUrl = process.env.VITE_APP_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/trpc/ticketAutoEscalation.checkForEscalations`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Escalation check failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`[Auto-Escalation] Escalated ${result.result?.escalationsTriggered || 0} tickets`);

    return res.json({
      success: true,
      escalationsTriggered: result.result?.escalationsTriggered || 0,
      message: `Auto-escalation completed: ${result.result?.escalationsTriggered || 0} tickets escalated`,
    });
  } catch (error) {
    console.error("[Auto-Escalation] Error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/cron/auto-send-surveys
 * Sends satisfaction surveys for recently resolved tickets
 * Called every 30 minutes via Manus scheduled task
 */
router.get("/auto-send-surveys", async (req, res) => {
  try {
    const baseUrl = process.env.VITE_APP_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/trpc/clientSatisfactionSurvey.autoSendSurveysForResolvedTickets`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Survey send failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`[Auto-Send Surveys] Sent ${result.result?.surveysSent || 0} surveys`);

    return res.json({
      success: true,
      surveysSent: result.result?.surveysSent || 0,
      message: `Survey delivery completed: ${result.result?.surveysSent || 0} surveys sent`,
    });
  } catch (error) {
    console.error("[Auto-Send Surveys] Error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
