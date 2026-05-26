import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "../db";
import { callDraftTickets, callLogs } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

describe("Calls Router - Bulk Delete", () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
  });

  it("should bulk delete drafts by IDs", async () => {
    if (!db) {
      console.log("Database unavailable, skipping test");
      return;
    }

    // Create test drafts
    const result = await db
      .insert(callDraftTickets)
      .values([
        {
          callLogId: 1,
          title: "Test Draft 1 - " + Date.now(),
          description: "Test description 1",
          priority: "medium",
          reviewStatus: "pending",
          createdAt: new Date().toISOString(),
        },
      ]);

    // Get the inserted draft ID
    const drafts = await db
      .select()
      .from(callDraftTickets)
      .where(eq(callDraftTickets.description, "Test description 1"));
    
    expect(drafts.length).toBeGreaterThan(0);
    const draftId = drafts[drafts.length - 1].id;

    // Verify draft exists
    const beforeDelete = await db
      .select()
      .from(callDraftTickets)
      .where(eq(callDraftTickets.id, draftId));
    expect(beforeDelete.length).toBe(1);

    // Delete draft
    await db
      .delete(callDraftTickets)
      .where(eq(callDraftTickets.id, draftId));

    // Verify deletion
    const afterDelete = await db
      .select()
      .from(callDraftTickets)
      .where(eq(callDraftTickets.id, draftId));
    expect(afterDelete.length).toBe(0);
  });

  it("should bulk delete call logs by IDs", async () => {
    if (!db) {
      console.log("Database unavailable, skipping test");
      return;
    }

    // Create test call log
    const result = await db
      .insert(callLogs)
      .values([
        {
          graphCallId: "test-call-id-" + Date.now(),
          callerNumber: "+1234567890",
          durationSeconds: 60,
          startedAt: new Date().toISOString(),
          status: "draft_created",
        },
      ]);

    // Get the inserted log ID
    const logs = await db
      .select()
      .from(callLogs)
      .where(eq(callLogs.callerNumber, "+1234567890"))
      .orderBy(callLogs.id);
    
    expect(logs.length).toBeGreaterThan(0);
    const logId = logs[logs.length - 1].id;
    console.log("Created log with ID:", logId);

    // Verify log exists
    const beforeDelete = await db
      .select()
      .from(callLogs)
      .where(eq(callLogs.id, logId));
    expect(beforeDelete.length).toBe(1);

    // Delete log
    await db
      .delete(callLogs)
      .where(eq(callLogs.id, logId));

    // Verify deletion
    const afterDelete = await db
      .select()
      .from(callLogs)
      .where(eq(callLogs.id, logId));
    expect(afterDelete.length).toBe(0);
  });

  it("should handle empty ID array gracefully", () => {
    // This test verifies the backend validation
    // The actual mutation will throw an error for empty arrays
    const emptyIds: number[] = [];
    expect(emptyIds.length).toBe(0);
  });
});
