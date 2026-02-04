/**
 * Custom error classes for Obsidian PARA Sync
 * @module errors/sync-errors
 */

/**
 * Base error class for all sync-related errors
 */
export class SyncError extends Error {
  readonly code: string;
  readonly timestamp: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'SyncError';
    this.code = code;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error thrown when MCP connection fails
 */
export class McpConnectionError extends SyncError {
  readonly endpoint?: string;

  constructor(message: string, endpoint?: string) {
    super(message, 'MCP_CONNECTION_ERROR');
    this.name = 'McpConnectionError';
    this.endpoint = endpoint;
  }
}

/**
 * Error thrown when vault operations fail
 */
export class VaultOperationError extends SyncError {
  readonly operation: string;
  readonly path?: string;

  constructor(message: string, operation: string, path?: string) {
    super(message, 'VAULT_OPERATION_ERROR');
    this.name = 'VaultOperationError';
    this.operation = operation;
    this.path = path;
  }
}

/**
 * Error thrown when a note is not found
 */
export class NoteNotFoundError extends VaultOperationError {
  constructor(path: string) {
    super(`Note not found: ${path}`, 'read', path);
    this.name = 'NoteNotFoundError';
    this.code = 'NOTE_NOT_FOUND';
  }
}

/**
 * Error thrown when frontmatter validation fails
 */
export class FrontmatterValidationError extends SyncError {
  readonly path: string;
  readonly validationErrors: readonly string[];

  constructor(path: string, validationErrors: readonly string[]) {
    super(
      `Invalid frontmatter in ${path}: ${validationErrors.join(', ')}`,
      'FRONTMATTER_VALIDATION_ERROR'
    );
    this.name = 'FrontmatterValidationError';
    this.path = path;
    this.validationErrors = validationErrors;
  }
}

/**
 * Error thrown when PARA folder structure is invalid
 */
export class ParaStructureError extends SyncError {
  readonly category?: string;
  readonly expectedPath?: string;

  constructor(message: string, category?: string, expectedPath?: string) {
    super(message, 'PARA_STRUCTURE_ERROR');
    this.name = 'ParaStructureError';
    this.category = category;
    this.expectedPath = expectedPath;
  }
}

/**
 * Error thrown when template processing fails
 */
export class TemplateError extends SyncError {
  readonly templatePath: string;
  readonly variables?: Record<string, unknown>;

  constructor(
    message: string,
    templatePath: string,
    variables?: Record<string, unknown>
  ) {
    super(message, 'TEMPLATE_ERROR');
    this.name = 'TemplateError';
    this.templatePath = templatePath;
    this.variables = variables;
  }
}

/**
 * Error thrown when search operations fail
 */
export class SearchError extends SyncError {
  readonly query: string;
  readonly searchType: 'simple' | 'semantic';

  constructor(message: string, query: string, searchType: 'simple' | 'semantic') {
    super(message, 'SEARCH_ERROR');
    this.name = 'SearchError';
    this.query = query;
    this.searchType = searchType;
  }
}

/**
 * Error thrown when session sync fails
 */
export class SessionSyncError extends SyncError {
  readonly sessionId: string;
  readonly phase: 'summary' | 'save' | 'daily-note';

  constructor(message: string, sessionId: string, phase: 'summary' | 'save' | 'daily-note') {
    super(message, 'SESSION_SYNC_ERROR');
    this.name = 'SessionSyncError';
    this.sessionId = sessionId;
    this.phase = phase;
  }
}

/**
 * Error thrown when configuration is invalid or missing
 */
export class ConfigurationError extends SyncError {
  readonly configKey: string;

  constructor(message: string, configKey: string) {
    super(message, 'CONFIGURATION_ERROR');
    this.name = 'ConfigurationError';
    this.configKey = configKey;
  }
}

/**
 * Error thrown when operation times out
 */
export class TimeoutError extends SyncError {
  readonly timeoutMs: number;
  readonly operation: string;

  constructor(operation: string, timeoutMs: number) {
    super(`Operation '${operation}' timed out after ${timeoutMs}ms`, 'TIMEOUT_ERROR');
    this.name = 'TimeoutError';
    this.operation = operation;
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Type guard to check if an error is a SyncError
 */
export function isSyncError(error: unknown): error is SyncError {
  return error instanceof SyncError;
}

/**
 * Wraps an unknown error into a SyncError
 */
export function wrapError(error: unknown, context: string): SyncError {
  if (error instanceof SyncError) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);
  return new SyncError(`${context}: ${message}`, 'UNKNOWN_ERROR');
}
