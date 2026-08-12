/**
 * Free Audit Router
 * Public: submit (create audit submission)
 * Admin: list, get, update, updateStatus
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { callDraftTickets, freeAuditSubmissions } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { notifyOwner } from "../_core/notification";
import { sendEmail } from "../_core/email";
import { resolveWebhookUrl, sendToTeamsWithRetry } from "../_core/teamsWebhookUtils";

const escapeHtml = (value: string | null | undefined): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export const buildFreeAuditSupportEmail = (
  input: {
    companyName: string;
    industry: string;
    description?: string;
    contactName: string;
    contactEmail: string;
    contactPhone?: string;
    auditType?: string;
    currentChallenges?: string;
    goals?: string;
  },
  submissionId: number | string
) => `
  <div style="font-family:Arial,sans-serif;max-width:720px;margin:0 auto;color:#0f172a;">
    <h2 style="color:#0891b2;">New Free Audit Request — Complete Details</h2>
    <table role="presentation" style="border-collapse:collapse;width:100%;margin:0 0 18px;">
      <tr><td style="padding:8px;border:1px solid #cbd5e1;font-weight:700;width:34%;">Contact</td><td style="padding:8px;border:1px solid #cbd5e1;">${escapeHtml(input.contactName)}</td></tr>
      <tr><td style="padding:8px;border:1px solid #cbd5e1;font-weight:700;">Email</td><td style="padding:8px;border:1px solid #cbd5e1;"><a href="mailto:${escapeHtml(input.contactEmail)}">${escapeHtml(input.contactEmail)}</a></td></tr>
      <tr><td style="padding:8px;border:1px solid #cbd5e1;font-weight:700;">Phone</td><td style="padding:8px;border:1px solid #cbd5e1;">${escapeHtml(input.contactPhone || "Not provided")}</td></tr>
      <tr><td style="padding:8px;border:1px solid #cbd5e1;font-weight:700;">Company</td><td style="padding:8px;border:1px solid #cbd5e1;">${escapeHtml(input.companyName)}</td></tr>
      <tr><td style="padding:8px;border:1px solid #cbd5e1;font-weight:700;">Industry</td><td style="padding:8px;border:1px solid #cbd5e1;">${escapeHtml(input.industry)}</td></tr>
      <tr><td style="padding:8px;border:1px solid #cbd5e1;font-weight:700;">Audit type</td><td style="padding:8px;border:1px solid #cbd5e1;">${escapeHtml(input.auditType || "General IT audit")}</td></tr>
      <tr><td style="padding:8px;border:1px solid #cbd5e1;font-weight:700;">Submission ID</td><td style="padding:8px;border:1px solid #cbd5e1;">${escapeHtml(String(submissionId))}</td></tr>
    </table>
    <h3>Business Description</h3>
    <pre style="white-space:pre-wrap;word-wrap:break-word;background:#f1f5f9;border:1px solid #cbd5e1;padding:14px;border-radius:6px;font-family:Arial,sans-serif;line-height:1.55;">${escapeHtml(input.description || "Not provided")}</pre>
    <h3>Current Challenges</h3>
    <pre style="white-space:pre-wrap;word-wrap:break-word;background:#f1f5f9;border:1px solid #cbd5e1;padding:14px;border-radius:6px;font-family:Arial,sans-serif;line-height:1.55;">${escapeHtml(input.currentChallenges || "Not provided")}</pre>
    <h3>Goals</h3>
    <pre style="white-space:pre-wrap;word-wrap:break-word;background:#f1f5f9;border:1px solid #cbd5e1;padding:14px;border-radius:6px;font-family:Arial,sans-serif;line-height:1.55;">${escapeHtml(input.goals || "Not provided")}</pre>
    <p><a href="https://gigitekai.com/admin/free-audits" style="background:#00D4FF;color:#0A0E1A;padding:10px 18px;text-decoration:none;border-radius:5px;display:inline-block;font-weight:700;">Review Free Audit Request</a></p>
  </div>`;

function requireAdmin(role: string | undefined) {
  if (role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
}

export const auditRouter = router({
  // ─── Public: Submit Audit Request ─────────────────────────────────────────

  submit: publicProcedure
    .input(
      z.object({
        companyName: z.string().min(1).max(255),
        industry: z.string().min(1).max(100),
        description: z.string().optional(),
        contactName: z.string().min(1).max(255),
        contactEmail: z.string().email().max(320),
        contactPhone: z.string().optional(),
        auditType: z.string().optional(),
        currentChallenges: z.string().optional(),
        goals: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      try {
        // Insert the submission
        const [result] = await db.insert(freeAuditSubmissions).values({
          companyName: input.companyName,
          industry: input.industry,
          description: input.description ?? null,
          contactName: input.contactName,
          contactEmail: input.contactEmail,
          contactPhone: input.contactPhone ?? null,
          auditType: input.auditType ?? null,
          currentChallenges: input.currentChallenges ?? null,
          goals: input.goals ?? null,
          status: "submitted",
        });

        const submissionId = (result as any).insertId;

        // Create a draft helpdesk ticket so every client-facing audit request has an operational follow-up record.
        try {
          await db.insert(callDraftTickets).values({
            callLogId: 0,
            title: `Free Audit Request — ${input.companyName}`,
            description: [
              `Free audit request #${submissionId}`,
              `Company: ${input.companyName}`,
              `Industry: ${input.industry}`,
              `Audit Type: ${input.auditType || "General IT audit"}`,
              `Description: ${input.description || "Not provided"}`,
              `Challenges: ${input.currentChallenges || "Not provided"}`,
              `Goals: ${input.goals || "Not provided"}`,
            ].join("\n"),
            category: "general_support",
            priority: "medium",
            reviewStatus: "pending",
            callerName: input.contactName,
            callerEmail: input.contactEmail,
            callerPhone: input.contactPhone || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as any);
        } catch (ticketErr) {
          console.error("[Audit] Draft ticket creation failed:", ticketErr);
        }

        // Send confirmation email to user
        const confirmationHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Free Audit Request Received</title>
  <style>
    body{margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;}
    .wrapper{max-width:640px;margin:32px auto;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);}
    .header{background:linear-gradient(135deg,#0A0E1A 0%,#0F1A30 100%);padding:28px 32px;border-bottom:3px solid #00D4FF;}
    .logo-text{color:#00D4FF;font-size:22px;font-weight:700;letter-spacing:-0.5px;}
    .tagline{color:#8899AA;font-size:12px;margin-top:2px;}
    .content{padding:32px;color:#1a202c;font-size:15px;line-height:1.7;}
    .content h1{color:#0A0E1A;font-weight:700;margin-top:0;}
    .content strong{color:#0A0E1A;}
    .footer{background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 32px;text-align:center;font-size:12px;color:#718096;}
    .footer a{color:#718096;}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo-text">GigitekAI</div>
      <div class="tagline">Cloud &amp; AI Solutions</div>
    </div>
    <div class="content">
      <h1>Free Audit Request Received</h1>
      <p>Thank you for submitting your free audit request, <strong>${input.contactName}</strong>!</p>
      <p>We've received your submission for <strong>${input.companyName}</strong> and our team is reviewing your request.</p>
      <p><strong>What happens next:</strong></p>
      <ul>
        <li>Our team will review your audit details within 24-48 hours</li>
        <li>We'll reach out to you at <strong>${input.contactEmail}</strong> to schedule a discovery call</li>
        <li>During the call, we'll discuss your challenges and goals in detail</li>
        <li>You'll receive a comprehensive audit report with recommendations</li>
      </ul>
      <p>If you have any questions in the meantime, feel free to reach out to us at <a href="mailto:support@gigitekai.com" style="color:#00D4FF;">support@gigitekai.com</a> or call <strong>(727) 382-6909</strong>.</p>
      <p>We look forward to helping you transform your IT infrastructure!</p>
    </div>
    <div class="footer">
      <p style="margin:0 0 6px;">GigitekAI &bull; Cloud &amp; AI Solutions &bull; <a href="https://gigitekai.com">gigitekai.com</a></p>
      <p style="margin:0;">© 2026 GigitekAI LLC. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

        await sendEmail({
          to: input.contactEmail,
          subject: "Free Audit Request Received - GigitekAI",
          html: confirmationHtml,
          replyTo: "support@gigitekai.com",
        }).catch((err) => {
          console.error("[Audit] Confirmation email failed:", err);
        });

        await sendEmail({
          to: "support@gigitekai.com",
          subject: `New Free Audit Request: ${input.companyName} — ${input.contactName}`,
          html: buildFreeAuditSupportEmail(input, submissionId),
          replyTo: input.contactEmail,
        }).catch((err) => {
          console.error("[Audit] Support notification email failed:", err);
        });

        try {
          const webhookUrl = resolveWebhookUrl("general_support");
          if (webhookUrl) {
            await sendToTeamsWithRetry(webhookUrl, {
              title: `New Free Audit Request: ${input.companyName}`,
              text: `Contact: ${input.contactName}\nEmail: ${input.contactEmail}\nIndustry: ${input.industry}\nAudit type: ${input.auditType || "General IT audit"}`,
              themeColor: "00D4FF",
            });
          }
        } catch (teamsErr) {
          console.error("[Audit] Teams notification failed:", teamsErr);
        }

        // Notify owner of new submission
        await notifyOwner({
          title: "New Free Audit Submission",
          content: `${input.contactName} from ${input.companyName} (${input.industry}) submitted a free audit request.`,
        }).catch(() => {});

        return { success: true, id: submissionId };
      } catch (err) {
        console.error("[Audit] Submission error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to submit audit request. Please try again.",
        });
      }
    }),

  // ─── Admin: List All Submissions ──────────────────────────────────────────

  list: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.user.role);
    const db = await getDb();
    if (!db) return [];

    return db
      .select()
      .from(freeAuditSubmissions)
      .orderBy(desc(freeAuditSubmissions.submittedAt));
  }),

  // ─── Admin: Get Single Submission ─────────────────────────────────────────

  get: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [submission] = await db
        .select()
        .from(freeAuditSubmissions)
        .where(eq(freeAuditSubmissions.id, input.id))
        .limit(1);

      if (!submission) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Audit submission not found" });
      }

      return submission;
    }),

  // ─── Admin: Update Submission ─────────────────────────────────────────────

  update: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        notes: z.string().optional(),
        assignedTo: z.number().int().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const updateData: any = {};
      if (input.notes !== undefined) updateData.notes = input.notes;
      if (input.assignedTo !== undefined) updateData.assignedTo = input.assignedTo;

      await db
        .update(freeAuditSubmissions)
        .set(updateData)
        .where(eq(freeAuditSubmissions.id, input.id));

      return { success: true };
    }),

  // ─── Admin: Update Status ─────────────────────────────────────────────────

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        status: z.enum(["submitted", "contacted", "in_progress", "completed", "archived"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const updateData: any = { status: input.status };

      // Set timestamp based on status
      if (input.status === "contacted") {
        updateData.contactedAt = new Date();
      } else if (input.status === "completed") {
        updateData.completedAt = new Date();
      }

      await db
        .update(freeAuditSubmissions)
        .set(updateData)
        .where(eq(freeAuditSubmissions.id, input.id));

      return { success: true };
    }),

    // ─── Public: Look Up Submission by Email ────────────────────────────────────
  getByEmail: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [submission] = await db
        .select()
        .from(freeAuditSubmissions)
        .where(eq(freeAuditSubmissions.contactEmail, input.email))
        .orderBy(desc(freeAuditSubmissions.submittedAt))
        .limit(1);
      return submission ?? null;
    }),

  // ─── Admin: Delete Submission ─────────────────────────────────────────────
  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db.delete(freeAuditSubmissions).where(eq(freeAuditSubmissions.id, input.id));

      return { success: true };
    }),
});
