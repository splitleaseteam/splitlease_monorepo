# sanitize-query-logs.ps1
# Sanitizes sensitive information from query logs before committing
# Run this before `git add` on query-logs directory

param(
    [switch]$DryRun,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"
$LogDir = Join-Path $PSScriptRoot "..\query-logs"

# Patterns to sanitize (regex => replacement)
$SanitizePatterns = @(
    # Slack webhook URLs
    @{
        Pattern = 'https://hooks\.slack\.com/services/[A-Z0-9]+/[A-Z0-9]+/[A-Za-z0-9]+'
        Replacement = 'https://hooks.slack.com/services/REDACTED/REDACTED/REDACTED'
        Description = 'Slack Webhook URL'
    },
    # Gmail addresses (preserve + alias structure but redact)
    @{
        Pattern = '[a-zA-Z0-9._%+-]+@gmail\.com'
        Replacement = 'redacted@example.com'
        Description = 'Gmail Address'
    },
    # Generic API keys (sk-*, key_*, etc.)
    @{
        Pattern = '(sk-[a-zA-Z0-9]{20,}|key_[a-zA-Z0-9]{20,})'
        Replacement = 'REDACTED_API_KEY'
        Description = 'API Key'
    },
    # Bearer tokens
    @{
        Pattern = 'Bearer\s+[A-Za-z0-9\-_.]+'
        Replacement = 'Bearer REDACTED_TOKEN'
        Description = 'Bearer Token'
    },
    # Supabase anon/service keys (eyJ... JWT format, long ones)
    @{
        Pattern = 'eyJ[A-Za-z0-9_-]{100,}'
        Replacement = 'REDACTED_JWT_TOKEN'
        Description = 'JWT Token'
    }
)

function Write-Status {
    param([string]$Message, [string]$Color = "White")
    if ($Verbose -or $Color -eq "Yellow" -or $Color -eq "Green") {
        Write-Host $Message -ForegroundColor $Color
    }
}

# Get all JSON files in query-logs
$JsonFiles = Get-ChildItem -Path $LogDir -Filter "*.json" -ErrorAction SilentlyContinue

if (-not $JsonFiles) {
    Write-Status "No JSON files found in $LogDir" "Yellow"
    exit 0
}

$TotalSanitized = 0
$FilesModified = @()

foreach ($File in $JsonFiles) {
    $Content = Get-Content -Path $File.FullName -Raw
    $OriginalContent = $Content
    $FileModified = $false

    foreach ($Rule in $SanitizePatterns) {
        $Matches = [regex]::Matches($Content, $Rule.Pattern)

        if ($Matches.Count -gt 0) {
            foreach ($Match in $Matches) {
                # Skip if already redacted
                if ($Match.Value -match 'REDACTED') { continue }

                Write-Status "  Found $($Rule.Description): $($Match.Value.Substring(0, [Math]::Min(30, $Match.Value.Length)))..." "Yellow"
                $TotalSanitized++
                $FileModified = $true
            }

            $Content = [regex]::Replace($Content, $Rule.Pattern, $Rule.Replacement)
        }
    }

    if ($FileModified) {
        $FilesModified += $File.Name

        if (-not $DryRun) {
            Set-Content -Path $File.FullName -Value $Content -NoNewline
            Write-Status "Sanitized: $($File.Name)" "Green"
        } else {
            Write-Status "[DRY RUN] Would sanitize: $($File.Name)" "Cyan"
        }
    }
}

# Summary
Write-Host ""
if ($TotalSanitized -eq 0) {
    Write-Host "No sensitive data found. Logs are clean." -ForegroundColor Green
} else {
    if ($DryRun) {
        Write-Host "[DRY RUN] Would sanitize $TotalSanitized item(s) in $($FilesModified.Count) file(s)" -ForegroundColor Cyan
    } else {
        Write-Host "Sanitized $TotalSanitized item(s) in $($FilesModified.Count) file(s)" -ForegroundColor Green
    }
}

exit 0
