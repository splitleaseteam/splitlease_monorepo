# OpenCode Agent: Schedule Validator Foundation Tasks

**Date:** 2026-01-28  
**Agent:** OpenCode  
**Project:** Schedule Selector Triple-Check System  
**Phase:** Foundation Layer

---

## 🎯 Your Mission

You are implementing the **foundation layer** for the Schedule Selector Triple-Check system. Your tasks create the Golden Validator, verification script, and fix a critical backend bug.

**Context:** We're reconciling schedule validation logic across Frontend, Backend, and creating a canonical Golden Validator—the same pattern that successfully fixed pricing discrepancies on Jan 27, 2026.

---

## 📋 Your Tasks (3 Tasks Total)

### **Task 1: Create Golden Schedule Validator** (~200 lines) 🔴 HIGH PRIORITY
### **Task 2: Create Verification Script** (~150 lines) 🔴 HIGH PRIORITY  
### **Task 3: Fix Backend Nights Calculation Bug** (~10 lines) 🔴 HIGH PRIORITY

**Total:** ~360 lines across 3 files

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

**Why:** Customers choosing 6+ days prefer full-time (7 nights) instead of 6 nights.

---

## 📖 Background Reading (REQUIRED)

Before starting, read these files to understand the current implementation:

1. **`docs/schedule/DISCOVERY_REPORT.md`** - Full analysis (focus on Golden Rules section)
2. **`docs/schedule/IMPLEMENTATION_PLAN.md`** - Your detailed task specs (OpenCode Tasks section)
3. **`docs/schedule/BUSINESS_RULE_CORRECTION.md`** - Critical formula explanation

### Existing Code to Reference:
- `app/src/logic/rules/scheduling/isScheduleContiguous.js` - Use this contiguity logic
- `app/src/lib/scheduleSelector/nightCalculations.js` - Use this for check-in/out
- `app/src/logic/workflows/scheduling/validateScheduleWorkflow.js` - The file with the bug

---

## 📝 TASK 1: Create Golden Schedule Validator

**File:** `app/src/lib/scheduleSelector/goldenScheduleValidator.js` (NEW)

### Purpose:
Canonical implementation of ALL schedule validation rules. This is the **source of truth**.

### Function to Create:

```javascript
/**
 * Golden Schedule Validator - Canonical implementation of all schedule validation rules.
 * 
 * @param {Object} params - Validation parameters
 * @param {number[]} params.selectedDayIndices - Array of selected day indices (0=Sunday, ..., 6=Saturday)
 * @param {Object} params.listing - Listing configuration
 * @param {number} [params.listing.minimumNights] - Host's minimum nights requirement
 * @param {number} [params.listing.maximumNights] - Host's maximum nights allowed
 * @param {number[]} [params.listing.daysAvailable] - Array of available day indices
 * 
 * @returns {Object} Validation result
 * @returns {boolean} result.valid - Whether schedule is valid (no ERROR-level violations)
 * @returns {Array} result.errors - Array of error objects { rule, message, severity }
 * @returns {Object} result.metadata - Additional data (nightsCount, isContiguous, checkInDay, checkOutDay, unusedNights)
 */
export function validateScheduleGolden({ selectedDayIndices, listing = {} }) {
  // Implementation here
}
```

### Rules to Implement (in order):

#### Rule 1: Input Validation
```javascript
if (!Array.isArray(selectedDayIndices)) {
  throw new Error('selectedDayIndices must be an array');
}

if (selectedDayIndices.length === 0) {
  return {
    valid: false,
    errors: [{ rule: 'NO_DAYS_SELECTED', message: 'No days selected', severity: 'ERROR' }],
    metadata: { nightsCount: 0, isContiguous: false, checkInDay: null, checkOutDay: null, unusedNights: 7 }
  };
}
```

#### Rule 2: Nights Calculation (CRITICAL!)
```javascript
// GOLDEN FORMULA - Full week special case
let nightsCount;
if (selectedDayIndices.length === 7) {
  nightsCount = 7;  // Full week = 7 nights (full-time rental)
} else {
  nightsCount = Math.max(0, selectedDayIndices.length - 1);  // Partial week
}
```

#### Rule 3: Contiguity Check
```javascript
// Import from existing canonical implementation
import { isScheduleContiguous } from '../../logic/rules/scheduling/isScheduleContiguous.js';

const isContiguous = isScheduleContiguous({ selectedDayIndices });

if (!isContiguous) {
  errors.push({
    rule: 'NOT_CONTIGUOUS',
    message: 'Days must be consecutive',
    severity: 'ERROR'
  });
}
```

#### Rule 4: Absolute Minimum (Hardcoded - Cannot be overridden)
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

#### Rule 5: Host Minimum (Soft Constraint - Warning)
```javascript
if (listing.minimumNights && nightsCount < listing.minimumNights) {
  errors.push({
    rule: 'MINIMUM_NIGHTS',
    message: `Host requires minimum ${listing.minimumNights} nights`,
    severity: 'WARNING'  // Soft constraint
  });
}
```

#### Rule 6: Absolute Maximum (Hardcoded)
```javascript
const ABSOLUTE_MAX_NIGHTS = 7;

if (nightsCount > ABSOLUTE_MAX_NIGHTS) {
  errors.push({
    rule: 'ABSOLUTE_MAXIMUM',
    message: `Maximum ${ABSOLUTE_MAX_NIGHTS} nights allowed`,
    severity: 'ERROR'
  });
}
```

#### Rule 7: Host Maximum (Soft Constraint - Warning)
```javascript
if (listing.maximumNights && nightsCount > listing.maximumNights) {
  errors.push({
    rule: 'MAXIMUM_NIGHTS',
    message: `Host allows maximum ${listing.maximumNights} nights`,
    severity: 'WARNING'  // Soft constraint
  });
}
```

#### Rule 8: Day Availability (Hard Constraint)
```javascript
if (listing.daysAvailable && Array.isArray(listing.daysAvailable)) {
  const unavailable = selectedDayIndices.filter(d => !listing.daysAvailable.includes(d));
  
  if (unavailable.length > 0) {
    const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayNames = unavailable.map(idx => DAY_NAMES[idx]).join(', ');
    
    errors.push({
      rule: 'DAYS_NOT_AVAILABLE',
      message: `Selected days not available: ${dayNames}`,
      severity: 'ERROR'
    });
  }
}
```

#### Rule 9: Calculate Check-In/Check-Out
```javascript
// Simple logic (can be enhanced later)
const sorted = [...selectedDayIndices].sort((a, b) => a - b);

let checkInDay = sorted[0];
let checkOutDay = sorted[sorted.length - 1];

// Handle wrap-around case (has both Sunday=0 and Saturday=6)
if (sorted.includes(0) && sorted.includes(6) && sorted.length < 7) {
  // Find the gap
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i + 1] - sorted[i] > 1) {
      // Gap found between sorted[i] and sorted[i+1]
      checkInDay = sorted[i + 1];  // First day after gap
      checkOutDay = sorted[i];     // Last day before gap
      break;
    }
  }
}
```

#### Final Return:
```javascript
const unusedNights = 7 - nightsCount;

return {
  valid: errors.filter(e => e.severity === 'ERROR').length === 0,
  errors,
  metadata: {
    nightsCount,
    isContiguous,
    checkInDay,
    checkOutDay,
    unusedNights
  }
};
```

### File Structure:
```javascript
import { isScheduleContiguous } from '../../logic/rules/scheduling/isScheduleContiguous.js';

const ABSOLUTE_MIN_NIGHTS = 2;
const ABSOLUTE_MAX_NIGHTS = 7;

/**
 * Golden Schedule Validator
 * [full JSDoc here]
 */
export function validateScheduleGolden({ selectedDayIndices, listing = {} }) {
  const errors = [];
  
  // Rule 1: Input validation
  // Rule 2: Nights calculation
  // Rule 3: Contiguity
  // Rule 4: Absolute minimum
  // Rule 5: Host minimum
  // Rule 6: Absolute maximum
  // Rule 7: Host maximum
  // Rule 8: Day availability
  // Rule 9: Check-in/check-out
  
  // Return result
}
```

---

## 📝 TASK 2: Create Verification Script

**File:** `scripts/verify-schedule-validators.js` (NEW)

### Purpose:
Automated testing to verify all validators agree on edge cases.

### Test Cases to Implement:

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
    expectedCheckIn: 5,
    expectedCheckOut: 1
  },
  {
    name: "Gap selection (Mon, Wed, Fri) - INVALID",
    selectedDayIndices: [1, 3, 5],
    listing: { minimumNights: 2, maximumNights: 7, daysAvailable: [0,1,2,3,4,5,6] },
    expectedValid: false,
    expectedError: 'NOT_CONTIGUOUS'
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
    expectedValid: false,
    expectedError: 'MINIMUM_NIGHTS',
    expectedNights: 2
  },
  {
    name: "Above host maximum (7 days, host max 5) - WARNING",
    selectedDayIndices: [0, 1, 2, 3, 4, 5, 6],
    listing: { minimumNights: 2, maximumNights: 5, daysAvailable: [0,1,2,3,4,5,6] },
    expectedValid: false,
    expectedError: 'MAXIMUM_NIGHTS',
    expectedNights: 7  // Full week
  },
  {
    name: "Unavailable day selected (no Sunday) - INVALID",
    selectedDayIndices: [0, 1, 2],
    listing: { minimumNights: 2, maximumNights: 7, daysAvailable: [1,2,3,4,5,6] },
    expectedValid: false,
    expectedError: 'DAYS_NOT_AVAILABLE'
  },
  {
    name: "Full week (7 days = 7 nights) ⭐ CRITICAL",
    selectedDayIndices: [0, 1, 2, 3, 4, 5, 6],
    listing: { minimumNights: 2, maximumNights: 7, daysAvailable: [0,1,2,3,4,5,6] },
    expectedValid: true,
    expectedNights: 7,  // NOT 6! This is the critical test
    expectedContiguous: true
  }
];
```

### Script Structure:

```javascript
import { validateScheduleGolden } from '../app/src/lib/scheduleSelector/goldenScheduleValidator.js';
import { validateScheduleWorkflow } from '../app/src/logic/workflows/scheduling/validateScheduleWorkflow.js';

console.log('🧪 Testing Schedule Validators...\n');

let hasErrors = false;
let passedTests = 0;
let totalTests = TEST_CASES.length;

for (const testCase of TEST_CASES) {
  const { name, selectedDayIndices, listing, expectedValid, expectedNights, expectedError } = testCase;
  
  // Run Golden Validator
  const goldenResult = validateScheduleGolden({ selectedDayIndices, listing });
  
  // Run Backend Workflow
  const backendResult = validateScheduleWorkflow({ selectedDayIndices, listing });
  
  // Validate results
  let testPassed = true;
  let issues = [];
  
  // Check validity agreement
  if (goldenResult.valid !== backendResult.valid) {
    testPassed = false;
    issues.push(`Valid mismatch: Golden=${goldenResult.valid}, Backend=${backendResult.valid}`);
  }
  
  // Check expected validity
  if (goldenResult.valid !== expectedValid) {
    testPassed = false;
    issues.push(`Expected valid=${expectedValid}, got ${goldenResult.valid}`);
  }
  
  // Check nights count
  if (expectedNights !== undefined && goldenResult.metadata.nightsCount !== expectedNights) {
    testPassed = false;
    issues.push(`Expected ${expectedNights} nights, got ${goldenResult.metadata.nightsCount}`);
  }
  
  // Check nights agreement between validators
  if (goldenResult.metadata.nightsCount !== backendResult.nightsCount) {
    testPassed = false;
    issues.push(`Nights mismatch: Golden=${goldenResult.metadata.nightsCount}, Backend=${backendResult.nightsCount}`);
  }
  
  // Display results
  if (testPassed) {
    console.log(`✅ ${name}`);
    console.log(`   Valid: ${goldenResult.valid}, Nights: ${goldenResult.metadata.nightsCount}\n`);
    passedTests++;
  } else {
    console.log(`❌ ${name}`);
    console.log(`   Issues: ${issues.join('; ')}`);
    console.log(`   Golden:`, goldenResult);
    console.log(`   Backend:`, backendResult);
    console.log('');
    hasErrors = true;
  }
}

// Summary
console.log('========================================');
if (hasErrors) {
  console.log(`❌ TESTS FAILED (${passedTests}/${totalTests} passed)`);
  console.log('🚨 DISCREPANCIES DETECTED');
} else {
  console.log(`✅ ALL TESTS PASSED (${passedTests}/${totalTests})`);
  console.log('✅ NO DISCREPANCIES DETECTED');
}
console.log('========================================');

process.exit(hasErrors ? 1 : 0);
```

---

## 📝 TASK 3: Fix Backend Nights Calculation Bug

**File:** `app/src/logic/workflows/scheduling/validateScheduleWorkflow.js`

### The Bug (Line 54-55):
```javascript
// CURRENT (WRONG for partial weeks, accidentally correct for full week)
// Calculate nights (in split lease, nights = days selected)
const nightsCount = selectedDayIndices.length
```

### The Fix:
```javascript
// AFTER - Include full week special case
// Calculate nights count with full week special case
// Business Rule: 7 days = 7 nights (full week), partial week = days - 1
// Note: 6-night bookings DO NOT EXIST in Split Lease model
const nightsCount = selectedDayIndices.length === 7
  ? 7
  : Math.max(0, selectedDayIndices.length - 1)
```

### Full Context (Lines 50-60):
```javascript
  if (selectedDayIndices.length === 0) {
    return {
      valid: false,
      errorCode: 'NO_DAYS_SELECTED',
      nightsCount: 0,
      isContiguous: false
    }
  }

  // Calculate nights count with full week special case
  // Business Rule: 7 days = 7 nights (full week), partial week = days - 1
  // Note: 6-night bookings DO NOT EXIST in Split Lease model
  const nightsCount = selectedDayIndices.length === 7
    ? 7
    : Math.max(0, selectedDayIndices.length - 1)

  // Check contiguous requirement (CRITICAL business rule)
  const isContiguous = isScheduleContiguous({ selectedDayIndices })
```

---

## ✅ Testing & Verification

### After completing all 3 tasks, run:

```bash
node scripts/verify-schedule-validators.js
```

### Expected Output:
```
🧪 Testing Schedule Validators...

✅ Normal 5-night stay (Mon-Sat)
   Valid: true, Nights: 5

✅ Wrap-around weekend (Fri-Mon)
   Valid: true, Nights: 3

✅ Gap selection (Mon, Wed, Fri) - INVALID
   Valid: false, Nights: 2

✅ Below absolute minimum (1 night) - INVALID
   Valid: false, Nights: 1

✅ Below host minimum (2 nights, host wants 3) - WARNING
   Valid: false, Nights: 2

✅ Above host maximum (7 days, host max 5) - WARNING
   Valid: false, Nights: 7

✅ Unavailable day selected (no Sunday) - INVALID
   Valid: false, Nights: 2

✅ Full week (7 days = 7 nights) ⭐ CRITICAL
   Valid: true, Nights: 7

========================================
✅ ALL TESTS PASSED (8/8)
✅ NO DISCREPANCIES DETECTED
========================================
```

### 🚨 Critical Test:
**Test #8 (Full week)** is THE critical test. It MUST show **7 nights**, not 6!

If it shows 6 nights, the formula is wrong.

---

## 🎯 Success Criteria

- [ ] `goldenScheduleValidator.js` created with all 9 rules
- [ ] Verification script created with all 8 test cases
- [ ] Backend bug fixed with full week special case
- [ ] Verification script passes all tests (8/8)
- [ ] Test #8 shows 7 nights for full week
- [ ] Golden and Backend validators agree on all cases

---

## 📚 Additional Notes

### Why This Formula?

Split Lease has **TWO** distinct booking models:

1. **Partial Week (2-5 nights)**:
   - Traditional check-in/check-out
   - Nights are periods BETWEEN days
   - Formula: `nights = days - 1`
   - Example: Mon-Wed (3 days) = Mon night, Tue night (2 nights)

2. **Full Week (7 nights)**:
   - Full-time rental
   - All 7 nights counted
   - Special pricing (full-time discount)
   - Formula: `nights = 7`

**6 nights doesn't exist** because customers choosing 6+ days prefer the full week option.

---

## 🚀 Ready to Execute

All specifications are complete and correct. Follow the task order:
1. Task 1 (Golden Validator)
2. Task 3 (Backend Fix)
3. Task 2 (Verification Script)
4. Run verification script
5. Verify all 8 tests pass

Good luck! 🎉
