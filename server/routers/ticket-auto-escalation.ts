/**
 * Ticket Auto-Escalation System
 * Automatically escalates tickets to senior technicians when SLA breach is imminent
 * Monitors tickets 30 minutes before SLA deadline
 */

import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { sendEmail } from "../_core/email";
import { notifyOwner } from "../_core/notification";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

// Escalation thresholds (minutes before SLA breach)
const ESCALATION_THRESHOLD = 30; // Escalate 30 mins before SLA breach

// Senior technician roles that can receive escalations
const SENIOR_ROLES = ["senior_technician", "lead", "manager"];

interface TicketEscalation {
  ticketId: number;
  ticketTitle: string;
  priority: string;
  currentAssignee?: string;
  minutesUntilBreach: number;
  escalatedTo?: string;
  escalatedAt: Date;
}

/**
 * Find available senior technicians for escalation
 */
async function findAvailableSeniorTechnician(): Promise<any | null> {
  const db = await getDb();
  if (!db) return null;

  // Find senior technician with lowest current ticket count
  const seniorTechs = await db.execute(
    sql`
      SELECT u.id, u.name, u.email, COUNT(ht.id) as ticket_count
      FROM users u
      LEFT JOIN helpdesk_tickets ht ON u.id = ht.assigned_to AND ht.status IN ('open', 'in_progress')
      WHERE u.role IN ('senior_technician', 'lead', 'manager')
      GROUP BY u.id, u.name, u.email
      ORDER BY ticket_count ASC
      LIMIT 1
    `
  );

  return (seniorTechs as any[])[0] || null;
}

/**
 * Send escalation notification to senior technician
 */
async function sendEscalationNotification(
  escalation: TicketEscalation,
  seniorTech: any
): Promise<void> {
  try {
    // Email notification
    const emailContent = `
<h2>🚨 Ticket Escalation Alert</h2>
<p><strong>Ticket:</strong> #${escalation.ticketId} - ${escalation.ticketTitle}</p>
<p><strong>Priority:</strong> ${escalation.priority.toUpperCase()}</p>
<p><strong>Status:</strong> Escalated from ${escalation.currentAssignee || "unassigned"}</p>
<p><strong>Time Until SLA Breach:</strong> ${escalation.minutesUntilBreach} minutes</p>
<p><strong>Action Required:</strong> This ticket requires immediate senior-level attention to prevent SLA breach.</p>
<p><a href="${process.env.VITE_APP_URL || "https://gigitekai.com"}/admin/helpdesk?ticketId=${escalation.ticketId}">View Ticket in Helpdesk</a></p>
<hr />
<p><small>This is an automated escalation from GigitekAI Helpdesk System</small></p>
    `;

    await sendEmail({
      to: seniorTech.email,
      subject: `🚨 Escalation: Ticket #${escalation.ticketId} - ${escalation.priority.toUpperCase()} Priority`,
      html: emailContent,
    });

    // Notify owner
    await notifyOwner({
      title: `Ticket Escalated: #${escalation.ticketId}`,
      content: `Escalated to ${seniorTech.name} due to imminent SLA breach (${escalation.minutesUntilBreach} mins remaining)`,
    });
  } catch (err) {
    console.error("Failed to send escalation notification:", err);
  }
}

export const ticketAutoEscalationRouter = router({
  /**
   * Check for tickets that need escalation
   * Called by scheduled cron job every 10 minutes
   */
  checkForEscalations: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { escalationsTriggered: 0, escalations: [] };

    // Get SLA thresholds
    const SLA_THRESHOLDS = {
      critical: 60,
      high: 240,
      medium: 1440,
      low: 2880,
    };

    // Find all open tickets approaching SLA breach
    const openTickets = await db.execute(
      sql`
        SELECT id, title, priority, created_at, assigned_to, client_email
        FROM helpdesk_tickets
        WHERE status IN ('open', 'in_progress')
        AND resolved_at IS NULL
        ORDER BY created_at ASC
      `
    );

    const escalations: TicketEscalation[] = [];

    for (const ticket of openTickets as any[]) {
      const threshold =
        SLA_THRESHOLDS[ticket.priority as keyof typeof SLA_THRESHOLDS] ||
        SLA_THRESHOLDS.medium;
      const createdTime = new Date(ticket.created_at).getTime();
      const nowTime = new Date().getTime();
      const elapsedMinutes = (nowTime - createdTime) / (1000 * 60);
      const minutesUntilBreach = threshold - elapsedMinutes;

      // Check if ticket is within escalation threshold and not already escalated recently
      if (
        minutesUntilBreach > 0 &&
        minutesUntilBreach <= ESCALATION_THRESHOLD
      ) {
        // Check if we've already escalated this ticket in the last 2 hours
        const recentEscalation = await db.execute(
          sql`
            SELECT id FROM ticket_escalations
            WHERE ticket_id = ${ticket.id}
            AND escalated_at > DATE_SUB(NOW(), INTERVAL 2 HOUR)
            LIMIT 1
          `
        );

        if ((recentEscalation as any[]).length === 0) {
          escalations.push({
            ticketId: ticket.id,
            ticketTitle: ticket.title,
            priority: ticket.priority,
            currentAssignee: ticket.assigned_to,
            minutesUntilBreach: Math.round(minutesUntilBreach),
            escalatedAt: new Date(),
          });
        }
      }
    }

    // Process escalations
    for (const escalation of escalations) {
      const seniorTech = await findAvailableSeniorTechnician();

      if (seniorTech) {
        // Update ticket assignment
        await db.execute(
          sql`UPDATE helpdesk_tickets SET assigned_to = ${seniorTech.id} WHERE id = ${escalation.ticketId}`
        );

        // Log escalation
        await db.execute(
          sql`
            INSERT INTO ticket_escalations (ticket_id, escalated_from, escalated_to, reason, escalated_at)
            VALUES (${escalation.ticketId}, ${escalation.currentAssignee || null}, ${seniorTech.id}, 'SLA_BREACH_IMMINENT', NOW())
          `
        );

        escalation.escalatedTo = seniorTech.name;

        // Send notification
        await sendEscalationNotification(escalation, seniorTech);
      }
    }

    return {
      escalationsTriggered: escalations.length,
      escalations,
    };
  }),

  /**
   * Get escalation history for a ticket
   */
  getTicketEscalationHistory: protectedProcedure
    .input(z.object({ ticketId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const history = await db.execute(
        sql`
          SELECT te.id, te.escalated_from, te.escalated_to, te.reason, te.escalated_at,
                 u1.name as from_name, u2.name as to_name
          FROM ticket_escalations te
          LEFT JOIN users u1 ON te.escalated_from = u1.id
          LEFT JOIN users u2 ON te.escalated_to = u2.id
          WHERE te.ticket_id = ${input.ticketId}
          ORDER BY te.escalated_at DESC
        `
      );

      return history;
    }),

  /**
   * Get escalation metrics
   */
  getEscalationMetrics: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    if (ctx.user?.role !== "admin") {
      throw new Error("Admin access required");
    }

    // Total escalations (last 30 days)
    const totalEscalations = await db.execute(
      sql`
        SELECT COUNT(*) as count FROM ticket_escalations
        WHERE escalated_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
      `
    );

    // Escalations by reason
    const byReason = await db.execute(
      sql`
        SELECT reason, COUNT(*) as count FROM ticket_escalations
        WHERE escalated_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY reason
      `
    );

    // Average time to escalation (minutes after ticket creation)
    const avgTimeToEscalation = await db.execute(
      sql`
        SELECT AVG(TIMESTAMPDIFF(MINUTE, ht.created_at, te.escalated_at)) as avg_minutes
        FROM ticket_escalations te
        JOIN helpdesk_tickets ht ON te.ticket_id = ht.id
        WHERE te.escalated_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
      `
    );

    // Resolution rate after escalation
    const resolvedAfterEscalation = await db.execute(
      sql`
        SELECT COUNT(DISTINCT te.ticket_id) as count
        FROM ticket_escalations te
        JOIN helpdesk_tickets ht ON te.ticket_id = ht.id
        WHERE te.escalated_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND ht.status IN ('resolved', 'closed')
      `
    );

    return {
      totalEscalations: (totalEscalations as any[])[0]?.count || 0,
      byReason: byReason || [],
      avgTimeToEscalationMinutes:
        Math.round((avgTimeToEscalation as any[])[0]?.avg_minutes || 0),
      resolvedAfterEscalation: (resolvedAfterEscalation as any[])[0]?.count || 0,
    };
  }),
});
