import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, adminProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { notifyOwner } from "./_core/notification";
import { sendEmail } from "./_core/email";
import { saveContactSubmission, getAllUsers, approveUser, revokeUser, getDb, logUserActivity, getUserActivityByUserId, getLastLoginByUserId, submitCustomerFeedback, getCustomerFeedbackByTicket, getAverageRating, recordWebsiteTraffic, getWebsiteTrafficByDate, getWebsiteTrafficSummary } from "./db";
import { users, contactSubmissions, emailMessages, agentMetrics } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { helpdeskRouter } from "./routers/helpdesk";
import { aibotRouter } from "./routers/aibot";
import { chatRouter } from "./routers/chat";
import { customerInvitesRouter } from "./routers/customer-invites";
import { feedbackRouter } from "./routers/feedback";
import { emailDigestRouter } from "./routers/emailDigest";
import { agentsRouter } from "./routers/agents";
import { adminAuthRouter } from "./routers/admin-auth";
import { blogRouter } from "./routers/blog";
import { newsletterRouter } from "./routers/newsletter";
import { adminNotificationsRouter } from "./routers/admin-notifications";
import { emailRouter } from "./routers/email";
import { emailForwardingRouter } from "./routers/email-forwarding";
import { emailRecipientGroupsRouter } from "./routers/emailRecipientGroups";
import { webPushRouter } from "./routers/webPush";
import { leadgenRouter } from "./routers/leadgen";
import { calendarRouter } from "./routers/calendar";
import { aiTriageRouter } from "./routers/aiTriage";
import { kbRouter } from "./routers/kb";
import { kbFeedbackRouter } from "./routers/kbFeedback";
import { emailDripRouter } from "./routers/emailDrip";
import { cannedResponsesRouter } from "./routers/cannedResponses";
import { socialRouter } from "./routers/social";
import { copilotRouter } from "./routers/copilot";
import { copilotM365Router } from "./routers/copilotM365";
import { copilotStudioRouter } from "./routers/copilotStudio";
import { pricingRouter } from "./routers/pricing";
import { helpdeskAgentSlaRouter } from "./routers/helpdesk-agent-sla";
import { ticketMergeRouter } from "./routers/helpdesk-ticket-merge";
import { bulkActionsRouter } from "./routers/helpdesk-bulk-actions";
import { emailToTicketRouter } from "./routers/helpdesk-email-to-ticket";
import { helpdeskAiTriageRouter } from "./routers/helpdesk-ai-triage";
import { helpdeskAiRepliesRouter } from "./routers/helpdesk-ai-replies";
import { helpdeskKbRouter } from "./routers/helpdesk-kb";
import { helpdeskNotificationsRouter } from "./routers/helpdesk-notifications";
import { buildContactFormResponseEmail } from "./contactFormTemplates";
import { helpdeskDashboardMetricsRouter } from "./routers/helpdesk-dashboard-metrics";
import { teamsPresenceSyncRouter } from "./routers/teams-presence-sync";
import { helpdeskSurveyRouter } from "./routers/helpdesk-survey";
import { kbSharingRouter } from "./routers/kb-sharing";
import { kbAnalyticsRouter } from "./routers/kb-analytics";
import { kbSearchAnalyticsRouter } from "./routers/kb-search-analytics";
import { kbGenerationRouter } from "./routers/kb-generation";
import { customerPortalRouter } from "./routers/customer-portal";
import { notificationsRouter } from "./routers/notifications";
import { adminRolesRouter } from "./routers/admin-roles-permissions";
import { adminMenuCustomizationRouter } from "./routers/admin-menu-customization";
import { m365HealthRouter } from "./routers/m365-health";
import { aiTicketCategorization } from "./routers/ai-ticket-categorization";
import { kbSeedingRouter } from "./routers/kb-seeding";
import { aiTrainingRouter } from "./routers/ai-training";
import { kbAiProactiveRouter } from "./routers/kb-ai-proactive";
import { remoteAssistanceRouter } from "./routers/remote-assistance";
import { remoteAssistanceRbacRouter } from "./routers/remote-assistance-rbac";
import { remoteAssistanceAnalyticsRouter } from "./routers/remote-assistance-analytics";
import { teamsRemoteAssistanceRouter } from "./routers/teams-remote-assistance";
import { sessionRecordingRouter } from "./routers/session-recording";
import { slaBreachAlertsRouter } from "./routers/sla-breach-alerts";
import { ticketAutoEscalationRouter } from "./routers/ticket-auto-escalation";
import { clientSatisfactionSurveyRouter } from "./routers/client-satisfaction-survey";
import { slaComplianceReportsRouter } from "./routers/sla-compliance-reports";
import { ticketAICategorizationRouter } from "./routers/ticket-ai-categorization";
import { sessionInviteEmailRouter } from "./routers/session-invite-email";
import { turnCredentialsRouter } from "./routers/turn-credentials";
import { ticketRoutingRouter } from "./routers/ticket-routing";
import { serviceHealthMonitoringRouter } from "./routers/service-health-monitoring";
import { serviceHealthThresholdsRouter } from "./routers/service-health-thresholds";
import { serviceStatusSubscriptionRouter } from "./routers/service-status-subscriptions";
import { quickAssistRouter } from "./routers/quickAssist";
import { teamsChannelsRouter } from "./routers/teams-channels";
import { teamsMeetingEscalationRouter } from "./routers/teams-meeting-escalation";
import { msLearnSyncRouter } from "./routers/ms-learn-sync";
import { callsRouter } from "./routers/calls";
import { clientOnboardingRouter } from "./routers/client-onboarding";
import { uptimerobotRouter } from "./routers/uptimerobot";
import { slaPredicationRouter } from "./routers/sla-prediction";
import { sentimentAnalysisRouter } from "./routers/sentiment-analysis";
import { kbAutoLinkingRouter } from "./routers/kb-auto-linking";
import { agentGamificationRouter } from "./routers/agent-gamification";
import { kbEnhancementsRouter } from "./routers/kb-enhancements";
import { kbBulkOperationsRouter } from "./routers/kb-bulk-operations";
import { kbFinalFeaturesRouter } from "./routers/kb-final-features";
import { kbCompletionRouter } from "./routers/kb-completion";
import { callRecordingRouter } from "./routers/phase2-callRecording";
import { callTranscriptRouter } from "./routers/phase2-callTranscript";
import { sentimentRoutingRouter } from "./routers/phase2-sentimentRouting";
import { agentDashboardRouter } from "./routers/phase2-agentDashboard";
import { dynamicsIntegrationRouter } from "./routers/phase2-dynamicsIntegration";
import { callAnalyticsRouter } from "./routers/phase2-callAnalytics";
import { acsRouter } from "./routers/acs";
import { userAccountMgmtRouter } from "./routers/user-account-mgmt";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  uptimerobot: uptimerobotRouter,
  m365Health: m365HealthRouter,
  serviceHealthMonitoring: serviceHealthMonitoringRouter,
  serviceHealthThresholds: serviceHealthThresholdsRouter,
  serviceStatusSubscriptions: serviceStatusSubscriptionRouter,
  quickAssist: quickAssistRouter,
  slaPrediction: slaPredicationRouter,
  sentimentAnalysis: sentimentAnalysisRouter,
  kbAutoLinking: kbAutoLinkingRouter,
  agentGamification: agentGamificationRouter,
  teamsChannels: teamsChannelsRouter,
  teamsMeetingEscalation: teamsMeetingEscalationRouter,
  msLearnSync: msLearnSyncRouter,
  calls: callsRouter,
  clientOnboarding: clientOnboardingRouter,
  aiTicketCategorization: aiTicketCategorization,
  kbSeeding: kbSeedingRouter,
  aiTraining: aiTrainingRouter,
  ticketRouting: ticketRoutingRouter,
  agents: agentsRouter,
  adminAuth: adminAuthRouter,
  adminNotifications: adminNotificationsRouter,
  email: emailRouter,
  emailForwarding: emailForwardingRouter,
  emailGroups: emailRecipientGroupsRouter,
  webPush: webPushRouter,
  leadgen: leadgenRouter,
  calendar: calendarRouter,
  aiTriage: aiTriageRouter,
  kb: kbRouter,
  kbFeedback: kbFeedbackRouter,
  cannedResponses: cannedResponsesRouter,
  social: socialRouter,
  copilot: copilotRouter,
  copilotM365: copilotM365Router,
  copilotStudio: copilotStudioRouter,
  pricing: pricingRouter,
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
  helpdeskAgentSla: helpdeskAgentSlaRouter,
  ticketMerge: ticketMergeRouter,
  bulkActions: bulkActionsRouter,
  emailToTicket: emailToTicketRouter,
  helpdeskAiTriage: helpdeskAiTriageRouter,
  helpdeskAiReplies: helpdeskAiRepliesRouter,
  helpdeskKb: helpdeskKbRouter,
  helpdeskNotifications: helpdeskNotificationsRouter,
  helpdeskDashboardMetrics: helpdeskDashboardMetricsRouter,
  teamsPresenceSync: teamsPresenceSyncRouter,
  helpdeskSurvey: helpdeskSurveyRouter,
  kbSharing: kbSharingRouter,
  kbAnalytics: kbAnalyticsRouter,
  kbSearchAnalytics: kbSearchAnalyticsRouter,
  kbGeneration: kbGenerationRouter,
  kbEnhancements: kbEnhancementsRouter,
  kbBulkOperations: kbBulkOperationsRouter,
  kbFinalFeatures: kbFinalFeaturesRouter,
  kbCompletion: kbCompletionRouter,
  kbAiProactive: kbAiProactiveRouter,
  remoteAssistance: remoteAssistanceRouter,
  remoteAssistanceRbac: remoteAssistanceRbacRouter,
  remoteAssistanceAnalytics: remoteAssistanceAnalyticsRouter,
  teamsRemoteAssistance: teamsRemoteAssistanceRouter,
  sessionRecording: sessionRecordingRouter,
    slaBreachAlerts: slaBreachAlertsRouter,
    ticketAutoEscalation: ticketAutoEscalationRouter,
    clientSatisfactionSurvey: clientSatisfactionSurveyRouter,
    slaComplianceReports: slaComplianceReportsRouter,
  userAccountMgmt: userAccountMgmtRouter,
    ticketAICategorization: ticketAICategorizationRouter,
  sessionInviteEmail: sessionInviteEmailRouter,
  turnCredentials: turnCredentialsRouter,
  customerPortal: customerPortalRouter,
  notifications: notificationsRouter,
  adminRoles: adminRolesRouter,
  adminMenuCustomization: adminMenuCustomizationRouter,
  aibot: aibotRouter,
  chat: chatRouter,
  customerInvites: customerInvitesRouter,
  feedback: feedbackRouter,
  emailDigest: emailDigestRouter,
  blog: blogRouter,
  newsletter: newsletterRouter,

  // ── Phase 2: Call Center Integration ────────────────────────────────
  callRecording: callRecordingRouter,
  callTranscript: callTranscriptRouter,
  sentimentRouting: sentimentRoutingRouter,
  agentDashboard: agentDashboardRouter,
  dynamicsIntegration: dynamicsIntegrationRouter,
  callAnalytics: callAnalyticsRouter,
  acs: acsRouter,

  // ── User Activity Tracking ──────────────────────────────────────────
  userActivity: router({
    logActivity: adminProcedure
      .input(
        z.object({
          userId: z.number(),
          activityType: z.string(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await logUserActivity({ userId: input.userId, activityType: input.activityType, description: input.description });
      }),
    
    getActivityLog: adminProcedure
      .input(
        z.object({
          userId: z.number(),
          limit: z.number().default(50),
        })
      )
      .query(async ({ input }) => {
        return await getUserActivityByUserId(input.userId, input.limit);
      }),
    
    getLastLogin: adminProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return await getLastLoginByUserId(input.userId);
      }),
  }),

  // ── Customer Feedback & Rating System ─────────────────────────────────
  customerFeedback: router({
    submitFeedback: protectedProcedure
      .input(
        z.object({
          ticketId: z.number(),
          rating: z.number().min(1).max(5),
          comment: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await submitCustomerFeedback({ ticketId: input.ticketId, userId: ctx.user.id, rating: input.rating, comment: input.comment });
      }),
    
    getFeedback: adminProcedure
      .input(z.object({ ticketId: z.number() }))
      .query(async ({ input }) => {
        return await getCustomerFeedbackByTicket(input.ticketId);
      }),
    
    getAverageRating: adminProcedure
      .input(z.object({ ticketId: z.number().optional() }))
      .query(async ({ input }) => {
        return await getAverageRating(input.ticketId);
      }),
  }),

  // ── Real-time Website Traffic Analytics ───────────────────────────────
  websiteTraffic: router({
    trackPageView: publicProcedure
      .input(
        z.object({
          pageUrl: z.string(),
          pageTitle: z.string().optional(),
          referrer: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await recordWebsiteTraffic({ date: new Date(), pageUrl: input.pageUrl, pageTitle: input.pageTitle, referrer: input.referrer });
      }),
    
    getTrafficStats: adminProcedure
      .input(
        z.object({
          days: z.number().default(30),
        })
      )
      .query(async ({ input }) => {
        return await getWebsiteTrafficSummary(input.days);
      }),
    
    getTrafficByDate: adminProcedure
      .input(
        z.object({
          date: z.date(),
        })
      )
      .query(async ({ input }) => {
        return await getWebsiteTrafficByDate(input.date);
      }),
  }),

  contact: router({
    submit: publicProcedure
      .input(
        z.object({
          name: z.string().min(1, "Name is required"),
          email: z.string().email("Valid email is required"),
          company: z.string().optional(),
          phone: z.string().optional(),
          subject: z.string().optional(),
          message: z.string().min(1, "Message is required"),
          pricingTier: z.string().optional(), // starter, professional, enterprise
          companySize: z.string().optional(), // 1-10, 11-50, 51-200, 200+
          hearAboutUs: z.string().optional(), // How did you hear about us?
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
            phone: input.phone,
            subject: input.subject,
            message: input.message,
            pricingTier: input.pricingTier,
            companySize: input.companySize,
            hearAboutUs: input.hearAboutUs,
          });

          // Notify owner in Manus dashboard
          const notificationContent = `
**New Contact Form Submission**

**Name:** ${input.name}
**Email:** ${input.email}
**Company:** ${input.company || "Not provided"}
**How did you hear about us:** ${input.hearAboutUs || "Not provided"}

**Message:**
${input.message}

---
Submitted from GigitekAI website contact form.
          `;

          await notifyOwner({
            title: `New Contact: ${input.name}`,
            content: notificationContent,
          });

          // Send email to support team
          try {
            await sendEmail({
              to: "support@gigitekai.com",
              subject: `New Contact Form Submission: ${input.name}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #00D4FF;">New Contact Form Submission</h2>
                  <p><strong>Name:</strong> ${input.name}</p>
                  <p><strong>Email:</strong> <a href="mailto:${input.email}">${input.email}</a></p>
                  <p><strong>Company:</strong> ${input.company || "Not provided"}</p>
                  <p><strong>How did you hear about us:</strong> ${input.hearAboutUs || "Not provided"}</p>
                  <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                  <h3>Message:</h3>
                  <p>${input.message.replace(/\n/g, "<br>")}</p>
                  <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                  <p style="font-size: 12px; color: #999;">Submitted from GigitekAI website contact form</p>
                </div>
              `,
              replyTo: input.email,
            });
          } catch (emailError) {
            console.error("[Contact Form] Failed to send email notification:", emailError);
            // Don't fail the submission if email fails
          }

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
    // ── List Contact Submissions (Admin Only) ──────────────────────────────────
    list: adminProcedure.query(async () => {
      try {
        const db = await getDb();
        if (!db) return [];
        const { desc } = await import("drizzle-orm");
        return await db
          .select()
          .from(contactSubmissions)
          .orderBy(desc(contactSubmissions.createdAt))
          .limit(200);
      } catch (error) {
        console.error("[Contact] List failed:", error);
        return [];
      }
    }),
  }),

  // ── Switch Program Lead Capture ─────────────────────────────────────────
  switchProgram: router({
    submitAuditRequest: publicProcedure
      .input(
        z.object({
          name: z.string().min(1, "Name is required"),
          email: z.string().email("Valid email is required"),
          company: z.string().min(1, "Company is required"),
          currentMsp: z.string().optional(),
          userCount: z.string().optional(),
          phone: z.string().optional(),
          painPoint: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          // Notify owner in Manus dashboard
          await notifyOwner({
            title: `🔄 Switch Program Lead: ${input.name} @ ${input.company}`,
            content: `**New Switch Program IT Audit Request**\n\n**Name:** ${input.name}\n**Email:** ${input.email}\n**Company:** ${input.company}\n**Current MSP:** ${input.currentMsp || "Not provided"}\n**User Count:** ${input.userCount || "Not provided"}\n**Phone:** ${input.phone || "Not provided"}\n**Main Pain Point:** ${input.painPoint || "Not provided"}\n\n---\nSubmitted from gigitekai.com/switch-program`,
          });

          // Send email notification to support team
          try {
            await sendEmail({
              to: "support@gigitekai.com",
              subject: `🔄 Switch Program Lead: ${input.name} @ ${input.company}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0E1A; color: #e2e8f0; padding: 24px; border-radius: 12px;">
                  <h2 style="color: #00D4FF; margin-bottom: 4px;">Switch Program — Free IT Audit Request</h2>
                  <p style="color: #94a3b8; font-size: 13px; margin-bottom: 24px;">Submitted from gigitekai.com/switch-program</p>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 8px 0; color: #94a3b8; width: 140px;">Name</td><td style="padding: 8px 0; font-weight: bold;">${input.name}</td></tr>
                    <tr><td style="padding: 8px 0; color: #94a3b8;">Email</td><td style="padding: 8px 0;"><a href="mailto:${input.email}" style="color: #00D4FF;">${input.email}</a></td></tr>
                    <tr><td style="padding: 8px 0; color: #94a3b8;">Company</td><td style="padding: 8px 0;">${input.company}</td></tr>
                    <tr><td style="padding: 8px 0; color: #94a3b8;">Current MSP</td><td style="padding: 8px 0;">${input.currentMsp || "Not provided"}</td></tr>
                    <tr><td style="padding: 8px 0; color: #94a3b8;">User Count</td><td style="padding: 8px 0;">${input.userCount || "Not provided"}</td></tr>
                    <tr><td style="padding: 8px 0; color: #94a3b8;">Phone</td><td style="padding: 8px 0;">${input.phone || "Not provided"}</td></tr>
                    <tr><td style="padding: 8px 0; color: #94a3b8;">Pain Point</td><td style="padding: 8px 0;">${input.painPoint || "Not provided"}</td></tr>
                  </table>
                  <div style="margin-top: 24px; padding: 16px; background: rgba(0,212,255,0.08); border: 1px solid rgba(0,212,255,0.2); border-radius: 8px;">
                    <p style="color: #00D4FF; font-weight: bold; margin: 0 0 8px;">Next Step</p>
                    <p style="margin: 0; font-size: 14px;">Reply to this email or call ${input.phone || input.email} to schedule the free IT audit within 24 hours.</p>
                  </div>
                </div>
              `,
              replyTo: input.email,
            });
          } catch (emailError) {
            console.error("[Switch Program] Email notification failed:", emailError);
          }

          // Send confirmation email to the prospect
          try {
            await sendEmail({
              to: input.email,
              subject: "Your Free IT Audit Request — GigitekAI Switch Program",
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0E1A; color: #e2e8f0; padding: 24px; border-radius: 12px;">
                  <h2 style="color: #00D4FF;">We received your request, ${input.name.split(' ')[0]}!</h2>
                  <p>Thank you for your interest in GigitekAI's Switch Program. A member of our team will contact you within <strong>24 hours</strong> to schedule your free IT audit.</p>
                  <div style="margin: 24px 0; padding: 16px; background: rgba(0,212,255,0.08); border: 1px solid rgba(0,212,255,0.2); border-radius: 8px;">
                    <p style="color: #00D4FF; font-weight: bold; margin: 0 0 8px;">What happens next?</p>
                    <ol style="margin: 0; padding-left: 20px; color: #cbd5e1;">
                      <li style="margin-bottom: 8px;">Our team reviews your current environment details</li>
                      <li style="margin-bottom: 8px;">We schedule a 30-minute discovery call</li>
                      <li style="margin-bottom: 8px;">You receive a free IT audit report with migration plan</li>
                      <li>We kick off your zero-downtime migration</li>
                    </ol>
                  </div>
                  <p style="color: #94a3b8; font-size: 13px;">Questions? Call us at <a href="tel:+17273825776" style="color: #00D4FF;">(727) 382-5776</a> or email <a href="mailto:support@gigitekai.com" style="color: #00D4FF;">support@gigitekai.com</a></p>
                  <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 24px 0;">
                  <p style="color: #64748b; font-size: 12px;">GigitekAI • Cloud & AI Solutions • gigitekai.com</p>
                </div>
              `,
            });
          } catch (confirmError) {
            console.error("[Switch Program] Confirmation email failed:", confirmError);
          }

          return { success: true, message: "Thank you! We'll contact you within 24 hours to schedule your free IT audit." };
        } catch (error) {
          console.error("[Switch Program] Submission failed:", error);
          return { success: true, message: "Thank you! We'll contact you within 24 hours to schedule your free IT audit." };
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
        <a href="https://gigitekai.com/admin" class="cta-button">Access Support Center</a>
      </p>
      <p>If you have any questions or need assistance, feel free to reach out to our team at support@gigitekai.com or call +1 727 382 6909.</p>
    </div>
    <div class="footer">
      <p style="margin: 0;">GigitekAI • Cloud & AI Solutions</p>
      <p style="margin: 4px 0 0;">support@gigitekai.com • +1 727 382 6909</p>
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
        <strong>Email:</strong> support@gigitekai.com<br/>
        <strong>Phone:</strong> +1 727 382 6909
      </p>
    </div>
    <div class="footer">
      <p style="margin: 0;">GigitekAI • Cloud & AI Solutions</p>
      <p style="margin: 4px 0 0;">support@gigitekai.com • +1 727 382 6909</p>
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
    updateRole: adminProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["user", "admin", "technician"]) }))
      .mutation(async ({ input }) => {
        try {
          const db = await getDb();
          if (!db) throw new Error("Database connection failed");
          await db
            .update(users)
            .set({ role: input.role })
            .where(eq(users.id, input.userId));
          return { success: true };
        } catch (error) {
          console.error("Failed to update user role:", error);
          throw error;
        }
      }),
    invite: adminProcedure
      .input(z.object({ email: z.string().email(), role: z.enum(["admin", "technician"]), name: z.string().optional() }))
      .mutation(async ({ input }) => {
        try {
          const signupUrl = "https://gigitekai.com/helpdesk";
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
    .role-badge { display: inline-block; background: #00D4FF; color: #0A0E1A; padding: 8px 16px; border-radius: 4px; font-weight: 600; margin-top: 12px; font-size: 14px; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #00D4FF 0%, #0099CC 100%); color: #0A0E1A; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 16px; }
    .footer { background: #f5f5f5; padding: 16px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #e0e0e0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>You're Invited to GigitekAI! 🚀</h2>
    </div>
    <div class="content">
      <p>Hi ${input.name || "there"},</p>
      <p>You've been invited to join the GigitekAI team as a <strong>${input.role === "admin" ? "Administrator" : "Technician"}</strong>.</p>
      <p>Click the button below to sign up and get started:</p>
      <a href="${signupUrl}" class="cta-button">Accept Invitation & Sign Up</a>
      <p style="margin-top: 20px; font-size: 12px; color: #666;">This invitation is for: <strong>${input.email}</strong></p>
      <p style="font-size: 12px; color: #666;">Role: <span class="role-badge">${input.role === "admin" ? "Administrator" : "Technician"}</span></p>
    </div>
    <div class="footer">
      <p style="margin: 0;">GigitekAI • Cloud & AI Solutions</p>
      <p style="margin: 4px 0 0;">support@gigitekai.com • +1 727 382 6909</p>
    </div>
  </div>
</body>
</html>
          `;
          
          await sendEmail({
            to: input.email,
            subject: `You're Invited to Join GigitekAI as a ${input.role === "admin" ? "Administrator" : "Technician"}`,
            html: emailBody,
          });
          
          return { success: true, message: `Invitation sent to ${input.email}` };
        } catch (error) {
          console.error("Failed to send invitation:", error);
          throw error;
        }
      }),
  }),

  // ── AI Demo Page — Lead Capture ─────────────────────────────────────────
  demo: router({
    submitLead: publicProcedure
      .input(
        z.object({
          name: z.string().min(1, "Name is required"),
          email: z.string().email("Valid email is required"),
          company: z.string().optional(),
          scenario: z.string().optional(), // Which demo scenario they were viewing
          message: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const db = await getDb();
          if (!db) throw new Error("Database unavailable");
          const { demoLeads } = await import("../drizzle/schema");
          await db.insert(demoLeads).values({
            name: input.name,
            email: input.email,
            company: input.company ?? null,
            scenario: input.scenario ?? null,
            message: input.message ?? null,
          });

          // Notify owner in Manus dashboard
          await notifyOwner({
            title: `New AI Demo Lead: ${input.name}`,
            content: `**Name:** ${input.name}\n**Email:** ${input.email}\n**Company:** ${input.company || "Not provided"}\n**Scenario:** ${input.scenario || "Not specified"}\n**Message:** ${input.message || "None"}\n\nSubmitted from the /ai-demo page.`,
          });

          // Send notification email to support team
          try {
            await sendEmail({
              to: "support@gigitekai.com",
              subject: `New AI Demo Lead: ${input.name}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #00D4FF;">New AI Demo Lead</h2>
                  <p><strong>Name:</strong> ${input.name}</p>
                  <p><strong>Email:</strong> <a href="mailto:${input.email}">${input.email}</a></p>
                  <p><strong>Company:</strong> ${input.company || "Not provided"}</p>
                  <p><strong>Demo Scenario Viewed:</strong> ${input.scenario || "Not specified"}</p>
                  <p><strong>Message:</strong> ${input.message || "None"}</p>
                  <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                  <p style="font-size: 12px; color: #999;">Submitted from the GigitekAI AI Demo page</p>
                </div>
              `,
              replyTo: input.email,
            });
          } catch (emailError) {
            console.error("[Demo Lead] Failed to send email notification:", emailError);
          }

          return { success: true, message: "Thank you! We'll be in touch within 1 business day." };
        } catch (error) {
          console.error("[Demo Lead] Submission failed:", error);
          return { success: true, message: "Thank you! We'll be in touch within 1 business day." };
        }
      }),

    // Admin: list all demo leads
    listLeads: adminProcedure.query(async () => {
      try {
        const db = await getDb();
        if (!db) return [];
        const { demoLeads } = await import("../drizzle/schema");
        const { desc } = await import("drizzle-orm");
        return await db.select().from(demoLeads).orderBy(desc(demoLeads.createdAt)).limit(200);
      } catch (error) {
        console.error("[Demo Lead] List failed:", error);
        return [];
      }
    }),
  }),

  // ── Production Maintenance — clear test/demo data (admin only) ──────────
  maintenance: router({
    clearTestData: adminProcedure
      .mutation(async () => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        const emailResult = await db.delete(emailMessages);
        const metricsResult = await db.delete(agentMetrics);
        return {
          success: true,
          emailsDeleted: (emailResult as any).affectedRows ?? 0,
          metricsDeleted: (metricsResult as any).affectedRows ?? 0,
          message: "Test data cleared. Database is production-ready.",
        };
      }),
   }),
  emailDrip: emailDripRouter,
})
export type AppRouter = typeof appRouter;
