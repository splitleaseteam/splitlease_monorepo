# Test File Co-location Opportunity Report

**Generated:** 2026-01-28T07:45:00
**Codebase:** Split Lease

## Executive Summary

| Metric | Count |
|--------|-------|
| Source files found | ~975 |
| Co-located tests | 7 (0.7%) |
| Centralized tests | 5 |
| Total test files | 12 |
| Missing tests | ~960+ |

**Overall Test Coverage Status:** Very Low - The codebase has minimal test coverage with only 12 test files for ~975 source files.

## Current Structure Analysis

### Test Folder Locations Found

| Location | Test Files | Type | Status |
|----------|------------|------|--------|
| `hooks/*.test.js` | 2 | Co-located | Good |
| `islands/shared/*.test.jsx` | 4 | Co-located | Good |
| `islands/pages/*.test.jsx` | 1 | Co-located | Good |
| `__tests__/integration/` | 3 | Centralized | Keep (integration tests) |
| `__tests__/regression/` | 1 | Centralized | Keep (regression tests) |
| `logic/calculators/matching/__tests__/` | 1 | Centralized | Migrate |

### Co-location Status by Directory

| Directory | Source Files | Co-located Tests | Centralized Tests | Missing |
|-----------|--------------|------------------|-------------------|---------|
| `hooks/` | 5 | 2 | 0 | 3 |
| `lib/` | 41 | 0 | 0 | 41 |
| `logic/calculators/` | 46 | 0 | 1 | 45 |
| `logic/rules/` | 53 | 0 | 0 | 53 |
| `logic/processors/` | 35 | 0 | 0 | 35 |
| `logic/workflows/` | 20 | 0 | 0 | 20 |
| `islands/shared/` | 153 | 4 | 0 | 149 |
| `islands/pages/` | 560 | 1 | 0 | 559 |

## Already Co-located Tests (Good Pattern)

These tests follow the co-location pattern:

| Test File | Source File | Status |
|-----------|-------------|--------|
| `hooks/useDeviceDetection.test.js` | `hooks/useDeviceDetection.js` | Co-located |
| `hooks/useImageCarousel.test.js` | `hooks/useImageCarousel.js` | Co-located |
| `islands/shared/Button.test.jsx` | `islands/shared/Button.jsx` | Co-located |
| `islands/shared/DayButton.test.jsx` | `islands/shared/DayButton.jsx` | Co-located |
| `islands/shared/ErrorOverlay.test.jsx` | `islands/shared/ErrorOverlay.jsx` | Co-located |
| `islands/shared/PriceDisplay.test.jsx` | `islands/shared/PriceDisplay.jsx` | Co-located |
| `islands/pages/NotFoundPage.test.jsx` | `islands/pages/NotFoundPage.jsx` | Co-located |

## Migration Required (Centralized -> Co-located)

### From `logic/calculators/matching/__tests__/`

| Current Location | Move To |
|------------------|---------|
| `logic/calculators/matching/__tests__/calculateMatchScore.test.js` | `logic/calculators/matching/calculateMatchScore.test.js` |

**Note:** This is the only centralized unit test that should be migrated. The `__tests__/integration/` and `__tests__/regression/` folders are appropriate for their purpose.

## Appropriate Centralized Tests (Keep As-Is)

These tests are correctly centralized because they test cross-cutting concerns:

### Integration Tests (`__tests__/integration/`)
| Test File | Purpose | Keep Centralized |
|-----------|---------|------------------|
| `auth-flow.test.js` | End-to-end auth testing | Yes |
| `booking-flow.test.js` | Full booking workflow | Yes |
| `property-search.test.js` | Search integration | Yes |

### Regression Tests (`__tests__/regression/`)
| Test File | Purpose | Keep Centralized |
|-----------|---------|------------------|
| `REG-001-fk-constraint-violation.test.js` | FK regression guard | Yes |

## Critical Missing Test Files

### Priority 0 - Core Business Logic

These pure functions in `logic/` are ideal for unit testing:

**Calculators (Pure Functions - Easy to Test)**
| Source File | Expected Test File | Priority |
|-------------|-------------------|----------|
| `logic/calculators/pricing/calculateFourWeekRent.js` | `calculateFourWeekRent.test.js` | P0 |
| `logic/calculators/pricing/calculateReservationTotal.js` | `calculateReservationTotal.test.js` | P0 |
| `logic/calculators/payments/calculateGuestPaymentSchedule.js` | `calculateGuestPaymentSchedule.test.js` | P0 |
| `logic/calculators/payments/calculateHostPaymentSchedule.js` | `calculateHostPaymentSchedule.test.js` | P0 |
| `logic/calculators/scheduling/calculateCheckInOutDays.js` | `calculateCheckInOutDays.test.js` | P0 |

**Rules (Boolean Predicates - Easy to Test)**
| Source File | Expected Test File | Priority |
|-------------|-------------------|----------|
| `logic/rules/proposals/canAcceptProposal.js` | `canAcceptProposal.test.js` | P0 |
| `logic/rules/proposals/canCancelProposal.js` | `canCancelProposal.test.js` | P0 |
| `logic/rules/scheduling/isScheduleContiguous.js` | `isScheduleContiguous.test.js` | P0 |

### Priority 1 - Core Library Functions

| Source File | Expected Test File | Priority |
|-------------|-------------------|----------|
| `lib/auth.js` | `lib/auth.test.js` | P1 |
| `lib/dayUtils.js` | `lib/dayUtils.test.js` | P1 |
| `lib/priceCalculations.js` | `lib/priceCalculations.test.js` | P1 |
| `lib/availabilityValidation.js` | `lib/availabilityValidation.test.js` | P1 |
| `lib/proposalService.js` | `lib/proposalService.test.js` | P1 |

### Priority 2 - Hooks Without Tests

| Source File | Expected Test File | Priority |
|-------------|-------------------|----------|
| `hooks/useAuthenticatedUser.js` | `hooks/useAuthenticatedUser.test.js` | P2 |
| `hooks/useDataLookups.js` | `hooks/useDataLookups.test.js` | P2 |
| `hooks/useProposalButtonStates.js` | `hooks/useProposalButtonStates.test.js` | P2 |

### Priority 3 - Shared Components

Top shared components needing tests:
| Source File | Expected Test File | Priority |
|-------------|-------------------|----------|
| `islands/shared/CreateProposalFlowV2.jsx` | `CreateProposalFlowV2.test.jsx` | P3 |
| `islands/shared/Header.jsx` | `Header.test.jsx` | P3 |
| `islands/shared/Footer.jsx` | `Footer.test.jsx` | P3 |
| `islands/shared/ErrorBoundary.jsx` | `ErrorBoundary.test.jsx` | P3 |
| `islands/shared/ListingCard.jsx` | `ListingCard.test.jsx` | P3 |

## Test Coverage Gap Analysis

| Category | Files | Tests | Coverage |
|----------|-------|-------|----------|
| Business Logic (calculators) | 46 | 1 | 2.2% |
| Business Rules | 53 | 0 | 0% |
| Data Processors | 35 | 0 | 0% |
| Workflows | 20 | 0 | 0% |
| Utility Libraries | 41 | 0 | 0% |
| React Hooks | 5 | 2 | 40% |
| Shared Components | 153 | 4 | 2.6% |
| Page Components | 560 | 1 | 0.2% |
| **TOTAL** | **~913** | **8** | **0.9%** |

*Note: Integration (3) and regression (1) tests excluded from this count.*

## Recommended Target Structure

```
app/src/
├── hooks/
│   ├── useAuthenticatedUser.js
│   ├── useAuthenticatedUser.test.js    # ADD
│   ├── useDeviceDetection.js
│   ├── useDeviceDetection.test.js      # EXISTS
│   └── ...
├── lib/
│   ├── auth.js
│   ├── auth.test.js                    # ADD
│   ├── dayUtils.js
│   ├── dayUtils.test.js                # ADD
│   └── ...
├── logic/
│   ├── calculators/
│   │   ├── pricing/
│   │   │   ├── calculateFourWeekRent.js
│   │   │   ├── calculateFourWeekRent.test.js  # ADD
│   │   │   └── ...
│   ├── rules/
│   │   ├── proposals/
│   │   │   ├── canAcceptProposal.js
│   │   │   ├── canAcceptProposal.test.js      # ADD
│   │   │   └── ...
├── islands/
│   ├── shared/
│   │   ├── Button.jsx
│   │   ├── Button.test.jsx             # EXISTS
│   │   └── ...
├── __tests__/                          # KEEP for integration/regression
│   ├── integration/
│   │   ├── auth-flow.test.js
│   │   ├── booking-flow.test.js
│   │   └── property-search.test.js
│   └── regression/
│       └── REG-001-fk-constraint-violation.test.js
```

## Single Migration Required

```bash
# Migrate the one centralized unit test to co-located
mv app/src/logic/calculators/matching/__tests__/calculateMatchScore.test.js \
   app/src/logic/calculators/matching/calculateMatchScore.test.js

# Remove empty __tests__ directory
rmdir app/src/logic/calculators/matching/__tests__
```

## Vitest Config Recommendation

```javascript
// vitest.config.js
export default defineConfig({
  test: {
    include: [
      'src/**/*.{test,spec}.{js,jsx,ts,tsx}',
      'src/__tests__/**/*.test.{js,jsx}'  // Keep integration/regression tests
    ],
    exclude: ['node_modules', 'dist'],
  },
})
```

## Summary

| Finding | Status | Action |
|---------|--------|--------|
| Co-located tests | 7 files | Good pattern - continue |
| Centralized unit test | 1 file | Migrate to co-location |
| Integration tests | 3 files | Keep centralized |
| Regression tests | 1 file | Keep centralized |
| Missing tests | 960+ files | Add incrementally, starting with P0 |

## Recommendations

### Immediate Actions
- [ ] Migrate `calculateMatchScore.test.js` to co-located position
- [ ] Document test file naming convention in CONTRIBUTING.md
- [ ] Add ESLint rule to enforce `.test.js` suffix

### Test Writing Priority
1. **Week 1-2:** Add tests for `logic/calculators/pricing/` (5 files)
2. **Week 3-4:** Add tests for `logic/calculators/payments/` (2 files)
3. **Week 5-6:** Add tests for `logic/rules/proposals/` (critical rules)
4. **Ongoing:** Add test for each new file created

### Tooling
- [ ] Set up Vitest coverage reporting
- [ ] Add coverage threshold requirements
- [ ] Create test file generator script
