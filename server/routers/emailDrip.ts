/*
  Email Drip Sequence for Compliance Scorecard Submissions
  Sends 3-email automation: (1) Personalized HTML report immediately, (2) Case study after 2 days, (3) Switch Program offer after 5 days
  Uses the proven Microsoft Graph sendEmail infrastructure already powering the site.
*/

import { z } from "zod";
import { publicProcedure } from "../_core/trpc";
import { sendEmail } from "../_core/email";
import { notifyOwner } from "../_core/notification";
import { generateComplianceScorecardReport } from "../_core/complianceScorecardReportGenerator";

// Email templates
const EMAIL_TEMPLATES = {
  caseStudy: (name: string) => ({
    subject: `Case Study: How a Florida Bank Achieved 99.9% Uptime — GigitekAI`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0A0E1A; color: #e0e0e0;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #00D4FF; font-size: 24px;">GigitekAI</h1>
        </div>
        <h2 style="color: #00D4FF;">Hi ${name},</h2>
        <p>We wanted to share a recent success story that might resonate with your organization.</p>
        <div style="background: #1a2035; border-left: 4px solid #00D4FF; padding: 20px; margin: 20px 0; border-radius: 4px;">
          <h3 style="color: #00D4FF; margin-top: 0;">The Challenge</h3>
          <p>A regional bank in Tampa was running on legacy infrastructure with a 12-hour RTO and no disaster recovery plan. Hurricane season was approaching.</p>
          <h3 style="color: #00D4FF;">The Solution</h3>
          <ul>
            <li>Multi-region cloud deployment (Miami + Atlanta)</li>
            <li>Automated failover (&lt; 15 min RTO)</li>
            <li>FIPA compliance automation</li>
            <li>AI-powered monitoring &amp; incident response</li>
          </ul>
          <h3 style="color: #00D4FF;">The Result</h3>
          <ul>
            <li>✅ 99.9% uptime SLA achieved</li>
            <li>✅ 280 hours/month freed from manual ops</li>
            <li>✅ 3-month payback period</li>
          </ul>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://gigitekai.com/case-studies" style="background: #00D4FF; color: #0A0E1A; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Read the Full Case Study →</a>
        </div>
        <p>Could your organization benefit from similar results? Let's talk.</p>
        <p>Best,<br/>Harry Henry-Santiago<br/>CEO, GigitekAI<br/><a href="tel:6096764483" style="color: #00D4FF;">(609) 676-4483</a></p>
      </div>
    `,
  }),
  switchOffer: (name: string, score: number) => ({
    subject: `Your 60-Day Compliance Guarantee — Based on Your ${score}/100 Score`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0A0E1A; color: #e0e0e0;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #00D4FF; font-size: 24px;">GigitekAI</h1>
        </div>
        <h2 style="color: #00D4FF;">Hi ${name},</h2>
        <p>Based on your compliance score of <strong style="color: #00D4FF;">${score}/100</strong>, we're offering a limited-time <strong>60-Day Migration Guarantee</strong>:</p>
        <div style="background: #1a2035; border: 2px solid #00D4FF; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3 style="color: #00D4FF; margin-top: 0;">We Guarantee:</h3>
          <ul>
            <li>✅ Your compliance score reaches 85+ within 60 days</li>
            <li>✅ All infrastructure, migration, and implementation included</li>
            <li>✅ 24/7 AI-powered support during transition</li>
            <li>✅ Zero downtime migration</li>
          </ul>
          <h3 style="color: #00D4FF;">What's Included:</h3>
          <ul>
            <li>Free IT audit &amp; gap analysis</li>
            <li>Personalized remediation roadmap</li>
            <li>Cloud infrastructure provisioning</li>
            <li>Security hardening &amp; compliance automation</li>
            <li>Staff training &amp; documentation</li>
          </ul>
          <p style="color: #ff6b6b; font-weight: bold;">⚡ Limited availability: Only 5 spots this month.</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://gigitekai.com/switch-program#audit-form" style="background: #00D4FF; color: #0A0E1A; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Book Your Free Consultation →</a>
        </div>
        <p>Best,<br/>Harry Henry-Santiago<br/>CEO, GigitekAI<br/><a href="tel:6096764483" style="color: #00D4FF;">(609) 676-4483</a></p>
      </div>
    `,
  }),
};

export const emailDripRouter = {
  // Send email drip sequence for scorecard submission with HTML report
  sendDripSequence: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        firstName: z.string(),
        lastName: z.string(),
        companyName: z.string(),
        emailSecurityScore: z.number().min(0).max(100),
        endpointProtectionScore: z.number().min(0).max(100),
        backupRecoveryScore: z.number().min(0).max(100),
        identityManagementScore: z.number().min(0).max(100),
        complianceScore: z.number().min(0).max(100),
        overallScore: z.number().min(0).max(100),
        riskLevel: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      console.log("[EmailDrip] sendDripSequence called for:", input.email);

      const fullName = `${input.firstName} ${input.lastName}`;

      // Generate the Fortune 500-quality HTML report
      const htmlReport = generateComplianceScorecardReport({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        companyName: input.companyName,
        emailSecurityScore: input.emailSecurityScore,
        endpointProtectionScore: input.endpointProtectionScore,
        backupRecoveryScore: input.backupRecoveryScore,
        identityManagementScore: input.identityManagementScore,
        complianceScore: input.complianceScore,
        overallScore: input.overallScore,
        riskLevel: input.riskLevel,
      });

      // Email 1: Send the detailed HTML report immediately to the prospect
      console.log("[EmailDrip] Sending report to:", input.email);
      const reportSent = await sendEmail({
        to: input.email,
        subject: `Your IT Compliance Scorecard Report — ${input.companyName} (${input.overallScore}/100)`,
        html: htmlReport,
        fromName: "GigitekAI",
      });
      console.log("[EmailDrip] Report sent to prospect:", reportSent);

      // Notify support team immediately
      console.log("[EmailDrip] Sending lead notification to support@gigitekai.com");
      const supportSent = await sendEmail({
        to: "support@gigitekai.com",
        subject: `🎯 New Scorecard Lead: ${input.companyName} scored ${input.overallScore}/100`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #00D4FF;">New Compliance Scorecard Submission</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px; border-bottom: 1px solid #333;"><strong>Company:</strong></td><td style="padding: 8px; border-bottom: 1px solid #333;">${input.companyName}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #333;"><strong>Contact:</strong></td><td style="padding: 8px; border-bottom: 1px solid #333;">${fullName}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #333;"><strong>Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #333;"><a href="mailto:${input.email}">${input.email}</a></td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #333;"><strong>Overall Score:</strong></td><td style="padding: 8px; border-bottom: 1px solid #333; color: ${input.overallScore >= 70 ? '#00D4FF' : '#ff6b6b'};">${input.overallScore}/100 (${input.riskLevel})</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #333;"><strong>Email Security:</strong></td><td style="padding: 8px; border-bottom: 1px solid #333;">${input.emailSecurityScore}/100</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #333;"><strong>Backup &amp; Recovery:</strong></td><td style="padding: 8px; border-bottom: 1px solid #333;">${input.backupRecoveryScore}/100</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #333;"><strong>Identity Management:</strong></td><td style="padding: 8px; border-bottom: 1px solid #333;">${input.identityManagementScore}/100</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #333;"><strong>Compliance:</strong></td><td style="padding: 8px; border-bottom: 1px solid #333;">${input.complianceScore}/100</td></tr>
            </table>
            <p style="margin-top: 20px;"><strong>Action:</strong> Follow up within 24 hours to discuss remediation services and the Switch Program.</p>
          </div>
        `,
        fromName: "GigitekAI Scorecard",
      });
      console.log("[EmailDrip] Support notification sent:", supportSent);

      // Schedule Email 2: Case study (2 days later)
      setTimeout(() => {
        const caseStudy = EMAIL_TEMPLATES.caseStudy(fullName);
        sendEmail({
          to: input.email,
          subject: caseStudy.subject,
          html: caseStudy.html,
          fromName: "GigitekAI",
        }).then((ok) => {
          console.log(`[EmailDrip] Case study email sent to ${input.email}:`, ok);
        }).catch((err) => {
          console.error(`[EmailDrip] Case study email failed for ${input.email}:`, err);
        });
      }, 2 * 24 * 60 * 60 * 1000);

      // Schedule Email 3: Switch Program offer (5 days later)
      setTimeout(() => {
        const switchOffer = EMAIL_TEMPLATES.switchOffer(fullName, input.overallScore);
        sendEmail({
          to: input.email,
          subject: switchOffer.subject,
          html: switchOffer.html,
          fromName: "GigitekAI",
        }).then((ok) => {
          console.log(`[EmailDrip] Switch offer email sent to ${input.email}:`, ok);
        }).catch((err) => {
          console.error(`[EmailDrip] Switch offer email failed for ${input.email}:`, err);
        });
      }, 5 * 24 * 60 * 60 * 1000);

      // Notify owner via Manus notification
      await notifyOwner({
        title: `New Compliance Scorecard: ${input.companyName} (${input.overallScore}/100)`,
        content: `Contact: ${fullName} (${input.email})\nRisk Level: ${input.riskLevel}\nReport sent: ${reportSent}\nSupport notified: ${supportSent}`,
      });

      return {
        success: true,
        message: "Scorecard report sent successfully",
        reportSent,
        supportNotified: supportSent,
      };
    }),
};
