# Custom Hook Testing Opportunity Report
**Generated:** 2026-01-26 11:46:00
**Codebase:** Split Lease (React 18 + Vite Islands Architecture)

## Executive Summary
- **Custom hooks found:** 97+
- **Hooks needing tests:** 97 (100%)
- **Missing test infrastructure:** COMPLETE
- **Testing dependencies installed:** NONE
- **Existing test files:** 1 (non-hooks: calculateMatchScore.test.js)

---

## Test Infrastructure Check

### renderHook Setup Status: ❌ NOT INSTALLED

**CRITICAL FINDING:** The codebase has NO testing infrastructure for React components or hooks.

| Dependency | Status | Required For |
|------------|--------|--------------|
| `vitest` | ❌ Not installed | Test runner |
| `@testing-library/react` | ❌ Not installed | renderHook, act, waitFor |
| `@testing-library/jest-dom` | ❌ Not installed | DOM matchers |
| `@testing-library/user-event` | ❌ Not installed | User interaction simulation |
| `msw` | ❌ Not installed | API mocking for data fetching hooks |
| `jsdom` or `happy-dom` | ❌ Not installed | DOM environment |
| `@vitest/ui` | ❌ Not installed | Test UI (optional) |

**Package.json analysis:** `app/package.json` contains NO testing dependencies in either `dependencies` or `devDependencies`.

---

## Critical Gaps (No Tests)

### Audit Scope
All 97+ custom React hooks in the codebase lack test coverage using `renderHook()`. Below are the most critical hooks organized by category and priority.

---

## Priority 1: Critical Infrastructure Hooks

### 1. useAuthenticatedUser
- **File:** `app/src/hooks/useAuthenticatedUser.js`
- **Hook Type:** Auth / Data Fetching
- **Has Test File:** No
- **Dependencies:** Supabase auth, validateTokenAndFetchUser, getSessionId, getUserId, getFirstName
- **Missing Tests:**
  - [ ] Initial loading state
  - [ ] Returns user when token validation succeeds
  - [ ] Falls back to session metadata when token validation fails
  - [ ] Returns null user when no auth found
  - [ ] Returns error state on auth failure
  - [ ] isAuthenticated flag correctness
  - [ ] userId is correctly derived from multiple sources
  - [ ] User object structure matches expected shape

### 2. useDeviceDetection
- **File:** `app/src/hooks/useDeviceDetection.js`
- **Hook Type:** Utility / Event Listener
- **Exports:** `useIsMobile()`, `useIsDesktop()`, `useIsTablet()`, `useDeviceType()`, `useDeviceDetection()`
- **Has Test File:** No
- **Dependencies:** window.resize event listener
- **Missing Tests:**
  - [ ] Initial state based on window width (SSR safety)
  - [ ] Updates state on window resize
  - [ ] Cleans up event listener on unmount
  - [ ] useIsMobile returns true for width <= 768px
  - [ ] useIsDesktop returns true for width > 768px
  - [ ] useIsTablet returns true for width 769-1024px
  - [ ] useDeviceType returns correct device type string
  - [ ] SSR default values (window undefined)

### 3. useDataLookups
- **File:** `app/src/hooks/useDataLookups.js`
- **Hook Type:** Data Fetching / Initialization
- **Has Test File:** No
- **Dependencies:** initializeLookups, isInitialized
- **Missing Tests:**
  - [ ] Returns true if already initialized
  - [ ] Initializes data lookups on mount if not ready
  - [ ] Returns false while initializing
  - [ ] Cleans up mounted flag on unmount
  - [ ] Handles initialization errors gracefully

---

## Priority 2: Data Fetching Hooks (Need MSW)

### 4. useListingData
- **File:** `app/src/islands/pages/ListingDashboardPage/hooks/useListingData.js`
- **Hook Type:** Data Fetching
- **Has Test File:** No
- **Dependencies:** Supabase (listing, listing_photo, proposal, bookings_leases, virtualmeetingsandlinks, external_reviews, co_hostrequest tables)
- **Missing Tests:**
  - [ ] Initial loading state
  - [ ] Returns error when no listingId provided
  - [ ] Fetches listing from Supabase by ID
  - [ ] Fetches related photos
  - [ ] Fetches related counts (proposals, meetings, leases, reviews)
  - [ ] Fetches existing cohost request
  - [ ] Transforms listing data correctly
  - [ ] updateListing function works
  - [ ] Silent fetch mode (doesn't set loading)
  - [ ] Error handling for Supabase failures
  - [ ] Lookup tables are fetched and applied

### 5. useGuestMenuData
- **File:** `app/src/islands/shared/Header/useGuestMenuData.js`
- **Hook Type:** Data Fetching / State Calculation
- **Has Test File:** No
- **Dependencies:** Supabase (proposal, user, bookings_leases tables)
- **Missing Tests:**
  - [ ] Returns LOGGED_OUT state when not authenticated
  - [ ] Returns NO_PROPOSALS_NO_APP when authenticated with no proposals/app
  - [ ] Returns NO_PROPOSALS_WITH_APP when has rental application only
  - [ ] Returns WITH_PROPOSALS when has proposals
  - [ ] Returns WITH_SUGGESTED when has suggested proposals
  - [ ] Returns WITH_LEASES when has active leases (highest priority)
  - [ ] State priority order is correct
  - [ ] Refetch function works
  - [ ] Error handling

### 6. useSearchPageAuth
- **File:** `app/src/islands/pages/useSearchPageAuth.js`
- **Hook Type:** Auth / Data Fetching
- **Has Test File:** No
- **Dependencies:** useAuthenticatedUser, Supabase (user table), fetchProposalsByGuest, fetchLastProposalDefaults
- **Missing Tests:**
  - [ ] Optimistic auth state from cache
  - [ ] Syncs with authenticated user data
  - [ ] Fetches user profile data
  - [ ] Fetches proposal count via RPC
  - [ ] Processes favorites from JSONB field
  - [ ] Filters valid favorite IDs (Bubble ID format)
  - [ ] Fetches last proposal defaults
  - [ ] Fetches user's existing proposals (if guest)
  - [ ] Sets isLoggedIn correctly
  - [ ] Clears state on logout
  - [ ] handleToggleFavorite updates local state

---

## Priority 3: Business Logic Hooks

### 7. useProposalButtonStates
- **File:** `app/src/hooks/useProposalButtonStates.js`
- **Hook Type:** Computed Values (useMemo)
- **Has Test File:** No
- **Dependencies:** computeProposalButtonStates
- **Missing Tests:**
  - [ ] Memoizes based on all dependencies
  - [ ] Recomputes when proposal changes
  - [ ] Recomputes when virtualMeeting changes
  - [ ] Recomputes when guest changes
  - [ ] Recomputes when listing changes
  - [ ] Recomputes when currentUserId changes

### 8. useScheduleSelector
- **File:** `app/src/islands/shared/useScheduleSelector.js`
- **Hook Type:** State Management / Business Logic
- **Has Test File:** No
- **Dependencies:** scheduleSelector validators, calculations, helpers
- **Missing Tests:**
  - [ ] Initial selectedDays from props
  - [ ] Syncs selectedDays when initialSelectedDays changes
  - [ ] handleDayClick adds day when not selected
  - [ ] handleDayClick removes day when selected
  - [ ] handleDaySelect validates day selection
  - [ ] handleDayRemove validates day removal
  - [ ] Error state for maximum nights exceeded
  - [ ] Error state for minimum nights violated
  - [ ] Error state for non-contiguous selection
  - [ ] clearSelection resets all state
  - [ ] clearError clears error state
  - [ ] acceptableSchedule computed correctly
  - [ ] priceBreakdown calculated correctly
  - [ ] checkInDay and checkOutDay derived correctly
  - [ ] nightsCount calculated correctly
  - [ ] isContiguous flag correct
  - [ ] Calls onSelectionChange callback
  - [ ] Calls onPriceChange callback
  - [ ] Calls onScheduleChange callback

### 9. useSearchPageLogic
- **File:** `app/src/islands/pages/useSearchPageLogic.js`
- **Hook Type:** Complex State Management (949 lines)
- **Has Test File:** No
- **Dependencies:** Supabase, dataLookups, urlParams, logic core functions
- **Missing Tests:**
  - [ ] Initializes data lookups on mount
  - [ ] Fetches all active listings for map background
  - [ ] Fetches filtered listings based on filters
  - [ ] Fetches fallback listings when no results
  - [ ] Transforms listing data correctly
  - [ ] Filter validation works (Logic Core rules)
  - [ ] Lazy loading loads initial batch
  - [ ] handleLoadMore loads next batch
  - [ ] handleResetFilters resets to defaults
  - [ ] URL params are parsed and set on mount
  - [ ] URL params update when filters change
  - [ ] Browser back/forward updates filters
  - [ ] Modal handlers update state correctly
  - [ ] Filters: borough, neighborhoods, weekPattern, priceTier, sortBy
  - [ ] Filtered neighborhoods computed from search

---

## Priority 4: UI State Hooks

### 10. useImageCarousel
- **File:** `app/src/hooks/useImageCarousel.js`
- **Hook Type:** UI State
- **Has Test File:** No
- **Missing Tests:**
  - [ ] Initial index is 0
  - [ ] hasImages is false when images array is empty
  - [ ] hasMultipleImages is false when images.length <= 1
  - [ ] handlePrevImage decrements index (wraps to end)
  - [ ] handleNextImage increments index (wraps to start)
  - [ ] setCurrentImageIndex updates index
  - [ ] Callbacks are memoized correctly
  - [ ] Navigation handlers prevent default and stop propagation

---

## Data Fetching Hook Gaps

### Hooks Without Async Tests (All Hooks)
| Hook | Returns Loading | Returns Error | Has Test | Needs MSW |
|------|-----------------|---------------|----------|-----------|
| useAuthenticatedUser | Yes | Yes | No | Yes |
| useDataLookups | Yes | No | No | Yes |
| useListingData | Yes | Yes | No | Yes |
| useGuestMenuData | Yes | Yes | No | Yes |
| useSearchPageAuth | Yes | No | No | Yes |
| useSearchPageLogic | Yes | Yes | No | Yes |
| useListingAuth | Yes | No | No | Yes |
| useAIImportAssistant | Yes | No | No | Yes |
| usePhotoManagement | No | Yes | No | Yes |
| useCancellationLogic | No | No | No | Yes |
| useAvailabilityLogic | No | No | No | Yes |

**ALL data fetching hooks need:**
- [ ] MSW handlers for Supabase API calls
- [ ] `waitFor()` for async assertions
- [ ] Loading state tests
- [ ] Success state tests
- [ ] Error state tests
- [ ] Refetch on dependency change tests

---

## Auth Hook Gaps

### Hooks Without Context Tests
| Hook | Context Required | Provider Wrapper | Has Test |
|------|------------------|------------------|----------|
| useAuthenticatedUser | None (uses services) | N/A | No |
| useListingAuth | None (uses services) | N/A | No |
| useSearchPageAuth | None (uses services) | N/A | No |

**Auth hooks use service layer instead of React Context, so they don't need provider wrappers for testing.**

### Missing Auth Test Cases
- [ ] Returns null user when not authenticated
- [ ] Returns user object when authenticated
- [ ] Loading state during authentication check
- [ ] Error state on authentication failure
- [ ] Token validation success path
- [ ] Token validation fallback to session metadata
- [ ] Session metadata fallback paths
- [ ] User ID derived from multiple sources correctly

---

## Utility Hook Gaps

### Hooks Without Utility Tests
| Hook | Side Effects | Cleanup | Has Test |
|------|--------------|---------|----------|
| useDeviceDetection | window.resize | Yes | No |
| useImageCarousel | None | No | No |
| useDataLookups | Async init | Yes | No |

### Missing Utility Test Cases

#### useDeviceDetection
- [ ] Initial state based on viewport width
- [ ] Updates on window resize event
- [ ] Cleans up resize event listener on unmount
- [ ] SSR safety (defaults when window undefined)

#### useImageCarousel
- [ ] Returns correct initial index
- [ ] Navigation wraps around at boundaries
- [ ] Prevents navigation when hasMultipleImages is false

#### useDataLookups
- [ ] Returns cached value if already initialized
- [ ] Initializes lookups on first call
- [ ] Prevents memory leaks with mounted flag

---

## Event Listener Hook Gaps

### Hooks Without Event Listener Tests
| Hook | Event Listeners | Cleanup Test |
|------|-----------------|--------------|
| useDeviceDetection | resize | No |
| useSearchPageLogic | popstate (browser nav) | No |

**All hooks with event listeners need cleanup tests to prevent memory leaks.**

---

## State Management Hook Gaps

### Hooks Without State Tests
| Hook | Has Validation | Has Computed | Has Test |
|------|----------------|--------------|----------|
| useScheduleSelector | Yes | Yes | No |
| useSearchPageLogic | Yes | Yes | No |
| useProposalButtonStates | No | Yes | No |
| useImageCarousel | No | Yes | No |

### Missing State Test Cases
- [ ] Initial state values
- [ ] State updates via setters
- [ ] Validation error calculation
- [ ] Computed value calculation
- [ ] Reset to initial state
- [ ] Memoization dependencies correct

---

## act() Usage Gaps

### Hooks With Missing act() Wrapping (All Hooks)
| Hook | State Updates | Wrapped in act() |
|------|---------------|------------------|
| useImageCarousel | setCurrentImageIndex | N/A (no tests) |
| useScheduleSelector | All state updates | N/A (no tests) |
| useSearchPageLogic | All state updates | N/A (no tests) |
| useListingData | setListing | N/A (no tests) |

**ALL hooks with state updates need `act()` wrapping in tests.**

---

## Rerender Test Gaps

### Hooks Without Rerender Tests
| Hook | Has Dependencies | Rerender Test |
|------|------------------|---------------|
| useProposalButtonStates | Yes (proposal, guest, listing, currentUserId) | No |
| useScheduleSelector | Yes (initialSelectedDays, listing) | No |
| useSearchPageLogic | Yes (all filters) | No |
| useAuthenticatedUser | No | No |

**Hooks with dependencies need rerender tests to verify:**
- Recalculation when dependencies change
- No unnecessary recalculations
- Memoization works correctly

---

## Cleanup Test Gaps

### Hooks Without Cleanup Tests
| Hook | Has Cleanup | Cleanup Test |
|------|-------------|--------------|
| useDeviceDetection | Yes (resize listener) | No |
| useDataLookups | Yes (mounted flag) | No |
| useSearchPageLogic | Yes (popstate listener) | No |
| useSearchPageAuth | Yes (effects) | No |

**Hooks with cleanup functions need tests to verify:**
- Event listeners are removed
- Timers are cleared
- Subscriptions are cancelled
- No memory leaks

---

## Complete Hook Inventory (97+ Hooks)

### Shared Hooks (app/src/hooks/)
1. `useAuthenticatedUser.js` - Auth state with fallback pattern
2. `useImageCarousel.js` - Image navigation
3. `useDataLookups.js` - Data lookup initialization
4. `useProposalButtonStates.js` - Computed button states
5. `useDeviceDetection.js` - Viewport detection (exports 5 hooks)

### Page-Specific Logic Hooks (use*PageLogic.js)
6. `useSearchPageLogic.js` - Search page orchestration (949 lines)
7. `useSearchPageAuth.js` - Search page auth state
8. `useAuthVerifyPageLogic.js` - Auth verification page
9. `useCoHostRequestsPageLogic.js` - Co-host requests
10. `useCreateSuggestedProposalLogic.js` - Suggested proposals
11. `useGuestRelationshipsDashboardLogic.js` - Guest relationships
12. `useHostOverviewPageLogic.js` - Host overview
13. `useHouseManualPageLogic.js` - House manual
14. `useListingDashboardPageLogic.js` - Listing dashboard
15. `useMessageCurationPageLogic.js` - Message curation
16. `useMessagingPageLogic.js` - Messaging page
17. `useModifyListingsPageLogic.js` - Modify listings
18. `useReportEmergencyPageLogic.js` - Emergency reporting
19. `useSimulationAdminPageLogic.js` - Simulation admin
20. `useSimulationGuestMobilePageLogic.js` - Guest mobile sim
21. `useSimulationGuestsideDemoPageLogic.js` - Guest demo
22. `useSimulationHostMobilePageLogic.js` - Host mobile sim
23. `useSimulationHostsideDemoPageLogic.js` - Host demo
24. `useEmailSmsUnitPageLogic.js` - Email/SMS unit
25. `useGuestProposalsPageLogic.js` - Guest proposals
26. `useManageInformationalTextsPageLogic.js` - Info texts
27. `useQuickMatchPageLogic.js` - Quick match
28. `useVerifyUsersPageLogic.js` - User verification
29. `useRentalApplicationPageLogic.js` - Rental application
30. `useAdminThreadsPageLogic.js` - Admin threads
31. `useAccountProfilePageLogic.js` - Account profile
32. `useAiToolsPageLogic.js` - AI tools
33. `useCreateDocumentPageLogic.js` - Document creation
34. `useExperienceResponsesPageLogic.js` - Experience responses
35. `useGuestSimulationLogic.js` - Guest simulation
36. `useHostLeasesPageLogic.js` - Host leases
37. `useHostProposalsPageLogic.js` - Host proposals
38. `useInternalEmergencyPageLogic.js` - Internal emergency
39. `useLeasesOverviewPageLogic.js` - Leases overview
40. `useListingsOverviewPageLogic.js` - Listings overview
41. `useManageRentalApplicationsPageLogic.js` - Rental applications
42. `useManageVirtualMeetingsPageLogic.js` - Virtual meetings
43. `useProposalManagePageLogic.js` - Proposal management
44. `useQuickPricePageLogic.js` - Quick pricing
45. `useSendMagicLoginLinksPageLogic.js` - Magic login links
46. `useUsabilityDataManagementPageLogic.js` - Usability data
47. `useGuestLeasesPageLogic.js` - Guest leases

### Listing Dashboard Hooks (ListingDashboardPage/hooks/)
48. `useAIImportAssistant.js` - AI import workflow
49. `usePhotoManagement.js` - Photo CRUD operations
50. `useListingData.js` - Listing data fetching
51. `useListingAuth.js` - Listing auth check
52. `useCancellationLogic.js` - Cancellation policy
53. `useAvailabilityLogic.js` - Availability settings
54. `usePricingLogic.js` - Pricing calculations

### Shared Component Hooks (islands/shared/)
55. `useFileUpload.js` - File upload (AIRoomRedesign)
56. `useRoomRedesign.js` - AI room redesign
57. `useAISuggestionsState.js` - AI suggestions state
58. `useAIToolsState.js` - AI tools state
59. `useGuestMenuData.js` - Guest menu state
60. `useHostMenuData.js` - Host menu state
61. `useHeaderMessagingPanelLogic.js` - Header messaging
62. `useLoggedInAvatarData.js` - Avatar data
63. `useNotificationSettings.js` - Notification settings
64. `useQRCodeDashboardLogic.js` - QR code dashboard
65. `useReminderHouseManualLogic.js` - House manual reminder
66. `useSignUpTrialHostLogic.js` - Trial host signup
67. `useSuggestedProposals.js` - Suggested proposals state
68. `useUsabilityPopupLogic.js` - Usability popup
69. `useScheduleSelectorLogicCore.js` - Schedule selector core
70. `useScheduleSelector.js` - Schedule selector
71. `useVisitReviewerHouseManualLogic.js` - Reviewer house manual
72. `useRentalApplicationWizardLogic.js` - Rental application wizard
73. `useIdentityVerificationLogic.js` - Identity verification
74. `useEditListingDetailsLogic.js` - Edit listing details

### Modal Hooks (islands/modals/)
75. `useCompareTermsModalLogic.js` - Compare terms modal

### Store Hooks (Zustand stores - use*Store.ts)
76. `useRentalApplicationStore.ts` - Rental application state
77. `useListingStore.ts` - Listing state

### Utility/Data Hooks (lib/)
78. `userProposalQueries.js` - Proposal queries

---

## Implementation Prerequisites

Before writing any hook tests, the following infrastructure MUST be installed:

### 1. Install Testing Dependencies
```bash
cd app
bun add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event msw jsdom @vitest/ui
```

### 2. Create Vitest Config
Create `app/vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    css: true,
  },
})
```

### 3. Create Test Setup File
Create `app/src/test/setup.js`:
```javascript
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

expect.extend(matchers)

afterEach(() => {
  cleanup()
})
```

### 4. Create MSW Handlers
Create `app/src/test/mocks/handlers.js`:
```javascript
import { http, HttpResponse } from 'msw'

export const handlers = [
  // Supabase auth session handler
  http.get('*/auth/v1/user', () => {
    return HttpResponse.json({
      id: 'user-123',
      email: 'test@example.com',
    })
  }),

  // Add more handlers for all Supabase queries
]
```

### 5. Create test script in package.json
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run"
  }
}
```

---

## Recommended Test Patterns

### Pattern 1: Simple State Hook (useImageCarousel)
```typescript
import { renderHook, act } from '@testing-library/react'
import { useImageCarousel } from './useImageCarousel'

describe('useImageCarousel', () => {
  it('returns initial state', () => {
    const images = ['url1', 'url2', 'url3']
    const { result } = renderHook(() => useImageCarousel(images))

    expect(result.current.currentImageIndex).toBe(0)
    expect(result.current.hasImages).toBe(true)
    expect(result.current.hasMultipleImages).toBe(true)
  })

  it('navigates to next image', () => {
    const images = ['url1', 'url2', 'url3']
    const { result } = renderHook(() => useImageCarousel(images))

    act(() => {
      result.current.handleNextImage({ preventDefault: vi.fn(), stopPropagation: vi.fn() })
    })

    expect(result.current.currentImageIndex).toBe(1)
  })

  it('wraps around to first image', () => {
    const images = ['url1', 'url2', 'url3']
    const { result } = renderHook(() => useImageCarousel(images))

    act(() => {
      result.current.setCurrentImageIndex(2)
    })

    act(() => {
      result.current.handleNextImage({ preventDefault: vi.fn(), stopPropagation: vi.fn() })
    })

    expect(result.current.currentImageIndex).toBe(0)
  })
})
```

### Pattern 2: Device Detection Hook (Event Listeners)
```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { useIsMobile } from './useDeviceDetection'

describe('useIsMobile', () => {
  it('returns initial state based on viewport', () => {
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 480,
    })

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('updates on window resize', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)

    act(() => {
      window.innerWidth = 600
      window.dispatchEvent(new Event('resize'))
    })

    await waitFor(() => {
      expect(result.current).toBe(true)
    })
  })

  it('cleans up event listener', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const { unmount } = renderHook(() => useIsMobile())

    unmount()

    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function))
  })
})
```

### Pattern 3: Data Fetching Hook (with MSW)
```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import { useAuthenticatedUser } from './useAuthenticatedUser'

describe('useAuthenticatedUser', () => {
  it('returns loading state initially', () => {
    const { result } = renderHook(() => useAuthenticatedUser())

    expect(result.current.loading).toBe(true)
    expect(result.current.user).toBeNull()
  })

  it('returns user when authenticated', async () => {
    server.use(
      http.get('*/auth/v1/user', () => {
        return HttpResponse.json({
          id: 'user-123',
          email: 'test@example.com',
          user_metadata: {
            user_id: 'user-123',
            full_name: 'Test User',
          },
        })
      })
    )

    const { result } = renderHook(() => useAuthenticatedUser())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toEqual({
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
    })
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('returns null user when not authenticated', async () => {
    server.use(
      http.get('*/auth/v1/user', () => {
        return new HttpResponse(null, { status: 401 })
      })
    )

    const { result } = renderHook(() => useAuthenticatedUser())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })
})
```

### Pattern 4: Computed Values Hook (useMemo)
```typescript
import { renderHook } from '@testing-library/react'
import { useProposalButtonStates } from './useProposalButtonStates'

describe('useProposalButtonStates', () => {
  it('computes button states from proposal', () => {
    const proposal = { Status: 'Proposal Submitted' }
    const { result } = renderHook(() =>
      useProposalButtonStates({ proposal, virtualMeeting: null, guest: null, listing: null, currentUserId: null })
    )

    expect(result.current).toHaveProperty('canAccept')
    expect(result.current).toHaveProperty('canDecline')
  })

  it('recalculates when proposal changes', () => {
    const { result, rerender } = renderHook(
      ({ proposal }) => useProposalButtonStates({ proposal, virtualMeeting: null, guest: null, listing: null, currentUserId: null }),
      { initialProps: { proposal: { Status: 'Proposal Submitted' } } }
    )

    const initialStates = result.current

    rerender({ proposal: { Status: 'Proposal Accepted' } })

    expect(result.current).not.toEqual(initialStates)
  })
})
```

### Pattern 5: Complex State Hook (useScheduleSelector)
```typescript
import { renderHook, act } from '@testing-library/react'
import { useScheduleSelector } from './useScheduleSelector'

describe('useScheduleSelector', () => {
  const listing = {
    daysAvailable: [0, 1, 2, 3, 4, 5, 6],
    minimumNights: 2,
    maximumNights: 7,
  }

  it('initializes with empty selection', () => {
    const { result } = renderHook(() => useScheduleSelector({ listing }))

    expect(result.current.selectedDays).toEqual([])
    expect(result.current.nightsCount).toBe(0)
  })

  it('selects a day when clicked', () => {
    const { result } = renderHook(() => useScheduleSelector({ listing }))

    act(() => {
      result.current.handleDayClick({ dayOfWeek: 0, name: 'Sunday' })
    })

    expect(result.current.selectedDays).toHaveLength(1)
    expect(result.current.selectedDays[0].dayOfWeek).toBe(0)
  })

  it('validates minimum nights constraint', () => {
    const { result } = renderHook(() => useScheduleSelector({ listing }))

    // Select two days (1 night)
    act(() => {
      result.current.handleDayClick({ dayOfWeek: 0, name: 'Sunday' })
    })
    act(() => {
      result.current.handleDayClick({ dayOfWeek: 1, name: 'Monday' })
    })

    // Try to remove day (would go below minimum)
    const success = result.current.handleDayRemove({ dayOfWeek: 1, name: 'Monday' })

    expect(success).toBe(false)
    expect(result.current.errorState.hasError).toBe(true)
  })

  it('calculates price breakdown correctly', () => {
    const listingWithPricing = {
      ...listing,
      pricing: {
        1: 100,
        2: 90,
        3: 85,
        4: 80,
        5: 75,
        6: 70,
        7: 65,
      },
    }

    const { result } = renderHook(() => useScheduleSelector({ listing: listingWithPricing }))

    // Select 3 days (2 nights)
    act(() => {
      result.current.handleDayClick({ dayOfWeek: 0, name: 'Sunday' })
    })
    act(() => {
      result.current.handleDayClick({ dayOfWeek: 1, name: 'Monday' })
    })
    act(() => {
      result.current.handleDayClick({ dayOfWeek: 2, name: 'Tuesday' })
    })

    expect(result.current.nightsCount).toBe(2)
    expect(result.current.priceBreakdown.totalPrice).toBeDefined()
  })
})
```

---

## Testing Priorities

### Phase 1: Infrastructure (Week 1)
1. Install all testing dependencies
2. Create vitest.config.ts
3. Create test setup file
4. Create MSW handlers for common Supabase queries
5. Write one example test to verify setup

### Phase 2: Critical Hooks (Week 2-3)
1. `useDeviceDetection` - Event listener cleanup tests
2. `useImageCarousel` - Simple state tests
3. `useAuthenticatedUser` - Auth flow tests
4. `useDataLookups` - Initialization tests

### Phase 3: Data Fetching Hooks (Week 4-6)
1. `useListingData` - Complex Supabase queries
2. `useGuestMenuData` - State calculation logic
3. `useSearchPageAuth` - Optimistic state tests
4. Create comprehensive MSW handlers

### Phase 4: Business Logic Hooks (Week 7-10)
1. `useScheduleSelector` - Complex validation logic
2. `useProposalButtonStates` - Memoization tests
3. `useCancellationLogic` - Authorization tests
4. `useAvailabilityLogic` - Validation tests

### Phase 5: Page Logic Hooks (Week 11-15)
Test remaining 80+ page-specific logic hooks, prioritizing by:
- Codebase impact (most used hooks first)
- Complexity (complex hooks need more tests)
- Criticality (auth/payments critical paths first)

---

## Anti-Patterns to Avoid

### Don't Test Implementation Details
```typescript
// ❌ BAD - Tests internal implementation
it('uses useState for selectedDays', () => {
  const { result } = renderHook(() => useScheduleSelector({ listing }))
  expect(result.current.selectedDays).toBeDefined() // Too generic
})

// ✅ GOOD - Tests behavior
it('adds day to selection when clicked', () => {
  const { result } = renderHook(() => useScheduleSelector({ listing }))
  act(() => result.current.handleDayClick(sunday))
  expect(result.current.selectedDays).toContain(sunday)
})
```

### Don't Forget act() for State Updates
```typescript
// ❌ BAD - State update outside act()
it('updates index', () => {
  const { result } = renderHook(() => useImageCarousel(images))
  result.current.handleNextImage(event) // Warning!
  expect(result.current.currentImageIndex).toBe(1)
})

// ✅ GOOD - Wrap in act()
it('updates index', () => {
  const { result } = renderHook(() => useImageCarousel(images))
  act(() => {
    result.current.handleNextImage(event)
  })
  expect(result.current.currentImageIndex).toBe(1)
})
```

### Don't Test External Libraries
```typescript
// ❌ BAD - Tests Supabase (external dependency)
it('calls supabase.from', () => {
  const spy = vi.spyOn(supabase, 'from')
  renderHook(() => useListingData(listingId))
  expect(spy).toHaveBeenCalled()
})

// ✅ GOOD - Tests behavior, use MSW for mocking
it('fetches listing data', async () => {
  server.use(http.get('*/rest/v1/listing', () => HttpResponse.json({ _id: '123' })))
  const { result } = renderHook(() => useListingData('123'))
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(result.current.listing).toEqual({ _id: '123' })
})
```

---

## References

### Existing Tests (Only 1)
- `app/src/logic/calculators/matching/__tests__/calculateMatchScore.test.js` - Logic test (not a hook)

### Related Audit Reports
- `.claude/plans/Opportunities/250125/20260125140500-audit-vitest-rtl-setup.md` - Vitest setup audit
- `.claude/plans/Opportunities/260125/20260125120634-audit-supabase-auth-tests.md` - Auth testing audit
- `.claude/plans/Opportunities/260126/20260126110740-audit-websocket-realtime-tests.md` - WebSocket testing audit

### Testing Library Documentation
- [Testing Library React Hooks](https://testing-library.com/docs/react-testing-library/intro/#hooks)
- [MSW Documentation](https://mswjs.io/)
- [Vitest Documentation](https://vitest.dev/)

---

## Summary

**Status:** 🚨 CRITICAL - No hook testing infrastructure exists

**Next Steps:**
1. Install testing dependencies (vitest, @testing-library/react, msw, jsdom)
2. Create test configuration files
3. Set up MSW handlers for Supabase API mocking
4. Start with Priority 1 hooks (infrastructure hooks)
5. Progressively add coverage for data fetching, business logic, and page hooks

**Estimated Effort:**
- Phase 1 (Infrastructure): 1 week
- Phase 2 (Critical Hooks): 2 weeks
- Phase 3 (Data Fetching): 3 weeks
- Phase 4 (Business Logic): 4 weeks
- Phase 5 (Page Logic): 5 weeks

**Total: 15 weeks to achieve comprehensive hook test coverage**
