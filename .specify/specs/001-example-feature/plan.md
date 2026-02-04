# Implementation Plan: MCP Server Health Monitor

> **Spec**: [spec.md](./spec.md)
> **Status**: Draft
> **Author**: Claude
> **Date**: 2026-02-03

## Constitutional Compliance

This plan adheres to the following constitutional principles:
- **Tech Stack**: Node.js 20+ with ES modules, TypeScript 5.0+ strict mode
- **Code Quality**: No `any` types, explicit return types, max 50-line functions
- **Naming**: kebab-case files, PascalCase interfaces, camelCase functions
- **Error Handling**: Custom error classes, no silent failures
- **Imports**: Named exports, grouped imports

## Technical Approach

### Overview
Build a CLI utility that wraps the `claude mcp list` command, parses its output, and presents enhanced health information in a formatted table. The utility will run health checks in parallel for performance and cache results for quick subsequent lookups.

### Architecture Decision Records (ADRs)

#### ADR-1: CLI Wrapper vs Direct MCP Protocol
- **Context**: Need to check MCP server health status
- **Decision**: Wrap `claude mcp list` command rather than implementing MCP protocol directly
- **Consequences**: Simpler implementation, depends on Claude CLI being installed, limited to information exposed by the CLI

#### ADR-2: Output Format
- **Context**: Need to display server status in accessible format
- **Decision**: Use `cli-table3` for formatted table output with fallback to plain text
- **Consequences**: Rich terminal display, maintains screen-reader compatibility with plain text mode

#### ADR-3: Parallel Health Checks
- **Context**: Must complete all checks within 5 seconds (NFR)
- **Decision**: Run health checks concurrently using `Promise.allSettled()`
- **Consequences**: Faster execution, individual failures don't block others

## Components

### New Components
| Component | Purpose | Location |
|-----------|---------|----------|
| `mcp-health` | Main CLI entry point | `src/cli/mcp-health.ts` |
| `HealthChecker` | Core health check logic | `src/services/health-checker.ts` |
| `McpConfigReader` | Parse MCP server configs | `src/services/mcp-config-reader.ts` |
| `TableFormatter` | Format output as table | `src/formatters/table-formatter.ts` |
| `ServerStatus` | Status data interface | `src/types/server-status.ts` |

### Directory Structure
```
src/
├── cli/
│   └── mcp-health.ts          # CLI entry point
├── services/
│   ├── health-checker.ts      # Health check orchestration
│   └── mcp-config-reader.ts   # Config file parsing
├── formatters/
│   └── table-formatter.ts     # Table output formatting
├── types/
│   └── server-status.ts       # Type definitions
├── errors/
│   └── health-check-error.ts  # Custom error classes
└── index.ts                   # Package entry
```

## Data Model

```typescript
// src/types/server-status.ts

interface McpServerConfig {
  readonly name: string;
  readonly command: string;
  readonly args: readonly string[];
  readonly env?: Readonly<Record<string, string>>;
}

interface ServerHealthStatus {
  readonly name: string;
  readonly isConnected: boolean;
  readonly latencyMs: number | null;
  readonly lastChecked: Date;
  readonly errorMessage: string | null;
}

interface HealthCheckResult {
  readonly servers: readonly ServerHealthStatus[];
  readonly totalTimeMs: number;
  readonly checkedAt: Date;
}
```

## API Design

### CLI Interface
```bash
# Basic usage
npx mcp-health

# With options
npx mcp-health --watch          # Auto-refresh every 30s
npx mcp-health --interval 10    # Custom refresh interval
npx mcp-health --json           # Output as JSON
npx mcp-health --plain          # Plain text (no colors)
```

### Programmatic API
```typescript
import { checkHealth, type HealthCheckResult } from 'mcp-health';

const result: HealthCheckResult = await checkHealth({
  timeoutMs: 5000,
  configPath: '~/.claude.json'
});
```

### Output Example
```
┌─────────────────────┬───────────┬─────────┬─────────────────────┐
│ Server              │ Status    │ Latency │ Last Checked        │
├─────────────────────┼───────────┼─────────┼─────────────────────┤
│ sequential-thinking │ Connected │ 245ms   │ 2026-02-03 14:32:01 │
│ exa                 │ Connected │ 312ms   │ 2026-02-03 14:32:01 │
│ context7            │ Connected │ 189ms   │ 2026-02-03 14:32:01 │
│ brave-search        │ Failed    │ -       │ 2026-02-03 14:32:01 │
│ tavily              │ Connected │ 267ms   │ 2026-02-03 14:32:01 │
└─────────────────────┴───────────┴─────────┴─────────────────────┘
Total: 4/5 servers connected (1.2s)
```

## Dependencies

### External Packages
| Package | Version | Purpose |
|---------|---------|---------|
| `cli-table3` | `^0.6.3` | Terminal table formatting |
| `chalk` | `^5.3.0` | Terminal colors (ESM) |
| `commander` | `^12.0.0` | CLI argument parsing |

### Dev Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | `^5.4.0` | TypeScript compiler |
| `vitest` | `^1.3.0` | Unit testing |
| `@types/node` | `^20.11.0` | Node.js type definitions |

## Testing Strategy

### Unit Tests
- `health-checker.test.ts`: Mock child process, test timeout handling
- `mcp-config-reader.test.ts`: Test config parsing with various formats
- `table-formatter.test.ts`: Test output formatting, edge cases

### Integration Tests
- End-to-end CLI execution with real MCP servers
- Verify 5-second timeout constraint
- Test `--json` and `--plain` output modes

### Test Coverage Target
- Minimum 80% line coverage for `src/services/`
- 100% coverage for error handling paths

## Rollout Plan

1. **Phase 1 - Core**: Basic health check with table output
2. **Phase 2 - Enhanced**: Add latency measurement, watch mode
3. **Phase 3 - Polish**: JSON output, plain text mode, better errors

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Claude CLI not installed | High | Low | Check for CLI, show helpful error |
| MCP config format changes | Med | Low | Version detection, graceful degradation |
| Server check exceeds 5s | Med | Med | Per-server timeout with `Promise.race()` |

## Success Metrics

- Health check completes in < 5 seconds for 10 servers
- Zero false positives (reporting healthy as failed)
- Accessible output passes screen reader testing
