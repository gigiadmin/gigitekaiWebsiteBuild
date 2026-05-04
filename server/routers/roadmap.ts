/*
  Roadmap Generator Router
  Handles AI-powered compliance roadmap generation and email delivery via Microsoft 365
*/

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { notifyOwner } from "../_core/notification";

// Determine score band
function getScoreBand(score: number): "Critical" | "At Risk" | "Good" | "Excellent" {
  if (score < 40) return "Critical";
  if (score < 60) return "At Risk";
  if (score < 80) return "Good";
  return "Excellent";
}

// Generate personalized roadmap using AI
async function generateRoadmapContent(score: number, scoreBand: string): Promise<string> {
  try {
    const prompt = `Generate a detailed 90-day IT compliance remediation roadmap for a company with a compliance score of ${score}/100 (${scoreBand} status).

Include:
1. Month 1 priorities (top 3-5 actions)
2. Month 2 priorities (top 3-5 actions)
3. Month 3 priorities (top 3-5 actions)
4. Success metrics for each phase
5. Estimated effort and resources needed

Format as HTML bullet points. Be specific and actionable.`;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are an expert IT compliance consultant. Generate practical, actionable remediation roadmaps.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.choices[0].message.content;
    if (typeof content === 'string') {
      return content;
    }
    return "";
  } catch (err) {
    console.error("LLM error:", err);
    // Fallback roadmap if AI fails
    return `
      <h3>Month 1: Foundation</h3>
      <ul>
        <li>Backup & Recovery infrastructure (RTO ≤ 4 hours)</li>
        <li>Document current IT inventory</li>
        <li>Implement basic access controls</li>
      </ul>
      <h3>Month 2: Infrastructure</h3>
      <ul>
        <li>Cloud & Sovereign infrastructure (multi-region deployment)</li>
        <li>Network segmentation</li>
        <li>Automated monitoring setup</li>
      </ul>
      <h3>Month 3: Security & Compliance</h3>
      <ul>
        <li>Security hardening (Zero Trust architecture)</li>
        <li>Compliance automation</li>
        <li>Staff training & documentation</li>
      </ul>
    `;
  }
}

// Email template for roadmap
function roadmapEmailTemplate(name: string, score: number, scoreBand: string, roadmapContent: string): { subject: string; html: string } {
  return {
    subject: `Your ${score}/100 IT Compliance Roadmap — GigitekAI`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'DM Sans', Arial, sans-serif; color: #333; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0A0E1A; color: #00D4FF; padding: 20px; border-radius: 8px; text-align: center; }
          .content { padding: 20px 0; }
          .score-box { background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .roadmap { background: #f9f9f9; padding: 20px; border-left: 4px solid #00D4FF; margin: 20px 0; }
          .cta { background: #00D4FF; color: #0A0E1A; padding: 12px 24px; border-radius: 6px; text-align: center; text-decoration: none; display: inline-block; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your IT Compliance Roadmap</h1>
          </div>
          
          <div class="content">
            <p>Hi ${name},</p>
            
            <p>Thank you for completing the IT Compliance Scorecard. We've analyzed your assessment and generated a personalized 90-day remediation roadmap.</p>
            
            <div class="score-box">
              <h2 style="margin: 0; color: #00D4FF;">Your Score: ${score}/100</h2>
              <p style="margin: 5px 0 0 0;">Status: <strong>${scoreBand}</strong></p>
            </div>
            
            <div class="roadmap">
              <h3>Your Personalized 90-Day Roadmap:</h3>
              ${roadmapContent}
            </div>
            
            <p><strong>What's Next?</strong></p>
            <p>This roadmap is tailored to your organization's specific needs. Each phase includes:</p>
            <ul>
              <li>Specific actions and deliverables</li>
              <li>Recommended tools and technologies</li>
              <li>Success metrics and KPIs</li>
              <li>Estimated timeline and resources</li>
            </ul>
            
            <p>Ready to get started? Our team can help you implement this roadmap with our 60-Day Migration Guarantee.</p>
            
            <a href="https://gigitekai.com/switch-program" class="cta">Learn About Our Migration Guarantee →</a>
            
            <p>Questions? Reply to this email or contact us at <strong>support@gigitekai.com</strong> or <strong>(727) 382-5776</strong>.</p>
            
            <p>Best regards,<br/>
            <strong>Harry Santiago</strong><br/>
            CEO, GigitekAI<br/>
            <em>AI-Powered Managed Services Provider</em></p>
          </div>
          
          <div class="footer">
            <p>© 2026 GigitekAI. All rights reserved.</p>
            <p>This email was sent because you completed our IT Compliance Scorecard.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
}

// Get Microsoft 365 access token
async function getMicrosoftGraphAccessToken(): Promise<string | null> {
  try {
    const clientId = process.env.MS_GRAPH_CLIENT_ID;
    const clientSecret = process.env.MS_GRAPH_CLIENT_SECRET;
    const tenantId = process.env.MS_GRAPH_TENANT_ID;

    if (!clientId || !clientSecret || !tenantId) {
      console.error("Microsoft 365 credentials not configured");
      return null;
    }

    const response = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`Token error (${response.status}):`, error);
      return null;
    }

    const data = await response.json() as { access_token?: string };
    return data.access_token || null;
  } catch (err) {
    console.error("Token fetch error:", err);
    return null;
  }
}

// Send email via Microsoft 365 (Exchange Online)
async function sendEmailViaMicrosoft365(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const accessToken = await getMicrosoftGraphAccessToken();
    if (!accessToken) {
      console.error("Failed to get Microsoft 365 access token");
      return false;
    }

    const response = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        message: {
          subject,
          body: {
            contentType: "HTML",
            content: html,
          },
          toRecipients: [
            {
              emailAddress: {
                address: to,
              },
            },
          ],
          from: {
            emailAddress: {
              address: "support@gigitekai.com",
              name: "GigitekAI",
            },
          },
        },
        saveToSentItems: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`Microsoft Graph error (${response.status}):`, error);
      return false;
    }

    console.log(`✓ Email sent to ${to} via Microsoft 365: ${subject}`);
    return true;
  } catch (err) {
    console.error("Microsoft 365 API error:", err);
    return false;
  }
}

export const roadmapRouter = router({
  generate: publicProcedure
    .input(
      z.object({
        score: z.number().min(0).max(100),
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const scoreBand = getScoreBand(input.score);
        
        // Generate AI-powered roadmap content
        const roadmapContent = await generateRoadmapContent(input.score, scoreBand);
        
        // Create email template
        const emailTemplate = roadmapEmailTemplate("Valued Client", input.score, scoreBand, roadmapContent);
        
        // Send email via Microsoft 365
        const emailSent = await sendEmailViaMicrosoft365(input.email, emailTemplate.subject, emailTemplate.html);
        
        if (!emailSent) {
          throw new Error("Failed to send email via Microsoft 365");
        }
        
        // Notify owner
        await notifyOwner({
          title: "New Roadmap Generated",
          content: `Score: ${input.score}/100 (${scoreBand})\nEmail: ${input.email}\nRoadmap sent successfully.`,
        });
        
        return { 
          success: true, 
          message: "Roadmap generated and sent to your email",
          score: input.score,
          band: scoreBand,
        };
      } catch (err) {
        console.error("Roadmap generation error:", err);
        
        // Notify owner of failure
        await notifyOwner({
          title: "Roadmap Generation Failed",
          content: `Email: ${input.email}\nError: ${String(err)}`,
        });
        
        return { 
          success: false, 
          error: "Failed to generate roadmap. Please try again or contact support.",
        };
      }
    }),
});
