# Bulk Pricing List Fix - Scheduled Runner
# Scheduled for: 2026-01-30 04:00:00 EST
# Token Budget: 15,000,000

$ErrorActionPreference = "Continue"
$LogFile = "C:\Users\Split Lease\My Drive\!Agent Context and Tools\SL3\Split Lease\.claude\logs\bulk-pricing-fix-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

# Ensure log directory exists
$LogDir = Split-Path $LogFile -Parent
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

function Write-Log {
    param($Message)
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = "[$Timestamp] $Message"
    Write-Host $LogMessage
    Add-Content -Path $LogFile -Value $LogMessage
}

Write-Log "=========================================="
Write-Log "BULK PRICING LIST FIX - STARTING"
Write-Log "=========================================="

# Change to project directory
$ProjectDir = "C:\Users\Split Lease\My Drive\!Agent Context and Tools\SL3\Split Lease"
Set-Location $ProjectDir
Write-Log "Working directory: $ProjectDir"

# Read the execution prompt
$PromptFile = ".\.claude\plans\New\20260129231500-bulk-pricing-list-execution-prompt.md"
Write-Log "Reading prompt from: $PromptFile"

# Extract just the prompt section (between the triple backticks)
$PromptContent = Get-Content $PromptFile -Raw
$PromptStart = $PromptContent.IndexOf("``````") + 3
$PromptEnd = $PromptContent.LastIndexOf("``````")
$ExecutionPrompt = $PromptContent.Substring($PromptStart, $PromptEnd - $PromptStart).Trim()

# Save prompt to temp file for claude to read
$TempPromptFile = "$env:TEMP\bulk-pricing-fix-prompt.txt"
$ExecutionPrompt | Out-File -FilePath $TempPromptFile -Encoding UTF8
Write-Log "Prompt saved to: $TempPromptFile"

# Run Claude Code with the prompt
Write-Log "Launching Claude Code..."
Write-Log "Token Budget: 15,000,000"

try {
    # Use claude command with prompt from file
    # The --dangerously-skip-permissions flag allows autonomous operation
    $Result = & claude --dangerously-skip-permissions --print "$ExecutionPrompt" 2>&1

    Write-Log "Claude Code execution completed"
    Write-Log "Output length: $($Result.Length) characters"

    # Save full output to log
    $OutputFile = "C:\Users\Split Lease\My Drive\!Agent Context and Tools\SL3\Split Lease\.claude\logs\bulk-pricing-fix-output-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"
    $Result | Out-File -FilePath $OutputFile -Encoding UTF8
    Write-Log "Full output saved to: $OutputFile"
}
catch {
    Write-Log "ERROR: $($_.Exception.Message)"
    Write-Log "Stack trace: $($_.ScriptStackTrace)"
}

Write-Log "=========================================="
Write-Log "BULK PRICING LIST FIX - FINISHED"
Write-Log "=========================================="

# Cleanup temp file
Remove-Item $TempPromptFile -ErrorAction SilentlyContinue
