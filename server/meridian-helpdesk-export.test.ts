/**
 * Tests for GET /api/integrations/meridian/helpdesk-export
 */

import { describe, it, expect, vi } from "vitest";

vi.mock("./_core/env", () => ({
  ENV: { meridianHelpdeskReadToken: "test-read-token-abc123" },
}));

// The drizzle chain: .select().from() resolves, .select().from().where() also resolves
vi.mock("./db", () => {
  const mockRow = {
    open: 5, in_progress: 3, on_hold: 1, resolved: 12, closed: 8,
    total: 29, new_in_last_24h: 2, urgent_open: 1, unassigned_open: 2,
    count: 47,
  };
  const chain: any = {
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
  };
  // .from() returns a thenable (resolves to [mockRow]) AND has .where()
  const fromResult: any = {
    then: (resolve: any) => Promise.resolve([mockRow]).then(resolve),
    where: vi.fn().mockResolvedValue([mockRow]),
  };
  chain.select.mockReturnValue(chain);
  chain.from.mockReturnValue(fromResult);
  return { getDb: vi.fn().mockResolvedValue(chain) };
});

import { handleMeridianHelpdeskExport } from "./meridian-helpdesk-export";

function makeReqRes(authHeader?: string) {
  const req = { headers: authHeader ? { authorization: authHeader } : {} } as any;
  let statusCode = 200;
  let responseBody: any = null;
  const res: any = {
    get _status() { return statusCode; },
    get _body() { return responseBody; },
    status(code: number) { statusCode = code; return res; },
    json(body: any) { responseBody = body; return res; },
  };
  return { req, res };
}

describe("GET /api/integrations/meridian/helpdesk-export", () => {
  it("returns 401 when no Authorization header is provided", async () => {
    const { req, res } = makeReqRes();
    await handleMeridianHelpdeskExport(req, res);
    expect(res._status).toBe(401);
    expect(res._body.error).toBe("Unauthorized");
  });

  it("returns 401 when an invalid token is provided", async () => {
    const { req, res } = makeReqRes("Bearer wrong-token-xyz");
    await handleMeridianHelpdeskExport(req, res);
    expect(res._status).toBe(401);
    expect(res._body.error).toBe("Unauthorized");
  });

  it("returns 401 when Bearer prefix is missing", async () => {
    const { req, res } = makeReqRes("test-read-token-abc123");
    await handleMeridianHelpdeskExport(req, res);
    expect(res._status).toBe(401);
  });

  it("returns 200 with valid token", async () => {
    const { req, res } = makeReqRes("Bearer test-read-token-abc123");
    await handleMeridianHelpdeskExport(req, res);
    expect(res._status).toBe(200);
  });

  it("payload contains meta with governance field", async () => {
    const { req, res } = makeReqRes("Bearer test-read-token-abc123");
    await handleMeridianHelpdeskExport(req, res);
    expect(res._body?.meta).toBeDefined();
    expect(res._body.meta.governance).toBe("stage-c-aggregate-only");
    expect(res._body.meta.schema_version).toBe("1.0");
    expect(res._body.meta.generated_at).toBeDefined();
  });

  it("payload contains helpdesk.tickets aggregate counts", async () => {
    const { req, res } = makeReqRes("Bearer test-read-token-abc123");
    await handleMeridianHelpdeskExport(req, res);
    const t = res._body?.helpdesk?.tickets;
    expect(t).toBeDefined();
    expect(typeof t.open).toBe("number");
    expect(typeof t.in_progress).toBe("number");
    expect(typeof t.on_hold).toBe("number");
    expect(typeof t.resolved).toBe("number");
    expect(typeof t.closed).toBe("number");
    expect(typeof t.total).toBe("number");
    expect(typeof t.new_in_last_24h).toBe("number");
    expect(typeof t.urgent_open).toBe("number");
    expect(typeof t.unassigned_open).toBe("number");
  });

  it("payload contains knowledge_base.published_articles count", async () => {
    const { req, res } = makeReqRes("Bearer test-read-token-abc123");
    await handleMeridianHelpdeskExport(req, res);
    expect(typeof res._body?.helpdesk?.knowledge_base?.published_articles).toBe("number");
  });

  it("Stage C: payload must NOT contain PII fields", async () => {
    const { req, res } = makeReqRes("Bearer test-read-token-abc123");
    await handleMeridianHelpdeskExport(req, res);
    const bodyStr = JSON.stringify(res._body);
    const piiFields = [
      "subject", "description", "email", "requesterName", "requesterEmail",
      "technician", "attachment", "transcript", "closingNotes", "aiReasoning",
    ];
    for (const field of piiFields) {
      expect(bodyStr).not.toContain(`"${field}"`);
    }
  });
});
