import { describe, it, expect } from "vitest";

/**
 * Test Jira API credentials by fetching projects
 */
describe("Jira API Integration", () => {
  it("should authenticate with Jira and fetch projects", async () => {
    const jiraUrl = process.env.JIRA_URL;
    const jiraEmail = process.env.JIRA_EMAIL;
    const jiraToken = process.env.JIRA_API_TOKEN;

    expect(jiraUrl).toBeDefined();
    expect(jiraEmail).toBeDefined();
    expect(jiraToken).toBeDefined();

    // Test authentication by fetching projects
    const auth = Buffer.from(`${jiraEmail}:${jiraToken}`).toString("base64");
    const response = await fetch(`${jiraUrl}/rest/api/3/project`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    console.log(`✅ Jira API authenticated successfully. Found ${data.length} projects.`);
  });
});
