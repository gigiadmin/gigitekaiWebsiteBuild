/**
 * Early Access Signup Router
 * Handles the landing page "Get Access" form:
 * 1. Sends notification email to support@gigitekai.com via MS Graph
 * 2. Sends Teams webhook notification
 * 3. Sends confirmation email back to the subscriber
 */
import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { sendEmail } from "../_core/email";
import { sendToTeamsWithRetry } from "../_core/teamsWebhookUtils";

export const earlyAccessRouter = router({
  signup: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
      })
    )
    .mutation(async ({ input }) => {
      const { email } = input;
      const timestamp = new Date().toLocaleString("en-US", {
        timeZone: "America/New_York",
      });

      console.log(`[Early Access] New signup: ${email} at ${timestamp}`);

      // 1. Send notification to support@gigitekai.com
      const supportNotification = sendEmail({
        to: "support@gigitekai.com",
        subject: `🚀 New Early Access Signup — ${email}`,
        html: `
          <div style="font-family:'DM Sans',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0A0E1A;color:#E8EAED;padding:2rem;border-radius:8px;">
            <div style="border-bottom:1px solid rgba(0,212,255,0.3);padding-bottom:1rem;margin-bottom:1.5rem;">
              <h1 style="font-family:'Space Grotesk',sans-serif;color:#00D4FF;font-size:1.5rem;margin:0;">New Early Access Signup</h1>
            </div>
            <p style="margin:0 0 1rem;"><strong style="color:#00D4FF;">Email:</strong> ${email}</p>
            <p style="margin:0 0 1rem;"><strong style="color:#00D4FF;">Submitted:</strong> ${timestamp}</p>
            <p style="margin:0 0 1rem;"><strong style="color:#00D4FF;">Source:</strong> GigitekAI Landing Page — Get Early Access</p>
            <div style="margin-top:1.5rem;padding-top:1rem;border-top:1px solid rgba(0,212,255,0.2);font-size:0.875rem;color:#94A3B8;">
              <p>This person wants early access to GigitekAI. Follow up to onboard them.</p>
            </div>
          </div>
        `,
      });

      // 2. Send Teams webhook notification
      const webhookUrl = process.env.TEAMS_WEBHOOK_URL || "";
      const teamsNotification = sendToTeamsWithRetry(
        webhookUrl,
        {
          "@type": "MessageCard",
          "@context": "http://schema.org/extensions",
          themeColor: "00D4FF",
          summary: `New Early Access Signup: ${email}`,
          sections: [
            {
              activityTitle: "🚀 New Early Access Signup",
              activitySubtitle: `From GigitekAI Landing Page`,
              facts: [
                { name: "Email", value: email },
                { name: "Time", value: timestamp },
                { name: "Source", value: "Landing Page — Get Early Access" },
              ],
              markdown: true,
            },
          ],
        },
        `Early Access signup: ${email}`
      );

      // 3. Send confirmation email to the subscriber
      const confirmationEmail = sendEmail({
        to: email,
        subject: "Welcome to GigitekAI — You're on the Early Access List!",
        html: `
          <div style="font-family:'DM Sans',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0A0E1A;color:#E8EAED;padding:2rem;border-radius:8px;">
            <div style="text-align:center;margin-bottom:2rem;">
              <h1 style="font-family:'Space Grotesk',sans-serif;font-size:2rem;margin:0;">
                <span style="color:#fff;">Gigitek</span><span style="color:#00D4FF;">AI</span>
              </h1>
            </div>
            <h2 style="font-family:'Space Grotesk',sans-serif;color:#00D4FF;font-size:1.25rem;margin:0 0 1rem;">You're In!</h2>
            <p style="line-height:1.7;margin:0 0 1rem;">Thank you for signing up for early access to GigitekAI. We're building the next generation of AI-powered managed services — agentic AI that works like full employees, automating workflows and delivering measurable ROI.</p>
            <p style="line-height:1.7;margin:0 0 1rem;">We'll be in touch soon with exclusive updates and early access to our platform.</p>
            <div style="margin:2rem 0;padding:1.5rem;background:rgba(0,212,255,0.05);border:1px solid rgba(0,212,255,0.2);border-radius:8px;">
              <p style="margin:0;font-size:0.875rem;color:#94A3B8;"><strong style="color:#00D4FF;">What to expect:</strong></p>
              <ul style="margin:0.5rem 0 0;padding-left:1.25rem;color:#CBD5E1;font-size:0.875rem;line-height:1.8;">
                <li>Platform launch announcement</li>
                <li>Early access invitation</li>
                <li>AI automation insights for your business</li>
              </ul>
            </div>
            <p style="line-height:1.7;margin:0 0 0.5rem;">Thank you for your interest in GigitekAI.</p>
            <p style="line-height:1.7;margin:0;color:#00D4FF;font-weight:600;">— The GigitekAI Team</p>
            <div style="margin-top:2rem;padding-top:1rem;border-top:1px solid rgba(0,212,255,0.2);text-align:center;font-size:0.75rem;color:#64748B;">
              <p style="margin:0;">© 2026 GigitekAI LLC | support@gigitekai.com</p>
            </div>
          </div>
        `,
      });

      // Fire all three in parallel — don't block the response on any single one
      const results = await Promise.allSettled([
        supportNotification,
        teamsNotification,
        confirmationEmail,
      ]);

      const supportSent =
        results[0].status === "fulfilled" && results[0].value === true;
      const teamsSent =
        results[1].status === "fulfilled" &&
        (results[1].value as any)?.success === true;
      const confirmSent =
        results[2].status === "fulfilled" && results[2].value === true;

      console.log(
        `[Early Access] Results — Support email: ${supportSent}, Teams: ${teamsSent}, Confirmation: ${confirmSent}`
      );

      return {
        success: true,
        notifications: {
          supportEmail: supportSent,
          teams: teamsSent,
          confirmationEmail: confirmSent,
        },
      };
    }),
});
