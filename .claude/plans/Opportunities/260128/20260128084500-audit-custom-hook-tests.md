# Custom Hook Tests Opportunity Report

**Generated:** 2026-01-28T08:45:00
**Codebase:** Split Lease

## Executive Summary

| Metric | Count |
|--------|-------|
| Total custom hooks | 92 |
| Hooks with tests | 2 (2.2%) |
| Hooks without tests | 90 |
| High priority missing tests | 15 |
| Medium priority missing tests | 25 |

**Overall Status:** Critical gap - Only 2 of 92 custom hooks have unit tests.

## Current Test Coverage

### Hooks With Tests (Good)

| Hook | Test File | Status |
|------|-----------|--------|
| `useDeviceDetection` | `hooks/useDeviceDetection.test.js` | Tested |
| `useImageCarousel` | `hooks/useImageCarousel.test.js` | Tested |

## Hooks Inventory by Category

### Core Hooks (`hooks/`)

| Hook | Purpose | Has Test | Priority |
|------|---------|----------|----------|
| `useAuthenticatedUser.js` | Auth state management | No | P0 |
| `useDataLookups.js` | Data fetching from lookups | No | P1 |
| `useDeviceDetection.js` | Device/viewport detection | Yes | - |
| `useImageCarousel.js` | Image carousel state | Yes | - |
| `useProposalButtonStates.js` | Proposal action button states | No | P0 |

### Page Logic Hooks (`islands/pages/*/`)

| Hook | Page | Has Test | Priority |
|------|------|----------|----------|
| `useGuestProposalsPageLogic.js` | GuestProposalsPage | No | P0 |
| `useHostProposalsPageLogic.js` | HostProposalsPage | No | P0 |
| `useHostOverviewPageLogic.js` | HostOverviewPage | No | P1 |
| `useListingDashboardPageLogic.js` | ListingDashboardPage | No | P0 |
| `useSearchPageLogic.js` | SearchPage | No | P1 |
| `useViewSplitLeaseLogic.ts` | ViewSplitLeasePage | No | P0 |
| `useRentalApplicationPageLogic.js` | RentalApplicationPage | No | P1 |
| `useHostLeasesPageLogic.js` | HostLeasesPage | No | P2 |
| `useGuestLeasesPageLogic.js` | GuestLeasesPage | No | P2 |
| `useMessagingPageLogic.js` | MessagingPage | No | P1 |
| `useAccountProfilePageLogic.js` | AccountProfilePage | No | P2 |
| `useHouseManualPageLogic.js` | HouseManualPage | No | P2 |

### Feature Hooks (`islands/shared/*/`)

| Hook | Feature | Has Test | Priority |
|------|---------|----------|----------|
| `useScheduleSelector.js` | Day selection | No | P0 |
| `useScheduleSelectorLogicCore.js` | Schedule logic | No | P0 |
| `useEditListingDetailsLogic.js` | Listing editor | No | P1 |
| `useLoggedInAvatarData.js` | User avatar display | No | P2 |
| `useNotificationSettings.js` | Notification prefs | No | P2 |
| `useSuggestedProposals.js` | Suggested proposals | No | P1 |
| `useIdentityVerificationLogic.js` | Identity verification | No | P1 |
| `useHeaderMessagingPanelLogic.js` | Messaging panel | No | P2 |

### Listing Dashboard Hooks (`islands/pages/ListingDashboardPage/hooks/`)

| Hook | Purpose | Has Test | Priority |
|------|---------|----------|----------|
| `useAIImportAssistant.js` | AI import | No | P2 |
| `useListingAuth.js` | Listing ownership auth | No | P0 |
| `useListingData.js` | Listing data fetching | No | P0 |
| `usePhotoManagement.js` | Photo upload/delete | No | P1 |
| `useAvailabilityLogic.js` | Availability calendar | No | P1 |
| `useCancellationLogic.js` | Cancellation policy | No | P2 |
| `usePricingLogic.js` | Pricing calculation | No | P0 |

### Store Hooks (Zustand)

| Hook | Purpose | Has Test | Priority |
|------|---------|----------|----------|
| `useListingStore.ts` | Listing form state | No | P1 |
| `useRentalApplicationStore.ts` | Rental app form state | No | P1 |

### AI Feature Hooks

| Hook | Purpose | Has Test | Priority |
|------|---------|----------|----------|
| `useRoomRedesign.js` | AI room redesign | No | P3 |
| `useAISuggestionsState.js` | AI suggestions | No | P3 |
| `useAIToolsState.js` | AI tools state | No | P3 |
| `useFileUpload.js` | File upload for AI | No | P2 |

### Admin/Internal Hooks

| Hook | Purpose | Has Test | Priority |
|------|---------|----------|----------|
| `useAdminThreadsPageLogic.js` | Admin messaging | No | P3 |
| `useCoHostRequestsPageLogic.js` | Co-host management | No | P3 |
| `useManageVirtualMeetingsPageLogic.js` | Virtual meetings admin | No | P3 |
| `useMessageCurationPageLogic.js` | Message moderation | No | P3 |
| `useUsabilityDataManagementPageLogic.js` | Usability tracking | No | P3 |
| `useVerifyUsersPageLogic.js` | User verification | No | P3 |

## Priority Categorization

### P0 - Critical Business Logic (Test First)

These hooks contain core business logic that must work correctly:

| Hook | Reason | Complexity |
|------|--------|------------|
| `useAuthenticatedUser.js` | Auth state, session management | Medium |
| `useProposalButtonStates.js` | Determines what actions users can take | High |
| `useGuestProposalsPageLogic.js` | Guest proposal management | High |
| `useHostProposalsPageLogic.js` | Host proposal management | High |
| `useListingDashboardPageLogic.js` | Listing management | High |
| `useViewSplitLeaseLogic.ts` | Listing viewing, proposal creation | High |
| `useScheduleSelector.js` | Day selection, pricing | High |
| `useScheduleSelectorLogicCore.js` | Schedule validation | High |
| `useListingAuth.js` | Ownership verification | Medium |
| `useListingData.js` | Listing data fetching | Medium |
| `usePricingLogic.js` | Pricing calculations | High |

### P1 - Important Features

| Hook | Reason | Complexity |
|------|--------|------------|
| `useDataLookups.js` | Reference data caching | Medium |
| `useHostOverviewPageLogic.js` | Host dashboard | Medium |
| `useSearchPageLogic.js` | Search functionality | High |
| `useRentalApplicationPageLogic.js` | Application submission | High |
| `useMessagingPageLogic.js` | Messaging system | High |
| `useEditListingDetailsLogic.js` | Listing editing | Medium |
| `useSuggestedProposals.js` | Suggested proposals | Medium |
| `useIdentityVerificationLogic.js` | ID verification flow | Medium |
| `usePhotoManagement.js` | Photo operations | Medium |
| `useAvailabilityLogic.js` | Availability calendar | Medium |
| `useListingStore.ts` | Form state management | Medium |
| `useRentalApplicationStore.ts` | Form state management | Medium |

### P2 - Standard Features

| Hook | Reason | Complexity |
|------|--------|------------|
| `useHostLeasesPageLogic.js` | Lease management | Medium |
| `useGuestLeasesPageLogic.js` | Lease viewing | Medium |
| `useAccountProfilePageLogic.js` | Profile management | Low |
| `useHouseManualPageLogic.js` | House manual | Low |
| `useLoggedInAvatarData.js` | Avatar display | Low |
| `useNotificationSettings.js` | Notification settings | Low |
| `useHeaderMessagingPanelLogic.js` | Header messaging | Low |
| `useCancellationLogic.js` | Cancellation policy | Low |
| `useFileUpload.js` | File uploads | Medium |

### P3 - Admin/Experimental (Lower Priority)

- All admin page logic hooks
- AI feature hooks
- Simulation/test page hooks

## Test Structure Recommendation

### For Pure Logic Hooks

```javascript
// Example: useProposalButtonStates.test.js
import { renderHook } from '@testing-library/react';
import { useProposalButtonStates } from './useProposalButtonStates';

describe('useProposalButtonStates', () => {
  describe('when proposal is pending', () => {
    it('returns correct button states for guest', () => {
      const { result } = renderHook(() =>
        useProposalButtonStates({
          proposal: { status: 'pending' },
          userType: 'guest'
        })
      );

      expect(result.current.canAccept).toBe(false);
      expect(result.current.canCancel).toBe(true);
      expect(result.current.canEdit).toBe(true);
    });
  });
});
```

### For Hooks with Side Effects

```javascript
// Example: useAuthenticatedUser.test.js
import { renderHook, waitFor } from '@testing-library/react';
import { useAuthenticatedUser } from './useAuthenticatedUser';

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
}));

describe('useAuthenticatedUser', () => {
  it('returns null when not authenticated', async () => {
    const { result } = renderHook(() => useAuthenticatedUser());

    await waitFor(() => {
      expect(result.current.user).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });
});
```

### For Page Logic Hooks

```javascript
// Example: useSearchPageLogic.test.js
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSearchPageLogic } from './useSearchPageLogic';

describe('useSearchPageLogic', () => {
  describe('filter handling', () => {
    it('updates URL when filter changes', () => {
      const { result } = renderHook(() => useSearchPageLogic());

      act(() => {
        result.current.handleFilterChange({
          borough: 'Manhattan',
          priceRange: [100, 500]
        });
      });

      expect(window.location.search).toContain('borough=Manhattan');
    });
  });
});
```

## Testing Utilities Needed

### Custom Test Utilities

```javascript
// src/test/utils/hookTestUtils.js

import { renderHook } from '@testing-library/react';
import { createSupabaseMock } from '../mocks/supabaseMock';

/**
 * Render hook with common providers/mocks
 */
export function renderHookWithProviders(hook, options = {}) {
  // Set up common mocks
  vi.mock('../lib/supabase', () => createSupabaseMock());

  return renderHook(hook, {
    wrapper: TestWrapper,
    ...options,
  });
}

/**
 * Wait for async hook to settle
 */
export async function waitForHookToSettle(result) {
  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });
}
```

## Recommendations

### Immediate Actions

- [ ] Create `src/test/utils/hookTestUtils.js` with common utilities
- [ ] Add tests for `useAuthenticatedUser.js` (auth is critical path)
- [ ] Add tests for `useProposalButtonStates.js` (business rules)
- [ ] Add tests for `useScheduleSelectorLogicCore.js` (pricing logic)

### Short-term (Week 1-2)

- [ ] Add tests for all P0 hooks (11 hooks)
- [ ] Document hook testing patterns
- [ ] Add renderHook examples to test documentation

### Medium-term (Week 3-4)

- [ ] Add tests for P1 hooks (12 hooks)
- [ ] Set up hook coverage threshold

### Long-term

- [ ] Achieve 80% hook test coverage
- [ ] Add integration tests for complex hook interactions

## Test Effort Estimates

| Priority | Hooks | Estimated Hours | Notes |
|----------|-------|-----------------|-------|
| P0 | 11 | 22-33 hrs | 2-3 hrs each, complex logic |
| P1 | 12 | 18-24 hrs | 1.5-2 hrs each |
| P2 | 10 | 10-15 hrs | 1-1.5 hrs each |
| P3 | 15+ | Lower priority | As needed |

**Total for P0+P1:** ~40-57 hours of testing effort

## Summary

| Finding | Severity | Action |
|---------|----------|--------|
| 2.2% hook test coverage | High | Prioritize P0 hooks |
| No auth hook tests | High | Add useAuthenticatedUser tests |
| No proposal logic tests | High | Add useProposalButtonStates tests |
| No schedule selector tests | High | Add schedule logic tests |
| 90 untested hooks | Medium | Follow priority roadmap |

## Conclusion

The codebase has a significant gap in custom hook testing. The existing 2 tests (useDeviceDetection and useImageCarousel) are good examples of the testing pattern, but they cover utility hooks rather than core business logic. Priority should be given to testing hooks that handle authentication, proposals, and pricing - these are the core business operations that must work correctly.

**Severity: High** - Core business logic in hooks is untested. This is a significant testing gap that should be addressed incrementally starting with P0 hooks.
