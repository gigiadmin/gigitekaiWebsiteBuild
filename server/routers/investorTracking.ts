/**
 * investorTracking.ts
 * 
 * Investor engagement tracking and analytics
 * - Document view tracking
 * - Time spent on portal sections
 * - Newsletter engagement (opens, clicks)
 * - Investor analytics dashboard
 */

import { router, protectedProcedure, adminProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { eq, desc, and, gte } from 'drizzle-orm';

// Schema for investor tracking
export const investorTrackingRouter = router({
  // Track document view
  trackDocumentView: protectedProcedure
    .input(z.object({
      documentId: z.string(),
      documentName: z.string(),
      documentType: z.enum(['pitch_deck', 'financial_model', 'cap_table', 'term_sheet']),
      timeSpent: z.number().optional(), // in seconds
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Log document view
        const view = {
          investorId: ctx.user.id,
          investorEmail: ctx.user.email,
          documentId: input.documentId,
          documentName: input.documentName,
          documentType: input.documentType,
          timeSpent: input.timeSpent || 0,
          viewedAt: new Date(),
        };

        // In production, save to database
        console.log('[Investor Tracking] Document view:', view);

        return {
          success: true,
          message: `Tracked view of ${input.documentName}`,
        };
      } catch (error) {
        console.error('[Investor Tracking] Error tracking document view:', error);
        throw error;
      }
    }),

  // Track section engagement
  trackSectionEngagement: protectedProcedure
    .input(z.object({
      section: z.enum(['defensibility', 'derisk', 'duediligence', 'agent-demo', 'newsletter']),
      timeSpent: z.number(), // in seconds
      interactions: z.number().optional(), // number of clicks/interactions
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const engagement = {
          investorId: ctx.user.id,
          investorEmail: ctx.user.email,
          section: input.section,
          timeSpent: input.timeSpent,
          interactions: input.interactions || 0,
          engagedAt: new Date(),
        };

        console.log('[Investor Tracking] Section engagement:', engagement);

        return {
          success: true,
          message: `Tracked engagement with ${input.section}`,
        };
      } catch (error) {
        console.error('[Investor Tracking] Error tracking engagement:', error);
        throw error;
      }
    }),

  // Track newsletter engagement
  trackNewsletterEngagement: protectedProcedure
    .input(z.object({
      newsletterId: z.string(),
      action: z.enum(['opened', 'clicked', 'forwarded', 'unsubscribed']),
      linkClicked: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const engagement = {
          investorId: ctx.user.id,
          investorEmail: ctx.user.email,
          newsletterId: input.newsletterId,
          action: input.action,
          linkClicked: input.linkClicked,
          engagedAt: new Date(),
        };

        console.log('[Investor Tracking] Newsletter engagement:', engagement);

        return {
          success: true,
          message: `Tracked newsletter ${input.action}`,
        };
      } catch (error) {
        console.error('[Investor Tracking] Error tracking newsletter engagement:', error);
        throw error;
      }
    }),

  // Get investor analytics (admin only)
  getInvestorAnalytics: adminProcedure
    .input(z.object({
      investorEmail: z.string().optional(),
      daysBack: z.number().default(30),
    }))
    .query(async ({ input }) => {
      try {
        // In production, query from database
        // For now, return mock data
        const mockAnalytics = {
          totalInvestors: 12,
          activeInvestors: 8,
          portalViews: 34,
          avgTimeOnPortal: 8.5, // minutes
          documentDownloads: 23,
          newsletterOpenRate: 0.75,
          mostViewedSection: 'defensibility',
          topDocuments: [
            { name: 'Pitch Deck', views: 12, avgTimeSpent: 15 },
            { name: 'Financial Model', views: 8, avgTimeSpent: 22 },
            { name: 'Cap Table', views: 3, avgTimeSpent: 5 },
          ],
          sectionEngagement: {
            defensibility: { views: 12, avgTime: 3.2 },
            derisk: { views: 10, avgTime: 2.8 },
            duediligence: { views: 8, avgTime: 4.1 },
            'agent-demo': { views: 6, avgTime: 5.5 },
            newsletter: { views: 4, avgTime: 2.1 },
          },
          investorActivity: [
            {
              email: 'investor1@example.com',
              lastVisit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
              totalViews: 8,
              documentsDownloaded: 3,
              newsletterOpens: 5,
            },
            {
              email: 'investor2@example.com',
              lastVisit: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
              totalViews: 5,
              documentsDownloaded: 2,
              newsletterOpens: 3,
            },
          ],
        };

        return mockAnalytics;
      } catch (error) {
        console.error('[Investor Tracking] Error fetching analytics:', error);
        throw error;
      }
    }),

  // Get investor dashboard summary
  getInvestorDashboard: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        // Return investor's personal dashboard
        const dashboard = {
          investorEmail: ctx.user.email,
          profileComplete: true,
          lastPortalVisit: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          totalPortalViews: 5,
          documentsAccessed: ['Pitch Deck', 'Financial Model'],
          newsletterSubscribed: true,
          newsletterOpens: 4,
          nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          savedDocuments: [
            { id: 'doc-1', name: 'Pitch Deck', savedAt: new Date() },
            { id: 'doc-2', name: 'Financial Model', savedAt: new Date() },
          ],
        };

        return dashboard;
      } catch (error) {
        console.error('[Investor Tracking] Error fetching dashboard:', error);
        throw error;
      }
    }),
});

export default investorTrackingRouter;
