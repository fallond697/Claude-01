/**
 * Neo4j graph schema types for the enterprise memory architecture.
 *
 * Defines node and relationship interfaces used to model
 * artifacts, agent executions, promotions, projects, areas,
 * and requirements in the Neo4j knowledge graph.
 */

import { MemoryTier } from './types.js';

// ---------------------------------------------------------------------------
// Node interfaces
// ---------------------------------------------------------------------------

/**
 * An artifact stored in the knowledge graph
 */
export interface ArtifactNode {
  readonly nodeType: 'Artifact';
  readonly id: string;
  readonly tier: MemoryTier;
  readonly project: string;
  readonly operatingTier: string | null;
  readonly contentHash: string;
  readonly content: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly tags: readonly string[];
}

/**
 * A record of an agent execution that produced or modified artifacts
 */
export interface AgentExecutionNode {
  readonly nodeType: 'AgentExecution';
  readonly id: string;
  readonly agentName: string;
  readonly sessionId: string;
  readonly startedAt: string;
  readonly completedAt: string | null;
  readonly status: 'running' | 'completed' | 'failed';
  readonly toolsUsed: readonly string[];
}

/**
 * A promotion event moving an artifact between tiers
 */
export interface PromotionNode {
  readonly nodeType: 'Promotion';
  readonly id: string;
  readonly fromTier: MemoryTier;
  readonly toTier: MemoryTier;
  readonly promotedAt: string;
  readonly promotedBy: string;
  readonly validationPassed: boolean;
  readonly rationale: string;
}

/**
 * A project in the knowledge graph
 */
export interface ProjectNode {
  readonly nodeType: 'Project';
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly operatingTier: string;
  readonly createdAt: string;
}

/**
 * An area (PARA methodology) in the knowledge graph
 */
export interface AreaNode {
  readonly nodeType: 'Area';
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly owner: string;
}

/**
 * A requirement linked to artifacts and projects
 */
export interface RequirementNode {
  readonly nodeType: 'Requirement';
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly priority: 'critical' | 'high' | 'medium' | 'low';
  readonly status: 'open' | 'in-progress' | 'resolved' | 'closed';
  readonly embedding: readonly number[] | null;
}

/**
 * Discriminated union of all Neo4j node types
 */
export type Neo4jNode =
  | ArtifactNode
  | AgentExecutionNode
  | PromotionNode
  | ProjectNode
  | AreaNode
  | RequirementNode;

/**
 * String literal union of node type discriminants
 */
export type Neo4jNodeType = Neo4jNode['nodeType'];

// ---------------------------------------------------------------------------
// Relationship interfaces
// ---------------------------------------------------------------------------

/**
 * Base properties shared by all relationships
 */
interface RelationshipBase {
  readonly id: string;
  readonly createdAt: string;
}

/**
 * Artifact was derived from another artifact via an agent execution
 */
export interface DerivedFromRelationship extends RelationshipBase {
  readonly relType: 'DERIVED_FROM';
  readonly sourceId: string;
  readonly targetId: string;
  readonly rationale: string;
  readonly agent: string;
  readonly timestamp: string;
}

/**
 * Artifact was promoted between tiers via a promotion event
 */
export interface PromotedViaRelationship extends RelationshipBase {
  readonly relType: 'PROMOTED_VIA';
  readonly artifactId: string;
  readonly promotionId: string;
  readonly validationPassed: boolean;
}

/**
 * Artifact references another artifact or resource
 */
export interface ReferencesRelationship extends RelationshipBase {
  readonly relType: 'REFERENCES';
  readonly sourceId: string;
  readonly targetId: string;
  readonly referenceType: 'wikilink' | 'content-hash' | 'embedding';
}

/**
 * Artifact addresses a requirement
 */
export interface AddressesRelationship extends RelationshipBase {
  readonly relType: 'ADDRESSES';
  readonly artifactId: string;
  readonly requirementId: string;
  readonly coverage: 'full' | 'partial';
}

/**
 * Project supports an area
 */
export interface SupportsRelationship extends RelationshipBase {
  readonly relType: 'SUPPORTS';
  readonly projectId: string;
  readonly areaId: string;
}

/**
 * Artifact fulfills a project goal
 */
export interface FulfillsRelationship extends RelationshipBase {
  readonly relType: 'FULFILLS';
  readonly artifactId: string;
  readonly projectId: string;
  readonly scope: 'full' | 'partial';
}

/**
 * Discriminated union of all Neo4j relationship types
 */
export type Neo4jRelationship =
  | DerivedFromRelationship
  | PromotedViaRelationship
  | ReferencesRelationship
  | AddressesRelationship
  | SupportsRelationship
  | FulfillsRelationship;

/**
 * String literal union of relationship type discriminants
 */
export type Neo4jRelationshipType = Neo4jRelationship['relType'];
