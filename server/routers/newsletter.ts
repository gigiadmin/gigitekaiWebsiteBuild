/**
 * Newsletter Router
 * Public:  subscribe, unsubscribe (token-based)
 * Admin:   listSubscribers, subscriberStats, deleteSubscriber, exportCsv,
 *          sendCampaign, listCampaigns
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { newsletterSubscribers, newsletterCampaigns } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { notifyOwner } from "../_core/notification";
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
function buildCampaignEmail(opts: {
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
    .header-inner{display:flex;align-items:center;gap:12px;}
    .logo-text{color:#00D4FF;font-size:22px;font-weight:700;letter-spacing:-0.5px;}
    .tagline{color:#8899AA;font-size:12px;margin-top:2px;}
    .content{padding:32px;color:#1a202c;font-size:15px;line-height:1.7;}
    .content h1,.content h2,.content h3{color:#0A0E1A;font-weight:700;}
    .content a{color:#00D4FF;}
    .content img{max-width:100%;border-radius:6px;}
    .cta-btn{display:inline-block;background:#00D4FF;color:#0A0E1A!important;padding:12px 28px;border-radius:6px;font-weight:700;text-decoration:none;margin:16px 0;}
    .footer{background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 32px;text-align:center;font-size:12px;color:#718096;}
    .footer a{color:#718096;}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="header-inner">
        <div>
          <div class="logo-text">GigitekAI</div>
          <div class="tagline">Cloud &amp; AI Solutions</div>
        </div>
      </div>
    </div>
    <div class="content">
      ${opts.bodyHtml}
    </div>
    <div class="footer">
      <p style="margin:0 0 6px;">GigitekAI &bull; Cloud &amp; AI Solutions &bull; <a href="${opts.siteUrl}">${opts.siteUrl.replace(/^https?:\/\//, "")}</a></p>
      <p style="margin:0;">You're receiving this because you subscribed at gigitekai.com. &nbsp;<a href="${unsubUrl}">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`;
}

export const newsletterRouter = router({
  /** Subscribe a new email address (public) */
  subscribe: publicProcedure
    .input(
      z.object({
        email: z.string().email("Please enter a valid email address"),
        source: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Service temporarily unavailable" });

      const [existing] = await db
        .select({ id: newsletterSubscribers.id, active: newsletterSubscribers.active })
        .from(newsletterSubscribers)
        .where(eq(newsletterSubscribers.email, input.email.toLowerCase()))
        .limit(1);

      if (existing) {
        if (existing.active) return { success: true, alreadySubscribed: true };
        await db.update(newsletterSubscribers).set({ active: true }).where(eq(newsletterSubscribers.id, existing.id));
        return { success: true, alreadySubscribed: false };
      }

      const token = generateToken();
      await db.insert(newsletterSubscribers).values({
        email: input.email.toLowerCase(),
        unsubscribeToken: token,
        source: input.source ?? null,
        active: true,
      });

      await notifyOwner({
        title: "New Newsletter Subscriber",
        content: `${input.email} just subscribed to the GigitekAI newsletter${input.source ? ` from ${input.source}` : ""}.`,
      }).catch(() => {});

      return { success: true, alreadySubscribed: false };
    }),

  /** Unsubscribe via token (public) */
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

      await db.update(newsletterSubscribers).set({ active: false }).where(eq(newsletterSubscribers.id, sub.id));
      return { success: true };
    }),

  /** List all subscribers (admin only) */
  listSubscribers: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.user.role);
    const db = await getDb();
    if (!db) return [];
    return db.select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.createdAt));
  }),

  /** Subscriber count stats (admin only) */
  subscriberStats: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.user.role);
    const db = await getDb();
    if (!db) return { total: 0, active: 0 };
    const all = await db.select({ active: newsletterSubscribers.active }).from(newsletterSubscribers);
    return { total: all.length, active: all.filter((s) => s.active).length };
  }),

  /** Delete a subscriber (admin only) */
  deleteSubscriber: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await db.delete(newsletterSubscribers).where(eq(newsletterSubscribers.id, input.id));
      return { success: true };
    }),

  /** Export active subscribers as CSV (admin only) */
  exportCsv: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.user.role);
    const db = await getDb();
    if (!db) return { csv: "" };
    const rows = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.active, true))
      .orderBy(desc(newsletterSubscribers.createdAt));
    const header = "email,source,subscribedAt";
    const lines = rows.map((r) => `"${r.email}","${r.source ?? ""}","${r.createdAt.toISOString()}"`);
    return { csv: [header, ...lines].join("\n") };
  }),

  // ─────────────────────────────────────────────────────────────────────────
  // BROADCAST / CAMPAIGNS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Send a campaign email to all active subscribers.
   * Runs synchronously (sequential sends) and logs the result.
   */
  sendCampaign: protectedProcedure
    .input(
      z.object({
        subject: z.string().min(1, "Subject is required").max(500),
        /** HTML body — produced by the TipTap editor in the frontend */
        bodyHtml: z.string().min(1, "Email body is required"),
        /** Canonical site URL for unsubscribe links — pass window.location.origin from frontend */
        siteUrl: z.string().url().default("https://gigitekai.com"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Fetch all active subscribers
      const subscribers = await db
        .select({ id: newsletterSubscribers.id, email: newsletterSubscribers.email, unsubscribeToken: newsletterSubscribers.unsubscribeToken })
        .from(newsletterSubscribers)
        .where(eq(newsletterSubscribers.active, true));

      if (subscribers.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No active subscribers to send to." });
      }

      // Insert campaign log (status: sending)
      const [campaignInsert] = await db.insert(newsletterCampaigns).values({
        subject: input.subject,
        body: input.bodyHtml,
        recipientCount: subscribers.length,
        sentCount: 0,
        failedCount: 0,
        status: "sending",
        sentBy: ctx.user.name ?? ctx.user.email ?? "admin",
      });

      // @ts-ignore — insertId available on mysql2 result
      const campaignId: number = (campaignInsert as any).insertId ?? 0;

      let sentCount = 0;
      let failedCount = 0;

      for (const sub of subscribers) {
        const html = buildCampaignEmail({
          subject: input.subject,
          bodyHtml: input.bodyHtml,
          recipientEmail: sub.email,
          unsubscribeToken: sub.unsubscribeToken,
          siteUrl: input.siteUrl,
        });

        const ok = await sendEmail({ to: sub.email, subject: input.subject, html });
        if (ok) sentCount++; else failedCount++;
      }

      // Update campaign log with final counts
      if (campaignId) {
        await db
          .update(newsletterCampaigns)
          .set({
            sentCount,
            failedCount,
            status: failedCount === subscribers.length ? "failed" : "completed",
          })
          .where(eq(newsletterCampaigns.id, campaignId));
      }

      // Notify owner
      await notifyOwner({
        title: `Newsletter Campaign Sent: "${input.subject}"`,
        content: `Campaign sent by ${ctx.user.name ?? "admin"}.\n\n- Recipients: ${subscribers.length}\n- Delivered: ${sentCount}\n- Failed: ${failedCount}`,
      }).catch(() => {});

      return { success: true, sentCount, failedCount, recipientCount: subscribers.length };
    }),

  /** List past campaigns (admin only) */
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
        createdAt: newsletterCampaigns.createdAt,
      })
      .from(newsletterCampaigns)
      .orderBy(desc(newsletterCampaigns.createdAt))
      .limit(50);
  }),
});
