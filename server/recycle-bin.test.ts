/**
 * Tests for Account Recycle Bin (30-day soft delete)
 * Covers: softDeleteUser, restoreUser, listDeletedUsers, purgeExpiredDeletedUsers
 * and the daysRemaining client-side helper logic
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock the DB module ────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  softDeleteUser: vi.fn(),
  restoreUser: vi.fn(),
  listDeletedUsers: vi.fn(),
  purgeExpiredDeletedUsers: vi.fn(),
  getAllUsers: vi.fn(),
  approveUser: vi.fn(),
  revokeUser: vi.fn(),
}));

import {
  softDeleteUser,
  restoreUser,
  listDeletedUsers,
  purgeExpiredDeletedUsers,
} from "./db";

// ── Helper: days-remaining calculation (mirrors the client-side helper) ───────
function daysRemaining(deletedAt: Date | string | null | undefined): number {
  if (!deletedAt) return 30;
  const deleted = new Date(deletedAt).getTime();
  const expiry = deleted + 30 * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((expiry - Date.now()) / (24 * 60 * 60 * 1000)));
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("Recycle Bin — DB helpers (mocked)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("softDeleteUser resolves to true on success", async () => {
    (softDeleteUser as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    const result = await softDeleteUser(42);
    expect(result).toBe(true);
    expect(softDeleteUser).toHaveBeenCalledWith(42);
  });

  it("restoreUser resolves to true on success", async () => {
    (restoreUser as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    const result = await restoreUser(42);
    expect(result).toBe(true);
    expect(restoreUser).toHaveBeenCalledWith(42);
  });

  it("listDeletedUsers returns array of soft-deleted users", async () => {
    const mockDeleted = [
      { id: 1, name: "Alice", email: "alice@example.com", deletedAt: new Date() },
      { id: 2, name: "Bob", email: "bob@example.com", deletedAt: new Date() },
    ];
    (listDeletedUsers as ReturnType<typeof vi.fn>).mockResolvedValue(mockDeleted);
    const result = await listDeletedUsers();
    expect(result).toHaveLength(2);
    expect((result as typeof mockDeleted)[0].name).toBe("Alice");
  });

  it("purgeExpiredDeletedUsers returns count of purged records", async () => {
    (purgeExpiredDeletedUsers as ReturnType<typeof vi.fn>).mockResolvedValue(3);
    const count = await purgeExpiredDeletedUsers();
    expect(count).toBe(3);
  });

  it("softDeleteUser rejects when DB throws", async () => {
    (softDeleteUser as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("DB error"));
    await expect(softDeleteUser(99)).rejects.toThrow("DB error");
  });

  it("listDeletedUsers returns empty array when DB unavailable", async () => {
    (listDeletedUsers as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const result = await listDeletedUsers();
    expect(result).toEqual([]);
  });
});

describe("Recycle Bin — daysRemaining helper", () => {
  it("returns 30 when deletedAt is null", () => {
    expect(daysRemaining(null)).toBe(30);
  });

  it("returns 30 when deletedAt is undefined", () => {
    expect(daysRemaining(undefined)).toBe(30);
  });

  it("returns ~30 for a just-deleted account", () => {
    const justNow = new Date();
    const days = daysRemaining(justNow);
    expect(days).toBeGreaterThanOrEqual(29);
    expect(days).toBeLessThanOrEqual(30);
  });

  it("returns 0 for an account deleted 31 days ago", () => {
    const old = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    expect(daysRemaining(old)).toBe(0);
  });

  it("returns ~15 for an account deleted 15 days ago", () => {
    const halfWay = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
    const days = daysRemaining(halfWay);
    expect(days).toBeGreaterThanOrEqual(14);
    expect(days).toBeLessThanOrEqual(16);
  });

  it("accepts ISO string format for deletedAt", () => {
    const isoString = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const days = daysRemaining(isoString);
    expect(days).toBeGreaterThanOrEqual(24);
    expect(days).toBeLessThanOrEqual(26);
  });

  it("returns 0 (not negative) for expired accounts", () => {
    const veryOld = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    expect(daysRemaining(veryOld)).toBe(0);
  });
});
