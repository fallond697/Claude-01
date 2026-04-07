# Security Guide — Claude Code Development Environment

## Credential Management

### Architecture: Windows Credential Manager

All secrets are stored in **Windows Credential Manager** (DPAPI-encrypted, tied to the Windows user profile). No credentials should exist in plaintext config files.

| Secret | Credential Manager Target | Environment Variable |
|---|---|---|
| ServiceNow OAuth Client ID | `claude/servicenow-client-id` | `SERVICENOW_CLIENT_ID` |
| ServiceNow OAuth Client Secret | `claude/servicenow-client-secret` | `SERVICENOW_CLIENT_SECRET` |
| Neo4j Database Password | `claude/neo4j-password` | `NEO4J_PASSWORD` |
| Obsidian REST API Key | `claude/obsidian-api-key` | `OBSIDIAN_REST_API_KEY` |
| Teams Webhook URL | `claude/teams-webhook-url` | `TEAMS_WEBHOOK_URL` |

### How It Works

1. Secrets are stored once via `store-secrets.ps1 -Interactive`
2. MCP servers and scripts read secrets via `get-secrets.ps1` which exports them as environment variables
3. Config files (`.mcp.json`, `mcp.json`) reference `${ENV_VAR}` instead of plaintext values
4. Secrets never appear in any file on disk

### Setup

```powershell
# Store secrets (one-time, interactive)
powershell -ExecutionPolicy Bypass -File scripts/credential-manager/store-secrets.ps1 -Interactive

# Verify stored secrets
powershell -ExecutionPolicy Bypass -File scripts/credential-manager/store-secrets.ps1

# Run audit
powershell -ExecutionPolicy Bypass -File scripts/credential-manager/audit-secrets.ps1
```

## What NOT to Do

- Never hardcode credentials in `.mcp.json`, `mcp.json`, or `settings.local.json`
- Never store passwords in bash commands (e.g., `SN_PASS='...' node script.js`)
- Never commit `.env` files, tokens, or API keys to git
- Never store credentials in Claude Code history or memory files
- Never put credentials in Obsidian vault notes

## File Permissions

Sensitive files must be restricted to owner-only access:

| File | Required Permission |
|---|---|
| `~/.claude/.credentials.json` | Owner only (no group/other) |
| `~/.servicenow-mcp/tokens.json` | Owner only |
| `~/AppData/Roaming/Code/User/mcp.json` | Owner only |
| `~/.claude/settings.local.json` | Owner only |
| `~/.claude/history.jsonl` | Owner only |

Run `audit-secrets.ps1 -Fix` to auto-remediate file permissions.

## VS Code Settings Sync

**MCP configuration must NOT be synced** to Microsoft cloud. Either:
- Disable Settings Sync entirely, or
- Exclude `mcp.json` from sync via VS Code Settings Sync configuration

Check: `~/AppData/Roaming/Code/User/sync/mcp/` should be empty.

## Git Security

### .gitignore

The following patterns are excluded from version control:
- `.env`, `.env.local`, `.env.*.local`
- `.mcp.json`
- `settings.local.json`
- `*.pem`, `*.key`
- `tokens.json`

### Pre-Commit Hook

A secret scanning pre-commit hook (commit `6304dd8`) checks for patterns:
`password`, `secret`, `api_key`, `token`, `AWS_SECRET`, `PRIVATE_KEY`

### Git History

If credentials were ever committed, they persist in git history even after removal. Use BFG Repo Cleaner to scrub:
```bash
bfg --replace-text passwords.txt .git
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

## Obsidian Security

### REST API
- HTTPS only (port 27124) — insecure HTTP (port 27123) must be **disabled**
- API key stored in Windows Credential Manager, not in plugin config
- Set `enableInsecureServer: false` in `obsidian-local-rest-api/data.json`
- SSL verification should be enabled (`OBSIDIAN_VERIFY_SSL=true`)

### Vault Data Classification
- Vault location: `OneDrive - Vituity` (corporate cloud, encryption at rest)
- Content classification: **INTERNAL** — operational metadata, no PHI/PII
- No actual patient data, credentials, or restricted information in vault
- Acceptable for corporate OneDrive with standard encryption

### Plugins
- Review community plugins periodically for security advisories
- `obsidian-local-rest-api`: High-risk — exposes vault via network API
- `smart-connections`: Verify local model only, no remote API calls
- `mcp-tools`: Scoped to Claude Desktop integration

## Neo4j Security

- Bound to localhost only (127.0.0.1:7687, 127.0.0.1:7474) — not externally exposed
- Authentication enabled, passwords hashed (SHA-256 with salt)
- APOC procedures should be restricted to required functions only (not `apoc.*`)
- TLS not enabled (acceptable for localhost-only)
- Password stored in Windows Credential Manager, not in config files

## Credential Rotation Schedule

| Secret | Rotation Frequency | Last Rotated | Owner |
|---|---|---|---|
| ServiceNow OAuth | 90 days | TBD | Dan Fallon |
| ServiceNow Password | 90 days | TBD | Dan Fallon |
| Neo4j Password | 180 days | TBD | Dan Fallon |
| Obsidian API Key | 180 days | TBD | Dan Fallon |
| Teams Webhook URL | On compromise | TBD | Dan Fallon |
| Anthropic API Token | Auto-rotated | Managed by Claude Code | Anthropic |

## Monitoring

### Automated Audit

Run the credential audit script periodically:

```powershell
# Manual audit
powershell -ExecutionPolicy Bypass -File scripts/credential-manager/audit-secrets.ps1

# Auto-fix permissions
powershell -ExecutionPolicy Bypass -File scripts/credential-manager/audit-secrets.ps1 -Fix
```

The audit checks:
1. Plaintext secrets in known config files
2. File permissions on sensitive files
3. VS Code Settings Sync exposure
4. Obsidian REST API configuration

Exit codes: `0` = clean, `1` = high findings, `2` = critical findings.

## Incident Response

If credentials are exposed:
1. **Immediately rotate** the affected credential
2. Check access logs for unauthorized usage (ServiceNow audit log, Neo4j query log)
3. Scrub git history if credential was committed
4. Update Windows Credential Manager with new value
5. Run `audit-secrets.ps1` to verify remediation
6. Document the incident
