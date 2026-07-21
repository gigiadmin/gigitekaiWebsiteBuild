/**
 * Meridian Service Endpoint Tests
 * Tests the token-authenticated API endpoints used by the Meridian/OpenClaw agent
 */
import { describe, it, expect, vi, beforeAll } from "vitest";

// Mock ENV with a known token
vi.mock("./_core/env", () => ({
  ENV: {
    meridianApiToken: "test-meridian-token-12345",
    databaseUrl: "mock://db",
  },
}));

// Mock ticket data
const mockTickets = [
  { id: 1, title: "Email not working", status: "open", priority: "high", category: "email", source: "web", createdAt: new Date("2026-07-20T10:00:00Z") },
  { id: 2, title: "VPN connection issue", status: "closed", priority: "medium", category: "network", source: "email", createdAt: new Date("2026-07-19T08:00:00Z") },
  { id: 3, title: "Printer offline", status: "in_progress", priority: "low", category: "hardware", source: "teams", createdAt: new Date("2026-07-20T14:00:00Z") },
  { id: 4, title: "Critical server down", status: "open", priority: "critical", category: "infrastructure", source: "web", createdAt: new Date("2026-07-21T01:00:00Z") },
  { id: 5, title: "Password reset", status: "resolved", priority: "low", category: "account", source: "web", createdAt: new Date("2026-07-18T12:00:00Z") },
];

vi.mock("./db", () => ({
  getDb: vi.fn(() => ({
    select: () => ({
      from: () => Promise.resolve(mockTickets),
    }),
  })),
}));

// Mock drizzle schema
vi.mock("../drizzle/schema", () => ({
  tickets: { _: "tickets_table" },
  ticketReplies: { _: "ticketReplies_table" },
  users: { _: "users_table" },
}));

import { meridianServiceRouter } from "./routers/meridian-service";
import type { TrpcContext } from "./_core/context";

function createContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: () => {} } as any,
  };
}

describe("Meridian Service - Token Validation", () => {
  it("should reject requests with invalid token", async () => {
    const caller = meridianServiceRouter.createCaller(createContext());

    await expect(
      caller.ping({ apiToken: "wrong-token" })
    ).rejects.toThrow("Invalid Meridian API token");
  });

  it("should reject requests with empty token", async () => {
    const caller = meridianServiceRouter.createCaller(createContext());

    await expect(
      caller.ping({ apiToken: "" })
    ).rejects.toThrow("Invalid Meridian API token");
  });

  it("should accept requests with valid token", async () => {
    const caller = meridianServiceRouter.createCaller(createContext());

    const result = await caller.ping({ apiToken: "test-meridian-token-12345" });
    expect(result.status).toBe("ok");
    expect(result.database).toBe("connected");
    expect(result.timestamp).toBeDefined();
  });
});

describe("Meridian Service - Helpdesk Stats", () => {
  it("should return correct ticket counts", async () => {
    const caller = meridianServiceRouter.createCaller(createContext());

    const result = await caller.helpdeskStats({ apiToken: "test-meridian-token-12345" });

    expect(result.counts.total).toBe(5);
    expect(result.counts.open).toBe(2);
    expect(result.counts.inProgress).toBe(1);
    expect(result.counts.closed).toBe(1);
    expect(result.counts.resolved).toBe(1);
    expect(result.counts.critical).toBe(1);
    expect(result.counts.unresolved).toBe(3); // open(2) + inProgress(1) + onHold(0)
  });

  it("should return priority breakdown", async () => {
    const caller = meridianServiceRouter.createCaller(createContext());

    const result = await caller.helpdeskStats({ apiToken: "test-meridian-token-12345" });

    expect(result.byPriority.critical).toBe(1);
    expect(result.byPriority.high).toBe(1);
    expect(result.byPriority.medium).toBe(1);
    expect(result.byPriority.low).toBe(2);
  });

  it("should return category breakdown", async () => {
    const caller = meridianServiceRouter.createCaller(createContext());

    const result = await caller.helpdeskStats({ apiToken: "test-meridian-token-12345" });

    expect(result.byCategory.email).toBe(1);
    expect(result.byCategory.network).toBe(1);
    expect(result.byCategory.hardware).toBe(1);
    expect(result.byCategory.infrastructure).toBe(1);
    expect(result.byCategory.account).toBe(1);
  });

  it("should return source breakdown", async () => {
    const caller = meridianServiceRouter.createCaller(createContext());

    const result = await caller.helpdeskStats({ apiToken: "test-meridian-token-12345" });

    expect(result.bySource.web).toBe(3);
    expect(result.bySource.email).toBe(1);
    expect(result.bySource.teams).toBe(1);
  });

  it("should return recent tickets sorted by date (newest first)", async () => {
    const caller = meridianServiceRouter.createCaller(createContext());

    const result = await caller.helpdeskStats({ apiToken: "test-meridian-token-12345" });

    expect(result.recentTickets.length).toBe(5);
    expect(result.recentTickets[0].id).toBe(4); // Most recent (Jul 21)
    expect(result.recentTickets[0].title).toBe("Critical server down");
  });

  it("should include timestamp in response", async () => {
    const caller = meridianServiceRouter.createCaller(createContext());

    const result = await caller.helpdeskStats({ apiToken: "test-meridian-token-12345" });

    expect(result.timestamp).toBeDefined();
    expect(new Date(result.timestamp).getTime()).toBeGreaterThan(0);
  });
});

describe("Meridian Service - Copilot Agent Status", () => {
  it("should return agent configuration status", async () => {
    const caller = meridianServiceRouter.createCaller(createContext());

    const result = await caller.copilotAgentStatus({ apiToken: "test-meridian-token-12345" });

    expect(result.agents).toBeDefined();
    expect(result.agents.ticketClassifier).toBeDefined();
    expect(result.agents.kbQA).toBeDefined();
    expect(result.agents.voiceRouting).toBeDefined();
    expect(result.agents.tenantConfig).toBeDefined();
    expect(result.timestamp).toBeDefined();
  });
});

describe("Meridian Service - Integration Status", () => {
  it("should return integration summary with 8 total integrations", async () => {
    const caller = meridianServiceRouter.createCaller(createContext());

    const result = await caller.integrationStatus({ apiToken: "test-meridian-token-12345" });

    expect(result.summary).toBeDefined();
    expect(result.summary.total).toBe(8);
    expect(result.summary.live).toBeGreaterThanOrEqual(0);
    expect(result.integrations).toBeDefined();
    expect(result.integrations.msGraph).toBeDefined();
    expect(result.integrations.teamsBot).toBeDefined();
    expect(result.integrations.copilotStudio).toBeDefined();
    expect(result.integrations.acs).toBeDefined();
  });
});
