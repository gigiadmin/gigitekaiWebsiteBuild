/*
  Email Drip Sequence for Compliance Scorecard Submissions
  Sends 3-email automation: (1) Personalized roadmap, (2) Case study, (3) Switch Program offer
  Primary: Azure Communication Services (ACS)
  Fallback: SendGrid
*/

import { z } from "zod";
import { publicProcedure } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { notifyOwner } from "../_core/notification";
import { generateComplianceScorecardReport } from "../_core/complianceScorecardReportGenerator";

// Email templates
const EMAIL_TEMPLATES = {
  roadmap: (name: string, score: number, scoreBand: string) => ({
    subject: `Your ${score}/100 IT Compliance Roadmap — GigitekAI`,
    html: `
      <h2>Hi ${name},</h2>
      <p>Thank you for completing the IT Compliance Scorecard. Your score: <strong>${score}/100 (${scoreBand})</strong></p>
      <p>Based on your assessment, here's your personalized 90-day roadmap:</p>
      <ul>
        <li><strong>Month 1:</strong> Backup & Recovery infrastructure (RTO ≤ 4 hours)</li>
        <li><strong>Month 2:</strong> Cloud & Sovereign infrastructure (multi-region deployment)</li>
        <li><strong>Month 3:</strong> Security & Compliance (Zero Trust, FIPA compliance)</li>
      </ul>
      <p>Each phase includes specific actions, tools, and success metrics.</p>
      <p><a href="https://gigitekai.com/switch-program">Learn about our 60-Day Migration Guarantee →</a></p>
      <p>Best,<br/>The GigitekAI Team</p>
    `,
  }),
  caseStudy: (name: string) => ({
    subject: `Case Study: How a Florida Bank Achieved 99.9% Uptime — GigitekAI`,
    html: `
      <h2>Hi ${name},</h2>
      <p>We wanted to share a recent success story that might resonate with your organization.</p>
      <p><strong>The Challenge:</strong> A regional bank in Tampa was running on legacy infrastructure with 12-hour RTO and no disaster recovery plan. Hurricane season was approaching.</p>
      <p><strong>The Solution:</strong> GigitekAI implemented:</p>
      <ul>
        <li>Multi-region cloud deployment (Miami + Atlanta)</li>
        <li>Automated failover (< 15 min RTO)</li>
        <li>FIPA compliance automation</li>
        <li>AI-powered monitoring & incident response</li>
      </ul>
      <p><strong>The Result:</strong> 99.9% uptime SLA, 280 hours/month freed from manual ops, 3-month payback period.</p>
      <p><a href="https://gigitekai.com/case-studies">Read the full case study →</a></p>
      <p>Best,<br/>The GigitekAI Team</p>
    `,
  }),
  switchOffer: (name: string, score: number) => ({
    subject: `Your 60-Day Migration Guarantee — Lock in Your Compliance Score Improvement`,
    html: `
      <h2>Hi ${name},</h2>
      <p>Based on your compliance score of ${score}/100, we're offering a limited-time <strong>60-Day Migration Guarantee</strong>:</p>
      <p><strong>We guarantee:</strong></p>
      <ul>
        <li>Your compliance score reaches 85+ within 60 days</li>
        <li>All infrastructure, migration, and implementation included</li>
        <li>24/7 AI-powered support during transition</li>
        <li>Zero downtime migration</li>
      </ul>
      <p><strong>What's included:</strong></p>
      <ul>
        <li>Free IT audit & gap analysis</li>
        <li>Personalized remediation roadmap</li>
        <li>Cloud infrastructure provisioning</li>
        <li>Security hardening & compliance automation</li>
        <li>Staff training & documentation</li>
      </ul>
      <p><strong>Limited availability:</strong> Only 5 spots this month.</p>
      <p><a href="https://gigitekai.com/switch-program#audit-form">Book Your Free Consultation →</a></p>
      <p>Best,<br/>Harry Henry-Santiago<br/>CEO, GigitekAI</p>
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
      console.log("[EmailDrip] sendDripSequence mutation started");
      try {
        console.log("[EmailDrip] sendDripSequence called with input:", JSON.stringify(input, null, 2));
        // Validate email
        if (!input.email || !input.email.includes("@")) {
          throw new Error(`Invalid email address: ${input.email}`);
        }

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

        // Email 1: Send the detailed HTML report immediately
        await sendEmail(
          input.email,
          `Your IT Compliance Scorecard Report - ${input.companyName}`,
          htmlReport
        );

        // Email 2: Case study (sent after 2 days)
        scheduleEmail(
          input.email,
          EMAIL_TEMPLATES.caseStudy(`${input.firstName} ${input.lastName}`),
          2 * 24 * 60 * 60 * 1000
        );

        // Email 3: Switch Program offer (sent after 5 days)
        scheduleEmail(
          input.email,
          EMAIL_TEMPLATES.switchOffer(`${input.firstName} ${input.lastName}`, input.overallScore),
          5 * 24 * 60 * 60 * 1000
        );

        // Send lead notification to support
        await sendEmail(
          "support@gigitekai.com",
          `New Scorecard Submission: ${input.companyName} (${input.overallScore}/100)`,
          `
            <p>New compliance scorecard submitted:</p>
            <ul>
              <li><strong>Company:</strong> ${input.companyName}</li>
              <li><strong>Contact:</strong> ${input.firstName} ${input.lastName}</li>
              <li><strong>Email:</strong> ${input.email}</li>
              <li><strong>Overall Score:</strong> ${input.overallScore}/100</li>
              <li><strong>Risk Level:</strong> ${input.riskLevel}</li>
              <li><strong>Email Security:</strong> ${input.emailSecurityScore}/100</li>
              <li><strong>Endpoint Protection:</strong> ${input.endpointProtectionScore}/100</li>
              <li><strong>Backup & Recovery:</strong> ${input.backupRecoveryScore}/100</li>
              <li><strong>Identity Management:</strong> ${input.identityManagementScore}/100</li>
              <li><strong>Compliance:</strong> ${input.complianceScore}/100</li>
            </ul>
            <p>Follow up with the prospect to discuss remediation services and the Switch Program.</p>
          `
        );

        // Notify owner
        await notifyOwner({
          title: `New Compliance Scorecard: ${input.companyName} (${input.overallScore}/100)`,
          content: `Contact: ${input.firstName} ${input.lastName} (${input.email})\nRisk Level: ${input.riskLevel}\nDrip sequence initiated.`,
        });

        return {
          success: true,
          message: "Scorecard report sent successfully",
          reportGenerated: true,
        };
      } catch (err) {
        console.error("[EmailDrip] Error in sendDripSequence:", err);
        console.error("[EmailDrip] Error stack:", err instanceof Error ? err.stack : 'No stack');
        throw err; // Re-throw so tRPC properly reports the error
      }
    }),
};

// Helper: Send email via Azure first, fallback to SendGrid
async function sendEmail(to: string, subject: string, html: string) {
  // Validate email
  if (!to || !to.includes("@")) {
    throw new Error(`Invalid email address: ${to}`);
  }

  // Try Azure Communication Services first
  try {
    console.log(`[Email] Attempting Azure send to ${to}: ${subject}`);

    if (!process.env.ACS_CONNECTION_STRING) {
      console.warn("[Email] ACS_CONNECTION_STRING not configured, skipping Azure");
      throw new Error("ACS not configured");
    }

    // Use ACS to send email
    const { EmailClient } = await import("@azure/communication-email");
    const client = new EmailClient(process.env.ACS_CONNECTION_STRING);

    const emailMessage = {
      senderAddress: "support@gigitekai.com",
      content: {
        subject,
        html,
      },
      recipients: {
        to: [{ address: to }],
      },
    };

    const poller = await client.beginSend(emailMessage);
    const result = await poller.pollUntilDone();

    console.log(`[Email] ✓ Sent via Azure to ${to}: ${subject} (ID: ${result.id})`);
    return;
  } catch (azureErr) {
    console.warn(`[Email] Azure send failed, trying SendGrid:`, azureErr);
  }

  // Fallback to SendGrid
  try {
    console.log(`[Email] Attempting SendGrid send to ${to}: ${subject}`);

    if (!process.env.SENDGRID_API_KEY) {
      throw new Error("SENDGRID_API_KEY not configured");
    }

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: "support@gigitekai.com", name: "GigitekAI" },
        subject,
        content: [{ type: "text/html", value: html }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SendGrid error: ${response.statusText} - ${errorText}`);
    }

    console.log(`[Email] ✓ Sent via SendGrid to ${to}: ${subject}`);
    return;
  } catch (sendgridErr) {
    console.error(`[Email] ✗ Both Azure and SendGrid failed:`, sendgridErr);
    throw new Error(`Email delivery failed: ${sendgridErr}`);
  }
}

// Helper: Schedule email for later (using persistent job queue in production)
function scheduleEmail(to: string, email: { subject: string; html: string }, delayMs: number) {
  // In production, use a job queue (Bull, RabbitMQ, Heartbeat, etc.)
  // For now, use setTimeout (not recommended for production)
  setTimeout(() => {
    sendEmail(to, email.subject, email.html).catch((err) => {
      console.error(`[Email] Scheduled email failed for ${to}:`, err);
    });
  }, delayMs);
}
