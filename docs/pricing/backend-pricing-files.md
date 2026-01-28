# Backend Pricing Calculation Files - Discovery Report

**Generated:** 2026-01-27
**Status:** Read-Only Discovery (No Files Modified)
**Purpose:** Identify all files that perform pricing calculations or reference pricing logic

---

## Executive Summary

| Category | Count |
|----------|-------|
| Backend Edge Functions (pricing-related) | 4 |
| Backend Handler Files | 5 |
| Backend Utility Files | 1 |
| Frontend Calculator Modules | 10 |
| Frontend Constants | 1 |
| Frontend Schedule Selector | 1 |
| Files referencing pricing terms | 18+ |

---

## 1. Backend Edge Functions (`supabase/functions/`)

### 1.1 Primary Pricing Function: `pricing-list/`

**Purpose:** Core pricing calculation and storage engine

| File | Role | Description |
|------|------|-------------|
| `pricing-list/index.ts` | **ROUTER** | Routes actions: create, get, update, recalculate |
| `pricing-list/handlers/create.ts` | **GENERATES + STORES** | Creates/upserts `pricing_list` record from listing host rates |
| `pricing-list/handlers/update.ts` | **GENERATES + STORES** | Updates `pricing_list` when inputs change (unit markup) |
| `pricing-list/handlers/recalculate.ts` | **GENERATES + STORES** | Force recalculation (wraps create with upsert) |
| `pricing-list/handlers/get.ts` | **READS** | Fetches `pricing_list` by listing_id |
| `pricing-list/utils/pricingCalculator.ts` | **GENERATES** | Core calculation engine - produces all pricing arrays |

#### `pricingCalculator.ts` - Key Functions (NEEDS FIX)

```typescript
// Line 138 - WRONG: Uses multiplicative formula
const multiplier = (1 + combinedMarkup) * (1 - totalDiscount);

// Lines 98-116 - WRONG: Uses proportional unused nights discount
const discount = baseDiscount * (unusedNights / (maxNights - 1));
```

**Exports:**
- `calculatePricingList()` - Main entry point
- Internal: `calculateHostCompensationArray()`, `calculateUnusedNightsDiscountArray()`, `calculateMarkupAndDiscountMultipliersArray()`, `calculateNightlyPricesArray()`, `calculateLowestNightlyPrice()`, `calculateSlope()`

---

### 1.2 Admin Function: `pricing-admin/`

**Purpose:** Admin dashboard for listing price management (CRUD only, no formula logic)

| File | Role | Description |
|------|------|-------------|
| `pricing-admin/index.ts` | **STORES** | Updates listing price fields (host rates, markup, override) |

**Actions:** list, get, updatePrice, bulkUpdate, setOverride, toggleActive, getConfig, export

**Note:** This function updates RAW INPUT values (host rates), not calculated prices. No formula logic here.

---

### 1.3 Placeholder Function: `pricing/`

**Purpose:** Future pricing functionality (currently health check only)

| File | Role | Description |
|------|------|-------------|
| `pricing/index.ts` | **PLACEHOLDER** | Only has `health` action, no actual pricing logic |

---

### 1.4 Related Functions (Reference `nightlyPrice`/`hostCompensation`)

These functions READ pricing data but don't GENERATE it:

| File | Role | Description |
|------|------|-------------|
| `proposal/actions/create.ts` | **READS** | Reads `nightlyPrice` from `pricing_list` for proposal pricing |
| `proposal/actions/update.ts` | **READS** | Reads pricing for proposal updates |
| `proposal/actions/create_suggested.ts` | **READS** | Reads `pricing_list` for suggestion matching |
| `usability-data-admin/actions/fetchListing.ts` | **READS** | Fetches listing with pricing for admin |
| `usability-data-admin/actions/createQuickProposal.ts` | **READS** | Creates proposal with pricing |
| `simulation-host/actions/sendCounteroffer.ts` | **READS** | Uses pricing in simulation |
| `quick-match/actions/search_candidates.ts` | **READS** | Uses pricing for match scoring |
| `quick-match/actions/get_proposal.ts` | **READS** | Fetches proposal with pricing |
| `ai-gateway/prompts/proposal-summary.ts` | **READS** | Formats pricing for AI summary |
| `ai-gateway/prompts/negotiation-summary-*.ts` | **READS** | Formats pricing for negotiation AI |
| `_shared/negotiationSummaryHelpers.ts` | **READS** | Helper for pricing in summaries |

---

## 2. Frontend Calculator Modules (`app/src/logic/calculators/`)

### 2.1 Pricing List Calculators (`pricingList/`)

**Purpose:** Mirror of backend calculations for client-side preview

| File | Role | Description | Needs Fix? |
|------|------|-------------|------------|
| `calculateHostCompensationArray.js` | **GENERATES** | Extracts host rates into 7-element array | ❌ No |
| `calculateUnusedNightsDiscountArray.js` | **GENERATES** | Calculates unused nights discount array | ⚠️ **YES** (proportional formula) |
| `calculateCombinedMarkup.js` | **GENERATES** | Combines unit + site markup | ❌ No |
| `calculateMarkupAndDiscountMultipliersArray.js` | **GENERATES** | Calculates multiplier array | ⚠️ **YES** (multiplicative formula) |
| `calculateNightlyPricesArray.js` | **GENERATES** | Applies multipliers to get guest prices | ❌ No |
| `calculateLowestNightlyPrice.js` | **GENERATES** | Finds minimum valid price | ❌ No |
| `calculateSlope.js` | **GENERATES** | Calculates price decay slope | ❌ No |
| `calculateProratedNightlyRate.js` | **GENERATES** | Prorates nightly from weekly/monthly | ❌ No |
| `calculateMonthlyAvgNightly.js` | **GENERATES** | Monthly to nightly conversion | ❌ No |
| `calculateAverageWeeklyPrice.js` | **GENERATES** | Calculates average weekly price | ❌ No |
| `index.js` | **BARREL** | Re-exports all calculators | ❌ No |

#### `calculateMarkupAndDiscountMultipliersArray.js` - Key Formula (NEEDS FIX)

```javascript
// Line 78 - WRONG: Uses multiplicative formula
const multiplier = (1 + combinedMarkup) * (1 - totalDiscount);

// Should be ADDITIVE:
// const multiplier = 1 + combinedMarkup - totalDiscount;
```

#### `calculateUnusedNightsDiscountArray.js` - Key Formula (NEEDS FIX)

```javascript
// Line 56-58 - WRONG: Uses proportional formula
const discount = baseDiscount * (unusedNights / (maxNights - 1));

// Should be LINEAR:
// const discount = unusedNights * discountMultiplier;
```

---

### 2.2 Other Pricing Calculators (`pricing/`)

| File | Role | Description |
|------|------|-------------|
| `calculateFourWeekRent.js` | **GENERATES** | 4-week rent from nightly price |
| `calculateGuestFacingPrice.js` | **GENERATES** | Simple guest price calculation |
| `calculatePricingBreakdown.js` | **GENERATES** | Full breakdown for UI display |
| `calculateQuickProposal.js` | **GENERATES** | Quick proposal pricing |
| `calculateReservationTotal.js` | **GENERATES** | Total reservation calculation |
| `getNightlyRateByFrequency.js` | **READS** | Gets rate by week pattern |

---

## 3. Frontend Schedule Selector (`app/src/lib/scheduleSelector/`)

### `priceCalculations.js` - Main UI Pricing (NEEDS FIX)

**Purpose:** Real-time price calculation in the schedule selector component

| Function | Role | Status |
|----------|------|--------|
| `calculatePrice()` | **GENERATES** | Main entry point - routes to rental type |
| `calculateMonthlyPrice()` | **GENERATES** | ✅ Uses additive formula |
| `calculateWeeklyPrice()` | **GENERATES** | ✅ Uses additive formula |
| `calculateNightlyPrice()` | **GENERATES** | ⚠️ **NEEDS FIX** - Wrong formula + missing unitMarkup |

#### `calculateNightlyPrice()` - Key Issues

```javascript
// Lines 225-235 - WRONG: Applies markup to discounted price
const fullTimeDiscount = nightsCount === 7 ? basePrice * config.fullTimeDiscount : 0;
const priceAfterDiscounts = basePrice - fullTimeDiscount;
const siteMarkup = priceAfterDiscounts * config.overallSiteMarkup;
const totalPrice = basePrice - fullTimeDiscount + siteMarkup;

// ALSO: Line 80 - Missing unitMarkup parameter
const result = calculateNightlyPrice(nightsCount, listing, reservationSpan, config, weeksOffered);
// Should be:
// const result = calculateNightlyPrice(nightsCount, listing, reservationSpan, config, weeksOffered, unitMarkup);
```

---

## 4. Constants (`app/src/logic/constants/`)

### `pricingConstants.js`

**Purpose:** Single source of truth for pricing values

| Constant | Value | Description |
|----------|-------|-------------|
| `FULL_TIME_DISCOUNT_RATE` | 0.13 | 13% discount for 7-night stays |
| `SITE_MARKUP_RATE` | 0.17 | 17% site markup |
| `FULL_TIME_NIGHTS_THRESHOLD` | 7 | Nights required for full-time discount |
| `MIN_NIGHTS` | 2 | Minimum bookable nights |
| `MAX_NIGHTS` | 7 | Maximum bookable nights |
| `BILLING_CYCLE_WEEKS` | 4 | Standard billing cycle |
| `PRICING_LIST_ARRAY_LENGTH` | 7 | Array length for pricing lists |
| `DEFAULT_UNIT_MARKUP` | 0 | Default listing markup |
| `DEFAULT_UNUSED_NIGHTS_DISCOUNT` | 0.05 | ⚠️ **WRONG** - Should be 0.03 |

---

## 5. Files Requiring Modification (Summary)

### Backend (Supabase Edge Functions)

| File | Issue | Fix Required |
|------|-------|--------------|
| `pricing-list/utils/pricingCalculator.ts:138` | Multiplicative formula | Change to additive |
| `pricing-list/utils/pricingCalculator.ts:98-116` | Proportional unused nights | Change to linear |
| `pricing-list/utils/pricingCalculator.ts:21` | Wrong default (0.05) | Change to 0.03 |

### Frontend (React App)

| File | Issue | Fix Required |
|------|-------|--------------|
| `lib/scheduleSelector/priceCalculations.js:80` | Missing unitMarkup param | Add parameter |
| `lib/scheduleSelector/priceCalculations.js:217-255` | Wrong nightly formula | Use additive multiplier |
| `logic/calculators/pricingList/calculateMarkupAndDiscountMultipliersArray.js:78` | Multiplicative formula | Change to additive |
| `logic/calculators/pricingList/calculateUnusedNightsDiscountArray.js:56-58` | Proportional formula | Change to linear |
| `logic/constants/pricingConstants.js:33` | Wrong default (0.05) | Change to 0.03 |

---

## 6. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PRICING DATA FLOW                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  INPUTS (from listing table)                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Host Rates (2-7 nights) │ Unit Markup │ Rental Type │ Host User     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                              │
│                              ▼                                              │
│  CALCULATION (pricingCalculator.ts / priceCalculations.js)                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 1. Extract Host Compensation array (7 elements)                      │   │
│  │ 2. Calculate Combined Markup (site + unit)                           │   │
│  │ 3. Calculate Unused Nights Discount array (7 elements)               │   │
│  │ 4. Calculate Multipliers array = 1 + markup - discount ← GOLDEN      │   │
│  │ 5. Calculate Nightly Prices = Host × Multiplier                      │   │
│  │ 6. Calculate Starting Price (lowest) and Slope                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                              │
│                              ▼                                              │
│  STORAGE (pricing_list table)                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Host Compensation │ Multipliers │ Nightly Price │ Starting Price    │   │
│  │ Unused Nights Discount │ Slope │ Unit Markup │ Combined Markup      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                              │
│                              ▼                                              │
│  CONSUMERS                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ proposal/create │ quick-match │ ai-gateway prompts │ Admin dashboard │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Reference: Correct Formulas (from Bubble)

### Golden Formula
```
multiplier = 1 + siteMarkup + unitMarkup - unusedNightsDiscount - fullTimeDiscount
guestPrice = hostCompensation × multiplier
```

### Unused Nights Discount (LINEAR)
```
unusedNightsDiscount = unusedNights × 0.03
```

### Full-Time Discount
```
fullTimeDiscount = 0.13 (only for 7-night stays)
```

---

**Report Generated By:** Claude Code Discovery Task
**Files Examined:** 30+
**Files Requiring Modification:** 7
