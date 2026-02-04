# Scheduled Bulk Pricing-List Recalculation
# Triggered by Windows Task Scheduler at 18:00 EST on 2026-02-03

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$LogDir = Join-Path $ScriptDir "logs"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

# Ensure log directory exists
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

$SchedulerLog = Join-Path $LogDir "scheduler-$Timestamp.log"

function Log {
    param([string]$Message)
    $Line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message"
    Add-Content -Path $SchedulerLog -Value $Line
    Write-Host $Line
}

Log "=== SCHEDULED BULK PRICING-LIST RECALCULATION STARTED ==="
Log "Project Root: $ProjectRoot"

# Load environment from .env file
$EnvFile = Join-Path $ProjectRoot ".env"
if (Test-Path $EnvFile) {
    Log "Loading environment from .env"
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim().Trim('"').Trim("'")
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
} else {
    Log "ERROR: .env file not found at $EnvFile"
    exit 1
}

# Verify required environment variables
$RequiredVars = @(
    "SUPABASE_URL_DEV",
    "SUPABASE_SERVICE_ROLE_KEY_DEV",
    "SUPABASE_URL_PROD",
    "SUPABASE_SERVICE_ROLE_KEY_PROD"
)

foreach ($var in $RequiredVars) {
    if (-not [Environment]::GetEnvironmentVariable($var, "Process")) {
        Log "ERROR: Missing required environment variable: $var"
        exit 1
    }
}

Log "Environment variables verified"

# ============================================
# PHASE 1: DEV EXECUTION
# ============================================
Log ""
Log "=== PHASE 1: DEV EXECUTION ==="

$env:SUPABASE_URL = [Environment]::GetEnvironmentVariable("SUPABASE_URL_DEV", "Process")
$env:SUPABASE_SERVICE_ROLE_KEY = [Environment]::GetEnvironmentVariable("SUPABASE_SERVICE_ROLE_KEY_DEV", "Process")
$env:LOG_FILE = Join-Path $LogDir "pricing-list-bulk-dev-$Timestamp.log"
$env:RATE_DELAY_MS = "150"
$env:MAX_RETRIES = "5"
$env:CONCURRENCY = "3"

Log "DEV URL: $env:SUPABASE_URL"
Log "DEV Log: $env:LOG_FILE"

$BulkScript = Join-Path $ScriptDir "pricing-list-bulk-recalc.mjs"

try {
    Log "Starting DEV bulk recalculation..."
    $DevResult = & node $BulkScript 2>&1
    $DevExitCode = $LASTEXITCODE

    if ($DevExitCode -ne 0) {
        Log "ERROR: DEV bulk recalculation failed with exit code $DevExitCode"
        Log "Output: $DevResult"
        Log "ABORTING: Will not proceed to PROD"
        exit 1
    }

    Log "DEV bulk recalculation completed successfully"
} catch {
    Log "ERROR: DEV execution exception: $_"
    exit 1
}

# ============================================
# PHASE 2: PROD EXECUTION
# ============================================
Log ""
Log "=== PHASE 2: PROD EXECUTION ==="

$env:SUPABASE_URL = [Environment]::GetEnvironmentVariable("SUPABASE_URL_PROD", "Process")
$env:SUPABASE_SERVICE_ROLE_KEY = [Environment]::GetEnvironmentVariable("SUPABASE_SERVICE_ROLE_KEY_PROD", "Process")
$env:LOG_FILE = Join-Path $LogDir "pricing-list-bulk-prod-$Timestamp.log"

Log "PROD URL: $env:SUPABASE_URL"
Log "PROD Log: $env:LOG_FILE"

try {
    Log "Starting PROD bulk recalculation..."
    $ProdResult = & node $BulkScript 2>&1
    $ProdExitCode = $LASTEXITCODE

    if ($ProdExitCode -ne 0) {
        Log "ERROR: PROD bulk recalculation failed with exit code $ProdExitCode"
        Log "Output: $ProdResult"
        exit 1
    }

    Log "PROD bulk recalculation completed successfully"
} catch {
    Log "ERROR: PROD execution exception: $_"
    exit 1
}

# ============================================
# COMPLETION
# ============================================
Log ""
Log "=== BULK RECALCULATION COMPLETE ==="
Log "DEV Log: $(Join-Path $LogDir "pricing-list-bulk-dev-$Timestamp.log")"
Log "PROD Log: $(Join-Path $LogDir "pricing-list-bulk-prod-$Timestamp.log")"
Log "Scheduler Log: $SchedulerLog"

exit 0
