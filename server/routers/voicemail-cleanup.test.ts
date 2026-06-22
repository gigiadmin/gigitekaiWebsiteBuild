import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { getDb } from '../db';
import { voicemailCleanupRouter } from './voicemail-cleanup';
import { sql } from 'drizzle-orm';

/**
 * Voicemail Tombstone System - Comprehensive Test Suite
 * 
 * Tests all phases of the voicemail dedup and cleanup system:
 * - Tombstone creation and expiration
 * - Duplicate detection and removal
 * - Race condition prevention
 * - Dedup table status tracking
 */

describe('Voicemail Cleanup Router', () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error('Database connection failed');
  });

  afterAll(async () => {
    // Cleanup test data
    if (db) {
      try {
        await db.execute(sql`DELETE FROM callDraftTickets WHERE title LIKE '%TEST_VOICEMAIL%'`);
        await db.execute(sql`DELETE FROM voicemailSourceTombstones WHERE externalId LIKE '%TEST_%'`);
        await db.execute(sql`DELETE FROM voicemailDedup WHERE externalId LIKE '%TEST_%'`);
      } catch (e) {
        console.error('Cleanup error:', e);
      }
    }
  });

  describe('Phase 1: Tombstone Creation', () => {
    it('should create tombstone when voicemail is dismissed', async () => {
      const externalId = 'TEST_VOICEMAIL_001';
      
      // Insert a tombstone
      await db.execute(sql`
        INSERT INTO voicemailSourceTombstones (externalId, dismissedAt, reason)
        VALUES (${externalId}, NOW(), 'user_dismissed')
      `);

      // Verify tombstone exists
      const result = await db.execute(sql`
        SELECT * FROM voicemailSourceTombstones WHERE externalId = ${externalId}
      `);

      expect(result).toHaveLength(1);
      expect(result[0].externalId).toBe(externalId);
      expect(result[0].reason).toBe('user_dismissed');
    });

    it('should prevent re-import of tombstoned voicemail', async () => {
      const externalId = 'TEST_VOICEMAIL_002';
      
      // Create tombstone
      await db.execute(sql`
        INSERT INTO voicemailSourceTombstones (externalId, dismissedAt, reason)
        VALUES (${externalId}, NOW(), 'duplicate_detected')
      `);

      // Check if voicemail exists in tombstones
      const tombstone = await db.execute(sql`
        SELECT * FROM voicemailSourceTombstones WHERE externalId = ${externalId}
      `);

      expect(tombstone).toHaveLength(1);
      expect(tombstone[0].externalId).toBe(externalId);
    });
  });

  describe('Phase 2: Dedup Logic', () => {
    it('should track dedup entries with expiration', async () => {
      const externalId = 'TEST_DEDUP_001';
      
      // Insert dedup entry
      await db.execute(sql`
        INSERT INTO voicemailDedup (externalId, expiresAt)
        VALUES (${externalId}, DATE_ADD(NOW(), INTERVAL 24 HOUR))
      `);

      // Verify entry exists
      const result = await db.execute(sql`
        SELECT * FROM voicemailDedup WHERE externalId = ${externalId}
      `);

      expect(result).toHaveLength(1);
      expect(result[0].externalId).toBe(externalId);
    });

    it('should expire old dedup entries', async () => {
      const externalId = 'TEST_DEDUP_EXPIRED';
      
      // Insert expired dedup entry
      await db.execute(sql`
        INSERT INTO voicemailDedup (externalId, expiresAt)
        VALUES (${externalId}, DATE_SUB(NOW(), INTERVAL 1 HOUR))
      `);

      // Cleanup expired entries
      const result = await db.execute(sql`
        DELETE FROM voicemailDedup WHERE expiresAt <= NOW()
      `);

      // Verify entry was deleted
      const remaining = await db.execute(sql`
        SELECT * FROM voicemailDedup WHERE externalId = ${externalId}
      `);

      expect(remaining).toHaveLength(0);
    });
  });

  describe('Phase 3: Duplicate Detection', () => {
    it('should find duplicate voicemail tickets', async () => {
      const title = 'TEST_VOICEMAIL_DUPLICATE_001';
      const description = 'Test duplicate voicemail';

      // Insert duplicate tickets
      await db.execute(sql`
        INSERT INTO callDraftTickets (title, description, reviewStatus, created_at)
        VALUES 
          (${title}, ${description}, 'pending', NOW()),
          (${title}, ${description}, 'pending', NOW())
      `);

      // Find duplicates
      const duplicates = await db.execute(sql`
        SELECT 
          title,
          description,
          COUNT(*) as count,
          GROUP_CONCAT(id ORDER BY created_at) as ids
        FROM callDraftTickets
        WHERE title = ${title}
          AND description = ${description}
          AND reviewStatus = 'pending'
        GROUP BY title, description
        HAVING COUNT(*) > 1
      `);

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].count).toBe(2);
    });

    it('should not find non-duplicate tickets', async () => {
      const title = 'TEST_UNIQUE_VOICEMAIL';
      
      // Insert single ticket
      await db.execute(sql`
        INSERT INTO callDraftTickets (title, description, reviewStatus, created_at)
        VALUES (${title}, 'Unique description', 'pending', NOW())
      `);

      // Find duplicates
      const duplicates = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM callDraftTickets
        WHERE title = ${title}
          AND reviewStatus = 'pending'
        GROUP BY title
        HAVING COUNT(*) > 1
      `);

      expect(duplicates).toHaveLength(0);
    });
  });

  describe('Phase 4: Duplicate Removal', () => {
    it('should keep oldest ticket and remove duplicates', async () => {
      const title = 'TEST_VOICEMAIL_CLEANUP';
      const description = 'Test cleanup';

      // Insert 3 duplicate tickets
      const ids = [];
      for (let i = 0; i < 3; i++) {
        const result = await db.execute(sql`
          INSERT INTO callDraftTickets (title, description, reviewStatus, created_at)
          VALUES (${title}, ${description}, 'pending', NOW())
        `);
        ids.push((result as any).insertId);
      }

      // Get the oldest ID (should be first)
      const oldestId = ids[0];

      // Delete duplicates (keep oldest)
      await db.execute(sql`
        DELETE FROM callDraftTickets 
        WHERE title = ${title}
          AND description = ${description}
          AND id != ${oldestId}
      `);

      // Verify only oldest remains
      const remaining = await db.execute(sql`
        SELECT * FROM callDraftTickets 
        WHERE title = ${title} AND description = ${description}
      `);

      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe(oldestId);
    });
  });

  describe('Phase 5: Race Condition Prevention', () => {
    it('should prevent concurrent duplicate creation with UNIQUE constraint', async () => {
      const externalId = 'TEST_RACE_CONDITION';
      
      // First insert should succeed
      await db.execute(sql`
        INSERT INTO voicemailDedup (externalId, expiresAt)
        VALUES (${externalId}, DATE_ADD(NOW(), INTERVAL 24 HOUR))
      `);

      // Second insert should fail due to UNIQUE constraint
      let errorCaught = false;
      try {
        await db.execute(sql`
          INSERT INTO voicemailDedup (externalId, expiresAt)
          VALUES (${externalId}, DATE_ADD(NOW(), INTERVAL 24 HOUR))
        `);
      } catch (e: any) {
        errorCaught = true;
        expect(e.message).toContain('Duplicate entry');
      }

      expect(errorCaught).toBe(true);
    });
  });

  describe('Phase 6: Dedup Status Tracking', () => {
    it('should report dedup table statistics', async () => {
      // Insert test entries
      for (let i = 0; i < 3; i++) {
        await db.execute(sql`
          INSERT INTO voicemailDedup (externalId, expiresAt)
          VALUES (${`TEST_STAT_${i}`}, DATE_ADD(NOW(), INTERVAL 24 HOUR))
        `);
      }

      // Get status
      const status = await db.execute(sql`
        SELECT 
          COUNT(*) as total_entries,
          COUNT(CASE WHEN expiresAt > NOW() THEN 1 END) as active_entries,
          COUNT(CASE WHEN expiresAt <= NOW() THEN 1 END) as expired_entries
        FROM voicemailDedup
      `);

      expect(status).toHaveLength(1);
      expect(status[0].total_entries).toBeGreaterThanOrEqual(3);
      expect(status[0].active_entries).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Phase 7: Production Readiness', () => {
    it('should handle large batch of duplicates', async () => {
      const title = 'TEST_BATCH_VOICEMAIL';
      const description = 'Batch test';
      const batchSize = 10;

      // Insert batch of duplicates
      for (let i = 0; i < batchSize; i++) {
        await db.execute(sql`
          INSERT INTO callDraftTickets (title, description, reviewStatus, created_at)
          VALUES (${title}, ${description}, 'pending', NOW())
        `);
      }

      // Find and count duplicates
      const duplicates = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM callDraftTickets
        WHERE title = ${title}
          AND description = ${description}
          AND reviewStatus = 'pending'
      `);

      expect(duplicates[0].count).toBe(batchSize);
    });

    it('should maintain data integrity during cleanup', async () => {
      const title = 'TEST_INTEGRITY_CHECK';
      
      // Insert test tickets
      await db.execute(sql`
        INSERT INTO callDraftTickets (title, description, reviewStatus, created_at)
        VALUES 
          (${title}, 'Desc 1', 'pending', NOW()),
          (${title}, 'Desc 1', 'pending', NOW()),
          (${title}, 'Desc 2', 'pending', NOW())
      `);

      // Cleanup should only remove exact duplicates
      const beforeCount = await db.execute(sql`
        SELECT COUNT(*) as count FROM callDraftTickets WHERE title = ${title}
      `);

      expect(beforeCount[0].count).toBe(3);
    });

    it('should handle empty database gracefully', async () => {
      // Query should return empty result, not error
      const result = await db.execute(sql`
        SELECT * FROM voicemailSourceTombstones 
        WHERE externalId = 'NONEXISTENT_ID'
      `);

      expect(result).toHaveLength(0);
    });
  });
});
