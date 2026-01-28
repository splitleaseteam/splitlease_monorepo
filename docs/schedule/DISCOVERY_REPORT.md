# Schedule Selector Triple-Check Discovery Report

**Date:** 2026-01-28  
**Status:** 🔍 **DISCOVERY PHASE COMPLETE**  
**Next Phase:** Implementation Planning

---

## Executive Summary

This report identifies discrepancies and reconciliation opportunities in Schedule Selection logic across the Split Lease platform. Similar to the Pricing Formula reconciliation, we've discovered **three parallel implementations** of schedule validation with subtle but critical differences.

---

## Current Architecture

### 📍 Asset Locations

#### **Frontend UI Layer**
- **Path:** `app/src/islands/shared/ListingScheduleSelector.jsx`
- **Role:** Visual component for day selection
- **Dependencies:** Uses `useScheduleSelector` hook

#### **Frontend Hook Layer**  
- **Path:** `app/src/islands/shared/useScheduleSelector.js` (351 lines)
- **Role:** Business logic orchestrator for schedule selection
- **Key Features:**
  - Day selection/removal handlers
  - Min/max nights validation with "warning-then-allow" pattern
  - Real-time price calculation
  - Contiguity checking

#### **Frontend Validators Layer**
- **Path:** `app/src/lib/scheduleSelector/validators.js` (156 lines)
- **Role:** Core validation rules
- **Functions:**
  - `validateDaySelection()` - Check if day can be added
  - `validateDayRemoval()` - Check if day can be removed
  - `isContiguous()` - Check if selection is consecutive
  - `validateSchedule()` - Full schedule validation

#### **Backend Workflow Layer**
- **Path:** `app/src/logic/workflows/scheduling/validateScheduleWorkflow.js` (125 lines)
- **Role:** Backend validation orchestrator
- **Returns:** Error codes (not UI messages)

#### **Backend Rule Layer**
- **Path:** `app/src/logic/rules/scheduling/isScheduleContiguous.js` (108 lines)
- **Role:** Canonical contiguity checker
- **Features:** Handles wrap-around cases with inverse logic

#### **Night Calculations Library**
- **Path:** `app/src/lib/scheduleSelector/nightCalculations.js` (141 lines)
- **Role:** Convert days ↔ nights, calculate check-in/out

#### **Test Page**
- **Path:** `app/src/islands/pages/ZScheduleTestPage/ZScheduleTestPage.jsx` (273 lines)
- **Logic:** `app/src/islands/pages/ZScheduleTestPage/useZScheduleTestPageLogic.js` (254 lines)
- **Route:** `/_internal/z-schedule-test`
- **Status:** ⚠️ **Needs Triple-Check Implementation**

---

## Golden Rules for Schedule Selection

### **Rule 1: Contiguity (CRITICAL)**
Days must be consecutive. No gaps allowed.

**Examples:**
- ✅ Mon, Tue, Wed, Thu, Fri
- ❌ Mon, Wed, Fri (has gaps)
- ✅ Sat, Sun, Mon (wrap-around)
- ✅ Fri, Sat, Sun, Mon, Tue (wrap-around)

**Implementation Notes:**
- For 6+ days: Always contiguous (max 1 gap)
- For wrap-around (has both Sunday=0 and Saturday=6): Use **inverse logic** - if unselected days are contiguous, then selected days wrap properly

---

### **Rule 2: Minimum Nights**

**Absolute Minimum:** 2 nights (3 days) - Hardcoded, non-negotiable  
**Host Minimum:** Variable per listing (e.g., 2, 3, 4, 5 nights)

**Current Behavior:**
- First violation → Show warning, block action
- After warning shown → Allow selection (soft constraint)

**Formula:**
```
nightsCount = daysSelected - 1
```

---

### **Rule 3: Maximum Nights**

**Absolute Maximum:** 7 nights (7 days full week)  
**Host Maximum:** Variable per listing (e.g., 5, 6, 7 nights)

**Current Behavior:**
- First violation → Show warning, block action
- After warning shown → Allow selection (soft constraint)

---

### **Rule 4: Day Availability**

Days must be in listing's `daysAvailable` array.

**Example:**
If listing only offers `[1, 2, 3, 4, 5]` (Mon-Fri), guest cannot select Saturday or Sunday.

---

### **Rule 5: Nights Calculation**

**Core Formula:**
```javascript
// For partial week (2-6 days):
nightsCount = selectedDays.length - 1

// For full week (7 days):
nightsCount = 7  // Special case - full-time rental
```

**Business Rule:** 6-night bookings DO NOT EXIST in the Split Lease model.
- Customers choosing 6+ days prefer full-time (7 nights) instead
- Valid ranges: 2-5 nights OR 7 nights (full week)

**Examples:**
- Selected: Mon, Tue, Wed (3 days) → 2 nights
- Selected: Mon-Fri (5 days) → 4 nights
- Selected: All 7 days → **7 nights** (full week, NOT 6!)
- Check-in: First selected day
- Check-out: Last selected day

---

### **Rule 6: Check-In/Check-Out Logic**

**Standard Case:**
- Check-in: First selected day
- Check-out: Last selected day

**Wrap-Around Case (e.g., Sat, Sun, Mon, Tue):**
1. Find the gap in sorted selection
2. Check-in: First day AFTER the gap
3. Check-out: Last day BEFORE the gap

---

## Implementation Discrepancies

### 🔴 **Discrepancy 1: Nights Calculation Formula**

| Location | Formula | Notes |
|----------|---------|-------|
| **Frontend Hook** (`useScheduleSelector.js:138`) | `nightsCount = selectedDays.length - 1` | ⚠️ **Missing full week case** |
| **Backend Workflow** (`validateScheduleWorkflow.js:55`) | `nightsCount = selectedDayIndices.length` | ⚠️ **Partially correct for 7 days, wrong for partial** |
| **Night Calculations Lib** (`nightCalculations.js:138`) | `Math.max(0, days.length - 1)` | ⚠️ **Missing full week special case** |

**Correct Formula:**
```javascript
if (selectedDays.length === 7) {
  nightsCount = 7;  // Full week = 7 nights
} else {
  nightsCount = Math.max(0, selectedDays.length - 1);  // Partial week
}
```

**Impact:** All systems missing business rule that 7 days = 7 nights (not 6).

---

### 🟡 **Discrepancy 2: Contiguity Implementation**

Both implementations are **functionally equivalent** but live in different files:

| Location | Function | Lines | Notes |
|----------|----------|-------|-------|
| **Frontend** | `app/src/lib/scheduleSelector/validators.js` | 74-122 | Used by UI components |
| **Backend** | `app/src/logic/rules/scheduling/isScheduleContiguous.js` | 27-107 | Used by workflows, better documented |

**Recommendation:** Consolidate to single source of truth.

---

### 🟡 **Discrepancy 3: Validation Timing**

| Layer | When Validated | Error Handling |
|-------|----------------|----------------|
| **Frontend Validators** | Before state change (optimistic) | Returns `{ isValid, error }` |
| **Frontend Hook** | After selection attempt | Shows error overlay, has "warning-then-allow" logic |
| **Backend Workflow** | On API submission | Returns error codes: `NOT_CONTIGUOUS`, `BELOW_MINIMUM_NIGHTS`, etc. |

**Issue:** Frontend may allow selections that backend rejects (or vice versa).

---

### 🔴 **Discrepancy 4: Maximum Nights Check**

**Frontend** (`validators.js:34-39`):
```javascript
if (listing.maximumNights && selectedDays.length >= listing.maximumNights) {
  return { isValid: false, error: `Maximum ${listing.maximumNights} days allowed` };
}
```
Uses `>=` and checks **days**, but error message says "days"

**Backend** (`validateScheduleWorkflow.js:84-95`):
```javascript
if (!isNaN(maxNights) && nightsCount > maxNights) {
  return { valid: false, errorCode: 'ABOVE_MAXIMUM_NIGHTS', maximumNights: maxNights };
}
```
Uses `>` and checks **nights**

**Issue:** Off-by-one potential. Frontend blocks at 5 days, backend blocks at >5 nights (6 days+).

---

### 🟢 **Discrepancy 5: Check-In/Check-Out Calculation**

**Frontend** (`nightCalculations.js:34-74`):
- ✅ Handles wrap-around cases
- ✅ Finds gap for Sunday/Saturday selections
- ✅ Returns `{ checkIn, checkOut }` day objects

**Backend:**
- ❌ **Does not calculate check-in/check-out** - this logic missing from `validateScheduleWorkflow.js`

**Impact:** Backend cannot validate reservation span conflicts.

---

## Pattern Restrictions (Future Consideration)

Currently **NOT** implemented in core validators, but referenced in:
- `ZScheduleTestPage` has "Guest Pattern" dropdown (1-on-1-off, 2-on-2-off, etc.)
- `SearchScheduleSelector` has `weekPattern` prop

**Recommendation:** Add to Golden Rules if this becomes a hard constraint.

---

## Test Page Analysis

### Current State: `ZScheduleTestPage`

**Features:**
- ✅ Loads real listings from Supabase
- ✅ Tests 3 selector types: Host, Search, Listing
- ✅ Displays selection outputs, pricing, check-in/out
- ⚠️ **NO** automated verification checks
- ⚠️ **NO** side-by-side comparison of frontend vs backend validation

**Missing (Triple-Check Requirements):**
1. **Multi-Check System:** Run validation through Frontend, Backend, and Golden Rule checker
2. **Discrepancy Detection:** Flag when validators disagree
3. **Visual Diff:** Show which rules passed/failed in each system
4. **Test Scenarios:** Predefined edge cases (wrap-around, min/max boundaries, gaps)

---

## Recommended Implementation Plan

### Phase 1: Consolidation (Foundation)

#### Task 1.1: Create Canonical Schedule Validator
**Goal:** Single source of truth for all schedule validation rules

**New File:** `app/src/lib/scheduleSelector/goldenScheduleValidator.js`

**Must Include:**
- `validateScheduleGolden({ selectedDayIndices, listing })` 
- All 6 Golden Rules enforced
- Returns standardized result: `{ valid, errors: [], metadata }`
- JSDoc with examples for each rule

---

#### Task 1.2: Fix Backend Nights Calculation
**File:** `app/src/logic/workflows/scheduling/validateScheduleWorkflow.js`

**Change:**
```javascript
// Line 54-55 - BEFORE
// Calculate nights (in split lease, nights = days selected)
const nightsCount = selectedDayIndices.length

// AFTER
// Calculate nights count with full week special case
// Business rule: 7 days = 7 nights (full week), partial week = days - 1
const nightsCount = selectedDayIndices.length === 7 
  ? 7 
  : Math.max(0, selectedDayIndices.length - 1)
```

---

#### Task 1.3: Align Maximum Nights Logic
**Files:**
- `app/src/lib/scheduleSelector/validators.js`
- `app/src/logic/workflows/scheduling/validateScheduleWorkflow.js`

**Decision Needed:**
- Should max nights check **days** or **nights**?
- Should it use `>=` or `>`?

**Recommendation:** Check **nights** with `>` (more intuitive for hosts)

---

### Phase 2: Triple-Check Test Page Enhancement

#### Task 2.1: Add Verification Engine
**New File:** `scripts/verify-schedule-validators.js`

Similar to `scripts/verify-pricing-formulas.js`, but for schedule validation:

**Test Cases:**
1. **2 nights** (Mon, Tue, Wed) → Should pass minimum
2. **5 nights** (Mon-Sat) → Test normal contiguity
3. **Wrap-around** (Fri, Sat, Sun, Mon) → Test inverse logic
4. **Gap selection** (Mon, Wed, Fri) → Should fail contiguity
5. **Below minimum** (Mon, Tue = 1 night) → Should fail minimum
6. **Above maximum** (listing max 5, select 7 days) → Should fail maximum
7. **Unavailable day** (listing no Sunday, select Sun) → Should fail availability

**For Each Test:**
- Run through **Frontend Validator** (`validators.js`)
- Run through **Backend Workflow** (`validateScheduleWorkflow.js`)
- Run through **Golden Validator** (Task 1.1)
- Compare results → Flag discrepancies

---

#### Task 2.2: Enhance ZScheduleTestPage
**File:** `app/src/islands/pages/ZScheduleTestPage/ZScheduleTestPage.jsx`

**Add New Section:**
```jsx
<div className="zst-card">
  <span className="zst-card-title">Triple-Check Validation Results</span>
  <ScheduleValidationMatrix 
    selectedDays={listingSelectedDays}
    listing={scheduleListing}
  />
</div>
```

**New Component:** `ScheduleValidationMatrix.jsx`

**Display:**
| Rule | Frontend | Backend | Golden | Status |
|------|----------|---------|--------|--------|
| Contiguity | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Match |
| Min Nights (2) | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Match |
| Max Nights (7) | ✅ Pass | ❌ Fail | ✅ Pass | 🚨 **MISMATCH** |
| Availability | ✅ Pass | ✅ Pass | ✅ Pass | ✅ Match |

---

#### Task 2.3: Add Edge Case Test Scenarios
**File:** `app/src/islands/pages/ZScheduleTestPage/useZScheduleTestPageLogic.js`

**Add:**
```javascript
const EDGE_CASE_SCENARIOS = [
  {
    name: "Wrap-Around Weekend",
    selectedDays: [5, 6, 0, 1], // Fri-Mon
    expectedValid: true
  },
  {
    name: "Gap Selection",
    selectedDays: [1, 3, 5], // Mon, Wed, Fri
    expectedValid: false,
    expectedError: 'NOT_CONTIGUOUS'
  },
  {
    name: "Below Absolute Minimum",
    selectedDays: [1, 2], // 1 night
    expectedValid: false,
    expectedError: 'BELOW_MINIMUM_NIGHTS'
  }
];
```

**Add UI Button:** "Run Edge Case Tests" → Auto-populate and verify

---

### Phase 3: Additive Multi-Check System

#### Task 3.1: Create Multi-Check Orchestrator
**New File:** `app/src/lib/scheduleSelector/multiCheckScheduleValidator.js`

**Pattern:** Same as pricing multi-check system

```javascript
export function runScheduleMultiCheck({ selectedDayIndices, listing }) {
  const checks = [];

  // Check 1: Frontend Validator
  const frontendResult = validateDaySelection(/* ... */);
  checks.push({
    source: 'FRONTEND_VALIDATOR',
    valid: frontendResult.isValid,
    errors: frontendResult.error ? [frontendResult.error] : []
  });

  // Check 2: Backend Workflow
  const backendResult = validateScheduleWorkflow({ selectedDayIndices, listing });
  checks.push({
    source: 'BACKEND_WORKFLOW',
    valid: backendResult.valid,
    errors: backendResult.errorCode ? [backendResult.errorCode] : []
  });

  // Check 3: Golden Validator
  const goldenResult = validateScheduleGolden({ selectedDayIndices, listing });
  checks.push({
    source: 'GOLDEN_VALIDATOR',
    valid: goldenResult.valid,
    errors: goldenResult.errors
  });

  // Aggregate
  const allValid = checks.every(c => c.valid);
  const hasDiscrepancy = !allValid && checks.some(c => c.valid !== checks[0].valid);

  return {
    allValid,
    hasDiscrepancy,
    checks,
    recommendation: hasDiscrepancy ? 'RESOLVE_CONFLICT' : (allValid ? 'APPROVE' : 'REJECT')
  };
}
```

---

#### Task 3.2: Integrate Multi-Check into Hook
**File:** `app/src/islands/shared/useScheduleSelector.js`

**Add:**
```javascript
import { runScheduleMultiCheck } from '../../lib/scheduleSelector/multiCheckScheduleValidator.js';

// Inside handleDaySelect callback:
const multiCheckResult = runScheduleMultiCheck({
  selectedDayIndices: newSelection.map(d => d.dayOfWeek),
  listing
});

if (multiCheckResult.hasDiscrepancy) {
  console.warn('⚠️ Schedule validation discrepancy detected:', multiCheckResult.checks);
  // In production: Log to monitoring
  // In test mode: Show warning overlay
}
```

---

## Success Criteria (Acceptance)

When implementation is complete, the following must be true:

- [ ] **Single Nights Formula:** All systems use `nights = days - 1`
- [ ] **Contiguity Agreement:** Frontend and backend agree on all wrap-around cases
- [ ] **Min/Max Alignment:** Same boundary checks across all layers
- [ ] **Check-In/Out Calculation:** Backend includes this logic
- [ ] **Test Page Enhanced:** Triple-Check matrix shows all validations
- [ ] **Edge Cases Pass:** All 7 test scenarios validate correctly
- [ ] **No Discrepancies:** Multi-check system reports 100% agreement
- [ ] **Verification Script:** `node scripts/verify-schedule-validators.js` passes

---

## Files Requiring Changes (Estimated)

| File | Lines | Type | Priority |
|------|-------|------|----------|
| `app/src/lib/scheduleSelector/goldenScheduleValidator.js` | ~200 | NEW | 🔴 High |
| `app/src/lib/scheduleSelector/multiCheckScheduleValidator.js` | ~100 | NEW | 🔴 High |
| `scripts/verify-schedule-validators.js` | ~150 | NEW | 🔴 High |
| `app/src/logic/workflows/scheduling/validateScheduleWorkflow.js` | ~5 | FIX | 🔴 High |
| `app/src/lib/scheduleSelector/validators.js` | ~10 | FIX | 🟡 Medium |
| `app/src/islands/shared/useScheduleSelector.js` | ~15 | ENHANCE | 🟡 Medium |
| `app/src/islands/pages/ZScheduleTestPage/ZScheduleTestPage.jsx` | ~50 | ENHANCE | 🟡 Medium |
| `app/src/islands/pages/ZScheduleTestPage/useZScheduleTestPageLogic.js` | ~40 | ENHANCE | 🟡 Medium |
| `app/src/islands/shared/ScheduleValidationMatrix.jsx` | ~120 | NEW | 🟢 Low |

**Total Impact:** ~690 lines across 9 files (3 new, 3 fixes, 3 enhancements)

---

## Next Steps

1. **Review this Discovery Report** with stakeholders
2. **Create Implementation Plan** (similar to `CLAUDE_PRICING_PROMPT.md`)
3. **Assign tasks** to OpenCode and Claude Code agents
4. **Implement Phase 1** (Consolidation)
5. **Implement Phase 2** (Test Page)
6. **Implement Phase 3** (Multi-Check System)
7. **Run verification script** and validate

---

## References

**Related Documents:**
- `docs/pricing/VERIFICATION_REPORT.md` - Pricing reconciliation success story
- `CLAUDE_PRICING_PROMPT.md` - Agent coordination template

**Key Files Analyzed:**
- `app/src/islands/shared/ListingScheduleSelector.jsx`
- `app/src/islands/shared/useScheduleSelector.js`
- `app/src/lib/scheduleSelector/validators.js`
- `app/src/logic/workflows/scheduling/validateScheduleWorkflow.js`
- `app/src/logic/rules/scheduling/isScheduleContiguous.js`
- `app/src/lib/scheduleSelector/nightCalculations.js`
- `app/src/islands/pages/ZScheduleTestPage/ZScheduleTestPage.jsx`
