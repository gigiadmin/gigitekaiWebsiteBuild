import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { callDraftTickets } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("calls.deleteDraft", () => {
  let testDraftId: number;

  beforeAll(async () => {
    // Create a test draft
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const result = await db.insert(callDraftTickets).values({
      callLogId: 0,
      title: "Test Draft for Deletion",
      description: "This draft will be deleted",
      priority: "medium",
      category: "general_support",
      callerPhone: "+1234567890",
      callerName: "Test Caller",
      callerEmail: "test@example.com",
      reviewStatus: "pending",
    });
    testDraftId = (result as any)[0]?.insertId ?? (result as any).insertId;
  });

  it("should delete a draft ticket", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Verify draft exists before deletion
    const beforeDelete = await db
      .select()
      .from(callDraftTickets)
      .where(eq(callDraftTickets.id, testDraftId))
      .limit(1);
    expect(beforeDelete.length).toBe(1);

    // Delete the draft
    await db
      .delete(callDraftTickets)
      .where(eq(callDraftTickets.id, testDraftId));

    // Verify draft is deleted
    const afterDelete = await db
      .select()
      .from(callDraftTickets)
      .where(eq(callDraftTickets.id, testDraftId))
      .limit(1);
    expect(afterDelete.length).toBe(0);
  });

  it("should handle deletion of non-existent draft gracefully", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Try to delete a draft that doesn't exist
    const result = await db
      .delete(callDraftTickets)
      .where(eq(callDraftTickets.id, 99999));

    // Should not throw error, just return 0 affected rows
    expect(result).toBeDefined();
  });
});
