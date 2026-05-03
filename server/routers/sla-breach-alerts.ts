/**
 * SLA Breach Alerting System
 * Monitors ticket SLAs and sends Teams/email alerts when breaches occur
 * Supports multiple SLA tiers (critical, high, medium, low)
 */

import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { sendEmail } from "../_core/email";
import { notifyOwner } from "../_core/notification";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

// SLA thresholds (in minutes)
const SLA_THRESHOLDS = {
  critical: 60, // 1 hour
  high: 240, // 4 hours
  medium: 1440, // 24 hours
  low: 2880, // 48 hours
};

interface SLABreach {
  ticketId: number;
  ticketTitle: string;
  priority: string;
  createdAt: Date;
  minutesOverdue: number;
  assignedTo?: string;
  clientEmail?: string;
}

/**
 * Calculate SLA status for a ticket
 */
export function calculateSLAStatus(
  priority: string,
  createdAt: Date,
  resolvedAt?: Date
): { status: "ok" | "warning" | "breached"; minutesRemaining: number } {
  const now = resolvedAt || new Date();
  const createdTime = new Date(createdAt).getTime();
  const nowTime = now.getTime();
  const elapsedMinutes = (nowTime - createdTime) / (1000 * 60);

  const threshold =
    SLA_THRESHOLDS[priority as keyof typeof SLA_THRESHOLDS] ||
    SLA_THRESHOLDS.medium;
  const minutesRemaining = threshold - elapsedMinutes;

  if (minutesRemaining < 0) {
    return { status: "breached", minutesRemaining };
  } else if (minutesRemaining < threshold * 0.2) {
    // Warning at 80% of SLA
    return { status: "warning", minutesRemaining };
  } else {
    return { status: "ok", minutesRemaining };
  }
}

/**
 * Format SLA status for display
 */
export function formatSLAStatus(minutesRemaining: number): string {
  if (minutesRemaining < 0) {
    const absMinutes = Math.abs(minutesRemaining);
    const hours = Math.floor(absMinutes / 60);
    const mins = Math.floor(absMinutes % 60);
    return `${hours}h ${mins}m overdue`;
  } else {
    const hours = Math.floor(minutesRemaining / 60);
    const mins = Math.floor(minutesRemaining % 60);
    return `${hours}h ${mins}m remaining`;
  }
}

/**
 * Send SLA breach alert via Teams and email
 */
async function sendSLABreachAlert(breach: SLABreach): Promise<void> {
  const db = getDb();

  // Teams notification
  try {
    const teamsMessage = {
      "@type": "MessageCard",
      "@context": "https://schema.org/extensions",
      summary: `🚨 SLA Breach Alert: Ticket #${breach.ticketId}`,
      themeColor: breach.priority === "critical" ? "FF0000" : "FFA500",
      sections: [
        {
          activityTitle: `SLA Breach: ${breach.ticketTitle}`,
          activitySubtitle: `Ticket #${breach.ticketId} - ${breach.priority.toUpperCase()} Priority`,
          facts: [
            {
              name: "Status",
              value: "🔴 BREACHED",
            },
            {
              name: "Overdue By",
              value: formatSLAStatus(breach.minutesOverdue),
            },
            {
              name: "Created",
              value: new Date(breach.createdAt).toLocaleString(),
            },
            {
              name: "Assigned To",
              value: breach.assignedTo || "Unassigned",
            },
          ],
          markdown: true,
        },
      ],
      potentialAction: [
        {
          "@type": "OpenUri",
          name: "View Ticket",
          targets: [
            {
              os: "default",
              uri: `${process.env.VITE_APP_URL || "https://gigitekai.com"}/admin/helpdesk?ticketId=${breach.ticketId}`,
            },
          ],
        },
      ],
    };

    // Send to Teams webhook (if configured)
    if (process.env.TEAMS_WEBHOOK_URL) {
      await fetch(process.env.TEAMS_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teamsMessage),
      });
    }
  } catch (err) {
    console.error("Failed to send Teams SLA alert:", err);
  }

  // Email notification
  try {
    const emailContent = `
<h2>🚨 SLA Breach Alert</h2>
<p><strong>Ticket:</strong> #${breach.ticketId} - ${breach.ticketTitle}</p>
<p><strong>Priority:</strong> ${breach.priority.toUpperCase()}</p>
<p><strong>Status:</strong> BREACHED</p>
<p><strong>Overdue By:</strong> ${formatSLAStatus(breach.minutesOverdue)}</p>
<p><strong>Created:</strong> ${new Date(breach.createdAt).toLocaleString()}</p>
<p><strong>Assigned To:</strong> ${breach.assignedTo || "Unassigned"}</p>
<p><a href="${process.env.VITE_APP_URL || "https://gigitekai.com"}/admin/helpdesk?ticketId=${breach.ticketId}">View Ticket in Helpdesk</a></p>
<hr />
<p><small>This is an automated alert from GigitekAI Helpdesk System</small></p>
    `;

    await sendEmail({
      to: process.env.OWNER_EMAIL || "support@gigitekai.com",
      subject: `🚨 SLA Breach Alert: Ticket #${breach.ticketId}`,
      html: emailContent,
    });
  } catch (err) {
    console.error("Failed to send SLA breach email:", err);
  }

  // Log alert in database
  try {
    const db = await getDb();
    if (db) {
      await db.execute(
        sql`INSERT INTO sla_breach_alerts (ticket_id, priority, minutes_overdue, alerted_at) 
            VALUES (${breach.ticketId}, ${breach.priority}, ${breach.minutesOverdue}, NOW())`
      );
    }
  } catch (err) {
    console.error("Failed to log SLA breach alert:", err);
  }

  // Notify owner via Manus notification API
  await notifyOwner({
    title: `SLA Breach: Ticket #${breach.ticketId}`,
    content: `${breach.ticketTitle} is ${formatSLAStatus(breach.minutesOverdue)}. Priority: ${breach.priority.toUpperCase()}`,
  });
}

export const slaBreachAlertsRouter = router({
  /**
   * Check all open tickets for SLA breaches
   * Called by scheduled cron job
   */
  checkSLABreaches: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { breachesDetected: 0, breaches: [] };

    // Query all open tickets
    const openTickets = await db.execute(
      sql`
        SELECT id, title, priority, created_at, assigned_to, client_email
        FROM helpdesk_tickets
        WHERE status IN ('open', 'in_progress')
        AND resolved_at IS NULL
        ORDER BY created_at ASC
      `
    );

    const breaches: SLABreach[] = [];

    for (const ticket of openTickets as any[]) {
      const { status, minutesRemaining } = calculateSLAStatus(
        ticket.priority,
        ticket.created_at
      );

      if (status === "breached") {
        // Check if we've already alerted for this breach in the last hour
        const recentAlert = await db.execute(
          sql`
            SELECT id FROM sla_breach_alerts
            WHERE ticket_id = ${ticket.id}
            AND alerted_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
            LIMIT 1
          `
        );

        if ((recentAlert as any[]).length === 0) {
          breaches.push({
            ticketId: ticket.id,
            ticketTitle: ticket.title,
            priority: ticket.priority,
            createdAt: ticket.created_at,
            minutesOverdue: Math.abs(minutesRemaining),
            assignedTo: ticket.assigned_to,
            clientEmail: ticket.client_email,
          });
        }
      }
    }

    // Send alerts for all breaches
    for (const breach of breaches) {
      await sendSLABreachAlert(breach);
    }

    return {
      breachesDetected: breaches.length,
      breaches,
    };
  }),

  /**
   * Get SLA status for a specific ticket
   */
  getTicketSLAStatus: protectedProcedure
    .input(z.object({ ticketId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const ticket = await db.execute(
        sql`
          SELECT id, title, priority, created_at, resolved_at, status
          FROM helpdesk_tickets
          WHERE id = ${input.ticketId}
          LIMIT 1
        `
      );

      if ((ticket as any[]).length === 0) {
        throw new Error("Ticket not found");
      }

      const t = (ticket as any[])[0];
      const { status, minutesRemaining } = calculateSLAStatus(
        t.priority,
        t.created_at,
        t.resolved_at
      );

      return {
        ticketId: t.id,
        title: t.title,
        priority: t.priority,
        status,
        minutesRemaining,
        formattedStatus: formatSLAStatus(minutesRemaining),
        createdAt: t.created_at,
        resolvedAt: t.resolved_at,
      };
    }),

  /**
   * Get SLA breach history
   */
  getSLABreachHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      if (ctx.user?.role !== "admin") {
        throw new Error("Admin access required");
      }

      const breaches = await db.execute(
        sql`
          SELECT sba.id, sba.ticket_id, sba.priority, sba.minutes_overdue, sba.alerted_at,
                 ht.title
          FROM sla_breach_alerts sba
          JOIN helpdesk_tickets ht ON sba.ticket_id = ht.id
          ORDER BY sba.alerted_at DESC
          LIMIT ${input.limit} OFFSET ${input.offset}
        `
      );

      return breaches;
    }),

  /**
   * Get SLA metrics dashboard
   */
  getSLAMetrics: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    if (ctx.user?.role !== "admin") {
      throw new Error("Admin access required");
    }

    // Total tickets
    const totalTickets = await db.execute(
      sql`SELECT COUNT(*) as count FROM helpdesk_tickets`
    );

    // Open tickets
    const openTickets = await db.execute(
      sql`SELECT COUNT(*) as count FROM helpdesk_tickets WHERE status IN ('open', 'in_progress')`
    );

    // Breached tickets
    const breachedTickets = await db.execute(
      sql`
        SELECT COUNT(DISTINCT ht.id) as count
        FROM helpdesk_tickets ht
        WHERE ht.status IN ('open', 'in_progress')
        AND ht.resolved_at IS NULL
      `
    );

    // Breach count (last 24 hours)
    const recentBreaches = await db.execute(
      sql`
        SELECT COUNT(*) as count FROM sla_breach_alerts
        WHERE alerted_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
      `
    );

    // SLA compliance rate
    const resolvedTickets = await db.execute(
      sql`
        SELECT COUNT(*) as count FROM helpdesk_tickets
        WHERE status = 'resolved' AND resolved_at IS NOT NULL
      `
    );

    const breachedResolved = await db.execute(
      sql`
        SELECT COUNT(DISTINCT sba.ticket_id) as count
        FROM sla_breach_alerts sba
        JOIN helpdesk_tickets ht ON sba.ticket_id = ht.id
        WHERE ht.status = 'resolved'
      `
    );

    const complianceRate =
      (resolvedTickets as any[])[0]?.count > 0
        ? (
            (((resolvedTickets as any[])[0]?.count -
              (breachedResolved as any[])[0]?.count) /
              (resolvedTickets as any[])[0]?.count) *
            100
          ).toFixed(1)
        : 100;

    return {
      totalTickets: (totalTickets as any[])[0]?.count || 0,
      openTickets: (openTickets as any[])[0]?.count || 0,
      recentBreaches: (recentBreaches as any[])[0]?.count || 0,
      complianceRate: parseFloat(complianceRate as any),
    };
  }),
});
