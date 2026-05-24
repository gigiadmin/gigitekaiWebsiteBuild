import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "../db";
import { freeAuditSubmissions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Audit Router", () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
  });

  it("should create a free audit submission", async () => {
    if (!db) {
      console.log("Database unavailable, skipping test");
      return;
    }

    const testData = {
      companyName: "Test Company",
      industry: "Technology",
      description: "A test company for audit",
      contactName: "John Doe",
      contactEmail: "john@example.com",
      contactPhone: "+1234567890",
      auditType: "Security",
      currentChallenges: "Need better security",
      goals: "Improve security posture",
    };

    // Insert audit submission
    await db.insert(freeAuditSubmissions).values(testData);

    // Verify it was created
    const submissions = await db
      .select()
      .from(freeAuditSubmissions)
      .where(eq(freeAuditSubmissions.companyName, "Test Company"));

    expect(submissions.length).toBeGreaterThan(0);
    expect(submissions[0].contactEmail).toBe("john@example.com");
    expect(submissions[0].status).toBe("submitted");

    // Cleanup
    await db
      .delete(freeAuditSubmissions)
      .where(eq(freeAuditSubmissions.companyName, "Test Company"));
  });

  it("should update audit submission status", async () => {
    if (!db) {
      console.log("Database unavailable, skipping test");
      return;
    }

    const testData = {
      companyName: "Test Company 2",
      industry: "Finance",
      contactName: "Jane Doe",
      contactEmail: "jane@example.com",
      status: "submitted" as const,
    };

    // Insert audit submission
    await db.insert(freeAuditSubmissions).values(testData);

    // Get the ID
    const submissions = await db
      .select()
      .from(freeAuditSubmissions)
      .where(eq(freeAuditSubmissions.companyName, "Test Company 2"));

    expect(submissions.length).toBeGreaterThan(0);
    const submissionId = submissions[0].id;

    // Update status
    await db
      .update(freeAuditSubmissions)
      .set({ status: "contacted" })
      .where(eq(freeAuditSubmissions.id, submissionId));

    // Verify update
    const updated = await db
      .select()
      .from(freeAuditSubmissions)
      .where(eq(freeAuditSubmissions.id, submissionId));

    expect(updated[0].status).toBe("contacted");

    // Cleanup
    await db
      .delete(freeAuditSubmissions)
      .where(eq(freeAuditSubmissions.companyName, "Test Company 2"));
  });

  it("should list all audit submissions", async () => {
    if (!db) {
      console.log("Database unavailable, skipping test");
      return;
    }

    // Get all submissions
    const allSubmissions = await db
      .select()
      .from(freeAuditSubmissions);

    expect(Array.isArray(allSubmissions)).toBe(true);
  });

  it("should filter audit submissions by status", async () => {
    if (!db) {
      console.log("Database unavailable, skipping test");
      return;
    }

    // Get submissions with specific status
    const submittedSubmissions = await db
      .select()
      .from(freeAuditSubmissions)
      .where(eq(freeAuditSubmissions.status, "submitted"));

    expect(Array.isArray(submittedSubmissions)).toBe(true);
  });

  it("should add notes to audit submission", async () => {
    if (!db) {
      console.log("Database unavailable, skipping test");
      return;
    }

    const testData = {
      companyName: "Test Company 3",
      industry: "Healthcare",
      contactName: "Bob Smith",
      contactEmail: "bob@example.com",
      notes: "Initial contact made",
    };

    // Insert audit submission
    await db.insert(freeAuditSubmissions).values(testData);

    // Get the ID
    const submissions = await db
      .select()
      .from(freeAuditSubmissions)
      .where(eq(freeAuditSubmissions.companyName, "Test Company 3"));

    expect(submissions.length).toBeGreaterThan(0);
    expect(submissions[0].notes).toBe("Initial contact made");

    // Cleanup
    await db
      .delete(freeAuditSubmissions)
      .where(eq(freeAuditSubmissions.companyName, "Test Company 3"));
  });
});
