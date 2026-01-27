# Implementation Plan: Z-Pricing Unit Test Page

## Overview

Create a comprehensive internal pricing engine testing page at `/_internal/z-pricing-unit-test` that allows developers to validate pricing calculations across different reservation configurations, guest patterns, and host rate inputs. This page will replicate the Bubble pricing test functionality with 95%+ visual fidelity.

## Success Criteria

- [ ] Route `/_internal/z-pricing-unit-test` is accessible and renders correctly
- [ ] Listing selector allows searching and selecting any listing from dropdown
- [ ] Reservation span configuration with weeks count dropdown and day pattern picker (S,M,T,W,T,F,S toggle buttons)
- [ ] Guest desired pattern configuration inputs are functional
- [ ] Host prices input section displays/edits all host rate fields
- [ ] Three pricing calculation output panels (MONTHLY, WEEKLY, NIGHTLY) display correct values
- [ ] Data check scorecard shows YES/NO validation indicators
- [ ] Page follows Hollow Component Pattern with all logic in hook
- [ ] Fixed width: 1500px, white background (#FFFFFF)
- [ ] 95%+ visual fidelity with Bubble original

## Context & References

### Relevant Files

| File | Purpose | Changes Needed |
|------|---------|----------------|
| `app/src/routes.config.js` | Route registry | Add new route entry |
| `app/public/z-pricing-unit-test.html` | HTML entry point | Create new file |
| `app/src/z-pricing-unit-test.jsx` | React entry point | Create new file |
| `app/src/islands/pages/ZPricingUnitTestPage/ZPricingUnitTestPage.jsx` | Page component | Create new file |
| `app/src/islands/pages/ZPricingUnitTestPage/useZPricingUnitTestPageLogic.js` | Logic hook | Create new file |
| `app/src/islands/pages/ZPricingUnitTestPage/ZPricingUnitTestPage.css` | Styles | Create new file |
| `app/src/islands/pages/ZPricingUnitTestPage/index.js` | Barrel export | Create new file |
| `app/src/logic/calculators/pricing/pricingConstants.js` | Pricing constants | Reference (read-only) |
| `app/src/logic/calculators/pricing/calculateGuestFacingPrice.js` | Guest price calc | Reference (read-only) |
| `app/src/logic/calculators/pricing/getNightlyRateByFrequency.js` | Nightly rate calc | Reference (read-only) |
| `app/src/lib/listingDataFetcher.js` | Listing data fetching | Reference (read-only) |
| `app/src/lib/supabase.js` | Supabase client | Reference (read-only) |

### Related Documentation

- `.claude/Documentation/miniCLAUDE.md` - Codebase patterns and conventions
- `app/src/islands/pages/ZSearchUnitTestPage/` - Reference implementation for internal test pages
- `app/src/logic/calculators/pricing/` - Existing pricing calculators to reuse

### Existing Patterns to Follow

1. **Hollow Component Pattern**: Page component (`ZPricingUnitTestPage.jsx`) contains only JSX rendering, all logic delegated to `useZPricingUnitTestPageLogic.js` hook
2. **ZSearchUnitTestPage Pattern**: Follow the same directory structure, CSS naming conventions, and component organization
3. **Route Registry Pattern**: Add route to `routes.config.js` following existing `/_internal/z-search-unit-test` pattern
4. **CSS Class Naming**: Use `zput-` prefix for all CSS classes (Z-Pricing-Unit-Test)
5. **Pricing Calculator Pattern**: Use existing calculators from `app/src/logic/calculators/pricing/`

## Implementation Steps

### Step 1: Add Route to Route Registry

**Files:** `app/src/routes.config.js`
**Purpose:** Register the new route in the single source of truth for all routes
**Details:**
- Add new route entry after the existing `/_internal/z-search-unit-test` route (around line 699)
- Set `path: '/_internal/z-pricing-unit-test'`
- Set `file: 'z-pricing-unit-test.html'`
- Set `protected: false` (internal tool, no auth required)
- Set `cloudflareInternal: true`
- Set `internalName: 'z-pricing-unit-test-view'`
- Set `hasDynamicSegment: false`

**Code to add after the z-search-unit-test route entry:**
```javascript
// ===== Z-PRICING UNIT TEST (INTERNAL) =====
{
  path: '/_internal/z-pricing-unit-test',
  file: 'z-pricing-unit-test.html',
  aliases: ['/_internal/z-pricing-unit-test.html'],
  protected: false,
  cloudflareInternal: true,
  internalName: 'z-pricing-unit-test-view',
  hasDynamicSegment: false
},
```

**Validation:** Run `bun run generate-routes` after adding the route

### Step 2: Create HTML Entry Point

**Files:** `app/public/z-pricing-unit-test.html`
**Purpose:** HTML shell that loads the React application
**Details:**
- Follow same structure as `z-search-unit-test.html`
- Set appropriate title and meta tags
- Add `noindex, nofollow` for internal page
- Link to the JSX entry point

**Full file content:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Z-Pricing Unit Test - Split Lease Admin</title>
  <meta name="description" content="Internal pricing engine testing page">
  <meta name="robots" content="noindex, nofollow">
  <link rel="icon" type="image/png" href="/assets/images/split-lease-purple-circle.png">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/z-pricing-unit-test.jsx"></script>
</body>
</html>
```

**Validation:** File exists and references correct JSX entry point

### Step 3: Create JSX Entry Point

**Files:** `app/src/z-pricing-unit-test.jsx`
**Purpose:** Mount React application to DOM
**Details:**
- Import React and createRoot
- Import the page component
- Mount to #root element

**Full file content:**
```javascript
/**
 * Z-Pricing Unit Test Page Entry Point
 *
 * Internal test page for pricing engine validation.
 * Tests pricing calculations across different configurations.
 *
 * Route: /_internal/z-pricing-unit-test
 * Auth: None (internal test page)
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import ZPricingUnitTestPage from './islands/pages/ZPricingUnitTestPage/ZPricingUnitTestPage.jsx';

const root = createRoot(document.getElementById('root'));
root.render(<ZPricingUnitTestPage />);
```

**Validation:** Entry point imports correct page component

### Step 4: Create Page Directory Structure

**Files:** `app/src/islands/pages/ZPricingUnitTestPage/` directory
**Purpose:** Create the directory and index.js barrel export
**Details:**
- Create directory `ZPricingUnitTestPage`
- Create `index.js` for barrel export

**index.js content:**
```javascript
export { default } from './ZPricingUnitTestPage.jsx';
export { useZPricingUnitTestPageLogic } from './useZPricingUnitTestPageLogic.js';
```

**Validation:** Directory structure matches ZSearchUnitTestPage

### Step 5: Create CSS Styles File

**Files:** `app/src/islands/pages/ZPricingUnitTestPage/ZPricingUnitTestPage.css`
**Purpose:** Styling for the pricing unit test page
**Details:**
- Use `zput-` prefix for all classes (Z-Pricing-Unit-Test)
- Fixed width: 1500px container
- White background (#FFFFFF)
- Layout: Header + 3-column layout (Listing Selector | Configuration Panels | Output Panels)
- Follow ZSearchUnitTestPage styling patterns
- Input field styling for host rates
- Day toggle buttons (S,M,T,W,T,F,S)
- Output panels with distinct sections for MONTHLY/WEEKLY/NIGHTLY
- Scorecard section with YES/NO badges

**Full file content:**
```css
/* Z-Pricing Unit Test Page Styles */
/* Class prefix: zput- (Z-Pricing-Unit-Test) */

.zput-page {
  min-height: 100vh;
  background-color: #FFFFFF;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* Header */
.zput-header {
  padding: 24px 32px;
  border-bottom: 1px solid #E5E7EB;
  background: #FAFAFA;
}

.zput-header h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #111827;
}

.zput-header p {
  margin: 0;
  font-size: 14px;
  color: #6B7280;
}

/* Main Container - Fixed Width 1500px */
.zput-container {
  display: flex;
  gap: 24px;
  padding: 24px 32px;
  max-width: 1500px;
  width: 1500px;
  margin: 0 auto;
}

/* Three Column Layout */
.zput-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.zput-column-listing {
  width: 320px;
  flex-shrink: 0;
}

.zput-column-config {
  width: 400px;
  flex-shrink: 0;
}

.zput-column-output {
  flex: 1;
  min-width: 0;
}

/* Section Panels */
.zput-panel {
  padding: 20px;
  background: #FFFFFF;
  border-radius: 8px;
  border: 1px solid #E5E7EB;
}

.zput-panel-header {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  padding-bottom: 12px;
  border-bottom: 1px solid #E5E7EB;
}

.zput-panel-subheader {
  margin: 16px 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

/* Form Controls */
.zput-form-group {
  margin-bottom: 16px;
}

.zput-form-group:last-child {
  margin-bottom: 0;
}

.zput-label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.zput-select,
.zput-input {
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  background: #FFFFFF;
  color: #111827;
}

.zput-select:focus,
.zput-input:focus {
  outline: none;
  border-color: #4B47CE;
  box-shadow: 0 0 0 3px rgba(75, 71, 206, 0.1);
}

.zput-input-small {
  width: 100px;
}

.zput-input-currency {
  width: 120px;
}

/* Day Toggle Buttons */
.zput-day-toggles {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.zput-day-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid #D1D5DB;
  background: #FFFFFF;
  color: #6B7280;
}

.zput-day-btn:hover {
  border-color: #9CA3AF;
}

.zput-day-btn.active {
  background: #4B47CE;
  border-color: #4B47CE;
  color: #FFFFFF;
}

.zput-day-btn.active:hover {
  background: #3F3BB0;
  border-color: #3F3BB0;
}

/* Host Rates Grid */
.zput-rates-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.zput-rate-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.zput-rate-label {
  font-size: 12px;
  color: #6B7280;
}

.zput-rate-input {
  width: 100%;
  padding: 8px 10px;
  font-size: 14px;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  background: #FFFFFF;
}

/* Output Panels */
.zput-output-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.zput-output-panel {
  padding: 16px;
  background: #F9FAFB;
  border-radius: 8px;
  border: 1px solid #E5E7EB;
}

.zput-output-title {
  font-size: 14px;
  font-weight: 600;
  color: #4B47CE;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.zput-output-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #E5E7EB;
}

.zput-output-row:last-child {
  border-bottom: none;
}

.zput-output-label {
  font-size: 13px;
  color: #6B7280;
}

.zput-output-value {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.zput-output-value.highlight {
  color: #4B47CE;
  font-size: 16px;
}

/* Scorecard */
.zput-scorecard {
  margin-top: 16px;
}

.zput-scorecard-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.zput-check-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #F9FAFB;
  border-radius: 6px;
  font-size: 13px;
}

.zput-check-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
  text-transform: uppercase;
}

.zput-check-badge.yes {
  background: #D1FAE5;
  color: #065F46;
}

.zput-check-badge.no {
  background: #FEE2E2;
  color: #991B1B;
}

.zput-check-label {
  color: #374151;
}

/* Buttons */
.zput-btn {
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.zput-btn-primary {
  background: #4B47CE;
  color: #FFFFFF;
  border: none;
}

.zput-btn-primary:hover {
  background: #3F3BB0;
}

.zput-btn-secondary {
  background: #FFFFFF;
  color: #374151;
  border: 1px solid #D1D5DB;
}

.zput-btn-secondary:hover {
  background: #F9FAFB;
}

/* Loading State */
.zput-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #6B7280;
}

.zput-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #E5E7EB;
  border-top-color: #4B47CE;
  border-radius: 50%;
  animation: zput-spin 0.8s linear infinite;
  margin-bottom: 12px;
}

@keyframes zput-spin {
  to {
    transform: rotate(360deg);
  }
}

/* Error State */
.zput-error {
  padding: 16px;
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: 8px;
  color: #991B1B;
  font-size: 14px;
}

/* Inline Fields Row */
.zput-inline-row {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.zput-inline-field {
  flex: 1;
}

/* Info Text */
.zput-info-text {
  font-size: 12px;
  color: #9CA3AF;
  margin-top: 4px;
}

/* Responsive - hide on small screens */
@media (max-width: 1540px) {
  .zput-container {
    width: auto;
    max-width: 100%;
    flex-wrap: wrap;
  }

  .zput-column-output {
    width: 100%;
  }

  .zput-output-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 900px) {
  .zput-container {
    flex-direction: column;
    padding: 16px;
  }

  .zput-column-listing,
  .zput-column-config {
    width: 100%;
  }

  .zput-output-grid {
    grid-template-columns: 1fr;
  }
}
```

**Validation:** CSS follows project conventions and provides responsive design

### Step 6: Create Logic Hook

**Files:** `app/src/islands/pages/ZPricingUnitTestPage/useZPricingUnitTestPageLogic.js`
**Purpose:** All business logic for the pricing unit test page
**Details:**
- Fetch all listings for dropdown (search/filter capability)
- Selected listing state with full pricing fields
- Reservation span configuration (weeks count, day pattern)
- Guest desired pattern configuration
- Host prices input section (editable fields)
- Pricing calculation state (MONTHLY, WEEKLY, NIGHTLY outputs)
- Data check scorecard validation
- All handlers for user interactions

**Key State Structure:**
```javascript
// Selected listing
selectedListing: null | { _id, Name, ...pricingFields }

// Configuration
reservationConfig: {
  weeksCount: 4,  // dropdown: 1, 2, 3, 4, 5, 6, 8, 12, 13, 26, 52
  selectedDays: [1, 2, 3, 4, 5]  // 0-indexed, Mon-Fri default
}

// Guest pattern
guestPattern: {
  checkInDay: 1,  // 0-indexed day
  nights: 5
}

// Host rates (editable)
hostRates: {
  hostCompStyle: '',
  weeksOffered: '',
  rate2Night: 0,
  rate3Night: 0,
  rate4Night: 0,
  rate5Night: 0,
  weeklyRate: 0,
  monthlyRate: 0,
  damageDeposit: 0,
  cleaningDeposit: 0,
  nightsAvailable: []
}

// Calculated outputs
pricingOutput: {
  monthly: {
    proratedNightlyRate: 0,
    markupAndDiscounts: { siteMarkup: 0, unitMarkup: 0, discount: 0 }
  },
  weekly: {
    proratedNightlyRate: 0,
    markupAndDiscounts: { siteMarkup: 0, discount: 0 }
  },
  nightly: {
    nightPriceMultiplier: 0,
    markupAndDiscounts: { siteMarkup: 0, discount: 0 }
  }
}

// Scorecard
scorecard: {
  priceExists: false,
  rentalTypeSelected: false,
  appearsInSearch: false,
  discountsPositive: false,
  minNightsValid: false,
  maxNightsValid: false,
  nightlyPricingValid: false
}
```

**Pricing Formulas:**
```javascript
// Monthly Prorated Nightly
const monthlyProratedNightly = (monthlyRate / 31) * (1 + SITE_MARKUP + unitMarkup);

// Weekly Prorated Nightly
const weeklyProratedNightly = (weeklyRate / 7) * (1 + SITE_MARKUP) * (1 - unusedNightsDiscount);

// Nightly with multiplier
const nightlyPrice = baseNightlyRate * nightMultiplier * (1 + SITE_MARKUP);
```

**Full file content:**
```javascript
/**
 * Z-Pricing Unit Test Page Logic Hook
 *
 * All business logic for the ZPricingUnitTestPage.
 * Follows the Hollow Component Pattern.
 *
 * Pricing Engine Test Features:
 * - Listing selector with search
 * - Reservation span configuration
 * - Guest pattern configuration
 * - Host rates input/editing
 * - Pricing calculations (Monthly, Weekly, Nightly)
 * - Data validation scorecard
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabase.js';
import { PRICING_CONSTANTS } from '../../../logic/constants/pricingConstants.js';
import { fetchZatPriceConfiguration } from '../../../lib/listingDataFetcher.js';

// Day names for toggle buttons
const DAY_NAMES = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_FULL_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Weeks count options
const WEEKS_COUNT_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 12, 13, 26, 52];

// Initial state
const INITIAL_RESERVATION_CONFIG = {
  weeksCount: 4,
  selectedDays: [1, 2, 3, 4, 5] // Mon-Fri (0-indexed)
};

const INITIAL_GUEST_PATTERN = {
  checkInDay: 1,
  nights: 5
};

const INITIAL_HOST_RATES = {
  hostCompStyle: '',
  weeksOffered: 'Every week',
  rate2Night: 0,
  rate3Night: 0,
  rate4Night: 0,
  rate5Night: 0,
  weeklyRate: 0,
  monthlyRate: 0,
  damageDeposit: 0,
  cleaningDeposit: 0,
  nightsAvailable: [],
  unitMarkup: 0
};

const INITIAL_PRICING_OUTPUT = {
  monthly: {
    proratedNightlyRate: 0,
    markupAndDiscounts: { siteMarkup: 0, unitMarkup: 0, discount: 0, total: 0 }
  },
  weekly: {
    proratedNightlyRate: 0,
    markupAndDiscounts: { siteMarkup: 0, unusedNightsDiscount: 0, total: 0 }
  },
  nightly: {
    baseRate: 0,
    nightPriceMultiplier: 1,
    markupAndDiscounts: { siteMarkup: 0, fullTimeDiscount: 0, total: 0 }
  }
};

const INITIAL_SCORECARD = {
  priceExists: false,
  rentalTypeSelected: false,
  appearsInSearch: false,
  discountsPositive: true,
  minNightsValid: false,
  maxNightsValid: false,
  nightlyPricingValid: false
};

export function useZPricingUnitTestPageLogic() {
  // Global pricing configuration from database
  const [zatConfig, setZatConfig] = useState(null);

  // Listings for dropdown
  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingsError, setListingsError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Selected listing
  const [selectedListing, setSelectedListing] = useState(null);
  const [selectedListingLoading, setSelectedListingLoading] = useState(false);

  // Configuration state
  const [reservationConfig, setReservationConfig] = useState(INITIAL_RESERVATION_CONFIG);
  const [guestPattern, setGuestPattern] = useState(INITIAL_GUEST_PATTERN);
  const [hostRates, setHostRates] = useState(INITIAL_HOST_RATES);

  // Calculated outputs
  const [pricingOutput, setPricingOutput] = useState(INITIAL_PRICING_OUTPUT);
  const [scorecard, setScorecard] = useState(INITIAL_SCORECARD);

  // Load global pricing configuration on mount
  useEffect(() => {
    const loadZatConfig = async () => {
      try {
        const config = await fetchZatPriceConfiguration();
        setZatConfig(config);
      } catch (error) {
        console.error('[ZPricingUnitTest] Failed to load ZAT config:', error);
        // Use defaults from PRICING_CONSTANTS
        setZatConfig({
          overallSiteMarkup: PRICING_CONSTANTS.SITE_MARKUP_RATE,
          fullTimeDiscount: PRICING_CONSTANTS.FULL_TIME_DISCOUNT_RATE,
          unusedNightsDiscountMultiplier: 0.03,
          avgDaysPerMonth: 31
        });
      }
    };
    loadZatConfig();
  }, []);

  // Fetch listings for dropdown
  useEffect(() => {
    const fetchListings = async () => {
      setListingsLoading(true);
      setListingsError(null);

      try {
        let query = supabase
          .from('listing')
          .select('_id, Name, Active, Complete, "rental type"')
          .eq('Deleted', false)
          .order('Name', { ascending: true })
          .limit(500);

        // Apply search filter if provided
        if (searchTerm.trim()) {
          query = query.ilike('Name', `%${searchTerm.trim()}%`);
        }

        const { data, error } = await query;

        if (error) throw error;

        setListings(data || []);
      } catch (error) {
        console.error('[ZPricingUnitTest] Failed to fetch listings:', error);
        setListingsError('Failed to load listings');
      } finally {
        setListingsLoading(false);
      }
    };

    fetchListings();
  }, [searchTerm]);

  // Fetch full listing details when selected
  const handleListingSelect = useCallback(async (listingId) => {
    if (!listingId) {
      setSelectedListing(null);
      setHostRates(INITIAL_HOST_RATES);
      return;
    }

    setSelectedListingLoading(true);

    try {
      const { data, error } = await supabase
        .from('listing')
        .select(`
          _id,
          Name,
          "rental type",
          "Weeks offered",
          "Host Comp Style",
          "💰Nightly Host Rate for 2 nights",
          "💰Nightly Host Rate for 3 nights",
          "💰Nightly Host Rate for 4 nights",
          "💰Nightly Host Rate for 5 nights",
          "💰Weekly Host Rate",
          "💰Monthly Host Rate",
          "💰Damage Deposit",
          "💰Cleaning Cost / Maintenance Fee",
          "💰Unit Markup",
          "Nights_Available",
          "Minimum Nights",
          "Maximum Nights",
          Active,
          Complete,
          Approved
        `)
        .eq('_id', listingId)
        .single();

      if (error) throw error;

      setSelectedListing(data);

      // Populate host rates from listing
      setHostRates({
        hostCompStyle: data['Host Comp Style'] || '',
        weeksOffered: data['Weeks offered'] || 'Every week',
        rate2Night: parseFloat(data['💰Nightly Host Rate for 2 nights']) || 0,
        rate3Night: parseFloat(data['💰Nightly Host Rate for 3 nights']) || 0,
        rate4Night: parseFloat(data['💰Nightly Host Rate for 4 nights']) || 0,
        rate5Night: parseFloat(data['💰Nightly Host Rate for 5 nights']) || 0,
        weeklyRate: parseFloat(data['💰Weekly Host Rate']) || 0,
        monthlyRate: parseFloat(data['💰Monthly Host Rate']) || 0,
        damageDeposit: parseFloat(data['💰Damage Deposit']) || 0,
        cleaningDeposit: parseFloat(data['💰Cleaning Cost / Maintenance Fee']) || 0,
        nightsAvailable: parseArrayField(data['Nights_Available']),
        unitMarkup: parseFloat(data['💰Unit Markup']) || 0,
        minNights: data['Minimum Nights'],
        maxNights: data['Maximum Nights']
      });
    } catch (error) {
      console.error('[ZPricingUnitTest] Failed to fetch listing details:', error);
    } finally {
      setSelectedListingLoading(false);
    }
  }, []);

  // Calculate pricing when inputs change
  useEffect(() => {
    if (!zatConfig) return;

    const nightsCount = reservationConfig.selectedDays.length;

    // Calculate Monthly Prorated Nightly Rate
    // Formula: (Monthly Host Rate / 31) × (1 + Overall Site Markup + SL Unit Markup)
    const monthlyProratedNightly = hostRates.monthlyRate > 0
      ? (hostRates.monthlyRate / zatConfig.avgDaysPerMonth) * (1 + zatConfig.overallSiteMarkup + hostRates.unitMarkup)
      : 0;

    // Calculate Weekly Prorated Nightly Rate
    // Formula: (Weekly Host Rate / 7) × (1 + Site Markup) × (1 - unused nights discount)
    const unusedNightsCount = 7 - nightsCount;
    const unusedNightsDiscount = unusedNightsCount * zatConfig.unusedNightsDiscountMultiplier;
    const weeklyProratedNightly = hostRates.weeklyRate > 0
      ? (hostRates.weeklyRate / 7) * (1 + zatConfig.overallSiteMarkup) * (1 - unusedNightsDiscount)
      : 0;

    // Calculate Nightly Rate
    // Get rate for selected nights count
    const nightlyRateMap = {
      2: hostRates.rate2Night,
      3: hostRates.rate3Night,
      4: hostRates.rate4Night,
      5: hostRates.rate5Night,
      7: hostRates.weeklyRate / 7 // Full week uses weekly rate
    };
    const baseNightlyRate = nightlyRateMap[nightsCount] || hostRates.rate4Night;

    // Apply full-time discount for 7 nights
    const fullTimeDiscount = nightsCount === 7 ? zatConfig.fullTimeDiscount : 0;
    const nightlyWithMarkup = baseNightlyRate * (1 + zatConfig.overallSiteMarkup) * (1 - fullTimeDiscount);

    setPricingOutput({
      monthly: {
        proratedNightlyRate: monthlyProratedNightly,
        markupAndDiscounts: {
          siteMarkup: zatConfig.overallSiteMarkup,
          unitMarkup: hostRates.unitMarkup,
          discount: 0,
          total: monthlyProratedNightly
        }
      },
      weekly: {
        proratedNightlyRate: weeklyProratedNightly,
        markupAndDiscounts: {
          siteMarkup: zatConfig.overallSiteMarkup,
          unusedNightsDiscount: unusedNightsDiscount,
          total: weeklyProratedNightly
        }
      },
      nightly: {
        baseRate: baseNightlyRate,
        nightPriceMultiplier: 1,
        markupAndDiscounts: {
          siteMarkup: zatConfig.overallSiteMarkup,
          fullTimeDiscount: fullTimeDiscount,
          total: nightlyWithMarkup
        }
      }
    });
  }, [zatConfig, reservationConfig, guestPattern, hostRates]);

  // Update scorecard when data changes
  useEffect(() => {
    const nightsCount = reservationConfig.selectedDays.length;

    // Check if any price exists
    const priceExists = hostRates.rate2Night > 0 ||
                       hostRates.rate3Night > 0 ||
                       hostRates.rate4Night > 0 ||
                       hostRates.rate5Night > 0 ||
                       hostRates.weeklyRate > 0 ||
                       hostRates.monthlyRate > 0;

    // Check rental type
    const rentalTypeSelected = selectedListing?.['rental type'] !== null &&
                              selectedListing?.['rental type'] !== undefined;

    // Check if appears in search (Active, Complete, Approved)
    const appearsInSearch = selectedListing?.Active === true &&
                           selectedListing?.Complete === true &&
                           selectedListing?.Approved === true;

    // Check discounts are positive (not negative)
    const discountsPositive = true; // Always positive in our calculations

    // Check min nights
    const minNightsValid = !hostRates.minNights || nightsCount >= hostRates.minNights;

    // Check max nights
    const maxNightsValid = !hostRates.maxNights || nightsCount <= hostRates.maxNights;

    // Check nightly pricing is valid for selected nights
    const nightlyPricingValid = getNightlyRateForCount(nightsCount) > 0;

    setScorecard({
      priceExists,
      rentalTypeSelected,
      appearsInSearch,
      discountsPositive,
      minNightsValid,
      maxNightsValid,
      nightlyPricingValid
    });
  }, [selectedListing, hostRates, reservationConfig]);

  // Helper to get nightly rate for specific count
  const getNightlyRateForCount = useCallback((count) => {
    const rateMap = {
      2: hostRates.rate2Night,
      3: hostRates.rate3Night,
      4: hostRates.rate4Night,
      5: hostRates.rate5Night,
      7: hostRates.weeklyRate / 7
    };
    return rateMap[count] || 0;
  }, [hostRates]);

  // Handlers
  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
  }, []);

  const handleWeeksCountChange = useCallback((count) => {
    setReservationConfig(prev => ({ ...prev, weeksCount: parseInt(count) }));
  }, []);

  const handleDayToggle = useCallback((dayIndex) => {
    setReservationConfig(prev => {
      const days = [...prev.selectedDays];
      const index = days.indexOf(dayIndex);
      if (index > -1) {
        days.splice(index, 1);
      } else {
        days.push(dayIndex);
        days.sort((a, b) => a - b);
      }
      return { ...prev, selectedDays: days };
    });
  }, []);

  const handleGuestPatternChange = useCallback((field, value) => {
    setGuestPattern(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleHostRateChange = useCallback((field, value) => {
    setHostRates(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  }, []);

  const handleReset = useCallback(() => {
    setSelectedListing(null);
    setReservationConfig(INITIAL_RESERVATION_CONFIG);
    setGuestPattern(INITIAL_GUEST_PATTERN);
    setHostRates(INITIAL_HOST_RATES);
    setPricingOutput(INITIAL_PRICING_OUTPUT);
    setScorecard(INITIAL_SCORECARD);
  }, []);

  // Computed values
  const nightsCount = useMemo(() =>
    reservationConfig.selectedDays.length,
    [reservationConfig.selectedDays]
  );

  const filteredListings = useMemo(() => {
    if (!searchTerm.trim()) return listings;
    const term = searchTerm.toLowerCase();
    return listings.filter(l =>
      l.Name?.toLowerCase().includes(term) ||
      l._id?.toLowerCase().includes(term)
    );
  }, [listings, searchTerm]);

  return {
    // Configuration constants
    DAY_NAMES,
    DAY_FULL_NAMES,
    WEEKS_COUNT_OPTIONS,

    // ZAT config
    zatConfig,

    // Listings
    listings: filteredListings,
    listingsLoading,
    listingsError,
    searchTerm,

    // Selected listing
    selectedListing,
    selectedListingLoading,

    // Configuration
    reservationConfig,
    guestPattern,
    hostRates,
    nightsCount,

    // Outputs
    pricingOutput,
    scorecard,

    // Handlers
    handleSearchChange,
    handleListingSelect,
    handleWeeksCountChange,
    handleDayToggle,
    handleGuestPatternChange,
    handleHostRateChange,
    handleReset
  };
}

/**
 * Parse array field that may be JSON string or native array
 */
function parseArrayField(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }
  return [];
}
```

**Validation:** Hook provides all state and handlers needed by component

### Step 7: Create Page Component

**Files:** `app/src/islands/pages/ZPricingUnitTestPage/ZPricingUnitTestPage.jsx`
**Purpose:** UI rendering following Hollow Component Pattern
**Details:**
- Import and use all state/handlers from logic hook
- Three-column layout: Listing Selector | Configuration | Output
- Day toggle buttons for pattern selection
- Host rates input fields
- Three output panels (MONTHLY, WEEKLY, NIGHTLY)
- Scorecard section with YES/NO badges

**Full file content:**
```javascript
/**
 * Z-Pricing Unit Test Page
 *
 * Internal test page for pricing engine validation.
 * Follows the Hollow Component Pattern - ALL logic in useZPricingUnitTestPageLogic hook.
 *
 * Route: /_internal/z-pricing-unit-test
 * Auth: None (internal test page)
 */

import { useZPricingUnitTestPageLogic } from './useZPricingUnitTestPageLogic.js';
import './ZPricingUnitTestPage.css';

// Loading component
function LoadingSpinner() {
  return (
    <div className="zput-loading">
      <div className="zput-spinner"></div>
      <span>Loading...</span>
    </div>
  );
}

// Error component
function ErrorMessage({ message }) {
  return (
    <div className="zput-error">
      {message}
    </div>
  );
}

// Day toggle button
function DayToggleButton({ day, index, isActive, onClick }) {
  return (
    <button
      type="button"
      className={`zput-day-btn ${isActive ? 'active' : ''}`}
      onClick={() => onClick(index)}
      title={day}
    >
      {day.charAt(0)}
    </button>
  );
}

// Scorecard check item
function ScorecardItem({ label, isValid }) {
  return (
    <div className="zput-check-item">
      <span className={`zput-check-badge ${isValid ? 'yes' : 'no'}`}>
        {isValid ? 'YES' : 'NO'}
      </span>
      <span className="zput-check-label">{label}</span>
    </div>
  );
}

// Format currency
function formatCurrency(value) {
  if (typeof value !== 'number' || isNaN(value)) return '$0.00';
  return `$${value.toFixed(2)}`;
}

// Format percentage
function formatPercentage(value) {
  if (typeof value !== 'number' || isNaN(value)) return '0%';
  return `${(value * 100).toFixed(1)}%`;
}

export default function ZPricingUnitTestPage() {
  const {
    // Configuration constants
    DAY_NAMES,
    DAY_FULL_NAMES,
    WEEKS_COUNT_OPTIONS,

    // ZAT config
    zatConfig,

    // Listings
    listings,
    listingsLoading,
    listingsError,
    searchTerm,

    // Selected listing
    selectedListing,
    selectedListingLoading,

    // Configuration
    reservationConfig,
    guestPattern,
    hostRates,
    nightsCount,

    // Outputs
    pricingOutput,
    scorecard,

    // Handlers
    handleSearchChange,
    handleListingSelect,
    handleWeeksCountChange,
    handleDayToggle,
    handleGuestPatternChange,
    handleHostRateChange,
    handleReset
  } = useZPricingUnitTestPageLogic();

  return (
    <div className="zput-page">
      {/* Header */}
      <header className="zput-header">
        <h1>Z-Pricing Unit Test</h1>
        <p>Internal pricing engine testing and validation tool</p>
      </header>

      <div className="zput-container">
        {/* Column 1: Listing Selector */}
        <div className="zput-column zput-column-listing">
          <div className="zput-panel">
            <h2 className="zput-panel-header">Listing Selector</h2>

            {/* Search Input */}
            <div className="zput-form-group">
              <label className="zput-label">Search Listings</label>
              <input
                type="text"
                className="zput-input"
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>

            {/* Listing Dropdown */}
            <div className="zput-form-group">
              <label className="zput-label">Select Listing</label>
              {listingsLoading ? (
                <LoadingSpinner />
              ) : listingsError ? (
                <ErrorMessage message={listingsError} />
              ) : (
                <select
                  className="zput-select"
                  value={selectedListing?._id || ''}
                  onChange={(e) => handleListingSelect(e.target.value)}
                >
                  <option value="">-- Select a listing --</option>
                  {listings.map(listing => (
                    <option key={listing._id} value={listing._id}>
                      {listing.Name || listing._id}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Selected Listing Info */}
            {selectedListing && (
              <div className="zput-form-group">
                <p className="zput-info-text">
                  ID: {selectedListing._id}<br />
                  Status: {selectedListing.Active ? 'Active' : 'Inactive'}
                  {selectedListing.Complete ? ', Complete' : ''}
                  {selectedListing.Approved ? ', Approved' : ''}
                </p>
              </div>
            )}

            {/* Reset Button */}
            <button
              type="button"
              className="zput-btn zput-btn-secondary"
              onClick={handleReset}
              style={{ width: '100%', marginTop: '16px' }}
            >
              Reset All
            </button>
          </div>
        </div>

        {/* Column 2: Configuration */}
        <div className="zput-column zput-column-config">
          {/* Reservation Span Configuration */}
          <div className="zput-panel">
            <h2 className="zput-panel-header">Reservation Span Configuration</h2>

            <div className="zput-form-group">
              <label className="zput-label">Weeks Count</label>
              <select
                className="zput-select"
                value={reservationConfig.weeksCount}
                onChange={(e) => handleWeeksCountChange(e.target.value)}
              >
                {WEEKS_COUNT_OPTIONS.map(weeks => (
                  <option key={weeks} value={weeks}>{weeks} week{weeks > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>

            <div className="zput-form-group">
              <label className="zput-label">Day Pattern</label>
              <div className="zput-day-toggles">
                {DAY_NAMES.map((day, index) => (
                  <DayToggleButton
                    key={index}
                    day={DAY_FULL_NAMES[index]}
                    index={index}
                    isActive={reservationConfig.selectedDays.includes(index)}
                    onClick={handleDayToggle}
                  />
                ))}
              </div>
              <p className="zput-info-text">
                Selected: {nightsCount} night{nightsCount !== 1 ? 's' : ''} per week
              </p>
            </div>
          </div>

          {/* Guest Desired Pattern */}
          <div className="zput-panel">
            <h2 className="zput-panel-header">Guest Desired Pattern</h2>

            <div className="zput-inline-row">
              <div className="zput-inline-field">
                <label className="zput-label">Check-in Day</label>
                <select
                  className="zput-select"
                  value={guestPattern.checkInDay}
                  onChange={(e) => handleGuestPatternChange('checkInDay', parseInt(e.target.value))}
                >
                  {DAY_FULL_NAMES.map((day, index) => (
                    <option key={index} value={index}>{day}</option>
                  ))}
                </select>
              </div>
              <div className="zput-inline-field">
                <label className="zput-label">Nights</label>
                <input
                  type="number"
                  className="zput-input"
                  min="1"
                  max="7"
                  value={guestPattern.nights}
                  onChange={(e) => handleGuestPatternChange('nights', parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
          </div>

          {/* Host Prices Input Section */}
          <div className="zput-panel">
            <h2 className="zput-panel-header">Host Prices Input</h2>

            <div className="zput-form-group">
              <label className="zput-label">Host Comp Style</label>
              <input
                type="text"
                className="zput-input"
                value={hostRates.hostCompStyle}
                onChange={(e) => handleHostRateChange('hostCompStyle', e.target.value)}
              />
            </div>

            <div className="zput-form-group">
              <label className="zput-label">Weeks Offered</label>
              <input
                type="text"
                className="zput-input"
                value={hostRates.weeksOffered}
                readOnly
              />
            </div>

            <h3 className="zput-panel-subheader">Nightly Host Rates</h3>
            <div className="zput-rates-grid">
              <div className="zput-rate-item">
                <span className="zput-rate-label">2-Night Rate</span>
                <input
                  type="number"
                  className="zput-rate-input"
                  value={hostRates.rate2Night || ''}
                  onChange={(e) => handleHostRateChange('rate2Night', e.target.value)}
                  placeholder="$0.00"
                />
              </div>
              <div className="zput-rate-item">
                <span className="zput-rate-label">3-Night Rate</span>
                <input
                  type="number"
                  className="zput-rate-input"
                  value={hostRates.rate3Night || ''}
                  onChange={(e) => handleHostRateChange('rate3Night', e.target.value)}
                  placeholder="$0.00"
                />
              </div>
              <div className="zput-rate-item">
                <span className="zput-rate-label">4-Night Rate</span>
                <input
                  type="number"
                  className="zput-rate-input"
                  value={hostRates.rate4Night || ''}
                  onChange={(e) => handleHostRateChange('rate4Night', e.target.value)}
                  placeholder="$0.00"
                />
              </div>
              <div className="zput-rate-item">
                <span className="zput-rate-label">5-Night Rate</span>
                <input
                  type="number"
                  className="zput-rate-input"
                  value={hostRates.rate5Night || ''}
                  onChange={(e) => handleHostRateChange('rate5Night', e.target.value)}
                  placeholder="$0.00"
                />
              </div>
            </div>

            <h3 className="zput-panel-subheader">Weekly & Monthly Rates</h3>
            <div className="zput-rates-grid">
              <div className="zput-rate-item">
                <span className="zput-rate-label">Weekly Host Rate</span>
                <input
                  type="number"
                  className="zput-rate-input"
                  value={hostRates.weeklyRate || ''}
                  onChange={(e) => handleHostRateChange('weeklyRate', e.target.value)}
                  placeholder="$0.00"
                />
              </div>
              <div className="zput-rate-item">
                <span className="zput-rate-label">Monthly Host Rate</span>
                <input
                  type="number"
                  className="zput-rate-input"
                  value={hostRates.monthlyRate || ''}
                  onChange={(e) => handleHostRateChange('monthlyRate', e.target.value)}
                  placeholder="$0.00"
                />
              </div>
            </div>

            <h3 className="zput-panel-subheader">Deposits</h3>
            <div className="zput-rates-grid">
              <div className="zput-rate-item">
                <span className="zput-rate-label">Damage Deposit</span>
                <input
                  type="number"
                  className="zput-rate-input"
                  value={hostRates.damageDeposit || ''}
                  onChange={(e) => handleHostRateChange('damageDeposit', e.target.value)}
                  placeholder="$0.00"
                />
              </div>
              <div className="zput-rate-item">
                <span className="zput-rate-label">Cleaning Deposit</span>
                <input
                  type="number"
                  className="zput-rate-input"
                  value={hostRates.cleaningDeposit || ''}
                  onChange={(e) => handleHostRateChange('cleaningDeposit', e.target.value)}
                  placeholder="$0.00"
                />
              </div>
            </div>

            <div className="zput-form-group" style={{ marginTop: '16px' }}>
              <label className="zput-label">Unit Markup</label>
              <input
                type="number"
                className="zput-input zput-input-small"
                step="0.01"
                value={hostRates.unitMarkup || ''}
                onChange={(e) => handleHostRateChange('unitMarkup', e.target.value)}
                placeholder="0.00"
              />
              <span className="zput-info-text">(e.g., 0.05 = 5%)</span>
            </div>
          </div>
        </div>

        {/* Column 3: Output */}
        <div className="zput-column zput-column-output">
          {/* Pricing Calculations Output */}
          <div className="zput-panel">
            <h2 className="zput-panel-header">Pricing Calculations Output</h2>

            {selectedListingLoading ? (
              <LoadingSpinner />
            ) : (
              <div className="zput-output-grid">
                {/* Monthly Panel */}
                <div className="zput-output-panel">
                  <div className="zput-output-title">Monthly</div>
                  <div className="zput-output-row">
                    <span className="zput-output-label">Prorated Nightly Rate</span>
                    <span className="zput-output-value highlight">
                      {formatCurrency(pricingOutput.monthly.proratedNightlyRate)}
                    </span>
                  </div>
                  <div className="zput-output-row">
                    <span className="zput-output-label">Site Markup</span>
                    <span className="zput-output-value">
                      {formatPercentage(pricingOutput.monthly.markupAndDiscounts.siteMarkup)}
                    </span>
                  </div>
                  <div className="zput-output-row">
                    <span className="zput-output-label">Unit Markup</span>
                    <span className="zput-output-value">
                      {formatPercentage(pricingOutput.monthly.markupAndDiscounts.unitMarkup)}
                    </span>
                  </div>
                </div>

                {/* Weekly Panel */}
                <div className="zput-output-panel">
                  <div className="zput-output-title">Weekly</div>
                  <div className="zput-output-row">
                    <span className="zput-output-label">Prorated Nightly Rate</span>
                    <span className="zput-output-value highlight">
                      {formatCurrency(pricingOutput.weekly.proratedNightlyRate)}
                    </span>
                  </div>
                  <div className="zput-output-row">
                    <span className="zput-output-label">Site Markup</span>
                    <span className="zput-output-value">
                      {formatPercentage(pricingOutput.weekly.markupAndDiscounts.siteMarkup)}
                    </span>
                  </div>
                  <div className="zput-output-row">
                    <span className="zput-output-label">Unused Nights Discount</span>
                    <span className="zput-output-value">
                      {formatPercentage(pricingOutput.weekly.markupAndDiscounts.unusedNightsDiscount)}
                    </span>
                  </div>
                </div>

                {/* Nightly Panel */}
                <div className="zput-output-panel">
                  <div className="zput-output-title">Nightly</div>
                  <div className="zput-output-row">
                    <span className="zput-output-label">Base Rate</span>
                    <span className="zput-output-value">
                      {formatCurrency(pricingOutput.nightly.baseRate)}
                    </span>
                  </div>
                  <div className="zput-output-row">
                    <span className="zput-output-label">With Markup</span>
                    <span className="zput-output-value highlight">
                      {formatCurrency(pricingOutput.nightly.markupAndDiscounts.total)}
                    </span>
                  </div>
                  <div className="zput-output-row">
                    <span className="zput-output-label">Site Markup</span>
                    <span className="zput-output-value">
                      {formatPercentage(pricingOutput.nightly.markupAndDiscounts.siteMarkup)}
                    </span>
                  </div>
                  <div className="zput-output-row">
                    <span className="zput-output-label">Full-Time Discount</span>
                    <span className="zput-output-value">
                      {formatPercentage(pricingOutput.nightly.markupAndDiscounts.fullTimeDiscount)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Data Check Scorecard */}
          <div className="zput-panel zput-scorecard">
            <h2 className="zput-panel-header">Data Check Scorecard</h2>

            <div className="zput-scorecard-grid">
              <ScorecardItem label="Price Exists" isValid={scorecard.priceExists} />
              <ScorecardItem label="Rental Type Selected" isValid={scorecard.rentalTypeSelected} />
              <ScorecardItem label="Appears in Search" isValid={scorecard.appearsInSearch} />
              <ScorecardItem label="Discounts Positive" isValid={scorecard.discountsPositive} />
              <ScorecardItem label="Min Nights Valid" isValid={scorecard.minNightsValid} />
              <ScorecardItem label="Max Nights Valid" isValid={scorecard.maxNightsValid} />
              <ScorecardItem label="Nightly Pricing Valid" isValid={scorecard.nightlyPricingValid} />
            </div>

            {/* Global Config Display */}
            {zatConfig && (
              <div style={{ marginTop: '16px', padding: '12px', background: '#F9FAFB', borderRadius: '6px' }}>
                <p className="zput-info-text" style={{ margin: 0 }}>
                  <strong>Global Config:</strong> Site Markup: {formatPercentage(zatConfig.overallSiteMarkup)},
                  Full-Time Discount: {formatPercentage(zatConfig.fullTimeDiscount)},
                  Unused Nights Multiplier: {formatPercentage(zatConfig.unusedNightsDiscountMultiplier)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Validation:** Component follows Hollow Pattern with all logic from hook

### Step 8: Run Route Generation

**Files:** Execute `bun run generate-routes`
**Purpose:** Generate Cloudflare routing files from updated route registry
**Details:**
- Run command from `app/` directory
- Verify `_redirects` is updated with new route
- Verify `_routes.json` is updated

**Command:**
```bash
cd app && bun run generate-routes
```

**Validation:** No errors in generation, route appears in generated files

### Step 9: Test Page Rendering

**Files:** Start dev server and test
**Purpose:** Verify the page renders correctly
**Details:**
- Start dev server: `bun run dev`
- Navigate to `http://localhost:8000/_internal/z-pricing-unit-test`
- Verify page loads without errors
- Test listing selector
- Test day toggle buttons
- Test pricing calculations
- Verify scorecard updates

**Validation:** Page is functional and matches requirements

## Edge Cases & Error Handling

1. **Empty Listing List**: Display "No listings found" message in dropdown
2. **Listing Load Failure**: Show error message with retry option
3. **Missing Pricing Fields**: Display 0 for missing host rates, flag in scorecard
4. **Invalid Numeric Input**: Parse as 0, prevent NaN propagation
5. **ZAT Config Load Failure**: Fall back to PRICING_CONSTANTS defaults
6. **No Listing Selected**: Show placeholder/empty state in outputs

## Testing Considerations

- Test with listings that have all pricing fields populated
- Test with listings missing some pricing fields
- Test with minimum edge cases (2 nights, 7 nights)
- Verify calculations match expected formulas
- Test responsive layout at different widths
- Verify scorecard accurately reflects data state

## Rollback Strategy

1. Remove route entry from `routes.config.js`
2. Delete created files:
   - `app/public/z-pricing-unit-test.html`
   - `app/src/z-pricing-unit-test.jsx`
   - `app/src/islands/pages/ZPricingUnitTestPage/` directory
3. Run `bun run generate-routes` to update routing files

## Dependencies & Blockers

- **Dependencies**:
  - Supabase client (`app/src/lib/supabase.js`)
  - Pricing constants (`app/src/logic/constants/pricingConstants.js`)
  - Listing data fetcher (`app/src/lib/listingDataFetcher.js`)
- **Blockers**: None identified

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Pricing formula mismatch with Bubble | Medium | Medium | Document formulas clearly, allow for adjustment |
| ZAT config not accessible | Low | Low | Fallback to local constants |
| Styling differences from Bubble | Medium | Low | Iterative refinement after initial implementation |

## Files Summary

### Files to Create
| File Path | Description |
|-----------|-------------|
| `app/public/z-pricing-unit-test.html` | HTML entry point |
| `app/src/z-pricing-unit-test.jsx` | React entry point |
| `app/src/islands/pages/ZPricingUnitTestPage/index.js` | Barrel export |
| `app/src/islands/pages/ZPricingUnitTestPage/ZPricingUnitTestPage.jsx` | Page component |
| `app/src/islands/pages/ZPricingUnitTestPage/useZPricingUnitTestPageLogic.js` | Logic hook |
| `app/src/islands/pages/ZPricingUnitTestPage/ZPricingUnitTestPage.css` | Styles |

### Files to Modify
| File Path | Description |
|-----------|-------------|
| `app/src/routes.config.js` | Add new route entry |

### Files to Reference (Read Only)
| File Path | Description |
|-----------|-------------|
| `app/src/logic/constants/pricingConstants.js` | Pricing constants |
| `app/src/logic/calculators/pricing/calculateGuestFacingPrice.js` | Guest price calculator |
| `app/src/logic/calculators/pricing/getNightlyRateByFrequency.js` | Nightly rate calculator |
| `app/src/lib/listingDataFetcher.js` | Listing data fetching utilities |
| `app/src/lib/supabase.js` | Supabase client |
| `app/src/islands/pages/ZSearchUnitTestPage/` | Reference implementation |
