/**
 * Tests for notification service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkAndNotify,
  clearStateCache,
  getStateCache,
} from './notification-service.js';
import type { HealthCheckResult } from '../types/server-status.js';

describe('notification-service', () => {
  beforeEach(() => {
    clearStateCache();
  });

  const createMockResult = (
    servers: Array<{ name: string; isConnected: boolean }>
  ): HealthCheckResult => ({
    servers: servers.map((s) => ({
      name: s.name,
      isConnected: s.isConnected,
      latencyMs: s.isConnected ? 100 : null,
      lastChecked: new Date(),
      errorMessage: s.isConnected ? null : 'Connection failed',
    })),
    totalTimeMs: 200,
    checkedAt: new Date(),
    successCount: servers.filter((s) => s.isConnected).length,
    failureCount: servers.filter((s) => !s.isConnected).length,
  });

  describe('checkAndNotify', () => {
    it('should not notify on first run (no previous state)', () => {
      const result = createMockResult([
        { name: 'server1', isConnected: true },
      ]);

      // Should not throw and should update state cache
      checkAndNotify(result, { enabled: true });

      const cache = getStateCache();
      expect(cache.get('server1')).toBe(true);
    });

    it('should track state changes', () => {
      // First check: server is up
      const result1 = createMockResult([
        { name: 'server1', isConnected: true },
      ]);
      checkAndNotify(result1, { enabled: true });

      expect(getStateCache().get('server1')).toBe(true);

      // Second check: server is down
      const result2 = createMockResult([
        { name: 'server1', isConnected: false },
      ]);
      checkAndNotify(result2, { enabled: true });

      expect(getStateCache().get('server1')).toBe(false);
    });

    it('should not do anything when disabled', () => {
      const result = createMockResult([
        { name: 'server1', isConnected: true },
      ]);

      checkAndNotify(result, { enabled: false });

      // Cache should not be updated when disabled
      const cache = getStateCache();
      expect(cache.size).toBe(0);
    });

    it('should handle multiple servers', () => {
      const result = createMockResult([
        { name: 'server1', isConnected: true },
        { name: 'server2', isConnected: false },
        { name: 'server3', isConnected: true },
      ]);

      checkAndNotify(result, { enabled: true });

      const cache = getStateCache();
      expect(cache.get('server1')).toBe(true);
      expect(cache.get('server2')).toBe(false);
      expect(cache.get('server3')).toBe(true);
    });
  });

  describe('clearStateCache', () => {
    it('should clear all cached states', () => {
      const result = createMockResult([
        { name: 'server1', isConnected: true },
      ]);
      checkAndNotify(result, { enabled: true });

      expect(getStateCache().size).toBe(1);

      clearStateCache();

      expect(getStateCache().size).toBe(0);
    });
  });

  describe('getStateCache', () => {
    it('should return readonly map', () => {
      const result = createMockResult([
        { name: 'server1', isConnected: true },
      ]);
      checkAndNotify(result, { enabled: true });

      const cache = getStateCache();

      // Should be able to read
      expect(cache.get('server1')).toBe(true);

      // Type should be ReadonlyMap (can't test mutation at runtime)
      expect(typeof cache.get).toBe('function');
      expect(typeof cache.has).toBe('function');
    });
  });
});
