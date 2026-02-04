/**
 * Formatter for displaying health check results
 * @module formatters/table-formatter
 */

import Table from 'cli-table3';
import chalk from 'chalk';

import type {
  HealthCheckResult,
  ServerHealthStatus,
  FormatOptions,
} from '../types/server-status.js';

const DEFAULT_FORMAT_OPTIONS: FormatOptions = {
  format: 'table',
  showTimestamp: true,
  useColors: true,
};

/**
 * Formats health check results for display
 * @param result - The health check result to format
 * @param options - Formatting options
 * @returns Formatted string output
 */
export function formatHealthCheckResult(
  result: HealthCheckResult,
  options: Partial<FormatOptions> = {}
): string {
  const opts = { ...DEFAULT_FORMAT_OPTIONS, ...options };

  switch (opts.format) {
    case 'json':
      return formatAsJson(result);
    case 'plain':
      return formatAsPlain(result);
    case 'table':
    default:
      return formatAsTable(result, opts);
  }
}

/**
 * Formats result as a colored table
 */
function formatAsTable(
  result: HealthCheckResult,
  options: FormatOptions
): string {
  const table = new Table({
    head: ['Server', 'Status', 'Latency', 'Last Checked'],
    style: {
      head: options.useColors ? ['cyan'] : [],
      border: options.useColors ? ['gray'] : [],
    },
  });

  for (const server of result.servers) {
    table.push(formatServerRow(server, options));
  }

  const summary = formatSummary(result, options);
  return `${table.toString()}\n${summary}`;
}

/**
 * Formats a single server row for the table
 */
function formatServerRow(
  server: ServerHealthStatus,
  options: FormatOptions
): string[] {
  const statusText = server.isConnected ? 'Connected' : 'Failed';
  const status = options.useColors
    ? server.isConnected
      ? chalk.green(statusText)
      : chalk.red(statusText)
    : statusText;

  const latency = server.latencyMs !== null ? `${server.latencyMs}ms` : '-';
  const timestamp = formatTimestamp(server.lastChecked);

  return [server.name, status, latency, timestamp];
}

/**
 * Formats the summary line
 */
function formatSummary(
  result: HealthCheckResult,
  options: FormatOptions
): string {
  const total = result.servers.length;
  const connected = result.successCount;
  const time = (result.totalTimeMs / 1000).toFixed(1);

  const countText = `${connected}/${total}`;
  const count = options.useColors
    ? connected === total
      ? chalk.green(countText)
      : chalk.yellow(countText)
    : countText;

  return `Total: ${count} servers connected (${time}s)`;
}

/**
 * Formats result as JSON
 */
function formatAsJson(result: HealthCheckResult): string {
  const output = {
    servers: result.servers.map((s) => ({
      name: s.name,
      connected: s.isConnected,
      latencyMs: s.latencyMs,
      lastChecked: s.lastChecked.toISOString(),
      error: s.errorMessage,
    })),
    summary: {
      total: result.servers.length,
      connected: result.successCount,
      failed: result.failureCount,
      totalTimeMs: result.totalTimeMs,
      checkedAt: result.checkedAt.toISOString(),
    },
  };

  return JSON.stringify(output, null, 2);
}

/**
 * Formats result as plain text
 */
function formatAsPlain(result: HealthCheckResult): string {
  const lines: string[] = [];

  lines.push('MCP Server Health Status');
  lines.push('========================');
  lines.push('');

  for (const server of result.servers) {
    const status = server.isConnected ? '[OK]' : '[FAIL]';
    const latency = server.latencyMs !== null ? `${server.latencyMs}ms` : 'N/A';
    lines.push(`${status} ${server.name} - ${latency}`);

    if (server.errorMessage) {
      lines.push(`     Error: ${server.errorMessage}`);
    }
  }

  lines.push('');
  lines.push(`Connected: ${result.successCount}/${result.servers.length}`);
  lines.push(`Total time: ${result.totalTimeMs}ms`);

  return lines.join('\n');
}

/**
 * Formats a timestamp for display
 */
function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
