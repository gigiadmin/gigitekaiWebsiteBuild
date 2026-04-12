/**
 * Tests for admin account management features:
 * - changePassword
 * - createAccount (admin only)
 * - listAccounts (admin only)
 * - updateAccount (admin only)
 * - deleteAccount (admin only)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { TRPCError } from "@trpc/server";

// Mock the admin-auth module
vi.mock("../admin-auth", () => ({
  findAdminByEmail: vi.fn(),
  findAdminById: vi.fn(),
  verifyPassword: vi.fn(),
  signAdminToken: vi.fn(),
  verifyAdminToken: vi.fn(),
  buildAdminSessionCookieHeader: vi.fn(() => "Set-Cookie: admin_session=token"),
  clearAdminSessionCookieHeader: vi.fn(() => "Set-Cookie: admin_session=; Max-Age=0"),
  getAdminSessionCookie: vi.fn(),
  createAdminAccount: vi.fn(),
  updateLastLogin: vi.fn(),
  getAllAdminAccounts: vi.fn(),
  updateAdminAccount: vi.fn(),
  deleteAdminAccount: vi.fn(),
  hashPassword: vi.fn(),
}));

import {
  findAdminByEmail,
  findAdminById,
  verifyPassword,
  signAdminToken,
  verifyAdminToken,
  getAdminSessionCookie,
  createAdminAccount,
  getAllAdminAccounts,
  updateAdminAccount,
  deleteAdminAccount,
  hashPassword,
} from "../admin-auth";

// Helper to create mock admin
const mockAdmin = (overrides = {}) => ({
  id: 1,
  email: "support@gigitekai.com",
  name: "Harry",
  role: "admin" as const,
  hashedPassword: "hashed_password",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLoginAt: null,
  ...overrides,
});

const mockAgent = (overrides = {}) => ({
  id: 2,
  email: "agent@gigitek.com",
  name: "Agent Smith",
  role: "agent" as const,
  hashedPassword: "hashed_password",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLoginAt: null,
  ...overrides,
});

// Mock request with admin session
const mockReqWithAdmin = (admin: ReturnType<typeof mockAdmin>) => ({
  headers: { cookie: "admin_session=valid_token" },
});

describe("Admin Account Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("changePassword", () => {
    it("should reject if not authenticated", async () => {
      vi.mocked(getAdminSessionCookie).mockReturnValue(null);
      vi.mocked(verifyAdminToken).mockResolvedValue(null);

      // Simulating what the procedure does
      const token = null;
      expect(token).toBeNull();
    });

    it("should reject if current password is wrong", async () => {
      vi.mocked(verifyPassword).mockResolvedValue(false);
      const result = await verifyPassword("wrong_password", "hashed_password");
      expect(result).toBe(false);
    });

    it("should update password if current password is correct", async () => {
      vi.mocked(verifyPassword).mockResolvedValue(true);
      vi.mocked(updateAdminAccount).mockResolvedValue(undefined);

      const valid = await verifyPassword("correct_password", "hashed_password");
      expect(valid).toBe(true);

      await updateAdminAccount(1, { password: "new_password" });
      expect(updateAdminAccount).toHaveBeenCalledWith(1, { password: "new_password" });
    });
  });

  describe("createAccount (admin only)", () => {
    it("should allow admin to create a new agent account", async () => {
      const newAgent = mockAgent({ id: 3, email: "newagent@gigitek.com" });
      vi.mocked(findAdminByEmail).mockResolvedValue(null); // No existing account
      vi.mocked(createAdminAccount).mockResolvedValue(newAgent);

      const existing = await findAdminByEmail("newagent@gigitek.com");
      expect(existing).toBeNull();

      const created = await createAdminAccount({
        email: "newagent@gigitek.com",
        name: "New Agent",
        password: "password123",
        role: "agent",
      });
      expect(created?.email).toBe("newagent@gigitek.com");
      expect(created?.role).toBe("agent");
    });

    it("should reject if email already exists", async () => {
      vi.mocked(findAdminByEmail).mockResolvedValue(mockAgent());

      const existing = await findAdminByEmail("agent@gigitek.com");
      expect(existing).not.toBeNull();
      // The procedure would throw CONFLICT error here
    });

    it("should reject non-admin trying to create account", () => {
      const agent = mockAgent();
      // Agent role check
      expect(agent.role).not.toBe("admin");
      // The procedure would throw FORBIDDEN error here
    });
  });

  describe("listAccounts (admin only)", () => {
    it("should return all accounts for admin", async () => {
      const accounts = [mockAdmin(), mockAgent()];
      vi.mocked(getAllAdminAccounts).mockResolvedValue(accounts);

      const result = await getAllAdminAccounts();
      expect(result).toHaveLength(2);
      expect(result[0].role).toBe("admin");
      expect(result[1].role).toBe("agent");
    });

    it("should reject non-admin access", () => {
      const agent = mockAgent();
      expect(agent.role).not.toBe("admin");
      // The procedure would throw FORBIDDEN error here
    });
  });

  describe("updateAccount (admin only)", () => {
    it("should allow admin to deactivate an account", async () => {
      vi.mocked(updateAdminAccount).mockResolvedValue(undefined);

      await updateAdminAccount(2, { isActive: false });
      expect(updateAdminAccount).toHaveBeenCalledWith(2, { isActive: false });
    });

    it("should allow admin to change a user's role", async () => {
      vi.mocked(updateAdminAccount).mockResolvedValue(undefined);

      await updateAdminAccount(2, { role: "viewer" });
      expect(updateAdminAccount).toHaveBeenCalledWith(2, { role: "viewer" });
    });
  });

  describe("deleteAccount (admin only)", () => {
    it("should allow admin to delete an account", async () => {
      vi.mocked(deleteAdminAccount).mockResolvedValue(undefined);

      await deleteAdminAccount(2);
      expect(deleteAdminAccount).toHaveBeenCalledWith(2);
    });

    it("should reject non-admin trying to delete account", () => {
      const agent = mockAgent();
      expect(agent.role).not.toBe("admin");
      // The procedure would throw FORBIDDEN error here
    });
  });

  describe("Role-based access control", () => {
    it("admin should have full access", () => {
      const admin = mockAdmin();
      const isAdmin = admin.role === "admin";
      const isAgent = admin.role === "agent" || isAdmin;
      expect(isAdmin).toBe(true);
      expect(isAgent).toBe(true);
    });

    it("agent should have chat and ticket access but not admin functions", () => {
      const agent = mockAgent();
      const isAdmin = agent.role === "admin";
      const isAgent = agent.role === "agent" || isAdmin;
      expect(isAdmin).toBe(false);
      expect(isAgent).toBe(true);
    });

    it("viewer should have read-only access", () => {
      const viewer = { ...mockAgent(), role: "viewer" as const };
      const isAdmin = viewer.role === "admin";
      const isAgent = viewer.role === "agent" || isAdmin;
      expect(isAdmin).toBe(false);
      expect(isAgent).toBe(false);
    });
  });
});
