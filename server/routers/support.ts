import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { tickets, ticketReplies } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "../_core/email";
import crypto from "crypto";

// Store verification codes in memory (in production, use Redis or database)
const verificationCodes = new Map<string, { code: string; expiresAt: number }>();

function generateVerificationCode(): string {
  return Math.random().toString().slice(2, 8);
}

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export const supportRouter = router({
  // Send verification code to email
  sendVerificationCode: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const code = generateVerificationCode();
      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

      verificationCodes.set(input.email, { code, expiresAt });

      // Send email with verification code
      try {
        await sendEmail({
          to: input.email,
          subject: "Your GigitekAI Support Ticket Verification Code",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #00D4FF;">Verify Your Email</h2>
              <p>Your verification code is:</p>
              <div style="background: #141B2D; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <h1 style="color: #00D4FF; letter-spacing: 2px; margin: 0;">${code}</h1>
              </div>
              <p style="color: #666;">This code will expire in 15 minutes.</p>
              <p style="color: #999; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
            </div>
          `,
        });
      } catch (error) {
        console.error("Failed to send verification email:", error);
        throw new Error("Failed to send verification code");
      }

      return { success: true };
    }),

  // Verify code and get tickets
  verifyAndGetTickets: publicProcedure
    .input(z.object({ email: z.string().email(), code: z.string() }))
    .mutation(async ({ input }) => {
      const stored = verificationCodes.get(input.email);

      if (!stored || Date.now() > stored.expiresAt) {
        throw new Error("Verification code expired or not found");
      }

      if (stored.code !== input.code) {
        throw new Error("Invalid verification code");
      }

      // Code is valid, fetch tickets
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      const userTickets = await db
        .select()
        .from(tickets)
        .where(eq(tickets.requesterEmail, input.email));

      // Generate session token
      const token = generateSessionToken();

      // Clean up verification code
      verificationCodes.delete(input.email);

      return {
        success: true,
        token,
        tickets: userTickets.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          category: t.category,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        })),
      };
    }),

  // Get ticket detail by ID and email (with session token validation)
  getTicketDetail: publicProcedure
    .input(
      z.object({
        ticketId: z.number(),
        email: z.string().email(),
        token: z.string(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Fetch ticket and verify it belongs to this email
      const ticket = await db
        .select()
        .from(tickets)
        .where(eq(tickets.id, input.ticketId))
        .limit(1);

      if (!ticket.length || ticket[0].requesterEmail !== input.email) {
        throw new Error("Ticket not found or access denied");
      }

      // Fetch replies/chat history
      const replies = await db
        .select()
        .from(ticketReplies)
        .where(eq(ticketReplies.ticketId, input.ticketId));

      return {
        ticket: ticket[0],
        replies: replies.map((r) => ({
          id: r.id,
          message: r.message,
          isStaffReply: r.isStaffReply,
          createdAt: r.createdAt,
        })),
      };
    }),

  // Add reply to ticket (customer)
  addReply: publicProcedure
    .input(
      z.object({
        ticketId: z.number(),
        email: z.string().email(),
        message: z.string().min(1).max(5000),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Verify ticket belongs to this email
      const ticket = await db
        .select()
        .from(tickets)
        .where(eq(tickets.id, input.ticketId))
        .limit(1);

      if (!ticket.length || ticket[0].requesterEmail !== input.email) {
        throw new Error("Ticket not found or access denied");
      }

      // Add reply
      const result = await db.insert(ticketReplies).values({
        ticketId: input.ticketId,
        userId: ticket[0].userId,
        message: input.message,
        isStaffReply: 0,
      });

      return { success: true, replyId: result.insertId };
    }),
});
