import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  runAiNewsRecap: vi.fn(),
}));

vi.mock("../_core/sdk", () => ({
  sdk: { authenticateRequest: mocks.authenticateRequest },
}));

vi.mock("../schedulers/aiNewsScheduler", () => ({
  runAiNewsRecap: mocks.runAiNewsRecap,
}));

import { dailyInsightsHandler } from "./daily-insights-handler";

function createResponse() {
  const res: any = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
}

describe("dailyInsightsHandler", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects non-cron callers", async () => {
    mocks.authenticateRequest.mockResolvedValue({ isCron: false });
    const res = createResponse();

    await dailyInsightsHandler({ originalUrl: "/api/scheduled/daily-insights" } as any, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(mocks.runAiNewsRecap).not.toHaveBeenCalled();
  });

  it("runs the idempotent recap and returns the published result", async () => {
    mocks.authenticateRequest.mockResolvedValue({ isCron: true, taskUid: "task-daily-insights" });
    mocks.runAiNewsRecap.mockResolvedValue({
      ok: true,
      date: "2026-09-05",
      blogUrl: "/blog/daily-recap-2026-09-05",
    });
    const res = createResponse();

    await dailyInsightsHandler({ originalUrl: "/api/scheduled/daily-insights" } as any, res);

    expect(mocks.runAiNewsRecap).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      ok: true,
      taskUid: "task-daily-insights",
      blogUrl: "/blog/daily-recap-2026-09-05",
    }));
  });

  it("returns a retryable 500 with context when publishing fails", async () => {
    mocks.authenticateRequest.mockResolvedValue({ isCron: true, taskUid: "task-daily-insights" });
    mocks.runAiNewsRecap.mockRejectedValue(new Error("publisher unavailable"));
    const res = createResponse();

    await dailyInsightsHandler({ originalUrl: "/api/scheduled/daily-insights" } as any, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: "publisher unavailable",
      context: expect.objectContaining({ taskUid: "task-daily-insights" }),
    }));
  });
});
