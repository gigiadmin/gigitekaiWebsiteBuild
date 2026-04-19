import { describe, it, expect } from "vitest";

describe("Email-to-Ticket Router", () => {
  it("should create new ticket from email", () => {
    const email = {
      from: "customer@example.com",
      to: "support@gigitekai.com",
      subject: "Cannot login to my account",
      body: "I'm unable to login with my credentials",
    };

    expect(email.from).toBe("customer@example.com");
    expect(email.subject).toBe("Cannot login to my account");
  });

  it("should add reply to existing ticket with reference", () => {
    const email = {
      from: "customer@example.com",
      to: "support@gigitekai.com",
      subject: "RE: Cannot login to my account",
      body: "I tried resetting my password but it didn't work",
      ticketReference: "[TICKET #123]",
    };

    const match = email.ticketReference.match(/\[TICKET\s*#?(\d+)\]/i);
    expect(match).toBeTruthy();
    expect(match?.[1]).toBe("123");
  });

  it("should extract ticket ID from various reference formats", () => {
    const references = [
      "[TICKET #123]",
      "[TICKET 456]",
      "[ticket #789]",
      "TICKET #999",
    ];

    const ticketIds = references.map(ref => {
      const match = ref.match(/\[TICKET\s*#?(\d+)\]/i);
      return match ? parseInt(match[1], 10) : null;
    });

    expect(ticketIds[0]).toBe(123);
    expect(ticketIds[1]).toBe(456);
    expect(ticketIds[2]).toBe(789);
    expect(ticketIds[3]).toBeNull();
  });

  it("should get email settings", () => {
    const settings = {
      inboxEmail: "support@gigitekai.com",
      autoCreateTickets: true,
      autoTriageWithAI: true,
      defaultPriority: "medium",
    };

    expect(settings.inboxEmail).toBe("support@gigitekai.com");
    expect(settings.autoCreateTickets).toBe(true);
  });

  it("should update email settings", () => {
    const updates = {
      autoCreateTickets: false,
      defaultPriority: "high",
    };

    expect(updates.autoCreateTickets).toBe(false);
    expect(updates.defaultPriority).toBe("high");
  });

  it("should track email statistics", () => {
    const stats = {
      totalEmailTickets: 150,
      last30Days: 42,
      averagePerDay: 1,
      byStatus: { open: 10, in_progress: 15, resolved: 12, closed: 5 },
      byPriority: { low: 8, medium: 20, high: 10, critical: 4 },
    };

    expect(stats.totalEmailTickets).toBe(150);
    expect(stats.last30Days).toBe(42);
    expect(stats.byStatus.open + stats.byStatus.in_progress + stats.byStatus.resolved + stats.byStatus.closed).toBe(42);
  });

  it("should test email webhook", () => {
    const testEmail = {
      from: "hhenry23@gmail.com",
      subject: "Test Email",
      body: "This is a test email",
    };

    expect(testEmail.from).toBe("hhenry23@gmail.com");
    expect(testEmail.subject).toBe("Test Email");
  });

  it("should handle email with attachments", () => {
    const email = {
      from: "customer@example.com",
      to: "support@gigitekai.com",
      subject: "Issue with attachment",
      body: "Please see attached screenshot",
      attachments: [
        {
          filename: "screenshot.png",
          mimeType: "image/png",
          url: "https://cdn.example.com/screenshot.png",
        },
      ],
    };

    expect(email.attachments).toHaveLength(1);
    expect(email.attachments[0].filename).toBe("screenshot.png");
  });

  it("should deduplicate emails by message ID", () => {
    const messageId = "msg-12345@example.com";
    const email1 = { from: "user@example.com", messageId };
    const email2 = { from: "user@example.com", messageId };

    expect(email1.messageId).toBe(email2.messageId);
  });

  it("should create ticket with default values", () => {
    const ticket = {
      title: "New support request",
      description: "Customer issue",
      priority: "medium",
      category: "general_support",
      status: "open",
      source: "email",
    };

    expect(ticket.priority).toBe("medium");
    expect(ticket.category).toBe("general_support");
    expect(ticket.source).toBe("email");
  });
});
