# Store secrets in Windows Credential Manager
# Run once to populate, then MCP servers read via get-secrets.ps1
# Usage: powershell -ExecutionPolicy Bypass -File store-secrets.ps1

param(
    [switch]$Interactive
)

$credentials = @(
    @{ Target = "claude/servicenow-client-id"; Description = "ServiceNow OAuth Client ID" },
    @{ Target = "claude/servicenow-client-secret"; Description = "ServiceNow OAuth Client Secret" },
    @{ Target = "claude/neo4j-password"; Description = "Neo4j Database Password" },
    @{ Target = "claude/obsidian-api-key"; Description = "Obsidian Local REST API Key" },
    @{ Target = "claude/teams-webhook-url"; Description = "Teams Change Control Webhook URL" }
)

if ($Interactive) {
    foreach ($cred in $credentials) {
        $existing = cmdkey /list:$($cred.Target) 2>$null
        if ($existing -match "Target:") {
            Write-Host "[EXISTS] $($cred.Target) - $($cred.Description)" -ForegroundColor Yellow
            $overwrite = Read-Host "  Overwrite? (y/N)"
            if ($overwrite -ne "y") { continue }
        }
        $value = Read-Host "  Enter value for $($cred.Description)" -AsSecureString
        $plaintext = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($value)
        )
        cmdkey /generic:$($cred.Target) /user:claude /pass:$plaintext | Out-Null
        Write-Host "[STORED] $($cred.Target)" -ForegroundColor Green
    }
} else {
    Write-Host "Credential targets for Claude Code MCP servers:"
    Write-Host ""
    foreach ($cred in $credentials) {
        $existing = cmdkey /list:$($cred.Target) 2>$null
        $status = if ($existing -match "Target:") { "[SET]" } else { "[MISSING]" }
        $color = if ($status -eq "[SET]") { "Green" } else { "Red" }
        Write-Host "  $status $($cred.Target) - $($cred.Description)" -ForegroundColor $color
    }
    Write-Host ""
    Write-Host "Run with -Interactive to set values: powershell -File store-secrets.ps1 -Interactive"
}
