# /para.summary - View Session Summary

Displays a summary of recent sessions or generates a summary preview.

## Usage

```
/para.summary [options]
```

## Behavior

1. **Lists recent sessions**: Shows the last 5 session summaries
2. **Displays summary**: Shows key metrics from recent work
3. **Preview mode**: Shows what would be captured without saving

## Example Output

```
📊 Session Summary for claude-01

Recent Sessions (Last 7 days):
┌─────────────────────┬──────────┬───────┬───────────┐
│ Date                │ Duration │ Tasks │ Decisions │
├─────────────────────┼──────────┼───────┼───────────┤
│ 2026-02-04 14:30    │ 45m      │ 3     │ 2         │
│ 2026-02-04 09:15    │ 1h 20m   │ 5     │ 1         │
│ 2026-02-03 16:00    │ 30m      │ 2     │ 0         │
└─────────────────────┴──────────┴───────┴───────────┘

Totals:
  Sessions: 3
  Total Time: 2h 35m
  Tasks Completed: 10
  Decisions Logged: 3
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--days` | number | `7` | Number of days to include |
| `--limit` | number | `5` | Max sessions to show |
| `--preview` | boolean | `false` | Preview current session |

## Commands

### List Recent Sessions

```
/para.summary
```

Shows recent session summaries with metrics.

### Preview Current Session

```
/para.summary --preview
```

Shows what would be captured in the current session without saving.

### Extended History

```
/para.summary --days 30 --limit 10
```

Shows up to 10 sessions from the last 30 days.

## Implementation

```typescript
import { SessionSync, VaultService } from 'obsidian-para-sync';

// List recent sessions
const sessions = await sessionSync.listSessionSummaries();

// Display summary table
for (const path of sessions.slice(0, limit)) {
  const content = await vaultService.readNote(path);
  // Parse and display metrics
}
```

## Prerequisites

- Obsidian must be running
- MCP Tools plugin must be installed and configured
- Previous sessions must have been synced with `/para.sync`

## Related Skills

- `/para.sync` - Sync current session
- `/para.capture` - Quick note capture
- `/para.search` - Search vault for context

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `McpConnectionError` | Obsidian not running | Start Obsidian |
| `NoteNotFoundError` | No sessions found | Run `/para.sync` first |
