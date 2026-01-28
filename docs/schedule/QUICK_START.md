# Schedule Selector Triple-Check: Quick Start Guide

**Date:** 2026-01-28  
**Status:** 📋 Ready for Agent Execution

---

## 🎯 Mission

Reconcile Schedule Selection validation logic across Frontend, Backend, and create a Golden Validator as the canonical source of truth. Pattern: **Additive Multi-Check System** (same as Pricing).

---

## 📊 Discovery Summary

**Found:** 5 key discrepancies in schedule validation

### Critical Issues:
1. ❌ **Backend Bug:** Nights calculation off by 1 (`days` instead of `days - 1`)
2. ⚠️ **Max Nights Inconsistency:** Frontend checks days with `>=`, backend checks nights with `>`
3. ⚠️ **Missing Check-In/Out:** Backend doesn't calculate check-in/check-out days
4. ⚠️ **Duplicate Contiguity:** Same logic in 2 files (frontend & backend)
5. ⚠️ **No Verification:** Test page has no multi-validator comparison

---

## 📁 Key Documents

| Document | Purpose | Status |
|----------|---------|--------|
| **`docs/schedule/DISCOVERY_REPORT.md`** | Full analysis of discrepancies | ✅ Complete |
| **`docs/schedule/IMPLEMENTATION_PLAN.md`** | Task breakdown for agents | ✅ Complete |
| **This File** | Quick reference for execution | ✅ You are here |

---

## 🔧 Golden Rules (The Truth)

### Rule 1: Contiguity
- Days must be consecutive
- ✅ Mon-Tue-Wed-Thu-Fri
- ❌ Mon, Wed, Fri
- ✅ Fri-Sat-Sun-Mon (wrap-around)
- Logic: 6+ days always contiguous; wrap-around uses inverse checking

### Rule 2: Nights Formula (CRITICAL)
```javascript
nightsCount = Math.max(0, selectedDays.length - 1)
```
**Example:** 7 days = 6 nights (not 7!)

### Rule 3: Minimum Nights
- **Absolute:** 2 nights minimum (hardcoded)
- **Host:** Variable (e.g., 3, 4, 5 nights)
- **Behavior:** Warning on first violation, then allow (soft constraint)

### Rule 4: Maximum Nights
- **Absolute:** 7 nights (full week)
- **Host:** Variable (e.g., 5, 6 nights)
- **Behavior:** Same as minimum

### Rule 5: Day Availability
- Must be in listing's `daysAvailable` array
- Hard constraint (cannot override)

### Rule 6: Check-In/Check-Out
- **Normal:** First day = check-in, Last day = check-out
- **Wrap-around:** Find gap, check-in after gap, check-out before gap

---

## 👥 Agent Task Allocation

### **OpenCode Tasks** (3 tasks - Foundation)

| # | Task | File | Lines | Priority |
|---|------|------|-------|----------|
| 1 | Create Golden Validator | `app/src/lib/scheduleSelector/goldenScheduleValidator.js` | ~200 | 🔴 High |
| 2 | Create Verification Script | `scripts/verify-schedule-validators.js` | ~150 | 🔴 High |
| 3 | Fix Backend Nights Bug | `app/src/logic/workflows/scheduling/validateScheduleWorkflow.js` | ~5 | 🔴 High |

**Total:** ~355 lines

---

### **Claude Code Tasks** (5 tasks - Integration)

| # | Task | File | Lines | Priority |
|---|------|------|-------|----------|
| 4 | Create Multi-Check Orchestrator | `app/src/lib/scheduleSelector/multiCheckScheduleValidator.js` | ~100 | 🔴 High |
| 5 | Integrate Multi-Check into Hook | `app/src/islands/shared/useScheduleSelector.js` | ~25 | 🟡 Medium |
| 6 | Enhance Test Page with Matrix | `app/src/islands/pages/ZScheduleTestPage/ZScheduleTestPage.jsx` | ~30 | 🟡 Medium |
| 7 | Add Edge Case Scenarios | `app/src/islands/pages/ZScheduleTestPage/useZScheduleTestPageLogic.js` | ~50 | 🟡 Medium |
| 8 | Create Validation Matrix Component | `app/src/islands/shared/ScheduleValidationMatrix.jsx` | ~150 | 🟡 Medium |

**Total:** ~355 lines

---

## ✅ Success Criteria

### Must Pass:
- [ ] `node scripts/verify-schedule-validators.js` → All 8 test cases pass
- [ ] Backend calculates 7 days = 6 nights (not 7)
- [ ] ZScheduleTestPage shows Triple-Check Matrix
- [ ] All 5 edge case scenarios: "All Validators Agree" ✅
- [ ] Wrap-around case (Fri-Mon) validates correctly
- [ ] Gap selection (Mon, Wed, Fri) rejected by all validators
- [ ] No discrepancies in console during normal usage

---

## 🚀 Execution Flow

### Phase 1: OpenCode (Foundation) - ~2 hours
```bash
# 1. Create golden validator
# 2. Fix backend bug (1-line change)
# 3. Create verification script

# Run verification
node scripts/verify-schedule-validators.js
# Expected: Some tests may fail (backend bug still in code)

# After fix:
node scripts/verify-schedule-validators.js
# Expected: All tests pass ✅
```

### Phase 2: Claude Code (Integration) - ~3 hours
```bash
# 4. Create multi-check orchestrator
# 5. Create validation matrix component
# 6. Integrate into hook
# 7. Add edge case scenarios
# 8. Enhance test page

# Test in browser:
# Navigate to: http://localhost:3000/_internal/z-schedule-test
# 1. Select a listing
# 2. Click "Normal 5-Night Stay" scenario
# 3. Verify Triple-Check Matrix shows all ✅
# 4. Try each edge case scenario
```

### Phase 3: Verification - ~30 min
```bash
# Run script again
node scripts/verify-schedule-validators.js

# Check test page
# - Load each of 5 edge case scenarios
# - Verify "All Validators Agree" for valid cases
# - Verify discrepancy detection for invalid cases
```

---

## 🎯 Edge Case Scenarios (For Testing)

| Scenario | Days | Expected | Validates |
|----------|------|----------|-----------|
| **Normal 5-Night** | Mon-Sat (6 days) | ✅ Valid, 5 nights | Standard contiguity |
| **Wrap-Around Weekend** | Fri-Mon (4 days) | ✅ Valid, 3 nights | Wrap-around logic |
| **Gap Selection** | Mon, Wed, Fri (3 days) | ❌ Invalid | Contiguity check |
| **Below Minimum** | Mon, Tue (2 days) | ❌ Invalid | Absolute minimum (2 nights) |
| **Full Week** | Sun-Sat (7 days) | ✅ Valid, 6 nights | Nights formula |

---

## 📝 Key Files Reference

### Existing Code to Read:
```
✅ app/src/islands/shared/useScheduleSelector.js (351 lines)
   → Shows current validation flow, warning system

✅ app/src/lib/scheduleSelector/validators.js (156 lines)
   → Frontend validation rules

✅ app/src/logic/workflows/scheduling/validateScheduleWorkflow.js (125 lines)
   → Backend validation (has the bug)

✅ app/src/logic/rules/scheduling/isScheduleContiguous.js (108 lines)
   → Canonical contiguity checker (use this logic)

✅ app/src/lib/scheduleSelector/nightCalculations.js (141 lines)
   → Check-in/out calculation (use this logic)
```

### New Files to Create:
```
📄 app/src/lib/scheduleSelector/goldenScheduleValidator.js
📄 app/src/lib/scheduleSelector/multiCheckScheduleValidator.js
📄 app/src/islands/shared/ScheduleValidationMatrix.jsx
📄 scripts/verify-schedule-validators.js
```

---

## 🔍 How to Use Triple-Check Matrix (After Implementation)

1. Navigate to: `http://localhost:3000/_internal/z-schedule-test`
2. Select a listing from dropdown
3. Click day buttons to select a schedule
4. Scroll to "Triple-Check Validation Matrix" section
5. See real-time comparison:

```
✅ All Validators Agree

Validator             Valid   Errors   Nights   Contiguous
---------------------------------------------------------
GOLDEN VALIDATOR      ✅       —        5        Yes
BACKEND WORKFLOW      ✅       —        5        Yes
```

**If there's a discrepancy:**
```
🚨 DISCREPANCY DETECTED

Validator             Valid   Errors              Nights   Contiguous
----------------------------------------------------------------------
GOLDEN VALIDATOR      ✅       —                   6        Yes
BACKEND WORKFLOW      ❌       ABOVE_MAX_NIGHTS    7        Yes
                                    ⬆️ BUG: Off by 1
```

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot find module goldenScheduleValidator"
**Solution:** Make sure OpenCode Task 1 is complete

### Issue: Verification script fails on "Full Week" test
**Solution:** Check backend nights calculation fix (Task 3)

### Issue: Wrap-around case shows invalid
**Solution:** Verify contiguity logic uses inverse checking for Sun+Sat cases

### Issue: Test page doesn't show matrix
**Solution:** Ensure ScheduleValidationMatrix component is imported and selectedDays has length > 0

---

## 📞 Next Steps After Completion

1. **Deploy to Staging**
   - Test with real listings
   - Verify no regressions

2. **Monitor Production**
   - Log multi-check discrepancies
   - Alert if > 1% of validations disagree

3. **Documentation**
   - Update project wiki with Golden Rules
   - Document Multi-Check pattern for future use

4. **Future Enhancements**
   - Add pattern restrictions (1-on-1-off, 2-on-2-off)
   - Extend to reservation conflict checking
   - Add backend check-in/out calculation

---

## 📚 Pattern Reference

This Triple-Check system follows the same pattern as:
- ✅ **Pricing Reconciliation** (Jan 27, 2026)
  - See: `docs/pricing/VERIFICATION_REPORT.md`
  - Result: 100% agreement across all systems

**Key Principles:**
1. **Additive Checking** - Multiple validators run independently
2. **Non-Destructive** - Doesn't break existing code
3. **Discrepancy Detection** - Flags disagreements for review
4. **Golden Source** - One canonical implementation as truth

---

## 🎉 Success Looks Like

```bash
$ node scripts/verify-schedule-validators.js

Testing Schedule Validators...

✅ Normal 5-night stay (Mon-Sat)
   Golden: Valid, 5 nights, contiguous
   Backend: Valid, 5 nights, contiguous
   
✅ Wrap-around weekend (Fri-Mon)
   Golden: Valid, 3 nights, contiguous
   Backend: Valid, 3 nights, contiguous

✅ Gap selection (Mon, Wed, Fri) - INVALID
   Golden: Invalid, NOT_CONTIGUOUS
   Backend: Invalid, NOT_CONTIGUOUS

✅ Below minimum (1 night) - INVALID
   Golden: Invalid, ABSOLUTE_MINIMUM
   Backend: Invalid, BELOW_MINIMUM_NIGHTS

✅ Full week (7 days = 6 nights)
   Golden: Valid, 6 nights, contiguous
   Backend: Valid, 6 nights, contiguous

========================================
✅ ALL TESTS PASSED (8/8)
✅ NO DISCREPANCIES DETECTED
========================================
```

---

**Ready to begin!** 🚀

See `docs/schedule/IMPLEMENTATION_PLAN.md` for detailed task specifications.
