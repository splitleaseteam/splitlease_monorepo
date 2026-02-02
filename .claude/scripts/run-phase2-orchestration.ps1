# Phase 2 Database Migration Orchestration Runner
# Scheduled execution script for 2026-01-29 8:00 PM EST

$ErrorActionPreference = "Stop"

# Configuration
$ProjectRoot = "c:\Users\Split Lease\My Drive (splitleaseteam@gmail.com)\_Agent Context and Tools\SL12\Split Lease"
$PlanFile = ".claude\plans\New\20260129-phase2-refactoring-orchestration-plan.md"
$LogFile = ".claude\logs\phase2-orchestration-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

# Ensure log directory exists
$LogDir = Join-Path $ProjectRoot ".claude\logs"
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

$FullLogPath = Join-Path $ProjectRoot $LogFile

# Log function
function Write-Log {
    param([string]$Message)
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = "[$Timestamp] $Message"
    Write-Host $LogMessage
    Add-Content -Path $FullLogPath -Value $LogMessage
}

Write-Log "=== Phase 2 Database Migration Orchestration Started ==="
Write-Log "Project Root: $ProjectRoot"
Write-Log "Plan File: $PlanFile"

# Change to project directory
Set-Location $ProjectRoot
Write-Log "Changed directory to: $(Get-Location)"

# Check if Claude Code is available
$ClaudeCmd = Get-Command "claude" -ErrorAction SilentlyContinue
if (-not $ClaudeCmd) {
    Write-Log "ERROR: Claude Code CLI not found in PATH"
    Write-Log "Please ensure Claude Code is installed and in PATH"
    exit 1
}

Write-Log "Claude Code CLI found: $($ClaudeCmd.Source)"

# Build the prompt for Claude Code
$Prompt = @"
Execute the Phase 2 database migration orchestration plan.

Plan location: $PlanFile

Follow the 5-stage pipeline:
1. STAGE 0: Pre-migration validation - Capture baseline with Playwright MCP
2. STAGE 1: Code migration - Update all tilde and emoji column references
3. STAGE 2: Database migration - Run SQL rename scripts on dev
4. STAGE 3: Verification - Run unit tests and E2E tests
5. STAGE 4: Debugging - Auto-fix any failures

Start with Stage 0 baseline capture. Use Playwright MCP for screenshots.
Report progress after each stage.
"@

Write-Log "Starting Claude Code with orchestration prompt..."
Write-Log "Prompt: $Prompt"

# Run Claude Code with the prompt
# Using --print to output to stdout for logging
try {
    $Output = & claude --print "$Prompt" 2>&1
    $Output | ForEach-Object { Write-Log $_ }
    Write-Log "=== Claude Code execution completed ==="
}
catch {
    Write-Log "ERROR: Claude Code execution failed"
    Write-Log "Error: $_"
    exit 1
}

Write-Log "=== Phase 2 Orchestration Script Finished ==="
