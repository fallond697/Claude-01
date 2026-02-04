# Memory Query Skill

Query the 4-tier memory system for knowledge retrieval.

## Usage

```
/memory-query <query> [--tier <0-3>] [--all]
```

## Tier Mapping

| Flag | Tier | Sources |
|------|------|---------|
| `--tier 0` | Constitutional | `.specify/memory/constitution.md` |
| `--tier 1` | Context | Current session state |
| `--tier 2` | Explicit | `.specify/memory/explicit/`, Obsidian vault |
| `--tier 3` | Controlled | SharePoint (via MCP) |
| `--all` | All tiers | Search all available sources |

## Behavior

1. Parse the query and tier selection
2. Search the appropriate tier(s)
3. Return results with source attribution
4. For L3 (Controlled), log access for audit

## Examples

- `/memory-query "code quality standards"` - Search L0 constitution
- `/memory-query "project glossary" --tier 2` - Search explicit memory
- `/memory-query "expense policy" --tier 3` - Search SharePoint
- `/memory-query "PARA methodology" --all` - Search all tiers

## Implementation Notes

- L0 queries should read `.specify/memory/constitution.md`
- L2 queries use Obsidian MCP server and local files
- L3 queries use `mcp__sharepoint__search_sharepoint`
- Always include tier and source in response
