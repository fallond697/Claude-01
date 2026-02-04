/**
 * Type definitions for Obsidian PARA Sync
 * @module types
 */

import { z } from 'zod';

/** PARA folder categories */
export type ParaCategory = 'inbox' | 'projects' | 'areas' | 'resources' | 'archives';

/** PARA folder paths */
export const PARA_FOLDERS: Record<ParaCategory, string> = {
  inbox: '0-Inbox',
  projects: '1-Projects',
  areas: '2-Areas',
  resources: '3-Resources',
  archives: '4-Archives',
} as const;

/** Frontmatter schema for validation */
export const ParaNoteFrontmatterSchema = z.object({
  title: z.string(),
  created: z.string(),
  modified: z.string(),
  category: z.enum(['inbox', 'projects', 'areas', 'resources', 'archives']),
  project: z.string().optional(),
  tags: z.array(z.string()),
  sessionId: z.string().optional(),
});

/** Frontmatter for all PARA notes */
export type ParaNoteFrontmatter = z.infer<typeof ParaNoteFrontmatterSchema>;

/** Session summary structure */
export interface SessionSummary {
  readonly sessionId: string;
  readonly project: string;
  readonly startedAt: string;
  readonly endedAt: string;
  readonly tasksCompleted: readonly string[];
  readonly decisionsLogged: readonly string[];
  readonly questionsRaised: readonly string[];
  readonly relatedNotes: readonly string[];
}

/** ADR status */
export type AdrStatus = 'proposed' | 'accepted' | 'deprecated' | 'superseded';

/** Architecture Decision Record structure */
export interface ArchitectureDecisionRecord {
  readonly id: string;
  readonly title: string;
  readonly status: AdrStatus;
  readonly context: string;
  readonly decision: string;
  readonly consequences: string;
  readonly date: string;
}

/** Context match from search */
export interface ContextMatch {
  readonly path: string;
  readonly title: string;
  readonly excerpt: string;
  readonly relevanceScore: number;
  readonly frontmatter?: ParaNoteFrontmatter;
}

/** Context retrieval result */
export interface RetrievedContext {
  readonly query: string;
  readonly results: readonly ContextMatch[];
  readonly searchTimeMs: number;
}

/** MCP Tool call options */
export interface McpCallOptions {
  readonly timeout?: number;
  readonly retries?: number;
}

/** Vault file metadata */
export interface VaultFile {
  readonly path: string;
  readonly name: string;
  readonly isFolder: boolean;
  readonly createdAt?: string;
  readonly modifiedAt?: string;
}

/** Search options */
export interface SearchOptions {
  readonly semantic?: boolean;
  readonly limit?: number;
  readonly folder?: string;
}

/** Note creation options */
export interface CreateNoteOptions {
  readonly category: ParaCategory;
  readonly project?: string;
  readonly tags?: readonly string[];
  readonly template?: string;
}

/** Quick capture options */
export interface QuickCaptureOptions {
  readonly tags?: readonly string[];
  readonly project?: string;
}

/** Session sync configuration */
export interface SyncConfig {
  readonly vaultPath: string;
  readonly projectName: string;
  readonly dailyNoteFormat?: string;
  readonly autoSync?: boolean;
}

/** Environment configuration */
export interface EnvConfig {
  readonly obsidianApiKey: string;
  readonly vaultPath: string;
  readonly projectName?: string;
}
