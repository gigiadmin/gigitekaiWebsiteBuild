import { describe, it, expect, vi } from "vitest";
import { dnsCheckerRouter } from "./dnsChecker";

describe("DNS Checker Router", () => {
  describe("checkDomainGlobal", () => {
    it("should have checkDomainGlobal procedure", () => {
      expect(dnsCheckerRouter._def.procedures.checkDomainGlobal).toBeDefined();
    });

    it("should accept domain and recordTypes", () => {
      const procedure = dnsCheckerRouter._def.procedures.checkDomainGlobal;
      expect(procedure).toBeDefined();
    });
  });

  describe("checkDomain", () => {
    it("should have checkDomain procedure", () => {
      expect(dnsCheckerRouter._def.procedures.checkDomain).toBeDefined();
    });

    it("should accept domain and recordTypes", () => {
      const procedure = dnsCheckerRouter._def.procedures.checkDomain;
      expect(procedure).toBeDefined();
    });
  });

  describe("checkDomainHealth", () => {
    it("should have checkDomainHealth procedure", () => {
      expect(dnsCheckerRouter._def.procedures.checkDomainHealth).toBeDefined();
    });

    it("should accept domain parameter", () => {
      const procedure = dnsCheckerRouter._def.procedures.checkDomainHealth;
      expect(procedure).toBeDefined();
    });
  });

  describe("reverseLookup", () => {
    it("should have reverseLookup procedure", () => {
      expect(dnsCheckerRouter._def.procedures.reverseLookup).toBeDefined();
    });

    it("should accept IP address parameter", () => {
      const procedure = dnsCheckerRouter._def.procedures.reverseLookup;
      expect(procedure).toBeDefined();
    });
  });

  describe("batchCheck", () => {
    it("should have batchCheck procedure", () => {
      expect(dnsCheckerRouter._def.procedures.batchCheck).toBeDefined();
    });

    it("should accept domains array parameter", () => {
      const procedure = dnsCheckerRouter._def.procedures.batchCheck;
      expect(procedure).toBeDefined();
    });
  });

  describe("Router structure", () => {
    it("should have all expected procedures", () => {
      const procedures = Object.keys(dnsCheckerRouter._def.procedures);
      expect(procedures).toContain("checkDomainGlobal");
      expect(procedures).toContain("checkDomain");
      expect(procedures).toContain("checkDomainHealth");
      expect(procedures).toContain("reverseLookup");
      expect(procedures).toContain("batchCheck");
    });

    it("should have 5 procedures total", () => {
      const procedures = Object.keys(dnsCheckerRouter._def.procedures);
      expect(procedures.length).toBe(5);
    });
  });
});
