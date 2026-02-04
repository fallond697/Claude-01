/**
 * Custom error classes for MCP health checking
 * @module errors/health-check-error
 */

/**
 * Base error class for health check operations
 */
export class HealthCheckError extends Error {
  public readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'HealthCheckError';
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error thrown when Claude CLI is not found or not accessible
 */
export class ClaudeCliNotFoundError extends HealthCheckError {
  constructor() {
    super(
      'Claude CLI not found. Please install it with: npm install -g @anthropic-ai/claude-code',
      'CLAUDE_CLI_NOT_FOUND'
    );
    this.name = 'ClaudeCliNotFoundError';
  }
}

/**
 * Error thrown when config file cannot be read or parsed
 */
export class ConfigReadError extends HealthCheckError {
  public readonly configPath: string;

  constructor(configPath: string, cause?: Error) {
    const message = cause
      ? `Failed to read config at ${configPath}: ${cause.message}`
      : `Failed to read config at ${configPath}`;
    super(message, 'CONFIG_READ_ERROR');
    this.name = 'ConfigReadError';
    this.configPath = configPath;
    if (cause) {
      this.cause = cause;
    }
  }
}

/**
 * Error thrown when a health check times out
 */
export class HealthCheckTimeoutError extends HealthCheckError {
  public readonly serverName: string;
  public readonly timeoutMs: number;

  constructor(serverName: string, timeoutMs: number) {
    super(
      `Health check for "${serverName}" timed out after ${timeoutMs}ms`,
      'HEALTH_CHECK_TIMEOUT'
    );
    this.name = 'HealthCheckTimeoutError';
    this.serverName = serverName;
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Error thrown when no MCP servers are configured
 */
export class NoServersConfiguredError extends HealthCheckError {
  constructor() {
    super(
      'No MCP servers configured. Add servers with: claude mcp add <name> -- <command>',
      'NO_SERVERS_CONFIGURED'
    );
    this.name = 'NoServersConfiguredError';
  }
}
