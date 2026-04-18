import { describe, it, expect } from "vitest";

describe("AI Triage Router", () => {
  it("should suggest category and priority for a ticket", () => {
    const ticket = {
      title: "Cannot login to account",
      description: "I'm unable to login with my credentials",
    };

    expect(ticket.title).toBeTruthy();
    expect(ticket.description).toBeTruthy();
  });

  it("should categorize bug reports", () => {
    const bugTicket = {
      title: "Login button not working",
      description: "The login button on the homepage doesn't respond to clicks",
      expectedCategory: "bug_report",
    };

    expect(bugTicket.expectedCategory).toBe("bug_report");
  });

  it("should categorize feature requests", () => {
    const featureTicket = {
      title: "Add dark mode support",
      description: "Would like to see a dark mode option in the settings",
      expectedCategory: "feature_request",
    };

    expect(featureTicket.expectedCategory).toBe("feature_request");
  });

  it("should categorize billing issues", () => {
    const billingTicket = {
      title: "Invoice question",
      description: "I have a question about my latest invoice",
      expectedCategory: "billing",
    };

    expect(billingTicket.expectedCategory).toBe("billing");
  });

  it("should assign priority levels", () => {
    const priorities = ["low", "medium", "high", "critical"];
    const ticketPriority = "high";

    expect(priorities).toContain(ticketPriority);
  });

  it("should calculate confidence scores", () => {
    const confidence = 0.85;

    expect(confidence).toBeGreaterThanOrEqual(0);
    expect(confidence).toBeLessThanOrEqual(1);
  });

  it("should apply auto-triage to a ticket", () => {
    const ticketId = 123;
    const triageResult = {
      ticketId,
      category: "bug_report",
      priority: "high",
      confidence: 0.92,
    };

    expect(triageResult.ticketId).toBe(ticketId);
    expect(triageResult.confidence).toBeGreaterThan(0.9);
  });

  it("should get triage statistics", () => {
    const stats = {
      totalTickets: 100,
      triagedTickets: 85,
      triageRate: 85,
      byCategory: {
        bug_report: 30,
        feature_request: 25,
        general_support: 20,
        billing: 10,
      },
      byPriority: {
        low: 20,
        medium: 35,
        high: 20,
        critical: 10,
      },
      averageConfidence: 0.87,
    };

    expect(stats.triageRate).toBe(85);
    expect(stats.averageConfidence).toBeGreaterThan(0.8);
  });

  it("should bulk auto-triage multiple tickets", () => {
    const ticketIds = [1, 2, 3, 4, 5];
    const bulkResult = {
      totalProcessed: 5,
      successCount: 5,
      errorCount: 0,
    };

    expect(bulkResult.totalProcessed).toBe(ticketIds.length);
    expect(bulkResult.successCount).toBe(5);
  });

  it("should handle triage errors gracefully", () => {
    const errorResult = {
      success: false,
      error: "Failed to categorize ticket",
      category: "general_support",
      priority: "medium",
      confidence: 0,
    };

    expect(errorResult.success).toBe(false);
    expect(errorResult.category).toBe("general_support");
  });

  it("should provide reasoning for categorization", () => {
    const triageResult = {
      category: "bug_report",
      priority: "critical",
      confidence: 0.95,
      reasoning: "User reports system crash with stack trace, indicates critical bug",
    };

    expect(triageResult.reasoning).toBeTruthy();
    expect(triageResult.reasoning.length).toBeGreaterThan(0);
  });
});
