# Investigation: Listing Not Appearing in Create Suggested Proposal Dropdown

**Date**: 2026-02-04
**Page**: `localhost:3000/_create-suggested-proposal`
**Missing Listing**: "Charming 1-Bedroom in Trendy Manhattan - WEEKLY"
**Listing ID**: `1770159292555x84785333838911712`

---

## Summary

The Create Suggested Proposal page uses **two different queries** for the listing dropdown, with **different filtering criteria** between them:

1. **Default Listings (empty search)** - Applies strict pricing validation
2. **Search Results (when user types)** - No pricing validation

This asymmetry means a listing can appear when searched by name/ID but NOT appear in the default dropdown.

---

## Filtering Logic Analysis

### File Location
`c:\Users\Split Lease\Documents\Split Lease\app\src\islands\pages\CreateSuggestedProposalPage\suggestedProposalService.js`

### getDefaultListings() - Lines 96-117

When the search box is **empty or first focused**, this function is called:

```javascript
export async function getDefaultListings() {
  const { data, error } = await supabase
    .from('listing')
    .select(LISTING_SELECT_FIELDS)
    .eq('Deleted', false)        // Filter 1: Not deleted
    .eq('Active', true)          // Filter 2: Must be active
    .not('rental type', 'is', null)  // Filter 3: Must have rental type
    .order('Modified Date', { ascending: false })
    .limit(50);

  // CRITICAL: Client-side filter for valid pricing
  const validListings = (data || []).filter(hasValidPricing);

  return { data: validListings.slice(0, 20), error: null };
}
```

**Database Filters Applied:**
- `Deleted = false`
- `Active = true`
- `rental type IS NOT NULL`

**Client-Side Filter Applied:**
- `hasValidPricing()` function (see below)

### searchListings() - Lines 122-138

When the user **types a search term**, this function is called:

```javascript
export async function searchListings(searchTerm) {
  const { data, error } = await supabase
    .from('listing')
    .select(LISTING_SELECT_FIELDS)
    .eq('Deleted', false)        // Filter 1: Not deleted
    .eq('Active', true)          // Filter 2: Must be active
    .or(`Name.ilike.%${searchTerm}%,host name.ilike.%${searchTerm}%,Host email.ilike.%${searchTerm}%,_id.ilike.%${searchTerm}%,rental type.ilike.%${searchTerm}%`)
    .limit(20);

  return { data: data || [], error: null };
}
```

**Database Filters Applied:**
- `Deleted = false`
- `Active = true`
- Search term matches: Name, host name, Host email, _id, or rental type

**Client-Side Filter Applied:**
- **NONE** - No pricing validation!

---

## Pricing Validation Function

```javascript
function hasValidPricing(listing) {
  const rentalType = listing['rental type'];
  if (!rentalType) return false;

  if (rentalType === 'Monthly') {
    return !!listing['monthly_host_rate'] && listing['monthly_host_rate'] > 0;
  }
  if (rentalType === 'Weekly') {
    return !!listing['weekly_host_rate'] && listing['weekly_host_rate'] > 0;
  }
  // Nightly - check if any nightly rate is set
  return !!(
    listing['nightly_rate_2_nights'] ||
    listing['nightly_rate_3_nights'] ||
    listing['nightly_rate_4_nights'] ||
    listing['nightly_rate_5_nights'] ||
    listing['nightly_rate_6_nights'] ||
    listing['nightly_rate_7_nights']
  );
}
```

---

## Root Cause: Why "WEEKLY" Listing May Not Appear

Based on the listing name "Charming 1-Bedroom in Trendy Manhattan - **WEEKLY**", there are two likely scenarios:

### Scenario A: Missing `weekly_host_rate`

If the listing has:
- `rental type` = "Weekly"
- BUT `weekly_host_rate` is `null`, `0`, or empty

Then `hasValidPricing()` returns `false` and the listing is filtered out from default results.

### Scenario B: `rental type` Field Mismatch

If the listing has:
- `rental type` is `null` (the field is not set at all)
- OR `rental type` doesn't exactly match "Weekly" (case-sensitive check!)

Then:
- For default listings: filtered out by `.not('rental type', 'is', null)`
- For search: may still appear if searching by name

---

## Why It Appears in Search But Not Default

The `searchListings()` function **does not call `hasValidPricing()`**, so:

1. If you search for "WEEKLY" or the listing name, it will appear
2. If you don't search (empty box), it gets filtered out by pricing validation

This is the **asymmetry bug** - the two code paths have different filtering criteria.

---

## Verification Steps

To confirm the root cause for listing `1770159292555x84785333838911712`:

1. **Check `rental type` field**:
   ```sql
   SELECT _id, "Name", "rental type", weekly_host_rate, monthly_host_rate,
          nightly_rate_2_nights, nightly_rate_3_nights, nightly_rate_4_nights,
          nightly_rate_5_nights, nightly_rate_6_nights, nightly_rate_7_nights
   FROM listing
   WHERE _id = '1770159292555x84785333838911712';
   ```

2. **Check if it passes hasValidPricing**:
   - If `rental type` = "Weekly", then `weekly_host_rate` must be > 0
   - If `rental type` = "Monthly", then `monthly_host_rate` must be > 0
   - If `rental type` = anything else (or null), then at least one nightly rate must be set

---

## Potential Issues to Fix

### Issue 1: Inconsistent Filtering (Bug)
The `searchListings()` function should probably also apply `hasValidPricing()` for consistency. Currently, users can select a listing via search that has no valid pricing, which will cause issues in the pricing calculation step.

### Issue 2: Data Quality
The listing's pricing fields may not be properly populated for its rental type.

### Issue 3: Case Sensitivity
The `hasValidPricing()` function checks `rentalType === 'Weekly'` (case-sensitive). If the database has "weekly" or "WEEKLY", it won't match.

---

## Files Referenced

| File | Purpose |
|------|---------|
| `app/src/islands/pages/CreateSuggestedProposalPage/CreateSuggestedProposalPage.jsx` | Main page component |
| `app/src/islands/pages/CreateSuggestedProposalPage/useCreateSuggestedProposalLogic.js` | Page logic hook |
| `app/src/islands/pages/CreateSuggestedProposalPage/suggestedProposalService.js` | **Key file**: Contains `getDefaultListings()`, `searchListings()`, and `hasValidPricing()` |
| `app/src/islands/pages/CreateSuggestedProposalPage/components/ListingSearch.jsx` | Presentational component for dropdown |

---

## Recommended Actions

1. **Verify the specific listing's data** in Supabase to confirm which pricing field is missing
2. **Decide on filtering behavior**: Should `searchListings()` also validate pricing?
3. **Consider case-insensitive rental type comparison** in `hasValidPricing()`
4. **Fix the data** if the listing should have valid pricing but doesn't
