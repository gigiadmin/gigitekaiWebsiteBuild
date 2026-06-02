import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "../db";
import { scripts, scriptExecutions, scriptFeedback } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Scripts Router", () => {
  let testScriptId: number;
  const db = getDb();

  beforeAll(async () => {
    // Create a test script
    const result = await db.insert(scripts).values({
      name: "Test Script",
      description: "A test script for unit testing",
      category: "Teams",
      version: "1.0.0",
      author: "Test Author",
      created_at: new Date(),
      updated_at: new Date(),
      download_count: 0,
      rating: 0,
      difficulty_level: "Beginner",
      tags: JSON.stringify(["test", "automation"]),
      documentation: "# Test Script\n\nThis is a test script.",
      github_url: "https://github.com/test/test-script",
    });
    testScriptId = result.insertId;
  });

  afterAll(async () => {
    // Clean up test data
    if (testScriptId) {
      await db.delete(scriptFeedback).where(eq(scriptFeedback.script_id, testScriptId));
      await db.delete(scriptExecutions).where(eq(scriptExecutions.script_id, testScriptId));
      await db.delete(scripts).where(eq(scripts.id, testScriptId));
    }
  });

  it("should create a script", async () => {
    const result = await db.insert(scripts).values({
      name: "New Test Script",
      description: "Another test script",
      category: "Azure",
      version: "1.0.0",
      author: "Test Author",
      created_at: new Date(),
      updated_at: new Date(),
      download_count: 0,
      rating: 0,
      difficulty_level: "Intermediate",
      tags: JSON.stringify(["azure"]),
      documentation: "# New Script",
      github_url: "https://github.com/test/new-script",
    });

    expect(result.insertId).toBeGreaterThan(0);

    // Clean up
    await db.delete(scripts).where(eq(scripts.id, result.insertId));
  });

  it("should retrieve a script by ID", async () => {
    const result = await db
      .select()
      .from(scripts)
      .where(eq(scripts.id, testScriptId))
      .limit(1);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Test Script");
    expect(result[0].category).toBe("Teams");
  });

  it("should list scripts with pagination", async () => {
    const result = await db
      .select()
      .from(scripts)
      .limit(10)
      .offset(0);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("should increment download count", async () => {
    const before = await db
      .select()
      .from(scripts)
      .where(eq(scripts.id, testScriptId))
      .limit(1);

    const initialCount = before[0].download_count || 0;

    await db
      .update(scripts)
      .set({ download_count: initialCount + 1 })
      .where(eq(scripts.id, testScriptId));

    const after = await db
      .select()
      .from(scripts)
      .where(eq(scripts.id, testScriptId))
      .limit(1);

    expect(after[0].download_count).toBe(initialCount + 1);

    // Reset for other tests
    await db
      .update(scripts)
      .set({ download_count: initialCount })
      .where(eq(scripts.id, testScriptId));
  });

  it("should log script execution", async () => {
    const result = await db.insert(scriptExecutions).values({
      script_id: testScriptId,
      user_id: 1,
      executed_at: new Date(),
      status: "Success",
      duration_ms: 1500,
    });

    expect(result.insertId).toBeGreaterThan(0);

    // Verify the execution was logged
    const execution = await db
      .select()
      .from(scriptExecutions)
      .where(eq(scriptExecutions.id, result.insertId))
      .limit(1);

    expect(execution).toHaveLength(1);
    expect(execution[0].status).toBe("Success");
    expect(execution[0].duration_ms).toBe(1500);

    // Clean up
    await db.delete(scriptExecutions).where(eq(scriptExecutions.id, result.insertId));
  });

  it("should submit script feedback", async () => {
    const result = await db.insert(scriptFeedback).values({
      script_id: testScriptId,
      user_id: 1,
      feedback_type: "Bug",
      message: "This script has a bug in the Teams module",
      created_at: new Date(),
      status: "Open",
    });

    expect(result.insertId).toBeGreaterThan(0);

    // Verify the feedback was submitted
    const feedback = await db
      .select()
      .from(scriptFeedback)
      .where(eq(scriptFeedback.id, result.insertId))
      .limit(1);

    expect(feedback).toHaveLength(1);
    expect(feedback[0].feedback_type).toBe("Bug");
    expect(feedback[0].status).toBe("Open");

    // Clean up
    await db.delete(scriptFeedback).where(eq(scriptFeedback.id, result.insertId));
  });

  it("should update feedback status", async () => {
    // Create feedback
    const feedbackResult = await db.insert(scriptFeedback).values({
      script_id: testScriptId,
      user_id: 1,
      feedback_type: "Feature Request",
      message: "Add support for Exchange Online",
      created_at: new Date(),
      status: "Open",
    });

    // Update status
    await db
      .update(scriptFeedback)
      .set({ status: "In Progress" })
      .where(eq(scriptFeedback.id, feedbackResult.insertId));

    // Verify
    const updated = await db
      .select()
      .from(scriptFeedback)
      .where(eq(scriptFeedback.id, feedbackResult.insertId))
      .limit(1);

    expect(updated[0].status).toBe("In Progress");

    // Clean up
    await db.delete(scriptFeedback).where(eq(scriptFeedback.id, feedbackResult.insertId));
  });

  it("should filter scripts by category", async () => {
    const result = await db
      .select()
      .from(scripts)
      .where(eq(scripts.category, "Teams"))
      .limit(10);

    expect(Array.isArray(result)).toBe(true);
    result.forEach((script) => {
      expect(script.category).toBe("Teams");
    });
  });

  it("should handle script deletion", async () => {
    // Create a script to delete
    const createResult = await db.insert(scripts).values({
      name: "Script to Delete",
      description: "This script will be deleted",
      category: "M365",
      version: "1.0.0",
      author: "Test Author",
      created_at: new Date(),
      updated_at: new Date(),
      download_count: 0,
      rating: 0,
      difficulty_level: "Beginner",
      tags: JSON.stringify(["delete-test"]),
      documentation: "# Delete Test",
      github_url: "https://github.com/test/delete-script",
    });

    const scriptToDelete = createResult.insertId;

    // Delete the script
    await db.delete(scripts).where(eq(scripts.id, scriptToDelete));

    // Verify it's deleted
    const result = await db
      .select()
      .from(scripts)
      .where(eq(scripts.id, scriptToDelete))
      .limit(1);

    expect(result).toHaveLength(0);
  });
});
