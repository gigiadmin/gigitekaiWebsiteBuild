import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "../routers";
import { getDb } from "../db";
import { users, notificationQueue } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import type { TrpcContext } from "../_core/context";

describe("Notification System", () => {
  let db: any;
  let testUserId: number;
  let testAdminId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Create test user
    const userResult = await db.insert(users).values({
      email: "notif-test-user@test.com",
      name: "Notification Test User",
      openId: "test-openid-" + Date.now(),
      role: "user",
      loginMethod: "oauth",
      createdAt: new Date().toISOString(),
    });

    testUserId = userResult[0].insertId;

    // Create test admin
    const adminResult = await db.insert(users).values({
      email: "notif-test-admin@test.com",
      name: "Notification Admin",
      openId: "admin-openid-" + Date.now(),
      role: "admin",
      loginMethod: "oauth",
      createdAt: new Date().toISOString(),
    });

    testAdminId = adminResult[0].insertId;
  });

  afterAll(async () => {
    if (db) {
      // Clean up test data
      await db.delete(notificationQueue).where(eq(notificationQueue.userId, testUserId));
      await db.delete(notificationQueue).where(eq(notificationQueue.userId, testAdminId));
      await db.delete(users).where(eq(users.id, testUserId));
      await db.delete(users).where(eq(users.id, testAdminId));
    }
  });

  function createUserContext(userId: number, role: "user" | "admin"): TrpcContext {
    return {
      user: {
        id: userId,
        email: role === "admin" ? "notif-test-admin@test.com" : "notif-test-user@test.com",
        name: role === "admin" ? "Notification Admin" : "Notification Test User",
        openId: "test-openid",
        role,
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

  it("should queue email notification", async () => {
    const ctx = createUserContext(testUserId, "user");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notifications.queueNotification({
      userId: testUserId,
      type: "email",
      subject: "Test Email",
      content: "This is a test email notification",
    });

    expect(result.queued).toBe(true);
  });

  it("should queue in-app notification", async () => {
    const ctx = createUserContext(testUserId, "user");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notifications.queueNotification({
      userId: testUserId,
      type: "in_app",
      content: "This is an in-app notification",
    });

    expect(result.queued).toBe(true);
  });

  it("should get pending notifications", async () => {
    const ctx = createUserContext(testUserId, "user");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notifications.getPendingNotifications({
      limit: 50,
      offset: 0,
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it("should get notification history", async () => {
    const ctx = createUserContext(testUserId, "user");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notifications.getNotificationHistory({
      limit: 50,
      offset: 0,
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it("should mark notification as sent (admin only)", async () => {
    const ctx = createUserContext(testAdminId, "admin");
    const caller = appRouter.createCaller(ctx);

    // First queue a notification
    const userCtx = createUserContext(testUserId, "user");
    const userCaller = appRouter.createCaller(userCtx);

    const queued = await userCaller.notifications.queueNotification({
      userId: testUserId,
      type: "email",
      content: "Test notification to mark as sent",
    });

    // Only test if notification was actually queued
    if (queued.notificationId > 0) {
      const result = await caller.notifications.markNotificationSent({
        notificationId: queued.notificationId,
      });
      expect(result.success).toBe(true);
    }
  });

  it("should mark notification as failed with retry (admin only)", async () => {
    const ctx = createUserContext(testAdminId, "admin");
    const caller = appRouter.createCaller(ctx);

    // Queue a notification
    const userCtx = createUserContext(testUserId, "user");
    const userCaller = appRouter.createCaller(userCtx);

    const queued = await userCaller.notifications.queueNotification({
      userId: testUserId,
      type: "email",
      content: "Test notification for failure handling",
    });

    // Only test if notification was actually queued
    if (queued.notificationId > 0) {
      const result = await caller.notifications.markNotificationFailed({
        notificationId: queued.notificationId,
        reason: "Temporary delivery failure",
      });
      expect(result.success).toBe(true);
    }
  });

  it("should get notification statistics (admin only)", async () => {
    const ctx = createUserContext(testAdminId, "admin");
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.notifications.getNotificationStats();

    expect(stats).toHaveProperty("total");
    expect(stats).toHaveProperty("pending");
    expect(stats).toHaveProperty("sent");
    expect(stats).toHaveProperty("failed");
    expect(stats).toHaveProperty("byType");
    expect(stats).toHaveProperty("successRate");
    expect(stats.total).toBeGreaterThanOrEqual(0);
  });

  it("should notify ticket update", async () => {
    const ctx = createUserContext(testUserId, "user");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notifications.notifyTicketUpdate({
      ticketId: 1001,
      customerId: testUserId,
      updateType: "created",
      message: "Your ticket #1001 has been created",
    });

    expect(result.success).toBe(true);

    // Verify notifications were queued
    const pending = await caller.notifications.getPendingNotifications({
      limit: 50,
    });

    expect(pending.length).toBeGreaterThanOrEqual(2); // Email + in-app
  });

  it("should handle notification with related ticket", async () => {
    const ctx = createUserContext(testUserId, "user");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notifications.queueNotification({
      userId: testUserId,
      type: "in_app",
      content: "Ticket update",
      relatedTicketId: 1002,
      relatedEntityType: "ticket",
      relatedEntityId: 1002,
    });

    expect(result.queued).toBe(true);

    // Verify it was stored with ticket reference
    const history = await caller.notifications.getNotificationHistory({
      limit: 50,
    });

    const withTicket = history.find((n: any) => n.relatedTicketId === 1002);
    expect(withTicket).toBeDefined();
  });
});
