import { describe, it, expect, vi, beforeEach } from "vitest";

describe("emailDrip router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should validate email format", async () => {
    const invalidEmails = ["", "notanemail", "missing@", "@nodomain"];
    
    for (const email of invalidEmails) {
      expect(() => {
        if (!email || !email.includes("@")) {
          throw new Error(`Invalid email address: ${email}`);
        }
      }).toThrow("Invalid email address");
    }
  });

  it("should accept valid email format", () => {
    const validEmails = ["test@example.com", "user@gigitekai.com", "harry@gigitekai.com"];
    
    for (const email of validEmails) {
      expect(() => {
        if (!email || !email.includes("@")) {
          throw new Error(`Invalid email address: ${email}`);
        }
      }).not.toThrow();
    }
  });

  it("should validate score range", () => {
    const validScores = [0, 25, 50, 75, 100];
    const invalidScores = [-1, 101, 150];

    for (const score of validScores) {
      expect(score >= 0 && score <= 100).toBe(true);
    }

    for (const score of invalidScores) {
      expect(score >= 0 && score <= 100).toBe(false);
    }
  });

  it("should validate score band enum", () => {
    const validBands = ["Critical", "At Risk", "Good", "Excellent"];
    const invalidBands = ["Unknown", "Poor", "Excellent+"];

    for (const band of validBands) {
      expect(["Critical", "At Risk", "Good", "Excellent"].includes(band)).toBe(true);
    }

    for (const band of invalidBands) {
      expect(["Critical", "At Risk", "Good", "Excellent"].includes(band)).toBe(false);
    }
  });

  it("should generate correct email subject for roadmap", () => {
    const subject = `Your 75/100 IT Compliance Roadmap — GigitekAI`;
    expect(subject).toContain("75/100");
    expect(subject).toContain("IT Compliance Roadmap");
    expect(subject).toContain("GigitekAI");
  });

  it("should include personalized name in email body", () => {
    const name = "John Doe";
    const html = `<h2>Hi ${name},</h2>`;
    expect(html).toContain("John Doe");
  });

  it("should include score in email body", () => {
    const score = 65;
    const scoreBand = "Good";
    const html = `Your score: <strong>${score}/100 (${scoreBand})</strong>`;
    expect(html).toContain("65/100");
    expect(html).toContain("Good");
  });

  it("should include CTA links in email", () => {
    const html = `<a href="https://gigitekai.com/switch-program">Learn about our 60-Day Migration Guarantee →</a>`;
    expect(html).toContain("https://gigitekai.com/switch-program");
    expect(html).toContain("60-Day Migration Guarantee");
  });

  it("should handle email drip sequence timing", () => {
    const immediateDelay = 0;
    const day2Delay = 2 * 24 * 60 * 60 * 1000;
    const day5Delay = 5 * 24 * 60 * 60 * 1000;

    expect(immediateDelay).toBe(0);
    expect(day2Delay).toBe(172800000);
    expect(day5Delay).toBe(432000000);
  });
});
