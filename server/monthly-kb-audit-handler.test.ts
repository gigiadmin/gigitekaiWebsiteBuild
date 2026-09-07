import { beforeEach, describe, expect, it, vi } from "vitest";

const { authenticateRequest, runMonthlyKbQualityAudit } = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  runMonthlyKbQualityAudit: vi.fn(),
}));

vi.mock("./_core/sdk", () => ({ sdk: { authenticateRequest } }));
vi.mock("./services/kbQualityAudit", () => ({ runMonthlyKbQualityAudit }));

import { monthlyKbAuditHandler } from "./scheduled-handlers/monthly-kb-audit-handler";

function responseMock() {
  const response: any = {};
  response.status = vi.fn(() => response);
  response.json = vi.fn(() => response);
  return response;
}

describe("monthly Knowledge Base audit scheduled handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-cron-secret";
  });

  it("rejects non-cron requests", async () => {
    authenticateRequest.mockResolvedValue({ isCron: false });
    const response = responseMock();
    await monthlyKbAuditHandler({ originalUrl: "/api/scheduled/monthly-kb-audit" } as any, response);
    expect(response.status).toHaveBeenCalledWith(403);
    expect(runMonthlyKbQualityAudit).not.toHaveBeenCalled();
  });

  it("runs the deterministic audit for authenticated scheduler callbacks", async () => {
    authenticateRequest.mockResolvedValue({ isCron: true, taskUid: "task-123" });
    runMonthlyKbQualityAudit.mockResolvedValue({ skipped: false, audit: { id: 1, status: "completed" } });
    const response = responseMock();
    await monthlyKbAuditHandler({ originalUrl: "/api/scheduled/monthly-kb-audit" } as any, response);
    expect(runMonthlyKbQualityAudit).toHaveBeenCalledWith({ source: "scheduled", taskUid: "task-123" });
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ skipped: false, taskUid: "task-123" }));
  });
});
