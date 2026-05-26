/**
 * Tests for the adminNotifications router and createAdminNotification helper.
 * Uses the same mock pattern as auth.logout.test.ts.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock the WebSocket broadcast (no top-level vars in factory) ───────────────
vi.mock("./_core/websocket", () => ({
  broadcastAdminNotification: vi.fn(),
}));

// ── Mock the database (inline factory, no top-level var refs) ─────────────────
vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

// ── Import after mocks ────────────────────────────────────────────────────────
import { createAdminNotification } from "./routers/adminNotifications";
import { broadcastAdminNotification } from "./_core/websocket";
import { getDb } from "./db";

// ── Helper to build a chainable mock DB ──────────────────────────────────────
function buildMockDb(insertId: number | null = 1) {
  const mockReturningId = vi.fn().mockResolvedValue(insertId !== null ? [{ id: insertId }] : []);
  const mockValues = vi.fn().mockReturnValue({ $returningId: mockReturningId });
  const mockInsert = vi.fn().mockReturnValue({ values: mockValues });

  return { db: { insert: mockInsert }, mockInsert, mockValues, mockReturningId };
}

describe("createAdminNotification helper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inserts a notification record and broadcasts via WebSocket", async () => {
    const { db, mockInsert, mockValues } = buildMockDb(42);
    vi.mocked(getDb).mockResolvedValue(db as any);

    const id = await createAdminNotification({
      type: "new_ticket",
      title: "New Ticket: Test issue",
      body: "From: John · Priority: high",
      href: "/admin/helpdesk",
      priority: "high",
      ticketId: 7,
    });

    // DB insert was called with correct shape
    expect(mockInsert).toHaveBeenCalledOnce();
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "new_ticket",
        title: "New Ticket: Test issue",
        priority: "high",
        isRead: 0,
        ticketId: 7,
      })
    );

    // WS broadcast was called
    expect(broadcastAdminNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 42,
        type: "new_ticket",
        title: "New Ticket: Test issue",
        priority: "high",
      })
    );

    // Returns the new id
    expect(id).toBe(42);
  });

  it("handles new_chat notification type with sessionId", async () => {
    const { db, mockValues } = buildMockDb(99);
    vi.mocked(getDb).mockResolvedValue(db as any);

    const id = await createAdminNotification({
      type: "new_chat",
      title: "New Chat Session Started",
      body: "Alice started a live chat session",
      href: "/admin/chat",
      priority: "high",
      sessionId: 5,
    });

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "new_chat",
        sessionId: 5,
        isRead: 0,
      })
    );
    expect(id).toBe(99);
  });

  it("returns null gracefully when DB is unavailable", async () => {
    vi.mocked(getDb).mockResolvedValueOnce(null as any);

    const id = await createAdminNotification({
      type: "new_ticket",
      title: "Test",
    });

    expect(id).toBeNull();
  });

  it("returns null and logs error when DB insert throws", async () => {
    const mockInsert = vi.fn().mockImplementation(() => {
      throw new Error("DB connection failed");
    });
    vi.mocked(getDb).mockResolvedValue({ insert: mockInsert } as any);

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const id = await createAdminNotification({
      type: "ticket_reply",
      title: "Reply on Ticket #3",
    });

    expect(id).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      "[AdminNotifications] Failed to create notification:",
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });

  it("defaults priority to 'normal' when not provided", async () => {
    const { db, mockValues } = buildMockDb(1);
    vi.mocked(getDb).mockResolvedValue(db as any);

    await createAdminNotification({
      type: "new_ticket",
      title: "Low priority ticket",
    });

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ priority: "normal" })
    );
  });

  it("sets null for optional fields when not provided", async () => {
    const { db, mockValues } = buildMockDb(2);
    vi.mocked(getDb).mockResolvedValue(db as any);

    await createAdminNotification({
      type: "new_ticket",
      title: "Minimal notification",
    });

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        body: null,
        href: null,
        ticketId: null,
        sessionId: null,
      })
    );
  });
});
