# Schedule Selector Triple-Check Documentation

**Created:** 2026-01-28  
**Status:** 📋 Ready for Implementation  
**Pattern:** Additive Multi-Check System (same as Pricing)

---

## 📚 Documentation Index

This folder contains all documentation for the Schedule Selector reconciliation project.

### 🗂️ Files in This Directory

| File | Purpose | Audience | Read Order |
|------|---------|----------|------------|
| **`README.md`** | This file - Navigation guide | Everyone | 1st |
| **`QUICK_START.md`** | Executive summary & quick reference | PM, Agents | 2nd |
| **`DISCOVERY_REPORT.md`** | Full analysis of discrepancies | Technical | 3rd |
| **`IMPLEMENTATION_PLAN.md`** | Detailed task specifications | Developers, Agents | 4th |
| **`ARCHITECTURE_MAP.md`** | Visual system diagram | Architects, Developers | 5th |

---

## 🚀 Quick Start (Pick Your Role)

### 👤 If you're the **Product Manager**:
1. Read: **`QUICK_START.md`** (~5 min)
   - Understand the problem and solution
   - See task allocation
   - Review success criteria

2. Skim: **`DISCOVERY_REPORT.md`** (Executive Summary)
   - See what discrepancies we found

3. Track Progress:
   - OpenCode: 3 tasks (~355 lines)
   - Claude Code: 5 tasks (~355 lines)

---

### 🤖 If you're **OpenCode Agent**:
1. Read: **`IMPLEMENTATION_PLAN.md`** → Section "OPENCODE TASKS"
   - Task 1: Create Golden Validator
   - Task 2: Create Verification Script
   - Task 3: Fix Backend Bug

2. Reference: **`DISCOVERY_REPORT.md`** → "Golden Rules" section
   - Implement exactly as specified

3. Run: `node scripts/verify-schedule-validators.js`
   - Verify all tests pass before handing off

---

### 🤖 If you're **Claude Code Agent**:
1. Read: **`IMPLEMENTATION_PLAN.md`** → Section "CLAUDE CODE TASKS"
   - Task 4: Multi-Check Orchestrator
   - Task 5: Integrate into Hook
   - Task 6: Enhance Test Page
   - Task 7: Edge Case Scenarios
   - Task 8: Validation Matrix Component

2. Reference: **`ARCHITECTURE_MAP.md`**
   - See where your code fits in the ecosystem

3. Test: Navigate to `/_internal/z-schedule-test`
   - Verify Triple-Check Matrix works

---

### 🔧 If you're a **Developer** (reviewing the code):
1. Read: **`ARCHITECTURE_MAP.md`**
   - Understand system structure
   - See data flows

2. Read: **`DISCOVERY_REPORT.md`**
   - Understand what problems we found
   - See the 5 key discrepancies

3. Read: **`IMPLEMENTATION_PLAN.md`**
   - See detailed task specifications
   - Understand acceptance criteria

---

## 🎯 Project Goals

### Primary Goal
Reconcile schedule validation logic across Frontend, Backend, and create a Golden Validator as canonical source of truth.

### Success Criteria
- [ ] All validators use same nights formula: `nights = days - 1`
- [ ] Backend bug fixed (7 days = 6 nights, not 7)
- [ ] Triple-Check Matrix implemented in test page
- [ ] All 8 test cases pass verification script
- [ ] Zero discrepancies detected in normal usage

---

## 🔍 Key Findings Summary

### Critical Bugs Found:
1. **Backend Nights Calculation Bug** (Line 55 of `validateScheduleWorkflow.js`)
   - Currently: `nightsCount = selectedDayIndices.length` ❌
   - Should be: `nightsCount = selectedDayIndices.length - 1` ✅
   - Impact: Off by 1 error in all backend validations

2. **Max Nights Inconsistency**
   - Frontend checks **days** with `>=`
   - Backend checks **nights** with `>`
   - Impact: May reject/accept different selections

3. **Missing Check-In/Check-Out in Backend**
   - Frontend calculates check-in/out days
   - Backend does not
   - Impact: Cannot validate reservation conflicts

4. **Duplicate Contiguity Logic**
   - Same logic in 2 places (frontend & backend)
   - Risk: Future changes may diverge

5. **No Verification System**
   - Test page has no multi-validator comparison
   - Impact: Can't detect when validators disagree

---

## 📊 Implementation Stats

### Lines of Code Impact:
- **New Files:** 4 files, ~600 lines
- **Modified Files:** 4 files, ~110 lines
- **Total Impact:** ~710 lines across 8 files

### Task Allocation:
```
OpenCode:     3 tasks, ~355 lines (Foundation)
Claude Code:  5 tasks, ~355 lines (Integration)
```

### Estimated Timeline:
- OpenCode: ~2 hours
- Claude Code: ~3 hours
- Testing: ~30 minutes
- **Total: ~5.5 hours**

---

## 🧪 Testing Strategy

### 1. Automated Testing
```bash
node scripts/verify-schedule-validators.js
```

**Tests 8 scenarios:**
1. Normal 5-night stay
2. Wrap-around weekend
3. Gap selection (should fail)
4. Below absolute minimum (should fail)
5. Below host minimum (warning)
6. Above host maximum (warning)
7. Unavailable day (should fail)
8. Full week (7 days = 6 nights)

### 2. Manual Testing (Test Page)
Navigate to: `/_internal/z-schedule-test`

**Test Flow:**
1. Select a listing
2. Click "Normal 5-Night Stay" edge case
3. Verify Triple-Check Matrix shows all ✅
4. Repeat for each edge case scenario
5. Verify discrepancies are detected when expected

### 3. Integration Testing
- Select days in production UI
- Check console for multi-check logs
- Verify no discrepancy warnings in normal usage

---

## 🏆 Success Looks Like

### Verification Script Output:
```
$ node scripts/verify-schedule-validators.js

Testing Schedule Validators...

✅ Normal 5-night stay (Mon-Sat)
✅ Wrap-around weekend (Fri-Mon)
✅ Gap selection (Mon, Wed, Fri) - INVALID
✅ Below minimum (1 night) - INVALID
✅ Full week (7 days = 6 nights)

========================================
✅ ALL TESTS PASSED (8/8)
✅ NO DISCREPANCIES DETECTED
========================================
```

### Test Page Output:
```
┌─────────────────────────────────────────────────┐
│ ✅ All Validators Agree                         │
│ Nights: 5    Recommendation: APPROVE            │
├─────────────────────────────────────────────────┤
│ Validator          Valid   Errors   Nights      │
├─────────────────────────────────────────────────┤
│ GOLDEN VALIDATOR    ✅      —        5          │
│ BACKEND WORKFLOW    ✅      —        5          │
│ FRONTEND VALIDATOR  ✅      —        5          │
└─────────────────────────────────────────────────┘
```

---

## 📖 Golden Rules Reference

Quick reference to the 6 Golden Rules (see `DISCOVERY_REPORT.md` for full details):

1. **Contiguity**: Days must be consecutive (handles wrap-around)
2. **Nights Formula**: `nights = Math.max(0, days.length - 1)`
3. **Absolute Minimum**: 2 nights (hardcoded)
4. **Host Minimum**: Variable per listing (soft constraint)
5. **Absolute Maximum**: 7 nights (hardcoded)
6. **Host Maximum**: Variable per listing (soft constraint)
7. **Day Availability**: Must be in listing's `daysAvailable` array
8. **Check-In/Check-Out**: First/last day (or wrap-around logic)

---

## 🔗 Related Projects

### Previous Success: Pricing Reconciliation
- **Date:** Jan 27, 2026
- **Document:** `docs/pricing/VERIFICATION_REPORT.md`
- **Pattern:** Same Triple-Check approach
- **Result:** ✅ 100% agreement across all systems

**Lessons Applied:**
- Additive multi-check pattern
- Golden source of truth
- Automated verification script
- Visual comparison matrix

---

## 📞 Contact & Questions

**Current Status:** Discovery Phase Complete, Ready for Implementation

**Next Step:** Execute tasks according to `IMPLEMENTATION_PLAN.md`

**Questions?**
- See `QUICK_START.md` for common issues
- Check `ARCHITECTURE_MAP.md` for system understanding
- Review `DISCOVERY_REPORT.md` for detailed analysis

---

## 📝 Document Changelog

| Date | Document | Change |
|------|----------|--------|
| 2026-01-28 | All | Initial creation of documentation suite |
| 2026-01-28 | `DISCOVERY_REPORT.md` | Completed full analysis of discrepancies |
| 2026-01-28 | `IMPLEMENTATION_PLAN.md` | Defined 8 tasks with detailed specs |
| 2026-01-28 | `ARCHITECTURE_MAP.md` | Created visual system diagram |
| 2026-01-28 | `QUICK_START.md` | Created executive summary |
| 2026-01-28 | `README.md` | This navigation guide |

---

## 🎯 Next Actions

1. **For PM:** Review and approve implementation plan
2. **For OpenCode:** Begin Task 1 (Golden Validator)
3. **For Claude Code:** Wait for OpenCode completion, then begin Task 4

**Let's reconcile those schedules!** 🚀

---

_This documentation follows the same pattern as the successful Pricing Reconciliation project (Jan 27, 2026)._
