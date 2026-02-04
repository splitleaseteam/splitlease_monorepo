# 🖥️ COMPUTER 2 MISSION: Deep Testing & Optimization

**Agent:** Claude (Backend/Testing Lead)  
**Token Budget:** 2,000,000  
**Phase:** Testing, Optimization & Production Readiness

---

## 🎯 OBJECTIVE

All 5 behavioral patterns are **deployed and integrated**. Your mission is to:
1. **Verify production readiness** through comprehensive testing
2. **Optimize performance** (speed, accuracy, UX)
3. **Create QA testing plans** for staging validation
4. **Prepare production deployment strategy**

---

## 📂 CODEBASE LOCATION

**Main Directory:**  
`C:\Users\igor\My Drive (splitleaseteam@gmail.com)\_Agent Context and Tools\SL1\Split Lease`

**Key Integration Points:**
- `app/src/islands/shared/DateChangeRequestManager/` (Central orchestrator)
- `app/src/islands/shared/UrgencyCountdown/`
- `app/src/islands/shared/PriceAnchoring/`
- `app/src/islands/shared/BiddingInterface/`
- `app/src/islands/shared/TransactionSelector/`
- `pattern_1/backend/tests/` (Existing unit tests)

---

## 📋 PHASE 1: COMPREHENSIVE TESTING (600k tokens)

### 1.1 Run Existing Backend Tests
```bash
# Pattern 1 Tests
deno test pattern_1/backend/tests/archetype-detection.test.ts
deno test pattern_1/backend/tests/default-selection-engine.test.ts
deno test pattern_1/backend/tests/urgency-calculator.test.ts

# Integration Tests
deno test pattern_1/backend/tests/integration/
```

**Action Items:**
- Document all test failures
- Identify root causes (especially the 2 failing tests)
- Fix failing tests or document why they're acceptable

### 1.2 Write Missing Tests
**Target Coverage:**
- Pattern 2 (Urgency): Test countdown accuracy, multiplier calculations
- Pattern 3 (Price Anchoring): Test tier selection logic, savings calculations
- Pattern 4 (Bidding): Test bid validation, competitive pricing
- Pattern 5 (Fee Transparency): Test 1.5% split calculations, Stripe integration

**Create:**
- `pattern_2/backend/tests/urgency-pricing.test.ts`
- `pattern_3/backend/tests/tier-selection.test.ts`
- `pattern_4/backend/tests/bidding-logic.test.ts`
- `pattern_5/backend/tests/fee-calculation.test.ts`

### 1.3 Frontend Component Tests
**Test each pattern's UI components:**
- Rendering tests (React Testing Library)
- User interaction tests
- Accessibility tests (ARIA labels, keyboard navigation)
- Responsive design tests

---

## 📋 PHASE 2: PERFORMANCE OPTIMIZATION (400k tokens)

### 2.1 Backend Performance
**Optimize:**
- Archetype detection API response time (target: <100ms)
- Database query efficiency (add indexes if needed)
- Edge Function cold start times
- Caching strategies for frequently accessed data

**Measure:**
- Use Supabase performance monitoring
- Add timing logs to critical paths
- Document baseline vs. optimized metrics

### 2.2 Frontend Performance
**Optimize:**
- Component render times
- Bundle size (code splitting if needed)
- Lazy loading for heavy components
- Memoization for expensive calculations

**Tools:**
- React DevTools Profiler
- Lighthouse performance audits
- Bundle analyzer

---

## 📋 PHASE 3: QA TESTING PLAN (300k tokens)

### 3.1 Create Manual QA Test Cases
**Document step-by-step instructions for:**

**Pattern 1 (Personalized Defaults):**
1. Navigate to `/guest-leases/:userId`
2. Expand a lease, click "Request Date Change"
3. Verify archetype indicator displays
4. Verify recommended transaction has badge
5. Test all 3 archetypes (Big Spender, High Flex, Average)

**Pattern 2 (Urgency Countdown):**
1. Create date change request with <7 days notice
2. Verify urgency badge displays
3. Verify countdown timer is accurate
4. Verify urgency multiplier affects pricing

**Pattern 3 (Price Anchoring):**
1. View transaction options
2. Verify 3 tiers display (if applicable)
3. Verify "savings" badges show correct percentages
4. Test tier selection and price updates

**Pattern 4 (Bidding):**
1. Initiate bidding flow (if enabled)
2. Place a bid
3. Verify bid history displays
4. Test competitive pricing adjustments

**Pattern 5 (Fee Transparency):**
1. Proceed to payment step
2. Verify 1.5% fee breakdown displays
3. Verify Stripe payment integration
4. Test successful payment flow

### 3.2 Create Automated E2E Tests
**Use Playwright or Cypress:**
```javascript
// Example: Pattern 1 E2E Test
test('Archetype detection displays correctly', async ({ page }) => {
  await page.goto('/guest-leases/test-user-id');
  await page.click('[data-testid="lease-card-expand"]');
  await page.click('[data-testid="request-date-change"]');
  
  const archetypeIndicator = await page.locator('[data-testid="archetype-indicator"]');
  await expect(archetypeIndicator).toBeVisible();
  await expect(archetypeIndicator).toContainText(/Big Spender|High Flex|Average/);
});
```

---

## 📋 PHASE 4: PRODUCTION READINESS (400k tokens)

### 4.1 Security Audit
- Review RLS policies for all new tables
- Verify Edge Function authentication
- Test for SQL injection vulnerabilities
- Validate input sanitization

### 4.2 Error Handling & Logging
- Add comprehensive error handling to all Edge Functions
- Implement structured logging (JSON format)
- Set up error monitoring (Sentry or similar)
- Create error recovery flows

### 4.3 Database Migration Strategy
**Create rollback plan:**
```sql
-- Rollback script for user_archetypes table
DROP TABLE IF EXISTS public.user_archetypes CASCADE;
DROP TABLE IF EXISTS public.lease_nights CASCADE;
-- ... etc
```

### 4.4 Deployment Checklist
- [ ] All tests passing (100%)
- [ ] Performance benchmarks met
- [ ] Security audit complete
- [ ] Error monitoring configured
- [ ] Rollback plan documented
- [ ] Staging environment validated
- [ ] Production deployment script ready

---

## 📋 PHASE 5: ANALYTICS & MONITORING (300k tokens)

### 5.1 Analytics Integration
**Track key metrics:**
- Archetype classification distribution
- Transaction type selection rates
- Urgency multiplier impact on revenue
- Bidding participation rates
- Fee transparency conversion rates

**Implementation:**
```typescript
// Example analytics event
analyticsService.track('transaction_selected', {
  archetype: 'Big Spender',
  transactionType: 'buyout',
  urgencyLevel: 'HIGH',
  price: 450,
  confidence: 0.87
});
```

### 5.2 Monitoring Dashboards
**Create dashboards for:**
- Real-time pattern usage
- API response times
- Error rates
- Revenue impact (A/B test results)

---

## 🔑 SUCCESS METRICS

- **Test Coverage**: >95% for all patterns
- **Performance**: <100ms API response, <2s page load
- **Accuracy**: >95% archetype classification accuracy
- **Revenue Impact**: Measurable increase in transaction values
- **User Experience**: <5% error rate, positive user feedback

---

## 🛑 CRITICAL RULES

1. **DO NOT** skip testing for "minor" features
2. **DO** fix the 2 failing backend tests before proceeding
3. **DO** create comprehensive documentation for QA team
4. **DO** validate all changes in staging before production
5. **DO** coordinate with frontend team for UI testing

---

## 📊 DELIVERABLES

1. **Test Report**: Comprehensive test results with pass/fail rates
2. **Performance Report**: Before/after optimization metrics
3. **QA Manual**: Step-by-step testing instructions
4. **Deployment Plan**: Production rollout strategy with rollback
5. **Analytics Dashboard**: Real-time monitoring setup

---

## 🚀 GET STARTED

1. Read this entire prompt
2. Review existing test files in `pattern_1/backend/tests/`
3. Run all existing tests and document results
4. Begin Phase 1: Comprehensive Testing
5. Report progress every 500k tokens

**Good luck! Your work will ensure a smooth production launch.**
