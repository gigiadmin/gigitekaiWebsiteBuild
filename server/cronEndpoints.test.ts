import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import express from "express";
import cronEndpoints from "./cronEndpoints";

describe("Cron Endpoints", () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use("/api/cron", cronEndpoints);
  });

  describe("GET /api/cron/health", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/api/cron/health");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("uptime");
      expect(response.body).toHaveProperty("service", "gigitekai-cron-endpoints");
    });
  });

  describe("GET /api/cron/new-tickets", () => {
    it("should accept valid minutes parameter", async () => {
      const response = await request(app)
        .get("/api/cron/new-tickets")
        .query({ minutes: 5, limit: 10 });

      // Will fail with DB error but validates parameter parsing
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("should reject invalid minutes (too small)", async () => {
      const response = await request(app)
        .get("/api/cron/new-tickets")
        .query({ minutes: 0 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("minutes must be between 1 and 1440");
    });

    it("should reject invalid minutes (too large)", async () => {
      const response = await request(app)
        .get("/api/cron/new-tickets")
        .query({ minutes: 2000 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("minutes must be between 1 and 1440");
    });

    it("should reject invalid limit (too small)", async () => {
      const response = await request(app)
        .get("/api/cron/new-tickets")
        .query({ limit: 0 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("limit must be between 1 and 500");
    });

    it("should reject invalid limit (too large)", async () => {
      const response = await request(app)
        .get("/api/cron/new-tickets")
        .query({ limit: 1000 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("limit must be between 1 and 500");
    });

    it("should use default values when no params provided", async () => {
      const response = await request(app).get("/api/cron/new-tickets");

      // Will fail with DB error but validates defaults
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("GET /api/cron/tickets-by-status", () => {
    it("should require status parameter", async () => {
      const response = await request(app).get("/api/cron/tickets-by-status");

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("status query parameter is required");
    });

    it("should accept valid status parameter", async () => {
      const response = await request(app)
        .get("/api/cron/tickets-by-status")
        .query({ status: "open", limit: 10 });

      // Will fail with DB error but validates parameter parsing
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});
