# startup-monitor.ps1
# Monitors CPU and memory usage for 5 minutes after boot
# Logs to Desktop/startup-monitor-<date>.csv (auto-detects OneDrive redirect)
# Install: create a Scheduled Task to run at logon (see bottom of script)

param(
    [int]$DurationMinutes = 5,
    [int]$IntervalSeconds = 5
)

$timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$desktopPath = [Environment]::GetFolderPath("Desktop")
$logFile = "$desktopPath\startup-monitor-$timestamp.csv"
$totalRAM = (Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1MB

# CSV header
"Timestamp,UptimeSec,CPU%,MemUsedMB,MemFreeMB,MemTotalMB,Mem%Used,Top5Processes" | Out-File $logFile -Encoding UTF8

$endTime = (Get-Date).AddMinutes($DurationMinutes)

while ((Get-Date) -lt $endTime) {
    $now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $os = Get-CimInstance Win32_OperatingSystem
    $uptime = [int]((Get-Date) - $os.LastBootUpTime).TotalSeconds

    # CPU (instantaneous snapshot)
    $cpu = [math]::Round((Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average, 1)

    # Memory
    $freeMB = [math]::Round($os.FreePhysicalMemory / 1024, 0)
    $totalMB = [math]::Round($totalRAM, 0)
    $usedMB = $totalMB - $freeMB
    $memPct = [math]::Round(($usedMB / $totalMB) * 100, 1)

    # Top 5 processes by working set
    $top5 = Get-Process |
        Sort-Object WorkingSet64 -Descending |
        Select-Object -First 5 |
        ForEach-Object { "$($_.ProcessName):$([math]::Round($_.WorkingSet64/1MB,0))MB" }
    $top5Str = ($top5 -join " | ")

    # Write row
    "$now,$uptime,$cpu,$usedMB,$freeMB,$totalMB,$memPct,`"$top5Str`"" |
        Out-File $logFile -Append -Encoding UTF8

    # Also write to console if running interactively
    Write-Host "[$now] CPU: ${cpu}% | RAM: ${usedMB}/${totalMB} MB (${memPct}%) | $top5Str"

    Start-Sleep -Seconds $IntervalSeconds
}

Write-Host "`nMonitoring complete. Log saved to: $logFile"

<#
  === INSTALL AS SCHEDULED TASK ===
  Run this ONE TIME in an elevated PowerShell to register:

  $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$env:USERPROFILE\Code\Claude-01\scripts\startup-monitor.ps1`""
  $trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
  $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
  Register-ScheduledTask -TaskName "StartupResourceMonitor" -Action $action -Trigger $trigger -Settings $settings -Description "Monitors CPU and RAM for 5 min after logon"

  === UNINSTALL ===
  Unregister-ScheduledTask -TaskName "StartupResourceMonitor" -Confirm:$false
#>
