import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database module
vi.mock("./db", () => ({
  logUserActivity: vi.fn(async () => ({ id: 1 })),
  getUserActivityByUserId: vi.fn(async () => [
    {
      id: 1,
      userId: 1,
      activityType: "login",
      description: "User logged in",
      createdAt: new Date(),
    },
  ]),
  getLastLoginByUserId: vi.fn(async () => new Date()),
  submitCustomerFeedback: vi.fn(async () => ({ id: 1 })),
  getCustomerFeedbackByTicket: vi.fn(async () => ({
    id: 1,
    ticketId: 1,
    userId: 1,
    rating: 5,
    comment: "Great service!",
  })),
  getAverageRating: vi.fn(async () => 4.5),
  recordWebsiteTraffic: vi.fn(async () => ({ id: 1 })),
  getWebsiteTrafficByDate: vi.fn(async () => [
    {
      id: 1,
      date: new Date(),
      pageUrl: "/",
      pageTitle: "Home",
      visitors: 100,
      pageViews: 150,
    },
  ]),
  getWebsiteTrafficSummary: vi.fn(async () => ({
    totalVisitors: 1000,
    totalPageViews: 5000,
    avgPageViews: 5,
    topPages: [
      { page: "/", views: 1000 },
      { page: "/services", views: 800 },
    ],
  })),
  getDb: vi.fn(async () => null),
}));

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-123",
      name: "Admin User",
      email: "admin@example.com",
      role: "admin",
      emailVerified: true,
      createdAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "user-123",
      name: "Regular User",
      email: "user@example.com",
      role: "user",
      emailVerified: true,
      createdAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("User Activity Tracking", () => {
  it("should log user activity", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.userActivity.logActivity({
      userId: 1,
      activityType: "login",
      description: "User logged in",
    });

    expect(result).toBeDefined();
  });

  it("should get activity log for a user", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const activities = await caller.userActivity.getActivityLog({
      userId: 1,
      limit: 50,
    });

    expect(Array.isArray(activities)).toBe(true);
    expect(activities.length).toBeGreaterThan(0);
  });

  it("should get last login for a user", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const lastLogin = await caller.userActivity.getLastLogin({
      userId: 1,
    });

    expect(lastLogin).toBeDefined();
  });

  it("should reject non-admin users from logging activity", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.userActivity.logActivity({
        userId: 1,
        activityType: "login",
      });
      expect.fail("Should have thrown error");
    } catch (error: any) {
      expect(error.message).toContain("permission");
    }
  });
});

describe("Customer Feedback & Rating System", () => {
  it("should submit customer feedback", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.customerFeedback.submitFeedback({
      ticketId: 1,
      rating: 5,
      comment: "Great service!",
    });

    expect(result).toBeDefined();
  });

  it("should get feedback for a ticket", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const feedback = await caller.customerFeedback.getFeedback({
      ticketId: 1,
    });

    expect(feedback).toBeDefined();
    expect(feedback?.rating).toBe(5);
  });

  it("should get average rating", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const avgRating = await caller.customerFeedback.getAverageRating({
      ticketId: 1,
    });

    expect(typeof avgRating).toBe("number");
    expect(avgRating).toBeGreaterThan(0);
  });

  it("should reject invalid rating values", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.customerFeedback.submitFeedback({
        ticketId: 1,
        rating: 10, // Invalid: should be 1-5
      });
      expect.fail("Should have thrown error");
    } catch (error: any) {
      expect(error.message).toContain("Too big");
    }
  });

  it("should reject rating below 1", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.customerFeedback.submitFeedback({
        ticketId: 1,
        rating: 0, // Invalid: should be 1-5
      });
      expect.fail("Should have thrown error");
    } catch (error: any) {
      expect(error.message).toContain("Too small");
    }
  });
});

describe("Real-time Website Traffic Analytics", () => {
  it("should track page view", async () => {
    const ctx = { user: null, req: {} as any, res: {} as any };
    const caller = appRouter.createCaller(ctx);

    const result = await caller.websiteTraffic.trackPageView({
      pageUrl: "/services",
      pageTitle: "Services",
      referrer: "google.com",
    });

    expect(result).toBeDefined();
  });

  it("should get traffic stats", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.websiteTraffic.getTrafficStats({
      days: 30,
    });

    expect(stats).toBeDefined();
    expect(stats.totalVisitors).toBeGreaterThan(0);
  });

  it("should get traffic by date", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const traffic = await caller.websiteTraffic.getTrafficByDate({
      date: new Date(),
    });

    expect(Array.isArray(traffic)).toBe(true);
  });

  it("should allow public access to track page views", async () => {
    const ctx = { user: null, req: {} as any, res: {} as any };
    const caller = appRouter.createCaller(ctx);

    const result = await caller.websiteTraffic.trackPageView({
      pageUrl: "/",
    });

    expect(result).toBeDefined();
  });

  it("should reject non-admin users from viewing traffic stats", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.websiteTraffic.getTrafficStats({
        days: 30,
      });
      expect.fail("Should have thrown error");
    } catch (error: any) {
      expect(error.message).toContain("permission");
    }
  });
});
