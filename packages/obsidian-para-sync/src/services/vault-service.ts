/**
 * VaultService - MCP wrapper for Obsidian vault operations
 * @module services/vault-service
 */

import type {
  McpCallOptions,
  VaultFile,
  SearchOptions,
  EnvConfig,
} from '../types/index.js';
import {
  McpConnectionError,
  VaultOperationError,
  NoteNotFoundError,
  SearchError,
  TimeoutError,
  wrapError,
} from '../errors/sync-errors.js';

/** Search result from vault */
export interface SearchResult {
  readonly path: string;
  readonly content: string;
  readonly score?: number;
}

/** MCP tool call interface (injected at runtime) */
export interface McpToolCaller {
  call(
    serverName: string,
    toolName: string,
    args: Record<string, unknown>
  ): Promise<unknown>;
}

/** Default timeout for MCP calls in milliseconds */
const DEFAULT_TIMEOUT = 30000;

/** Default retry count */
const DEFAULT_RETRIES = 2;

/**
 * Service for interacting with Obsidian vault via MCP
 */
export class VaultService {
  private readonly mcpCaller: McpToolCaller;
  private readonly serverName: string;

  constructor(_config: EnvConfig, mcpCaller: McpToolCaller, serverName = 'obsidian') {
    this.mcpCaller = mcpCaller;
    this.serverName = serverName;
  }

  /**
   * Creates a new note in the vault
   */
  async createNote(
    path: string,
    content: string,
    options?: McpCallOptions
  ): Promise<void> {
    const fullPath = this.resolvePath(path);

    await this.callWithRetry(
      'create_note',
      { path: fullPath, content },
      options
    );
  }

  /**
   * Updates an existing note in the vault
   */
  async updateNote(
    path: string,
    content: string,
    options?: McpCallOptions
  ): Promise<void> {
    const fullPath = this.resolvePath(path);

    await this.callWithRetry(
      'update_note',
      { path: fullPath, content },
      options
    );
  }

  /**
   * Reads a note from the vault
   */
  async readNote(path: string, options?: McpCallOptions): Promise<string> {
    const fullPath = this.resolvePath(path);

    try {
      const result = await this.callWithRetry(
        'get_note',
        { path: fullPath },
        options
      );

      if (typeof result !== 'string') {
        throw new VaultOperationError(
          'Invalid response from get_note',
          'read',
          fullPath
        );
      }

      return result;
    } catch (error) {
      if (error instanceof VaultOperationError &&
          error.message.toLowerCase().includes('not found')) {
        throw new NoteNotFoundError(fullPath);
      }
      throw error;
    }
  }

  /**
   * Appends content to an existing note
   */
  async appendToNote(
    path: string,
    content: string,
    options?: McpCallOptions
  ): Promise<void> {
    try {
      const existingContent = await this.readNote(path, options);
      const newContent = `${existingContent}\n\n${content}`;
      await this.updateNote(path, newContent, options);
    } catch (error) {
      if (error instanceof NoteNotFoundError) {
        await this.createNote(path, content, options);
      } else {
        throw error;
      }
    }
  }

  /**
   * Searches the vault using simple text search
   */
  async searchSimple(
    query: string,
    options?: SearchOptions & McpCallOptions
  ): Promise<readonly SearchResult[]> {
    try {
      const args: Record<string, unknown> = { query };

      if (options?.folder) {
        args.folder = options.folder;
      }
      if (options?.limit) {
        args.limit = options.limit;
      }

      const result = await this.callWithRetry(
        'search_vault_simple',
        args,
        options
      );

      return this.parseSearchResults(result);
    } catch (error) {
      throw new SearchError(
        wrapError(error, 'Simple search failed').message,
        query,
        'simple'
      );
    }
  }

  /**
   * Searches the vault using semantic search (Smart Connections)
   */
  async searchSemantic(
    query: string,
    options?: SearchOptions & McpCallOptions
  ): Promise<readonly SearchResult[]> {
    try {
      const args: Record<string, unknown> = { query };

      if (options?.folder) {
        args.folder = options.folder;
      }
      if (options?.limit) {
        args.limit = options.limit;
      }

      const result = await this.callWithRetry(
        'search_vault_smart',
        args,
        options
      );

      return this.parseSearchResults(result);
    } catch (error) {
      throw new SearchError(
        wrapError(error, 'Semantic search failed').message,
        query,
        'semantic'
      );
    }
  }

  /**
   * Lists files in a vault folder
   */
  async listFiles(
    folder: string,
    options?: McpCallOptions
  ): Promise<readonly VaultFile[]> {
    const fullPath = this.resolvePath(folder);

    const result = await this.callWithRetry(
      'list_vault_files',
      { folder: fullPath },
      options
    );

    return this.parseFileList(result);
  }

  /**
   * Checks if a note exists
   */
  async noteExists(path: string, options?: McpCallOptions): Promise<boolean> {
    try {
      await this.readNote(path, options);
      return true;
    } catch (error) {
      if (error instanceof NoteNotFoundError) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Deletes a note from the vault
   */
  async deleteNote(path: string, options?: McpCallOptions): Promise<void> {
    const fullPath = this.resolvePath(path);

    await this.callWithRetry(
      'delete_note',
      { path: fullPath },
      options
    );
  }

  /**
   * Resolves a relative path to full vault path
   */
  private resolvePath(path: string): string {
    if (path.startsWith('/')) {
      return path.slice(1);
    }
    return path;
  }

  /**
   * Calls MCP tool with retry logic
   */
  private async callWithRetry(
    toolName: string,
    args: Record<string, unknown>,
    options?: McpCallOptions
  ): Promise<unknown> {
    const timeout = options?.timeout ?? DEFAULT_TIMEOUT;
    const retries = options?.retries ?? DEFAULT_RETRIES;

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.callWithTimeout(toolName, args, timeout);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < retries) {
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw lastError ?? new McpConnectionError('Unknown MCP error');
  }

  /**
   * Calls MCP tool with timeout
   */
  private async callWithTimeout(
    toolName: string,
    args: Record<string, unknown>,
    timeout: number
  ): Promise<unknown> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const result = await Promise.race([
        this.mcpCaller.call(this.serverName, toolName, args),
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener('abort', () => {
            reject(new TimeoutError(toolName, timeout));
          });
        }),
      ]);

      return result;
    } catch (error) {
      if (error instanceof TimeoutError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : String(error);

      if (message.toLowerCase().includes('connection')) {
        throw new McpConnectionError(message, this.serverName);
      }

      throw new VaultOperationError(message, toolName);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Parses search results from MCP response
   */
  private parseSearchResults(result: unknown): readonly SearchResult[] {
    if (!Array.isArray(result)) {
      return [];
    }

    return result.map((item: unknown) => {
      if (typeof item !== 'object' || item === null) {
        return { path: '', content: '' };
      }

      const obj = item as Record<string, unknown>;
      return {
        path: String(obj.path ?? ''),
        content: String(obj.content ?? obj.excerpt ?? ''),
        score: typeof obj.score === 'number' ? obj.score : undefined,
      };
    }).filter(r => r.path !== '');
  }

  /**
   * Parses file list from MCP response
   */
  private parseFileList(result: unknown): readonly VaultFile[] {
    if (!Array.isArray(result)) {
      return [];
    }

    return result.map((item: unknown) => {
      if (typeof item !== 'object' || item === null) {
        return { path: '', name: '', isFolder: false };
      }

      const obj = item as Record<string, unknown>;
      const path = String(obj.path ?? '');

      return {
        path,
        name: String(obj.name ?? path.split('/').pop() ?? ''),
        isFolder: Boolean(obj.isFolder ?? obj.is_folder ?? false),
        createdAt: typeof obj.createdAt === 'string' ? obj.createdAt : undefined,
        modifiedAt: typeof obj.modifiedAt === 'string' ? obj.modifiedAt : undefined,
      };
    }).filter(f => f.path !== '');
  }

  /**
   * Delays execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
