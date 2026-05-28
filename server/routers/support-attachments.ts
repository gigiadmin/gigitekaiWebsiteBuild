import { z } from "zod";
import { publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { tickets } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// File upload handler for support tickets
export const attachmentRouter = {
  // Generate upload URL for file attachment
  generateUploadUrl: publicProcedure
    .input(
      z.object({
        ticketId: z.number(),
        email: z.string().email(),
        fileName: z.string(),
        fileSize: z.number(),
        fileType: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Validate file size (max 10MB)
      if (input.fileSize > 10 * 1024 * 1024) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "File size exceeds 10MB limit",
        });
      }

      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "application/pdf",
        "text/plain",
      ];
      if (!allowedTypes.includes(input.fileType)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "File type not allowed",
        });
      }

      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Verify ticket belongs to this email
      const ticket = await db
        .select()
        .from(tickets)
        .where(eq(tickets.id, input.ticketId))
        .limit(1);

      if (!ticket.length || ticket[0].requesterEmail !== input.email) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Ticket not found or access denied",
        });
      }

      // Generate unique file key for S3
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(7);
      const fileKey = `support-attachments/${input.ticketId}/${timestamp}-${randomSuffix}-${input.fileName}`;

      return {
        success: true,
        fileKey,
        message: "Upload URL generated successfully",
      };
    }),
};
