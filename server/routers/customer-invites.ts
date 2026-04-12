import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../_core/trpc";
import { sendEmail } from "../_core/email";
import { createCustomerInvite, getCustomerInviteByToken, acceptCustomerInvite, listCustomerInvites, revokeCustomerInvite } from "../db";
import { getAdminFromRequest } from "./admin-auth";

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
        const inviteLink = `${process.env.VITE_FRONTEND_URL || 'https://gigitekai.com'}/accept-invite?token=${result.inviteToken}`;
        
        await sendEmail({
          to: input.invitedEmail,
          subject: 'You\'re invited to GigitekAI Support Portal',
          html: `
            <h2>Welcome to GigitekAI Support Portal</h2>
            <p>Hi ${input.invitedName || 'there'},</p>
            <p>You've been invited to access the GigitekAI Support Portal by your administrator.</p>
            <p><a href="${inviteLink}" style="background-color: #00D4FF; color: #0A0E1A; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Accept Invite</a></p>
            <p>This invite expires on ${result.expiresAt.toLocaleDateString()}.</p>
            <p>If you have any questions, contact support@gigitekai.com</p>
          `
        });

        return { success: true, message: 'Invite sent successfully', inviteLink };
      } catch (error) {
        console.error('[CustomerInvites] Failed to send invite:', error);
        return { success: false, message: 'Failed to send invite' };
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
