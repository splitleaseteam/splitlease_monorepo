# Z-Pricing Unit Test Page - Implementation Plan

**Created:** 2026-01-27
**Updated:** 2026-01-27 (v2.0 - Added comprehensive requirements)
**Status:** Ready for Implementation
**Complexity:** High (Multi-file, UI + Logic + Edge Function integration)
**Classification:** BUILD

---

## Executive Summary

This plan details the implementation of an internal pricing validation page (`/_internal/z-pricing-unit-test`) that replicates the functionality of the Bubble z-pricing-unit-test page. The page serves as a **unit testing and pricing validation tool** that calculates rental prices across three rental models: Nightly, Weekly, and Monthly rentals.

**Page Properties (from Bubble):**
- Title: `Unit.Schedule.Selector`
- Width: 1500px (fixed)
- Height: 4279px (scrollable)
- Background: #FFFFFF

**Key Functionalities:**
1. Listing search and selection interface (by ID, host email, or name)
2. Dynamic pricing calculations for nightly, weekly, and monthly rental types
3. Prorated rate calculations for different rental durations
4. Markup and discount calculations
5. Host compensation calculations
6. Unused nights discount calculations
7. Comprehensive data validation and checks (7 validation flags)
8. Price list generation and updates
9. Workflow vs Formula comparison

---

## Architecture Mapping: Bubble → Split Lease

### Data Type Mapping

| Bubble Data Type | Split Lease Equivalent | Location |
|-----------------|------------------------|----------|
| `Listing` | `listing` table | Supabase |
| `pricing_list` | `pricing_list` table | Supabase |
| `ZAT-Price Configuration` | `zat_price_configuration` table | Supabase |
| `Rental Type` option set | `rental type` column (enum) | `listing` table |

### Component Mapping

| Bubble Element | Split Lease Equivalent | Status |
|----------------|------------------------|--------|
| `⁍ Listing Schedule Selector` (Reusable) | `ListingScheduleSelector.jsx` | ✅ Exists |
| `D: listing selector` (Dropdown) | Custom dropdown with search | 🆕 Create |
| Search Input Field | Text input with filter | 🆕 Create |
| Price List Table | `PricingListGrid.jsx` | 🆕 Create |
| Workflow vs Formula Check | `WorkflowFormulaCheckCard.jsx` | 🆕 Create |
| Data Check Scorecard | `DataValidationCard.jsx` | 🆕 Create |

### Calculation Mapping

| Bubble Formula | Split Lease Calculator | Status |
|----------------|------------------------|--------|
| Combined Markup | `calculateCombinedMarkup.js` | ✅ Exists |
| Host Compensation Array | `calculateHostCompensationArray.js` | ✅ Exists |
| Unused Nights Discount | `calculateUnusedNightsDiscountArray.js` | ✅ Exists |
| Markup/Discount Multipliers | `calculateMarkupAndDiscountMultipliersArray.js` | ✅ Exists |
| Nightly Prices Array | `calculateNightlyPricesArray.js` | ✅ Exists |
| Lowest Nightly Price | `calculateLowestNightlyPrice.js` | ✅ Exists |
| Slope | `calculateSlope.js` | ✅ Exists |
| 4-Week Rent | `calculateFourWeekRent.js` | ✅ Exists |
| Prorated Nightly Rate | 🆕 `calculateProratedNightlyRate.js` | 🆕 Create |
| Monthly Avg Nightly | 🆕 `calculateMonthlyAvgNightly.js` | 🆕 Create |
| Average Weekly Price | 🆕 `calculateAverageWeeklyPrice.js` | 🆕 Create |
| Reservation Total | `calculateReservationTotal.js` | ✅ Exists |

---

## Page Sections (Matching Bubble Layout)

### Section 1: Listing Search and Selection
**Purpose:** Search and select a listing to analyze

| Element | Bubble ID | Type | Data Binding |
|---------|-----------|------|--------------|
| Search Input | `crlgK0` | Textbox | Placeholder: "Search Listing using ID, host email, Host or Listing Name" |
| Clear Button | `crlgL0` | Button | Clears search |
| Listing Dropdown | `ctQOg0` | Dropdown | Shows filtered listings |
| Listing ID Display | `cvAOE0` | Text | `listing._id` |
| Listing Name Display | `cnhwo0` | Text | `listing.Name` |

### Section 2: Listing Schedule Selector (Reusable)
**Purpose:** Day selection and schedule configuration

| Element | Bubble ID | Type | Data Binding |
|---------|-----------|------|--------------|
| Reusable Element | - | `⁍ Listing Schedule Selector` | Parent group's Listing |
| Reservation Span Dropdown | `cnhxZ0` | Dropdown | Week count options |
| Reservation Span Input | - | Number Input | Manual week entry |
| Set Span Button | `cnhxd0` | Button | Confirms span |
| Guest Pattern Input | `cnhxg0` | Dropdown | Pattern selection |
| Set Pattern Button | `cnhxh0` | Button | Confirms pattern |

### Section 3: Host Prices Input
**Purpose:** Display all host pricing configuration

| Field | Bubble ID | Database Column |
|-------|-----------|-----------------|
| Host Comp Style | `cnhwr0` | `rental type` → Display |
| Weekly Host Rate | `cnhwv0` | `💰Weekly Host Rate` |
| Monthly Host Rate | `cnhwu0` | `💰Monthly Host Rate` |
| 2 Night Host Rate | `cnhxB0` | `💰Nightly Host Rate for 2 nights` |
| 3 Night Host Rate | `cnhxE0` | `💰Nightly Host Rate for 3 nights` |
| 4 Night Host Rate | `cnhxH0` | `💰Nightly Host Rate for 4 nights` |
| 5 Night Host Rate | `cnhxK0` | `💰Nightly Host Rate for 5 nights` |
| Damage Deposit | `cnhxN0` | `💰Damage Deposit` |
| Cleaning Deposit | `cnhxQ0` | `💰Cleaning Cost / Maintenance Fee` |
| Nights/Wk Available | `cnhxT0` | `# of nights available` |
| Weeks Offered | `cnhxW0` | `Weeks offered` → Display |
| Nights Available List | `crrIL2` | `Nights Available (List of Nights)` |

### Section 4: Host Guidelines
**Purpose:** Display min/max constraints

| Field | Bubble ID | Calculation |
|-------|-----------|-------------|
| Minimum Nights | `cnhyu0` | `listing['Minimum Nights']` |
| Maximum Nights | `cnhyx0` | `listing['Maximum Nights']` |
| Minimum Days | `cnhzA0` | `Minimum Nights + 1` |
| Maximum Days | `cnhzD0` | `Maximum Nights + 1` |
| Minimum Weeks | `cnhzG0` | `listing['Minimum Weeks']` |
| Maximum Weeks | `cnhzJ0` | `listing['Maximum Weeks']` |

### Section 5: Prorated Nightly Rates
**Purpose:** Show per-night rates for each rental type

| Field | Bubble ID | Calculation |
|-------|-----------|-------------|
| Prorated Rate (Weekly) | `cnhwg0` | `weeklyHostRate / selectedNights` |
| Prorated Rate (Monthly) | `cnhwd0` | `monthlyHostRate / avgDaysPerMonth / selectedNights * 7` |
| Monthly Avg Nightly | `cniCF0` | `monthlyHostRate / avgDaysPerMonth` |
| Average Weekly Price | `cniCL0` | `monthlyAvgNightly * 7` |
| Selected Nightly Host Rate | `cnhwy0` | From selector |

### Section 6: Rental Type Multipliers
**Purpose:** Display night price multipliers per rental type

| Field | Bubble ID | Source |
|-------|-----------|--------|
| Monthly Multiplier | `cnhyf0` | `ListingScheduleSelector.priceMultiplierMonthly` |
| Weekly Multiplier | `cnhyi0` | `ListingScheduleSelector.priceMultiplierWeekly` |
| Nightly Multiplier | `cnhyl0` | `ListingScheduleSelector.priceMultiplierNightly` |

### Section 7: Markups and Discounts
**Purpose:** Show combined markup calculations per rental type

| Field | Bubble ID | Calculation |
|-------|-----------|-------------|
| Markup (Monthly) | `cniCO0` | `siteMarkup + unitMarkup - unusedNightsDiscount + 1` |
| Markup (Weekly) | `cniEb0` | `siteMarkup + unitMarkup - unusedNightsDiscount + 1` |
| Markup (Nightly) | `cniEz0` | `siteMarkup + unitMarkup - unusedNightsDiscount + 1` |

### Section 8: Reservation Span Calculations
**Purpose:** Show time-based calculations

| Field | Bubble ID | Calculation |
|-------|-----------|-------------|
| Months in Span | `cnhyW0` | `reservationSpan / 4.33` (formatted) |
| Actual Weeks (4 week) | `cnhyP0` | From selector |
| Actual Weeks (Full Span) | `cnhyZ0` | From selector |
| Reservation Span Display | `cnhzm0` | `reservationSpan` weeks |
| Required Pattern | `cnhzj0` | `guestPattern` Display |

### Section 9: ZAT-Price Configuration
**Purpose:** Display global pricing configuration

| Field | Source |
|-------|--------|
| Overall Site Markup | `zatConfig.overallSiteMarkup` |
| Weekly Price Adjustment | `zatConfig.weeklyMarkup` |
| Unused Nights Discount Multiplier | `zatConfig.unusedNightsDiscountMultiplier` |
| Average Days per Month | `zatConfig.avgDaysPerMonth` |
| Full Time (7 Nights) Discount | `zatConfig.fullTimeDiscount` |

### Section 10: Price List Table
**Purpose:** Comprehensive 7-row grid showing all pricing arrays

| Column | Data Source | Description |
|--------|-------------|-------------|
| Night Count | 1-7 | Row identifier |
| Starting Nightly | `pricingList.startingNightlyPrice` | Base price |
| Price Map | `listing.priceNumber` | Legacy field |
| Host Compensation | `pricingList.hostCompensation[n]` | Per-night host rate |
| Unused Nights | `7 - n` | Nights not used |
| Unused Nights Discount | `pricingList.unusedNightsDiscount[n]` | Discount amount |
| Combined Markup | `pricingList.combinedMarkup` | Total markup |
| Multiplier | `pricingList.markupDiscountMultiplier[n]` | Final multiplier |
| Full Time Discount | `pricingList.fullTimeDiscount` | 7-night discount |
| Nightly Price | `pricingList.nightlyPrices[n]` | Guest-facing price |

### Section 11: Workflow vs Formula Check
**Purpose:** Compare workflow calculations vs direct formulas

| Metric | Workflow Value | Formula Value | Match Status |
|--------|----------------|---------------|--------------|
| 4 Week Rent | From workflow | Direct calculation | ✅/❌ |
| Initial Reservation Payment | From workflow | Direct calculation | ✅/❌ |
| Listing Nightly Price | From workflow | Direct calculation | ✅/❌ |
| Total Reservation Price | From workflow | Direct calculation | ✅/❌ |

### Section 12: Data Validation Checks
**Purpose:** Scorecard for data quality

| Check | Bubble ID | Validation Logic |
|-------|-----------|------------------|
| Price exists | `cniDL0` | `pricingList !== null` |
| Rental type selected | `cniDQ0` | `listing['rental type'] !== null` |
| Appears in Search | `cniDW0` | Complex visibility check |
| Discounts are positive | `cniDc0` | `unusedNightsDiscount >= 0` |
| Unused nights not decreasing | `cniED0` | `discount[n] >= discount[n+1]` |
| Min/Max Makes Sense | `cniEM0` | `minNights <= maxNights` |
| Nightly Pricing All Good | - | All above checks pass |

---

## File Structure

```
app/
├── public/
│   └── z-pricing-unit-test.html                    # HTML entry point
├── src/
│   ├── z-pricing-unit-test.jsx                     # React entry point
│   └── islands/
│       └── pages/
│           └── ZPricingUnitTestPage/
│               ├── ZPricingUnitTestPage.jsx        # UI component (hollow)
│               ├── useZPricingUnitTestPageLogic.js # All logic
│               ├── ZPricingUnitTestPage.css        # Styles
│               └── components/
│                   ├── Section1ListingSearch.jsx   # Search + dropdown
│                   ├── Section2ScheduleSelector.jsx# Wraps ListingScheduleSelector
│                   ├── Section3HostPricesInput.jsx # Host rates display
│                   ├── Section4HostGuidelines.jsx  # Min/max constraints
│                   ├── Section5ProratedRates.jsx   # Per-night rates
│                   ├── Section6Multipliers.jsx     # Rental type multipliers
│                   ├── Section7MarkupsDiscounts.jsx# Markup calculations
│                   ├── Section8ReservationSpan.jsx # Span calculations
│                   ├── Section9ZatConfig.jsx       # Global config display
│                   ├── Section10PricingListGrid.jsx# 7-row pricing table
│                   ├── Section11WorkflowCheck.jsx  # Workflow vs Formula
│                   └── Section12DataValidation.jsx # Validation scorecard
└── logic/
    └── calculators/
        └── pricingList/
            ├── calculateProratedNightlyRate.js     # 🆕 NEW
            ├── calculateMonthlyAvgNightly.js       # 🆕 NEW
            └── calculateAverageWeeklyPrice.js      # 🆕 NEW
```

---

## Bubble Workflows → Split Lease Handlers

The Bubble page has **16 workflows**. Here's the complete mapping:

| # | Bubble Workflow | Trigger | Split Lease Handler | Implementation |
|---|-----------------|---------|---------------------|----------------|
| 1 | `(data check) selected nightly price based on selector is clicked` | Element click | `handleDataCheckClick()` | Sets state for selected nightly price validation |
| 2 | `4 week rent calculation formula is clicked` | Element click | `handleFourWeekRentClick()` | Triggers 4-week rent calculation display |
| 3 | `B: Run Price List is clicked` | Button click | `handleUpdatePricingList()` | Edge Function `pricing-list/update` |
| 4 | `B: Run Starting Nightly Price is clicked` (cnila1) | Button click | `handleUpdateStartingNightly()` | Edge Function `pricing-list/recalculate` |
| 5 | `B: Run Starting Nightly Price is clicked` (cnils1) | Button click | `handleUpdateStartingNightly()` | Duplicate of #4 |
| 6 | `Button Run Checks is clicked` | Button click | `handleRunChecks()` | Runs all calculators locally, compares results |
| 7 | `Button Set required pattern is clicked` | Button click | `handleSetPattern()` | `setGuestPattern(value)` |
| 8 | `Button Set Reservation Span is clicked` | Button click | `handleSetReservationSpan()` | `setReservationSpan(value)` |
| 9 | `G: Workflow Double Check is clicked` | Element click | `handleDoubleCheck()` | Runs workflow vs formula comparison |
| 10 | `I: Remove is clicked - Reset Input field` | Button click | `handleClearSearch()` | `setSearchQuery(''); setSelectedListingId('')` |
| 11 | `Markup and Discounts for Nightly Listings is clicked` | Element click | `handleMarkupClick('Nightly')` | Opens/calculates nightly markups |
| 12 | `Markup and Discounts for Weekly Listings is clicked` | Element click | `handleMarkupClick('Weekly')` | Opens/calculates weekly markups |
| 13 | `Markups and Discounts is clicked` | Element click | `handleMarkupClick('Monthly')` | General markup handler |
| 14 | `Prorated Nightly Price (monthly) is clicked` | Element click | `handleProratedClick('Monthly')` | Recalculates monthly prorated rate |
| 15 | `Prorated Nightly Price (Weekly Listings) is clicked` | Element click | `handleProratedClick('Weekly')` | Recalculates weekly prorated rate |
| 16 | `purple alert (copy)` | Element click | `handleShowAlert()` | Toast notification display |

---

## Implementation Phases

### Phase 1: Foundation (Files + Routes)

#### Task 1.1: Create HTML Entry Point
**File:** `app/public/z-pricing-unit-test.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Unit.Schedule.Selector | Pricing Unit Test</title>
  <link rel="icon" type="image/png" href="/favicon.png" />
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/z-pricing-unit-test.jsx"></script>
</body>
</html>
```

#### Task 1.2: Create React Entry Point
**File:** `app/src/z-pricing-unit-test.jsx`

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ZPricingUnitTestPage from './islands/pages/ZPricingUnitTestPage/ZPricingUnitTestPage.jsx';

createRoot(document.getElementById('app')).render(
  <StrictMode>
    <ZPricingUnitTestPage />
  </StrictMode>
);
```

#### Task 1.3: Verify Route Registration
**File:** `app/src/routes.config.js`
**Status:** ✅ Already registered at lines 746-754

---

### Phase 2: New Calculators

#### Task 2.1: Create Prorated Nightly Rate Calculator
**File:** `app/src/logic/calculators/pricingList/calculateProratedNightlyRate.js`

**Purpose:** Calculate prorated nightly rate based on rental type.

**Formulas (from Bubble):**
- **Weekly:** `weeklyHostRate / selectedNights`
- **Monthly:** `(monthlyHostRate / avgDaysPerMonth) * 7 / selectedNights`
- **Nightly:** Use host rate for corresponding night count

```javascript
/**
 * Calculate prorated nightly rate based on rental type.
 *
 * @intent Convert host compensation to per-night rate for price display.
 * @rule Weekly: weeklyHostRate / selectedNights
 * @rule Monthly: (monthlyHostRate / avgDaysPerMonth) * 7 / selectedNights
 * @rule Nightly: Use specific night rate from host rates array
 *
 * @param {object} params - Named parameters.
 * @param {string} params.rentalType - 'Monthly', 'Weekly', or 'Nightly'
 * @param {number} params.selectedNights - Number of nights selected (1-7)
 * @param {number} params.weeklyHostRate - Weekly host rate
 * @param {number} params.monthlyHostRate - Monthly host rate
 * @param {number} params.avgDaysPerMonth - Average days per month (from ZAT config)
 * @param {Array<number|null>} params.nightlyRates - 7-element array of nightly host rates
 * @returns {number} Prorated nightly rate
 *
 * @throws {Error} If required parameters are missing or invalid.
 */
export function calculateProratedNightlyRate({
  rentalType,
  selectedNights,
  weeklyHostRate,
  monthlyHostRate,
  avgDaysPerMonth,
  nightlyRates
}) {
  if (typeof selectedNights !== 'number' || selectedNights < 1 || selectedNights > 7) {
    throw new Error(
      `calculateProratedNightlyRate: selectedNights must be 1-7, got ${selectedNights}`
    );
  }

  switch (rentalType) {
    case 'Weekly': {
      if (typeof weeklyHostRate !== 'number' || isNaN(weeklyHostRate)) {
        throw new Error('calculateProratedNightlyRate: weeklyHostRate required for Weekly rental');
      }
      return roundToTwoDecimals(weeklyHostRate / selectedNights);
    }

    case 'Monthly': {
      if (typeof monthlyHostRate !== 'number' || isNaN(monthlyHostRate)) {
        throw new Error('calculateProratedNightlyRate: monthlyHostRate required for Monthly rental');
      }
      if (typeof avgDaysPerMonth !== 'number' || avgDaysPerMonth <= 0) {
        throw new Error('calculateProratedNightlyRate: avgDaysPerMonth must be positive');
      }
      const monthlyAvgNightly = monthlyHostRate / avgDaysPerMonth;
      const avgWeeklyPrice = monthlyAvgNightly * 7;
      return roundToTwoDecimals(avgWeeklyPrice / selectedNights);
    }

    case 'Nightly': {
      if (!Array.isArray(nightlyRates) || nightlyRates.length !== 7) {
        throw new Error('calculateProratedNightlyRate: nightlyRates must be 7-element array');
      }
      const rate = nightlyRates[selectedNights - 1];
      if (rate === null || rate === undefined) {
        throw new Error(`calculateProratedNightlyRate: No rate for ${selectedNights} nights`);
      }
      return roundToTwoDecimals(rate);
    }

    default:
      throw new Error(`calculateProratedNightlyRate: Unknown rentalType "${rentalType}"`);
  }
}

function roundToTwoDecimals(value) {
  return Math.round(value * 100) / 100;
}
```

#### Task 2.2: Create Monthly Average Nightly Calculator
**File:** `app/src/logic/calculators/pricingList/calculateMonthlyAvgNightly.js`

```javascript
/**
 * Calculate monthly average nightly rate.
 *
 * @intent Convert monthly host rate to daily equivalent for pricing.
 * @rule monthlyAvgNightly = monthlyHostRate / avgDaysPerMonth
 *
 * @param {object} params - Named parameters.
 * @param {number} params.monthlyHostRate - Monthly host rate
 * @param {number} params.avgDaysPerMonth - Average days per month (typically ~30.4)
 * @returns {number} Average nightly rate
 */
export function calculateMonthlyAvgNightly({ monthlyHostRate, avgDaysPerMonth }) {
  if (typeof monthlyHostRate !== 'number' || isNaN(monthlyHostRate)) {
    throw new Error(
      `calculateMonthlyAvgNightly: monthlyHostRate must be a number, got ${typeof monthlyHostRate}`
    );
  }

  if (typeof avgDaysPerMonth !== 'number' || avgDaysPerMonth <= 0) {
    throw new Error(
      `calculateMonthlyAvgNightly: avgDaysPerMonth must be positive, got ${avgDaysPerMonth}`
    );
  }

  return roundToTwoDecimals(monthlyHostRate / avgDaysPerMonth);
}

function roundToTwoDecimals(value) {
  return Math.round(value * 100) / 100;
}
```

#### Task 2.3: Create Average Weekly Price Calculator
**File:** `app/src/logic/calculators/pricingList/calculateAverageWeeklyPrice.js`

```javascript
/**
 * Calculate average weekly price for monthly listings.
 *
 * @intent Convert monthly nightly rate to weekly equivalent.
 * @rule avgWeeklyPrice = monthlyAvgNightly * 7
 *
 * @param {object} params - Named parameters.
 * @param {number} params.monthlyAvgNightly - Monthly average nightly rate
 * @returns {number} Average weekly price
 */
export function calculateAverageWeeklyPrice({ monthlyAvgNightly }) {
  if (typeof monthlyAvgNightly !== 'number' || isNaN(monthlyAvgNightly)) {
    throw new Error(
      `calculateAverageWeeklyPrice: monthlyAvgNightly must be a number, got ${typeof monthlyAvgNightly}`
    );
  }

  return roundToTwoDecimals(monthlyAvgNightly * 7);
}

function roundToTwoDecimals(value) {
  return Math.round(value * 100) / 100;
}
```

#### Task 2.4: Update Calculator Index
**File:** `app/src/logic/calculators/pricingList/index.js`

```javascript
// Add exports for new calculators
export { calculateProratedNightlyRate } from './calculateProratedNightlyRate.js';
export { calculateMonthlyAvgNightly } from './calculateMonthlyAvgNightly.js';
export { calculateAverageWeeklyPrice } from './calculateAverageWeeklyPrice.js';
```

---

### Phase 3: Page Logic Hook

#### Task 3.1: Create Page Logic Hook
**File:** `app/src/islands/pages/ZPricingUnitTestPage/useZPricingUnitTestPageLogic.js`

**Complete State Management:**

```javascript
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabase.js';
import { fetchZatPriceConfiguration } from '../../../lib/listingDataFetcher.js';
import {
  calculateCombinedMarkup,
  calculateHostCompensationArray,
  calculateUnusedNightsDiscountArray,
  calculateMarkupAndDiscountMultipliersArray,
  calculateNightlyPricesArray,
  calculateLowestNightlyPrice,
  calculateSlope,
  calculateProratedNightlyRate,
  calculateMonthlyAvgNightly,
  calculateAverageWeeklyPrice
} from '../../../logic/calculators/pricingList/index.js';
import { calculateFourWeekRent } from '../../../logic/calculators/pricing/calculateFourWeekRent.js';
import { adaptPricingListFromSupabase } from '../../../logic/processors/pricingList/adaptPricingListFromSupabase.js';
import { extractHostRatesFromListing } from '../../../logic/processors/pricingList/extractHostRatesFromListing.js';

const DEFAULT_RESERVATION_SPAN = 13;

export function useZPricingUnitTestPageLogic() {
  // ─────────────────────────────────────────────────────────────
  // SELECTION STATE
  // ─────────────────────────────────────────────────────────────
  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [listingsError, setListingsError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedListingId, setSelectedListingId] = useState('');
  const [selectedListing, setSelectedListing] = useState(null);

  // ─────────────────────────────────────────────────────────────
  // CONFIGURATION STATE
  // ─────────────────────────────────────────────────────────────
  const [zatConfig, setZatConfig] = useState(null);
  const [reservationSpan, setReservationSpan] = useState(DEFAULT_RESERVATION_SPAN);
  const [guestPattern, setGuestPattern] = useState('every-week');

  // ─────────────────────────────────────────────────────────────
  // PRICING DATA STATE
  // ─────────────────────────────────────────────────────────────
  const [pricingList, setPricingList] = useState(null);
  const [calculatedPricing, setCalculatedPricing] = useState(null);
  const [formulaPricing, setFormulaPricing] = useState(null);

  // ─────────────────────────────────────────────────────────────
  // SCHEDULE SELECTOR STATE
  // ─────────────────────────────────────────────────────────────
  const [selectedDays, setSelectedDays] = useState([]);
  const [selectedNights, setSelectedNights] = useState(0);
  const [scheduleState, setScheduleState] = useState(null);
  const [priceBreakdown, setPriceBreakdown] = useState(null);

  // ─────────────────────────────────────────────────────────────
  // VALIDATION STATE (7 checks from Bubble)
  // ─────────────────────────────────────────────────────────────
  const [validationFlags, setValidationFlags] = useState({
    priceExists: false,
    rentalTypeSelected: false,
    appearsInSearch: false,
    discountsPositive: false,
    unusedNightsNotDecreasing: false,
    minMaxMakesSense: false,
    allGood: false
  });

  // ─────────────────────────────────────────────────────────────
  // COMPARISON STATE (Workflow vs Formula)
  // ─────────────────────────────────────────────────────────────
  const [comparisonResults, setComparisonResults] = useState({
    fourWeekRent: { workflow: 0, formula: 0, match: true },
    initialPayment: { workflow: 0, formula: 0, match: true },
    nightlyPrice: { workflow: 0, formula: 0, match: true },
    totalReservation: { workflow: 0, formula: 0, match: true }
  });

  // ─────────────────────────────────────────────────────────────
  // DERIVED VALUES
  // ─────────────────────────────────────────────────────────────
  const filteredListings = useMemo(() => {
    if (!searchQuery.trim()) return listings;
    const query = searchQuery.toLowerCase();
    return listings.filter(listing =>
      listing._id?.toLowerCase().includes(query) ||
      listing.Name?.toLowerCase().includes(query) ||
      listing.hostEmail?.toLowerCase().includes(query)
    );
  }, [listings, searchQuery]);

  const scheduleListing = useMemo(() => {
    if (!selectedListing) return null;
    return buildScheduleListing(selectedListing);
  }, [selectedListing]);

  // ─────────────────────────────────────────────────────────────
  // DATA LOADING
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    document.title = 'Unit.Schedule.Selector | Pricing Unit Test';
    loadListings();
    loadZatConfig();
  }, []);

  async function loadListings() {
    try {
      setListingsLoading(true);
      setListingsError(null);

      const { data, error } = await supabase
        .from('listing')
        .select(`
          _id,
          Name,
          "rental type",
          "Weeks offered",
          "💰Nightly Host Rate for 2 nights",
          "💰Nightly Host Rate for 3 nights",
          "💰Nightly Host Rate for 4 nights",
          "💰Nightly Host Rate for 5 nights",
          "💰Weekly Host Rate",
          "💰Monthly Host Rate",
          "💰Damage Deposit",
          "💰Cleaning Cost / Maintenance Fee",
          "💰Unit Markup",
          "Minimum Nights",
          "Maximum Nights",
          "Minimum Weeks",
          "Maximum Weeks",
          "Nights_Available",
          "Nights Available (numbers)",
          "Days Available (List of Days)",
          "# of nights available",
          pricing_list_id
        `)
        .eq('Deleted', false)
        .order('Modified Date', { ascending: false })
        .limit(500);

      if (error) throw error;
      setListings(data || []);
    } catch (err) {
      setListingsError(`Failed to load listings: ${err.message}`);
    } finally {
      setListingsLoading(false);
    }
  }

  async function loadZatConfig() {
    try {
      const config = await fetchZatPriceConfiguration();
      setZatConfig(config);
    } catch (err) {
      console.error('Failed to load ZAT config:', err);
    }
  }

  async function loadPricingList(listingId) {
    try {
      const { data, error } = await supabase
        .from('pricing_list')
        .select('*')
        .eq('listing_id', listingId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setPricingList(data ? adaptPricingListFromSupabase(data) : null);
    } catch (err) {
      console.error('Failed to load pricing list:', err);
      setPricingList(null);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // HANDLERS (All 16 workflows mapped)
  // ─────────────────────────────────────────────────────────────

  // Workflow 10: Clear search
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setSelectedListingId('');
    setSelectedListing(null);
    setPricingList(null);
  }, []);

  // Listing selection
  const handleListingChange = useCallback(async (listingId) => {
    setSelectedListingId(listingId);
    if (!listingId) {
      setSelectedListing(null);
      setPricingList(null);
      return;
    }

    const listing = listings.find(l => l._id === listingId);
    setSelectedListing(listing || null);
    if (listing?.pricing_list_id) {
      await loadPricingList(listing._id);
    }
  }, [listings]);

  // Workflow 7: Set pattern
  const handleSetPattern = useCallback((pattern) => {
    setGuestPattern(pattern);
  }, []);

  // Workflow 8: Set reservation span
  const handleSetReservationSpan = useCallback((value) => {
    const parsed = parseInt(value, 10);
    setReservationSpan(Number.isNaN(parsed) ? DEFAULT_RESERVATION_SPAN : Math.max(parsed, 1));
  }, []);

  // Schedule selector callbacks
  const handleDaySelectionChange = useCallback((days) => {
    setSelectedDays(days);
    setSelectedNights(days.length > 0 ? days.length - 1 : 0);
  }, []);

  const handleScheduleChange = useCallback((state) => {
    setScheduleState(state);
  }, []);

  const handlePriceChange = useCallback((breakdown) => {
    setPriceBreakdown(breakdown);
  }, []);

  // Workflow 6: Run all checks
  const handleRunChecks = useCallback(() => {
    if (!selectedListing || !zatConfig) return;

    // Run validation
    const flags = runValidationChecks(selectedListing, pricingList, zatConfig);
    setValidationFlags(flags);

    // Run calculations and comparisons
    runAllCalculations();
  }, [selectedListing, zatConfig, pricingList]);

  // Workflow 3: Update pricing list
  const handleUpdatePricingList = useCallback(async () => {
    if (!selectedListing) return;

    try {
      const response = await fetch('/api/pricing-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'recalculate',
          payload: { listing_id: selectedListing._id }
        })
      });

      if (!response.ok) throw new Error('Failed to update pricing list');

      // Reload pricing list
      await loadPricingList(selectedListing._id);
    } catch (err) {
      console.error('Update pricing list error:', err);
    }
  }, [selectedListing]);

  // Workflow 4/5: Update starting nightly
  const handleUpdateStartingNightly = useCallback(async () => {
    if (!selectedListing) return;

    try {
      const response = await fetch('/api/pricing-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'recalculate',
          payload: { listing_id: selectedListing._id }
        })
      });

      if (!response.ok) throw new Error('Failed to update starting nightly');

      await loadPricingList(selectedListing._id);
    } catch (err) {
      console.error('Update starting nightly error:', err);
    }
  }, [selectedListing]);

  // ─────────────────────────────────────────────────────────────
  // CALCULATION FUNCTIONS
  // ─────────────────────────────────────────────────────────────
  function runAllCalculations() {
    if (!selectedListing || !zatConfig) return;

    const hostRates = extractHostRatesFromListing(selectedListing);
    const nightCount = selectedNights || 3; // Default to 3 nights

    // Workflow calculations (using existing calculators)
    const workflowResults = {
      nightlyPrice: priceBreakdown?.pricePerNight || 0,
      fourWeekRent: priceBreakdown?.fourWeekRent || 0,
      initialPayment: priceBreakdown?.initialPayment || 0,
      totalReservation: priceBreakdown?.reservationTotal || 0
    };

    // Direct formula calculations
    const rentalType = selectedListing['rental type'] || 'Nightly';
    const proratedNightly = calculateProratedNightlyRate({
      rentalType,
      selectedNights: nightCount,
      weeklyHostRate: selectedListing['💰Weekly Host Rate'] || 0,
      monthlyHostRate: selectedListing['💰Monthly Host Rate'] || 0,
      avgDaysPerMonth: zatConfig.avgDaysPerMonth || 30.4,
      nightlyRates: hostRates
    });

    const combinedMarkup = calculateCombinedMarkup({
      unitMarkup: selectedListing['💰Unit Markup'] || 0,
      siteMarkup: zatConfig.overallSiteMarkup || 0.17
    });

    const formulaNightlyPrice = proratedNightly * (1 + combinedMarkup);
    const formulaFourWeekRent = calculateFourWeekRent({
      nightlyPrice: formulaNightlyPrice,
      nightsPerWeek: nightCount
    });
    const damageDeposit = selectedListing['💰Damage Deposit'] || 0;

    const formulaResults = {
      nightlyPrice: formulaNightlyPrice,
      fourWeekRent: formulaFourWeekRent,
      initialPayment: formulaFourWeekRent + damageDeposit,
      totalReservation: formulaNightlyPrice * nightCount * reservationSpan
    };

    setCalculatedPricing(workflowResults);
    setFormulaPricing(formulaResults);

    // Compare results
    setComparisonResults({
      fourWeekRent: {
        workflow: workflowResults.fourWeekRent,
        formula: formulaResults.fourWeekRent,
        match: Math.abs(workflowResults.fourWeekRent - formulaResults.fourWeekRent) < 0.01
      },
      initialPayment: {
        workflow: workflowResults.initialPayment,
        formula: formulaResults.initialPayment,
        match: Math.abs(workflowResults.initialPayment - formulaResults.initialPayment) < 0.01
      },
      nightlyPrice: {
        workflow: workflowResults.nightlyPrice,
        formula: formulaResults.nightlyPrice,
        match: Math.abs(workflowResults.nightlyPrice - formulaResults.nightlyPrice) < 0.01
      },
      totalReservation: {
        workflow: workflowResults.totalReservation,
        formula: formulaResults.totalReservation,
        match: Math.abs(workflowResults.totalReservation - formulaResults.totalReservation) < 0.01
      }
    });
  }

  function runValidationChecks(listing, pricingList, zatConfig) {
    const priceExists = pricingList !== null && pricingList.nightlyPrices?.some(p => p > 0);
    const rentalTypeSelected = listing['rental type'] !== null && listing['rental type'] !== '';
    const minNights = listing['Minimum Nights'] || 0;
    const maxNights = listing['Maximum Nights'] || 7;
    const minMaxMakesSense = minNights <= maxNights;

    const discountsPositive = !pricingList?.unusedNightsDiscount ||
      pricingList.unusedNightsDiscount.every(d => d >= 0);

    const unusedNightsNotDecreasing = !pricingList?.unusedNightsDiscount ||
      pricingList.unusedNightsDiscount.every((d, i, arr) =>
        i === 0 || d <= arr[i - 1]
      );

    const appearsInSearch = priceExists && rentalTypeSelected;

    const allGood = priceExists && rentalTypeSelected && minMaxMakesSense &&
      discountsPositive && unusedNightsNotDecreasing;

    return {
      priceExists,
      rentalTypeSelected,
      appearsInSearch,
      discountsPositive,
      unusedNightsNotDecreasing,
      minMaxMakesSense,
      allGood
    };
  }

  // ─────────────────────────────────────────────────────────────
  // RETURN VALUE
  // ─────────────────────────────────────────────────────────────
  return {
    // Selection
    listings,
    filteredListings,
    listingsLoading,
    listingsError,
    searchQuery,
    selectedListingId,
    selectedListing,

    // Configuration
    zatConfig,
    reservationSpan,
    guestPattern,

    // Pricing data
    pricingList,
    scheduleListing,
    calculatedPricing,
    formulaPricing,

    // Schedule state
    selectedDays,
    selectedNights,
    scheduleState,
    priceBreakdown,

    // Validation & comparison
    validationFlags,
    comparisonResults,

    // Handlers
    setSearchQuery,
    handleClearSearch,
    handleListingChange,
    handleSetPattern,
    handleSetReservationSpan,
    handleDaySelectionChange,
    handleScheduleChange,
    handlePriceChange,
    handleRunChecks,
    handleUpdatePricingList,
    handleUpdateStartingNightly
  };
}

// Helper function to build schedule listing object
function buildScheduleListing(listing) {
  return {
    id: listing._id,
    name: listing.Name || 'Untitled',
    rentalType: listing['rental type'] || 'Nightly',
    weeksOffered: listing['Weeks offered'] || 'Every week',
    unitMarkup: listing['💰Unit Markup'] || 0,
    cleaningFee: listing['💰Cleaning Cost / Maintenance Fee'] || 0,
    damageDeposit: listing['💰Damage Deposit'] || 0,
    weeklyHostRate: listing['💰Weekly Host Rate'] || 0,
    monthlyHostRate: listing['💰Monthly Host Rate'] || 0,
    rate2Night: listing['💰Nightly Host Rate for 2 nights'] || 0,
    rate3Night: listing['💰Nightly Host Rate for 3 nights'] || 0,
    rate4Night: listing['💰Nightly Host Rate for 4 nights'] || 0,
    rate5Night: listing['💰Nightly Host Rate for 5 nights'] || 0,
    minimumNights: listing['Minimum Nights'] || 0,
    maximumNights: listing['Maximum Nights'] || 7,
    minimumWeeks: listing['Minimum Weeks'] || 6,
    maximumWeeks: listing['Maximum Weeks'] || 26,
    nightsPerWeek: listing['# of nights available'] || 7,
    daysAvailable: listing['Days Available (List of Days)'] || [0, 1, 2, 3, 4, 5, 6],
    nightsAvailable: listing['Nights_Available'] || listing['Nights Available (numbers)'] || []
  };
}
```

---

### Phase 4: UI Components

#### Task 4.1: Main Page Component
**File:** `app/src/islands/pages/ZPricingUnitTestPage/ZPricingUnitTestPage.jsx`

```jsx
/**
 * Z-Pricing Unit Test Page
 *
 * Internal pricing validation dashboard for comparing workflow calculations
 * against direct formulas and database-stored pricing lists.
 *
 * Route: /_internal/z-pricing-unit-test
 * Auth: None (internal test page)
 *
 * Follows Hollow Component Pattern - all logic in useZPricingUnitTestPageLogic.
 */

import { useZPricingUnitTestPageLogic } from './useZPricingUnitTestPageLogic.js';
import ListingScheduleSelector from '../../shared/ListingScheduleSelector.jsx';
import Section1ListingSearch from './components/Section1ListingSearch.jsx';
import Section3HostPricesInput from './components/Section3HostPricesInput.jsx';
import Section4HostGuidelines from './components/Section4HostGuidelines.jsx';
import Section5ProratedRates from './components/Section5ProratedRates.jsx';
import Section9ZatConfig from './components/Section9ZatConfig.jsx';
import Section10PricingListGrid from './components/Section10PricingListGrid.jsx';
import Section11WorkflowCheck from './components/Section11WorkflowCheck.jsx';
import Section12DataValidation from './components/Section12DataValidation.jsx';
import './ZPricingUnitTestPage.css';

export default function ZPricingUnitTestPage() {
  const logic = useZPricingUnitTestPageLogic();

  if (logic.listingsLoading) {
    return (
      <div className="zput-state">
        <div className="zput-state-card">Loading pricing test data...</div>
      </div>
    );
  }

  if (logic.listingsError) {
    return (
      <div className="zput-state">
        <div className="zput-state-card zput-state-card--error">{logic.listingsError}</div>
      </div>
    );
  }

  return (
    <div className="zput-page">
      <header className="zput-header">
        <h1>Unit.Schedule.Selector | Pricing Unit Test</h1>
        <p>Compare pricing calculations from workflows, database, and direct formulas.</p>
      </header>

      <div className="zput-container">
        {/* LEFT COLUMN: Sections 1, 3, 4, 9 */}
        <aside className="zput-sidebar">
          <Section1ListingSearch
            listings={logic.filteredListings}
            searchQuery={logic.searchQuery}
            selectedListingId={logic.selectedListingId}
            selectedListing={logic.selectedListing}
            onSearchChange={logic.setSearchQuery}
            onClearSearch={logic.handleClearSearch}
            onListingChange={logic.handleListingChange}
          />

          <Section3HostPricesInput listing={logic.selectedListing} />
          <Section4HostGuidelines listing={logic.selectedListing} />
          <Section9ZatConfig config={logic.zatConfig} />
        </aside>

        {/* MAIN COLUMN: Sections 2, 5, 6, 7, 8 */}
        <section className="zput-main">
          {/* Section 2: Listing Schedule Selector */}
          <div className="zput-card zput-section-2">
            <span className="zput-card-title">Section 2: Listing Schedule Selector</span>
            <div className="zput-schedule-controls">
              <div className="zput-control-group">
                <label>Reservation Span (Weeks)</label>
                <input
                  type="number"
                  min="1"
                  value={logic.reservationSpan}
                  onChange={(e) => logic.handleSetReservationSpan(e.target.value)}
                />
              </div>
              <div className="zput-control-group">
                <label>Guest Pattern</label>
                <select
                  value={logic.guestPattern}
                  onChange={(e) => logic.handleSetPattern(e.target.value)}
                >
                  <option value="every-week">Every Week</option>
                  <option value="one-on-off">1 Week On / 1 Off</option>
                  <option value="two-on-off">2 On / 2 Off</option>
                  <option value="one-three-off">1 On / 3 Off</option>
                </select>
              </div>
            </div>

            {logic.scheduleListing && (
              <ListingScheduleSelector
                listing={logic.scheduleListing}
                reservationSpan={logic.reservationSpan}
                zatConfig={logic.zatConfig}
                onSelectionChange={logic.handleDaySelectionChange}
                onPriceChange={logic.handlePriceChange}
                onScheduleChange={logic.handleScheduleChange}
              />
            )}
          </div>

          {/* Section 5: Prorated Rates */}
          <Section5ProratedRates
            listing={logic.selectedListing}
            zatConfig={logic.zatConfig}
            selectedNights={logic.selectedNights}
            priceBreakdown={logic.priceBreakdown}
          />
        </section>
      </div>

      {/* BOTTOM: Sections 10, 11, 12 */}
      <section className="zput-bottom">
        {/* Section 10: Pricing List Grid */}
        <Section10PricingListGrid
          pricingList={logic.pricingList}
          listing={logic.selectedListing}
          onUpdatePricingList={logic.handleUpdatePricingList}
          onUpdateStartingNightly={logic.handleUpdateStartingNightly}
        />

        {/* Section 11: Workflow vs Formula Check */}
        <Section11WorkflowCheck
          comparisonResults={logic.comparisonResults}
          onRunChecks={logic.handleRunChecks}
        />

        {/* Section 12: Data Validation */}
        <Section12DataValidation validationFlags={logic.validationFlags} />
      </section>
    </div>
  );
}
```

---

### Phase 5: Styling

**File:** `app/src/islands/pages/ZPricingUnitTestPage/ZPricingUnitTestPage.css`

Follow ZScheduleTestPage.css conventions with `.zput-*` prefix. Key dimensions:
- Page max-width: 1500px (matching Bubble)
- Sidebar width: 320px
- Main column: flex-1
- Cards: 8px border-radius, white background, subtle shadow

---

### Phase 6: Edge Function Integration

The page integrates with the existing `pricing-list` Edge Function:

| Action | Endpoint | Payload |
|--------|----------|---------|
| Get | `POST /api/pricing-list` | `{ action: 'get', payload: { listing_id } }` |
| Recalculate | `POST /api/pricing-list` | `{ action: 'recalculate', payload: { listing_id } }` |
| Update | `POST /api/pricing-list` | `{ action: 'update', payload: { listing_id, ...fields } }` |

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Z-PRICING UNIT TEST PAGE                                │
│                        (Width: 1500px)                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  USER INPUT                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │ Search Query     │  │ Listing Select   │  │ Reservation Span │          │
│  │ (ID/email/name)  │  │ (Dropdown)       │  │ (Weeks)          │          │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘          │
│           │                     │                     │                     │
│           └──────────────┬──────┴──────────────┬──────┘                     │
│                          ▼                     ▼                            │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                    PAGE LOGIC HOOK                                      │ │
│  │  useZPricingUnitTestPageLogic.js                                       │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                         │ │
│  │  DATA SOURCES                    CALCULATORS                           │ │
│  │  ┌─────────────┐                ┌─────────────────────────────────┐   │ │
│  │  │  Supabase   │───────────────▶│  • calculateProratedNightlyRate │   │ │
│  │  │  listing    │                │  • calculateMonthlyAvgNightly   │   │ │
│  │  └─────────────┘                │  • calculateAverageWeeklyPrice  │   │ │
│  │  ┌─────────────┐                │  • calculateCombinedMarkup      │   │ │
│  │  │  Supabase   │───────────────▶│  • calculateNightlyPricesArray  │   │ │
│  │  │  pricing_   │                │  • calculateFourWeekRent        │   │ │
│  │  │  list       │                └─────────────────────────────────┘   │ │
│  │  └─────────────┘                                                       │ │
│  │  ┌─────────────┐                                                       │ │
│  │  │  ZAT Price  │                                                       │ │
│  │  │  Config     │                                                       │ │
│  │  └─────────────┘                                                       │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                          │                                                  │
│           ┌──────────────┼──────────────┬──────────────┐                   │
│           ▼              ▼              ▼              ▼                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │ CALCULATED   │ │ DATABASE     │ │ FORMULA      │ │ VALIDATION   │       │
│  │ (workflow)   │ │ (pricing_    │ │ (direct      │ │ (7 checks)   │       │
│  │              │ │ list)        │ │ calc)        │ │              │       │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘       │
│         │                │                │                │                │
│         └────────────────┴────────────────┴────────────────┘                │
│                                   │                                         │
│                                   ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                    COMPARISON ENGINE                                    │ │
│  │                                                                         │ │
│  │   4 Week Rent:     Workflow $X,XXX  vs  Formula $X,XXX  [✅/❌]         │ │
│  │   Initial Payment: Workflow $X,XXX  vs  Formula $X,XXX  [✅/❌]         │ │
│  │   Nightly Price:   Workflow $XXX    vs  Formula $XXX    [✅/❌]         │ │
│  │   Total Res:       Workflow $XX,XXX vs  Formula $XX,XXX [✅/❌]         │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Testing Checklist

### Unit Tests
- [ ] `calculateProratedNightlyRate.js` - all rental types (Weekly, Monthly, Nightly)
- [ ] `calculateMonthlyAvgNightly.js` - edge cases
- [ ] `calculateAverageWeeklyPrice.js` - standard cases
- [ ] Validation logic for all 7 checks

### Integration Tests
- [ ] Listing search filters correctly (by ID, email, name)
- [ ] Listing selection loads pricing_list from database
- [ ] Schedule selector updates calculated values
- [ ] "Run Checks" triggers all calculations
- [ ] Comparison table shows correct match/mismatch

### Manual Testing
- [ ] Select listing with valid pricing_list
- [ ] Verify all host rates display correctly
- [ ] Verify pricing grid shows 7 rows with all columns
- [ ] Test reservation span changes recalculate prices
- [ ] Test "Update Pricing List" button calls Edge Function
- [ ] Verify workflow vs formula comparison matches Bubble
- [ ] Verify all 7 validation checks work correctly

---

## Implementation Order

1. **Phase 1** - Foundation (HTML, JSX entry, verify route) - 30 min
2. **Phase 2** - New calculators (3 files) - 1.5 hours
3. **Phase 3** - Page logic hook (comprehensive) - 3 hours
4. **Phase 4** - UI components (12 section components) - 4 hours
5. **Phase 5** - Styling - 1 hour
6. **Phase 6** - Edge Function integration testing - 1 hour

**Total Estimated Time:** 10-12 hours

---

## Success Criteria

1. ✅ Page loads at `/_internal/z-pricing-unit-test`
2. ✅ Listing search works by ID, host email, and name
3. ✅ All 12 sections render with correct data
4. ✅ All 16 workflows mapped to handlers
5. ✅ All 7 validation checks display correctly
6. ✅ Pricing list grid shows all columns for 7 night counts
7. ✅ Workflow vs Formula comparison shows matches/mismatches
8. ✅ "Run Checks" and "Update" buttons work correctly

---

## Notes

### Day Indexing
All day indices use JavaScript's 0-based standard:
- 0 = Sunday, 1 = Monday, ..., 6 = Saturday
- Database stores in this format, no conversion needed

### Pricing Constants
From `app/src/logic/constants/pricingConstants.js`:
- `FULL_TIME_DISCOUNT_RATE: 0.13` (13% for 7 nights)
- `SITE_MARKUP_RATE: 0.17` (17% site markup)
- `PRICING_LIST_ARRAY_LENGTH: 7` (indices 0-6)

### Hollow Component Pattern
- `ZPricingUnitTestPage.jsx` = UI only (JSX rendering)
- `useZPricingUnitTestPageLogic.js` = ALL logic (state, effects, handlers)

### Key Bubble IDs Reference
For debugging/comparison with Bubble:
- Listing dropdown: `ctQOg0`
- Run Checks button: `cniGH0`
- Run Price List button: `cniPB0`
- Clear search button: `crlgS0`

---

**Plan Version:** 2.0
**Author:** Claude
**Approved By:** Pending
