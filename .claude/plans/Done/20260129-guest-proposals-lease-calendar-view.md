# Feature Plan: Lease Calendar View on Guest Proposals Page

**Date:** January 29, 2026
**Page:** Guest Proposals (`/guest-proposals`)
**Priority:** MEDIUM
**Estimated Effort:** 12-16 hours

---

## Overview

Add a calendar view section to the Guest Proposals page that displays lease dates after a proposal is accepted and activated. This calendar will show the guest's scheduled stay pattern with clear messaging that:

1. The displayed schedule is an **estimate** based on the accepted proposal
2. During the reservation, guests can request **custom date changes**
3. Guests can **sell nights** they won't use or **buy additional nights**

---

## User Story

> As a guest with an activated lease, I want to see my scheduled dates on a calendar view within the Guest Proposals page, so I can visualize my upcoming stays and understand that I have flexibility to modify my schedule.

---

## Feature Requirements

### 1. Visibility Conditions

Show the Lease Calendar Section **ONLY** when:
- Proposal status is `'Initial Payment Submitted / Lease activated'` or later
- A linked `bookings_leases` record exists with valid dates
- The lease has associated `bookings_stays` records

### 2. Calendar View Design

**Layout:** Month-view calendar similar to existing `CalendarSection` component

**Visual Elements:**
- **Selected nights** highlighted in brand purple (`#6D31C2`)
- **Check-in day** marked with entry indicator (arrow or icon)
- **Check-out day** marked with exit indicator
- **Past dates** dimmed/grayed
- **Future dates** active color
- **Current date** outlined/highlighted

**Controls:**
- Previous/Next month navigation
- Month/Year header

### 3. Informational Messaging

**Header Text:**
```
📅 Your Lease Schedule (Estimate)
```

**Subtext (in info banner):**
```
This schedule is based on your accepted proposal terms. During your reservation,
you can request date changes, sell nights you won't use, or buy additional nights
when available. All modifications require host approval.
```

**Clickable Elements:**
- "request date changes" → Links to date change request flow
- "sell nights" → Opens sell nights modal/info
- "buy additional nights" → Opens buy nights modal/info

### 4. Data Display

**Calendar Cell Content:**
- Day number
- "Night X" label for booked nights
- Price indicator (optional - if nightly rate varies)

**Summary Stats (below calendar):**
| Stat | Format |
|------|--------|
| Total Nights | "32 nights across 8 weeks" |
| Next Stay | "Jan 31 - Feb 2" |
| Nights Remaining | "28 nights left" |

### 5. Quick Actions

Below the calendar, show action buttons:

| Button | Action | Condition |
|--------|--------|-----------|
| "Request Date Change" | Opens date change modal | Always visible |
| "Sell a Night" | Opens sell night flow | Has future nights |
| "Buy More Nights" | Opens buy night flow | Host has availability |
| "View Full Lease" | Navigates to `/guest-leases` | Always visible |

---

## Technical Implementation

### Phase 1: Data Fetching (2-3 hours)

**Modify `useGuestProposalsPageLogic.js`:**

```javascript
// Add lease data fetching for activated proposals
const fetchLeaseDataForProposal = async (proposalId) => {
  const { data: lease } = await supabase
    .from('bookings_leases')
    .select(`
      _id,
      "Reservation Period: Start",
      "Reservation Period: End",
      "Agreement Number",
      stays:bookings_stays (
        _id,
        "Week Number",
        "Check In (night)",
        "Last Night (night)",
        "Stay Status",
        "Dates - List of dates in this period"
      )
    `)
    .eq('Proposal', proposalId)
    .single();

  return lease;
};
```

**Return from hook:**
```javascript
{
  // ... existing returns
  leaseDataByProposal: Map<proposalId, LeaseData>,
  isLeaseDataLoading: boolean
}
```

### Phase 2: Calendar Component (4-5 hours)

**Create new component:** `app/src/islands/pages/proposals/LeaseCalendarSection.jsx`

**Structure:**
```jsx
<div className="lease-calendar-section">
  <div className="lease-calendar-header">
    <h3>📅 Your Lease Schedule (Estimate)</h3>
    <InfoBanner>
      This schedule is based on your accepted proposal terms...
    </InfoBanner>
  </div>

  <div className="lease-calendar-grid">
    <CalendarControls
      month={currentMonth}
      onPrevMonth={handlePrevMonth}
      onNextMonth={handleNextMonth}
    />
    <MonthCalendar
      month={currentMonth}
      highlightedDates={leaseNights}
      checkInDates={checkInDates}
      checkOutDates={checkOutDates}
    />
  </div>

  <div className="lease-calendar-summary">
    <StatCard label="Total Nights" value={totalNights} />
    <StatCard label="Next Stay" value={nextStay} />
    <StatCard label="Remaining" value={remainingNights} />
  </div>

  <div className="lease-calendar-actions">
    <button onClick={onRequestDateChange}>Request Date Change</button>
    <button onClick={onSellNight}>Sell a Night</button>
    <button onClick={onBuyNight}>Buy More Nights</button>
    <a href="/guest-leases">View Full Lease →</a>
  </div>
</div>
```

**Reuse Existing Components:**
- Adapt `CalendarSection/MonthCalendar.jsx` from ManageLeasesPaymentRecordsPage
- Adapt `CalendarSection/CalendarControls.jsx`
- Create new `CalendarSection/CalendarDay.jsx` variant for lease view

### Phase 3: Integration into ExpandableProposalCard (2-3 hours)

**Add conditional rendering in `ExpandableProposalCard.jsx`:**

```jsx
// After InlineProgressTracker, before Actions Row
{isLeaseActivated && leaseData && (
  <LeaseCalendarSection
    lease={leaseData}
    proposal={proposal}
    onRequestDateChange={() => setShowDateChangeModal(true)}
    onSellNight={() => setShowSellNightModal(true)}
    onBuyNight={() => setShowBuyNightModal(true)}
  />
)}
```

**Helper function:**
```javascript
const isLeaseActivated = (status) => {
  return status?.includes('Lease activated') ||
         status?.includes('Payment Submitted');
};
```

### Phase 4: Action Modals (3-4 hours)

**Option A: Link to existing flows**
- Date Change: Link to `/guest-leases` with `?action=date-change`
- Sell/Buy: Link to existing marketplace or info modal

**Option B: Create inline modals**
- `DateChangeRequestModal.jsx` - Request specific date modifications
- `SellNightModal.jsx` - List nights available to sell
- `BuyNightModal.jsx` - Browse host's available nights

**Recommendation:** Start with Option A (linking), implement Option B in future iteration.

### Phase 5: Styling (1-2 hours)

**Add to `guest-proposals.css`:**

```css
/* Lease Calendar Section */
.lease-calendar-section {
  margin-top: 24px;
  padding: 20px;
  background: #FAFBFC;
  border-radius: 12px;
  border: 1px solid #E5E7EB;
}

.lease-calendar-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1F2937;
  margin-bottom: 8px;
}

.lease-calendar-info-banner {
  background: #EEF2FF;
  border-left: 4px solid #6D31C2;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  color: #374151;
  margin-bottom: 16px;
}

.lease-calendar-info-banner a {
  color: #6D31C2;
  text-decoration: underline;
  cursor: pointer;
}

.lease-calendar-grid {
  margin: 16px 0;
}

.lease-calendar-day--booked {
  background: #6D31C2;
  color: white;
  border-radius: 4px;
}

.lease-calendar-day--checkin {
  border-left: 3px solid #10B981;
}

.lease-calendar-day--checkout {
  border-right: 3px solid #EF4444;
}

.lease-calendar-day--past {
  opacity: 0.5;
}

.lease-calendar-summary {
  display: flex;
  gap: 16px;
  margin: 16px 0;
}

.lease-calendar-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
```

---

## Data Model Reference

### bookings_leases (Supabase)
| Field | Type | Description |
|-------|------|-------------|
| `_id` | uuid | Primary key |
| `Proposal` | uuid | FK to proposal |
| `Reservation Period: Start` | date | Lease start date |
| `Reservation Period: End` | date | Lease end date |
| `Agreement Number` | string | Lease reference ID |

### bookings_stays (Supabase)
| Field | Type | Description |
|-------|------|-------------|
| `_id` | uuid | Primary key |
| `Lease` | uuid | FK to lease |
| `Week Number` | integer | Week 1, 2, 3... |
| `Check In (night)` | date | First night of stay |
| `Last Night (night)` | date | Last night of stay |
| `Stay Status` | string | in_progress, completed |
| `Dates - List of dates in this period` | jsonb | Array of all dates |

---

## Success Criteria

1. [ ] Calendar renders correctly for activated leases
2. [ ] Shows booked nights highlighted in brand color
3. [ ] Info banner displays with clickable links
4. [ ] Month navigation works (prev/next)
5. [ ] Summary stats calculate correctly
6. [ ] Action buttons link to appropriate flows
7. [ ] Responsive on mobile (calendar condenses or scrolls)
8. [ ] No calendar shown for non-activated proposals

---

## Out of Scope (Future Iterations)

- Real-time availability checking for buy nights
- In-app night marketplace with pricing
- Push notifications for date change approvals
- Calendar sync (Google/Apple) from this view

---

## File References

### Files to Modify
- `app/src/islands/pages/proposals/ExpandableProposalCard.jsx` - Add calendar section
- `app/src/islands/pages/proposals/useGuestProposalsPageLogic.js` - Fetch lease data
- `app/src/styles/pages/guest-proposals.css` - Add calendar styles

### Files to Create
- `app/src/islands/pages/proposals/LeaseCalendarSection.jsx` - Main component
- `app/src/islands/pages/proposals/LeaseCalendarDay.jsx` - Day cell component

### Files to Reference (Reuse Patterns)
- `app/src/islands/pages/ManageLeasesPaymentRecordsPage/components/CalendarSection/MonthCalendar.jsx`
- `app/src/islands/pages/ManageLeasesPaymentRecordsPage/components/CalendarSection/CalendarControls.jsx`
- `app/src/islands/pages/guest-leases/useGuestLeasesPageLogic.js` - Lease data fetching pattern

---

## Questions to Resolve Before Implementation

1. **Sell/Buy Night Flows:** Are these existing features or need to be built?
   - If existing: Where are they located?
   - If new: Should we defer to a separate plan?

2. **Date Change Request Modal:** Build inline or link to guest-leases page?

3. **Host Availability Check:** For "Buy More Nights", do we need real-time availability?

---

*Plan created: January 29, 2026*
