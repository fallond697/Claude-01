/**
 * Service for storing and retrieving health check history
 * @module services/history-storage
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';

import type { ServerHealthStatus, HealthCheckResult } from '../types/server-status.js';

const DEFAULT_HISTORY_PATH = join(homedir(), '.mcp-health', 'history.json');
const MAX_HISTORY_ENTRIES = 1000;

/**
 * A single historical health check entry
 */
export interface HistoryEntry {
  readonly timestamp: string;
  readonly servers: readonly ServerStatusSnapshot[];
}

/**
 * Snapshot of a server's status at a point in time
 */
export interface ServerStatusSnapshot {
  readonly name: string;
  readonly isConnected: boolean;
  readonly latencyMs: number | null;
}

/**
 * Uptime statistics for a server
 */
export interface UptimeStats {
  readonly serverName: string;
  readonly totalChecks: number;
  readonly successfulChecks: number;
  readonly uptimePercentage: number;
  readonly averageLatencyMs: number | null;
  readonly lastStatus: boolean;
  readonly lastChecked: string;
}

/**
 * Complete history data structure
 */
interface HistoryData {
  version: number;
  entries: HistoryEntry[];
}

/**
 * Saves a health check result to history
 * @param result - The health check result to save
 * @param historyPath - Optional custom history file path
 */
export async function saveToHistory(
  result: HealthCheckResult,
  historyPath?: string
): Promise<void> {
  const path = historyPath ?? DEFAULT_HISTORY_PATH;
  const history = await loadHistory(path);

  const entry: HistoryEntry = {
    timestamp: result.checkedAt.toISOString(),
    servers: result.servers.map(snapshotFromStatus),
  };

  history.entries.push(entry);

  // Trim old entries if over limit
  if (history.entries.length > MAX_HISTORY_ENTRIES) {
    history.entries = history.entries.slice(-MAX_HISTORY_ENTRIES);
  }

  await saveHistory(history, path);
}

/**
 * Calculates uptime statistics for all servers
 * @param historyPath - Optional custom history file path
 * @returns Array of uptime statistics per server
 */
export async function calculateUptimeStats(
  historyPath?: string
): Promise<readonly UptimeStats[]> {
  const path = historyPath ?? DEFAULT_HISTORY_PATH;
  const history = await loadHistory(path);

  if (history.entries.length === 0) {
    return [];
  }

  const serverStats = new Map<string, {
    total: number;
    successful: number;
    latencies: number[];
    lastStatus: boolean;
    lastChecked: string;
  }>();

  for (const entry of history.entries) {
    for (const server of entry.servers) {
      const existing = serverStats.get(server.name) ?? {
        total: 0,
        successful: 0,
        latencies: [],
        lastStatus: false,
        lastChecked: '',
      };

      existing.total++;
      if (server.isConnected) {
        existing.successful++;
      }
      if (server.isConnected && server.latencyMs !== null) {
        existing.latencies.push(server.latencyMs);
      }
      existing.lastStatus = server.isConnected;
      existing.lastChecked = entry.timestamp;

      serverStats.set(server.name, existing);
    }
  }

  return Array.from(serverStats.entries()).map(([name, stats]) => ({
    serverName: name,
    totalChecks: stats.total,
    successfulChecks: stats.successful,
    uptimePercentage: (stats.successful / stats.total) * 100,
    averageLatencyMs: stats.latencies.length > 0
      ? Math.round(stats.latencies.reduce((a, b) => a + b, 0) / stats.latencies.length)
      : null,
    lastStatus: stats.lastStatus,
    lastChecked: stats.lastChecked,
  }));
}

/**
 * Gets the history file path
 */
export function getHistoryPath(): string {
  return DEFAULT_HISTORY_PATH;
}

/**
 * Clears all history data
 */
export async function clearHistory(historyPath?: string): Promise<void> {
  const path = historyPath ?? DEFAULT_HISTORY_PATH;
  const emptyHistory: HistoryData = { version: 1, entries: [] };
  await saveHistory(emptyHistory, path);
}

/**
 * Creates a snapshot from a server status
 */
function snapshotFromStatus(status: ServerHealthStatus): ServerStatusSnapshot {
  return {
    name: status.name,
    isConnected: status.isConnected,
    latencyMs: status.latencyMs,
  };
}

/**
 * Loads history from file
 */
async function loadHistory(path: string): Promise<HistoryData> {
  if (!existsSync(path)) {
    return { version: 1, entries: [] };
  }

  try {
    const content = await readFile(path, 'utf-8');
    return JSON.parse(content) as HistoryData;
  } catch {
    return { version: 1, entries: [] };
  }
}

/**
 * Saves history to file
 */
async function saveHistory(
  history: HistoryData,
  path: string
): Promise<void> {
  const dir = dirname(path);

  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }

  await writeFile(path, JSON.stringify(history, null, 2), 'utf-8');
}
