# Credential Monitoring & Alerting Script
# Scans known locations for plaintext secrets and reports violations
# Run on schedule or as pre-commit hook
# Usage: powershell -ExecutionPolicy Bypass -File audit-secrets.ps1

param(
    [switch]$Fix  # Attempt to fix permissions on flagged files
)

$ErrorActionPreference = "Continue"
$findings = @()
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Credential Audit - $timestamp" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── 1. Check for plaintext secrets in known config files ──

$secretPatterns = @(
    @{ Pattern = "CLIENT_SECRET"; Description = "OAuth Client Secret" },
    @{ Pattern = "SN_PASS="; Description = "ServiceNow Password" },
    @{ Pattern = "neo4j2026"; Description = "Neo4j Default Password" },
    @{ Pattern = "sk-ant-"; Description = "Anthropic API Token" },
    @{ Pattern = "webhook.office.com"; Description = "Teams Webhook URL" },
    @{ Pattern = "refreshToken"; Description = "OAuth Refresh Token" }
)

$filesToScan = @(
    "$env:USERPROFILE\.claude\settings.local.json",
    "$env:USERPROFILE\.claude\.credentials.json",
    "$env:USERPROFILE\.servicenow-mcp\tokens.json",
    "$env:APPDATA\Code\User\mcp.json",
    "$env:APPDATA\Code\User\sync\mcp\lastSyncmcp.json",
    "$env:USERPROFILE\Code\Claude-01\.mcp.json",
    "$env:USERPROFILE\Code\HT-095-digital-twin\packages\dashboard-server\.env"
)

Write-Host "[1/4] Scanning config files for plaintext secrets..." -ForegroundColor Yellow
foreach ($file in $filesToScan) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -ErrorAction SilentlyContinue
        foreach ($sp in $secretPatterns) {
            if ($content -match [regex]::Escape($sp.Pattern)) {
                $findings += @{
                    Severity = "CRITICAL"
                    File = $file
                    Finding = "Plaintext $($sp.Description) detected"
                    Remediation = "Move to Windows Credential Manager"
                }
                Write-Host "  [CRITICAL] $file" -ForegroundColor Red
                Write-Host "    -> $($sp.Description) found in plaintext" -ForegroundColor Red
            }
        }
    }
}

# ── 2. Check file permissions ──

Write-Host ""
Write-Host "[2/4] Checking file permissions on sensitive files..." -ForegroundColor Yellow

$sensitiveFiles = @(
    "$env:USERPROFILE\.claude\.credentials.json",
    "$env:USERPROFILE\.servicenow-mcp\tokens.json",
    "$env:APPDATA\Code\User\mcp.json",
    "$env:USERPROFILE\.claude\settings.local.json"
)

foreach ($file in $sensitiveFiles) {
    if (Test-Path $file) {
        $acl = Get-Acl $file
        $otherAccess = $acl.Access | Where-Object {
            $_.IdentityReference -notmatch "BUILTIN\\Administrators" -and
            $_.IdentityReference -notmatch "$env:USERDOMAIN\\$env:USERNAME" -and
            $_.IdentityReference -notmatch "NT AUTHORITY\\SYSTEM"
        }
        if ($otherAccess) {
            $findings += @{
                Severity = "HIGH"
                File = $file
                Finding = "File readable by: $($otherAccess.IdentityReference -join ', ')"
                Remediation = "Restrict ACL to owner only"
            }
            Write-Host "  [HIGH] $file" -ForegroundColor Yellow
            Write-Host "    -> Readable by: $($otherAccess.IdentityReference -join ', ')" -ForegroundColor Yellow

            if ($Fix) {
                try {
                    $newAcl = New-Object System.Security.AccessControl.FileSecurity
                    $rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
                        "$env:USERDOMAIN\$env:USERNAME", "FullControl", "Allow"
                    )
                    $newAcl.AddAccessRule($rule)
                    $newAcl.SetAccessRuleProtection($true, $false)
                    Set-Acl -Path $file -AclObject $newAcl
                    Write-Host "    -> [FIXED] Permissions restricted to owner" -ForegroundColor Green
                } catch {
                    Write-Host "    -> [FAILED] Could not fix: $_" -ForegroundColor Red
                }
            }
        } else {
            Write-Host "  [OK] $file" -ForegroundColor Green
        }
    }
}

# ── 3. Check VS Code Settings Sync ──

Write-Host ""
Write-Host "[3/4] Checking VS Code Settings Sync..." -ForegroundColor Yellow

$syncDir = "$env:APPDATA\Code\User\sync\mcp"
if (Test-Path $syncDir) {
    $syncFiles = Get-ChildItem $syncDir -File
    if ($syncFiles) {
        $findings += @{
            Severity = "HIGH"
            File = $syncDir
            Finding = "MCP config is being synced to Microsoft cloud ($($syncFiles.Count) sync files)"
            Remediation = "Exclude mcp.json from VS Code Settings Sync"
        }
        Write-Host "  [HIGH] MCP credentials synced to cloud ($($syncFiles.Count) files in sync/mcp/)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  [OK] No MCP sync detected" -ForegroundColor Green
}

# ── 4. Check Obsidian REST API ──

Write-Host ""
Write-Host "[4/4] Checking Obsidian REST API configuration..." -ForegroundColor Yellow

$obsidianApiConfig = "$env:USERPROFILE\OneDrive - Vituity\Documents\Obsidian\Knowledge Base\.obsidian\plugins\obsidian-local-rest-api\data.json"
if (Test-Path $obsidianApiConfig) {
    $apiConfig = Get-Content $obsidianApiConfig -Raw | ConvertFrom-Json
    if ($apiConfig.enableInsecureServer -eq $true) {
        $findings += @{
            Severity = "HIGH"
            File = $obsidianApiConfig
            Finding = "Insecure HTTP server enabled on port $($apiConfig.insecurePort)"
            Remediation = "Set enableInsecureServer to false"
        }
        Write-Host "  [HIGH] Insecure HTTP API enabled on port $($apiConfig.insecurePort)" -ForegroundColor Yellow
    } else {
        Write-Host "  [OK] Insecure HTTP API disabled" -ForegroundColor Green
    }
} else {
    Write-Host "  [OK] Obsidian REST API plugin not found" -ForegroundColor Green
}

# ── Summary ──

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AUDIT SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$critical = ($findings | Where-Object { $_.Severity -eq "CRITICAL" }).Count
$high = ($findings | Where-Object { $_.Severity -eq "HIGH" }).Count

if ($findings.Count -eq 0) {
    Write-Host "  ALL CLEAR - No security findings" -ForegroundColor Green
} else {
    Write-Host "  $critical CRITICAL | $high HIGH | $($findings.Count) Total" -ForegroundColor $(if ($critical -gt 0) { "Red" } else { "Yellow" })
    Write-Host ""
    foreach ($f in $findings) {
        $color = if ($f.Severity -eq "CRITICAL") { "Red" } else { "Yellow" }
        Write-Host "  [$($f.Severity)] $($f.Finding)" -ForegroundColor $color
        Write-Host "    File: $($f.File)" -ForegroundColor Gray
        Write-Host "    Fix:  $($f.Remediation)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Run with -Fix to auto-remediate file permissions" -ForegroundColor Cyan

# Return exit code for CI/hook integration
if ($critical -gt 0) { exit 2 }
if ($high -gt 0) { exit 1 }
exit 0
