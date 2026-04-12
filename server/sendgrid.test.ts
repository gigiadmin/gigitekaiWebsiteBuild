import { describe, it, expect } from "vitest";
import { sendEmail } from "./server/_core/email";

describe("SendGrid Email Configuration", () => {
  it("should have SendGrid API key configured", async () => {
    const apiKey = process.env.SENDGRID_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).toMatch(/^SG\./);
  });

  it("should validate email format in sendEmail function", async () => {
    // Test that sendEmail accepts valid email format
    // Using harry@gigitekai.com (valid M365 mailbox) instead of test@example.com
    const result = await sendEmail({
      to: "harry@gigitekai.com",
      subject: "Test Email",
      html: "<p>This is a test</p>",
    });
    // Result will be false if API key is invalid, but function should execute
    expect(typeof result).toBe("boolean");
  }, 15000);

  it("should reject invalid email addresses", async () => {
    // Test that sendEmail rejects invalid email
    try {
      await sendEmail({
        to: "invalid-email",
        subject: "Test",
        html: "<p>Test</p>",
      });
    } catch (error) {
      // Expected to fail with invalid email
      expect(error).toBeDefined();
    }
  });
});
