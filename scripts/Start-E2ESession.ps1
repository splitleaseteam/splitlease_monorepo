<#
.SYNOPSIS
    Initialize an E2E testing orchestration session for Split Lease.

.DESCRIPTION
    This script:
    1. Creates the test-session directory structure
    2. Initializes session configuration and state
    3. Verifies dev server is running
    4. Outputs the orchestration command to run

.PARAMETER TestFlow
    The test flow to execute: 'guest-proposal', 'host-listing', or 'full-suite'
    Default: 'guest-proposal'

.PARAMETER MaxTimeMinutes
    Maximum time budget in minutes
    Default: 30

.PARAMETER MaxIterations
    Maximum orchestration loop iterations
    Default: 10

.PARAMETER SkipDevServerCheck
    Skip the dev server availability check
    Default: false

.EXAMPLE
    .\Start-E2ESession.ps1

.EXAMPLE
    .\Start-E2ESession.ps1 -TestFlow "guest-proposal" -MaxTimeMinutes 45 -MaxIterations 15

.NOTES
    Run from the project root directory.
    Requires: PowerShell 7+, Node.js/Bun, Claude Code CLI
#>

[CmdletBinding()]
param(
    [Parameter()]
    [ValidateSet('guest-proposal', 'host-listing', 'full-suite')]
    [string]$TestFlow = 'guest-proposal',

    [Parameter()]
    [ValidateRange(5, 120)]
    [int]$MaxTimeMinutes = 30,

    [Parameter()]
    [ValidateRange(1, 50)]
    [int]$MaxIterations = 10,

    [Parameter()]
    [switch]$SkipDevServerCheck
)

# ============================================================================
# Configuration
# ============================================================================

$ProjectRoot = Get-Location
$TestSessionDir = Join-Path $ProjectRoot "test-session"
$SessionId = "e2e-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$ScreenshotDir = Join-Path (Join-Path $TestSessionDir "screenshots") $SessionId

# ============================================================================
# Functions
# ============================================================================

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host ("=" * 70) -ForegroundColor Cyan
    Write-Host " $Message" -ForegroundColor Cyan
    Write-Host ("=" * 70) -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step {
    param([string]$Step, [string]$Message)
    Write-Host "[$Step] " -ForegroundColor Yellow -NoNewline
    Write-Host $Message
}

function Test-DevServer {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        return $response.StatusCode -eq 200
    }
    catch {
        return $false
    }
}

# ============================================================================
# Main Execution
# ============================================================================

Write-Header "E2E Testing Orchestration - Session Initialization"

# Step 1: Create directory structure
Write-Step "1/5" "Creating session directory structure..."

if (-not (Test-Path $TestSessionDir)) {
    New-Item -ItemType Directory -Path $TestSessionDir -Force | Out-Null
}

if (-not (Test-Path $ScreenshotDir)) {
    New-Item -ItemType Directory -Path $ScreenshotDir -Force | Out-Null
}

Write-Host "       Created: $ScreenshotDir" -ForegroundColor DarkGray

# Step 2: Create configuration
Write-Step "2/5" "Generating session configuration..."

$config = @{
    budget = @{
        maxTimeMinutes = $MaxTimeMinutes
        maxIterations = $MaxIterations
        maxBugsToFix = 5
    }
    scope = @{
        testFlow = $TestFlow
        startFromStep = $null
        skipSteps = @()
    }
    exitConditions = @{
        stopOnFirstBug = $false
        requireCleanRun = $true
        maxConsecutiveFailures = 3
    }
    dataReset = @{
        enabled = $true
        preserveTestAccounts = $true
        cleanupProposals = $true
    }
}

$configPath = Join-Path $TestSessionDir "config.json"
$config | ConvertTo-Json -Depth 4 | Set-Content -Path $configPath -Encoding UTF8

Write-Host "       Config: $configPath" -ForegroundColor DarkGray

# Step 3: Initialize state
Write-Step "3/5" "Initializing session state..."

$state = @{
    session = @{
        id = $SessionId
        startedAt = (Get-Date -Format "o")
        endedAt = $null
        status = "initialized"
    }
    progress = @{
        currentIteration = 0
        currentPhase = "initialization"
        currentStep = "environment_verification"
        completedSteps = @()
        lastScreenshot = $null
    }
    bugs = @{
        found = @()
        fixed = @()
        pending = @()
        wontFix = @()
    }
    metrics = @{
        elapsedMinutes = 0
        testsRun = 0
        testsPassed = 0
        testsFailed = 0
        fixAttempts = 0
        dataResets = 0
    }
}

$statePath = Join-Path $TestSessionDir "state.json"
$state | ConvertTo-Json -Depth 4 | Set-Content -Path $statePath -Encoding UTF8

Write-Host "       State: $statePath" -ForegroundColor DarkGray

# Step 4: Check dev server
Write-Step "4/5" "Checking dev server status..."

if (-not $SkipDevServerCheck) {
    if (Test-DevServer) {
        Write-Host "       Dev server is running at http://localhost:8000" -ForegroundColor Green
    }
    else {
        Write-Host "       WARNING: Dev server not responding at http://localhost:8000" -ForegroundColor Yellow
        Write-Host "       Run 'bun run dev' in the app/ directory first." -ForegroundColor Yellow
        Write-Host ""
        $continue = Read-Host "       Continue anyway? (y/N)"
        if ($continue -ne 'y') {
            Write-Host "Aborted. Start the dev server and try again." -ForegroundColor Red
            exit 1
        }
    }
}
else {
    Write-Host "       Skipped (--SkipDevServerCheck)" -ForegroundColor DarkGray
}

# Step 5: Output orchestration command
Write-Step "5/5" "Session initialized successfully!"

Write-Host ""
Write-Host ("=" * 70) -ForegroundColor Green
Write-Host " SESSION READY" -ForegroundColor Green
Write-Host ("=" * 70) -ForegroundColor Green
Write-Host ""
Write-Host "Session ID:    $SessionId"
Write-Host "Test Flow:     $TestFlow"
Write-Host "Time Budget:   $MaxTimeMinutes minutes"
Write-Host "Max Iterations: $MaxIterations"
Write-Host "Screenshots:   $ScreenshotDir"
Write-Host ""
Write-Host "To start the E2E orchestration, run:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  claude '/e2e-testing-orchestrator'" -ForegroundColor White
Write-Host ""
Write-Host "Or with explicit session path:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  claude 'Run E2E testing orchestration with session at $TestSessionDir'" -ForegroundColor White
Write-Host ""
Write-Host ("=" * 70) -ForegroundColor Green
