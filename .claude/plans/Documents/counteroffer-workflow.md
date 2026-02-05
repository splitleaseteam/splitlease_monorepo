# Counteroffer Workflow Documentation

> **Purpose**: Comprehensive documentation of the counteroffer pricing and negotiation flow to address confusion about proposal vs. counteroffer pricing differences.
>
> **Created**: 2026-02-04
>
> **Related Files**:
> - [counterofferWorkflow.js](../../../app/src/logic/workflows/proposals/counterofferWorkflow.js)
> - [create_counteroffer.ts](../../../supabase/functions/proposal/actions/create_counteroffer.ts)
> - [accept_counteroffer.ts](../../../supabase/functions/proposal/actions/accept_counteroffer.ts)
> - [useCompareTermsModalLogic.js](../../../app/src/islands/modals/useCompareTermsModalLogic.js)
> - [processProposalData.js](../../../app/src/logic/processors/proposals/processProposalData.js)

---

## Table of Contents

1. [Overview](#overview)
2. [Field Mapping: hc_* Prefix Convention](#field-mapping-hc_-prefix-convention)
3. [Complete Workflow Diagram](#complete-workflow-diagram)
4. [Status Flow Transitions](#status-flow-transitions)
5. [Pricing Calculation Differences](#pricing-calculation-differences)
6. [Edge Cases and Error Scenarios](#edge-cases-and-error-scenarios)
7. [Data Flow Summary](#data-flow-summary)

---

## Overview

The counteroffer workflow allows hosts to modify proposal terms and guests to accept or decline these modified terms. The system maintains both original and counteroffer terms simultaneously, enabling comparison and proper lease generation.

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Original Terms** | The guest's initial proposal submission |
| **Counteroffer Terms** | The host's modified proposal (prefixed with `hc_`) |
| **Effective Terms** | The agreed terms (counteroffer if accepted, otherwise original) |
| **Counteroffer Flag** | `counter offer happened` boolean indicates whether a counteroffer exists |

### The "hc_" Prefix Convention

All counteroffer fields are prefixed with `hc_` (short for "host-changed"). This naming convention:
- Preserves original proposal data for comparison
- Allows clear distinction between proposal vs. counteroffer values
- Enables the UI to show "before" and "after" pricing

---

## Field Mapping: hc_* Prefix Convention

### Counteroffer Fields (hc_*)

| Database Column | JavaScript Property | Type | Description |
|----------------|---------------------|------|-------------|
| `counter offer happened` | `counterOfferHappened` | boolean | Flag indicating counteroffer exists |
| `hc move in date` | `hcMoveInDate` | timestamp | Host's modified move-in date |
| `hc days selected` | `hcDaysSelected` | number[] | Host's modified weekly schedule |
| `hc check in day` | `hcCheckInDay` | number (0-6) | Host's modified check-in day |
| `hc check out day` | `hcCheckOutDay` | number (0-6) | Host's modified check-out day |
| `hc nights per week` | `hcNightsPerWeek` | number | Host's modified nights per week |
| `hc reservation span (weeks)` | `hcReservationWeeks` | number | Host's modified duration |
| `hc nightly price` | `hcNightlyPrice` | number | Host's modified nightly rate |
| `hc total price` | `hcTotalPrice` | number | Calculated guest total price |
| `hc 4 week rent` | `hc4WeekRent` | number | Guest's 4-week rent amount |
| `hc 4 week compensation` | `hc4WeekCompensation` | number | Host's 4-week compensation |
| `hc host compensation (per period)` | `hcHostCompensationPerPeriod` | number | Host's per-period rate |
| `hc total host compensation` | `hcTotalHostCompensation` | number | Total host compensation |
| `hc duration in months` | `hcDurationInMonths` | number | Calculated duration |
| `hc cleaning fee` | `hcCleaningFee` | number | Host's modified cleaning fee |
| `hc damage deposit` | `hcDamageDeposit` | number | Host's modified damage deposit |
| `hc house rules` | `hcHouseRules` | string[] | Host's modified house rules |

### Original Proposal Fields (for comparison)

| Database Column | JavaScript Property | Type |
|----------------|---------------------|------|
| `Move in range start` | `moveInStart` | timestamp |
| `Move in range end` | `moveInEnd` | timestamp |
| `Days Selected` | `daysSelected` | number[] |
| `check in day` | `checkInDay` | number (0-6) |
| `check out day` | `checkOutDay` | number (0-6) |
| `nights per week (num)` | `nightsPerWeek` | number |
| `Reservation Span (Weeks)` | `reservationWeeks` | number |
| `proposal nightly price` | `nightlyPrice` | number |
| `Total Price for Reservation (guest)` | `totalPrice` | number |
| `cleaning fee` | `cleaningFee` | number |
| `damage deposit` | `damageDeposit` | number |
| `House Rules` | `houseRules` | string[] |

### Field Mapping During Acceptance

When a guest accepts a counteroffer, the system copies `hc_*` values to the main proposal fields:

```javascript
// From accept_counteroffer.ts lines 68-79
if (proposal['hc nightly price']) {
  updateData['proposal nightly price'] = proposal['hc nightly price'];
}
if (proposal['hc nights per week']) {
  updateData['nights per week (num)'] = proposal['hc nights per week'];
}
if (proposal['hc check in day'] !== undefined) {
  updateData['check in day'] = proposal['hc check in day'];
}
if (proposal['hc check out day'] !== undefined) {
  updateData['check out day'] = proposal['hc check out day'];
}
```

---

## Complete Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        COUNTEROFFER WORKFLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  GUEST SUBMITS PROPOSAL                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Status: "Host Review" or "Rental Application Submitted"             │   │
│  │ - Guest sets original terms                                          │   │
│  │ - Original pricing calculated                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ↓                                        │
│  HOST CREATES COUNTEROFFER                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Edge Function: create_counteroffer                                   │   │
│  │                                                                      │   │
│  │ 1. Fetch proposal and listing data                                  │   │
│  │ 2. Fetch pricing_list rates (or calculate fallback)                 │   │
│  │ 3. Calculate counteroffer pricing:                                  │   │
│  │    - guestNightlyPrice from pricing list                            │   │
│  │    - hostCompensationPerNight from pricing list                     │   │
│  │    - totalGuestPrice = guestNightlyPrice * nights * weeks           │   │
│  │    - fourWeekRent = guestNightlyPrice * nights * 4                  │   │
│  │    - fourWeekCompensation = hostComp * nights * 4                   │   │
│  │    - totalHostCompensation = based on rental type                   │   │
│  │                                                                      │   │
│  │ 4. Update proposal with hc_* fields:                                │   │
│  │    - hc nightly price                                               │   │
│  │    - hc nights per week                                             │   │
│  │    - hc check in day / check out day                                │   │
│  │    - hc total price                                                 │   │
│  │    - hc 4 week rent                                                 │   │
│  │    - hc 4 week compensation                                         │   │
│  │    - hc host compensation (per period)                              │   │
│  │    - hc total host compensation                                     │   │
│  │    - hc duration in months                                          │   │
│  │    - hc move in date (if changed)                                   │   │
│  │                                                                      │   │
│  │ 5. Set status: "Host Counteroffer Submitted / Awaiting Guest Review"│   │
│  │ 6. Set counter_offer_happened = true                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ↓                                        │
│  GUEST REVIEWS COUNTEROFFER                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ UI: CompareTermsModal                                               │   │
│  │                                                                      │   │
│  │ Display side-by-side comparison:                                    │   │
│  │ - Original Terms vs Counteroffer Terms                              │   │
│  │ - Pricing differences highlighted                                   │   │
│  │ - Schedule changes shown                                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ↓                                        │
│                         ┌──────────┴──────────┐                            │
│                         │                     │                            │
│                   DECLINE               ACCEPT                            │
│                         │                     │                            │
│                         ↓                     ↓                            │
│  ┌─────────────────────────────────┐  ┌──────────────────────────────┐   │
│  │ Status: "Proposal Cancelled     │  │ Status: "Proposal or          │   │
│  │         by Guest"                │  │   Counteroffer Accepted /    │   │
│  │                                  │  │   Drafting Lease Documents"  │   │
│  │ Edge Function: decline_counteroffer│  │                               │   │
│  │   - Updates status only          │  │ Edge Function: accept_counter│  │
│  └─────────────────────────────────┘  │   offer                        │   │
│                                        │   - Copies hc_* → main fields │   │
│                                        │   - Sets Is Finalized = true  │   │
│                                        │   - Creates notification msgs │   │
│                                        └──────────────────────────────┘   │
│                                                          ↓                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ LEASE CREATION (useCompareTermsModalLogic.js)                       │   │
│  │                                                                      │   │
│  │ 1. Calculate lease numbering (zeros) based on existing lease count   │   │
│  │ 2. Calculate 4-week compensation (from ORIGINAL proposal)           │   │
│  │ 3. Calculate 4-week rent (from COUNTEROFFER terms)                  │   │
│  │ 4. Call lease Edge Function with:                                   │   │
│  │    - proposalId                                                     │   │
│  │    - isCounteroffer: "yes"                                          │   │
│  │    - fourWeekRent (guest pricing)                                   │   │
│  │    - fourWeekCompensation (host pricing)                            │   │
│  │    - numberOfZeros                                                  │   │
│  │ 5. Send notification messages to guest and host                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Status Flow Transitions

### Status Values (from proposalStatuses.js)

| Status Key | usualOrder | Stage | Color | Description |
|------------|------------|-------|-------|-------------|
| `HOST_REVIEW` | 1 | 3 | blue | Initial proposal under host review |
| `RENTAL_APP_SUBMITTED` | 1 | 2 | blue | Rental app submitted, awaiting review |
| `COUNTEROFFER_SUBMITTED_AWAITING_GUEST_REVIEW` | 2 | 3 | yellow | Counteroffer awaiting guest action |
| `PROPOSAL_OR_COUNTEROFFER_ACCEPTED` | 3 | 4 | green | Accepted, drafting lease |
| `CANCELLED_BY_GUEST` | 99 | null | red | Guest declined/cancelled |

### State Transition Diagram

```
┌──────────────────────┐
│   HOST_REVIEW        │ ← Initial proposal submission
│   (Stage 3)          │
└──────────┬───────────┘
           │
           │ Host creates counteroffer
           ↓
┌──────────────────────────────────────────────┐
│ COUNTEROFFER_SUBMITTED_AWAITING_GUEST_REVIEW │
│ (Stage 3, usualOrder: 2)                     │
└────────────┬─────────────────────────────────┘
             │
      ┌──────┴──────┐
      │             │
      ↓             ↓
┌───────────┐  ┌─────────────────────────────────────┐
│ DECLINE   │  │ PROPOSAL_OR_COUNTEROFFER_ACCEPTED   │
│           │  │ (Stage 4, usualOrder: 3)            │
│           │  └─────────────────┬───────────────────┘
│           │                    │
│           │                    ↓
│           │          ┌─────────────────────┐
│           │          │ LEASE_DOCUMENTS_... │ → Active lease
│           │          └─────────────────────┘
│           │
│           ↓
│ ┌─────────────────────┐
│ CANCELLED_BY_GUEST   │
│ (Stage: null)        │
└──────────────────────┘
```

---

## Pricing Calculation Differences

### Original Proposal Pricing

Calculated when guest first submits proposal (from proposal creation workflow):

```javascript
// Guest pricing = base price + fees
totalGuestPrice = (nightlyPrice * nightsPerWeek * reservationWeeks) + cleaningFee

// Host compensation varies by rental type
switch (rentalType) {
  case "nightly":
    totalHostCompensation = hostNightlyRate * nightsPerWeek * reservationWeeks
    break
  case "weekly":
    totalHostCompensation = weeklyRate * Math.ceil(reservationWeeks)
    break
  case "monthly":
    totalHostCompensation = monthlyRate * durationMonths
    break
}
```

### Counteroffer Pricing

Calculated differently in [create_counteroffer.ts](../actions/create_counteroffer.ts) (lines 76-195):

```typescript
// Uses pricing_list rates when available
const pricingListRates = getPricingListRates(pricingList, nightsPerWeek)
const guestNightlyPrice = pricingListRates.guestNightlyPrice
const hostCompPerNight = pricingListRates.hostCompensationPerNight

// Calculate derived rates
const derivedWeeklyRate = hostCompPerNight * nightsPerWeek
const derivedMonthlyRate = (hostCompPerNight * nightsPerWeek * avgDaysPerMonth) / 7

// Determine host compensation per period based on rental type
const hostCompPerPeriod =
  rentalType === "weekly" ? (listing.weekly_host_rate || derivedWeeklyRate)
  : rentalType === "monthly" ? (listing.monthly_host_rate || derivedMonthlyRate)
  : hostCompPerNight

// Calculate totals
const totalGuestPrice = guestNightlyPrice * nightsPerWeek * reservationWeeks
const fourWeekRent = guestNightlyPrice * nightsPerWeek * 4
const fourWeekCompensation =
  rentalType === "monthly" ? 0
  : rentalType === "weekly" ? hostCompPerPeriod * 4
  : hostCompPerNight * nightsPerWeek * 4
```

### Key Differences

| Aspect | Original Proposal | Counteroffer |
|--------|-------------------|--------------|
| **Guest Rate Source** | proposal creation logic | pricing_list (or fallback) |
| **Host Rate Source** | listing pricing tiers | pricing_list (or fallback) |
| **4-Week Compensation** | From original terms | Calculated fresh from hc_* values |
| **4-Week Rent** | Not stored | Stored in `hc 4 week rent` |
| **Duration** | From original proposal | Calculated and stored in `hc duration in months` |

### Why Pricing Differs

The counteroffer pricing is recalculated using `pricing_list` data rather than the original proposal's pricing logic:

1. **Pricing List Priority**: Counteroffers use the `pricing_list` table's `Nightly Price` and `Host Compensation` arrays, indexed by `nightsPerWeek`
2. **Fallback Logic**: If no pricing list exists, fallback calculates using listing rates
3. **Rental Type Handling**: Different formulas for nightly/weekly/monthly rentals
4. **Duration Calculation**: Uses `avgDaysPerMonth` from `zat_priceconfiguration` for accurate monthly calculations

---

## Edge Cases and Error Scenarios

### 1. Missing Pricing List Data

**Scenario**: Counteroffer created but listing has no pricing_list association.

**Handling** (create_counteroffer.ts lines 133-142):
```typescript
if (!pricingListRates) {
  const fallbackPricing = calculatePricingList({ listing });
  pricingListRates = getPricingListRates(
    { "Nightly Price": fallbackPricing.nightlyPrice, ... },
    nightsPerWeek
  );
}
```

### 2. Null/Undefined Counteroffer Fields

**Scenario**: Counteroffer exists but some hc_* fields are null.

**Handling** (useCompareTermsModalLogic.js lines 165-174):
```javascript
// Fallback to original values if counteroffer values missing
const checkInDay = proposal['hc check in day'] ?? proposal['check in day'];
const nightsPerWeek = proposal['hc nights per week'] ?? proposal['nights per week (num)'] ?? 0;
```

### 3. Thread Lookup Failure for Notifications

**Scenario**: Accepting counteroffer but thread not found via Proposal FK.

**Handling** (accept_counteroffer.ts lines 99-198):
```typescript
// Strategy 1: Look up by Proposal FK
// Strategy 2: Find by host+guest+listing match
// Strategy 3: Create new thread
if (!threadId) {
  // Create new thread with proposal, listing, and participant IDs
}
```

### 4. Days Selected Format Variations

**Scenario**: `Days Selected` stored as JSON string or array with string numbers.

**Handling** (useCompareTermsModalLogic.js lines 28-54):
```javascript
function parseDaysSelected(daysSelected) {
  if (typeof daysSelected === 'string') {
    try { days = JSON.parse(days); }
    catch (e) { return []; }
  }
  // Normalize to number array 0-6
  return days.map(day => /* normalize logic */).filter(d => d >= 0 && d <= 6);
}
```

### 5. Lease Creation Network Errors

**Scenario**: Edge Function call fails during acceptance flow.

**Handling** (useCompareTermsModalLogic.js lines 311-314):
```javascript
try {
  leaseResponse = await fetch(`${supabaseUrl}/functions/v1/lease`, ...);
} catch (fetchErr) {
  throw new Error('Network error: Could not connect to lease service.');
}
```

### 6. Incomplete Counteroffer Data

**Scenario**: Counteroffer has only some fields modified (e.g., price only, not schedule).

**Result**: Only modified fields are stored in hc_* columns. UI shows original values for unmodified fields.

### 7. Counteroffer After Original Acceptance

**Scenario**: Guest accepts original proposal, then host sends counteroffer.

**Current Behavior**: Status would move to "COUNTEROFFER_SUBMITTED_AWAITING_GUEST_REVIEW" - the workflow doesn't prevent this edge case.

### 8. Multiple Counteroffers

**Scenario**: Host creates counteroffer, guest declines, host creates another.

**Current Behavior**: New counteroffer overwrites previous hc_* values. Only the latest counteroffer is preserved.

---

## Data Flow Summary

### Create Counteroffer Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ INPUT: proposalId, counterofferData {                                       │
│   hc nightly price, hc nights per week, hc check in day,                    │
│   hc check out day, hc move in start                                        │
│ }                                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. FETCH proposal + listing data                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. FETCH pricing_list rates (or calculate fallback)                         │
│    - Returns: guestNightlyPrice, hostCompensationPerNight                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. CALCULATE all derived counteroffer values                                │
│    - hc total price                                                         │
│    - hc 4 week rent                                                         │
│    - hc 4 week compensation                                                 │
│    - hc host compensation (per period)                                      │
│    - hc total host compensation                                             │
│    - hc duration in months                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. UPDATE proposal with:                                                    │
│    - Status: "Host Counteroffer Submitted / Awaiting Guest Review"          │
│    - counter offer happened: true                                           │
│    - All hc_* fields (calculated + provided)                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ OUTPUT: { success: true, message: "Counteroffer created" }                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Accept Counteroffer Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ INPUT: proposalId                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. FETCH proposal (must have hc_* fields)                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. COPY hc_* fields to main proposal fields:                                │
│    - hc nightly price → proposal nightly price                              │
│    - hc nights per week → nights per week (num)                             │
│    - hc check in day → check in day                                         │
│    - hc check out day → check out day                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. UPDATE proposal status:                                                  │
│    - Status: "Proposal or Counteroffer Accepted / Drafting Lease Documents" │
│    - Is Finalized: true                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. CREATE notification messages (guest + host)                              │
│    - Multi-strategy thread lookup (Proposal FK → match → create)            │
└─────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ OUTPUT: { success: true, message: "Counteroffer accepted - proceeding..." } │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Appendix: Database Schema Notes

### Schema-Verified Columns (as of 2026-01-28)

**Confirmed to exist in proposal table:**
- `counter offer happened` (boolean) ✅
- `hc nightly price` ✅
- `hc nights per week` ✅
- `hc check in day` ✅
- `hc check out day` ✅
- `hc move in date` ✅ (NOT `hc move in start`)
- `hc total price` ✅
- `hc 4 week rent` ✅
- `hc 4 week compensation` ✅
- `hc host compensation (per period)` ✅
- `hc total host compensation` ✅
- `hc duration in months` ✅

**Do NOT exist (removed from code):**
- ❌ `has_host_counteroffer` (use `counter offer happened` instead)
- ❌ `last_modified_by`
- ❌ `counteroffer_by_persona`
- ❌ `hc move out`

---

## Quick Reference

### How to Check if Counteroffer Exists

```javascript
const hasCounteroffer = proposal['counter offer happened'] === true;
```

### How to Get Effective Terms

```javascript
import { getEffectiveTerms } from './processProposalData.js';

const terms = getEffectiveTerms(proposal);
// Returns hc_* values if counteroffer happened, otherwise original values
```

### How to Compare Terms

```javascript
import { getTermsComparison } from './counterofferWorkflow.js';

const comparison = getTermsComparison(proposal);
// Returns { originalTerms, counterofferTerms, changes, hasChanges }
```

### Status Check Pattern

```javascript
import { getStatusConfig } from './proposalStatuses.js';

const config = getStatusConfig(proposal.Status);
if (config.usualOrder === 2) {
  // Counteroffer awaiting review
}
```

---

*End of Counteroffer Workflow Documentation*
