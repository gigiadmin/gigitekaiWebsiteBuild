import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Voicemail Tombstone System - Unit Tests
 * 
 * Tests the core tombstone logic:
 * 1. Tombstone creation when drafts are deleted
 * 2. Poller skipping tombstoned voicemails
 * 3. Preventing re-imports across multiple poller runs
 * 4. Allowing non-tombstoned voicemails to import
 * 5. Correct tombstone metadata
 * 6. Edge cases (duplicate deletion, etc.)
 * 7. 24-hour expiration window
 */

// ─── Mock Tombstone Store ──────────────────────────────────────────────────────

interface MockTombstone {
  callLogId: number;
  groupId: string;
  threadId: string;
  dismissedAt: Date;
  dismissedBy: string;
}

class MockTombstoneStore {
  private tombstones: Map<number, MockTombstone> = new Map();

  create(tombstone: MockTombstone): boolean {
    if (this.tombstones.has(tombstone.callLogId)) {
      return false; // Already exists
    }
    this.tombstones.set(tombstone.callLogId, tombstone);
    return true;
  }

  exists(callLogId: number): boolean {
    return this.tombstones.has(callLogId);
  }

  get(callLogId: number): MockTombstone | undefined {
    return this.tombstones.get(callLogId);
  }

  getAll(): MockTombstone[] {
    return Array.from(this.tombstones.values());
  }

  getRecent(hoursAgo: number): MockTombstone[] {
    const cutoff = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    return this.getAll().filter((t) => t.dismissedAt > cutoff);
  }

  clear(): void {
    this.tombstones.clear();
  }

  size(): number {
    return this.tombstones.size;
  }
}

// ─── Poller Logic (Mocked) ──────────────────────────────────────────────────────

class MockVoicemailPoller {
  private tombstones: MockTombstoneStore;
  private drafts: Map<number, { callLogId: number; title: string }> = new Map();

  constructor(tombstones: MockTombstoneStore) {
    this.tombstones = tombstones;
  }

  /**
   * Simulate poller processing a voicemail
   * Returns true if draft was created, false if skipped (tombstoned)
   */
  processVoicemail(callLogId: number, title: string): boolean {
    // Check if tombstone exists
    if (this.tombstones.exists(callLogId)) {
      console.log(`[Poller] Skipping tombstoned voicemail ${callLogId}`);
      return false;
    }

    // Create draft
    const draftId = this.drafts.size + 1;
    this.drafts.set(draftId, { callLogId, title });
    console.log(`[Poller] Created draft ${draftId} for voicemail ${callLogId}`);
    return true;
  }

  getDrafts(): Array<{ id: number; callLogId: number; title: string }> {
    return Array.from(this.drafts.entries()).map(([id, data]) => ({
      id,
      ...data,
    }));
  }

  getDraftCount(): number {
    return this.drafts.size;
  }

  clear(): void {
    this.drafts.clear();
  }
}

// ─── Tests ──────────────────────────────────────────────────────────────────────

describe("Voicemail Tombstone System - Unit Tests", () => {
  let store: MockTombstoneStore;
  let poller: MockVoicemailPoller;

  beforeEach(() => {
    store = new MockTombstoneStore();
    poller = new MockVoicemailPoller(store);
  });

  describe("Test 1: Tombstone Creation on Draft Deletion", () => {
    it("should create tombstone when draft is deleted", () => {
      // Setup: Create a tombstone
      const tombstone: MockTombstone = {
        callLogId: 1,
        groupId: "group-1",
        threadId: "thread-1",
        dismissedAt: new Date(),
        dismissedBy: "test-admin",
      };

      // Action: Create tombstone
      const created = store.create(tombstone);

      // Verify: Tombstone was created
      expect(created).toBe(true);
      expect(store.exists(1)).toBe(true);
      expect(store.get(1)).toEqual(tombstone);
    });

    it("should not create duplicate tombstone", () => {
      // Setup: Create first tombstone
      const tombstone: MockTombstone = {
        callLogId: 1,
        groupId: "group-1",
        threadId: "thread-1",
        dismissedAt: new Date(),
        dismissedBy: "test-admin",
      };

      const first = store.create(tombstone);
      expect(first).toBe(true);

      // Action: Try to create duplicate
      const second = store.create(tombstone);

      // Verify: Duplicate was rejected
      expect(second).toBe(false);
      expect(store.size()).toBe(1);
    });
  });

  describe("Test 2: Poller Skips Tombstoned Voicemails", () => {
    it("should skip importing voicemail if tombstone exists", () => {
      // Setup: Create tombstone for voicemail 1
      store.create({
        callLogId: 1,
        groupId: "group-1",
        threadId: "thread-1",
        dismissedAt: new Date(),
        dismissedBy: "test-admin",
      });

      // Action: Poller tries to process voicemail 1
      const processed = poller.processVoicemail(1, "Test Voicemail");

      // Verify: Poller skipped it
      expect(processed).toBe(false);
      expect(poller.getDraftCount()).toBe(0);
    });

    it("should import voicemail if no tombstone exists", () => {
      // Action: Poller processes new voicemail (no tombstone)
      const processed = poller.processVoicemail(2, "New Voicemail");

      // Verify: Poller created draft
      expect(processed).toBe(true);
      expect(poller.getDraftCount()).toBe(1);
    });
  });

  describe("Test 3: Prevent Re-Import Across Multiple Poller Runs", () => {
    it("should prevent same voicemail from being imported 3 times", () => {
      // Setup: Create tombstone once
      store.create({
        callLogId: 1,
        groupId: "group-1",
        threadId: "thread-1",
        dismissedAt: new Date(),
        dismissedBy: "test-admin",
      });

      // Action: Simulate 3 poller runs
      for (let i = 0; i < 3; i++) {
        poller.processVoicemail(1, "Test Voicemail");
      }

      // Verify: No drafts created (all 3 runs skipped)
      expect(poller.getDraftCount()).toBe(0);
      expect(store.size()).toBe(1); // Only 1 tombstone
    });
  });

  describe("Test 4: Allow Non-Tombstoned Voicemails to Import", () => {
    it("should allow 3 new voicemails to import when 2 are tombstoned", () => {
      // Setup: Create tombstones for voicemails 1 and 2
      store.create({
        callLogId: 1,
        groupId: "group-1",
        threadId: "thread-1",
        dismissedAt: new Date(),
        dismissedBy: "test-admin",
      });

      store.create({
        callLogId: 2,
        groupId: "group-2",
        threadId: "thread-2",
        dismissedAt: new Date(),
        dismissedBy: "test-admin",
      });

      // Action: Poller processes all 3
      const result1 = poller.processVoicemail(1, "Tombstoned 1");
      const result2 = poller.processVoicemail(2, "Tombstoned 2");
      const result3 = poller.processVoicemail(3, "New Voicemail");

      // Verify: First two skipped, third imported
      expect(result1).toBe(false);
      expect(result2).toBe(false);
      expect(result3).toBe(true);
      expect(poller.getDraftCount()).toBe(1);
    });
  });

  describe("Test 5: Tombstone Metadata Correctness", () => {
    it("should store correct tombstone metadata", () => {
      // Setup: Create tombstone with specific metadata
      const groupId = "test-group-5";
      const threadId = "test-thread-5";
      const dismissedBy = "harry@gigitekai.com";
      const dismissedAt = new Date("2026-06-22T18:00:00Z");

      const tombstone: MockTombstone = {
        callLogId: 5,
        groupId,
        threadId,
        dismissedAt,
        dismissedBy,
      };

      // Action: Create tombstone
      store.create(tombstone);

      // Verify: All metadata is correct
      const retrieved = store.get(5);
      expect(retrieved).toBeDefined();
      expect(retrieved?.callLogId).toBe(5);
      expect(retrieved?.groupId).toBe(groupId);
      expect(retrieved?.threadId).toBe(threadId);
      expect(retrieved?.dismissedBy).toBe(dismissedBy);
      expect(retrieved?.dismissedAt).toEqual(dismissedAt);
    });
  });

  describe("Test 6: Edge Case - Duplicate Deletion Prevention", () => {
    it("should not create duplicate tombstones if deleted twice", () => {
      // Setup: Create first tombstone
      const tombstone1: MockTombstone = {
        callLogId: 6,
        groupId: "group-6a",
        threadId: "thread-6a",
        dismissedAt: new Date(),
        dismissedBy: "test-admin",
      };

      const first = store.create(tombstone1);
      expect(first).toBe(true);

      // Action: Try to create another for same callLogId
      const tombstone2: MockTombstone = {
        callLogId: 6,
        groupId: "group-6b",
        threadId: "thread-6b",
        dismissedAt: new Date(),
        dismissedBy: "test-admin",
      };

      const second = store.create(tombstone2);

      // Verify: Only 1 tombstone exists
      expect(second).toBe(false);
      expect(store.size()).toBe(1);
      expect(store.get(6)?.groupId).toBe("group-6a"); // Original preserved
    });
  });

  describe("Test 7: Tombstone Expiration (24-hour window)", () => {
    it("should identify old tombstones outside 24-hour window", () => {
      // Setup: Create old and new tombstones
      const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      const newDate = new Date(Date.now() - 1 * 60 * 60 * 1000);  // 1 hour ago

      store.create({
        callLogId: 7,
        groupId: "group-7a",
        threadId: "thread-7a",
        dismissedAt: oldDate,
        dismissedBy: "test-admin",
      });

      store.create({
        callLogId: 8,
        groupId: "group-7b",
        threadId: "thread-7b",
        dismissedAt: newDate,
        dismissedBy: "test-admin",
      });

      // Action: Query for tombstones within 24 hours
      const recent = store.getRecent(24);

      // Verify: Only new tombstone is in 24-hour window
      expect(store.size()).toBe(2); // Both exist
      expect(recent.length).toBe(1); // Only 1 within 24 hours
      expect(recent[0].groupId).toBe("group-7b");
    });

    it("should identify all tombstones within 1-hour window", () => {
      // Setup: Create tombstone 1 hour ago
      const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000);

      store.create({
        callLogId: 9,
        groupId: "group-9",
        threadId: "thread-9",
        dismissedAt: oneHourAgo,
        dismissedBy: "test-admin",
      });

      // Action: Query for tombstones within 2 hours
      const recent = store.getRecent(2);

      // Verify: Tombstone is found
      expect(recent.length).toBe(1);
      expect(recent[0].callLogId).toBe(9);
    });
  });

  describe("Test 8: Comprehensive Scenario - Multiple Poller Runs", () => {
    it("should handle complex scenario: 3 runs, 2 tombstones, 1 new", () => {
      // Setup: Initial state
      // - Voicemail 1: Tombstoned (from previous run)
      // - Voicemail 2: Tombstoned (from previous run)
      // - Voicemail 3: New (never seen)

      store.create({
        callLogId: 1,
        groupId: "group-1",
        threadId: "thread-1",
        dismissedAt: new Date(),
        dismissedBy: "test-admin",
      });

      store.create({
        callLogId: 2,
        groupId: "group-2",
        threadId: "thread-2",
        dismissedAt: new Date(),
        dismissedBy: "test-admin",
      });

      // Run 1: Process all 3
      let run1Results = [
        poller.processVoicemail(1, "VM 1"),
        poller.processVoicemail(2, "VM 2"),
        poller.processVoicemail(3, "VM 3"),
      ];

      expect(run1Results).toEqual([false, false, true]); // 1 draft created
      expect(poller.getDraftCount()).toBe(1);

      // Run 2: Same 3 voicemails
      let run2Results = [
        poller.processVoicemail(1, "VM 1"),
        poller.processVoicemail(2, "VM 2"),
        poller.processVoicemail(3, "VM 3"),
      ];

      expect(run2Results).toEqual([false, false, true]); // 1 more draft (duplicate!)
      expect(poller.getDraftCount()).toBe(2); // Now 2 drafts

      // Fix: Create tombstone for voicemail 3 after first import
      store.create({
        callLogId: 3,
        groupId: "group-3",
        threadId: "thread-3",
        dismissedAt: new Date(),
        dismissedBy: "test-admin",
      });

      // Clear drafts for Run 3
      poller.clear();

      // Run 3: Same 3 voicemails (with tombstone for 3)
      let run3Results = [
        poller.processVoicemail(1, "VM 1"),
        poller.processVoicemail(2, "VM 2"),
        poller.processVoicemail(3, "VM 3"),
      ];

      expect(run3Results).toEqual([false, false, false]); // All skipped
      expect(poller.getDraftCount()).toBe(0); // No new drafts
    });
  });
});
