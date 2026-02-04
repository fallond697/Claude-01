# /para.search - Search Vault for Context

Searches your Obsidian vault for relevant context using semantic or text search.

## Usage

```
/para.search <query>
```

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `query` | Yes | The search query to find relevant notes |

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--limit` | number | `5` | Maximum results to return |
| `--semantic` | boolean | `true` | Use semantic search (Smart Connections) |
| `--category` | string | all | Limit to PARA category (inbox/projects/areas/resources/archives) |
| `--project` | string | current | Search within specific project |
| `--inject` | boolean | `false` | Inject results into conversation context |

## Examples

### Basic search
```
/para.search "authentication flow"
```

### Search with limit
```
/para.search "React hooks" --limit 10
```

### Search specific category
```
/para.search "TypeScript patterns" --category resources
```

### Search and inject context
```
/para.search "previous ADR decisions" --inject
```

### Text-only search (no semantic)
```
/para.search "TODO" --semantic false
```

## Example Output

```
🔍 Search Results for "authentication flow"

Found 3 relevant notes (42ms):

1. [[1-Projects/claude-01/decisions/ADR-003-auth.md|ADR-003: JWT Authentication]]
   Tags: adr, security, authentication
   > We decided to use JWT tokens with refresh token rotation for the API...
   Relevance: 92%

2. [[2-Areas/typescript/auth-patterns.md|Auth Patterns in TypeScript]]
   Tags: typescript, patterns, security
   > Common authentication patterns including OAuth2, SAML, and session-based...
   Relevance: 78%

3. [[1-Projects/claude-01/sessions/20260203-session.md|Session 2026-02-03]]
   Tags: session, claude-01
   > Implemented the login endpoint with bcrypt password hashing...
   Relevance: 65%
```

## Behavior

1. **Semantic Search** (default): Uses Smart Connections plugin for meaning-based search
2. **Text Search**: Falls back to simple text matching if semantic unavailable
3. **Result Ranking**: Orders by relevance score
4. **Context Injection**: Optionally adds results to conversation context

## Search Scope

By default, searches across all PARA categories:
- `0-Inbox` - Quick captures and unsorted notes
- `1-Projects` - Active project documentation
- `2-Areas` - Ongoing responsibility areas
- `3-Resources` - Reference materials
- `4-Archives` - Completed/inactive content

## Implementation

```typescript
import { ContextRetriever, VaultService } from 'obsidian-para-sync';

// Retrieve context
const context = await contextRetriever.retrieveContext(query, {
  semantic: true,
  limit: 5,
  categories: ['projects', 'resources'],
});

// Format for display
console.log(contextRetriever.formatContextForInjection(context));
```

## Prerequisites

- Obsidian must be running
- MCP Tools plugin must be installed and configured
- For semantic search: Smart Connections plugin recommended
- `OBSIDIAN_API_KEY` environment variable must be set

## Related Skills

- `/para.capture` - Quick note capture
- `/para.sync` - Sync session to vault
- `/para.adr` - Create architecture decision record

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `McpConnectionError` | Obsidian not running | Start Obsidian |
| `SearchError` | Search failed | Check query syntax |
| `ConfigurationError` | Missing API key | Set `OBSIDIAN_API_KEY` |

## Tips

- Use specific terms for better semantic results
- Combine with `--inject` to use context in follow-up questions
- Search within project folder for focused results
- Use tags in query for tag-based filtering: `tag:typescript`
