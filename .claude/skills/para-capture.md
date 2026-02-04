# /para.capture - Quick Note Capture

Captures a quick note to your Obsidian vault's Inbox.

## Usage

```
/para.capture [content]
```

Or interactively:
```
/para.capture
> What would you like to capture?
```

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `content` | No | The note content to capture. If not provided, prompts for input. |

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--tags` | string[] | `['quick-capture']` | Tags to add to the note |
| `--project` | string | Current project | Associate with a project |

## Examples

### Quick capture with content
```
/para.capture "Remember to add error handling to the auth flow"
```

### Capture with tags
```
/para.capture "Look into using Zod for validation" --tags "research,typescript"
```

### Capture for specific project
```
/para.capture "API rate limiting needed" --project "claude-01"
```

### Interactive capture
```
/para.capture
> What would you like to capture?
This is my note content that can span
multiple lines if needed.
```

## Behavior

1. **Creates note in Inbox**: Saves to `0-Inbox/quick-captures/{timestamp}.md`
2. **Adds frontmatter**: Includes created date, tags, and optional project link
3. **Returns confirmation**: Shows the path to the created note

## Frontmatter Structure

```yaml
---
title: "Quick Capture 2026-02-04 14:30"
created: "2026-02-04T14:30:00.000Z"
modified: "2026-02-04T14:30:00.000Z"
category: inbox
project: claude-01
tags:
  - quick-capture
---
```

## Implementation

This skill uses the `obsidian-para-sync` package:

```typescript
import { ParaManager, VaultService } from 'obsidian-para-sync';

// Create quick capture
const path = await paraManager.quickCapture(content, {
  tags: ['quick-capture', ...additionalTags],
  project: projectName,
});

console.log(`✓ Captured to ${path}`);
```

## Prerequisites

- Obsidian must be running
- MCP Tools plugin must be installed and configured
- Local REST API plugin must be enabled
- `OBSIDIAN_API_KEY` environment variable must be set

## Related Skills

- `/para.sync` - Sync session summary
- `/para.search` - Search vault for context
- `/para.adr` - Create architecture decision record

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `McpConnectionError` | Obsidian not running | Start Obsidian |
| `VaultOperationError` | Failed to create note | Check vault permissions |
| `ConfigurationError` | Missing API key | Set `OBSIDIAN_API_KEY` |
