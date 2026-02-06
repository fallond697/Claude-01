# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Claude Code CLI configuration template** for setting up a knowledge-augmented development environment. It implements the HAUTE (Human-Augmented Unified Team Environment) framework for integrating Claude Code with Obsidian-based knowledge management.

**Status**: Setup/configuration project - no runnable application code yet.

## Project Constitution

All code written in this project must follow the principles in `.specify/memory/constitution.md`. Key constraints:

- Node.js 20+ with ES modules, TypeScript 5.0+ strict mode
- No `any` types, explicit return types required
- Max 50-line functions, max 300-line files, cyclomatic complexity ≤ 10
- npm or pnpm only (yarn forbidden)
- kebab-case files, PascalCase types, camelCase functions

## Key Files

| File | Purpose |
|------|---------|
| `Haute Setup Guide 2026-01-29.md` | Complete installation and configuration instructions |
| `.specify/memory/constitution.md` | Non-negotiable project principles (Level 0) |
| `.specify/memory/memory-architecture.md` | 5-tier memory system documentation |
| `.claude/agents/claude-code-expert.md` | Subagent for Claude Code CLI expertise |
| `packages/memory-system/` | TypeScript types for memory tiers |

## Memory Architecture

The project implements a 5-tier enterprise memory system. Higher tiers take precedence in conflicts. The codebase uses L0-L4 numbering; the enterprise architecture paper uses L1-L4.

| Tier | Name | Paper Alias | Persistence | AI Access | Neo4j Mode | Location |
|------|------|-------------|-------------|-----------|------------|----------|
| L0 | Constitutional | N/A | Permanent | Read-only | none | `.specify/memory/constitution.md` |
| L1 | Context | Context | Session | Read/Write | none | Session-local (automatic) |
| L2 | Explicit | Task | Persistent | Read/Write | provenance-only | `.specify/memory/explicit/`, Obsidian |
| L3 | Controlled | Project | External | Read-only | primary | SharePoint, Teams, APIs |
| L4 | System | System | Persistent | Read/Write | cross-project | Neo4j graph database |

**Key Rules**:
- Constitutional rules (L0) cannot be overridden by any other tier
- Email/communication tools must create drafts only, never send automatically
- Controlled knowledge (L3) is read-only and access is audit-logged
- System memory (L4) is dimension-agnostic — visible from all operating tiers
- Use `/capture` for L2 explicit knowledge, `/promote` to move to Obsidian

**Integrations**:
- MCP servers: sequential-thinking, exa, context7, brave-search, tavily, neo4j
- SpecKit for spec-driven development workflow
- Obsidian for digital twin knowledge management
- Neo4j for graph-based knowledge storage (L2 provenance, L3 primary, L4 cross-project)

## Subagents

Use the `claude-code-expert` agent (defined in `.claude/agents/`) when answering questions about Claude Code CLI features, configuration, hooks, MCP servers, or settings.
