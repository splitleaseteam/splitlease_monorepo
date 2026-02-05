# HostProposalsPage Data Layer Exploration

**Phase**: 1 (Agent-B)
**Date**: 2026-02-04
**Purpose**: Map dead code and data patterns before making changes

---

## Task 1: Dead Components Analysis

### Component Import Status

| Component | Imported By | Status |
|-----------|-------------|--------|
| DayIndicator.jsx | ProposalCard.jsx, ProposalDetailsModal.jsx | **USED** |
| EmptyState.jsx | ProposalGrid.jsx | **DEAD** (parent is dead) |
| ProposalGrid.jsx | None | **DEAD** |
| ListingSelector.jsx | SimulationHostMobilePage.jsx | **USED** (externally) |
| ListingPillSelector.jsx | index.jsx | **USED** |
| ProposalDetailsModal.jsx | index.jsx | **USED** |
| ProposalListSection.jsx | index.jsx | **USED** |
| QuickLinksRow.jsx | ProposalCardBody.jsx | **USED** |
| DayPillsRow.jsx | ProposalCardBody.jsx | **USED** |
| CollapsibleProposalCard.jsx | ProposalListSection.jsx | **USED** |
| GuestInfoCard.jsx | ProposalCardBody.jsx | **USED** |
| ProposalCard.jsx | ProposalGrid.jsx | **DEAD** (parent is dead) |
| InfoGrid.jsx | ProposalCardBody.jsx | **USED** |
| StatusBanner.jsx | ProposalCardBody.jsx | **USED** |
| ProgressTrackerV7.jsx | ProposalCardBody.jsx | **USED** |
| ProposalCardBody.jsx | CollapsibleProposalCard.jsx | **USED** |
| ActionButtonsRow.jsx | ProposalCardBody.jsx, NarrativeProposalBody.jsx | **USED** |
| NarrativeProposalBody.jsx | ProposalCardBody.jsx | **USED** |
| PricingRow.jsx | ProposalCardBody.jsx | **USED** |
| ProposalCardHeader.jsx | CollapsibleProposalCard.jsx | **USED** |
| AISummaryCard.jsx | ProposalCardBody.jsx | **USED** |
| formatters.js | NarrativeProposalBody.jsx, ProposalCard.jsx, ProposalDetailsModal.jsx | **PARTIALLY USED** |

### Dead Components Summary

| Component | Reason |
|-----------|--------|
| **ProposalGrid.jsx** | Not imported by index.jsx - replaced by V7 design |
| **EmptyState.jsx** | Only imported by dead ProposalGrid.jsx |
| **ProposalCard.jsx** | Only imported by dead ProposalGrid.jsx - replaced by CollapsibleProposalCard |

---

## Task 2: types.js Export Audit

### Export Status

| Export | Used By | Status |
|--------|---------|--------|
| `PROPOSAL_STATUSES` | External logic layer files | **USED** |
| `PROGRESS_THRESHOLDS` | ProposalDetailsModal.jsx | **USED** |
| `getStatusTagInfo` | ProposalCard.jsx, ProposalDetailsModal.jsx | **USED** |
| `DAYS` | DayIndicator.jsx | **USED** |
| `getActiveDays` | None | **UNUSED** |
| `getNightsAsDayNames` | ProposalCard.jsx, ProposalDetailsModal.jsx | **USED** |
| `getCheckInOutFromDays` | InfoGrid.jsx, ProposalCard.jsx, ProposalDetailsModal.jsx, ProposalCardHeader.jsx | **USED** |
| `getCheckInOutFromNights` | DayPillsRow.jsx | **USED** (marked @deprecated) |
| `groupProposalsBySection` | index.jsx | **USED** |
| `getCardVariant` | CollapsibleProposalCard.jsx | **USED** |
| `getStatusTagConfig` | ProposalCardHeader.jsx | **USED** |
| `isNewProposal` | DayIndicator.jsx, useHostProposalsPageLogic.js | **USED** |

### Unused Exports

1. **`getActiveDays`** - Not imported anywhere in the codebase

---

## Task 3: Hardcoded Field Names

### Primary Targets (Bubble.io Legacy Fields)

#### `'rental type'` (15 occurrences)
- `formatters.js:155`
- `PricingRow.jsx:32`
- `ProposalDetailsModal.jsx:157`
- `useHostProposalsPageLogic.js:145,543`

#### `'4 week compensation'` (21 occurrences)
- `formatters.js:143,145,147,151,166,172,178`
- `PricingRow.jsx:36,39,40,64,70,80,86,92`
- `ProposalCardHeader.jsx:94,96,101,102,105`
- `useHostProposalsPageLogic.js:131,524`

#### `duration_weeks` (8 occurrences)
- `formatters.js:138`
- `InfoGrid.jsx:117`
- `index.jsx:97` (mock data)
- `PricingRow.jsx:62`
- `ProposalCardHeader.jsx:76,103`
- `useHostProposalsPageLogic.js:123,918`

### Other Hardcoded Bubble Field Names

| Field Name | Occurrences |
|------------|-------------|
| `'Listing Name'` | 2 |
| `'Name - First'` | 4 |
| `'Name - Last'` | 1 |
| `'First Name'` | 4 |
| `'Last Name'` | 1 |
| `'Rental Type'` | 1 |
| `'User Type'` | 1 |
| `'proposal nightly price'` | 3 |
| `'Monthly Rate'` | 1 |
| `'Days Selected'` | 1 |
| `'nights per week (num)'` | 1 |
| `'Reservation Span (Weeks)'` | 2 |
| `'hc move in date'` | 1 |
| `'hc reservation span (weeks)'` | 1 |
| `'hc days selected'` | 1 |
| `'hc nights selected'` | 2 |
| `'counter offer happened'` | 2 |
| `'Move in range start'` | 1 |
| `'Nights Selected (Nights list)'` | 2 |

---

## formatters.js Analysis

### Export Status

| Function | Status |
|----------|--------|
| `formatCurrency` | **USED** |
| `formatDate` | **USED** |
| `formatDateTime` | **USED** (by ProposalDetailsModal) |
| `generateNarrativeText` | **USED** |
| `formatFullDate` | **POTENTIALLY UNUSED** |
| `formatTime` | **POTENTIALLY UNUSED** |
| `formatDateRange` | **POTENTIALLY UNUSED** |

---

## Recommendations for Phase 2

### Priority 1: Remove Dead Components
1. Delete `ProposalGrid.jsx`
2. Delete `EmptyState.jsx`
3. Delete `ProposalCard.jsx`

### Priority 2: Clean Up types.js
1. Remove `getActiveDays` function
2. Evaluate `getCheckInOutFromNights` deprecation

### Priority 3: Create Field Mapping Abstraction
- Centralize field mappings in `app/src/data/fieldMappings.js`
- Use existing `normalizeProposal` function as template
- Migrate direct field access to normalized names

### Priority 4: Consolidate formatters.js
- Audit usage of `formatFullDate`, `formatTime`, `formatDateRange`
- Remove unused formatters

### Migration Path
1. **Phase 2A**: Delete dead components
2. **Phase 2B**: Remove unused exports
3. **Phase 2C**: Centralize field mappings
4. **Phase 2D**: Audit and clean up formatters.js
