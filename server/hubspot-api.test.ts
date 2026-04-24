import { describe, it, expect, beforeAll } from "vitest";
import axios from "axios";

describe("HubSpot API Integration", () => {
  let apiKey: string;

  beforeAll(() => {
    apiKey = process.env.HUBSPOT_API_KEY || "";
    if (!apiKey) {
      throw new Error("HUBSPOT_API_KEY environment variable not set");
    }
  });

  it("should validate HubSpot API key by fetching account info", async () => {
    try {
      const response = await axios.get("https://api.hubapi.com/crm/v3/objects/companies", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        params: {
          limit: 1,
        },
      });

      // If we get a 200 response, the API key is valid
      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(response.data.results).toBeDefined();
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error(`HubSpot API key is invalid or lacks permissions: ${error.response.statusText}`);
      }
      throw error;
    }
  });

  it("should have required scopes for company creation", async () => {
    try {
      // Test creating a temporary company to verify write permissions
      const testCompanyName = `Test-${Date.now()}`;

      const response = await axios.post(
        "https://api.hubapi.com/crm/v3/objects/companies",
        {
          properties: {
            name: testCompanyName,
            domain: "test-domain.com",
          },
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      expect(response.status).toBe(201);
      expect(response.data.id).toBeDefined();

      // Clean up: delete the test company
      const companyId = response.data.id;
      await axios.delete(`https://api.hubapi.com/crm/v3/objects/companies/${companyId}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error("HubSpot API key lacks write permissions for companies. Enable crm.objects.companies.write scope.");
      }
      throw error;
    }
  });

  it("should have required scopes for contact creation", async () => {
    try {
      // Test creating a temporary contact to verify write permissions
      const testEmail = `test-${Date.now()}@example.com`;

      const response = await axios.post(
        "https://api.hubapi.com/crm/v3/objects/contacts",
        {
          properties: {
            firstname: "Test",
            lastname: "Contact",
            email: testEmail,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      expect(response.status).toBe(201);
      expect(response.data.id).toBeDefined();

      // Clean up: delete the test contact
      const contactId = response.data.id;
      await axios.delete(`https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error("HubSpot API key lacks write permissions for contacts. Enable crm.objects.contacts.write scope.");
      }
      throw error;
    }
  });
});
