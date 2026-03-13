/**
 * ADR (Architecture Decision Record) workflow service
 * Creates, updates, lists, and retrieves ADRs via VaultService
 * @module services/adr-service
 */

import type {
  ArchitectureDecisionRecord,
  AdrStatus,
} from '../types/index.js';
import { VaultOperationError, wrapError } from '../errors/sync-errors.js';
import type { VaultService, SearchResult } from './vault-service.js';
import { format } from 'date-fns';
import matter from 'gray-matter';

/** Options for creating a new ADR */
export interface CreateAdrOptions {
  readonly title: string;
  readonly context: string;
  readonly decision: string;
  readonly consequences: string;
  readonly tags?: readonly string[];
}

/** Options for updating an existing ADR */
export interface UpdateAdrOptions {
  readonly status?: AdrStatus;
  readonly consequences?: string;
  readonly supersededBy?: string;
}

/** ADR folder path in vault */
const ADR_FOLDER = '1-Projects/decisions';

/** ADR filename prefix */
const ADR_PREFIX = 'adr-';

/**
 * Service for managing Architecture Decision Records in Obsidian
 */
export class AdrService {
  private readonly vault: VaultService;
  private readonly adrFolder: string;

  constructor(vault: VaultService, adrFolder = ADR_FOLDER) {
    this.vault = vault;
    this.adrFolder = adrFolder;
  }

  /**
   * Create a new ADR in the vault
   * @param options - ADR content
   * @returns The created ADR record
   */
  async create(options: CreateAdrOptions): Promise<ArchitectureDecisionRecord> {
    const id = await this.generateNextId();
    const date = format(new Date(), 'yyyy-MM-dd');
    const status: AdrStatus = 'proposed';

    const adr: ArchitectureDecisionRecord = {
      id,
      title: options.title,
      status,
      context: options.context,
      decision: options.decision,
      consequences: options.consequences,
      date,
    };

    const content = this.renderAdrMarkdown(adr, options.tags);
    const path = this.buildPath(id, options.title);

    try {
      await this.vault.createNote(path, content);
    } catch (error: unknown) {
      throw wrapError(error, `Failed to create ADR ${id}`);
    }

    return adr;
  }

  /**
   * Update an existing ADR's status or content
   * @param id - ADR identifier (e.g., "ADR-001")
   * @param updates - Fields to update
   * @returns Updated ADR record
   */
  async update(
    id: string,
    updates: UpdateAdrOptions
  ): Promise<ArchitectureDecisionRecord> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new VaultOperationError(
        `ADR ${id} not found`,
        'update',
        this.adrFolder
      );
    }

    const updated: ArchitectureDecisionRecord = {
      ...existing,
      status: updates.status ?? existing.status,
      consequences: updates.consequences ?? existing.consequences,
    };

    const content = this.renderAdrMarkdown(updated);
    const results = await this.searchById(id);
    if (results.length === 0) {
      throw new VaultOperationError(
        `Cannot locate ADR ${id} file`,
        'update',
        this.adrFolder
      );
    }

    try {
      await this.vault.updateNote(results[0].path, content);
    } catch (error: unknown) {
      throw wrapError(error, `Failed to update ADR ${id}`);
    }

    return updated;
  }

  /**
   * Retrieve an ADR by its identifier
   * @param id - ADR identifier (e.g., "ADR-001")
   * @returns The ADR record or null if not found
   */
  async getById(id: string): Promise<ArchitectureDecisionRecord | null> {
    const results = await this.searchById(id);
    if (results.length === 0) {
      return null;
    }

    return this.parseAdrContent(results[0].content, id);
  }

  /**
   * List all ADRs, optionally filtered by status
   * @param status - Filter by ADR status
   * @returns Array of ADR records
   */
  async list(status?: AdrStatus): Promise<readonly ArchitectureDecisionRecord[]> {
    try {
      const results = await this.vault.searchSimple(ADR_PREFIX, {
        folder: this.adrFolder,
      });
      const adrs = results
        .map((r: SearchResult) => this.parseAdrContent(r.content, ''))
        .filter((adr): adr is ArchitectureDecisionRecord => adr !== null);

      if (status) {
        return adrs.filter((adr) => adr.status === status);
      }
      return adrs;
    } catch (error: unknown) {
      throw wrapError(error, 'Failed to list ADRs');
    }
  }

  /** Search vault for ADR by ID prefix */
  private async searchById(id: string): Promise<readonly SearchResult[]> {
    try {
      return await this.vault.searchSimple(id.toLowerCase(), {
        folder: this.adrFolder,
      });
    } catch (error: unknown) {
      throw wrapError(error, `Failed to search for ADR ${id}`);
    }
  }

  /** Generate the next sequential ADR ID */
  private async generateNextId(): Promise<string> {
    const existing = await this.list();
    const maxNum = existing.reduce((max, adr) => {
      const num = parseInt(adr.id.replace('ADR-', ''), 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    return `ADR-${String(maxNum + 1).padStart(3, '0')}`;
  }

  /** Build vault path for an ADR */
  private buildPath(id: string, title: string): string {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return `${this.adrFolder}/${ADR_PREFIX}${id.toLowerCase()}-${slug}.md`;
  }

  /** Render ADR to Markdown with frontmatter */
  private renderAdrMarkdown(
    adr: ArchitectureDecisionRecord,
    tags?: readonly string[]
  ): string {
    const frontmatter = [
      '---',
      `title: "${adr.title}"`,
      `id: "${adr.id}"`,
      `status: "${adr.status}"`,
      `date: "${adr.date}"`,
      `tags: [adr${tags ? ', ' + tags.join(', ') : ''}]`,
      '---',
    ].join('\n');

    const body = [
      `# ${adr.id}: ${adr.title}`,
      '',
      `**Status**: ${adr.status}`,
      `**Date**: ${adr.date}`,
      '',
      '## Context',
      adr.context,
      '',
      '## Decision',
      adr.decision,
      '',
      '## Consequences',
      adr.consequences,
    ].join('\n');

    return `${frontmatter}\n\n${body}\n`;
  }

  /** Parse ADR content from Markdown */
  private parseAdrContent(
    content: string,
    fallbackId: string
  ): ArchitectureDecisionRecord | null {
    try {
      const parsed = matter(content);
      const data = parsed.data as Record<string, unknown>;

      return {
        id: String(data['id'] ?? fallbackId),
        title: String(data['title'] ?? ''),
        status: (data['status'] as AdrStatus) ?? 'proposed',
        context: this.extractSection(parsed.content, 'Context'),
        decision: this.extractSection(parsed.content, 'Decision'),
        consequences: this.extractSection(parsed.content, 'Consequences'),
        date: String(data['date'] ?? ''),
      };
    } catch {
      return null;
    }
  }

  /** Extract a markdown section by heading */
  private extractSection(content: string, heading: string): string {
    const regex = new RegExp(
      `## ${heading}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`,
      'm'
    );
    const match = regex.exec(content);
    return match ? match[1].trim() : '';
  }
}
