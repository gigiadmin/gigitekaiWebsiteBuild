/**
 * Enterprise Remote Assistance System - Backend Router
 * Handles session management, WebRTC signaling, and real-time communication
 */

import { protectedProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import {
  remoteAssistanceSessions,
  sessionParticipants,
  sessionChatMessages,
  fileTransfers,
  remoteAssistanceAuditLog,
  sessionAnalytics,
  technicianAvailability,
  sessionPolicies,
} from '../../drizzle/remote-assistance-schema';
import { eq, and, gt, lt, desc, or } from 'drizzle-orm';
import { notifyOwner } from '../_core/notification';
import { invokeLLM } from '../_core/llm';
import crypto from 'crypto';

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate WebRTC session token
 */
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create audit log entry
 */
async function createAuditLog(
  db: any,
  sessionId: number,
  userId: number,
  eventType: string,
  details: any,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    await db.insert(remoteAssistanceAuditLog).values({
      sessionId,
      userId,
      eventType,
      details,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

/**
 * tRPC router for remote assistance
 */
export const remoteAssistanceRouter = router({
  /**
   * Initiate a new remote assistance session
   */
  initiateSession: protectedProcedure
    .input(
      z.object({
        clientUserId: z.number(),
        clientEmail: z.string().email(),
        sessionType: z.enum(['screen_share_only', 'remote_control', 'file_transfer', 'collaborative']),
        allowRemoteControl: z.boolean().optional().default(false),
        allowFileTransfer: z.boolean().optional().default(false),
        allowRecording: z.boolean().optional().default(false),
        ticketId: z.number().optional(),
        issueCategory: z.string().optional(),
        issueDescription: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      const sessionId = generateSessionId();
      const sessionToken = generateSessionToken();

      try {
        // Create session
        const result = await db.insert(remoteAssistanceSessions).values({
          sessionId,
          technicianId: ctx.user.id,
          clientUserId: input.clientUserId,
          clientEmail: input.clientEmail,
          sessionType: input.sessionType,
          allowRemoteControl: input.allowRemoteControl,
          allowFileTransfer: input.allowFileTransfer,
          allowRecording: input.allowRecording,
          ticketId: input.ticketId,
          issueCategory: input.issueCategory,
          issueDescription: input.issueDescription,
          status: 'pending',
        });

        // Add technician as participant
        const insertedId = (result as any).insertId || result[0];
        await db.insert(sessionParticipants).values({
          sessionId: insertedId as number,
          userId: ctx.user.id,
          role: 'technician',
          canControl: true,
          canTransferFiles: true,
          canChat: true,
        });

        // Create audit log
        await createAuditLog(
          db,
          insertedId as number,
          ctx.user.id,
          'session_created',
          { sessionType: input.sessionType, clientEmail: input.clientEmail },
          ctx.req?.ip,
          ctx.req?.headers['user-agent']
        );

        // Notify owner of new session
        await notifyOwner({
          title: 'New Remote Assistance Session Initiated',
          content: `Technician ${ctx.user.email} initiated a ${input.sessionType} session with ${input.clientEmail}. Session ID: ${sessionId}`,
        });

        return {
          success: true,
          sessionId,
          sessionToken,
          message: 'Remote assistance session created successfully',
        };
      } catch (error) {
        console.error('Failed to initiate session:', error);
        throw new Error('Failed to create remote assistance session');
      }
    }),

  /**
   * Accept a remote assistance session (client side)
   */
  acceptSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        sessionToken: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      try {
        // Find session
        const sessions = await db
          .select()
          .from(remoteAssistanceSessions)
          .where(eq(remoteAssistanceSessions.sessionId, input.sessionId));

        if (sessions.length === 0) {
          throw new Error('Session not found');
        }

        const session = sessions[0];

        // Verify client
        if (session.clientUserId !== ctx.user.id) {
          throw new Error('Unauthorized: You are not the client for this session');
        }

        // Update session status
        await db
          .update(remoteAssistanceSessions)
          .set({ status: 'active', startedAt: new Date() })
          .where(eq(remoteAssistanceSessions.id, session.id));

        // Add client as participant
        await db.insert(sessionParticipants).values({
          sessionId: session.id,
          userId: ctx.user.id,
          role: 'client',
          canControl: false,
          canTransferFiles: session.allowFileTransfer,
          canChat: true,
        });

        // Create audit log
        await createAuditLog(
          db,
          session.id,
          ctx.user.id,
          'session_started',
          { clientAccepted: true },
          ctx.req?.ip,
          ctx.req?.headers['user-agent']
        );

        return {
          success: true,
          message: 'Session accepted',
          sessionDetails: {
            sessionId: session.sessionId,
            allowRemoteControl: session.allowRemoteControl,
            allowFileTransfer: session.allowFileTransfer,
            allowRecording: session.allowRecording,
          },
        };
      } catch (error) {
        console.error('Failed to accept session:', error);
        throw new Error('Failed to accept remote assistance session');
      }
    }),

  /**
   * End a remote assistance session
   */
  endSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        resolutionNotes: z.string().optional(),
        issueResolved: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      try {
        // Find session
        const sessions = await db
          .select()
          .from(remoteAssistanceSessions)
          .where(eq(remoteAssistanceSessions.sessionId, input.sessionId));

        if (sessions.length === 0) {
          throw new Error('Session not found');
        }

        const session = sessions[0];
        const endTime = new Date();
        const duration = session.startedAt
          ? Math.floor((endTime.getTime() - session.startedAt.getTime()) / 1000)
          : 0;

        // Update session
        await db
          .update(remoteAssistanceSessions)
          .set({
            status: 'completed',
            endedAt: endTime,
            duration,
            resolutionNotes: input.resolutionNotes,
          })
          .where(eq(remoteAssistanceSessions.id, session.id));

        // Create analytics entry
        await db.insert(sessionAnalytics).values({
          sessionId: session.id,
          issueResolved: input.issueResolved || false,
          resolutionTime: duration,
        });

        // Create audit log
        await createAuditLog(
          db,
          session.id,
          ctx.user.id,
          'session_ended',
          { duration, issueResolved: input.issueResolved },
          ctx.req?.ip,
          ctx.req?.headers['user-agent']
        );

        return {
          success: true,
          message: 'Session ended successfully',
          sessionDuration: duration,
        };
      } catch (error) {
        console.error('Failed to end session:', error);
        throw new Error('Failed to end remote assistance session');
      }
    }),

  /**
   * Send chat message during session
   */
  sendChatMessage: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        message: z.string(),
        messageType: z.enum(['text', 'system', 'file_transfer', 'annotation']).optional().default('text'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      try {
        // Find session
        const sessions = await db
          .select()
          .from(remoteAssistanceSessions)
          .where(eq(remoteAssistanceSessions.sessionId, input.sessionId));

        if (sessions.length === 0) {
          throw new Error('Session not found');
        }

        const session = sessions[0];

        // Add chat message
        await db.insert(sessionChatMessages).values({
          sessionId: session.id,
          senderId: ctx.user.id,
          message: input.message,
          messageType: input.messageType,
        });

        return {
          success: true,
          message: 'Message sent',
        };
      } catch (error) {
        console.error('Failed to send chat message:', error);
        throw new Error('Failed to send chat message');
      }
    }),

  /**
   * Get session details
   */
  getSessionDetails: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      try {
        const sessions = await db
          .select()
          .from(remoteAssistanceSessions)
          .where(eq(remoteAssistanceSessions.sessionId, input.sessionId));

        if (sessions.length === 0) {
          throw new Error('Session not found');
        }

        const session = sessions[0];

        // Get participants
        const participants = await db
          .select()
          .from(sessionParticipants)
          .where(eq(sessionParticipants.sessionId, session.id));

        // Get chat messages
        const messages = await db
          .select()
          .from(sessionChatMessages)
          .where(eq(sessionChatMessages.sessionId, session.id));

        return {
          session,
          participants,
          messages,
        };
      } catch (error) {
        console.error('Failed to get session details:', error);
        throw new Error('Failed to retrieve session details');
      }
    }),

  /**
   * Get technician availability
   */
  getTechnicianAvailability: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    try {
      const availability = await db
        .select()
        .from(technicianAvailability)
        .where(eq(technicianAvailability.status, 'available'));

      return availability;
    } catch (error) {
      console.error('Failed to get technician availability:', error);
      throw new Error('Failed to retrieve technician availability');
    }
  }),

  /**
   * Update technician status
   */
  updateTechnicianStatus: protectedProcedure
    .input(
      z.object({
        status: z.enum(['available', 'busy', 'away', 'offline', 'on_break']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      try {
        // Find or create availability record
        const existing = await db
          .select()
          .from(technicianAvailability)
          .where(eq(technicianAvailability.technicianId, ctx.user.id));

        if (existing.length > 0) {
          await db
            .update(technicianAvailability)
            .set({ status: input.status, lastStatusChange: new Date() })
            .where(eq(technicianAvailability.technicianId, ctx.user.id));
        } else {
          await db.insert(technicianAvailability).values({
            technicianId: ctx.user.id,
            status: input.status,
          });
        }

        return {
          success: true,
          message: 'Status updated',
        };
      } catch (error) {
        console.error('Failed to update technician status:', error);
        throw new Error('Failed to update technician status');
      }
    }),

  /**
   * Get session history
   */
  getSessionHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional().default(20),
        offset: z.number().optional().default(0),
        status: z.enum(['pending', 'active', 'completed', 'cancelled']).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      try {
        const whereConditions = [eq(remoteAssistanceSessions.technicianId, ctx.user.id)];
        if (input.status) {
          whereConditions.push(eq(remoteAssistanceSessions.status, input.status));
        }

        const sessions = await db
          .select()
          .from(remoteAssistanceSessions)
          .where(and(...whereConditions))
          .orderBy(desc(remoteAssistanceSessions.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        return sessions;
      } catch (error) {
        console.error('Failed to get session history:', error);
        throw new Error('Failed to retrieve session history');
      }
    }),

  /**
   * Get session analytics
   */
  getSessionAnalytics: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      try {
        const sessions = await db
          .select()
          .from(remoteAssistanceSessions)
          .where(eq(remoteAssistanceSessions.sessionId, input.sessionId));

        if (sessions.length === 0) {
          throw new Error('Session not found');
        }

        const session = sessions[0];

        const analytics = await db
          .select()
          .from(sessionAnalytics)
          .where(eq(sessionAnalytics.sessionId, session.id));

        return analytics[0] || null;
      } catch (error) {
        console.error('Failed to get session analytics:', error);
        throw new Error('Failed to retrieve session analytics');
      }
    }),

  /**
   * Get audit log for session
   */
  getAuditLog: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      try {
        const sessions = await db
          .select()
          .from(remoteAssistanceSessions)
          .where(eq(remoteAssistanceSessions.sessionId, input.sessionId));

        if (sessions.length === 0) {
          throw new Error('Session not found');
        }

        const session = sessions[0];

        const auditLog = await db
          .select()
          .from(remoteAssistanceAuditLog)
          .where(eq(remoteAssistanceAuditLog.sessionId, session.id))
          .orderBy(desc(remoteAssistanceAuditLog.createdAt));

        return auditLog;
      } catch (error) {
        console.error('Failed to get audit log:', error);
        throw new Error('Failed to retrieve audit log');
      }
    }),
});
