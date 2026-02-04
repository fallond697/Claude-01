/**
 * Tests for history storage service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as fsSync from 'node:fs';
import {
  saveToHistory,
  calculateUptimeStats,
  clearHistory,
  getHistoryPath,
} from './history-storage.js';
import type { HealthCheckResult } from '../types/server-status.js';

vi.mock('node:fs/promises');
vi.mock('node:fs');

describe('history-storage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(fsSync.existsSync).mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createMockResult = (): HealthCheckResult => ({
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
  });

  describe('saveToHistory', () => {
    it('should create new history file if none exists', async () => {
      vi.mocked(fsSync.existsSync).mockReturnValue(false);
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      const result = createMockResult();
      await saveToHistory(result, '/test/history.json');

      expect(fs.writeFile).toHaveBeenCalled();
      const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
      expect(writeCall[0]).toBe('/test/history.json');

      const written = JSON.parse(writeCall[1] as string) as { entries: unknown[] };
      expect(written.entries).toHaveLength(1);
    });

    it('should append to existing history', async () => {
      const existingHistory = {
        version: 1,
        entries: [{ timestamp: '2026-01-01T11:00:00Z', servers: [] }],
      };

      vi.mocked(fsSync.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(existingHistory));
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      const result = createMockResult();
      await saveToHistory(result, '/test/history.json');

      const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
      const written = JSON.parse(writeCall[1] as string) as { entries: unknown[] };
      expect(written.entries).toHaveLength(2);
    });
  });

  describe('calculateUptimeStats', () => {
    it('should return empty array when no history', async () => {
      vi.mocked(fsSync.existsSync).mockReturnValue(false);

      const stats = await calculateUptimeStats('/test/history.json');

      expect(stats).toHaveLength(0);
    });

    it('should calculate correct uptime percentage', async () => {
      const history = {
        version: 1,
        entries: [
          {
            timestamp: '2026-01-01T12:00:00Z',
            servers: [{ name: 'server1', isConnected: true, latencyMs: 100 }],
          },
          {
            timestamp: '2026-01-01T12:01:00Z',
            servers: [{ name: 'server1', isConnected: true, latencyMs: 150 }],
          },
          {
            timestamp: '2026-01-01T12:02:00Z',
            servers: [{ name: 'server1', isConnected: false, latencyMs: null }],
          },
          {
            timestamp: '2026-01-01T12:03:00Z',
            servers: [{ name: 'server1', isConnected: true, latencyMs: 120 }],
          },
        ],
      };

      vi.mocked(fsSync.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(history));

      const stats = await calculateUptimeStats('/test/history.json');

      expect(stats).toHaveLength(1);
      expect(stats[0].serverName).toBe('server1');
      expect(stats[0].totalChecks).toBe(4);
      expect(stats[0].successfulChecks).toBe(3);
      expect(stats[0].uptimePercentage).toBe(75);
      expect(stats[0].averageLatencyMs).toBe(123); // (100+150+120)/3
    });

    it('should handle multiple servers', async () => {
      const history = {
        version: 1,
        entries: [
          {
            timestamp: '2026-01-01T12:00:00Z',
            servers: [
              { name: 'server1', isConnected: true, latencyMs: 100 },
              { name: 'server2', isConnected: false, latencyMs: null },
            ],
          },
        ],
      };

      vi.mocked(fsSync.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(history));

      const stats = await calculateUptimeStats('/test/history.json');

      expect(stats).toHaveLength(2);
    });
  });

  describe('clearHistory', () => {
    it('should write empty history', async () => {
      vi.mocked(fsSync.existsSync).mockReturnValue(false);
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await clearHistory('/test/history.json');

      const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
      const written = JSON.parse(writeCall[1] as string) as { entries: unknown[] };
      expect(written.entries).toHaveLength(0);
    });
  });

  describe('getHistoryPath', () => {
    it('should return a string path', () => {
      const path = getHistoryPath();
      expect(typeof path).toBe('string');
      expect(path).toContain('history.json');
    });
  });
});
