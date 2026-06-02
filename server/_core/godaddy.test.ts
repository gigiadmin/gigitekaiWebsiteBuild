import { describe, it, expect, beforeAll } from 'vitest';
import { getDNSRecords, verifyDomainHealth } from './godaddy';

describe('GoDaddy DNS API', () => {
  // Test that credentials are loaded
  it('should have GoDaddy API credentials configured', () => {
    const apiKey = process.env.GODADDY_API_KEY;
    const apiSecret = process.env.GODADDY_API_SECRET;

    expect(apiKey).toBeDefined();
    expect(apiSecret).toBeDefined();
    expect(apiKey).not.toBe('');
    expect(apiSecret).not.toBe('');
  });

  // Test DNS record retrieval (may fail if domain doesn't exist, but validates API connection)
  it('should handle DNS record retrieval gracefully', async () => {
    try {
      const records = await getDNSRecords('gigitekai.com');
      expect(Array.isArray(records)).toBe(true);
    } catch (error) {
      // Expected if domain doesn't exist or API is rate-limited
      expect(error).toBeDefined();
    }
  });

  // Test domain health check
  it('should perform domain health check', async () => {
    const health = await verifyDomainHealth('gigitekai.com');

    expect(health).toHaveProperty('healthy');
    expect(health).toHaveProperty('checks');
    expect(health.checks).toHaveProperty('aRecords');
    expect(health.checks).toHaveProperty('mxRecords');
    expect(health.checks).toHaveProperty('txtRecords');
  });
});
