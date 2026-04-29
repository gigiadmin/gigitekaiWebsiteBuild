import { Router } from "express";
import { getAllTickets, getDb } from "./db";
import { tickets } from "../drizzle/schema";
import { desc, gte, eq } from "drizzle-orm";

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
    const minutes = parseInt(req.query.minutes as string) || 5;
    const limit = parseInt(req.query.limit as string) || 50;

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

export default router;
