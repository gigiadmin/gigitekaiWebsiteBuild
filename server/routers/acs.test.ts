import { describe, it, expect } from "vitest";
import { getPhoneNumbers, getStatus } from "./acs";

describe("ACS Router — Phone Numbers & Status", () => {
  it("should fetch phone numbers from ACS (if connection string is valid)", async () => {
    try {
      const result = await getPhoneNumbers();
      expect(result).toBeDefined();
      expect(Array.isArray(result.phoneNumbers)).toBe(true);
      console.log("✓ ACS phone numbers fetched successfully");
    } catch (error: any) {
      if (error.message.includes("No ACS connection string")) {
        console.log("⚠ ACS_CONNECTION_STRING not configured (expected in dev)");
      } else {
        throw error;
      }
    }
  });

  it("should fetch ACS status (if connection string is valid)", async () => {
    try {
      const result = await getStatus();
      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
      console.log("✓ ACS status fetched successfully");
    } catch (error: any) {
      if (error.message.includes("No ACS connection string")) {
        console.log("⚠ ACS_CONNECTION_STRING not configured (expected in dev)");
      } else {
        throw error;
      }
    }
  });
});
