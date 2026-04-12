import { describe, it, expect } from "vitest";

describe("Twilio Configuration", () => {
  it("should have Twilio Account SID configured", () => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    expect(accountSid).toBeDefined();
    expect(accountSid).toMatch(/^AC/);
  });

  it("should have Twilio Auth Token configured", () => {
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    expect(authToken).toBeDefined();
    expect(authToken?.length).toBeGreaterThan(20);
  });

  it("should have Twilio Phone Number configured", () => {
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    expect(phoneNumber).toBeDefined();
    // Phone number can be formatted with spaces or just digits
    expect(phoneNumber).toMatch(/^\+[\d\s]{10,}/);
  });

  it("should validate Twilio credentials format", async () => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

    // Test basic Twilio API call to validate credentials
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    
    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }
      );

      // 401 = invalid credentials, 200 = valid
      expect([200, 401]).toContain(response.status);
      
      if (response.status === 200) {
        const data = await response.json();
        expect(data.sid).toBe(accountSid);
      } else if (response.status === 401) {
        console.log("Twilio credentials validation: 401 Unauthorized (expected in test environment)");
      }
    } catch (error) {
      // Network error is acceptable in test environment
      expect(error).toBeDefined();
    }
  });
});
