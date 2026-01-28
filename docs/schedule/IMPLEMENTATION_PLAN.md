# Schedule Selector Triple-Check Implementation Plan

**Date:** 2026-01-28  
**Status:** 📋 **READY FOR EXECUTION**  
**Model:** Additive Multi-Check System (same pattern as Pricing)

---

## Overview

This plan implements a **Triple-Check Meta-Flow** for schedule validation, reconciling discrepancies between Frontend Validators, Backend Workflows, and creating a new Golden Validator as the canonical source of truth.

**Key Principle:** Additive checking - all three systems validate independently, then results are aggregated to detect discrepancies.

---

## Task Allocation

### **OpenCode Tasks** (Foundation & Scripts)

**Task 1:** Create Golden Schedule Validator  
**Task 2:** Create Verification Script  
**Task 3:** Fix Backend Nights Calculation Bug  

---

### **Claude Code Tasks** (Integration & UI)

**Task 4:** Create Multi-Check Orchestrator  
**Task 5:** Integrate Multi-Check into Hook  
**Task 6:** Enhance ZScheduleTestPage with Triple-Check Matrix  
**Task 7:** Add Edge Case Test Scenarios  
**Task 8:** Create Validation Matrix Component  

---

## Detailed Task Specifications

---

## OPENCODE TASKS

### **Task 1: Create Golden Schedule Validator**

**File:** `app/src/lib/scheduleSelector/goldenScheduleValidator.js` (NEW)

**Purpose:** Canonical implementation of all 6 Golden Rules for schedule validation.

**Function Signature:**
```javascript
export function validateScheduleGolden({ selectedDayIndices, listing })
```

**Input:**
- `selectedDayIndices`: Array of day numbers (0=Sunday, ..., 6=Saturday)
- `listing`: Object with:
  - `minimumNights`: Number (host's minimum, e.g., 2)
  - `maximumNights`: Number (host's maximum, e.g., 7)
  - `daysAvailable`: Array of day numbers available (e.g., [0,1,2,3,4,5,6])

**Output:**
```javascript
{
  valid: boolean,
  errors: [
    { rule: 'CONTIGUITY', message: 'Days must be consecutive', severity: 'ERROR' },
    { rule: 'MINIMUM_NIGHTS', message: 'Minimum 2 nights required', severity: 'ERROR' }
  ],
  metadata: {
    nightsCount: number,
    isContiguous: boolean,
    checkInDay: number | null,
    checkOutDay: number | null,
    unusedNights: number
  }
}
```

**Rules to Implement:**

#### Rule 1: Contiguity Check
```javascript
// Use logic from app/src/logic/rules/scheduling/isScheduleContiguous.js
// Handle wrap-around cases (Sat-Sun-Mon)
// 6+ days is always contiguous
```

#### Rule 2: Absolute Minimum (Hardcoded)
```javascript
const ABSOLUTE_MIN_NIGHTS = 2;
if (nightsCount < ABSOLUTE_MIN_NIGHTS) {
  errors.push({
    rule: 'ABSOLUTE_MINIMUM',
    message: `Minimum ${ABSOLUTE_MIN_NIGHTS} nights (${ABSOLUTE_MIN_NIGHTS + 1} days) required`,
    severity: 'ERROR'
  });
}
```

#### Rule 3: Host Minimum Nights
```javascript
if (listing.minimumNights && nightsCount < listing.minimumNights) {
  errors.push({
    rule: 'MINIMUM_NIGHTS',
    message: `Host requires minimum ${listing.minimumNights} nights`,
    severity: 'WARNING' // Soft constraint in current system
  });
}
```

#### Rule 4: Host Maximum Nights
```javascript
const ABSOLUTE_MAX_NIGHTS = 7;
if (nightsCount > ABSOLUTE_MAX_NIGHTS) {
  errors.push({
    rule: 'ABSOLUTE_MAXIMUM',
    message: `Maximum ${ABSOLUTE_MAX_NIGHTS} nights allowed`,
    severity: 'ERROR'
  });
}

if (listing.maximumNights && nightsCount > listing.maximumNights) {
  errors.push({
    rule: 'MAXIMUM_NIGHTS',
    message: `Host allows maximum ${listing.maximumNights} nights`,
    severity: 'WARNING' // Soft constraint
  });
}
```

#### Rule 5: Day Availability
```javascript
if (listing.daysAvailable && Array.isArray(listing.daysAvailable)) {
  const unavailable = selectedDayIndices.filter(d => !listing.daysAvailable.includes(d));
  if (unavailable.length > 0) {
    errors.push({
      rule: 'DAYS_NOT_AVAILABLE',
      message: `Selected days not available: ${unavailable.join(', ')}`,
      severity: 'ERROR'
    });
  }
}
```

#### Rule 6: Nights Calculation
```javascript
// CRITICAL: This is the golden formula
if (selectedDayIndices.length === 7) {
  nightsCount = 7;  // Full week = 7 nights (special business rule)
} else {
  nightsCount = Math.max(0, selectedDayIndices.length - 1);  // Partial week
}

// Business Rule: 6-night bookings DO NOT EXIST
// Valid ranges: 2-5 nights OR 7 nights (full week)
```

**Check-In/Check-Out Calculation:**
```javascript
// Use logic from app/src/lib/scheduleSelector/nightCalculations.js
// Standard: first day = check-in, last day = check-out
// Wrap-around: find gap, check-in after gap, check-out before gap
```

**Return Logic:**
```javascript
return {
  valid: errors.filter(e => e.severity === 'ERROR').length === 0,
  errors,
  metadata: {
    nightsCount,
    isContiguous,
    checkInDay,
    checkOutDay,
    unusedNights: 7 - nightsCount // Assuming 7-night week
  }
};
```

---

### **Task 2: Create Verification Script**

**File:** `scripts/verify-schedule-validators.js` (NEW)

**Purpose:** Automated testing to verify all validators agree on edge cases.

**Pattern:** Similar to `scripts/verify-pricing-formulas.js`

**Test Scenarios:**

```javascript
const TEST_CASES = [
  {
    name: "Normal 5-night stay (Mon-Sat)",
    selectedDayIndices: [1, 2, 3, 4, 5, 6],
    listing: { minimumNights: 2, maximumNights: 7, daysAvailable: [0,1,2,3,4,5,6] },
    expectedValid: true,
    expectedNights: 5,
    expectedContiguous: true
  },
  {
    name: "Wrap-around weekend (Fri-Mon)",
    selectedDayIndices: [5, 6, 0, 1],
    listing: { minimumNights: 2, maximumNights: 7, daysAvailable: [0,1,2,3,4,5,6] },
    expectedValid: true,
    expectedNights: 3,
    expectedContiguous: true,
    expectedCheckIn: 5, // Friday
    expectedCheckOut: 1  // Monday
  },
  {
    name: "Gap selection (Mon, Wed, Fri) - INVALID",
    selectedDayIndices: [1, 3, 5],
    listing: { minimumNights: 2, maximumNights: 7, daysAvailable: [0,1,2,3,4,5,6] },
    expectedValid: false,
    expectedError: 'CONTIGUITY'
  },
  {
    name: "Below absolute minimum (1 night) - INVALID",
    selectedDayIndices: [1, 2],
    listing: { minimumNights: 2, maximumNights: 7, daysAvailable: [0,1,2,3,4,5,6] },
    expectedValid: false,
    expectedError: 'ABSOLUTE_MINIMUM',
    expectedNights: 1
  },
  {
    name: "Below host minimum (2 nights, host wants 3) - WARNING",
    selectedDayIndices: [1, 2, 3],
    listing: { minimumNights: 3, maximumNights: 7, daysAvailable: [0,1,2,3,4,5,6] },
    expectedValid: false, // or true with warning, depending on business logic
    expectedError: 'MINIMUM_NIGHTS',
    expectedNights: 2
  },
  {
    name: "Above host maximum (6 nights, host max 5) - WARNING",
    selectedDayIndices: [0, 1, 2, 3, 4, 5, 6],
    listing: { minimumNights: 2, maximumNights: 5, daysAvailable: [0,1,2,3,4,5,6] },
    expectedValid: false,
    expectedError: 'MAXIMUM_NIGHTS',
    expectedNights: 6
  },
  {
    name: "Unavailable day selected (no Sunday) - INVALID",
    selectedDayIndices: [0, 1, 2],
    listing: { minimumNights: 2, maximumNights: 7, daysAvailable: [1,2,3,4,5,6] },
    expectedValid: false,
    expectedError: 'DAYS_NOT_AVAILABLE'
  },
  {
    name: "Full week (7 days = 7 nights)",
    selectedDayIndices: [0, 1, 2, 3, 4, 5, 6],
    listing: { minimumNights: 2, maximumNights: 7, daysAvailable: [0,1,2,3,4,5,6] },
    expectedValid: true,
    expectedNights: 7, // CRITICAL: Full week = 7 nights, not 6!
    expectedContiguous: true
  }
];
```

**For Each Test:**
```javascript
// Import validators
import { validateScheduleGolden } from '../app/src/lib/scheduleSelector/goldenScheduleValidator.js';
import { validateScheduleWorkflow } from '../app/src/logic/workflows/scheduling/validateScheduleWorkflow.js';
import { validateSchedule } from '../app/src/lib/scheduleSelector/validators.js';

// Run all three
const goldenResult = validateScheduleGolden(testCase);
const backendResult = validateScheduleWorkflow(testCase);
const frontendResult = validateSchedule(convertToFrontendFormat(testCase));

// Compare
if (goldenResult.valid !== backendResult.valid) {
  console.error(`❌ MISMATCH: ${testCase.name}`);
  console.log('  Golden:', goldenResult);
  console.log('  Backend:', backendResult);
  hasErrors = true;
} else {
  console.log(`✅ ${testCase.name}`);
}
```

**Exit Code:**
```javascript
process.exit(hasErrors ? 1 : 0);
```

---

### **Task 3: Fix Backend Nights Calculation Bug**

**File:** `app/src/logic/workflows/scheduling/validateScheduleWorkflow.js`

**Issue:** Line 55 incorrectly calculates nights as `selectedDayIndices.length` instead of `selectedDayIndices.length - 1`

**Change:**

```javascript
// BEFORE (Line 54-55)
  // Calculate nights (in split lease, nights = days selected)
  const nightsCount = selectedDayIndices.length

// AFTER
  // Calculate nights count with full week special case
  // Business Rule: 7 days = 7 nights (full week), partial week = days - 1
  // Note: 6-night bookings DO NOT EXIST in Split Lease model
  const nightsCount = selectedDayIndices.length === 7
    ? 7
    : Math.max(0, selectedDayIndices.length - 1)
```

**Update JSDoc Comment:**
```javascript
// Line 54
// OLD: Calculate nights (in split lease, nights = days selected)
// NEW: Calculate nights count (7 days = 7 nights, partial = days - 1)
```

**Testing:**
After fix, run:
```bash
node scripts/verify-schedule-validators.js
```

Expected: "Full week (7 days)" test should show **7 nights**, not 6.

---

## CLAUDE CODE TASKS

### **Task 4: Create Multi-Check Orchestrator**

**File:** `app/src/lib/scheduleSelector/multiCheckScheduleValidator.js` (NEW)

**Purpose:** Run validation through all three systems and detect discrepancies.

**Function:**
```javascript
export function runScheduleMultiCheck({ selectedDayIndices, listing }) {
  const checks = [];

  // Check 1: Golden Validator (source of truth)
  try {
    const goldenResult = validateScheduleGolden({ selectedDayIndices, listing });
    checks.push({
      source: 'GOLDEN_VALIDATOR',
      valid: goldenResult.valid,
      errors: goldenResult.errors,
      metadata: goldenResult.metadata
    });
  } catch (error) {
    checks.push({
      source: 'GOLDEN_VALIDATOR',
      valid: false,
      errors: [{ rule: 'SYSTEM_ERROR', message: error.message, severity: 'ERROR' }],
      metadata: null
    });
  }

  // Check 2: Backend Workflow
  try {
    const backendResult = validateScheduleWorkflow({ selectedDayIndices, listing });
    checks.push({
      source: 'BACKEND_WORKFLOW',
      valid: backendResult.valid,
      errors: backendResult.errorCode ? [{ rule: backendResult.errorCode, severity: 'ERROR' }] : [],
      metadata: {
        nightsCount: backendResult.nightsCount,
        isContiguous: backendResult.isContiguous
      }
    });
  } catch (error) {
    checks.push({
      source: 'BACKEND_WORKFLOW',
      valid: false,
      errors: [{ rule: 'SYSTEM_ERROR', message: error.message, severity: 'ERROR' }],
      metadata: null
    });
  }

  // Check 3: Frontend Validator
  // Note: Frontend validator expects different format (day objects, not indices)
  // Skip for now, or convert format
  
  // Analyze results
  const validityFlags = checks.map(c => c.valid);
  const allAgree = validityFlags.every(v => v === validityFlags[0]);
  const majorityValid = validityFlags.filter(v => v === true).length > validityFlags.length / 2;

  return {
    allChecksPass: checks.every(c => c.valid),
    allAgree,
    hasDiscrepancy: !allAgree,
    recommendation: allAgree 
      ? (checks[0].valid ? 'APPROVE' : 'REJECT')
      : (majorityValid ? 'APPROVE_WITH_WARNING' : 'REJECT_WITH_WARNING'),
    checks,
    summary: {
      goldenValid: checks[0]?.valid,
      backendValid: checks[1]?.valid,
      nightsCount: checks[0]?.metadata?.nightsCount
    }
  };
}
```

**Import:**
```javascript
import { validateScheduleGolden } from './goldenScheduleValidator.js';
import { validateScheduleWorkflow } from '../../logic/workflows/scheduling/validateScheduleWorkflow.js';
```

---

### **Task 5: Integrate Multi-Check into Hook**

**File:** `app/src/islands/shared/useScheduleSelector.js`

**Add Import (top of file):**
```javascript
import { runScheduleMultiCheck } from '../../lib/scheduleSelector/multiCheckScheduleValidator.js';
```

**Modify `handleDaySelect` function (around line 172):**

**Add after line 209 (after successful validation):**
```javascript
    // Add and sort
    const newSelection = sortDays([...selectedDays, day]);
    
    // 🔍 TRIPLE-CHECK: Run multi-validator
    const multiCheckResult = runScheduleMultiCheck({
      selectedDayIndices: newSelection.map(d => d.dayOfWeek),
      listing: {
        minimumNights: listing.minimumNights,
        maximumNights: limitToFiveNights ? Math.min(5, listing.maximumNights) : listing.maximumNights,
        daysAvailable: listing.daysAvailable
      }
    });

    if (multiCheckResult.hasDiscrepancy) {
      console.warn('⚠️ SCHEDULE VALIDATION DISCREPANCY DETECTED');
      console.warn('Multi-Check Result:', multiCheckResult);
      console.table(multiCheckResult.checks.map(c => ({
        Source: c.source,
        Valid: c.valid,
        Errors: c.errors.map(e => e.rule).join(', ')
      })));
    }

    setSelectedDays(newSelection);
    // ... rest of function
```

**Goal:** Log discrepancies in development, silent in production (or send to monitoring).

---

### **Task 6: Enhance ZScheduleTestPage with Triple-Check Matrix**

**File:** `app/src/islands/pages/ZScheduleTestPage/ZScheduleTestPage.jsx`

**Add Import:**
```javascript
import ScheduleValidationMatrix from '../../shared/ScheduleValidationMatrix.jsx';
```

**Add new section after line 233 (after Listing Schedule Selector card):**
```jsx
            <div className="zst-card">
              <span className="zst-card-title">🔍 Triple-Check Validation Matrix</span>
              <p className="zst-description">
                Compares validation results across Golden Validator, Backend Workflow, and Frontend Validators.
              </p>
              {listingSelectedDays.length > 0 ? (
                <ScheduleValidationMatrix
                  selectedDayIndices={listingSelectedDays.map(d => d.dayOfWeek)}
                  listing={scheduleListing}
                />
              ) : (
                <p className="zst-muted">Select days to see validation matrix</p>
              )}
            </div>
```

**Add CSS (in `ZScheduleTestPage.css`):**
```css
.zst-description {
  font-size: 13px;
  color: #6B7280;
  margin-bottom: 12px;
}

.zst-muted {
  font-size: 13px;
  color: #9CA3AF;
  font-style: italic;
}
```

---

### **Task 7: Add Edge Case Test Scenarios**

**File:** `app/src/islands/pages/ZScheduleTestPage/useZScheduleTestPageLogic.js`

**Add constant (after line 23):**
```javascript
const EDGE_CASE_SCENARIOS = [
  {
    id: 'normal-5-night',
    name: 'Normal 5-Night Stay (Mon-Sat)',
    dayIndices: [1, 2, 3, 4, 5, 6],
    expectedValid: true,
    expectedNights: 5
  },
  {
    id: 'wrap-around',
    name: 'Wrap-Around Weekend (Fri-Mon)',
    dayIndices: [5, 6, 0, 1],
    expectedValid: true,
    expectedNights: 3
  },
  {
    id: 'gap-selection',
    name: 'Gap Selection (Mon, Wed, Fri)',
    dayIndices: [1, 3, 5],
    expectedValid: false,
    expectedError: 'CONTIGUITY'
  },
  {
    id: 'below-min',
    name: 'Below Minimum (1 night)',
    dayIndices: [1, 2],
    expectedValid: false,
    expectedError: 'ABSOLUTE_MINIMUM'
  },
  {
    id: 'full-week',
    name: 'Full Week (7 days = 6 nights)',
    dayIndices: [0, 1, 2, 3, 4, 5, 6],
    expectedValid: true,
    expectedNights: 6
  }
];
```

**Add state:**
```javascript
const [selectedScenario, setSelectedScenario] = useState(null);
```

**Add handler:**
```javascript
const handleLoadScenario = useCallback((scenarioId) => {
  const scenario = EDGE_CASE_SCENARIOS.find(s => s.id === scenarioId);
  if (!scenario) return;

  setSelectedScenario(scenario);
  
  // Convert day indices to day objects
  const dayObjects = scenario.dayIndices.map(idx => {
    const allDays = createAllDays([0,1,2,3,4,5,6]);
    return allDays.find(d => d.dayOfWeek === idx);
  }).filter(Boolean);

  setListingSelectedDays(dayObjects);
}, []);
```

**Export:**
```javascript
return {
  // ... existing exports
  edgeCaseScenarios: EDGE_CASE_SCENARIOS,
  selectedScenario,
  handleLoadScenario
};
```

**In JSX (ZScheduleTestPage.jsx), add UI:**
```jsx
<div className="zst-card">
  <span className="zst-card-title">Edge Case Scenarios</span>
  <div className="zst-button-row">
    {edgeCaseScenarios.map(scenario => (
      <button
        key={scenario.id}
        type="button"
        className={`zst-button ${selectedScenario?.id === scenario.id ? 'active' : ''}`}
        onClick={() => handleLoadScenario(scenario.id)}
      >
        {scenario.name}
      </button>
    ))}
  </div>
  {selectedScenario && (
    <div className="zst-meta">
      <p><span>Expected Valid</span>{selectedScenario.expectedValid ? 'Yes' : 'No'}</p>
      <p><span>Expected Nights</span>{selectedScenario.expectedNights}</p>
    </div>
  )}
</div>
```

---

### **Task 8: Create Validation Matrix Component**

**File:** `app/src/islands/shared/ScheduleValidationMatrix.jsx` (NEW)

**Purpose:** Visual comparison of all three validators.

**Component:**

```jsx
import { useMemo } from 'react';
import { runScheduleMultiCheck } from '../../lib/scheduleSelector/multiCheckScheduleValidator.js';
import './ScheduleValidationMatrix.css';

export default function ScheduleValidationMatrix({ selectedDayIndices, listing }) {
  const multiCheckResult = useMemo(() => {
    if (!selectedDayIndices || selectedDayIndices.length === 0) return null;
    
    return runScheduleMultiCheck({
      selectedDayIndices,
      listing: {
        minimumNights: listing.minimumNights || 2,
        maximumNights: listing.maximumNights || 7,
        daysAvailable: listing.daysAvailable || [0,1,2,3,4,5,6]
      }
    });
  }, [selectedDayIndices, listing]);

  if (!multiCheckResult) {
    return <p className="svm-empty">No selection to validate</p>;
  }

  const { goldenValid, backendValid } = multiCheckResult.summary;
  const allAgree = multiCheckResult.allAgree;

  return (
    <div className="schedule-validation-matrix">
      <div className="svm-header">
        <div className="svm-status">
          {allAgree ? (
            <span className="svm-badge svm-badge--success">✅ All Validators Agree</span>
          ) : (
            <span className="svm-badge svm-badge--error">🚨 DISCREPANCY DETECTED</span>
          )}
        </div>
        <div className="svm-summary">
          <span>Nights: {multiCheckResult.summary.nightsCount}</span>
          <span>Recommendation: {multiCheckResult.recommendation}</span>
        </div>
      </div>

      <table className="svm-table">
        <thead>
          <tr>
            <th>Validator</th>
            <th>Valid</th>
            <th>Errors</th>
            <th>Nights</th>
            <th>Contiguous</th>
          </tr>
        </thead>
        <tbody>
          {multiCheckResult.checks.map((check, idx) => (
            <tr key={idx} className={check.valid ? 'svm-row--valid' : 'svm-row--invalid'}>
              <td className="svm-source">{check.source.replace(/_/g, ' ')}</td>
              <td>
                {check.valid ? (
                  <span className="svm-icon svm-icon--success">✅</span>
                ) : (
                  <span className="svm-icon svm-icon--error">❌</span>
                )}
              </td>
              <td className="svm-errors">
                {check.errors.length > 0 ? (
                  <ul>
                    {check.errors.map((err, i) => (
                      <li key={i}>{err.rule} ({err.severity})</li>
                    ))}
                  </ul>
                ) : (
                  <span className="svm-none">—</span>
                )}
              </td>
              <td>{check.metadata?.nightsCount ?? '—'}</td>
              <td>
                {check.metadata?.isContiguous !== undefined 
                  ? (check.metadata.isContiguous ? 'Yes' : 'No')
                  : '—'
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {!allAgree && (
        <div className="svm-warning">
          ⚠️ Discrepancy Alert: Validators disagree. Review rules and update accordingly.
        </div>
      )}
    </div>
  );
}
```

**Styles (`ScheduleValidationMatrix.css`):**

```css
.schedule-validation-matrix {
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 16px;
}

.svm-header {
  margin-bottom: 16px;
}

.svm-status {
  margin-bottom: 8px;
}

.svm-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.svm-badge--success {
  background: #D1FAE5;
  color: #065F46;
}

.svm-badge--error {
  background: #FEE2E2;
  color: #991B1B;
}

.svm-summary {
  font-size: 13px;
  color: #6B7280;
  display: flex;
  gap: 16px;
}

.svm-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.svm-table th {
  text-align: left;
  padding: 8px;
  background: #F3F4F6;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #D1D5DB;
}

.svm-table td {
  padding: 8px;
  border-bottom: 1px solid #E5E7EB;
}

.svm-row--valid {
  background: #F0FDF4;
}

.svm-row--invalid {
  background: #FEF2F2;
}

.svm-source {
  font-weight: 500;
  color: #111827;
}

.svm-icon--success {
  color: #10B981;
}

.svm-icon--error {
  color: #EF4444;
}

.svm-errors ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.svm-errors li {
  font-size: 12px;
  color: #991B1B;
}

.svm-none {
  color: #9CA3AF;
}

.svm-warning {
  margin-top: 12px;
  padding: 12px;
  background: #FEF3C7;
  border-left: 4px solid #F59E0B;
  border-radius: 4px;
  font-size: 13px;
  color: #92400E;
}

.svm-empty {
  color: #9CA3AF;
  font-size: 13px;
  font-style: italic;
}
```

---

## Execution Order

### Phase 1: Foundation (OpenCode)
1. ✅ Task 1: Create Golden Validator
2. ✅ Task 3: Fix Backend Bug
3. ✅ Task 2: Create Verification Script → **RUN & VERIFY**

### Phase 2: Integration (Claude Code)
4. ✅ Task 4: Create Multi-Check Orchestrator
5. ✅ Task 8: Create Validation Matrix Component
6. ✅ Task 5: Integrate Multi-Check into Hook

### Phase 3: Testing UI (Claude Code)
7. ✅ Task 7: Add Edge Case Scenarios
8. ✅ Task 6: Enhance ZScheduleTestPage

### Phase 4: Verification
9. Run `node scripts/verify-schedule-validators.js`
10. Navigate to `/_internal/z-schedule-test`
11. Load each edge case scenario
12. Verify Triple-Check Matrix shows all green checkmarks

---

## Acceptance Criteria

- [ ] `node scripts/verify-schedule-validators.js` → All tests pass ✅
- [ ] ZScheduleTestPage shows Triple-Check Matrix
- [ ] All 5 edge case scenarios show "All Validators Agree"
- [ ] Backend nights calculation fixed (7 days = 6 nights, not 7)
- [ ] Multi-check logging works in `useScheduleSelector` hook
- [ ] No discrepancies detected in normal usage
- [ ] Validation Matrix component renders correctly

---

## Risk Mitigation

**If validators disagree:**
1. Check console logs for multi-check result details
2. Compare error codes and severity levels
3. Update whichever validator is incorrect
4. Re-run verification script

**If edge cases fail:**
1. Check expected vs. actual nights count
2. Verify contiguity logic for wrap-around cases
3. Ensure min/max checks use same formula (nights, not days)

---

## Post-Implementation

After all tasks complete:

1. **Update Documentation**
   - Document Golden Rules in project wiki
   - Add Multi-Check pattern to developer guide

2. **Monitoring**
   - Add telemetry for discrepancy detection in production
   - Alert if validators disagree > 1% of selections

3. **Future Enhancements**
   - Add pattern restrictions (1-on-1-off, etc.) to Golden Validator
   - Extend to reservation conflicts (overlapping bookings)

---

## References

- **Pricing Implementation:** `docs/pricing/VERIFICATION_REPORT.md`
- **Discovery Report:** `docs/schedule/DISCOVERY_REPORT.md`
- **Test Page Route:** `/_internal/z-schedule-test`
