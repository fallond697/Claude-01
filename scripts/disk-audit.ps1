# disk-audit.ps1 — One-shot disk usage audit

Write-Host "=== CLEANUP CANDIDATES ===" -ForegroundColor Cyan

$locations = @{
    "Temp (User)"     = "$env:TEMP"
    "Temp (Windows)"  = "C:\Windows\Temp"
    "Downloads"       = "$env:USERPROFILE\Downloads"
    "WinUpdate DL"    = "C:\Windows\SoftwareDistribution\Download"
    "Edge Cache"      = "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Cache"
    "Teams Cache"     = "$env:LOCALAPPDATA\Packages\MSTeams_8wekyb3d8bbwe\LocalCache"
    "Crash Dumps"     = "$env:LOCALAPPDATA\CrashDumps"
    "npm cache"       = "$env:APPDATA\npm-cache"
    "pip cache"       = "$env:LOCALAPPDATA\pip\cache"
    "Prefetch"        = "C:\Windows\Prefetch"
}

$totalReclaimable = 0
foreach ($name in $locations.Keys | Sort-Object) {
    $path = $locations[$name]
    if (Test-Path $path) {
        $size = (Get-ChildItem $path -Recurse -Force -ErrorAction SilentlyContinue |
                 Measure-Object Length -Sum).Sum
        $sizeMB = [math]::Round($size / 1MB)
        $totalReclaimable += $sizeMB
        Write-Host ("{0,-20} {1,8} MB   {2}" -f $name, $sizeMB, $path)
    }
}
Write-Host ("`nTotal reclaimable (approx): {0} MB" -f $totalReclaimable)

Write-Host "`n=== TOP 15 LARGE FILES (>100 MB) ===" -ForegroundColor Cyan
Get-ChildItem $env:USERPROFILE -Recurse -Force -ErrorAction SilentlyContinue |
    Where-Object { -not $_.PSIsContainer -and $_.Length -gt 100MB } |
    Sort-Object Length -Descending |
    Select-Object -First 15 @{N="SizeMB";E={[math]::Round($_.Length/1MB)}}, FullName |
    Format-Table -AutoSize

Write-Host "=== USER PROFILE FOLDERS BY SIZE ===" -ForegroundColor Cyan
Get-ChildItem $env:USERPROFILE -Directory -Force -ErrorAction SilentlyContinue | ForEach-Object {
    $size = (Get-ChildItem $_.FullName -Recurse -Force -ErrorAction SilentlyContinue |
             Measure-Object Length -Sum).Sum
    [PSCustomObject]@{ Folder = $_.Name; SizeMB = [math]::Round($size / 1MB) }
} | Sort-Object SizeMB -Descending | Select-Object -First 20 | Format-Table -AutoSize

Write-Host "=== RECYCLE BIN ===" -ForegroundColor Cyan
$rb = (New-Object -ComObject Shell.Application).NameSpace(0xA)
$rbItems = $rb.Items()
$rbSize = 0
$rbItems | ForEach-Object { $rbSize += $_.Size }
Write-Host ("Recycle Bin: {0} items, {1} MB" -f $rbItems.Count, [math]::Round($rbSize/1MB))
