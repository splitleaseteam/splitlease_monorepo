# Implementation Plan: E2E Test Migration Completion

**Created**: 2026-01-29
**Classification**: BUILD
**Complexity**: HIGH (6 remaining files, critical fixes)
**Context**: largeCLAUDE.md

---

## Executive Summary

The E2E test fixtures infrastructure is implemented but has critical issues preventing tests from passing:

1. **Base URL mismatch**: `playwright.config.ts` defaults to `http://localhost:3000`, but dev server runs on `http://localhost:8000`
2. **Login UI selectors are generic**: `global-setup.ts` uses selectors that may not match actual `SignUpLoginModal.jsx`
3. **Missing package.json scripts**: `test:e2e:setup` and `test:e2e:cleanup` not defined
4. **Test migration incomplete**: Only 5 of 11 test files updated

---

## Current State

### Infrastructure Complete ✅
- `e2e/fixtures/auth.ts` - Auth fixtures
- `e2e/fixtures/test-users.ts` - Test users
- `e2e/fixtures/seed-data.ts` - Data seeding
- `e2e/global-setup.ts` - Global setup
- `e2e/global-teardown.ts` - Global teardown

### Tests Using Auth Fixtures (5/11) ✅
- `e2e/tests/pattern1-personalized-defaults.spec.ts`
- `e2e/tests/pattern2-urgency-countdown.spec.ts`
- `e2e/tests/pattern3-price-anchoring.spec.ts`
- `e2e/tests/pattern4-bidding.spec.ts`
- `e2e/tests/pattern5-fee-transparency.spec.ts`

### Tests Still Using `@playwright/test` (6/11) ❌
- `e2e/tests/accessibility.spec.ts`
- `e2e/tests/admin.spec.ts`
- `e2e/tests/auth.spec.ts`
- `e2e/tests/booking.spec.ts`
- `e2e/tests/profile.spec.ts`
- `e2e/tests/search.spec.ts`

---

## Phase 1: Critical Fixes

### 1.1 Fix Base URL in playwright.config.ts

**File**: `e2e/playwright.config.ts`
**Line 23**: Change default from `3000` to `8000`

```typescript
// BEFORE
const baseURL = process.env.E2E_BASE_URL || process.env.BASE_URL || 'http://localhost:3000';

// AFTER
const baseURL = process.env.E2E_BASE_URL || process.env.BASE_URL || 'http://localhost:8000';
```

**Line 139**: Update webServer URL
```typescript
// BEFORE
url: baseURL,

// AFTER
url: 'http://localhost:8000',
```

### 1.2 Fix Login Selectors in global-setup.ts

**File**: `e2e/global-setup.ts`
**Lines 70-104**: Update selectors to match actual UI

SignUpLoginModal.jsx uses inline styles, not data-testid attributes.

**Updated selectors**:

```typescript
// Line 77: Sign in link
const signInLink = page.locator('text=Sign In').first();

// Lines 83-86: Auth modal
await page.waitForSelector(
  '[role="dialog"], .modal, [style*="position: fixed"]',
  { timeout: 10000 }
);

// Lines 89-92: Email input (already correct)
const emailInput = page.locator('input[type="email"]').first();

// Lines 94-97: Password input (already correct)
const passwordInput = page.locator('input[type="password"]').first();

// Lines 100-103: Submit button (already correct)
const submitButton = page.locator('button[type="submit"]').first();
```

### 1.3 Add Missing Package.json Scripts

**File**: `package.json`

Add at the end of the `scripts` object:

```json
{
  "scripts": {
    "test:e2e:setup": "npx ts-node e2e/global-setup.ts",
    "test:e2e:cleanup": "npx ts-node e2e/global-teardown.ts"
  }
}
```

---

## Phase 2: Migrate Remaining Test Files

### Migration Pattern

For each file:

1. **Update import**:
```typescript
// BEFORE
import { test, expect } from '@playwright/test';

// AFTER
import { test, expect } from '../fixtures/auth';
```

2. **Update test fixture**:
```typescript
// BEFORE
test('description', async ({ page }) => { ... });

// AFTER (choose appropriate fixture)
test('description', async ({ guestBigSpenderPage }) => { ... });
// OR
test('description', async ({ hostPage }) => { ... });
// OR
test('description', async ({ anonymousPage }) => { ... });
```

### 2.1 Migrate auth.spec.ts

**Fixture Strategy**:
- Login/signup tests: Use `anonymousPage` (testing unauthenticated flows)
- Logout tests: Use `guestBigSpenderPage` (testing authenticated logout)

**Steps**:
1. Change import to `../fixtures/auth`
2. Update login/signup tests to use `anonymousPage`
3. Update logout tests to use `guestBigSpenderPage`

### 2.2 Migrate accessibility.spec.ts

**Fixture Strategy**:
- Determine per-test if auth is needed
- Use `anonymousPage` for public pages
- Use `guestBigSpenderPage` for authenticated pages

**Steps**:
1. Change import to `../fixtures/auth`
2. Update each test with appropriate fixture

### 2.3 Migrate admin.spec.ts

**Fixture Strategy**:
- Admin/host-specific tests: Use `hostPage`

**Steps**:
1. Change import to `../fixtures/auth`
2. Update tests to use `hostPage`

### 2.4 Migrate booking.spec.ts

**Fixture Strategy**:
- Booking flows require guest auth: Use `guestBigSpenderPage`

**Steps**:
1. Change import to `../fixtures/auth`
2. Update tests to use `guestBigSpenderPage`

### 2.5 Migrate profile.spec.ts

**Fixture Strategy**:
- Profile pages require auth
- Use `guestBigSpenderPage` for guest profile tests
- Use `hostPage` for host profile tests

**Steps**:
1. Change import to `../fixtures/auth`
2. Update tests with appropriate fixture based on user type

### 2.6 Migrate search.spec.ts

**Fixture Strategy**:
- Search typically works anonymously: Use `anonymousPage`
- If personalized search: Use `guestBigSpenderPage`

**Steps**:
1. Change import to `../fixtures/auth`
2. Update tests to use `anonymousPage` or `guestBigSpenderPage` as needed

---

## Phase 3: Verification

### 3.1 Run Global Setup Manually

```bash
bun run test:e2e:setup
```

**Expected Output**:
- Test users created in Supabase
- Storage states generated in `e2e/.auth/`
- Test data seeded

### 3.2 Verify Storage States

```bash
ls -la e2e/.auth/
```

**Expected Files**:
- `guest-big-spender.json`
- `guest-high-flex.json`
- `guest-average.json`
- `host.json`

### 3.3 Run E2E Tests

```bash
bun run test:e2e
```

**Expected Result**: 100% pass rate

### 3.4 Quick Verification (Single Test)

```bash
npx playwright test e2e/tests/pattern1-personalized-defaults.spec.ts --project=chromium
```

---

## Files to Modify

| File | Changes | Lines |
|------|---------|-------|
| `e2e/playwright.config.ts` | Fix base URL to 8000 | 23, 139 |
| `e2e/global-setup.ts` | Update login selectors | 70-104 |
| `package.json` | Add setup/cleanup scripts | ~27 |
| `e2e/tests/accessibility.spec.ts` | Migrate to auth fixtures | All |
| `e2e/tests/admin.spec.ts` | Migrate to auth fixtures | All |
| `e2e/tests/auth.spec.ts` | Migrate to auth fixtures | All |
| `e2e/tests/booking.spec.ts` | Migrate to auth fixtures | All |
| `e2e/tests/profile.spec.ts` | Migrate to auth fixtures | All |
| `e2e/tests/search.spec.ts` | Migrate to auth fixtures | All |

---

## Success Criteria

1. ✅ Storage states generate successfully
2. ✅ All E2E tests pass (100% pass rate)
3. ✅ Tests use pre-authenticated sessions
4. ✅ Setup/cleanup scripts work

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Login selectors fail | Add `data-testid` to SignUpLoginModal.jsx |
| Storage states empty | Check Supabase connection |
| Tests still fail | Run in headed mode: `bun run test:e2e:headed` |
| Database schema mismatch | Verify column names in seed-data.ts |

---

## Execution Order

1. Phase 1.1: Fix base URL
2. Phase 1.2: Fix login selectors
3. Phase 1.3: Add package.json scripts
4. Phase 2: Migrate 6 test files (in order: auth → accessibility → booking → profile → admin → search)
5. Phase 3: Verification

---

**Ready for execution.**
