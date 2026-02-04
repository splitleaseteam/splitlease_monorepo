# Legacy Field Mappings - Exploration Report

**Generated**: 2025-02-04
**Agent**: Agent-B (Data Layer Domain)
**Scope**: ListingDashboardPage and related pricing/availability fields

---

## Executive Summary

The codebase has **already migrated** from emoji-prefixed fields (`💰...`) to **snake_case** field names for pricing. The spec's reference to emoji fields is **outdated**.

---

## Field Naming Convention Analysis

### Current State: Snake_case Fields (ACTIVE)

The codebase uses snake_case for pricing fields:

| Field Name | Files Using | Read/Write | Notes |
|:---|:---|:---:|:---|
| `nightly_rate_1_night` | 63+ files | R/W | Primary pricing field |
| `nightly_rate_2_nights` | 63+ files | R/W | |
| `nightly_rate_3_nights` | 63+ files | R/W | |
| `nightly_rate_4_nights` | 63+ files | R/W | |
| `nightly_rate_5_nights` | 63+ files | R/W | |
| `nightly_rate_6_nights` | 63+ files | R/W | |
| `nightly_rate_7_nights` | 63+ files | R/W | |
| `damage_deposit` | 63+ files | R/W | |
| `cleaning_fee` | 63+ files | R/W | Was `💰Cleaning Cost / Maintenance Fee` |
| `monthly_host_rate` | 63+ files | R/W | |
| `weekly_host_rate` | 63+ files | R/W | |
| `price_override` | getNightlyRateByFrequency.js | R | Takes precedence |

### Legacy State: Emoji Fields (DEPRECATED)

Emoji fields (`💰`) are **NOT used** in ListingDashboardPage. Found only in:

| Field Name | Location | Status |
|:---|:---|:---|
| `'💰Rent'` | ZUnitPaymentRecordsJsPage | Different table/context |
| `'💰Maintenance Fee'` | ZUnitPaymentRecordsJsPage | Different table/context |
| `'💰Total'` | ZUnitPaymentRecordsJsPage | Different table/context |

The emoji in other files (CreateProposalFlowV2, etc.) is used for **console logging and UI display**, not database fields.

---

## Compound Fields

| Field Name | Files Using | Data Type | Notes |
|:---|:---|:---|:---|
| `'Days Available (List of Days)'` | useListingData.js, PricingEditSection.jsx | JSON array of ints (0-6) | JS day indices |
| `'Dates - Blocked'` | useListingData.js, useAvailabilityLogic.js | JSON array of date strings | YYYY-MM-DD format |
| `'Features - Amenities In-Unit'` | useListingData.js | JSON array of IDs | References zat_features_amenity |
| `'Features - Amenities In-Building'` | useListingData.js | JSON array of IDs | References zat_features_amenity |
| `'Features - Safety'` | useListingData.js | JSON array of IDs | References zat_features_safetyfeature |
| `'Features - House Rules'` | useListingData.js | JSON array of IDs | References zat_features_houserule |
| `'Features - Photos'` | useListingData.js | JSON array of objects/URLs | Photo data |
| `' First Available'` | useListingData.js | Date string | **Leading space intentional (legacy)** |

---

## Existing Mapping in getNightlyRateByFrequency.js

Lines 59-67 already define centralized pricing field mapping:

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

---

## Existing Constants File

Location: `app/src/lib/constants/listingFields.js`

Contains some field mappings but **NOT** the pricing fields:

```javascript
export const LISTING_FIELDS = {
  ID: '_id',
  ACTIVE: 'Active?',
  LOCATION_HOOD: 'Location - Hood',
  // ... other fields
  DAYS_AVAILABLE: 'Days Available',  // Note: different from actual field name
  // NO pricing fields present
};
```

---

## Recommendation

1. **Do NOT create new field mappings** - The codebase already uses snake_case consistently
2. **Extend existing `listingFields.js`** to include pricing fields if centralization is desired
3. **The spec's emoji field consolidation is NOT needed** - already migrated
4. **Focus on dead code deletion** - confirmed hooks are unused

---

## Files Examined

- `app/src/islands/pages/ListingDashboardPage/hooks/useListingData.js`
- `app/src/islands/pages/ListingDashboardPage/components/PricingEditSection.jsx`
- `app/src/logic/calculators/pricing/getNightlyRateByFrequency.js`
- `app/src/lib/constants/listingFields.js`
- 63+ files using snake_case pricing fields

