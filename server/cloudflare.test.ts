import { describe, it, expect } from "vitest";

describe("Cloudflare API Token Validation", () => {
  it("should validate Cloudflare API token", async () => {
    const token = process.env.CLOUDFLARE_API_TOKEN;
    expect(token).toBeDefined();
    expect(token?.length).toBeGreaterThan(0);

    // Test token by calling Cloudflare API to get zones
    const response = await fetch("https://api.cloudflare.com/client/v4/zones", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = (await response.json()) as { success: boolean; errors: unknown[] };
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.errors).toEqual([]);
  });
});
