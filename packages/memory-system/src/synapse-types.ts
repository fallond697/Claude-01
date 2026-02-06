/**
 * Synapse pattern types for the enterprise memory architecture.
 *
 * Synapses are the five primary inter-artifact linking mechanisms
 * described in the architecture paper. Each pattern addresses a
 * different linking paradigm.
 */

// ---------------------------------------------------------------------------
// Synapse pattern interfaces
// ---------------------------------------------------------------------------

/**
 * Wikilink synapse - direct `[[target]]` style links between artifacts
 */
export interface WikilinkSynapse {
  readonly type: 'wikilink';
  readonly sourceArtifactId: string;
  readonly targetArtifactId: string;
  readonly linkText: string;
  readonly isResolved: boolean;
}

/**
 * Content-addressing synapse - links via content hash matching
 */
export interface ContentAddressingSynapse {
  readonly type: 'content-addressing';
  readonly sourceArtifactId: string;
  readonly contentHash: string;
  readonly algorithm: 'sha256' | 'sha512';
  readonly matchedArtifactIds: readonly string[];
}

/**
 * Provenance chain synapse - tracks derivation lineage across agents
 */
export interface ProvenanceChainSynapse {
  readonly type: 'provenance-chain';
  readonly artifactId: string;
  readonly parentArtifactId: string;
  readonly agentExecutionId: string;
  readonly rationale: string;
  readonly depth: number;
}

/**
 * Embedding synapse - vector-similarity links for semantic matching
 */
export interface EmbeddingSynapse {
  readonly type: 'embedding';
  readonly sourceArtifactId: string;
  readonly targetArtifactId: string;
  readonly similarityScore: number;
  readonly embeddingModel: string;
  readonly dimensions: number;
}

/**
 * Promotion breadcrumb synapse - tracks artifacts across tier promotions
 */
export interface PromotionBreadcrumbSynapse {
  readonly type: 'promotion-breadcrumb';
  readonly artifactId: string;
  readonly promotionId: string;
  readonly fromTier: number;
  readonly toTier: number;
  readonly promotedBy: string;
  readonly promotedAt: string;
}

// ---------------------------------------------------------------------------
// Discriminated union and type helpers
// ---------------------------------------------------------------------------

/**
 * Discriminated union of all synapse patterns
 */
export type Synapse =
  | WikilinkSynapse
  | ContentAddressingSynapse
  | ProvenanceChainSynapse
  | EmbeddingSynapse
  | PromotionBreadcrumbSynapse;

/**
 * String literal union of synapse type discriminants
 */
export type SynapseType = Synapse['type'];

/**
 * All synapse type values as a readonly array
 */
export const SYNAPSE_TYPES: readonly SynapseType[] = [
  'wikilink',
  'content-addressing',
  'provenance-chain',
  'embedding',
  'promotion-breadcrumb',
] as const;
