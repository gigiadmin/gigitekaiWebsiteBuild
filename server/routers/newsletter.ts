/**
 * Newsletter Router
 * Public:  subscribe, unsubscribe (token-based)
 * Admin:   listSubscribers, subscriberStats, deleteSubscriber, exportCsv,
 *          sendCampaign, listCampaigns,
 *          saveDraft, updateDraft, deleteDraft, scheduleCampaign, cancelSchedule,
 *          listDrafts, listScheduled
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { newsletterSubscribers, newsletterCampaigns } from "../../drizzle/schema";
import { eq, desc, and, lte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { notifyOwner } from "../_core/notification";
import { sendPublicFormSupportNotification } from "../_core/publicFormSupportNotification";
import { sendEmail } from "../_core/email";
import crypto from "crypto";

function requireAdmin(role: string | undefined) {
  if (role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/** Build a branded campaign HTML email */
export function buildCampaignEmail(opts: {
  subject: string;
  bodyHtml: string;
  recipientEmail: string;
  unsubscribeToken: string;
  siteUrl: string;
}): string {
  const unsubUrl = `${opts.siteUrl}/unsubscribe?token=${opts.unsubscribeToken}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${opts.subject}</title>
  <style>
    body{margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;}
    .wrapper{max-width:640px;margin:32px auto;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);}
    .header{background:linear-gradient(135deg,#0A0E1A 0%,#0F1A30 100%);padding:28px 32px;border-bottom:3px solid #00D4FF;}
    .logo-text{color:#00D4FF;font-size:22px;font-weight:700;letter-spacing:-0.5px;}
    .tagline{color:#8899AA;font-size:12px;margin-top:2px;}
    .content{padding:32px;color:#1a202c;font-size:15px;line-height:1.7;}
    .content h1,.content h2,.content h3{color:#0A0E1A;font-weight:700;}
    .content a{color:#00D4FF;}
    .content img{max-width:100%;border-radius:6px;}
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
    <div class="content">${opts.bodyHtml}</div>
    <div class="footer">
      <p style="margin:0 0 6px;">GigitekAI &bull; Cloud &amp; AI Solutions &bull; <a href="${opts.siteUrl}">${opts.siteUrl.replace(/^https?:\/\//, "")}</a></p>
      <p style="margin:0;">You're receiving this because you subscribed at gigitekai.com. &nbsp;<a href="${unsubUrl}">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`;
}

/** Core send logic — shared by sendCampaign and the background scheduler */
export async function executeCampaignSend(opts: {
  campaignId: number;
  subject: string;
  bodyHtml: string;
  siteUrl: string;
  sentBy?: string;
}) {
  const db = await getDb();
  if (!db) return { sentCount: 0, failedCount: 0, recipientCount: 0 };

  const subscribers = await db
    .select({
      id: newsletterSubscribers.id,
      email: newsletterSubscribers.email,
      unsubscribeToken: newsletterSubscribers.unsubscribeToken,
    })
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.active, 1));

  // Mark as sending
  await db
    .update(newsletterCampaigns)
    .set({ status: "sending", recipientCount: subscribers.length })
    .where(eq(newsletterCampaigns.id, opts.campaignId));

  let sentCount = 0;
  let failedCount = 0;

  for (const sub of subscribers) {
    const html = buildCampaignEmail({
      subject: opts.subject,
      bodyHtml: opts.bodyHtml,
      recipientEmail: sub.email,
      unsubscribeToken: sub.unsubscribeToken,
      siteUrl: opts.siteUrl,
    });
    const ok = await sendEmail({ to: sub.email, subject: opts.subject, html });
    if (ok) sentCount++; else failedCount++;
  }

  await db
    .update(newsletterCampaigns)
    .set({
      sentCount,
      failedCount,
      status: failedCount === subscribers.length && subscribers.length > 0 ? "failed" : "completed",
    })
    .where(eq(newsletterCampaigns.id, opts.campaignId));

  await notifyOwner({
    title: `Newsletter Campaign Sent: "${opts.subject}"`,
    content: `Campaign sent${opts.sentBy ? ` by ${opts.sentBy}` : ""}.\n\n- Recipients: ${subscribers.length}\n- Delivered: ${sentCount}\n- Failed: ${failedCount}`,
  }).catch(() => {});

  return { sentCount, failedCount, recipientCount: subscribers.length };
}

export const newsletterRouter = router({
  // ─── Public ───────────────────────────────────────────────────────────────

  subscribe: publicProcedure
    .input(z.object({ email: z.string().email(), source: z.string().max(500).optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Service temporarily unavailable" });

      const [existing] = await db
        .select({ id: newsletterSubscribers.id, active: newsletterSubscribers.active })
        .from(newsletterSubscribers)
        .where(eq(newsletterSubscribers.email, input.email.toLowerCase()))
        .limit(1);

      if (existing) {
        if (existing.active === 1) return { success: true, alreadySubscribed: true };
        await db.update(newsletterSubscribers).set({ active: 1 }).where(eq(newsletterSubscribers.id, existing.id));
        return { success: true, alreadySubscribed: false };
      }

      const token = generateToken();
      await db.insert(newsletterSubscribers).values({
        email: input.email.toLowerCase(),
        unsubscribeToken: token,
        source: input.source ?? null,
        active: 1,
      });

      // Send welcome email to new subscriber
      const siteUrl = "https://gigitekai.com";
      const unsubUrl = `${siteUrl}/unsubscribe?token=${token}`;
      const welcomeHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Welcome to GigitekAI Insights</title>
  <style>
    body{margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;}
    .wrapper{max-width:640px;margin:32px auto;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);}
    .header{background:linear-gradient(135deg,#0A0E1A 0%,#0F1A30 100%);padding:28px 32px;border-bottom:3px solid #00D4FF;}
    .logo-text{color:#00D4FF;font-size:22px;font-weight:700;letter-spacing:-0.5px;}
    .tagline{color:#8899AA;font-size:12px;margin-top:2px;}
    .content{padding:32px;color:#1a202c;font-size:15px;line-height:1.7;}
    .content h1{color:#0A0E1A;font-weight:700;margin-top:0;}
    .cta-btn{display:inline-block;background:#00D4FF;color:#0A0E1A;font-weight:700;padding:12px 28px;border-radius:6px;text-decoration:none;margin-top:16px;}
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
      <h1>Welcome to GigitekAI Insights!</h1>
      <p>Thank you for subscribing. You're now part of the GigitekAI community — where IT professionals and business leaders stay ahead of the curve on AI, cloud infrastructure, and cybersecurity.</p>
      <p><strong>What to expect:</strong></p>
      <ul>
        <li>Actionable insights on Microsoft 365, AI automation, and managed services</li>
        <li>Cloud strategy and cybersecurity best practices</li>
        <li>GigitekAI news, product updates, and exclusive content</li>
      </ul>
      <p>In the meantime, explore our latest articles:</p>
      <a href="${siteUrl}/blog" class="cta-btn">Read Our Blog &rarr;</a>
      <p style="margin-top:24px;">Questions? Reply to this email or contact us at <a href="mailto:support@gigitekai.com" style="color:#00D4FF;">support@gigitekai.com</a></p>
    </div>
    <div class="footer">
      <p style="margin:0 0 6px;">GigitekAI &bull; Cloud &amp; AI Solutions &bull; <a href="${siteUrl}">gigitekai.com</a></p>
      <p style="margin:0;">You're receiving this because you subscribed at gigitekai.com. &nbsp;<a href="${unsubUrl}">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`;

      const emailSent = await sendEmail({
        to: input.email.toLowerCase(),
        subject: "Welcome to GigitekAI Insights!",
        html: welcomeHtml,
        replyTo: "support@gigitekai.com",
      }).catch((err) => {
        console.error("[Newsletter] Welcome email failed to send:", err);
        return false;
      });

      if (!emailSent) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send welcome email. Please check your email address and try again.",
        });
      }

      await sendPublicFormSupportNotification({
        formName: "Insights Newsletter Subscription",
        submitterEmail: input.email.toLowerCase(),
        fields: {
          Email: input.email.toLowerCase(),
          Source: input.source,
          Status: "Subscribed",
        },
      });

      await notifyOwner({
        title: "New Newsletter Subscriber",
        content: `${input.email} just subscribed${input.source ? ` from ${input.source}` : ""}.`,
      }).catch(() => {});

      return { success: true, alreadySubscribed: false };
    }),

  unsubscribe: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Service temporarily unavailable" });

      const [sub] = await db
        .select({ id: newsletterSubscribers.id })
        .from(newsletterSubscribers)
        .where(eq(newsletterSubscribers.unsubscribeToken, input.token))
        .limit(1);

      if (!sub) throw new TRPCError({ code: "NOT_FOUND", message: "Invalid unsubscribe link" });
      await db.update(newsletterSubscribers).set({ active: 0 }).where(eq(newsletterSubscribers.id, sub.id));
      return { success: true };
    }),

  // ─── Admin: Subscribers ───────────────────────────────────────────────────

  listSubscribers: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.user.role);
    const db = await getDb();
    if (!db) return [];
    return db.select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.createdAt));
  }),

  subscriberStats: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.user.role);
    const db = await getDb();
    if (!db) return { total: 0, active: 0 };
    const all = await db.select({ active: newsletterSubscribers.active }).from(newsletterSubscribers);
    return { total: all.length, active: all.filter((s) => s.active).length };
  }),

  deleteSubscriber: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await db.delete(newsletterSubscribers).where(eq(newsletterSubscribers.id, input.id));
      return { success: true };
    }),

  exportCsv: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.user.role);
    const db = await getDb();
    if (!db) return { csv: "" };
    const rows = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.active, 1))
      .orderBy(desc(newsletterSubscribers.createdAt));
    const header = "email,source,subscribedAt";
    const lines = rows.map((r) => `"${r.email}","${r.source ?? ""}","${r.createdAt}"`);
    return { csv: [header, ...lines].join("\n") };
  }),

  // ─── Admin: Campaigns (send immediately) ─────────────────────────────────

  sendCampaign: protectedProcedure
    .input(z.object({
      subject: z.string().min(1).max(500),
      bodyHtml: z.string().min(1),
      siteUrl: z.string().url().default("https://gigitekai.com"),
      /** If provided, sends an existing draft/scheduled campaign */
      campaignId: z.number().int().positive().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const activeCount = await db
        .select({ active: newsletterSubscribers.active })
        .from(newsletterSubscribers)
        .where(eq(newsletterSubscribers.active, 1));

      if (activeCount.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No active subscribers to send to." });
      }

      let campaignId = input.campaignId;

      if (campaignId) {
        // Update existing draft/scheduled to sending
        await db.update(newsletterCampaigns)
          .set({ subject: input.subject, body: input.bodyHtml, status: "sending", scheduledAt: null })
          .where(eq(newsletterCampaigns.id, campaignId));
      } else {
        // Create new campaign record
        const [result] = await db.insert(newsletterCampaigns).values({
          subject: input.subject,
          body: input.bodyHtml,
          recipientCount: activeCount.length,
          sentCount: 0,
          failedCount: 0,
          status: "sending",
          sentBy: ctx.user.name ?? ctx.user.email ?? "admin",
        });
        // @ts-ignore
        campaignId = (result as any).insertId ?? 0;
      }

      const result = await executeCampaignSend({
        campaignId: campaignId!,
        subject: input.subject,
        bodyHtml: input.bodyHtml,
        siteUrl: input.siteUrl,
        sentBy: ctx.user.name ?? ctx.user.email ?? "admin",
      });

      return { success: true, ...result };
    }),

  listCampaigns: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.user.role);
    const db = await getDb();
    if (!db) return [];
    return db
      .select({
        id: newsletterCampaigns.id,
        subject: newsletterCampaigns.subject,
        recipientCount: newsletterCampaigns.recipientCount,
        sentCount: newsletterCampaigns.sentCount,
        failedCount: newsletterCampaigns.failedCount,
        status: newsletterCampaigns.status,
        sentBy: newsletterCampaigns.sentBy,
        scheduledAt: newsletterCampaigns.scheduledAt,
        createdAt: newsletterCampaigns.createdAt,
      })
      .from(newsletterCampaigns)
      .where(eq(newsletterCampaigns.status, "completed"))
      .orderBy(desc(newsletterCampaigns.createdAt))
      .limit(50);
  }),

  // ─── Admin: Drafts ────────────────────────────────────────────────────────

  saveDraft: protectedProcedure
    .input(z.object({
      subject: z.string().max(500).default(""),
      bodyHtml: z.string().default(""),
    }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [result] = await db.insert(newsletterCampaigns).values({
        subject: input.subject,
        body: input.bodyHtml,
        recipientCount: 0,
        sentCount: 0,
        failedCount: 0,
        status: "draft",
        sentBy: ctx.user.name ?? ctx.user.email ?? "admin",
      });
      // @ts-ignore
      const id: number = (result as any).insertId ?? 0;
      return { success: true, id };
    }),

  updateDraft: protectedProcedure
    .input(z.object({
      id: z.number().int().positive(),
      subject: z.string().max(500),
      bodyHtml: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [existing] = await db
        .select({ id: newsletterCampaigns.id, status: newsletterCampaigns.status })
        .from(newsletterCampaigns)
        .where(eq(newsletterCampaigns.id, input.id))
        .limit(1);

      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Draft not found" });
      if (existing.status !== "draft" && existing.status !== "scheduled") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only drafts and scheduled campaigns can be edited" });
      }

      await db.update(newsletterCampaigns)
        .set({ subject: input.subject, body: input.bodyHtml })
        .where(eq(newsletterCampaigns.id, input.id));

      return { success: true };
    }),

  deleteDraft: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [existing] = await db
        .select({ status: newsletterCampaigns.status })
        .from(newsletterCampaigns)
        .where(eq(newsletterCampaigns.id, input.id))
        .limit(1);

      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
      if (existing.status !== "draft" && existing.status !== "scheduled") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only drafts and scheduled campaigns can be deleted" });
      }

      await db.delete(newsletterCampaigns).where(eq(newsletterCampaigns.id, input.id));
      return { success: true };
    }),

  listDrafts: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.user.role);
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(newsletterCampaigns)
      .where(eq(newsletterCampaigns.status, "draft"))
      .orderBy(desc(newsletterCampaigns.updatedAt));
  }),

  // ─── Admin: Scheduled Campaigns ──────────────────────────────────────────

  scheduleCampaign: protectedProcedure
    .input(z.object({
      /** Existing draft ID to schedule, or omit to create new */
      id: z.number().int().positive().optional(),
      subject: z.string().min(1).max(500),
      bodyHtml: z.string().min(1),
      /** ISO 8601 datetime string — must be in the future */
      scheduledAt: z.string().datetime(),
      siteUrl: z.string().url().default("https://gigitekai.com"),
    }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const scheduledDate = new Date(input.scheduledAt);
      if (scheduledDate <= new Date()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Scheduled time must be in the future" });
      }

      if (input.id) {
        await db.update(newsletterCampaigns)
          .set({ subject: input.subject, body: input.bodyHtml, status: "scheduled", scheduledAt: scheduledDate instanceof Date ? scheduledDate.toISOString() : scheduledDate })
          .where(eq(newsletterCampaigns.id, input.id));
        return { success: true, id: input.id };
      }

      const [result] = await db.insert(newsletterCampaigns).values({
        subject: input.subject,
        body: input.bodyHtml,
        recipientCount: 0,
        sentCount: 0,
        failedCount: 0,
        status: "scheduled",
        sentBy: ctx.user.name ?? ctx.user.email ?? "admin",
        scheduledAt: scheduledDate instanceof Date ? scheduledDate.toISOString() : scheduledDate,
      });
      // @ts-ignore
      const id: number = (result as any).insertId ?? 0;
      return { success: true, id };
    }),

  cancelSchedule: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db.update(newsletterCampaigns)
        .set({ status: "draft", scheduledAt: null })
        .where(and(eq(newsletterCampaigns.id, input.id), eq(newsletterCampaigns.status, "scheduled")));

      return { success: true };
    }),

  listScheduled: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.user.role);
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(newsletterCampaigns)
      .where(eq(newsletterCampaigns.status, "scheduled"))
      .orderBy(newsletterCampaigns.scheduledAt);
  }),
});

// ─── Background Scheduler ────────────────────────────────────────────────────
// Checks every 60 seconds for scheduled campaigns that are due and sends them.
// Exported so server/index.ts can call startNewsletterScheduler() on boot.

export function startNewsletterScheduler(siteUrl = "https://gigitekai.com") {
  const INTERVAL_MS = 60_000; // 1 minute

  async function checkAndSend() {
    try {
      const db = await getDb();
      if (!db) return;

      const now = new Date();
      const due = await db
        .select()
        .from(newsletterCampaigns)
        .where(
          and(
            eq(newsletterCampaigns.status, "scheduled"),
            lte(newsletterCampaigns.scheduledAt, now.toISOString())
          )
        );

      for (const campaign of due) {
        console.log(`[Newsletter Scheduler] Sending scheduled campaign id=${campaign.id} "${campaign.subject}"`);
        await executeCampaignSend({
          campaignId: campaign.id,
          subject: campaign.subject,
          bodyHtml: campaign.body,
          siteUrl,
          sentBy: campaign.sentBy ?? "scheduler",
        });
      }
    } catch (err) {
      console.error("[Newsletter Scheduler] Error:", err);
    }
  }

  // Run immediately on boot, then every minute
  checkAndSend();
  setInterval(checkAndSend, INTERVAL_MS);
  console.log("[Newsletter Scheduler] Started — checking every 60s for scheduled campaigns");
}
