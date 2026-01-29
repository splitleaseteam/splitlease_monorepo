# Comprehensive Analysis: app/src/logic/ Directory

**Created**: 2026-01-28
**Scope**: Full analysis of four-layer business logic architecture
**Total Files Analyzed**: 95+ JavaScript files

---

## Table of Contents

1. [Complete Dependency Graph](#1-complete-dependency-graph)
2. [Function Documentation](#2-function-documentation)
3. [Architecture Violations](#3-architecture-violations)
4. [Refactoring Opportunities](#4-refactoring-opportunities)
5. [Duplicated Logic Analysis](#5-duplicated-logic-analysis)

---

## 1. Complete Dependency Graph

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FOUR-LAYER ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  LAYER 1: CALCULATORS (Pure Functions)                              │
│  ├── pricing/      (6 files)                                        │
│  ├── scheduling/   (7 files)                                        │
│  ├── matching/     (10 files + constants + index)                   │
│  ├── availability/ (1 file)                                         │
│  ├── reminders/    (1 file)                                         │
│  ├── simulation/   (1 file)                                         │
│  ├── payments/     (2 files + index)                                │
│  ├── pricingList/  (10 files + index)                               │
│  └── reviews/      (3 files + index)                                │
│           ↓                                                         │
│  LAYER 2: RULES (Boolean Predicates)                                │
│  ├── auth/         (2 files)                                        │
│  ├── pricing/      (1 file)                                         │
│  ├── scheduling/   (3 files)                                        │
│  ├── users/        (6 files)                                        │
│  ├── matching/     (9 files + index)                                │
│  ├── proposals/    (7 files)                                        │
│  ├── search/       (4 files)                                        │
│  ├── admin/        (1 file)                                         │
│  ├── documents/    (1 file)                                         │
│  ├── houseManual/  (3 files + index)                                │
│  ├── leases/       (3 files)                                        │
│  ├── reminders/    (2 files)                                        │
│  ├── reviews/      (5 files + index)                                │
│  ├── simulation/   (1 file)                                         │
│  ├── experienceSurvey/ (1 file)                                     │
│  └── pricingList/  (4 files + index)                                │
│           ↓                                                         │
│  LAYER 3: PROCESSORS (Data Transformation)                          │
│  ├── display/      (1 file)                                         │
│  ├── user/         (5 files)                                        │
│  ├── leases/       (4 files)                                        │
│  ├── listing/      (2 files)                                        │
│  ├── matching/     (4 files + index)                                │
│  ├── meetings/     (1 file)                                         │
│  ├── proposal/     (1 file)                                         │
│  ├── proposals/    (4 files)                                        │
│  ├── reminders/    (2 files)                                        │
│  ├── reviews/      (3 files + index)                                │
│  ├── simulation/   (1 file)                                         │
│  ├── houseManual/  (1 file)                                         │
│  ├── experienceSurvey/ (1 file)                                     │
│  └── pricingList/  (5 files + index)                                │
│           ↓                                                         │
│  LAYER 4: WORKFLOWS (Orchestration)                                 │
│  ├── auth/         (2 files)                                        │
│  ├── booking/      (3 files)                                        │
│  ├── proposals/    (4 files)                                        │
│  ├── scheduling/   (2 files)                                        │
│  ├── reminders/    (1 file)                                         │
│  ├── users/        (1 file)                                         │
│  ├── pricingList/  (3 files + index)                                │
│  └── reviews/      (2 files + index)                                │
│                                                                     │
│  CONSTANTS (Shared Data)                                            │
│  ├── proposalStages.js                                              │
│  ├── proposalStatuses.js                                            │
│  ├── searchConstants.js                                             │
│  ├── reviewCategories.js                                            │
│  ├── guestReviewCategories.js                                       │
│  ├── pricingConstants.js                                            │
│  └── index.js                                                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Dependency Flow by Domain

#### Pricing Domain
```
constants/pricingConstants.js
         ↓
calculators/pricingList/
  ├── calculateHostCompensationArray.js
  ├── calculateCombinedMarkup.js
  ├── calculateUnusedNightsDiscountArray.js
  ├── calculateMarkupAndDiscountMultipliersArray.js
  ├── calculateNightlyPricesArray.js
  ├── calculateLowestNightlyPrice.js
  ├── calculateSlope.js
  ├── calculateProratedNightlyRate.js
  ├── calculateMonthlyAvgNightly.js
  └── calculateAverageWeeklyPrice.js
         ↓
processors/pricingList/
  ├── extractHostRatesFromListing.js
  ├── adaptPricingListFromSupabase.js
  ├── adaptPricingListForSupabase.js
  └── formatPricingListForDisplay.js
         ↓
rules/pricingList/
  ├── canCalculatePricing.js
  ├── isPricingListValid.js
  └── shouldRecalculatePricing.js
         ↓
workflows/pricingList/
  ├── initializePricingListWorkflow.js
  ├── savePricingWorkflow.js ← uses calculators, processors, rules
  └── recalculatePricingListWorkflow.js
```

#### Matching Domain
```
calculators/matching/constants.js (MATCH_WEIGHTS, MATCH_THRESHOLDS)
         ↓
rules/matching/
  ├── isBoroughMatch.js
  ├── isBoroughAdjacent.js
  ├── isWithinBudget.js
  ├── hasScheduleCompatibility.js
  ├── isDurationMatch.js
  ├── canAccommodateDuration.js
  ├── isVerifiedHost.js (includes countHostVerifications)
  └── supportsWeeklyStays.js
         ↓
calculators/matching/
  ├── calculateBoroughScore.js ← uses isBoroughMatch, isBoroughAdjacent
  ├── calculatePriceScore.js
  ├── calculatePriceProximity.js
  ├── calculateScheduleOverlapScore.js
  ├── calculateWeeklyStayScore.js
  ├── calculateDurationScore.js
  ├── calculateHostScore.js
  ├── calculateMatchHeuristics.js
  └── calculateMatchScore.js ← orchestrates all score calculators
         ↓
processors/matching/
  ├── adaptCandidateListing.js
  ├── adaptProposalForMatching.js
  └── formatMatchResult.js (includes getTier)
```

#### Proposals Domain
```
constants/proposalStatuses.js
constants/proposalStages.js
         ↓
rules/proposals/
  ├── canAcceptProposal.js
  ├── canCancelProposal.js
  ├── canEditProposal.js
  ├── determineProposalStage.js
  ├── proposalRules.js (multiple: canCancelProposal, hasReviewableCounteroffer, etc.)
  ├── proposalButtonRules.js
  └── virtualMeetingRules.js
         ↓
processors/proposal/
  └── processProposalData.js (counteroffer merging)
         ↓
processors/proposals/
  ├── normalizeGuestData.js
  ├── normalizeListingData.js
  ├── normalizeProposalData.js
  └── processProposalData.js
         ↓
workflows/booking/
  ├── acceptProposalWorkflow.js ← uses canAcceptProposal, PROPOSAL_STATUSES
  ├── cancelProposalWorkflow.js (deprecated, re-exports)
  └── loadProposalDetailsWorkflow.js
         ↓
workflows/proposals/
  ├── cancelProposalWorkflow.js ← uses canCancelProposal, PROPOSAL_STATUSES
  ├── counterofferWorkflow.js ← uses hasReviewableCounteroffer, PROPOSAL_STATUSES
  ├── navigationWorkflow.js
  └── virtualMeetingWorkflow.js
```

#### Scheduling Domain
```
calculators/scheduling/
  ├── calculateCheckInOutDays.js
  ├── calculateCheckInOutFromDays.js
  ├── calculateNightsFromDays.js
  ├── calculateNextAvailableCheckIn.js
  ├── getNextOccurrenceOfDay.js
  ├── isContiguousSelection.js
  └── shiftMoveInDateIfPast.js
         ↓
rules/scheduling/
  ├── isDateBlocked.js
  ├── isDateInRange.js
  └── isScheduleContiguous.js
         ↓
workflows/scheduling/
  ├── validateMoveInDateWorkflow.js ← uses isDateInRange, isDateBlocked, calculateCheckInOutDays
  └── validateScheduleWorkflow.js ← uses isScheduleContiguous
```

#### Reviews Domain
```
constants/reviewCategories.js (12 host-reviews-guest categories)
constants/guestReviewCategories.js (6 guest-reviews-host categories)
         ↓
calculators/reviews/
  ├── calculateOverallRating.js
  ├── calculateAverageReceivedRating.js
  └── calculateReviewExpiryDays.js
         ↓
rules/reviews/
  ├── canSubmitReview.js
  ├── isReviewVisible.js
  ├── hasValidRatings.js
  └── reviewValidation.js
         ↓
processors/reviews/
  ├── reviewAdapter.js
  └── reviewOverviewAdapter.js
         ↓
workflows/reviews/
  ├── loadReviewsOverviewWorkflow.js
  └── submitReviewWorkflow.js ← uses hasValidRatings, calculateOverallRating, adaptReviewForSubmission
```

#### Authentication Domain
```
rules/auth/
  ├── isSessionValid.js
  └── isProtectedPage.js
         ↓
workflows/auth/
  ├── checkAuthStatusWorkflow.js
  └── validateTokenWorkflow.js
```

---

## 2. Function Documentation

### CALCULATORS

#### calculators/pricing/

| Function | Input Types | Output Type | Business Logic | Edge Cases | Test Coverage |
|----------|-------------|-------------|----------------|------------|---------------|
| `calculateFourWeekRent({ nightlyPrice, nightsPerWeek })` | `number, number` | `number` | `nightlyPrice * nightsPerWeek * 4` | Handles 0 nights, negative values | Needs tests |
| `calculateGuestFacingPrice({ hostRate, markup })` | `number, number` | `number` | `hostRate * (1 + markup)` | Null hostRate returns null | Needs tests |
| `calculatePricingBreakdown({ ... })` | `object` | `object` | Full pricing breakdown with fees | Empty inputs throw errors | Needs tests |
| `calculateQuickProposal({ ... })` | `object` | `object` | Quick proposal pricing | Missing fields throw errors | Needs tests |
| `calculateReservationTotal({ ... })` | `object` | `number` | Sum of rent + fees + deposit | Handles partial fields | Needs tests |
| `getNightlyRateByFrequency({ nights, rates })` | `number, object` | `number` | Lookup rate by night count | Invalid nights return null | Needs tests |

#### calculators/scheduling/

| Function | Input Types | Output Type | Business Logic | Edge Cases | Test Coverage |
|----------|-------------|-------------|----------------|------------|---------------|
| `calculateCheckInOutDays({ selectedDays })` | `number[]` | `{ checkInDay, checkOutDay }` | First day = check-in, last+1 = check-out | Empty array throws | Needs tests |
| `calculateCheckInOutFromDays({ selectedDays })` | `number[]` | `object` | Derives check-in/out from selection | Wraps around week | Needs tests |
| `calculateNightsFromDays({ selectedDays })` | `number[]` | `number` | Counts nights in selection | Empty = 0 nights | Needs tests |
| `calculateNextAvailableCheckIn({ ... })` | `object` | `Date` | Finds next valid check-in date | Blocked dates handled | Needs tests |
| `getNextOccurrenceOfDay({ dayIndex, startDate })` | `number, Date` | `Date` | Gets next occurrence of weekday | Same day returns next week | Needs tests |
| `isContiguousSelection({ selectedDays })` | `number[]` | `boolean` | Checks if days are consecutive | Handles week wrap (Sat-Sun) | Needs tests |
| `shiftMoveInDateIfPast({ moveInDate })` | `Date` | `Date` | Adjusts past dates forward | Preserves future dates | Needs tests |

#### calculators/matching/

| Function | Input Types | Output Type | Business Logic | Edge Cases | Test Coverage |
|----------|-------------|-------------|----------------|------------|---------------|
| `calculateMatchScore({ proposal, listing })` | `object, object` | `object` | Weighted sum of all sub-scores | Missing fields = 0 score | Has tests |
| `calculateBoroughScore({ ... })` | `object` | `number` | 100 if same, 50 if adjacent, 0 otherwise | Null borough = 0 | Needs tests |
| `calculatePriceScore({ budget, price })` | `number, number` | `number` | Percentage-based proximity | Price > budget = lower score | Needs tests |
| `calculatePriceProximity({ budget, price })` | `number, number` | `number` | Raw proximity value | Handles 0 budget | Needs tests |
| `calculateScheduleOverlapScore({ ... })` | `object` | `number` | Day overlap percentage | No overlap = 0 | Needs tests |
| `calculateWeeklyStayScore({ ... })` | `object` | `number` | 100 if supported, 0 if not | Checks listing flags | Needs tests |
| `calculateDurationScore({ ... })` | `object` | `number` | Duration compatibility | Min/max duration checks | Needs tests |
| `calculateHostScore({ host })` | `object` | `number` | Weighted verification checks | Missing verifications = 0 | Needs tests |
| `calculateMatchHeuristics({ ... })` | `object` | `object` | All match heuristics | Aggregates all scores | Needs tests |

#### calculators/pricingList/

| Function | Input Types | Output Type | Business Logic | Edge Cases | Test Coverage |
|----------|-------------|-------------|----------------|------------|---------------|
| `calculateHostCompensationArray({ hostRates })` | `object` | `Array<number\|null>[7]` | Maps rates to 7-element array | Missing rates = null | Needs tests |
| `calculateCombinedMarkup({ unitMarkup, siteMarkup })` | `number, number` | `number` | `(1 + unit) * (1 + site) - 1` | 0 markup = 0 combined | Needs tests |
| `calculateUnusedNightsDiscountArray({ baseDiscount })` | `number` | `number[7]` | Increasing discount array | Index determines discount | Needs tests |
| `calculateMarkupAndDiscountMultipliersArray({ ... })` | `object` | `number[7]` | Combined multiplier per night | Full-time discount at 7 | Needs tests |
| `calculateNightlyPricesArray({ hostCompensation, multipliers })` | `array, array` | `Array<number\|null>[7]` | `host * multiplier` per element | Null host = null price | Needs tests |
| `calculateLowestNightlyPrice({ nightlyPrices })` | `array` | `number` | Min non-null value | All null = 0 | Needs tests |
| `calculateSlope({ nightlyPrices })` | `array` | `number` | Price change per night | Handles missing values | Needs tests |

#### calculators/payments/

| Function | Input Types | Output Type | Business Logic | Edge Cases | Test Coverage |
|----------|-------------|-------------|----------------|------------|---------------|
| `calculateGuestPaymentSchedule({ ... })` | `object` | `object` | Complete payment schedule | First payment 3 days before move-in | Needs tests |
| `calculateHostPaymentSchedule({ ... })` | `object` | `object` | Host payout schedule | 7 days after guest payment | Needs tests |

#### calculators/reviews/

| Function | Input Types | Output Type | Business Logic | Edge Cases | Test Coverage |
|----------|-------------|-------------|----------------|------------|---------------|
| `calculateOverallRating({ ratings })` | `Array<{rating}>` | `number` | Average of valid ratings (1-5) | Empty = 0, invalid filtered | Needs tests |
| `calculateAverageReceivedRating({ reviews })` | `Array<review>` | `number` | Average of received review ratings | Empty = null | Needs tests |
| `calculateReviewExpiryDays({ stayEndDate })` | `Date` | `number` | Days until review expires | 14-day window | Needs tests |

---

### RULES

#### rules/auth/

| Function | Input Types | Output Type | Business Logic | Edge Cases |
|----------|-------------|-------------|----------------|------------|
| `isSessionValid({ expiresAt })` | `string\|number` | `boolean` | Checks if session is not expired | Null = invalid |
| `isProtectedPage({ path, protectedRoutes })` | `string, string[]` | `boolean` | Matches path against protected list | Handles dynamic routes |

#### rules/matching/

| Function | Input Types | Output Type | Business Logic | Edge Cases |
|----------|-------------|-------------|----------------|------------|
| `isBoroughMatch({ proposalBorough, listingBorough })` | `string, string` | `boolean` | Case-insensitive comparison | Null = no match |
| `isBoroughAdjacent({ proposalBorough, listingBorough })` | `string, string` | `boolean` | Checks adjacency map | Non-adjacent = false |
| `isWithinBudget({ budget, price })` | `number, number` | `boolean` | `price <= budget` | 0 budget = false |
| `hasScheduleCompatibility({ ... })` | `object` | `boolean` | Day arrays overlap | Empty = no compatibility |
| `isDurationMatch({ ... })` | `object` | `boolean` | Duration within min/max | Open-ended supported |
| `canAccommodateDuration({ ... })` | `object` | `boolean` | Listing can fit request | Checks availability span |
| `isVerifiedHost({ host })` | `object` | `boolean` | Has at least one verification | Null host = false |
| `supportsWeeklyStays({ listing })` | `object` | `boolean` | Listing supports weekly pattern | Checks flags |

#### rules/proposals/

| Function | Input Types | Output Type | Business Logic | Edge Cases |
|----------|-------------|-------------|----------------|------------|
| `canAcceptProposal({ proposalStatus, deleted })` | `string, boolean` | `boolean` | Status = "Host Countered" | Deleted = false |
| `canCancelProposal(proposal)` | `object` | `boolean` | Not already cancelled/rejected | Terminal states = false |
| `canEditProposal({ proposalStatus, deleted })` | `string, boolean` | `boolean` | Early status only | Deleted = false |
| `determineProposalStage({ status })` | `string` | `number` | Maps status to stage 1-6 | Unknown = null |
| `hasReviewableCounteroffer(proposal)` | `object` | `boolean` | Has counteroffer to review | No offer = false |
| `requiresSpecialCancellationConfirmation(proposal)` | `object` | `boolean` | usualOrder > 5 AND house manual | High-stake cancel |

#### rules/scheduling/

| Function | Input Types | Output Type | Business Logic | Edge Cases |
|----------|-------------|-------------|----------------|------------|
| `isDateBlocked({ date, blockedDates })` | `Date, string[]` | `boolean` | Date in blocked list | Empty list = false |
| `isDateInRange({ date, firstAvailable, lastAvailable })` | `Date, string, string` | `boolean` | Date within range | Null bounds = open |
| `isScheduleContiguous({ selectedDayIndices })` | `number[]` | `boolean` | Days are consecutive | Handles week wrap |

#### rules/pricingList/

| Function | Input Types | Output Type | Business Logic | Edge Cases |
|----------|-------------|-------------|----------------|------------|
| `canCalculatePricing({ listing })` | `object` | `boolean` | Has at least one host rate (2-7 nights) | No rates = false |
| `isPricingListValid({ pricingList })` | `object` | `boolean` | Arrays are 7 elements, values valid | Null = invalid |
| `shouldRecalculatePricing({ listing, pricingList })` | `object, object` | `boolean` | Rates changed since last calc | No change = false |

#### rules/reviews/

| Function | Input Types | Output Type | Business Logic | Edge Cases |
|----------|-------------|-------------|----------------|------------|
| `canSubmitReview({ stayEndDate })` | `Date` | `boolean` | Within 14-day window | Past window = false |
| `isReviewVisible({ review })` | `object` | `boolean` | Published and not flagged | Draft = hidden |
| `hasValidRatings({ ratings, reviewType })` | `array, string` | `boolean` | At least one valid 1-5 rating | Empty = false |

---

### PROCESSORS

#### processors/user/

| Function | Input Types | Output Type | Business Logic | Edge Cases |
|----------|-------------|-------------|----------------|------------|
| `processProfilePhotoUrl({ url })` | `string` | `string` | Normalizes URLs, sanitizes XSS | Protocol-relative handled |
| `processUserDisplayName({ user })` | `object` | `string` | "FirstName L." format | Missing name handled |
| `processUserInitials({ user })` | `object` | `string` | First letter of first/last | Single name = single initial |
| `processUserData(rawUser)` | `object` | `object` | Full user transformation | Null fields handled |
| `formatVerificationData({ ... })` | `object` | `object` | Format verification status | Missing = not verified |

#### processors/proposals/

| Function | Input Types | Output Type | Business Logic | Edge Cases |
|----------|-------------|-------------|----------------|------------|
| `normalizeGuestData(raw)` | `object` | `object` | Bubble to internal format | Missing fields = null |
| `normalizeListingData(raw)` | `object` | `object` | Bubble to internal format | JSONB fields parsed |
| `normalizeProposalData(raw)` | `object` | `object` | Status normalization, dates | Whitespace trimmed |
| `processProposalData({ ... })` | `object` | `object` | Full proposal with nested data | Merges counteroffer terms |

#### processors/matching/

| Function | Input Types | Output Type | Business Logic | Edge Cases |
|----------|-------------|-------------|----------------|------------|
| `adaptCandidateListing(listing)` | `object` | `object` | Normalize for matching | Extracts relevant fields |
| `adaptProposalForMatching(proposal)` | `object` | `object` | Normalize for matching | Maps status fields |
| `formatMatchResult({ score, ... })` | `object` | `object` | Adds tier, percentage | Includes getTier helper |

#### processors/pricingList/

| Function | Input Types | Output Type | Business Logic | Edge Cases |
|----------|-------------|-------------|----------------|------------|
| `extractHostRatesFromListing(listing)` | `object` | `object` | Maps Bubble fields to rates | Emoji field names |
| `adaptPricingListFromSupabase(raw)` | `object` | `object` | DB to internal format | JSONB arrays parsed |
| `adaptPricingListForSupabase(data)` | `object` | `object` | Internal to DB format | Arrays stringified |
| `formatPricingListForDisplay(data)` | `object` | `object` | Human-readable format | Currency formatting |

---

### WORKFLOWS

#### workflows/auth/

| Function | Input Types | Output Type | Business Logic | Edge Cases |
|----------|-------------|-------------|----------------|------------|
| `checkAuthStatusWorkflow({ ... })` | `object` | `object` | Cookie → storage → session check | Priority ordering |
| `validateTokenWorkflow({ ... })` | `object` | `Promise<object\|null>` | 3-step: validate, fetch user, cache type | Invalid = null |

#### workflows/scheduling/

| Function | Input Types | Output Type | Business Logic | Edge Cases |
|----------|-------------|-------------|----------------|------------|
| `validateMoveInDateWorkflow({ ... })` | `object` | `object` | Checks past, range, blocked, day match | Returns error codes |
| `validateScheduleWorkflow({ ... })` | `object` | `object` | Checks contiguous, min/max nights | Returns error codes |

#### workflows/proposals/

| Function | Input Types | Output Type | Business Logic | Edge Cases |
|----------|-------------|-------------|----------------|------------|
| `determineCancellationCondition(proposal)` | `object` | `object` | Routes to correct cancel workflow | 7 Bubble conditions |
| `executeCancelProposal(proposalId, reason)` | `string, string` | `Promise<object>` | DB update to cancelled status | Logs operation |
| `cancelProposalFromCompareTerms(...)` | `string, string` | `Promise<object>` | Special cancel from modal | Same as execute |
| `executeDeleteProposal(proposalId)` | `string` | `Promise<void>` | Soft delete (sets Deleted=true) | Different from cancel |
| `acceptCounteroffer(proposalId)` | `string` | `Promise<object>` | Accept + trigger lease creation | Fires Edge Function |
| `declineCounteroffer(proposalId, reason)` | `string, string` | `Promise<object>` | Cancel with reason | Sets Deleted=true |
| `getTermsComparison(proposal)` | `object` | `object` | Original vs counteroffer diff | Lists changed fields |

#### workflows/pricingList/

| Function | Input Types | Output Type | Business Logic | Edge Cases |
|----------|-------------|-------------|----------------|------------|
| `initializePricingListWorkflow({ ... })` | `object` | `Promise<object>` | Creates empty pricing arrays | For new listings |
| `savePricingWorkflow({ ... })` | `object` | `Promise<object>` | Full calculation pipeline | Uses all calculators |
| `recalculatePricingListWorkflow({ ... })` | `object` | `Promise<object>` | Force recalc with skip option | Checks if needed |

#### workflows/reviews/

| Function | Input Types | Output Type | Business Logic | Edge Cases |
|----------|-------------|-------------|----------------|------------|
| `loadReviewsOverviewWorkflow({ ... })` | `object` | `Promise<object>` | Lazy load by active tab | Parallel count fetch |
| `loadReviewCountsWorkflow({ ... })` | `object` | `Promise<object>` | All tab counts in parallel | Error-tolerant |
| `submitReviewWorkflow({ ... })` | `object` | `Promise<object>` | Validate → calculate → submit | Uses rules + calculator |
| `validateReviewForm({ ... })` | `object` | `object` | UI validation feedback | Returns error array |

---

## 3. Architecture Violations

### Critical Violations

#### 1. **Calculator calling Rules** - `calculators/matching/calculateBoroughScore.js`
```javascript
// VIOLATION: Calculator imports and calls rules
import { isBoroughMatch } from '../../rules/matching/isBoroughMatch.js'
import { isBoroughAdjacent } from '../../rules/matching/isBoroughAdjacent.js'
```
**Impact**: Breaks the unidirectional dependency flow (Calculators should be pure)
**Fix**: Pass boolean results as parameters instead of importing rules

#### 2. **Workflow directly uses Supabase client** - Multiple workflow files
```javascript
// VIOLATION: Workflows import infrastructure directly
import { supabase } from '../../../lib/supabase.js';
```
**Found in**:
- `workflows/proposals/cancelProposalWorkflow.js`
- `workflows/proposals/virtualMeetingWorkflow.js`
- `workflows/proposals/counterofferWorkflow.js`

**Impact**: Couples business logic to infrastructure
**Fix**: Inject supabase client as parameter (some workflows already do this correctly)

#### 3. **Rule contains multiple functions** - `rules/proposals/proposalRules.js`
```javascript
// VIOLATION: Multiple rules in single file
export function canCancelProposal(proposal) { ... }
export function requiresSpecialCancellationConfirmation(proposal) { ... }
export function hasReviewableCounteroffer(proposal) { ... }
// etc.
```
**Impact**: Violates single responsibility, harder to test individually
**Fix**: Split into separate files per function

#### 4. **Processor contains Calculator logic** - `rules/houseManual/isManualExpired.js`
```javascript
// VIOLATION: Rule file contains calculation functions
export function calculateTokenExpiration({ createdAt, expirationHours }) {
  // This is a calculator, not a rule
}
```
**Impact**: Misplaced logic makes it harder to find
**Fix**: Move `calculateTokenExpiration` to `calculators/houseManual/`

#### 5. **Duplicate file names** - `processors/proposal/` vs `processors/proposals/`
```
processors/proposal/processProposalData.js
processors/proposals/processProposalData.js
```
**Impact**: Confusing, potential import errors
**Fix**: Consolidate into single location

### Minor Violations

1. **Navigator workflow has side effects** - `workflows/proposals/navigationWorkflow.js` directly calls `window.location.href`
2. **Mixed export styles** - Some files use named exports, others default exports
3. **Inconsistent error handling** - Some throw, some return error objects

---

## 4. Refactoring Opportunities

### High Priority

#### 1. Consolidate Proposal Processors
**Current State**: Two separate directories with similar functions
- `processors/proposal/processProposalData.js` - handles counteroffer merging
- `processors/proposals/processProposalData.js` - handles normalization

**Recommendation**: Merge into single `processors/proposals/` directory
- Rename to `mergeCounterOfferTerms.js` and `normalizeProposalData.js`
- Clear naming prevents confusion

#### 2. Extract Calculator from Borough Score
**Current State**: `calculateBoroughScore.js` imports rules

**Recommendation**:
```javascript
// BEFORE (violation)
import { isBoroughMatch } from '../../rules/matching/isBoroughMatch.js'

export function calculateBoroughScore({ proposal, listing }) {
  if (isBoroughMatch({ ... })) return 100;
  // ...
}

// AFTER (correct)
export function calculateBoroughScore({ isSameBorough, isAdjacentBorough }) {
  if (isSameBorough) return 100;
  if (isAdjacentBorough) return 50;
  return 0;
}
```

#### 3. Split proposalRules.js
**Current State**: 8+ functions in one file

**Recommendation**: Create individual files:
- `rules/proposals/canCancelProposal.js` (exists but proposalRules.js has another version)
- `rules/proposals/hasReviewableCounteroffer.js`
- `rules/proposals/requiresSpecialCancellationConfirmation.js`
- `rules/proposals/getProposalStatusConfig.js`

#### 4. Dependency Injection for Workflows
**Current State**: Some workflows import supabase directly

**Recommendation**: All workflows should receive clients as parameters:
```javascript
// BEFORE
import { supabase } from '../../../lib/supabase.js';
export async function executeCancelProposal(proposalId) {
  await supabase.from('proposal').update(...)
}

// AFTER
export async function executeCancelProposal({ supabase, proposalId, reason }) {
  await supabase.from('proposal').update(...)
}
```

### Medium Priority

#### 5. Add Index Files for All Domains
**Current State**: Some domains have index.js, others don't

**Missing**:
- `calculators/pricing/index.js`
- `calculators/scheduling/index.js`
- `rules/auth/index.js`
- `rules/proposals/index.js`
- `processors/user/index.js`
- `workflows/auth/index.js`

#### 6. Standardize Error Handling
**Current State**: Mixed approaches
- Some throw errors: `throw new Error(...)`
- Some return error objects: `return { error: 'message' }`
- Some return null: `return null`

**Recommendation**: Adopt consistent pattern per layer:
- Calculators: throw on invalid input
- Rules: return boolean (never throw for business logic)
- Processors: throw on invalid data
- Workflows: return result objects with success/error

### Low Priority

#### 7. Add TypeScript Type Definitions
Create `.d.ts` files for:
- Function signatures
- Constants (PROPOSAL_STATUSES, etc.)
- Common parameter shapes

#### 8. Create Shared Validation Utils
**Current State**: Similar validation patterns repeated

**Example**:
```javascript
// Appears in multiple files
if (!Array.isArray(param)) {
  throw new Error(`X: param must be array, got ${typeof param}`)
}
```

**Recommendation**: Create `lib/validation.js`:
```javascript
export function assertArray(value, name) {
  if (!Array.isArray(value)) {
    throw new Error(`${name} must be array, got ${typeof value}`)
  }
}
```

---

## 5. Duplicated Logic Analysis

### Exact Duplicates

#### 1. `normalizeRate()` function
**Found in**:
- `calculators/pricingList/calculateHostCompensationArray.js` (lines 74-83)
- `processors/pricingList/extractHostRatesFromListing.js` (lines 62-71)

```javascript
// Identical implementation in both files
function normalizeRate(value) {
  if (value === undefined || value === null) {
    return null;
  }
  const num = Number(value);
  if (isNaN(num) || num < 0) {
    return null;
  }
  return num;
}
```
**Fix**: Extract to `lib/normalizers.js`

#### 2. `roundToTwoDecimals()` function
**Found in**:
- `calculators/pricingList/calculateNightlyPricesArray.js` (lines 90-92)
- `calculators/payments/calculateGuestPaymentSchedule.js` (lines 86-88)

```javascript
// Identical
function roundToTwoDecimals(value) {
  return Math.round(value * 100) / 100;
}
```
**Fix**: Extract to `lib/math.js`

#### 3. Day names constant
**Found in**:
- `workflows/scheduling/validateMoveInDateWorkflow.js` (line 105)
- `workflows/scheduling/validateScheduleWorkflow.js` (line 99)

```javascript
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
```
**Fix**: Import from `lib/constants.js` or `constants/dayNames.js`

### Similar Logic (Not Exact Duplicates)

#### 4. Status normalization (whitespace trimming)
**Found in**:
- `constants/proposalStatuses.js` - `normalizeStatusKey()`
- `processors/proposals/normalizeProposalData.js` - similar trimming

**Fix**: Use single `normalizeStatusKey` throughout

#### 5. Date parsing
**Found in**:
- `calculators/payments/calculateGuestPaymentSchedule.js` - `parseDate()`
- Various other files with inline date parsing

**Fix**: Create `lib/dateUtils.js` with standard parsing

#### 6. Array length validation (PRICING_LIST_ARRAY_LENGTH)
**Found in**:
- `calculateHostCompensationArray.js`
- `calculateNightlyPricesArray.js`
- `calculateMarkupAndDiscountMultipliersArray.js`

```javascript
if (array.length !== PRICING_CONSTANTS.PRICING_LIST_ARRAY_LENGTH) {
  throw new Error(`Expected ${PRICING_CONSTANTS.PRICING_LIST_ARRAY_LENGTH} elements...`)
}
```
**Fix**: Create `assertPricingArrayLength()` validator

### Logic Overlap (Different Implementations)

#### 7. `canCancelProposal`
**Found in**:
- `rules/proposals/canCancelProposal.js` - simpler check
- `rules/proposals/proposalRules.js` - more detailed with status config

**Impact**: Inconsistent behavior if wrong one imported
**Fix**: Delete duplicate, keep the more complete version in proposalRules.js and re-export

#### 8. Token expiration calculation
**Found in**:
- `rules/houseManual/isManualExpired.js` - `calculateTokenExpiration()`
- Should also exist in a calculator

**Fix**: Move calculation to `calculators/houseManual/calculateTokenExpiration.js`

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total Files | 95+ |
| Calculators | 41 files |
| Rules | 53 files |
| Processors | 35 files |
| Workflows | 18 files |
| Constants | 7 files |
| Critical Violations | 5 |
| Minor Violations | 3 |
| High Priority Refactors | 4 |
| Duplicate Functions | 6+ |
| Missing Tests | Most files |

---

## Recommendations Priority Matrix

| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| P0 | Fix Calculator/Rule dependency violation | Low | High |
| P0 | Consolidate duplicate proposal processors | Medium | High |
| P1 | Add dependency injection to workflows | Medium | Medium |
| P1 | Split proposalRules.js | Low | Medium |
| P2 | Extract duplicate utility functions | Low | Low |
| P2 | Add index files for all domains | Low | Low |
| P3 | Add TypeScript definitions | High | Medium |
| P3 | Comprehensive test coverage | High | High |

---

*Analysis completed: 2026-01-28*
