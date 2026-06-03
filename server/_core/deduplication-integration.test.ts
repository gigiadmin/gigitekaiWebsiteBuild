import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { recordVoicemailDedup, isVoicemailProcessed } from "./deduplication";
import { getDb } from "../db";
import { voicemailDedup, callLogs, callDraftTickets } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Integration tests for deduplication across all pollers
 * 
 * This test suite verifies that:
 * 1. Dedup is recorded BEFORE creating tickets (atomic operation)
 * 2. Concurrent voicemails don't create duplicates
 * 3. Different sources (email, group, webhook) are tracked independently
 * 4. Race conditions are prevented by database constraints
 */
describe("Deduplication Integration Tests", () => {
  let db: any;
  const testIds = new Set<string>();

  beforeEach(async () => {
    db = await getDb();
    if (!db) throw new Error("Database connection failed");
  });

  afterEach(async () => {
    // Cleanup all test data
    if (db) {
      try {
        for (const testId of testIds) {
          await db
            .delete(voicemailDedup)
            .where(eq(voicemailDedup.externalId, testId));
        }
        testIds.clear();
      } catch (err) {
        console.warn("Cleanup failed:", err);
      }
    }
  });

  describe("Atomic Dedup Recording (Before Ticket Creation)", () => {
    it("should prevent duplicate tickets from same voicemail", async () => {
      const testId = `test_${Date.now()}_001`;
      testIds.add(testId);
      const callerPhone = "+1-555-9001";
      const transcript = "integration_test_voicemail_001";
      const transcriptHash = transcript.substring(0, 50);

      // Simulate first poller run
      const result1 = await recordVoicemailDedup({
        callerPhone,
        transcriptHash,
        source: "email",
        externalId: testId,
      });
      expect(result1).toBe(true);

      // Verify it's marked as processed
      const isProcessed = await isVoicemailProcessed({
        callerPhone,
        transcriptHash,
        source: "email",
      });
      expect(isProcessed).toBe(true);

      // Simulate second poller run (same voicemail)
      const result2 = await recordVoicemailDedup({
        callerPhone,
        transcriptHash,
        source: "email",
        externalId: `${testId}_dup`,
      });
      expect(result2).toBe(false); // Should be rejected
    });

    it("should allow different voicemails from same caller", async () => {
      const testId1 = `test_${Date.now()}_002a`;
      const testId2 = `test_${Date.now()}_002b`;
      testIds.add(testId1);
      testIds.add(testId2);
      const callerPhone = "+1-555-9002";

      // First voicemail
      const result1 = await recordVoicemailDedup({
        callerPhone,
        transcriptHash: "different_voicemail_001",
        source: "email",
        externalId: testId1,
      });
      expect(result1).toBe(true);

      // Second voicemail from same caller (different transcript)
      const result2 = await recordVoicemailDedup({
        callerPhone,
        transcriptHash: "different_voicemail_002",
        source: "email",
        externalId: testId2,
      });
      expect(result2).toBe(true);
    });

    it("should track different sources independently", async () => {
      const testId1 = `test_${Date.now()}_003a`;
      const testId2 = `test_${Date.now()}_003b`;
      const testId3 = `test_${Date.now()}_003c`;
      testIds.add(testId1);
      testIds.add(testId2);
      testIds.add(testId3);
      const callerPhone = "+1-555-9003";
      const transcriptHash = "same_transcript_different_sources";

      // Email source
      const emailResult = await recordVoicemailDedup({
        callerPhone,
        transcriptHash,
        source: "email",
        externalId: testId1,
      });
      expect(emailResult).toBe(true);

      // Group source (same caller + transcript, but different source)
      const groupResult = await recordVoicemailDedup({
        callerPhone,
        transcriptHash,
        source: "group",
        externalId: testId2,
      });
      expect(groupResult).toBe(true);

      // Webhook source
      const webhookResult = await recordVoicemailDedup({
        callerPhone,
        transcriptHash,
        source: "webhook",
        externalId: testId3,
      });
      expect(webhookResult).toBe(true);
    });
  });

  describe("Race Condition Prevention", () => {
    it("should handle rapid concurrent duplicate attempts", async () => {
      const baseTestId = `test_${Date.now()}_004`;
      const callerPhone = "+1-555-9004";
      const transcriptHash = "concurrent_test_voicemail";

      // Simulate 5 concurrent poller runs (all processing same voicemail)
      const promises = Array.from({ length: 5 }, (_, i) => {
        const testId = `${baseTestId}_${i}`;
        testIds.add(testId);
        return recordVoicemailDedup({
          callerPhone,
          transcriptHash,
          source: "email",
          externalId: testId,
        });
      });

      const results = await Promise.all(promises);

      // Exactly one should succeed, others should fail
      const successCount = results.filter((r) => r === true).length;
      const failureCount = results.filter((r) => r === false).length;

      console.log(
        `[Race Condition Test] Successes: ${successCount}, Failures: ${failureCount}`
      );

      // At least one success, rest should be failures
      expect(successCount).toBeGreaterThanOrEqual(1);
      expect(failureCount).toBeGreaterThanOrEqual(4);
      expect(successCount + failureCount).toBe(5);
    });
  });

  describe("Data Integrity", () => {
    it("should store all dedup metadata correctly", async () => {
      const testId = `test_${Date.now()}_005`;
      testIds.add(testId);
      const callerPhone = "+1-555-9006";
      const transcriptHash = "metadata_test_voicemail";

      await recordVoicemailDedup({
        callerPhone,
        transcriptHash,
        source: "email",
        externalId: testId,
      });

      // Verify stored data
      const stored = await db
        .select()
        .from(voicemailDedup)
        .where(eq(voicemailDedup.externalId, testId))
        .limit(1);

      expect(stored.length).toBe(1);
      expect(stored[0].callerPhone).toBe(callerPhone);
      expect(stored[0].transcriptHash).toBe(transcriptHash);
      expect(stored[0].source).toBe("email");
      expect(stored[0].externalId).toBe(testId);
      expect(stored[0].expiresAt).toBeDefined();
      expect(stored[0].createdAt).toBeDefined();
    });
  });

  describe("Poller Simulation", () => {
    it("should simulate emailPoller dedup flow correctly", async () => {
      const testId = `test_${Date.now()}_006`;
      testIds.add(testId);
      const callerPhone = "+1-555-9007";
      const transcript = "simulated_email_voicemail_content";
      const transcriptHash = transcript.substring(0, 50);

      // Step 1: Record dedup BEFORE creating tickets (correct order)
      const isNew = await recordVoicemailDedup({
        callerPhone,
        transcriptHash,
        source: "email",
        externalId: testId,
      });
      expect(isNew).toBe(true);

      // Step 2: If duplicate, skip ticket creation
      if (!isNew) {
        console.log("Would skip ticket creation for duplicate");
        return;
      }

      // Step 3: Create callLogs + callDraftTickets (only if isNew)
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const [callLogResult] = await db.insert(callLogs).values({
        graphCallId: `email_call_${testId}`,
        callerNumber: callerPhone,
        calleeNumber: "+17273825776",
        calleeDisplayName: "GigitekAI Main Line",
        calleeUpn: "voicemail@gigitekai.com",
        direction: "inbound",
        startedAt: now,
        endedAt: now,
        durationSeconds: 0,
        hasTranscript: 1,
        transcriptText: transcript,
        aiSummary: "Test summary",
        aiTitle: "Test title",
        aiPriority: "medium",
        aiCategory: "general",
        aiConfidence: "0.85",
        status: "draft_created",
        transcriptionStatus: "done",
        createdAt: now,
        updatedAt: now,
      });

      const callLogId = (callLogResult as any).insertId;

      // Verify ticket was created
      expect(callLogId).toBeGreaterThan(0);

      // Step 4: Verify dedup prevents second attempt
      const isDuplicate = await recordVoicemailDedup({
        callerPhone,
        transcriptHash,
        source: "email",
        externalId: `${testId}_dup`,
      });
      expect(isDuplicate).toBe(false);

      // Cleanup
      try {
        await db.delete(callLogs).where(eq(callLogs.graphCallId, `email_call_${testId}`));
      } catch (err) {
        console.warn("Cleanup failed:", err);
      }
    });
  });
});
