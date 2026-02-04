/**
 * ParaManager - PARA folder structure management
 * @module services/para-manager
 */

import {
  type ParaCategory,
  type CreateNoteOptions,
  type QuickCaptureOptions,
  type ParaNoteFrontmatter,
  PARA_FOLDERS,
} from '../types/index.js';
import { ParaStructureError, wrapError } from '../errors/sync-errors.js';
import { VaultService } from './vault-service.js';
import slugifyLib from 'slugify';
const slugify = slugifyLib.default ?? slugifyLib;
import { format } from 'date-fns';
import matter from 'gray-matter';

/** PARA folder structure definition */
interface ParaFolder {
  readonly category: ParaCategory;
  readonly path: string;
  readonly subfolders: readonly string[];
}

/** Standard PARA structure */
const PARA_STRUCTURE: readonly ParaFolder[] = [
  {
    category: 'inbox',
    path: PARA_FOLDERS.inbox,
    subfolders: ['quick-captures'],
  },
  {
    category: 'projects',
    path: PARA_FOLDERS.projects,
    subfolders: [], // Project subfolders created dynamically
  },
  {
    category: 'areas',
    path: PARA_FOLDERS.areas,
    subfolders: ['claude-code', 'typescript', 'devops'],
  },
  {
    category: 'resources',
    path: PARA_FOLDERS.resources,
    subfolders: ['libraries', 'patterns', 'snippets'],
  },
  {
    category: 'archives',
    path: PARA_FOLDERS.archives,
    subfolders: ['completed-projects'],
  },
];

/** Project subfolder structure */
const PROJECT_SUBFOLDERS = ['sessions', 'decisions', 'specs'] as const;

/**
 * Manages PARA folder structure and note organization
 */
export class ParaManager {
  private readonly vaultService: VaultService;
  private readonly projectName: string;

  constructor(vaultService: VaultService, projectName: string) {
    this.vaultService = vaultService;
    this.projectName = projectName;
  }

  /**
   * Initializes PARA folder structure in the vault
   */
  async initializeStructure(): Promise<void> {
    for (const folder of PARA_STRUCTURE) {
      await this.ensureFolderExists(folder.path);

      for (const subfolder of folder.subfolders) {
        await this.ensureFolderExists(`${folder.path}/${subfolder}`);
      }
    }

    // Create project-specific folders
    await this.ensureProjectFolders(this.projectName);
  }

  /**
   * Ensures project folder structure exists
   */
  async ensureProjectFolders(projectName: string): Promise<void> {
    const projectPath = `${PARA_FOLDERS.projects}/${projectName}`;

    await this.ensureFolderExists(projectPath);

    for (const subfolder of PROJECT_SUBFOLDERS) {
      await this.ensureFolderExists(`${projectPath}/${subfolder}`);
    }
  }

  /**
   * Gets the path for a category
   */
  getCategoryPath(category: ParaCategory): string {
    const path = PARA_FOLDERS[category];

    if (!path) {
      throw new ParaStructureError(`Invalid category: ${category}`, category);
    }

    return path;
  }

  /**
   * Gets the full path for a project subfolder
   */
  getProjectPath(subfolder?: 'sessions' | 'decisions' | 'specs'): string {
    const basePath = `${PARA_FOLDERS.projects}/${this.projectName}`;

    if (subfolder) {
      return `${basePath}/${subfolder}`;
    }

    return basePath;
  }

  /**
   * Gets the path for today's daily note
   */
  getDailyNotePath(dateFormat = 'yyyy-MM-dd'): string {
    const today = format(new Date(), dateFormat);
    return `${PARA_FOLDERS.inbox}/${today}.md`;
  }

  /**
   * Generates a note path based on options
   */
  generateNotePath(title: string, options: CreateNoteOptions): string {
    const slug = this.slugifyTitle(title);
    const timestamp = format(new Date(), 'yyyyMMdd-HHmmss');
    const filename = `${timestamp}-${slug}.md`;

    let basePath = this.getCategoryPath(options.category);

    if (options.category === 'projects' && options.project) {
      basePath = `${basePath}/${options.project}`;
    }

    return `${basePath}/${filename}`;
  }

  /**
   * Creates a note with proper frontmatter
   */
  async createNote(
    title: string,
    content: string,
    options: CreateNoteOptions
  ): Promise<string> {
    const path = this.generateNotePath(title, options);
    const frontmatter = this.generateFrontmatter(title, options);
    const fullContent = this.formatNoteContent(frontmatter, content);

    await this.vaultService.createNote(path, fullContent);

    return path;
  }

  /**
   * Creates a quick capture note in Inbox
   */
  async quickCapture(
    content: string,
    options?: QuickCaptureOptions
  ): Promise<string> {
    const timestamp = format(new Date(), 'yyyyMMdd-HHmmss');
    const path = `${PARA_FOLDERS.inbox}/quick-captures/${timestamp}.md`;

    const frontmatter: ParaNoteFrontmatter = {
      title: `Quick Capture ${format(new Date(), 'yyyy-MM-dd HH:mm')}`,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      category: 'inbox',
      project: options?.project,
      tags: options?.tags ? [...options.tags] : ['quick-capture'],
    };

    const fullContent = this.formatNoteContent(frontmatter, content);
    await this.vaultService.createNote(path, fullContent);

    return path;
  }

  /**
   * Moves a note to a different category
   */
  async moveNote(
    sourcePath: string,
    targetCategory: ParaCategory,
    projectName?: string
  ): Promise<string> {
    const content = await this.vaultService.readNote(sourcePath);
    const { data: frontmatter, content: bodyContent } = matter(content);

    // Update frontmatter
    const updatedFrontmatter = {
      ...frontmatter,
      category: targetCategory,
      project: projectName,
      modified: new Date().toISOString(),
    };

    // Generate new path
    const filename = sourcePath.split('/').pop() ?? 'note.md';
    let targetPath = this.getCategoryPath(targetCategory);

    if (targetCategory === 'projects' && projectName) {
      targetPath = `${targetPath}/${projectName}`;
    }

    const newPath = `${targetPath}/${filename}`;

    // Create new note and delete old one
    const fullContent = this.formatNoteContent(
      updatedFrontmatter as ParaNoteFrontmatter,
      bodyContent
    );

    await this.vaultService.createNote(newPath, fullContent);
    await this.vaultService.deleteNote(sourcePath);

    return newPath;
  }

  /**
   * Lists notes in a category
   */
  async listNotes(
    category: ParaCategory,
    projectName?: string
  ): Promise<readonly string[]> {
    let path = this.getCategoryPath(category);

    if (category === 'projects' && projectName) {
      path = `${path}/${projectName}`;
    }

    try {
      const files = await this.vaultService.listFiles(path);
      return files
        .filter(f => !f.isFolder && f.path.endsWith('.md'))
        .map(f => f.path);
    } catch (error) {
      throw new ParaStructureError(
        wrapError(error, `Failed to list notes in ${category}`).message,
        category,
        path
      );
    }
  }

  /**
   * Gets all projects in the vault
   */
  async listProjects(): Promise<readonly string[]> {
    const files = await this.vaultService.listFiles(PARA_FOLDERS.projects);
    return files.filter(f => f.isFolder).map(f => f.name);
  }

  /**
   * Archives a completed project
   */
  async archiveProject(projectName: string): Promise<void> {
    const sourcePath = `${PARA_FOLDERS.projects}/${projectName}`;
    const targetPath = `${PARA_FOLDERS.archives}/completed-projects/${projectName}`;

    const files = await this.vaultService.listFiles(sourcePath);

    for (const file of files) {
      if (!file.isFolder) {
        const content = await this.vaultService.readNote(file.path);
        const relativePath = file.path.replace(sourcePath, '');
        await this.vaultService.createNote(
          `${targetPath}${relativePath}`,
          content
        );
        await this.vaultService.deleteNote(file.path);
      }
    }
  }

  /**
   * Generates frontmatter for a note
   */
  private generateFrontmatter(
    title: string,
    options: CreateNoteOptions
  ): ParaNoteFrontmatter {
    const now = new Date().toISOString();

    return {
      title,
      created: now,
      modified: now,
      category: options.category,
      project: options.project,
      tags: options.tags ? [...options.tags] : [],
    };
  }

  /**
   * Formats note content with frontmatter
   */
  private formatNoteContent(
    frontmatter: ParaNoteFrontmatter,
    content: string
  ): string {
    const yaml = matter.stringify('', frontmatter);
    return `${yaml.trim()}\n\n# ${frontmatter.title}\n\n${content}`;
  }

  /**
   * Slugifies a title for use in filenames
   */
  private slugifyTitle(title: string): string {
    return slugify(title, {
      lower: true,
      strict: true,
      replacement: '-',
    });
  }

  /**
   * Ensures a folder exists by creating a placeholder if needed
   */
  private async ensureFolderExists(path: string): Promise<void> {
    const placeholderPath = `${path}/.gitkeep`;

    try {
      const exists = await this.vaultService.noteExists(placeholderPath);

      if (!exists) {
        await this.vaultService.createNote(placeholderPath, '');
      }
    } catch {
      // Folder might already exist, ignore errors
    }
  }
}
