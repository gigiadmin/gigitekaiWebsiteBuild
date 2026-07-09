import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Sentry Configuration', () => {
  beforeEach(() => {
    // Reset environment
    vi.resetModules();
  });

  it('should have valid Sentry DSN format', () => {
    const dsn = import.meta.env.VITE_SENTRY_DSN;
    
    if (dsn) {
      // DSN should start with https://
      expect(dsn).toMatch(/^https:\/\//);
      
      // DSN should contain @ separator
      expect(dsn).toContain('@');
      
      // DSN should contain ingest.sentry.io or ingest.us.sentry.io
      expect(dsn).toMatch(/ingest\.(us\.)?sentry\.io/);
      
      // DSN should end with a project ID (numeric)
      expect(dsn).toMatch(/\/\d+$/);
      
      console.log('✅ Sentry DSN is valid');
    } else {
      console.log('⚠️ Sentry DSN not configured (expected in development)');
    }
  });

  it('should have correct DSN structure', () => {
    const dsn = import.meta.env.VITE_SENTRY_DSN;
    
    if (dsn) {
      try {
        const url = new URL(dsn);
        
        // Should have a username (public key)
        expect(url.username).toBeTruthy();
        expect(url.username.length).toBeGreaterThan(10);
        
        // Should have hostname containing sentry
        expect(url.hostname).toContain('sentry');
        
        // Should have pathname with project ID
        expect(url.pathname).toMatch(/^\/\d+$/);
        
        console.log('✅ Sentry DSN structure is correct');
      } catch (error) {
        throw new Error(`Invalid Sentry DSN format: ${dsn}`);
      }
    }
  });

  it('should initialize Sentry without errors', async () => {
    // Mock Sentry to avoid actual initialization
    const mockSentry = {
      init: vi.fn(),
      setTag: vi.fn(),
      setUser: vi.fn(),
    };
    
    (window as any).Sentry = mockSentry;
    
    // Import and call initSentry
    const { initSentry } = await import('./sentry');
    
    // Should not throw
    expect(() => {
      initSentry();
    }).not.toThrow();
    
    console.log('✅ Sentry initialization works correctly');
  });
});
