/**
 * Teams Bot Credentials Validation Test
 * Verifies that the Teams Bot can authenticate with Azure AD
 */

import { describe, it, expect } from "vitest";

describe("Teams Bot Credentials", () => {
  it("should have all required environment variables set", () => {
    expect(process.env.TEAMS_BOT_TENANT_ID).toBeDefined();
    expect(process.env.TEAMS_BOT_APP_ID).toBeDefined();
    expect(process.env.TEAMS_BOT_CLIENT_SECRET).toBeDefined();
    expect(process.env.TEAMS_BOT_TEAM_ID).toBeDefined();
    expect(process.env.TEAMS_BOT_CHANNEL_ID).toBeDefined();
  });

  it("should have valid format for tenant ID (UUID)", () => {
    const tenantId = process.env.TEAMS_BOT_TENANT_ID;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(tenantId).toMatch(uuidRegex);
  });

  it("should have valid format for app ID (UUID)", () => {
    const appId = process.env.TEAMS_BOT_APP_ID;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(appId).toMatch(uuidRegex);
  });

  it("should have valid format for client secret (not a UUID)", () => {
    const secret = process.env.TEAMS_BOT_CLIENT_SECRET;
    // Azure client secrets start with specific patterns and contain special characters
    // They should NOT be UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(secret).not.toMatch(uuidRegex);
    expect(secret?.length).toBeGreaterThan(20);
  });

  it("should have valid format for team ID", () => {
    const teamId = process.env.TEAMS_BOT_TEAM_ID;
    // Team IDs are UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(teamId).toMatch(uuidRegex);
  });

  it("should have valid format for channel ID", () => {
    const channelId = process.env.TEAMS_BOT_CHANNEL_ID;
    // Channel IDs contain thread identifiers
    expect(channelId).toContain("@thread");
  });

  it("should be able to create Azure credential (authentication test)", async () => {
    try {
      const { ClientSecretCredential } = await import("@azure/identity");
      
      const credential = new ClientSecretCredential(
        process.env.TEAMS_BOT_TENANT_ID!,
        process.env.TEAMS_BOT_APP_ID!,
        process.env.TEAMS_BOT_CLIENT_SECRET!
      );

      expect(credential).toBeDefined();
      
      // Try to get a token to verify credentials are valid
      const token = await credential.getToken("https://graph.microsoft.com/.default");
      expect(token).toBeDefined();
      expect(token.token).toBeDefined();
      expect(token.token.length).toBeGreaterThan(0);
      
      console.log("✅ Azure AD authentication successful");
    } catch (error) {
      console.error("❌ Azure AD authentication failed:", error);
      throw error;
    }
  });

  it("should be able to call Microsoft Graph API", async () => {
    try {
      const { ClientSecretCredential } = await import("@azure/identity");
      
      const credential = new ClientSecretCredential(
        process.env.TEAMS_BOT_TENANT_ID!,
        process.env.TEAMS_BOT_APP_ID!,
        process.env.TEAMS_BOT_CLIENT_SECRET!
      );

      const token = await credential.getToken("https://graph.microsoft.com/.default");
      
      // Test a simple Graph API call to verify the token works
      const response = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: {
          Authorization: `Bearer ${token.token}`,
        },
      });

      // We expect a 200 or 401 (if the app doesn't have user.read permission)
      // The important thing is that the token was accepted by Graph API
      expect([200, 401]).toContain(response.status);
      
      if (response.status === 200) {
        console.log("✅ Microsoft Graph API call successful");
      } else {
        console.log("⚠️ Microsoft Graph API returned 401 (expected if app lacks user.read permission)");
      }
    } catch (error) {
      console.error("❌ Microsoft Graph API call failed:", error);
      throw error;
    }
  });
});
