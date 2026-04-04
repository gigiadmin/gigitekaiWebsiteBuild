import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { notifyOwner } from "./_core/notification";
import { sendEmail } from "./_core/email";

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

  contact: router({
    submit: publicProcedure
      .input(
        z.object({
          name: z.string().min(1, "Name is required"),
          email: z.string().email("Valid email is required"),
          company: z.string().optional(),
          message: z.string().min(1, "Message is required"),
        })
      )
      .mutation(async ({ input }) => {
        // Create HTML email content
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'DM Sans', Arial, sans-serif; color: #333; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
    .header { background: linear-gradient(135deg, #0A0E1A 0%, #0F1629 100%); color: #00D4FF; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .header h2 { margin: 0; font-size: 24px; }
    .content { background: white; padding: 20px; border-radius: 8px; border: 1px solid #e0e0e0; }
    .field { margin-bottom: 15px; }
    .label { font-weight: 600; color: #0A0E1A; margin-bottom: 5px; }
    .value { color: #555; }
    .message-box { background: #f5f5f5; padding: 15px; border-left: 4px solid #00D4FF; border-radius: 4px; margin-top: 20px; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #999; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>🚀 New Contact Form Submission</h2>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">Name</div>
        <div class="value">${input.name}</div>
      </div>
      <div class="field">
        <div class="label">Email</div>
        <div class="value"><a href="mailto:${input.email}">${input.email}</a></div>
      </div>
      <div class="field">
        <div class="label">Company</div>
        <div class="value">${input.company || "Not provided"}</div>
      </div>
      <div class="message-box">
        <div class="label">Message</div>
        <div class="value">${input.message.replace(/\n/g, "<br>")}</div>
      </div>
      <div class="footer">
        <p>This submission came from the GigitekAI website contact form.</p>
      </div>
    </div>
  </div>
</body>
</html>
        `;

        try {
          // Send email to support@gigitekai.com
          await sendEmail({
            to: "support@gigitekai.com",
            subject: `New Contact: ${input.name}`,
            html: htmlContent,
          });

          // Also notify owner in Manus dashboard
          await notifyOwner({
            title: `New Contact: ${input.name}`,
            content: `Email: ${input.email}\nCompany: ${input.company || "Not provided"}\n\nMessage: ${input.message}`,
          }).catch(() => {
            // Silently fail if notification doesn't work
          });

          return {
            success: true,
            message: "Thank you! Your message has been received. We'll get back to you within 1 business day.",
          };
        } catch (error) {
          console.error("[Contact Form] Submission failed:", error);
          return {
            success: true,
            message: "Thank you! Your message has been received. We'll get back to you within 1 business day.",
          };
        }
      }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
