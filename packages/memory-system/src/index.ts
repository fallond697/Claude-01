/**
 * @haute/memory-system
 *
 * 4-tier enterprise memory architecture for the HAUTE framework.
 *
 * Memory Tiers:
 * - Level 0 (Constitutional): Immutable rules and constraints
 * - Level 1 (Context): Session-local ephemeral state
 * - Level 2 (Explicit): Persistent project knowledge
 * - Level 3 (Controlled): Gated organizational resources
 */

export {
  MemoryTier,
  type MemoryPersistence,
  type MemoryWritability,
  type MemoryScope,
  type MemoryItem,
  type ConstitutionalMemory,
  type ContextMemory,
  type ExplicitMemory,
  type ControlledMemory,
  type Memory,
  type MemoryTierConfig,
  type MemoryQueryOptions,
  type MemoryQueryResult,
  type MemoryAccessEvent,
} from './types.js';

export {
  MEMORY_TIER_CONFIGS,
  getMemoryTierConfig,
  getTierConfigsByPrecedence,
  canAiWrite,
  requiresAuditLog,
  getMcpServersForTier,
} from './config.js';
