# Implementation Plan: Narrative Mobile View for Guest Proposals Page

**Created**: 2026-01-27
**Status**: Ready for Execution
**Priority**: Mobile-only enhancement (≤640px)
**Risk Level**: Low - Additive change with CSS-only show/hide pattern

---

## Objective

Add a narrative mobile view to the Guest Proposals page that mirrors the approach implemented for Host Proposals. On mobile devices (≤640px), display proposal details as human-readable flowing paragraphs instead of the structured grid layout.

**Key principle**: Render BOTH views, let CSS handle visibility. No JavaScript breakpoint detection.

---

## Current Architecture Analysis

### Guest Proposals Structure (from exploration)

```
GuestProposalsPage.jsx (Hollow component)
└── ExpandableProposalCard.jsx (Main card component)
    ├── Collapsed Header Row (thumbnail, name, status, chevron)
    └── Expanded Content Panel (.epc-content)
        ├── MatchReasonCard (SL-suggested only)
        ├── NegotiationSummarySection (if applicable)
        ├── CounterofferSummarySection (if counteroffer)
        ├── StatusBanner
        ├── Detail Header (title, location, host)
        ├── Quick Links Row
        ├── Info Grid (4 columns)
        ├── Days Row (7 pills)
        ├── Pricing Row
        ├── Progress Tracker
        └── Actions Row
```

### Key Differences from Host Proposals

| Aspect | Host Proposals | Guest Proposals |
|--------|----------------|-----------------|
| **Perspective** | Host reviews guest's proposal | Guest reviews listing opportunity |
| **Primary Entity** | Guest (who wants to stay) | Listing/Host (where to stay) |
| **Action Buttons** | Accept/Modify/Decline | Confirm/Modify/Cancel |
| **Pricing Display** | "Earnings" (what host receives) | "Total Cost" (what guest pays) |
| **Context Info** | Guest bio, credentials | Listing details, host info |
| **Special States** | Guest counteroffer | Host counteroffer, SL-suggested |

### Data Fields Available (Guest Proposal)

```javascript
{
  // Schedule
  'Days Selected': number[],          // 0-indexed days
  'Reservation Span (Weeks)': number,
  'Move in range start': ISO date,

  // Pricing
  'proposal nightly price': number,
  'Total Price for Reservation (guest)': number,
  'cleaning fee': number,

  // Counteroffer (if exists)
  'hc days selected': number[],
  'hc reservation span (weeks)': number,
  'hc nightly price': number,
  'hc total price': number,
  'hc move in date': ISO date,

  // Listing relation
  listing: {
    Name: string,
    hoodName: string,
    boroughName: string,
    'Check in time': string,
    'Check Out time': string,
    host: { 'Name - First': string, 'Profile Photo': string }
  }
}
```

---

## Implementation Plan

### Phase 1: Create Narrative Generator Function

**File**: `app/src/islands/pages/proposals/displayUtils.js`

Add a new function `generateGuestNarrativeText(proposal)` that generates mobile-friendly narrative paragraphs.

```javascript
/**
 * Generates narrative text for mobile guest proposal display
 * @param {Object} proposal - Proposal object with listing relation
 * @returns {Object} - { duration, schedule, pricing, listingContext }
 */
export function generateGuestNarrativeText(proposal) {
  // Extract data with counteroffer priority
  const isCounteroffer = proposal?.['counter offer happened'];

  // Days selected (prefer counteroffer if exists)
  let daysSelected = isCounteroffer && proposal?.['hc days selected']?.length > 0
    ? proposal['hc days selected']
    : proposal?.['Days Selected'] || [];

  // Parse if string
  if (typeof daysSelected === 'string') {
    try { daysSelected = JSON.parse(daysSelected); } catch (e) { daysSelected = []; }
  }

  const nightsPerWeek = daysSelected.length;

  // Duration
  const durationWeeks = isCounteroffer && proposal?.['hc reservation span (weeks)']
    ? proposal['hc reservation span (weeks)']
    : proposal?.['Reservation Span (Weeks)'] || 0;

  // Pricing
  const nightlyRate = isCounteroffer && proposal?.['hc nightly price'] != null
    ? proposal['hc nightly price']
    : proposal?.['proposal nightly price'] || 0;

  const totalPrice = isCounteroffer && proposal?.['hc total price'] != null
    ? proposal['hc total price']
    : proposal?.['Total Price for Reservation (guest)'] || 0;

  const weeklyPrice = nightlyRate * nightsPerWeek;

  // Dates
  const moveInDate = isCounteroffer && proposal?.['hc move in date']
    ? proposal['hc move in date']
    : proposal?.['Move in range start'];

  // Format dates
  const startFormatted = moveInDate
    ? new Date(moveInDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    : '';

  // Calculate end date
  let endFormatted = '';
  if (moveInDate && durationWeeks) {
    const endDate = new Date(moveInDate);
    endDate.setDate(endDate.getDate() + (durationWeeks * 7));
    endFormatted = endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  // Get day range info (reuse existing getNightRangeInfo or create inline)
  const { dayRangeText, checkInDay, checkOutDay, isEveryDay } = getNightRangeInfo(daysSelected);
  const weekendsFree = !daysSelected.includes(0) && !daysSelected.includes(6);

  // Build narrative objects
  const weekWord = durationWeeks === 1 ? 'week' : 'weeks';

  const duration = {
    text: `This is a ${durationWeeks}-${weekWord} stay`,
    startDate: startFormatted,
    endDate: endFormatted
  };

  let scheduleText;
  if (isEveryDay) {
    scheduleText = `The schedule is every day of each week. That's ${nightsPerWeek} nights per week.`;
  } else {
    const weekendSuffix = weekendsFree ? ', with weekends free' : '';
    scheduleText = `The schedule is ${dayRangeText} each week — checking in ${checkInDay} and out ${checkOutDay}. That's ${nightsPerWeek} nights per week${weekendSuffix}.`;
  }

  const schedule = { text: scheduleText, dayRangeText, nightsPerWeek };

  const pricing = {
    nightlyRate,
    weeklyPrice,
    total: totalPrice,
    weeks: durationWeeks,
    cleaningFee: proposal?.['cleaning fee'] || 0
  };

  // Listing context (what guest sees about the listing)
  const listing = proposal?.listing || {};
  const host = listing?.host || {};
  const listingName = listing?.Name || 'Listing';
  const location = [listing?.hoodName, listing?.boroughName].filter(Boolean).join(', ') || 'New York';
  const hostFirstName = host?.['Name - First'] || host?.['Name - Full']?.split(' ')[0] || 'Host';
  const hostPhoto = host?.['Profile Photo'] || null;

  const listingContext = {
    listingName,
    location,
    hostFirstName,
    hostPhoto
  };

  return { duration, schedule, pricing, listingContext };
}
```

### Phase 2: Create NarrativeGuestProposalBody Component

**File**: `app/src/islands/pages/proposals/NarrativeGuestProposalBody.jsx` (NEW)

```jsx
/**
 * NarrativeGuestProposalBody Component (Mobile Only)
 *
 * Displays proposal details in a human-readable narrative format
 * instead of the structured grid layout. Only shown on mobile (≤640px).
 *
 * Structure:
 * 1. Listing context - Avatar + listing name + location
 * 2. Duration paragraph - "This is a 12-week stay..."
 * 3. Schedule paragraph - "The schedule is Monday through Friday..."
 * 4. Pricing paragraph - "At $165/night, this works out to..."
 * 5. Action row - Total cost + action buttons
 *
 * Part of the Guest Proposals V7 redesign.
 */
import React from 'react';
import { generateGuestNarrativeText, formatCurrency } from './displayUtils.js';

export function NarrativeGuestProposalBody({
  proposal,
  listing,
  host,
  onViewListing,
  onViewHostProfile,
  actionButtons // Pass the existing action buttons to maintain consistency
}) {
  const { duration, schedule, pricing, listingContext } = generateGuestNarrativeText(proposal);

  return (
    <div className="epc-narrative-body">
      {/* Listing context - simplified: name + location + view link */}
      <div className="epc-narrative-listing">
        {listingContext.hostPhoto ? (
          <img
            src={listingContext.hostPhoto}
            alt=""
            className="epc-narrative-host-avatar"
          />
        ) : (
          <div className="epc-narrative-host-avatar epc-narrative-avatar-placeholder">
            {listingContext.hostFirstName.charAt(0).toUpperCase()}
          </div>
        )}
        <p className="epc-narrative-listing-text">
          <strong>{listingContext.listingName}</strong>
          {' · '}
          <span className="epc-narrative-location">{listingContext.location}</span>
          {' · '}
          <button
            type="button"
            className="epc-narrative-link"
            onClick={onViewListing}
          >
            View listing
          </button>
        </p>
      </div>

      {/* Narrative paragraphs */}
      <div className="epc-narrative-content">
        {/* Duration paragraph */}
        <p className="epc-narrative-paragraph">
          {duration.text}, from{' '}
          <strong className="epc-highlight-purple">{duration.startDate}</strong> through{' '}
          <strong className="epc-highlight-purple">{duration.endDate}</strong>.
        </p>

        {/* Schedule paragraph - with dynamic highlighting */}
        <p className="epc-narrative-paragraph">
          {schedule.text.split(schedule.dayRangeText).map((part, i, arr) => (
            <React.Fragment key={i}>
              {i > 0 && <strong>{schedule.dayRangeText}</strong>}
              {part.split(`${schedule.nightsPerWeek} nights per week`).map((subpart, j, subarr) => (
                <React.Fragment key={j}>
                  {j > 0 && <strong>{schedule.nightsPerWeek} nights per week</strong>}
                  {subpart}
                </React.Fragment>
              ))}
            </React.Fragment>
          ))}
        </p>

        {/* Pricing paragraph */}
        <p className="epc-narrative-paragraph">
          At <strong className="epc-highlight-money">{formatCurrency(pricing.nightlyRate)}/night</strong>, this works out to{' '}
          <strong className="epc-highlight-money">{formatCurrency(pricing.weeklyPrice)} per week</strong> — totaling{' '}
          <strong className="epc-highlight-money">{formatCurrency(pricing.total)}</strong> over the {pricing.weeks} weeks.
        </p>
      </div>

      {/* Action row - total + buttons */}
      <div className="epc-narrative-actions">
        <div className="epc-narrative-total-area">
          <span className="epc-narrative-total">{formatCurrency(pricing.total)}</span>
          <span className="epc-narrative-total-label">estimated total</span>
        </div>

        {/* Render passed action buttons */}
        {actionButtons}
      </div>
    </div>
  );
}

export default NarrativeGuestProposalBody;
```

### Phase 3: Modify ExpandableProposalCard.jsx

**File**: `app/src/islands/pages/proposals/ExpandableProposalCard.jsx`

**Changes**:
1. Import the new `NarrativeGuestProposalBody` component
2. Wrap existing expanded content in `.epc-structured-body` class
3. Add narrative body rendering alongside structured body
4. CSS will handle show/hide based on viewport

```jsx
// Add import at top
import NarrativeGuestProposalBody from './NarrativeGuestProposalBody.jsx';

// In the render, wrap existing content:
<div ref={contentRef} className="epc-content">
  {/* Mobile Narrative View - CSS shows only on ≤640px */}
  <NarrativeGuestProposalBody
    proposal={proposal}
    listing={listing}
    host={host}
    onViewListing={() => window.open(getListingUrlWithProposalContext(listing?._id, {...}), '_blank')}
    onViewHostProfile={() => setShowHostProfileModal(true)}
    actionButtons={
      <div className="epc-actions-row">
        {/* Copy existing action buttons logic here or pass as children */}
      </div>
    }
  />

  {/* Desktop/Tablet Structured View - CSS shows only on >640px */}
  <div className="epc-structured-body">
    {/* All existing content stays here */}
    {isSuggested && <MatchReasonCard proposal={proposal} />}
    {negotiationSummaries.length > 0 && ...}
    {/* ... rest of existing content ... */}
  </div>
</div>
```

### Phase 4: Add Mobile Narrative CSS

**File**: `app/src/styles/components/guest-proposals.css`

Add new styles at the end of the file:

```css
/* ============================================================================
   MOBILE NARRATIVE VIEW (≤640px)

   Pattern: Render BOTH views, CSS handles visibility
   - Desktop/Tablet (>640px): Show .epc-structured-body, hide .epc-narrative-body
   - Mobile (≤640px): Show .epc-narrative-body, hide .epc-structured-body
   ============================================================================ */

/* Structured body - shown by default (desktop/tablet) */
.epc-structured-body {
  display: block;
}

/* Narrative body - hidden by default (desktop/tablet) */
.epc-narrative-body {
  display: none;
}

/* Mobile breakpoint - swap visibility */
@media (max-width: 640px) {
  .epc-structured-body {
    display: none;
  }

  .epc-narrative-body {
    display: block;
    padding: 16px;
  }
}

/* --- Narrative Listing Context --- */
.epc-narrative-listing {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--gp-purple-tint);
  border-bottom: 1px solid var(--gp-border-light);
}

.epc-narrative-host-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--gp-border);
  flex-shrink: 0;
}

.epc-narrative-avatar-placeholder {
  background: var(--gp-purple-bg);
  color: var(--gp-purple-dark);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
}

.epc-narrative-listing-text {
  font-size: 15px;
  color: var(--gp-text-secondary);
  line-height: 1.5;
  margin: 0;
}

.epc-narrative-listing-text strong {
  color: var(--gp-text);
  font-weight: 600;
}

.epc-narrative-location {
  color: var(--gp-text-muted);
}

.epc-narrative-link {
  background: none;
  border: none;
  padding: 0;
  font-size: inherit;
  font-family: inherit;
  color: var(--gp-purple-primary);
  cursor: pointer;
  font-weight: 500;
  text-decoration: none;
}

.epc-narrative-link:hover {
  text-decoration: underline;
}

.epc-narrative-link:focus {
  outline: var(--gp-focus-outline);
  outline-offset: 2px;
}

/* --- Narrative Content --- */
.epc-narrative-content {
  padding: 20px 16px;
  border-bottom: 1px solid var(--gp-border-light);
}

.epc-narrative-paragraph {
  font-size: 16px;
  line-height: 1.7;
  color: var(--gp-text-secondary);
  margin: 0 0 14px 0;
}

.epc-narrative-paragraph:last-child {
  margin-bottom: 0;
}

.epc-narrative-paragraph strong {
  color: var(--gp-text);
  font-weight: 600;
}

/* Design System: Use Action Purple for dates (NOT green) */
.epc-highlight-purple {
  color: var(--gp-purple-dark);
}

/* Design System: Use Action Purple for money (NOT green) */
.epc-highlight-money {
  color: var(--gp-purple-action);
}

/* --- Narrative Actions Row --- */
.epc-narrative-actions {
  padding: 16px;
  background: var(--gp-purple-tint);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.epc-narrative-total-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

/* Design System: Use Action Purple for total (NOT green) */
.epc-narrative-total {
  font-size: 28px;
  font-weight: 700;
  color: var(--gp-purple-action);
  line-height: 1.2;
}

.epc-narrative-total-label {
  font-size: 13px;
  color: var(--gp-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* --- Action Buttons in Narrative View --- */
.epc-narrative-actions .epc-actions-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.epc-narrative-actions .epc-btn {
  width: 100%;
  justify-content: center;
  min-height: 48px;
  border-radius: var(--gp-border-radius-pill);
}

/* Design System Button Colors for Narrative */
.epc-narrative-actions .epc-btn--primary {
  background: var(--gp-purple-dark);
  color: white;
  border: none;
}

.epc-narrative-actions .epc-btn--primary:hover {
  background: var(--gp-purple-primary);
}

.epc-narrative-actions .epc-btn--outline {
  background: transparent;
  color: var(--gp-purple-dark);
  border: 2px solid var(--gp-purple-dark);
}

.epc-narrative-actions .epc-btn--outline:hover {
  background: var(--gp-purple-bg);
}

/* Design System: Danger buttons are OUTLINED ONLY (never filled) */
.epc-narrative-actions .epc-btn--danger {
  background: transparent;
  color: var(--gp-danger);
  border: 2px solid var(--gp-danger);
}

.epc-narrative-actions .epc-btn--danger:hover {
  background: rgba(220, 53, 69, 0.1);
}

/* Ghost button styling */
.epc-narrative-actions .epc-btn--ghost {
  background: transparent;
  color: var(--gp-text-ghost);
  border: 1px solid var(--gp-border);
}

.epc-narrative-actions .epc-btn--ghost:hover {
  background: var(--gp-bg);
  border-color: var(--gp-text-muted);
}

/* --- Small Mobile Adjustments (≤400px) --- */
@media (max-width: 400px) {
  .epc-narrative-body {
    padding: 12px;
  }

  .epc-narrative-listing {
    padding: 12px;
    gap: 10px;
  }

  .epc-narrative-host-avatar {
    width: 36px;
    height: 36px;
  }

  .epc-narrative-content {
    padding: 16px 12px;
  }

  .epc-narrative-paragraph {
    font-size: 15px;
    line-height: 1.6;
    margin-bottom: 12px;
  }

  .epc-narrative-actions {
    padding: 14px 12px;
    gap: 14px;
  }

  .epc-narrative-total {
    font-size: 24px;
  }
}
```

---

## Implementation Checklist

- [ ] **Phase 1**: Add `generateGuestNarrativeText()` to `displayUtils.js`
- [ ] **Phase 2**: Create `NarrativeGuestProposalBody.jsx` component
- [ ] **Phase 3**: Modify `ExpandableProposalCard.jsx` to render both views
- [ ] **Phase 4**: Add mobile narrative CSS to `guest-proposals.css`
- [ ] **Testing**: Verify desktop still works (>640px shows structured)
- [ ] **Testing**: Verify mobile shows narrative (≤640px)
- [ ] **Testing**: Verify action buttons work in narrative view
- [ ] **Testing**: Check counteroffer display in narrative

---

## Design System Compliance

| Element | Rule | Implementation |
|---------|------|----------------|
| Money highlights | NO GREEN | Use `--gp-purple-action` (#5B5FCF) |
| Date highlights | Purple dark | Use `--gp-purple-dark` (#31135D) |
| Total amount | NO GREEN | Use `--gp-purple-action` (#5B5FCF) |
| Primary button | Purple filled | `--gp-purple-dark` background |
| Danger button | OUTLINED ONLY | Transparent bg, red border |
| Button shape | Pill | `border-radius: 100px` |
| Min touch target | 48px | `min-height: 48px` |

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Breaking existing desktop view | CSS-only approach - desktop CSS unchanged |
| Action button inconsistency | Pass existing action buttons to narrative component |
| Counteroffer display issues | Use same HC priority logic as structured view |
| Performance (rendering twice) | Negligible - React reconciles efficiently |

---

## Files Modified

1. **`app/src/islands/pages/proposals/displayUtils.js`** - Add narrative generator function
2. **`app/src/islands/pages/proposals/NarrativeGuestProposalBody.jsx`** - NEW component
3. **`app/src/islands/pages/proposals/ExpandableProposalCard.jsx`** - Wrap content, add narrative
4. **`app/src/styles/components/guest-proposals.css`** - Add mobile narrative styles

---

## Notes

- This follows the exact same pattern implemented for Host Proposals
- The narrative perspective is flipped: instead of "Sarah wants to stay", it's "This listing in Chelsea..."
- Guest sees total cost (what they pay), not earnings (what host receives)
- Listing context replaces guest context (guest knows who they are)
