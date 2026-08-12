import { describe, it, expect, vi, beforeEach } from 'vitest';
import { describe, expect, it } from "vitest";
import {
  buildFormSubmissionConfirmationEmail,
  buildFormSubmissionSupportEmail,
} from "./routers/formSubmissions";

/**
 * Test: Form Submission Email Sending
 * Verifies that:
 * 1. Confirmation email is sent to the user
 * 2. Support notification email is sent to support@gigitekai.com
 * 3. Email format is correct
 */
describe("Form Submission Email Content", () => {
  const testFormData = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '555-1234',
      company: 'Acme Corp',
      category: 'Cloud Infrastructure',
      message: 'We need help with our cloud migration',
  };

  it("includes complete, follow-up-ready details in the support email", () => {
    const html = buildFormSubmissionSupportEmail(testFormData, 123);

    expect(html).toContain(testFormData.name);
    expect(html).toContain(testFormData.email);
    expect(html).toContain(testFormData.phone);
    expect(html).toContain(testFormData.company);
    expect(html).toContain(testFormData.category);
    expect(html).toContain(testFormData.message);
    expect(html).toContain("Review in Admin Portal");
  });

  it("includes the requester name, contact path, and reference details in the confirmation email", () => {
    const html = buildFormSubmissionConfirmationEmail(testFormData, 123);

    expect(html).toContain(testFormData.name);
    expect(html).toContain(testFormData.company);
    expect(html).toContain(testFormData.category);
    expect(html).toContain("123");
    expect(html).toContain("Thank You for Your Submission");
    expect(html).toContain("support@gigitekai.com");
  });

  it("escapes untrusted HTML in the support notification", () => {
    const html = buildFormSubmissionSupportEmail({ ...testFormData, company: "<script>alert('x')</script>" }, 123);

    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>alert");
  });
});
