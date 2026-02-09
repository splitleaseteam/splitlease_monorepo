# Dot-notation replacement script for listing property access patterns
# This replaces .Name, .Description, .Active, .Deleted, .Complete on listing objects
# with their new column names from the DB migration.

$srcDir = "C:\Users\Split Lease\Documents\splitlease\app\src"

# Files to skip (already updated or should not be changed)
$excludeNames = @(
    'listingDataFetcher.js',
    'listingService.js',
    'supabaseUtils.js',
    'useSearchPageLogic.js',
    'fieldMappings.js',
    'useLoggedInAvatarData.js',
    'dataLookups.js',
    'useListingData.js',
    'FavoriteListingsPage.jsx',
    'PreviewSplitLeasePage.jsx',
    'useHostOverviewPageLogic.js',
    '_dot_replace.ps1'
)

# Also skip the ViewSplitLeasePage_LEGACY since we updated it above
# Actually we did update it above, so add it to exclude
$excludeNames += 'mockListing.js'

$modifiedFiles = @()

# Get all source files
$files = Get-ChildItem -Path $srcDir -Recurse -Include @('*.js', '*.jsx', '*.ts', '*.tsx') |
    Where-Object { $excludeNames -notcontains $_.Name }

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    $original = $content

    # ===== listing.Name -> listing.listing_title =====
    # Match patterns like listing.Name, listingData.Name, dbListing.Name
    # But NOT: amenity.Name, rule.Name, safety.Name, type.Name, item.Name, member.Name,
    #          policy.Name, reason.Name, option.Name, borough.Name, neighborhood.Name,
    #          category.Name, t.Name (template), r.Name (rule), a.Name (amenity), s.Name (safety)
    # We target: listing.Name, listingData.Name, dbListing.Name, and objects known to be listings

    # listing.Name -> listing.listing_title
    $content = $content -replace '(?<!\w)listing\.Name\b', 'listing.listing_title'

    # listingData.Name -> listingData.listing_title
    $content = $content -replace '(?<!\w)listingData\.Name\b', 'listingData.listing_title'

    # dbListing.Name -> dbListing.listing_title
    $content = $content -replace '(?<!\w)dbListing\.Name\b', 'dbListing.listing_title'

    # ===== listing.Description -> listing.listing_description =====
    $content = $content -replace '(?<!\w)listing\.Description\b', 'listing.listing_description'
    $content = $content -replace '(?<!\w)listingData\.Description\b', 'listingData.listing_description'
    $content = $content -replace '(?<!\w)dbListing\.Description\b', 'dbListing.listing_description'

    # ===== listing.Active -> listing.is_active =====
    $content = $content -replace '(?<!\w)listing\.Active\b', 'listing.is_active'
    $content = $content -replace '(?<!\w)listingData\.Active\b', 'listingData.is_active'
    $content = $content -replace '(?<!\w)dbListing\.Active\b', 'dbListing.is_active'

    # ===== listing.Deleted -> listing.is_deleted =====
    $content = $content -replace '(?<!\w)listing\.Deleted\b', 'listing.is_deleted'
    $content = $content -replace '(?<!\w)listingData\.Deleted\b', 'listingData.is_deleted'
    $content = $content -replace '(?<!\w)dbListing\.Deleted\b', 'dbListing.is_deleted'

    # ===== listing.Complete -> listing.is_listing_profile_complete =====
    $content = $content -replace '(?<!\w)listing\.Complete\b', 'listing.is_listing_profile_complete'
    $content = $content -replace '(?<!\w)listingData\.Complete\b', 'listingData.is_listing_profile_complete'
    $content = $content -replace '(?<!\w)dbListing\.Complete\b', 'dbListing.is_listing_profile_complete'

    if ($content -ne $original) {
        [System.IO.File]::WriteAllText($file.FullName, $content)
        $modifiedFiles += $file.FullName
        Write-Host "Modified: $($file.FullName)"
    }
}

Write-Host "`n===== SUMMARY ====="
Write-Host "Total files modified: $($modifiedFiles.Count)"
foreach ($f in $modifiedFiles) {
    Write-Host "  $f"
}
