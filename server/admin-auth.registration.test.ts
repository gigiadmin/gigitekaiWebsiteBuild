/**
 * E2E User Registration Flow Tests
 * Tests the full admin registration, login, session, and logout cycle
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("./admin-auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./admin-auth")>();

  const store = new Map<string, {
    id: number;
    email: string;
    name: string;
    hashedPassword: string;
    role: string;
    isActive: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
  }>();
  let nextId = 1;

  return {
    ...actual,
    findAdminByEmail: vi.fn(async (email: string) => store.get(email) ?? null),
    findAdminById: vi.fn(async (id: number) => {
      for (const admin of store.values()) {
        if (admin.id === id) return admin;
      }
      return null;
    }),
    createAdminAccount: vi.fn(async ({ email, name, password, role }: {
      email: string; name: string; password: string; role: string;
    }) => {
      const hashed = `hashed_${password}`;
      const admin = {
        id: nextId++,
        email,
        name,
        hashedPassword: hashed,
        role: role ?? "agent",
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date(),
      };
      store.set(email, admin);
      return admin;
    }),
    verifyPassword: vi.fn(async (plain: string, hashed: string) => {
      return hashed === `hashed_${plain}`;
    }),
    signAdminToken: vi.fn(async (payload: object) => {
      return `mock_token_${JSON.stringify(payload)}`;
    }),
    verifyAdminToken: vi.fn(async (token: string) => {
      if (!token.startsWith("mock_token_")) return null;
      return JSON.parse(token.replace("mock_token_", ""));
    }),
    buildAdminSessionCookieHeader: vi.fn((token: string) => `admin_session=${token}; Path=/; HttpOnly`),
    clearAdminSessionCookieHeader: vi.fn(() => `admin_session=; Max-Age=0; Path=/`),
    getAdminSessionCookie: vi.fn((cookies: Record<string, string>) => cookies["admin_session"] ?? null),
    updateLastLogin: vi.fn(async () => {}),
    hashPassword: vi.fn(async (plain: string) => `hashed_${plain}`),
  };
});

// ── Context helpers ───────────────────────────────────────────────────────────

function createPublicContext(overrides?: {
  cookieHeader?: string;
  setCookieCapture?: string[];
}): TrpcContext {
  const setCookieCapture = overrides?.setCookieCapture ?? [];
  return {
    user: null,
    req: {
      protocol: "https",
      headers: { cookie: overrides?.cookieHeader ?? "" },
    } as TrpcContext["req"],
    res: {
      setHeader: (_name: string, value: string) => {
        setCookieCapture.push(value);
      },
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Admin Registration Flow", () => {
  it("registers a new admin account with valid secret", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.adminAuth.register({
      email: "newadmin@gigitekai.com",
      name: "New Admin",
      password: "SecurePass123!",
      role: "admin",
      adminSecret: "gigitekai-admin-2024",
    });

    expect(result.success).toBe(true);
    expect(result.admin.email).toBe("newadmin@gigitekai.com");
    expect(result.admin.name).toBe("New Admin");
    expect(result.admin.role).toBe("admin");
    expect(result.admin.id).toBeGreaterThan(0);
  });

  it("rejects registration with invalid admin secret", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.adminAuth.register({
        email: "hacker@evil.com",
        name: "Hacker",
        password: "password123",
        role: "admin",
        adminSecret: "wrong-secret",
      })
    ).rejects.toThrow("Invalid admin registration secret");
  });

  it("rejects duplicate email registration", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Register first time
    await caller.adminAuth.register({
      email: "duplicate@gigitekai.com",
      name: "First User",
      password: "SecurePass123!",
      role: "agent",
      adminSecret: "gigitekai-admin-2024",
    });

    // Try to register again with same email
    await expect(
      caller.adminAuth.register({
        email: "duplicate@gigitekai.com",
        name: "Second User",
        password: "DifferentPass456!",
        role: "agent",
        adminSecret: "gigitekai-admin-2024",
      })
    ).rejects.toThrow("An account with this email already exists");
  });
});

describe("Admin Login Flow", () => {
  const TEST_EMAIL = "logintest@gigitekai.com";
  const TEST_PASSWORD = "TestPass789!";

  beforeEach(async () => {
    // Register a test account before each login test
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.adminAuth.register({
        email: TEST_EMAIL,
        name: "Login Test User",
        password: TEST_PASSWORD,
        role: "agent",
        adminSecret: "gigitekai-admin-2024",
      });
    } catch {
      // Account may already exist from previous test — that's fine
    }
  });

  it("logs in with correct credentials and sets session cookie", async () => {
    const setCookieCapture: string[] = [];
    const ctx = createPublicContext({ setCookieCapture });
    const caller = appRouter.createCaller(ctx);

    const result = await caller.adminAuth.login({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    expect(result.success).toBe(true);
    expect(result.admin.email).toBe(TEST_EMAIL);
    expect(setCookieCapture.length).toBeGreaterThan(0);
    expect(setCookieCapture[0]).toContain("admin_session=");
  });

  it("rejects login with wrong password", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.adminAuth.login({
        email: TEST_EMAIL,
        password: "WrongPassword!",
      })
    ).rejects.toThrow("Invalid email or password");
  });

  it("rejects login for non-existent email", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.adminAuth.login({
        email: "nobody@gigitekai.com",
        password: "AnyPassword123",
      })
    ).rejects.toThrow("Invalid email or password");
  });
});

describe("Admin Logout Flow", () => {
  it("clears the session cookie on logout", async () => {
    const setCookieCapture: string[] = [];
    const ctx = createPublicContext({ setCookieCapture });
    const caller = appRouter.createCaller(ctx);

    const result = await caller.adminAuth.logout();

    expect(result.success).toBe(true);
    expect(setCookieCapture.length).toBeGreaterThan(0);
    expect(setCookieCapture[0]).toContain("Max-Age=0");
  });
});

describe("Admin Session (me) Flow", () => {
  it("returns null when no session cookie is present", async () => {
    const ctx = createPublicContext({ cookieHeader: "" });
    const caller = appRouter.createCaller(ctx);

    const result = await caller.adminAuth.me();
    expect(result).toBeNull();
  });
});
