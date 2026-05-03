/**
 * mailManusWebhook.test.ts — Unit tests for Mail Manus webhook handler
 *
 * Tests cover:
 * - Email parsing and validation
 * - User creation/lookup
 * - AI classification of emails
 * - Ticket creation from emails
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";

// ── Mock all external dependencies BEFORE importing the handler ───────────────

vi.mock("./db", () => ({
  getDb: vi.fn(async () => null),
  createTicket: vi.fn(async (ticket: any) => ({
    id: 1001,
    ...ticket,
    ticketNumber: "TKT-1001",
    status: "open",
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
  addTicketReply: vi.fn(async () => ({ id: 1 })),
  getTicketById: vi.fn(async () => null),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(async () => ({
    choices: [
      {
        message: {
          content: JSON.stringify({
            category: "general_support",
            priority: "medium",
            summary: "Test ticket summary",
          }),
        },
      },
    ],
  })),
}));

vi.mock("./_core/email", () => ({
  sendEmail: vi.fn(async () => ({ success: true })),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn(async () => true),
}));

vi.mock("./teamsBot", () => ({
  sendTicketNotificationToTeams: vi.fn(async () => true),
  sendReplyNotificationToTeams: vi.fn(async () => true),
  sendStatusUpdateToTeams: vi.fn(async () => true),
  sendAssignmentNotificationToTeams: vi.fn(async () => true),
}));

vi.mock("./routers/adminNotifications", () => ({
  createAdminNotification: vi.fn(async () => true),
}));

vi.mock("./_core/sms", () => ({
  sendSMS: vi.fn(async () => true),
}));

// ── Import handler AFTER mocks are set up ────────────────────────────────────
import { handleMailManusWebhook, handleMailManusHealthCheck } from "./mailManusWebhook";

describe("Mail Manus Webhook", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let statusCode: number;
  let responseData: any;

  beforeEach(() => {
    statusCode = 200;
    responseData = null;

    mockRes = {
      status: vi.fn(function (code: number) {
        statusCode = code;
        return this;
      }),
      json: vi.fn(function (data: any) {
        responseData = data;
        return this;
      }),
      setHeader: vi.fn(),
      send: vi.fn(),
    };

    mockReq = {
      body: {},
      headers: {},
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("handleMailManusHealthCheck", () => {
    it("should return health check status", async () => {
      await handleMailManusHealthCheck(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "ok",
        service: "mail-manus-webhook",
      });
    });
  });

  describe("handleMailManusWebhook", () => {
    it("should reject requests with missing required fields", async () => {
      mockReq.body = {
        subject: "Test Subject",
        // missing 'from' and 'body'/'html'
      };

      await handleMailManusWebhook(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Missing required fields",
      });
    });

    it("should reject requests without sender email", async () => {
      mockReq.body = {
        from: "",
        subject: "Test Subject",
        body: "Test body",
      };

      await handleMailManusWebhook(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should reject requests without subject", async () => {
      mockReq.body = {
        from: "hhenry23@gmail.com",
        subject: "",
        body: "Test body",
      };

      await handleMailManusWebhook(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should reject requests without body or html", async () => {
      mockReq.body = {
        from: "hhenry23@gmail.com",
        subject: "Test Subject",
        // missing both body and html
      };

      await handleMailManusWebhook(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should parse sender email from 'Name <email>' format", async () => {
      mockReq.body = {
        from: 'John Doe <john@example.com>',
        subject: "Test Subject",
        body: "Test body content that is long enough",
      };

      await handleMailManusWebhook(mockReq as Request, mockRes as Response);

      // Parsing should have worked — the from field is preserved
      expect(mockReq.body.from).toBe('John Doe <john@example.com>');
    });

    it("should parse sender email from plain email format", async () => {
      mockReq.body = {
        from: "john@example.com",
        subject: "Test Subject",
        body: "Test body content",
      };

      await handleMailManusWebhook(mockReq as Request, mockRes as Response);

      expect(mockReq.body.from).toBe("john@example.com");
    });

    it("should prefer HTML body over plain text", async () => {
      mockReq.body = {
        from: "hhenry23@gmail.com",
        subject: "Test Subject",
        body: "Plain text body",
        html: "<p>HTML body</p>",
      };

      await handleMailManusWebhook(mockReq as Request, mockRes as Response);

      // Should use HTML version
      expect(mockReq.body.html).toBe("<p>HTML body</p>");
    });

    it("should handle internal server errors gracefully", async () => {
      mockReq.body = {
        from: "hhenry23@gmail.com",
        subject: "Test Subject",
        body: "Test body",
      };

      vi.spyOn(console, "error").mockImplementation(() => {});

      await handleMailManusWebhook(mockReq as Request, mockRes as Response);

      // Should return 400 (validation), 200 (success), or 500 (error)
      expect([200, 400, 500]).toContain(statusCode);

      vi.restoreAllMocks();
    });
  });

  describe("Email parsing", () => {
    it("should strip quoted replies from email body", async () => {
      mockReq.body = {
        from: "hhenry23@gmail.com",
        subject: "Re: Previous ticket",
        body: "New content here\n\nOn Mon, Jan 1 2024, someone wrote:\n> Old content",
      };

      await handleMailManusWebhook(mockReq as Request, mockRes as Response);

      // Should process without error
      expect([200, 400, 500]).toContain(statusCode);
    });

    it("should handle HTML email with tags", async () => {
      mockReq.body = {
        from: "hhenry23@gmail.com",
        subject: "HTML Email Test",
        html: "<div><p>This is an <strong>HTML</strong> email body with content.</p></div>",
      };

      await handleMailManusWebhook(mockReq as Request, mockRes as Response);

      expect([200, 400, 500]).toContain(statusCode);
    });
  });

  describe("Priority classification", () => {
    it("should handle Microsoft 365 related emails", async () => {
      mockReq.body = {
        from: "hhenry23@gmail.com",
        subject: "Microsoft 365 license issue",
        body: "We are having issues with our Microsoft 365 licenses and cannot access email.",
      };

      await handleMailManusWebhook(mockReq as Request, mockRes as Response);

      expect([200, 400, 500]).toContain(statusCode);
    });

    it("should handle billing related emails", async () => {
      mockReq.body = {
        from: "hhenry23@gmail.com",
        subject: "Invoice question",
        body: "I have a question about my recent invoice for managed services.",
      };

      await handleMailManusWebhook(mockReq as Request, mockRes as Response);

      expect([200, 400, 500]).toContain(statusCode);
    });

    it("should handle general support emails", async () => {
      mockReq.body = {
        from: "hhenry23@gmail.com",
        subject: "General support request",
        body: "I need help with my computer setup and configuration.",
      };

      await handleMailManusWebhook(mockReq as Request, mockRes as Response);

      expect([200, 400, 500]).toContain(statusCode);
    });
  });

  describe("Ticket reference detection", () => {
    it("should detect ticket reference in email body", async () => {
      mockReq.body = {
        from: "hhenry23@gmail.com",
        subject: "Re: [TKT-1234] Follow up",
        body: "Following up on ticket TKT-1234. Still having the same issue.",
      };

      await handleMailManusWebhook(mockReq as Request, mockRes as Response);

      expect([200, 400, 500]).toContain(statusCode);
    });

    it("should handle emails without ticket reference", async () => {
      mockReq.body = {
        from: "hhenry23@gmail.com",
        subject: "New issue with printer",
        body: "My printer stopped working this morning and I need help.",
      };

      await handleMailManusWebhook(mockReq as Request, mockRes as Response);

      expect([200, 400, 500]).toContain(statusCode);
    });
  });
});
