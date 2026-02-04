# Schedule Host Proposals Payment Bug Fix Orchestrator
# Schedules for 11 PM EST with 4-hour max runtime

param(
    [string]$ScheduledTime = "23:00",
    [string]$ScheduledDate = (Get-Date).ToString("MM/dd/yyyy"),
    [switch]$Remove
)

$TaskName = "SplitLease-PaymentBugFix-Orchestrator"
$ProjectRoot = "C:\Users\Split Lease\My Drive\!Agent Context and Tools\SL3\Split Lease"
$ScriptPath = "$ProjectRoot\.claude\scripts\orchestrator-runner.js"
$LogPath = "$ProjectRoot\.claude\logs"

# Ensure directories exist
@("$LogPath", "$ProjectRoot\.claude\state", "$ProjectRoot\.claude\screenshots") | ForEach-Object {
    if (-not (Test-Path $_)) { New-Item -ItemType Directory -Path $_ -Force | Out-Null }
}

if ($Remove) {
    Write-Host "Removing scheduled task: $TaskName" -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host "Task removed successfully" -ForegroundColor Green
    exit 0
}

# Check Node.js
$NodePath = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $NodePath) {
    Write-Host "ERROR: Node.js not found in PATH" -ForegroundColor Red
    exit 1
}

# Create action
$Action = New-ScheduledTaskAction -Execute $NodePath -Argument "`"$ScriptPath`"" -WorkingDirectory $ProjectRoot

# Create trigger for specified date/time
$TriggerDateTime = [DateTime]::ParseExact("$ScheduledDate $ScheduledTime", "MM/dd/yyyy HH:mm", $null)
$Trigger = New-ScheduledTaskTrigger -Once -At $TriggerDateTime

# Task settings
$Settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Hours 5) `
    -Priority 7

try {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue

    Register-ScheduledTask `
        -TaskName $TaskName `
        -Action $Action `
        -Trigger $Trigger `
        -Settings $Settings `
        -Description "Self-healing debug orchestrator for Host Proposals payment bug. Max: 4 hours." `
        -RunLevel Highest

    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "ORCHESTRATOR SCHEDULED" -ForegroundColor Green
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "Task:     $TaskName"
    Write-Host "Time:     $TriggerDateTime"
    Write-Host "Script:   $ScriptPath"
    Write-Host "Log:      $LogPath\orchestrator-run.log"
    Write-Host ""
    Write-Host "To view:  Get-ScheduledTask -TaskName '$TaskName'"
    Write-Host "To test:  node `"$ScriptPath`""
    Write-Host "To remove: .\schedule-orchestrator.ps1 -Remove"
} catch {
    Write-Host "ERROR: Failed to create scheduled task" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}
