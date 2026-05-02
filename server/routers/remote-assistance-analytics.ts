/**
 * Remote Assistance Analytics Router
 * Provides session metrics, performance data, and insights
 */

import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { eq, gte, and } from 'drizzle-orm';

// Mock schema tables for now - will be replaced with actual schema
const remoteAssistanceSessions = {} as any;
const remoteAssistanceParticipants = {} as any;

export const remoteAssistanceAnalyticsRouter = router({
  /**
   * Get analytics data for a time range
   */
  getAnalytics: protectedProcedure
    .input(
      z.object({
        timeRange: z.enum(['24h', '7d', '30d']),
      })
    )
    .query(async ({ input, ctx }: any) => {
      const now = new Date();
      let startDate = new Date();

      switch (input.timeRange) {
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      // Fetch sessions in time range
      const db = await getDb() as any;
      const sessions = await db
        .select()
        .from(remoteAssistanceSessions)
        .where(gte(remoteAssistanceSessions.createdAt, startDate));

      // Calculate aggregated metrics
      const totalSessions = sessions.length;
      const resolvedSessions = sessions.filter((s: any) => s.status === 'completed').length;
      const resolutionRate = totalSessions > 0 ? resolvedSessions / totalSessions : 0;

      const totalDuration = sessions.reduce((sum: number, s: any) => {
        if (s.endedAt && s.createdAt) {
          return sum + (s.endedAt.getTime() - s.createdAt.getTime()) / (1000 * 60);
        }
        return sum;
      }, 0);
      const averageDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;

      const totalQuality = sessions.reduce((sum: number, s: any) => sum + (s.connectionQuality || 0), 0);
      const averageQuality = totalSessions > 0 ? totalQuality / totalSessions : 0;

      // Get active sessions
      const activeSessions = sessions.filter((s: any) => s.status === 'active');
      const activeNow = activeSessions.length;

      // Get technician performance
      const technicianMap = new Map<any, any>();

      for (const session of sessions) {
        if (!(session as any).technicianId) continue;

        const tech = technicianMap.get((session as any).technicianId) || {
          name: session.technicianId.toString(), // Would be replaced with actual name from DB
          sessions: 0,
          resolved: 0,
          totalDuration: 0,
        };

        tech.sessions++;
        if ((session as any).status === 'completed') tech.resolved++;
        if ((session as any).endedAt && (session as any).createdAt) {
          tech.totalDuration += ((session as any).endedAt.getTime() - (session as any).createdAt.getTime()) / (1000 * 60);
        }

        technicianMap.set((session as any).technicianId, tech);
      }

      const technicians = Array.from(technicianMap.values()).map((tech: any) => ({
        name: tech.name,
        sessions: tech.sessions,
        resolutionRate: tech.sessions > 0 ? tech.resolved / tech.sessions : 0,
        avgDuration: tech.sessions > 0 ? tech.totalDuration / tech.sessions : 0,
      }));

      // Format session data for charts
      const formattedSessions = sessions.map((s: any) => ({
        sessionId: s.id,
        duration: s.endedAt && s.createdAt ? (s.endedAt.getTime() - s.createdAt.getTime()) / (1000 * 60) : 0,
        resolution: s.status === 'completed',
        technician: s.technicianId?.toString() || 'Unknown',
        client: s.clientId?.toString() || 'Unknown',
        sessionType: s.sessionType || 'unknown',
        timestamp: s.createdAt || new Date(),
        quality: s.connectionQuality || 0,
      }));

      return {
        sessions: formattedSessions,
        aggregated: {
          totalSessions,
          averageDuration: Math.round(averageDuration),
          resolutionRate,
          averageQuality: Math.round(averageQuality),
          activeNow,
          technicians,
        },
      };
    }),

  /**
   * Get detailed session statistics
   */
  getSessionStats: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .query(async ({ input }: any) => {
      const db = await getDb() as any;
      const session = await db
        .select()
        .from(remoteAssistanceSessions)
        .where(eq(remoteAssistanceSessions.id, input.sessionId))
        .then((rows: any) => rows[0]);

      if (!session) {
        throw new Error('Session not found');
      }

      const participants = await db
        .select()
        .from(remoteAssistanceParticipants)
        .where(eq(remoteAssistanceParticipants.sessionId, input.sessionId));

      const duration = session.endedAt && session.createdAt
        ? (session.endedAt.getTime() - session.createdAt.getTime()) / (1000 * 60)
        : 0;

      return {
        sessionId: session.id,
        status: session.status,
        type: session.sessionType,
        duration: Math.round(duration),
        quality: session.connectionQuality || 0,
        startTime: session.createdAt,
        endTime: session.endedAt,
        participants: participants.map((p: any) => ({
          userId: p.userId,
          role: p.role,
          joinedAt: p.joinedAt,
          leftAt: p.leftAt,
        })),
        recordingEnabled: session.recordingEnabled || false,
        notes: session.notes || '',
      };
    }),

  /**
   * Get technician performance metrics
   */
  getTechnicianMetrics: protectedProcedure
    .input(
      z.object({
        technicianId: z.number(),
        timeRange: z.enum(['24h', '7d', '30d']),
      })
    )
    .query(async ({ input }: any) => {
      const now = new Date();
      let startDate = new Date();

      switch (input.timeRange) {
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      const db = await getDb() as any;
      const sessions = await db
        .select()
        .from(remoteAssistanceSessions)
        .where(
          and(
            eq(remoteAssistanceSessions.technicianId, input.technicianId),
            gte(remoteAssistanceSessions.createdAt, startDate)
          )
        );

      const totalSessions = sessions.length;
      const resolvedSessions = sessions.filter((s: any) => s.status === 'completed').length;
      const totalDuration = sessions.reduce((sum: number, s: any) => {
        if (s.endedAt && s.createdAt) {
          return sum + (s.endedAt.getTime() - s.createdAt.getTime()) / (1000 * 60);
        }
        return sum;
      }, 0);

      const avgQuality = sessions.length > 0
        ? sessions.reduce((sum: number, s: any) => sum + (s.connectionQuality || 0), 0) / sessions.length
        : 0;

      return {
        technicianId: input.technicianId,
        totalSessions,
        resolvedSessions,
        resolutionRate: totalSessions > 0 ? resolvedSessions / totalSessions : 0,
        averageDuration: totalSessions > 0 ? totalDuration / totalSessions : 0,
        averageQuality: Math.round(avgQuality),
        totalDuration: Math.round(totalDuration),
      };
    }),

  /**
   * Get client satisfaction data
   */
  getClientSatisfaction: protectedProcedure
    .input(
      z.object({
        timeRange: z.enum(['24h', '7d', '30d']),
      })
    )
    .query(async ({ input }: any) => {
      const now = new Date();
      let startDate = new Date();

      switch (input.timeRange) {
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      const db = await getDb() as any;
      const sessions = await db
        .select()
        .from(remoteAssistanceSessions)
        .where(gte(remoteAssistanceSessions.createdAt, startDate));

      const satisfactionScores = sessions
        .filter((s: any) => s.clientSatisfactionScore !== null)
        .map((s: any) => s.clientSatisfactionScore || 0);

      const averageSatisfaction = satisfactionScores.length > 0
        ? satisfactionScores.reduce((a: number, b: number) => a + b, 0) / satisfactionScores.length
        : 0;

      const satisfactionBreakdown = {
        veryUnsatisfied: satisfactionScores.filter((s: number) => s <= 2).length,
        unsatisfied: satisfactionScores.filter((s: number) => s === 3).length,
        neutral: satisfactionScores.filter((s: number) => s === 4).length,
        satisfied: satisfactionScores.filter((s: number) => s === 5).length,
        verySatisfied: satisfactionScores.filter((s: number) => s >= 6).length,
      };

      return {
        averageSatisfaction: Math.round(averageSatisfaction * 10) / 10,
        totalResponses: satisfactionScores.length,
        breakdown: satisfactionBreakdown,
      };
    }),
});

export default remoteAssistanceAnalyticsRouter;
