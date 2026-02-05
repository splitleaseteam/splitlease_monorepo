# AccountProfilePage: Deferred Bubble Fields

**Date**: 2026-02-05
**Scope**: 40 unique hardcoded Bubble field patterns
**Recommendation**: DEFER to app-wide `bubbleFieldMappings` migration

---

## Rationale

The 40 hardcoded Bubble-style field names in AccountProfilePage follow the same pattern used throughout the codebase. Refactoring these in isolation would:
1. Create inconsistency with other pages still using hardcoded fields
2. Require a central field mapping layer that doesn't yet exist
3. Not provide meaningful benefit until app-wide adoption

## Recommended Migration Strategy

When the team decides to centralize Bubble field mappings:

1. Create `app/src/lib/constants/bubbleFieldMappings.js`
2. Define semantic field names with Bubble equivalents
3. Create processor functions for read/write transformations
4. Migrate all pages simultaneously for consistency

## Field Categories

### User Identity Fields (7)
- `'Name - First'` / `'Name - Last'` / `'Name - Full'`
- `'Profile Photo'` / `'Cover Photo'`
- `'Email'` / `'Phone Number (as text)'`

### Profile Content Fields (6)
- `'Date of Birth'`
- `'About Me / Bio'`
- `'Job Title'`
- `'need for Space'` / `'special needs'`
- `'Type - User Signup'`

### Schedule & Preferences Fields (4)
- `'Recent Days Selected'`
- `'transportation medium'`
- `'Reasons to Host me'`
- `'About - Commonly Stored Items'`

### Verification Fields (4)
- `'is email confirmed'`
- `'Verify - Phone'`
- `'user verified?'`
- `'Verify - Linked In ID'`

### Referral/Stats Fields (6)
- `'Referral Code'`
- `'Friends Referred'` / `'Rewards Claimed'` / `'Total Rewards'`
- `'Response Time'` / `'Response Rate'`

### Metadata Fields (4)
- `'Created Date'` / `'_created_date'`
- `'Modified Date'`
- `'Rental Application'`

### Listing Fields (from child components) (9)
- `'Borough/Region'` / `'Location - Borough'`
- `'Features - Photos'`
- `'Monthly Host Rate'` / `'Weekly Host Rate'` / `'Start Nightly Price'`
- `'Qty of Bedrooms'` / `'Qty of Bathrooms'`
- `'Good Guest Reasons'`

---

## Files Affected

| File | Field Count |
|------|-------------|
| `useAccountProfilePageLogic.js` | 31 |
| `AccountProfilePage.jsx` | 15 |
| `components/PublicView.jsx` | 6 |
| `components/EditorView.jsx` | 2 |
| `components/cards/ListingsCard.jsx` | 6 |

---

## See Also
- `accountprofile_p1_agent_b_status.md` - Full field inventory with line numbers
