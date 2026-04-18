import { describe, it, expect } from "vitest";
import { extractTicketId, parseCommand, getWelcomeMessage } from "./teamsBot.messageHandler";

describe("Teams Bot Message Handler", () => {
  describe("extractTicketId", () => {
    it("should extract ticket ID from [TICKET #123] format", () => {
      expect(extractTicketId("[TICKET #123] Help with login")).toBe(123);
    });

    it("should extract ticket ID from #123 format", () => {
      expect(extractTicketId("Please help with #456")).toBe(456);
    });

    it("should extract ticket ID from ticket 789 format", () => {
      expect(extractTicketId("ticket 789 needs urgent attention")).toBe(789);
    });

    it("should be case-insensitive", () => {
      expect(extractTicketId("[ticket #999] Help")).toBe(999);
    });

    it("should return null if no ticket ID found", () => {
      expect(extractTicketId("No ticket reference here")).toBeNull();
    });

    it("should extract first ticket ID if multiple present", () => {
      expect(extractTicketId("[TICKET #111] and #222")).toBe(111);
    });
  });

  describe("parseCommand", () => {
    it("should parse /status command", () => {
      const result = parseCommand("/status resolved");
      expect(result?.command).toBe("status");
      expect(result?.args).toEqual(["resolved"]);
    });

    it("should parse /priority command with argument", () => {
      const result = parseCommand("/priority high");
      expect(result?.command).toBe("priority");
      expect(result?.args).toEqual(["high"]);
    });

    it("should parse /assign command", () => {
      const result = parseCommand("/assign @john");
      expect(result?.command).toBe("assign");
      expect(result?.args).toEqual(["@john"]);
    });

    it("should be case-insensitive for command", () => {
      const result = parseCommand("/STATUS resolved");
      expect(result?.command).toBe("status");
    });

    it("should return null for non-command messages", () => {
      expect(parseCommand("This is a regular message")).toBeNull();
    });

    it("should handle multiple arguments", () => {
      const result = parseCommand("/assign @john @jane");
      expect(result?.command).toBe("assign");
      expect(result?.args).toEqual(["@john", "@jane"]);
    });
  });

  describe("getWelcomeMessage", () => {
    it("should return welcome message with instructions", () => {
      const message = getWelcomeMessage();
      expect(message).toContain("GigitekAI Helpdesk Bot");
      expect(message).toContain("TICKET #123");
      expect(message).toContain("/status");
      expect(message).toContain("/priority");
    });

    it("should include supported statuses in welcome message", () => {
      const message = getWelcomeMessage();
      expect(message).toContain("open");
      expect(message).toContain("in_progress");
      expect(message).toContain("resolved");
      expect(message).toContain("closed");
    });

    it("should include supported priorities in welcome message", () => {
      const message = getWelcomeMessage();
      expect(message).toContain("critical");
      expect(message).toContain("high");
      expect(message).toContain("medium");
      expect(message).toContain("low");
    });
  });
});
