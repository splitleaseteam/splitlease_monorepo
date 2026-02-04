# Schedule Selector Triple-Check: Discovery Complete ✅

**Date:** 2026-01-28  
**Agent:** Antigravity (Claude)  
**Status:** Discovery phase complete, ready for implementation

---

## 🎯 What Was Accomplished

I've completed the **Discovery Phase** for bringing the Schedule Selector unit test page up to speed using the Triple-Check Meta-Flow pattern (same approach that successfully resolved pricing discrepancies on Jan 27).

---

## 📦 Deliverables Created

### 1. **Discovery Report** (`docs/schedule/DISCOVERY_REPORT.md`)
- **Length:** 500+ lines
- **Contains:**
  - Identified 5 critical discrepancies across frontend/backend
  - Documented 6 Golden Rules for schedule validation
  - Analysis of current architecture (7 code files)
  - Detailed comparison of validation implementations
  - Success criteria and acceptance tests

### 2. **Implementation Plan** (`docs/schedule/IMPLEMENTATION_PLAN.md`)
- **Length:** 550+ lines
- **Contains:**
  - 8 detailed task specifications
  - Split between OpenCode (3 tasks) and Claude Code (5 tasks)
  - Code examples and function signatures
  - Execution order and dependencies
  - Acceptance criteria for each task

### 3. **Quick Start Guide** (`docs/schedule/QUICK_START.md`)
- **Length:** 400+ lines
- **Contains:**
  - Executive summary for PMs
  - Golden Rules quick reference
  - Task allocation overview
  - Edge case scenarios
  - Success checklist

### 4. **Architecture Map** (`docs/schedule/ARCHITECTURE_MAP.md`)
- **Length:** 400+ lines
- **Contains:**
  - Visual ASCII diagram of system components
  - Data flow illustrations
  - Task execution map
  - File change impact summary
  - Verification checklist

### 5. **README** (`docs/schedule/README.md`)
- **Length:** 300+ lines
- **Contains:**
  - Navigation guide for all documents
  - Role-based reading paths
  - Project goals and stats
  - Golden Rules reference
  - Testing strategy

---

## 🔍 Key Findings

### Critical Bugs Discovered:

#### 1. **Backend Nights Calculation Bug** 🔴 HIGH SEVERITY
- **Location:** `app/src/logic/workflows/scheduling/validateScheduleWorkflow.js:55`
- **Current Code:** `nightsCount = selectedDayIndices.length` ❌
- **Should Be:** `nightsCount = Math.max(0, selectedDayIndices.length - 1)` ✅
- **Impact:** All backend validations off by 1 night
  - Example: 7 days incorrectly calculated as 7 nights (should be 6)
  - Affects min/max nights validation
  - May incorrectly reject or accept bookings

#### 2. **Max Nights Inconsistency** 🟡 MEDIUM SEVERITY
- **Frontend:** Checks days with `>=` operator
- **Backend:** Checks nights with `>` operator
- **Impact:** Boundary cases may be handled differently

#### 3. **Missing Check-In/Check-Out Logic** 🟡 MEDIUM SEVERITY
- **Frontend:** Calculates check-in/out days (including wrap-around)
- **Backend:** Does NOT calculate these
- **Impact:** Cannot validate reservation conflicts at backend level

#### 4. **Duplicate Contiguity Code** 🟢 LOW SEVERITY
- Same logic in `validators.js` and `isScheduleContiguous.js`
- Risk of divergence if one is updated without the other

#### 5. **No Multi-Validator Comparison** 🟡 MEDIUM SEVERITY
- Test page lacks automated verification
- Can't detect when validators disagree
- Same issue we fixed for pricing

---

## 📋 Implementation Plan Summary

### **OpenCode Tasks** (Foundation Layer)
Total: ~355 lines across 3 tasks

| Task | File | Lines | Difficulty |
|------|------|-------|------------|
| **Task 1** | Create `goldenScheduleValidator.js` | ~200 | Medium |
| **Task 2** | Create `verify-schedule-validators.js` | ~150 | Medium |
| **Task 3** | Fix backend bug | ~5 | Easy |

**Deliverable:** Verification script that tests all validators

---

### **Claude Code Tasks** (Integration Layer)
Total: ~355 lines across 5 tasks

| Task | File | Lines | Difficulty |
|------|------|-------|------------|
| **Task 4** | Create `multiCheckScheduleValidator.js` | ~100 | Medium |
| **Task 5** | Integrate into `useScheduleSelector.js` | ~25 | Easy |
| **Task 6** | Enhance `ZScheduleTestPage.jsx` | ~30 | Easy |
| **Task 7** | Add edge cases to logic hook | ~50 | Easy |
| **Task 8** | Create `ScheduleValidationMatrix.jsx` | ~150 | Medium |

**Deliverable:** Working Triple-Check Matrix in test page

---

## ✅ Success Criteria

When implementation is complete, these must all be true:

- [ ] Verification script passes: `node scripts/verify-schedule-validators.js` → ✅ All 8 tests pass
- [ ] Backend bug fixed: 7 days = 6 nights (not 7)
- [ ] Triple-Check Matrix visible in `/_internal/z-schedule-test`
- [ ] All 5 edge case scenarios show "All Validators Agree"
- [ ] Wrap-around case (Fri-Mon) validates correctly across all systems
- [ ] Gap selection (Mon, Wed, Fri) rejected by all validators
- [ ] Multi-check logs visible in console during selection
- [ ] No discrepancies detected in normal usage

---

## 🎓 Golden Rules Reference

The 6 Golden Rules for schedule validation (detailed in Discovery Report):

### Rule 1: Contiguity ⭐
Days must be consecutive. Handles week wrap-around (Sat-Sun-Mon).

### Rule 2: Nights Formula ⭐⭐⭐ CRITICAL!
```javascript
nightsCount = Math.max(0, selectedDays.length - 1)
```
**This is the most important rule - currently broken in backend!**

### Rule 3: Absolute Minimum
Hardcoded 2 nights minimum (3 days). Cannot be overridden.

### Rule 4: Host Minimum
Variable per listing (2, 3, 4, 5 nights). Soft constraint (warning).

### Rule 5: Absolute Maximum
Hardcoded 7 nights (full week). Cannot be exceeded.

### Rule 6: Host Maximum
Variable per listing (5, 6, 7 nights). Soft constraint (warning).

---

## 📊 Test Scenarios Defined

Created 8 comprehensive test cases covering all edge cases:

1. **Normal 5-night** (Mon-Sat) → Should pass
2. **Wrap-around** (Fri-Mon) → Should pass
3. **Gap selection** (Mon, Wed, Fri) → Should fail (contiguity)
4. **Below minimum** (1 night) → Should fail (absolute min)
5. **Below host min** (2 nights, host wants 3) → Warning
6. **Above host max** (6 nights, host max 5) → Warning
7. **Unavailable day** (listing no Sunday, select Sun) → Should fail
8. **Full week** (7 days) → Should pass with 6 nights ⚠️

---

## 🗂️ Files Created

All in `docs/schedule/` directory:

```
docs/schedule/
├── README.md                    ← Navigation guide
├── QUICK_START.md               ← Executive summary
├── DISCOVERY_REPORT.md          ← Full analysis
├── IMPLEMENTATION_PLAN.md       ← Task specifications
└── ARCHITECTURE_MAP.md          ← Visual diagrams
```

Total: ~2,200 lines of comprehensive documentation

---

## 🚀 Next Steps

### Immediate (Your Decision):
1. **Review** the documents (start with `QUICK_START.md`)
2. **Approve** the implementation plan
3. **Assign** tasks to OpenCode and Claude Code agents

### OpenCode Execution:
```bash
# 1. Create golden validator
# 2. Create verification script  
# 3. Fix backend bug

# Verify:
node scripts/verify-schedule-validators.js
```

### Claude Code Execution:
```bash
# 4. Create multi-check orchestrator
# 5. Integrate into hook
# 6-8. Enhance test page with matrix

# Test:
Navigate to /_internal/z-schedule-test
Load each edge case scenario
Verify Triple-Check Matrix works
```

---

## 📈 Expected Timeline

- **OpenCode:** ~2 hours (foundation work)
- **Claude Code:** ~3 hours (integration work)
- **Testing & Verification:** ~30 minutes
- **Total:** ~5.5 hours to complete

---

## 💡 Why This Matters

### Current Risk:
- Frontend and backend may accept/reject different schedules
- Backend has off-by-one bug affecting all validations
- No way to detect validator disagreements
- Potential for booking conflicts or rejected valid reservations

### After Implementation:
- ✅ Single source of truth (Golden Validator)
- ✅ Automated verification catches discrepancies
- ✅ Test page shows real-time validator comparison
- ✅ Backend bug fixed
- ✅ Confidence in schedule validation across entire stack

---

## 🎉 Pattern Success

This follows the **exact same pattern** that successfully reconciled pricing on Jan 27, 2026:

### Pricing Reconciliation Results:
- ✅ 100% validator agreement
- ✅ All formulas aligned (frontend, backend, frontend calculators)
- ✅ Verification script catches future regressions
- ✅ Zero discrepancies in production

### Expected Schedule Results:
- ✅ 100% validator agreement
- ✅ Same nights formula everywhere
- ✅ Verification script for schedule validation
- ✅ Triple-Check Matrix for visual confirmation

---

## 📞 Questions or Adjustments?

I can help with:
- Creating agent-specific prompts (like the pricing prompts)
- Adjusting task allocation
- Adding more test scenarios
- Clarifying any part of the plan
- Creating visual diagrams for specific flows

---

## 🏁 Ready to Execute

All documentation is complete and ready for implementation. The plan is:

1. **Solid** - Based on thorough analysis of 7 existing code files
2. **Detailed** - Every task has specs, examples, and acceptance criteria
3. **Proven** - Uses same pattern that worked for pricing
4. **Testable** - Includes verification script and test scenarios
5. **Documented** - 2,200+ lines of clear documentation

**Status:** ✅ Discovery Complete → Ready for Implementation

Would you like me to:
1. Create specific agent prompts (OpenCode prompt, Claude Code prompt)?
2. Start implementing (if you assign me the Claude Code tasks)?
3. Make any adjustments to the plan?

Let me know how you'd like to proceed! 🚀
