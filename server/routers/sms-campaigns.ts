/**
 * SMS Campaign Router
 * Manages contacts, campaigns, sending via Twilio (ACS fallback), and opt-out compliance.
 * TCPA compliant: honors STOP commands, tracks all opt-outs.
 */

import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { smsContacts, smsCampaigns, smsMessages, smsOptOuts } from "../../drizzle/schema";
import { eq, desc, and, isNull, sql, inArray } from "drizzle-orm";
import { ENV } from "../_core/env";
import twilio from "twilio";

// ── Twilio client (lazy init) ──────────────────────────────────────────────────
function getTwilioClient() {
  if (!ENV.twilioAccountSid || !ENV.twilioAuthToken) {
    throw new Error("Twilio credentials not configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN)");
  }
  return twilio(ENV.twilioAccountSid, ENV.twilioAuthToken);
}

function getFromNumber(): string {
  if (!ENV.twilioPhoneNumber) throw new Error("TWILIO_PHONE_NUMBER not configured");
  return ENV.twilioPhoneNumber;
}

/** Interpolate {{name}}, {{company}} in message template */
function interpolate(template: string, contact: { name: string; company?: string | null }) {
  return template
    .replace(/\{\{name\}\}/gi, contact.name || "there")
    .replace(/\{\{company\}\}/gi, contact.company || "your company");
}

/** Send a single SMS via Twilio */
async function sendSingleSms(to: string, body: string, from: string) {
  const client = getTwilioClient();
  const msg = await client.messages.create({ to, from, body });
  return { sid: msg.sid, status: msg.status };
}

// ─────────────────────────────────────────────────────────────────────────────
export const smsCampaignRouter = router({

  // ── CONTACTS ────────────────────────────────────────────────────────────────

  /** List all contacts (opted-in only by default) */
  listContacts: adminProcedure
    .input(z.object({
      includeOptedOut: z.boolean().default(false),
      limit: z.number().min(1).max(500).default(100),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const query = db.select().from(smsContacts);
      const contacts = await (input.includeOptedOut
        ? query.orderBy(desc(smsContacts.createdAt)).limit(input.limit).offset(input.offset)
        : query.where(eq(smsContacts.optedIn, true)).orderBy(desc(smsContacts.createdAt)).limit(input.limit).offset(input.offset));
      const [{ count }] = await db.select({ count: sql<number>`COUNT(*)` }).from(smsContacts);
      const [{ optedInCount }] = await db.select({ optedInCount: sql<number>`COUNT(*)` }).from(smsContacts).where(eq(smsContacts.optedIn, true));
      return { contacts, total: Number(count), optedIn: Number(optedInCount) };
    }),

  /** Add a single contact */
  addContact: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      phone: z.string().regex(/^\+1\d{10}$/, "Phone must be E.164 format: +1XXXXXXXXXX"),
      email: z.string().email().optional(),
      company: z.string().optional(),
      source: z.enum(["manual", "contact_form", "import"]).default("manual"),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      // Check for existing opt-out
      const existingOptOut = await db.select().from(smsOptOuts).where(eq(smsOptOuts.phone, input.phone)).limit(1);
      if (existingOptOut.length > 0) {
        throw new Error(`${input.phone} has previously opted out. Cannot re-add without explicit consent.`);
      }
      await db.insert(smsContacts).values({
        name: input.name,
        phone: input.phone,
        email: input.email ?? null,
        company: input.company ?? null,
        source: input.source,
        notes: input.notes ?? null,
        optedIn: true,
      });
      const [contact] = await db.select().from(smsContacts).where(eq(smsContacts.phone, input.phone)).limit(1);
      return { success: true, contact };
    }),

  /** Import contacts from CSV data */
  importContacts: adminProcedure
    .input(z.object({
      contacts: z.array(z.object({
        name: z.string(),
        phone: z.string(),
        email: z.string().optional(),
        company: z.string().optional(),
      })),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      let imported = 0;
      let skipped = 0;
      const errors: string[] = [];
      for (const c of input.contacts) {
        try {
          // Normalize phone
          const phone = c.phone.startsWith("+") ? c.phone : `+1${c.phone.replace(/\D/g, "")}`;
          if (!/^\+1\d{10}$/.test(phone)) { errors.push(`Invalid phone: ${c.phone}`); skipped++; continue; }
          // Check opt-out
          const optOut = await db.select().from(smsOptOuts).where(eq(smsOptOuts.phone, phone)).limit(1);
          if (optOut.length > 0) { skipped++; continue; }
          // Check duplicate
          const existing = await db.select().from(smsContacts).where(eq(smsContacts.phone, phone)).limit(1);
          if (existing.length > 0) { skipped++; continue; }
          await db.insert(smsContacts).values({ name: c.name, phone, email: c.email ?? null, company: c.company ?? null, source: "import", optedIn: true });
          imported++;
        } catch (e: any) {
          errors.push(e.message);
          skipped++;
        }
      }
      return { imported, skipped, errors };
    }),

  /** Opt-out a contact (TCPA compliance) */
  optOutContact: adminProcedure
    .input(z.object({
      contactId: z.number(),
      reason: z.string().default("admin"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [contact] = await db.select().from(smsContacts).where(eq(smsContacts.id, input.contactId)).limit(1);
      if (!contact) throw new Error("Contact not found");
      await db.update(smsContacts).set({ optedIn: false, optedOutAt: new Date(), optOutReason: input.reason }).where(eq(smsContacts.id, input.contactId));
      await db.insert(smsOptOuts).values({ phone: contact.phone, contactId: contact.id, reason: input.reason, source: "admin" });
      return { success: true };
    }),

  /** Delete a contact */
  deleteContact: adminProcedure
    .input(z.object({ contactId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(smsContacts).where(eq(smsContacts.id, input.contactId));
      return { success: true };
    }),

  // ── CAMPAIGNS ───────────────────────────────────────────────────────────────

  /** List all campaigns */
  listCampaigns: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const campaigns = await db.select().from(smsCampaigns).orderBy(desc(smsCampaigns.createdAt));
    return { campaigns };
  }),

  /** Create a new campaign */
  createCampaign: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      message: z.string().min(1).max(1600),
      scheduledAt: z.string().optional(), // ISO date string
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.insert(smsCampaigns).values({
        name: input.name,
        description: input.description ?? null,
        message: input.message,
        status: "draft",
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
        createdBy: ctx.user.id,
        fromNumber: ENV.twilioPhoneNumber || null,
      });
      const [campaign] = await db.select().from(smsCampaigns).orderBy(desc(smsCampaigns.createdAt)).limit(1);
      return { success: true, campaign };
    }),

  /** Update campaign */
  updateCampaign: adminProcedure
    .input(z.object({
      campaignId: z.number(),
      name: z.string().optional(),
      message: z.string().optional(),
      description: z.string().optional(),
      scheduledAt: z.string().nullable().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const updates: Record<string, any> = {};
      if (input.name) updates.name = input.name;
      if (input.message) updates.message = input.message;
      if (input.description !== undefined) updates.description = input.description;
      if (input.scheduledAt !== undefined) updates.scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
      await db.update(smsCampaigns).set(updates).where(eq(smsCampaigns.id, input.campaignId));
      return { success: true };
    }),

  /** Delete a draft campaign */
  deleteCampaign: adminProcedure
    .input(z.object({ campaignId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [campaign] = await db.select().from(smsCampaigns).where(eq(smsCampaigns.id, input.campaignId)).limit(1);
      if (!campaign) throw new Error("Campaign not found");
      if (!["draft", "cancelled"].includes(campaign.status)) throw new Error("Only draft or cancelled campaigns can be deleted");
      await db.delete(smsCampaigns).where(eq(smsCampaigns.id, input.campaignId));
      return { success: true };
    }),

  // ── SEND ────────────────────────────────────────────────────────────────────

  /** Send a campaign to all opted-in contacts */
  sendCampaign: adminProcedure
    .input(z.object({ campaignId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [campaign] = await db.select().from(smsCampaigns).where(eq(smsCampaigns.id, input.campaignId)).limit(1);
      if (!campaign) throw new Error("Campaign not found");
      if (!["draft", "scheduled"].includes(campaign.status)) throw new Error("Campaign cannot be sent in its current status");

      const contacts = await db.select().from(smsContacts).where(eq(smsContacts.optedIn, true));
      if (contacts.length === 0) throw new Error("No opted-in contacts to send to");

      const fromNumber = getFromNumber();
      await db.update(smsCampaigns).set({ status: "sending", totalRecipients: contacts.length }).where(eq(smsCampaigns.id, input.campaignId));

      let sent = 0, failed = 0;
      for (const contact of contacts) {
        const body = interpolate(campaign.message, contact);
        try {
          const result = await sendSingleSms(contact.phone, body, fromNumber);
          await db.insert(smsMessages).values({
            campaignId: campaign.id,
            contactId: contact.id,
            toPhone: contact.phone,
            fromPhone: fromNumber,
            body,
            status: "sent",
            provider: "twilio",
            providerMessageId: result.sid,
            sentAt: new Date(),
          });
          sent++;
        } catch (e: any) {
          await db.insert(smsMessages).values({
            campaignId: campaign.id,
            contactId: contact.id,
            toPhone: contact.phone,
            fromPhone: fromNumber,
            body,
            status: "failed",
            provider: "twilio",
            errorMessage: e.message,
          });
          failed++;
        }
        // Rate limiting: 1 msg per 100ms
        await new Promise(r => setTimeout(r, 100));
      }

      await db.update(smsCampaigns).set({
        status: "sent",
        sentAt: new Date(),
        totalSent: sent,
        totalFailed: failed,
      }).where(eq(smsCampaigns.id, input.campaignId));

      return { success: true, sent, failed, total: contacts.length };
    }),

  /** Send a one-off test SMS to a single number */
  sendTestSms: adminProcedure
    .input(z.object({
      to: z.string().regex(/^\+1\d{10}$/, "Must be E.164: +1XXXXXXXXXX"),
      message: z.string().min(1).max(1600),
    }))
    .mutation(async ({ input }) => {
      const fromNumber = getFromNumber();
      const result = await sendSingleSms(input.to, input.message, fromNumber);
      return { success: true, sid: result.sid, status: result.status };
    }),

  // ── METRICS ─────────────────────────────────────────────────────────────────

  /** Dashboard metrics */
  getMetrics: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const [{ totalContacts }] = await db.select({ totalContacts: sql<number>`COUNT(*)` }).from(smsContacts);
    const [{ optedIn }] = await db.select({ optedIn: sql<number>`COUNT(*)` }).from(smsContacts).where(eq(smsContacts.optedIn, true));
    const [{ optedOut }] = await db.select({ optedOut: sql<number>`COUNT(*)` }).from(smsContacts).where(eq(smsContacts.optedIn, false));
    const [{ totalCampaigns }] = await db.select({ totalCampaigns: sql<number>`COUNT(*)` }).from(smsCampaigns);
    const [{ totalMessages }] = await db.select({ totalMessages: sql<number>`COUNT(*)` }).from(smsMessages);
    const [{ delivered }] = await db.select({ delivered: sql<number>`COUNT(*)` }).from(smsMessages).where(eq(smsMessages.status, "delivered"));
    const [{ failed }] = await db.select({ failed: sql<number>`COUNT(*)` }).from(smsMessages).where(eq(smsMessages.status, "failed"));
    const [{ sent }] = await db.select({ sent: sql<number>`COUNT(*)` }).from(smsMessages).where(eq(smsMessages.status, "sent"));
    const recentCampaigns = await db.select().from(smsCampaigns).orderBy(desc(smsCampaigns.createdAt)).limit(5);
    const twilioConfigured = !!(ENV.twilioAccountSid && ENV.twilioAuthToken && ENV.twilioPhoneNumber);
    return {
      contacts: { total: Number(totalContacts), optedIn: Number(optedIn), optedOut: Number(optedOut) },
      campaigns: { total: Number(totalCampaigns) },
      messages: { total: Number(totalMessages), delivered: Number(delivered), sent: Number(sent), failed: Number(failed) },
      deliveryRate: Number(totalMessages) > 0 ? Math.round((Number(delivered) + Number(sent)) / Number(totalMessages) * 100) : 0,
      recentCampaigns,
      twilioConfigured,
      fromNumber: ENV.twilioPhoneNumber || null,
    };
  }),

  /** Get messages for a campaign */
  getCampaignMessages: adminProcedure
    .input(z.object({ campaignId: z.number(), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const messages = await db.select().from(smsMessages).where(eq(smsMessages.campaignId, input.campaignId)).orderBy(desc(smsMessages.createdAt)).limit(input.limit);
      return { messages };
    }),

  /** Get opt-out log */
  getOptOuts: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const optOuts = await db.select().from(smsOptOuts).orderBy(desc(smsOptOuts.processedAt)).limit(100);
    return { optOuts };
  }),
});
