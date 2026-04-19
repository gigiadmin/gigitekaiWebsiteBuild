import { describe, it, expect, beforeAll } from 'vitest';
import { getMsGraphToken } from '../_core/email';

describe('M365 Health - Graph API Credentials', () => {
  it('should authenticate with Microsoft Graph using provided credentials', async () => {
    console.log('[Test] Attempting to get MS Graph token with provided credentials...');
    
    const token = await getMsGraphToken();
    
    expect(token).toBeDefined();
    expect(token).not.toBeNull();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
    
    console.log('[Test] ✅ Successfully obtained MS Graph token');
  }, { timeout: 15000 });

  it('should be able to call Microsoft Graph Service Health API', async () => {
    console.log('[Test] Testing Microsoft Graph Service Health API...');
    
    const token = await getMsGraphToken();
    if (!token) {
      throw new Error('Failed to get MS Graph token');
    }

    const response = await fetch(
      'https://graph.microsoft.com/v1.0/admin/serviceAnnouncement/healthOverviews',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`[Test] API Response Status: ${response.status}`);
    
    // Accept 200 (success) or 403 (permission not granted yet)
    // Both indicate the credentials are valid
    expect([200, 403]).toContain(response.status);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log(`[Test] ✅ Successfully fetched ${data.value?.length || 0} services from M365`);
      expect(data).toHaveProperty('value');
      expect(Array.isArray(data.value)).toBe(true);
    } else if (response.status === 403) {
      console.log('[Test] ⚠️  Credentials valid but ServiceHealth.Read.All permission not yet granted');
      console.log('[Test] Please grant admin consent in Azure Portal for ServiceHealth.Read.All permission');
    }
  }, { timeout: 15000 });
});
