# Dead Code Exploration Report

**Generated**: 2026-02-05
**Agent**: Agent 2 - UI
**Phase**: Phase 0 - Explore Dead Code
**Mode**: READ-ONLY exploration (no edits made)

---

## Summary

| Category | Count |
|----------|-------|
| Unused variables (lint warnings) | 80+ |
| Unused files (knip) | 279 |
| Unused exports (knip) | 148 |
| Unused types (knip) | 66 |
| Duplicate exports (knip) | 79 |
| Empty directories | 15 |
| Deprecated CSS files | 3 |
| Legacy directories | 3 |

---

## Unused Variables (from lint)

Sample of significant unused variable warnings from `bun run lint`:

| File | Line | Variable | Category |
|------|------|----------|----------|
| `AccountProfilePage/components/AvailabilityTab.jsx` | 7 | `profileData` | Unused import |
| `AccountProfilePage/components/AvailabilityTab.jsx` | 9 | `verifications` | Unused import |
| `AccountProfilePage/components/AvailabilityTab.jsx` | 12 | `onDayToggle` | Unused import |
| `AccountProfilePage/components/ProfileTab.jsx` | 8 | `onSaveEmergency` | Unused import |
| `AccountProfilePage/components/ProfileTab.jsx` | 10 | `onDayToggle` | Unused import |
| `AccountProfilePage/useAccountProfilePageLogic.js` | 9 | `processUserData` | Unused import |
| Various test files | Multiple | `React` | Unused in tests |
| `logic/rules/proposals/useProposalButtonStates.js` | 8 | `useEffect` | Unused import |
| `lib/proposals/userProposalQueries.js` | 1 | `proposalStatuses` | Unused import |

**Note**: Many `React is defined but never used` warnings in test files due to JSX transform.

---

## Unused Files (from knip)

### High-Priority: Entire Unused Directories

| Directory | Description | Recommendation |
|-----------|-------------|----------------|
| `islands/pages/ViewSplitLeasePage_LEGACY/` | Legacy page implementation | Archive/remove |
| `islands/pages/ViewSplitLeasePage/_LEGACY/` | Nested legacy folder | Archive/remove |
| `islands/shared/AIRoomRedesign/` | Unused AI feature | Review for removal |
| `islands/shared/BiddingInterface/` | Unused bidding feature | Review for removal |
| `islands/shared/DateChangeRequestManager/` | Unused feature module | Review for removal |
| `islands/shared/AISuggestions/` | Unused AI suggestions | Review for removal |
| `islands/shared/DocumentChangeRequestModal/` | Unused modal | Review for removal |
| `islands/shared/FeedbackWidget/` | Unused feedback widget | Review for removal |
| `islands/shared/HostReviewGuest/` | Unused review feature | Review for removal |
| `islands/shared/PriceAnchoring/` | Unused pricing feature | Review for removal |
| `islands/shared/QRCodeDashboard/` | Unused QR feature | Review for removal |

### High-Priority: Unused Hook Files

| File | Description | Safe to Remove? |
|------|-------------|-----------------|
| `lib/useBiddingRealtime.js` | Bidding realtime hook | Yes (bidding unused) |
| `lib/useContractGenerator.js` | Contract generation | Verify dependencies |
| `lib/useDataLookups.js` | Data lookup hook | Verify usage |
| `logic/rules/proposals/useProposalButtonStates.js` | Proposal button states | Verify usage |

### High-Priority: Unused Page Files

| File | Description | Safe to Remove? |
|------|-------------|-----------------|
| `islands/pages/ReferralDemoPage.jsx` | Demo page | Yes |
| `islands/pages/ViewSplitLeasePage.tsx` | TypeScript duplicate | Verify which is primary |
| `islands/pages/PreviewSplitLeasePage (1).tsx` | Duplicate file | Yes |

### High-Priority: Unused Modal Files

| File | Description | Safe to Remove? |
|------|-------------|-----------------|
| `islands/modals/EditProposalModal.jsx` | Edit proposal modal | Verify usage |
| `islands/modals/ProposalDetailsModal.jsx` | Proposal details modal | Verify if replaced |

---

## Potentially Orphan Components

| Component | Last Import Found | Recommendation |
|-----------|-------------------|----------------|
| `ViewSplitLeasePage_LEGACY/ViewSplitLeasePage.jsx` | Not imported | Archive/remove |
| `AIRoomRedesign/` (entire directory) | Not imported | Review for removal |
| `BiddingInterface/` (entire directory) | Not imported | Review for removal |
| `DateChangeRequestManager/` (entire directory) | Not imported | Review for removal |
| `AISuggestions/` (entire directory) | Not imported | Review for removal |
| `DocumentChangeRequestModal/` (entire directory) | Not imported | Review for removal |
| `FeedbackWidget/` (entire directory) | Not imported | Review for removal |
| `HostReviewGuest/` (entire directory) | Not imported | Review for removal |
| `PriceAnchoring/` (entire directory) | Not imported | Review for removal |
| `QRCodeDashboard/` (entire directory) | Not imported | Review for removal |
| `lib/scheduleSelector/goldenScheduleValidator.js` | Not imported | Review for removal |

---

## Unused CSS Classes

### Deprecated CSS Files

| File | Lines | Status | Safe to Remove? |
|------|-------|--------|-----------------|
| `styles/components/search-page-old.css` | 750 | Not imported in main.css | Yes |
| `styles/components/create-listing-modal (1).css` | ~200+ | Duplicate file (with `(1)` suffix) | Yes |
| `ViewSplitLeasePage_LEGACY/ViewSplitLeasePage.module.css` | ~1000+ | Legacy module CSS | Yes (with parent) |

### CSS Classes in Deprecated Files

All classes in `search-page-old.css` are unused (file not imported):

| Class | File | Safe to Remove? |
|-------|------|-----------------|
| `.search-page` | search-page-old.css | Yes |
| `.filter-panel` | search-page-old.css | Yes |
| `.filter-toggle-btn` | search-page-old.css | Yes |
| `.map-section` | search-page-old.css | Yes |
| `.neighborhood-chip` | search-page-old.css | Yes |
| `.neighborhood-list` | search-page-old.css | Yes |
| `.google-map-container` | search-page-old.css | Yes |
| `.deep-research-floating-btn` | search-page-old.css | Yes |
| `.chat-widget` | search-page-old.css | Yes |
| `.marker-cluster` | search-page-old.css | Yes |
| `.market-legend` | search-page-old.css | Yes |

---

## Empty Directories

| Directory | Recommendation |
|-----------|----------------|
| `islands/pages/AccountProfilePage/components/RentalApplicationWizardModal/steps` | Remove if unused |
| `islands/pages/components/ViewSplitLeasePage` | Remove |
| `islands/pages/FavoritesPageV2` | Remove or develop |
| `islands/pages/ViewSplitLeasePage/config` | Remove if empty |
| `islands/pages/ViewSplitLeasePage/types` | Remove if empty |
| `islands/pages/ViewSplitLeasePage/_LEGACY/components` | Remove with parent |
| `islands/pages/ViewSplitLeasePageComponents` | Remove |
| `islands/shared/LoggedInHeaderAvatar2` | Remove |
| `islands/shared/NeighborhoodInsight` | Remove or develop |
| `islands/shared/ValueInsights` | Remove or develop |
| `lib/fp` | Remove |
| `logic/processors/external` | Verify usage |
| `routes` | Verify purpose |
| `tests/calculators` | Add tests or remove |
| `tests/hooks` | Add tests or remove |

---

## Knip Configuration Hints

The knip tool reported 7 configuration hints to improve accuracy:

1. Enable `compilers` for parsing `.vue`, `.svelte`, `.astro` files (if applicable)
2. Verify entry points are correctly configured
3. Add ignore patterns for intentionally unused code
4. Configure workspace-specific settings if using monorepo
5. Exclude test fixtures from unused file detection
6. Add plugin configuration for framework-specific files
7. Review and refine entry file patterns

---

## Recommendations

### Immediate Actions (Low Risk)

1. **Remove empty directories** (15 total) - These provide no value
2. **Remove `search-page-old.css`** - Not imported, superseded by `search-page.css`
3. **Remove `create-listing-modal (1).css`** - Duplicate file with OS suffix
4. **Archive `ViewSplitLeasePage_LEGACY/`** - Clearly marked legacy

### Short-Term Actions (Medium Risk)

1. **Review unused feature modules** - Many entire directories are unused:
   - `AIRoomRedesign/`, `BiddingInterface/`, `DateChangeRequestManager/`
   - `AISuggestions/`, `FeedbackWidget/`, `HostReviewGuest/`
   - `PriceAnchoring/`, `QRCodeDashboard/`

2. **Fix lint warnings** - Address unused imports to reduce noise:
   - Remove unused `React` imports in test files
   - Remove unused destructured props in AccountProfilePage components

3. **Clean up duplicate/backup files** - Files with `(1)` suffix or `.backup`:
   - `PreviewSplitLeasePage (1).tsx`
   - `create-listing-modal (1).css`

### Long-Term Actions (Requires Verification)

1. **Verify and remove unused hooks** - Many hooks may be legacy:
   - `useBiddingRealtime.js`, `useContractGenerator.js`
   - `useDataLookups.js`, `useProposalButtonStates.js`

2. **Review knip findings** - 279 unused files warrant detailed review
3. **Configure knip properly** - Address 7 configuration hints for accurate reporting

---

## Estimated Code Reduction

| Category | Estimated Size |
|----------|---------------|
| Legacy directories | ~150KB |
| Unused CSS files | ~30KB |
| Unused feature modules | ~200KB+ |
| Empty directories | 0KB (cleanup) |
| Duplicate files | ~20KB |
| **Total Potential Reduction** | **~400KB+** |

---

## Verification Checklist

Before removing any code, verify:

- [ ] File is not dynamically imported via `import()`
- [ ] File is not referenced in route configurations
- [ ] File is not used by build scripts
- [ ] File is not needed for testing
- [ ] Feature was intentionally removed (not just temporarily disabled)

---

## Next Steps

1. Review this report with the team
2. Prioritize cleanup based on risk level
3. Create backup before mass deletion
4. Remove code in phases with testing between phases
5. Update knip configuration for accurate future reports

---

**END OF REPORT**
