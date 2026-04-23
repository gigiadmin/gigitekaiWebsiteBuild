import { describe, it, expect } from "vitest";
import { getMsGraphToken } from "./server/_core/email";

describe("Microsoft Graph Integration", () => {
  it("should successfully obtain an access token using provided credentials", async () => {
    const token = await getMsGraphToken();

    // Token should be a non-empty string
    expect(token).toBeTruthy();
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);

    // JWT tokens typically have 3 parts separated by dots
    const parts = token.split(".");
    expect(parts.length).toBe(3);

    console.log("✅ Microsoft Graph token obtained successfully");
    console.log(`   Token length: ${token.length} characters`);
    console.log(`   Token preview: ${token.substring(0, 20)}...`);
  });

  it("should cache the token and return the same token on subsequent calls", async () => {
    const token1 = await getMsGraphToken();
    const token2 = await getMsGraphToken();

    expect(token1).toBe(token2);
    console.log("✅ Token caching works correctly");
  });
});
