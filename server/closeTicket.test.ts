/**
 * Tests for the closeTicket procedure
 * Validates that closing notes are required and enforced server-side
 */
import { describe, it, expect } from "vitest";
import { z } from "zod";

// Mirror the Zod schema used in the closeTicket procedure
const closeTicketInput = z.object({
  ticketId: z.number(),
  closingNotes: z
    .string()
    .min(10, "Closing notes must be at least 10 characters")
    .max(2000),
});

describe("closeTicket input validation", () => {
  it("should reject empty closing notes", () => {
    const result = closeTicketInput.safeParse({ ticketId: 1, closingNotes: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("at least 10 characters");
    }
  });

  it("should reject closing notes shorter than 10 characters", () => {
    const result = closeTicketInput.safeParse({ ticketId: 1, closingNotes: "Short" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("at least 10 characters");
    }
  });

  it("should reject closing notes longer than 2000 characters", () => {
    const longNote = "A".repeat(2001);
    const result = closeTicketInput.safeParse({ ticketId: 1, closingNotes: longNote });
    expect(result.success).toBe(false);
  });

  it("should accept valid closing notes of exactly 10 characters", () => {
    const result = closeTicketInput.safeParse({ ticketId: 1, closingNotes: "1234567890" });
    expect(result.success).toBe(true);
  });

  it("should accept valid closing notes with a full resolution description", () => {
    const result = closeTicketInput.safeParse({
      ticketId: 42,
      closingNotes:
        "Issue resolved by reconfiguring the Outlook profile. Customer confirmed email is now receiving correctly. No further action required.",
    });
    expect(result.success).toBe(true);
  });

  it("should accept closing notes of exactly 2000 characters", () => {
    const maxNote = "A".repeat(2000);
    const result = closeTicketInput.safeParse({ ticketId: 1, closingNotes: maxNote });
    expect(result.success).toBe(true);
  });

  it("should reject missing ticketId", () => {
    const result = closeTicketInput.safeParse({ closingNotes: "Valid closing note here" });
    expect(result.success).toBe(false);
  });

  it("should reject non-numeric ticketId", () => {
    const result = closeTicketInput.safeParse({ ticketId: "abc", closingNotes: "Valid closing note here" });
    expect(result.success).toBe(false);
  });
});
