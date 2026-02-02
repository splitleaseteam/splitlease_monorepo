# Test Execution Report

**Date**: 2026-01-28
**Duration**: 35.40s
**Vitest Version**: 4.0.18

---

## Summary

| Metric | Count |
|--------|-------|
| **Total Test Files** | 57 |
| **Total Tests** | 2,138 |
| **Passed** | ✅ 2,138 |
| **Failed** | ❌ 0 |
| **Skipped** | ⏭️ 0 |

**Result: ALL TESTS PASSING**

---

## Category Breakdown

### Pricing Calculators (6 files, 273 tests)
| Test File | Tests | Status |
|-----------|-------|--------|
| calculateFourWeekRent.test.js | 42 | ✅ PASS |
| calculateReservationTotal.test.js | 45 | ✅ PASS |
| calculateQuickProposal.test.js | 61 | ✅ PASS |
| getNightlyRateByFrequency.test.js | 49 | ✅ PASS |
| calculatePricingBreakdown.test.js | 35 | ✅ PASS |
| calculateGuestFacingPrice.test.js | 41 | ✅ PASS |

### Matching Calculators (5 files, 186 tests)
| Test File | Tests | Status |
|-----------|-------|--------|
| calculateMatchScore.test.js | 48 | ✅ PASS |
| calculateBoroughScore.test.js | 37 | ✅ PASS |
| calculatePriceScore.test.js | 40 | ✅ PASS |
| calculateDurationScore.test.js | 32 | ✅ PASS |
| calculateHostScore.test.js | 29 | ✅ PASS |

### Scheduling Calculators (4 files, 133 tests)
| Test File | Tests | Status |
|-----------|-------|--------|
| calculateCheckInOutDays.test.js | 39 | ✅ PASS |
| calculateNightsFromDays.test.js | 47 | ✅ PASS |
| calculateNextAvailableCheckIn.test.js | 30 | ✅ PASS |
| shiftMoveInDateIfPast.test.js | 17 | ✅ PASS |

### Proposal Rules (4 files, 170 tests)
| Test File | Tests | Status |
|-----------|-------|--------|
| canAcceptProposal.test.js | 42 | ✅ PASS |
| canCancelProposal.test.js | 44 | ✅ PASS |
| canEditProposal.test.js | 40 | ✅ PASS |
| determineProposalStage.test.js | 44 | ✅ PASS |

### User Rules (6 files, 168 tests)
| Test File | Tests | Status |
|-----------|-------|--------|
| isGuest.test.js | 28 | ✅ PASS |
| isHost.test.js | 34 | ✅ PASS |
| hasProfilePhoto.test.js | 28 | ✅ PASS |
| isIdentityVerified.test.js | 25 | ✅ PASS |
| canSubmitIdentityVerification.test.js | 25 | ✅ PASS |
| shouldShowFullName.test.js | 28 | ✅ PASS |

### Matching Rules (6 files, 224 tests)
| Test File | Tests | Status |
|-----------|-------|--------|
| isBoroughMatch.test.js | 30 | ✅ PASS |
| isBoroughAdjacent.test.js | 51 | ✅ PASS |
| isDurationMatch.test.js | 41 | ✅ PASS |
| isVerifiedHost.test.js | 41 | ✅ PASS |
| isWithinBudget.test.js | 34 | ✅ PASS |
| supportsWeeklyStays.test.js | 27 | ✅ PASS |

### Auth Rules & Workflows (3 files, 98 tests)
| Test File | Tests | Status |
|-----------|-------|--------|
| isSessionValid.test.js | 27 | ✅ PASS |
| validateTokenWorkflow.test.js | 30 | ✅ PASS |
| checkAuthStatusWorkflow.test.js | 41 | ✅ PASS |

### Scheduling Rules (3 files, 112 tests)
| Test File | Tests | Status |
|-----------|-------|--------|
| isScheduleContiguous.test.js | 53 | ✅ PASS |
| isDateInRange.test.js | 31 | ✅ PASS |
| isDateBlocked.test.js | 28 | ✅ PASS |

### Pricing Rules (1 file, 34 tests)
| Test File | Tests | Status |
|-----------|-------|--------|
| isValidDayCountForPricing.test.js | 34 | ✅ PASS |

### Processors (7 files, 277 tests)
| Test File | Tests | Status |
|-----------|-------|--------|
| processUserDisplayName.test.js | 45 | ✅ PASS |
| processUserInitials.test.js | 46 | ✅ PASS |
| processProfilePhotoUrl.test.js | 34 | ✅ PASS |
| extractListingCoordinates.test.js | 33 | ✅ PASS |
| parseJsonArrayField.test.js | 43 | ✅ PASS |
| normalizeProposalData.test.js | 44 | ✅ PASS |
| formatHostName.test.js | 32 | ✅ PASS |

### Lib Tests (1 file, 105 tests)
| Test File | Tests | Status |
|-----------|-------|--------|
| sanitize.test.js | 105 | ✅ PASS |

### Integration Tests (3 files, 82 tests)
| Test File | Tests | Status |
|-----------|-------|--------|
| auth-flow.test.js | 40 | ✅ PASS |
| booking-flow.test.js | 21 | ✅ PASS |
| property-search.test.js | 21 | ✅ PASS |

### Regression Tests (1 file, 6 tests)
| Test File | Tests | Status |
|-----------|-------|--------|
| REG-001-fk-constraint-violation.test.js | 6 | ✅ PASS |

### Hooks (2 files, 79 tests)
| Test File | Tests | Status |
|-----------|-------|--------|
| useImageCarousel.test.js | 35 | ✅ PASS |
| useDeviceDetection.test.js | 44 | ✅ PASS |

### Component Tests (5 files, 191 tests)
| Test File | Tests | Status |
|-----------|-------|--------|
| PriceDisplay.test.jsx | 29 | ✅ PASS |
| ErrorOverlay.test.jsx | 47 | ✅ PASS |
| DayButton.test.jsx | 41 | ✅ PASS |
| NotFoundPage.test.jsx | 31 | ✅ PASS |
| Button.test.jsx | 43 | ✅ PASS |

---

## Failing Tests

**None** - All 2,138 tests passed.

---

## Recommendations

1. **Maintain Coverage**: All focus area tests are passing. Continue adding tests for new features.
2. **Performance**: Test suite completes in 35s - acceptable for CI/CD.
3. **No Action Required**: Test suite is healthy.
