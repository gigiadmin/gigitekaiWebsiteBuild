/**
 * Contact Form Router
 * Handles public contact form submissions from gigitekai.com
 */

import { z } from "zod";
import { publicProcedure, adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { contactSubmissions, callDraftTickets } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { sendEmail } from "../_core/email";
import { notifyOwner } from "../_core/notification";
import { sql } from "drizzle-orm";

// ─── Rate Limiting ──────────────────────────────────────────────────────────
// Prevent spam and Purview alerts by limiting submissions per email/IP
const submissionRateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 3; // max 3 submissions per window

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = submissionRateLimit.get(key);
  if (!entry || now > entry.resetAt) {
    submissionRateLimit.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  entry.count++;
  return true;
}

export const contactFormRouter = router({
  /**
   * Submit contact form from public website
   * Stores submission and sends notifications
   * Rate limited: 3 submissions per 15 minutes per email
   */
  submit: publicProcedure
    .input(
      z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        company: z.string().optional().default(""),
        phone: z.string().optional().default(""),
        subject: z.string().min(5, "Subject must be at least 5 characters").optional(),
        message: z.string().min(10, "Message must be at least 10 characters"),
        pricingTier: z.string().optional().default(""),
        companySize: z.string().optional().default(""),
        smsOptIn: z.boolean().optional().default(false),
        hearAboutUs: z.string().optional().default(""),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Rate limit by email address
      if (!checkRateLimit(input.email.toLowerCase())) {
        console.warn(`[Contact Form] Rate limit exceeded for ${input.email}`);
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many submissions. Please wait 15 minutes before trying again.",
        });
      }
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

        const submissionId = result[0]?.insertId || result[0];

        // AUTO-CREATE TICKET from contact submission
        try {
          const ticketResult = await db.insert(callDraftTickets).values({
            title: input.subject || "Website Contact Form",
            description: input.message,
            category: "general support",
            priority: "medium",
            status: "draft",
            source: "contact_form",
            requesterName: input.name,
            requesterEmail: input.email,
            requesterPhone: input.phone || null,
            requesterCompany: input.company || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any);

          console.log(`[Contact Form] Auto-created ticket from submission #${submissionId}`);
        } catch (ticketError) {
          console.warn(`[Contact Form] Failed to auto-create ticket from submission #${submissionId}:`, ticketError);
        }

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
                    We've received your message and will get back to you within 24 business hours. A support ticket has been created and assigned to our team for review.
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

        // Notify owner via Manus notification system
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

Submission ID: #${String(submissionId)}
Time: ${new Date().toISOString()}
            `,
          });
        } catch (notifyError) {
          console.warn("[Contact Form] Failed to notify owner:", notifyError);
        }

        // Send email to support@gigitekai.com
        try {
          await sendEmail({
            to: "support@gigitekai.com",
            subject: `New Contact Form Submission: ${input.subject || "Website Contact Form"} - ${input.name}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #0A0E1A 0%, #0F1A30 100%); color: #00D4FF; padding: 24px; text-align: center; border-bottom: 2px solid #00D4FF;">
                  <h2 style="margin: 0; font-size: 22px;">📧 New Contact Form Submission</h2>
                </div>
                <div style="padding: 24px; background: #f5f5f5;">
                  <p style="color: #333; font-size: 16px; line-height: 1.6;"><strong>From:</strong> ${input.name}</p>
                  <p style="color: #333; font-size: 16px; line-height: 1.6;"><strong>Email:</strong> <a href="mailto:${input.email}" style="color: #0099CC; text-decoration: none;">${input.email}</a></p>
                  ${input.company ? `<p style="color: #333; font-size: 16px; line-height: 1.6;"><strong>Company:</strong> ${input.company}</p>` : ''}
                  ${input.phone ? `<p style="color: #333; font-size: 16px; line-height: 1.6;"><strong>Phone:</strong> <a href="tel:${input.phone}" style="color: #0099CC; text-decoration: none;">${input.phone}</a></p>` : ''}
                  <p style="color: #333; font-size: 16px; line-height: 1.6; margin-top: 20px;"><strong>Subject:</strong> ${input.subject || "Website Contact Form"}</p>
                  <p style="color: #333; font-size: 16px; line-height: 1.6; margin-top: 20px;"><strong>Message:</strong></p>
                  <div style="background: #fff; padding: 16px; border-left: 4px solid #00D4FF; margin-top: 12px;">
                    <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${input.message}</p>
                  </div>
                  <p style="color: #666; font-size: 14px; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 12px;">
                    <strong>Submission ID:</strong> #${String(submissionId)}<br/>
                    <strong>Received:</strong> ${new Date().toLocaleString()}<br/>
                    <strong>Status:</strong> Draft ticket created in helpdesk system
                  </p>
                </div>
                <div style="background: #f5f5f5; padding: 16px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #e0e0e0;">
                  <p style="margin: 0;">GigitekAI • Enterprise Cloud & AI Solutions</p>
                  <p style="margin: 4px 0 0;">support@gigitekai.com • +1 (727) 382-6909</p>
                </div>
              </div>
            `,
          });
        } catch (supportEmailError) {
          console.warn("[Contact Form] Failed to send email to support@gigitekai.com:", supportEmailError);
        }

        return {
          success: true,
          id: String(submissionId),
          message: "Thank you for your message. We will get back to you soon! A support ticket has been created and will appear in our system for review.",
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
  list: adminProcedure
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
        const submissions = await db
          .select()
          .from(contactSubmissions)
          .limit(input.limit)
          .offset((input.page - 1) * input.limit);
        return submissions;
      } catch (error) {
        console.error("[Contact Form] Error fetching submissions:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch submissions",
        });
      }
    }),

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
