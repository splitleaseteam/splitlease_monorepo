# Schedule Selector Triple-Check: Agent Coordination

**Date:** 2026-01-28  
**Status:** ✅ Ready for Execution  
**Pattern:** Same as successful Pricing Reconciliation (Jan 27, 2026)

---

## 🎯 Quick Overview

Two agents will implement the Schedule Selector Triple-Check system:

- **OpenCode** → Foundation (Golden Validator, Scripts, Bug Fix)
- **Claude Code** → Integration (Multi-Check, UI, Test Page)

**Total Work:** ~710 lines across 8 files

---

## 📋 Agent Task Allocation

### **OpenCode Tasks** (Execute First)

| Task | File | Lines | Duration |
|------|------|-------|----------|
| **Task 1** | `app/src/lib/scheduleSelector/goldenScheduleValidator.js` | ~200 | 45 min |
| **Task 2** | `scripts/verify-schedule-validators.js` | ~150 | 30 min |
| **Task 3** | `app/src/logic/workflows/scheduling/validateScheduleWorkflow.js` | ~10 | 10 min |

**Total:** 3 tasks, ~360 lines, ~1.5 hours

**Prompt:** `OPENCODE_SCHEDULE_PROMPT.md`

---

### **Claude Code Tasks** (Execute After OpenCode)

| Task | File | Lines | Duration |
|------|------|-------|----------|
| **Task 4** | `app/src/lib/scheduleSelector/multiCheckScheduleValidator.js` | ~100 | 30 min |
| **Task 5** | `app/src/islands/shared/useScheduleSelector.js` | ~25 | 15 min |
| **Task 6** | `app/src/islands/pages/ZScheduleTestPage/ZScheduleTestPage.jsx` | ~30 | 20 min |
| **Task 7** | `app/src/islands/pages/ZScheduleTestPage/useZScheduleTestPageLogic.js` | ~50 | 25 min |
| **Task 8** | `app/src/islands/shared/ScheduleValidationMatrix.jsx` | ~150 | 45 min |

**Total:** 5 tasks, ~355 lines, ~2.25 hours

**Prompt:** `CLAUDE_SCHEDULE_PROMPT.md`

---

## 🚨 CRITICAL BUSINESS RULE (Both Agents Must Know)

**6-night bookings DO NOT EXIST.**

### Correct Formula:

```javascript
// For full week (7 days)
if (selectedDays.length === 7) {
  nightsCount = 7;  // Full week = 7 nights
} else {
  nightsCount = Math.max(0, selectedDays.length - 1);  // Partial week
}
```

### Valid Ranges:
- 2-5 nights (partial week)
- 7 nights (full week)

**NOT** 6 nights!

---

## 🔄 Execution Flow

### Phase 1: OpenCode Foundation (Execute First)

```bash
# OpenCode executes tasks 1-3

# Verification:
node scripts/verify-schedule-validators.js
# Expected: ✅ ALL TESTS PASSED (8/8)
```

**Deliverables:**
- ✅ `goldenScheduleValidator.js` created
- ✅ `verify-schedule-validators.js` created
- ✅ Backend bug fixed
- ✅ All 8 tests pass
- ✅ Test #8 shows **7 nights** for full week

---

### Phase 2: Claude Code Integration (Execute Second)

```bash
# Claude Code executes tasks 4-8

# Verification:
npm run dev
# Navigate to: http://localhost:3000/_internal/z-schedule-test
# Test all 5 edge case scenarios
```

**Deliverables:**
- ✅ `multiCheckScheduleValidator.js` created
- ✅ Multi-check integrated into hook
- ✅ Test page enhanced
- ✅ Edge case scenarios working
- ✅ Validation Matrix component created
- ✅ All edge cases show "All Validators Agree"

---

## ✅ Verification Checklist

### After OpenCode:
- [ ] Run `node scripts/verify-schedule-validators.js`
- [ ] All 8 tests pass
- [ ] Test #8 (Full week) shows **7 nights**, not 6
- [ ] Backend file has updated formula with `if/else`

### After Claude Code:
- [ ] Navigate to `/_internal/z-schedule-test`
- [ ] Select a listing
- [ ] Click "Normal 5-Night Stay" button
- [ ] See Triple-Check Matrix appear
- [ ] Shows "✅ All Validators Agree"
- [ ] Click "Full Week" button
- [ ] Matrix shows **7 nights**
- [ ] All 5 edge cases work correctly

---

## 📄 Supporting Documents

### For Both Agents:
- `docs/schedule/DISCOVERY_REPORT.md` - Full analysis
- `docs/schedule/IMPLEMENTATION_PLAN.md` - Detailed specs
- `docs/schedule/BUSINESS_RULE_CORRECTION.md` - Formula explanation

### For OpenCode:
- `OPENCODE_SCHEDULE_PROMPT.md` - Your main prompt
- Reference: `app/src/logic/rules/scheduling/isScheduleContiguous.js`

### For Claude Code:
- `CLAUDE_SCHEDULE_PROMPT.md` - Your main prompt
- Wait for: OpenCode to complete all 3 tasks first

---

## 🎯 Success Looks Like

### Verification Script Output:
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

### Test Page Matrix Output:
```
┌─────────────────────────────────────────┐
│ ✅ All Validators Agree                 │
│ Nights: 7    Recommendation: APPROVE    │
├─────────────────────────────────────────┤
│ GOLDEN VALIDATOR    ✅     —      7     │
│ BACKEND WORKFLOW    ✅     —      7     │
└─────────────────────────────────────────┘
```

---

## 🚨 Known Issues & Solutions

### Issue: Verification script fails on Full Week test
**Root Cause:** Formula not updated correctly  
**Solution:** Check that `if/else` for 7 days is present  
**Expected:** `nightsCount = 7` when length is 7

### Issue: Matrix doesn't appear
**Root Cause:** OpenCode tasks not complete  
**Solution:** Wait for OpenCode to finish all tasks  
**Check:** Files exist: `goldenScheduleValidator.js`, verification script

### Issue: Console warnings about discrepancies
**Root Cause:** Validators disagree (shouldn't happen after fixes)  
**Solution:** Check that backend fix was applied correctly  
**Debug:** Run verification script to see which test fails

---

## 📊 File Impact Summary

### New Files (7):
```
✨ app/src/lib/scheduleSelector/goldenScheduleValidator.js          (~200 lines)
✨ app/src/lib/scheduleSelector/multiCheckScheduleValidator.js      (~100 lines)
✨ app/src/islands/shared/ScheduleValidationMatrix.jsx              (~150 lines)
✨ app/src/islands/shared/ScheduleValidationMatrix.css              (~120 lines)
✨ scripts/verify-schedule-validators.js                            (~150 lines)
✨ docs/schedule/BUSINESS_RULE_CORRECTION.md                        (documentation)
✨ OPENCODE_SCHEDULE_PROMPT.md                                      (agent prompt)
✨ CLAUDE_SCHEDULE_PROMPT.md                                        (agent prompt)
```

### Modified Files (4):
```
🔧 app/src/logic/workflows/scheduling/validateScheduleWorkflow.js  (~10 lines)
🔧 app/src/islands/shared/useScheduleSelector.js                   (~25 lines)
🔧 app/src/islands/pages/ZScheduleTestPage/ZScheduleTestPage.jsx  (~30 lines)
🔧 app/src/islands/pages/ZScheduleTestPage/useZScheduleTestPageLogic.js (~50 lines)
```

**Total Impact:** ~720 lines across 8 code files + documentation

---

## 🎉 Final Acceptance

Project is complete when:

✅ Verification script passes all 8 tests  
✅ Test page shows Triple-Check Matrix  
✅ All 5 edge cases show "All Validators Agree"  
✅ Full week shows **7 nights** everywhere  
✅ No console discrepancy warnings  
✅ Backend formula includes full week special case  

---

## 🚀 How to Execute

1. **Give OpenCode their prompt:**
   ```
   Read and execute: OPENCODE_SCHEDULE_PROMPT.md
   ```

2. **Wait for OpenCode to complete and verify**

3. **Give Claude Code their prompt:**
   ```
   Read and execute: CLAUDE_SCHEDULE_PROMPT.md
   ```

4. **Verify in browser**

5. **Done!** 🎉

---

**Both prompts are ready. Agents can execute independently following their respective prompts.**
