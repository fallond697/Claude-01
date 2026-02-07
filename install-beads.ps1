# install-beads.ps1 - Install Beads (bd) and Perles for Windows
# Beads: git-backed graph issue tracker for AI agents
# Perles: terminal UI for Beads with BQL and kanban views
#
# Sources:
#   https://github.com/steveyegge/beads
#   https://github.com/zjrosen/perles

$ErrorActionPreference = "Stop"
$InstallDir = "$env:USERPROFILE\bin"
$TempDir = "$env:TEMP\beads-install"

Write-Host "`n=== Beads + Perles Installer ===" -ForegroundColor Cyan

# Ensure directories exist
if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
    Write-Host "Created $InstallDir" -ForegroundColor Yellow
}
if (Test-Path $TempDir) { Remove-Item -Recurse -Force $TempDir }
New-Item -ItemType Directory -Path $TempDir -Force | Out-Null

# ─────────────────────────────────────────────
# 1. Install Beads (bd) via direct binary download
# ─────────────────────────────────────────────
Write-Host "`n--- Installing Beads (bd) ---" -ForegroundColor Green

# Get latest release version from GitHub API
Write-Host "Fetching latest release info..."
$releaseInfo = Invoke-RestMethod -Uri "https://api.github.com/repos/steveyegge/beads/releases/latest"
$version = $releaseInfo.tag_name -replace '^v', ''
Write-Host "Latest version: v$version"

# Find Windows AMD64 asset
$asset = $releaseInfo.assets | Where-Object { $_.name -like "*windows_amd64*" }
if (-not $asset) {
    Write-Host "ERROR: No Windows AMD64 binary found in release." -ForegroundColor Red
    exit 1
}

$zipFile = Join-Path $TempDir $asset.name
$extractDir = Join-Path $TempDir "beads-extract"

Write-Host "Downloading $($asset.name)..."
Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $zipFile -UseBasicParsing

Write-Host "Extracting..."
Expand-Archive -Path $zipFile -DestinationPath $extractDir -Force

# Find bd.exe in extracted contents
$bdExe = Get-ChildItem -Path $extractDir -Filter "bd.exe" -Recurse | Select-Object -First 1
if (-not $bdExe) {
    # Some releases name it beads.exe
    $bdExe = Get-ChildItem -Path $extractDir -Filter "beads.exe" -Recurse | Select-Object -First 1
}

if ($bdExe) {
    Copy-Item -Path $bdExe.FullName -Destination "$InstallDir\bd.exe" -Force
    # Also create beads.exe alias
    Copy-Item -Path $bdExe.FullName -Destination "$InstallDir\beads.exe" -Force
    Write-Host "Beads v$version installed to $InstallDir\bd.exe" -ForegroundColor Green
} else {
    # List what was extracted for debugging
    Write-Host "Extracted files:" -ForegroundColor Yellow
    Get-ChildItem -Path $extractDir -Recurse | ForEach-Object { Write-Host "  $($_.FullName)" }
    Write-Host "ERROR: bd.exe not found in archive." -ForegroundColor Red
    exit 1
}

# Verify
$bdCheck = Get-Command bd -ErrorAction SilentlyContinue
if ($bdCheck) {
    $bdVersion = & bd --version 2>&1
    Write-Host "Verified: $bdVersion" -ForegroundColor Green
}

# ─────────────────────────────────────────────
# 2. Install Perles (build from source via Go)
#    No Windows binaries published upstream
# ─────────────────────────────────────────────
Write-Host "`n--- Installing Perles ---" -ForegroundColor Green

$goCheck = Get-Command go -ErrorAction SilentlyContinue
if (-not $goCheck) {
    Write-Host "Go is not installed. Attempting install via choco..." -ForegroundColor Yellow

    $chocoCheck = Get-Command choco -ErrorAction SilentlyContinue
    if ($chocoCheck) {
        Write-Host "Installing Go via Chocolatey..."
        choco install golang -y
        # Refresh PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
        $goCheck = Get-Command go -ErrorAction SilentlyContinue
    }

    if (-not $goCheck) {
        Write-Host "ERROR: Go is required for Perles (no Windows binaries available)." -ForegroundColor Red
        Write-Host "Install Go from https://go.dev/dl/ then re-run this script." -ForegroundColor Yellow
        Write-Host "`n=== Beads installed. Perles skipped (needs Go). ===" -ForegroundColor Yellow
        # Cleanup
        Remove-Item -Recurse -Force $TempDir -ErrorAction SilentlyContinue
        exit 0
    }
}

$goVersion = & go version 2>&1
Write-Host "Using $goVersion"
Write-Host "Installing perles via go install..."

$env:GOBIN = $InstallDir
go install github.com/zjrosen/perles@latest

$perlesPath = Get-Command perles -ErrorAction SilentlyContinue
if ($perlesPath) {
    $perlesVersion = & perles --version 2>&1
    Write-Host "Perles installed: $perlesVersion" -ForegroundColor Green
    Write-Host "Location: $($perlesPath.Source)" -ForegroundColor Gray
} elseif (Test-Path "$InstallDir\perles.exe") {
    Write-Host "Perles installed to $InstallDir\perles.exe" -ForegroundColor Green
} else {
    $gopath = & go env GOPATH 2>&1
    if (Test-Path "$gopath\bin\perles.exe") {
        Write-Host "Perles installed to $gopath\bin\perles.exe" -ForegroundColor Green
        Write-Host "Consider adding $gopath\bin to your PATH." -ForegroundColor Yellow
    } else {
        Write-Host "WARNING: perles binary not found after go install." -ForegroundColor Yellow
    }
}

# ─────────────────────────────────────────────
# Cleanup & Summary
# ─────────────────────────────────────────────
Remove-Item -Recurse -Force $TempDir -ErrorAction SilentlyContinue

Write-Host "`n=== Installation Complete ===" -ForegroundColor Cyan
Write-Host "  bd (beads):  $InstallDir\bd.exe" -ForegroundColor White
Write-Host "  perles:      $InstallDir\perles.exe" -ForegroundColor White
Write-Host ""
Write-Host "Quick start:" -ForegroundColor Gray
Write-Host "  bd init          # Initialize beads in current repo" -ForegroundColor Gray
Write-Host "  bd add 'task'    # Add an issue" -ForegroundColor Gray
Write-Host "  bd ls            # List issues" -ForegroundColor Gray
Write-Host "  perles           # Launch terminal UI" -ForegroundColor Gray
