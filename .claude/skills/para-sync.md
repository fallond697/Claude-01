# /para.sync - Sync Session to Obsidian

Syncs the current Claude Code session to your Obsidian vault.

## Usage

```
/para.sync
```

## Behavior

1. **Generates session summary**: Analyzes the conversation to extract:
   - Tasks completed
   - Decisions made
   - Questions raised
   - Related notes

2. **Creates session note**: Saves to `1-Projects/{project}/sessions/{timestamp}-session.md`

3. **Updates daily note**: Adds session reference to today's daily note

4. **Returns confirmation**: Shows the path to the created session summary

## Session Summary Contents

The generated session summary includes:

| Section | Content |
|---------|---------|
| **Overview** | Session ID, project, start/end times, duration |
| **Tasks Completed** | Checklist of completed work |
| **Decisions Made** | Key technical decisions with context |
| **Questions Raised** | Open questions for follow-up |
| **Related Notes** | Links to referenced vault notes |

## Example Output

```
✓ Session synced to Obsidian

Session Summary:
  Path: 1-Projects/claude-01/sessions/20260204-143000-session.md
  Duration: 45 minutes
  Tasks: 3 completed
  Decisions: 2 logged

Daily note updated: 0-Inbox/2026-02-04.md
```

## Frontmatter Structure

```yaml
---
title: "Session 2026-02-04 14:30"
created: "2026-02-04T14:30:00.000Z"
modified: "2026-02-04T15:15:00.000Z"
category: projects
project: claude-01
sessionId: "abc123"
tags:
  - session
  - claude-01
---
```

## Implementation

This skill uses the `obsidian-para-sync` package:

```typescript
import { SessionSync, VaultService, ParaManager } from 'obsidian-para-sync';

// Generate summary from conversation context
const summary = sessionSync.generateSummaryFromContext(sessionId, {
  tasksCompleted: extractedTasks,
  decisionsLogged: extractedDecisions,
  questionsRaised: extractedQuestions,
});

// Sync to vault
const path = await sessionSync.createSessionSummary(summary);

console.log(`✓ Session synced to ${path}`);
```

## Context Extraction

The skill analyzes the conversation to identify:

- **Tasks**: Completed work items mentioned in the conversation
- **Decisions**: Technical choices made with rationale
- **Questions**: Unresolved items that need follow-up
- **Notes**: References to vault notes via `[[wikilinks]]`

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--dry-run` | boolean | `false` | Preview without saving |
| `--verbose` | boolean | `false` | Show detailed extraction |

## Prerequisites

- Obsidian must be running
- MCP Tools plugin must be installed and configured
- Local REST API plugin must be enabled
- `OBSIDIAN_API_KEY` environment variable must be set
- Project must be configured in `PARA_PROJECT_NAME`

## Related Skills

- `/para.capture` - Quick note capture
- `/para.summary` - View session summary
- `/para.search` - Search vault for context

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `McpConnectionError` | Obsidian not running | Start Obsidian |
| `SessionSyncError` | Failed to save summary | Check vault permissions |
| `ConfigurationError` | Missing project config | Set `PARA_PROJECT_NAME` |
