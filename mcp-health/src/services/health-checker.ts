/**
 * Service for checking the health of MCP servers
 * @module services/health-checker
 */

import { spawn } from 'node:child_process';

import type {
  McpServerConfig,
  ServerHealthStatus,
  HealthCheckResult,
  HealthCheckOptions,
} from '../types/server-status.js';
import { readMcpConfigs } from './mcp-config-reader.js';
import { ClaudeCliNotFoundError } from '../errors/health-check-error.js';

const DEFAULT_TIMEOUT_MS = 5000;
const PER_SERVER_TIMEOUT_MS = 3000;

/**
 * Checks the health of all configured MCP servers
 * @param options - Health check options
 * @returns Health check result with status for all servers
 */
export async function checkHealth(
  options: HealthCheckOptions = {}
): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const configs = await readMcpConfigs(options.configPath);

  await verifyClaudeCli();

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const statuses = await checkAllServers(configs, timeoutMs);

  const successCount = statuses.filter((s) => s.isConnected).length;
  const failureCount = statuses.length - successCount;

  return {
    servers: statuses,
    totalTimeMs: Date.now() - startTime,
    checkedAt: new Date(),
    successCount,
    failureCount,
  };
}

/**
 * Verifies that the Claude CLI is available
 */
async function verifyClaudeCli(): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('claude', ['--version'], { shell: true });
    let hasResponded = false;

    proc.on('error', () => {
      if (!hasResponded) {
        hasResponded = true;
        reject(new ClaudeCliNotFoundError());
      }
    });

    proc.on('close', (code) => {
      if (!hasResponded) {
        hasResponded = true;
        if (code === 0) {
          resolve();
        } else {
          reject(new ClaudeCliNotFoundError());
        }
      }
    });
  });
}

/**
 * Checks all servers in parallel with timeout
 */
async function checkAllServers(
  configs: readonly McpServerConfig[],
  _timeoutMs: number
): Promise<readonly ServerHealthStatus[]> {
  const checkPromises = configs.map((config) =>
    checkSingleServer(config)
  );

  const results = await Promise.allSettled(checkPromises);

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return createFailedStatus(configs[index].name, result.reason);
  });
}

/**
 * Checks a single server's health by running the mcp list command
 */
async function checkSingleServer(
  config: McpServerConfig
): Promise<ServerHealthStatus> {
  const startTime = Date.now();

  return new Promise((resolve) => {
    const proc = spawn(
      'claude',
      ['mcp', 'get', config.name],
      { shell: true }
    );

    let stdout = '';
    let stderr = '';
    let hasResolved = false;

    const timeout = setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        proc.kill();
        resolve(createTimeoutStatus(config.name, PER_SERVER_TIMEOUT_MS));
      }
    }, PER_SERVER_TIMEOUT_MS);

    proc.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on('close', () => {
      if (!hasResolved) {
        hasResolved = true;
        clearTimeout(timeout);
        const latencyMs = Date.now() - startTime;
        const isConnected = parseConnectionStatus(stdout, stderr);
        resolve({
          name: config.name,
          isConnected,
          latencyMs,
          lastChecked: new Date(),
          errorMessage: isConnected ? null : parseErrorMessage(stderr),
        });
      }
    });

    proc.on('error', (error) => {
      if (!hasResolved) {
        hasResolved = true;
        clearTimeout(timeout);
        resolve(createFailedStatus(config.name, error));
      }
    });
  });
}

/**
 * Parses the connection status from CLI output
 */
function parseConnectionStatus(stdout: string, _stderr: string): boolean {
  const output = stdout.toLowerCase();
  return output.includes('connected') || output.includes('✓');
}

/**
 * Parses an error message from stderr
 */
function parseErrorMessage(stderr: string): string {
  const trimmed = stderr.trim();
  return trimmed || 'Connection failed';
}

/**
 * Creates a failed status object
 */
function createFailedStatus(
  name: string,
  error: unknown
): ServerHealthStatus {
  const message = error instanceof Error ? error.message : String(error);
  return {
    name,
    isConnected: false,
    latencyMs: null,
    lastChecked: new Date(),
    errorMessage: message,
  };
}

/**
 * Creates a timeout status object
 */
function createTimeoutStatus(
  name: string,
  timeoutMs: number
): ServerHealthStatus {
  return {
    name,
    isConnected: false,
    latencyMs: null,
    lastChecked: new Date(),
    errorMessage: `Timed out after ${timeoutMs}ms`,
  };
}
