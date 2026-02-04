/**
 * Tests for MCP config reader
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readMcpConfigs, getDefaultConfigPaths } from './mcp-config-reader.js';
import * as fs from 'node:fs/promises';
import * as fsSync from 'node:fs';

vi.mock('node:fs/promises');
vi.mock('node:fs');

describe('mcp-config-reader', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('readMcpConfigs', () => {
    it('should read and parse valid config file', async () => {
      const mockConfig = {
        mcpServers: {
          'test-server': {
            command: 'npx',
            args: ['-y', 'test-mcp-server'],
          },
        },
      };

      vi.mocked(fsSync.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockConfig));

      const result = await readMcpConfigs('/custom/path.json');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('test-server');
      expect(result[0].command).toBe('npx');
      expect(result[0].args).toEqual(['-y', 'test-mcp-server']);
      expect(result[0].type).toBe('stdio');
    });

    it('should handle multiple servers', async () => {
      const mockConfig = {
        mcpServers: {
          server1: { command: 'cmd1', args: ['a'] },
          server2: { command: 'cmd2', args: ['b'] },
          server3: { command: 'cmd3', type: 'http' },
        },
      };

      vi.mocked(fsSync.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockConfig));

      const result = await readMcpConfigs('/path.json');

      expect(result).toHaveLength(3);
      expect(result[2].type).toBe('http');
    });

    it('should throw NoServersConfiguredError when no servers', async () => {
      const mockConfig = { mcpServers: {} };

      vi.mocked(fsSync.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockConfig));

      await expect(readMcpConfigs('/path.json')).rejects.toThrow(
        'No MCP servers configured'
      );
    });

    it('should throw ConfigReadError for invalid JSON', async () => {
      vi.mocked(fsSync.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFile).mockResolvedValue('{ invalid json }');

      await expect(readMcpConfigs('/path.json')).rejects.toThrow(
        'Failed to read config'
      );
    });

    it('should throw ConfigReadError when no config file found', async () => {
      vi.mocked(fsSync.existsSync).mockReturnValue(false);

      await expect(readMcpConfigs()).rejects.toThrow('No config file found');
    });

    it('should preserve environment variables', async () => {
      const mockConfig = {
        mcpServers: {
          'api-server': {
            command: 'npx',
            args: ['-y', 'api-mcp'],
            env: { API_KEY: 'secret123' },
          },
        },
      };

      vi.mocked(fsSync.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockConfig));

      const result = await readMcpConfigs('/path.json');

      expect(result[0].env).toEqual({ API_KEY: 'secret123' });
    });
  });

  describe('getDefaultConfigPaths', () => {
    it('should return array of default paths', () => {
      const paths = getDefaultConfigPaths();

      expect(Array.isArray(paths)).toBe(true);
      expect(paths.length).toBeGreaterThan(0);
      expect(paths.every((p) => typeof p === 'string')).toBe(true);
    });
  });
});
