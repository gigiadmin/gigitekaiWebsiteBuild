/**
 * Lead Generation Router — Cybersecurity Assessment, Exit Intent, Multi-Step Form
 *
 * Features:
 *  - Cybersecurity Risk Assessment (10-question quiz with PDF report)
 *  - Exit Intent Popup (lead magnet capture)
 *  - Multi-Step Contact Form (3-step guided form)
 *  - Lead analytics and tracking
 */
import { z } from "zod";
import { getDb } from "../db";
import {
  securityAssessments,
  exitIntentPopups,
  multiStepFormSubmissions,
  leadGenAnalytics,
} from "../../drizzle/schema";
import { eq, desc, gte, lte, and, or } from "drizzle-orm";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { sendEmail } from "../_core/email";
import { notifyOwner } from "../_core/notification";

export const leadgenRouter = router({
  // ── Cybersecurity Risk Assessment ────────────────────────────────────────────
  submitAssessment: publicProcedure
    .input(
      z.object({
        email: z.string().email("Valid email required"),
        companyName: z.string().min(1, "Company name required"),
        firstName: z.string().min(1, "First name required"),
        lastName: z.string().min(1, "Last name required"),
        phone: z.string().optional(),
        emailSecurityScore: z.number().int().min(0).max(10),
        endpointProtectionScore: z.number().int().min(0).max(10),
        backupRecoveryScore: z.number().int().min(0).max(10),
        identityManagementScore: z.number().int().min(0).max(10),
        complianceScore: z.number().int().min(0).max(10),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");

        // Calculate overall score and risk level
        const overallScore =
          input.emailSecurityScore +
          input.endpointProtectionScore +
          input.backupRecoveryScore +
          input.identityManagementScore +
          input.complianceScore;

        let riskLevel: "critical" | "high" | "medium" | "low";
        if (overallScore <= 10) riskLevel = "critical";
        else if (overallScore <= 20) riskLevel = "high";
        else if (overallScore <= 35) riskLevel = "medium";
        else riskLevel = "low";

        // Store assessment
        const result = await db
          .insert(securityAssessments)
          .values({
            email: input.email,
            companyName: input.companyName,
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone,
            emailSecurityScore: input.emailSecurityScore,
            endpointProtectionScore: input.endpointProtectionScore,
            backupRecoveryScore: input.backupRecoveryScore,
            identityManagementScore: input.identityManagementScore,
            complianceScore: input.complianceScore,
            overallScore,
            riskLevel,
            leadCaptured: true,
          })
          .$returningId();

        const assessmentId = (result[0] as any)?.id || 0;

        // Send assessment results email
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; color: #333;">
            <h2>Your Cybersecurity Risk Assessment Results</h2>
            <p>Hi ${input.firstName},</p>
            <p>Thank you for completing GigitekAI's Cybersecurity Risk Assessment. Here are your results:</p>
            
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Overall Risk Level: <span style="color: ${riskLevel === "critical" ? "#d32f2f" : riskLevel === "high" ? "#f57c00" : riskLevel === "medium" ? "#fbc02d" : "#388e3c"};">${riskLevel.toUpperCase()}</span></h3>
              <p>Overall Score: ${overallScore}/50</p>
              
              <table style="width: 100%; margin-top: 15px;">
                <tr>
                  <td style="padding: 8px;"><strong>Email Security:</strong></td>
                  <td style="padding: 8px;">${input.emailSecurityScore}/10</td>
                </tr>
                <tr style="background: #fff;">
                  <td style="padding: 8px;"><strong>Endpoint Protection:</strong></td>
                  <td style="padding: 8px;">${input.endpointProtectionScore}/10</td>
                </tr>
                <tr>
                  <td style="padding: 8px;"><strong>Backup & Recovery:</strong></td>
                  <td style="padding: 8px;">${input.backupRecoveryScore}/10</td>
                </tr>
                <tr style="background: #fff;">
                  <td style="padding: 8px;"><strong>Identity Management:</strong></td>
                  <td style="padding: 8px;">${input.identityManagementScore}/10</td>
                </tr>
                <tr>
                  <td style="padding: 8px;"><strong>Compliance:</strong></td>
                  <td style="padding: 8px;">${input.complianceScore}/10</td>
                </tr>
              </table>
            </div>
            
            <p>Our team will review your assessment and reach out within 24 hours with personalized recommendations.</p>
            <p><a href="https://gigitekai.com/contact" style="background: #00d4ff; color: #000; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Schedule Your Free Consultation</a></p>
            
            <p>Best regards,<br>The GigitekAI Team</p>
          </div>
        `;

        await sendEmail({
          to: input.email,
          subject: `Your GigitekAI Cybersecurity Risk Assessment Results - ${riskLevel.toUpperCase()}`,
          html: emailHtml,
          replyTo: "support@gigitek.com",
        });

        // Notify admin
        await notifyOwner({
          title: `New Security Assessment: ${input.companyName}`,
          content: `${input.firstName} ${input.lastName} (${input.email}) completed the cybersecurity assessment with ${riskLevel} risk level (${overallScore}/50).`,
        }).catch(() => {});

        return {
          success: true,
          assessmentId,
          overallScore,
          riskLevel,
        };
      } catch (error) {
        console.error("[LeadGen] Assessment submission failed:", error);
        throw error;
      }
    }),

  // ── Exit Intent Popup Lead Capture ──────────────────────────────────────────
  captureExitIntent: publicProcedure
    .input(
      z.object({
        email: z.string().email("Valid email required"),
        firstName: z.string().min(1, "First name required"),
        lastName: z.string().min(1, "Last name required"),
        phone: z.string().optional(),
        companyName: z.string().optional(),
        leadMagnetDownloaded: z.string(), // which guide
        pageUrl: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");

        // Store popup lead
        const result = await db
          .insert(exitIntentPopups)
          .values({
            email: input.email,
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone,
            companyName: input.companyName,
            leadMagnetDownloaded: input.leadMagnetDownloaded,
            pageUrl: input.pageUrl,
            leadCaptured: true,
          })
          .$returningId();

        const popupLeadId = (result[0] as any)?.id || 0;

        // Send lead magnet email
        const emailHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #0a0e1a 0%, #1a1f3a 100%); padding: 32px 30px; border-radius: 8px 8px 0 0; text-align: center;">
              <div style="color: #00d4ff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">GigitekAI</div>
              <div style="color: #8892a4; font-size: 13px; margin-top: 4px;">Powering the Next Generation of Enterprise Technology</div>
            </div>
            <!-- Body -->
            <div style="background: #f8f9fa; padding: 32px 30px;">
              <p style="color: #333; font-size: 16px; margin-top: 0;">Hi ${input.firstName},</p>
              <p style="color: #333; font-size: 15px; line-height: 1.6;">Thank you for downloading <strong style="color: #0a0e1a;">${input.leadMagnetDownloaded}</strong>. Your guide is ready — check your inbox for the attachment.</p>
              <!-- Guide box -->
              <div style="background: white; border-left: 4px solid #00d4ff; padding: 18px 20px; margin: 24px 0; border-radius: 0 6px 6px 0; box-shadow: 0 1px 4px rgba(0,0,0,0.06);">
                <div style="font-weight: 700; color: #0a0e1a; margin-bottom: 6px;">📄 ${input.leadMagnetDownloaded}</div>
                <div style="color: #555; font-size: 14px;">Practical insights to help you identify gaps and modernize your IT infrastructure with confidence.</div>
              </div>
              <p style="color: #333; font-size: 15px; line-height: 1.6;">Ready to take the next step? Our team specializes in Microsoft 365, AI automation, cybersecurity, and managed IT services tailored for growing businesses.</p>
              <!-- CTA Button -->
              <div style="text-align: center; margin: 28px 0;">
                <a href="https://gigitekai.com" style="background: #00d4ff; color: #0a0e1a; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 700; font-size: 15px;">Schedule a Free Strategy Call</a>
              </div>
              <p style="color: #555; font-size: 14px; line-height: 1.6;">Questions? Reply to this email or call us at <strong>609-676-4483</strong>. We're here to help.</p>
            </div>
            <!-- Footer -->
            <div style="background: #0a0e1a; padding: 20px 30px; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="color: #8892a4; font-size: 12px; margin: 0;">GigitekAI LLC &nbsp;|&nbsp; 609-676-4483 &nbsp;|&nbsp; support@gigitek.com</p>
              <p style="margin: 6px 0 0;"><a href="https://gigitekai.com" style="color: #00d4ff; font-size: 12px; text-decoration: none;">gigitekai.com</a></p>
            </div>
          </div>
        `;

        await sendEmail({
          to: input.email,
          subject: `Your Free Guide: ${input.leadMagnetDownloaded}`,
          html: emailHtml,
          replyTo: "support@gigitek.com",
        });

        // Notify admin
        await notifyOwner({
          title: `New Exit Intent Lead: ${input.firstName} ${input.lastName}`,
          content: `Downloaded: ${input.leadMagnetDownloaded} | ${input.email}`,
        }).catch(() => {});

        return {
          success: true,
          popupLeadId,
        };
      } catch (error) {
        console.error("[LeadGen] Exit intent capture failed:", error);
        throw error;
      }
    }),

  // ── Multi-Step Contact Form ─────────────────────────────────────────────────
  submitMultiStepForm: publicProcedure
    .input(
      z.object({
        email: z.string().email("Valid email required"),
        firstName: z.string().min(1, "First name required"),
        lastName: z.string().min(1, "Last name required"),
        phone: z.string().min(1, "Phone required"),
        companyName: z.string().min(1, "Company name required"),
        employeeCount: z.string(), // "1-10", "11-50", "51-100", "100+"
        currentITSetup: z.string().optional(),
        needsCybersecurity: z.boolean().default(false),
        needsCloud: z.boolean().default(false),
        needsHelpdesk: z.boolean().default(false),
        needsAI: z.boolean().default(false),
        otherNeeds: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");

        // Determine lead quality
        const needsCount = [
          input.needsCybersecurity,
          input.needsCloud,
          input.needsHelpdesk,
          input.needsAI,
        ].filter(Boolean).length;

        let leadQuality: "hot" | "warm" | "cold" = "cold";
        if (needsCount >= 3) leadQuality = "hot";
        else if (needsCount >= 2) leadQuality = "warm";

        // Store form submission
        const result = await db
          .insert(multiStepFormSubmissions)
          .values({
            email: input.email,
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone,
            companyName: input.companyName,
            employeeCount: input.employeeCount,
            currentITSetup: input.currentITSetup,
            needsCybersecurity: input.needsCybersecurity,
            needsCloud: input.needsCloud,
            needsHelpdesk: input.needsHelpdesk,
            needsAI: input.needsAI,
            otherNeeds: input.otherNeeds,
            formCompletedAt: new Date(),
            leadQuality,
            status: "new",
          })
          .$returningId();

        const formSubmissionId = (result[0] as any)?.id || 0;

        // Send confirmation email
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; color: #333;">
            <h2>Thank You for Contacting GigitekAI</h2>
            <p>Hi ${input.firstName},</p>
            <p>We've received your inquiry and will reach out within 24 business hours to discuss your IT needs.</p>
            
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Your Needs:</h3>
              <ul>
                ${input.needsCybersecurity ? "<li>Cybersecurity Solutions</li>" : ""}
                ${input.needsCloud ? "<li>Cloud Services</li>" : ""}
                ${input.needsHelpdesk ? "<li>Helpdesk Support</li>" : ""}
                ${input.needsAI ? "<li>AI & Automation</li>" : ""}
                ${input.otherNeeds ? `<li>${input.otherNeeds}</li>` : ""}
              </ul>
            </div>
            
            <p>In the meantime, feel free to explore our <a href="https://gigitekai.com/services">services</a> or <a href="https://gigitekai.com/resources">resource library</a>.</p>
            <p>Best regards,<br>The GigitekAI Team</p>
          </div>
        `;

        await sendEmail({
          to: input.email,
          subject: "Thank You for Contacting GigitekAI",
          html: emailHtml,
          replyTo: "support@gigitek.com",
        });

        // Notify admin with lead quality
        await notifyOwner({
          title: `New ${leadQuality.toUpperCase()} Lead: ${input.companyName}`,
          content: `${input.firstName} ${input.lastName} (${input.email}, ${input.phone}) | ${input.employeeCount} employees | Needs: ${[input.needsCybersecurity && "Cybersecurity", input.needsCloud && "Cloud", input.needsHelpdesk && "Helpdesk", input.needsAI && "AI"].filter(Boolean).join(", ")}`,
        }).catch(() => {});

        return {
          success: true,
          formSubmissionId,
          leadQuality,
        };
      } catch (error) {
        console.error("[LeadGen] Form submission failed:", error);
        throw error;
      }
    }),

  // ── Get Lead Analytics (Admin Only) ──────────────────────────────────────────
  getAnalytics: adminProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) return null;

        const start = input.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
        const end = input.endDate || new Date();

        const analytics = await db
          .select()
          .from(leadGenAnalytics)
          .where(and(lte(leadGenAnalytics.date, end), gte(leadGenAnalytics.date, start)))
          .orderBy(desc(leadGenAnalytics.date));

        return analytics;
      } catch (error) {
        console.error("[LeadGen] Analytics fetch failed:", error);
        return [];
      }
    }),

  // ── Get Recent Leads (Admin Only) ────────────────────────────────────────────
  getRecentLeads: adminProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        type: z.enum(["assessment", "popup", "form", "all"]).default("all"),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) return [];

        const leads = [];

        if (input.type === "assessment" || input.type === "all") {
          const assessments = await db
            .select()
            .from(securityAssessments)
            .orderBy(desc(securityAssessments.createdAt))
            .limit(input.limit);
          leads.push(...assessments.map((a) => ({ ...a, type: "assessment" })));
        }

        if (input.type === "popup" || input.type === "all") {
          const popups = await db
            .select()
            .from(exitIntentPopups)
            .orderBy(desc(exitIntentPopups.createdAt))
            .limit(input.limit);
          leads.push(...popups.map((p) => ({ ...p, type: "popup" })));
        }

        if (input.type === "form" || input.type === "all") {
          const forms = await db
            .select()
            .from(multiStepFormSubmissions)
            .orderBy(desc(multiStepFormSubmissions.createdAt))
            .limit(input.limit);
          leads.push(...forms.map((f) => ({ ...f, type: "form" })));
        }

        // Sort by date descending and limit
        return leads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, input.limit);
      } catch (error) {
        console.error("[LeadGen] Recent leads fetch failed:", error);
        return [];
      }
    }),

  // ── Update Lead Status (Admin Only) ─────────────────────────────────────────
  updateLeadStatus: adminProcedure
    .input(
      z.object({
        leadId: z.number(),
        status: z.enum(["new", "contacted", "qualified", "converted", "rejected"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");

        await db
          .update(multiStepFormSubmissions)
          .set({
            status: input.status,
            notes: input.notes,
            updatedAt: new Date(),
          })
          .where(eq(multiStepFormSubmissions.id, input.leadId));

        return { success: true };
      } catch (error) {
        console.error("[LeadGen] Lead status update failed:", error);
        throw error;
      }
    }),
});
