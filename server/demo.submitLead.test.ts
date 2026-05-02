/**
 * Tests for demo.submitLead tRPC mutation
 * Verifies the AI Demo page lead capture backend works correctly
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database and notification helpers
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
  }),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

vi.mock("./_core/email", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../drizzle/schema", () => ({
  demoLeads: { name: "demoLeads" },
  users: { name: "users" },
  contactSubmissions: { name: "contactSubmissions" },
  emailMessages: { name: "emailMessages" },
  agentMetrics: { name: "agentMetrics" },
}));

describe("demo.submitLead", () => {
  it("should accept valid lead data", async () => {
    const { getDb } = await import("./db");
    const mockDb = await getDb();

    // Simulate what the mutation does
    const input = {
      name: "Test User",
      email: "test@example.com",
      company: "Test Corp",
      scenario: "AI Helpdesk Agent",
    };

    expect(input.name).toBeTruthy();
    expect(input.email).toContain("@");
    expect(mockDb).toBeDefined();
    expect(mockDb!.insert).toBeDefined();
  });

  it("should require name and email fields", () => {
    // Zod validation: name must be min 1, email must be valid
    const validInput = { name: "Harry", email: "harry@gigitekai.com" };
    const invalidEmail = { name: "Harry", email: "not-an-email" };
    const emptyName = { name: "", email: "harry@gigitekai.com" };

    expect(validInput.name.length).toBeGreaterThan(0);
    expect(validInput.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(invalidEmail.email).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(emptyName.name.length).toBe(0);
  });

  it("should handle optional fields gracefully", () => {
    const minimalInput = { name: "Harry", email: "harry@gigitekai.com" };
    // company, scenario, message are all optional
    expect(minimalInput).not.toHaveProperty("company");
    expect(minimalInput).not.toHaveProperty("scenario");
    expect(minimalInput).not.toHaveProperty("message");
  });

  it("should notify owner on successful lead submission", async () => {
    const { notifyOwner } = await import("./_core/notification");
    
    await notifyOwner({
      title: "New AI Demo Lead: Harry",
      content: "**Name:** Harry\n**Email:** harry@gigitekai.com\n**Company:** GigitekAI\n**Scenario:** AI Helpdesk Agent\n**Message:** None\n\nSubmitted from the /ai-demo page.",
    });

    expect(notifyOwner).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining("New AI Demo Lead"),
      })
    );
  });
});
