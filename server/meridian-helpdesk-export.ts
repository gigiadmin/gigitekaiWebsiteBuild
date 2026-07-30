/**
 * Meridian Aggregate Helpdesk Export
 *
 * GET /api/integrations/meridian/helpdesk-export
 *
 * Stage C Governance: Returns ONLY aggregate counts.
 * Completely strips: ticket subjects, descriptions, customer identities,
 * emails, technician details, attachments, notes, transcripts, secrets.
 *
 * Authentication: Bearer token matching MERIDIAN_HELPDESK_READ_TOKEN env var.
 */

import { Request, Response } from "express";
import { getDb } from "./db";
import { tickets, kbArticles, knowledgeBase } from "../drizzle/schema";
import { eq, sql, and, gte } from "drizzle-orm";
import { ENV } from "./_core/env";

export async function handleMeridianHelpdeskExport(req: Request, res: Response) {
  // ── Authentication ────────────────────────────────────────────────────────
  const authHeader = req.headers["authorization"] ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  const expectedToken = ENV.meridianHelpdeskReadToken;

  if (!expectedToken) {
    // Token not configured — fail closed
    return res.status(503).json({
      error: "Service unavailable",
      message: "Endpoint not configured",
    });
  }

  if (!token || token !== expectedToken) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Valid Bearer token required",
    });
  }

  // ── Aggregate queries (NO PII returned) ──────────────────────────────────
  try {
    const db = await getDb();
    if (!db) {
      return res.status(503).json({ error: "Service unavailable", message: "Database not available" });
    }
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last24hStr = last24h.toISOString().slice(0, 19).replace("T", " ");

    // Status counts — single query for efficiency
    const [statusCounts] = await db
      .select({
        open: sql<number>`SUM(CASE WHEN ${tickets.status} = 'open' THEN 1 ELSE 0 END)`,
        in_progress: sql<number>`SUM(CASE WHEN ${tickets.status} = 'in_progress' THEN 1 ELSE 0 END)`,
        on_hold: sql<number>`SUM(CASE WHEN ${tickets.status} = 'on_hold' THEN 1 ELSE 0 END)`,
        resolved: sql<number>`SUM(CASE WHEN ${tickets.status} = 'resolved' THEN 1 ELSE 0 END)`,
        closed: sql<number>`SUM(CASE WHEN ${tickets.status} = 'closed' THEN 1 ELSE 0 END)`,
        total: sql<number>`COUNT(*)`,
        new_in_last_24h: sql<number>`SUM(CASE WHEN ${tickets.createdAt} >= ${last24hStr} THEN 1 ELSE 0 END)`,
        urgent_open: sql<number>`SUM(CASE WHEN ${tickets.priority} = 'critical' AND ${tickets.status} = 'open' THEN 1 ELSE 0 END)`,
        unassigned_open: sql<number>`SUM(CASE WHEN ${tickets.status} = 'open' AND ${tickets.assignedTo} IS NULL THEN 1 ELSE 0 END)`,
      })
      .from(tickets);

    // KB article count — isPublished = 1 means published
    let kbCount = 0;
    try {
      const [kbResult] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(kbArticles)
        .where(eq(kbArticles.isPublished, 1));
      kbCount = Number(kbResult?.count ?? 0);
    } catch {
      try {
        const [kbResult2] = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(knowledgeBase);
        kbCount = Number(kbResult2?.count ?? 0);
      } catch {
        kbCount = 0;
      }
    }

    // ── Build aggregate-only payload (Stage C — no PII) ───────────────────
    const payload = {
      meta: {
        generated_at: now.toISOString(),
        schema_version: "1.0",
        governance: "stage-c-aggregate-only",
      },
      helpdesk: {
        tickets: {
          open: Number(statusCounts?.open ?? 0),
          in_progress: Number(statusCounts?.in_progress ?? 0),
          on_hold: Number(statusCounts?.on_hold ?? 0),
          resolved: Number(statusCounts?.resolved ?? 0),
          closed: Number(statusCounts?.closed ?? 0),
          total: Number(statusCounts?.total ?? 0),
          new_in_last_24h: Number(statusCounts?.new_in_last_24h ?? 0),
          urgent_open: Number(statusCounts?.urgent_open ?? 0),
          unassigned_open: Number(statusCounts?.unassigned_open ?? 0),
        },
        knowledge_base: {
          published_articles: kbCount,
        },
      },
    };

    return res.status(200).json(payload);
  } catch (err: any) {
    console.error("[Meridian Export] Query error:", err?.message ?? err);
    return res.status(500).json({
      error: "Internal server error",
      message: "Failed to retrieve aggregate metrics",
    });
  }
}
