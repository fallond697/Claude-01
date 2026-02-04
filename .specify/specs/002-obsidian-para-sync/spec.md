# Feature Specification: Obsidian PARA Sync

> **Status**: Draft
> **Author**: Claude
> **Date**: 2026-02-04

## Overview

A bidirectional knowledge management integration between Claude Code and Obsidian using jacksteamdev's MCP Tools plugin. The system implements the PARA methodology (Projects, Areas, Resources, Archives) for organizing development knowledge, session context, and AI-assisted insights.

## Problem Statement

Currently, knowledge generated during Claude Code sessions is ephemeral—insights, decisions, and context are lost when sessions end. Developers lack a structured way to:
- Persist valuable context from coding sessions
- Build a searchable knowledge base of technical decisions
- Retrieve relevant past context when starting new sessions
- Maintain a "digital twin" of their development expertise

## User Stories

### Primary User Story
As a developer, I want Claude Code to automatically sync session insights to my Obsidian vault using PARA methodology, so that I can build a persistent, searchable knowledge base of my development work.

### Additional User Stories
- As a developer, I want Claude Code to search my Obsidian vault for relevant context before starting a task, so that past decisions inform current work.
- As a developer, I want to capture technical decisions as Architecture Decision Records (ADRs) in my vault, so that I have a permanent record of "why" choices were made.
- As a developer, I want session summaries automatically created at the end of coding sessions, so that I don't lose valuable context.

## Functional Requirements

### Must Have (P0)
- [ ] Install and configure jacksteamdev's obsidian-mcp-tools
- [ ] Create PARA folder structure in Obsidian vault
- [ ] Implement session context sync (Claude Code → Obsidian)
- [ ] Implement context retrieval (Obsidian → Claude Code)
- [ ] Auto-generate session summaries with key decisions

### Should Have (P1)
- [ ] Semantic search across vault for relevant context
- [ ] ADR template and auto-creation workflow
- [ ] Tag-based organization (project tags, tech stack tags)
- [ ] Daily notes integration with session logs

### Nice to Have (P2)
- [ ] Bi-directional link suggestions based on content
- [ ] Automatic archival of completed project notes
- [ ] Knowledge graph visualization of session connections
- [ ] Template library for common note types

## PARA Methodology Structure

```
Obsidian Vault/
├── 0-Inbox/                    # Unsorted captures
│   └── quick-captures/
├── 1-Projects/                 # Active work with deadlines
│   ├── claude-01/              # This project
│   │   ├── sessions/           # Session summaries
│   │   ├── decisions/          # ADRs
│   │   └── specs/              # Synced specs
│   └── {other-projects}/
├── 2-Areas/                    # Ongoing responsibilities
│   ├── claude-code/            # Claude Code expertise
│   ├── typescript/             # Language knowledge
│   └── devops/                 # Infrastructure knowledge
├── 3-Resources/                # Reference material
│   ├── libraries/              # Package documentation
│   ├── patterns/               # Design patterns
│   └── snippets/               # Reusable code
└── 4-Archives/                 # Completed/inactive
    └── completed-projects/
```

## Technical Architecture

### MCP Integration

```
┌─────────────────┐     MCP Protocol     ┌──────────────────────┐
│   Claude Code   │◄───────────────────►│  obsidian-mcp-tools  │
│    (Client)     │                      │    (MCP Server)      │
└─────────────────┘                      └──────────┬───────────┘
                                                    │
                                         ┌──────────▼───────────┐
                                         │   Local REST API     │
                                         │     (Plugin)         │
                                         └──────────┬───────────┘
                                                    │
                                         ┌──────────▼───────────┐
                                         │   Obsidian Vault     │
                                         │   (PARA Structure)   │
                                         └──────────────────────┘
```

### MCP Tools Available

| Tool | Use Case |
|------|----------|
| `create_note` | Create session summaries, ADRs, captures |
| `update_note` | Append to daily notes, update project status |
| `search_vault_smart` | Semantic search for relevant context |
| `search_vault_simple` | Text search for specific terms |
| `execute_template` | Generate notes from Templater templates |
| `list_vault_files` | Browse project folders |

### Data Flow

**Session Start (Obsidian → Claude Code)**:
1. Claude Code queries vault for project context
2. Semantic search retrieves relevant past sessions
3. Context injected into session as background knowledge

**During Session (Claude Code → Obsidian)**:
1. Key decisions captured as quick notes in Inbox
2. ADRs created when architectural choices made
3. Code snippets saved to Resources

**Session End (Claude Code → Obsidian)**:
1. Session summary generated with:
   - Tasks completed
   - Decisions made
   - Open questions
   - Links to related notes
2. Summary saved to project's sessions folder
3. Daily note updated with session link

## Non-Functional Requirements

- **Performance**: Vault queries must complete within 2 seconds
- **Security**: API keys stored securely, never logged
- **Reliability**: Graceful degradation if Obsidian unavailable
- **Accessibility**: Notes use standard Markdown, portable

## Acceptance Criteria

```gherkin
Given Claude Code is connected to Obsidian via MCP
When I complete a coding session
Then a session summary is created in 1-Projects/{project}/sessions/
And the summary includes tasks, decisions, and links
And the daily note is updated with a session reference

Given I start a new Claude Code session
When I mention a topic covered in past sessions
Then relevant context from Obsidian is retrieved
And past decisions inform current suggestions
```

## Out of Scope

- Real-time collaborative editing
- Obsidian plugin development (using existing plugins)
- Mobile sync (handled by Obsidian Sync)
- Version control of vault (separate concern)

## Dependencies

### Required
- **Obsidian** v1.7.7+
- **MCP Tools plugin** (jacksteamdev/obsidian-mcp-tools)
- **Local REST API plugin** (for MCP communication)
- **Claude Code CLI** with MCP support

### Recommended
- **Templater plugin** (for note templates)
- **Smart Connections plugin** (for semantic search)
- **Dataview plugin** (for dynamic queries)

## Configuration

### MCP Server Setup
```json
{
  "mcpServers": {
    "obsidian": {
      "command": "{vault}/.obsidian/plugins/obsidian-mcp-tools/bin/mcp-server",
      "args": [],
      "env": {
        "OBSIDIAN_API_KEY": "${OBSIDIAN_API_KEY}"
      }
    }
  }
}
```

### Environment Variables
```bash
OBSIDIAN_API_KEY=           # From Local REST API plugin
OBSIDIAN_VAULT_PATH=        # Path to Obsidian vault
PARA_PROJECT_FOLDER=        # Current project folder name
```

## Open Questions

- [ ] How to handle vault conflicts when multiple Claude instances access?
- [ ] Should session summaries be auto-committed to git?
- [ ] What's the optimal frequency for context sync during long sessions?
- [ ] How to handle large vaults with 10k+ notes?

## References

- [jacksteamdev/obsidian-mcp-tools](https://github.com/jacksteamdev/obsidian-mcp-tools)
- [PARA Method by Tiago Forte](https://fortelabs.com/blog/para/)
- [Obsidian Local REST API](https://github.com/coddingtonbear/obsidian-local-rest-api)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
