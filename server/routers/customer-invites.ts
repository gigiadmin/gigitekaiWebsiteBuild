import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../_core/trpc";
import { sendEmail } from "../_core/email";
import { createCustomerInvite, getCustomerInviteByToken, acceptCustomerInvite, listCustomerInvites, revokeCustomerInvite, getDb } from "../db";
import { getAdminFromRequest } from "./admin-auth";
import { customerInvites as customerInvitesTable, accountAuditLog } from "../../drizzle/schema";
import { eq, inArray, and, or, like, asc, desc, sql } from "drizzle-orm";

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
              <p style="color: #8892a4; font-size: 13px;">This invite expires on ${new Date(String(result.expiresAt)).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.</p>
              <p style="color: #8892a4; font-size: 13px;">If the button doesn't work, copy and paste this link into your browser:<br/><a href="${inviteLink}" style="color: #00D4FF;">${inviteLink}</a></p>
              <hr style="border-color: #21262d; margin: 24px 0;"/>
              <p style="color: #8892a4; font-size: 12px; text-align: center;">Questions? Contact us at <a href="mailto:support@gigitekai.com" style="color: #00D4FF;">support@gigitekai.com</a> or call +1 727 382 6909</p>
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
        const db = (await getDb())!;
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
              <p style="color: #8892a4; font-size: 13px;">This invite expires on ${new Date(String(invite.expiresAt)).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.</p>
              <p style="color: #8892a4; font-size: 13px;">If the button doesn't work, copy and paste this link:<br/><a href="${inviteLink}" style="color: #00D4FF;">${inviteLink}</a></p>
              <hr style="border-color: #21262d; margin: 24px 0;"/>
              <p style="color: #8892a4; font-size: 12px; text-align: center;">Questions? Contact us at <a href="mailto:support@gigitekai.com" style="color: #00D4FF;">support@gigitekai.com</a> or call +1 727 382 6909</p>
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

  bulkSendCustomerInvites: publicProcedure
    .input(z.object({
      csvContent: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      let isAdmin = ctx.user?.role === 'admin';
      let adminId = ctx.user?.id;
      
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
          message: 'Admin access required to send bulk invites'
        });
      }

      try {
        const lines = input.csvContent.trim().split('\n');
        if (lines.length < 2) {
          return { success: false, message: 'CSV must contain header and at least one row', sent: 0, failed: 0, skipped: 0 };
        }

        const results = {
          sent: 0,
          failed: 0,
          skipped: 0,
          errors: [] as string[],
        };

        const processedEmails = new Set<string>();
        const db = (await getDb())!;

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const parts = line.split(',').map(v => v.trim());
          const email = parts[0];
          const name = parts[1];
          const company = parts[2];

          if (!email || !email.includes('@')) {
            results.errors.push(`Row ${i + 1}: Invalid email "${email}"`);
            results.failed++;
            continue;
          }

          if (processedEmails.has(email)) {
            results.errors.push(`Row ${i + 1}: Duplicate email "${email}"`);
            results.skipped++;
            continue;
          }
          processedEmails.add(email);

          if (db) {
            const existing = await db.select().from(customerInvitesTable).where(eq(customerInvitesTable.invitedEmail, email)).limit(1);
            if (existing.length > 0) {
              results.errors.push(`Row ${i + 1}: ${email} already invited`);
              results.skipped++;
              continue;
            }
          }

          try {
            const result = await createCustomerInvite(email, name || undefined, company || undefined, adminId!);
            if (result) {
              const inviteLink = `https://gigitekai.com/accept-invite?token=${result.inviteToken}`;
              await sendEmail({
                to: email,
                subject: "You're invited to GigitekAI Support Portal",
                fromName: 'GigitekAI Support',
                html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0E1A; color: #ffffff; padding: 32px; border-radius: 8px;"><div style="text-align: center; margin-bottom: 24px;"><h1 style="color: #00D4FF; font-size: 24px; margin: 0;">GigitekAI</h1></div><h2 style="color: #ffffff; font-size: 20px;">You're Invited!</h2><p style="color: #c9d1d9;">Hi ${name || 'there'},</p><p style="color: #c9d1d9;">You've been invited to access the <strong style="color: #00D4FF;">GigitekAI Support Portal</strong>.</p><div style="text-align: center; margin: 32px 0;"><a href="${inviteLink}" style="background-color: #00D4FF; color: #0A0E1A; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Accept Invitation</a></div><p style="color: #8892a4; font-size: 13px;">This invite expires on ${new Date(String(result.expiresAt)).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.</p></div>`
              });
              results.sent++;
            } else {
              results.errors.push(`Row ${i + 1}: Failed to create invite for ${email}`);
              results.failed++;
            }
          } catch (error) {
            results.errors.push(`Row ${i + 1}: Error sending invite to ${email}`);
            results.failed++;
          }
        }

        return {
          success: true,
          message: `Bulk invite complete: ${results.sent} sent, ${results.failed} failed, ${results.skipped} skipped`,
          ...results,
        };
      } catch (error) {
        console.error('[CustomerInvites] Bulk send error:', error);
        return { success: false, message: 'Failed to process bulk invites', sent: 0, failed: 0, skipped: 0 };
      }
    }),

  revokeCustomerInvite: publicProcedure
    .input(z.object({
      inviteId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      let isAdmin = ctx.user?.role === 'admin';
      
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

  // ── Account Management Procedures ────────────────────────────────────────

  deleteAccount: publicProcedure
    .input(z.object({
      accountId: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      let isAdmin = ctx.user?.role === 'admin';
      let adminId = ctx.user?.id;
      let adminEmail = ctx.user?.email;
      
      if (!isAdmin && ctx.req) {
        const admin = await getAdminFromRequest(ctx.req);
        if (admin) {
          isAdmin = true;
          adminId = admin.id;
          adminEmail = admin.email;
        }
      }
      
      if (!isAdmin) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }

      try {
        const db = (await getDb())!;
        
        // Soft delete: set status to 'revoked'
        await db.update(customerInvitesTable)
          .set({ status: 'revoked' })
          .where(eq(customerInvitesTable.id, input.accountId));

        // Log audit
        await db.insert(accountAuditLog).values({
          accountId: input.accountId,
          action: 'deleted',
          performedBy: adminId!,
          performedByEmail: adminEmail || '',
          reason: input.reason,
          createdAt: new Date().toISOString(),
        });

        return { success: true, message: 'Account deleted (soft delete, recoverable for 30 days)' };
      } catch (error) {
        console.error('[CustomerInvites] Failed to delete account:', error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete account' });
      }
    }),

  bulkDeleteAccounts: publicProcedure
    .input(z.object({
      accountIds: z.array(z.number()),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      let isAdmin = ctx.user?.role === 'admin';
      let adminId = ctx.user?.id;
      let adminEmail = ctx.user?.email;
      
      if (!isAdmin && ctx.req) {
        const admin = await getAdminFromRequest(ctx.req);
        if (admin) {
          isAdmin = true;
          adminId = admin.id;
          adminEmail = admin.email;
        }
      }
      
      if (!isAdmin) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }

      try {
        const db = (await getDb())!;
        const now = new Date().toISOString();
        
        // Soft delete all: set status to 'revoked'
        await db.update(customerInvitesTable)
          .set({ status: 'revoked' })
          .where(inArray(customerInvitesTable.id, input.accountIds));

        // Log audit for each
        for (const accountId of input.accountIds) {
          await db.insert(accountAuditLog).values({
            accountId,
            action: 'deleted',
            performedBy: adminId!,
            performedByEmail: adminEmail || '',
            reason: input.reason,
            createdAt: now,
          });
        }

        return { success: true, deleted: input.accountIds.length };
      } catch (error) {
        console.error('[CustomerInvites] Failed to bulk delete:', error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to bulk delete accounts' });
      }
    }),

  restoreAccount: publicProcedure
    .input(z.object({
      accountId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      let isAdmin = ctx.user?.role === 'admin';
      let adminId = ctx.user?.id;
      let adminEmail = ctx.user?.email;
      
      if (!isAdmin && ctx.req) {
        const admin = await getAdminFromRequest(ctx.req);
        if (admin) {
          isAdmin = true;
          adminId = admin.id;
          adminEmail = admin.email;
        }
      }
      
      if (!isAdmin) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }

      try {
        const db = (await getDb())!;
        
        // Restore: set status back to 'pending'
        await db.update(customerInvitesTable)
          .set({ status: 'pending' })
          .where(eq(customerInvitesTable.id, input.accountId));

        // Log audit
        await db.insert(accountAuditLog).values({
          accountId: input.accountId,
          action: 'restored',
          performedBy: adminId!,
          performedByEmail: adminEmail || '',
          createdAt: new Date().toISOString(),
        });

        return { success: true, message: 'Account restored' };
      } catch (error) {
        console.error('[CustomerInvites] Failed to restore account:', error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to restore account' });
      }
    }),

  listAccountsWithFilters: publicProcedure
    .input(z.object({
      search: z.string().optional(),
      status: z.enum(['pending', 'accepted', 'expired', 'revoked']).optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
      sortBy: z.enum(['createdAt', 'invitedEmail', 'status']).default('createdAt'),
      sortOrder: z.enum(['asc', 'desc']).default('desc'),
    }))
    .query(async ({ input, ctx }) => {
      let isAdmin = ctx.user?.role === 'admin';
      
      if (!isAdmin && ctx.req) {
        const admin = await getAdminFromRequest(ctx.req);
        if (!admin) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
      }

      try {
        const db = (await getDb())!;
        const offset = (input.page - 1) * input.limit;
        
        // Build where clause
        const conditions = [];
        if (input.search) {
          conditions.push(
            or(
              like(customerInvitesTable.invitedEmail, `%${input.search}%`),
              like(customerInvitesTable.invitedName, `%${input.search}%`),
              like(customerInvitesTable.invitedCompany, `%${input.search}%`)
            )
          );
        }
        
        if (input.status) {
          conditions.push(eq(customerInvitesTable.status, input.status));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // Get total count
        const countResult = await db.select({ count: sql`COUNT(*) as count` })
          .from(customerInvitesTable)
          .where(whereClause);
        const total = Number(countResult[0]?.count) || 0;

        // Get paginated results
        let orderByClause;
        if (input.sortBy === 'createdAt') {
          orderByClause = input.sortOrder === 'asc' ? asc(customerInvitesTable.createdAt) : desc(customerInvitesTable.createdAt);
        } else if (input.sortBy === 'invitedEmail') {
          orderByClause = input.sortOrder === 'asc' ? asc(customerInvitesTable.invitedEmail) : desc(customerInvitesTable.invitedEmail);
        } else {
          orderByClause = input.sortOrder === 'asc' ? asc(customerInvitesTable.status) : desc(customerInvitesTable.status);
        }
        
        const results = await db.select()
          .from(customerInvitesTable)
          .where(whereClause)
          .orderBy(orderByClause)
          .limit(input.limit)
          .offset(offset);

        return {
          data: results,
          pagination: {
            page: input.page,
            limit: input.limit,
            total,
            pages: Math.ceil(total / input.limit),
          },
        };
      } catch (error) {
        console.error('[CustomerInvites] Failed to list accounts:', error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to list accounts' });
      }
    }),

  getAccountTimeline: publicProcedure
    .input(z.object({
      accountId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      let isAdmin = ctx.user?.role === 'admin';
      
      if (!isAdmin && ctx.req) {
        const admin = await getAdminFromRequest(ctx.req);
        if (!admin) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
      }

      try {
        const db = (await getDb())!;
        
        const timeline = await db.select()
          .from(accountAuditLog)
          .where(eq(accountAuditLog.accountId, input.accountId))
          .orderBy(desc(accountAuditLog.createdAt));

        return timeline;
      } catch (error) {
        console.error('[CustomerInvites] Failed to get timeline:', error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to get timeline' });
      }
    }),

  exportAccounts: publicProcedure
    .input(z.object({
      status: z.enum(['pending', 'accepted', 'expired', 'revoked']).optional(),
      format: z.enum(['csv', 'json']).default('csv'),
    }))
    .query(async ({ input, ctx }) => {
      let isAdmin = ctx.user?.role === 'admin';
      
      if (!isAdmin && ctx.req) {
        const admin = await getAdminFromRequest(ctx.req);
        if (!admin) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
      }

      try {
        const db = (await getDb())!;
        
        const conditions = [];
        if (input.status) {
          conditions.push(eq(customerInvitesTable.status, input.status));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const results = await db.select()
          .from(customerInvitesTable)
          .where(whereClause);

        if (input.format === 'json') {
          return { data: results, format: 'json' };
        }

        // CSV format
        const headers = ['Email', 'Name', 'Company', 'Status', 'Created', 'Accepted', 'Expires'];
        const rows = results.map(r => [
          r.invitedEmail,
          r.invitedName || '',
          r.invitedCompany || '',
          r.status,
          new Date(r.createdAt).toISOString().split('T')[0],
          r.acceptedAt ? new Date(r.acceptedAt).toISOString().split('T')[0] : '',
          new Date(r.expiresAt).toISOString().split('T')[0],
        ]);

        const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        
        return { data: csv, format: 'csv' };
      } catch (error) {
        console.error('[CustomerInvites] Failed to export:', error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to export accounts' });
      }
    }),

  bulkResendInvitations: publicProcedure
    .input(z.object({
      accountIds: z.array(z.number()),
    }))
    .mutation(async ({ input, ctx }) => {
      let isAdmin = ctx.user?.role === 'admin';
      let adminId = ctx.user?.id;
      let adminEmail = ctx.user?.email;
      
      if (!isAdmin && ctx.req) {
        const admin = await getAdminFromRequest(ctx.req);
        if (admin) {
          isAdmin = true;
          adminId = admin.id;
          adminEmail = admin.email;
        }
      }
      
      if (!isAdmin) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }

      try {
        const db = (await getDb())!;
        let resent = 0;

        for (const accountId of input.accountIds) {
          const invite = await db.select()
            .from(customerInvitesTable)
            .where(eq(customerInvitesTable.id, accountId))
            .limit(1);

          if (!invite[0]) continue;

          // Send email
          await sendEmail({
            to: invite[0].invitedEmail,
            subject: 'GigitekAI Portal Invitation (Reminder)',
            html: `
              <p>Hi ${invite[0].invitedName || 'there'},</p>
              <p>This is a reminder about your GigitekAI portal invitation.</p>
              <p><a href="https://gigitekai.com/accept-invite?token=${invite[0].inviteToken}">Accept Invitation</a></p>
              <p>This invitation expires on ${new Date(invite[0].expiresAt).toLocaleDateString()}</p>
            `,
          });

          // Update reminderSent
          await db.update(customerInvitesTable)
            .set({ reminderSent: 1 })
            .where(eq(customerInvitesTable.id, accountId));

          // Log audit
          await db.insert(accountAuditLog).values({
            accountId,
            action: 'resend_invitation',
            performedBy: adminId!,
            performedByEmail: adminEmail || '',
            createdAt: new Date().toISOString(),
          });

          resent++;
        }

        return { success: true, resent };
      } catch (error) {
        console.error('[CustomerInvites] Failed to bulk resend:', error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to bulk resend' });
      }
    }),
});
