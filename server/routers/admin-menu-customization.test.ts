import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "../routers";
import { getDb } from "../db";
import { adminMenuCustomizationRouter } from "./admin-menu-customization";
import { users, adminMenuCustomization } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import type { TrpcContext } from "../_core/context";

describe("Admin Menu Customization Router", () => {
  let db: any;
  let testUserId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Create test user
    const userResult = await db.insert(users).values({
      email: "menu-test@test.com",
      name: "Menu Test User",
      openId: "test-openid-" + Date.now(),
      role: "admin",
      loginMethod: "oauth",
      createdAt: new Date().toISOString(),
    });

    testUserId = userResult[0].insertId;
  });

  afterAll(async () => {
    if (db) {
      // Clean up test data
      await db.delete(adminMenuCustomization).where(eq(adminMenuCustomization.userId, testUserId));
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  function createAdminContext(): TrpcContext {
    return {
      user: {
        id: testUserId,
        email: "menu-test@test.com",
        name: "Menu Test User",
        openId: "test-openid",
        role: "admin",
        loginMethod: "oauth",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastSignedIn: new Date().toISOString(),
      },
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
  }

  it("should save menu customization", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const menuOrder = ["dashboard", "helpdesk", "surveys"];
    const result = await caller.adminMenuCustomization.saveMenuCustomization({
      menuOrder,
      collapsedSections: ["OPERATIONS"],
    });

    expect(result.success).toBe(true);
  });

  it("should retrieve saved menu customization", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const menuOrder = ["metrics", "helpdesk", "kb-analytics"];
    await caller.adminMenuCustomization.saveMenuCustomization({
      menuOrder,
      collapsedSections: ["ANALYTICS"],
    });

    const result = await caller.adminMenuCustomization.getMenuCustomization();

    expect(result).not.toBeNull();
    expect(result?.menuOrder).toEqual(menuOrder);
    expect(result?.collapsedSections).toContain("ANALYTICS");
  });

  it("should return null when no customization exists", async () => {
    // Create another test user without customization
    const newUserResult = await db.insert(users).values({
      email: "no-custom@test.com",
      name: "No Custom User",
      openId: "test-openid-" + Date.now(),
      role: "admin",
      loginMethod: "oauth",
      createdAt: new Date().toISOString(),
    });

    const newUserId = newUserResult[0].insertId;

    const ctx: TrpcContext = {
      user: {
        id: newUserId,
        email: "no-custom@test.com",
        name: "No Custom User",
        openId: "test-openid",
        role: "admin",
        loginMethod: "oauth",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastSignedIn: new Date().toISOString(),
      },
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);
    const result = await caller.adminMenuCustomization.getMenuCustomization();

    expect(result).toBeNull();

    // Clean up
    await db.delete(users).where(eq(users.id, newUserId));
  });

  it("should reset menu customization", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // First save some customization
    await caller.adminMenuCustomization.saveMenuCustomization({
      menuOrder: ["dashboard", "helpdesk"],
      collapsedSections: [],
    });

    // Then reset
    const result = await caller.adminMenuCustomization.resetMenuCustomization();

    expect(result.success).toBe(true);

    // Verify it's deleted
    const retrieved = await caller.adminMenuCustomization.getMenuCustomization();
    expect(retrieved).toBeNull();
  });

  it("should toggle section collapse", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Start with no customization
    await caller.adminMenuCustomization.resetMenuCustomization();

    // Toggle OPERATIONS to collapsed
    let result = await caller.adminMenuCustomization.toggleSectionCollapse({
      section: "OPERATIONS",
    });

    expect(result.success).toBe(true);
    expect(result.collapsedSections).toContain("OPERATIONS");

    // Toggle OPERATIONS back to expanded
    result = await caller.adminMenuCustomization.toggleSectionCollapse({
      section: "OPERATIONS",
    });

    expect(result.success).toBe(true);
    expect(result.collapsedSections).not.toContain("OPERATIONS");
  });

  it("should handle multiple collapsed sections", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Reset first
    await caller.adminMenuCustomization.resetMenuCustomization();

    // Collapse OPERATIONS
    await caller.adminMenuCustomization.toggleSectionCollapse({
      section: "OPERATIONS",
    });

    // Collapse ANALYTICS
    const result = await caller.adminMenuCustomization.toggleSectionCollapse({
      section: "ANALYTICS",
    });

    expect(result.collapsedSections).toContain("OPERATIONS");
    expect(result.collapsedSections).toContain("ANALYTICS");
    expect(result.collapsedSections.length).toBe(2);
  });

  it("should update existing customization", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Save initial customization
    await caller.adminMenuCustomization.saveMenuCustomization({
      menuOrder: ["dashboard", "helpdesk"],
      collapsedSections: [],
    });

    // Update with new menu order
    const result = await caller.adminMenuCustomization.saveMenuCustomization({
      menuOrder: ["helpdesk", "dashboard", "surveys"],
      collapsedSections: ["OPERATIONS"],
    });

    expect(result.success).toBe(true);

    // Verify update
    const retrieved = await caller.adminMenuCustomization.getMenuCustomization();
    expect(retrieved?.menuOrder).toEqual(["helpdesk", "dashboard", "surveys"]);
    expect(retrieved?.collapsedSections).toContain("OPERATIONS");
  });
});
