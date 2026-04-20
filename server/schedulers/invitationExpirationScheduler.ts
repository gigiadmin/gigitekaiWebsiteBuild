/**
 * Invitation Expiration Scheduler
 * Runs periodically to:
 * 1. Mark expired invitations as expired
 * 2. Send notifications to admins about expiring invitations
 * 3. Clean up old expired invitations (>30 days)
 */

import { getDb } from "../db";
import { customerInvites } from "../../drizzle/schema";
import { eq, lt, and, gte, lte } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";
import { sendEmail } from "../_core/email";

interface ExpirationNotification {
  adminEmail: string;
  adminName: string;
  expiredCount: number;
  expiringCount: number;
  expiringInvites: Array<{
    email: string;
    name: string;
    expiresAt: Date;
    hoursUntilExpiry: number;
  }>;
}

/**
 * Mark invitations as expired if they've passed their expiration date
 */
async function markExpiredInvitations() {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[InvitationExpiration] Database unavailable");
      return;
    }

    const now = new Date();

    // Find all invitations that have expired but are not yet marked as expired
    const expiredInvites = await db
      .select()
      .from(customerInvites)
      .where(
        and(
          lt(customerInvites.expiresAt, now),
          eq(customerInvites.status, "pending")
        )
      );

    if (expiredInvites.length === 0) {
      console.log("[InvitationExpiration] No expired invitations to mark");
      return;
    }

    // Update status to 'expired' for all expired invitations
    for (const invite of expiredInvites) {
      await db
        .update(customerInvites)
        .set({
          status: "expired",
        })
        .where(eq(customerInvites.id, invite.id));
    }

    console.log(
      `[InvitationExpiration] Marked ${expiredInvites.length} invitations as expired`
    );

    // Send notification to owner about expired invitations
    await notifyOwner({
      title: "Invitations Expired",
      content: `${expiredInvites.length} customer invitations have expired and been marked as inactive. These invitations can no longer be accepted.`,
    });
  } catch (error) {
    console.error("[InvitationExpiration] Failed to mark expired invitations:", error);
  }
}

/**
 * Send reminders about invitations expiring soon (within 24 hours)
 */
async function sendExpiringReminders() {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[InvitationExpiration] Database unavailable");
      return;
    }

    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find invitations expiring within 24 hours that haven't been reminded yet
    const expiringInvites = await db
      .select()
      .from(customerInvites)
      .where(
        and(
          gte(customerInvites.expiresAt, now),
          lte(customerInvites.expiresAt, oneDayFromNow),
          eq(customerInvites.status, "pending"),
          eq(customerInvites.reminderSent, false)
        )
      );

    if (expiringInvites.length === 0) {
      console.log("[InvitationExpiration] No invitations expiring soon");
      return;
    }

    // Send reminder emails to admins for each expiring invitation
    for (const invite of expiringInvites) {
      const hoursUntilExpiry = Math.ceil(
        (invite.expiresAt.getTime() - now.getTime()) / (60 * 60 * 1000)
      );

      const emailSent = await sendEmail({
        to: "support@gigitekai.com",
        subject: `Reminder: Customer Invitation Expiring Soon`,
        fromName: "GigitekAI Support",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0E1A; color: #ffffff; padding: 32px; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #00D4FF; font-size: 24px; margin: 0;">GigitekAI</h1>
              <p style="color: #8892a4; font-size: 12px; margin: 4px 0 0;">Cloud & AI Solutions</p>
            </div>
            <h2 style="color: #ffffff; font-size: 20px;">Invitation Expiring Soon</h2>
            <p style="color: #c9d1d9;">Hi Admin,</p>
            <p style="color: #c9d1d9;">The following customer invitation is expiring in <strong style="color: #00D4FF;">${hoursUntilExpiry} hours</strong>:</p>
            <div style="background: #161b22; padding: 16px; border-radius: 6px; margin: 16px 0; border-left: 4px solid #00D4FF;">
              <p style="color: #c9d1d9; margin: 0;"><strong>Email:</strong> ${invite.invitedEmail}</p>
              <p style="color: #c9d1d9; margin: 8px 0 0;"><strong>Name:</strong> ${invite.invitedName || "N/A"}</p>
              <p style="color: #c9d1d9; margin: 8px 0 0;"><strong>Company:</strong> ${invite.invitedCompany || "N/A"}</p>
              <p style="color: #8892a4; margin: 8px 0 0; font-size: 13px;"><strong>Expires:</strong> ${invite.expiresAt.toLocaleString()}</p>
            </div>
            <p style="color: #c9d1d9;">If the customer hasn't accepted yet, you can:</p>
            <ul style="color: #c9d1d9;">
              <li>Resend the invitation from the admin panel</li>
              <li>Create a new invitation with an extended expiration period</li>
              <li>Contact the customer directly to confirm their acceptance</li>
            </ul>
            <div style="text-align: center; margin: 24px 0;">
              <a href="https://gigitekai.com/admin/customers" style="background-color: #00D4FF; color: #0A0E1A; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Go to Admin Panel</a>
            </div>
            <hr style="border-color: #21262d; margin: 24px 0;"/>
            <p style="color: #8892a4; font-size: 12px; text-align: center;">Questions? Contact us at <a href="mailto:support@gigitekai.com" style="color: #00D4FF;">support@gigitekai.com</a> or call +1 727 382 6909</p>
          </div>
        `,
      });

      if (emailSent) {
        // Mark reminder as sent
        await db
          .update(customerInvites)
          .set({
            reminderSent: true,
          })
          .where(eq(customerInvites.id, invite.id));

        console.log(
          `[InvitationExpiration] Sent expiring reminder for ${invite.invitedEmail}`
        );
      }
    }

    console.log(
      `[InvitationExpiration] Processed ${expiringInvites.length} expiring invitations`
    );
  } catch (error) {
    console.error("[InvitationExpiration] Failed to send expiring reminders:", error);
  }
}

/**
 * Clean up old expired invitations (>30 days old)
 */
async function cleanupOldExpiredInvitations() {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[InvitationExpiration] Database unavailable");
      return;
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Find old expired invitations
    const oldExpiredInvites = await db
      .select()
      .from(customerInvites)
      .where(
        and(
          eq(customerInvites.status, "expired"),
          lt(customerInvites.expiresAt, thirtyDaysAgo)
        )
      );

    if (oldExpiredInvites.length === 0) {
      console.log("[InvitationExpiration] No old expired invitations to clean up");
      return;
    }

    // Delete old expired invitations
    for (const invite of oldExpiredInvites) {
      await db
        .delete(customerInvites)
        .where(eq(customerInvites.id, invite.id));
    }

    console.log(
      `[InvitationExpiration] Cleaned up ${oldExpiredInvites.length} old expired invitations`
    );
  } catch (error) {
    console.error("[InvitationExpiration] Failed to cleanup old invitations:", error);
  }
}

/**
 * Main scheduler function - runs all expiration tasks
 */
export async function runInvitationExpirationScheduler() {
  console.log("[InvitationExpiration] Starting invitation expiration scheduler");

  try {
    // Mark expired invitations
    await markExpiredInvitations();

    // Send reminders about expiring invitations
    await sendExpiringReminders();

    // Clean up old expired invitations
    await cleanupOldExpiredInvitations();

    console.log("[InvitationExpiration] Scheduler completed successfully");
  } catch (error) {
    console.error("[InvitationExpiration] Scheduler failed:", error);
  }
}

/**
 * Initialize the scheduler to run every 6 hours
 */
export function initInvitationExpirationScheduler() {
  console.log("[InvitationExpiration] Initializing invitation expiration scheduler");

  // Run immediately on startup
  runInvitationExpirationScheduler().catch(console.error);

  // Run every 6 hours (21600000 ms)
  const intervalId = setInterval(() => {
    runInvitationExpirationScheduler().catch(console.error);
  }, 6 * 60 * 60 * 1000);

  // Allow graceful shutdown
  process.on("SIGTERM", () => {
    clearInterval(intervalId);
    console.log("[InvitationExpiration] Scheduler stopped");
  });

  return intervalId;
}
