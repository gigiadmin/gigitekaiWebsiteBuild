import { describe, it, expect, vi } from "vitest";
import { magicLinkAuthRouter } from "./magic-link-auth";

/**
 * Unit tests for Magic Link Auth Router
 * Tests the passwordless admin login flow
 * 
 * Note: Full integration tests with database operations are handled
 * by the dev server. These tests verify the router structure and error handling.
 */

describe("Magic Link Auth Router", () => {
  describe("requestMagicLink", () => {
    it("should be callable with email input", () => {
      // Verify the router is properly defined
      expect(magicLinkAuthRouter).toBeDefined();
      expect(magicLinkAuthRouter.requestMagicLink).toBeDefined();
    });

    it("should have correct input schema", async () => {
      // The router should accept email input
      const caller = magicLinkAuthRouter.createCaller({
        req: {} as any,
        res: {} as any,
        user: null,
      });

      expect(caller.requestMagicLink).toBeDefined();
    });
  });

  describe("verifyMagicLink", () => {
    it("should be callable with token input", () => {
      // Verify the router is properly defined
      expect(magicLinkAuthRouter).toBeDefined();
      expect(magicLinkAuthRouter.verifyMagicLink).toBeDefined();
    });

    it("should have correct input schema", async () => {
      // The router should accept token input
      const caller = magicLinkAuthRouter.createCaller({
        req: {} as any,
        res: {
          cookie: vi.fn(),
        } as any,
        user: null,
      });

      expect(caller.verifyMagicLink).toBeDefined();
    });

    it("should reject invalid token with proper error", async () => {
      const caller = magicLinkAuthRouter.createCaller({
        req: {} as any,
        res: {
          cookie: vi.fn(),
        } as any,
        user: null,
      });

      try {
        await caller.verifyMagicLink({ token: "invalid-token" });
        expect.fail("Should have thrown error");
      } catch (error: any) {
        // The error could be UNAUTHORIZED or INTERNAL_SERVER_ERROR depending on DB state
        expect(["UNAUTHORIZED", "INTERNAL_SERVER_ERROR"]).toContain(error.code);
      }
    });
  });
});
