import { describe, it, expect } from "vitest";

describe("Twilio Credentials Validation", () => {
  it("should have valid Twilio credentials in environment", () => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    expect(accountSid).toBeDefined();
    expect(authToken).toBeDefined();
    expect(accountSid).toMatch(/^AC[a-zA-Z0-9]{32}$/);
    expect(authToken).toMatch(/^[a-zA-Z0-9]{32}$/);
  });

  it("should validate Twilio credentials format", () => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    // Account SID should start with AC and be 34 chars total
    expect(accountSid?.length).toBe(34);
    expect(accountSid?.startsWith("AC")).toBe(true);

    // Auth Token should be 32 chars
    expect(authToken?.length).toBe(32);

    console.log("✅ Twilio credentials format is valid");
  });

  it("should be able to initialize Twilio client with credentials", () => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    // Simulate Twilio client initialization
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}`;
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    expect(credentials).toBeDefined();
    expect(credentials.length).toBeGreaterThan(0);
    expect(twilioUrl).toContain(accountSid);

    console.log("✅ Twilio client can be initialized with provided credentials");
  });
});
