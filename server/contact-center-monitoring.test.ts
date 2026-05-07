/**
 * Contact Center Monitoring — Real-Time Endpoints Tests
 * Tests: getAgentRealTimeStatus, getLiveQueueMetrics, getActiveSessions, getSlaMonitor, refreshService
 */
import { describe, it, expect } from "vitest";

const BASE = "http://localhost:3000/api/trpc";

describe("Contact Center Real-Time Monitoring", () => {
  describe("getAgentRealTimeStatus", () => {
    it("returns agents array and stats object", async () => {
      const res = await fetch(`${BASE}/contactCenter.getAgentRealTimeStatus`);
      expect(res.status).toBe(200);
      const body = await res.json();
      const data = body.result.data.json;
      expect(data).toHaveProperty("agents");
      expect(data).toHaveProperty("stats");
      expect(Array.isArray(data.agents)).toBe(true);
      expect(data.stats).toHaveProperty("total");
      expect(data.stats).toHaveProperty("available");
      expect(data.stats).toHaveProperty("busy");
      expect(data.stats).toHaveProperty("offline");
      expect(data.stats).toHaveProperty("onBreak");
      expect(typeof data.stats.total).toBe("number");
    });

    it("each agent has required fields", async () => {
      const res = await fetch(`${BASE}/contactCenter.getAgentRealTimeStatus`);
      const body = await res.json();
      const data = body.result.data.json;
      if (data.agents.length > 0) {
        const agent = data.agents[0];
        expect(agent).toHaveProperty("id");
        expect(agent).toHaveProperty("name");
        expect(agent).toHaveProperty("status");
        expect(agent).toHaveProperty("specialization");
        expect(agent).toHaveProperty("currentLoad");
        expect(agent).toHaveProperty("maxLoad");
        expect(agent).toHaveProperty("loadPercent");
        expect(typeof agent.loadPercent).toBe("number");
      }
    });
  });

  describe("getLiveQueueMetrics", () => {
    it("returns queues array and summary object", async () => {
      const res = await fetch(`${BASE}/contactCenter.getLiveQueueMetrics`);
      expect(res.status).toBe(200);
      const body = await res.json();
      const data = body.result.data.json;
      expect(data).toHaveProperty("queues");
      expect(data).toHaveProperty("summary");
      expect(Array.isArray(data.queues)).toBe(true);
      expect(data.summary).toHaveProperty("totalWaiting");
      expect(data.summary).toHaveProperty("totalInProgress");
      expect(data.summary).toHaveProperty("avgWaitMin");
      expect(data.summary).toHaveProperty("serviceLevel");
      expect(data.summary).toHaveProperty("todayTotal");
      expect(typeof data.summary.serviceLevel).toBe("number");
    });
  });

  describe("getActiveSessions", () => {
    it("returns sessions array and count", async () => {
      const res = await fetch(`${BASE}/contactCenter.getActiveSessions`);
      expect(res.status).toBe(200);
      const body = await res.json();
      const data = body.result.data.json;
      expect(data).toHaveProperty("sessions");
      expect(data).toHaveProperty("count");
      expect(Array.isArray(data.sessions)).toBe(true);
      expect(typeof data.count).toBe("number");
    });
  });

  describe("getSlaMonitor", () => {
    it("returns SLA metrics with targets and compliance", async () => {
      const res = await fetch(`${BASE}/contactCenter.getSlaMonitor`);
      expect(res.status).toBe(200);
      const body = await res.json();
      const data = body.result.data.json;
      expect(data).toHaveProperty("sla");
      expect(data.sla).toHaveProperty("responseTarget");
      expect(data.sla).toHaveProperty("resolutionTarget");
      expect(data.sla).toHaveProperty("currentResponseAvg");
      expect(data.sla).toHaveProperty("currentResolutionAvg");
      expect(data.sla).toHaveProperty("breaches");
      expect(data.sla).toHaveProperty("compliance");
      expect(data.sla).toHaveProperty("totalTickets24h");
      expect(data.sla.responseTarget).toBe(15);
      expect(data.sla.resolutionTarget).toBe(240);
      expect(data.sla.compliance).toBeGreaterThanOrEqual(0);
      expect(data.sla.compliance).toBeLessThanOrEqual(100);
    });
  });

  describe("refreshService", () => {
    it("returns healthy status for ticketClassifier", async () => {
      const input = encodeURIComponent(JSON.stringify({ json: { service: "ticketClassifier" } }));
      const res = await fetch(`${BASE}/contactCenter.refreshService?input=${input}`);
      expect(res.status).toBe(200);
      const body = await res.json();
      const data = body.result.data.json;
      expect(data).toHaveProperty("service");
      expect(data).toHaveProperty("status");
      expect(data).toHaveProperty("detail");
      expect(data).toHaveProperty("lastChecked");
      expect(data.service).toBe("Ticket Classifier Agent");
      expect(data.status).toBe("healthy");
    });

    it("returns healthy status for kbQA", async () => {
      const input = encodeURIComponent(JSON.stringify({ json: { service: "kbQA" } }));
      const res = await fetch(`${BASE}/contactCenter.refreshService?input=${input}`);
      expect(res.status).toBe(200);
      const body = await res.json();
      const data = body.result.data.json;
      expect(data.service).toBe("KB Q&A Agent");
      expect(data.status).toBe("healthy");
    });

    it("returns healthy status for voiceAgent", async () => {
      const input = encodeURIComponent(JSON.stringify({ json: { service: "voiceAgent" } }));
      const res = await fetch(`${BASE}/contactCenter.refreshService?input=${input}`);
      expect(res.status).toBe(200);
      const body = await res.json();
      const data = body.result.data.json;
      expect(data.service).toBe("Voice Agent");
      expect(data.status).toBe("healthy");
    });

    it("rejects invalid service name", async () => {
      const input = encodeURIComponent(JSON.stringify({ json: { service: "invalid" } }));
      const res = await fetch(`${BASE}/contactCenter.refreshService?input=${input}`);
      expect(res.status).toBe(400);
    });
  });
});
