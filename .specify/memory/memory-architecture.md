# Enterprise Memory Architecture

> 5-Tier Memory System for Knowledge-Augmented AI Development

## Overview

This memory architecture implements a hierarchical knowledge management system that controls how AI agents access, process, and retain information across different scopes and persistence levels. It supports a dual-naming convention: the codebase uses L0-L4 numbering, while the enterprise architecture paper uses L1-L4.

## Memory Tiers

| Codebase | Paper | Name | Persistence | Writability | Scope | Neo4j Mode |
|----------|-------|------|-------------|-------------|-------|------------|
| L0 | N/A | Constitutional | Permanent | Human-only | All sessions | none |
| L1 | L1 | Context | Session | Read/Write | Current session | none |
| L2 | L2 | Explicit (Task) | Persistent | Read/Write | Project | provenance-only |
| L3 | L3 | Controlled (Project) | External | Read-only | Organization | primary |
| L4 | L4 | System | Persistent | Read/Write | Cross-project | cross-project |

---

### Level 0: Constitutional Memory

**Location**: `.specify/memory/constitution.md`
**Persistence**: Permanent
**Writability**: Human-only (AI read-only)
**Scope**: All sessions, all agents
**Neo4j**: None
**Paper Alias**: N/A (unique to codebase)

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
**Neo4j**: None
**Paper Alias**: Context (L1)

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
**Neo4j**: Provenance-only (derivation chains tracked in graph)
**Paper Alias**: Task (L2)

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
**Neo4j**: Primary (artifacts and relationships stored in graph)
**Paper Alias**: Project (L3)

Gated company-wide knowledge requiring special access:
- SharePoint document libraries
- Business glossaries
- Compliance documentation
- Approved vendor lists
- Company policies

**Access Pattern**: Via MCP tools (SharePoint, Teams) with authentication.

---

### Level 4: System Memory

**Location**: Neo4j graph database
**Persistence**: Persistent (cross-project)
**Writability**: AI read/write
**Scope**: Cross-project
**Neo4j**: Cross-project (full graph storage with vector search)
**Paper Alias**: System (L4)

Dimension-agnostic patterns, conventions, and best practices that span all projects:
- Patterns (reusable solutions)
- Glossary (organization-wide terminology)
- Conventions (coding standards beyond a single project)
- Best practices (validated approaches)

System memory is **dimension-agnostic**: it is visible from any operating tier (Sandbox, Incubation, Enterprise, Commercial) regardless of the observer's context.

**Access Pattern**: Via Neo4j MCP server with Cypher queries.

---

## Memory Precedence

When information conflicts, higher-tier memory takes precedence:

```
L0 (Constitutional) > L1 (Context) > L2 (Explicit) > L3 (Controlled) > L4 (System)
```

Constitutional rules (L0) cannot be overridden by any other tier. L4 System memory is dimension-agnostic but lowest precedence — it provides defaults that any project-level decision can override.

## Neo4j Graph Schema

### Node Types

| Label | Description | Key Properties |
|-------|-------------|----------------|
| Artifact | A stored knowledge artifact | id, tier, project, operating_tier, content_hash |
| AgentExecution | Record of an agent run | id, agent_name, session_id, status |
| Promotion | Tier promotion event | id, from_tier, to_tier, promoted_by |
| Project | A development project | id, name, operating_tier |
| Area | PARA methodology area | id, name, owner |
| Requirement | A linked requirement | id, title, priority, status, embedding |

### Relationship Types

| Type | From | To | Key Properties |
|------|------|----|----------------|
| DERIVED_FROM | Artifact | Artifact | rationale, agent, timestamp |
| PROMOTED_VIA | Artifact | Promotion | validation_passed |
| REFERENCES | Artifact | Artifact | reference_type |
| ADDRESSES | Artifact | Requirement | coverage |
| SUPPORTS | Project | Area | — |
| FULFILLS | Artifact | Project | scope |

### Vector Index

The `req_embedding` vector index on `Requirement.embedding` enables semantic similarity search (1536 dimensions, cosine similarity). Used for finding requirements related to a natural-language query:

```cypher
CALL db.index.vector.queryNodes('req_embedding', 10, $queryVector)
YIELD node, score
RETURN node.title, score
```

### Constraints

- 6 uniqueness constraints (one per node label on `id`)
- 2 property existence constraints (`Artifact.tier`, `Artifact.created_at`)

### Indexes

- `artifact_tier_idx` — filter artifacts by memory tier
- `artifact_project_idx` — filter artifacts by project
- `artifact_operating_tier_idx` — filter by operating tier
- `artifact_content_hash_idx` — content-addressing lookups
- `promotion_from_tier_idx` — query promotions by source tier
- `agent_execution_agent_idx` — query executions by agent name

## Context Vector Filtering

The context vector is a four-dimensional filter applied when querying artifacts:

| Dimension | Type | Purpose |
|-----------|------|---------|
| Role | developer, reviewer, architect, admin | RBAC filtering |
| Project | string | Scope to project |
| Operating Tier | Sandbox, Incubation, Enterprise, Commercial | Environment visibility |
| Session | string | Session-scoped filtering |

### Operating Tier Hierarchy

```
Sandbox < Incubation < Enterprise < Commercial
```

A higher-tier context can see lower-tier artifacts but not vice versa. Dimension-agnostic artifacts (L4 System) are visible from any tier.

### Visibility Rule

```
isVisible(contextTier, artifactTier):
  if artifactTier is null → true (dimension-agnostic)
  if contextTier >= artifactTier in hierarchy → true
  else → false
```

### Cypher Pattern

```cypher
MATCH (a:Artifact)
WHERE a.operating_tier IS NULL
   OR a.operating_tier IN $visibleTiers
RETURN a
```

## Five Synapse Patterns

Synapses are inter-artifact linking mechanisms in the knowledge graph:

| Pattern | Discriminant | Description |
|---------|-------------|-------------|
| Wikilink | `wikilink` | Direct `[[target]]` style links between artifacts |
| Content Addressing | `content-addressing` | Links via SHA-256/512 content hash matching |
| Provenance Chain | `provenance-chain` | Derivation lineage tracking across agent executions |
| Embedding | `embedding` | Vector-similarity links for semantic matching |
| Promotion Breadcrumb | `promotion-breadcrumb` | Tracks artifacts across tier promotions |

## Integration Points

| Tier | MCP Servers | Commands | Neo4j |
|------|-------------|----------|-------|
| L0 | N/A | `/speckit.constitution` | — |
| L1 | N/A | Automatic | — |
| L2 | obsidian, filesystem | `/capture`, `/promote`, `/search` | Provenance |
| L3 | sharepoint, teams, outlook | Read via MCP tools | Primary |
| L4 | neo4j | Cypher queries | Cross-project |

## Agent Constraints by Tier

### Email/Communication (L0 Rules)
- Never send emails automatically
- Always create drafts for human review
- Include AI disclosure in drafts
- Never access contacts without explicit instruction

### Knowledge Capture (L2 Rules)
- Use `/capture` for session insights destined for explicit memory
- Use `/promote` for permanent resources
- Follow PARA methodology in Obsidian
- Tag with source and confidence level

### Company Data (L3 Rules)
- Read-only access by default
- Log all access for audit
- Respect data classification labels
- Never copy sensitive data to lower tiers

### System Memory (L4 Rules)
- All access is audit-logged
- Patterns must be validated before promotion
- Dimension-agnostic: visible from all operating tiers
- Cross-project scope: shared across all projects

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

packages/memory-system/src/
├── index.ts                 # Barrel exports
├── types.ts                 # Core types (MemoryTier, Memory, configs)
├── config.ts                # Tier configurations and helpers
├── neo4j-types.ts           # Graph node and relationship interfaces
├── context-vector.ts        # Context vector types and visibility
├── synapse-types.ts         # Five synapse pattern types
└── tier-aliases.ts          # Dual-naming system (L0-L4 ↔ paper L1-L4)
```
