/**
 * Service for reading MCP server configurations from Claude config files
 * @module services/mcp-config-reader
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import type {
  McpServerConfig,
  ClaudeConfigFile,
  RawMcpServerConfig,
} from '../types/server-status.js';
import { ConfigReadError, NoServersConfiguredError } from '../errors/health-check-error.js';

const DEFAULT_CONFIG_PATHS = [
  join(homedir(), '.claude.json'),
  join(homedir(), '.claude', 'settings.json'),
];

/**
 * Reads and parses MCP server configurations from Claude config files
 * @param configPath - Optional custom config file path
 * @returns Array of MCP server configurations
 * @throws {ConfigReadError} When config file cannot be read or parsed
 * @throws {NoServersConfiguredError} When no servers are configured
 */
export async function readMcpConfigs(
  configPath?: string
): Promise<readonly McpServerConfig[]> {
  const configFile = await findAndReadConfig(configPath);
  const servers = parseServerConfigs(configFile);

  if (servers.length === 0) {
    throw new NoServersConfiguredError();
  }

  return servers;
}

/**
 * Finds and reads the Claude config file
 */
async function findAndReadConfig(
  customPath?: string
): Promise<ClaudeConfigFile> {
  const pathsToTry = customPath ? [customPath] : DEFAULT_CONFIG_PATHS;

  for (const configPath of pathsToTry) {
    if (existsSync(configPath)) {
      return readConfigFile(configPath);
    }
  }

  const searchedPaths = pathsToTry.join(', ');
  throw new ConfigReadError(
    searchedPaths,
    new Error('No config file found')
  );
}

/**
 * Reads and parses a single config file
 */
async function readConfigFile(configPath: string): Promise<ClaudeConfigFile> {
  try {
    const content = await readFile(configPath, 'utf-8');
    return JSON.parse(content) as ClaudeConfigFile;
  } catch (error) {
    const cause = error instanceof Error ? error : new Error(String(error));
    throw new ConfigReadError(configPath, cause);
  }
}

/**
 * Parses raw server configs into typed McpServerConfig objects
 */
function parseServerConfigs(
  config: ClaudeConfigFile
): readonly McpServerConfig[] {
  const rawServers = config.mcpServers;

  if (!rawServers || typeof rawServers !== 'object') {
    return [];
  }

  return Object.entries(rawServers).map(([name, raw]) =>
    normalizeServerConfig(name, raw)
  );
}

/**
 * Normalizes a raw server config into a typed McpServerConfig
 */
function normalizeServerConfig(
  name: string,
  raw: RawMcpServerConfig
): McpServerConfig {
  return {
    name,
    type: normalizeServerType(raw.type),
    command: raw.command,
    args: raw.args ?? [],
    env: raw.env,
  };
}

/**
 * Normalizes the server type string to a valid type
 */
function normalizeServerType(type?: string): 'stdio' | 'sse' | 'http' {
  if (type === 'sse' || type === 'http') {
    return type;
  }
  return 'stdio';
}

/**
 * Gets the list of default config paths that will be searched
 * @returns Array of config file paths
 */
export function getDefaultConfigPaths(): readonly string[] {
  return DEFAULT_CONFIG_PATHS;
}
