import {
  buildFormSubmissionOwnerAlert,
  buildFormSubmissionSupportEmail,
} from "./formSubmissions";
import { describe, expect, it } from "vitest";

const submission = {
  name: "Shameika Kelly",
  email: "client@example.com",
  phone: "555-0100",
  company: "Example Cosmetics",
  category: "IT Discovery",
  source: "web-discovery-form",
  message: [
    "IT DISCOVERY FORM SUBMISSION",
    "CURRENT SITUATION:",
    "- Main Challenges: Improve ecommerce conversion and mobile performance.",
    "AI & AUTOMATION:",
    "- Automation Needs: Connect marketing and analytics workflows.",
  ].join("\n"),
};

describe("web-intake detailed notifications", () => {
  it("includes the complete stored form response in the support email", () => {
    const html = buildFormSubmissionSupportEmail(submission, 240001);

    expect(html).toContain("Shameika Kelly");
    expect(html).toContain("Example Cosmetics");
    expect(html).toContain("IT DISCOVERY FORM SUBMISSION");
    expect(html).toContain("Improve ecommerce conversion and mobile performance.");
    expect(html).toContain("Connect marketing and analytics workflows.");
    expect(html).toContain("/admin/form-submissions");
  });

  it("escapes untrusted form text before placing it in HTML email", () => {
    const html = buildFormSubmissionSupportEmail(
      { ...submission, name: "<script>alert('xss')</script>" },
      240001
    );

    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;");
  });

  it("includes full intake content in the owner alert, not only a summary", () => {
    const alert = buildFormSubmissionOwnerAlert(submission, 240001);

    expect(alert).toContain("client@example.com");
    expect(alert).toContain("555-0100");
    expect(alert).toContain("CURRENT SITUATION:");
    expect(alert).toContain("Improve ecommerce conversion and mobile performance.");
    expect(alert).toContain("/admin/form-submissions");
  });
});
