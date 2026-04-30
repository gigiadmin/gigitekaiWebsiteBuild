import { describe, it, expect, beforeAll } from 'vitest';
import { invokeLLM } from './server/_core/llm';

/**
 * Test Azure credentials by making a lightweight API call
 * This validates that AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, and AZURE_TENANT_ID are correct
 */
describe('Azure Credentials Validation', () => {
  let accessToken: string;

  beforeAll(async () => {
    // Get access token using the provided credentials
    const tokenUrl = `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`;
    
    const tokenBody = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.AZURE_CLIENT_ID || '',
      client_secret: process.env.AZURE_CLIENT_SECRET || '',
      scope: 'https://graph.microsoft.com/.default',
    });

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        body: tokenBody,
      });

      if (!response.ok) {
        throw new Error(`Token request failed: ${response.statusText}`);
      }

      const data = await response.json();
      accessToken = data.access_token;
    } catch (error) {
      console.error('Failed to get access token:', error);
      throw error;
    }
  });

  it('should have valid Azure Tenant ID', () => {
    expect(process.env.AZURE_TENANT_ID).toBeDefined();
    expect(process.env.AZURE_TENANT_ID).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it('should have valid Azure Client ID', () => {
    expect(process.env.AZURE_CLIENT_ID).toBeDefined();
    expect(process.env.AZURE_CLIENT_ID).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it('should have valid Azure Client Secret', () => {
    expect(process.env.AZURE_CLIENT_SECRET).toBeDefined();
    expect(process.env.AZURE_CLIENT_SECRET?.length).toBeGreaterThan(0);
  });

  it('should have valid Copilot Studio Environment ID', () => {
    expect(process.env.COPILOT_STUDIO_ENVIRONMENT_ID).toBeDefined();
    expect(process.env.COPILOT_STUDIO_ENVIRONMENT_ID).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it('should successfully authenticate with Azure credentials', async () => {
    expect(accessToken).toBeDefined();
    expect(accessToken.length).toBeGreaterThan(0);
  });

  it('should be able to call Microsoft Graph API with the access token', async () => {
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.id).toBeDefined();
  });

  it('should be able to access Teams Phone data', async () => {
    const response = await fetch('https://graph.microsoft.com/v1.0/me/messages?$top=1', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.value).toBeDefined();
  });
});
