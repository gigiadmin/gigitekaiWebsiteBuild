import { describe, expect, it } from "vitest";
import {
  validateWebDiscoverySection,
  validateWebDiscoverySubmission,
} from "../client/src/lib/webDiscoveryValidation";

const validValues = {
  contactName: "Launch QA",
  contactEmail: "launch.qa@gigitekai.com",
  contactPhone: "727-382-6909",
  companyName: "GigitekAI",
  companySize: "11-50",
  industry: "Technology",
  currentChallenges: "Manual workflows and inconsistent reporting",
  currentSystems: "Microsoft 365 and Azure",
  mainPainPoint: "Too much manual operational work",
  cloudUsage: "hybrid",
  securityConcerns: "Identity and endpoint protection",
  dataBackup: "Cloud backup with retention requirements",
  topPriority: "Improve security posture",
  desiredOutcome: "Automated, measurable IT operations",
  timeline: "short",
  aiInterest: "interested",
  automationNeeds: "Ticket triage and onboarding",
  costSavingsGoal: "Reduce repetitive work",
  currentSupport: "Internal IT plus outside support",
  supportIssues: "Slow turnaround and inconsistent ownership",
  budgetRange: "5-10k",
  additionalInfo: "",
};

describe("web discovery validation", () => {
  it("keeps an empty required contact section from advancing", () => {
    const errors = validateWebDiscoverySection(
      { ...validValues, contactName: "", contactEmail: "", contactPhone: "" },
      0
    );

    expect(errors.contactName).toContain("required");
    expect(errors.contactEmail).toContain("required");
    expect(errors.contactPhone).toContain("required");
  });

  it("rejects malformed email addresses and short phone numbers", () => {
    const errors = validateWebDiscoverySection(
      { ...validValues, contactEmail: "not-an-email", contactPhone: "123" },
      0
    );

    expect(errors.contactEmail).toContain("valid email");
    expect(errors.contactPhone).toContain("10 digits");
  });

  it("reports the earliest incomplete section before final submission", () => {
    const result = validateWebDiscoverySubmission({
      ...validValues,
      automationNeeds: "",
      budgetRange: "",
    });

    expect(result.firstInvalidSection).toBe(4);
    expect(result.errors.automationNeeds).toContain("required");
    expect(result.errors.budgetRange).toContain("required");
  });

  it("accepts a complete required discovery intake", () => {
    const result = validateWebDiscoverySubmission(validValues);

    expect(result.errors).toEqual({});
    expect(result.firstInvalidSection).toBeNull();
  });
});
