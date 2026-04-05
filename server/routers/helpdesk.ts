import { z } from "zod";
import { approvedProcedure, adminProcedure, router } from "../_core/trpc";
import { createTicket, getTicketsByUserId, getTicketById, updateTicketStatus, addTicketReply, getTicketReplies, getAllTickets } from "../db";
import { notifyOwner } from "../_core/notification";

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
        await updateTicketStatus(input.ticketId, input.status);
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
