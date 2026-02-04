# Enterprise Memory Architecture

> 4-Tier Memory System for Knowledge-Augmented AI Development

## Overview

This memory architecture implements a hierarchical knowledge management system that controls how AI agents access, process, and retain information across different scopes and persistence levels.

## Memory Tiers

### Level 0: Constitutional Memory
**Location**: `.specify/memory/constitution.md`
**Persistence**: Permanent
**Writability**: Human-only (AI read-only)
**Scope**: All sessions, all agents

Defines non-negotiable rules and constraints for agent behavior. Includes:
- Tech stack requirements
- Code quality standards
- Security policies
- Prohibited patterns
- Tool-specific rules (e.g., Outlook: never send automatically, always drafts)

**Access Pattern**: Loaded into system prompt at session start.

---

### Level 1: Context Memory
**Location**: Session-local (ephemeral)
**Persistence**: Session only
**Writability**: AI read/write
**Scope**: Current session

Temporary working memory for the current task. Includes:
- Current task state
- Conversation history
- In-progress decisions
- Intermediate results

**Access Pattern**: Automatically managed by Claude Code runtime.

---

### Level 2: Explicit Memory
**Location**: `.specify/memory/explicit/` and Obsidian vault
**Persistence**: Persistent until explicitly removed
**Writability**: AI read/write with human approval
**Scope**: Project and personal knowledge

Documents, specifications, and resources close to the development environment:
- Project specifications (`.specify/specs/`)
- Personal knowledge base (Obsidian vault)
- Local documentation
- Captured learnings

**Access Pattern**: Via MCP tools (Obsidian), file read/write, `/capture` and `/promote` commands.

---

### Level 3: Controlled Memory
**Location**: SharePoint, company glossaries, external APIs
**Persistence**: Permanent (managed externally)
**Writability**: Read-only (AI cannot modify)
**Scope**: Organization-wide

Gated company-wide knowledge requiring special access:
- SharePoint document libraries
- Business glossaries
- Compliance documentation
- Approved vendor lists
- Company policies

**Access Pattern**: Via MCP tools (SharePoint, Teams) with authentication.

---

## Memory Precedence

When information conflicts, higher-tier memory takes precedence:

```
Level 0 (Constitutional) > Level 1 (Context) > Level 2 (Explicit) > Level 3 (Controlled)
```

Constitutional rules cannot be overridden by any other tier.

## Integration Points

| Tier | MCP Servers | Commands |
|------|-------------|----------|
| L0 | N/A | `/speckit.constitution` |
| L1 | N/A | Automatic |
| L2 | obsidian, filesystem | `/capture`, `/promote`, `/search` |
| L3 | sharepoint, teams, outlook | Read via MCP tools |

## Agent Constraints by Tier

### Email/Communication (L0 Rules)
- Never send emails automatically
- Always create drafts for human review
- Include AI disclosure in drafts
- Never access contacts without explicit instruction

### Knowledge Capture (L2 Rules)
- Use `/capture` for ephemeral insights
- Use `/promote` for permanent resources
- Follow PARA methodology in Obsidian
- Tag with source and confidence level

### Company Data (L3 Rules)
- Read-only access by default
- Log all access for audit
- Respect data classification labels
- Never copy sensitive data to lower tiers

## Directory Structure

```
.specify/memory/
├── constitution.md          # Level 0: Constitutional rules
├── memory-architecture.md   # This file
├── explicit/                # Level 2: Explicit knowledge
│   ├── glossary.md          # Project-specific terms
│   ├── decisions/           # Architecture Decision Records
│   └── learnings/           # Captured insights
└── controlled/              # Level 3: References only
    └── sources.md           # Pointers to controlled sources
```
