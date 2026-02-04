# Register Windows Scheduled Task for Bulk Pricing Recalculation
# Run this script once to set up the scheduled task

$TaskName = "SplitLease-BulkPricingRecalc"
$ScriptPath = "C:\Users\Split Lease\Documents\Split Lease\scripts\scheduled-bulk-recalc.ps1"

# Schedule for 2 hours from now (dynamically calculated)
$ScheduledTime = (Get-Date).AddHours(2)

Write-Host "Registering scheduled task: $TaskName"
Write-Host "Script: $ScriptPath"
Write-Host "Scheduled for: $ScheduledTime"

# Create the action
$Action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -File `"$ScriptPath`""

# Create the trigger (one-time)
$Trigger = New-ScheduledTaskTrigger -Once -At $ScheduledTime

# Create settings (allow task to run on demand, don't stop if running longer than 3 hours)
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Hours 3)

# Register the task (requires elevation for some settings, but basic registration should work)
try {
    Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Force
    Write-Host ""
    Write-Host "SUCCESS: Task '$TaskName' registered for $ScheduledTime" -ForegroundColor Green
    Write-Host ""
    Write-Host "To verify: schtasks /query /tn '$TaskName'"
    Write-Host "To run now: schtasks /run /tn '$TaskName'"
    Write-Host "To delete: schtasks /delete /tn '$TaskName' /f"
} catch {
    Write-Host "ERROR: Failed to register task: $_" -ForegroundColor Red
    exit 1
}
