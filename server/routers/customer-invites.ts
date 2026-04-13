import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../_core/trpc";
import { sendEmail } from "../_core/email";
import { createCustomerInvite, getCustomerInviteByToken, acceptCustomerInvite, listCustomerInvites, revokeCustomerInvite, getDb } from "../db";
import { getAdminFromRequest } from "./admin-auth";
import { customerInvites as customerInvitesTable } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const customerInvitesRouter = router({
  sendCustomerInvite: publicProcedure
    .input(z.object({
      invitedEmail: z.string().email(),
      invitedName: z.string().optional(),
      invitedCompany: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Check if user is authenticated via OAuth or custom admin JWT
      let isAdmin = ctx.user?.role === 'admin';
      let adminId = ctx.user?.id;
      
      // If not OAuth admin, try custom admin JWT
      if (!isAdmin && ctx.req) {
        const admin = await getAdminFromRequest(ctx.req);
        if (admin) {
          isAdmin = true;
          adminId = admin.id;
        }
      }
      
      if (!isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Admin access required to send invites'
        });
      }

      try {
        const result = await createCustomerInvite(
          input.invitedEmail,
          input.invitedName,
          input.invitedCompany,
          adminId!
        );

        if (!result) {
          return { success: false, message: 'Failed to create invite' };
        }

        // Send invite email
        const inviteLink = `https://gigitekai.com/accept-invite?token=${result.inviteToken}`;

        console.log(`[CustomerInvites] Sending invite email to ${input.invitedEmail} with link: ${inviteLink}`);

        const emailSent = await sendEmail({
          to: input.invitedEmail,
          subject: "You're invited to GigitekAI Support Portal",
          fromName: 'GigitekAI Support',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0E1A; color: #ffffff; padding: 32px; border-radius: 8px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #00D4FF; font-size: 24px; margin: 0;">GigitekAI</h1>
                <p style="color: #8892a4; font-size: 12px; margin: 4px 0 0;">Cloud & AI Solutions</p>
              </div>
              <h2 style="color: #ffffff; font-size: 20px;">You're Invited!</h2>
              <p style="color: #c9d1d9;">Hi ${input.invitedName || 'there'},</p>
              <p style="color: #c9d1d9;">You've been invited to access the <strong style="color: #00D4FF;">GigitekAI Support Portal</strong> by your administrator.</p>
              <p style="color: #c9d1d9;">Click the button below to accept your invitation and set up your account:</p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${inviteLink}" style="background-color: #00D4FF; color: #0A0E1A; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">Accept Invitation</a>
              </div>
              <p style="color: #8892a4; font-size: 13px;">This invite expires on ${result.expiresAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.</p>
              <p style="color: #8892a4; font-size: 13px;">If the button doesn't work, copy and paste this link into your browser:<br/><a href="${inviteLink}" style="color: #00D4FF;">${inviteLink}</a></p>
              <hr style="border-color: #21262d; margin: 24px 0;"/>
              <p style="color: #8892a4; font-size: 12px; text-align: center;">Questions? Contact us at <a href="mailto:support@gigitekai.com" style="color: #00D4FF;">support@gigitekai.com</a> or call 609-676-4483</p>
            </div>
          `
        });

        if (!emailSent) {
          console.error(`[CustomerInvites] Email delivery failed for ${input.invitedEmail} — invite created but email not sent`);
          // Invite is in DB — return success with a warning so admin knows to resend
          return { 
            success: true, 
            emailDelivered: false,
            message: 'Invite created but email delivery failed. Use Resend to retry.',
            inviteLink 
          };
        }

        console.log(`[CustomerInvites] Invite email sent successfully to ${input.invitedEmail}`);
        return { success: true, emailDelivered: true, message: 'Invite sent successfully', inviteLink };
      } catch (error) {
        console.error('[CustomerInvites] Failed to send invite:', error);
        return { success: false, emailDelivered: false, message: error instanceof Error ? error.message : 'Failed to send invite' };
      }
    }),

  getCustomerInvite: publicProcedure
    .input(z.object({
      token: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        const invite = await getCustomerInviteByToken(input.token);
        if (!invite) {
          return { success: false, invite: null, message: 'Invite not found or expired' };
        }
        return { success: true, invite, message: 'Invite valid' };
      } catch (error) {
        console.error('[CustomerInvites] Failed to get invite:', error);
        return { success: false, invite: null, message: 'Failed to retrieve invite' };
      }
    }),

  acceptCustomerInvite: publicProcedure
    .input(z.object({
      token: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new Error('Must be logged in to accept invite');
      }

      try {
        const success = await acceptCustomerInvite(input.token, ctx.user.id);
        if (!success) {
          return { success: false, message: 'Failed to accept invite' };
        }
        return { success: true, message: 'Invite accepted! You now have access to the support portal.' };
      } catch (error) {
        console.error('[CustomerInvites] Failed to accept invite:', error);
        return { success: false, message: 'Failed to accept invite' };
      }
    }),

  listCustomerInvites: publicProcedure
    .query(async ({ ctx }) => {
      // Check if user is authenticated via OAuth or custom admin JWT
      let isAdmin = ctx.user?.role === 'admin';
      let adminId = ctx.user?.id;
      
      // If not OAuth admin, try custom admin JWT
      if (!isAdmin && ctx.req) {
        const admin = await getAdminFromRequest(ctx.req);
        if (admin) {
          isAdmin = true;
          adminId = admin.id;
        }
      }
      
      if (!isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Admin access required to list invites'
        });
      }

      try {
        const invites = await listCustomerInvites(adminId!);
        return { success: true, invites };
      } catch (error) {
        console.error('[CustomerInvites] Failed to list invites:', error);
        return { success: false, invites: [] };
      }
    }),

  resendCustomerInvite: publicProcedure
    .input(z.object({
      inviteId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Check if user is authenticated via OAuth or custom admin JWT
      let isAdmin = ctx.user?.role === 'admin';
      
      // If not OAuth admin, try custom admin JWT
      if (!isAdmin && ctx.req) {
        const admin = await getAdminFromRequest(ctx.req);
        if (admin) {
          isAdmin = true;
        }
      }
      
      if (!isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Admin access required to resend invites'
        });
      }

      try {
        // Get the invite directly by ID (no need to filter by adminId)
        const db = await getDb();
        if (!db) return { success: false, message: 'Database unavailable' };
        const rows = await db.select().from(customerInvitesTable).where(eq(customerInvitesTable.id, input.inviteId)).limit(1);
        const invite = rows[0] ?? null;

        if (!invite) {
          return { success: false, message: 'Invite not found' };
        }

        // Resend invite email
        const inviteLink = `https://gigitekai.com/accept-invite?token=${invite.inviteToken}`;

        console.log(`[CustomerInvites] Resending invite email to ${invite.invitedEmail}`);

        const emailSent = await sendEmail({
          to: invite.invitedEmail,
          subject: "Reminder: You're invited to GigitekAI Support Portal",
          fromName: 'GigitekAI Support',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0E1A; color: #ffffff; padding: 32px; border-radius: 8px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #00D4FF; font-size: 24px; margin: 0;">GigitekAI</h1>
                <p style="color: #8892a4; font-size: 12px; margin: 4px 0 0;">Cloud & AI Solutions</p>
              </div>
              <h2 style="color: #ffffff; font-size: 20px;">Invitation Reminder</h2>
              <p style="color: #c9d1d9;">Hi ${invite.invitedName || 'there'},</p>
              <p style="color: #c9d1d9;">This is a reminder that you've been invited to access the <strong style="color: #00D4FF;">GigitekAI Support Portal</strong>.</p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${inviteLink}" style="background-color: #00D4FF; color: #0A0E1A; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">Accept Invitation</a>
              </div>
              <p style="color: #8892a4; font-size: 13px;">This invite expires on ${invite.expiresAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.</p>
              <p style="color: #8892a4; font-size: 13px;">If the button doesn't work, copy and paste this link:<br/><a href="${inviteLink}" style="color: #00D4FF;">${inviteLink}</a></p>
              <hr style="border-color: #21262d; margin: 24px 0;"/>
              <p style="color: #8892a4; font-size: 12px; text-align: center;">Questions? Contact us at <a href="mailto:support@gigitekai.com" style="color: #00D4FF;">support@gigitekai.com</a> or call 609-676-4483</p>
            </div>
          `
        });

        if (!emailSent) {
          console.error(`[CustomerInvites] Resend email delivery failed for ${invite.invitedEmail}`);
          return { success: false, message: 'Email delivery failed. Please check Microsoft Graph configuration.' };
        }

        console.log(`[CustomerInvites] Invite resent successfully to ${invite.invitedEmail}`);
        return { success: true, message: 'Invite resent successfully' };
      } catch (error) {
        console.error('[CustomerInvites] Failed to resend invite:', error);
        return { success: false, message: 'Failed to resend invite' };
      }
    }),

  revokeCustomerInvite: publicProcedure
    .input(z.object({
      inviteId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Check if user is authenticated via OAuth or custom admin JWT
      let isAdmin = ctx.user?.role === 'admin';
      
      // If not OAuth admin, try custom admin JWT
      if (!isAdmin && ctx.req) {
        const admin = await getAdminFromRequest(ctx.req);
        if (admin) {
          isAdmin = true;
        }
      }
      
      if (!isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Admin access required to revoke invites'
        });
      }

      try {
        const success = await revokeCustomerInvite(input.inviteId);
        if (!success) {
          return { success: false, message: 'Failed to revoke invite' };
        }
        return { success: true, message: 'Invite revoked successfully' };
      } catch (error) {
        console.error('[CustomerInvites] Failed to revoke invite:', error);
        return { success: false, message: 'Failed to revoke invite' };
      }
    }),
});
