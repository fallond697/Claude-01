# Register a scheduled task to refresh the Change Calendar daily at 6:30 AM
$taskName = "RefreshChangeCalendar"
$pythonPath = "C:\Python314\python.exe"
$scriptPath = "C:\Users\FallonD\Code\Claude-01\scripts\refresh-calendar.py"
$workDir = "C:\Users\FallonD\Code\Claude-01\scripts"

# Remove existing task if present
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue

$action = New-ScheduledTaskAction -Execute $pythonPath -Argument $scriptPath -WorkingDirectory $workDir
$trigger = New-ScheduledTaskTrigger -Daily -At 6:30AM
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopIfGoingOnBatteries -AllowStartIfOnBatteries

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "Refresh Change Management Calendar from ServiceNow (daily 6:30 AM)"

Write-Host "Scheduled task '$taskName' registered - runs daily at 6:30 AM"
Write-Host "  Python: $pythonPath"
Write-Host "  Script: $scriptPath"
