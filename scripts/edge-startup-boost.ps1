# Disable Edge Startup Boost via registry
$path = "HKLM:\SOFTWARE\Policies\Microsoft\Edge"
if (-not (Test-Path $path)) {
    New-Item -Path $path -Force | Out-Null
}
Set-ItemProperty -Path $path -Name "StartupBoostEnabled" -Value 0 -Type DWord
Write-Host "Edge Startup Boost disabled (policy)."

# Also check user-level setting
$userPath = "HKCU:\SOFTWARE\Microsoft\Edge\StartupBoost"
if (Test-Path $userPath) {
    Set-ItemProperty -Path $userPath -Name "StartupBoostEnabled" -Value 0 -Type DWord -EA SilentlyContinue
    Write-Host "Edge Startup Boost disabled (user pref)."
}

# Verify
$val = Get-ItemProperty -Path $path -Name "StartupBoostEnabled" -EA SilentlyContinue
Write-Host "Registry value: $($val.StartupBoostEnabled) (0=disabled)"
