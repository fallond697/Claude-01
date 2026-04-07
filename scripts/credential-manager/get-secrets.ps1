# Read secrets from Windows Credential Manager and export as environment variables
# Called by MCP server launchers before starting the server process
# Usage: powershell -ExecutionPolicy Bypass -File get-secrets.ps1

# Read a credential from Windows Credential Manager
function Get-StoredCredential {
    param([string]$Target)
    $output = cmdkey /list:$Target 2>$null
    if ($output -match "Target:") {
        # cmdkey doesn't expose password directly; use .NET CredentialManager
        Add-Type -AssemblyName System.Runtime.InteropServices
        $cred = [System.Runtime.InteropServices.Marshal]
        # Use PowerShell credential approach
        try {
            $result = & {
                $ErrorActionPreference = 'Stop'
                $code = @"
using System;
using System.Runtime.InteropServices;
public class CredManager {
    [DllImport("advapi32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    public static extern bool CredRead(string target, int type, int flags, out IntPtr credential);
    [DllImport("advapi32.dll")]
    public static extern void CredFree(IntPtr credential);
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct CREDENTIAL {
        public int Flags; public int Type;
        public string TargetName; public string Comment;
        public long LastWritten; public int CredentialBlobSize;
        public IntPtr CredentialBlob; public int Persist;
        public int AttributeCount; public IntPtr Attributes;
        public string TargetAlias; public string UserName;
    }
    public static string GetPassword(string target) {
        IntPtr credPtr;
        if (CredRead(target, 1, 0, out credPtr)) {
            var cred = (CREDENTIAL)Marshal.PtrToStructure(credPtr, typeof(CREDENTIAL));
            string pass = Marshal.PtrToStringUni(cred.CredentialBlob, cred.CredentialBlobSize / 2);
            CredFree(credPtr);
            return pass;
        }
        return null;
    }
}
"@
                Add-Type -TypeDefinition $code -Language CSharp
                return [CredManager]::GetPassword($Target)
            }
            return $result
        } catch {
            return $null
        }
    }
    return $null
}

# Map credential targets to environment variable names
$mappings = @{
    "claude/servicenow-client-id"     = "SERVICENOW_CLIENT_ID"
    "claude/servicenow-client-secret" = "SERVICENOW_CLIENT_SECRET"
    "claude/neo4j-password"           = "NEO4J_PASSWORD"
    "claude/obsidian-api-key"         = "OBSIDIAN_REST_API_KEY"
    "claude/teams-webhook-url"        = "TEAMS_WEBHOOK_URL"
}

$exported = 0
foreach ($entry in $mappings.GetEnumerator()) {
    $value = Get-StoredCredential -Target $entry.Key
    if ($value) {
        [Environment]::SetEnvironmentVariable($entry.Value, $value, "Process")
        $exported++
    }
}

Write-Host "[credential-manager] Loaded $exported/$($mappings.Count) secrets from Windows Credential Manager" -ForegroundColor Cyan
