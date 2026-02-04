import { MemoryTier, MemoryTierConfig } from './types.js';

/**
 * Default configuration for each memory tier
 */
export const MEMORY_TIER_CONFIGS: Record<MemoryTier, MemoryTierConfig> = {
  [MemoryTier.CONSTITUTIONAL]: {
    tier: MemoryTier.CONSTITUTIONAL,
    name: 'Constitutional',
    description: 'Non-negotiable rules and constraints for agent behavior',
    persistence: 'permanent',
    writability: 'human-only',
    scope: 'all-sessions',
    location: '.specify/memory/constitution.md',
    mcpServers: [],
    commands: ['/speckit.constitution'],
  },
  [MemoryTier.CONTEXT]: {
    tier: MemoryTier.CONTEXT,
    name: 'Context',
    description: 'Session-local working memory for current task',
    persistence: 'session',
    writability: 'read-write',
    scope: 'current-session',
    location: 'session-local',
    mcpServers: [],
    commands: [],
  },
  [MemoryTier.EXPLICIT]: {
    tier: MemoryTier.EXPLICIT,
    name: 'Explicit',
    description: 'Persistent project knowledge and personal resources',
    persistence: 'persistent',
    writability: 'read-write',
    scope: 'project',
    location: '.specify/memory/explicit/',
    mcpServers: ['obsidian', 'filesystem'],
    commands: ['/capture', '/promote', '/search'],
  },
  [MemoryTier.CONTROLLED]: {
    tier: MemoryTier.CONTROLLED,
    name: 'Controlled',
    description: 'Gated organizational resources requiring special access',
    persistence: 'external',
    writability: 'read-only',
    scope: 'organization',
    location: 'External (SharePoint, APIs)',
    mcpServers: ['sharepoint', 'teams', 'outlook'],
    commands: [],
  },
};

/**
 * Get configuration for a specific memory tier
 */
export function getMemoryTierConfig(tier: MemoryTier): MemoryTierConfig {
  return MEMORY_TIER_CONFIGS[tier];
}

/**
 * Get all tier configurations in precedence order (highest first)
 */
export function getTierConfigsByPrecedence(): readonly MemoryTierConfig[] {
  return [
    MEMORY_TIER_CONFIGS[MemoryTier.CONSTITUTIONAL],
    MEMORY_TIER_CONFIGS[MemoryTier.CONTEXT],
    MEMORY_TIER_CONFIGS[MemoryTier.EXPLICIT],
    MEMORY_TIER_CONFIGS[MemoryTier.CONTROLLED],
  ];
}

/**
 * Check if a tier allows AI write access
 */
export function canAiWrite(tier: MemoryTier): boolean {
  const config = MEMORY_TIER_CONFIGS[tier];
  return config.writability === 'read-write';
}

/**
 * Check if a tier requires audit logging
 */
export function requiresAuditLog(tier: MemoryTier): boolean {
  return tier === MemoryTier.CONTROLLED;
}

/**
 * Get MCP servers required for a tier
 */
export function getMcpServersForTier(tier: MemoryTier): readonly string[] {
  return MEMORY_TIER_CONFIGS[tier].mcpServers;
}
