/**
 * Dual-naming system for memory tiers.
 *
 * The codebase uses L0-L4 numbering. The enterprise architecture paper
 * uses L1-L4. This module provides a mapping between the two systems
 * so documentation and code can reference either convention.
 */

import { MemoryTier } from './types.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Tier names from the enterprise architecture paper (L1-L4)
 */
export type PaperTierName = 'Context' | 'Task' | 'Project' | 'System';

/**
 * Tier names from the current codebase (L0-L4)
 */
export type CurrentTierName =
  | 'Constitutional'
  | 'Context'
  | 'Explicit'
  | 'Controlled'
  | 'System';

/**
 * Mapping entry between the two naming systems
 */
export interface TierAliasMapping {
  readonly tier: MemoryTier;
  readonly currentName: CurrentTierName;
  readonly paperName: PaperTierName | null;
  readonly codebaseLevel: `L${number}`;
  readonly paperLevel: `L${number}` | null;
}

// ---------------------------------------------------------------------------
// Constant
// ---------------------------------------------------------------------------

/**
 * Complete mapping of every tier to both naming systems.
 *
 * L0 (Constitutional) has no paper equivalent — it is unique
 * to the codebase implementation.
 */
export const TIER_ALIAS_MAP: readonly TierAliasMapping[] = [
  {
    tier: MemoryTier.CONSTITUTIONAL,
    currentName: 'Constitutional',
    paperName: null,
    codebaseLevel: 'L0',
    paperLevel: null,
  },
  {
    tier: MemoryTier.CONTEXT,
    currentName: 'Context',
    paperName: 'Context',
    codebaseLevel: 'L1',
    paperLevel: 'L1',
  },
  {
    tier: MemoryTier.EXPLICIT,
    currentName: 'Explicit',
    paperName: 'Task',
    codebaseLevel: 'L2',
    paperLevel: 'L2',
  },
  {
    tier: MemoryTier.CONTROLLED,
    currentName: 'Controlled',
    paperName: 'Project',
    codebaseLevel: 'L3',
    paperLevel: 'L3',
  },
  {
    tier: MemoryTier.SYSTEM,
    currentName: 'System',
    paperName: 'System',
    codebaseLevel: 'L4',
    paperLevel: 'L4',
  },
] as const;

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Resolves a tier from either naming system.
 *
 * Accepts codebase names (e.g. "Explicit"), paper names (e.g. "Task"),
 * or level codes (e.g. "L2"). Returns the matching `MemoryTier` enum
 * value, or `undefined` if no match is found.
 *
 * @param alias - A name or level code from either naming system
 * @returns The resolved MemoryTier or undefined
 */
export function resolveTierFromAlias(alias: string): MemoryTier | undefined {
  for (const mapping of TIER_ALIAS_MAP) {
    if (
      mapping.currentName === alias ||
      mapping.paperName === alias ||
      mapping.codebaseLevel === alias ||
      mapping.paperLevel === alias
    ) {
      return mapping.tier;
    }
  }
  return undefined;
}

/**
 * Gets the paper name for a given tier.
 *
 * @param tier - The MemoryTier enum value
 * @returns The paper name or null for tiers not in the paper
 */
export function getPaperName(tier: MemoryTier): PaperTierName | null {
  const mapping = TIER_ALIAS_MAP.find((m) => m.tier === tier);
  return mapping?.paperName ?? null;
}

/**
 * Gets the current codebase name for a given tier.
 *
 * @param tier - The MemoryTier enum value
 * @returns The current codebase name or undefined
 */
export function getCurrentName(tier: MemoryTier): CurrentTierName | undefined {
  const mapping = TIER_ALIAS_MAP.find((m) => m.tier === tier);
  return mapping?.currentName;
}
