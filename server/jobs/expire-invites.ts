/**
 * Background job to auto-expire pending invitations after 72 hours
 * Runs every hour to check for expired invites
 */

import { getDb } from "../db";
import { customerInvites } from "../../drizzle/schema";
import { eq, and, lt } from "drizzle-orm";
import { sendEmail } from "../_core/email";

export async function expireOldInvites() {
  const db = await getDb();
  if (!db) {
    console.warn("[ExpireInvites] Database not available");
    return;
  }

  try {
    const now = new Date();

    // Find all pending invites that have expired
    const expiredInvites = await db
      .select()
      .from(customerInvites)
      .where(
        and(
          eq(customerInvites.status, "pending"),
          lt(customerInvites.expiresAt, now)
        )
      );

    if (expiredInvites.length === 0) {
      console.log("[ExpireInvites] No expired invites found");
      return;
    }

    console.log(`[ExpireInvites] Found ${expiredInvites.length} expired invites`);

    // Update all expired invites to "expired" status
    await db
      .update(customerInvites)
      .set({ status: "expired" })
      .where(
        and(
          eq(customerInvites.status, "pending"),
          lt(customerInvites.expiresAt, now)
        )
      );

    // Send notification emails to the admins who sent the invites
    for (const invite of expiredInvites) {
      try {
        // Get admin info (simplified - in production, fetch from users table)
        const adminEmail = "support@gigitekai.com"; // Default support email

        await sendEmail({
          to: adminEmail,
          subject: `Invitation Expired: ${invite.invitedEmail}`,
          fromName: "GigitekAI System",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0E1A; color: #ffffff; padding: 32px; border-radius: 8px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #00D4FF; font-size: 24px; margin: 0;">GigitekAI</h1>
                <p style="color: #8892a4; font-size: 12px; margin: 4px 0 0;">Cloud & AI Solutions</p>
              </div>
              <h2 style="color: #ffffff; font-size: 20px;">Invitation Expired</h2>
              <p style="color: #c9d1d9;">The invitation sent to <strong>${invite.invitedEmail}</strong> has expired.</p>
              <p style="color: #c9d1d9;">Details:</p>
              <ul style="color: #c9d1d9;">
                <li><strong>Email:</strong> ${invite.invitedEmail}</li>
                <li><strong>Name:</strong> ${invite.invitedName || "Not provided"}</li>
                <li><strong>Company:</strong> ${invite.invitedCompany || "Not provided"}</li>
                <li><strong>Sent:</strong> ${invite.createdAt.toLocaleString()}</li>
                <li><strong>Expired:</strong> ${new Date().toLocaleString()}</li>
              </ul>
              <p style="color: #c9d1d9;">If you'd like to send a new invitation, please use the Admin Portal.</p>
              <hr style="border-color: #21262d; margin: 24px 0;"/>
              <p style="color: #8892a4; font-size: 12px; text-align: center;">Questions? Contact us at <a href="mailto:support@gigitekai.com" style="color: #00D4FF;">support@gigitekai.com</a> or call 609-676-4483</p>
            </div>
          `,
        });

        console.log(`[ExpireInvites] Sent expiration notification for ${invite.invitedEmail}`);
      } catch (emailError) {
        console.error(
          `[ExpireInvites] Failed to send expiration email for ${invite.invitedEmail}:`,
          emailError
        );
        // Continue processing other invites even if email fails
      }
    }

    console.log(
      `[ExpireInvites] Successfully expired ${expiredInvites.length} invites`
    );
  } catch (error) {
    console.error("[ExpireInvites] Error expiring invites:", error);
    throw error;
  }
}
