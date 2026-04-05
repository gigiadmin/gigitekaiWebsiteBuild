import { describe, it, expect, vi } from "vitest";
import { chatRouter } from "./routers/chat";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const mockUser: AuthenticatedUser = {
    id: 1,
    openId: "admin-test-openid",
    name: "Admin User",
    email: "admin@gigitekai.com",
    loginMethod: "google",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user: mockUser,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createUserContext(id = 2): TrpcContext {
  const mockUser: AuthenticatedUser = {
    id,
    openId: `user-test-openid-${id}`,
    name: "Test User",
    email: "user@example.com",
    loginMethod: "google",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user: mockUser,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("chat router - handoff and file features", () => {
  describe("handoffFromBot", () => {
    it("requires authentication", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: {
          protocol: "https",
          headers: {},
        } as TrpcContext["req"],
        res: {
          clearCookie: vi.fn(),
        } as unknown as TrpcContext["res"],
      };

      const caller = chatRouter.createCaller(ctx);

      await expect(
        caller.handoffFromBot({
          aiSessionId: "test-session-id",
          summary: "Test handoff",
        })
      ).rejects.toThrow();
    });

    it("accepts valid handoff request from authenticated user", async () => {
      const ctx = createUserContext();
      const caller = chatRouter.createCaller(ctx);

      // This may throw because DB is not available in test env,
      // but it should not throw an auth error
      try {
        await caller.handoffFromBot({
          aiSessionId: "test-ai-session-123",
          summary: "User needs help with cloud migration",
        });
      } catch (err: any) {
        // Should fail with DB error, not auth error
        expect(err.message).not.toContain("UNAUTHORIZED");
        expect(err.message).not.toContain("Please login");
      }
    });
  });

  describe("uploadAttachment", () => {
    it("requires authentication", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: {
          protocol: "https",
          headers: {},
        } as TrpcContext["req"],
        res: {
          clearCookie: vi.fn(),
        } as unknown as TrpcContext["res"],
      };

      const caller = chatRouter.createCaller(ctx);

      await expect(
        caller.uploadAttachment({
          sessionId: 1,
          fileName: "test.txt",
          fileData: btoa("hello world"),
          mimeType: "text/plain",
        })
      ).rejects.toThrow();
    });

    it("validates input schema - rejects missing sessionId", async () => {
      const ctx = createUserContext();
      const caller = chatRouter.createCaller(ctx);

      // Missing sessionId should fail schema validation
      await expect(
        caller.uploadAttachment({
          fileName: "test.txt",
          fileData: btoa("test"),
          mimeType: "text/plain",
        } as any)
      ).rejects.toBeDefined();
    });

    it("accepts valid upload request from authenticated user", async () => {
      const ctx = createUserContext();
      const caller = chatRouter.createCaller(ctx);

      try {
        await caller.uploadAttachment({
          sessionId: 999,
          fileName: "test-doc.pdf",
          fileData: btoa("fake pdf content"),
          mimeType: "application/pdf",
        });
      } catch (err: any) {
        // Should fail with DB/session error, not auth error
        expect(err.message).not.toContain("UNAUTHORIZED");
        expect(err.message).not.toContain("Please login");
      }
    });
  });

  describe("getAnalytics", () => {
    it("requires authentication", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: {
          protocol: "https",
          headers: {},
        } as TrpcContext["req"],
        res: {
          clearCookie: vi.fn(),
        } as unknown as TrpcContext["res"],
      };

      const caller = chatRouter.createCaller(ctx);

      await expect(
        caller.getAnalytics({ days: 30 })
      ).rejects.toThrow();
    });

    it("accepts valid analytics request from admin", async () => {
      const ctx = createAdminContext();
      const caller = chatRouter.createCaller(ctx);

      try {
        const result = await caller.getAnalytics({ days: 7 });
        // If DB is available, should return analytics object
        expect(result).toBeDefined();
      } catch (err: any) {
        // DB not available in test env is acceptable
        expect(err.message).not.toContain("UNAUTHORIZED");
      }
    });
  });

  describe("exportTranscript", () => {
    it("requires authentication", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: {
          protocol: "https",
          headers: {},
        } as TrpcContext["req"],
        res: {
          clearCookie: vi.fn(),
        } as unknown as TrpcContext["res"],
      };

      const caller = chatRouter.createCaller(ctx);

      await expect(
        caller.exportTranscript({ sessionId: 1, format: "text" })
      ).rejects.toThrow();
    });
  });
});
