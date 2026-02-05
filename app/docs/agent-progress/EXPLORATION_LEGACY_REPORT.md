# Legacy Patterns Exploration Report

**Generated:** 2026-02-05
**Scope:** READ-ONLY codebase analysis
**Status:** Complete

---

## Executive Summary

| Category | Occurrences | Files | Priority |
|----------|-------------|-------|----------|
| Legacy Terminology ("roommate") | 520 | 58 | Medium |
| TODO Comments | 38 | 19 | Low |
| Console Statements (log/warn/error) | ~2,168 | 300+ | Low |
| FIXME Comments | 0 | 0 | N/A |
| HACK Comments | 1 | 1 | Low |
| XXX Comments | 118 | 48 | Low (mostly docs) |

---

## 1. Legacy Terminology: "roommate" vs "co-tenant"

**Finding:** 520 occurrences of "roommate" across 58 files

The term "roommate" is used throughout the codebase but should be updated to "co-tenant" for consistency with the database schema (`Lease Type = 'co_tenant'`).

### High-Impact Files (ScheduleDashboard Components)

| File | Location |
|------|----------|
| `RoommateProfileCard.jsx` | `app/src/islands/pages/ScheduleDashboard/components/` |
| `useScheduleDashboardLogic.js` | `app/src/islands/pages/ScheduleDashboard/` |
| `scheduleDashboardApi.js` | `app/src/islands/pages/ScheduleDashboard/api/` |
| `ScheduleCalendar.jsx` | `app/src/islands/pages/ScheduleDashboard/components/` |
| `ChatThread.jsx` | `app/src/islands/pages/ScheduleDashboard/components/` |
| `CalendarDay.jsx` | `app/src/islands/pages/ScheduleDashboard/components/` |
| `ReservationHeader.jsx` | `app/src/islands/pages/ScheduleDashboard/components/` |
| `BuyOutPanel.jsx` | `app/src/islands/pages/ScheduleDashboard/components/` |
| `IncomingRequest.jsx` | `app/src/islands/pages/ScheduleDashboard/components/` |
| `RequestConfirmation.jsx` | `app/src/islands/pages/ScheduleDashboard/components/` |
| `RequestTypeSelector.jsx` | `app/src/islands/pages/ScheduleDashboard/components/` |
| `FlexibilityBreakdownModal.jsx` | `app/src/islands/pages/ScheduleDashboard/components/` |
| `LeaseInfoBar.jsx` | `app/src/islands/pages/ScheduleDashboard/components/` |

### Mobile Dashboard Files

| File | Location |
|------|----------|
| `MobileScheduleDashboard.jsx` | `app/src/islands/pages/ScheduleDashboard/mobile/` |
| `MobileHeader.jsx` | `app/src/islands/pages/ScheduleDashboard/mobile/components/` |
| `MobileCalendar.jsx` | `app/src/islands/pages/ScheduleDashboard/mobile/components/` |
| `DayDetailPanel.jsx` | `app/src/islands/pages/ScheduleDashboard/mobile/components/` |
| `TransactionDetailView.jsx` | `app/src/islands/pages/ScheduleDashboard/mobile/components/` |
| `SharingSection.jsx` | `app/src/islands/pages/ScheduleDashboard/mobile/components/` |
| `MobileChatView.jsx` | `app/src/islands/pages/ScheduleDashboard/mobile/components/` |
| `ChatMessages.jsx` | `app/src/islands/pages/ScheduleDashboard/mobile/components/` |

### DateChangeRequestManager Files

| File | Location |
|------|----------|
| `DateChangeRequestManager.jsx` | `app/src/islands/shared/DateChangeRequestManager/` |
| `DateChangeRequestCalendar.jsx` | `app/src/islands/shared/DateChangeRequestManager/` |
| `RequestTypeSelector.jsx` | `app/src/islands/shared/DateChangeRequestManager/` |
| `dateChangeRequestService.js` | `app/src/islands/shared/DateChangeRequestManager/` |
| `defaultSelectionEngine.ts` | `app/src/islands/shared/DateChangeRequestManager/utils/` |
| `transactionTypes.ts` | `app/src/islands/shared/DateChangeRequestManager/types/` |
| `usePersonalizedDefaults.ts` | `app/src/islands/shared/DateChangeRequestManager/hooks/` |

### TransactionSelector Files

| File | Location |
|------|----------|
| `TransactionSelector.tsx` | `app/src/islands/shared/TransactionSelector/` |
| `BuyoutCard.tsx` | `app/src/islands/shared/TransactionSelector/` |
| `SwapCard.tsx` | `app/src/islands/shared/TransactionSelector/` |
| `CrashCard.tsx` | `app/src/islands/shared/TransactionSelector/` |

### Logic/Calculator Files

| File | Location |
|------|----------|
| `adaptLeaseFromSupabase.js` | `app/src/logic/processors/leases/` |
| `calculateNoticePricing.js` | `app/src/logic/calculators/buyout/` |
| `buyout/index.js` | `app/src/logic/calculators/buyout/` |
| `checkBiddingEligibility.js` | `app/src/logic/bidding/rules/` |

### State/Hook Files

| File | Location |
|------|----------|
| `useScheduleState.js` | `app/src/islands/pages/ScheduleDashboard/state/` |
| `deriveData.js` | `app/src/islands/pages/ScheduleDashboard/state/` |
| `useRequestActions.js` | `app/src/islands/pages/ScheduleDashboard/hooks/` |
| `usePricingOverlays.js` | `app/src/islands/pages/ScheduleDashboard/hooks/` |
| `usePerspective.js` | `app/src/islands/pages/ScheduleDashboard/hooks/` |
| `usePricingBase.js` | `app/src/islands/pages/ScheduleDashboard/hooks/` |
| `useCalendarState.js` | `app/src/islands/pages/ScheduleDashboard/hooks/` |

### CSS Files

| File | Location |
|------|----------|
| `schedule-dashboard.css` | `app/src/styles/components/` |
| `mobile-dashboard.css` | `app/src/islands/pages/ScheduleDashboard/mobile/styles/` |
| `mobile-calendar.css` | `app/src/islands/pages/ScheduleDashboard/mobile/styles/` |

### Other Files

| File | Location |
|------|----------|
| `listingDataFetcher.js` | `app/src/lib/` |
| `BiddingService.js` | `app/src/services/` |
| `analyticsService.js` | `app/src/services/` |
| `useRentalApplicationWizardLogic.js` | `app/src/islands/shared/RentalApplicationWizardModal/` |
| `useRentalApplicationPageLogic.js` | `app/src/islands/pages/` |
| `AboutCard.jsx` | `app/src/islands/pages/AccountProfilePage/components/cards/` |
| `mockData.js` | `app/src/islands/pages/ScheduleDashboard/data/` |
| `types.js` | `app/src/islands/pages/FavoriteListingsPage/` |

---

## 2. TODO Comments

**Finding:** 38 occurrences across 19 files

### Files with TODO Comments

| File | Location |
|------|----------|
| `useScheduleDashboardLogic.js` | `app/src/islands/pages/ScheduleDashboard/` |
| `useManageLeasesPageLogic.js` | `app/src/islands/pages/ManageLeasesPaymentRecordsPage/` |
| `scheduleDashboardApi.js` | `app/src/islands/pages/ScheduleDashboard/api/` |
| `ReferralBanner.jsx` | `app/src/islands/pages/AccountProfilePage/components/` |
| `useAccountProfilePageLogic.js` | `app/src/islands/pages/AccountProfilePage/` |
| `useHostProposalsPageLogic.js` | `app/src/islands/pages/HostProposalsPage/` |
| `ProposalCard.jsx` | `app/src/islands/pages/proposals/` |
| `PhotosSection.jsx` | `app/src/islands/pages/ListingDashboardPage/components/` |
| `SelfListingPageV2.tsx` | `app/src/islands/pages/SelfListingPageV2/` |
| `useHostOverviewPageLogic.js` | `app/src/islands/pages/HostOverviewPage/` |
| `useGuestLeasesPageLogic.js` | `app/src/islands/pages/guest-leases/` |
| `useProposalManagePageLogic.js` | `app/src/islands/pages/ProposalManagePage/` |
| `useMessagingPageLogic.js` | `app/src/islands/pages/MessagingPage/` |
| `useLeasesOverviewPageLogic.js` | `app/src/islands/pages/LeasesOverviewPage/` |
| `useCompareTermsModalLogic.js` | `app/src/islands/modals/` |
| `CreateDuplicateListingModal.jsx` | `app/src/islands/shared/CreateDuplicateListingModal/` |
| `useScheduleSelectorLogicCore.js` | `app/src/islands/shared/` |
| `CLAUDE.md` | `app/src/islands/pages/ListingDashboardPage/` |
| `SECURE_AUTH_README.md` | `app/src/lib/` |

---

## 3. Console Statements

### console.log
**Finding:** 1,110 occurrences across 181 files

### console.warn
**Finding:** 529 occurrences across 225 files

### console.error
**Finding:** 529+ occurrences (large output, stored in tool results file)

**Note:** Console statements are extensive throughout the codebase. Many are intentional for debugging in development. Consider implementing a centralized logging utility with environment-based filtering for production builds.

---

## 4. FIXME Comments

**Finding:** 0 occurrences

No FIXME comments found in the codebase.

---

## 5. HACK Comments

**Finding:** 1 occurrence across 1 file

| File | Location |
|------|----------|
| `20260202-verification-audit-report.md` | `.claude/plans/Documents/` |

**Assessment:** Not in production code, only in documentation/plans.

---

## 6. XXX Comments

**Finding:** 118 occurrences across 48 files

**Assessment:** Most XXX occurrences are in:
- Documentation files (`.md`)
- Plan files (`.claude/plans/`)
- Agent orchestrator files (`.claude/agents/`)
- Generated reports

Very few are in actual source code. The XXX marker appears to be used primarily in documentation templates rather than as code markers.

---

## 7. Hardcoded Values

### localhost References
**Finding:** 1 occurrence in source code

| File | Pattern |
|------|---------|
| `referral-demo.jsx` | `localhost:\d+` |

### Hardcoded URLs
**Finding:** 8 occurrences across 5 files

| File | Location |
|------|----------|
| `TestPage.jsx` | `app/src/islands/shared/AiSignupMarketReport/` |
| `HelpCenterCategoryPage.jsx` | `app/src/islands/pages/` |
| `package.json` | `app/src/islands/shared/UrgencyCountdown/` |
| `Footer.jsx` | `app/src/islands/shared/` |
| `Section5Rules.tsx` | `app/src/islands/pages/SelfListingPage/sections/` |

**Assessment:** Most are legitimate split.lease domain references (social links, documentation URLs). Not problematic.

### Hardcoded Bubble IDs
**Finding:** 0 occurrences in app/src

No hardcoded Bubble IDs (pattern: `17\d{14}x\d{17}`) found in source code.

---

## Recommendations

### High Priority
1. **Terminology Update**: Create a migration plan to replace "roommate" with "co-tenant" across the ScheduleDashboard and DateChangeRequestManager components. This should be a coordinated effort to maintain consistency.

### Medium Priority
2. **Console Statement Audit**: Implement a centralized logging utility that:
   - Uses `console.log` only in development
   - Uses structured logging in production
   - Filters sensitive data automatically

### Low Priority
3. **TODO Cleanup**: Review the 38 TODO comments and either:
   - Create tickets for actionable items
   - Remove stale TODOs that are no longer relevant

4. **Documentation**: The XXX and HACK markers in documentation are not issues but could be cleaned up for clarity.

---

## Data Integrity Reference

From Phase 7 analysis:
- 344 orphaned stays (legacy data)
- 0 invalid user references
- 206 total leases (203 guest_host + 3 co_tenant test data)
- 17,709 total stays

---

**Report Status:** Complete
**Last Updated:** 2026-02-05
