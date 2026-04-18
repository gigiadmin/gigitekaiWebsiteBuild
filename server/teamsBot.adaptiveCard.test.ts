import { describe, it, expect } from "vitest";
import { buildTicketCard, buildQuickReplyCard, buildStatusUpdateCard } from "./teamsBot.adaptiveCard";

describe("Teams Adaptive Card Builder", () => {
  describe("buildTicketCard", () => {
    it("should build a valid adaptive card for a ticket", () => {
      const card = buildTicketCard({
        ticketId: 123,
        title: "Login Issue",
        description: "Cannot login to account",
        priority: "high",
        status: "open",
        category: "account_access",
        customerName: "John Doe",
        createdAt: new Date("2026-04-18"),
      });

      expect(card.type).toBe("message");
      expect(card.attachments).toBeDefined();
      expect(card.attachments[0].contentType).toBe("application/vnd.microsoft.card.adaptive");
    });

    it("should include ticket ID in card", () => {
      const card = buildTicketCard({
        ticketId: 456,
        title: "Test",
        description: "Test description",
        priority: "low",
        status: "resolved",
        category: "general",
        customerName: "Jane Doe",
        createdAt: new Date(),
      });

      const content = card.attachments[0].content;
      expect(content).toBeDefined();
      expect(content.body).toBeDefined();
    });

    it("should include priority in card", () => {
      const card = buildTicketCard({
        ticketId: 789,
        title: "Critical Issue",
        description: "System down",
        priority: "critical",
        status: "in_progress",
        category: "system",
        customerName: "Admin",
        createdAt: new Date(),
      });

      const content = card.attachments[0].content;
      expect(content.body).toBeDefined();
      expect(content.body.length).toBeGreaterThan(0);
    });

    it("should include action buttons", () => {
      const card = buildTicketCard({
        ticketId: 999,
        title: "Test",
        description: "Test",
        priority: "medium",
        status: "open",
        category: "general",
        customerName: "Test User",
        createdAt: new Date(),
      });

      const content = card.attachments[0].content;
      expect(content.actions).toBeDefined();
      expect(content.actions.length).toBeGreaterThan(0);
    });

    it("should support custom base URL", () => {
      const customUrl = "https://custom.example.com";
      const card = buildTicketCard({
        ticketId: 111,
        title: "Test",
        description: "Test",
        priority: "low",
        status: "closed",
        category: "general",
        customerName: "Test",
        createdAt: new Date(),
        baseUrl: customUrl,
      });

      const content = card.attachments[0].content;
      const action = content.actions[0];
      expect(action.url).toContain(customUrl);
    });
  });

  describe("buildQuickReplyCard", () => {
    it("should build a quick reply card", () => {
      const card = buildQuickReplyCard(123, "Test Ticket");

      expect(card.type).toBe("message");
      expect(card.attachments).toBeDefined();
      expect(card.attachments[0].contentType).toBe("application/vnd.microsoft.card.adaptive");
    });

    it("should include ticket ID in quick reply card", () => {
      const card = buildQuickReplyCard(456, "Another Ticket");

      const content = card.attachments[0].content;
      expect(content.body).toBeDefined();
      expect(content.body.length).toBeGreaterThan(0);
    });

    it("should include submit action", () => {
      const card = buildQuickReplyCard(999, "Test");

      const content = card.attachments[0].content;
      const submitAction = content.actions.find((action: any) => action.type === "Action.Submit");
      expect(submitAction).toBeDefined();
      expect(submitAction.data.action).toBe("reply");
    });
  });

  describe("buildStatusUpdateCard", () => {
    it("should build a status update card", () => {
      const card = buildStatusUpdateCard(123, "open");

      expect(card.type).toBe("message");
      expect(card.attachments).toBeDefined();
    });

    it("should include status in card", () => {
      const card = buildStatusUpdateCard(456, "in_progress");

      const content = card.attachments[0].content;
      expect(content.body).toBeDefined();
      expect(content.body.length).toBeGreaterThan(0);
    });

    it("should include update action", () => {
      const card = buildStatusUpdateCard(999, "resolved");

      const content = card.attachments[0].content;
      const updateAction = content.actions[0];
      expect(updateAction.type).toBe("Action.Submit");
      expect(updateAction.data.action).toBe("update_status");
    });
  });
});
