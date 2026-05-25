/**
 * Client Satisfaction Survey System
 * Sends post-session surveys to clients and collects CSAT feedback
 * Integrates with ticket resolution and remote sessions
 */

import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { sendEmail } from "../_core/email";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

// Survey token expiry (7 days)
const SURVEY_TOKEN_EXPIRY_HOURS = 168;

/**
 * Generate unique survey token
 */
function generateSurveyToken(): string {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}

/**
 * Send satisfaction survey email to client
 */
async function sendSatisfactionSurvey(
  clientEmail: string,
  clientName: string,
  ticketId: number,
  ticketTitle: string,
  technicianName: string,
  surveyToken: string
): Promise<boolean> {
  try {
    const surveyUrl = `${process.env.VITE_APP_URL || "https://gigitekai.com"}/survey/${surveyToken}`;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0A0E1A;font-family:Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px">
    <!-- Header -->
    <div style="background:#0F1419;border:1px solid #1e293b;border-radius:12px;padding:24px;margin-bottom:24px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
        <span style="background:#00D4FF20;border-radius:8px;padding:6px 12px;color:#00D4FF;font-weight:bold">GigitekAI</span>
        <span style="color:#64748b;font-size:14px">Support Survey</span>
      </div>
      <p style="color:#94a3b8;font-size:13px;margin:0">We'd love to hear about your experience</p>
    </div>

    <!-- Main Content -->
    <div style="background:#0F1419;border:1px solid #1e293b;border-radius:12px;padding:24px;margin-bottom:16px">
      <p style="color:#e2e8f0;font-size:16px;margin:0 0 16px">Hi ${clientName},</p>
      
      <p style="color:#cbd5e1;font-size:14px;margin:0 0 16px">
        Thank you for choosing GigitekAI support! We recently resolved your ticket:
      </p>
      
      <div style="background:#1a1f2e;border-left:3px solid #00D4FF;padding:12px;margin:16px 0;border-radius:4px">
        <p style="color:#00D4FF;font-weight:bold;margin:0 0 4px">#${ticketId}</p>
        <p style="color:#cbd5e1;font-size:13px;margin:0">${ticketTitle}</p>
        <p style="color:#94a3b8;font-size:12px;margin:4px 0 0">Assisted by: ${technicianName}</p>
      </div>

      <p style="color:#cbd5e1;font-size:14px;margin:16px 0">
        Your feedback helps us improve our service quality. Please take 2 minutes to rate your experience:
      </p>

      <!-- CTA Button -->
      <div style="text-align:center;margin:24px 0">
        <a href="${surveyUrl}" style="display:inline-block;background:#00D4FF;color:#0A0E1A;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px">
          Take the Survey
        </a>
      </div>

      <p style="color:#64748b;font-size:12px;margin:16px 0 0">
        Or copy and paste this link: <br />
        <span style="color:#94a3b8;word-break:break-all">${surveyUrl}</span>
      </p>
    </div>

    <!-- Footer -->
    <p style="color:#334155;font-size:12px;text-align:center">
      GigitekAI Support Team · support@gigitek.com · (727) 382-6909
    </p>
  </div>
</body>
</html>`;

    await sendEmail({
      to: clientEmail,
      subject: `How did we do? Share your feedback - Ticket #${ticketId}`,
      html,
    });

    return true;
  } catch (err) {
    console.error("Failed to send satisfaction survey:", err);
    return false;
  }
}

export const clientSatisfactionSurveyRouter = router({
  /**
   * Create and send a satisfaction survey for a ticket
   */
  createAndSendSurvey: protectedProcedure
    .input(
      z.object({
        ticketId: z.number(),
        clientEmail: z.string().email(),
        clientName: z.string(),
        technicianName: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Check if user is admin or assigned technician
      if (ctx.user?.role !== "admin") {
        throw new Error("Admin access required to send surveys");
      }

      // Get ticket details
      const ticketResult = await db.execute(
        sql`SELECT id, title FROM helpdesk_tickets WHERE id = ${input.ticketId}`
      );

      if ((ticketResult as any[]).length === 0) {
        throw new Error("Ticket not found");
      }

      const ticket = (ticketResult as any[])[0];

      // Generate survey token
      const surveyToken = generateSurveyToken();
      const expiresAt = new Date(
        Date.now() + SURVEY_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000
      );

      // Store survey in database
      await db.execute(
        sql`
          INSERT INTO client_satisfaction_surveys (ticket_id, survey_token, client_email, technician_name, expires_at, created_at)
          VALUES (${input.ticketId}, ${surveyToken}, ${input.clientEmail}, ${input.technicianName}, ${expiresAt}, NOW())
        `
      );

      // Send survey email
      const sent = await sendSatisfactionSurvey(
        input.clientEmail,
        input.clientName,
        input.ticketId,
        ticket.title,
        input.technicianName,
        surveyToken
      );

      return {
        success: sent,
        surveyToken,
        expiresAt: expiresAt.toISOString(),
        message: sent
          ? "Survey sent successfully"
          : "Survey created but email delivery failed",
      };
    }),

  /**
   * Submit survey response
   */
  submitSurveyResponse: publicProcedure
    .input(
      z.object({
        surveyToken: z.string(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
        wouldRecommend: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Validate token
      const surveyResult = await db.execute(
        sql`
          SELECT id, ticket_id, expires_at, submitted_at
          FROM client_satisfaction_surveys
          WHERE survey_token = ${input.surveyToken}
          LIMIT 1
        `
      );

      if ((surveyResult as any[]).length === 0) {
        throw new Error("Survey not found or invalid token");
      }

      const survey = (surveyResult as any[])[0];

      // Check if already submitted
      if (survey.submitted_at) {
        throw new Error("Survey already submitted");
      }

      // Check if expired
      if (new Date(survey.expires_at) < new Date()) {
        throw new Error("Survey has expired");
      }

      // Update survey with response
      await db.execute(
        sql`
          UPDATE client_satisfaction_surveys
          SET rating = ${input.rating},
              comment = ${input.comment || null},
              would_recommend = ${input.wouldRecommend || null},
              submitted_at = NOW()
          WHERE id = ${survey.id}
        `
      );

      return {
        success: true,
        message: "Thank you for your feedback!",
        ticketId: survey.ticket_id,
      };
    }),

  /**
   * Get survey response
   */
  getSurveyResponse: publicProcedure
    .input(z.object({ surveyToken: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const survey = await db.execute(
        sql`
          SELECT id, ticket_id, rating, comment, would_recommend, submitted_at, expires_at
          FROM client_satisfaction_surveys
          WHERE survey_token = ${input.surveyToken}
          LIMIT 1
        `
      );

      if ((survey as any[]).length === 0) {
        return null;
      }

      const s = (survey as any[])[0];
      return {
        ticketId: s.ticket_id,
        rating: s.rating,
        comment: s.comment,
        wouldRecommend: s.would_recommend,
        submitted: !!s.submitted_at,
        expiresAt: s.expires_at,
      };
    }),

  /**
   * Get CSAT metrics
   */
  getCSATMetrics: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    if (ctx.user?.role !== "admin") {
      throw new Error("Admin access required");
    }

    // Overall CSAT (last 30 days)
    const overallCSAT = await db.execute(
      sql`
        SELECT AVG(rating) as avg_rating, COUNT(*) as total_responses
        FROM client_satisfaction_surveys
        WHERE submitted_at IS NOT NULL
        AND submitted_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
      `
    );

    // Rating distribution
    const ratingDistribution = await db.execute(
      sql`
        SELECT rating, COUNT(*) as count
        FROM client_satisfaction_surveys
        WHERE submitted_at IS NOT NULL
        AND submitted_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY rating
        ORDER BY rating DESC
      `
    );

    // NPS calculation (promoters - detractors / total)
    const npsData = await db.execute(
      sql`
        SELECT
          SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END) as promoters,
          SUM(CASE WHEN rating <= 2 THEN 1 ELSE 0 END) as detractors,
          COUNT(*) as total
        FROM client_satisfaction_surveys
        WHERE submitted_at IS NOT NULL
        AND submitted_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
      `
    );

    const npsStats = (npsData as any[])[0];
    const npsScore =
      npsStats.total > 0
        ? Math.round(
            ((npsStats.promoters - npsStats.detractors) / npsStats.total) * 100
          )
        : 0;

    // Would recommend percentage
    const recommendData = await db.execute(
      sql`
        SELECT
          SUM(CASE WHEN would_recommend = true THEN 1 ELSE 0 END) as would_recommend,
          COUNT(*) as total
        FROM client_satisfaction_surveys
        WHERE submitted_at IS NOT NULL
        AND submitted_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
      `
    );

    const recommendStats = (recommendData as any[])[0];
    const recommendPercentage =
      recommendStats.total > 0
        ? Math.round(
            (recommendStats.would_recommend / recommendStats.total) * 100
          )
        : 0;

    // Top comments
    const topComments = await db.execute(
      sql`
        SELECT comment, rating, submitted_at
        FROM client_satisfaction_surveys
        WHERE submitted_at IS NOT NULL
        AND comment IS NOT NULL
        AND comment != ''
        AND submitted_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
        ORDER BY submitted_at DESC
        LIMIT 10
      `
    );

    // By technician
    const byTechnician = await db.execute(
      sql`
        SELECT technician_name, AVG(rating) as avg_rating, COUNT(*) as responses
        FROM client_satisfaction_surveys
        WHERE submitted_at IS NOT NULL
        AND submitted_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY technician_name
        ORDER BY avg_rating DESC
      `
    );

    return {
      overallCSAT: {
        avgRating: Number(
          ((overallCSAT as any[])[0]?.avg_rating || 0).toFixed(2)
        ),
        totalResponses: (overallCSAT as any[])[0]?.total_responses || 0,
      },
      ratingDistribution: ratingDistribution || [],
      npsScore,
      recommendPercentage,
      topComments: topComments || [],
      byTechnician: byTechnician || [],
    };
  }),

  /**
   * Auto-send surveys for recently resolved tickets
   * Called by scheduled cron job
   */
  autoSendSurveysForResolvedTickets: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { surveysSent: 0 };

    // Find tickets resolved in the last hour without surveys
    const resolvedTickets = await db.execute(
      sql`
        SELECT ht.id, ht.title, ht.client_email, ht.assigned_to, u.name as technician_name
        FROM helpdesk_tickets ht
        LEFT JOIN users u ON ht.assigned_to = u.id
        LEFT JOIN client_satisfaction_surveys css ON ht.id = css.ticket_id
        WHERE ht.status IN ('resolved', 'closed')
        AND ht.resolved_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
        AND css.id IS NULL
        AND ht.client_email IS NOT NULL
        AND ht.client_email != ''
      `
    );

    let surveysSent = 0;

    for (const ticket of resolvedTickets as any[]) {
      try {
        const surveyToken = Math.random().toString(36).substring(2, 15) +
          Math.random().toString(36).substring(2, 15);
        const expiresAt = new Date(
          Date.now() + SURVEY_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000
        );

        // Store survey
        await db.execute(
          sql`
            INSERT INTO client_satisfaction_surveys (ticket_id, survey_token, client_email, technician_name, expires_at, created_at)
            VALUES (${ticket.id}, ${surveyToken}, ${ticket.client_email}, ${ticket.technician_name || "Support Team"}, ${expiresAt}, NOW())
          `
        );

        // Send email
        const sent = await sendSatisfactionSurvey(
          ticket.client_email,
          ticket.client_email.split("@")[0],
          ticket.id,
          ticket.title,
          ticket.technician_name || "Support Team",
          surveyToken
        );

        if (sent) surveysSent++;
      } catch (err) {
        console.error(`Failed to auto-send survey for ticket ${ticket.id}:`, err);
      }
    }

    return { surveysSent };
  }),
});
