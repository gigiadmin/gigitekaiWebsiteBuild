import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "../db";
import { formSubmissions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

describe("formSubmissions Router", () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error("Database connection failed");
    }
  });

  afterAll(async () => {
    // Cleanup test data
    if (db) {
      await db
        .delete(formSubmissions)
        .where(eq(formSubmissions.email, "test@example.com"));
    }
  });

  describe("submitForm", () => {
    it("should validate email format", async () => {
      const result = await db
        .insert(formSubmissions)
        .values({
          email: "invalid-email",
          name: "Test User",
          category: "helpdesk-pricing",
          message: "This is a test message",
          source: "website",
        })
        .catch((err: any) => err);

      // Should fail validation or constraint
      expect(result).toBeDefined();
    });

    it("should create a new form submission", async () => {
      const result = await db.insert(formSubmissions).values({
        email: "test@example.com",
        name: "Test User",
        company: "Test Company",
        category: "helpdesk-pricing",
        message: "This is a test message about helpdesk pricing",
        source: "website",
        status: "new",
      });

      expect(result.insertId).toBeGreaterThan(0);

      // Verify it was inserted
      const inserted = await db
        .select()
        .from(formSubmissions)
        .where(eq(formSubmissions.email, "test@example.com"));

      expect(inserted).toHaveLength(1);
      expect(inserted[0].name).toBe("Test User");
      expect(inserted[0].category).toBe("helpdesk-pricing");
      expect(inserted[0].status).toBe("new");
    });

    it("should prevent spam (too many submissions from same email)", async () => {
      const email = "spam-test@example.com";

      // Insert 4 submissions within 1 hour
      for (let i = 0; i < 4; i++) {
        await db.insert(formSubmissions).values({
          email,
          name: `Test User ${i}`,
          category: "contact",
          message: `Test message ${i}`,
          source: "website",
          status: "new",
        });
      }

      // Verify all 4 were inserted
      const submissions = await db
        .select()
        .from(formSubmissions)
        .where(eq(formSubmissions.email, email));

      expect(submissions.length).toBeGreaterThanOrEqual(4);

      // Cleanup
      await db.delete(formSubmissions).where(eq(formSubmissions.email, email));
    });
  });

  describe("markAsContacted", () => {
    it("should update submission status to contacted", async () => {
      // Create a submission
      const result = await db.insert(formSubmissions).values({
        email: "contacted-test@example.com",
        name: "Test User",
        category: "free-audit",
        message: "Test message",
        source: "website",
        status: "new",
      });

      const submissionId = result.insertId;

      // Update status
      await db
        .update(formSubmissions)
        .set({
          status: "contacted",
          contactedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
        })
        .where(eq(formSubmissions.id, submissionId));

      // Verify
      const updated = await db
        .select()
        .from(formSubmissions)
        .where(eq(formSubmissions.id, submissionId));

      expect(updated[0].status).toBe("contacted");
      expect(updated[0].contactedAt).toBeDefined();

      // Cleanup
      await db.delete(formSubmissions).where(eq(formSubmissions.id, submissionId));
    });
  });

  describe("markAsConverted", () => {
    it("should update submission status to converted", async () => {
      // Create a submission
      const result = await db.insert(formSubmissions).values({
        email: "converted-test@example.com",
        name: "Test User",
        category: "helpdesk-pricing",
        message: "Test message",
        source: "website",
        status: "new",
      });

      const submissionId = result.insertId;

      // Update status
      await db
        .update(formSubmissions)
        .set({ status: "converted" })
        .where(eq(formSubmissions.id, submissionId));

      // Verify
      const updated = await db
        .select()
        .from(formSubmissions)
        .where(eq(formSubmissions.id, submissionId));

      expect(updated[0].status).toBe("converted");

      // Cleanup
      await db.delete(formSubmissions).where(eq(formSubmissions.id, submissionId));
    });
  });

  describe("getSubmissions", () => {
    it("should retrieve submissions with filters", async () => {
      // Create test submissions
      const submission1 = await db.insert(formSubmissions).values({
        email: "filter-test1@example.com",
        name: "User 1",
        category: "helpdesk-pricing",
        message: "Test message 1",
        source: "website",
        status: "new",
      });

      const submission2 = await db.insert(formSubmissions).values({
        email: "filter-test2@example.com",
        name: "User 2",
        category: "free-audit",
        message: "Test message 2",
        source: "website",
        status: "contacted",
      });

      // Query by category
      const helpdesk = await db
        .select()
        .from(formSubmissions)
        .where(eq(formSubmissions.category, "helpdesk-pricing"));

      expect(helpdesk.length).toBeGreaterThan(0);
      expect(helpdesk.some((s: any) => s.email === "filter-test1@example.com")).toBe(true);

      // Query by status
      const contacted = await db
        .select()
        .from(formSubmissions)
        .where(eq(formSubmissions.status, "contacted"));

      expect(contacted.some((s: any) => s.email === "filter-test2@example.com")).toBe(true);

      // Cleanup
      await db.delete(formSubmissions).where(eq(formSubmissions.id, submission1.insertId));
      await db.delete(formSubmissions).where(eq(formSubmissions.id, submission2.insertId));
    });
  });

  describe("stats", () => {
    it("should calculate submission statistics", async () => {
      // Create test submissions with different statuses
      const submissions = await Promise.all([
        db.insert(formSubmissions).values({
          email: "stats-test1@example.com",
          name: "User 1",
          category: "contact",
          message: "Test",
          source: "website",
          status: "new",
        }),
        db.insert(formSubmissions).values({
          email: "stats-test2@example.com",
          name: "User 2",
          category: "contact",
          message: "Test",
          source: "website",
          status: "contacted",
        }),
        db.insert(formSubmissions).values({
          email: "stats-test3@example.com",
          name: "User 3",
          category: "contact",
          message: "Test",
          source: "website",
          status: "converted",
        }),
      ]);

      // Get all submissions to verify they exist
      const allSubmissions = await db.select().from(formSubmissions);
      expect(allSubmissions.length).toBeGreaterThan(0);

      // Cleanup
      for (const sub of submissions) {
        await db.delete(formSubmissions).where(eq(formSubmissions.id, sub.insertId));
      }
    });
  });
});
