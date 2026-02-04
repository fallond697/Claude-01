/**
 * Memory Tier Levels
 * Higher levels take precedence in conflict resolution
 */
export enum MemoryTier {
  /** Level 0: Constitutional - Immutable rules and constraints */
  CONSTITUTIONAL = 0,
  /** Level 1: Context - Session-local ephemeral state */
  CONTEXT = 1,
  /** Level 2: Explicit - Persistent project knowledge */
  EXPLICIT = 2,
  /** Level 3: Controlled - Gated organizational resources */
  CONTROLLED = 3,
}

/**
 * Memory persistence levels
 */
export type MemoryPersistence = 'permanent' | 'session' | 'persistent' | 'external';

/**
 * Memory writability for AI agents
 */
export type MemoryWritability = 'read-only' | 'read-write' | 'human-only';

/**
 * Memory scope
 */
export type MemoryScope = 'all-sessions' | 'current-session' | 'project' | 'organization';

/**
 * Base interface for all memory items
 */
export interface MemoryItem {
  readonly id: string;
  readonly tier: MemoryTier;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly source: string;
  readonly content: string;
}

/**
 * Constitutional memory item (Level 0)
 */
export interface ConstitutionalMemory extends MemoryItem {
  readonly tier: MemoryTier.CONSTITUTIONAL;
  readonly category: 'tech-stack' | 'code-quality' | 'security' | 'prohibited' | 'tool-rules';
  readonly isEnforced: boolean;
}

/**
 * Context memory item (Level 1)
 */
export interface ContextMemory extends MemoryItem {
  readonly tier: MemoryTier.CONTEXT;
  readonly sessionId: string;
  readonly expiresAt: Date | null;
}

/**
 * Explicit memory item (Level 2)
 */
export interface ExplicitMemory extends MemoryItem {
  readonly tier: MemoryTier.EXPLICIT;
  readonly location: 'obsidian' | 'filesystem' | 'specify';
  readonly path: string;
  readonly tags: readonly string[];
  readonly confidenceLevel: 'high' | 'medium' | 'low';
}

/**
 * Controlled memory item (Level 3)
 */
export interface ControlledMemory extends MemoryItem {
  readonly tier: MemoryTier.CONTROLLED;
  readonly provider: 'sharepoint' | 'teams' | 'outlook' | 'external-api';
  readonly accessLevel: 'public' | 'internal' | 'confidential' | 'restricted';
  readonly isAuditLogged: boolean;
}

/**
 * Union type for all memory types
 */
export type Memory =
  | ConstitutionalMemory
  | ContextMemory
  | ExplicitMemory
  | ControlledMemory;

/**
 * Memory tier configuration
 */
export interface MemoryTierConfig {
  readonly tier: MemoryTier;
  readonly name: string;
  readonly description: string;
  readonly persistence: MemoryPersistence;
  readonly writability: MemoryWritability;
  readonly scope: MemoryScope;
  readonly location: string;
  readonly mcpServers: readonly string[];
  readonly commands: readonly string[];
}

/**
 * Memory query options
 */
export interface MemoryQueryOptions {
  readonly tiers?: readonly MemoryTier[];
  readonly tags?: readonly string[];
  readonly source?: string;
  readonly limit?: number;
  readonly includeExpired?: boolean;
}

/**
 * Memory query result
 */
export interface MemoryQueryResult<T extends Memory = Memory> {
  readonly items: readonly T[];
  readonly totalCount: number;
  readonly tier: MemoryTier;
  readonly queryTime: number;
}

/**
 * Memory access event for audit logging
 */
export interface MemoryAccessEvent {
  readonly timestamp: Date;
  readonly tier: MemoryTier;
  readonly action: 'read' | 'write' | 'delete';
  readonly itemId: string;
  readonly agentId: string;
  readonly sessionId: string;
  readonly isSuccess: boolean;
  readonly errorMessage?: string;
}
