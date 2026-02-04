/**
 * ContextRetriever - Semantic search and context injection
 * @module services/context-retriever
 */

import matter from 'gray-matter';
import type {
  ContextMatch,
  RetrievedContext,
  ParaNoteFrontmatter,
  SearchOptions,
  ParaCategory,
} from '../types/index.js';
import { SearchError, wrapError } from '../errors/sync-errors.js';
import { VaultService, type SearchResult } from './vault-service.js';
import { PARA_FOLDERS } from '../types/index.js';

/** Default search result limit */
const DEFAULT_LIMIT = 5;

/** Minimum relevance score threshold */
const MIN_RELEVANCE_SCORE = 0.3;

/** Context retrieval options */
export interface ContextRetrievalOptions extends SearchOptions {
  readonly categories?: readonly ParaCategory[];
  readonly excludePaths?: readonly string[];
  readonly minScore?: number;
}

/**
 * Service for retrieving relevant context from the vault
 */
export class ContextRetriever {
  private readonly vaultService: VaultService;
  private readonly projectName: string;

  constructor(vaultService: VaultService, projectName: string) {
    this.vaultService = vaultService;
    this.projectName = projectName;
  }

  /**
   * Retrieves context relevant to a query
   */
  async retrieveContext(
    query: string,
    options?: ContextRetrievalOptions
  ): Promise<RetrievedContext> {
    const startTime = Date.now();

    try {
      const searchOptions: SearchOptions = {
        semantic: options?.semantic ?? true,
        limit: options?.limit ?? DEFAULT_LIMIT * 2, // Fetch more to filter
        folder: this.buildSearchFolder(options),
      };

      // Prefer semantic search if available
      const results = searchOptions.semantic
        ? await this.vaultService.searchSemantic(query, searchOptions)
        : await this.vaultService.searchSimple(query, searchOptions);

      const matches = await this.processResults(results, options);
      const searchTimeMs = Date.now() - startTime;

      return {
        query,
        results: matches.slice(0, options?.limit ?? DEFAULT_LIMIT),
        searchTimeMs,
      };
    } catch (error) {
      if (error instanceof SearchError) {
        throw error;
      }

      throw new SearchError(
        wrapError(error, 'Context retrieval failed').message,
        query,
        options?.semantic ? 'semantic' : 'simple'
      );
    }
  }

  /**
   * Retrieves context for the current project
   */
  async retrieveProjectContext(
    query: string,
    options?: Omit<ContextRetrievalOptions, 'folder'>
  ): Promise<RetrievedContext> {
    return this.retrieveContext(query, {
      ...options,
      folder: `${PARA_FOLDERS.projects}/${this.projectName}`,
    });
  }

  /**
   * Retrieves context from specific categories
   */
  async retrieveFromCategories(
    query: string,
    categories: readonly ParaCategory[],
    options?: Omit<ContextRetrievalOptions, 'categories'>
  ): Promise<RetrievedContext> {
    const allMatches: ContextMatch[] = [];
    const startTime = Date.now();

    for (const category of categories) {
      const categoryOptions: ContextRetrievalOptions = {
        ...options,
        folder: PARA_FOLDERS[category],
        limit: Math.ceil((options?.limit ?? DEFAULT_LIMIT) / categories.length),
      };

      const result = await this.retrieveContext(query, categoryOptions);
      allMatches.push(...result.results);
    }

    // Sort by relevance and deduplicate
    const uniqueMatches = this.deduplicateMatches(allMatches);
    const sortedMatches = uniqueMatches
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, options?.limit ?? DEFAULT_LIMIT);

    return {
      query,
      results: sortedMatches,
      searchTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Retrieves related notes based on tags
   */
  async findRelatedByTags(
    tags: readonly string[],
    options?: ContextRetrievalOptions
  ): Promise<RetrievedContext> {
    const tagQuery = tags.map(t => `tag:${t}`).join(' OR ');
    return this.retrieveContext(tagQuery, {
      ...options,
      semantic: false, // Use simple search for tag matching
    });
  }

  /**
   * Retrieves recent session context
   */
  async getRecentSessionContext(
    limit = 3
  ): Promise<readonly ContextMatch[]> {
    const sessionsPath = `${PARA_FOLDERS.projects}/${this.projectName}/sessions`;

    try {
      const files = await this.vaultService.listFiles(sessionsPath);
      const recentFiles = files
        .filter(f => !f.isFolder && f.path.endsWith('.md'))
        .sort((a, b) => (b.modifiedAt ?? '').localeCompare(a.modifiedAt ?? ''))
        .slice(0, limit);

      const matches: ContextMatch[] = [];

      for (const file of recentFiles) {
        const content = await this.vaultService.readNote(file.path);
        const match = this.parseNoteToMatch(file.path, content, 1.0);

        if (match) {
          matches.push(match);
        }
      }

      return matches;
    } catch {
      return [];
    }
  }

  /**
   * Formats context for injection into conversation
   */
  formatContextForInjection(context: RetrievedContext): string {
    if (context.results.length === 0) {
      return '';
    }

    const lines: string[] = [
      '## Relevant Context from Obsidian Vault',
      '',
      `_Query: "${context.query}" (${context.searchTimeMs}ms)_`,
      '',
    ];

    for (const match of context.results) {
      lines.push(`### [[${match.path}|${match.title}]]`);

      if (match.frontmatter?.tags && match.frontmatter.tags.length > 0) {
        lines.push(`Tags: ${match.frontmatter.tags.join(', ')}`);
      }

      lines.push('');
      lines.push(`> ${match.excerpt}`);
      lines.push('');
      lines.push(`_Relevance: ${Math.round(match.relevanceScore * 100)}%_`);
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Processes raw search results into context matches
   */
  private async processResults(
    results: readonly SearchResult[],
    options?: ContextRetrievalOptions
  ): Promise<readonly ContextMatch[]> {
    const matches: ContextMatch[] = [];
    const minScore = options?.minScore ?? MIN_RELEVANCE_SCORE;
    const excludePaths = new Set(options?.excludePaths ?? []);

    for (const result of results) {
      // Skip excluded paths
      if (excludePaths.has(result.path)) {
        continue;
      }

      // Calculate relevance score
      const score = result.score ?? this.calculateRelevance(result.content);

      if (score < minScore) {
        continue;
      }

      // Try to get full note for frontmatter
      let frontmatter: ParaNoteFrontmatter | undefined;
      let title = this.extractTitle(result.path, result.content);

      try {
        const fullContent = await this.vaultService.readNote(result.path);
        const parsed = matter(fullContent);

        if (this.isValidFrontmatter(parsed.data)) {
          frontmatter = parsed.data as ParaNoteFrontmatter;
          title = frontmatter.title;
        }
      } catch {
        // Use extracted title if can't read full note
      }

      matches.push({
        path: result.path,
        title,
        excerpt: this.truncateExcerpt(result.content),
        relevanceScore: score,
        frontmatter,
      });
    }

    return matches;
  }

  /**
   * Parses a note into a context match
   */
  private parseNoteToMatch(
    path: string,
    content: string,
    score: number
  ): ContextMatch | undefined {
    try {
      const { data, content: bodyContent } = matter(content);
      const frontmatter = this.isValidFrontmatter(data)
        ? (data as ParaNoteFrontmatter)
        : undefined;

      return {
        path,
        title: frontmatter?.title ?? this.extractTitle(path, content),
        excerpt: this.truncateExcerpt(bodyContent),
        relevanceScore: score,
        frontmatter,
      };
    } catch {
      return undefined;
    }
  }

  /**
   * Builds the search folder path from options
   */
  private buildSearchFolder(options?: ContextRetrievalOptions): string | undefined {
    if (options?.folder) {
      return options.folder;
    }

    if (options?.categories && options.categories.length === 1) {
      return PARA_FOLDERS[options.categories[0]];
    }

    return undefined;
  }

  /**
   * Calculates a basic relevance score
   */
  private calculateRelevance(content: string): number {
    // Basic heuristic: longer content with more structure = more relevant
    const length = content.length;
    const hasHeadings = /^#+\s/m.test(content);
    const hasLists = /^[-*]\s/m.test(content);
    const hasCode = /```/.test(content);

    let score = Math.min(length / 1000, 0.5);

    if (hasHeadings) score += 0.15;
    if (hasLists) score += 0.15;
    if (hasCode) score += 0.2;

    return Math.min(score, 1.0);
  }

  /**
   * Extracts title from path or content
   */
  private extractTitle(path: string, content: string): string {
    // Try to extract from first heading
    const headingMatch = content.match(/^#\s+(.+)$/m);

    if (headingMatch) {
      return headingMatch[1];
    }

    // Fall back to filename
    const filename = path.split('/').pop() ?? 'Untitled';
    return filename.replace(/\.md$/, '').replace(/[-_]/g, ' ');
  }

  /**
   * Truncates excerpt to reasonable length
   */
  private truncateExcerpt(content: string, maxLength = 300): string {
    // Remove frontmatter if present
    const withoutFrontmatter = content.replace(/^---[\s\S]*?---\n*/, '');

    // Remove headings for cleaner excerpt
    const withoutHeadings = withoutFrontmatter.replace(/^#+\s+.+$/gm, '');

    // Clean up whitespace
    const cleaned = withoutHeadings.trim().replace(/\n+/g, ' ');

    if (cleaned.length <= maxLength) {
      return cleaned;
    }

    // Truncate at word boundary
    const truncated = cleaned.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');

    return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + '...';
  }

  /**
   * Deduplicates matches by path
   */
  private deduplicateMatches(matches: readonly ContextMatch[]): ContextMatch[] {
    const seen = new Set<string>();
    const unique: ContextMatch[] = [];

    for (const match of matches) {
      if (!seen.has(match.path)) {
        seen.add(match.path);
        unique.push(match);
      }
    }

    return unique;
  }

  /**
   * Validates frontmatter structure
   */
  private isValidFrontmatter(data: unknown): boolean {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    const obj = data as Record<string, unknown>;
    return typeof obj.title === 'string' && typeof obj.category === 'string';
  }
}
