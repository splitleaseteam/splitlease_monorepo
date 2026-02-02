# Query proposals for terrencegrey@test.com
# Load environment from .env file
$envFile = Join-Path $PSScriptRoot "..\..\..\.env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^\s*([^#][^=]+)=(.*)$") {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            # Remove quotes if present
            if ($value -match '^[''"](.*)[''""]$') {
                $value = $matches[1]
            }
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
    Write-Host "Loaded environment from .env" -ForegroundColor Gray
}

$serviceKey = [Environment]::GetEnvironmentVariable("SUPABASE_SERVICE_KEY_DEV", "Process")
if (-not $serviceKey) {
    $serviceKey = [Environment]::GetEnvironmentVariable("SUPABASE_SERVICE_ROLE_KEY", "Process")
}
if (-not $serviceKey) {
    $serviceKey = [Environment]::GetEnvironmentVariable("VITE_SUPABASE_SERVICE_ROLE_KEY", "Process")
}

$baseUrl = "https://qzsmhgyojmwvtjmnrdea.supabase.co/rest/v1"

if (-not $serviceKey) {
    Write-Host "ERROR: Could not find Supabase service key in .env" -ForegroundColor Red
    Write-Host "Checked: SUPABASE_SERVICE_KEY_DEV, SUPABASE_SERVICE_ROLE_KEY, VITE_SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Yellow
    exit 1
}

Write-Host "Service key found (first 10 chars): $($serviceKey.Substring(0, [Math]::Min(10, $serviceKey.Length)))..." -ForegroundColor Gray

$headers = @{
    'apikey' = $serviceKey
    'Authorization' = "Bearer $serviceKey"
    'Content-Type' = 'application/json'
}

# Query 1: Get guest user ID
Write-Host "`n=== Query 1: User Profile for terrencegrey@test.com ===" -ForegroundColor Cyan
$url1 = "$baseUrl/user_profile?email=eq.terrencegrey@test.com&select=id,email,full_name"
try {
    $user = Invoke-RestMethod -Uri $url1 -Headers $headers -Method Get
    $user | ConvertTo-Json -Depth 10
    if ($user.Count -gt 0) {
        $guestId = $user[0].id
        Write-Host "`nGuest ID: $guestId" -ForegroundColor Green
    } else {
        Write-Host "No user found with that email" -ForegroundColor Yellow
        exit 0
    }
} catch {
    Write-Host "Error querying user_profile: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Query 2: Get recent proposals for this guest
Write-Host "`n=== Query 2: Recent Proposals for Guest ===" -ForegroundColor Cyan
$url2 = "$baseUrl/proposal?guest_id=eq.$guestId&select=id,status,guest_id,host_id,listing_id,created_at,updated_at&order=created_at.desc&limit=10"
try {
    $proposals = Invoke-RestMethod -Uri $url2 -Headers $headers -Method Get
    $proposals | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error querying proposals: $($_.Exception.Message)" -ForegroundColor Red
}
