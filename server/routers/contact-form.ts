/**
 * Contact Form Router
 * Handles public contact form submissions from gigitekai.com
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { contactSubmissions } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { sendEmail } from "../_core/email";
import { notifyOwner } from "../_core/notification";

export const contactFormRouter = router({
  /**
   * Submit contact form from public website
   * Stores submission and sends notifications
   */
  submitForm: publicProcedure
    .input(
      z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        company: z.string().optional().default(""),
        phone: z.string().optional().default(""),
        subject: z.string().min(5, "Subject must be at least 5 characters").optional(),
        message: z.string().min(10, "Message must be at least 10 characters"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        // Insert contact submission
        const result = await db.insert(contactSubmissions).values({
          name: input.name,
          email: input.email,
          company: input.company || null,
          phone: input.phone || null,
          subject: input.subject || "Website Contact Form",
          message: input.message,
        } as any);

        const submissionId = result[0];

        // Send confirmation email to user
        try {
          await sendEmail({
            to: input.email,
            subject: "We received your message — GigitekAI",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #0A0E1A 0%, #0F1A30 100%); color: #00D4FF; padding: 24px; text-align: center; border-bottom: 2px solid #00D4FF;">
                  <h2 style="margin: 0; font-size: 22px;">Thank you for contacting GigitekAI</h2>
                </div>
                <div style="padding: 24px; background: #f5f5f5;">
                  <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi ${input.name},</p>
                  <p style="color: #333; font-size: 16px; line-height: 1.6;">
                    We've received your message and will get back to you within 24 business hours.
                  </p>
                  <p style="color: #666; font-size: 14px; margin-top: 16px;">
                    <strong>Your Message:</strong><br/>
                    ${input.message.replace(/\n/g, '<br/>')}
                  </p>
                  <p style="color: #666; font-size: 14px; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 12px;">
                    If you need immediate assistance, please call us at <a href="tel:+17273826909" style="color: #0099CC; text-decoration: none;">+1 (727) 382-6909</a>
                  </p>
                </div>
                <div style="background: #f5f5f5; padding: 16px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #e0e0e0;">
                  <p style="margin: 0;">GigitekAI • Enterprise Cloud & AI Solutions</p>
                  <p style="margin: 4px 0 0;">support@gigitekai.com • +1 (727) 382-6909</p>
                </div>
              </div>
            `,
          });
        } catch (emailError) {
          console.warn("[Contact Form] Failed to send confirmation email:", emailError);
        }

        // Notify owner
        try {
          await notifyOwner({
            title: `📧 New Contact Form Submission from ${input.name}`,
            content: `
Name: ${input.name}
Email: ${input.email}
Company: ${input.company || "Not provided"}
Phone: ${input.phone || "Not provided"}
Subject: ${input.subject || "Website Contact Form"}

Message:
${input.message}

Submission ID: #${submissionId}
Time: ${new Date().toISOString()}
            `,
          });
        } catch (notifyError) {
          console.warn("[Contact Form] Failed to notify owner:", notifyError);
        }

        return {
          success: true,
          id: submissionId,
          message: "Thank you for your message. We will get back to you soon!",
        };
      } catch (error) {
        console.error("[Contact Form] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to submit contact form",
        });
      }
    }),

  /**
   * Get contact submissions (admin only)
   */
  getSubmissions: adminProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
        status: z.enum(["new", "in-progress", "resolved", "spam"]).optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        const offset = (input.page - 1) * input.limit;

        // Get submissions
        const submissions = await db
          .select()
          .from(contactSubmissions)
          .limit(input.limit)
          .offset(offset);

        // Get total count
        const countResult = await db
          .select()
          .from(contactSubmissions);

        return {
          submissions,
          total: countResult.length,
          page: input.page,
          limit: input.limit,
          pages: Math.ceil(countResult.length / input.limit),
        };
      } catch (error) {
        console.error("[Contact Form] Error fetching submissions:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch submissions",
        });
      }
    }),
});
