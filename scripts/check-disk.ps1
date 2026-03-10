$disk = Get-CimInstance Win32_LogicalDisk -Filter 'DriveType=3'
$totalGB = [math]::Round($disk.Size / 1GB, 1)
$freeGB = [math]::Round($disk.FreeSpace / 1GB, 1)
$freePct = [math]::Round($disk.FreeSpace / $disk.Size * 100, 1)
Write-Host "C: $totalGB GB total, $freeGB GB free ($freePct%)"
