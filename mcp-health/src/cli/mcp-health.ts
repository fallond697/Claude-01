#!/usr/bin/env node

/**
 * CLI entry point for MCP health checker
 * @module cli/mcp-health
 */

import { program } from 'commander';
import chalk from 'chalk';

import { checkHealth } from '../services/health-checker.js';
import { formatHealthCheckResult } from '../formatters/table-formatter.js';
import { formatUptimeStats } from '../formatters/uptime-formatter.js';
import {
  saveToHistory,
  calculateUptimeStats,
  clearHistory,
  getHistoryPath,
} from '../services/history-storage.js';
import { checkAndNotify } from '../services/notification-service.js';
import type { FormatOptions } from '../types/server-status.js';
import { HealthCheckError } from '../errors/health-check-error.js';

const VERSION = '0.2.0';

interface CliOptions {
  readonly json?: boolean;
  readonly plain?: boolean;
  readonly watch?: boolean;
  readonly interval?: string;
  readonly timeout?: string;
  readonly config?: string;
  readonly noColor?: boolean;
  readonly notify?: boolean;
  readonly history?: boolean;
}

/**
 * Main CLI function
 */
async function main(): Promise<void> {
  program
    .name('mcp-health')
    .description('Health monitor for MCP servers configured with Claude Code CLI')
    .version(VERSION);

  // Default command: health check
  program
    .option('--json', 'Output results as JSON')
    .option('--plain', 'Output as plain text (no colors or formatting)')
    .option('-w, --watch', 'Watch mode: auto-refresh status')
    .option('-i, --interval <seconds>', 'Refresh interval in seconds (default: 30)')
    .option('-t, --timeout <ms>', 'Timeout for health checks in milliseconds')
    .option('-c, --config <path>', 'Path to Claude config file')
    .option('--no-color', 'Disable colored output')
    .option('-n, --notify', 'Enable desktop notifications on status changes')
    .option('-H, --history', 'Save results to history file')
    .action(runHealthCheck);

  // Uptime subcommand
  program
    .command('uptime')
    .description('Show uptime statistics from historical data')
    .option('--json', 'Output as JSON')
    .option('--plain', 'Output as plain text')
    .option('--no-color', 'Disable colored output')
    .action(showUptimeStats);

  // Clear history subcommand
  program
    .command('clear-history')
    .description('Clear all historical data')
    .action(handleClearHistory);

  // History path subcommand
  program
    .command('history-path')
    .description('Show the path to the history file')
    .action(showHistoryPath);

  await program.parseAsync();
}

/**
 * Runs the health check with the provided options
 */
async function runHealthCheck(options: CliOptions): Promise<void> {
  const formatOptions = resolveFormatOptions(options);
  const checkOptions = {
    timeoutMs: options.timeout ? parseInt(options.timeout, 10) : undefined,
    configPath: options.config,
  };

  if (options.watch) {
    await runWatchMode(checkOptions, formatOptions, options);
  } else {
    await runSingleCheck(checkOptions, formatOptions, options);
  }
}

/**
 * Runs a single health check
 */
async function runSingleCheck(
  checkOptions: { timeoutMs?: number; configPath?: string },
  formatOptions: FormatOptions,
  options: CliOptions
): Promise<void> {
  try {
    const result = await checkHealth(checkOptions);

    // Save to history if enabled
    if (options.history) {
      await saveToHistory(result);
    }

    const output = formatHealthCheckResult(result, formatOptions);
    process.stdout.write(output + '\n');

    if (result.failureCount > 0) {
      process.exitCode = 1;
    }
  } catch (error) {
    handleError(error, formatOptions);
  }
}

/**
 * Runs health checks in watch mode
 */
async function runWatchMode(
  checkOptions: { timeoutMs?: number; configPath?: string },
  formatOptions: FormatOptions,
  options: CliOptions
): Promise<void> {
  const intervalSeconds = options.interval ? parseInt(options.interval, 10) : 30;
  const intervalMs = intervalSeconds * 1000;
  const notifyEnabled = options.notify ?? false;
  const historyEnabled = options.history ?? false;

  const features: string[] = [];
  if (notifyEnabled) features.push('notifications');
  if (historyEnabled) features.push('history');

  const featuresText = features.length > 0 ? ` [${features.join(', ')}]` : '';

  process.stdout.write(chalk.cyan(`Watching MCP servers (refresh: ${intervalSeconds}s)${featuresText}\n`));
  process.stdout.write(chalk.cyan('Press Ctrl+C to stop\n\n'));

  const runCheck = async (): Promise<void> => {
    try {
      const result = await checkHealth(checkOptions);

      // Check for status changes and notify
      if (notifyEnabled) {
        checkAndNotify(result, { enabled: true });
      }

      // Save to history if enabled
      if (historyEnabled) {
        await saveToHistory(result);
      }

      clearScreen();
      process.stdout.write(chalk.cyan(`MCP Health Monitor (refreshing every ${intervalSeconds}s)${featuresText}\n\n`));
      const output = formatHealthCheckResult(result, formatOptions);
      process.stdout.write(output + '\n');
    } catch (error) {
      handleError(error, formatOptions);
    }
  };

  await runCheck();
  setInterval(() => void runCheck(), intervalMs);
}

/**
 * Shows uptime statistics from historical data
 */
async function showUptimeStats(options: CliOptions): Promise<void> {
  const formatOptions = resolveFormatOptions(options);

  try {
    const stats = await calculateUptimeStats();
    const output = formatUptimeStats(stats, formatOptions);
    process.stdout.write(output + '\n');
  } catch (error) {
    handleError(error, formatOptions);
  }
}

/**
 * Handles clearing history
 */
async function handleClearHistory(): Promise<void> {
  try {
    await clearHistory();
    process.stdout.write(chalk.green('History cleared successfully.\n'));
  } catch (error) {
    process.stderr.write(chalk.red(`Failed to clear history: ${String(error)}\n`));
    process.exitCode = 1;
  }
}

/**
 * Shows the history file path
 */
function showHistoryPath(): void {
  process.stdout.write(`${getHistoryPath()}\n`);
}

/**
 * Resolves format options from CLI options
 */
function resolveFormatOptions(options: CliOptions): FormatOptions {
  if (options.json) {
    return { format: 'json', useColors: false };
  }

  if (options.plain) {
    return { format: 'plain', useColors: false };
  }

  return {
    format: 'table',
    useColors: !options.noColor,
    showTimestamp: true,
  };
}

/**
 * Handles and displays errors
 */
function handleError(error: unknown, options: FormatOptions): void {
  const message = error instanceof HealthCheckError
    ? error.message
    : error instanceof Error
      ? error.message
      : 'An unexpected error occurred';

  if (options.format === 'json') {
    process.stdout.write(JSON.stringify({ error: message }) + '\n');
  } else {
    const prefix = options.useColors ? chalk.red('Error:') : 'Error:';
    process.stderr.write(`${prefix} ${message}\n`);
  }

  process.exitCode = 1;
}

/**
 * Clears the terminal screen
 */
function clearScreen(): void {
  process.stdout.write('\x1Bc');
}

main().catch((error: unknown) => {
  process.stderr.write(`Fatal error: ${String(error)}\n`);
  process.exit(1);
});
