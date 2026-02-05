# Legacy Field Usage - Exploration Report

**Generated**: 2025-02-04
**Agent**: Agent-B (Data Layer Domain)
**Scope**: ListingDashboardPage and related pricing/availability fields

---

## Executive Summary

**Finding**: The emoji pricing fields (`💰...`) referenced in the original spec are **NOT present** in the current codebase. The database schema has been migrated to **snake_case** field names.

---

## Search Results

### Emoji Field Search

**Command**:
```bash
grep -rn "💰Nightly Host Rate|💰Damage Deposit|💰Cleaning Cost|💰Monthly Host Rate|💰Weekly Host Rate|💰Price Override" app/src
```

**Result**: NO MATCHES

The only emoji (`💰`) usages found are:
- Console logging for debugging (CreateProposalFlowV2.jsx)
- UI display elements (icons in various components)
- Unrelated tables (ZUnitPaymentRecordsJsPage uses `'💰Rent'`, `'💰Total'` - different context)

---

## Current Field Names (Snake Case)

The codebase uses **snake_case** for pricing fields:

### Pricing Fields

| Field Name | Used In | Read/Write |
|:---|:---|:---|
| `nightly_rate_1_night` | useListingData.js, getNightlyRateByFrequency.js, PricingEditSection.jsx | R/W |
| `nightly_rate_2_nights` | useListingData.js, getNightlyRateByFrequency.js, PricingEditSection.jsx | R/W |
| `nightly_rate_3_nights` | useListingData.js, getNightlyRateByFrequency.js, PricingEditSection.jsx | R/W |
| `nightly_rate_4_nights` | useListingData.js, getNightlyRateByFrequency.js, PricingEditSection.jsx | R/W |
| `nightly_rate_5_nights` | useListingData.js, getNightlyRateByFrequency.js, PricingEditSection.jsx | R/W |
| `nightly_rate_6_nights` | useListingData.js, getNightlyRateByFrequency.js, PricingEditSection.jsx | R/W |
| `nightly_rate_7_nights` | useListingData.js, getNightlyRateByFrequency.js, PricingEditSection.jsx | R/W |
| `damage_deposit` | useListingData.js, PricingEditSection.jsx | R/W |
| `cleaning_fee` | useListingData.js, PricingEditSection.jsx | R/W |
| `monthly_host_rate` | useListingData.js, PricingEditSection.jsx | R/W |
| `weekly_host_rate` | useListingData.js, PricingEditSection.jsx | R/W |
| `price_override` | getNightlyRateByFrequency.js | R |

### Compound Fields (Still Using Legacy Names)

| Field Name | Files Using | Data Type |
|:---|:---|:---|
| `'Days Available (List of Days)'` | useListingData.js, PricingEditSection.jsx | JSON array of ints (0-6) |
| `'Dates - Blocked'` | useListingData.js | JSON array of date strings |
| `'Features - Amenities In-Unit'` | useListingData.js | JSON array of IDs |
| `'Features - Amenities In-Building'` | useListingData.js | JSON array of IDs |
| `'Features - Safety'` | useListingData.js | JSON array of IDs |
| `'Features - House Rules'` | useListingData.js | JSON array of IDs |
| `'Features - Photos'` | useListingData.js | JSON array of objects/URLs |
| `' First Available'` | useListingData.js | Date string (**leading space intentional**) |
| `'rental type'` | PricingEditSection.jsx | String |
| `'Minimum Nights'` | PricingEditSection.jsx | Number |
| `'Maximum Nights'` | PricingEditSection.jsx | Number |
| `'Weeks offered'` | PricingEditSection.jsx | String |

---

## Existing Field Mapping

**File**: `app/src/logic/calculators/pricing/getNightlyRateByFrequency.js` (lines 59-67)

```javascript
const priceFieldMap = {
  1: 'nightly_rate_1_night',
  2: 'nightly_rate_2_nights',
  3: 'nightly_rate_3_nights',
  4: 'nightly_rate_4_nights',
  5: 'nightly_rate_5_nights',
  6: 'nightly_rate_6_nights',
  7: 'nightly_rate_7_nights'
}
```

**File**: `app/src/lib/constants/listingFields.js`

Contains some field mappings but NOT pricing fields:

```javascript
export const LISTING_FIELDS = {
  ID: '_id',
  ACTIVE: 'Active?',
  DAYS_AVAILABLE: 'Days Available',  // Note: incomplete name
  // ... (no pricing fields)
};
```

---

## Task 1B.4: Field Mapping Strategy Recommendation

### Decision Required

| Option | Description | Pros | Cons |
|:---|:---|:---|:---|
| **A** | Extend `lib/constants/listingFields.js` | Single existing location | File already exists, may have other purposes |
| **B** | Create `data/fieldMappings.js` | Clean separation, dedicated file | New file to maintain |
| **C** | Leave as-is | No changes needed | Scattered field names remain |

### Recommendation: Option B (Create `data/fieldMappings.js`)

**Rationale**:
1. The spec explicitly requests `data/fieldMappings.js`
2. Creates dedicated location for database field names
3. Allows `getNightlyRateByFrequency.js` to import from single source
4. Future-proofs for additional field consolidation

### Proposed Structure

```javascript
// app/src/data/fieldMappings.js

// Pricing fields (snake_case - current schema)
export const PRICING_FIELDS = {
  NIGHTLY_RATE_1: 'nightly_rate_1_night',
  NIGHTLY_RATE_2: 'nightly_rate_2_nights',
  // ...
  DAMAGE_DEPOSIT: 'damage_deposit',
  CLEANING_FEE: 'cleaning_fee',
  MONTHLY_RATE: 'monthly_host_rate',
  WEEKLY_RATE: 'weekly_host_rate',
  PRICE_OVERRIDE: 'price_override',
};

// Map nights count to field name
export const NIGHTLY_RATE_BY_COUNT = {
  1: PRICING_FIELDS.NIGHTLY_RATE_1,
  2: PRICING_FIELDS.NIGHTLY_RATE_2,
  // ...
};

// Availability fields (legacy names with spaces)
export const AVAILABILITY_FIELDS = {
  DAYS_AVAILABLE: 'Days Available (List of Days)',
  BLOCKED_DATES: 'Dates - Blocked',
  FIRST_AVAILABLE: ' First Available',  // Leading space intentional
  // ...
};

// Feature fields (stored as JSON arrays)
export const FEATURE_FIELDS = {
  AMENITIES_IN_UNIT: 'Features - Amenities In-Unit',
  AMENITIES_IN_BUILDING: 'Features - Amenities In-Building',
  SAFETY: 'Features - Safety',
  HOUSE_RULES: 'Features - House Rules',
  PHOTOS: 'Features - Photos',
};
```

---

## Files Examined

- `app/src/islands/pages/ListingDashboardPage/hooks/useListingData.js`
- `app/src/islands/pages/ListingDashboardPage/components/PricingEditSection.jsx`
- `app/src/logic/calculators/pricing/getNightlyRateByFrequency.js`
- `app/src/lib/constants/listingFields.js`
- 63+ files using snake_case pricing fields

