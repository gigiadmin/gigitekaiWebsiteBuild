import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { notifyOwner } from "../_core/notification";
import { sendEmail } from "../_core/email";
import {
  buildTicketConfirmationEmail,
  formatCategory,
  getPriorityDetails,
  formatChannel,
  formatReceivedAt,
} from "../emailTemplates";
import { 
  searchKnowledgeBase,
  searchKBArticles,
  getAllPublishedKBArticles,
  isKBArticleRelevant,
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
  deleteMessageById,
  submitKBArticleFeedback,
  getKBArticleFeedback,
  getKBArticleAnalytics,
  logEscalationPattern,
  getEscalationPatterns,
  getEscalationPatternStats
} from "../db";
import { eq, desc, sql, and } from "drizzle-orm";
import { chatSessions, chatMessages } from "../../drizzle/schema";
import { getAdminFromRequest } from "./admin-auth";
import type { Request } from "express";
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
          <p style="color:#64748b;font-size:11px;margin:4px 0 0;">GigitekAI &bull; Cloud & AI Solutions &bull; support@gigitekai.com &bull; +1 727 382 6909</p>
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
  const footer = `\n${"-".repeat(50)}\nThis transcript was saved from gigitekai.com\nGigitekAI • Cloud & AI Solutions • support@gigitekai.com • +1 727 382 6909`;
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
Microsoft 365, Microsoft Copilot, Power Automate, SharePoint, Teams, Azure AI Services, Entra ID, Power BI, Copilot Studio, Power Platform, Azure

## GigitekAI Vendor Stack (Products We Manage for Clients)
You are knowledgeable about all of these products and can answer questions about them:

### Backup & Data Protection
- **Afi** (afi.ai) — Microsoft 365 backup (Exchange, SharePoint, OneDrive, Teams). Self-service restore at app.afi.ai. Common issues: backup not running (check connector health), restore takes 10-30 min, point-in-time restore available up to 1 year.
- **Commvault** — Enterprise backup and data protection for hybrid environments. Handles on-prem servers, VMs, cloud workloads. Contact GigitekAI for restore requests.

### Cybersecurity & Endpoint Protection
- **ConnectSecure** (connectsecure.com) — Vulnerability management and compliance scanning. Continuously scans endpoints for CVEs, misconfigurations, and compliance gaps. Reports available in the ConnectSecure portal. GigitekAI reviews weekly.
- **DefensX** (defensx.com) — Browser isolation and web security. Protects against malicious websites, phishing, and drive-by downloads. If a legitimate site is blocked: contact GigitekAI to whitelist the URL. Policy exceptions require admin approval.
- **Harmony/Avanan** (checkpoint.com/harmony) — Email security powered by Check Point. Scans all inbound/outbound email for phishing, malware, BEC attacks. If a legitimate email is quarantined: log into the Avanan portal or contact GigitekAI to release and whitelist the sender.

### Network Security & Access
- **NordLayer** (nordlayer.com) — Business VPN and SASE (Secure Access Service Edge). Provides secure remote access, network segmentation, and Zero Trust access. Common issues: can't connect (check gateway status at status.nordlayer.com), slow VPN (try different gateway), access denied (contact GigitekAI to check permissions).
- **NordPass Business** (nordpass.com) — Business password manager. Centrally managed credentials, secure sharing, breach monitoring. Admins manage users at my.nordpass.com/business.
- **NordStellar** (nordstellar.com) — Dark web monitoring and threat intelligence. Monitors for leaked credentials, data breaches, and compromised accounts. Alerts are reviewed by GigitekAI and clients are notified immediately.

### Vendor Support Escalation
For vendor-specific issues beyond basic troubleshooting, GigitekAI manages all vendor relationships. Direct clients to contact GigitekAI support rather than the vendor directly, unless they have an emergency.

## How to Handle Inquiries
1. Greet the user warmly and ask how you can help.
2. For support issues, gather: what the issue is, which M365 service is affected, and any error messages.
3. Provide actionable guidance when possible.
4. For complex issues or anything requiring hands-on work, direct them to schedule a consultation.
5. **For pricing inquiries**: Explain the three help desk tiers (Essential, Professional, Elite) with their key differences. Mention volume discounts and annual pre-pay savings. Offer to collect contact info for a custom quote.
6. For sales inquiries about packages or pricing, collect their name, company, email, and user count, and let them know the GigitekAI team will follow up with a custom quote.

## Communication Guidelines
- **CRITICAL: Keep responses VERY concise** - limit to 100 words maximum (3-4 lines in chat widget).
- **Use bullet points** for any list of 2+ items. Avoid long paragraphs.
- **Short sentences** - break complex ideas into simple, scannable lines.
- Be professional, friendly, and technical - adjust your language based on the user's expertise level
- Provide clear, actionable steps and next actions
- For complex issues, security concerns, or tenant-specific problems, recommend escalation to human support
- If you cannot confidently answer after 1-2 clarification attempts, suggest escalation
- When users explicitly ask for a human, immediately offer to escalate
- Maintain a calm, confident tone appropriate for business clients
- Avoid humor in sensitive contexts (outages, security incidents)
- Use formatting: **bold** for emphasis, bullet points for lists, and short paragraphs
- **For chat widget**: Prioritize readability in small boxes - shorter is always better

## Intent Detection (CRITICAL)
When user says ANY of these phrases, IMMEDIATELY respond with: "I'll connect you with our specialist team. One moment..."
- "yes to call" / "yes to schedule" / "yes to meeting"
- "schedule a call" / "book a call" / "talk to specialist"
- "i want to talk to someone" / "i need to speak to a person"
- "can we set up a call" / "let's schedule" / "when can we meet"
- "i'm ready to discuss" / "let's talk about pricing" / "custom quote"

Do NOT ask for clarification on these intents - immediately escalate to specialist form.

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

## SLA Response Times & Onboarding Process

### SLA Response Times by Tier
- **Essential ($69/user/month):** Critical = 4-hour response, High = 8 hours, Medium = next business day, Low = 3 business days. Business hours: 8am-6pm ET.
- **Professional ($119/user/month):** Critical = 15-minute response, High = 1 hour, Medium = 4 hours, Low = next business day. 24/7 coverage.
- **Elite ($189/user/month):** Critical = 15-minute response, High = 30 minutes, Medium = 2 hours, Low = same business day. 24/7 coverage + dedicated vCIO.

### Client Onboarding Process (48hr Average)
1. Contract signed → Welcome email sent within 2 hours
2. Onboarding call scheduled (Day 1)
3. Microsoft 365 tenant access granted and audited (Day 1)
4. Endpoint agents deployed (ConnectSecure, DefensX, NordLayer) (Day 1-2)
5. Backup configured in Afi (Day 2)
6. Helpdesk ticketing system access provided (Day 2)
7. Go-live confirmation call (Day 2)

### Client Portal & Ticketing
- Submit tickets: support@gigitekai.com or call (727) 382-6909
- Client portal: gigitekai.com/admin (for existing clients)
- Emergency/critical issues: Call directly for fastest response

## Microsoft Copilot Studio & Power Platform

### Microsoft Copilot Studio
Copilot Studio (formerly Power Virtual Agents) lets organizations build custom AI chatbots and agents without code. Key capabilities:
- **Custom Copilots:** Build AI agents that answer questions from your own data (SharePoint, websites, PDFs)
- **Topics:** Define conversation flows for specific intents (e.g., IT support, HR FAQs, sales inquiries)
- **Generative AI:** Connect to Azure OpenAI for natural language responses beyond scripted flows
- **Channels:** Deploy to Teams, websites, mobile apps, and third-party platforms
- **Actions:** Connect to Power Automate flows, APIs, and Microsoft Graph to take real actions
- **Analytics:** Built-in dashboards for conversation volume, escalation rates, CSAT
- **Licensing:** Copilot Studio is included in Microsoft 365 Copilot license OR available standalone at $200/tenant/month (25,000 messages)

### Power Platform Overview
- **Power Automate:** Workflow automation. Connects 1,000+ apps. Used for ticket routing, approvals, notifications, data sync.
- **Power Apps:** Build custom business apps (canvas or model-driven) without code.
- **Power BI:** Business intelligence and data visualization. Connects to M365, Azure, SQL, and hundreds of sources.
- **Power Pages:** Build external-facing websites with forms and data from Dataverse.
- **Dataverse:** The underlying data platform for Power Platform — stores structured business data.

### Common Copilot Studio Issues
- **Bot not responding in Teams:** Check Teams channel configuration in Copilot Studio > Channels > Microsoft Teams. Re-publish after changes.
- **Generative answers not working:** Verify knowledge source is indexed (SharePoint sites must be crawled). Check Generative AI feature is enabled in tenant.
- **Flow action failing:** Check Power Automate connection credentials haven't expired. Re-authenticate in Power Automate > Connections.
- **Escalation to human agent:** Configure in Topics > Escalate > set up handoff to Dynamics 365 CS or custom webhook.

## Escalation
If an issue cannot be resolved through these steps, say: "This one needs hands-on support from the GigitekAI team. Please share your name, company, email, and a brief description of the issue and we'll follow up promptly."

## GigitekAI Contact Information
- **Phone:** (727) 382-6909
- **Email:** support@gigitekai.com
- **Website:** https://gigitekai.com
When users ask for our phone number or how to reach us, always provide: **(727) 382-6909** or **support@gigitekai.com**.

## Tone
Professional but approachable. Match the user's technical level. Keep responses concise and action-oriented. Never guess — if unsure, escalate.

## Florida Market — Regional Expertise
When interacting with Florida-based prospects or clients, prioritize these themes:

### BCDR (Business Continuity & Disaster Recovery)
- Florida businesses face unique threats: Category 5 hurricanes, flooding, and extended power outages can take offices offline for weeks.
- GigitekAI's **Disaster-Proof Agentic Cloud** replicates entire business logic into a sovereign AI vault. If the physical office goes dark, AI Agents keep processing orders, triaging tickets, and serving clients.
- **Recovery Time Objective (RTO): < 15 minutes** (vs. 4–24 hours for standard Florida MSPs).
- Emphasize: "Your business doesn't stop when the storm hits."

### FIPA Compliance (Florida Information Protection Act)
- Florida's FIPA requires breach notification within **30 days** — stricter than many federal standards.
- GigitekAI automates FIPA compliance monitoring: our agents track data flows and trigger notifications automatically.
- Also covers HIPAA for healthcare clients and PCI-DSS for financial/retail.

### The Local Advantage
- GigitekAI is an AI-first global-ready firm with **Boots on the Ground** in the Tampa Bay area for hybrid-office setups.
- Data residency in Tier 4 data centers: **Miami** (primary), **Tampa** (secondary), **Atlanta** (out-of-region DR).
- Low latency + out-of-region safety = Florida Sovereign Cloud.

### GigitekAI vs. Standard Florida MSPs
- Standard FL MSP RTO: 4–24 Hours | GigitekAI Elite RTO: < 15 Minutes
- Standard FL MSP Security: NIST / Basic Firewall | GigitekAI: Zero-Trust + AI Threat Hunting
- Standard FL MSP Value: Efficiency (Saving Time) | GigitekAI: Transformation (Generating Revenue)
- Standard FL MSP Focus: Generic Support | GigitekAI: Florida Compliance & Disaster Hardening

### The Switch Program
- Clients frustrated with slow local MSPs can take advantage of GigitekAI's **60-Day Migration Guarantee**.
- We handle the full migration, zero downtime, and guarantee service quality within 60 days or the migration is free.
- Direct prospects to: gigitekai.com/switch-program
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
      let { sessionId, message } = input;

      // If this is a local fallback ID (starts with 'local-') or the session doesn't exist,
      // create a real DB session so the LLM call can proceed
      let session = await getChatSession(sessionId);
      if (!session) {
        // Create a new real session (use nanoid for proper DB sessions)
        const realSessionId = nanoid();
        await createChatSession({
          sessionId: realSessionId,
          visitorName: null,
          visitorEmail: null,
          visitorCompany: null,
          status: "active",
        });
        sessionId = realSessionId;
        session = await getChatSession(sessionId);
      }

      if (!session) {
        throw new Error("Session not found");
      }

      // Get chat history
      const history = await getChatMessages(sessionId);

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

      // Save sentiment and intent analysis (non-blocking - don't wait for it)
      saveChatAnalytic({
        sessionId,
        messageId: userMessageId,
        sentiment: analysis.sentiment as any,
        sentimentScore: analysis.sentimentScore,
        intent: analysis.intent as any,
        intentConfidence: analysis.intentConfidence,
        routedTo: analysis.routedTo
      }).catch(err => {
        console.warn("[AIBot] Failed to save chat analytics (non-critical):", err);
      });

      // Search KB articles for relevant context
      let context = "";
      let kbArticlesFound: any[] = [];
      try {
        kbArticlesFound = await searchKBArticles(message, 3);
        if (kbArticlesFound.length > 0) {
          context = kbArticlesFound.map(a => `[KB: ${a.title}]\n${a.content}`).join("\n\n");
        } else {
          // Fallback to legacy knowledge base
          const legacyResults = await searchKnowledgeBase(message);
          if (legacyResults.length > 0) {
            context = legacyResults.slice(0, 3).map(r => `[${r.title}]\n${r.content}`).join("\n\n");
          }
        }
      } catch (kbError) {
        console.warn('[AIBot] KB search failed (non-critical):', kbError);
      }

      // Build conversation history for LLM
      const conversationHistory = history.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.message,
      }));
      conversationHistory.push({ role: "user", content: message });

      // Call LLM with context
      try {
        // Add timeout to prevent hanging
        const llmPromise = invokeLLM({
          messages: [
            { role: "system", content: SYSTEM_PROMPT + (context ? `\n\nRelevant documentation:\n${context}` : "") },
            ...conversationHistory,
          ],
        });

        // 30 second timeout for LLM response
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('LLM response timeout')), 30000)
        );

        const response = await Promise.race([llmPromise, timeoutPromise]);

        const assistantMessageContent = (response as any).choices[0]?.message?.content;
        let assistantMessage = typeof assistantMessageContent === 'string' 
          ? assistantMessageContent 
          : "I apologize, I'm having trouble responding. Please try again.";

        // Append KB article recommendations if found
        if (kbArticlesFound.length > 0) {
          const kbSection = kbArticlesFound.map(a => `- [${a.title}](/kb/${a.id})`).join("\n");
          assistantMessage += `\n\n\ud83d\udcda **This is covered in our KB:**\n${kbSection}`;
        } else {
          // Proactive KB suggestions: use the same relevance-filtered search
          // This avoids iterating all 1800+ articles with weak 1-word matching
          try {
            const proactiveSuggestions = await searchKBArticles(message, 2);
            // Only show suggestions if they have high relevance (score >= 70)
            // This prevents false positives like 'hello' matching 'Windows Hello'
            const highRelevanceSuggestions = proactiveSuggestions.filter(
              (a: any) => (a.relevanceScore || 0) >= 70
            );
            if (highRelevanceSuggestions.length > 0) {
              const suggestSection = highRelevanceSuggestions.map(a => `- [${a.title}](/kb/${a.id})`).join("\n");
              assistantMessage += `\n\n💡 **Hey, this might help:**\n${suggestSection}`;
            }
          } catch (proactiveErr) {
            console.warn('[AIBot] Proactive KB suggestion failed (non-critical):', proactiveErr);
          }
        }

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
          // Log escalation pattern for analytics (Phase 2)
          try {
            await logEscalationPattern({
              sessionId,
              originalMessage: message,
              detectedIntent: analysis.intent || 'general',
              intentConfidence: String(analysis.intentConfidence || '0.5'),
              sentiment: analysis.sentiment || 'neutral',
              sentimentScore: String(analysis.sentimentScore || '0.5'),
              escalationReason: 'auto_escalation_angry_sentiment',
              kbArticleSuggested: false,
              createdAt: new Date(),
            });
          } catch (logError) {
            console.warn('[AIBot] Failed to log auto-escalation pattern:', logError);
          }
        }

        // Save assistant message
        const assistantMsgResult = await saveChatMessage({
          sessionId,
          role: "assistant",
          message: assistantMessage,
          metadata: JSON.stringify({
            confidence: 0.5,
            sources: [],
            shouldEscalate,
            sentiment: analysis.sentiment,
            intent: analysis.intent,
            routedTo: analysis.routedTo,
            kbArticlesUsed: kbArticlesFound.length,
            proactiveSuggestions: kbArticlesFound.length === 0
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

        // Detect if bot is connecting user to specialist
        const openSpecialistForm = assistantMessage.toLowerCase().includes("i'll connect you") ||
          assistantMessage.toLowerCase().includes("connect you with our specialist") ||
          assistantMessage.toLowerCase().includes("specialist team");

        return {
          sessionId,
          message: assistantMessage,
          shouldEscalate,
          messageCount: (updatedSession?.messageCount || 0) + 1,
          openSpecialistForm,
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
      try {
        // Add timeout to prevent hanging
        const historyPromise = getChatMessages(input.sessionId);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('History fetch timeout')), 5000)
        );
        
        const messages = await Promise.race([historyPromise, timeoutPromise]) as any[];
        return { messages: messages || [] };
      } catch (error) {
        console.error('[AIBot] Failed to fetch chat history:', error);
        // Return empty messages array instead of failing
        return { messages: [] };
      }
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

      // Send branded confirmation email to customer if email is available
      if (session.visitorEmail) {
        try {
          const firstName = (session.visitorName || session.visitorEmail).split(" ")[0] || "there";
          const priorityDetails = getPriorityDetails(priority);
          const confirmationHtml = buildTicketConfirmationEmail({
            firstName,
            ticketNumber: ticketId,
            ticketTitle: `Chat Escalation: ${reason.substring(0, 80)}`,
            category: formatCategory("general_support"),
            priority,
            channel: formatChannel("chat"),
            receivedAt: formatReceivedAt(new Date()),
            slaWindow: priorityDetails.sla,
            ticketUrl: `https://gigitekai.com/helpdesk/ticket/${ticketId}`,
          });
          const emailSent = await sendEmail({
            to: session.visitorEmail,
            subject: `[Ticket #${ticketId}] Your chat has been escalated to our support team`,
            html: confirmationHtml,
            replyTo: "support@gigitekai.com",
            fromName: "GigitekAI Support",
          });
          if (emailSent) {
            console.log(`[AIBot] Branded escalation confirmation sent to ${session.visitorEmail} for ticket #${ticketId}`);
          } else {
            console.warn(`[AIBot] Failed to send escalation confirmation to ${session.visitorEmail}`);
          }
        } catch (emailError) {
          console.error("[AIBot] Exception sending escalation confirmation:", emailError);
        }
      }

      // Log escalation pattern for analytics (Phase 2)
      try {
        // Get the last user message for pattern tracking
        const lastUserMsg = messages.filter(m => m.role === 'user').slice(-1)[0];
        await logEscalationPattern({
          sessionId,
          originalMessage: lastUserMsg?.message || reason,
          detectedIntent: 'general',
          intentConfidence: '0.5',
          sentiment: 'neutral',
          sentimentScore: '0.5',
          escalationReason: reason.substring(0, 255),
          kbArticleSuggested: false,
          ticketId,
          createdAt: new Date(),
        });
      } catch (logError) {
        console.warn('[AIBot] Failed to log escalation pattern:', logError);
      }

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
      <p style="margin: 4px 0 0;">support@gigitekai.com • +1 727 382 6909</p>
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
        In the meantime, feel free to explore our services or contact us directly at <a href="tel:+1 727 382 6909" style="color: #00D4FF; text-decoration: none;">+1 727 382 6909</a> or <a href="mailto:support@gigitekai.com" style="color: #00D4FF; text-decoration: none;">support@gigitekai.com</a>.
      </div>
      <div style="text-align: center;">
        <a href="https://gigitekai.com/services" class="cta-button">Explore Our Services</a>
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0;">GigitekAI • Cloud & AI Solutions</p>
      <p style="margin: 4px 0 0;">support@gigitekai.com • +1 727 382 6909</p>
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

  submitKBFeedback: publicProcedure
    .input(z.object({
      messageId: z.number(),
      articleId: z.number(),
      rating: z.enum(['helpful', 'unhelpful']),
      feedbackMessage: z.string().optional(),
      sessionId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await submitKBArticleFeedback({
          messageId: input.messageId,
          articleId: input.articleId,
          rating: input.rating,
          feedbackMessage: input.feedbackMessage || null,
          sessionId: input.sessionId || null,
          userId: null,
          createdAt: new Date(),
        });
        return { success: !!result, feedback: result };
      } catch (error) {
        console.error('[AIBot] Failed to submit KB feedback:', error);
        return { success: false, error: 'Failed to submit feedback' };
      }
    }),

  getKBAnalytics: publicProcedure
    .input(z.object({
      articleId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      try {
        const analytics = await getKBArticleAnalytics(input.articleId);
        return { success: true, analytics };
      } catch (error) {
        console.error('[AIBot] Failed to get KB analytics:', error);
        return { success: false, analytics: [] };
      }
    }),

  // Pre-emptive KB suggestions while user is typing (Phase 2)
  getProactiveKBSuggestions: publicProcedure
    .input(z.object({
      query: z.string().min(1).max(500),
    }))
    .query(async ({ input }) => {
      try {
        if (input.query.trim().length < 10) return { suggestions: [] };
        const articles = await searchKBArticles(input.query.trim(), 3);
        const suggestions = articles.map(a => ({
          id: a.id,
          title: a.title,
          excerpt: (a.content || '').slice(0, 120).replace(/\n/g, ' ') + '\u2026',
          category: a.category || 'General',
          slug: (a as any).slug || null,
        }));
        return { suggestions };
      } catch (error) {
        console.error('[AIBot] Failed to get proactive KB suggestions:', error);
        return { suggestions: [] };
      }
    }),

  // Escalation pattern queries (Phase 2)
  getEscalationPatterns: publicProcedure
    .input(z.object({
      limit: z.number().optional().default(50),
      offset: z.number().optional().default(0),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      try {
        const patterns = await getEscalationPatterns({
          limit: input.limit,
          offset: input.offset,
          startDate: input.startDate ? new Date(input.startDate) : undefined,
          endDate: input.endDate ? new Date(input.endDate) : undefined,
        });
        return { success: true, patterns };
      } catch (error) {
        console.error('[AIBot] Failed to get escalation patterns:', error);
        return { success: false, patterns: [] };
      }
    }),

  getEscalationStats: publicProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      try {
        const stats = await getEscalationPatternStats(
          input.startDate ? new Date(input.startDate) : undefined,
          input.endDate ? new Date(input.endDate) : undefined,
        );
        return { success: true, stats };
      } catch (error) {
        console.error('[AIBot] Failed to get escalation stats:', error);
        return { success: true, stats: { total: 0, byIntent: {}, byReason: {}, resolvedCount: 0 } };
      }
    }),

  transcribeVoiceMessage: publicProcedure
    .input(z.object({ audioUrl: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const { transcribeAudio } = await import("../_core/voiceTranscription");
        const result = await transcribeAudio({ audioUrl: input.audioUrl, language: "en" });
        const text = (result as any)?.text || (result as any)?.content || "";
        return { success: true, text };
      } catch (error) {
        console.error("[AIBot] Voice transcription failed:", error);
        return { success: false, text: "" };
      }
    }),

  uploadFileForReview: publicProcedure
    .input(z.object({ fileName: z.string(), fileSize: z.number(), mimeType: z.string(), sessionId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        if (input.fileSize > 5 * 1024 * 1024) {
          return { success: false, error: "File size exceeds 5MB limit" };
        }
        const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
        if (!allowedTypes.includes(input.mimeType)) {
          return { success: false, error: "File type not supported" };
        }
        const fileId = nanoid();
        await saveChatMessage({
          sessionId: input.sessionId,
          role: "user",
          message: `📎 Uploaded file: ${input.fileName}`,
          metadata: JSON.stringify({ type: "file_upload", fileId, fileName: input.fileName, mimeType: input.mimeType, fileSize: input.fileSize }),
        });
        return { success: true, fileId };
      } catch (error) {
        console.error("[AIBot] File upload failed:", error);
        return { success: false, error: "Failed to upload file" };
      }
    }),

  // ── Admin Aria Monitoring Procedures ─────────────────────────────────────────

  getAriaSessions: publicProcedure
    .input(z.object({
      status: z.enum(["active", "escalated", "closed", "all"]).default("all"),
      limit: z.number().min(1).max(200).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input, ctx }) => {
      // Verify admin access via OAuth or custom admin JWT
      const req = (ctx as unknown as { req: Request }).req;
      let isAdmin = ctx.user?.role === 'admin';
      if (!isAdmin && req) {
        const admin = await getAdminFromRequest(req);
        if (admin) isAdmin = true;
      }
      if (!isAdmin) {
        return { sessions: [], total: 0 };
      }

      const db = await getDb();
      if (!db) return { sessions: [], total: 0 };

      try {
        // Get total count
        const countCondition = input.status !== "all" 
          ? eq(chatSessions.status, input.status) 
          : undefined;
        const countResult = await db
          .select({ cnt: sql<number>`count(*)` })
          .from(chatSessions)
          .where(countCondition);
        const total = Number(countResult[0]?.cnt || 0);

        // Get sessions with last message preview
        let sessionsQuery = db
          .select()
          .from(chatSessions)
          .orderBy(desc(chatSessions.updatedAt))
          .limit(input.limit)
          .offset(input.offset);

        if (input.status !== "all") {
          sessionsQuery = sessionsQuery.where(eq(chatSessions.status, input.status)) as any;
        }

        const sessions = await sessionsQuery;

        // Get last message for each session
        const sessionsWithPreview = await Promise.all(
          sessions.map(async (session) => {
            const lastMsg = await db
              .select()
              .from(chatMessages)
              .where(eq(chatMessages.sessionId, session.sessionId))
              .orderBy(desc(chatMessages.createdAt))
              .limit(1);
            return {
              ...session,
              lastMessage: lastMsg[0]?.message?.substring(0, 120) || null,
              lastMessageRole: lastMsg[0]?.role || null,
              lastMessageAt: lastMsg[0]?.createdAt || null,
            };
          })
        );

        return { sessions: sessionsWithPreview, total };
      } catch (error) {
        console.error('[AIBot Admin] Failed to get Aria sessions:', error);
        return { sessions: [], total: 0 };
      }
    }),

  getAriaSessionMessages: publicProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      // Verify admin access
      const req = (ctx as unknown as { req: Request }).req;
      let isAdmin = ctx.user?.role === 'admin';
      if (!isAdmin && req) {
        const admin = await getAdminFromRequest(req);
        if (admin) isAdmin = true;
      }
      if (!isAdmin) {
        return { messages: [], session: null };
      }

      const db = await getDb();
      if (!db) return { messages: [], session: null };

      try {
        const session = await getChatSession(input.sessionId);
        const messages = await db
          .select()
          .from(chatMessages)
          .where(eq(chatMessages.sessionId, input.sessionId))
          .orderBy(chatMessages.createdAt);

        return { messages, session };
      } catch (error) {
        console.error('[AIBot Admin] Failed to get session messages:', error);
        return { messages: [], session: null };
      }
    }),

  adminSendAriaMessage: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      message: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      // Verify admin access
      const req = (ctx as unknown as { req: Request }).req;
      let isAdmin = ctx.user?.role === 'admin';
      let adminEmail = ctx.user?.email || 'admin';
      if (!isAdmin && req) {
        const admin = await getAdminFromRequest(req);
        if (admin) {
          isAdmin = true;
          adminEmail = admin.email;
        }
      }
      if (!isAdmin) {
        return { success: false, error: 'Admin access required' };
      }

      const db = await getDb();
      if (!db) return { success: false, error: 'Database unavailable' };

      try {
        // Insert admin message as "assistant" role with metadata indicating admin takeover
        await saveChatMessage({
          sessionId: input.sessionId,
          role: "assistant",
          message: input.message,
          metadata: JSON.stringify({
            type: "admin_takeover",
            adminEmail,
            sentAt: new Date().toISOString(),
          }),
        });

        // Update session status to indicate admin is involved
        await updateChatSessionStatus(input.sessionId, "active");

        // Increment message count
        await db
          .update(chatSessions)
          .set({ messageCount: sql`${chatSessions.messageCount} + 1` })
          .where(eq(chatSessions.sessionId, input.sessionId));

        return { success: true };
      } catch (error) {
        console.error('[AIBot Admin] Failed to send admin message:', error);
        return { success: false, error: 'Failed to send message' };
      }
    }),
});
