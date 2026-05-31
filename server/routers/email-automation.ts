/**
 * Email Automation Router
 * tRPC procedures for managing auto-replies, meeting extraction, and executive summaries
 */

import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  generateWeeklyExecutiveSummary,
  classifyEmailForAutoReply,
  extractMeetingDetails,
} from "../email-automation";
import { sendEmail } from "../_core/emailService";

export const emailAutomationRouter = router({
  /**
   * Generate and send weekly executive summary to Archer
   */
  sendWeeklyExecutiveSummary: adminProcedure.mutation(async ({ ctx }) => {
    try {
      const { html, metrics } = await generateWeeklyExecutiveSummary();

      // Send to Archer (assuming archer@gigitekai.com)
      const success = await sendEmail({
        to: "archer@gigitekai.com",
        subject: `GigitekAI Weekly Executive Summary — ${new Date().toLocaleDateString()}`,
        body: "Weekly Executive Summary",
        html,
        replyTo: "support@gigitekai.com",
      });

      if (success) {
        console.log("[Email Automation] Weekly executive summary sent to Archer");
        return {
          success: true,
          message: "Executive summary sent to Archer",
          metrics,
        };
      } else {
        return {
          success: false,
          message: "Failed to send executive summary",
          metrics,
        };
      }
    } catch (error) {
      console.error("[Email Automation] Error sending executive summary:", error);
      return {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        metrics: null,
      };
    }
  }),

  /**
   * Classify an email for auto-reply
   */
  classifyEmailForAutoReply: adminProcedure
    .input(
      z.object({
        subject: z.string(),
        body: z.string(),
        from: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const classification = await classifyEmailForAutoReply(
          input.subject,
          input.body,
          input.from
        );
        return {
          success: true,
          classification,
        };
      } catch (error) {
        console.error("[Email Automation] Classification error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  /**
   * Extract meeting details from email
   */
  extractMeetingDetails: adminProcedure
    .input(
      z.object({
        subject: z.string(),
        body: z.string(),
        from: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const details = await extractMeetingDetails(
          input.subject,
          input.body,
          input.from
        );
        return {
          success: true,
          details,
        };
      } catch (error) {
        console.error("[Email Automation] Meeting extraction error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  /**
   * Get current weekly metrics
   */
  getWeeklyMetrics: adminProcedure.query(async ({ ctx }) => {
    try {
      const { metrics } = await generateWeeklyExecutiveSummary();
      return {
        success: true,
        metrics,
      };
    } catch (error) {
      console.error("[Email Automation] Error fetching metrics:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }),
});
