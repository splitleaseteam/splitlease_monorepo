# Claude Code Agent: Schedule Validator Integration Tasks

**Date:** 2026-01-28  
**Agent:** Claude Code  
**Project:** Schedule Selector Triple-Check System  
**Phase:** Integration & UI Layer

---

## 🎯 Your Mission

You are implementing the **integration and UI layer** for the Schedule Selector Triple-Check system. Your tasks integrate the Golden Validator into the frontend, create a visual comparison matrix, and enhance the test page.

**Context:** OpenCode has created the Golden Validator and verification script. Now you need to integrate it into the UI, add multi-check orchestration, and build the Triple-Check Matrix visualization.

**Prerequisites:** OpenCode must complete Tasks 1-3 first. You'll be building on top of their work.

---

## 📋 Your Tasks (5 Tasks Total)

### **Task 4: Create Multi-Check Orchestrator** (~100 lines) 🔴 HIGH PRIORITY
### **Task 5: Integrate Multi-Check into Hook** (~25 lines) 🟡 MEDIUM  
### **Task 6: Enhance Test Page with Matrix** (~30 lines) 🟡 MEDIUM
### **Task 7: Add Edge Case Scenarios** (~50 lines) 🟡 MEDIUM
### **Task 8: Create Validation Matrix Component** (~150 lines) 🟡 MEDIUM

**Total:** ~355 lines across 5 files

---

## 🚨 CRITICAL BUSINESS RULE

**6-night bookings DO NOT EXIST in the Split Lease model.**

### Valid Booking Ranges:
- **2-5 nights** (partial week stays)
- **7 nights** (full-time rental - full week)

### Nights Calculation Formula:
```javascript
// GOLDEN FORMULA
if (selectedDays.length === 7) {
  nightsCount = 7;  // Full week = 7 nights (special business rule)
} else {
  nightsCount = Math.max(0, selectedDays.length - 1);  // Partial week
}
```

---

## 📖 Background Reading (REQUIRED)

Before starting, read:

1. **`docs/schedule/IMPLEMENTATION_PLAN.md`** - Your detailed task specs (Claude Code Tasks section)
2. **`docs/schedule/BUSINESS_RULE_CORRECTION.md`** - Formula explanation
3. **`OPENCODE_SCHEDULE_PROMPT.md`** - What OpenCode implemented (so you know what to use)

### OpenCode's Deliverables (you'll use these):
- `app/src/lib/scheduleSelector/goldenScheduleValidator.js` - The Golden Validator
- `scripts/verify-schedule-validators.js` - Verification script (for reference)

### Existing Code to Reference:
- `app/src/islands/shared/useScheduleSelector.js` - Where you'll integrate multi-check
- `app/src/islands/pages/ZScheduleTestPage/ZScheduleTestPage.jsx` - Test page UI
- `app/src/islands/pages/ZScheduleTestPage/useZScheduleTestPageLogic.js` - Test page logic

---

## 📝 TASK 4: Create Multi-Check Orchestrator

**File:** `app/src/lib/scheduleSelector/multiCheckScheduleValidator.js` (NEW)

### Purpose:
Run validation through all three systems (Golden, Backend, Frontend) and detect discrepancies.

### Function to Create:

```javascript
import { validateScheduleGolden } from './goldenScheduleValidator.js';
import { validateScheduleWorkflow } from '../../logic/workflows/scheduling/validateScheduleWorkflow.js';

/**
 * Run schedule validation through all three validators and detect discrepancies.
 * 
 * @param {Object} params - Validation parameters
 * @param {number[]} params.selectedDayIndices - Array of selected day indices (0-6)
 * @param {Object} params.listing - Listing configuration
 * 
 * @returns {Object} Multi-check result
 * @returns {boolean} result.allChecksPass - All validators passed
 * @returns {boolean} result.allAgree - All validators agree (same valid/invalid)
 * @returns {boolean} result.hasDiscrepancy - Validators disagree
 * @returns {string} result.recommendation - 'APPROVE' | 'REJECT' | 'APPROVE_WITH_WARNING' | 'REJECT_WITH_WARNING'
 * @returns {Array} result.checks - Individual validator results
 * @returns {Object} result.summary - Quick summary (goldenValid, backendValid, nightsCount)
 */
export function runScheduleMultiCheck({ selectedDayIndices, listing = {} }) {
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
      errors: backendResult.errorCode 
        ? [{ rule: backendResult.errorCode, message: backendResult.errorCode, severity: 'ERROR' }] 
        : [],
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
      goldenValid: checks[0]?.valid ?? false,
      backendValid: checks[1]?.valid ?? false,
      nightsCount: checks[0]?.metadata?.nightsCount ?? 0
    }
  };
}
```

---

## 📝 TASK 5: Integrate Multi-Check into Hook

**File:** `app/src/islands/shared/useScheduleSelector.js`

### Add Import (at top of file, around line 2):
```javascript
import { runScheduleMultiCheck } from '../../lib/scheduleSelector/multiCheckScheduleValidator.js';
```

### Modify Function: `handleDaySelect` (around line 172-218)

**Find this section (after line 211):**
```javascript
    // Add and sort
    const newSelection = sortDays([...selectedDays, day]);
    setSelectedDays(newSelection);
    setErrorState({ hasError: false, errorType: null, errorMessage: '' });
    setRecalculateState(true);

    return true;
```

**Replace with:**
```javascript
    // Add and sort
    const newSelection = sortDays([...selectedDays, day]);
    
    // 🔍 TRIPLE-CHECK: Run multi-validator (dev mode only)
    if (process.env.NODE_ENV === 'development') {
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
          Valid: c.valid ? '✅' : '❌',
          Errors: c.errors.map(e => e.rule).join(', '),
          Nights: c.metadata?.nightsCount ?? '—'
        })));
      }
    }
    
    setSelectedDays(newSelection);
    setErrorState({ hasError: false, errorType: null, errorMessage: '' });
    setRecalculateState(true);

    return true;
```

**Goal:** Log discrepancies in development, but don't block the user. Silent in production.

---

## 📝 TASK 6: Enhance Test Page with Matrix

**File:** `app/src/islands/pages/ZScheduleTestPage/ZScheduleTestPage.jsx`

### Add Import (around line 10-15):
```javascript
import ScheduleValidationMatrix from '../../shared/ScheduleValidationMatrix.jsx';
```

### Add New Card Section (after line 233, after Listing Schedule Selector card):

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
                <p className="zst-muted">Select days above to see validation matrix</p>
              )}
            </div>
```

### Add CSS (in `ZScheduleTestPage.css`, at end of file):

```css
.zst-description {
  font-size: 13px;
  color: #6B7280;
  margin-bottom: 12px;
  line-height: 1.5;
}

.zst-muted {
  font-size: 13px;
  color: #9CA3AF;
  font-style: italic;
}
```

---

## 📝 TASK 7: Add Edge Case Scenarios

**File:** `app/src/islands/pages/ZScheduleTestPage/useZScheduleTestPageLogic.js`

### Add Constant (after line 23, after NIGHT_LABELS):

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
    name: 'Full Week (7 days = 7 nights)',
    dayIndices: [0, 1, 2, 3, 4, 5, 6],
    expectedValid: true,
    expectedNights: 7  // NOT 6!
  }
];
```

### Add State (around line 47, with other useState calls):
```javascript
const [selectedScenario, setSelectedScenario] = useState(null);
```

### Add Handler (around line 187, with other handlers):
```javascript
const handleLoadScenario = useCallback((scenarioId) => {
  const scenario = EDGE_CASE_SCENARIOS.find(s => s.id === scenarioId);
  if (!scenario || !scheduleListing) return;

  setSelectedScenario(scenario);
  
  // Convert day indices to day objects
  const allDaysArray = createAllDays(scheduleListing.daysAvailable || [0,1,2,3,4,5,6]);
  const dayObjects = scenario.dayIndices
    .map(idx => allDaysArray.find(d => d.dayOfWeek === idx))
    .filter(Boolean);

  setListingSelectedDays(dayObjects);
}, [scheduleListing]);
```

### Add to Return Statement (around line 189-220):
```javascript
return {
  // ... existing exports
  edgeCaseScenarios: EDGE_CASE_SCENARIOS,
  selectedScenario,
  handleLoadScenario
};
```

### Add UI Section in JSX (ZScheduleTestPage.jsx, in sidebar, after Price Configuration card):

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
                {selectedScenario.expectedError && (
                  <p><span>Expected Error</span>{selectedScenario.expectedError}</p>
                )}
              </div>
            )}
          </div>
```

**Note:** Make sure to destructure `edgeCaseScenarios`, `selectedScenario`, `handleLoadScenario` from `useZScheduleTestPageLogic()`.

---

## 📝 TASK 8: Create Validation Matrix Component

**File:** `app/src/islands/shared/ScheduleValidationMatrix.jsx` (NEW)

### Component Code:

```jsx
import { useMemo } from 'react';
import { runScheduleMultiCheck } from '../../lib/scheduleSelector/multiCheckScheduleValidator.js';
import './ScheduleValidationMatrix.css';

/**
 * Visual comparison matrix showing results from all schedule validators.
 * Displays Golden Validator, Backend Workflow, and optional Frontend Validator.
 */
export default function ScheduleValidationMatrix({ selectedDayIndices, listing }) {
  const multiCheckResult = useMemo(() => {
    if (!selectedDayIndices || selectedDayIndices.length === 0) return null;
    
    return runScheduleMultiCheck({
      selectedDayIndices,
      listing: {
        minimumNights: listing?.minimumNights || 2,
        maximumNights: listing?.maximumNights || 7,
        daysAvailable: listing?.daysAvailable || [0,1,2,3,4,5,6]
      }
    });
  }, [selectedDayIndices, listing]);

  if (!multiCheckResult) {
    return <p className="svm-empty">No selection to validate</p>;
  }

  const { goldenValid, backendValid, nightsCount } = multiCheckResult.summary;
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
          <span>Nights: {nightsCount}</span>
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
                    {check.errors.slice(0, 3).map((err, i) => (
                      <li key={i} title={err.message}>
                        {err.rule} <span className="svm-severity">({err.severity})</span>
                      </li>
                    ))}
                    {check.errors.length > 3 && (
                      <li className="svm-more">+{check.errors.length - 3} more</li>
                    )}
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
          ⚠️ <strong>Discrepancy Alert:</strong> Validators disagree. Review validation rules and update accordingly.
        </div>
      )}
    </div>
  );
}
```

### Styles File: `app/src/islands/shared/ScheduleValidationMatrix.css` (NEW)

```css
.schedule-validation-matrix {
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 16px;
  margin-top: 12px;
}

.svm-header {
  margin-bottom: 16px;
}

.svm-status {
  margin-bottom: 8px;
}

.svm-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
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
  flex-wrap: wrap;
}

.svm-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.svm-table th {
  text-align: left;
  padding: 10px 8px;
  background: #F3F4F6;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #D1D5DB;
}

.svm-table td {
  padding: 10px 8px;
  border-bottom: 1px solid #E5E7EB;
  vertical-align: top;
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
  font-size: 16px;
}

.svm-icon--error {
  color: #EF4444;
  font-size: 16px;
}

.svm-errors ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.svm-errors li {
  font-size: 12px;
  color: #DC2626;
  margin-bottom: 2px;
}

.svm-severity {
  color: #9CA3AF;
  font-size: 11px;
}

.svm-more {
  color: #6B7280;
  font-style: italic;
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
  line-height: 1.5;
}

.svm-empty {
  color: #9CA3AF;
  font-size: 13px;
  font-style: italic;
  text-align: center;
  padding: 20px;
}
```

---

## ✅ Testing & Verification

### After completing all 5 tasks:

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to test page:**
   ```
   http://localhost:3000/_internal/z-schedule-test
   ```

3. **Test Flow:**
   - Select a listing from dropdown
   - Click "Normal 5-Night Stay" button (edge case scenario)
   - Verify selected days appear
   - Scroll to "Triple-Check Validation Matrix"
   - Should see: "✅ All Validators Agree"
   - Should show: "Nights: 5"
   
4. **Test all edge cases:**
   - Normal 5-Night → Should agree, 5 nights
   - Wrap-Around Weekend → Should agree, 3 nights
   - Gap Selection → Should agree (invalid)
   - Below Minimum → Should agree (invalid)
   - **Full Week → Should agree, 7 nights** ⭐ CRITICAL

5. **Check console:**
   - Open browser DevTools console
   - Select some days manually
   - If validators disagree, you should see warning table

---

## 🎯 Success Criteria

- [ ] Multi-check orchestrator created and working
- [ ] Multi-check integrated into `useScheduleSelector` hook
- [ ] Console logs appear in dev mode when selecting days
- [ ] Test page shows Triple-Check Matrix
- [ ] Edge case scenario buttons work
- [ ] Validation Matrix displays correctly
- [ ] All 5 edge cases show "All Validators Agree"
- [ ] Full week scenario shows **7 nights** (not 6)
- [ ] Discrepancy warning appears if validators disagree (none should!)

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot find module goldenScheduleValidator"
**Solution:** Make sure OpenCode completed Task 1 first

### Issue: Matrix doesn't show
**Solution:** 
- Check that `listingSelectedDays.length > 0`
- Verify import path for `ScheduleValidationMatrix.jsx`
- Check browser console for errors

### Issue: Edge case buttons don't work
**Solution:**
- Verify `createAllDays` is imported in logic hook
- Check that `scheduleListing` has `daysAvailable`

### Issue: Styles not applying
**Solution:**
- Ensure CSS file is created: `ScheduleValidationMatrix.css`
- Check import statement in component

---

## 📊 Expected Matrix Output

### For Valid Selection (5 nights):
```
┌─────────────────────────────────────────┐
│ ✅ All Validators Agree                 │
│ Nights: 5    Recommendation: APPROVE    │
├─────────────────────────────────────────┤
│ Validator          Valid  Errors  Nights│
├─────────────────────────────────────────┤
│ GOLDEN VALIDATOR    ✅     —      5     │
│ BACKEND WORKFLOW    ✅     —      5     │
└─────────────────────────────────────────┘
```

### For Full Week (7 nights):
```
┌─────────────────────────────────────────┐
│ ✅ All Validators Agree                 │
│ Nights: 7    Recommendation: APPROVE    │
├─────────────────────────────────────────┤
│ GOLDEN VALIDATOR    ✅     —      7     │
│ BACKEND WORKFLOW    ✅     —      7     │
└─────────────────────────────────────────┘
```

**If you see 6 instead of 7, something is wrong!**

---

## 🚀 Ready to Execute

All specifications are complete. Wait for OpenCode to finish their 3 tasks, then proceed with yours in order:

1. Task 4 (Multi-Check Orchestrator)
2. Task 8 (Validation Matrix Component) - can do in parallel with 4
3. Task 5 (Integrate into Hook)
4. Task 7 (Edge Cases)
5. Task 6 (Enhance Test Page)
6. Test in browser

Good luck! 🎉
