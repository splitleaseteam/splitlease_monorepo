# Split Lease Codebase Function Documentation

**Generated**: 2026-01-28
**Scope**: Complete inventory of functions, classes, and components
**Architecture**: Islands Architecture (React 18) + Supabase Edge Functions

---

## Table of Contents

1. [React Components](#1-react-components)
   - [Page Components](#11-page-components)
   - [Shared Components](#12-shared-components)
   - [Modal Components](#13-modal-components)
   - [Proposal Components](#14-proposal-components)
2. [Custom Hooks](#2-custom-hooks)
   - [Global Hooks](#21-global-hooks-appsrchooks)
   - [Page Logic Hooks](#22-page-logic-hooks-usexxxpagelogicjs)
3. [Logic Layer](#3-logic-layer)
   - [Calculators](#31-calculators)
   - [Rules](#32-rules)
   - [Processors](#33-processors)
   - [Workflows](#34-workflows)
   - [Constants](#35-constants)
4. [Edge Functions](#4-edge-functions)
5. [Utility Functions](#5-utility-functions)
   - [Auth-Related](#51-auth-related)
   - [API-Related](#52-api-related)
   - [Utility Functions](#53-utility-functions)

---

## 1. React Components

### 1.1 Page Components

Location: `app/src/islands/pages/`

All page components follow the **Hollow Component Pattern**: UI components contain ONLY JSX rendering, all logic is delegated to `useXxxPageLogic` custom hooks.

| Component | File | Logic Hook | Purpose | Protected |
|-----------|------|------------|---------|-----------|
| `HomePage` | `HomePage.jsx` | - | Landing page | No |
| `SearchPage` | `SearchPage.jsx` | `useSearchPageLogic.js` | Listing search with filters | No |
| `ViewSplitLeasePage` | `ViewSplitLeasePage.jsx` | `useViewSplitLeasePageLogic.js` | Listing detail view | No |
| `PreviewSplitLeasePage` | `PreviewSplitLeasePage.jsx` | - | Listing preview (host) | Yes |
| `GuestProposalsPage` | `proposals/GuestProposalsPage.jsx` | `useGuestProposalsPageLogic.js` | Guest proposal dashboard | Yes |
| `HostProposalsPage` | `HostProposalsPage/` | `useHostProposalsPageLogic.js` | Host proposal dashboard | Yes |
| `HostLeasesPage` | `HostLeasesPage/` | `useHostLeasesPageLogic.js` | Host active leases | Yes |
| `GuestLeasesPage` | `guest-leases/` | `useGuestLeasesPageLogic.js` | Guest active leases | Yes |
| `SelfListingPage` | `SelfListingPage/` | - | Multi-step listing creation (TS) | Yes |
| `SelfListingPageV2` | `SelfListingPageV2/` | - | Listing creation v2 | No |
| `ListingDashboardPage` | `ListingDashboardPage/` | `useListingDashboardPageLogic.js` | Listing management | Yes |
| `HostOverviewPage` | `HostOverviewPage/` | `useHostOverviewPageLogic.js` | Host dashboard overview | Yes |
| `AccountProfilePage` | `AccountProfilePage/` | `useAccountProfilePageLogic.js` | User profile management | Yes |
| `FavoriteListingsPage` | `FavoriteListingsPage/` | - | Saved listings | Yes |
| `RentalApplicationPage` | - | `useRentalApplicationPageLogic.js` | Rental application form | Yes |
| `MessagingPage` | `MessagingPage/` | `useMessagingPageLogic.js` | Host-guest messaging | Yes |
| `HouseManualPage` | `HouseManualPage/` | `useHouseManualPageLogic.js` | Guest house manual view | No |
| `ReportEmergencyPage` | `ReportEmergencyPage/` | `useReportEmergencyPageLogic.js` | Emergency reporting | Yes |
| `QrCodeLandingPage` | `QrCodeLandingPage/` | `useQrCodeLandingPageLogic.js` | QR code landing | No |
| `ReviewsOverviewPage` | `ReviewsOverviewPage/` | `useReviewsOverviewPageLogic.js` | Reviews display | No |
| `GuestExperienceReviewPage` | `GuestExperienceReviewPage/` | `useGuestExperienceReviewPageLogic.js` | Guest review submission | Yes |
| `HostExperienceReviewPage` | `HostExperienceReviewPage/` | `useHostExperienceReviewPageLogic.js` | Host review submission | Yes |
| `FAQPage` | `FAQPage.jsx` | - | FAQ display | No |
| `HelpCenterPage` | `HelpCenterPage.jsx` | - | Help center | No |
| `HelpCenterCategoryPage` | `HelpCenterCategoryPage.jsx` | - | Help category | No |
| `PoliciesPage` | `PoliciesPage.jsx` | - | Policies display | No |
| `AboutUsPage` | `AboutUsPage/` | - | About page | No |
| `CareersPage` | `CareersPage.jsx` | - | Careers page | No |
| `ListWithUsPage` | `ListWithUsPage.jsx` | - | Host acquisition | No |
| `WhySplitLeasePage` | `WhySplitLeasePage.jsx` | - | Marketing page | No |
| `ResetPasswordPage` | `ResetPasswordPage.jsx` | - | Password reset | No |
| `NotFoundPage` | `NotFoundPage.jsx` | - | 404 page | No |
| `GuestSuccessPage` | `GuestSuccessPage.jsx` | - | Guest booking success | No |
| `HostSuccessPage` | `HostSuccessPage.jsx` | - | Host listing success | No |

#### Admin/Internal Pages

| Component | Logic Hook | Purpose |
|-----------|------------|---------|
| `AdminThreadsPage` | `useAdminThreadsPageLogic.js` | Message thread management |
| `CoHostRequestsPage` | `useCoHostRequestsPageLogic.js` | Co-host request management |
| `ManageVirtualMeetingsPage` | `useManageVirtualMeetingsPageLogic.js` | VM scheduling admin |
| `MessageCurationPage` | `useMessageCurationPageLogic.js` | Message moderation |
| `UsabilityDataManagementPage` | `useUsabilityDataManagementPageLogic.js` | Usability data admin |
| `InternalEmergencyPage` | `useInternalEmergencyPageLogic.js` | Emergency admin |
| `LeasesOverviewPage` | `useLeasesOverviewPageLogic.js` | Leases admin overview |
| `ListingsOverviewPage` | `useListingsOverviewPageLogic.js` | Listings admin overview |
| `SimulationAdminPage` | `useSimulationAdminPageLogic.js` | Simulation control |
| `QuickPricePage` | `useQuickPricePageLogic.js` | Quick pricing admin |
| `ProposalManagePage` | `useProposalManagePageLogic.js` | Proposal admin |
| `ModifyListingsPage` | `useModifyListingsPageLogic.js` | Bulk listing edits |
| `ManageInformationalTextsPage` | `useManageInformationalTextsPageLogic.js` | CMS content admin |
| `ManageRentalApplicationsPage` | `useManageRentalApplicationsPageLogic.js` | Rental app admin |
| `SendMagicLoginLinksPage` | `useSendMagicLoginLinksPageLogic.js` | Magic link admin |
| `CreateDocumentPage` | `useCreateDocumentPageLogic.js` | Document creation |
| `AiToolsPage` | `useAiToolsPageLogic.js` | AI tools admin |
| `ExperienceResponsesPage` | `useExperienceResponsesPageLogic.js` | Survey responses |
| `VerifyUsersPage` | `useVerifyUsersPageLogic.js` | User verification |

#### Simulation Pages

| Component | Logic Hook | Purpose |
|-----------|------------|---------|
| `SimulationGuestMobilePage` | `useSimulationGuestMobilePageLogic.js` | Guest mobile simulation |
| `SimulationGuestsideDemoPage` | `useSimulationGuestsideDemoPageLogic.js` | Guest-side demo |
| `SimulationHostMobilePage` | `useSimulationHostMobilePageLogic.js` | Host mobile simulation |
| `SimulationHostsideDemoPage` | `useSimulationHostsideDemoPageLogic.js` | Host-side demo |
| `GuestSimulationPage` | `useGuestSimulationLogic.js` | Guest simulation |

---

### 1.2 Shared Components

Location: `app/src/islands/shared/`

| Component | Props | Purpose |
|-----------|-------|---------|
| `Header.jsx` | - | Site navigation bar with auth state |
| `Footer.jsx` | - | Site footer with links |
| `Button.jsx` | `variant`, `size`, `disabled`, `onClick` | Reusable button component |
| `DayButton.jsx` | `day`, `selected`, `onClick`, `disabled` | Day selection button |
| `PriceDisplay.jsx` | `price`, `currency`, `period` | Formatted price display |
| `Toast.jsx` | `message`, `type`, `duration` | Toast notification |
| `ErrorOverlay.jsx` | `error`, `onRetry` | Error display overlay |
| `ErrorBoundary.jsx` | `children`, `fallback` | React error boundary |
| `InformationalText.jsx` | `textKey`, `fallback` | CMS content display |
| `GoogleMap.jsx` | `listings`, `center`, `onMarkerClick` | Google Maps integration |

#### Feature Module Components

| Module | Components | Purpose |
|--------|------------|---------|
| `LoggedInAvatar/` | `LoggedInAvatar` | User avatar with dropdown menu |
| `FavoriteButton/` | `FavoriteButton` | Add/remove favorite listing |
| `ListingCard/` | `ListingCard`, `ListingCardSkeleton` | Listing preview card |
| `HostScheduleSelector/` | `HostScheduleSelector`, `SimpleHostScheduleSelector` | Host day selection with pricing |
| `ListingScheduleSelector/` | `ListingScheduleSelector` | Guest day selection UI |
| `SearchScheduleSelector/` | `SearchScheduleSelector` | Search filter day selection |
| `AuthAwareSearchScheduleSelector/` | `AuthAwareSearchScheduleSelector` | Auth-aware schedule selector |
| `CreateProposalFlowV2/` | `CreateProposalFlowV2` | Multi-step proposal wizard |
| `VirtualMeetingManager/` | `BookVirtualMeeting`, `BookTimeSlot`, `RespondToVMRequest`, `CancelVirtualMeetings`, `DetailsOfProposalAndVM` | VM scheduling system |
| `ContactHostMessaging/` | `ContactHostMessaging` | Direct messaging component |
| `ExternalReviews/` | `ExternalReviews` | Third-party reviews display |
| `SubmitListingPhotos/` | `SubmitListingPhotos` | Photo upload component |
| `ImportListingModal/` | `ImportListingModal` | Airbnb/VRBO import |
| `ImportListingReviewsModal/` | `ImportListingReviewsModal` | Review import |
| `AIImportAssistantModal/` | `AIImportAssistantModal` | AI-assisted import |
| `CreateDuplicateListingModal/` | `CreateDuplicateListingModal` | Duplicate listing |
| `ScheduleCohost/` | `ScheduleCohost` | Co-host scheduling |
| `EditListingDetails/` | `EditListingDetails` | Listing edit form |
| `AiSignupMarketReport/` | `AiSignupMarketReport` | AI market analysis |
| `UsabilityPopup/` | `UsabilityPopup`, `usabilityPopupService.js` | Usability feedback popup |

---

### 1.3 Modal Components

Location: `app/src/islands/modals/`

| Modal | Props | Trigger | Purpose |
|-------|-------|---------|---------|
| `ProposalDetailsModal` | `isOpen`, `proposal`, `onClose`, `onAccept`, `onCancel` | Proposal card click | Proposal detail view |
| `MapModal` | `isOpen`, `listings`, `onClose` | Map button | Full-screen map |
| `EditProposalModal` | `isOpen`, `proposal`, `onClose`, `onSave` | Edit button | Edit proposal details |
| `VirtualMeetingModal` | `isOpen`, `proposal`, `onClose`, `onBook` | VM button | Schedule virtual meeting |
| `CancelProposalModal` | `isOpen`, `proposal`, `onClose`, `onConfirm` | Cancel button | Confirm cancellation |
| `CompareTermsModal` | `isOpen`, `original`, `counteroffer`, `onClose` | Compare link | Side-by-side comparison |
| `HostProfileModal` | `isOpen`, `host`, `onClose` | Host name click | Host profile view |
| `GuestEditingProposalModal` | `isOpen`, `proposal`, `onClose`, `onSave` | Guest edit | Guest proposal edit |
| `NotificationSettingsModal` | `isOpen`, `settings`, `onClose`, `onSave` | Settings gear | Notification preferences |
| `EditPhoneNumberModal` | `isOpen`, `phone`, `onClose`, `onSave` | Phone edit | Phone number update |
| `ProposalSuccessModal` | `isOpen`, `proposal`, `onClose` | Proposal submit | Success confirmation |
| `SignUpLoginModal` | `isOpen`, `initialMode`, `onClose`, `onSuccess` | Login/Signup buttons | Authentication modal |

---

### 1.4 Proposal Components

Location: `app/src/islands/proposals/`

| Component | Props | Purpose |
|-----------|-------|---------|
| `ProposalCard` | `proposal`, `onClick`, `onAction` | Proposal card in list |
| `ProposalSelector` | `proposals`, `selected`, `onSelect` | Proposal selection dropdown |
| `ProgressTracker` | `proposal`, `stages` | Visual progress indicator |
| `EmptyState` | `message`, `actionText`, `onAction` | No proposals state |
| `ErrorState` | `error`, `onRetry` | Error display |
| `LoadingState` | - | Loading skeleton |
| `VirtualMeetingsSection` | `meetings`, `proposal` | VM list for proposal |

---

## 2. Custom Hooks

### 2.1 Global Hooks (app/src/hooks/)

| Hook | Parameters | Returns | Purpose |
|------|------------|---------|---------|
| `useAuthenticatedUser` | - | `{ user, isLoading, isAuthenticated, userType, logout }` | Authentication state management |
| `useDataLookups` | - | `{ boroughs, neighborhoods, amenities, ... }` | Reference data fetching and caching |
| `useProposalButtonStates` | `{ proposal, virtualMeeting, guest, listing, currentUserId }` | `{ virtualMeeting, guestAction1, guestAction2, cancelProposal }` | Compute button states for proposals |
| `useImageCarousel` | `{ images, autoPlayInterval }` | `{ currentIndex, next, prev, goTo }` | Image carousel navigation |
| `useDeviceDetection` | - | `{ isMobile, isTablet, isDesktop, width }` | Responsive breakpoint detection |

---

### 2.2 Page Logic Hooks (useXxxPageLogic.js)

#### Core Page Hooks

| Hook | Location | Returns |
|------|----------|---------|
| `useSearchPageLogic` | `pages/useSearchPageLogic.js` | `{ listings, filters, isLoading, handleFilterChange, handleListingClick, mapListings, ... }` |
| `useViewSplitLeasePageLogic` | `pages/ViewSplitLeasePage/` | `{ listing, host, reviews, showProposalFlow, handleBookClick, ... }` |
| `useGuestProposalsPageLogic` | `pages/proposals/` | `{ proposals, selectedProposal, isLoading, handleProposalSelect, handleAction, ... }` |
| `useHostProposalsPageLogic` | `pages/HostProposalsPage/` | `{ proposals, filters, handleAccept, handleReject, handleCounteroffer, ... }` |
| `useAccountProfilePageLogic` | `pages/AccountProfilePage/` | `{ profile, isEditing, handleSave, handlePhotoUpload, ... }` |
| `useListingDashboardPageLogic` | `pages/ListingDashboardPage/` | `{ listing, sections, handleSectionSave, handlePhotoReorder, ... }` |
| `useHostOverviewPageLogic` | `pages/HostOverviewPage/` | `{ listings, proposals, stats, handleListingClick, ... }` |
| `useRentalApplicationPageLogic` | `pages/` | `{ application, isSubmitting, handleSubmit, handleFieldChange, ... }` |
| `useMessagingPageLogic` | `pages/MessagingPage/` | `{ threads, messages, sendMessage, markAsRead, ... }` |

#### Lease Hooks

| Hook | Returns |
|------|---------|
| `useHostLeasesPageLogic` | `{ leases, filters, handleFilter, handleLeaseClick, ... }` |
| `useGuestLeasesPageLogic` | `{ leases, activeLease, handleAction, ... }` |
| `useLeasesOverviewPageLogic` | `{ allLeases, stats, filters, ... }` |

#### Review Hooks

| Hook | Returns |
|------|---------|
| `useGuestExperienceReviewPageLogic` | `{ review, categories, handleRating, handleSubmit, ... }` |
| `useHostExperienceReviewPageLogic` | `{ review, categories, handleRating, handleSubmit, ... }` |
| `useReviewsOverviewPageLogic` | `{ reviews, filters, stats, ... }` |

#### Admin Hooks

| Hook | Purpose |
|------|---------|
| `useAdminThreadsPageLogic` | Message thread administration |
| `useCoHostRequestsPageLogic` | Co-host request management |
| `useManageVirtualMeetingsPageLogic` | VM scheduling administration |
| `useMessageCurationPageLogic` | Message moderation |
| `useUsabilityDataManagementPageLogic` | Usability data management |
| `useSimulationAdminPageLogic` | Simulation control |
| `useProposalManagePageLogic` | Proposal administration |
| `useManageInformationalTextsPageLogic` | CMS content management |
| `useManageRentalApplicationsPageLogic` | Rental application admin |
| `useSendMagicLoginLinksPageLogic` | Magic link generation |
| `useVerifyUsersPageLogic` | User verification admin |

#### Specialized Hooks

| Hook | Purpose |
|------|---------|
| `useHouseManualPageLogic` | House manual display and access control |
| `useReportEmergencyPageLogic` | Emergency reporting form |
| `useQrCodeLandingPageLogic` | QR code landing page handling |
| `useCreateSuggestedProposalLogic` | SL-suggested proposal creation |
| `useQuickMatchPageLogic` | Quick match algorithm display |
| `useCreateDocumentPageLogic` | Document creation form |
| `useAiToolsPageLogic` | AI tools interface |
| `useExperienceResponsesPageLogic` | Survey response viewing |
| `useAuthVerifyPageLogic` | Auth verification handling |

#### Listing Dashboard Sub-Hooks

| Hook | Location | Purpose |
|------|----------|---------|
| `usePricingLogic` | `ListingDashboardPage/components/PricingEditSection/` | Pricing section state |
| `useAvailabilityLogic` | `ListingDashboardPage/hooks/` | Availability section state |
| `useCancellationLogic` | `ListingDashboardPage/hooks/` | Cancellation policy state |

---

## 3. Logic Layer

Location: `app/src/logic/`

The logic layer follows a **Four-Layer Architecture**:
- **Calculators**: Pure mathematical calculations
- **Rules**: Boolean predicates for business logic
- **Processors**: Data transformation and formatting
- **Workflows**: Orchestration of multiple operations

---

### 3.1 Calculators

Location: `app/src/logic/calculators/`

#### Pricing Calculators (`calculators/pricing/`)

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `calculateGuestFacingPrice` | `({ hostNightlyRate, nightsCount })` | `number` | Calculate price with markup/discounts |
| `calculateFourWeekRent` | `({ nightlyPrice, nightsPerWeek })` | `number` | 4-week rental total |
| `calculatePricingBreakdown` | `({ listing, nightsPerWeek, reservationWeeks })` | `{ nightlyPrice, fourWeekRent, reservationTotal, cleaningFee, damageDeposit, grandTotal }` | Complete pricing breakdown |
| `calculateReservationTotal` | `({ nightlyPrice, totalNights })` | `number` | Total reservation cost |
| `calculateQuickProposal` | `({ listing, selectedDays, weeks })` | `{ pricing, schedule }` | Quick proposal calculation |
| `getNightlyRateByFrequency` | `({ listing, nightsPerWeek })` | `number` | Get rate for night frequency |

#### Scheduling Calculators (`calculators/scheduling/`)

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `calculateCheckInOutDays` | `({ selectedDays })` | `{ checkInDay, checkOutDay }` | Determine check-in/out from selection |
| `calculateCheckInOutFromDays` | `({ selectedDays })` | `{ checkIn, checkOut }` | Date calculation from days |
| `calculateNightsFromDays` | `({ selectedDays })` | `number` | Count nights from day selection |
| `calculateNextAvailableCheckIn` | `({ listing, fromDate })` | `Date` | Find next available check-in |
| `getNextOccurrenceOfDay` | `({ dayIndex, fromDate })` | `Date` | Get next occurrence of day |
| `isContiguousSelection` | `({ selectedDays })` | `boolean` | Check if days are contiguous |
| `shiftMoveInDateIfPast` | `({ moveInDate, availableDays })` | `Date` | Adjust past move-in dates |

#### Matching Calculators (`calculators/matching/`)

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `calculateMatchScore` | `({ candidateListing, proposal, hostData })` | `{ totalScore, breakdown, maxPossibleScore }` | Master matching score (0-95) |
| `calculateBoroughScore` | `({ listingBorough, proposalBorough })` | `number` | Borough match score (0-25) |
| `calculatePriceScore` | `({ listingPrice, proposalBudget })` | `number` | Price proximity score (0-20) |
| `calculatePriceProximity` | `({ listingPrice, targetPrice })` | `number` | Price distance calculation |
| `calculateScheduleOverlapScore` | `({ listingDays, proposalDays })` | `number` | Schedule overlap (0-20) |
| `calculateWeeklyStayScore` | `({ listing, proposalNights })` | `number` | Weekly stay support (0-15) |
| `calculateDurationScore` | `({ listingMin, proposalDuration })` | `number` | Duration match (0-10) |
| `calculateHostScore` | `({ hostData })` | `number` | Host verification score (0-5) |

#### Availability Calculators (`calculators/availability/`)

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `calculateAvailableSlots` | `({ listing, dateRange })` | `Slot[]` | Calculate available booking slots |

#### Reminder Calculators (`calculators/reminders/`)

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `calculateNextSendTime` | `({ reminder, timezone })` | `Date` | Calculate next reminder send time |

#### Simulation Calculators (`calculators/simulation/`)

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `calculateSimulationDates` | `({ scenario })` | `{ startDate, endDate, ... }` | Calculate simulation date ranges |

---

### 3.2 Rules

Location: `app/src/logic/rules/`

#### Proposal Rules (`rules/proposals/`)

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `canCancelProposal` | `(proposal)` | `boolean` | Check if proposal can be cancelled |
| `canModifyProposal` | `(proposal)` | `boolean` | Check if proposal can be modified |
| `canAcceptProposal` | `(proposal)` | `boolean` | Check if proposal can be accepted |
| `canEditProposal` | `(proposal)` | `boolean` | Check if proposal can be edited |
| `hasReviewableCounteroffer` | `(proposal)` | `boolean` | Check for reviewable counteroffer |
| `canAcceptCounteroffer` | `(proposal)` | `boolean` | Check if counteroffer can be accepted |
| `canDeclineCounteroffer` | `(proposal)` | `boolean` | Check if counteroffer can be declined |
| `canSubmitRentalApplication` | `(proposal)` | `boolean` | Check if rental app can be submitted |
| `canReviewDocuments` | `(proposal)` | `boolean` | Check if documents can be reviewed |
| `canRequestVirtualMeeting` | `(proposal)` | `boolean` | Check if VM can be requested |
| `canSendMessage` | `(proposal)` | `boolean` | Check if message can be sent |
| `isProposalActive` | `(proposal)` | `boolean` | Check if proposal is active |
| `isProposalCancelled` | `(proposal)` | `boolean` | Check if proposal is cancelled |
| `isProposalRejected` | `(proposal)` | `boolean` | Check if proposal is rejected |
| `isLeaseActivated` | `(proposal)` | `boolean` | Check if lease is activated |
| `requiresSpecialCancellationConfirmation` | `(proposal)` | `boolean` | Check for special confirmation |
| `getCancelButtonText` | `(proposal)` | `string` | Get appropriate cancel button text |
| `getCancellationReasonOptions` | `()` | `string[]` | Get cancellation reason options |
| `determineProposalStage` | `(proposal)` | `string` | Determine current proposal stage |
| `computeProposalButtonStates` | `({ proposal, virtualMeeting, guest, listing, currentUserId })` | `{ virtualMeeting, guestAction1, guestAction2, cancelProposal }` | Compute all button states |
| `needsRentalApplicationSubmission` | `(proposal)` | `boolean` | Check if rental app needed |
| `canConfirmSuggestedProposal` | `(proposal)` | `boolean` | Check if SL-suggested can be confirmed |
| `getNextStatusAfterConfirmation` | `(proposal)` | `string` | Get next status after confirmation |
| `isSLSuggestedProposal` | `(proposal)` | `boolean` | Check if SL-suggested proposal |

#### Auth Rules (`rules/auth/`)

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `isSessionValid` | `({ session, expiryBuffer })` | `boolean` | Check if session is valid |
| `isProtectedPage` | `({ path })` | `boolean` | Check if page requires auth |

#### Matching Rules (`rules/matching/`)

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `isBoroughMatch` | `({ listingBorough, proposalBorough })` | `boolean` | Exact borough match |
| `isBoroughAdjacent` | `({ borough1, borough2 })` | `boolean` | Adjacent borough check |
| `isWithinBudget` | `({ listingPrice, budget })` | `boolean` | Price within budget |
| `hasScheduleCompatibility` | `({ listingDays, proposalDays })` | `boolean` | Schedule overlap exists |
| `isDurationMatch` | `({ listingMin, proposalDuration })` | `boolean` | Duration compatible |
| `canAccommodateDuration` | `({ listing, weeks })` | `boolean` | Can accommodate stay length |
| `supportsWeeklyStays` | `({ listing })` | `boolean` | Supports weekly bookings |
| `isVerifiedHost` | `({ host })` | `boolean` | Host is verified |
| `countHostVerifications` | `({ host })` | `number` | Count host verifications |

#### Scheduling Rules (`rules/scheduling/`)

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `isDateBlocked` | `({ date, blockedDates })` | `boolean` | Check if date is blocked |
| `isDateInRange` | `({ date, startDate, endDate })` | `boolean` | Check if date in range |
| `isScheduleContiguous` | `({ selectedDays })` | `boolean` | Check contiguous selection |

#### User Rules (`rules/users/`)

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `isHost` | `(user)` | `boolean` | Check if user is host |
| `isGuest` | `(user)` | `boolean` | Check if user is guest |
| `hasProfilePhoto` | `(user)` | `boolean` | Check for profile photo |
| `shouldShowFullName` | `({ user, context })` | `boolean` | Should show full name |

#### Search Rules (`rules/search/`)

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `hasListingPhotos` | `(listing)` | `boolean` | Check for listing photos |
| `isValidPriceTier` | `(tier)` | `boolean` | Validate price tier |
| `isValidSortOption` | `(option)` | `boolean` | Validate sort option |
| `isValidWeekPattern` | `(pattern)` | `boolean` | Validate week pattern |

#### Pricing Rules (`rules/pricing/`)

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `isValidDayCountForPricing` | `(dayCount)` | `boolean` | Valid day count for pricing |

#### Lease Rules (`rules/leases/`)

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `isLeaseActive` | `(lease)` | `boolean` | Check if lease is active |
| `canDeleteLease` | `(lease)` | `boolean` | Check if lease can be deleted |
| `canHardDeleteLease` | `(lease)` | `boolean` | Check for hard delete |

#### House Manual Rules (`rules/houseManual/`)

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `canAccessManual` | `({ user, lease })` | `boolean` | Check manual access |
| `isManualExpired` | `({ manual, lease })` | `boolean` | Check manual expiry |

#### Document Rules (`rules/documents/`)

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `validateDocumentForm` | `(formData)` | `{ isValid, errors }` | Validate document form |

#### Admin Rules (`rules/admin/`)

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `virtualMeetingAdminRules` | - | Various admin rule functions | VM admin rules |

#### Reminder Rules (`rules/reminders/`)

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `reminderScheduling` | - | Scheduling rule functions | Reminder scheduling rules |
| `reminderValidation` | - | Validation rule functions | Reminder validation rules |

#### Review Rules (`rules/reviews/`)

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `reviewValidation` | - | Validation rule functions | Review validation rules |

#### Simulation Rules (`rules/simulation/`)

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `canProgressToStep` | `({ simulation, step })` | `boolean` | Check step progression |

---

### 3.3 Processors

Location: `app/src/logic/processors/`

#### External Processors (`processors/external/`)

**CRITICAL: Day Conversion at API Boundaries**

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `adaptDayFromBubble` | `({ bubbleDay })` | `number` | Convert Bubble(1-7) to JS(0-6) |
| `adaptDayToBubble` | `({ jsDay })` | `number` | Convert JS(0-6) to Bubble(1-7) |
| `adaptDaysFromBubble` | `({ bubbleDays })` | `number[]` | Convert array Bubble to JS |
| `adaptDaysToBubble` | `({ jsDays })` | `number[]` | Convert array JS to Bubble |

#### Matching Processors (`processors/matching/`)

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `adaptCandidateListing` | `(rawListing)` | `AdaptedListing` | Normalize listing for matching |
| `adaptProposalForMatching` | `(rawProposal)` | `AdaptedProposal` | Normalize proposal for matching |
| `formatMatchResult` | `({ listing, score, breakdown })` | `FormattedResult` | Format match result for display |

#### Proposal Processors (`processors/proposals/`)

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `normalizeProposalData` | `(rawProposal)` | `NormalizedProposal` | Normalize proposal data |
| `normalizeListingData` | `(rawListing)` | `NormalizedListing` | Normalize listing in proposal |
| `normalizeGuestData` | `(rawGuest)` | `NormalizedGuest` | Normalize guest data |
| `processProposalData` | `(proposal)` | `ProcessedProposal` | Full proposal processing |

#### User Processors (`processors/user/`)

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `processUserData` | `(rawUser)` | `ProcessedUser` | Full user processing |
| `processUserDisplayName` | `(user)` | `string` | Generate display name |
| `processUserInitials` | `(user)` | `string` | Generate user initials |
| `processProfilePhotoUrl` | `(user)` | `string` | Process profile photo URL |

#### Display Processors (`processors/display/`)

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `formatHostName` | `({ host, context })` | `string` | Format host display name |

#### Listing Processors (`processors/listing/`)

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `extractListingCoordinates` | `(listing)` | `{ lat, lng }` | Extract map coordinates |
| `parseJsonArrayField` | `(field)` | `any[]` | Parse JSON array fields |

#### Lease Processors (`processors/leases/`)

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `filterLeases` | `({ leases, filters })` | `Lease[]` | Filter lease list |
| `formatLeaseDisplay` | `(lease)` | `FormattedLease` | Format lease for display |

#### Meeting Processors (`processors/meetings/`)

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `filterMeetings` | `({ meetings, filters })` | `Meeting[]` | Filter meeting list |

#### Reminder Processors (`processors/reminders/`)

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `reminderAdapter` | - | Adapter functions | Reminder data adaptation |
| `reminderFormatter` | - | Formatter functions | Reminder display formatting |

#### Review Processors (`processors/reviews/`)

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `reviewAdapter` | - | Adapter functions | Review data adaptation |

#### Simulation Processors (`processors/simulation/`)

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `selectProposalByScheduleType` | `({ proposals, scheduleType })` | `Proposal` | Select proposal by schedule |

---

### 3.4 Workflows

Location: `app/src/logic/workflows/`

#### Auth Workflows (`workflows/auth/`)

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `checkAuthStatusWorkflow` | `({ splitLeaseCookies, authState, hasValidTokens })` | `{ isAuthenticated, source, username }` | Orchestrate auth status check |
| `validateTokenWorkflow` | `({ token, session })` | `{ isValid, user, error }` | Validate auth token |

#### Scheduling Workflows (`workflows/scheduling/`)

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `validateMoveInDateWorkflow` | `({ moveInDate, listing })` | `{ isValid, adjustedDate, errors }` | Validate and adjust move-in date |
| `validateScheduleWorkflow` | `({ selectedDays, listing })` | `{ isValid, errors }` | Validate schedule selection |

#### Booking Workflows (`workflows/booking/`)

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `acceptProposalWorkflow` | `({ proposal })` | `{ success, error }` | Accept proposal orchestration |
| `cancelProposalWorkflow` | `({ proposal, reason })` | `{ success, error }` | Cancel proposal orchestration |
| `loadProposalDetailsWorkflow` | `({ proposalId })` | `{ proposal, listing, host }` | Load full proposal details |

#### Proposal Workflows (`workflows/proposals/`)

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `cancelProposalWorkflow` | `({ proposal, reason })` | `{ success, error }` | Cancel proposal |
| `counterofferWorkflow` | `({ proposal, counterofferData })` | `{ success, error }` | Submit counteroffer |
| `navigationWorkflow` | `({ proposal, action })` | `{ nextPath }` | Determine navigation |
| `virtualMeetingWorkflow` | `({ proposal, meetingData })` | `{ success, meeting }` | Schedule VM |

---

### 3.5 Constants

Location: `app/src/logic/constants/`

| File | Exports | Purpose |
|------|---------|---------|
| `proposalStages.js` | `PROPOSAL_STAGES`, `getStageConfig`, `getStageOrder` | Proposal stage definitions |
| `proposalStatuses.js` | `PROPOSAL_STATUSES`, `isTerminalStatus`, `isCompletedStatus`, `getActionsForStatus`, `isSuggestedProposal` | Proposal status definitions |
| `reviewCategories.js` | `REVIEW_CATEGORIES` | Review category definitions |
| `searchConstants.js` | `SORT_OPTIONS`, `PRICE_TIERS`, `DEFAULT_FILTERS` | Search constants |
| `index.js` | Barrel exports | All constants |

---

## 4. Edge Functions

Location: `supabase/functions/`

All Edge Functions use the action-based routing pattern: `{ action: string, payload: object }`

### Authentication & Users

| Function | Actions | Purpose |
|----------|---------|---------|
| `auth-user` | `login`, `signup`, `logout`, `validate`, `request_password_reset`, `update_password`, `generate_magic_link`, `oauth_signup`, `oauth_login`, `send_magic_link_sms`, `verify_email` | Authentication operations |
| `verify-users` | `list`, `verify`, `reject` | User verification admin |
| `magic-login-links` | `generate`, `send`, `validate` | Magic link generation |

### Proposals & Bookings

| Function | Actions | Purpose |
|----------|---------|---------|
| `proposal` | `create`, `update`, `get`, `suggest`, `create_suggested`, `create_mockup`, `get_prefill_data`, `createTestProposal`, `createTestRentalApplication`, `acceptProposal`, `createCounteroffer`, `acceptCounteroffer` | Proposal CRUD + workflows |
| `rental-application` | `create`, `update`, `get`, `submit` | Rental application handling |
| `rental-applications` | `list`, `approve`, `reject` | Rental app admin |

### Listings

| Function | Actions | Purpose |
|----------|---------|---------|
| `listing` | `create`, `get`, `submit`, `delete` | Listing CRUD operations |
| `pricing` | `calculate`, `get_breakdown`, `validate` | Pricing calculations |
| `pricing-list` | `get`, `update` | Pricing list management |
| `pricing-admin` | `list`, `update_bulk` | Pricing administration |
| `quick-match` | `find_matches`, `get_score` | Quick matching algorithm |

### Leases & Management

| Function | Actions | Purpose |
|----------|---------|---------|
| `lease` | `create`, `get`, `update`, `activate` | Lease CRUD operations |
| `leases-admin` | `list`, `update`, `delete` | Lease administration |
| `guest-management` | `list`, `update_status` | Guest management |
| `guest-payment-records` | `list`, `create`, `update` | Guest payment tracking |
| `host-payment-records` | `list`, `create`, `update` | Host payment tracking |

### Communications

| Function | Actions | Purpose |
|----------|---------|---------|
| `communications` | `send_notification`, `get_preferences` | Communication orchestration |
| `send-email` | `send`, `send_template` | Email sending via Resend |
| `send-sms` | `send`, `send_template` | SMS sending via Twilio |
| `messages` | `list`, `create`, `mark_read` | In-app messaging |
| `message-curation` | `list`, `approve`, `reject`, `flag` | Message moderation |
| `slack` | `send_notification`, `send_alert` | Slack integration |

### Virtual Meetings

| Function | Actions | Purpose |
|----------|---------|---------|
| `virtual-meeting` | `create`, `get`, `update`, `cancel`, `confirm` | VM scheduling |

### Documents & House Manual

| Function | Actions | Purpose |
|----------|---------|---------|
| `document` | `create`, `get`, `list`, `sign` | Document management |
| `house-manual` | `get`, `update`, `validate_access` | House manual access |

### AI Features

| Function | Actions | Purpose |
|----------|---------|---------|
| `ai-gateway` | `chat`, `complete`, `embed` | OpenAI proxy |
| `ai-parse-profile` | `parse` | Profile parsing |
| `ai-room-redesign` | `redesign` | AI room redesign |
| `ai-signup-guest` | `analyze_market` | Market analysis for signup |
| `ai-tools` | `query`, `summarize` | AI tool operations |
| `query-leo` | `query` | Leo AI assistant |

### Co-hosting

| Function | Actions | Purpose |
|----------|---------|---------|
| `cohost-request` | `create`, `get`, `update` | Co-host request handling |
| `cohost-request-slack-callback` | `handle_action` | Slack action callback |
| `co-host-requests` | `list`, `approve`, `reject` | Co-host request admin |

### QR Codes

| Function | Actions | Purpose |
|----------|---------|---------|
| `qr-generator` | `generate` | QR code generation |
| `qr-codes` | `list`, `create`, `delete` | QR code management |

### Reviews & Surveys

| Function | Actions | Purpose |
|----------|---------|---------|
| `reviews-overview` | `get`, `list` | Review aggregation |
| `experience-survey` | `submit`, `get` | Experience survey handling |

### Administration

| Function | Actions | Purpose |
|----------|---------|---------|
| `simulation-admin` | `list`, `create`, `update`, `delete` | Simulation management |
| `simulation-guest` | `run_step`, `get_state` | Guest simulation |
| `simulation-host` | `run_step`, `get_state` | Host simulation |
| `usability-data-admin` | `list`, `export`, `delete` | Usability data admin |
| `informational-texts` | `get`, `list`, `update` | CMS content management |

### Date & Scheduling

| Function | Actions | Purpose |
|----------|---------|---------|
| `date-change-request` | `create`, `approve`, `reject` | Date change requests |
| `reminder-scheduler` | `schedule`, `cancel`, `list` | Reminder scheduling |

### Emergencies

| Function | Actions | Purpose |
|----------|---------|---------|
| `emergency` | `create`, `get`, `update`, `resolve` | Emergency handling |

### Identity Verification

| Function | Actions | Purpose |
|----------|---------|---------|
| `identity-verification` | `initiate`, `check_status`, `get_result` | Identity verification |

### Workflows & Sync

| Function | Actions | Purpose |
|----------|---------|---------|
| `workflow-enqueue` | `enqueue` | Queue workflow tasks |
| `workflow-orchestrator` | `process`, `retry` | Process workflow queue |
| `bubble_sync` | `sync`, `bulk_sync` | Bubble.io data sync |
| `backfill-negotiation-summaries` | `backfill` | Data backfill |

---

## 5. Utility Functions

Location: `app/src/lib/`

---

### 5.1 Auth-Related

#### auth.js (Main Auth Module)

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `checkAuthStatus` | `()` | `Promise<{ isLoggedIn, user, userType }>` | Check current auth status |
| `loginUser` | `({ email, password })` | `Promise<{ success, user, error }>` | Email/password login |
| `signupUser` | `({ email, password, userType, ...profile })` | `Promise<{ success, user, error }>` | User registration |
| `logoutUser` | `()` | `Promise<void>` | Logout and clear session |
| `validateTokenAndFetchUser` | `({ token })` | `Promise<{ isValid, user }>` | Validate auth token |
| `requestPasswordReset` | `({ email })` | `Promise<{ success, error }>` | Request password reset |
| `updatePassword` | `({ token, newPassword })` | `Promise<{ success, error }>` | Update password |
| `initiateLinkedInOAuth` | `({ redirectUri })` | `void` | Start LinkedIn OAuth |
| `handleLinkedInOAuthCallback` | `({ code })` | `Promise<{ success, user }>` | Handle LinkedIn callback |
| `initiateGoogleOAuth` | `({ redirectUri })` | `void` | Start Google OAuth |
| `handleGoogleOAuthCallback` | `({ code })` | `Promise<{ success, user }>` | Handle Google callback |

#### auth/cookies.js

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `getSplitLeaseCookies` | `()` | `{ isLoggedIn, username, userId }` | Read Split Lease cookies |
| `setSplitLeaseCookies` | `({ username, userId })` | `void` | Set Split Lease cookies |
| `clearSplitLeaseCookies` | `()` | `void` | Clear Split Lease cookies |

#### auth/login.js

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `performLogin` | `({ email, password })` | `Promise<LoginResult>` | Execute login flow |
| `validateLoginInput` | `({ email, password })` | `{ isValid, errors }` | Validate login form |

#### auth/logout.js

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `performLogout` | `()` | `Promise<void>` | Execute logout flow |
| `clearAllAuthState` | `()` | `void` | Clear all auth storage |

#### auth/signup.js

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `performSignup` | `({ email, password, userType, profile })` | `Promise<SignupResult>` | Execute signup flow |
| `validateSignupInput` | `(formData)` | `{ isValid, errors }` | Validate signup form |

#### auth/session.js

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `getSession` | `()` | `Session | null` | Get current session |
| `setSession` | `(session)` | `void` | Store session |
| `clearSession` | `()` | `void` | Clear session |
| `isSessionExpired` | `(session)` | `boolean` | Check session expiry |

#### auth/passwordReset.js

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `requestReset` | `({ email })` | `Promise<Result>` | Request password reset |
| `validateResetToken` | `({ token })` | `Promise<{ isValid }>` | Validate reset token |
| `executeReset` | `({ token, newPassword })` | `Promise<Result>` | Execute password reset |

#### auth/tokenValidation.js

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `validateToken` | `({ token })` | `Promise<{ isValid, claims }>` | Validate JWT token |
| `decodeToken` | `({ token })` | `TokenClaims` | Decode token without validation |
| `isTokenExpired` | `({ token })` | `boolean` | Check token expiry |

#### secureStorage.js

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `setSecureItem` | `(key, value)` | `void` | Store encrypted item |
| `getSecureItem` | `(key)` | `any | null` | Retrieve and decrypt item |
| `removeSecureItem` | `(key)` | `void` | Remove encrypted item |
| `clearSecureStorage` | `()` | `void` | Clear all encrypted items |

---

### 5.2 API-Related

#### supabase.js

| Export | Type | Purpose |
|--------|------|---------|
| `supabase` | `SupabaseClient` | Configured Supabase client |
| `createClient` | `function` | Create new Supabase client |

#### bubbleAPI.js

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `callBubbleAPI` | `({ endpoint, method, data })` | `Promise<Response>` | Generic Bubble API call |
| `getListing` | `(listingId)` | `Promise<Listing>` | Fetch listing from Bubble |
| `getUser` | `(userId)` | `Promise<User>` | Fetch user from Bubble |
| `updateListing` | `(listingId, data)` | `Promise<Listing>` | Update listing in Bubble |

#### supabaseUtils.js

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `handleSupabaseError` | `(error)` | `FormattedError` | Format Supabase errors |
| `buildQuery` | `(table, filters)` | `QueryBuilder` | Build Supabase query |

---

### 5.3 Utility Functions

#### constants.js

| Export | Type | Purpose |
|--------|------|---------|
| `DAYS` | `object` | Day name constants |
| `DAY_NAMES` | `string[]` | Day name array |
| `DAY_ABBREVIATIONS` | `string[]` | Day abbreviation array |
| `SCHEDULE_PATTERNS` | `object` | Predefined schedule patterns |
| `PRICE_TIERS` | `object` | Price tier definitions |
| `BOROUGHS` | `object` | NYC borough constants |
| `USER_TYPES` | `object` | User type constants |
| `PROPOSAL_STATUSES` | `object` | Proposal status constants |
| `URLS` | `object` | URL constants |

#### dataLookups.js

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `fetchBoroughs` | `()` | `Promise<Borough[]>` | Fetch borough list |
| `fetchNeighborhoods` | `(boroughId)` | `Promise<Neighborhood[]>` | Fetch neighborhoods |
| `fetchAmenities` | `()` | `Promise<Amenity[]>` | Fetch amenity list |
| `fetchSafetyItems` | `()` | `Promise<SafetyItem[]>` | Fetch safety items |
| `fetchHouseRules` | `()` | `Promise<HouseRule[]>` | Fetch house rules |
| `getGuestCancellationReasons` | `()` | `Reason[]` | Get cached cancellation reasons |
| `initializeDataLookups` | `()` | `Promise<void>` | Initialize all lookups |

#### dayUtils.js

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `getDayName` | `(dayIndex)` | `string` | Get full day name |
| `getDayAbbreviation` | `(dayIndex)` | `string` | Get day abbreviation |
| `formatDayRange` | `(days)` | `string` | Format day range display |
| `sortDays` | `(days)` | `number[]` | Sort day indices |

#### dateFormatters.js

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `formatDate` | `(date, format)` | `string` | Format date to string |
| `formatDateRange` | `(start, end)` | `string` | Format date range |
| `parseDate` | `(dateString)` | `Date` | Parse date string |
| `getRelativeDate` | `(date)` | `string` | Get relative date (e.g., "2 days ago") |

#### priceCalculations.js

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `calculateTotalPrice` | `({ nightly, nights, fees })` | `number` | Calculate total price |
| `formatPrice` | `(price, currency)` | `string` | Format price for display |
| `applyDiscount` | `(price, discountPercent)` | `number` | Apply percentage discount |

#### mapUtils.js

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `getMapCenter` | `(listings)` | `{ lat, lng }` | Calculate map center |
| `createMarkerIcon` | `(type)` | `Icon` | Create map marker icon |
| `formatAddress` | `(address)` | `string` | Format address for display |

#### urlParams.js

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `getUrlParam` | `(param)` | `string | null` | Get URL parameter |
| `setUrlParams` | `(params)` | `void` | Set URL parameters |
| `removeUrlParam` | `(param)` | `void` | Remove URL parameter |
| `parseQueryString` | `(queryString)` | `object` | Parse query string |

#### navigation.js

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `navigateTo` | `(path, params)` | `void` | Navigate to path |
| `redirectTo` | `(url)` | `void` | Redirect to URL |
| `goBack` | `()` | `void` | Go to previous page |

#### sanitize.js

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `sanitizeInput` | `(input)` | `string` | Sanitize user input |
| `sanitizeHtml` | `(html)` | `string` | Sanitize HTML content |
| `escapeHtml` | `(text)` | `string` | Escape HTML entities |

#### phoneUtils.js

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `formatPhoneNumber` | `(phone)` | `string` | Format phone for display |
| `parsePhoneNumber` | `(phone)` | `ParsedPhone` | Parse phone number |
| `isValidPhoneNumber` | `(phone)` | `boolean` | Validate phone number |

#### photoUpload.js

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `uploadPhoto` | `(file, bucket)` | `Promise<{ url, path }>` | Upload photo to storage |
| `deletePhoto` | `(path)` | `Promise<void>` | Delete photo from storage |
| `resizeImage` | `(file, maxSize)` | `Promise<Blob>` | Resize image before upload |

#### logger.js

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `log` | `(level, message, data)` | `void` | Log message |
| `error` | `(message, error)` | `void` | Log error |
| `warn` | `(message, data)` | `void` | Log warning |
| `info` | `(message, data)` | `void` | Log info |

#### timing.js

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `debounce` | `(fn, delay)` | `function` | Debounce function |
| `throttle` | `(fn, limit)` | `function` | Throttle function |
| `sleep` | `(ms)` | `Promise<void>` | Sleep for duration |

#### toastService.js

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `showToast` | `({ message, type, duration })` | `void` | Show toast notification |
| `showSuccess` | `(message)` | `void` | Show success toast |
| `showError` | `(message)` | `void` | Show error toast |
| `showWarning` | `(message)` | `void` | Show warning toast |

#### safeJson.js

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `safeJsonParse` | `(json, fallback)` | `any` | Safe JSON parse with fallback |
| `safeJsonStringify` | `(obj)` | `string` | Safe JSON stringify |

#### config.js

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `getConfig` | `(key)` | `any` | Get config value |
| `isProduction` | `()` | `boolean` | Check if production |
| `isDevelopment` | `()` | `boolean` | Check if development |

#### hotjar.js

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `initHotjar` | `()` | `void` | Initialize Hotjar tracking |

---

### Service Modules

#### proposalService.js

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `createProposal` | `(proposalData)` | `Promise<Proposal>` | Create new proposal |
| `updateProposal` | `(proposalId, data)` | `Promise<Proposal>` | Update proposal |
| `cancelProposal` | `(proposalId, reason)` | `Promise<void>` | Cancel proposal |
| `acceptProposal` | `(proposalId)` | `Promise<Proposal>` | Accept proposal |

#### proposalDataFetcher.js

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `fetchProposalData` | `(proposalId)` | `Promise<ProposalData>` | Fetch full proposal data |
| `fetchProposalsForUser` | `(userId, userType)` | `Promise<Proposal[]>` | Fetch user's proposals |

#### listingService.js

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `createListing` | `(listingData)` | `Promise<Listing>` | Create new listing |
| `updateListing` | `(listingId, data)` | `Promise<Listing>` | Update listing |
| `deleteListing` | `(listingId)` | `Promise<void>` | Delete listing |
| `submitListing` | `(listingId)` | `Promise<Listing>` | Submit listing for review |

#### listingDataFetcher.js

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `fetchListing` | `(listingId)` | `Promise<Listing>` | Fetch listing by ID |
| `fetchListingsForHost` | `(hostId)` | `Promise<Listing[]>` | Fetch host's listings |
| `searchListings` | `(filters)` | `Promise<Listing[]>` | Search listings |

#### emergencyService.js

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `reportEmergency` | `(emergencyData)` | `Promise<Emergency>` | Report emergency |
| `getEmergency` | `(emergencyId)` | `Promise<Emergency>` | Get emergency details |
| `updateEmergencyStatus` | `(emergencyId, status)` | `Promise<Emergency>` | Update emergency status |

#### slackService.js

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `sendSlackNotification` | `({ channel, message })` | `Promise<void>` | Send Slack notification |
| `sendSlackAlert` | `({ type, data })` | `Promise<void>` | Send Slack alert |

#### aiService.js

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `generateCompletion` | `({ prompt, model })` | `Promise<string>` | Generate AI completion |
| `parseProfile` | `(profileData)` | `Promise<ParsedProfile>` | AI profile parsing |

#### aiToolsService.js

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `queryAI` | `({ query, context })` | `Promise<Response>` | Query AI tools |
| `summarize` | `(text)` | `Promise<string>` | AI summarization |

#### pricingListService.js

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `getPricingList` | `(listingId)` | `Promise<PricingList>` | Get pricing list |
| `updatePricingList` | `(listingId, pricing)` | `Promise<PricingList>` | Update pricing |

#### guestRelationshipsApi.js

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `getGuestRelationships` | `(hostId)` | `Promise<Relationship[]>` | Get guest relationships |
| `updateRelationshipStatus` | `(relationshipId, status)` | `Promise<Relationship>` | Update relationship |

#### informationalTextsFetcher.js

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `fetchInformationalText` | `(key)` | `Promise<string>` | Fetch CMS text by key |
| `fetchAllTexts` | `()` | `Promise<TextMap>` | Fetch all CMS texts |

#### availabilityValidation.js

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `validateAvailability` | `({ listing, dates })` | `{ isAvailable, conflicts }` | Validate availability |
| `checkDateConflicts` | `({ listing, startDate, endDate })` | `Conflict[]` | Check for conflicts |

#### ctaConfig.js

| Export | Type | Purpose |
|--------|------|---------|
| `CTA_CONFIG` | `object` | Call-to-action configurations |
| `getCTAForStatus` | `function` | Get CTA for proposal status |

#### workflowClient.js

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `enqueueWorkflow` | `({ type, data })` | `Promise<WorkflowId>` | Enqueue workflow task |
| `getWorkflowStatus` | `(workflowId)` | `Promise<Status>` | Get workflow status |

#### emailTemplateRenderer.js

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `renderEmailTemplate` | `({ template, data })` | `string` | Render email template |
| `getTemplate` | `(templateName)` | `Template` | Get template definition |

#### oauthCallbackHandler.js

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| `handleOAuthCallback` | `({ provider, code })` | `Promise<AuthResult>` | Handle OAuth callback |
| `exchangeCodeForToken` | `({ provider, code })` | `Promise<Token>` | Exchange code for token |

---

### Sub-module: lib/proposals/

| File | Exports | Purpose |
|------|---------|---------|
| `dataTransformers.js` | `transformProposalForDisplay`, `transformProposalForAPI` | Proposal data transformation |
| `statusButtonConfig.js` | `getButtonConfig`, `BUTTON_CONFIGS` | Button configuration by status |
| `urlParser.js` | `parseProposalUrl`, `buildProposalUrl` | Proposal URL handling |
| `userProposalQueries.js` | `getProposalsForGuest`, `getProposalsForHost` | User proposal queries |

### Sub-module: lib/scheduleSelector/

| File | Exports | Purpose |
|------|---------|---------|
| `dayHelpers.js` | `getDaysBetween`, `sortDaysChronologically`, `isContiguousDays` | Day manipulation helpers |
| `nightCalculations.js` | `calculateNights`, `getNightsBetweenDays` | Night calculation helpers |
| `priceCalculations.js` | `calculateSchedulePrice`, `getPriceForNights` | Schedule pricing helpers |
| `validators.js` | `validateScheduleSelection`, `validateMinNights` | Schedule validation |

### Sub-module: lib/constants/

| File | Exports | Purpose |
|------|---------|---------|
| `listingFields.js` | `LISTING_FIELDS`, `REQUIRED_FIELDS`, `OPTIONAL_FIELDS` | Listing field definitions |
| `proposalStages.js` | `PROPOSAL_STAGES` | Proposal stage definitions |
| `proposalStatuses.js` | `PROPOSAL_STATUSES` | Proposal status definitions |

### Sub-module: lib/api/

| File | Exports | Purpose |
|------|---------|---------|
| `guestLeases.js` | `fetchGuestLeases`, `updateGuestLease` | Guest lease API |
| `identityVerificationService.js` | `initiateVerification`, `checkVerificationStatus` | Identity verification API |

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Page Components | 50+ |
| Shared Components | 25+ |
| Modal Components | 12 |
| Proposal Components | 7 |
| Global Hooks | 5 |
| Page Logic Hooks | 55+ |
| Calculator Functions | 20+ |
| Rule Functions | 50+ |
| Processor Functions | 25+ |
| Workflow Functions | 12+ |
| Edge Functions | 51 |
| Utility Functions | 100+ |
| **Total Documented Items** | **400+** |

---

## Architecture Patterns Reference

### Hollow Component Pattern
```jsx
// Component (UI only)
export default function SearchPage() {
  const { listings, filters, handleFilterChange } = useSearchPageLogic();
  return <div>{/* Pure rendering */}</div>;
}

// Hook (logic only)
export function useSearchPageLogic() {
  const [listings, setListings] = useState([]);
  // All state, effects, handlers
  return { listings, filters, handleFilterChange };
}
```

### Four-Layer Logic
```
Calculators (calculate*, get*) → Pure math, numbers
    ↓
Rules (can*, is*, has*) → Boolean predicates
    ↓
Processors (adapt*, format*, process*) → Data transformation
    ↓
Workflows (*Workflow) → Orchestration, side effects
```

### Day Indexing Convention
```javascript
// JavaScript: 0-6 (Sun=0, Mon=1, ..., Sat=6)
// Bubble API: 1-7 (Sun=1, Mon=2, ..., Sat=7)

// Receiving from Bubble
const jsDays = adaptDaysFromBubble({ bubbleDays: [2, 3, 4] }); // → [1, 2, 3]

// Sending to Bubble
const bubbleDays = adaptDaysToBubble({ jsDays: [1, 2, 3] }); // → [2, 3, 4]
```

### Edge Function Action Pattern
```typescript
// Request format
{ action: "create", payload: { ... } }

// Handler pattern
switch (action) {
  case 'create': return handleCreate(payload);
  case 'update': return handleUpdate(payload);
  // ...
}
```

---

**VERSION**: 1.0
**GENERATED**: 2026-01-28
**SCOPE**: Complete codebase function inventory
