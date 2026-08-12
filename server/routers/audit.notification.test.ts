import { describe, expect, it } from "vitest";
import { buildFreeAuditSupportEmail } from "./audit";

describe("free-audit support notification", () => {
  it("includes the full operational follow-up details", () => {
    const html = buildFreeAuditSupportEmail(
      {
        companyName: "Northstar Medical",
        industry: "Healthcare",
        description: "A multi-location healthcare provider.",
        contactName: "Jordan Smith",
        contactEmail: "jordan@example.com",
        contactPhone: "727-555-0199",
        auditType: "Security assessment",
        currentChallenges: "Need stronger identity controls.",
        goals: "Improve compliance readiness.",
      },
      42
    );

    expect(html).toContain("Northstar Medical");
    expect(html).toContain("jordan@example.com");
    expect(html).toContain("Security assessment");
    expect(html).toContain("Need stronger identity controls.");
    expect(html).toContain("Improve compliance readiness.");
    expect(html).toContain("Submission ID");
  });

  it("escapes untrusted client form content before inserting it into HTML", () => {
    const html = buildFreeAuditSupportEmail(
      {
        companyName: "<img src=x onerror=alert(1)>",
        industry: "Technology",
        contactName: "<script>alert(1)</script>",
        contactEmail: "test@example.com",
      },
      7
    );

    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("<img src=x onerror=alert(1)>");
  });
});
