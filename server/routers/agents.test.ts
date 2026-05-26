import { describe, it, expect } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-admin",
    email: "admin@test.com",
    name: "Test Admin",
    loginMethod: "oauth",
    role: "admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastSignedIn: new Date().toISOString(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "test-user",
    email: "user@test.com",
    name: "Test User",
    loginMethod: "oauth",
    role: "user",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastSignedIn: new Date().toISOString(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe("agents router", () => {
  it("should require admin role to get all agents", async () => {
    const userCtx = createUserContext();
    const caller = appRouter.createCaller(userCtx);

    try {
      await caller.agents.getAllAgents();
      expect.fail("Should have thrown FORBIDDEN error");
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
    }
  });

  it("should require admin role to create agent", async () => {
    const userCtx = createUserContext();
    const caller = appRouter.createCaller(userCtx);

    try {
      await caller.agents.createAgent({
        userId: 2,
        specialization: "Test",
      });
      expect.fail("Should have thrown FORBIDDEN error");
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
    }
  });

  it("should require admin role to delete agent", async () => {
    const userCtx = createUserContext();
    const caller = appRouter.createCaller(userCtx);

    try {
      await caller.agents.deleteAgent({ agentId: 1 });
      expect.fail("Should have thrown FORBIDDEN error");
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
    }
  });

  it("should require admin role to get available agents", async () => {
    const userCtx = createUserContext();
    const caller = appRouter.createCaller(userCtx);

    try {
      await caller.agents.getAvailable();
      expect.fail("Should have thrown FORBIDDEN error");
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
    }
  });

  it("should allow admin to get all agents (with db error)", async () => {
    const adminCtx = createAdminContext();
    const caller = appRouter.createCaller(adminCtx);

    try {
      const agents = await caller.agents.getAllAgents();
      expect(Array.isArray(agents)).toBe(true);
    } catch (error: any) {
      // Database might not be available in test environment
      expect(error.message).toContain("Database not available");
    }
  });

  it("should allow admin to get available agents (with db error)", async () => {
    const adminCtx = createAdminContext();
    const caller = appRouter.createCaller(adminCtx);

    try {
      const agents = await caller.agents.getAvailable();
      expect(Array.isArray(agents)).toBe(true);
    } catch (error: any) {
      // Database might not be available in test environment
      expect(error.message).toContain("Database not available");
    }
  });

  it("should allow protected access to get my agent", async () => {
    const userCtx = createUserContext();
    const caller = appRouter.createCaller(userCtx);

    try {
      const agent = await caller.agents.getMyAgent();
      // Agent might not exist, but call should be allowed
      expect(agent === null || typeof agent === "object").toBe(true);
    } catch (error: any) {
      // Database might not be available in test environment
      expect(error.message).toContain("Database not available");
    }
  });
});
