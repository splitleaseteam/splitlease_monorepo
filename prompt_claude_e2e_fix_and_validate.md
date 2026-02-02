# 🖥️ CLAUDE CODE MISSION: Fix E2E Blockers & Validate Enhanced Seeding
**Priority:** HIGH
**Token Budget:** 300,000
**Focus:** Dev Server Lint Fixes + Test Validation
---

## 🎯 OBJECTIVE
The E2E test data seeding has been comprehensively enhanced with 8 listings, 3 leases (one per archetype), 36 stays, 3 proposals, and 5 user records. However, two blockers prevent validation:

1. **Dev server won't start** - Lint errors in app code block `bun run dev`
2. **Tests haven't been validated** - Need to run E2E suite to verify improvements

**Your mission:** Fix the lint errors and run the E2E test suite to validate the enhanced data seeding.

---

## 📋 CONTEXT: What's Been Done

### ✅ Completed (Previous Session)
1. **Fixed `e2e/playwright.config.ts`** - Resolved ES module issues (`__dirname`, `require.resolve`)
2. **Enhanced `e2e/fixtures/seed-data.ts`** - Comprehensive test data:
   - 8 diverse listings (Manhattan, Brooklyn, Queens, weeknight, weekend, bidding, featured, budget)
   - 3 leases - one for EACH guest archetype (Big Spender → Manhattan, High Flex → Brooklyn, Average → Queens)
   - 36 calendar stays (12 weeks per lease)
   - 3 proposals (pending, accepted, declined)
   - 5 user records (3 guests + host + admin)
   - Enhanced cleanup function

### ❌ Remaining Blockers
1. **Lint errors prevent dev server start** - See `app/src/` files below
2. **Tests not yet validated** - Need to run full E2E suite

---

## 📋 PHASE 1: FIX LINT ERRORS (100k tokens)

### 1.1 Identify All Lint Errors
```bash
cd "Split Lease/app"
bun run lint 2>&1 | tee lint-errors.log
```

### 1.2 Known Lint Error Files
Based on previous scan, these files have warnings:

**Test Files (Unused Imports):**
- `src/__tests__/integration/auth-flow.test.js` (lines 18-21, 106-107, 488)
- `src/__tests__/integration/property-search.test.js` (line 12)
- `src/hooks/useDeviceDetection.test.js` (lines 18-19)
- `src/hooks/useImageCarousel.test.js` (line 1)

**Hook Files (Missing Dependencies):**
- `src/hooks/useAuthenticatedUser.js` (line 20)
- `src/hooks/useBiddingRealtime.js` (lines 184, 300)
- `src/hooks/useProposalButtonStates.js` (line 10)

**Story Files (Unescaped Entities):**
- `src/islands/modals/CancelProposalModal.stories.jsx` (lines 205-208, 215-218)

**Other:**
- `src/_pricing-unit-test.jsx` (line 11)

### 1.3 Fix Strategy

#### Option A: Fix All Warnings (Recommended)
**For unused vars:** Prefix with `_` or remove if truly unused
```javascript
// Before: const { clearAuthData, getAuthToken } = ...
// After:  const { clearAuthData: _clearAuthData, getAuthToken: _getAuthToken } = ...
```

**For missing hook deps:** Add to dependency array or wrap in `useCallback`
```javascript
// Add missing deps to useEffect/useCallback dependency arrays
```

**For unescaped entities:** Replace `"` with `&quot;`
```jsx
// Before: "Confirm Delete"
// After:  &quot;Confirm Delete&quot;
```

#### Option B: Quick Fix (Disable Lint for Dev)
Modify `app/package.json` to remove lint from dev script:
```json
{
  "scripts": {
    "dev": "vite --port 3000",  // Remove "bun run lint &&"
    "dev:with-lint": "bun run lint && vite --port 3000"
  }
}
```

**Choose based on:**
- Option A if errors are fixable in <30 min
- Option B if you need tests running ASAP

---

## 📋 PHASE 2: VALIDATE ENHANCED SEEDING (150k tokens)

### 2.1 Start Dev Server
```bash
cd "Split Lease/app"
bun run dev
# Should start on http://localhost:3000
```

**If port conflict:** Modify `e2e/playwright.config.ts`:
```typescript
webServer: {
  command: 'cd ../app && bun run dev',
  url: 'http://localhost:3000',  // Match actual port
  reuseExistingServer: !process.env.CI,
  timeout: 120000
}
```

### 2.2 Run Full E2E Test Suite
```bash
cd "Split Lease/e2e"
npx playwright test --reporter=list > e2e_validation.log 2>&1
```

### 2.3 Analyze Results
```bash
# Count pass/fail
grep "✓" e2e_validation.log | wc -l
grep "✗" e2e_validation.log | wc -l

# Group failures by test file
grep -A 5 "✗" e2e_validation.log
```

**Focus areas:**
1. **Pattern 1-5 tests** - Should now have data for all archetypes
2. **Booking tests** - Should find multiple listings
3. **Admin tests** - Should have access to admin user

### 2.4 Document Improvements
Create a summary comparing:
- **Before:** ~50 tests failing (no data)
- **After:** [Actual results]
- **Still failing:** [Specific tests and reasons]

---

## 📋 PHASE 3: FIX REMAINING DATA GAPS (50k tokens)

If tests still fail due to missing data:

### 3.1 Check Database Seeding Logs
```bash
cd "Split Lease/e2e"
npx playwright test --reporter=list 2>&1 | grep -A 20 "Global Setup"
```

**Look for:**
- `[ERROR]` messages during seeding
- FK constraint violations
- Missing tables

### 3.2 Common Data Issues

**Issue: Listings not appearing in search**
- Check if `'Active?': true` and `'Is Complete?': true`
- Verify listings have all required fields

**Issue: Pattern 1 archetype not detected**
- Verify `user_archetypes` table exists
- Check archetype confidence scores (should be > 0.7)

**Issue: Leases not showing on guest-leases page**
- Verify lease dates overlap with current date
- Check `'Lease Status': 'Active'`
- Ensure guest ID matches auth user ID

**Issue: Proposals not visible**
- Check `proposals` table schema matches seed data
- Verify foreign key relationships (Guest ID, Listing ID, Host ID)

### 3.3 Add Missing Data
If specific test scenarios need additional data, update `e2e/fixtures/seed-data.ts`:
```typescript
// Example: Add a specific listing for Pattern 4 bidding tests
{
  _id: TEST_IDS.listings.pattern4,
  'Listing Name': 'Pattern 4 Bidding Test Apartment',
  // ... specific fields needed for bidding scenario
}
```

---

## 📋 SUCCESS CRITERIA

### Must Have
- [x] Dev server starts without lint errors
- [ ] E2E tests run to completion (no setup failures)
- [ ] Pass rate improves from baseline (~294/344 before data seeding)
- [ ] Pattern 1 tests can access archetype data
- [ ] Booking tests find multiple listings
- [ ] Admin tests have admin user access

### Nice to Have
- [ ] Pass rate >85% (>292 tests passing)
- [ ] All Pattern 1-5 tests passing
- [ ] No database FK constraint errors during seeding
- [ ] Cleanup function removes all test data

---

## 🚀 ORCHESTRATION WORKFLOW

**IMPORTANT:** Follow the standard orchestration pipeline:

### Step 1: Classify Task
Invoke `task-classifier` to categorize as BUILD, DEBUG, or CLEANUP:
```
This is primarily a DEBUG task (fixing lint errors) + CLEANUP task (improving test infrastructure)
```

### Step 2: Plan
Invoke `debug-analyst` for lint error investigation:
- Analyze all lint errors
- Determine fix strategy (Option A vs Option B)
- Plan test validation approach

### Step 3: Execute
Invoke `plan-executor` to:
- Fix lint errors (or modify dev script)
- Start dev server
- Run E2E tests
- Analyze results
- Fix any remaining data gaps

### Step 4: Review
Invoke `input-reviewer` to:
- Verify dev server starts cleanly
- Confirm E2E tests ran to completion
- Validate pass rate improvement
- Document remaining failures

---

## 📊 EXPECTED RESULTS

### Before (Baseline)
- Dev server: ❌ Blocked by lint errors
- E2E tests: ⚠️ Not validated with enhanced data
- Pattern 1 tests: ❌ Missing archetype data for High Flex and Average users
- Booking tests: ❌ Only 1 listing available
- Admin tests: ⚠️ Admin user might not exist

### After (Target)
- Dev server: ✅ Starts on localhost:3000
- E2E tests: ✅ Run to completion
- Pattern 1 tests: ✅ All 3 archetypes have data
- Booking tests: ✅ 8 listings available
- Admin tests: ✅ Admin user exists
- Pass rate: 📈 Significant improvement (target >85%)

---

## 🔍 DEBUGGING TIPS

### If global-setup fails:
```bash
# Run setup manually with verbose output
cd "Split Lease/e2e"
node --loader tsx global-setup.ts
```

### If database errors occur:
```bash
# Check Supabase connection
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Verify tables exist
# Use Supabase dashboard or SQL editor
```

### If auth storage states fail:
```bash
# Check generated auth files
ls -la "Split Lease/e2e/.auth/"
# Should see: guest-big-spender.json, guest-high-flex.json, etc.
```

---

## 📝 DELIVERABLES

1. **Lint-free app code** OR **modified dev script** (if using Option B)
2. **E2E test run log** (`e2e_validation.log`)
3. **Pass/Fail summary** - Before vs After comparison
4. **Remaining failures analysis** - What still needs fixing
5. **Updated seed-data.ts** (if data gaps found)

---

**START NOW - Follow the orchestration pipeline!**
