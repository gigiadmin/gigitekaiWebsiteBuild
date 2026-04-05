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
  createTicket
} from "../db";
import { nanoid } from "nanoid";

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
          <p style="color:#64748b;font-size:11px;margin:4px 0 0;">GigitekAI &bull; Cloud & AI Solutions &bull; support@gigitek.com &bull; 609-676-4483</p>
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
  const footer = `\n${"-".repeat(50)}\nThis transcript was saved from gigitekai.com\nGigitekAI • Cloud & AI Solutions • support@gigitek.com • 609-676-4483`;
  return header + body + footer;
}

// System prompt for the AI bot
const SYSTEM_PROMPT = `You are GigitekAI's professional support agent. You specialize in Microsoft 365 services (Exchange Online, SharePoint, OneDrive, Teams, Entra ID), managed IT services, and cloud infrastructure solutions.

Your guidelines:
1. Be professional, friendly, and technical - adjust your language based on the user's expertise level
2. Provide clear, actionable steps and next actions
3. For complex issues, security concerns, or tenant-specific problems, recommend escalation to human support
4. If you cannot confidently answer after 1-2 clarification attempts, suggest escalation
5. When users explicitly ask for a human, immediately offer to escalate
6. Maintain a calm, confident tone appropriate for business clients
7. Avoid humor in sensitive contexts (outages, security incidents)

Available topics: Microsoft 365, Managed IT Services, Cloud Infrastructure, Pricing, Onboarding, Sales & Pre-sales

If you don't know the answer, say: "I'm not certain about that. Let me connect you with our specialist team who can provide accurate guidance."`;

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
      await saveChatMessage({
        sessionId,
        role: "user",
        message,
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

        // Check if escalation is needed
        const shouldEscalate = 
          assistantMessage.toLowerCase().includes("escalat") ||
          assistantMessage.toLowerCase().includes("specialist") ||
          assistantMessage.toLowerCase().includes("human");

        // Save assistant message
        await saveChatMessage({
          sessionId,
          role: "assistant",
          message: assistantMessage,
          metadata: JSON.stringify({
            confidence: relevantDocs.length > 0 ? 0.8 : 0.5,
            sources: relevantDocs.map(d => d.id),
            shouldEscalate,
          }),
        });

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
      <p style="margin: 4px 0 0;">support@gigitek.com • 609-676-4483</p>
      <p style="margin: 8px 0 0; font-size: 11px;"><a href="https://gigitekai.com/unsubscribe?email=${encodeURIComponent(email)}" style="color: #999; text-decoration: none;">Unsubscribe from lead follow-ups</a></p>
    </div>
  </div>
</body>
</html>
        `;

        const emailSent = await sendEmail({
          to: "support@gigitek.com",
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
});
