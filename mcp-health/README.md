# mcp-health

Health monitor for MCP servers configured with Claude Code CLI.

## Features

- **Health Checks**: Check connection status and latency of all MCP servers
- **Watch Mode**: Auto-refresh status at configurable intervals
- **Desktop Notifications**: Get notified when servers go up or down
- **Historical Tracking**: Track uptime statistics over time
- **Multiple Output Formats**: Table, JSON, or plain text

## Installation

```bash
npm install -g mcp-health
```

Or run directly with npx:

```bash
npx mcp-health
```

## Usage

### Basic Health Check

```bash
# Check health of all configured MCP servers
mcp-health

# Output:
# ┌─────────────────────┬───────────┬─────────┬──────────┐
# │ Server              │ Status    │ Latency │ Last     │
# ├─────────────────────┼───────────┼─────────┼──────────┤
# │ sequential-thinking │ Connected │ 245ms   │ 14:32:01 │
# │ exa                 │ Connected │ 312ms   │ 14:32:01 │
# │ brave-search        │ Failed    │ -       │ 14:32:01 │
# └─────────────────────┴───────────┴─────────┴──────────┘
# Total: 2/3 servers connected (1.2s)
```

### Watch Mode with Notifications

```bash
# Watch mode with desktop notifications
mcp-health --watch --notify

# Watch with history tracking
mcp-health --watch --history --notify

# Custom refresh interval (10 seconds)
mcp-health -w -i 10 -n -H
```

### Uptime Statistics

```bash
# Show uptime statistics from historical data
mcp-health uptime

# Output:
# ┌─────────────────────┬────────┬───────┬────────────┬────────┐
# │ Server              │ Uptime │ Checks│ Avg Latency│ Status │
# ├─────────────────────┼────────┼───────┼────────────┼────────┤
# │ sequential-thinking │ 99.5%  │ 98/99 │ 245ms      │ Up     │
# │ exa                 │ 100.0% │ 99/99 │ 312ms      │ Up     │
# │ brave-search        │ 85.2%  │ 84/99 │ 189ms      │ Down   │
# └─────────────────────┴────────┴───────┴────────────┴────────┘
# Average uptime: 94.9% across 3 servers
```

### All Options

```bash
# Output formats
mcp-health --json          # Output as JSON
mcp-health --plain         # Output as plain text (no colors)
mcp-health --no-color      # Disable colored output

# Watch mode
mcp-health --watch         # Auto-refresh (default: 30s)
mcp-health -w -i 10        # Refresh every 10 seconds

# Features
mcp-health -n, --notify    # Enable desktop notifications
mcp-health -H, --history   # Save results to history file

# Configuration
mcp-health --timeout 10000 # 10 second timeout
mcp-health --config /path  # Custom config file

# History management
mcp-health uptime          # Show uptime statistics
mcp-health clear-history   # Clear historical data
mcp-health history-path    # Show history file location
```

### Exit Codes

- `0` - All servers are healthy
- `1` - One or more servers failed health check

## Programmatic Usage

```typescript
import {
  checkHealth,
  formatHealthCheckResult,
  saveToHistory,
  calculateUptimeStats,
  formatUptimeStats,
} from 'mcp-health';

// Run health check
const result = await checkHealth({
  timeoutMs: 5000,
  configPath: '~/.claude.json',
});

console.log(formatHealthCheckResult(result, { format: 'table' }));

// Save to history
await saveToHistory(result);

// Get uptime stats
const stats = await calculateUptimeStats();
console.log(formatUptimeStats(stats));
```

## API

### `checkHealth(options?)`

Checks the health of all configured MCP servers.

### `saveToHistory(result, path?)`

Saves a health check result to the history file.

### `calculateUptimeStats(path?)`

Calculates uptime statistics from historical data.

### `formatHealthCheckResult(result, options?)`

Formats health check results for display.

### `formatUptimeStats(stats, options?)`

Formats uptime statistics for display.

### `checkAndNotify(result, options)`

Checks for status changes and sends desktop notifications.

## Requirements

- Node.js 20+
- Claude Code CLI installed and authenticated

## License

MIT
