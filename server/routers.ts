import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { notifyOwner } from "./_core/notification";
import { sendEmail } from "./_core/email";
import { saveContactSubmission, getAllUsers, approveUser, revokeUser } from "./db";
import { helpdeskRouter } from "./routers/helpdesk";
import { aibotRouter } from "./routers/aibot";
import { chatRouter } from "./routers/chat";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  helpdesk: helpdeskRouter,
  aibot: aibotRouter,
  chat: chatRouter,

  contact: router({
    submit: publicProcedure
      .input(
        z.object({
          name: z.string().min(1, "Name is required"),
          email: z.string().email("Valid email is required"),
          company: z.string().optional(),
          message: z.string().min(1, "Message is required"),
          // Honeypot fields - bots fill these, real users don't see them
          website: z.string().optional(), // hidden field
          phone2: z.string().optional(),  // hidden field
        })
      )
      .mutation(async ({ input }) => {
        try {
          // ── Bot Detection: Honeypot check ──────────────────────────────
          if (input.website || input.phone2) {
            // Bot detected - silently accept but don't process
            console.log("[Security] Bot submission blocked via honeypot");

            // Notify admin of bot attempt
            try {
              await notifyOwner({
                title: "Security Alert: Bot Submission Blocked",
                content: `**Honeypot triggered on contact form**\n\n- **Filled fields:** ${input.website ? "website" : ""} ${input.phone2 ? "phone2" : ""}\n- **Claimed name:** ${input.name}\n- **Claimed email:** ${input.email}\n- **Time:** ${new Date().toISOString()}\n\nThis submission was automatically blocked.`,
              });
            } catch (_) { /* notification failure is non-critical */ }

            return {
              success: true,
              message: "Thank you! Your message has been received. We'll get back to you within 1 business day.",
            };
          }

          // Save submission to database
          await saveContactSubmission({
            name: input.name,
            email: input.email,
            company: input.company,
            message: input.message,
          });

          // Notify owner in Manus dashboard
          const notificationContent = `
**New Contact Form Submission**

**Name:** ${input.name}
**Email:** ${input.email}
**Company:** ${input.company || "Not provided"}

**Message:**
${input.message}

---
Submitted from GigitekAI website contact form.
          `;

          await notifyOwner({
            title: `New Contact: ${input.name}`,
            content: notificationContent,
          });

          return {
            success: true,
            message: "Thank you! Your message has been received. We'll get back to you within 1 business day.",
          };
        } catch (error) {
          console.error("[Contact Form] Submission failed:", error);
          // Still return success to user even if something fails
          return {
            success: true,
            message: "Thank you! Your message has been received. We'll get back to you within 1 business day.",
          };
        }
      }),
  }),

  // User management (admin only)
  users: router({
    getAll: adminProcedure.query(async () => {
      const allUsers = await getAllUsers();
      return allUsers;
    }),
    approve: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        try {
          // Get user details
          const allUsers = await getAllUsers();
          const user = allUsers.find(u => u.id === input.userId);
          
          const result = await approveUser(input.userId);
          
          // Send approval email
          if (user && user.email) {
            try {
              const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #0A0E1A 0%, #0F1A30 100%); color: #00D4FF; padding: 24px; text-align: center; border-bottom: 2px solid #00D4FF; }
    .header h2 { margin: 0; font-size: 22px; }
    .content { padding: 24px; }
    .success-badge { display: inline-block; background: #10b981; color: white; padding: 10px 20px; border-radius: 4px; font-weight: 600; margin-top: 12px; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #00D4FF 0%, #0099CC 100%); color: #0A0E1A; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 16px; }
    .footer { background: #f5f5f5; padding: 16px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #e0e0e0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Account Approved! ✓</h2>
    </div>
    <div class="content">
      <p>Hi ${user.name || "there"},</p>
      <p>Great news! Your account has been approved by our administrator.</p>
      <p>You now have full access to the GigitekAI Support Center and all its features, including:</p>
      <ul>
        <li>Create and manage support tickets</li>
        <li>View ticket status and updates in real-time</li>
        <li>Chat with our support team</li>
        <li>Access to knowledge base and resources</li>
      </ul>
      <p><span class="success-badge">Status: Active</span></p>
      <p style="text-align: center;">
        <a href="https://gigitekai.com" class="cta-button">Access Support Center</a>
      </p>
      <p>If you have any questions or need assistance, feel free to reach out to our team at support@gigitek.com or call 609-676-4483.</p>
    </div>
    <div class="footer">
      <p style="margin: 0;">GigitekAI • Cloud & AI Solutions</p>
      <p style="margin: 4px 0 0;">support@gigitek.com • 609-676-4483</p>
      <p style="margin: 8px 0 0; font-size: 11px;"><a href="https://gigitekai.com/unsubscribe?email=${encodeURIComponent(user.email)}" style="color: #999; text-decoration: none;">Unsubscribe from account notifications</a></p>
    </div>
  </div>
</body>
</html>
              `;
              
              await sendEmail({
                to: user.email,
                subject: "Your GigitekAI Account Has Been Approved",
                html: emailBody,
              });
            } catch (emailError) {
              console.warn("[Auth] Failed to send approval email:", emailError);
            }
          }
          
          return { success: result };
        } catch (error) {
          console.error("Failed to approve user:", error);
          throw error;
        }
      }),
    revoke: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        try {
          // Get user details
          const allUsers = await getAllUsers();
          const user = allUsers.find(u => u.id === input.userId);
          
          const result = await revokeUser(input.userId);
          
          // Send rejection/revocation email
          if (user && user.email) {
            try {
              const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #0A0E1A 0%, #0F1A30 100%); color: #00D4FF; padding: 24px; text-align: center; border-bottom: 2px solid #00D4FF; }
    .header h2 { margin: 0; font-size: 22px; }
    .content { padding: 24px; }
    .status-badge { display: inline-block; background: #ef4444; color: white; padding: 10px 20px; border-radius: 4px; font-weight: 600; margin-top: 12px; }
    .footer { background: #f5f5f5; padding: 16px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #e0e0e0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Account Access Revoked</h2>
    </div>
    <div class="content">
      <p>Hi ${user.name || "there"},</p>
      <p>Your account access to the GigitekAI Support Center has been revoked.</p>
      <p><span class="status-badge">Status: Inactive</span></p>
      <p>If you believe this is an error or would like to request access again, please contact our support team:</p>
      <p>
        <strong>Email:</strong> support@gigitek.com<br/>
        <strong>Phone:</strong> 609-676-4483
      </p>
    </div>
    <div class="footer">
      <p style="margin: 0;">GigitekAI • Cloud & AI Solutions</p>
      <p style="margin: 4px 0 0;">support@gigitek.com • 609-676-4483</p>
      <p style="margin: 8px 0 0; font-size: 11px;"><a href="https://gigitekai.com/unsubscribe?email=${encodeURIComponent(user.email)}" style="color: #999; text-decoration: none;">Unsubscribe from account notifications</a></p>
    </div>
  </div>
</body>
</html>
              `;
              
              await sendEmail({
                to: user.email,
                subject: "Your GigitekAI Account Access Has Been Revoked",
                html: emailBody,
              });
            } catch (emailError) {
              console.warn("[Auth] Failed to send revocation email:", emailError);
            }
          }
          
          return { success: result };
        } catch (error) {
          console.error("Failed to revoke user:", error);
          throw error;
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
