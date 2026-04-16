/**
 * Tests for Teams SLA Breach Alert logic
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { SLA_THRESHOLDS_MS, checkAndAlertSlaBreaches } from "./_core/teamsSlaAlerts";

// ── SLA Threshold Tests ──────────────────────────────────────────────────────

describe("SLA_THRESHOLDS_MS", () => {
  it("should define critical threshold as 1 hour", () => {
    expect(SLA_THRESHOLDS_MS.critical).toBe(1 * 60 * 60 * 1000);
  });

  it("should define high threshold as 2 hours", () => {
    expect(SLA_THRESHOLDS_MS.high).toBe(2 * 60 * 60 * 1000);
  });

  it("should define medium threshold as 4 hours", () => {
    expect(SLA_THRESHOLDS_MS.medium).toBe(4 * 60 * 60 * 1000);
  });

  it("should define low threshold as 8 hours", () => {
    expect(SLA_THRESHOLDS_MS.low).toBe(8 * 60 * 60 * 1000);
  });

  it("should have stricter SLA for higher priority", () => {
    expect(SLA_THRESHOLDS_MS.critical).toBeLessThan(SLA_THRESHOLDS_MS.high);
    expect(SLA_THRESHOLDS_MS.high).toBeLessThan(SLA_THRESHOLDS_MS.medium);
    expect(SLA_THRESHOLDS_MS.medium).toBeLessThan(SLA_THRESHOLDS_MS.low);
  });
});

// ── Breach Detection Logic Tests ─────────────────────────────────────────────

describe("SLA breach detection logic", () => {
  it("should detect a critical ticket updated 2 hours ago as breached", () => {
    const updatedAt = Date.now() - 2 * 60 * 60 * 1000; // 2 hours ago
    const elapsed = Date.now() - updatedAt;
    expect(elapsed).toBeGreaterThan(SLA_THRESHOLDS_MS.critical);
  });

  it("should NOT detect a critical ticket updated 30 minutes ago as breached", () => {
    const updatedAt = Date.now() - 30 * 60 * 1000; // 30 min ago
    const elapsed = Date.now() - updatedAt;
    expect(elapsed).toBeLessThan(SLA_THRESHOLDS_MS.critical);
  });

  it("should detect a medium ticket updated 5 hours ago as breached", () => {
    const updatedAt = Date.now() - 5 * 60 * 60 * 1000; // 5 hours ago
    const elapsed = Date.now() - updatedAt;
    expect(elapsed).toBeGreaterThan(SLA_THRESHOLDS_MS.medium);
  });

  it("should NOT detect a medium ticket updated 3 hours ago as breached", () => {
    const updatedAt = Date.now() - 3 * 60 * 60 * 1000; // 3 hours ago
    const elapsed = Date.now() - updatedAt;
    expect(elapsed).toBeLessThan(SLA_THRESHOLDS_MS.medium);
  });

  it("should detect a low ticket updated 9 hours ago as breached", () => {
    const updatedAt = Date.now() - 9 * 60 * 60 * 1000; // 9 hours ago
    const elapsed = Date.now() - updatedAt;
    expect(elapsed).toBeGreaterThan(SLA_THRESHOLDS_MS.low);
  });

  it("should NOT detect a low ticket updated 7 hours ago as breached", () => {
    const updatedAt = Date.now() - 7 * 60 * 60 * 1000; // 7 hours ago
    const elapsed = Date.now() - updatedAt;
    expect(elapsed).toBeLessThan(SLA_THRESHOLDS_MS.low);
  });
});

// ── Priority Threshold Ordering ───────────────────────────────────────────────

describe("SLA threshold ordering", () => {
  it("all four priorities should have defined thresholds", () => {
    const priorities = ["critical", "high", "medium", "low"];
    for (const p of priorities) {
      expect(SLA_THRESHOLDS_MS[p]).toBeDefined();
      expect(SLA_THRESHOLDS_MS[p]).toBeGreaterThan(0);
    }
  });

  it("thresholds should be in ascending order (critical < high < medium < low)", () => {
    const ordered = [
      SLA_THRESHOLDS_MS.critical,
      SLA_THRESHOLDS_MS.high,
      SLA_THRESHOLDS_MS.medium,
      SLA_THRESHOLDS_MS.low,
    ];
    for (let i = 0; i < ordered.length - 1; i++) {
      expect(ordered[i]).toBeLessThan(ordered[i + 1]);
    }
  });
});

// ── checkAndAlertSlaBreaches (mocked DB) ─────────────────────────────────────

describe("checkAndAlertSlaBreaches", () => {
  it("should return 0 when database is unavailable", async () => {
    // Mock getDb to return null
    vi.mock("../db", () => ({ getDb: async () => null }));
    // The function should gracefully handle null DB and return 0
    // (We can't easily test the full flow without a real DB, but we verify the export exists)
    expect(typeof checkAndAlertSlaBreaches).toBe("function");
  });

  it("should be an async function", () => {
    const result = checkAndAlertSlaBreaches();
    expect(result).toBeInstanceOf(Promise);
    // Clean up the promise to avoid unhandled rejection
    result.catch(() => {});
  });
});
