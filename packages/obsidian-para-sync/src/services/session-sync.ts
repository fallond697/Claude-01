/**
 * SessionSync - Session summary generation and sync
 * @module services/session-sync
 */

import { format, differenceInMinutes } from 'date-fns';
import type {
  SessionSummary,
  SyncConfig,
  ParaNoteFrontmatter,
} from '../types/index.js';
import { SessionSyncError, wrapError } from '../errors/sync-errors.js';
import { VaultService } from './vault-service.js';
import { ParaManager } from './para-manager.js';

/** Session entry for daily note */
interface DailyNoteSession {
  readonly time: string;
  readonly path: string;
  readonly title: string;
  readonly project: string;
}

/** Template variables for session summary */
interface SessionTemplateVars {
  readonly title: string;
  readonly created: string;
  readonly modified: string;
  readonly project: string;
  readonly sessionId: string;
  readonly tags: readonly string[];
  readonly startedAt: string;
  readonly endedAt: string;
  readonly duration: string;
  readonly tasksCompleted: readonly string[];
  readonly decisionsLogged: readonly string[];
  readonly questionsRaised: readonly string[];
  readonly relatedNotes: readonly string[];
  readonly context: string;
  readonly generatedAt: string;
}

/**
 * Service for syncing Claude Code sessions to Obsidian
 */
export class SessionSync {
  private readonly vaultService: VaultService;
  private readonly paraManager: ParaManager;
  private readonly config: SyncConfig;

  constructor(
    vaultService: VaultService,
    paraManager: ParaManager,
    config: SyncConfig
  ) {
    this.vaultService = vaultService;
    this.paraManager = paraManager;
    this.config = config;
  }

  /**
   * Creates a session summary note
   */
  async createSessionSummary(summary: SessionSummary): Promise<string> {
    const { sessionId } = summary;

    try {
      const templateVars = this.buildTemplateVars(summary);
      const content = this.renderSessionTemplate(templateVars);
      const path = this.generateSessionPath(summary);

      await this.vaultService.createNote(path, content);
      await this.updateDailyNote(summary, path);

      return path;
    } catch (error) {
      throw new SessionSyncError(
        wrapError(error, 'Failed to create session summary').message,
        sessionId,
        'save'
      );
    }
  }

  /**
   * Updates an existing session summary
   */
  async updateSessionSummary(
    path: string,
    summary: Partial<SessionSummary>
  ): Promise<void> {
    const sessionId = summary.sessionId ?? 'unknown';

    try {
      const existingContent = await this.vaultService.readNote(path);
      const updatedContent = this.mergeSessionContent(existingContent, summary);

      await this.vaultService.updateNote(path, updatedContent);
    } catch (error) {
      throw new SessionSyncError(
        wrapError(error, 'Failed to update session summary').message,
        sessionId,
        'save'
      );
    }
  }

  /**
   * Updates the daily note with session reference
   */
  async updateDailyNote(summary: SessionSummary, sessionPath: string): Promise<void> {
    const { sessionId } = summary;

    try {
      const dailyNotePath = this.paraManager.getDailyNotePath(
        this.config.dailyNoteFormat
      );

      const sessionEntry = this.formatSessionEntry(summary, sessionPath);

      const exists = await this.vaultService.noteExists(dailyNotePath);

      if (exists) {
        await this.appendToDailyNote(dailyNotePath, sessionEntry);
      } else {
        await this.createDailyNote(dailyNotePath, sessionEntry);
      }
    } catch (error) {
      throw new SessionSyncError(
        wrapError(error, 'Failed to update daily note').message,
        sessionId,
        'daily-note'
      );
    }
  }

  /**
   * Generates a session summary from conversation context
   */
  generateSummaryFromContext(
    sessionId: string,
    context: SessionContext
  ): SessionSummary {
    const now = new Date().toISOString();

    return {
      sessionId,
      project: this.config.projectName,
      startedAt: context.startedAt ?? now,
      endedAt: now,
      tasksCompleted: context.tasksCompleted ?? [],
      decisionsLogged: context.decisionsLogged ?? [],
      questionsRaised: context.questionsRaised ?? [],
      relatedNotes: context.relatedNotes ?? [],
    };
  }

  /**
   * Lists all session summaries for a project
   */
  async listSessionSummaries(): Promise<readonly string[]> {
    const sessionsPath = this.paraManager.getProjectPath('sessions');
    const files = await this.vaultService.listFiles(sessionsPath);

    return files
      .filter(f => !f.isFolder && f.path.endsWith('.md'))
      .map(f => f.path)
      .sort()
      .reverse();
  }

  /**
   * Gets the most recent session summary
   */
  async getLatestSession(): Promise<string | undefined> {
    const sessions = await this.listSessionSummaries();
    return sessions[0];
  }

  /**
   * Builds template variables from session summary
   */
  private buildTemplateVars(summary: SessionSummary): SessionTemplateVars {
    const now = new Date().toISOString();
    const startDate = new Date(summary.startedAt);
    const endDate = new Date(summary.endedAt);
    const durationMins = differenceInMinutes(endDate, startDate);

    return {
      title: `Session ${format(startDate, 'yyyy-MM-dd HH:mm')}`,
      created: now,
      modified: now,
      project: summary.project,
      sessionId: summary.sessionId,
      tags: ['session', summary.project],
      startedAt: format(startDate, 'yyyy-MM-dd HH:mm'),
      endedAt: format(endDate, 'yyyy-MM-dd HH:mm'),
      duration: this.formatDuration(durationMins),
      tasksCompleted: summary.tasksCompleted,
      decisionsLogged: summary.decisionsLogged,
      questionsRaised: summary.questionsRaised,
      relatedNotes: summary.relatedNotes,
      context: '',
      generatedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    };
  }

  /**
   * Renders the session summary template
   */
  private renderSessionTemplate(vars: SessionTemplateVars): string {
    const frontmatter = this.buildFrontmatter(vars);
    const body = this.buildSessionBody(vars);

    return `${frontmatter}\n\n${body}`;
  }

  /**
   * Builds YAML frontmatter
   */
  private buildFrontmatter(vars: SessionTemplateVars): string {
    const fm: ParaNoteFrontmatter = {
      title: vars.title,
      created: vars.created,
      modified: vars.modified,
      category: 'projects',
      project: vars.project,
      tags: [...vars.tags],
      sessionId: vars.sessionId,
    };

    const lines = [
      '---',
      `title: "${fm.title}"`,
      `created: "${fm.created}"`,
      `modified: "${fm.modified}"`,
      `category: ${fm.category}`,
      `project: "${fm.project}"`,
      `sessionId: "${fm.sessionId}"`,
      'tags:',
      ...fm.tags.map(t => `  - ${t}`),
      '---',
    ];

    return lines.join('\n');
  }

  /**
   * Builds the session body content
   */
  private buildSessionBody(vars: SessionTemplateVars): string {
    const sections: string[] = [];

    sections.push(`# ${vars.title}`);
    sections.push('');
    sections.push('## Session Overview');
    sections.push('');
    sections.push('| Property | Value |');
    sections.push('|----------|-------|');
    sections.push(`| **Session ID** | \`${vars.sessionId}\` |`);
    sections.push(`| **Project** | [[${vars.project}]] |`);
    sections.push(`| **Started** | ${vars.startedAt} |`);
    sections.push(`| **Ended** | ${vars.endedAt} |`);
    sections.push(`| **Duration** | ${vars.duration} |`);
    sections.push('');

    sections.push('## Tasks Completed');
    sections.push('');
    if (vars.tasksCompleted.length > 0) {
      vars.tasksCompleted.forEach(task => {
        sections.push(`- [x] ${task}`);
      });
    } else {
      sections.push('_No tasks completed in this session._');
    }
    sections.push('');

    sections.push('## Decisions Made');
    sections.push('');
    if (vars.decisionsLogged.length > 0) {
      vars.decisionsLogged.forEach((decision, i) => {
        sections.push(`### Decision ${i + 1}`);
        sections.push(`> ${decision}`);
        sections.push('');
      });
    } else {
      sections.push('_No decisions logged in this session._');
    }
    sections.push('');

    sections.push('## Questions Raised');
    sections.push('');
    if (vars.questionsRaised.length > 0) {
      vars.questionsRaised.forEach(q => {
        sections.push(`- [ ] ${q}`);
      });
    } else {
      sections.push('_No open questions from this session._');
    }
    sections.push('');

    sections.push('## Related Notes');
    sections.push('');
    if (vars.relatedNotes.length > 0) {
      vars.relatedNotes.forEach(note => {
        sections.push(`- [[${note}]]`);
      });
    } else {
      sections.push('_No related notes linked._');
    }
    sections.push('');

    sections.push('---');
    sections.push(`_Generated by Claude Code on ${vars.generatedAt}_`);

    return sections.join('\n');
  }

  /**
   * Generates the path for a session summary
   */
  private generateSessionPath(summary: SessionSummary): string {
    const date = format(new Date(summary.startedAt), 'yyyyMMdd-HHmmss');
    const sessionsPath = this.paraManager.getProjectPath('sessions');
    return `${sessionsPath}/${date}-session.md`;
  }

  /**
   * Formats duration in human-readable form
   */
  private formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (mins === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }

    return `${hours}h ${mins}m`;
  }

  /**
   * Formats a session entry for daily note
   */
  private formatSessionEntry(
    summary: SessionSummary,
    sessionPath: string
  ): string {
    const time = format(new Date(summary.startedAt), 'HH:mm');
    const title = `Session ${format(new Date(summary.startedAt), 'HH:mm')}`;
    const filename = sessionPath.split('/').pop()?.replace('.md', '') ?? 'session';

    return `- ${time} - [[${filename}|${title}]] (${summary.project})`;
  }

  /**
   * Appends session entry to existing daily note
   */
  private async appendToDailyNote(
    path: string,
    sessionEntry: string
  ): Promise<void> {
    const content = await this.vaultService.readNote(path);

    // Find "## Sessions Today" section and append
    const sessionsHeader = '## Sessions Today';
    const headerIndex = content.indexOf(sessionsHeader);

    if (headerIndex !== -1) {
      const afterHeader = content.indexOf('\n', headerIndex);
      const nextSection = content.indexOf('\n## ', afterHeader);

      const insertIndex = nextSection !== -1 ? nextSection : content.length;
      const beforeInsert = content.slice(0, insertIndex).trimEnd();
      const afterInsert = content.slice(insertIndex);

      const updated = `${beforeInsert}\n${sessionEntry}${afterInsert}`;
      await this.vaultService.updateNote(path, updated);
    } else {
      // No sessions section, append at end
      await this.vaultService.appendToNote(
        path,
        `\n${sessionsHeader}\n\n${sessionEntry}`
      );
    }
  }

  /**
   * Creates a new daily note with session entry
   */
  private async createDailyNote(
    path: string,
    sessionEntry: string
  ): Promise<void> {
    const date = format(new Date(), 'yyyy-MM-dd');
    const now = new Date().toISOString();

    const content = `---
title: "${date}"
created: "${now}"
modified: "${now}"
category: inbox
tags:
  - daily-note
---

# ${date}

## Sessions Today

${sessionEntry}

## Quick Captures

_No quick captures today._

## Notes



---

_Last updated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}_
`;

    await this.vaultService.createNote(path, content);
  }

  /**
   * Merges new content into existing session
   */
  private mergeSessionContent(
    existingContent: string,
    updates: Partial<SessionSummary>
  ): string {
    let content = existingContent;

    // Update modified date in frontmatter
    const modifiedRegex = /modified: "[^"]+"/;
    content = content.replace(
      modifiedRegex,
      `modified: "${new Date().toISOString()}"`
    );

    // Append new tasks if provided
    if (updates.tasksCompleted?.length) {
      const tasksSection = '## Tasks Completed';
      const tasksIndex = content.indexOf(tasksSection);

      if (tasksIndex !== -1) {
        const nextSection = content.indexOf('\n## ', tasksIndex + 1);
        const insertIndex = nextSection !== -1 ? nextSection : content.length;

        const newTasks = updates.tasksCompleted
          .map(t => `- [x] ${t}`)
          .join('\n');

        content =
          content.slice(0, insertIndex).trimEnd() +
          '\n' +
          newTasks +
          '\n' +
          content.slice(insertIndex);
      }
    }

    return content;
  }
}

/** Context extracted from conversation */
export interface SessionContext {
  readonly startedAt?: string;
  readonly tasksCompleted?: readonly string[];
  readonly decisionsLogged?: readonly string[];
  readonly questionsRaised?: readonly string[];
  readonly relatedNotes?: readonly string[];
}
