# Implementation Plan: Obsidian PARA Sync

> **Spec**: [spec.md](./spec.md)
> **Status**: Draft
> **Author**: Claude
> **Date**: 2026-02-04

## Constitutional Compliance

This plan adheres to the following constitutional principles:
- **Tech Stack**: Node.js 20+ with ES modules, TypeScript 5.0+ strict mode
- **Security**: API keys via environment variables, never logged
- **Performance**: Vault queries < 2 seconds, graceful degradation
- **Testing**: 80% coverage for services, mocked MCP calls

## Technical Approach

### Overview
Create a TypeScript library (`obsidian-para-sync`) that wraps jacksteamdev's MCP Tools to provide PARA-structured knowledge management. The library will be used by Claude Code skills to sync session context bidirectionally with Obsidian.

### Architecture Decision Records (ADRs)

#### ADR-1: MCP Tools vs Direct REST API
- **Context**: Need to communicate with Obsidian vault
- **Decision**: Use jacksteamdev's obsidian-mcp-tools via MCP protocol
- **Consequences**: Leverage existing tested solution; depends on plugin being installed

#### ADR-2: Session Storage Format
- **Context**: Need to persist session summaries in a queryable format
- **Decision**: Use frontmatter YAML + Markdown body for all notes
- **Consequences**: Compatible with Dataview queries; portable; human-readable

#### ADR-3: Claude Code Integration Method
- **Context**: Need Claude Code to use this library
- **Decision**: Create Claude Code skills (`.claude/skills/`) that invoke library functions
- **Consequences**: Users invoke via `/para.*` commands; skills manage MCP calls

## Components

### New Components
| Component | Purpose | Location |
|-----------|---------|----------|
| `obsidian-para-sync` | Core sync library | `packages/obsidian-para-sync/` |
| `VaultService` | CRUD operations on vault | `src/services/vault-service.ts` |
| `ParaManager` | PARA folder structure mgmt | `src/services/para-manager.ts` |
| `SessionSync` | Session summary generation | `src/services/session-sync.ts` |
| `ContextRetriever` | Semantic search & retrieval | `src/services/context-retriever.ts` |
| `TemplateEngine` | Note template processing | `src/services/template-engine.ts` |
| Claude Code Skills | User-facing commands | `.claude/skills/para-*.md` |

### Directory Structure
```
packages/obsidian-para-sync/
├── src/
│   ├── services/
│   │   ├── vault-service.ts       # MCP wrapper for vault ops
│   │   ├── para-manager.ts        # PARA structure management
│   │   ├── session-sync.ts        # Session capture & summary
│   │   ├── context-retriever.ts   # Search & context injection
│   │   └── template-engine.ts     # Templater integration
│   ├── templates/
│   │   ├── session-summary.md     # Session summary template
│   │   ├── adr.md                 # ADR template
│   │   ├── daily-note.md          # Daily note template
│   │   └── quick-capture.md       # Quick capture template
│   ├── types/
│   │   └── index.ts               # Type definitions
│   ├── errors/
│   │   └── sync-errors.ts         # Custom error classes
│   └── index.ts                   # Package exports
├── package.json
├── tsconfig.json
└── README.md

.claude/skills/
├── para-sync.md                   # /para.sync - Manual sync trigger
├── para-capture.md                # /para.capture - Quick note capture
├── para-search.md                 # /para.search - Search vault
├── para-adr.md                    # /para.adr - Create ADR
└── para-summary.md                # /para.summary - Generate summary
```

## Data Model

```typescript
// src/types/index.ts

/** PARA folder categories */
type ParaCategory = 'inbox' | 'projects' | 'areas' | 'resources' | 'archives';

/** Frontmatter for all PARA notes */
interface ParaNoteFrontmatter {
  readonly title: string;
  readonly created: string;           // ISO date
  readonly modified: string;          // ISO date
  readonly category: ParaCategory;
  readonly project?: string;          // Project folder name
  readonly tags: readonly string[];
  readonly sessionId?: string;        // Claude session ID
}

/** Session summary structure */
interface SessionSummary {
  readonly sessionId: string;
  readonly project: string;
  readonly startedAt: string;
  readonly endedAt: string;
  readonly tasksCompleted: readonly string[];
  readonly decisionsLogged: readonly string[];
  readonly questionsRaised: readonly string[];
  readonly relatedNotes: readonly string[];
}

/** ADR structure */
interface ArchitectureDecisionRecord {
  readonly id: string;               // ADR-001 format
  readonly title: string;
  readonly status: 'proposed' | 'accepted' | 'deprecated' | 'superseded';
  readonly context: string;
  readonly decision: string;
  readonly consequences: string;
  readonly date: string;
}

/** Context retrieval result */
interface RetrievedContext {
  readonly query: string;
  readonly results: readonly ContextMatch[];
  readonly searchTimeMs: number;
}

interface ContextMatch {
  readonly path: string;
  readonly title: string;
  readonly excerpt: string;
  readonly relevanceScore: number;
  readonly frontmatter: ParaNoteFrontmatter;
}

/** MCP Tool call options */
interface McpCallOptions {
  readonly timeout?: number;
  readonly retries?: number;
}
```

## MCP Integration

### Tool Wrapper Functions
```typescript
// Wrapped MCP tool calls with error handling

async function createNote(
  path: string,
  content: string,
  options?: McpCallOptions
): Promise<void>;

async function updateNote(
  path: string,
  content: string,
  options?: McpCallOptions
): Promise<void>;

async function searchVault(
  query: string,
  options?: { semantic?: boolean }
): Promise<SearchResult[]>;

async function listVaultFiles(
  folder: string
): Promise<VaultFile[]>;

async function executeTemplate(
  templatePath: string,
  variables: Record<string, unknown>
): Promise<string>;
```

## Claude Code Skills

### `/para.sync` - Sync Session
```markdown
Triggers session sync to Obsidian:
1. Generates session summary from conversation
2. Creates note in 1-Projects/{project}/sessions/
3. Updates daily note with session link
4. Returns confirmation with note path
```

### `/para.capture` - Quick Capture
```markdown
Captures a quick note to Inbox:
1. Takes user input as note content
2. Adds frontmatter with timestamp and tags
3. Saves to 0-Inbox/quick-captures/
4. Returns link to new note
```

### `/para.search` - Context Search
```markdown
Searches vault for relevant context:
1. Takes search query from user
2. Runs semantic search via Smart Connections
3. Returns top 5 matches with excerpts
4. Optionally injects context into conversation
```

### `/para.adr` - Create ADR
```markdown
Creates an Architecture Decision Record:
1. Prompts for title, context, decision, consequences
2. Auto-generates ADR ID from sequence
3. Creates note in 1-Projects/{project}/decisions/
4. Links to related session notes
```

## Testing Strategy

### Unit Tests
- `vault-service.test.ts`: Mock MCP calls, test error handling
- `para-manager.test.ts`: Test folder creation, path resolution
- `session-sync.test.ts`: Test summary generation, frontmatter
- `context-retriever.test.ts`: Test search result parsing
- `template-engine.test.ts`: Test variable substitution

### Integration Tests
- End-to-end skill invocation with mock MCP server
- PARA structure validation
- Session round-trip (create → retrieve → verify)

### Test Coverage Target
- 80% line coverage for `src/services/`
- 100% coverage for error handling paths

## Configuration

### Environment Variables
```bash
# Required
OBSIDIAN_API_KEY=               # From Local REST API plugin settings
OBSIDIAN_VAULT_PATH=            # Absolute path to vault folder

# Optional
PARA_PROJECT_NAME=claude-01     # Current project folder name
PARA_DAILY_NOTE_FORMAT=YYYY-MM-DD  # Daily note filename format
PARA_SESSION_RETENTION_DAYS=90  # Auto-archive after N days
```

### MCP Server Configuration
```json
{
  "mcpServers": {
    "obsidian": {
      "command": "${OBSIDIAN_VAULT_PATH}/.obsidian/plugins/obsidian-mcp-tools/bin/mcp-server",
      "args": [],
      "env": {
        "OBSIDIAN_API_KEY": "${OBSIDIAN_API_KEY}"
      }
    }
  }
}
```

## Dependencies

### Runtime Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `zod` | `^3.23.0` | Schema validation for frontmatter |
| `date-fns` | `^3.6.0` | Date formatting for notes |
| `gray-matter` | `^4.0.3` | Frontmatter parsing |
| `slugify` | `^1.6.6` | Note filename generation |

### Dev Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | `^5.4.5` | TypeScript compiler |
| `vitest` | `^1.6.0` | Testing framework |
| `@types/node` | `^20.14.0` | Node.js types |

## Rollout Plan

### Phase 1: Foundation (P0)
1. Create package structure and types
2. Implement VaultService with MCP wrappers
3. Implement ParaManager for folder structure
4. Create basic `/para.capture` skill

### Phase 2: Session Sync (P0)
1. Implement SessionSync service
2. Create session summary template
3. Implement `/para.sync` skill
4. Add daily note integration

### Phase 3: Context Retrieval (P0/P1)
1. Implement ContextRetriever with semantic search
2. Create `/para.search` skill
3. Add context injection to session start

### Phase 4: ADRs & Templates (P1)
1. Implement TemplateEngine
2. Create ADR template and `/para.adr` skill
3. Add tag-based organization

### Phase 5: Polish (P1/P2)
1. Add error recovery and retry logic
2. Implement graceful degradation
3. Write comprehensive tests
4. Documentation and examples

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| MCP Tools plugin not installed | High | Med | Check on startup, show install guide |
| Obsidian not running | Med | Med | Queue operations, retry on reconnect |
| Large vault slow queries | Med | Low | Limit search scope, pagination |
| Conflicting vault writes | Low | Low | Optimistic locking, last-write-wins |

## Success Metrics

- Session summaries created for 90%+ of coding sessions
- Context retrieval returns relevant results in < 2 seconds
- Zero data loss from sync failures (retry + queue)
- User satisfaction: context feels "personalized" and relevant
