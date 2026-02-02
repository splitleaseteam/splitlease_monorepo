# Date Change Dashboard - Full Page Scaffolding Spec

## Overview

Build a comprehensive **desktop-first** Date Change Dashboard as a full page (`/guest-leases/:leaseId/schedule`). This dashboard enables guests to view, manage, and negotiate schedule changes with their alternating roommate.

**Scope**: Desktop only. Mobile quick actions and SMS are Phase 2-3.

---

## Page Layout (Desktop Grid)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HEADER: Lease Info Bar (Property Name, Roommate Name, Lease Period)  │
├────────────────────────────────┬────────────────────────────────────────┤
│                                │                                        │
│   SECTION 1: Schedule          │   SECTION 2: Roommate Profile          │
│   Overview Calendar            │   - Photo/Name                         │
│   (Monthly view, color-coded)  │   - Flexibility Score                  │
│                                │   - Availability Patterns              │
│   [My Nights = Green]          │   - Net Flow Tracker                   │
│   [Their Nights = White]       │                                        │
│   [Pending = Yellow]           │                                        │
│                                │                                        │
├────────────────────────────────┼────────────────────────────────────────┤
│                                │                                        │
│   SECTION 3: Buy Out Panel     │   SECTION 4: Chat / Messaging          │
│   - Selected night details     │   - Inline conversation                │
│   - Price per night ($XXX)     │   - Quick responses                    │
│   - [Buy Out] button           │   - Transaction confirmations          │
│   - [Swap Instead] link        │   - Request/counter-offer UI           │
│                                │                                        │
├────────────────────────────────┴────────────────────────────────────────┤
│                                                                          │
│   SECTION 5: Transaction History (Full Width)                           │
│   - Date | Type (Buyout/Swap) | Amount | Status | Counterparty          │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Section Specifications

### SECTION 1: Schedule Overview Calendar

**Purpose**: Visual representation of who owns which nights.

**Features**:
- Monthly calendar view with week rows
- Color coding:
  - 🟢 **Green**: My nights
  - ⬜ **White/Gray**: Roommate's nights (available to buy out)
  - 🟡 **Yellow**: Pending request
  - 🔴 **Red Strikethrough**: Blocked/unavailable
- Clicking a roommate's night → selects it for Buy Out Panel
- Toggle: "Show prices on calendar" 
- Navigation: Previous/Next month arrows

**Data needed**:
- `calendar_stays` for current user
- `calendar_stays` for roommate
- `date_change_requests` with status='pending'

---

### SECTION 2: Roommate Profile Card

**Purpose**: Context about who you're negotiating with.

**Features**:
- Avatar + Name
- **Flexibility Score** (1-10 gauge)
  - Calculated from: response time, acceptance rate, counter-offer frequency
- **Availability Pattern** summary
  - "Usually free on weekends"
  - "Responds within 2 hours"
- **Net Flow Tracker**
  - Running total: "+$450.00 this month"
  - Positive = you've paid them more
  - Negative = they've paid you more

**Data needed**:
- `user` profile for roommate
- `date_change_requests` history (for flexibility calculation)
- `payment_records` or transaction ledger

---

### SECTION 3: Buy Out Panel

**Purpose**: Take action on a selected night.

**Features**:
- **Selected Night Display**
  - "Friday, Feb 14, 2026"
  - Current owner: "[Roommate Name]"
- **Price Display**
  - Base price: $XXX
  - Platform fee: $X.XX
  - Total: $XXX.XX
  - (Use existing fee calculation logic)
- **Action Buttons**:
  - [Buy Out Night] - Primary CTA
  - [Offer a Swap Instead] - Secondary link
  - [Add to Wishlist] - Tertiary (if not ready to buy now)
- **Message Input** (optional)
  - "Add a note to your request..."

**Behavior**:
- Clicking "Buy Out Night" creates a `date_change_request` with type='adding'
- Roommate receives notification
- Panel updates to show "Request Pending"

---

### SECTION 4: Chat / Messaging

**Purpose**: Negotiate directly with roommate.

**Features**:
- **Message Thread** (scrollable)
  - Shows conversation history
  - Inline transaction notifications: "✓ Night swapped: John gets Oct 3-5"
- **Quick Response Chips**:
  - "Yes, that works!"
  - "Can we do a different date?"
  - "What do you have available?"
- **Input Field** with send button
- **Contextual Actions** on received messages:
  - If roommate counters with swap → [Accept Swap] [Decline] buttons inline

**Data needed**:
- `messaging_thread` for this lease
- `date_change_requests` to show inline confirmations

---

### SECTION 5: Transaction History

**Purpose**: Audit trail of all schedule changes.

**Features**:
- Sortable/filterable table
- Columns:
  | Date | Type | Night(s) | Amount | Status | Counterparty |
  |------|------|----------|--------|--------|--------------|
  | Jan 28 | Buyout | Feb 14 | +$150 | Complete | Jane D. |
  | Jan 25 | Swap | Feb 10 ↔ Feb 17 | $0 | Complete | Jane D. |
  | Jan 20 | Buyout | Feb 7 | -$125 | Declined | Jane D. |

- Status badges: Complete (green), Pending (yellow), Declined (red)
- Click row → expand to show details/messages

**Data needed**:
- `date_change_requests` with all statuses
- `payment_records` for amounts

---

## File Structure (Scaffolding)

```
app/src/islands/pages/ScheduleDashboard/
├── index.jsx                     # Main page component
├── useScheduleDashboardLogic.js  # All business logic (Hollow Component Pattern)
├── ScheduleDashboard.css         # Page-level styles
├── components/
│   ├── ScheduleCalendar.jsx      # Section 1
│   ├── RoommateProfileCard.jsx   # Section 2
│   ├── BuyOutPanel.jsx           # Section 3
│   ├── ChatThread.jsx            # Section 4
│   └── TransactionHistory.jsx    # Section 5
└── hooks/
    ├── useFlexibilityScore.js    # Calculate flexibility score
    └── useNetFlowTracker.js      # Calculate net flow
```

---

## Routing

Add route to `app/src/main.jsx` or router config:

```javascript
{
  path: '/guest-leases/:leaseId/schedule',
  component: ScheduleDashboard
}
```

---

## Phase 1 Deliverables (This Prompt)

1. ✅ Page scaffolding with 5 sections
2. ✅ Schedule Calendar with color-coded nights
3. ✅ Roommate Profile Card (placeholder data okay)
4. ✅ Buy Out Panel with price display
5. ✅ Chat Thread (UI only, can be static)
6. ✅ Transaction History table

**NOT in scope for this phase**:
- Mobile responsive layout
- SMS integration
- Push notifications
- Real-time chat (polling is fine)

---

## Reference Image

See uploaded mockup for visual reference: `uploaded_media_1769796470219.png`

This shows the intended layout with:
- Calendar on left with green/white day coding
- Counterparty profile on right
- Transaction history below
- Chat panel on far right
