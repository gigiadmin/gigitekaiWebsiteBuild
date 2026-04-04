import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { notifyOwner } from "../_core/notification";
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
      name: z.string(),
      email: z.string().email(),
      company: z.string().optional(),
      interest: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { sessionId, name, email, company, interest } = input;

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
        company,
        interest,
        conversationSummary,
      });

      // Send notification to owner about new lead
      try {
        await notifyOwner({
          title: `New Lead from Chat: ${name}`,
          content: `Email: ${email}\nCompany: ${company || "Not provided"}\nInterest: ${interest || "Not specified"}\n\nConversation Summary:\n${conversationSummary}`,
        });
      } catch (error) {
        console.error("[AIBot] Failed to send lead notification:", error);
      }

      return { success: true, message: "Thank you! We'll follow up with you shortly." };
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
