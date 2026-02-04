# 🖥️ COMPUTER 2 MISSION: E2E Testing & Production Readiness

**Agent:** Claude (Testing & QA Lead)  
**Token Budget:** 2,000,000  
**Phase:** End-to-End Testing, Security Audit & Production Deployment

---

## 🎯 OBJECTIVE

All 5 behavioral patterns are deployed with comprehensive unit tests (94.4% pass rate). Your mission is to **close the testing gaps** and **prepare for production launch**:

1. Create comprehensive E2E test suite
2. Perform security audit
3. Validate production readiness
4. Create deployment plan with rollback strategy

---

## 📂 CODEBASE LOCATION

**Main Directory:**  
`C:\Users\igor\My Drive (splitleaseteam@gmail.com)\_Agent Context and Tools\SL1\Split Lease`

**Test Directories:**
- `pattern_1/backend/tests/` - Unit tests (archetype, selection engine)
- `pattern_2/backend/tests/` - Unit tests (urgency calculator)
- `pattern_3/backend/tests/` - Unit tests (price anchoring)
- `pattern_4/backend/tests/` - Unit tests (bidding logic)
- `pattern_5/backend/tests/` - Unit tests (fee calculations)
- `e2e/` - E2E tests (currently minimal)

---

## 📋 PHASE 1: E2E TEST SUITE (800k tokens)

### 1.1 Setup Playwright/Cypress
```bash
# Install Playwright
npm install -D @playwright/test
npx playwright install

# Or Cypress
npm install -D cypress
npx cypress open
```

### 1.2 Create E2E Tests for Pattern 1

**File**: `e2e/pattern1-personalized-defaults.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Pattern 1: Personalized Defaults', () => {
  test('should display archetype indicator for Big Spender', async ({ page }) => {
    // Login as Big Spender test user
    await page.goto('/guest-leases');
    await page.click('[data-testid="lease-card-expand"]');
    await page.click('[data-testid="request-date-change"]');
    
    // Verify archetype indicator
    const archetypeIndicator = page.locator('[data-testid="archetype-indicator"]');
    await expect(archetypeIndicator).toBeVisible();
    await expect(archetypeIndicator).toContainText('Big Spender');
    
    // Verify recommendation badge
    const recommendedCard = page.locator('[data-testid="transaction-card-recommended"]');
    await expect(recommendedCard).toBeVisible();
    await expect(recommendedCard).toContainText('Recommended');
  });

  test('should show different recommendations for different archetypes', async ({ page }) => {
    // Test all 3 archetypes
    const archetypes = ['big_spender', 'high_flex', 'average'];
    
    for (const archetype of archetypes) {
      // Login as specific archetype
      // Verify correct recommendation
    }
  });
});
```

### 1.3 Create E2E Tests for Pattern 2

**File**: `e2e/pattern2-urgency-countdown.spec.ts`

```typescript
test('should display urgency countdown for requests <21 days', async ({ page }) => {
  await page.goto('/guest-leases');
  await page.click('[data-testid="request-date-change"]');
  
  // Select date 7 days from now
  const targetDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await page.fill('[data-testid="date-picker"]', targetDate.toISOString().split('T')[0]);
  
  // Verify urgency badge
  const urgencyBadge = page.locator('[data-testid="urgency-badge"]');
  await expect(urgencyBadge).toBeVisible();
  await expect(urgencyBadge).toContainText('HIGH URGENCY');
  
  // Verify countdown timer
  const countdown = page.locator('[data-testid="countdown-timer"]');
  await expect(countdown).toBeVisible();
});
```

### 1.4 Create E2E Tests for Pattern 3

**File**: `e2e/pattern3-price-anchoring.spec.ts`

```typescript
test('should display 3 pricing tiers with savings badges', async ({ page }) => {
  await page.goto('/guest-leases');
  await page.click('[data-testid="request-date-change"]');
  
  // Verify 3 transaction cards
  const cards = page.locator('[data-testid^="transaction-card-"]');
  await expect(cards).toHaveCount(3);
  
  // Verify savings badges
  const savingsBadges = page.locator('[data-testid="savings-badge"]');
  await expect(savingsBadges.first()).toBeVisible();
  
  // Verify prices are anchored correctly
  const buyoutPrice = await page.locator('[data-testid="price-buyout"]').textContent();
  const crashPrice = await page.locator('[data-testid="price-crash"]').textContent();
  const swapPrice = await page.locator('[data-testid="price-swap"]').textContent();
  
  // Buyout should be highest
  expect(parseFloat(buyoutPrice)).toBeGreaterThan(parseFloat(crashPrice));
  expect(parseFloat(crashPrice)).toBeGreaterThan(parseFloat(swapPrice));
});
```

### 1.5 Create E2E Tests for Pattern 4

**File**: `e2e/pattern4-bidding.spec.ts`

```typescript
test('should allow bidding between two Big Spenders', async ({ page, context }) => {
  // Open two browser contexts (two users)
  const page1 = await context.newPage();
  const page2 = await context.newPage();
  
  // User 1 initiates bidding
  await page1.goto('/guest-leases');
  await page1.click('[data-testid="start-bidding"]');
  
  // User 2 joins and places bid
  await page2.goto('/guest-leases');
  await page2.fill('[data-testid="bid-amount"]', '3500');
  await page2.click('[data-testid="place-bid"]');
  
  // Verify bid appears in history
  const bidHistory = page1.locator('[data-testid="bid-history"]');
  await expect(bidHistory).toContainText('$3,500');
});
```

### 1.6 Create E2E Tests for Pattern 5

**File**: `e2e/pattern5-fee-transparency.spec.ts`

```typescript
test('should display fee breakdown and complete Stripe payment', async ({ page }) => {
  await page.goto('/guest-leases');
  await page.click('[data-testid="request-date-change"]');
  await page.click('[data-testid="transaction-card-crash"]');
  await page.click('[data-testid="continue-to-payment"]');
  
  // Verify fee breakdown
  const platformFee = page.locator('[data-testid="platform-fee"]');
  const landlordFee = page.locator('[data-testid="landlord-fee"]');
  const totalFee = page.locator('[data-testid="total-fee"]');
  
  await expect(platformFee).toContainText('0.75%');
  await expect(landlordFee).toContainText('0.75%');
  await expect(totalFee).toContainText('1.5%');
  
  // Complete Stripe payment (test mode)
  await page.fill('[data-testid="card-number"]', '4242424242424242');
  await page.fill('[data-testid="card-expiry"]', '12/28');
  await page.fill('[data-testid="card-cvc"]', '123');
  await page.click('[data-testid="submit-payment"]');
  
  // Verify success message
  await expect(page.locator('[data-testid="payment-success"]')).toBeVisible();
});
```

---

## 📋 PHASE 2: SECURITY AUDIT (400k tokens)

### 2.1 RLS Policy Verification

**Create test file**: `e2e/security/rls-policies.test.ts`

```typescript
test('should enforce RLS on user_archetypes table', async () => {
  // Attempt to access another user's archetype data
  // Should fail with permission error
});

test('should enforce RLS on bidding_sessions table', async () => {
  // Verify users can only see their own sessions
});
```

### 2.2 SQL Injection Tests

**Create test file**: `e2e/security/sql-injection.test.ts`

```typescript
test('should sanitize user input in archetype detection', async ({ page }) => {
  const maliciousInput = "'; DROP TABLE user_archetypes; --";
  
  // Attempt SQL injection
  await page.fill('[data-testid="user-input"]', maliciousInput);
  await page.click('[data-testid="submit"]');
  
  // Should not execute SQL, should sanitize
  await expect(page.locator('[data-testid="error"]')).toContainText('Invalid input');
});
```

### 2.3 Authentication Tests

**Create test file**: `e2e/security/auth.test.ts`

```typescript
test('should redirect unauthenticated users', async ({ page }) => {
  await page.goto('/guest-leases');
  
  // Should redirect to login
  await expect(page).toHaveURL(/.*login/);
});

test('should prevent access to other users data', async ({ page }) => {
  // Login as User A
  // Attempt to access User B's lease data
  // Should fail
});
```

---

## 📋 PHASE 3: PERFORMANCE BENCHMARKING (300k tokens)

### 3.1 API Response Time Tests

**Create**: `e2e/performance/api-benchmarks.test.ts`

```typescript
test('archetype detection should respond in <100ms', async () => {
  const startTime = Date.now();
  
  const response = await fetch('/api/user-archetype', {
    method: 'POST',
    body: JSON.stringify({ userId: 'test-user' })
  });
  
  const endTime = Date.now();
  const responseTime = endTime - startTime;
  
  expect(responseTime).toBeLessThan(100);
});
```

### 3.2 Load Testing

**Create**: `e2e/performance/load-test.ts`

```typescript
// Use k6 or Artillery for load testing
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 100, // 100 virtual users
  duration: '30s',
};

export default function () {
  let res = http.get('https://yourdomain.com/api/user-archetype');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
}
```

---

## 📋 PHASE 4: PRODUCTION DEPLOYMENT PLAN (300k tokens)

### 4.1 Create Deployment Checklist

**File**: `PRODUCTION_DEPLOYMENT_CHECKLIST.md`

```markdown
# Production Deployment Checklist

## Pre-Deployment
- [ ] All tests passing (unit, integration, E2E)
- [ ] Security audit complete
- [ ] Performance benchmarks met
- [ ] Staging environment validated
- [ ] Database migrations tested
- [ ] Rollback plan documented

## Deployment Steps
1. [ ] Backup production database
2. [ ] Run database migrations
3. [ ] Deploy Edge Functions
4. [ ] Deploy frontend build
5. [ ] Verify health checks
6. [ ] Monitor error rates

## Post-Deployment
- [ ] Smoke tests passing
- [ ] Analytics tracking verified
- [ ] Error monitoring active
- [ ] Performance metrics normal
```

### 4.2 Create Rollback Scripts

**File**: `scripts/rollback-pattern-1.sql`

```sql
-- Rollback Pattern 1 migrations
DROP TABLE IF EXISTS public.user_archetypes CASCADE;
DROP TABLE IF EXISTS public.lease_nights CASCADE;
DROP FUNCTION IF EXISTS public.detect_user_archetype CASCADE;
-- etc.
```

### 4.3 Create Monitoring Alerts

**File**: `monitoring/alerts.yaml`

```yaml
alerts:
  - name: High Error Rate
    condition: error_rate > 5%
    action: notify_team
  
  - name: Slow API Response
    condition: p95_response_time > 500ms
    action: notify_team
  
  - name: Payment Failures
    condition: payment_failure_rate > 2%
    action: page_oncall
```

---

## 🔑 SUCCESS METRICS

- **E2E Test Coverage**: >90% of user flows
- **Security**: Zero critical vulnerabilities
- **Performance**: <100ms API response, <2s page load
- **Deployment**: Zero-downtime deployment with rollback capability

---

## 📊 DELIVERABLES

1. **E2E Test Suite**: Comprehensive Playwright tests for all 5 patterns
2. **Security Audit Report**: Vulnerabilities found and fixed
3. **Performance Report**: Benchmarks and optimization results
4. **Deployment Plan**: Step-by-step production deployment guide
5. **Rollback Scripts**: Database and code rollback procedures

---

## 🚀 GET STARTED

1. Read this entire prompt
2. Set up Playwright: `npm install -D @playwright/test`
3. Create E2E test files in `e2e/` directory
4. Run tests: `npx playwright test`
5. Document results in artifacts

**Your work will ensure a safe, secure production launch!**
