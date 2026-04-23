import { describe, it, expect } from "vitest";
import {
  buildTicketConfirmationEmail,
  formatCategory,
  getPriorityDetails,
  formatChannel,
  formatReceivedAt,
} from "./emailTemplates";

describe("emailTemplates", () => {
  describe("formatCategory", () => {
    it("maps bug_report to Technical Issue", () => {
      expect(formatCategory("bug_report")).toBe("Technical Issue");
    });
    it("maps general_support to General Support", () => {
      expect(formatCategory("general_support")).toBe("General Support");
    });
    it("maps billing to Billing & Accounts", () => {
      expect(formatCategory("billing")).toBe("Billing & Accounts");
    });
    it("maps feature_request to Feature Request", () => {
      expect(formatCategory("feature_request")).toBe("Feature Request");
    });
    it("handles unknown categories by title-casing them", () => {
      expect(formatCategory("custom_category")).toBe("Custom Category");
    });
  });

  describe("getPriorityDetails", () => {
    it("returns correct SLA for critical", () => {
      const d = getPriorityDetails("critical");
      expect(d.sla).toBe("1 business hour");
      expect(d.color).toBe("#ef4444");
    });
    it("returns correct SLA for high", () => {
      expect(getPriorityDetails("high").sla).toBe("4 business hours");
    });
    it("returns correct SLA for medium", () => {
      expect(getPriorityDetails("medium").sla).toBe("1 business day");
    });
    it("returns correct SLA for low", () => {
      expect(getPriorityDetails("low").sla).toBe("3 business days");
    });
    it("returns default for unknown priority", () => {
      expect(getPriorityDetails("unknown").sla).toBe("2 business days");
    });
  });

  describe("formatChannel", () => {
    it("maps email to Email", () => {
      expect(formatChannel("email")).toBe("Email");
    });
    it("maps web_form to Web Form", () => {
      expect(formatChannel("web_form")).toBe("Web Form");
    });
    it("maps chat to Live Chat", () => {
      expect(formatChannel("chat")).toBe("Live Chat");
    });
    it("maps teams to Microsoft Teams", () => {
      expect(formatChannel("teams")).toBe("Microsoft Teams");
    });
  });

  describe("formatReceivedAt", () => {
    it("returns a non-empty string", () => {
      const result = formatReceivedAt(new Date("2025-01-15T14:00:00Z"));
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(10);
    });
    it("includes the year", () => {
      const result = formatReceivedAt(new Date("2025-06-01T10:00:00Z"));
      expect(result).toContain("2025");
    });
  });

  describe("buildTicketConfirmationEmail", () => {
    const testData = {
      firstName: "Harry",
      ticketNumber: 42,
      ticketTitle: "Cannot access Microsoft Teams",
      category: "Technical Issue",
      priority: "high",
      channel: "Email",
      receivedAt: "Wednesday, January 15, 2025 at 9:00 AM EST",
      slaWindow: "4 business hours",
      ticketUrl: "https://gigitekai.com/helpdesk/ticket/42",
    };

    it("builds a valid HTML string", () => {
      const html = buildTicketConfirmationEmail(testData);
      expect(typeof html).toBe("string");
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("</html>");
    });

    it("includes the first name", () => {
      const html = buildTicketConfirmationEmail(testData);
      expect(html).toContain("Hi Harry,");
    });

    it("includes the ticket number", () => {
      const html = buildTicketConfirmationEmail(testData);
      expect(html).toContain("#42");
    });

    it("includes the ticket title", () => {
      const html = buildTicketConfirmationEmail(testData);
      expect(html).toContain("Cannot access Microsoft Teams");
    });

    it("includes the SLA window", () => {
      const html = buildTicketConfirmationEmail(testData);
      expect(html).toContain("4 business hours");
    });

    it("includes the ticket URL", () => {
      const html = buildTicketConfirmationEmail(testData);
      expect(html).toContain("https://gigitekai.com/helpdesk/ticket/42");
    });

    it("includes the GigitekAI brand name", () => {
      const html = buildTicketConfirmationEmail(testData);
      expect(html).toContain("GIGITEKAI");
    });

    it("includes the support email in footer", () => {
      const html = buildTicketConfirmationEmail(testData);
      expect(html).toContain("support@gigitekai.com");
    });

    it("uses inline CSS (no external stylesheets)", () => {
      const html = buildTicketConfirmationEmail(testData);
      expect(html).not.toContain('<link rel="stylesheet"');
      expect(html).not.toContain('@import url(');
    });

    it("shows high priority color for high priority tickets", () => {
      const html = buildTicketConfirmationEmail({ ...testData, priority: "high" });
      expect(html).toContain("#f97316"); // orange for high
    });

    it("shows red color for critical priority tickets", () => {
      const html = buildTicketConfirmationEmail({ ...testData, priority: "critical" });
      expect(html).toContain("#ef4444"); // red for critical
    });
  });
});
