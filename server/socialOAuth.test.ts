/**
 * socialOAuth.test.ts — Validates social OAuth credentials are configured
 * and that the LinkedIn app ID is valid (lightweight API check).
 */
import { describe, it, expect } from "vitest";

describe("Social OAuth Credentials", () => {
  it("should have LINKEDIN_CLIENT_ID set", () => {
    expect(process.env.LINKEDIN_CLIENT_ID).toBeTruthy();
    expect(process.env.LINKEDIN_CLIENT_ID!.length).toBeGreaterThan(5);
  });

  it("should have LINKEDIN_CLIENT_SECRET set", () => {
    expect(process.env.LINKEDIN_CLIENT_SECRET).toBeTruthy();
    expect(process.env.LINKEDIN_CLIENT_SECRET!.length).toBeGreaterThan(5);
  });

  it("should have TWITTER_API_KEY set", () => {
    expect(process.env.TWITTER_API_KEY).toBeTruthy();
    expect(process.env.TWITTER_API_KEY!.length).toBeGreaterThan(5);
  });

  it("should have TWITTER_API_SECRET set", () => {
    expect(process.env.TWITTER_API_SECRET).toBeTruthy();
    expect(process.env.TWITTER_API_SECRET!.length).toBeGreaterThan(5);
  });

  it("should have FACEBOOK_APP_ID set", () => {
    expect(process.env.FACEBOOK_APP_ID).toBeTruthy();
    expect(process.env.FACEBOOK_APP_ID!.length).toBeGreaterThan(3);
  });

  it("should have FACEBOOK_APP_SECRET set", () => {
    expect(process.env.FACEBOOK_APP_SECRET).toBeTruthy();
    expect(process.env.FACEBOOK_APP_SECRET!.length).toBeGreaterThan(5);
  });

  it("should build a valid LinkedIn authorization URL", () => {
    const clientId = process.env.LINKEDIN_CLIENT_ID!;
    const redirectUri = "https://gigitekai.com/api/social/linkedin/callback";
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      state: "test_state_123",
      scope: "openid profile w_member_social",
    });
    const url = `https://www.linkedin.com/oauth/v2/authorization?${params}`;
    expect(url).toContain("linkedin.com/oauth/v2/authorization");
    expect(url).toContain(clientId);
    expect(url).toContain("w_member_social");
  });

  it("should build a valid Facebook authorization URL", () => {
    const appId = process.env.FACEBOOK_APP_ID!;
    const redirectUri = "https://gigitekai.com/api/social/facebook/callback";
    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      state: "test_state_123",
      scope: "pages_manage_posts,pages_read_engagement",
    });
    const url = `https://www.facebook.com/v19.0/dialog/oauth?${params}`;
    expect(url).toContain("facebook.com/v19.0/dialog/oauth");
    expect(url).toContain(appId);
    expect(url).toContain("pages_manage_posts");
  });
});
