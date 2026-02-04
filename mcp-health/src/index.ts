/**
 * MCP Health - Health monitor for MCP servers
 * @module mcp-health
 */

// Core functionality
export { checkHealth } from './services/health-checker.js';
export { readMcpConfigs, getDefaultConfigPaths } from './services/mcp-config-reader.js';
export { formatHealthCheckResult } from './formatters/table-formatter.js';

// History and uptime tracking
export {
  saveToHistory,
  calculateUptimeStats,
  clearHistory,
  getHistoryPath,
} from './services/history-storage.js';
export type {
  HistoryEntry,
  ServerStatusSnapshot,
  UptimeStats,
} from './services/history-storage.js';
export { formatUptimeStats } from './formatters/uptime-formatter.js';

// Notifications
export { checkAndNotify, clearStateCache } from './services/notification-service.js';
export type { NotificationOptions } from './services/notification-service.js';

// Types
export type {
  McpServerConfig,
  ServerHealthStatus,
  HealthCheckResult,
  HealthCheckOptions,
  FormatOptions,
} from './types/server-status.js';

// Errors
export {
  HealthCheckError,
  ClaudeCliNotFoundError,
  ConfigReadError,
  HealthCheckTimeoutError,
  NoServersConfiguredError,
} from './errors/health-check-error.js';
