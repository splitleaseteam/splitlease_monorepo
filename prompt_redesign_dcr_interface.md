# Date Change Request Interface Redesign - Specification

## Overview

Redesign the Date Change Request (DCR) interface to prioritize **adding nights** over offering/swapping. The interface should clearly show which nights can be added by buying out the alternating roommate, with a focus on nights adjacent to (just before or after) the user's current stay.

---

## Key Concepts

### Terminology
| Old Term | New Term | Definition |
|----------|----------|------------|
| Date | Night | A single overnight stay (e.g., "Friday night" = check-in Friday, checkout Saturday) |
| Remove | Offer | User offers their booked night back (can get credit) |
| Available | Roommate's Night | Night currently held by the alternating roommate |

### Alternating Roommate Model
- Each lease has **two guests** who alternate occupancy
- Guest A has certain nights, Guest B has the others
- To "add" a night, you're asking to **buy out** your roommate's night
- Roommate must agree (they get compensated)

---

## UI Flow

### Default View: Add Night

When the modal opens, immediately show the **Add Night** interface:

1. **Calendar View** displays:
   - 🟢 **My Nights** - Nights the user currently has (their stays)
   - 🔵 **Adjacent Nights** - Roommate's nights directly before/after user's current stays (highlighted as suggested additions)
   - ⬜ **Other Roommate Nights** - Roommate's nights not adjacent (available but not emphasized)

2. **Visual Hierarchy**:
   - Adjacent nights have a prominent blue dashed border
   - Tooltip on hover: "Tap to request this night from [Roommate Name]"
   - Non-adjacent roommate nights are visible but muted

3. **Selection Behavior**:
   - Tapping an adjacent night selects it for the request
   - Tapping a non-adjacent night shows a gentle warning: "Consider adding nights next to your current stay for easier coordination"

### Secondary Actions (Less Prominent)

Below the calendar, show collapsed/minimized options:

```
─────────────────────────────────────
   ▾ Offer or Swap a Night
─────────────────────────────────────
```

When expanded:
- **Offer Night** - Select one of your nights to offer back
- **Swap Nights** - Select one of yours to give + one of roommate's to receive

These should be visually smaller, perhaps in a collapsible accordion.

---

## Calendar Logic

### Identifying Adjacent Nights

```
Example: User's current stay is Monday-Friday

Roommate's nights:  [Sat] [Sun] ... [next Sat] [next Sun]
Adjacent nights:   Sunday (before stay) and Friday (after stay)

Calendar shows:
  Sun  Mon  Tue  Wed  Thu  Fri  Sat
  🔵   🟢   🟢   🟢   🟢   🟢   🔵
  ^                              ^
  adjacent                       adjacent
```

### Night Statuses

| Status | Visual | Can Select? | Description |
|--------|--------|-------------|-------------|
| My Night | 🟢 Green fill | For Offer only | User's booked night |
| Adjacent (Roommate) | 🔵 Blue dashed border | Yes (Add) | Recommended to add |
| Other Roommate Night | ⬜ Faint gray | Yes (Add) | Can add, but not emphasized |
| Host-Blocked | ❌ Strikethrough | No | Host has blocked this date |

---

## Data Requirements

### Calendar Needs to Know:
1. **User's stays** - Nights currently in the user's lease
2. **Roommate's stays** - Nights held by the alternating roommate
3. **Blocked dates** - Dates the host has made unavailable
4. **Stay boundaries** - To calculate which nights are "adjacent"

### API/Data Source:
- Pull from existing `calendar_stays` table
- Filter by lease and participant
- Existing pricing code handles costs (no new pricing logic needed)

---

## Component Changes Summary

| Component | Change |
|-----------|--------|
| `DateChangeRequestManager.jsx` | Default to 'add' view, fetch roommate's nights |
| `RequestTypeSelector.jsx` | Rename to "Offer" terminology, make Add primary, others collapsed |
| `DateChangeRequestCalendar.jsx` | Add visual states for adjacent nights, roommate nights |
| `DateChangeRequestManager.css` | New styles for adjacent, muted, primary actions |

---

## Behavior Notes

1. **Counterparty Response**: When the roommate receives an add request, they can:
   - Accept (get compensated)
   - Decline
   - Counter with a swap (suggest different night)

2. **"Offer Night" Flow**: When user offers a night, roommate can:
   - Accept (they gain the night)
   - Propose a swap instead

3. **Swap Remains Available**: Just not the default action.

---

## Success Criteria

- [ ] Modal opens directly to "Add Night" view
- [ ] Adjacent nights (before/after current stays) are visually prominent
- [ ] Non-adjacent roommate nights are visible but muted
- [ ] "Offer Night" and "Swap" are accessible but collapsed/secondary
- [ ] Terminology uses "night" not "date", "offer" not "remove"
- [ ] Existing pricing code is reused (no new pricing logic)
