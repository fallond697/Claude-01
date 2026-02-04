/**
 * Type definitions for MCP server health monitoring
 * @module types/server-status
 */

/**
 * Configuration for an MCP server as stored in Claude config files
 */
export interface McpServerConfig {
  readonly name: string;
  readonly type: 'stdio' | 'sse' | 'http';
  readonly command: string;
  readonly args: readonly string[];
  readonly env?: Readonly<Record<string, string>>;
}

/**
 * Health status for a single MCP server
 */
export interface ServerHealthStatus {
  readonly name: string;
  readonly isConnected: boolean;
  readonly latencyMs: number | null;
  readonly lastChecked: Date;
  readonly errorMessage: string | null;
}

/**
 * Result of a complete health check operation
 */
export interface HealthCheckResult {
  readonly servers: readonly ServerHealthStatus[];
  readonly totalTimeMs: number;
  readonly checkedAt: Date;
  readonly successCount: number;
  readonly failureCount: number;
}

/**
 * Options for the health check operation
 */
export interface HealthCheckOptions {
  readonly timeoutMs?: number;
  readonly configPath?: string;
}

/**
 * Options for formatting health check output
 */
export interface FormatOptions {
  readonly format: 'table' | 'json' | 'plain';
  readonly showTimestamp?: boolean;
  readonly useColors?: boolean;
}

/**
 * Raw MCP server configuration from Claude config file
 */
export interface ClaudeConfigFile {
  readonly mcpServers?: Readonly<Record<string, RawMcpServerConfig>>;
}

/**
 * Raw server config as stored in the config file
 */
export interface RawMcpServerConfig {
  readonly type?: string;
  readonly command: string;
  readonly args?: readonly string[];
  readonly env?: Readonly<Record<string, string>>;
}
