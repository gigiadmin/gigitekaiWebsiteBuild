import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const values = vi.fn().mockResolvedValue([{ insertId: 81 }]);
  return {
    values,
    insert: vi.fn(() => ({ values })),
    sendEmail: vi.fn().mockResolvedValue(true),
    sendTeams: vi.fn().mockResolvedValue({ success: true, attempts: 1 }),
  };
});

vi.mock("./db", () => ({
  getDb: vi.fn(async () => ({ insert: mocks.insert })),
  saveContactSubmission: vi.fn(),
  getAllUsers: vi.fn(async () => []),
  approveUser: vi.fn(),
  revokeUser: vi.fn(),
  logUserActivity: vi.fn(),
  getUserActivityByUserId: vi.fn(async () => []),
  getLastLoginByUserId: vi.fn(),
  submitCustomerFeedback: vi.fn(),
  getCustomerFeedbackByTicket: vi.fn(async () => []),
  getAverageRating: vi.fn(),
  recordWebsiteTraffic: vi.fn(),
  getWebsiteTrafficByDate: vi.fn(),
  getWebsiteTrafficSummary: vi.fn(),
  softDeleteUser: vi.fn(),
  restoreUser: vi.fn(),
  listDeletedUsers: vi.fn(async () => []),
  purgeExpiredDeletedUsers: vi.fn(),
  createTicket: vi.fn(),
}));

vi.mock("./_core/email", () => ({ sendEmail: mocks.sendEmail }));
vi.mock("./_core/notification", () => ({ notifyOwner: vi.fn().mockResolvedValue(true) }));
vi.mock("./_core/teamsWebhookUtils", () => ({
  resolveWebhookUrl: vi.fn(() => "https://teams.example.test/webhook"),
  sendToTeamsWithRetry: mocks.sendTeams,
}));

import { appRouter } from "./routers";

describe("contact.submitWebsitePricingInquiry", () => {
  it("stores the inquiry, creates a draft ticket, and notifies the prospect, support, and Teams", async () => {
    const caller = appRouter.createCaller({ user: null, req: {} as any, res: {} as any });
    const result = await caller.contact.submitWebsitePricingInquiry({
      businessName: "Northstar Health",
      industry: "Healthcare",
      description: "A clinic group seeking a secure, modern website.",
      targetAudience: "Local patients and referral partners",
      currentWebsite: "https://northstar.example",
      email: "lead@northstar.example",
      phone: "727-555-0110",
      pricingTier: "growth",
    });

    expect(result.success).toBe(true);
    expect(mocks.values).toHaveBeenCalledTimes(2);
    expect(mocks.sendEmail).toHaveBeenCalledTimes(2);
    expect(mocks.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: "lead@northstar.example" }));
    expect(mocks.sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: "support@gigitekai.com",
      replyTo: "lead@northstar.example",
    }));
    expect(mocks.sendTeams).toHaveBeenCalledWith(
      "https://teams.example.test/webhook",
      expect.objectContaining({ title: expect.stringContaining("Northstar Health") }),
      expect.stringContaining("lead@northstar.example")
    );
  });
});
