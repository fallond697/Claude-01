// ==========================================================================
// Enterprise Memory Architecture — Neo4j Seed Data
//
// Populates the graph with representative data across all 6 node types
// and all 6 relationship types. Run after schema creation (constraints
// and indexes).
//
// Usage:
//   cat seed-data.cypher | cypher-shell -u neo4j -p <password>
//
// Or paste sections into Neo4j Browser / MCP neo4j write-cypher.
// ==========================================================================

// --------------------------------------------------------------------------
// 1. Areas (PARA methodology)
// --------------------------------------------------------------------------

CREATE (a1:Area {
  id: 'area-software-eng',
  name: 'Software Engineering',
  description: 'Core software development practices and standards',
  owner: 'FallonD'
});

CREATE (a2:Area {
  id: 'area-knowledge-mgmt',
  name: 'Knowledge Management',
  description: 'Obsidian-based knowledge capture, PARA methodology, and memory tier operations',
  owner: 'FallonD'
});

CREATE (a3:Area {
  id: 'area-infrastructure',
  name: 'Infrastructure',
  description: 'DevOps, CI/CD, tooling, and Neo4j graph database operations',
  owner: 'FallonD'
});

// --------------------------------------------------------------------------
// 2. Projects
// --------------------------------------------------------------------------

CREATE (p1:Project {
  id: 'proj-haute-framework',
  name: 'HAUTE Framework',
  description: 'Human-Augmented Unified Team Environment - Claude Code CLI configuration template with knowledge-augmented development',
  operating_tier: 'Incubation',
  created_at: '2026-01-29T00:00:00Z'
});

CREATE (p2:Project {
  id: 'proj-memory-system',
  name: 'Memory System Package',
  description: 'TypeScript types and configuration for the 5-tier enterprise memory architecture',
  operating_tier: 'Incubation',
  created_at: '2026-01-30T00:00:00Z'
});

CREATE (p3:Project {
  id: 'proj-enterprise-paper',
  name: 'Enterprise Architecture Paper',
  description: 'Research paper defining L1-L4 memory tiers, context vectors, and synapse patterns',
  operating_tier: 'Sandbox',
  created_at: '2026-01-15T00:00:00Z'
});

// --------------------------------------------------------------------------
// 3. Requirements
// --------------------------------------------------------------------------

CREATE (r1:Requirement {
  id: 'req-five-tier-memory',
  title: 'Implement 5-tier memory system',
  description: 'Extend the 4-tier L0-L3 memory architecture with L4 System tier for cross-project patterns, including Neo4j storage modes and paper alias mapping',
  priority: 'critical',
  status: 'resolved',
  embedding: null
});

CREATE (r2:Requirement {
  id: 'req-neo4j-schema',
  title: 'Neo4j graph schema for artifact tracking',
  description: 'Create constraints, indexes, and vector index in Neo4j for 6 node types (Artifact, AgentExecution, Promotion, Project, Area, Requirement) and 6 relationship types',
  priority: 'high',
  status: 'resolved',
  embedding: null
});

CREATE (r3:Requirement {
  id: 'req-context-vector',
  title: 'Context vector visibility filtering',
  description: 'Implement 4-dimensional context vector (role, project, operating tier, session) with operating tier hierarchy: Sandbox < Incubation < Enterprise < Commercial',
  priority: 'high',
  status: 'resolved',
  embedding: null
});

CREATE (r4:Requirement {
  id: 'req-synapse-impl',
  title: 'Synapse pattern runtime implementation',
  description: 'Build runtime logic for the five synapse patterns: wikilink resolution, content-addressing via SHA hashes, provenance chain traversal, embedding similarity search, and promotion breadcrumbs',
  priority: 'medium',
  status: 'open',
  embedding: null
});

CREATE (r5:Requirement {
  id: 'req-promotion-workflow',
  title: 'Promotion workflow with validation',
  description: 'Implement the tier promotion workflow with validation gates, audit logging, and breadcrumb synapse creation when artifacts move between L1-L4',
  priority: 'medium',
  status: 'open',
  embedding: null
});

CREATE (r6:Requirement {
  id: 'req-cross-project-sharing',
  title: 'Cross-project pattern sharing',
  description: 'Enable L4 System memory to share patterns, conventions, and best practices across multiple projects via Neo4j cross-project queries',
  priority: 'medium',
  status: 'open',
  embedding: null
});

// --------------------------------------------------------------------------
// 4. Agent Executions
// --------------------------------------------------------------------------

CREATE (ae1:AgentExecution {
  id: 'exec-memory-arch-build',
  agent_name: 'claude-opus-4-6',
  session_id: 'session-2026-02-06-a',
  started_at: '2026-02-06T18:00:00Z',
  completed_at: '2026-02-06T18:35:00Z',
  status: 'completed',
  tools_used: ['Read', 'Write', 'Edit', 'Bash', 'mcp__neo4j__write-cypher']
});

CREATE (ae2:AgentExecution {
  id: 'exec-neo4j-schema-create',
  agent_name: 'claude-opus-4-6',
  session_id: 'session-2026-02-06-a',
  started_at: '2026-02-06T18:30:00Z',
  completed_at: '2026-02-06T18:35:00Z',
  status: 'completed',
  tools_used: ['mcp__neo4j__write-cypher', 'mcp__neo4j__read-cypher', 'mcp__neo4j__get-schema']
});

CREATE (ae3:AgentExecution {
  id: 'exec-seed-data',
  agent_name: 'claude-opus-4-6',
  session_id: 'session-2026-02-06-b',
  started_at: '2026-02-06T19:00:00Z',
  completed_at: '2026-02-06T19:10:00Z',
  status: 'completed',
  tools_used: ['mcp__neo4j__write-cypher', 'mcp__neo4j__read-cypher']
});

// --------------------------------------------------------------------------
// 5. Artifacts — L0 Constitutional
// --------------------------------------------------------------------------

CREATE (:Artifact {
  id: 'art-constitution',
  tier: 0,
  project: 'proj-haute-framework',
  operating_tier: null,
  content_hash: 'sha256:c0nst1tut10n',
  content: 'Non-negotiable rules: Node.js 20+, TypeScript strict, no any types, max 50-line functions, max 300-line files',
  created_at: '2026-01-29T00:00:00Z',
  updated_at: '2026-01-29T00:00:00Z',
  tags: ['constitutional', 'rules', 'immutable']
});

// --------------------------------------------------------------------------
// 5. Artifacts — L1 Context
// --------------------------------------------------------------------------

CREATE (:Artifact {
  id: 'art-session-context-feb06',
  tier: 1,
  project: 'proj-memory-system',
  operating_tier: 'Incubation',
  content_hash: 'sha256:s3ss10n-ctx-feb06',
  content: 'Session context: implementing enterprise memory architecture with L4 System tier, Neo4j schema, context vectors, and synapse patterns',
  created_at: '2026-02-06T18:00:00Z',
  updated_at: '2026-02-06T18:35:00Z',
  tags: ['session', 'context', 'ephemeral']
});

// --------------------------------------------------------------------------
// 5. Artifacts — L2 Explicit
// --------------------------------------------------------------------------

CREATE (:Artifact {
  id: 'art-memory-architecture-md',
  tier: 2,
  project: 'proj-haute-framework',
  operating_tier: 'Incubation',
  content_hash: 'sha256:m3m0ry-4rch-md',
  content: '5-tier enterprise memory architecture documentation with Neo4j graph schema, context vector filtering, and synapse patterns',
  created_at: '2026-02-06T18:30:00Z',
  updated_at: '2026-02-06T18:35:00Z',
  tags: ['documentation', 'architecture', 'memory-system']
});

CREATE (:Artifact {
  id: 'art-glossary-md',
  tier: 2,
  project: 'proj-haute-framework',
  operating_tier: 'Incubation',
  content_hash: 'sha256:gl0ss4ry-md',
  content: 'Project glossary with HAUTE, PARA, MCP, memory tier, and enterprise architecture terminology',
  created_at: '2026-02-06T18:32:00Z',
  updated_at: '2026-02-06T18:35:00Z',
  tags: ['glossary', 'terminology', 'reference']
});

CREATE (:Artifact {
  id: 'art-types-ts',
  tier: 2,
  project: 'proj-memory-system',
  operating_tier: 'Incubation',
  content_hash: 'sha256:typ3s-ts',
  content: 'Core TypeScript types: MemoryTier enum (0-4), Neo4jStorageMode, SystemMemory interface, Memory discriminated union',
  created_at: '2026-02-06T18:10:00Z',
  updated_at: '2026-02-06T18:35:00Z',
  tags: ['typescript', 'types', 'core']
});

CREATE (:Artifact {
  id: 'art-neo4j-types-ts',
  tier: 2,
  project: 'proj-memory-system',
  operating_tier: 'Incubation',
  content_hash: 'sha256:n3o4j-typ3s',
  content: 'Neo4j graph schema types: 6 node interfaces, 6 relationship interfaces, discriminated unions for ArtifactNode, AgentExecutionNode, PromotionNode, ProjectNode, AreaNode, RequirementNode',
  created_at: '2026-02-06T18:15:00Z',
  updated_at: '2026-02-06T18:35:00Z',
  tags: ['typescript', 'neo4j', 'schema']
});

CREATE (:Artifact {
  id: 'art-context-vector-ts',
  tier: 2,
  project: 'proj-memory-system',
  operating_tier: 'Incubation',
  content_hash: 'sha256:ctx-v3ct0r',
  content: 'Context vector types and visibility functions: OperatingTier hierarchy, getVisibleTiers, isArtifactVisible',
  created_at: '2026-02-06T18:18:00Z',
  updated_at: '2026-02-06T18:35:00Z',
  tags: ['typescript', 'context-vector', 'visibility']
});

CREATE (:Artifact {
  id: 'art-synapse-types-ts',
  tier: 2,
  project: 'proj-memory-system',
  operating_tier: 'Incubation',
  content_hash: 'sha256:syn4ps3-ts',
  content: 'Five synapse pattern types: WikilinkSynapse, ContentAddressingSynapse, ProvenanceChainSynapse, EmbeddingSynapse, PromotionBreadcrumbSynapse',
  created_at: '2026-02-06T18:20:00Z',
  updated_at: '2026-02-06T18:35:00Z',
  tags: ['typescript', 'synapse', 'patterns']
});

// --------------------------------------------------------------------------
// 5. Artifacts — L3 Controlled
// --------------------------------------------------------------------------

CREATE (:Artifact {
  id: 'art-enterprise-policy',
  tier: 3,
  project: 'proj-haute-framework',
  operating_tier: 'Enterprise',
  content_hash: 'sha256:3nt-p0l1cy',
  content: 'Enterprise data classification policy: public, internal, confidential, restricted access levels with retention schedules',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  tags: ['policy', 'enterprise', 'controlled']
});

// --------------------------------------------------------------------------
// 5. Artifacts — L4 System (dimension-agnostic, operating_tier: null)
// --------------------------------------------------------------------------

CREATE (:Artifact {
  id: 'art-ts-strict-convention',
  tier: 4,
  project: 'proj-haute-framework',
  operating_tier: null,
  content_hash: 'sha256:ts-str1ct',
  content: 'Convention: All TypeScript projects must use strict mode with noImplicitAny, strictNullChecks, noUnusedLocals, noUnusedParameters',
  created_at: '2026-01-20T00:00:00Z',
  updated_at: '2026-02-06T18:35:00Z',
  tags: ['convention', 'typescript', 'cross-project']
});

CREATE (:Artifact {
  id: 'art-para-methodology',
  tier: 4,
  project: 'proj-haute-framework',
  operating_tier: null,
  content_hash: 'sha256:p4r4-m3th',
  content: 'Pattern: PARA methodology (Projects, Areas, Resources, Archives) for organizing knowledge in Obsidian vaults and memory tiers',
  created_at: '2026-01-20T00:00:00Z',
  updated_at: '2026-02-06T18:35:00Z',
  tags: ['pattern', 'para', 'knowledge-management', 'cross-project']
});

CREATE (:Artifact {
  id: 'art-kebab-case-convention',
  tier: 4,
  project: 'proj-haute-framework',
  operating_tier: null,
  content_hash: 'sha256:k3b4b-c4s3',
  content: 'Convention: All source files must use kebab-case naming (e.g., neo4j-types.ts, context-vector.ts)',
  created_at: '2026-01-20T00:00:00Z',
  updated_at: '2026-02-06T18:35:00Z',
  tags: ['convention', 'naming', 'cross-project']
});

// --------------------------------------------------------------------------
// 6. Promotions
// --------------------------------------------------------------------------

CREATE (:Promotion {
  id: 'promo-arch-doc-to-explicit',
  from_tier: 1,
  to_tier: 2,
  promoted_at: '2026-02-06T18:30:00Z',
  promoted_by: 'FallonD',
  validation_passed: true,
  rationale: 'Memory architecture documentation matured from session context to persistent explicit knowledge after implementation was verified'
});

CREATE (:Promotion {
  id: 'promo-ts-strict-to-system',
  from_tier: 2,
  to_tier: 4,
  promoted_at: '2026-01-25T00:00:00Z',
  promoted_by: 'FallonD',
  validation_passed: true,
  rationale: 'TypeScript strict mode convention validated across multiple projects and promoted to cross-project system memory'
});

CREATE (:Promotion {
  id: 'promo-para-to-system',
  from_tier: 2,
  to_tier: 4,
  promoted_at: '2026-01-25T00:00:00Z',
  promoted_by: 'FallonD',
  validation_passed: true,
  rationale: 'PARA methodology pattern proven effective for knowledge organization, promoted to system-level best practice'
});

CREATE (:Promotion {
  id: 'promo-kebab-to-system',
  from_tier: 2,
  to_tier: 4,
  promoted_at: '2026-01-25T00:00:00Z',
  promoted_by: 'FallonD',
  validation_passed: true,
  rationale: 'Kebab-case file naming convention standardized across all projects'
});

// --------------------------------------------------------------------------
// 7. Relationships — SUPPORTS (Project -> Area)
// --------------------------------------------------------------------------

MATCH (p:Project {id: 'proj-haute-framework'}), (a:Area {id: 'area-software-eng'})
CREATE (p)-[:SUPPORTS {id: 'rel-haute-supports-swe', created_at: '2026-01-29T00:00:00Z'}]->(a);

MATCH (p:Project {id: 'proj-haute-framework'}), (a:Area {id: 'area-knowledge-mgmt'})
CREATE (p)-[:SUPPORTS {id: 'rel-haute-supports-km', created_at: '2026-01-29T00:00:00Z'}]->(a);

MATCH (p:Project {id: 'proj-memory-system'}), (a:Area {id: 'area-software-eng'})
CREATE (p)-[:SUPPORTS {id: 'rel-memsys-supports-swe', created_at: '2026-01-30T00:00:00Z'}]->(a);

MATCH (p:Project {id: 'proj-memory-system'}), (a:Area {id: 'area-infrastructure'})
CREATE (p)-[:SUPPORTS {id: 'rel-memsys-supports-infra', created_at: '2026-01-30T00:00:00Z'}]->(a);

MATCH (p:Project {id: 'proj-enterprise-paper'}), (a:Area {id: 'area-knowledge-mgmt'})
CREATE (p)-[:SUPPORTS {id: 'rel-paper-supports-km', created_at: '2026-01-15T00:00:00Z'}]->(a);

// --------------------------------------------------------------------------
// 8. Relationships — FULFILLS (Artifact -> Project)
// --------------------------------------------------------------------------

MATCH (a:Artifact {id: 'art-constitution'}), (p:Project {id: 'proj-haute-framework'})
CREATE (a)-[:FULFILLS {id: 'rel-constitution-fulfills-haute', artifact_id: a.id, project_id: p.id, scope: 'full', created_at: '2026-01-29T00:00:00Z'}]->(p);

MATCH (a:Artifact {id: 'art-types-ts'}), (p:Project {id: 'proj-memory-system'})
CREATE (a)-[:FULFILLS {id: 'rel-types-fulfills-memsys', artifact_id: a.id, project_id: p.id, scope: 'partial', created_at: '2026-02-06T18:10:00Z'}]->(p);

MATCH (a:Artifact {id: 'art-neo4j-types-ts'}), (p:Project {id: 'proj-memory-system'})
CREATE (a)-[:FULFILLS {id: 'rel-neo4j-fulfills-memsys', artifact_id: a.id, project_id: p.id, scope: 'partial', created_at: '2026-02-06T18:15:00Z'}]->(p);

MATCH (a:Artifact {id: 'art-context-vector-ts'}), (p:Project {id: 'proj-memory-system'})
CREATE (a)-[:FULFILLS {id: 'rel-ctxvec-fulfills-memsys', artifact_id: a.id, project_id: p.id, scope: 'partial', created_at: '2026-02-06T18:18:00Z'}]->(p);

MATCH (a:Artifact {id: 'art-synapse-types-ts'}), (p:Project {id: 'proj-memory-system'})
CREATE (a)-[:FULFILLS {id: 'rel-synapse-fulfills-memsys', artifact_id: a.id, project_id: p.id, scope: 'partial', created_at: '2026-02-06T18:20:00Z'}]->(p);

MATCH (a:Artifact {id: 'art-memory-architecture-md'}), (p:Project {id: 'proj-haute-framework'})
CREATE (a)-[:FULFILLS {id: 'rel-archdoc-fulfills-haute', artifact_id: a.id, project_id: p.id, scope: 'partial', created_at: '2026-02-06T18:30:00Z'}]->(p);

// --------------------------------------------------------------------------
// 9. Relationships — DERIVED_FROM (Artifact -> Artifact)
// --------------------------------------------------------------------------

MATCH (src:Artifact {id: 'art-types-ts'}), (tgt:Artifact {id: 'art-constitution'})
CREATE (src)-[:DERIVED_FROM {id: 'rel-types-from-constitution', rationale: 'Core types derived from constitutional rules defining the tier system', agent: 'claude-opus-4-6', timestamp: '2026-02-06T18:10:00Z', created_at: '2026-02-06T18:10:00Z'}]->(tgt);

MATCH (src:Artifact {id: 'art-neo4j-types-ts'}), (tgt:Artifact {id: 'art-types-ts'})
CREATE (src)-[:DERIVED_FROM {id: 'rel-neo4j-from-types', rationale: 'Neo4j graph types import and extend the core MemoryTier enum from types.ts', agent: 'claude-opus-4-6', timestamp: '2026-02-06T18:15:00Z', created_at: '2026-02-06T18:15:00Z'}]->(tgt);

MATCH (src:Artifact {id: 'art-context-vector-ts'}), (tgt:Artifact {id: 'art-types-ts'})
CREATE (src)-[:DERIVED_FROM {id: 'rel-ctxvec-from-types', rationale: 'Context vector types build on MemoryTier to add operating tier visibility', agent: 'claude-opus-4-6', timestamp: '2026-02-06T18:18:00Z', created_at: '2026-02-06T18:18:00Z'}]->(tgt);

MATCH (src:Artifact {id: 'art-synapse-types-ts'}), (tgt:Artifact {id: 'art-neo4j-types-ts'})
CREATE (src)-[:DERIVED_FROM {id: 'rel-synapse-from-neo4j', rationale: 'Synapse patterns model the linking mechanisms between Neo4j graph nodes', agent: 'claude-opus-4-6', timestamp: '2026-02-06T18:20:00Z', created_at: '2026-02-06T18:20:00Z'}]->(tgt);

MATCH (src:Artifact {id: 'art-memory-architecture-md'}), (tgt:Artifact {id: 'art-session-context-feb06'})
CREATE (src)-[:DERIVED_FROM {id: 'rel-archdoc-from-session', rationale: 'Architecture documentation crystallized from session working context', agent: 'claude-opus-4-6', timestamp: '2026-02-06T18:30:00Z', created_at: '2026-02-06T18:30:00Z'}]->(tgt);

// --------------------------------------------------------------------------
// 10. Relationships — PROMOTED_VIA (Artifact -> Promotion)
// --------------------------------------------------------------------------

MATCH (a:Artifact {id: 'art-memory-architecture-md'}), (pm:Promotion {id: 'promo-arch-doc-to-explicit'})
CREATE (a)-[:PROMOTED_VIA {id: 'rel-archdoc-promo', artifact_id: a.id, promotion_id: pm.id, validation_passed: true, created_at: '2026-02-06T18:30:00Z'}]->(pm);

MATCH (a:Artifact {id: 'art-ts-strict-convention'}), (pm:Promotion {id: 'promo-ts-strict-to-system'})
CREATE (a)-[:PROMOTED_VIA {id: 'rel-tsstrict-promo', artifact_id: a.id, promotion_id: pm.id, validation_passed: true, created_at: '2026-01-25T00:00:00Z'}]->(pm);

MATCH (a:Artifact {id: 'art-para-methodology'}), (pm:Promotion {id: 'promo-para-to-system'})
CREATE (a)-[:PROMOTED_VIA {id: 'rel-para-promo', artifact_id: a.id, promotion_id: pm.id, validation_passed: true, created_at: '2026-01-25T00:00:00Z'}]->(pm);

MATCH (a:Artifact {id: 'art-kebab-case-convention'}), (pm:Promotion {id: 'promo-kebab-to-system'})
CREATE (a)-[:PROMOTED_VIA {id: 'rel-kebab-promo', artifact_id: a.id, promotion_id: pm.id, validation_passed: true, created_at: '2026-01-25T00:00:00Z'}]->(pm);

// --------------------------------------------------------------------------
// 11. Relationships — REFERENCES (Artifact -> Artifact)
// --------------------------------------------------------------------------

MATCH (src:Artifact {id: 'art-glossary-md'}), (tgt:Artifact {id: 'art-memory-architecture-md'})
CREATE (src)-[:REFERENCES {id: 'rel-glossary-refs-arch', source_id: src.id, target_id: tgt.id, reference_type: 'wikilink', created_at: '2026-02-06T18:32:00Z'}]->(tgt);

MATCH (src:Artifact {id: 'art-memory-architecture-md'}), (tgt:Artifact {id: 'art-types-ts'})
CREATE (src)-[:REFERENCES {id: 'rel-arch-refs-types', source_id: src.id, target_id: tgt.id, reference_type: 'wikilink', created_at: '2026-02-06T18:30:00Z'}]->(tgt);

MATCH (src:Artifact {id: 'art-memory-architecture-md'}), (tgt:Artifact {id: 'art-neo4j-types-ts'})
CREATE (src)-[:REFERENCES {id: 'rel-arch-refs-neo4j', source_id: src.id, target_id: tgt.id, reference_type: 'wikilink', created_at: '2026-02-06T18:30:00Z'}]->(tgt);

MATCH (src:Artifact {id: 'art-neo4j-types-ts'}), (tgt:Artifact {id: 'art-context-vector-ts'})
CREATE (src)-[:REFERENCES {id: 'rel-neo4j-refs-ctxvec', source_id: src.id, target_id: tgt.id, reference_type: 'content-hash', created_at: '2026-02-06T18:20:00Z'}]->(tgt);

MATCH (src:Artifact {id: 'art-ts-strict-convention'}), (tgt:Artifact {id: 'art-constitution'})
CREATE (src)-[:REFERENCES {id: 'rel-tsstrict-refs-constitution', source_id: src.id, target_id: tgt.id, reference_type: 'wikilink', created_at: '2026-01-25T00:00:00Z'}]->(tgt);

// --------------------------------------------------------------------------
// 12. Relationships — ADDRESSES (Artifact -> Requirement)
// --------------------------------------------------------------------------

MATCH (a:Artifact {id: 'art-types-ts'}), (r:Requirement {id: 'req-five-tier-memory'})
CREATE (a)-[:ADDRESSES {id: 'rel-types-addr-fivetier', artifact_id: a.id, requirement_id: r.id, coverage: 'full', created_at: '2026-02-06T18:10:00Z'}]->(r);

MATCH (a:Artifact {id: 'art-neo4j-types-ts'}), (r:Requirement {id: 'req-neo4j-schema'})
CREATE (a)-[:ADDRESSES {id: 'rel-neo4j-addr-schema', artifact_id: a.id, requirement_id: r.id, coverage: 'full', created_at: '2026-02-06T18:15:00Z'}]->(r);

MATCH (a:Artifact {id: 'art-context-vector-ts'}), (r:Requirement {id: 'req-context-vector'})
CREATE (a)-[:ADDRESSES {id: 'rel-ctxvec-addr-ctxvec', artifact_id: a.id, requirement_id: r.id, coverage: 'full', created_at: '2026-02-06T18:18:00Z'}]->(r);

MATCH (a:Artifact {id: 'art-synapse-types-ts'}), (r:Requirement {id: 'req-synapse-impl'})
CREATE (a)-[:ADDRESSES {id: 'rel-synapse-addr-synapse', artifact_id: a.id, requirement_id: r.id, coverage: 'partial', created_at: '2026-02-06T18:20:00Z'}]->(r);

MATCH (a:Artifact {id: 'art-memory-architecture-md'}), (r:Requirement {id: 'req-five-tier-memory'})
CREATE (a)-[:ADDRESSES {id: 'rel-archdoc-addr-fivetier', artifact_id: a.id, requirement_id: r.id, coverage: 'partial', created_at: '2026-02-06T18:30:00Z'}]->(r);

MATCH (a:Artifact {id: 'art-ts-strict-convention'}), (r:Requirement {id: 'req-cross-project-sharing'})
CREATE (a)-[:ADDRESSES {id: 'rel-tsstrict-addr-crossproj', artifact_id: a.id, requirement_id: r.id, coverage: 'partial', created_at: '2026-01-25T00:00:00Z'}]->(r);

// --------------------------------------------------------------------------
// Verification queries (run after seeding)
// --------------------------------------------------------------------------

// Node counts by label:
// MATCH (n) RETURN labels(n)[0] AS label, count(n) AS count ORDER BY label;

// Relationship counts by type:
// MATCH ()-[r]->() RETURN type(r) AS rel, count(r) AS count ORDER BY rel;

// Provenance chain from constitution:
// MATCH path = (leaf)-[:DERIVED_FROM*1..3]->(root:Artifact {id: 'art-constitution'})
// RETURN [n IN nodes(path) | n.id] AS chain ORDER BY length(path) DESC;

// Context vector: artifacts visible from Sandbox:
// MATCH (a:Artifact) WHERE a.operating_tier IS NULL OR a.operating_tier = 'Sandbox'
// RETURN a.id, a.tier, a.operating_tier ORDER BY a.tier;
