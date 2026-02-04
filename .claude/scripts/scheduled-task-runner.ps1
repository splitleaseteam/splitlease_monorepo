# Scheduled Task Runner for Claude Code
# Usage: .\scheduled-task-runner.ps1 [prompt-file-name]
# Example: .\scheduled-task-runner.ps1 "20260129231500-bulk-pricing-list-execution-prompt.md"
#
# This script orchestrates running Claude Code in non-interactive mode
# for scheduled tasks. It handles logging, error capture, and output saving.

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
