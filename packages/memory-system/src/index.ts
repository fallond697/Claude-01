/**
 * @haute/memory-system
 *
 * 5-tier enterprise memory architecture for the HAUTE framework.
 *
 * Memory Tiers:
 * - Level 0 (Constitutional): Immutable rules and constraints
 * - Level 1 (Context): Session-local ephemeral state
 * - Level 2 (Explicit): Persistent project knowledge
 * - Level 3 (Controlled): Gated organizational resources
 * - Level 4 (System): Cross-project patterns and conventions
 */

// Core types
export {
  MemoryTier,
  type MemoryPersistence,
  type MemoryWritability,
  type MemoryScope,
  type Neo4jStorageMode,
  type PaperTierAlias,
  type MemoryItem,
  type ConstitutionalMemory,
  type ContextMemory,
  type ExplicitMemory,
  type ControlledMemory,
  type SystemMemory,
  type Memory,
  type MemoryTierConfig,
  type MemoryQueryOptions,
  type MemoryQueryResult,
  type MemoryAccessEvent,
} from './types.js';

// Configuration
export {
  MEMORY_TIER_CONFIGS,
  getMemoryTierConfig,
  getTierConfigsByPrecedence,
  canAiWrite,
  requiresAuditLog,
  getMcpServersForTier,
  getStorageModeForTier,
  usesNeo4j,
} from './config.js';

// Neo4j graph schema types
export {
  type ArtifactNode,
  type AgentExecutionNode,
  type PromotionNode,
  type ProjectNode,
  type AreaNode,
  type RequirementNode,
  type Neo4jNode,
  type Neo4jNodeType,
  type DerivedFromRelationship,
  type PromotedViaRelationship,
  type ReferencesRelationship,
  type AddressesRelationship,
  type SupportsRelationship,
  type FulfillsRelationship,
  type Neo4jRelationship,
  type Neo4jRelationshipType,
} from './neo4j-types.js';

// Context vector types and functions
export {
  type ContextRole,
  type OperatingTier,
  type ContextVector,
  type ContextFilter,
  type VisibilityResult,
  OPERATING_TIER_HIERARCHY,
  getVisibleTiers,
  isArtifactVisible,
} from './context-vector.js';

// Synapse pattern types
export {
  type WikilinkSynapse,
  type ContentAddressingSynapse,
  type ProvenanceChainSynapse,
  type EmbeddingSynapse,
  type PromotionBreadcrumbSynapse,
  type Synapse,
  type SynapseType,
  SYNAPSE_TYPES,
} from './synapse-types.js';

// Tier alias mapping
export {
  type PaperTierName,
  type CurrentTierName,
  type TierAliasMapping,
  TIER_ALIAS_MAP,
  resolveTierFromAlias,
  getPaperName,
  getCurrentName,
} from './tier-aliases.js';
