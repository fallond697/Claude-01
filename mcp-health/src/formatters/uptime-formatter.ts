/**
 * Formatter for displaying uptime statistics
 * @module formatters/uptime-formatter
 */

import Table from 'cli-table3';
import chalk from 'chalk';

import type { UptimeStats } from '../services/history-storage.js';
import type { FormatOptions } from '../types/server-status.js';

/**
 * Formats uptime statistics for display
 * @param stats - Array of uptime statistics
 * @param options - Formatting options
 * @returns Formatted string output
 */
export function formatUptimeStats(
  stats: readonly UptimeStats[],
  options: Partial<FormatOptions> = {}
): string {
  const opts: FormatOptions = {
    format: options.format ?? 'table',
    useColors: options.useColors ?? true,
  };

  if (stats.length === 0) {
    return opts.useColors
      ? chalk.yellow('No history data available. Run health checks to collect data.')
      : 'No history data available. Run health checks to collect data.';
  }

  switch (opts.format) {
    case 'json':
      return formatAsJson(stats);
    case 'plain':
      return formatAsPlain(stats);
    case 'table':
    default:
      return formatAsTable(stats, opts);
  }
}

/**
 * Formats uptime stats as a colored table
 */
function formatAsTable(
  stats: readonly UptimeStats[],
  options: FormatOptions
): string {
  const table = new Table({
    head: ['Server', 'Uptime', 'Checks', 'Avg Latency', 'Status'],
    style: {
      head: options.useColors ? ['cyan'] : [],
      border: options.useColors ? ['gray'] : [],
    },
  });

  for (const stat of stats) {
    table.push(formatStatRow(stat, options));
  }

  const avgUptime = calculateAverageUptime(stats);
  const summary = formatUptimeSummary(avgUptime, stats.length, options);

  return `${table.toString()}\n${summary}`;
}

/**
 * Formats a single stat row for the table
 */
function formatStatRow(
  stat: UptimeStats,
  options: FormatOptions
): string[] {
  const uptimeText = `${stat.uptimePercentage.toFixed(1)}%`;
  const uptime = options.useColors
    ? colorizeUptime(uptimeText, stat.uptimePercentage)
    : uptimeText;

  const checks = `${stat.successfulChecks}/${stat.totalChecks}`;
  const latency = stat.averageLatencyMs !== null
    ? `${stat.averageLatencyMs}ms`
    : '-';

  const statusText = stat.lastStatus ? 'Up' : 'Down';
  const status = options.useColors
    ? stat.lastStatus
      ? chalk.green(statusText)
      : chalk.red(statusText)
    : statusText;

  return [stat.serverName, uptime, checks, latency, status];
}

/**
 * Colorizes uptime percentage based on value
 */
function colorizeUptime(text: string, percentage: number): string {
  if (percentage >= 99) {
    return chalk.green(text);
  } else if (percentage >= 95) {
    return chalk.yellow(text);
  } else {
    return chalk.red(text);
  }
}

/**
 * Formats the summary line
 */
function formatUptimeSummary(
  avgUptime: number,
  serverCount: number,
  options: FormatOptions
): string {
  const uptimeText = `${avgUptime.toFixed(1)}%`;
  const uptime = options.useColors
    ? colorizeUptime(uptimeText, avgUptime)
    : uptimeText;

  return `Average uptime: ${uptime} across ${serverCount} servers`;
}

/**
 * Calculates average uptime across all servers
 */
function calculateAverageUptime(stats: readonly UptimeStats[]): number {
  if (stats.length === 0) return 0;

  const total = stats.reduce((sum, s) => sum + s.uptimePercentage, 0);
  return total / stats.length;
}

/**
 * Formats uptime stats as JSON
 */
function formatAsJson(stats: readonly UptimeStats[]): string {
  const output = {
    servers: stats.map((s) => ({
      name: s.serverName,
      uptimePercentage: s.uptimePercentage,
      totalChecks: s.totalChecks,
      successfulChecks: s.successfulChecks,
      averageLatencyMs: s.averageLatencyMs,
      currentStatus: s.lastStatus ? 'up' : 'down',
      lastChecked: s.lastChecked,
    })),
    summary: {
      serverCount: stats.length,
      averageUptime: calculateAverageUptime(stats),
    },
  };

  return JSON.stringify(output, null, 2);
}

/**
 * Formats uptime stats as plain text
 */
function formatAsPlain(stats: readonly UptimeStats[]): string {
  const lines: string[] = [];

  lines.push('MCP Server Uptime Statistics');
  lines.push('============================');
  lines.push('');

  for (const stat of stats) {
    const status = stat.lastStatus ? '[UP]' : '[DOWN]';
    const uptime = `${stat.uptimePercentage.toFixed(1)}%`;
    const latency = stat.averageLatencyMs !== null
      ? `avg ${stat.averageLatencyMs}ms`
      : 'no latency data';

    lines.push(`${status} ${stat.serverName}`);
    lines.push(`     Uptime: ${uptime} (${stat.successfulChecks}/${stat.totalChecks} checks)`);
    lines.push(`     Latency: ${latency}`);
  }

  lines.push('');
  lines.push(`Average uptime: ${calculateAverageUptime(stats).toFixed(1)}%`);

  return lines.join('\n');
}
