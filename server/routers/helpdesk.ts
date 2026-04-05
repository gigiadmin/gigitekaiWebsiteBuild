import { z } from "zod";
import { approvedProcedure, adminProcedure, router } from "../_core/trpc";
import { createTicket, getTicketsByUserId, getTicketById, updateTicketStatus, addTicketReply, getTicketReplies, getAllTickets } from "../db";
import { notifyOwner } from "../_core/notification";
import { sendEmail } from "../_core/email";

export const helpdeskRouter = router({
  // Create a new ticket (requires approved user)
  createTicket: approvedProcedure
    .input(
      z.object({
        title: z.string().min(5, "Title must be at least 5 characters"),
        description: z.string().min(10, "Description must be at least 10 characters"),
        priority: z.enum(["low", "medium", "high", "critical"]),
        category: z.enum(["bug_report", "feature_request", "general_support", "billing"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const ticket = await createTicket({
          userId: ctx.user.id,
          title: input.title,
          description: input.description,
          priority: input.priority,
          category: input.category,
          status: "open",
        });

        // Send notification to owner
        await notifyOwner({
          title: `New Help Desk Ticket: ${input.title}`,
          content: `From: ${ctx.user.name} (${ctx.user.email})\n\nCategory: ${input.category}\nPriority: ${input.priority}\n\n${input.description}`,
        });

        return { success: true, ticketId: ticket };
      } catch (error) {
        console.error("Failed to create ticket:", error);
        throw error;
      }
    }),

  // Get user's tickets (requires approved user)
  getMyTickets: approvedProcedure.query(async ({ ctx }) => {
    try {
      const userTickets = await getTicketsByUserId(ctx.user.id);
      return userTickets;
    } catch (error) {
      console.error("Failed to get user tickets:", error);
      throw error;
    }
  }),

  // Get ticket details (requires approved user)
  getTicket: approvedProcedure
    .input(z.object({ ticketId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const ticket = await getTicketById(input.ticketId);
        if (!ticket) {
          throw new Error("Ticket not found");
        }

        // Check authorization - user can only see their own tickets unless they're admin
        if (ticket.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new Error("Unauthorized");
        }

        const replies = await getTicketReplies(input.ticketId);
        return { ticket, replies };
      } catch (error) {
        console.error("Failed to get ticket:", error);
        throw error;
      }
    }),

  // Add reply to ticket (requires approved user)
  addReply: approvedProcedure
    .input(
      z.object({
        ticketId: z.number(),
        message: z.string().min(1, "Message cannot be empty"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const ticket = await getTicketById(input.ticketId);
        if (!ticket) {
          throw new Error("Ticket not found");
        }

        // Check authorization
        if (ticket.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new Error("Unauthorized");
        }

        const isStaffReply = ctx.user.role === "admin" ? 1 : 0;
        await addTicketReply({
          ticketId: input.ticketId,
          userId: ctx.user.id,
          message: input.message,
          isStaffReply,
        });

        // Send notification to owner if customer replied
        if (isStaffReply === 0) {
          await notifyOwner({
            title: `New Reply on Ticket #${input.ticketId}`,
            content: `${ctx.user.name} replied:\n\n${input.message}`,
          });
        }

        return { success: true };
      } catch (error) {
        console.error("Failed to add reply:", error);
        throw error;
      }
    }),

  // Update ticket status (admin only)
  updateStatus: adminProcedure
    .input(
      z.object({
        ticketId: z.number(),
        status: z.enum(["open", "in_progress", "resolved", "closed"]),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Get ticket details before updating
        const ticket = await getTicketById(input.ticketId);
        if (!ticket) {
          throw new Error("Ticket not found");
        }

        // Update ticket status
        await updateTicketStatus(input.ticketId, input.status);

        // Send email notification to customer
        try {
          const { users } = await import("../../drizzle/schema");
          const { eq } = await import("drizzle-orm");
          const db = await import("../db").then(m => m.getDb());
          
          if (db) {
            const userResult = await db.select().from(users).where(eq(users.id, ticket.userId)).limit(1);
            const user = userResult.length > 0 ? userResult[0] : null;

            if (user && user.email) {
              const statusLabel = input.status.charAt(0).toUpperCase() + input.status.slice(1).replace(/_/g, " ");
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
    .ticket-info { background: #f9f9f9; border-left: 4px solid #00D4FF; padding: 16px; border-radius: 4px; margin-bottom: 20px; }
    .ticket-info p { margin: 8px 0; color: #555; }
    .status-badge { display: inline-block; background: #00D4FF; color: #0A0E1A; padding: 8px 16px; border-radius: 4px; font-weight: 600; margin-top: 12px; }
    .footer { background: #f5f5f5; padding: 16px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #e0e0e0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Ticket Status Update</h2>
    </div>
    <div class="content">
      <p>Hi ${user.name || "there"},</p>
      <p>Your support ticket has been updated. Here are the details:</p>
      <div class="ticket-info">
        <p><strong>Ticket #${ticket.id}</strong></p>
        <p><strong>Title:</strong> ${ticket.title}</p>
        <p><strong>Previous Status:</strong> ${ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1).replace(/_/g, " ")}</p>
        <p><strong>New Status:</strong> <span class="status-badge">${statusLabel}</span></p>
      </div>
      <p>If you have any questions or need further assistance, please don't hesitate to reply to this email or visit our support center.</p>
      <p>Thank you for your patience!</p>
    </div>
    <div class="footer">
      <p style="margin: 0;">GigitekAI • Cloud & AI Solutions</p>
      <p style="margin: 4px 0 0;">support@gigitek.com • 609-676-4483</p>
    </div>
  </div>
</body>
</html>
              `;

              await sendEmail({
                to: user.email,
                subject: `Ticket #${ticket.id} Status Update: ${statusLabel}`,
                html: emailBody,
              });
            }
          }
        } catch (emailError) {
          console.warn("[Helpdesk] Failed to send ticket status email:", emailError);
        }

        return { success: true };
      } catch (error) {
        console.error("Failed to update ticket status:", error);
        throw error;
      }
    }),

  // Get all tickets (admin only)
  getAllTickets: adminProcedure.query(async () => {
    try {
      const allTickets = await getAllTickets();
      return allTickets;
    } catch (error) {
      console.error("Failed to get all tickets:", error);
      throw error;
    }
  }),
});
