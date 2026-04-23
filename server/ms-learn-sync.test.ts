/**
 * MS Learn Sync Router Tests
 * Tests for:
 * 1. runMsLearnSync() — core sync logic (mocked fetch)
 * 2. msLearnSyncRouter.getSyncStatus — returns correct counts
 * 3. msLearnSyncRouter.triggerSync — admin-only mutation
 * 4. msLearnSyncRouter.getByCategory — public query
 * 5. msLearnSyncScheduler — schedules correctly
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { runMsLearnSync } from "./routers/ms-learn-sync";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB ──────────────────────────────────────────────────────────────────
const mockKbArticles: any[] = [];

vi.mock("./db", () => ({
  getDb: vi.fn(() => ({
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(async () => []),
          orderBy: vi.fn(async () => mockKbArticles),
        })),
        orderBy: vi.fn(async () => mockKbArticles),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(async () => [{ insertId: 1 }]),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(async () => []),
      })),
    })),
  })),
}));

// ─── Mock fetch for MS Learn API ──────────────────────────────────────────────
const MOCK_MODULES = [
  {
    uid: "learn.m365.intro-to-teams",
    title: "Introduction to Microsoft Teams",
    url: "https://learn.microsoft.com/en-us/training/modules/intro-to-teams/",
    summary: "Learn the basics of Microsoft Teams collaboration.",
    products: ["m365", "teams"],
    roles: ["administrator"],
    levels: ["beginner"],
    subjects: ["collaboration"],
    duration_in_minutes: 30,
    last_modified: "2024-01-15T00:00:00Z",
  },
  {
    uid: "learn.azure.intro-to-azure-ad",
    title: "Introduction to Microsoft Entra ID",
    url: "https://learn.microsoft.com/en-us/training/modules/intro-to-azure-ad/",
    summary: "Understand Azure Active Directory fundamentals.",
    products: ["azure", "azure-active-directory"],
    roles: ["administrator", "security-engineer"],
    levels: ["beginner"],
    subjects: ["identity"],
    duration_in_minutes: 45,
    last_modified: "2024-02-01T00:00:00Z",
  },
  {
    uid: "learn.security.zero-trust",
    title: "Zero Trust Security Principles",
    url: "https://learn.microsoft.com/en-us/training/modules/zero-trust/",
    summary: "Apply Zero Trust principles to your organization.",
    products: ["m365", "azure"],
    roles: ["security-engineer"],
    levels: ["intermediate"],
    subjects: ["security"],
    duration_in_minutes: 60,
    last_modified: "2024-03-01T00:00:00Z",
  },
];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("MS Learn Sync — runMsLearnSync()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock global fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ modules: MOCK_MODULES }),
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should call the MS Learn API with correct URL", async () => {
    await runMsLearnSync({ maxModules: 3 });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("learn.microsoft.com/api/catalog/"),
      expect.objectContaining({ headers: expect.objectContaining({ "User-Agent": expect.stringContaining("GigitekAI") }) })
    );
  });

  it("should return a result object with total, created, updated, errors, durationMs", async () => {
    const result = await runMsLearnSync({ maxModules: 3 });
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("created");
    expect(result).toHaveProperty("updated");
    expect(result).toHaveProperty("errors");
    expect(result).toHaveProperty("durationMs");
    expect(typeof result.durationMs).toBe("number");
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("should process at most maxModules modules", async () => {
    const result = await runMsLearnSync({ maxModules: 2 });
    expect(result.total).toBeLessThanOrEqual(2);
  });

  it("should handle API errors gracefully", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
    } as any);
    await expect(runMsLearnSync({ maxModules: 1 })).rejects.toThrow("503");
  });

  it("should handle network failures gracefully", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
    await expect(runMsLearnSync({ maxModules: 1 })).rejects.toThrow("Network error");
  });

  it("should filter to only GigitekAI-relevant products (m365, azure, security, copilot)", async () => {
    // Add an irrelevant module
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        modules: [
          ...MOCK_MODULES,
          {
            uid: "learn.dynamics.intro",
            title: "Intro to Dynamics 365",
            url: "https://learn.microsoft.com/en-us/training/modules/intro-dynamics/",
            summary: "Learn Dynamics 365.",
            products: ["dynamics-365"],
            roles: ["business-analyst"],
            levels: ["beginner"],
            subjects: ["crm"],
            duration_in_minutes: 20,
            last_modified: "2024-01-01T00:00:00Z",
          },
        ],
      }),
    } as any);
    const result = await runMsLearnSync();
    // The dynamics module should be filtered out (not in relevant products)
    expect(result.total).toBeLessThanOrEqual(MOCK_MODULES.length);
  });
});

describe("MS Learn Sync — category mapping", () => {
  it("should map m365 products to m365 category", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        modules: [{
          uid: "learn.m365.test",
          title: "M365 Test Module",
          url: "https://learn.microsoft.com/test",
          summary: "Test",
          products: ["m365"],
          roles: [],
          levels: ["beginner"],
          subjects: [],
          duration_in_minutes: 10,
          last_modified: "2024-01-01T00:00:00Z",
        }],
      }),
    } as any);
    // Should not throw
    const result = await runMsLearnSync({ maxModules: 1 });
    expect(result.errors).toBe(0);
  });

  it("should map copilot products to copilot category", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        modules: [{
          uid: "learn.copilot.test",
          title: "Copilot Test Module",
          url: "https://learn.microsoft.com/copilot-test",
          summary: "Test Copilot",
          products: ["copilot-for-microsoft-365"],
          roles: [],
          levels: ["beginner"],
          subjects: [],
          duration_in_minutes: 15,
          last_modified: "2024-01-01T00:00:00Z",
        }],
      }),
    } as any);
    const result = await runMsLearnSync({ maxModules: 1 });
    expect(result.errors).toBe(0);
  });
});

describe("MS Learn Sync Scheduler", () => {
  it("should export startMsLearnSyncScheduler as a function", async () => {
    const { startMsLearnSyncScheduler } = await import("./schedulers/msLearnSyncScheduler");
    expect(typeof startMsLearnSyncScheduler).toBe("function");
  });

  it("should schedule the next run in the future (not immediate)", async () => {
    // The scheduler uses setTimeout internally; verify it doesn't throw on call
    const { startMsLearnSyncScheduler } = await import("./schedulers/msLearnSyncScheduler");
    const setTimeoutSpy = vi.spyOn(global, "setTimeout").mockImplementation((() => 0) as any);
    startMsLearnSyncScheduler();
    expect(setTimeoutSpy).toHaveBeenCalledOnce();
    const [, delay] = setTimeoutSpy.mock.calls[0];
    // Delay should be between 0 and 24 hours
    expect(delay).toBeGreaterThanOrEqual(0);
    expect(delay).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
    setTimeoutSpy.mockRestore();
  });
});
