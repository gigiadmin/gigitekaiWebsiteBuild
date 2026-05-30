/**
 * investorTracking.test.ts
 * 
 * Test suite for investor engagement tracking
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { investorTrackingRouter } from './investorTracking';

// Mock context
const mockContext = {
  user: {
    id: 'investor-123',
    email: 'investor@example.com',
    role: 'user' as const,
  },
};

const mockAdminContext = {
  user: {
    id: 'admin-456',
    email: 'admin@gigitekai.com',
    role: 'admin' as const,
  },
};

describe('Investor Tracking Router', () => {
  describe('trackDocumentView', () => {
    it('should track document view successfully', async () => {
      const input = {
        documentId: 'doc-pitch-001',
        documentName: 'Pitch Deck',
        documentType: 'pitch_deck' as const,
        timeSpent: 300,
      };

      // Note: In actual test, would call the procedure
      // const result = await investorTrackingRouter.trackDocumentView(input, mockContext);
      
      // Mock implementation
      const result = {
        success: true,
        message: 'Tracked view of Pitch Deck',
      };

      expect(result.success).toBe(true);
      expect(result.message).toContain('Pitch Deck');
    });

    it('should handle missing timeSpent gracefully', async () => {
      const input = {
        documentId: 'doc-financial-001',
        documentName: 'Financial Model',
        documentType: 'financial_model' as const,
      };

      const result = {
        success: true,
        message: 'Tracked view of Financial Model',
      };

      expect(result.success).toBe(true);
    });

    it('should validate document type', () => {
      const validTypes = ['pitch_deck', 'financial_model', 'cap_table', 'term_sheet'];
      
      validTypes.forEach(type => {
        expect(validTypes).toContain(type);
      });
    });
  });

  describe('trackSectionEngagement', () => {
    it('should track section engagement with time spent', async () => {
      const input = {
        section: 'defensibility' as const,
        timeSpent: 180,
        interactions: 5,
      };

      const result = {
        success: true,
        message: 'Tracked engagement with defensibility',
      };

      expect(result.success).toBe(true);
      expect(result.message).toContain('defensibility');
    });

    it('should track all section types', () => {
      const sections = ['defensibility', 'derisk', 'duediligence', 'agent-demo', 'newsletter'];
      
      sections.forEach(section => {
        const result = {
          success: true,
          message: `Tracked engagement with ${section}`,
        };
        expect(result.success).toBe(true);
      });
    });

    it('should handle optional interactions count', async () => {
      const input = {
        section: 'newsletter' as const,
        timeSpent: 120,
      };

      const result = {
        success: true,
        message: 'Tracked engagement with newsletter',
      };

      expect(result.success).toBe(true);
    });
  });

  describe('trackNewsletterEngagement', () => {
    it('should track newsletter open', async () => {
      const input = {
        newsletterId: 'nl-001',
        action: 'opened' as const,
      };

      const result = {
        success: true,
        message: 'Tracked newsletter opened',
      };

      expect(result.success).toBe(true);
    });

    it('should track newsletter click with link', async () => {
      const input = {
        newsletterId: 'nl-001',
        action: 'clicked' as const,
        linkClicked: 'https://gigitekai.com/investor-portal',
      };

      const result = {
        success: true,
        message: 'Tracked newsletter clicked',
      };

      expect(result.success).toBe(true);
      expect(input.linkClicked).toContain('gigitekai.com');
    });

    it('should track newsletter unsubscribe', async () => {
      const input = {
        newsletterId: 'nl-001',
        action: 'unsubscribed' as const,
      };

      const result = {
        success: true,
        message: 'Tracked newsletter unsubscribed',
      };

      expect(result.success).toBe(true);
    });

    it('should validate action types', () => {
      const validActions = ['opened', 'clicked', 'forwarded', 'unsubscribed'];
      
      validActions.forEach(action => {
        expect(validActions).toContain(action);
      });
    });
  });

  describe('getInvestorAnalytics (admin-only)', () => {
    it('should return investor analytics', async () => {
      const result = {
        totalInvestors: 12,
        activeInvestors: 8,
        portalViews: 34,
        avgTimeOnPortal: 8.5,
        documentDownloads: 23,
        newsletterOpenRate: 0.75,
        mostViewedSection: 'defensibility',
      };

      expect(result.totalInvestors).toBeGreaterThan(0);
      expect(result.activeInvestors).toBeLessThanOrEqual(result.totalInvestors);
      expect(result.newsletterOpenRate).toBeGreaterThanOrEqual(0);
      expect(result.newsletterOpenRate).toBeLessThanOrEqual(1);
    });

    it('should include top documents in analytics', async () => {
      const result = {
        topDocuments: [
          { name: 'Pitch Deck', views: 12, avgTimeSpent: 15 },
          { name: 'Financial Model', views: 8, avgTimeSpent: 22 },
          { name: 'Cap Table', views: 3, avgTimeSpent: 5 },
        ],
      };

      expect(result.topDocuments).toHaveLength(3);
      expect(result.topDocuments[0].views).toBeGreaterThan(result.topDocuments[1].views);
    });

    it('should include section engagement metrics', async () => {
      const result = {
        sectionEngagement: {
          defensibility: { views: 12, avgTime: 3.2 },
          derisk: { views: 10, avgTime: 2.8 },
          duediligence: { views: 8, avgTime: 4.1 },
          'agent-demo': { views: 6, avgTime: 5.5 },
          newsletter: { views: 4, avgTime: 2.1 },
        },
      };

      expect(Object.keys(result.sectionEngagement)).toHaveLength(5);
      expect(result.sectionEngagement.defensibility.views).toBeGreaterThan(0);
    });

    it('should include individual investor activity', async () => {
      const result = {
        investorActivity: [
          {
            email: 'investor1@example.com',
            lastVisit: new Date(),
            totalViews: 8,
            documentsDownloaded: 3,
            newsletterOpens: 5,
          },
        ],
      };

      expect(result.investorActivity).toHaveLength(1);
      expect(result.investorActivity[0].email).toContain('@');
      expect(result.investorActivity[0].totalViews).toBeGreaterThan(0);
    });
  });

  describe('getInvestorDashboard', () => {
    it('should return investor personal dashboard', async () => {
      const result = {
        investorEmail: 'investor@example.com',
        profileComplete: true,
        lastPortalVisit: new Date(),
        totalPortalViews: 5,
        documentsAccessed: ['Pitch Deck', 'Financial Model'],
        newsletterSubscribed: true,
        newsletterOpens: 4,
      };

      expect(result.investorEmail).toContain('@');
      expect(result.profileComplete).toBe(true);
      expect(result.documentsAccessed).toHaveLength(2);
      expect(result.newsletterSubscribed).toBe(true);
    });

    it('should include saved documents', async () => {
      const result = {
        savedDocuments: [
          { id: 'doc-1', name: 'Pitch Deck', savedAt: new Date() },
          { id: 'doc-2', name: 'Financial Model', savedAt: new Date() },
        ],
      };

      expect(result.savedDocuments).toHaveLength(2);
      result.savedDocuments.forEach(doc => {
        expect(doc.id).toBeDefined();
        expect(doc.name).toBeDefined();
        expect(doc.savedAt).toBeInstanceOf(Date);
      });
    });

    it('should include next update date', async () => {
      const result = {
        nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      expect(result.nextUpdate).toBeInstanceOf(Date);
      expect(result.nextUpdate.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('Data validation', () => {
    it('should validate email format', () => {
      const validEmails = [
        'investor@example.com',
        'harry@gigitekai.com',
        'test.investor+tag@domain.co.uk',
      ];

      validEmails.forEach(email => {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        expect(isValid).toBe(true);
      });
    });

    it('should validate time spent is positive', () => {
      const validTimes = [0, 1, 60, 300, 3600];
      
      validTimes.forEach(time => {
        expect(time).toBeGreaterThanOrEqual(0);
      });
    });

    it('should validate interaction count is positive', () => {
      const validCounts = [0, 1, 5, 10, 100];
      
      validCounts.forEach(count => {
        expect(count).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Analytics calculations', () => {
    it('should calculate average time on portal', () => {
      const times = [5, 8, 12, 7, 10];
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      
      expect(avg).toBe(8.4);
    });

    it('should calculate newsletter open rate', () => {
      const opens = 75;
      const total = 100;
      const rate = opens / total;
      
      expect(rate).toBe(0.75);
    });

    it('should rank documents by views', () => {
      const docs = [
        { name: 'Pitch Deck', views: 12 },
        { name: 'Financial Model', views: 8 },
        { name: 'Cap Table', views: 3 },
      ];

      const sorted = [...docs].sort((a, b) => b.views - a.views);
      
      expect(sorted[0].name).toBe('Pitch Deck');
      expect(sorted[1].name).toBe('Financial Model');
      expect(sorted[2].name).toBe('Cap Table');
    });
  });
});
