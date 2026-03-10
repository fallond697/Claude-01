# Find Jan uninstaller
$jan = Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*' -EA SilentlyContinue |
    Where-Object { $_.DisplayName -match 'Jan' }

if ($jan) {
    Write-Host "Found: $($jan.DisplayName)"
    Write-Host "Uninstall string: $($jan.UninstallString)"
    Write-Host "Running uninstaller..."
    Start-Process -FilePath $jan.UninstallString -Wait
} else {
    Write-Host "Jan not found in registry. Removing files manually..."
}

# Clean up leftover files regardless
$paths = @(
    "$env:LOCALAPPDATA\Programs\jan",
    "$env:LOCALAPPDATA\jan-updater",
    "$env:APPDATA\jan"
)
foreach ($p in $paths) {
    if (Test-Path $p) {
        $sizeMB = [math]::Round((Get-ChildItem $p -Recurse -Force -EA SilentlyContinue | Measure-Object Length -Sum).Sum / 1MB)
        Remove-Item $p -Recurse -Force -EA SilentlyContinue
        Write-Host "Removed $p ($sizeMB MB)"
    }
}
Write-Host "Done."
