# Custom Hook Testing Opportunity Report
**Generated:** 2026-01-27T11:55:08Z
**Codebase:** Split Lease

## Executive Summary
- **Custom hooks found:** 82
- **Hooks needing tests:** 81 (98.8%)
- **Missing state tests:** 70+
- **Missing async tests:** 45+
- **Missing context tests:** 10+

---

## Test Infrastructure Check

### renderHook Setup Status
- [ ] `renderHook` imported from `@testing-library/react` - **NOT FOUND** (No hook tests exist)
- [ ] `act` imported for state updates - **NOT FOUND**
- [ ] `waitFor` used for async assertions - **NOT FOUND**
- [ ] Provider wrappers created for context-dependent hooks - **NOT FOUND**
- [ ] MSW handlers set up for data fetching hooks - **NOT FOUND**

### Current State
- **Vitest is configured** for React Testing Library
- **Only 1 test file exists**: `calculateMatchScore.test.js` - Pure function test (NOT a hook test)
- **NO hooks are being tested with `renderHook()`**
- **NO `act()` wrappers** for async state updates
- **NO `waitFor()` patterns** for async assertions
- **NO mock providers** for context-dependent hooks
- **NO MSW integration** for API mocking

---

## Critical Gaps (No Tests)

### 1. Authentication Hooks (5 hooks) - HIGH PRIORITY

#### useAuthenticatedUser
- **File:** `app/src/hooks/useAuthenticatedUser.js`
- **Hook Type:** Auth
- **Has Test File:** No
- **Dependencies:** Supabase auth, secureStorage, validateTokenAndFetchUser
- **Missing Tests:**
  - [ ] Initial state test (isLoading, user is null)
  - [ ] Returns authenticated user data
  - [ ] Token validation flow with `clearOnFailure: false`
  - [ ] Session metadata fallback behavior
  - [ ] User data resolution from JWT vs session metadata
  - [ ] Error handling when auth fails
  - [ ] Logout clears user state

#### useListingAuth
- **File:** `app/src/islands/pages/ListingDashboardPage/hooks/useListingAuth.js`
- **Hook Type:** Auth
- **Has Test File:** No
- **Dependencies:** checkAuthStatus, validateTokenAndFetchUser, Supabase session
- **Missing Tests:**
  - [ ] Auth check on mount
  - [ ] Redirect when not authenticated
  - [ ] Session refresh behavior
  - [ ] Token validation

#### useSearchPageAuth
- **File:** `app/src/islands/pages/useSearchPageAuth.js`
- **Hook Type:** Auth
- **Has Test File:** No
- **Dependencies:** useAuthenticatedUser, Supabase RPC calls
- **Missing Tests:**
  - [ ] Guest search behavior (no auth required)
  - [ ] Authenticated user search behavior
  - [ ] Profile preferences integration

#### useLoggedInAvatarData
- **File:** `app/src/islands/shared/LoggedInAvatar/useLoggedInAvatarData.js`
- **Hook Type:** Auth
- **Has Test File:** No
- **Dependencies:** Supabase user queries
- **Missing Tests:**
  - [ ] Fetches user profile data
  - [ ] Loading state
  - [ ] Error state

#### useIdentityVerificationLogic
- **File:** `app/src/islands/shared/IdentityVerification/useIdentityVerificationLogic.js`
- **Hook Type:** Auth
- **Has Test File:** No
- **Dependencies:** Verification APIs
- **Missing Tests:**
  - [ ] Initiate verification flow
  - [ ] Check verification status
  - [ ] Handle verification success/failure

---

### 2. Data Fetching Hooks (15 hooks) - HIGH PRIORITY

#### useListingData
- **File:** `app/src/islands/pages/ListingDashboardPage/hooks/useListingData.js`
- **Hook Type:** Data Fetching
- **Has Test File:** No
- **Dependencies:** Supabase queries, lookup tables, photo fetching
- **Missing Tests:**
  - [ ] Initial loading state
  - [ ] Fetches listing by ID
  - [ ] Transforms DB data to component format
  - [ ] Handles lookup table data
  - [ ] Photo fetching
  - [ ] Error handling

#### useSearchPageLogic
- **File:** `app/src/islands/pages/useSearchPageLogic.js`
- **Hook Type:** Data Fetching
- **Has Test File:** No
- **Dependencies:** Supabase, dataLookups, URL params
- **Missing Tests:**
  - [ ] Loads listings from URL params
  - [ ] Filter state management
  - [ ] URL parameter sync
  - [ ] Listing data transformation
  - [ ] Empty state handling

#### useHostOverviewPageLogic
- **File:** `app/src/islands/pages/HostOverviewPage/useHostOverviewPageLogic.js`
- **Hook Type:** Data Fetching
- **Missing Tests:**
  - [ ] Fetches host statistics
  - [ ] Aggregates listing data

#### useHostProposalsPageLogic
- **File:** `app/src/islands/pages/HostProposalsPage/useHostProposalsPageLogic.js`
- **Hook Type:** Data Fetching
- **Missing Tests:**
  - [ ] Fetches proposals for host's listings
  - [ ] Filter by status

#### useGuestProposalsPageLogic
- **File:** `app/src/islands/pages/proposals/useGuestProposalsPageLogic.js`
- **Hook Type:** Data Fetching
- **Missing Tests:**
  - [ ] Fetches guest's proposals
  - [ ] Filter by status

#### useGuestLeasesPageLogic
- **File:** `app/src/islands/pages/guest-leases/useGuestLeasesPageLogic.js`
- **Hook Type:** Data Fetching
- **Missing Tests:**
  - [ ] Fetches guest's leases
  - [ ] Active vs past leases

#### useHostLeasesPageLogic
- **File:** `app/src/islands/pages/HostLeasesPage/useHostLeasesPageLogic.js`
- **Hook Type:** Data Fetching
- **Missing Tests:**
  - [ ] Fetches host's leases
  - [ ] Aggregate statistics

#### useViewSplitLeaseLogic
- **File:** `app/src/islands/pages/ViewSplitLeasePage/useViewSplitLeaseLogic.ts`
- **Hook Type:** Data Fetching
- **Missing Tests:**
  - [ ] Fetches listing details
  - [ ] Pricing calculations
  - [ ] Schedule availability

#### useDataLookups
- **File:** `app/src/hooks/useDataLookups.js`
- **Hook Type:** Data Fetching
- **Missing Tests:**
  - [ ] Initializes lookups
  - [ ] Caches lookup data
  - [ ] Handles initialization state

#### useProposalManagePageLogic
- **File:** `app/src/islands/pages/ProposalManagePage/useProposalManagePageLogic.js`
- **Hook Type:** Data Fetching
- **Missing Tests:**
  - [ ] Fetches proposal by ID
  - [ ] CRUD operations

#### useLeasesOverviewPageLogic
- **File:** `app/src/islands/pages/LeasesOverviewPage/useLeasesOverviewPageLogic.js`
- **Hook Type:** Data Fetching
- **Missing Tests:**
  - [ ] Fetches all leases
  - [ ] Filtering and pagination

#### useListingsOverviewPageLogic
- **File:** `app/src/islands/pages/ListingsOverviewPage/useListingsOverviewPageLogic.js`
- **Hook Type:** Data Fetching
- **Missing Tests:**
  - [ ] Fetches all listings
  - [ ] Statistics aggregation

#### useManageRentalApplicationsPageLogic
- **File:** `app/src/islands/pages/ManageRentalApplicationsPage/useManageRentalApplicationsPageLogic.js`
- **Hook Type:** Data Fetching
- **Missing Tests:**
  - [ ] Fetches applications
  - [ ] Status updates

#### useManageVirtualMeetingsPageLogic
- **File:** `app/src/islands/pages/ManageVirtualMeetingsPage/useManageVirtualMeetingsPageLogic.js`
- **Hook Type:** Data Fetching
- **Missing Tests:**
  - [ ] Fetches meetings
  - [ ] Meeting CRUD

#### useAdminThreadsPageLogic
- **File:** `app/src/islands/pages/AdminThreadsPage/useAdminThreadsPageLogic.js`
- **Hook Type:** Data Fetching
- **Missing Tests:**
  - [ ] Fetches all threads
  - [ ] Message moderation

---

### 3. Form State Hooks (12 hooks) - MEDIUM PRIORITY

#### useRentalApplicationPageLogic
- **File:** `app/src/islands/pages/useRentalApplicationPageLogic.js`
- **Hook Type:** Form State
- **Has Test File:** No
- **Missing Tests:**
  - [ ] Multi-step form navigation
  - [ ] Form validation
  - [ ] Draft persistence
  - [ ] Submission flow
  - [ ] Error handling

#### useRentalApplicationWizardLogic
- **File:** `app/src/islands/shared/RentalApplicationWizardModal/useRentalApplicationWizardLogic.js`
- **Hook Type:** Form State
- **Missing Tests:**
  - [ ] Wizard navigation (next, previous)
  - [ ] Step validation
  - [ ] Progress tracking

#### useRentalApplicationStore
- **File:** `app/src/islands/pages/RentalApplicationPage/store/useRentalApplicationStore.ts`
- **Hook Type:** Form State (Zustand)
- **Missing Tests:**
  - [ ] State initialization
  - [ ] State updates
  - [ ] Reset functionality

#### useListingStore
- **File:** `app/src/islands/pages/SelfListingPage/store/useListingStore.ts`
- **Hook Type:** Form State (Zustand)
- **Missing Tests:**
  - [ ] State initialization
  - [ ] localStorage persistence
  - [ ] Reset functionality

#### useEditListingDetailsLogic
- **File:** `app/src/islands/shared/EditListingDetails/useEditListingDetailsLogic.js`
- **Hook Type:** Form State
- **Missing Tests:**
  - [ ] Field editing
  - [ ] Validation
  - [ ] Save/submit
  - [ ] Cancel/rollback

#### usePricingLogic
- **File:** `app/src/islands/pages/ListingDashboardPage/components/PricingEditSection/usePricingLogic.js`
- **Hook Type:** Form State
- **Missing Tests:**
  - [ ] Pricing validation
  - [ ] Price calculations
  - [ ] Min/max enforcement

#### useModifyListingsPageLogic
- **File:** `app/src/islands/pages/ModifyListingsPage/useModifyListingsPageLogic.js`
- **Hook Type:** Form State
- **Missing Tests:**
  - [ ] Bulk selection
  - [ ] Bulk edit operations

#### useAccountProfilePageLogic
- **File:** `app/src/islands/pages/AccountProfilePage/useAccountProfilePageLogic.js`
- **Hook Type:** Form State
- **Missing Tests:**
  - [ ] Profile editing
  - [ ] Validation

#### useCreateDocumentPageLogic
- **File:** `app/src/islands/pages/CreateDocumentPage/useCreateDocumentPageLogic.js`
- **Hook Type:** Form State
- **Missing Tests:**
  - [ ] Document generation

#### useVerifyUsersPageLogic
- **File:** `app/src/islands/pages/useVerifyUsersPageLogic.js`
- **Hook Type:** Form State
- **Missing Tests:**
  - [ ] User verification actions

#### useEmailSmsUnitPageLogic
- **File:** `app/src/islands/pages/useEmailSmsUnitPageLogic.js`
- **Hook Type:** Form State
- **Missing Tests:**
  - [ ] Settings updates

#### useManageInformationalTextsPageLogic
- **File:** `app/src/islands/pages/useManageInformationalTextsPageLogic.js`
- **Hook Type:** Form State
- **Missing Tests:**
  - [ ] CMS content editing

---

### 4. Schedule/Day Selection Hooks (3 hooks) - HIGH PRIORITY

#### useScheduleSelector
- **File:** `app/src/islands/shared/useScheduleSelector.js`
- **Hook Type:** Schedule Selection
- **Has Test File:** No
- **Missing Tests:**
  - [ ] Initial state (empty selected days)
  - [ ] Add single day
  - [ ] Add multiple days
  - [ ] Remove day
  - [ ] Contiguity validation
  - [ ] Min/max nights enforcement
  - [ ] Check-in/out day calculations
  - [ ] Pricing recalculation
  - [ ] Blocked dates handling

#### useScheduleSelectorLogicCore
- **File:** `app/src/islands/shared/useScheduleSelectorLogicCore.js`
- **Hook Type:** Schedule Selection (Logic Core)
- **Has Test File:** No
- **Missing Tests:**
  - [ ] `isScheduleContiguous()` function
  - [ ] `calculateCheckInOutDays()` function
  - [ ] `calculateNightsFromDays()` function
  - [ ] Night-to-day conversion
  - [ ] Edge cases (single day, full week)

#### useAvailabilityLogic
- **File:** `app/src/islands/pages/ListingDashboardPage/hooks/useAvailabilityLogic.js`
- **Hook Type:** Schedule Management
- **Missing Tests:**
  - [ ] Fetch blocked dates
  - [ ] Add blocked date
  - [ ] Remove blocked date
  - [ ] Lease term validation

---

### 5. UI/Interaction Hooks (18 hooks) - LOW/MEDIUM PRIORITY

#### useImageCarousel
- **File:** `app/src/hooks/useImageCarousel.js`
- **Hook Type:** UI/Navigation
- **Missing Tests:**
  - [ ] Initial index is 0
  - [ ] Next increments index
  - [ ] Previous decrements index
  - [ ] Loops to end when at start
  - [ ] Loops to start when at end
  - [ ] goToIndex sets specific index

#### usePhotoManagement
- **File:** `app/src/islands/pages/ListingDashboardPage/hooks/usePhotoManagement.js`
- **Hook Type:** UI/CRUD
- **Missing Tests:**
  - [ ] Set cover photo
  - [ ] Reorder photos
  - [ ] Delete photo

#### useAIImportAssistant
- **File:** `app/src/islands/pages/ListingDashboardPage/hooks/useAIImportAssistant.js`
- **Hook Type:** UI/Async
- **Missing Tests:**
  - [ ] AI generation states
  - [ ] Service loading

#### useCancellationLogic
- **File:** `app/src/islands/pages/ListingDashboardPage/hooks/useCancellationLogic.js`
- **Hook Type:** UI/Validation
- **Missing Tests:**
  - [ ] Policy validation
  - [ ] Update operations

#### useToast
- **File:** `app/src/islands/shared/Toast.jsx`
- **Hook Type:** UI/Notification
- **Missing Tests:**
  - [ ] Show toast
  - [ ] Auto-dismiss
  - [ ] Manual dismiss

#### useCompareTermsModalLogic
- **File:** `app/src/islands/modals/useCompareTermsModalLogic.js`
- **Hook Type:** UI/Modal
- **Missing Tests:**
  - [ ] Open modal
  - [ ] Close modal

#### useCTAHandler
- **File:** `app/src/islands/pages/MessagingPage/useCTAHandler.js`
- **Hook Type:** UI/Interaction
- **Missing Tests:**
  - [ ] Message action handlers

#### useUsabilityPopupLogic
- **File:** `app/src/islands/shared/UsabilityPopup/useUsabilityPopupLogic.js`
- **Hook Type:** UI/Modal
- **Missing Tests:**
  - [ ] Popup display logic

#### useHeaderMessagingPanelLogic
- **File:** `app/src/islands/shared/HeaderMessagingPanel/useHeaderMessagingPanelLogic.js`
- **Hook Type:** UI/Interaction
- **Missing Tests:**
  - [ ] Panel open/close
  - [ ] Unread count

#### useHostMenuData
- **File:** `app/src/islands/shared/Header/useHostMenuData.js`
- **Hook Type:** UI/Navigation
- **Missing Tests:**
  - [ ] Menu data fetch

#### useGuestMenuData
- **File:** `app/src/islands/shared/Header/useGuestMenuData.js`
- **Hook Type:** UI/Navigation
- **Missing Tests:**
  - [ ] Menu data fetch

#### useQRCodeDashboardLogic
- **File:** `app/src/islands/shared/QRCodeDashboard/useQRCodeDashboardLogic.js`
- **Hook Type:** UI/Async
- **Missing Tests:**
  - [ ] QR code generation

#### useNotificationSettings
- **File:** `app/src/islands/shared/NotificationSettingsIsland/useNotificationSettings.js`
- **Hook Type:** UI/Settings
- **Missing Tests:**
  - [ ] Load preferences
  - [ ] Save preferences

#### useSignUpTrialHostLogic
- **File:** `app/src/islands/shared/SignUpTrialHost/useSignUpTrialHostLogic.js`
- **Hook Type:** UI/Auth
- **Missing Tests:**
  - [ ] Trial signup flow

#### useReminderHouseManualLogic
- **File:** `app/src/islands/shared/ReminderHouseManual/useReminderHouseManualLogic.js`
- **Hook Type:** UI/Async
- **Missing Tests:**
  - [ ] Reminder scheduling

#### useVisitReviewerHouseManualLogic
- **File:** `app/src/islands/shared/VisitReviewerHouseManual/useVisitReviewerHouseManualLogic.js`
- **Hook Type:** UI/Async
- **Missing Tests:**
  - [ ] Review workflow

#### useDeviceDetection
- **File:** `app/src/hooks/useDeviceDetection.js`
- **Hook Type:** UI/Viewport
- **Missing Tests:**
  - [ ] Window resize detection
  - [ ] useIsMobile
  - [ ] useIsDesktop
  - [ ] useIsTablet

#### useProposalButtonStates
- **File:** `app/src/hooks/useProposalButtonStates.js`
- **Hook Type:** UI/Computed
- **Missing Tests:**
  - [ ] computeProposalButtonStates
  - [ ] State based on proposal status

---

### 6. AI/ML Feature Hooks (5 hooks) - LOW/MEDIUM PRIORITY

#### useAIToolsState
- **File:** `app/src/islands/shared/AITools/useAIToolsState.js`
- **Hook Type:** AI State
- **Missing Tests:**
  - [ ] Tool configuration state

#### useAISuggestionsState
- **File:** `app/src/islands/shared/AISuggestions/useAISuggestionsState.js`
- **Hook Type:** AI State
- **Missing Tests:**
  - [ ] Suggestion generation state

#### useRoomRedesign
- **File:** `app/src/islands/shared/AIRoomRedesign/useRoomRedesign.js`
- **Hook Type:** AI Async
- **Missing Tests:**
  - [ ] Generation states
  - [ ] Result handling

#### useFileUpload
- **File:** `app/src/islands/shared/AIRoomRedesign/useFileUpload.js`
- **Hook Type:** File Upload
- **Missing Tests:**
  - [ ] Upload progress
  - [ ] Error handling

#### useAiToolsPageLogic
- **File:** `app/src/islands/pages/AiToolsPage/useAiToolsPageLogic.js`
- **Hook Type:** AI UI
- **Missing Tests:**
  - [ ] Tools page state

---

### 7. Page-Specific Logic Hooks (24 hooks) - MEDIUM/LOW PRIORITY

#### useListingDashboardPageLogic
- **File:** `app/src/islands/pages/ListingDashboardPage/useListingDashboardPageLogic.js`
- **Missing Tests:**
  - [ ] Page state initialization
  - [ ] Tab navigation

#### useMessagingPageLogic
- **File:** `app/src/islands/pages/MessagingPage/useMessagingPageLogic.js`
- **Missing Tests:**
  - [ ] Thread loading
  - [ ] Message sending

#### useCreateSuggestedProposalLogic
- **File:** `app/src/islands/pages/CreateSuggestedProposalPage/useCreateSuggestedProposalLogic.js`
- **Missing Tests:**
  - [ ] Proposal creation flow

#### useQuickPricePageLogic
- **File:** `app/src/islands/pages/QuickPricePage/useQuickPricePageLogic.js`
- **Missing Tests:**
  - [ ] Pricing calculator

#### useQuickMatchPageLogic
- **File:** `app/src/islands/pages/useQuickMatchPageLogic.js`
- **Missing Tests:**
  - [ ] Matching algorithm

#### useGuestRelationshipsDashboardLogic
- **File:** `app/src/islands/pages/GuestRelationshipsDashboard/useGuestRelationshipsDashboardLogic.js`
- **Missing Tests:**
  - [ ] Relationship data loading

#### useHouseManualPageLogic
- **File:** `app/src/islands/pages/HouseManualPage/useHouseManualPageLogic.js`
- **Missing Tests:**
  - [ ] Manual CRUD

#### useReportEmergencyPageLogic
- **File:** `app/src/islands/pages/ReportEmergencyPage/useReportEmergencyPageLogic.js`
- **Missing Tests:**
  - [ ] Emergency reporting

#### useInternalEmergencyPageLogic
- **File:** `app/src/islands/pages/InternalEmergencyPage/useInternalEmergencyPageLogic.js`
- **Missing Tests:**
  - [ ] Emergency management

#### useGuestSimulationLogic
- **File:** `app/src/islands/pages/GuestSimulationPage/useGuestSimulationLogic.js`
- **Missing Tests:**
  - [ ] Simulation flow

#### useExperienceResponsesPageLogic
- **File:** `app/src/islands/pages/ExperienceResponsesPage/useExperienceResponsesPageLogic.js`
- **Missing Tests:**
  - [ ] Experience management

#### useAuthVerifyPageLogic
- **File:** `app/src/islands/pages/AuthVerifyPage/useAuthVerifyPageLogic.js`
- **Missing Tests:**
  - [ ] Auth verification

#### useSendMagicLoginLinksPageLogic
- **File:** `app/src/islands/pages/SendMagicLoginLinksPage/useSendMagicLoginLinksPageLogic.js`
- **Missing Tests:**
  - [ ] Magic link sending

#### useCoHostRequestsPageLogic
- **File:** `app/src/islands/pages/CoHostRequestsPage/useCoHostRequestsPageLogic.js`
- **Missing Tests:**
  - [ ] Co-host request management

#### useSimulationGuestsideDemoPageLogic
- **File:** `app/src/islands/pages/SimulationGuestsideDemoPage/useSimulationGuestsideDemoPageLogic.js`
- **Missing Tests:**
  - [ ] Guest simulation

#### useSimulationHostsideDemoPageLogic
- **File:** `app/src/islands/pages/SimulationHostsideDemoPage/useSimulationHostsideDemoPageLogic.js`
- **Missing Tests:**
  - [ ] Host simulation

#### useSimulationGuestMobilePageLogic
- **File:** `app/src/islands/pages/SimulationGuestMobilePage/useSimulationGuestMobilePageLogic.js`
- **Missing Tests:**
  - [ ] Mobile guest simulation

#### useSimulationHostMobilePageLogic
- **File:** `app/src/islands/pages/SimulationHostMobilePage/useSimulationHostMobilePageLogic.js`
- **Missing Tests:**
  - [ ] Mobile host simulation

#### useSimulationAdminPageLogic
- **File:** `app/src/islands/pages/SimulationAdminPage/useSimulationAdminPageLogic.js`
- **Missing Tests:**
  - [ ] Admin simulation

#### useMessageCurationPageLogic
- **File:** `app/src/islands/pages/MessageCurationPage/useMessageCurationPageLogic.js`
- **Missing Tests:**
  - [ ] Message moderation

#### useSuggestedProposals
- **File:** `app/src/islands/shared/SuggestedProposals/useSuggestedProposals.js`
- **Missing Tests:**
  - [ ] Suggestion loading

#### useUsabilityDataManagementPageLogic
- **File:** `app/src/islands/pages/UsabilityDataManagementPage/useUsabilityDataManagementPageLogic.js`
- **Missing Tests:**
  - [ ] Data export/management

#### useModifyListingsPageLogic
- **File:** `app/src/islands/pages/ModifyListingsPage/useModifyListingsPageLogic.js`
- **Missing Tests:**
  - [ ] Bulk edit operations

#### useAccountProfilePageLogic
- **File:** `app/src/islands/pages/AccountProfilePage/useAccountProfilePageLogic.js`
- **Missing Tests:**
  - [ ] Profile editing

---

## Data Fetching Hook Gaps

### Hooks Without Async Tests
| Hook | Returns Loading | Returns Error | Has Test |
|------|-----------------|---------------|----------|
| useListingData | Yes | Yes | **No** |
| useSearchPageLogic | Yes | Yes | **No** |
| useHostOverviewPageLogic | Yes | Yes | **No** |
| useHostProposalsPageLogic | Yes | Yes | **No** |
| useGuestProposalsPageLogic | Yes | Yes | **No** |
| useGuestLeasesPageLogic | Yes | Yes | **No** |
| useHostLeasesPageLogic | Yes | Yes | **No** |
| useViewSplitLeaseLogic | Yes | Yes | **No** |
| useDataLookups | Yes | Yes | **No** |
| useProposalManagePageLogic | Yes | Yes | **No** |
| useLeasesOverviewPageLogic | Yes | Yes | **No** |
| useListingsOverviewPageLogic | Yes | Yes | **No** |
| useManageRentalApplicationsPageLogic | Yes | Yes | **No** |
| useManageVirtualMeetingsPageLogic | Yes | Yes | **No** |
| useAdminThreadsPageLogic | Yes | Yes | **No** |

### Missing Async Test Cases
- [ ] Returns loading state initially
- [ ] Returns data on success
- [ ] Returns error on failure
- [ ] Refetches when dependencies change
- [ ] Handles empty response
- [ ] Parallel data fetching with Promise.all()

---

## Form State Hook Gaps

### Hooks Without State Tests
| Hook | Has Validation | Has Computed | Has Test |
|------|----------------|--------------|----------|
| useRentalApplicationPageLogic | Yes | Yes | **No** |
| useRentalApplicationWizardLogic | Yes | Yes | **No** |
| useRentalApplicationStore | No | No | **No** |
| useListingStore | No | No | **No** |
| useEditListingDetailsLogic | Yes | Yes | **No** |
| usePricingLogic | Yes | Yes | **No** |
| useModifyListingsPageLogic | No | No | **No** |
| useAccountProfilePageLogic | Yes | No | **No** |
| useCreateDocumentPageLogic | No | No | **No** |
| useVerifyUsersPageLogic | No | No | **No** |
| useEmailSmsUnitPageLogic | No | No | **No** |
| useManageInformationalTextsPageLogic | No | No | **No** |

### Missing State Test Cases
- [ ] Initial state values
- [ ] State updates via setters
- [ ] Validation error calculation
- [ ] Computed value calculation
- [ ] Reset to initial state
- [ ] Dirty state detection

---

## Auth Hook Gaps

### Hooks Without Context Tests
| Hook | Context Required | Provider Wrapper | Has Test |
|------|------------------|------------------|----------|
| useAuthenticatedUser | AuthContext | No | **No** |
| useListingAuth | AuthContext | No | **No** |
| useSearchPageAuth | AuthContext | No | **No** |
| useLoggedInAvatarData | AuthContext | No | **No** |
| useIdentityVerificationLogic | AuthContext | No | **No** |

### Missing Context Test Cases
- [ ] Returns null when not authenticated
- [ ] Returns user when authenticated
- [ ] Login function works
- [ ] Logout function works
- [ ] Token validation flow
- [ ] Session metadata fallback

---

## Utility Hook Gaps

### Hooks Without Utility Tests
| Hook | Side Effects | Cleanup | Has Test |
|------|--------------|---------|----------|
| useImageCarousel | None | No | **No** |
| useDeviceDetection | Resize listener | Yes | **No** |
| useProposalButtonStates | None | No | **No** |
| useToast | Timer | Yes | **No** |

### Missing Utility Test Cases
- [ ] useImageCarousel: navigation (next/prev/goTo)
- [ ] useDeviceDetection: resize event listener
- [ ] useToast: auto-dismiss timer
- [ ] useProposalButtonStates: computed states

---

## Schedule Hook Gaps (HIGH PRIORITY)

### Hooks Without Schedule Tests
| Hook | Has Validation | Has Computed | Has Test |
|------|----------------|--------------|----------|
| useScheduleSelector | Yes | Yes | **No** |
| useScheduleSelectorLogicCore | Yes | Yes | **No** |
| useAvailabilityLogic | Yes | No | **No** |

### Missing Schedule Test Cases
- [ ] Add single day
- [ ] Add multiple days
- [ ] Remove day
- [ ] Contiguity validation
- [ ] Min/max nights enforcement
- [ ] Check-in/out day calculations
- [ ] Night-to-day conversion
- [ ] Blocked dates management

---

## act() Usage Gaps

### Hooks With Missing act() Wrapping
| Hook | State Updates | Wrapped in act() |
|------|---------------|------------------|
| useImageCarousel | next, prev, goToIndex | **No** |
| useScheduleSelector | selectDay, removeDay | **No** |
| useRentalApplicationPageLogic | setFormData, nextStep | **No** |
| useEditListingDetailsLogic | setField, save | **No** |
| useToast | show, dismiss | **No** |

---

## Rerender Test Gaps

### Hooks Without Rerender Tests
| Hook | Has Dependencies | Rerender Test |
|------|------------------|---------------|
| useSearchPageLogic | category, dates | **No** |
| useViewSplitLeaseLogic | listingId | **No** |
| useScheduleSelector | listingId, availability | **No** |
| useDataLookups | lookup keys | **No** |

---

## Cleanup Test Gaps

### Hooks Without Cleanup Tests
| Hook | Has Cleanup | Cleanup Test |
|------|-------------|--------------|
| useDeviceDetection | Yes (resize listener) | **No** |
| useToast | Yes (timer) | **No** |
| useDataLookups | Yes (cache) | **No** |

---

## Hooks with Good Coverage (Reference)

**NONE** - No hooks currently have test coverage with `renderHook()`.

The only test file in the codebase (`calculateMatchScore.test.js`) tests a pure function, not a custom hook.

---

## Recommended Test Patterns

### Basic Hook Test Template

```javascript
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useMyHook } from './useMyHook';

describe('useMyHook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial state', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current.value).toBe(initialValue);
  });

  it('updates state on action', () => {
    const { result } = renderHook(() => useMyHook());

    act(() => {
      result.current.setValue('new value');
    });

    expect(result.current.value).toBe('new value');
  });
});
```

### Async Hook Test Template

```javascript
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import { useDataFetchingHook } from './useDataFetchingHook';

describe('useDataFetchingHook', () => {
  it('returns loading state initially', () => {
    const { result } = renderHook(() => useDataFetchingHook());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('fetches and returns data', async () => {
    server.use(
      http.get('*/rest/v1/listings', () => {
        return HttpResponse.json([
          { id: '1', title: 'Studio' },
          { id: '2', title: 'Room' },
        ]);
      })
    );

    const { result } = renderHook(() => useDataFetchingHook());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.error).toBeNull();
  });

  it('handles fetch error', async () => {
    server.use(
      http.get('*/rest/v1/listings', () => {
        return HttpResponse.json({ error: 'Server error' }, { status: 500 });
      })
    );

    const { result } = renderHook(() => useDataFetchingHook());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.data).toBeNull();
  });

  it('refetches when dependencies change', async () => {
    let fetchCount = 0;

    server.use(
      http.get('*/rest/v1/listings', () => {
        fetchCount++;
        return HttpResponse.json([{ id: '1' }]);
      })
    );

    const { result, rerender } = renderHook(
      ({ category }) => useDataFetchingHook({ category }),
      { initialProps: { category: 'apartment' } }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetchCount).toBe(1);

    rerender({ category: 'house' });

    await waitFor(() => {
      expect(fetchCount).toBe(2);
    });
  });
});
```

### Auth Hook Test Template

```javascript
import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthenticatedUser } from './useAuthenticatedUser';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  validateTokenAndFetchUser: vi.fn(),
  checkAuthStatus: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

describe('useAuthenticatedUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when not authenticated', async () => {
    const { result } = renderHook(() => useAuthenticatedUser());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('returns user when authenticated', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };

    vi.mocked(validateTokenAndFetchUser).mockResolvedValueOnce(mockUser);

    const { result } = renderHook(() => useAuthenticatedUser());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('logs out and clears user state', async () => {
    const { result } = renderHook(() => useAuthenticatedUser());

    // First login
    vi.mocked(validateTokenAndFetchUser).mockResolvedValueOnce({
      id: 'user-123',
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    // Then logout
    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
```

### Schedule Selector Test Template

```javascript
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useScheduleSelector } from './useScheduleSelector';

describe('useScheduleSelector', () => {
  const mockListing = {
    id: 'listing-1',
    price_per_night: 100,
    minimum_nights: 2,
    maximum_nights: 30,
  };

  it('initializes with empty selection', () => {
    const { result } = renderHook(() =>
      useScheduleSelector(mockListing, [])
    );

    expect(result.current.selectedDays).toEqual([]);
    expect(result.current.nights).toBe(0);
    expect(result.current.isValid).toBe(false);
  });

  it('adds a single day', () => {
    const { result } = renderHook(() =>
      useScheduleSelector(mockListing, [])
    );

    act(() => {
      result.current.toggleDay(3); // Wednesday
    });

    expect(result.current.selectedDays).toEqual([3]);
  });

  it('adds multiple contiguous days', () => {
    const { result } = renderHook(() =>
      useScheduleSelector(mockListing, [])
    );

    act(() => {
      result.current.toggleDay(1); // Monday
      result.current.toggleDay(2); // Tuesday
      result.current.toggleDay(3); // Wednesday
    });

    expect(result.current.selectedDays).toEqual([1, 2, 3]);
    expect(result.current.nights).toBe(2);
    expect(result.current.isValid).toBe(true);
  });

  it('rejects non-contiguous days', () => {
    const { result } = renderHook(() =>
      useScheduleSelector(mockListing, [])
    );

    act(() => {
      result.current.toggleDay(1); // Monday
      result.current.toggleDay(3); // Wednesday (should fail)
    });

    expect(result.current.selectedDays).toEqual([1]);
    expect(result.current.error).toBe('Selected days must be contiguous');
  });

  it('enforces minimum nights', () => {
    const { result } = renderHook(() =>
      useScheduleSelector(mockListing, [])
    );

    act(() => {
      result.current.toggleDay(1); // Monday
    });

    // 1 night selected, but minimum is 2
    expect(result.current.isValid).toBe(false);
    expect(result.current.error).toContain('minimum');
  });

  it('removes a day', () => {
    const { result } = renderHook(() =>
      useScheduleSelector(mockListing, [])
    );

    act(() => {
      result.current.toggleDay(1);
      result.current.toggleDay(2);
      result.current.toggleDay(3);
    });

    expect(result.current.selectedDays).toEqual([1, 2, 3]);

    act(() => {
      result.current.toggleDay(2);
    });

    expect(result.current.selectedDays).toEqual([1, 3]);
    expect(result.current.isValid).toBe(false);
  });

  it('calculates check-in/out days', () => {
    const { result } = renderHook(() =>
      useScheduleSelector(mockListing, [])
    );

    act(() => {
      result.current.toggleDay(1); // Monday
      result.current.toggleDay(2); // Tuesday
      result.current.toggleDay(3); // Wednesday
    });

    expect(result.current.checkInDay).toBe(1);
    expect(result.current.checkOutDay).toBe(4); // Day after last selected
  });
});
```

### Form State Hook Test Template

```javascript
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useRentalApplicationPageLogic } from './useRentalApplicationPageLogic';

describe('useRentalApplicationPageLogic', () => {
  it('initializes with default state', () => {
    const { result } = renderHook(() => useRentalApplicationPageLogic());

    expect(result.current.step).toBe(1);
    expect(result.current.formData).toEqual({});
    expect(result.current.isValid).toBe(false);
  });

  it('advances to next step when valid', () => {
    const { result } = renderHook(() => useRentalApplicationPageLogic());

    act(() => {
      result.current.setField('firstName', 'John');
      result.current.setField('lastName', 'Doe');
      result.current.nextStep();
    });

    expect(result.current.step).toBe(2);
  });

  it('prevents advancing when invalid', () => {
    const { result } = renderHook(() => useRentalApplicationPageLogic());

    act(() => {
      result.current.nextStep(); // No data entered
    });

    expect(result.current.step).toBe(1);
    expect(result.current.errors).toBeDefined();
  });

  it('goes back to previous step', () => {
    const { result } = renderHook(() => useRentalApplicationPageLogic());

    act(() => {
      result.current.setField('firstName', 'John');
      result.current.setField('lastName', 'Doe');
      result.current.nextStep();
    });

    expect(result.current.step).toBe(2);

    act(() => {
      result.current.previousStep();
    });

    expect(result.current.step).toBe(1);
  });

  it('resets form', () => {
    const { result } = renderHook(() => useRentalApplicationPageLogic());

    act(() => {
      result.current.setField('firstName', 'John');
      result.current.setField('lastName', 'Doe');
      result.current.reset();
    });

    expect(result.current.step).toBe(1);
    expect(result.current.formData).toEqual({});
  });

  it('validates required fields', () => {
    const { result } = renderHook(() => useRentalApplicationPageLogic());

    act(() => {
      result.current.setField('email', 'invalid-email');
      result.current.validate();
    });

    expect(result.current.errors.email).toBe('Invalid email format');
  });
});
```

---

## Test File Locations to Create

Based on the codebase structure, test files should be co-located:

```
app/src/hooks/__tests__/
  ├── useAuthenticatedUser.test.js
  ├── useImageCarousel.test.js
  ├── useDataLookups.test.js
  ├── useProposalButtonStates.test.js
  └── useDeviceDetection.test.js

app/src/islands/pages/__tests__/
  ├── useSearchPageLogic.test.js
  ├── useSearchPageAuth.test.js
  ├── useRentalApplicationPageLogic.test.js
  └── useViewSplitLeaseLogic.test.ts

app/src/islands/pages/ListingDashboardPage/__tests__/
  ├── useListingDashboardPageLogic.test.js
  └── hooks/
      ├── useListingData.test.js
      ├── useListingAuth.test.js
      ├── usePhotoManagement.test.js
      ├── useAIImportAssistant.test.js
      ├── useAvailabilityLogic.test.js
      └── useCancellationLogic.test.js

app/src/islands/shared/__tests__/
  ├── useScheduleSelector.test.js
  ├── useScheduleSelectorLogicCore.test.js
  ├── useEditListingDetailsLogic.test.js
  └── useToast.test.js
```

---

## Mocking Requirements

### Supabase Client Mock

```javascript
// __mocks__/@/lib/supabase.js
export const supabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn(),
  maybeSingle: vi.fn(),
  rpc: vi.fn(),
  auth: {
    getSession: vi.fn(),
    getUser: vi.fn(),
  },
};
```

### Auth Library Mock

```javascript
// __mocks__/@/lib/auth.js
export const validateTokenAndFetchUser = vi.fn();
export const checkAuthStatus = vi.fn();
export const getUserId = vi.fn();
export const secureStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
```

### Logger Mock

```javascript
// __mocks__/@/lib/logger.js
export const logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};
```

### MSW Setup

```javascript
// mocks/server.js
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const server = setupServer(
  // Supabase listings endpoint
  http.get('*/rest/v1/listings', ({ request }) => {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (id) {
      return HttpResponse.json({
        id,
        title: 'Test Listing',
        price_per_night: 100,
      });
    }

    return HttpResponse.json([
      { id: '1', title: 'Listing 1' },
      { id: '2', title: 'Listing 2' },
    ]);
  }),

  // Supabase auth endpoint
  http.get('*/auth/v1/user', () => {
    return HttpResponse.json({
      id: 'user-123',
      email: 'test@example.com',
    });
  }),

  // Supabase RPC endpoint
  http.post('*/rest/v1/rpc/*', () => {
    return HttpResponse.json({});
  }),
);
```

---

## Priority Implementation Order

### Phase 1: Critical Infrastructure (Week 1)
1. Set up MSW server and mocks
2. Create test utilities (renderHook wrappers)
3. Test `useAuthenticatedUser` - Core auth hook

### Phase 2: Core User Flows (Weeks 2-3)
4. Test `useSearchPageLogic` - Search functionality
5. Test `useScheduleSelector` - Scheduling logic
6. Test `useScheduleSelectorLogicCore` - Scheduling calculations
7. Test `useListingData` - Listing CRUD

### Phase 3: Form State (Week 4)
8. Test `useRentalApplicationPageLogic` - Application flow
9. Test `useEditListingDetailsLogic` - Listing editing
10. Test `usePricingLogic` - Pricing calculations

### Phase 4: Page Logic (Weeks 5-6)
11. Test `useViewSplitLeaseLogic` - Listing detail page
12. Test `useGuestProposalsPageLogic` - Guest proposals
13. Test `useHostProposalsPageLogic` - Host proposals
14. Test `useListingDashboardPageLogic` - Host dashboard

### Phase 5: UI & Utility Hooks (Week 7+)
15. Test remaining UI hooks as needed
16. Test remaining page logic hooks as needed

---

## Summary

This audit identified **82 custom React hooks** in the Split Lease codebase, with **81 hooks (98.8%) lacking test coverage** using `renderHook()` from React Testing Library.

### Key Findings:
- **No hooks are currently tested** with `renderHook()`
- **No async patterns** are tested with `waitFor()`
- **No state updates** are wrapped in `act()`
- **No context providers** are mocked for auth-dependent hooks
- **No MSW integration** exists for API mocking

### Highest Priority Hooks:
1. `useAuthenticatedUser` - Core authentication
2. `useSearchPageLogic` - Core search functionality
3. `useScheduleSelector` - Critical scheduling logic
4. `useListingData` - Listing CRUD operations
5. `useRentalApplicationPageLogic` - Critical user flow

### Next Steps:
1. Set up test infrastructure (MSW, mock providers)
2. Create test utilities for common patterns
3. Implement tests for high-priority hooks
4. Establish CI/CD integration for test runs

---

**Report Generated:** 2026-01-27T11:55:08Z
**Total Hooks Audited:** 82
**Hooks Needing Tests:** 81
**Test Coverage:** 1.2%
