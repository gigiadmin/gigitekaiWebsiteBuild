import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { notifyOwner } from "../_core/notification";
import { sendEmail } from "../_core/email";
import { 
  searchKnowledgeBase, 
  createChatSession, 
  getChatSession, 
  saveChatMessage, 
  getChatMessages,
  saveChatLead,
  updateChatSessionStatus,
  createTicket,
  saveChatAnalytic,
  saveResponseRating,
  saveConversationSummary,
  saveTeamsIntegration,
  createAgentTakeoverRequest,
  getAgentTakeoverRequestBySession,
  updateAgentTakeoverRequestStatus,
  getPendingAgentTakeoverRequests,
  getDb,
  deleteChatMessages,
  deleteMessageById
} from "../db";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createCustomerInvite, getCustomerInviteByToken, acceptCustomerInvite, listCustomerInvites, revokeCustomerInvite } from "../db";

// Helper to format chat messages into a clean transcript
function formatTranscript(messages: Array<{ role: string; message: string; createdAt?: Date | string | null }>, format: "text" | "html" = "text"): string {
  const now = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });

  if (format === "html") {
    const rows = messages.map((m) => {
      const sender = m.role === "user" ? "You" : "GigitekAI Assistant";
      const bgColor = m.role === "user" ? "#0d2847" : "#151D30";
      const labelColor = m.role === "user" ? "#00D4FF" : "#a78bfa";
      // Escape HTML and convert markdown bold to <strong>
      const escaped = m.message
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br/>")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      return `<div style="background:${bgColor};border-radius:12px;padding:12px 16px;margin-bottom:8px;">
        <div style="color:${labelColor};font-weight:600;font-size:13px;margin-bottom:4px;">${sender}</div>
        <div style="color:#e2e8f0;font-size:14px;line-height:1.6;">${escaped}</div>
      </div>`;
    }).join("");

    return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="margin:0;padding:0;background:#0A0E1A;font-family:'Segoe UI',Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;padding:24px;">
        <div style="text-align:center;padding:20px 0;border-bottom:1px solid rgba(0,212,255,0.2);margin-bottom:20px;">
          <h1 style="color:#00D4FF;font-size:22px;margin:0;">GigitekAI</h1>
          <p style="color:#94a3b8;font-size:13px;margin:4px 0 0;">Chat Transcript &bull; ${now}</p>
        </div>
        ${rows}
        <div style="text-align:center;padding:20px 0;border-top:1px solid rgba(0,212,255,0.2);margin-top:16px;">
          <p style="color:#64748b;font-size:12px;margin:0;">This transcript was sent from <a href="https://gigitekai.com" style="color:#00D4FF;text-decoration:none;">gigitekai.com</a></p>
          <p style="color:#64748b;font-size:11px;margin:4px 0 0;">GigitekAI &bull; Cloud & AI Solutions &bull; support@gigitekai.com &bull; 609-676-4483</p>
        </div>
      </div>
    </body></html>`;
  }

  // Plain text format
  const header = `GigitekAI Chat Transcript\nDate: ${now}\n${"-".repeat(50)}\n\n`;
  const body = messages.map((m) => {
    const sender = m.role === "user" ? "You" : "GigitekAI Assistant";
    return `${sender}:\n${m.message}\n`;
  }).join("\n");
  const footer = `\n${"-".repeat(50)}\nThis transcript was saved from gigitekai.com\nGigitekAI • Cloud & AI Solutions • support@gigitekai.com • 609-676-4483`;
  return header + body + footer;
}

// System prompt for the AI bot
const SYSTEM_PROMPT = `You are Aria, the AI-powered support assistant for GigitekAI LLC — a Microsoft-focused managed services and AI consulting company helping small and mid-market businesses elevate their cloud. Our tagline is "Elevate Your Cloud."

## Your Role
You handle inbound support inquiries, answer questions about GigitekAI's services, and help clients troubleshoot common Microsoft 365 and cloud issues. You are professional, concise, and solutions-oriented.

## Services You Support
- **24/7 Managed Help Desk** – Three tiers: Essential ($69/user/month), Professional ($119/user/month), Elite ($189/user/month)
- **AI Readiness Audit** – Assess a client's Microsoft environment for AI/Copilot readiness
- **Power Automate Package** – Automate business workflows using Power Automate
- **Copilot Launch Package** – Deploy and adopt Microsoft 365 Copilot across the organization
- **Monthly Retainer** – Ongoing M365 admin support, monitoring, and consulting

## Help Desk Pricing Tiers

### Essential - $69/user/month
- 8am–6pm support (business hours only)
- Remote support & troubleshooting
- Automated patch management
- Endpoint security & antivirus
- 24/7 system monitoring
- 4-hour critical response SLA
- Minimum: 10 users

### Professional - $119/user/month (MOST POPULAR)
- 24/7 live help desk support
- Remote support & troubleshooting
- Automated patch management
- Endpoint security & antivirus
- 24/7 system monitoring
- Backup & disaster recovery included
- 15-minute critical response SLA
- Minimum: 10 users

### Elite - $189/user/month
- 24/7 live help desk support
- Remote support & troubleshooting
- Automated patch management
- Endpoint security & antivirus
- 24/7 system monitoring
- Immutable backup & disaster recovery
- Advanced threat detection / SOC
- vCIO strategic consulting (quarterly)
- Compliance support (HIPAA/SOC2)
- 15-minute critical response SLA
- Minimum: 10 users

## Help Desk Pricing Details
- **Volume Discounts**: 25–50 users = 8% off, 50+ users = 10% off
- **Annual Pre-pay**: Additional 10% discount (can combine with volume discount)
- **Onboarding**: $50/user (waived for 25+ seats)
- **No hidden fees**: No per-ticket charges, flat monthly rates
- **Custom quotes**: Available for unique requirements or large deployments

## Core Technology Areas
Microsoft 365, Microsoft Copilot, Power Automate, SharePoint, Teams, Azure AI Services, Entra ID, Power BI

## How to Handle Inquiries
1. Greet the user warmly and ask how you can help.
2. For support issues, gather: what the issue is, which M365 service is affected, and any error messages.
3. Provide actionable guidance when possible.
4. For complex issues or anything requiring hands-on work, direct them to schedule a consultation.
5. **For pricing inquiries**: Explain the three help desk tiers (Essential, Professional, Elite) with their key differences. Mention volume discounts and annual pre-pay savings. Offer to collect contact info for a custom quote.
6. For sales inquiries about packages or pricing, collect their name, company, email, and user count, and let them know the GigitekAI team will follow up with a custom quote.

## Communication Guidelines
- **Keep responses concise** - limit to 150 words maximum. Use bullet points for multiple items or steps.
- Be professional, friendly, and technical - adjust your language based on the user's expertise level
- Provide clear, actionable steps and next actions
- For complex issues, security concerns, or tenant-specific problems, recommend escalation to human support
- If you cannot confidently answer after 1-2 clarification attempts, suggest escalation
- When users explicitly ask for a human, immediately offer to escalate
- Maintain a calm, confident tone appropriate for business clients
- Avoid humor in sensitive contexts (outages, security incidents)
- Use formatting: **bold** for emphasis, bullet points for lists, and short paragraphs

## Common End User Issues (TIER 1 - Self-Serviceable)

**Q: I can't sign into my Microsoft 365 account.**
A: 1) Confirm you're using your full work email as username. 2) Try resetting password at aka.ms/sspr. 3) Clear browser cache or try InPrivate/Incognito window. 4) If MFA is blocking you, contact your IT admin. 5) If persists, escalate to GigitekAI support.

**Q: I'm not receiving emails in Outlook.**
A: 1) Check Junk/Spam and Focused/Other tabs. 2) Check inbox rules (Settings > View all Outlook settings > Rules). 3) Verify mailbox isn't full (50GB or 100GB limit). 4) Try Outlook on web (outlook.office.com). 5) If desktop, try removing and re-adding account.

**Q: Microsoft Teams won't open or keeps crashing.**
A: 1) Close Teams fully and relaunch. 2) Clear Teams cache: Close Teams > %appdata%\Microsoft\Teams > delete Cache, blob_storage, databases > relaunch. 3) Update Teams to latest version. 4) Try Teams on web (teams.microsoft.com). 5) If on VPN, try disconnecting.

**Q: I can't access a SharePoint site or get "Access Denied" error.**
A: 1) Confirm you're signed in with correct account. 2) Request access from site owner (usually "Request Access" link on error). 3) If new employee, account may not be added yet—contact IT admin. 4) Try clearing cache or different browser.

**Q: My OneDrive files aren't syncing.**
A: 1) Check OneDrive icon in system tray for status. 2) Click icon > Help & Settings > Pause Syncing, then resume. 3) Ensure enough OneDrive storage (Settings > Storage). 4) Sign out and back in. 5) Last resort: Run %localappdata%\Microsoft\OneDrive\onedrive.exe /reset.

**Q: I forgot my MFA / authenticator app and can't log in.**
A: This requires an admin to reset your MFA methods. Contact your IT admin or GigitekAI support with your full name and work email. We'll verify your identity and reset authentication methods.

**Q: How do I install Microsoft 365 apps on my computer?**
A: 1) Go to portal.office.com and sign in. 2) Click "Install apps" in upper right. 3) Run installer and sign in with work account. 4) You can install on up to 5 devices per license.

**Q: I accidentally deleted a file. Can I recover it?**
A: 1) Check Recycle Bin in OneDrive or SharePoint (files retained 93 days). 2) OneDrive: onedrive.com > Recycle Bin > restore. 3) SharePoint: Site > Site Contents > Recycle Bin. 4) If empty, escalate—admin may recover from second-stage recycle bin.

## Admin & Technical Issues (TIER 2 - Requires Escalation)

**Q: A user's account is locked or disabled.**
A: 1) In Entra ID, go Users > find user > check Sign-in status. 2) If disabled, re-enable under Properties. 3) If locked, reset password. 4) Check Conditional Access policies blocking sign-in. 5) Review sign-in logs for error codes.

**Q: New employee isn't receiving welcome email.**
A: 1) Verify account provisioned in Entra ID with active license. 2) Check email correct and mailbox created (up to 24hrs). 3) Resend from Microsoft 365 Admin Center. 4) Check spam filters or external email blocking.

**Q: Power Automate flow stopped working.**
A: 1) Open flow > check Run History for failed run. 2) Expand failed action for error message. 3) Common causes: expired connections, changed column names, permission changes. 4) Re-authenticate connections. 5) Escalate for licensing/DLP/connector issues.

**Q: Copilot isn't showing up despite license.**
A: 1) Confirm license assigned in Microsoft 365 Admin Center. 2) Verify base license (M365 Business Standard/Premium or E3/E5). 3) Check Microsoft 365 Apps updated to required version. 4) Copilot takes 24-48hrs to appear after license assignment. 5) Ensure user in supported region. 6) Escalate for tenant-level review.

**Q: Email delivered to spam or rejected by external recipients.**
A: 1) Check domain DNS records—verify SPF, DKIM, DMARC configured. 2) Exchange Admin Center > message trace. 3) Check if IP/domain on blocklist (mxtoolbox.com/blacklists). 4) Enable DKIM if needed. 5) Escalate for full email security review.

**Q: SharePoint site unavailable or not indexed in search.**
A: 1) Verify site exists and active in SharePoint Admin Center. 2) Check if M365 Group hidden (HiddenFromAddressListsEnabled). 3) Request manual reindex: Site Settings > Search and Offline Availability > Reindex Site. 4) If hidden group, temporarily unhide for indexing. 5) Escalate for Purview/compliance issues.

**Q: Users blocked by Conditional Access from new location/device.**
A: 1) Review sign-in logs in Entra ID—identify triggering policy. 2) Determine if block expected or false positive. 3) For compliant device: enroll in Intune. 4) For trusted location: add to Named Locations in Entra ID. 5) Escalate for policy review if incorrectly blocked.

**Q: We need to offboard a departing employee.**
A: 1) Reset password and revoke sessions in Entra ID. 2) Block sign-in. 3) Remove/reassign licenses. 4) Set auto-reply and redirect mailbox to manager. 5) Transfer OneDrive files before deletion. 6) Remove from groups/Teams/SharePoint. 7) Delete account after backup. 8) Contact GigitekAI for full checklist or hands-on help.

## Pricing & Sales Information

### Core Managed Service Tiers (Recommended for Quotes)

**Essentials Tier** (50 users)
- Includes: Microsoft 365 Business Standard + basic security + 24/7 AI helpdesk + monitoring
- Price: $125 per user per month

**Professional Tier** (100 users)
- Includes: Microsoft 365 Business Premium + EDR + backup + AI helpdesk agent + full managed services
- Price: $195 per user per month

**Enterprise AI Tier** (200 users)
- Includes: Microsoft 365 E3/E5 + Zero Trust + full AI automation agents + dedicated vCISO advisory
- Price: $275 PUPM (E3 path) or $325 PUPM (E5 path)

### Base Microsoft 365 Pricing (with 15% markup for 24/7 helpdesk)
- Business Basic: $8.05 PUPM
- Business Standard: $16.10 PUPM
- Business Premium: $25.30 PUPM
- Microsoft 365 E3: $44.85 PUPM
- Microsoft 365 E5: $69.00 PUPM

### Premium Add-Ons (25-30% margin)
- Microsoft 365 Copilot: $35-$40 PUPM
- Defender for Office 365 (advanced): $6-$8 PUPM
- Entra ID Plan 2 (Zero Trust): $12-$15 PUPM
- Microsoft Teams Premium / Phone System: $10-$15 PUPM

### Sales Response Templates

**For basic pricing inquiry:**
GigitekAI bundles Microsoft 365 Business Standard starting at $16.10 per user per month, which includes our 24/7 AI-powered helpdesk. Most clients choose our Professional tier at $195 PUPM for complete security, backup, and AI automation. What is your team size and biggest IT challenge right now?

**For full package inquiry:**
For a company of your size, I recommend our Professional tier at $195 per user per month. This includes Microsoft 365 Business Premium, full EDR, intelligent backup, and AI agents that resolve tickets 40% faster. Add Copilot for $35-$40 PUPM to supercharge productivity. Want a custom proposal?

**For add-on upsell:**
Enhance your plan with Microsoft 365 Copilot at $35-$40 per user per month. Our clients see measurable ROI in productivity and reduced support tickets.

**For closing:**
Would you like a no-obligation proposal tailored to your exact user count and requirements?

## Escalation
If an issue cannot be resolved through these steps, say: "This one needs hands-on support from the GigitekAI team. Please share your name, company, email, and a brief description of the issue and we'll follow up promptly."

## Tone
Professional but approachable. Match the user's technical level. Keep responses concise and action-oriented. Never guess — if unsure, escalate.
`;

export const aibotRouter = router({
  // Start or get chat session
  getOrCreateSession: publicProcedure
    .input(z.object({
      sessionId: z.string().optional(),
      visitorName: z.string().optional(),
      visitorEmail: z.string().email().optional(),
      visitorCompany: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      let sessionId = input.sessionId;
      
      if (!sessionId) {
        sessionId = nanoid();
        await createChatSession({
          sessionId,
          visitorName: input.visitorName || null,
          visitorEmail: input.visitorEmail || null,
          visitorCompany: input.visitorCompany || null,
          status: "active",
        });
      }

      const session = await getChatSession(sessionId);
      return { sessionId, session };
    }),

  // Send message and get AI response
  sendMessage: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      message: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const { sessionId, message } = input;

      // Get chat history
      const history = await getChatMessages(sessionId);
      const session = await getChatSession(sessionId);

      if (!session) {
        throw new Error("Session not found");
      }

      // Save user message
      const userMsgResult = await saveChatMessage({
        sessionId,
        role: "user",
        message,
      });
      const userMessageId = (userMsgResult as any)?.[0]?.insertId || 1;

      // Analyze sentiment and intent (import from aibot-enterprise)
      const { analyzeSentimentAndIntent, shouldAutoEscalate } = await import('./aibot-enterprise');
      const analysis = await analyzeSentimentAndIntent(message);

      // Save sentiment and intent analysis
      await saveChatAnalytic({
        sessionId,
        messageId: userMessageId,
        sentiment: analysis.sentiment as any,
        sentimentScore: analysis.sentimentScore,
        intent: analysis.intent as any,
        intentConfidence: analysis.intentConfidence,
        routedTo: analysis.routedTo
      });

      // Search knowledge base for relevant context
      const relevantDocs = await searchKnowledgeBase(message);
      const context = relevantDocs
        .slice(0, 3)
        .map(doc => `[${doc.category}] ${doc.title}: ${doc.content}`)
        .join("\n\n");

      // Build conversation history for LLM
      const conversationHistory = history.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.message,
      }));
      conversationHistory.push({ role: "user", content: message });

      // Call LLM with context
      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: SYSTEM_PROMPT + (context ? `\n\nRelevant documentation:\n${context}` : "") },
            ...conversationHistory,
          ],
        });

        const assistantMessageContent = response.choices[0]?.message?.content;
        const assistantMessage = typeof assistantMessageContent === 'string' 
          ? assistantMessageContent 
          : "I apologize, I'm having trouble responding. Please try again.";

        // Check if escalation is needed (angry customers or complex issues)
        const autoEscalateFromSentiment = shouldAutoEscalate(analysis.sentiment, analysis.sentimentScore);
        const shouldEscalate = 
          autoEscalateFromSentiment ||
          assistantMessage.toLowerCase().includes("escalat") ||
          assistantMessage.toLowerCase().includes("specialist") ||
          assistantMessage.toLowerCase().includes("human");

        // Log auto-escalation
        if (autoEscalateFromSentiment) {
          console.log(`[AIBot] Auto-escalating angry customer (sentiment: ${analysis.sentiment}, score: ${analysis.sentimentScore}) to ${analysis.routedTo}`);
        }

        // Save assistant message
        const assistantMsgResult = await saveChatMessage({
          sessionId,
          role: "assistant",
          message: assistantMessage,
          metadata: JSON.stringify({
            confidence: relevantDocs.length > 0 ? 0.8 : 0.5,
            sources: relevantDocs.map(d => d.id),
            shouldEscalate,
            sentiment: analysis.sentiment,
            intent: analysis.intent,
            routedTo: analysis.routedTo
          }),
        });
        const assistantMessageId = (assistantMsgResult as any)?.[0]?.insertId || 1;

        // Generate conversation summary every 5 messages
        const allMessages = await getChatMessages(sessionId);
        if (allMessages.length % 5 === 0 && allMessages.length > 0) {
          const { generateConversationSummary } = await import('./aibot-enterprise');
          const summaryData = await generateConversationSummary(sessionId, allMessages.slice(-10));
          await saveConversationSummary({
            sessionId,
            summary: summaryData.summary,
            keyPoints: summaryData.keyPoints,
            suggestedActions: summaryData.suggestedActions
          });
        }

        // Update message count
        const updatedSession = await getChatSession(sessionId);
        if (updatedSession) {
          // Message count is incremented by the database
        }

        return {
          sessionId,
          message: assistantMessage,
          shouldEscalate,
          messageCount: (updatedSession?.messageCount || 0) + 1,
        };
      } catch (error) {
        console.error("[AIBot] LLM error:", error);
        const errorMessage = "I'm experiencing technical difficulties. Let me connect you with our support team.";
        
        await saveChatMessage({
          sessionId,
          role: "assistant",
          message: errorMessage,
        });

        return {
          sessionId,
          message: errorMessage,
          shouldEscalate: true,
          error: true,
        };
      }
    }),

  // Get chat history
  getHistory: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      const messages = await getChatMessages(input.sessionId);
      return { messages };
    }),

  // Escalate to help desk
  escalateToHelpDesk: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      reason: z.string(),
      priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
    }))
    .mutation(async ({ input }) => {
      const { sessionId, reason, priority } = input;

      const session = await getChatSession(sessionId);
      if (!session) {
        throw new Error("Session not found");
      }

      // Get chat history for transcript
      const messages = await getChatMessages(sessionId);
      const transcript = messages
        .map(m => `${m.role === "user" ? "Customer" : "Bot"}: ${m.message}`)
        .join("\n");

      // Create help desk ticket
      const ticketResult = await createTicket({
        userId: 1, // System user for bot escalations
        title: `Chat Escalation: ${reason.substring(0, 100)}`,
        description: `**Escalation Reason:** ${reason}\n\n**Customer Info:**\nName: ${session.visitorName || "Anonymous"}\nEmail: ${session.visitorEmail || "Not provided"}\nCompany: ${session.visitorCompany || "Not provided"}\n\n**Chat Transcript:**\n${transcript}`,
        priority: priority as any,
        category: "general_support" as any,
        status: "open" as any,
      });

      const ticketId = ticketResult?.id || 1;

      // Update chat session status with actual ticket ID
      await updateChatSessionStatus(sessionId, "escalated", ticketId);

      // Send notification to owner
      try {
        await notifyOwner({
          title: `New Support Ticket from Chat: ${session.visitorName || "Anonymous"}`,
          content: `Priority: ${priority}\nReason: ${reason}\nCustomer Email: ${session.visitorEmail || "Not provided"}\nCompany: ${session.visitorCompany || "Not provided"}\n\nTicket #${ticketId}\n\nChat Transcript:\n${transcript}`,
        });
      } catch (error) {
        console.error("[AIBot] Failed to send notification:", error);
      }

      return {
        success: true,
        ticketId,
        message: "Your issue has been escalated to our support team. A specialist will contact you shortly.",
      };
    }),

  // Capture lead information
  captureLead: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      name: z.string().min(1),
      email: z.string().email(),
      phone: z.string().optional(),
      company: z.string().optional(),
      interest: z.string().optional(),
      consentEmail: z.boolean().default(false),
      consentPhone: z.boolean().default(false),
      consentText: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      const { sessionId, name, email, phone, company, interest, consentEmail, consentPhone, consentText } = input;

      // Get chat history for summary
      const messages = await getChatMessages(sessionId);
      const conversationSummary = messages
        .slice(-5)
        .map(m => `${m.role === "user" ? "Q" : "A"}: ${m.message.substring(0, 100)}...`)
        .join("\n");

      await saveChatLead({
        sessionId,
        name,
        email,
        phone: phone || null,
        company: company || null,
        interest: interest || null,
        consentEmail,
        consentPhone,
        consentText,
        conversationSummary,
      });

      // Build contact preferences summary for notification
      const contactMethods = [
        consentEmail ? "Email" : "",
        consentPhone ? "Phone call" : "",
        consentText ? "Text/SMS" : "",
      ].filter(Boolean).join(", ");

      // Send notification to owner about new lead (dashboard)
      try {
        await notifyOwner({
          title: `New Lead from Chat: ${name}`,
          content: `Email: ${email}\nPhone: ${phone || "Not provided"}\nCompany: ${company || "Not provided"}\nContact Preferences: ${contactMethods || "None selected"}\nInterest: ${interest || "Not specified"}\n\nConversation Summary:\n${conversationSummary}`,
        });
      } catch (error) {
        console.error("[AIBot] Failed to send lead dashboard notification:", error);
      }

      // Send email notification to admin
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
    .header h2 { margin: 0; font-size: 24px; }
    .content { padding: 24px; }
    .field { margin-bottom: 16px; }
    .field-label { font-weight: 600; color: #333; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .field-value { color: #666; font-size: 14px; margin-top: 4px; }
    .divider { border-top: 1px solid #e0e0e0; margin: 20px 0; }
    .summary { background: #f9f9f9; border-left: 4px solid #00D4FF; padding: 12px; border-radius: 4px; font-size: 13px; color: #555; line-height: 1.6; }
    .footer { background: #f5f5f5; padding: 16px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #e0e0e0; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #00D4FF 0%, #0099CC 100%); color: #0A0E1A; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>🎯 New Lead from AI Chat</h2>
    </div>
    <div class="content">
      <div class="field">
        <div class="field-label">Name</div>
        <div class="field-value">${name}</div>
      </div>
      <div class="field">
        <div class="field-label">Email</div>
        <div class="field-value"><a href="mailto:${email}" style="color: #00D4FF; text-decoration: none;">${email}</a></div>
      </div>
      ${phone ? `<div class="field"><div class="field-label">Phone</div><div class="field-value"><a href="tel:${phone}" style="color: #00D4FF; text-decoration: none;">${phone}</a></div></div>` : ''}
      ${company ? `<div class="field"><div class="field-label">Company</div><div class="field-value">${company}</div></div>` : ''}
      ${interest ? `<div class="field"><div class="field-label">Interest</div><div class="field-value">${interest}</div></div>` : ''}
      <div class="field">
        <div class="field-label">Contact Preferences</div>
        <div class="field-value">${contactMethods || "No preferences selected"}</div>
      </div>
      <div class="divider"></div>
      <div class="field">
        <div class="field-label">Recent Conversation</div>
        <div class="summary">${conversationSummary.replace(/\n/g, '<br/>')}</div>
      </div>
      <div style="text-align: center;">
        <a href="https://gigitekai.com" class="cta-button">View Lead in Dashboard</a>
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0;">GigitekAI • Cloud & AI Solutions</p>
      <p style="margin: 4px 0 0;">support@gigitekai.com • 609-676-4483</p>
      <p style="margin: 8px 0 0; font-size: 11px;"><a href="https://gigitekai.com/unsubscribe?email=${encodeURIComponent(email)}" style="color: #999; text-decoration: none;">Unsubscribe from lead follow-ups</a></p>
    </div>
  </div>
</body>
</html>
        `;

        const emailSent = await sendEmail({
          to: "support@gigitekai.com",
          subject: `New Lead: ${name} (${company || "No company"})`,
          html: emailBody,
          replyTo: email,
        });

        if (!emailSent) {
          console.warn("[AIBot] Lead email notification failed to send");
        }
      } catch (error) {
        console.error("[AIBot] Failed to send lead email:", error);
      }

      // Send customer confirmation email if they consented
      if (consentEmail) {
        try {
          const customerConfirmationEmail = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #0A0E1A 0%, #0F1A30 100%); color: #00D4FF; padding: 24px; text-align: center; border-bottom: 2px solid #00D4FF; }
    .header h2 { margin: 0; font-size: 24px; }
    .content { padding: 24px; }
    .greeting { font-size: 16px; color: #333; margin-bottom: 16px; }
    .message { color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 16px; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #00D4FF 0%, #0099CC 100%); color: #0A0E1A; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 16px 0; }
    .footer { background: #f5f5f5; padding: 16px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #e0e0e0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>✅ We Received Your Request</h2>
    </div>
    <div class="content">
      <div class="greeting">Hi ${name},</div>
      <div class="message">
        Thank you for reaching out to GigitekAI! We've received your inquiry and our team is reviewing your request.
      </div>
      <div class="message">
        <strong>What happens next:</strong><br/>
        Our sales team will review your requirements and reach out within 24 business hours with a customized proposal tailored to your needs.
      </div>
      ${company ? `<div class="message"><strong>Company:</strong> ${company}</div>` : ''}
      ${interest ? `<div class="message"><strong>Your Interest:</strong> ${interest}</div>` : ''}
      <div class="message">
        In the meantime, feel free to explore our services or contact us directly at <a href="tel:609-676-4483" style="color: #00D4FF; text-decoration: none;">609-676-4483</a> or <a href="mailto:support@gigitekai.com" style="color: #00D4FF; text-decoration: none;">support@gigitekai.com</a>.
      </div>
      <div style="text-align: center;">
        <a href="https://gigitekai.com/services" class="cta-button">Explore Our Services</a>
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0;">GigitekAI • Cloud & AI Solutions</p>
      <p style="margin: 4px 0 0;">support@gigitekai.com • 609-676-4483</p>
      <p style="margin: 8px 0 0; font-size: 11px;"><a href="https://gigitekai.com/unsubscribe?email=${encodeURIComponent(email)}" style="color: #999; text-decoration: none;">Manage email preferences</a></p>
    </div>
  </div>
</body>
</html>
          `;

          await sendEmail({
            to: email,
            subject: "Thank You for Your Interest in GigitekAI",
            html: customerConfirmationEmail,
          });

          console.log(`[AIBot] Customer confirmation email sent to ${email}`);
        } catch (error) {
          console.error("[AIBot] Failed to send customer confirmation email:", error);
        }
      }

      return { success: true, message: "Thank you! We'll follow up with you shortly." };
    }),

  // Export chat transcript as text
  exportTranscript: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      const messages = await getChatMessages(input.sessionId);
      if (!messages || messages.length === 0) {
        return { transcript: "", messageCount: 0 };
      }
      const transcript = formatTranscript(messages, "text");
      return { transcript, messageCount: messages.length };
    }),

  // Email chat transcript to user
  emailTranscript: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      email: z.string().email(),
      name: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { sessionId, email, name } = input;
      const messages = await getChatMessages(sessionId);
      if (!messages || messages.length === 0) {
        throw new Error("No messages to send");
      }

      const htmlContent = formatTranscript(messages, "html");
      const greeting = name ? `Hi ${name},` : "Hi,";

      const fullHtml = htmlContent.replace(
        '<div style="text-align:center;padding:20px 0;border-bottom:1px solid rgba(0,212,255,0.2);margin-bottom:20px;">',
        `<div style="padding:12px 16px;background:#0d2847;border-radius:12px;margin-bottom:16px;"><p style="color:#e2e8f0;font-size:14px;margin:0;">${greeting} Here is a copy of your conversation with our AI assistant. If you need further help, feel free to reply to this email or visit <a href=\"https://gigitekai.com\" style=\"color:#00D4FF;\">gigitekai.com</a>.</p></div><div style="text-align:center;padding:20px 0;border-bottom:1px solid rgba(0,212,255,0.2);margin-bottom:20px;">`
      );

      const success = await sendEmail({
        to: email,
        subject: "Your GigitekAI Chat Transcript",
        html: fullHtml,
      });

      if (!success) {
        throw new Error("Failed to send email. Please try again.");
      }

      return { success: true, message: `Transcript sent to ${email}` };
    }),

  // Get quick reply options
  getQuickReplies: publicProcedure.query(async () => {
    return {
      quickReplies: [
        { label: "Microsoft 365 Issue", value: "microsoft_365" },
        { label: "Cloud Services", value: "cloud_services" },
        { label: "Pricing & Plans", value: "pricing" },
        { label: "Onboarding Help", value: "onboarding" },
        { label: "Talk to Support", value: "escalate" },
      ],
    };
  }),

  // Rate bot response (thumbs up/down)
  rateResponse: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      messageId: z.number(),
      rating: z.enum(["helpful", "neutral", "unhelpful"]),
      feedback: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { sessionId, messageId, rating, feedback } = input;
      
      try {
        await saveResponseRating({
          sessionId,
          messageId,
          rating: rating as any,
          feedback: feedback || null,
        });
        
        return { success: true, message: "Thank you for your feedback!" };
      } catch (error) {
        console.error("[AIBot] Failed to save rating:", error);
        return { success: false, message: "Failed to save feedback" };
      }
    }),

  // Get conversation summary
  getConversationSummary: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      try {
        const messages = await getChatMessages(input.sessionId);
        if (messages.length === 0) {
          return { summary: "", keyPoints: [], suggestedActions: [] };
        }
        
        // For now, return a placeholder
        // In production, this would fetch from conversationSummaries table
        return {
          summary: "Conversation in progress",
          keyPoints: [],
          suggestedActions: []
        };
      } catch (error) {
        console.error("[AIBot] Failed to get summary:", error);
        return { summary: "", keyPoints: [], suggestedActions: [] };
      }
    }),

  // Teams integration - sync chat to Teams
  syncToTeams: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      teamsConversationId: z.string(),
      teamsUserId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { sessionId, teamsConversationId, teamsUserId } = input;
      
      try {
        await saveTeamsIntegration({
          sessionId,
          teamsConversationId,
          teamsUserId,
          status: "active",
        });
        
        return { success: true, message: "Chat synced to Teams" };
      } catch (error) {
        console.error("[AIBot] Failed to sync to Teams:", error);
        return { success: false, message: "Failed to sync to Teams" };
      }
    }),

  requestAgentTakeover: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      visitorName: z.string().optional(),
      visitorEmail: z.string().email().optional(),
      visitorPhone: z.string().optional(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const messages = await getChatMessages(input.sessionId);
        const context = messages
          .slice(-5)
          .map(m => `${m.role === 'user' ? 'Customer' : 'Bot'}: ${m.message}`)
          .join('\n');

        await createAgentTakeoverRequest({
          sessionId: input.sessionId,
          visitorName: input.visitorName || null,
          visitorEmail: input.visitorEmail || null,
          visitorPhone: input.visitorPhone || null,
          reason: input.reason || null,
          status: 'pending',
          conversationContext: context || null,
        });

        await notifyOwner({
          title: 'Agent Takeover Requested',
          content: `Customer ${input.visitorName || 'Unknown'} requested agent. Reason: ${input.reason || 'Not specified'}. Session: ${input.sessionId}`
        });

        return { success: true, message: 'Agent request submitted. A specialist will be with you shortly.' };
      } catch (error) {
        console.error('[AIBot] Takeover request failed:', error);
        return { success: false, message: 'Failed to request agent' };
      }
    }),

  getPendingTakeovers: publicProcedure
    .query(async () => {
      try {
        const requests = await getPendingAgentTakeoverRequests();
        return { requests, count: requests.length };
      } catch (error) {
        console.error('[AIBot] Failed to get pending takeovers:', error);
        return { requests: [], count: 0 };
      }
    }),

  acceptAgentTakeover: publicProcedure
    .input(z.object({
      requestId: z.number(),
      adminId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const takeoverRequest = await getAgentTakeoverRequestBySession(input.requestId.toString());
        if (!takeoverRequest) {
          return { success: false, message: 'Request not found' };
        }

        const ticket = await createTicket({
          title: `Agent Takeover: ${takeoverRequest.visitorName || 'Customer'}`,
          description: `Customer requested agent takeover.\n\nReason: ${takeoverRequest.reason || 'Not specified'}\n\nChat Context:\n${takeoverRequest.conversationContext || 'No context'}\n\nContact: ${takeoverRequest.visitorEmail || 'No email'} | ${takeoverRequest.visitorPhone || 'No phone'}`,
          priority: 'high',
          status: 'open',
          category: 'general_support',
          userId: 1,
        });

        const ticketId = (ticket as any)?.[0]?.insertId || 1;
        await updateAgentTakeoverRequestStatus(input.requestId, 'accepted', input.adminId, ticketId);

        return { success: true, message: 'Agent takeover accepted', ticketId };
      } catch (error) {
        console.error('[AIBot] Failed to accept takeover:', error);
        return { success: false, message: 'Failed to accept takeover' };
      }
    }),

  clearChatHistory: publicProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const success = await deleteChatMessages(input.sessionId);
        if (success) {
          return { success: true, message: 'Chat history cleared permanently' };
        } else {
          return { success: false, message: 'Failed to clear chat history' };
        }
      } catch (error) {
        console.error('[AIBot] Failed to clear chat history:', error);
        return { success: false, message: 'Failed to clear chat history' };
      }
    }),

  deleteMessage: publicProcedure
    .input(z.object({
      messageId: z.number(),
    }))
    .mutation(async ({ input }) => {
      try {
        const success = await deleteMessageById(input.messageId);
        if (success) {
          return { success: true, message: 'Message deleted' };
        } else {
          return { success: false, message: 'Failed to delete message' };
        }
      } catch (error) {
        console.error('[AIBot] Failed to delete message:', error);
        return { success: false, message: 'Failed to delete message' };
      }
    }),
});
