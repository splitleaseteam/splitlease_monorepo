# HostProposalsPage - Deferred Field Migration

**Date**: 2026-02-04
**Phase**: Agent-B Phase 2/3
**Decision**: DEFERRED to app-wide migration wave

---

## Summary

During HostProposalsPage dead code cleanup, we identified **26 files** containing hardcoded Bubble field names (`'rental type'`). This pattern is too widespread for page-scoped cleanup and requires coordinated app-wide migration.

---

## Affected Files (26 total)

### HostProposalsPage (3 files - original scope)
1. `app/src/islands/pages/HostProposalsPage/useHostProposalsPageLogic.js`
2. `app/src/islands/pages/HostProposalsPage/formatters.js`
3. `app/src/islands/pages/HostProposalsPage/PricingRow.jsx`
4. `app/src/islands/pages/HostProposalsPage/ProposalDetailsModal.jsx`

### ListingDashboardPage (2 files)
5. `app/src/islands/pages/ListingDashboardPage/components/PricingEditSection.jsx`
6. `app/src/islands/pages/ListingDashboardPage/hooks/useListingData.js`

### Search & Browse (3 files)
7. `app/src/islands/pages/useSearchPageLogic.js`
8. `app/src/islands/pages/FavoriteListingsPage/FavoriteListingsPage.jsx`
9. `app/src/islands/pages/PreviewSplitLeasePage.jsx`

### Proposal Management (3 files)
10. `app/src/islands/pages/ProposalManagePage/useProposalManagePageLogic.js`
11. `app/src/islands/pages/ProposalManagePage/QuickProposalCreation.jsx`
12. `app/src/islands/pages/CreateSuggestedProposalPage/suggestedProposalService.js`
13. `app/src/islands/pages/CreateSuggestedProposalPage/components/ListingSearch.jsx`

### Host Pages (2 files)
14. `app/src/islands/pages/HostOverviewPage/useHostOverviewPageLogic.js`
15. `app/src/islands/pages/QuickPricePage/useQuickPricePageLogic.js`

### Messaging (1 file)
16. `app/src/islands/pages/MessagingPage/useMessagingPageLogic.js`

### Modify Listings (2 files)
17. `app/src/islands/pages/ModifyListingsPage/sections/LeaseStylesSection.jsx`
18. `app/src/islands/pages/ModifyListingsPage/useModifyListingsPageLogic.js`

### Legacy/Deprecated (1 file)
19. `app/src/islands/pages/ViewSplitLeasePage_LEGACY/ViewSplitLeasePage.jsx`

### Test/Unit Pages (7 files)
20. `app/src/islands/pages/ZPricingUnitTestPage/useZPricingUnitTestPageLogic.js`
21. `app/src/islands/pages/ZPricingUnitTestPage/components/Section5PricingListGrid.jsx`
22. `app/src/islands/pages/ZPricingUnitTestPage/ZPricingUnitTestPage.jsx`
23. `app/src/islands/pages/ZUnitPaymentRecordsJsPage/useZUnitPaymentRecordsJsPageLogic.js`
24. `app/src/islands/pages/ZUnitPaymentRecordsJsPage/ZUnitPaymentRecordsJsPage.jsx`
25. `app/src/islands/pages/ZScheduleTestPage/useZScheduleTestPageLogic.js`
26. `app/src/islands/pages/ZScheduleTestPage/ZScheduleTestPage.jsx`

---

## Other Hardcoded Bubble Fields (from Phase 1)

| Field Pattern | Estimated Occurrences |
|---------------|----------------------|
| `'rental type'` | 44+ |
| `'4 week compensation'` | 21 |
| `duration_weeks` | 8 |
| `'Listing Name'` | 2 |
| `'Name - First'` | 4 |
| `'First Name'` | 4 |
| `'proposal nightly price'` | 3 |
| Other Bubble fields | 30+ |

---

## Recommendation

### Proposed Solution: Centralized Field Mapping

1. **Create centralized mapping** in `app/src/data/fieldMappings.js`:
   ```javascript
   export const BUBBLE_FIELDS = {
     rentalType: 'rental type',
     fourWeekCompensation: '4 week compensation',
     durationWeeks: 'duration_weeks',
     // ... etc
   };
   ```

2. **Create accessor functions**:
   ```javascript
   export const getField = (obj, fieldKey) => obj?.[BUBBLE_FIELDS[fieldKey]];
   ```

3. **Migrate files systematically**:
   - Production files first (non-Z* prefix)
   - Test files last
   - Legacy files can be skipped if deprecated

### Migration Order (Recommended)
1. Core proposal files (HostProposalsPage, ProposalManagePage)
2. Listing files (ListingDashboardPage, SearchPage)
3. Host dashboard files
4. Messaging files
5. Test/unit pages (lowest priority)

---

## Estimated Scope

| Metric | Count |
|--------|-------|
| Files to migrate | 26 |
| Field patterns to replace | 8-10 unique |
| Total string replacements | 100+ |
| Recommended approach | App-wide epic with phased rollout |

---

## Status

- **Current**: DEFERRED
- **Reason**: Scope exceeds single-page cleanup; requires coordinated effort
- **Priority**: Medium (technical debt, not blocking)
- **Tracked in**: This document
