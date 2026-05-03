/*
  Email Drip Sequence for Compliance Scorecard Submissions
  Sends 3-email automation: (1) Personalized roadmap, (2) Case study, (3) Switch Program offer
*/

import { z } from "zod";
import { publicProcedure } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { notifyOwner } from "../_core/notification";

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
  // Send email drip sequence for scorecard submission
  sendDripSequence: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string(),
        score: z.number().min(0).max(100),
        scoreBand: z.enum(["Critical", "At Risk", "Good", "Excellent"]),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Email 1: Personalized roadmap (sent immediately)
        const email1 = EMAIL_TEMPLATES.roadmap(input.name, input.score, input.scoreBand);
        await sendEmail(input.email, email1.subject, email1.html);

        // Email 2: Case study (sent after 2 days)
        scheduleEmail(input.email, EMAIL_TEMPLATES.caseStudy(input.name), 2 * 24 * 60 * 60 * 1000);

        // Email 3: Switch Program offer (sent after 5 days)
        scheduleEmail(
          input.email,
          EMAIL_TEMPLATES.switchOffer(input.name, input.score),
          5 * 24 * 60 * 60 * 1000
        );

        // Notify owner of new scorecard submission
        await notifyOwner({
          title: `New Compliance Scorecard Submission: ${input.name}`,
          content: `Score: ${input.score}/100 (${input.scoreBand})\nEmail: ${input.email}\nDrip sequence initiated.`,
        });

        return { success: true, message: "Email drip sequence started" };
      } catch (err) {
        console.error("Email drip error:", err);
        return { success: false, error: String(err) };
      }
    }),
};

// Helper: Send email immediately
async function sendEmail(to: string, subject: string, html: string) {
  try {
    // Use SendGrid or your email provider
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
      throw new Error(`SendGrid error: ${response.statusText}`);
    }

    console.log(`Email sent to ${to}: ${subject}`);
  } catch (err) {
    console.error("SendEmail failed:", err);
    throw err;
  }
}

// Helper: Schedule email for later
function scheduleEmail(to: string, email: { subject: string; html: string }, delayMs: number) {
  // In production, use a job queue (Bull, RabbitMQ, etc.)
  // For now, use setTimeout (not recommended for production)
  setTimeout(() => {
    sendEmail(to, email.subject, email.html).catch(console.error);
  }, delayMs);
}
