import { describe, it, expect } from 'vitest';
import { webPushRouter } from './routers/webPush';
import { createCallerFactory } from './_core/trpc';

describe('Web Push Configuration', () => {
  it('should have VAPID keys configured', () => {
    const vapidPublicKey = process.env.VITE_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

    expect(vapidPublicKey).toBeDefined();
    expect(vapidPrivateKey).toBeDefined();
    expect(vapidPublicKey).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(vapidPrivateKey).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('should have webPushRouter defined with required procedures', () => {
    expect(webPushRouter).toBeDefined();
    expect(webPushRouter._def.procedures).toBeDefined();
    
    // Check that required procedures exist
    const procedures = Object.keys(webPushRouter._def.procedures);
    expect(procedures).toContain('subscribe');
    expect(procedures).toContain('unsubscribe');
    expect(procedures).toContain('getSubscriptions');
    expect(procedures).toContain('sendToUser');
  });

  it('should have valid VAPID key format (base64url)', () => {
    const vapidPublicKey = process.env.VITE_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

    // VAPID keys should be base64url encoded (no padding, URL-safe)
    const base64urlRegex = /^[A-Za-z0-9_-]+$/;
    
    expect(vapidPublicKey).toMatch(base64urlRegex);
    expect(vapidPrivateKey).toMatch(base64urlRegex);
    
    // VAPID keys should be reasonably long (typically 43-44 characters for base64url)
    expect(vapidPublicKey?.length).toBeGreaterThan(30);
    expect(vapidPrivateKey?.length).toBeGreaterThan(20);
  });
});
