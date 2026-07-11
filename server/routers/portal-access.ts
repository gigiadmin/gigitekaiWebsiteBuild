/**
 * Portal Access Requests Router
 * Handles user account requests for the support portal.
 * Users submit a request → admin approves/denies → user gets email notification.
 */
import { router, publicProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { portalAccessRequests, users } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { sendEmail } from "../_core/email";
import { notifyOwner } from "../_core/notification";

export const portalAccessRouter = router({
  /** Public: submit a portal access request */
  request: publicProcedure
    .input(z.object({
      name: z.string().min(2).max(255),
      email: z.string().email().max(320),
      company: z.string().max(255).optional(),
      phone: z.string().max(50).optional(),
      reason: z.string().max(2000).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Check for duplicate pending request
      const existing = await db
        .select()
        .from(portalAccessRequests)
        .where(and(
          eq(portalAccessRequests.email, input.email),
          eq(portalAccessRequests.status, 'pending')
        ))
        .limit(1);

      if (existing.length > 0) {
        return { success: true, alreadyPending: true };
      }

      // Insert the request
      await db.insert(portalAccessRequests).values({
        name: input.name,
        email: input.email,
        company: input.company || null,
        phone: input.phone || null,
        reason: input.reason || null,
        status: 'pending',
      });

      // Notify admin via owner notification + email
      try {
        await notifyOwner({
          title: `New Support Portal Access Request`,
          content: `${input.name} (${input.email})${input.company ? ` from ${input.company}` : ''} has requested access to the support portal. Review and approve at https://gigitekai.com/admin/helpdesk`,
        });
      } catch (e) {
        console.error("[PortalAccess] Owner notify failed:", e);
      }

      // Send confirmation email to requester
      try {
        await sendEmail({
          to: input.email,
          subject: "Your GigitekAI Support Portal Access Request",
          html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#f5f5f5;margin:0;padding:0;">
  <div style="max-width:600px;margin:0 auto;background:white;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#0A0E1A 0%,#0F1A30 100%);color:#00D4FF;padding:24px;text-align:center;border-bottom:2px solid #00D4FF;">
      <h2 style="margin:0;font-size:22px;">Request Received ✓</h2>
    </div>
    <div style="padding:24px;">
      <p>Hi ${input.name},</p>
      <p>Thank you for requesting access to the <strong>GigitekAI Support Portal</strong>. Your request has been received and is currently under review.</p>
      <p>Our team typically reviews requests within <strong>1 business day</strong>. You'll receive an email once your account has been approved.</p>
      <p>In the meantime, you can browse our public Knowledge Base at <a href="https://gigitekai.com/kb" style="color:#00D4FF;">gigitekai.com/kb</a> for self-service support articles.</p>
      <p style="margin-top:24px;color:#666;font-size:13px;">If you have urgent support needs, please call us at <strong>(727) 382-6909</strong> or email <a href="mailto:support@gigitekai.com" style="color:#00D4FF;">support@gigitekai.com</a>.</p>
    </div>
    <div style="background:#f5f5f5;padding:16px;text-align:center;font-size:12px;color:#999;border-top:1px solid #e0e0e0;">
      GigitekAI LLC &bull; support@gigitekai.com &bull; (727) 382-6909
    </div>
  </div>
</body>
</html>`,
        });
      } catch (e) {
        console.error("[PortalAccess] Confirmation email failed:", e);
      }

      return { success: true, alreadyPending: false };
    }),

  /** Admin: list all portal access requests */
  list: adminProcedure
    .input(z.object({
      status: z.enum(['pending', 'approved', 'denied', 'all']).default('pending'),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const query = db
        .select()
        .from(portalAccessRequests)
        .orderBy(desc(portalAccessRequests.createdAt));

      if (input.status !== 'all') {
        return db
          .select()
          .from(portalAccessRequests)
          .where(eq(portalAccessRequests.status, input.status))
          .orderBy(desc(portalAccessRequests.createdAt));
      }

      return query;
    }),

  /** Admin: approve a portal access request */
  approve: adminProcedure
    .input(z.object({
      requestId: z.number(),
      reviewNote: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Get the request
      const [req] = await db
        .select()
        .from(portalAccessRequests)
        .where(eq(portalAccessRequests.id, input.requestId))
        .limit(1);

      if (!req) throw new Error("Request not found");

      // Find or create user account
      let userId: number | null = null;
      const existingUsers = await db
        .select()
        .from(users)
        .where(eq(users.email, req.email))
        .limit(1);

      if (existingUsers.length > 0) {
        // User already exists — just approve them
        userId = existingUsers[0].id;
        await db.update(users)
          .set({ approved: 1 })
          .where(eq(users.id, userId));
      }
      // Note: if user doesn't exist yet, they'll be approved on first OAuth login
      // via the approved flag being set when they complete OAuth

      // Update the request
      await db.update(portalAccessRequests)
        .set({
          status: 'approved',
          reviewedBy: ctx.user.email || 'admin',
          reviewedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
          reviewNote: input.reviewNote || null,
          userId: userId,
        })
        .where(eq(portalAccessRequests.id, input.requestId));

      // Send approval email
      try {
        await sendEmail({
          to: req.email,
          subject: "Your GigitekAI Support Portal Access Has Been Approved!",
          html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#f5f5f5;margin:0;padding:0;">
  <div style="max-width:600px;margin:0 auto;background:white;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#0A0E1A 0%,#0F1A30 100%);color:#00D4FF;padding:24px;text-align:center;border-bottom:2px solid #00D4FF;">
      <h2 style="margin:0;font-size:22px;">Access Approved! ✓</h2>
    </div>
    <div style="padding:24px;">
      <p>Hi ${req.name},</p>
      <p>Great news! Your request to access the <strong>GigitekAI Support Portal</strong> has been <strong style="color:#10b981;">approved</strong>.</p>
      <p>You can now log in and access all support features including:</p>
      <ul>
        <li>Submit and track support tickets</li>
        <li>Browse our full Knowledge Base</li>
        <li>AI-powered ticket analysis and self-service suggestions</li>
        <li>Real-time ticket status updates</li>
      </ul>
      <div style="text-align:center;margin:24px 0;">
        <a href="https://gigitekai.com/helpdesk" style="display:inline-block;background:linear-gradient(135deg,#00D4FF 0%,#0099CC 100%);color:#0A0E1A;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:700;font-size:16px;">Access Support Portal →</a>
      </div>
      ${input.reviewNote ? `<p style="background:#f0fdf4;border-left:4px solid #10b981;padding:12px;border-radius:4px;color:#166534;"><strong>Note from our team:</strong> ${input.reviewNote}</p>` : ''}
    </div>
    <div style="background:#f5f5f5;padding:16px;text-align:center;font-size:12px;color:#999;border-top:1px solid #e0e0e0;">
      GigitekAI LLC &bull; support@gigitekai.com &bull; (727) 382-6909
    </div>
  </div>
</body>
</html>`,
        });
      } catch (e) {
        console.error("[PortalAccess] Approval email failed:", e);
      }

      return { success: true };
    }),

  /** Admin: deny a portal access request */
  deny: adminProcedure
    .input(z.object({
      requestId: z.number(),
      reviewNote: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [req] = await db
        .select()
        .from(portalAccessRequests)
        .where(eq(portalAccessRequests.id, input.requestId))
        .limit(1);

      if (!req) throw new Error("Request not found");

      await db.update(portalAccessRequests)
        .set({
          status: 'denied',
          reviewedBy: ctx.user.email || 'admin',
          reviewedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
          reviewNote: input.reviewNote || null,
        })
        .where(eq(portalAccessRequests.id, input.requestId));

      // Send denial email
      try {
        await sendEmail({
          to: req.email,
          subject: "Update on Your GigitekAI Support Portal Access Request",
          html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#f5f5f5;margin:0;padding:0;">
  <div style="max-width:600px;margin:0 auto;background:white;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#0A0E1A 0%,#0F1A30 100%);color:#00D4FF;padding:24px;text-align:center;border-bottom:2px solid #00D4FF;">
      <h2 style="margin:0;font-size:22px;">Access Request Update</h2>
    </div>
    <div style="padding:24px;">
      <p>Hi ${req.name},</p>
      <p>Thank you for your interest in the GigitekAI Support Portal. After review, we were unable to approve your access request at this time.</p>
      ${input.reviewNote ? `<p style="background:#fef2f2;border-left:4px solid #ef4444;padding:12px;border-radius:4px;color:#991b1b;"><strong>Reason:</strong> ${input.reviewNote}</p>` : ''}
      <p>If you believe this was in error or would like to discuss further, please contact us at <a href="mailto:support@gigitekai.com" style="color:#00D4FF;">support@gigitekai.com</a> or call <strong>(727) 382-6909</strong>.</p>
    </div>
    <div style="background:#f5f5f5;padding:16px;text-align:center;font-size:12px;color:#999;border-top:1px solid #e0e0e0;">
      GigitekAI LLC &bull; support@gigitekai.com &bull; (727) 382-6909
    </div>
  </div>
</body>
</html>`,
        });
      } catch (e) {
        console.error("[PortalAccess] Denial email failed:", e);
      }

      return { success: true };
    }),

  /** Public: check request status by email */
  checkStatus: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      // Return the most recent request for this email
      const [req] = await db
        .select()
        .from(portalAccessRequests)
        .where(eq(portalAccessRequests.email, input.email))
        .orderBy(desc(portalAccessRequests.createdAt))
        .limit(1);

      if (!req) return null;

      return {
        status: req.status,
        name: req.name,
        company: req.company,
        createdAt: req.createdAt,
        reviewedAt: req.reviewedAt,
        reviewNote: req.reviewNote,
      };
    }),

  /** Admin: get pending count for badge */
  pendingCount: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { count: 0 };
    const rows = await db
      .select()
      .from(portalAccessRequests)
      .where(eq(portalAccessRequests.status, 'pending'));
    return { count: rows.length };
  }),
});
