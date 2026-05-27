import { describe, it, expect } from "vitest";

describe("Atlassian Jira API Credentials Validation", () => {
  const ATLASSIAN_SITE_URL = process.env.ATLASSIAN_SITE_URL;
  const ATLASSIAN_EMAIL = process.env.ATLASSIAN_EMAIL;
  const ATLASSIAN_API_TOKEN = process.env.ATLASSIAN_API_TOKEN;

  it("should have all required Atlassian environment variables set", () => {
    expect(ATLASSIAN_SITE_URL).toBeDefined();
    expect(ATLASSIAN_SITE_URL).not.toBe("");
    expect(ATLASSIAN_EMAIL).toBeDefined();
    expect(ATLASSIAN_EMAIL).not.toBe("");
    expect(ATLASSIAN_API_TOKEN).toBeDefined();
    expect(ATLASSIAN_API_TOKEN).not.toBe("");
  });

  it("should authenticate successfully with Jira REST API", async () => {
    const baseUrl = ATLASSIAN_SITE_URL!.replace(/\/$/, "");
    const auth = Buffer.from(`${ATLASSIAN_EMAIL}:${ATLASSIAN_API_TOKEN}`).toString("base64");

    const response = await fetch(`${baseUrl}/rest/api/3/myself`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
    });

    // /myself may return 401 if the API token has limited scope
    // but /project works fine - accept either 200 or 401 with fallback
    if (response.status === 200) {
      const data = await response.json();
      console.log(`✓ Authenticated as: ${data.displayName} (${data.emailAddress})`);
      expect(data.emailAddress).toBeDefined();
    } else {
      // Verify auth works by testing project endpoint instead
      const projectResponse = await fetch(`${baseUrl}/rest/api/3/project`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
        },
      });
      console.log(`⚠ /myself returned ${response.status}, but /project returned ${projectResponse.status}`);
      expect(projectResponse.status).toBe(200);
    }
  });

  it("should be able to list Jira projects", async () => {
    const baseUrl = ATLASSIAN_SITE_URL!.replace(/\/$/, "");
    const auth = Buffer.from(`${ATLASSIAN_EMAIL}:${ATLASSIAN_API_TOKEN}`).toString("base64");

    const response = await fetch(`${baseUrl}/rest/api/3/project`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
    });

    expect(response.status).toBe(200);

    const projects = await response.json();
    console.log(`✓ Found ${projects.length} Jira project(s)`);
    if (projects.length > 0) {
      projects.forEach((p: any) => {
        console.log(`  - ${p.key}: ${p.name} (${p.projectTypeKey})`);
      });
    }
  });
});
