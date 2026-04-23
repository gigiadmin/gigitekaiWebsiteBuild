import { describe, it, expect, vi, beforeEach } from "vitest";
import { runEmailFlowE2ECheck, getEmailFlowE2EHistory } from "./schedulers/emailFlowE2ECheck";

// Mock the email module
vi.mock("./_core/email", () => ({
  getMsGraphToken: vi.fn(),
  sendEmail: vi.fn(),
  fetchInboxFromMsGraph: vi.fn(),
}));

// Mock the notification module
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

import { getMsGraphToken, sendEmail, fetchInboxFromMsGraph } from "./_core/email";
import { notifyOwner } from "./_core/notification";

const mockGetToken = getMsGraphToken as ReturnType<typeof vi.fn>;
const mockSendEmail = sendEmail as ReturnType<typeof vi.fn>;
const mockFetchInbox = fetchInboxFromMsGraph as ReturnType<typeof vi.fn>;
const mockNotify = notifyOwner as ReturnType<typeof vi.fn>;

// Build a fake JWT with roles
function fakeToken(roles: string[]): string {
  const header = Buffer.from(JSON.stringify({ alg: "RS256" })).toString("base64");
  const payload = Buffer.from(JSON.stringify({ roles })).toString("base64");
  return `${header}.${payload}.fakesig`;
}

describe("Daily Email Flow E2E Check", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes when token, send, and read all succeed", async () => {
    mockGetToken.mockResolvedValue(fakeToken(["Mail.Send", "Mail.Read"]));
    mockSendEmail.mockResolvedValue(true);
    mockFetchInbox.mockResolvedValue([
      { id: "1", subject: "Test", from: null, toRecipients: [], receivedDateTime: "", bodyPreview: "", body: { content: "", contentType: "HTML" }, isRead: false, conversationId: null },
    ]);

    const result = await runEmailFlowE2ECheck();

    expect(result.tokenOk).toBe(true);
    expect(result.tokenRoles).toContain("Mail.Send");
    expect(result.tokenRoles).toContain("Mail.Read");
    expect(result.sendOk).toBe(true);
    expect(result.readOk).toBe(true);
    expect(result.inboxCount).toBe(1);
    expect(result.error).toBeUndefined();
  });

  it("fails when token acquisition fails", async () => {
    mockGetToken.mockResolvedValue(null);

    const result = await runEmailFlowE2ECheck();

    expect(result.tokenOk).toBe(false);
    expect(result.error).toContain("Failed to acquire MS Graph token");
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.stringContaining("FAILED") })
    );
  });

  it("fails when token is missing Mail.Send role", async () => {
    mockGetToken.mockResolvedValue(fakeToken(["Mail.Read"]));

    const result = await runEmailFlowE2ECheck();

    expect(result.tokenOk).toBe(true);
    expect(result.error).toContain("Token missing required roles");
    expect(result.error).toContain("Mail.Send: false");
  });

  it("fails when token is missing Mail.Read role", async () => {
    mockGetToken.mockResolvedValue(fakeToken(["Mail.Send"]));

    const result = await runEmailFlowE2ECheck();

    expect(result.tokenOk).toBe(true);
    expect(result.error).toContain("Token missing required roles");
    expect(result.error).toContain("Mail.Read: false");
  });

  it("fails when sendEmail returns false", async () => {
    mockGetToken.mockResolvedValue(fakeToken(["Mail.Send", "Mail.Read"]));
    mockSendEmail.mockResolvedValue(false);

    const result = await runEmailFlowE2ECheck();

    expect(result.tokenOk).toBe(true);
    expect(result.sendOk).toBe(false);
    expect(result.error).toContain("sendEmail() returned false");
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.stringContaining("FAILED") })
    );
  });

  it("sends success notification when all checks pass", async () => {
    mockGetToken.mockResolvedValue(fakeToken(["Mail.Send", "Mail.Read"]));
    mockSendEmail.mockResolvedValue(true);
    mockFetchInbox.mockResolvedValue([]);

    await runEmailFlowE2ECheck();

    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.stringContaining("All Passed") })
    );
  });

  it("stores results in history", async () => {
    mockGetToken.mockResolvedValue(fakeToken(["Mail.Send", "Mail.Read"]));
    mockSendEmail.mockResolvedValue(true);
    mockFetchInbox.mockResolvedValue([]);

    await runEmailFlowE2ECheck();

    const history = getEmailFlowE2EHistory();
    expect(history.length).toBeGreaterThan(0);
    expect(history[history.length - 1].tokenOk).toBe(true);
  });

  it("handles exceptions gracefully", async () => {
    mockGetToken.mockRejectedValue(new Error("Network timeout"));

    const result = await runEmailFlowE2ECheck();

    expect(result.error).toContain("Network timeout");
    expect(mockNotify).toHaveBeenCalled();
  });
});
