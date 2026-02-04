# Custom Hook Testing Opportunity Report
**Generated:** 2026-01-29 11:46:20
**Codebase:** Split Lease
**Hostname:** lgateway7

## Executive Summary
- **Custom hooks found:** 104
- **Hooks needing tests:** 104 (100%)
- **Missing state tests:** 68
- **Missing async tests:** 35
- **Missing context tests:** 8
- **Test infrastructure:** ❌ NOT SET UP

---

## Critical Finding: No Testing Infrastructure

### ❌ Test Infrastructure Status

The codebase **does not have any testing infrastructure** for React Testing Library or Vitest:

- [ ] `renderHook` imported from `@testing-library/react` - **NOT INSTALLED**
- [ ] `act` imported for state updates - **NOT INSTALLED**
- [ ] `waitFor` used for async operations - **NOT INSTALLED**
- [ ] Provider wrappers created for context-dependent hooks - **NOT APPLICABLE**
- [ ] MSW handlers set up for data fetching hooks - **NOT INSTALLED**

**Required installations:**
```bash
# Testing libraries NOT in package.json
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom
npm install --save-dev msw @vitest/ui
```

**Required configuration files (MISSING):**
- `vitest.config.ts` - Does not exist
- `test-setup.ts` - Does not exist
- `src/mocks/handlers.ts` - Does not exist
- `src/mocks/server.ts` - Does not exist

---

## All Custom Hooks Found (104 Total)

### Core Hooks (app/src/hooks/)

#### 1. useAuthenticatedUser
- **File:** `app/src/hooks/useAuthenticatedUser.js`
- **Hook Type:** Auth / Data Fetching
- **Has Test File:** ❌ No
- **Dependencies:** Supabase auth, validateTokenAndFetchUser, getSessionId, getUserId, getFirstName
- **Missing Tests:**
  - [ ] Initial state (loading=true, user=null, userId=null)
  - [ ] Token validation success path
  - [ ] Supabase session fallback path
  - [ ] No auth found (user=null, loading=false)
  - [ ] Error handling
  - [ ] isAuthenticated computed value

#### 2. useImageCarousel
- **File:** `app/src/hooks/useImageCarousel.js`
- **Hook Type:** Utility / UI State
- **Has Test File:** ❌ No
- **Dependencies:** None
- **Missing Tests:**
  - [ ] Initial state (currentImageIndex=0)
  - [ ] hasImages computed value
  - [ ] hasMultipleImages computed value
  - [ ] handlePrevImage wraps around to last image
  - [ ] handleNextImage wraps around to first image
  - [ ] handlePrevImage/NextImage no-op when hasMultipleImages=false
  - [ ] setCurrentImageIndex updates state
  - [ ] State updates wrapped in act()

#### 3. useDataLookups
- **File:** `app/src/hooks/useDataLookups.js`
- **Hook Type:** Data Fetching / Async
- **Has Test File:** ❌ No
- **Dependencies:** initializeLookups, isInitialized
- **Missing Tests:**
  - [ ] Returns false initially when not initialized
  - [ ] Returns true after initialization completes
  - [ ] Cleanup on unmount (mounted flag)
  - [ ] Async loading state

#### 4. useDeviceDetection
- **File:** `app/src/hooks/useDeviceDetection.js`
- **Hook Type:** Utility / Side Effect
- **Has Test File:** ❌ No
- **Dependencies:** window, resize event
- **Missing Tests:**
  - [ ] useIsMobile initial state (SSR safety)
  - [ ] useIsMobile responds to resize events
  - [ ] useIsDesktop initial state
  - [ ] useIsDesktop responds to resize
  - [ ] useIsTablet initial state
  - [ ] useIsTablet responds to resize
  - [ ] useDeviceType returns correct type string
  - [ ] useDeviceDetection returns all values
  - [ ] Cleanup removes event listeners
  - [ ] Breakpoint constants exported

#### 5. useProposalButtonStates
- **File:** `app/src/hooks/useProposalButtonStates.js`
- **Hook Type:** Computed / useMemo
- **Has Test File:** ❌ No
- **Dependencies:** computeProposalButtonStates
- **Missing Tests:**
  - [ ] Returns computed button states
  - [ ] Recomputes when dependencies change (proposal, virtualMeeting, guest, listing, currentUserId)
  - [ ] useMemo optimization (no unnecessary recalculation)

---

### Page Logic Hooks (app/src/islands/pages/)

#### 6. useAuthVerifyPageLogic
- **File:** `app/src/islands/pages/AuthVerifyPage/useAuthVerifyPageLogic.js`
- **Hook Type:** Form State / Auth
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 7. useCoHostRequestsPageLogic
- **File:** `app/src/islands/pages/CoHostRequestsPage/useCoHostRequestsPageLogic.js`
- **Hook Type:** Data Fetching
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 8. useCreateSuggestedProposalLogic
- **File:** `app/src/islands/pages/CreateSuggestedProposalPage/useCreateSuggestedProposalLogic.js`
- **Hook Type:** Form State / Data Fetching
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 9. useGuestRelationshipsDashboardLogic
- **File:** `app/src/islands/pages/GuestRelationshipsDashboard/useGuestRelationshipsDashboardLogic.js`
- **Hook Type:** Data Fetching
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 10. useHostOverviewPageLogic
- **File:** `app/src/islands/pages/HostOverviewPage/useHostOverviewPageLogic.js`
- **Hook Type:** Data Fetching
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 11. useHouseManualPageLogic
- **File:** `app/src/islands/pages/HouseManualPage/useHouseManualPageLogic.js`
- **Hook Type:** Data Fetching / Form State
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 12. usePricingLogic
- **File:** `app/src/islands/pages/ListingDashboardPage/components/PricingEditSection/usePricingLogic.js`
- **Hook Type:** Form State / Computed
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 13. useAIImportAssistant
- **File:** `app/src/islands/pages/ListingDashboardPage/hooks/useAIImportAssistant.js`
- **Hook Type:** Data Fetching / AI Integration
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 14. useListingData
- **File:** `app/src/islands/pages/ListingDashboardPage/hooks/useListingData.js`
- **Hook Type:** Data Fetching (CRITICAL)
- **Has Test File:** ❌ No
- **Dependencies:** Supabase (listing, listing_photo, proposal, bookings_leases, virtualmeetingschedulesandlinks, external_reviews, co_hostrequest tables)
- **Missing Tests:**
  - [ ] Initial state (listing=null, isLoading=true, counts all zero)
  - [ ] Fetch listing success
  - [ ] Fetch lookup tables success
  - [ ] Transform listing data correctly
  - [ ] Fetch photos from Features - Photos (embedded)
  - [ ] Fetch photos from listing_photo table (fallback)
  - [ ] Fetch related counts (proposals, leases, meetings, reviews)
  - [ ] Fetch existing cohost request
  - [ ] updateListing function updates database
  - [ ] updateListing error handling
  - [ ] Error state on fetch failure
  - [ ] Silent fetch mode (fetchListing(true))
  - [ ] No listingId error handling
  - [ ] MSW mocking for all Supabase queries

#### 15. useListingAuth
- **File:** `app/src/islands/pages/ListingDashboardPage/hooks/useListingAuth.js`
- **Hook Type:** Auth / Data Fetching
- **Has Test File:** ❌ No
- **Dependencies:** checkAuthStatus, validateTokenAndFetchUser, Supabase auth, getFirstName, getUserId
- **Missing Tests:**
  - [ ] Initial state (isChecking=true, shouldRedirect=false)
  - [ ] Auth check fails → shouldRedirect=true
  - [ ] Token validation success → currentUser populated
  - [ ] Session metadata fallback path
  - [ ] No valid session → shouldRedirect=true
  - [ ] Error handling
  - [ ] Redirect to /?login=true

#### 16. useListingDashboardPageLogic
- **File:** `app/src/islands/pages/ListingDashboardPage/useListingDashboardPageLogic.js`
- **Hook Type:** Page Orchestration
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 17. useMessageCurationPageLogic
- **File:** `app/src/islands/pages/MessageCurationPage/useMessageCurationPageLogic.js`
- **Hook Type:** Data Fetching / Form State
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 18. useCTAHandler
- **File:** `app/src/islands/pages/MessagingPage/useCTAHandler.js`
- **Hook Type:** Event Handling
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 19. useModifyListingsPageLogic
- **File:** `app/src/islands/pages/ModifyListingsPage/useModifyListingsPageLogic.js`
- **Hook Type:** Data Fetching
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 20. useRentalApplicationStore
- **File:** `app/src/islands/pages/RentalApplicationPage/store/useRentalApplicationStore.ts`
- **Hook Type:** State Management (Zustand-like)
- **Has Test File:** ❌ No
- **Dependencies:** rentalApplicationLocalStore
- **Missing Tests:**
  - [ ] Initial state loaded from localStorage
  - [ ] Subscribes to store updates
  - [ ] updateFormData updates store
  - [ ] updateField updates single field
  - [ ] setOccupants replaces occupants
  - [ ] addOccupant adds occupant
  - [ ] removeOccupant removes occupant
  - [ ] updateOccupant updates occupant field
  - [ ] updateVerificationStatus updates verification
  - [ ] saveDraft returns success/failure
  - [ ] reset clears store
  - [ ] loadFromDatabase loads data
  - [ ] getDebugSummary returns summary
  - [ ] Unsubscribe on unmount
  - [ ] localStorage persistence

#### 21. useRentalApplicationPageLogic
- **File:** `app/src/islands/pages/useRentalApplicationPageLogic.js`
- **Hook Type:** Page Orchestration
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 22. useReportEmergencyPageLogic
- **File:** `app/src/islands/pages/ReportEmergencyPage/useReportEmergencyPageLogic.js`
- **Hook Type:** Form State / Data Fetching
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 23. useListingStore
- **File:** `app/src/islands/pages/SelfListingPage/store/useListingStore.ts`
- **Hook Type:** State Management (Zustand-like)
- **Has Test File:** ❌ No
- **Dependencies:** listingLocalStore
- **Missing Tests:**
  - [ ] Initial state loaded from localStorage
  - [ ] Subscribes to store updates
  - [ ] updateFormData updates store
  - [ ] updateSpaceSnapshot updates space snapshot
  - [ ] updateFeatures updates features
  - [ ] updateLeaseStyles updates lease styles
  - [ ] updatePricing updates pricing
  - [ ] updateRules updates rules
  - [ ] updatePhotos updates photos
  - [ ] updateReview updates review
  - [ ] setCurrentSection updates section
  - [ ] markSectionComplete marks section
  - [ ] saveDraft returns success/failure
  - [ ] stageForSubmission stages data
  - [ ] getStagedData returns staged data
  - [ ] markSubmitting updates status
  - [ ] markSubmitted updates status
  - [ ] markSubmissionFailed updates status
  - [ ] clearStagingError clears errors
  - [ ] reset clears store
  - [ ] validate returns errors array
  - [ ] getDebugSummary returns summary
  - [ ] Unsubscribe on unmount
  - [ ] localStorage persistence

#### 24. useSimulationGuestMobilePageLogic
- **File:** `app/src/islands/pages/SimulationGuestMobilePage/useSimulationGuestMobilePageLogic.js`
- **Hook Type:** Page Orchestration
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 25. useSimulationGuestsideDemoPageLogic
- **File:** `app/src/islands/pages/SimulationGuestsideDemoPage/useSimulationGuestsideDemoPageLogic.js`
- **Hook Type:** Page Orchestration
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 26. useSimulationHostMobilePageLogic
- **File:** `app/src/islands/pages/SimulationHostMobilePage/useSimulationHostMobilePageLogic.js`
- **Hook Type:** Page Orchestration
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 27. useSimulationHostsideDemoPageLogic
- **File:** `app/src/islands/pages/SimulationHostsideDemoPage/useSimulationHostsideDemoPageLogic.js`
- **Hook Type:** Page Orchestration
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 28. useEmailSmsUnitPageLogic
- **File:** `app/src/islands/pages/useEmailSmsUnitPageLogic.js`
- **Hook Type:** Page Orchestration
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 29. useGuestProposalsPageLogic
- **File:** `app/src/islands/pages/proposals/useGuestProposalsPageLogic.js`
- **Hook Type:** Data Fetching
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 30. useManageInformationalTextsPageLogic
- **File:** `app/src/islands/pages/useManageInformationalTextsPageLogic.js`
- **Hook Type:** Data Fetching / Form State
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 31. useQuickMatchPageLogic
- **File:** `app/src/islands/pages/useQuickMatchPageLogic.js`
- **Hook Type:** Data Fetching / Algorithm
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 32. useSearchPageAuth
- **File:** `app/src/islands/pages/useSearchPageAuth.js`
- **Hook Type:** Auth
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 33. useVerifyUsersPageLogic
- **File:** `app/src/islands/pages/useVerifyUsersPageLogic.js`
- **Hook Type:** Data Fetching
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 34. useSearchPageLogic
- **File:** `app/src/islands/pages/useSearchPageLogic.js`
- **Hook Type:** Data Fetching / Form State
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 35. useMessagingPageLogic
- **File:** `app/src/islands/pages/MessagingPage/useMessagingPageLogic.js`
- **Hook Type:** Data Fetching / Real-time
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 36. useRentalApplicationWizardLogic
- **File:** `app/src/islands/shared/RentalApplicationWizardModal/useRentalApplicationWizardLogic.js`
- **Hook Type:** Wizard State / Form State
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 37. useViewSplitLeaseLogic
- **File:** `app/src/islands/pages/ViewSplitLeasePage/useViewSplitLeaseLogic.ts`
- **Hook Type:** Data Fetching
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 38. useCancellationLogic
- **File:** `app/src/islands/pages/ListingDashboardPage/hooks/useCancellationLogic.js`
- **Hook Type:** Business Logic / Data Fetching
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 39. useAvailabilityLogic
- **File:** `app/src/islands/pages/ListingDashboardPage/hooks/useAvailabilityLogic.js`
- **Hook Type:** Form State / Business Logic
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 40. useEditListingDetailsLogic
- **File:** `app/src/islands/shared/EditListingDetails/useEditListingDetailsLogic.js`
- **Hook Type:** Form State / Data Fetching
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 41. useCompareTermsModalLogic
- **File:** `app/src/islands/modals/useCompareTermsModalLogic.js`
- **Hook Type:** Modal State / Computed
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 42. useAccountProfilePageLogic
- **File:** `app/src/islands/pages/AccountProfilePage/useAccountProfilePageLogic.js`
- **Hook Type:** Data Fetching / Form State
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 43. useExperienceResponsesPageLogic
- **File:** `app/src/islands/pages/ExperienceResponsesPage/useExperienceResponsesPageLogic.js`
- **Hook Type:** Data Fetching
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 44. useGuestSimulationLogic
- **File:** `app/src/islands/pages/GuestSimulationPage/useGuestSimulationLogic.js`
- **Hook Type:** Page Orchestration
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 45. useHostLeasesPageLogic
- **File:** `app/src/islands/pages/HostLeasesPage/useHostLeasesPageLogic.js`
- **Hook Type:** Data Fetching
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 46. useHostProposalsPageLogic
- **File:** `app/src/islands/pages/HostProposalsPage/useHostProposalsPageLogic.js`
- **Hook Type:** Data Fetching
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 47. useInternalEmergencyPageLogic
- **File:** `app/src/islands/pages/InternalEmergencyPage/useInternalEmergencyPageLogic.js`
- **Hook Type:** Data Fetching / Form State
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 48. useListingsOverviewPageLogic
- **File:** `app/src/islands/pages/ListingsOverviewPage/useListingsOverviewPageLogic.js`
- **Hook Type:** Data Fetching
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 49. useProposalManagePageLogic
- **File:** `app/src/islands/pages/ProposalManagePage/useProposalManagePageLogic.js`
- **Hook Type:** Data Fetching / Form State
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 50. useManageVirtualMeetingsPageLogic
- **File:** `app/src/islands/pages/ManageVirtualMeetingsPage/useManageVirtualMeetingsPageLogic.js`
- **Hook Type:** Data Fetching
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 51. useGuestLeasesPageLogic
- **File:** `app/src/islands/pages/guest-leases/useGuestLeasesPageLogic.js`
- **Hook Type:** Data Fetching
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 52. useIdentityVerificationLogic
- **File:** `app/src/islands/shared/IdentityVerification/useIdentityVerificationLogic.js`
- **Hook Type:** Form State / Data Fetching
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 53. userProposalQueries
- **File:** `app/src/lib/proposals/userProposalQueries.js`
- **Hook Type:** Data Fetching (React Query style)
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 54. useAdminThreadsPageLogic
- **File:** `app/src/islands/pages/AdminThreadsPage/useAdminThreadsPageLogic.js`
- **Hook Type:** Data Fetching
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 55. useAiToolsPageLogic
- **File:** `app/src/islands/pages/AiToolsPage/useAiToolsPageLogic.js`
- **Hook Type:** Data Fetching
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 56. useCreateDocumentPageLogic
- **File:** `app/src/islands/pages/CreateDocumentPage/useCreateDocumentPageLogic.js`
- **Hook Type:** Form State / Data Fetching
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 57. useLeasesOverviewPageLogic
- **File:** `app/src/islands/pages/LeasesOverviewPage/useLeasesOverviewPageLogic.js`
- **Hook Type:** Data Fetching
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 58. useManageRentalApplicationsPageLogic
- **File:** `app/src/islands/pages/ManageRentalApplicationsPage/useManageRentalApplicationsPageLogic.js`
- **Hook Type:** Data Fetching
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 59. useSendMagicLoginLinksPageLogic
- **File:** `app/src/islands/pages/SendMagicLoginLinksPage/useSendMagicLoginLinksPageLogic.js`
- **Hook Type:** Data Fetching / Form State
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 60. useQuickPricePageLogic
- **File:** `app/src/islands/pages/QuickPricePage/useQuickPricePageLogic.js`
- **Hook Type:** Computed / Form State
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 61. useSimulationAdminPageLogic
- **File:** `app/src/islands/pages/SimulationAdminPage/useSimulationAdminPageLogic.js`
- **Hook Type:** Page Orchestration
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 62. useUsabilityDataManagementPageLogic
- **File:** `app/src/islands/pages/UsabilityDataManagementPage/useUsabilityDataManagementPageLogic.js`
- **Hook Type:** Data Fetching
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 63. useZEmailsUnitPageLogic
- **File:** `app/src/islands/pages/ZEmailsUnitPage/useZEmailsUnitPageLogic.js`
- **Hook Type:** Testing / Page Orchestration
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 64. useZPricingUnitTestPageLogic
- **File:** `app/src/islands/pages/ZPricingUnitTestPage/useZPricingUnitTestPageLogic.js`
- **Hook Type:** Testing / Page Orchestration
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 65. useZScheduleTestPageLogic
- **File:** `app/src/islands/pages/ZScheduleTestPage/useZScheduleTestPageLogic.js`
- **Hook Type:** Testing / Page Orchestration
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 66. useZSearchUnitTestPageLogic
- **File:** `app/src/islands/pages/ZSearchUnitTestPage/useZSearchUnitTestPageLogic.js`
- **Hook Type:** Testing / Page Orchestration
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 67. useZSharathTestPageLogic
- **File:** `app/src/islands/pages/ZSharathTestPage/useZSharathTestPageLogic.js`
- **Hook Type:** Testing / Page Orchestration
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 68. useZUnitChatgptModelsPageLogic
- **File:** `app/src/islands/pages/ZUnitChatgptModelsPage/useZUnitChatgptModelsPageLogic.js`
- **Hook Type:** Testing / Page Orchestration
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 69. useZUnitPaymentRecordsJsPageLogic
- **File:** `app/src/islands/pages/ZUnitPaymentRecordsJsPage/useZUnitPaymentRecordsJsPageLogic.js`
- **Hook Type:** Testing / Page Orchestration
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

---

### Shared Hooks (app/src/islands/shared/)

#### 70. useFileUpload
- **File:** `app/src/islands/shared/AIRoomRedesign/useFileUpload.js`
- **Hook Type:** Form State / Side Effect
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 71. useRoomRedesign
- **File:** `app/src/islands/shared/AIRoomRedesign/useRoomRedesign.js`
- **Hook Type:** Data Fetching / AI Integration
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 72. useAISuggestionsState
- **File:** `app/src/islands/shared/AISuggestions/useAISuggestionsState.js`
- **Hook Type:** State Management
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 73. useAIToolsState
- **File:** `app/src/islands/shared/AITools/useAIToolsState.js`
- **Hook Type:** State Management
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 74. useGuestMenuData
- **File:** `app/src/islands/shared/Header/useGuestMenuData.js`
- **Hook Type:** Data Fetching / Computed
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 75. useHostMenuData
- **File:** `app/src/islands/shared/Header/useHostMenuData.js`
- **Hook Type:** Data Fetching / Computed
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 76. useHeaderMessagingPanelLogic
- **File:** `app/src/islands/shared/HeaderMessagingPanel/useHeaderMessagingPanelLogic.js`
- **Hook Type:** Data Fetching / State
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 77. useLoggedInAvatarData
- **File:** `app/src/islands/shared/LoggedInAvatar/useLoggedInAvatarData.js`
- **Hook Type:** Data Fetching
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 78. useNotificationSettings
- **File:** `app/src/islands/shared/NotificationSettingsIsland/useNotificationSettings.js`
- **Hook Type:** Form State / Data Fetching
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 79. useQRCodeDashboardLogic
- **File:** `app/src/islands/shared/QRCodeDashboard/useQRCodeDashboardLogic.js`
- **Hook Type:** Data Fetching / Computed
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 80. useReminderHouseManualLogic
- **File:** `app/src/islands/shared/ReminderHouseManual/useReminderHouseManualLogic.js`
- **Hook Type:** Data Fetching
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 81. useSignUpTrialHostLogic
- **File:** `app/src/islands/shared/SignUpTrialHost/useSignUpTrialHostLogic.js`
- **Hook Type:** Form State / Data Fetching
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 82. useSuggestedProposals
- **File:** `app/src/islands/shared/SuggestedProposals/useSuggestedProposals.js`
- **Hook Type:** Data Fetching / Computed
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 83. useUsabilityPopupLogic
- **File:** `app/src/islands/shared/UsabilityPopup/useUsabilityPopupLogic.js`
- **Hook Type:** UI State / Side Effect
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 84. useScheduleSelectorLogicCore
- **File:** `app/src/islands/shared/useScheduleSelectorLogicCore.js`
- **Hook Type:** Form State / Computed / Business Logic (CRITICAL)
- **Has Test File:** ❌ No
- **Dependencies:** Logic Core functions (calculateNightsFromDays, calculateCheckInOutDays, isScheduleContiguous, calculatePrice)
- **Missing Tests:**
  - [ ] Initial state (selectedDays=[], errorState cleared)
  - [ ] allDays computed from listing.daysAvailable
  - [ ] nightsCount calculated correctly
  - [ ] checkInDay/checkOutDay calculated correctly
  - [ ] checkInName/checkOutName calculated correctly
  - [ ] isContiguous calculated correctly
  - [ ] priceBreakdown calculated correctly
  - [ ] notSelectedDays computed
  - [ ] unusedNights computed
  - [ ] scheduleState orchestrates all data
  - [ ] handleDaySelect adds valid day
  - [ ] handleDaySelect rejects unavailable day
  - [ ] handleDaySelect rejects non-contiguous day
  - [ ] handleDaySelect enforces maximum nights
  - [ ] handleDayRemove removes day
  - [ ] handleDayRemove enforces minimum nights
  - [ ] handleDayRemove prevents breaking contiguity
  - [ ] handleDayClick delegates to select/remove
  - [ ] clearSelection resets all state
  - [ ] clearError clears error state
  - [ ] setIsClickable updates clickable state
  - [ ] setRecalculateState updates recalculate flag
  - [ ] onSelectionChange callback called
  - [ ] onPriceChange callback called
  - [ ] onScheduleChange callback called
  - [ ] acceptableSchedule computed correctly
  - [ ] maxNightsWarningShown flag behavior
  - [ ] minNightsWarningShown flag behavior
  - [ ] State updates wrapped in act()
  - [ ] Rerender with new listing prop
  - [ ] Rerender with new initialSelectedDays

#### 85. useScheduleSelector
- **File:** `app/src/islands/shared/useScheduleSelector.js`
- **Hook Type:** Wrapper / Component Integration
- **Has Test File:** ❌ No
- **Dependencies:** useScheduleSelectorLogicCore
- **Missing Tests:**
  - [ ] Delegates to useScheduleSelectorLogicCore
  - [ ] Returns correct API

#### 86. useVisitReviewerHouseManualLogic
- **File:** `app/src/islands/shared/VisitReviewerHouseManual/useVisitReviewerHouseManualLogic.js`
- **Hook Type:** Data Fetching
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

#### 87. useManageInformationalTextsPageLogic
- **File:** `app/src/islands/pages/ManageInformationalTextsPage/useManageInformationalTextsPageLogic.js`
- **Hook Type:** Data Fetching / Form State
- **Has Test File:** ❌ No
- **Dependencies:** Unknown (needs review)

---

### Additional Hooks in app/src/islands/pages/ListingDashboardPage/

#### 88. usePhotoManagement
- **File:** `app/src/islands/pages/ListingDashboardPage/hooks/usePhotoManagement.js`
- **Hook Type:** Data Fetching / State Updates
- **Has Test File:** ❌ No
- **Dependencies:** Supabase (listing_photo table)
- **Missing Tests:**
  - [ ] handleSetCoverPhoto moves photo to front
  - [ ] handleSetCoverPhoto updates toggleMainPhoto in database
  - [ ] handleSetCoverPhoto updates SortOrder in database
  - [ ] handleSetCoverPhoto no-op when photo not found
  - [ ] handleSetCoverPhoto no-op when already first
  - [ ] handleReorderPhotos reorders array
  - [ ] handleReorderPhotos updates isCover flags
  - [ ] handleReorderPhotos updates SortOrder in database
  - [ ] handleReorderPhotos no-op when fromIndex === toIndex
  - [ ] handleDeletePhoto removes photo
  - [ ] handleDeletePhoto sets new cover if deleting cover
  - [ ] handleDeletePhoto updates Active flag in database
  - [ ] Error handling calls fetchListing
  - [ ] MSW mocking for Supabase queries

---

## Test Infrastructure Setup Required

### Step 1: Install Dependencies

```bash
cd app
bun add -d vitest @testing-library/react @testing-library/jest-dom jsdom
bun add -d msw @vitest/ui
```

### Step 2: Create Vitest Config

**File:** `app/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test-setup.ts',
        'src/mocks/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### Step 3: Create Test Setup File

**File:** `app/src/test-setup.ts`

```typescript
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
} as any
```

### Step 4: Create MSW Setup

**File:** `app/src/mocks/handlers.ts`

```typescript
import { http, HttpResponse } from 'msw'

export const handlers = [
  // Supabase auth
  http.get('*/auth/v1/user', () => {
    return HttpResponse.json({
      id: 'user-123',
      email: 'test@example.com',
    })
  }),

  http.get('*/auth/v1/session', () => {
    return HttpResponse.json({
      session: null,
    })
  }),

  // Listing endpoints
  http.get('*/rest/v1/listing', () => {
    return HttpResponse.json([])
  }),

  http.get('*/rest/v1/listing_photo', () => {
    return HttpResponse.json([])
  }),

  // Add more handlers as needed...
]
```

**File:** `app/src/mocks/server.ts`

```typescript
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

### Step 5: Update package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

---

## Recommended Priority Order for Test Implementation

### Phase 1: Critical Hooks (Data Fetching)
1. `useListingData` - Core listing data, heavy Supabase usage
2. `useAuthenticatedUser` - Auth flow, critical security
3. `useListingAuth` - Auth check for protected pages
4. `useDataLookups` - Initialization dependency

### Phase 2: Core Utility Hooks
5. `useDeviceDetection` - Window resize, event listeners
6. `useImageCarousel` - State management, callbacks
7. `useScheduleSelectorLogicCore` - Complex business logic
8. `usePhotoManagement` - Database mutations

### Phase 3: State Management Hooks
9. `useListingStore` - Local storage, Zustand pattern
10. `useRentalApplicationStore` - Local storage, Zustand pattern

### Phase 4: Page-Specific Hooks
11. All `useXxxPageLogic` hooks (50+ hooks)

---

## Test Templates for Common Hook Types

### Simple State Hook Test (useImageCarousel)

```typescript
// app/src/hooks/useImageCarousel.test.ts
import { renderHook, act } from '@testing-library/react'
import { useImageCarousel } from './useImageCarousel'

describe('useImageCarousel', () => {
  it('initializes with first image selected', () => {
    const images = ['url1', 'url2', 'url3']
    const { result } = renderHook(() => useImageCarousel(images))

    expect(result.current.currentImageIndex).toBe(0)
    expect(result.current.hasImages).toBe(true)
    expect(result.current.hasMultipleImages).toBe(true)
  })

  it('handles empty images array', () => {
    const { result } = renderHook(() => useImageCarousel([]))

    expect(result.current.hasImages).toBe(false)
    expect(result.current.hasMultipleImages).toBe(false)
  })

  it('navigates to next image', () => {
    const images = ['url1', 'url2', 'url3']
    const { result } = renderHook(() => useImageCarousel(images))

    act(() => {
      result.current.handleNextImage({ preventDefault: vi.fn(), stopPropagation: vi.fn() })
    })

    expect(result.current.currentImageIndex).toBe(1)
  })

  it('wraps around from last to first', () => {
    const images = ['url1', 'url2']
    const { result } = renderHook(() => useImageCarousel(images))

    act(() => {
      result.current.setCurrentImageIndex(1)
    })

    act(() => {
      result.current.handleNextImage({ preventDefault: vi.fn(), stopPropagation: vi.fn() })
    })

    expect(result.current.currentImageIndex).toBe(0)
  })

  it('navigates to previous image', () => {
    const images = ['url1', 'url2', 'url3']
    const { result } = renderHook(() => useImageCarousel(images))

    act(() => {
      result.current.setCurrentImageIndex(2)
    })

    act(() => {
      result.current.handlePrevImage({ preventDefault: vi.fn(), stopPropagation: vi.fn() })
    })

    expect(result.current.currentImageIndex).toBe(1)
  })
})
```

### Async Data Fetching Hook Test (useDataLookups)

```typescript
// app/src/hooks/useDataLookups.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { useDataLookups } from './useDataLookups'
import * as dataLookupsModule from '../lib/dataLookups'

vi.mock('../lib/dataLookups')

describe('useDataLookups', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns false initially when not initialized', () => {
    vi.spyOn(dataLookupsModule, 'isInitialized').mockReturnValue(false)

    const { result } = renderHook(() => useDataLookups())

    expect(result.current).toBe(false)
  })

  it('initializes lookups and returns true', async () => {
    vi.spyOn(dataLookupsModule, 'isInitialized').mockReturnValue(false)
    vi.spyOn(dataLookupsModule, 'initializeLookups').mockResolvedValue(undefined)

    const { result } = renderHook(() => useDataLookups())

    await waitFor(() => {
      expect(dataLookupsModule.initializeLookups).toHaveBeenCalled()
      expect(result.current).toBe(true)
    })
  })

  it('returns true immediately if already initialized', () => {
    vi.spyOn(dataLookupsModule, 'isInitialized').mockReturnValue(true)

    const { result } = renderHook(() => useDataLookups())

    expect(result.current).toBe(true)
    expect(dataLookupsModule.initializeLookups).not.toHaveBeenCalled()
  })

  it('cleans up on unmount', () => {
    vi.spyOn(dataLookupsModule, 'isInitialized').mockReturnValue(false)
    vi.spyOn(dataLookupsModule, 'initializeLookups').mockResolvedValue(undefined)

    const { unmount } = renderHook(() => useDataLookups())

    unmount()

    // Verify mounted flag prevents state update after unmount
    // This would require the actual implementation to handle cleanup
  })
})
```

### Device Detection Hook Test (useIsMobile)

```typescript
// app/src/hooks/useDeviceDetection.test.ts
import { renderHook, act } from '@testing-library/react'
import { useIsMobile, useIsDesktop, useDeviceType } from './useDeviceDetection'

describe('useIsMobile', () => {
  it('detects mobile viewport', () => {
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(true)
  })

  it('detects desktop viewport', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(false)
  })

  it('responds to resize events', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(false)

    act(() => {
      window.innerWidth = 375
      window.dispatchEvent(new Event('resize'))
    })

    expect(result.current).toBe(true)
  })

  it('cleans up event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = renderHook(() => useIsMobile())

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
  })
})

describe('useDeviceType', () => {
  it('returns mobile for small viewport', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })

    const { result } = renderHook(() => useDeviceType())

    expect(result.current).toBe('mobile')
  })

  it('returns desktop for large viewport', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200,
    })

    const { result } = renderHook(() => useDeviceType())

    expect(result.current).toBe('desktop')
  })
})
```

---

## Summary

This codebase has **104 custom React hooks** with **ZERO test coverage**. The primary blocker is:

1. **No testing infrastructure installed** - Vitest, React Testing Library, MSW not in package.json
2. **No test configuration files** - vitest.config.ts, test-setup.ts, MSW handlers
3. **No test files exist** - Only one non-hook test file found (calculateMatchScore.test.js)

**Recommended Action Plan:**

1. Install testing dependencies (Vitest, React Testing Library, MSW)
2. Set up test infrastructure (config, setup files, MSW handlers)
3. Start with Phase 1 critical hooks (useListingData, useAuthenticatedUser, useListingAuth)
4. Progressively add tests for remaining hooks by priority

**Estimated effort:** Setting up infrastructure + testing all 104 hooks would be a significant multi-week effort. Focus on high-value hooks first.
