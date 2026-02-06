# Project Glossary

> Level 2 Explicit Memory - Project-specific terminology

## HAUTE Framework

| Term | Definition |
|------|------------|
| HAUTE | Human-Augmented Unified Team Environment |
| PARA | Projects, Areas, Resources, Archive - organizational methodology |
| MCP | Model Context Protocol - server integration standard |
| Digital Twin | Personal knowledge representation in Obsidian |

## Memory Tiers

| Term | Definition |
|------|------------|
| Constitutional Memory | Level 0 - Immutable agent rules |
| Context Memory | Level 1 - Session-local ephemeral state |
| Explicit Memory | Level 2 - Persistent project knowledge |
| Controlled Memory | Level 3 - Gated organizational resources |
| System Memory | Level 4 - Cross-project patterns, conventions, and best practices stored in Neo4j |

## Enterprise Architecture Concepts

| Term | Definition |
|------|------------|
| Context Vector | Four-dimensional filter (role, project, operating tier, session) applied when querying artifacts |
| Operating Tier | Environment visibility level: Sandbox < Incubation < Enterprise < Commercial |
| Synapse | Inter-artifact linking mechanism in the knowledge graph (wikilink, content-addressing, provenance-chain, embedding, promotion-breadcrumb) |
| Artifact | A stored knowledge item in the Neo4j graph, tagged with tier and operating tier |
| Provenance Chain | Derivation lineage tracking how artifacts were produced across agent executions |
| Promotion | The act of moving an artifact from a lower tier to a higher tier with validation |
| Content Hash | SHA-256/512 digest used for content-addressing synapse links |
| Dimension-Agnostic | Property of L4 System memory: visible from any operating tier regardless of context |
| Neo4j | Graph database used for storing artifacts, relationships, and vector embeddings |

## SpecKit Workflow

| Term | Definition |
|------|------------|
| Constitution | Non-negotiable project principles |
| Specification | Feature requirements document |
| Plan | Implementation strategy |
| Tasks | Granular work items |

## Tools & Integrations

| Term | Definition |
|------|------------|
| Claude Code | Anthropic's CLI for AI-assisted development |
| Obsidian | Markdown-based knowledge management |
| SharePoint | Microsoft enterprise document management |
| Context7 | Documentation lookup MCP server |
| Exa | AI-powered web search |
| Tavily | Research and extraction API |
