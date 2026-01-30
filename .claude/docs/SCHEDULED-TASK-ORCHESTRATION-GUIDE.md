# Scheduled Task Orchestration Guide for Claude Code

**Created:** 2026-01-30
**Purpose:** Complete guide for scheduling Claude Code tasks to run overnight or at specific times
**Tested:** Successfully ran bulk pricing_list fix on 2026-01-30 at 8:54 AM

---

## Overview

This guide documents how to schedule Claude Code tasks to run autonomously at a specific time, even when the computer is asleep. This is useful for:

- Overnight bulk database operations
- Scheduled maintenance tasks
- Long-running analysis jobs
- Any task that benefits from running during off-hours

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SCHEDULED TASK EXECUTION FLOW                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Windows Task Scheduler                                                 │
│         │                                                               │
│         │ (triggers at scheduled time, wakes computer if needed)        │
│         ▼                                                               │
│  bulk-task-runner.bat (Launcher)                                        │
│         │                                                               │
│         │ (sets working directory, calls PowerShell)                    │
│         ▼                                                               │
│  task-runner.ps1 (Orchestrator)                                         │
│         │                                                               │
│         │ (reads prompt, logs progress, captures output)                │
│         ▼                                                               │
│  claude -p --dangerously-skip-permissions "prompt"                      │
│         │                                                               │
│         │ (executes prompt in non-interactive mode)                     │
│         ▼                                                               │
│  Output saved to .claude/logs/                                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Required Files

### 1. Execution Prompt File (`.claude/plans/New/<task-name>-prompt.md`)

This contains the detailed instructions for Claude Code. Template:

```markdown
# [Task Name] - Execution Prompt

**Token Budget:** [X] tokens
**Max Runtime:** [Y] hours
**Created:** [DATE]

---

## COPY THIS ENTIRE PROMPT TO RUN MANUALLY (or use scheduled task)

---

` ` `
You are executing [TASK NAME]. This is a [description of what this does].

## CRITICAL RULES

1. **DO NOT STOP** until task is complete or you hit token/time limits
2. **TRACK PROGRESS** - Output status updates regularly
3. **LOG ALL ERRORS** - Never silently skip failures
4. **USE MCP TOOLS** via mcp-tool-specialist subagent for ALL database operations
5. **VALIDATE RESULTS** after processing completes
6. **HARD STOP** after [X] hours maximum runtime - save progress and generate partial report

## TOKEN BUDGET: [X]
## MAX RUNTIME: [Y] HOURS

---

## PHASE 1: [Phase Name]

[Detailed instructions...]

## PHASE 2: [Phase Name]

[Detailed instructions...]

## COMPLETION CRITERIA

The task is COMPLETE when:
1. [Criterion 1]
2. [Criterion 2]
3. Final report is generated
4. Output summary is provided

BEGIN EXECUTION NOW.
` ` `

---

## Expected Outcome

[Description of what success looks like]
```

---

### 2. Batch File Launcher (`C:\Users\Split Lease\bulk-task-runner.bat`)

**Location:** Must be in a simple path WITHOUT spaces in critical parts (user home directory works).

```batch
@echo off
REM Scheduled Task Launcher for Claude Code
REM This file should be placed at: C:\Users\Split Lease\bulk-task-runner.bat

REM Set the project directory
set PROJECT_DIR=C:\Users\Split Lease\My Drive\!Agent Context and Tools\SL3\Split Lease

REM Change to project directory
cd /d "%PROJECT_DIR%"

REM Run the PowerShell orchestrator script
REM Pass the prompt file name as an argument (without path)
powershell.exe -ExecutionPolicy Bypass -File ".claude\scripts\scheduled-task-runner.ps1" %1
```

---

### 3. PowerShell Orchestrator Script (`.claude/scripts/scheduled-task-runner.ps1`)

```powershell
# Scheduled Task Runner for Claude Code
# Usage: .\scheduled-task-runner.ps1 [prompt-file-name]
# Example: .\scheduled-task-runner.ps1 "20260129231500-bulk-pricing-list-execution-prompt.md"

param(
    [string]$PromptFileName = ""
)

$ErrorActionPreference = "Continue"

# Configuration
$ProjectDir = "C:\Users\Split Lease\My Drive\!Agent Context and Tools\SL3\Split Lease"
$LogDir = "$ProjectDir\.claude\logs"
$PromptsDir = "$ProjectDir\.claude\plans\New"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$LogFile = "$LogDir\scheduled-task-$Timestamp.log"

# Ensure log directory exists
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

function Write-Log {
    param($Message)
    $LogTimestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = "[$LogTimestamp] $Message"
    Write-Host $LogMessage
    Add-Content -Path $LogFile -Value $LogMessage
}

function Extract-PromptContent {
    param($FilePath)

    $Content = Get-Content $FilePath -Raw

    # Find content between triple backticks
    $StartMarker = '```'
    $StartIndex = $Content.IndexOf($StartMarker)

    if ($StartIndex -eq -1) {
        # No backticks found, use entire file content
        return $Content
    }

    $StartIndex = $StartIndex + 3
    $EndIndex = $Content.LastIndexOf($StartMarker)

    if ($EndIndex -le $StartIndex) {
        return $Content
    }

    return $Content.Substring($StartIndex, $EndIndex - $StartIndex).Trim()
}

# ═══════════════════════════════════════════════════════════════════
# MAIN EXECUTION
# ═══════════════════════════════════════════════════════════════════

Write-Log "═══════════════════════════════════════════════════════════════"
Write-Log "SCHEDULED TASK RUNNER - STARTING"
Write-Log "═══════════════════════════════════════════════════════════════"
Write-Log "Working directory: $ProjectDir"
Write-Log "Log file: $LogFile"

# Change to project directory
Set-Location $ProjectDir

# Determine prompt file
if ([string]::IsNullOrEmpty($PromptFileName)) {
    # Find most recent prompt file in New directory
    $LatestPrompt = Get-ChildItem "$PromptsDir\*-prompt.md" |
                    Sort-Object LastWriteTime -Descending |
                    Select-Object -First 1

    if ($null -eq $LatestPrompt) {
        Write-Log "ERROR: No prompt file specified and no *-prompt.md files found in $PromptsDir"
        exit 1
    }

    $PromptFile = $LatestPrompt.FullName
    Write-Log "Auto-selected latest prompt file: $($LatestPrompt.Name)"
} else {
    $PromptFile = "$PromptsDir\$PromptFileName"
}

Write-Log "Prompt file: $PromptFile"

# Verify prompt file exists
if (-not (Test-Path $PromptFile)) {
    Write-Log "ERROR: Prompt file not found: $PromptFile"
    exit 1
}

# Extract prompt content
Write-Log "Extracting prompt content..."
$ExecutionPrompt = Extract-PromptContent -FilePath $PromptFile
$PromptLength = $ExecutionPrompt.Length
Write-Log "Prompt extracted: $PromptLength characters"

# Save prompt to temp file (for debugging)
$TempPromptFile = "$env:TEMP\claude-scheduled-task-prompt.txt"
$ExecutionPrompt | Out-File -FilePath $TempPromptFile -Encoding UTF8
Write-Log "Prompt saved to temp: $TempPromptFile"

# Run Claude Code
Write-Log "═══════════════════════════════════════════════════════════════"
Write-Log "LAUNCHING CLAUDE CODE"
Write-Log "═══════════════════════════════════════════════════════════════"
Write-Log "Mode: Non-interactive (--print)"
Write-Log "Permissions: Bypassed (--dangerously-skip-permissions)"

$StartTime = Get-Date

try {
    # Execute Claude Code in non-interactive mode
    $Result = & claude -p --dangerously-skip-permissions $ExecutionPrompt 2>&1

    $EndTime = Get-Date
    $Duration = $EndTime - $StartTime

    Write-Log "═══════════════════════════════════════════════════════════════"
    Write-Log "CLAUDE CODE EXECUTION COMPLETED"
    Write-Log "═══════════════════════════════════════════════════════════════"
    Write-Log "Duration: $($Duration.ToString('hh\:mm\:ss'))"
    Write-Log "Output length: $($Result.Length) characters"

    # Save full output
    $OutputFile = "$LogDir\scheduled-task-output-$Timestamp.txt"
    $Result | Out-File -FilePath $OutputFile -Encoding UTF8
    Write-Log "Full output saved to: $OutputFile"

    # Log first 500 chars of output as preview
    $Preview = if ($Result.Length -gt 500) { $Result.Substring(0, 500) + "..." } else { $Result }
    Write-Log "Output preview:"
    Write-Log $Preview
}
catch {
    Write-Log "═══════════════════════════════════════════════════════════════"
    Write-Log "ERROR DURING EXECUTION"
    Write-Log "═══════════════════════════════════════════════════════════════"
    Write-Log "Error: $($_.Exception.Message)"
    Write-Log "Stack trace: $($_.ScriptStackTrace)"
}

Write-Log "═══════════════════════════════════════════════════════════════"
Write-Log "SCHEDULED TASK RUNNER - FINISHED"
Write-Log "═══════════════════════════════════════════════════════════════"

# Cleanup temp file
Remove-Item $TempPromptFile -ErrorAction SilentlyContinue
```

---

## Setting Up a New Scheduled Task

### Step 1: Create the Execution Prompt

1. Create a new file in `.claude/plans/New/` with naming convention:
   `YYYYMMDDHHMMSS-<task-name>-prompt.md`

2. Follow the template structure above

3. Include clear phases, success criteria, and token budget

### Step 2: Schedule the Task via PowerShell (Run as Administrator)

```powershell
# ═══════════════════════════════════════════════════════════════════
# SCHEDULED TASK SETUP SCRIPT
# Run this in PowerShell as Administrator
# ═══════════════════════════════════════════════════════════════════

# Configuration - EDIT THESE VALUES
$TaskName = "SplitLease-YourTaskName"
$ScheduledTime = "2026-01-31 03:00:00"  # Format: YYYY-MM-DD HH:MM:SS
$PromptFileName = "20260130-your-task-prompt.md"  # File in .claude/plans/New/
$MaxRuntime = 2  # Hours

# Create the action
$Action = New-ScheduledTaskAction -Execute "C:\Users\Split Lease\bulk-task-runner.bat" -Argument $PromptFileName

# Create the trigger
$Trigger = New-ScheduledTaskTrigger -Once -At $ScheduledTime

# Create settings with CRITICAL options:
# - WakeToRun: Wakes computer from sleep to run the task
# - AllowStartIfOnBatteries: Runs even on battery power
# - DontStopIfGoingOnBatteries: Doesn't stop if switching to battery
# - StartWhenAvailable: Runs ASAP if scheduled time was missed
# - ExecutionTimeLimit: Maximum runtime before task is killed
$Settings = New-ScheduledTaskSettingsSet `
    -WakeToRun `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Hours $MaxRuntime)

# Register the task
Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $Action `
    -Trigger $Trigger `
    -Settings $Settings `
    -Force

Write-Host "Task '$TaskName' scheduled for $ScheduledTime"
Write-Host "Will wake computer from sleep: YES"
Write-Host "Maximum runtime: $MaxRuntime hours"
```

### Step 3: Verify the Task

```powershell
# Check task details
Get-ScheduledTask -TaskName "SplitLease-YourTaskName" | Format-List *

# Check task settings
Get-ScheduledTask -TaskName "SplitLease-YourTaskName" |
    Select-Object -ExpandProperty Settings |
    Select-Object WakeToRun, AllowStartIfOnBatteries, StartWhenAvailable, ExecutionTimeLimit

# Check next run time
Get-ScheduledTask -TaskName "SplitLease-YourTaskName" |
    Get-ScheduledTaskInfo |
    Select-Object NextRunTime, LastRunTime, LastTaskResult
```

---

## Critical Settings Explained

| Setting | Value | Purpose |
|---------|-------|---------|
| `WakeToRun` | `$true` | **CRITICAL** - Wakes computer from sleep/hibernate to run |
| `AllowStartIfOnBatteries` | `$true` | Runs even when on battery power (laptops) |
| `DontStopIfGoingOnBatteries` | `$true` | Doesn't kill task if unplugged during execution |
| `StartWhenAvailable` | `$true` | Runs immediately when computer wakes if time was missed |
| `ExecutionTimeLimit` | `2 hours` | Prevents runaway tasks; adjust based on expected runtime |

---

## Monitoring & Logs

### Log Locations

| File | Purpose |
|------|---------|
| `.claude/logs/scheduled-task-YYYYMMDD-HHMMSS.log` | Orchestrator log (start, end, errors) |
| `.claude/logs/scheduled-task-output-YYYYMMDD-HHMMSS.txt` | Full Claude Code output |

### Check Task Status

```powershell
# View recent task runs
Get-ScheduledTask -TaskName "SplitLease-*" |
    Get-ScheduledTaskInfo |
    Format-Table TaskName, LastRunTime, LastTaskResult, NextRunTime

# Common result codes:
# 0 (0x0) = Success
# 267009 (0x41301) = Task is currently running
# 267011 (0x41303) = Task has not yet run
# 267014 (0x41306) = Task terminated by user
```

### View Logs

```powershell
# View most recent log
Get-ChildItem ".claude\logs\scheduled-task-*.log" |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1 |
    Get-Content

# View most recent output
Get-ChildItem ".claude\logs\scheduled-task-output-*.txt" |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1 |
    Get-Content
```

---

## Troubleshooting

### Task Didn't Run

1. **Computer was asleep and `WakeToRun` was not enabled**
   ```powershell
   $Task = Get-ScheduledTask -TaskName "YourTaskName"
   $Task.Settings.WakeToRun = $true
   Set-ScheduledTask -InputObject $Task
   ```

2. **BIOS doesn't support wake timers**
   - Check BIOS settings for "Wake on RTC" or "Wake Timers"
   - Some older systems don't support this feature

3. **Task requires user to be logged in**
   - The default setup uses current user credentials
   - For unattended operation, consider using SYSTEM account (requires admin)

### Claude Code Errors

1. **"claude" command not found**
   - Ensure Claude Code is installed: `npm install -g @anthropic-ai/claude-code`
   - Verify PATH includes Claude: `where claude`

2. **Permission errors**
   - The `--dangerously-skip-permissions` flag should bypass most prompts
   - Check that the working directory is trusted

3. **API errors**
   - Check internet connectivity
   - Verify API key is configured in environment

### Output Issues

1. **Empty output file**
   - Check the log file for errors
   - Prompt may have syntax issues (unclosed quotes, etc.)

2. **Task runs but no database changes**
   - Check Claude output for error messages
   - Verify MCP tools are configured correctly

---

## Quick Reference: Schedule a New Task

```powershell
# ONE-LINER: Schedule task for tonight at 3 AM
$Action = New-ScheduledTaskAction -Execute "C:\Users\Split Lease\bulk-task-runner.bat" -Argument "your-prompt.md"
$Trigger = New-ScheduledTaskTrigger -Once -At "03:00"
$Settings = New-ScheduledTaskSettingsSet -WakeToRun -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 2)
Register-ScheduledTask -TaskName "SplitLease-YourTask" -Action $Action -Trigger $Trigger -Settings $Settings -Force
```

---

## Files Checklist

Before scheduling, ensure these files exist:

- [ ] `C:\Users\Split Lease\bulk-task-runner.bat` - Launcher batch file
- [ ] `.claude\scripts\scheduled-task-runner.ps1` - PowerShell orchestrator
- [ ] `.claude\plans\New\<your-prompt>.md` - Execution prompt
- [ ] `.claude\logs\` directory exists (created automatically)

---

## Example: Complete Setup for a New Task

```powershell
# 1. Create prompt file (do this manually or via Claude)
# Save to: .claude/plans/New/20260131030000-my-bulk-task-prompt.md

# 2. Schedule the task (Run as Administrator)
$Action = New-ScheduledTaskAction -Execute "C:\Users\Split Lease\bulk-task-runner.bat" -Argument "20260131030000-my-bulk-task-prompt.md"
$Trigger = New-ScheduledTaskTrigger -Once -At "2026-01-31 03:00:00"
$Settings = New-ScheduledTaskSettingsSet -WakeToRun -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 2)
Register-ScheduledTask -TaskName "SplitLease-MyBulkTask" -Action $Action -Trigger $Trigger -Settings $Settings -Force

# 3. Verify
Get-ScheduledTask -TaskName "SplitLease-MyBulkTask" | Get-ScheduledTaskInfo

# 4. (Optional) Run immediately to test
Start-ScheduledTask -TaskName "SplitLease-MyBulkTask"

# 5. Check results
Get-Content ".claude\logs\scheduled-task-*.log" | Select-Object -Last 50
```

---

**Version:** 1.0
**Last Updated:** 2026-01-30
**Tested On:** Windows 11, Claude Code CLI
