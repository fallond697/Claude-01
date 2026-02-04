/**
 * Tests for table formatter
 */

import { describe, it, expect } from 'vitest';
import { formatHealthCheckResult } from './table-formatter.js';
import type { HealthCheckResult } from '../types/server-status.js';

describe('table-formatter', () => {
  const createMockResult = (
    overrides: Partial<HealthCheckResult> = {}
  ): HealthCheckResult => ({
    servers: [
      {
        name: 'test-server',
        isConnected: true,
        latencyMs: 150,
        lastChecked: new Date('2026-01-01T12:00:00Z'),
        errorMessage: null,
      },
    ],
    totalTimeMs: 200,
    checkedAt: new Date('2026-01-01T12:00:00Z'),
    successCount: 1,
    failureCount: 0,
    ...overrides,
  });

  describe('formatHealthCheckResult', () => {
    it('should format as table by default', () => {
      const result = createMockResult();
      const output = formatHealthCheckResult(result);

      expect(output).toContain('test-server');
      expect(output).toContain('Connected');
      expect(output).toContain('150ms');
      expect(output).toContain('1/1');
    });

    it('should format failed servers correctly', () => {
      const result = createMockResult({
        servers: [
          {
            name: 'failed-server',
            isConnected: false,
            latencyMs: null,
            lastChecked: new Date(),
            errorMessage: 'Connection refused',
          },
        ],
        successCount: 0,
        failureCount: 1,
      });

      const output = formatHealthCheckResult(result, { format: 'table', useColors: false });

      expect(output).toContain('failed-server');
      expect(output).toContain('Failed');
      expect(output).toContain('-');
      expect(output).toContain('0/1');
    });

    it('should format as JSON when requested', () => {
      const result = createMockResult();
      const output = formatHealthCheckResult(result, { format: 'json' });

      const parsed = JSON.parse(output) as { servers: unknown[]; summary: { total: number } };

      expect(parsed.servers).toHaveLength(1);
      expect(parsed.summary.total).toBe(1);
      expect(parsed.summary.connected).toBe(1);
    });

    it('should include error in JSON output', () => {
      const result = createMockResult({
        servers: [
          {
            name: 'error-server',
            isConnected: false,
            latencyMs: null,
            lastChecked: new Date(),
            errorMessage: 'Timeout',
          },
        ],
        successCount: 0,
        failureCount: 1,
      });

      const output = formatHealthCheckResult(result, { format: 'json' });
      const parsed = JSON.parse(output) as { servers: Array<{ error: string }> };

      expect(parsed.servers[0].error).toBe('Timeout');
    });

    it('should format as plain text when requested', () => {
      const result = createMockResult();
      const output = formatHealthCheckResult(result, { format: 'plain' });

      expect(output).toContain('MCP Server Health Status');
      expect(output).toContain('[OK]');
      expect(output).toContain('test-server');
      expect(output).toContain('150ms');
    });

    it('should show [FAIL] in plain text for failed servers', () => {
      const result = createMockResult({
        servers: [
          {
            name: 'bad-server',
            isConnected: false,
            latencyMs: null,
            lastChecked: new Date(),
            errorMessage: 'Error',
          },
        ],
        successCount: 0,
        failureCount: 1,
      });

      const output = formatHealthCheckResult(result, { format: 'plain' });

      expect(output).toContain('[FAIL]');
      expect(output).toContain('Error: Error');
    });

    it('should handle multiple servers', () => {
      const result = createMockResult({
        servers: [
          {
            name: 'server1',
            isConnected: true,
            latencyMs: 100,
            lastChecked: new Date(),
            errorMessage: null,
          },
          {
            name: 'server2',
            isConnected: true,
            latencyMs: 200,
            lastChecked: new Date(),
            errorMessage: null,
          },
          {
            name: 'server3',
            isConnected: false,
            latencyMs: null,
            lastChecked: new Date(),
            errorMessage: 'Failed',
          },
        ],
        successCount: 2,
        failureCount: 1,
      });

      const output = formatHealthCheckResult(result, { format: 'plain' });

      expect(output).toContain('server1');
      expect(output).toContain('server2');
      expect(output).toContain('server3');
      expect(output).toContain('Connected: 2/3');
    });

    it('should respect useColors: false for plain format', () => {
      const result = createMockResult();
      const output = formatHealthCheckResult(result, {
        format: 'plain',
        useColors: false,
      });

      // Plain format should not contain any ANSI escape codes
      expect(output).not.toMatch(/\x1b\[/);
      expect(output).toContain('[OK]');
      expect(output).toContain('test-server');
    });
  });
});
