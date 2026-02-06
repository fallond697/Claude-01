/**
 * Context vector types and visibility functions.
 *
 * Implements the four-dimensional context filtering system from the
 * enterprise memory architecture paper: role, project, operating tier,
 * and session.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Role of the agent within the current context
 */
export type ContextRole = 'developer' | 'reviewer' | 'architect' | 'admin';

/**
 * Operating tier for multi-environment visibility filtering
 */
export type OperatingTier = 'Sandbox' | 'Incubation' | 'Enterprise' | 'Commercial';

/**
 * Full context vector used for visibility filtering
 */
export interface ContextVector {
  readonly role: ContextRole;
  readonly project: string;
  readonly operatingTier: OperatingTier;
  readonly sessionId: string;
}

/**
 * Filter applied when querying artifacts
 */
export interface ContextFilter {
  readonly roles?: readonly ContextRole[];
  readonly projects?: readonly string[];
  readonly operatingTier?: OperatingTier;
  readonly sessionId?: string;
}

/**
 * Result of a visibility check
 */
export interface VisibilityResult {
  readonly isVisible: boolean;
  readonly reason: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Operating tier hierarchy from least to most privileged.
 * A higher-tier context can see lower-tier artifacts but not vice versa.
 */
export const OPERATING_TIER_HIERARCHY: readonly OperatingTier[] = [
  'Sandbox',
  'Incubation',
  'Enterprise',
  'Commercial',
] as const;

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Returns all operating tiers visible from the given tier (itself and below).
 *
 * @param tier - The observer's operating tier
 * @returns Array of visible tiers
 */
export function getVisibleTiers(tier: OperatingTier): readonly OperatingTier[] {
  const idx = OPERATING_TIER_HIERARCHY.indexOf(tier);
  if (idx === -1) {
    return [];
  }
  return OPERATING_TIER_HIERARCHY.slice(0, idx + 1);
}

/**
 * Checks whether an artifact is visible to a given context operating tier.
 *
 * Rules:
 * - If `artifactTier` is `null` the artifact is dimension-agnostic (L4 System)
 *   and is always visible.
 * - Otherwise the artifact is visible only if `contextTier` is at or above
 *   `artifactTier` in the hierarchy.
 *
 * @param contextTier - The observer's operating tier
 * @param artifactTier - The artifact's operating tier, or null if dimension-agnostic
 * @returns `true` if the artifact should be visible
 */
export function isArtifactVisible(
  contextTier: OperatingTier,
  artifactTier: OperatingTier | null,
): boolean {
  if (artifactTier === null) {
    return true;
  }
  const contextIdx = OPERATING_TIER_HIERARCHY.indexOf(contextTier);
  const artifactIdx = OPERATING_TIER_HIERARCHY.indexOf(artifactTier);
  return contextIdx >= artifactIdx;
}
