import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { notifyOwner } from "./_core/notification";
import { saveContactSubmission } from "./db";
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
        })
      )
      .mutation(async ({ input }) => {
        try {
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

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
