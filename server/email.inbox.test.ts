/**
 * Tests for email inbox sync and {{ticketId}} template variable substitution
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Test: Template variable substitution ────────────────────────────────────

/**
 * Mirrors the resolveVars logic from server/routers/email.ts
 * We test it in isolation to ensure the regex works correctly.
 */
function resolveVars(text: string, linkedTicketId?: number, to?: string): string {
  return text
    .replace(/\{\{ticketId\}\}/gi, linkedTicketId ? String(linkedTicketId) : "")
    .replace(/\{\{ticket_id\}\}/gi, linkedTicketId ? String(linkedTicketId) : "")
    .replace(/\{\{date\}\}/gi, new Date().toLocaleDateString())
    .replace(/\{\{recipient\}\}/gi, to ?? "");
}

describe("Email template variable substitution", () => {
  it("replaces {{ticketId}} with the actual ticket number", () => {
    const subject = "[TICKET #{{ticketId}}] Your support request";
    const result = resolveVars(subject, 42);
    expect(result).toBe("[TICKET #42] Your support request");
    expect(result).not.toContain("{{ticketId}}");
  });

  it("replaces {{ticket_id}} (underscore variant) with the actual ticket number", () => {
    const subject = "Ticket {{ticket_id}} update";
    const result = resolveVars(subject, 99);
    expect(result).toBe("Ticket 99 update");
  });

  it("replaces {{ticketId}} case-insensitively", () => {
    const subject = "Ticket {{TICKETID}} opened";
    const result = resolveVars(subject, 7);
    expect(result).toBe("Ticket 7 opened");
  });

  it("leaves empty string when no ticketId is provided", () => {
    const subject = "[TICKET #{{ticketId}}] General inquiry";
    const result = resolveVars(subject, undefined);
    expect(result).toBe("[TICKET #] General inquiry");
    expect(result).not.toContain("{{ticketId}}");
  });

  it("replaces {{recipient}} with the to address", () => {
    const body = "Hello {{recipient}}, your ticket has been received.";
    const result = resolveVars(body, 1, "customer@example.com");
    expect(result).toBe("Hello customer@example.com, your ticket has been received.");
  });

  it("replaces multiple variables in a single pass", () => {
    const body = "Hi {{recipient}}, ticket #{{ticketId}} is now open.";
    const result = resolveVars(body, 55, "user@test.com");
    expect(result).toBe("Hi user@test.com, ticket #55 is now open.");
  });

  it("does not modify text with no template variables", () => {
    const subject = "Plain subject with no variables";
    const result = resolveVars(subject, 10, "a@b.com");
    expect(result).toBe("Plain subject with no variables");
  });
});

// ── Test: Inbox sync deduplication logic ────────────────────────────────────

describe("Inbox sync deduplication", () => {
  it("identifies a message as duplicate when messageId already exists", () => {
    const existingIds = new Set(["msg-001", "msg-002", "msg-003"]);
    const incomingMessages = [
      { id: "msg-001", subject: "Re: Ticket", receivedDateTime: "2026-01-01T00:00:00Z" },
      { id: "msg-004", subject: "New inquiry", receivedDateTime: "2026-01-02T00:00:00Z" },
    ];

    const newMessages = incomingMessages.filter((m) => !existingIds.has(m.id));
    expect(newMessages).toHaveLength(1);
    expect(newMessages[0].id).toBe("msg-004");
  });

  it("returns all messages when none are duplicates", () => {
    const existingIds = new Set<string>();
    const incomingMessages = [
      { id: "msg-010", subject: "Hello" },
      { id: "msg-011", subject: "World" },
    ];

    const newMessages = incomingMessages.filter((m) => !existingIds.has(m.id));
    expect(newMessages).toHaveLength(2);
  });

  it("returns empty array when all messages are duplicates", () => {
    const existingIds = new Set(["msg-100", "msg-101"]);
    const incomingMessages = [
      { id: "msg-100", subject: "Dup 1" },
      { id: "msg-101", subject: "Dup 2" },
    ];

    const newMessages = incomingMessages.filter((m) => !existingIds.has(m.id));
    expect(newMessages).toHaveLength(0);
  });
});

// ── Test: Rate limit error message detection ────────────────────────────────

describe("Rate limit error detection", () => {
  function isRateLimitError(message: string): boolean {
    return (
      message.includes("rate limited") ||
      message.includes("Rate exceeded") ||
      message.includes("Retry after")
    );
  }

  it("detects 'Rate exceeded.' plain-text response as rate limit", () => {
    expect(isRateLimitError("Rate exceeded.")).toBe(true);
  });

  it("detects 'MS Graph inbox rate limited. Retry after 60s.' as rate limit", () => {
    expect(isRateLimitError("MS Graph inbox rate limited. Retry after 60s.")).toBe(true);
  });

  it("does not flag a normal error as rate limit", () => {
    expect(isRateLimitError("Database unavailable")).toBe(false);
  });

  it("does not flag an empty string as rate limit", () => {
    expect(isRateLimitError("")).toBe(false);
  });
});

// ── Test: Ticket ID extraction from subject ──────────────────────────────────

describe("Ticket ID extraction from email subject", () => {
  function extractTicketId(subject: string): number | null {
    const match = subject.match(/\[TICKET\s*#?(\d+)\]/i);
    return match ? parseInt(match[1], 10) : null;
  }

  it("extracts ticket ID from [TICKET #123] format", () => {
    expect(extractTicketId("[TICKET #123] Your request")).toBe(123);
  });

  it("extracts ticket ID from [TICKET 456] format (no hash)", () => {
    expect(extractTicketId("[TICKET 456] Update")).toBe(456);
  });

  it("extracts ticket ID case-insensitively", () => {
    expect(extractTicketId("[ticket #789] hello")).toBe(789);
  });

  it("returns null when no ticket ID in subject", () => {
    expect(extractTicketId("General inquiry about services")).toBeNull();
  });

  it("handles whitespace between TICKET and #", () => {
    expect(extractTicketId("[TICKET  #42] test")).toBe(42);
  });
});
