/**
 * Tests for custom error classes
 */

import { describe, it, expect } from 'vitest';
import {
  HealthCheckError,
  ClaudeCliNotFoundError,
  ConfigReadError,
  HealthCheckTimeoutError,
  NoServersConfiguredError,
} from './health-check-error.js';

describe('health-check-error', () => {
  describe('HealthCheckError', () => {
    it('should create error with message and code', () => {
      const error = new HealthCheckError('Test error', 'TEST_CODE');

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('HealthCheckError');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('ClaudeCliNotFoundError', () => {
    it('should have correct message and code', () => {
      const error = new ClaudeCliNotFoundError();

      expect(error.message).toContain('Claude CLI not found');
      expect(error.message).toContain('npm install');
      expect(error.code).toBe('CLAUDE_CLI_NOT_FOUND');
      expect(error.name).toBe('ClaudeCliNotFoundError');
    });
  });

  describe('ConfigReadError', () => {
    it('should include config path in message', () => {
      const error = new ConfigReadError('/path/to/config.json');

      expect(error.message).toContain('/path/to/config.json');
      expect(error.configPath).toBe('/path/to/config.json');
      expect(error.code).toBe('CONFIG_READ_ERROR');
    });

    it('should include cause error message', () => {
      const cause = new Error('Permission denied');
      const error = new ConfigReadError('/path/config.json', cause);

      expect(error.message).toContain('Permission denied');
      expect(error.cause).toBe(cause);
    });
  });

  describe('HealthCheckTimeoutError', () => {
    it('should include server name and timeout', () => {
      const error = new HealthCheckTimeoutError('my-server', 5000);

      expect(error.message).toContain('my-server');
      expect(error.message).toContain('5000ms');
      expect(error.serverName).toBe('my-server');
      expect(error.timeoutMs).toBe(5000);
      expect(error.code).toBe('HEALTH_CHECK_TIMEOUT');
    });
  });

  describe('NoServersConfiguredError', () => {
    it('should have helpful message with command', () => {
      const error = new NoServersConfiguredError();

      expect(error.message).toContain('No MCP servers configured');
      expect(error.message).toContain('claude mcp add');
      expect(error.code).toBe('NO_SERVERS_CONFIGURED');
    });
  });
});
