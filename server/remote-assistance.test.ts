/**
 * Remote Assistance System - Comprehensive Test Suite
 * Tests for session management, security, and RBAC
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  encryptData,
  decryptData,
  generateEncryptionKey,
  hashData,
  validateIpAddress,
  validateGeographicLocation,
  permissionChecker,
  SessionTokenManager,
  SessionRateLimiter,
} from '../server/security/remote-assistance-security';

describe('Remote Assistance Security Module', () => {
  describe('Encryption', () => {
    it('should encrypt and decrypt data correctly', () => {
      const masterKey = 'test-master-key';
      const salt = 'test-salt';
      const encryptionKey = generateEncryptionKey(masterKey, salt);

      const originalData = 'Sensitive information';
      const encrypted = encryptData(originalData, encryptionKey);

      expect(encrypted.encrypted).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.authTag).toBeDefined();

      const decrypted = decryptData(
        encrypted.encrypted,
        encrypted.iv,
        encrypted.authTag,
        encryptionKey
      );

      expect(decrypted).toBe(originalData);
    });

    it('should generate different ciphertexts for same plaintext', () => {
      const masterKey = 'test-master-key';
      const salt = 'test-salt';
      const encryptionKey = generateEncryptionKey(masterKey, salt);

      const data = 'Test data';
      const encrypted1 = encryptData(data, encryptionKey);
      const encrypted2 = encryptData(data, encryptionKey);

      expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
    });

    it('should fail to decrypt with wrong key', () => {
      const masterKey = 'test-master-key';
      const wrongMasterKey = 'wrong-master-key';
      const salt = 'test-salt';

      const encryptionKey = generateEncryptionKey(masterKey, salt);
      const wrongKey = generateEncryptionKey(wrongMasterKey, salt);

      const data = 'Sensitive information';
      const encrypted = encryptData(data, encryptionKey);

      expect(() => {
        decryptData(encrypted.encrypted, encrypted.iv, encrypted.authTag, wrongKey);
      }).toThrow();
    });
  });

  describe('Hashing', () => {
    it('should hash data consistently', () => {
      const data = 'test-data';
      const hash1 = hashData(data);
      const hash2 = hashData(data);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different data', () => {
      const hash1 = hashData('data1');
      const hash2 = hashData('data2');

      expect(hash1).not.toBe(hash2);
    });

    it('should produce 64-character hex string', () => {
      const hash = hashData('test');
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('IP Address Validation', () => {
    it('should allow IP in allowed ranges', () => {
      const allowed = validateIpAddress('192.168.1.100', ['192.168.0.0/16']);
      expect(allowed).toBe(true);
    });

    it('should block IP in blocked ranges', () => {
      const blocked = validateIpAddress('10.0.0.1', undefined, ['10.0.0.0/8']);
      expect(blocked).toBe(false);
    });

    it('should allow IP when no restrictions', () => {
      const allowed = validateIpAddress('8.8.8.8');
      expect(allowed).toBe(true);
    });

    it('should reject invalid IP format', () => {
      const invalid = validateIpAddress('invalid-ip');
      expect(invalid).toBe(false);
    });
  });

  describe('Geographic Location Validation', () => {
    it('should allow country in allowed list', () => {
      const allowed = validateGeographicLocation('US', ['US', 'CA', 'MX']);
      expect(allowed).toBe(true);
    });

    it('should block country in blocked list', () => {
      const blocked = validateGeographicLocation('CN', undefined, ['CN', 'RU']);
      expect(blocked).toBe(false);
    });

    it('should allow country when no restrictions', () => {
      const allowed = validateGeographicLocation('GB');
      expect(allowed).toBe(true);
    });
  });

  describe('Permission Checker', () => {
    it('should grant admin all permissions', () => {
      expect(permissionChecker.hasPermission('admin', 'view_all_sessions')).toBe(true);
      expect(permissionChecker.hasPermission('admin', 'manage_sessions')).toBe(true);
      expect(permissionChecker.hasPermission('admin', 'manage_policies')).toBe(true);
    });

    it('should grant technician limited permissions', () => {
      expect(permissionChecker.hasPermission('technician', 'create_session')).toBe(true);
      expect(permissionChecker.hasPermission('technician', 'view_own_sessions')).toBe(true);
      expect(permissionChecker.hasPermission('technician', 'manage_policies')).toBe(false);
    });

    it('should deny client admin permissions', () => {
      expect(permissionChecker.hasPermission('client', 'manage_sessions')).toBe(false);
      expect(permissionChecker.hasPermission('client', 'manage_policies')).toBe(false);
    });

    it('should check multiple permissions', () => {
      const permissions = ['view_all_sessions', 'manage_sessions'];
      expect(permissionChecker.hasAllPermissions('admin', permissions)).toBe(true);
      expect(permissionChecker.hasAllPermissions('technician', permissions)).toBe(false);
    });

    it('should check any permission', () => {
      const permissions = ['manage_policies', 'create_session'];
      expect(permissionChecker.hasAnyPermission('technician', permissions)).toBe(true);
      expect(permissionChecker.hasAnyPermission('client', permissions)).toBe(false);
    });
  });

  describe('Session Token Manager', () => {
    let tokenManager: SessionTokenManager;

    beforeEach(() => {
      tokenManager = new SessionTokenManager();
    });

    it('should generate valid token', () => {
      const token = tokenManager.generateToken(123);
      expect(token).toBeDefined();
      expect(token).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should validate generated token', () => {
      const token = tokenManager.generateToken(123);
      const result = tokenManager.validateToken(token);

      expect(result.valid).toBe(true);
      expect(result.userId).toBe(123);
    });

    it('should reject invalid token', () => {
      const result = tokenManager.validateToken('invalid-token');
      expect(result.valid).toBe(false);
    });

    it('should revoke token', () => {
      const token = tokenManager.generateToken(123);
      tokenManager.revokeToken(token);

      const result = tokenManager.validateToken(token);
      expect(result.valid).toBe(false);
    });

    it('should cleanup expired tokens', () => {
      vi.useFakeTimers();

      const token = tokenManager.generateToken(123);
      expect(tokenManager.validateToken(token).valid).toBe(true);

      // Advance time past token TTL (1 hour)
      vi.advanceTimersByTime(3601000);

      tokenManager.cleanupExpiredTokens();
      expect(tokenManager.validateToken(token).valid).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('Session Rate Limiter', () => {
    let limiter: SessionRateLimiter;

    beforeEach(() => {
      limiter = new SessionRateLimiter();
    });

    it('should allow requests within limit', () => {
      for (let i = 0; i < 5; i++) {
        expect(limiter.isAllowed('user-123')).toBe(true);
      }
    });

    it('should block requests exceeding limit', () => {
      const userId = 'user-456';

      // Fill up the limit
      for (let i = 0; i < 10; i++) {
        limiter.isAllowed(userId);
      }

      // Next request should be blocked
      expect(limiter.isAllowed(userId)).toBe(false);
    });

    it('should reset user attempts', () => {
      const userId = 'user-789';

      // Fill up the limit
      for (let i = 0; i < 10; i++) {
        limiter.isAllowed(userId);
      }

      expect(limiter.isAllowed(userId)).toBe(false);

      // Reset and try again
      limiter.reset(userId);
      expect(limiter.isAllowed(userId)).toBe(true);
    });

    it('should allow different users independently', () => {
      // Fill up limit for user 1
      for (let i = 0; i < 10; i++) {
        limiter.isAllowed('user-1');
      }

      // User 2 should still be allowed
      expect(limiter.isAllowed('user-2')).toBe(true);
    });
  });

  describe('Encryption Key Generation', () => {
    it('should generate consistent key from same inputs', () => {
      const masterKey = 'master-key';
      const salt = 'salt-value';

      const key1 = generateEncryptionKey(masterKey, salt);
      const key2 = generateEncryptionKey(masterKey, salt);

      expect(key1.toString('hex')).toBe(key2.toString('hex'));
    });

    it('should generate different keys from different salts', () => {
      const masterKey = 'master-key';
      const key1 = generateEncryptionKey(masterKey, 'salt-1');
      const key2 = generateEncryptionKey(masterKey, 'salt-2');

      expect(key1.toString('hex')).not.toBe(key2.toString('hex'));
    });

    it('should generate 32-byte key', () => {
      const key = generateEncryptionKey('master-key', 'salt');
      expect(key.length).toBe(32);
    });
  });
});

describe('Remote Assistance RBAC', () => {
  it('should define all required roles', () => {
    const roles = ['admin', 'supervisor', 'technician', 'client', 'observer'];
    roles.forEach((role) => {
      expect(permissionChecker.getRolePermissions(role as any)).toBeDefined();
    });
  });

  it('should have hierarchical permissions', () => {
    const adminPerms = permissionChecker.getRolePermissions('admin');
    const supervisorPerms = permissionChecker.getRolePermissions('supervisor');
    const technicianPerms = permissionChecker.getRolePermissions('technician');

    expect(adminPerms.length).toBeGreaterThan(supervisorPerms.length);
    expect(supervisorPerms.length).toBeGreaterThanOrEqual(technicianPerms.length);
  });
});
