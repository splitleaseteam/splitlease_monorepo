# Fix script: Restore lowercase property names that were incorrectly changed
# The previous script used case-insensitive regex, which also replaced:
#   listing.name -> listing.listing_title (WRONG - should stay listing.name)
#   listing.description -> listing.listing_description (WRONG - should stay listing.description)
#   listing.active -> listing.is_active (this one is OK - listing.active is also old, but let's verify)
#   listing.complete -> listing.is_listing_profile_complete (WRONG - should stay listing.complete)
#   listing.deleted -> listing.is_deleted (WRONG - should stay listing.deleted)
#   listingData.name -> listingData.listing_title (WRONG)
#   listingData.complete -> listingData.is_listing_profile_complete (WRONG)

$srcDir = "C:\Users\Split Lease\Documents\splitlease\app\src"

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
    '_fix_lowercase.ps1',
    '_dot_replace.ps1',
    'mockListing.js'
)

$modifiedFiles = @()

$files = Get-ChildItem -Path $srcDir -Recurse -Include @('*.js', '*.jsx', '*.ts', '*.tsx') |
    Where-Object { $excludeNames -notcontains $_.Name }

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    $original = $content

    # Restore listing.name (lowercase) - these are ALREADY transformed properties
    # Use case-sensitive regex via [regex]::Replace
    $content = [regex]::Replace($content, '(?<!\w)listing\.listing_title', {
        param($m)
        # Only restore if it was a lowercase .name that got replaced
        # We need to check what it replaced - but we can't know for sure
        # Instead, we'll use a different approach: find patterns where listing.listing_title
        # is used in a context that makes sense for lowercase .name
        $m.Value  # Don't change - we'll handle this manually
    })

    # Actually, the proper approach is to find places where listing.listing_title appears
    # in positions where listing.name (lowercase) should be.
    # But that's impossible to determine automatically.

    # A better approach: re-run the CORRECT (case-sensitive) replacements on the ORIGINAL code.
    # But we don't have the original code.

    # Best approach: Find specific problematic patterns and fix them

    # Pattern: X.listing_title || Y.listing_title  (duplicate - first should be .name)
    $content = [regex]::Replace($content,
        '(?<prefix>\w+)\.listing_title\s*\|\|\s*\1\.listing_title\b',
        '${prefix}.name || ${prefix}.listing_title')

    # Pattern: X.is_listing_profile_complete || X.is_listing_profile_complete (duplicate)
    $content = [regex]::Replace($content,
        '(?<prefix>\w+)\.is_listing_profile_complete\s*\|\|\s*\1\.is_listing_profile_complete\b',
        '${prefix}.complete || ${prefix}.is_listing_profile_complete')

    # Pattern: X.is_active || X.is_active (duplicate)
    $content = [regex]::Replace($content,
        '(?<prefix>\w+)\.is_active\s*\|\|\s*\1\.is_active\b',
        '${prefix}.active || ${prefix}.is_active')

    # Pattern: X.is_deleted || X.is_deleted (duplicate)
    $content = [regex]::Replace($content,
        '(?<prefix>\w+)\.is_deleted\s*\|\|\s*\1\.is_deleted\b',
        '${prefix}.deleted || ${prefix}.is_deleted')

    # Pattern: X.listing_description || X.listing_description (duplicate)
    $content = [regex]::Replace($content,
        '(?<prefix>\w+)\.listing_description\s*\|\|\s*\1\.listing_description\b',
        '${prefix}.description || ${prefix}.listing_description')

    if ($content -ne $original) {
        [System.IO.File]::WriteAllText($file.FullName, $content)
        $modifiedFiles += $file.FullName
        Write-Host "Fixed: $($file.FullName)"
    }
}

Write-Host "`n===== SUMMARY ====="
Write-Host "Total files fixed: $($modifiedFiles.Count)"
foreach ($f in $modifiedFiles) {
    Write-Host "  $f"
}
