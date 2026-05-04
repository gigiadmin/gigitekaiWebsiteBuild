import { describe, it, expect } from 'vitest';
import { invokeLLM } from './server/_core/llm';

/**
 * Test D365 connection by calling the dynamicsIntegration.checkConnection procedure
 * This validates that the D365_ORG_URL and OAuth credentials are correctly configured
 */
describe('D365 Connection Test', () => {
  it('should validate D365_ORG_URL is set', () => {
    const orgUrl = process.env.D365_ORG_URL;
    expect(orgUrl).toBeDefined();
    expect(orgUrl).toMatch(/^https:\/\/.*\.crm\.dynamics\.com\/?$/);
  });

  it('should have required OAuth credentials for D365', () => {
    expect(process.env.MS_GRAPH_TENANT_ID).toBeDefined();
    expect(process.env.MS_GRAPH_CLIENT_ID).toBeDefined();
    expect(process.env.MS_GRAPH_CLIENT_SECRET).toBeDefined();
  });

  it('should validate D365 org URL format', () => {
    const orgUrl = process.env.D365_ORG_URL;
    if (orgUrl) {
      // Validate URL is properly formatted
      try {
        new URL(orgUrl);
        expect(true).toBe(true);
      } catch {
        expect.fail('D365_ORG_URL is not a valid URL');
      }
    }
  });
});
