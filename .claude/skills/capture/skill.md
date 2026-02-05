---
name: capture
description: Capture knowledge to L2 Explicit Memory. Use when the user wants to save insights, decisions, or glossary terms to .specify/memory/explicit/.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# /capture - Capture Knowledge to L2 Explicit Memory

Captures insights, decisions, and terminology to the L2 Explicit Memory tier at `.specify/memory/explicit/`.

## Usage

```
/capture <content>
/capture <content> --type <learning|decision|glossary>
```

Or interactively:
```
/capture
> What would you like to capture?
```

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `content` | No | The knowledge to capture. If not provided, prompts for input. |

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--type` | string | `learning` | Category: `learning`, `decision`, or `glossary` |
| `--tags` | string[] | `[]` | Tags for categorization |
| `--source` | string | `session` | Where this knowledge originated |
| `--confidence` | string | `high` | Confidence level: `high`, `medium`, `low` |

## Examples

### Capture a learning
```
/capture "ServiceNow MCP tools are read-only; need write tools for automating CCB comments"
```

### Capture an architecture decision
```
/capture "Use Workato for all Salesforce-to-VRP integrations" --type decision
```

### Capture a glossary term
```
/capture "CCB: Change Control Board - weekly review meeting for change requests" --type glossary
```

### Capture with metadata
```
/capture "BGP migration requires phased rollout with monitoring-only first phase" --tags "networking,infrastructure" --source "CCB meeting 2026-02-05"
```

## Behavior

When this skill is invoked, follow these steps exactly:

### 1. Parse Input
- Extract the content from the arguments
- Determine the type (default: `learning`)
- If no content is provided, ask the user what they want to capture

### 2. Route by Type

**For `learning` (default):**
- Create a new markdown file at `.specify/memory/explicit/learnings/{date}-{slug}.md`
- Use the current date as `YYYY-MM-DD` prefix
- Generate a short slug from the content (lowercase, hyphens, max 50 chars)
- Add frontmatter with metadata

**For `decision`:**
- Create a new markdown file at `.specify/memory/explicit/decisions/{number}-{slug}.md`
- Number sequentially (ADR-0001, ADR-0002, etc.) by counting existing files
- Use Architecture Decision Record format (Context, Decision, Consequences)
- Ask the user to confirm the decision rationale if not provided

**For `glossary`:**
- Append the new term to `.specify/memory/explicit/glossary.md`
- Parse the content as `"Term: Definition"` format
- Add to the appropriate section or create a new section if needed

### 3. Write the File

**Learning frontmatter:**
```yaml
---
type: learning
captured: "YYYY-MM-DDTHH:MM:SS"
source: "<source>"
confidence: "<high|medium|low>"
tags:
  - <tag1>
  - <tag2>
---
```

**Decision frontmatter (ADR format):**
```yaml
---
type: decision
number: ADR-NNNN
captured: "YYYY-MM-DDTHH:MM:SS"
status: proposed
source: "<source>"
tags:
  - <tag1>
---
```

**Decision body structure:**
```markdown
# ADR-NNNN: <Title>

## Context
<Why this decision is needed>

## Decision
<What was decided>

## Consequences
<What follows from this decision>
```

### 4. Confirm Capture
- Display the file path that was created or updated
- Show a brief summary of what was captured
- Remind the user they can use `/promote` to move to Obsidian vault

## L2 Memory Rules (from memory-architecture.md)

- Tag with source and confidence level
- Use `/promote` for permanent resources destined for Obsidian
- Never copy L3 sensitive data into L2 captures
- AI read/write with human approval

## Related Skills

- `/memory-query` - Search across memory tiers
- `/para.capture` - Quick capture to Obsidian vault (bypasses L2)
- `/promote` - Move L2 knowledge to Obsidian permanent storage

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| Directory not found | Missing explicit memory dirs | Create `.specify/memory/explicit/learnings/` and `decisions/` |
| Duplicate slug | File already exists | Append incrementing suffix (-2, -3) |
| Empty content | No content provided | Prompt user interactively |
