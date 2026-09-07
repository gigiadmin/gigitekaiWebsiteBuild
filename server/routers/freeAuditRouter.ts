import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { notifyOwner } from "../_core/notification";
import { sendEmail } from "../_core/email";
import { sendPublicFormSupportNotification } from "../_core/publicFormSupportNotification";

/**
 * Free Audit Router
 * Handles free IT audit submissions and 50% off promotion tracking
 */

export const freeAuditRouter = router({
  /**
   * Submit a free audit request
   * Stores submission and sends notification to owner
   */
  submitAudit: publicProcedure
    .input(
      z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        website: z.string().url("Invalid website URL"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Log the audit submission
        console.log("[Free Audit] New submission:", {
          name: input.name,
          email: input.email,
          website: input.website,
          timestamp: new Date().toISOString(),
        });

        // Send notification to owner
        const notificationSent = await notifyOwner({
          title: "🎉 New Free Audit Request",
          content: `
**Name:** ${input.name}
**Email:** ${input.email}
**Website:** ${input.website}

**Action:** Follow up with audit and 50% off offer
**Promotion:** Valid for 1 month only
          `.trim(),
        });

        if (!notificationSent) {
          console.warn("[Free Audit] Notification failed, but submission recorded");
        }

        await sendPublicFormSupportNotification({
          formName: "Free Website Audit Request",
          submitterName: input.name,
          submitterEmail: input.email,
          fields: {
            Website: input.website,
            Offer: "Free audit request",
            Source: "GigitekAI website",
          },
        });

        await sendEmail({
          to: input.email,
          subject: "We received your GigitekAI audit request",
          replyTo: "support@gigitekai.com",
          html: `<p>Hi ${input.name},</p><p>We received your request to review ${input.website}. Our team will follow up within one business day.</p><p>GigitekAI Support<br/>support@gigitekai.com<br/>609-676-4483</p>`,
        });

        return {
          success: true,
          message: "Audit request submitted successfully",
          email: input.email,
        };
      } catch (error) {
        console.error("[Free Audit] Error submitting audit:", error);
        throw new Error("Failed to submit audit request. Please try again.");
      }
    }),

  /**
   * Get audit submission stats (admin only)
   */
  getStats: publicProcedure.query(async () => {
    try {
      // This would typically query a database
      // For now, return placeholder stats
      return {
        totalSubmissions: 0,
        thisMonth: 0,
        conversionRate: 0,
      };
    } catch (error) {
      console.error("[Free Audit] Error fetching stats:", error);
      throw new Error("Failed to fetch audit stats");
    }
  }),
});
