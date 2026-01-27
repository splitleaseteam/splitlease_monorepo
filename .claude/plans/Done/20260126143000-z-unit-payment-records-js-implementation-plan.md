# Implementation Plan: Z-Unit Payment Records JS Test Page

## Overview

Create a new internal test page (`/_internal/z-unit-payment-records-js`) that serves as a comprehensive payment management dashboard for lease agreements. The page displays and compares JavaScript-calculated vs. Bubble native-calculated payment schedules, enables administrators to manage payment records, and provides functionality to regenerate payment schedules on demand.

## Success Criteria

- [ ] Page is accessible at `/_internal/z-unit-payment-records-js` without authentication
- [ ] Lease/reservation selector dropdown fetches and displays available bookings
- [ ] Dual payment schedule display shows JavaScript-calculated vs. Bubble native values
- [ ] Guest payment schedules table displays all required columns
- [ ] Host payout schedules table displays all required columns
- [ ] Regenerate buttons for both host and guest payment records function correctly
- [ ] Reservation calendar displays booking status with month/year navigation
- [ ] All 11 workflows function as specified
- [ ] Follows Hollow Component Pattern with logic hook separation

## Context & References

### Relevant Files

| File | Purpose | Changes Needed |
|------|---------|----------------|
| `app/src/routes.config.js` | Route registry | Add new route entry |
| `app/public/z-unit-payment-records-js.html` | HTML entry point | Create new file |
| `app/src/z-unit-payment-records-js.jsx` | JSX entry point | Create new file |
| `app/src/islands/pages/ZUnitPaymentRecordsJsPage/ZUnitPaymentRecordsJsPage.jsx` | Page component | Create new file |
| `app/src/islands/pages/ZUnitPaymentRecordsJsPage/useZUnitPaymentRecordsJsPageLogic.js` | Logic hook | Create new file |
| `app/src/islands/pages/ZUnitPaymentRecordsJsPage/ZUnitPaymentRecordsJsPage.css` | Styles | Create new file |
| `app/src/islands/pages/ZUnitPaymentRecordsJsPage/index.js` | Barrel export | Create new file |

### Related Documentation

- [GUEST_PAYMENT_RECORDS.md](.claude/Documentation/Backend(EDGE - Functions)/GUEST_PAYMENT_RECORDS.md) - Guest payment Edge Function
- [HOST_PAYMENT_RECORDS.md](.claude/Documentation/Backend(EDGE - Functions)/HOST_PAYMENT_RECORDS.md) - Host payment Edge Function
- [DATABASE_TABLES_DETAILED.md](.claude/Documentation/Database/DATABASE_TABLES_DETAILED.md) - Database schema reference

### Existing Patterns to Follow

- **ZPricingUnitTestPage**: Reference for internal test page structure, listing selector, and pricing display
- **ZUnitChatgptModelsPage**: Reference for multi-section test page with independent state management
- **Hollow Component Pattern**: Page component contains ONLY JSX rendering, all logic in `useZUnitPaymentRecordsJsPageLogic.js`

### Database Tables Referenced

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `bookings_leases` | Lease agreements | `_id`, `Agreement Number`, `Proposal`, `Listing`, `Guest`, `Host`, `Lease Status`, `Reservation Period : Start/End`, `Total Rent`, `Total Compensation` |
| `paymentrecords` | Payment tracking (legacy) | `_id`, `Booking - Reservation`, `Payment #`, `Scheduled Date`, `Rent`, `Maintenance Fee`, `Damage Deposit` |
| `proposal` | Proposal data | `_id`, `Days Selected`, `Nights Selected`, `Reservation Span (Weeks)`, `rental type`, `4 week rent`, `Move in range start/end` |
| `listing` | Listing info | `_id`, `Name`, `Host / Landlord` |
| `user` | User info | `_id`, `Name - Full` |

### Edge Functions Referenced

| Function | Action | Purpose |
|----------|--------|---------|
| `guest-payment-records` | `generate` | Generate guest payment schedule |
| `host-payment-records` | `generate` | Generate host payment schedule |

## Implementation Steps

### Step 1: Add Route to Route Registry

**Files:** `app/src/routes.config.js`
**Purpose:** Register the new internal test page route

**Details:**
- Add new route entry in the `// ===== Z-UNIT TESTS (INTERNAL) =====` section
- Configure as internal page with cloudflareInternal: true
- Set protected: false (no authentication required)

**Code Pattern:**
```javascript
// ===== Z-UNIT PAYMENT RECORDS JS (INTERNAL) =====
{
  path: '/_internal/z-unit-payment-records-js',
  file: 'z-unit-payment-records-js.html',
  aliases: ['/_internal/z-unit-payment-records-js.html'],
  protected: false,
  cloudflareInternal: true,
  internalName: 'z-unit-payment-records-js-view',
  hasDynamicSegment: false
},
```

**Validation:** Run `bun run generate-routes` to regenerate _redirects and _routes.json

---

### Step 2: Create HTML Entry Point

**Files:** `app/public/z-unit-payment-records-js.html`
**Purpose:** HTML shell page that loads the React entry point

**Details:**
- Follow same structure as `z-pricing-unit-test.html`
- Include noindex/nofollow meta tags for internal page
- Reference the JSX entry point

**Template:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Z-Unit Payment Records JS - Split Lease Admin</title>
  <meta name="description" content="Internal payment records testing and management page">
  <meta name="robots" content="noindex, nofollow">
  <link rel="icon" type="image/png" href="/assets/images/split-lease-purple-circle.png">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/z-unit-payment-records-js.jsx"></script>
</body>
</html>
```

**Validation:** File exists and references correct JSX entry

---

### Step 3: Create JSX Entry Point

**Files:** `app/src/z-unit-payment-records-js.jsx`
**Purpose:** React entry point that mounts the page component

**Details:**
- Follow pattern from `z-pricing-unit-test.jsx`
- Import and render the page component
- Mount to root element

**Template:**
```jsx
/**
 * Z-Unit Payment Records JS Test Page Entry Point
 *
 * Internal test page for payment records management and validation.
 * Compares JavaScript-calculated vs. Bubble native payment schedules.
 *
 * Route: /_internal/z-unit-payment-records-js
 * Auth: None (internal test page)
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import ZUnitPaymentRecordsJsPage from './islands/pages/ZUnitPaymentRecordsJsPage/ZUnitPaymentRecordsJsPage.jsx';

const root = createRoot(document.getElementById('root'));
root.render(<ZUnitPaymentRecordsJsPage />);
```

**Validation:** Entry point follows Islands Architecture pattern

---

### Step 4: Create Page Component Directory Structure

**Files:**
- `app/src/islands/pages/ZUnitPaymentRecordsJsPage/index.js`
- `app/src/islands/pages/ZUnitPaymentRecordsJsPage/ZUnitPaymentRecordsJsPage.css`

**Purpose:** Create directory structure and barrel export

**index.js:**
```javascript
export { default } from './ZUnitPaymentRecordsJsPage.jsx';
export { useZUnitPaymentRecordsJsPageLogic } from './useZUnitPaymentRecordsJsPageLogic.js';
```

**Validation:** Directory structure matches existing z-unit pages

---

### Step 5: Create Logic Hook

**Files:** `app/src/islands/pages/ZUnitPaymentRecordsJsPage/useZUnitPaymentRecordsJsPageLogic.js`
**Purpose:** All business logic for the payment records page

**Details:**
Implement the following state management and handlers:

**State Variables:**
```javascript
// Lease selector state
const [leases, setLeases] = useState([]);
const [leasesLoading, setLeasesLoading] = useState(false);
const [leasesError, setLeasesError] = useState(null);
const [selectedLeaseId, setSelectedLeaseId] = useState('');
const [selectedLease, setSelectedLease] = useState(null);
const [selectedLeaseLoading, setSelectedLeaseLoading] = useState(false);

// Proposal data (linked to selected lease)
const [proposalData, setProposalData] = useState(null);

// Payment schedules
const [guestPaymentSchedule, setGuestPaymentSchedule] = useState({ jsCalculated: [], bubbleNative: [] });
const [hostPaymentSchedule, setHostPaymentSchedule] = useState({ jsCalculated: [], bubbleNative: [] });
const [paymentSchedulesLoading, setPaymentSchedulesLoading] = useState(false);

// Calendar state
const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());

// Regeneration state
const [regeneratingGuest, setRegeneratingGuest] = useState(false);
const [regeneratingHost, setRegeneratingHost] = useState(false);
const [regenerationError, setRegenerationError] = useState(null);
const [regenerationSuccess, setRegenerationSuccess] = useState(null);
```

**Required Workflows (11 total):**

1. **fetchLeases** - Load all leases with relevant data for dropdown
2. **handleLeaseSelect** - Load full lease details when selected
3. **fetchProposalData** - Load proposal data linked to lease
4. **fetchBubbleNativePayments** - Load existing payment records from database
5. **calculateJsPaymentSchedule** - Run JavaScript calculation for comparison
6. **handleRegenerateGuestPayments** - Call guest-payment-records Edge Function
7. **handleRegenerateHostPayments** - Call host-payment-records Edge Function
8. **handleCalendarMonthNext** - Navigate calendar forward
9. **handleCalendarMonthPrev** - Navigate calendar backward
10. **handleCalendarYearChange** - Change calendar year
11. **handleReset** - Reset all state to initial values

**Hook Return Shape:**
```javascript
return {
  // Lease selector
  leases,
  leasesLoading,
  leasesError,
  selectedLeaseId,
  selectedLease,
  selectedLeaseLoading,
  proposalData,

  // Payment schedules
  guestPaymentSchedule,
  hostPaymentSchedule,
  paymentSchedulesLoading,

  // Calendar state
  calendarYear,
  calendarMonth,

  // Regeneration state
  regeneratingGuest,
  regeneratingHost,
  regenerationError,
  regenerationSuccess,

  // Handlers
  handleLeaseSelect,
  handleRegenerateGuestPayments,
  handleRegenerateHostPayments,
  handleCalendarMonthNext,
  handleCalendarMonthPrev,
  handleCalendarYearChange,
  handleReset,
};
```

**Payment Record Data Structure (Guest):**
```javascript
{
  paymentNumber: number,
  scheduledDate: string,       // Date payment is due
  actualDate: string | null,   // Date payment was made (if any)
  rent: number,
  maintenanceFee: number,
  damageDeposit: number,       // First payment only
  total: number,
  bankTransactionNumber: string | null,
  receiptStatus: string,       // 'pending' | 'paid' | 'overdue'
}
```

**Payment Record Data Structure (Host):**
```javascript
{
  paymentNumber: number,
  scheduledDate: string,       // Date payout is scheduled
  actualDate: string | null,   // Date payout was made (if any)
  rent: number,
  maintenanceFee: number,
  total: number,               // Net after platform fee
  bankTransactionNumber: string | null,
  payoutStatus: string,        // 'pending' | 'paid' | 'processing'
}
```

**Database Query for Leases:**
```javascript
const { data, error } = await supabase
  .from('bookings_leases')
  .select(`
    _id,
    "Agreement Number",
    "Lease Status",
    "Reservation Period : Start",
    "Reservation Period : End",
    "Total Rent",
    "Total Compensation",
    Listing,
    Proposal,
    Guest,
    Host,
    "Payment Records Guest-SL",
    "Payment Records SL-Hosts"
  `)
  .not('Proposal', 'is', null)
  .order('"Agreement Number"', { ascending: false })
  .limit(100);
```

**JavaScript Payment Calculation Import:**
```javascript
// Import calculation logic from existing edge function (will need frontend adapter)
// Or recreate calculation functions following the edge function pattern
import { calculateGuestPaymentSchedule } from '../../../logic/calculators/payments/calculateGuestPaymentSchedule.js';
import { calculateHostPaymentSchedule } from '../../../logic/calculators/payments/calculateHostPaymentSchedule.js';
```

Note: May need to create frontend calculator functions based on the edge function logic if they don't exist.

**Validation:** Hook follows Hollow Component Pattern with all 11 workflows

---

### Step 6: Create Payment Calculator Functions (Frontend)

**Files:**
- `app/src/logic/calculators/payments/calculateGuestPaymentSchedule.js`
- `app/src/logic/calculators/payments/calculateHostPaymentSchedule.js`
- `app/src/logic/calculators/payments/index.js`

**Purpose:** Frontend versions of the payment schedule calculation for comparison display

**Details:**
- Port the calculation logic from the edge functions to frontend JavaScript
- Follow the Four-Layer Logic architecture (calculators are pure math functions)
- These are for display/comparison purposes - actual generation uses Edge Functions

**calculateGuestPaymentSchedule.js Pattern:**
```javascript
/**
 * Calculate guest payment schedule
 * Ported from: supabase/functions/guest-payment-records/lib/calculations.ts
 *
 * KEY RULES:
 * - First payment: 3 days BEFORE move-in
 * - Monthly rentals: 31-day intervals
 * - Nightly/Weekly: 28-day (4-week) intervals
 * - Damage deposit added to first payment only
 */

export function calculateGuestPaymentSchedule({
  rentalType,
  moveInDate,
  reservationSpanWeeks,
  reservationSpanMonths,
  weekPattern,
  fourWeekRent,
  rentPerMonth,
  maintenanceFee,
  damageDeposit = 0
}) {
  // Port logic from edge function
  // ...
}
```

**calculateHostPaymentSchedule.js Pattern:**
```javascript
/**
 * Calculate host payment schedule
 * Ported from: supabase/functions/host-payment-records/lib/calculations.ts
 *
 * KEY RULES:
 * - First payment: 2 days AFTER move-in
 * - Monthly rentals: 31-day intervals
 * - Nightly/Weekly: 28-day (4-week) intervals
 */

export function calculateHostPaymentSchedule({
  rentalType,
  moveInDate,
  reservationSpanWeeks,
  reservationSpanMonths,
  weekPattern,
  fourWeekRent,
  rentPerMonth,
  maintenanceFee
}) {
  // Port logic from edge function
  // ...
}
```

**Validation:** Calculator functions are pure, testable, and match edge function output

---

### Step 7: Create Page Component (JSX)

**Files:** `app/src/islands/pages/ZUnitPaymentRecordsJsPage/ZUnitPaymentRecordsJsPage.jsx`
**Purpose:** Render the payment records management UI

**Details:**
- Follow Hollow Component Pattern - NO logic, only rendering
- Three-column layout similar to ZPricingUnitTestPage
- Reusable sub-components for tables and calendar

**Component Structure:**
```jsx
export default function ZUnitPaymentRecordsJsPage() {
  const logic = useZUnitPaymentRecordsJsPageLogic();

  return (
    <div className="zupr-page">
      <header className="zupr-header">
        <h1>Z-Unit Payment Records JS Test</h1>
        <p>Payment schedule management and JavaScript vs. Bubble comparison</p>
      </header>

      <div className="zupr-container">
        {/* Column 1: Lease Selector */}
        <LeaseSelector {...logic} />

        {/* Column 2: Payment Schedules */}
        <PaymentSchedulesPanel {...logic} />

        {/* Column 3: Calendar & Actions */}
        <CalendarActionsPanel {...logic} />
      </div>
    </div>
  );
}
```

**Sub-Components to Create:**

1. **LeaseSelector** - Dropdown with lease info display
2. **PaymentSchedulesPanel** - Contains both tables
3. **GuestPaymentTable** - Guest payment records with columns:
   - Scheduled Date
   - Actual Date
   - Rent
   - Maintenance Fee
   - Damage Deposit
   - Total
   - Bank Transaction Number
   - Receipt Status
4. **HostPaymentTable** - Host payout records with similar columns
5. **ComparisonToggle** - Switch between JS calculated vs Bubble native
6. **ReservationCalendar** - Month view with booking dates highlighted
7. **CalendarNavigation** - Month/year navigation controls
8. **RegenerateButtons** - Two buttons for regenerating records
9. **LoadingSpinner** - Reusable loading indicator
10. **ErrorMessage** - Reusable error display

**Validation:** Component renders all required sections with no embedded logic

---

### Step 8: Create CSS Styles

**Files:** `app/src/islands/pages/ZUnitPaymentRecordsJsPage/ZUnitPaymentRecordsJsPage.css`
**Purpose:** Styling for the payment records page

**Details:**
- Follow naming convention: `.zupr-*` prefix (z-unit-payment-records)
- Use CSS variables from `styles/variables.css`
- Three-column responsive layout
- Table styling for payment schedules
- Calendar grid styling

**Key Style Classes:**
```css
.zupr-page { /* Full page wrapper */ }
.zupr-header { /* Page header */ }
.zupr-container { /* Three-column grid */ }
.zupr-column { /* Individual column */ }
.zupr-panel { /* Card/section container */ }
.zupr-panel-header { /* Section headers */ }
.zupr-form-group { /* Form field wrapper */ }
.zupr-label { /* Form labels */ }
.zupr-select { /* Dropdown styling */ }
.zupr-table { /* Payment tables */ }
.zupr-table th { /* Table headers */ }
.zupr-table td { /* Table cells */ }
.zupr-calendar { /* Calendar grid */ }
.zupr-calendar-nav { /* Calendar navigation */ }
.zupr-calendar-day { /* Calendar day cell */ }
.zupr-calendar-day.booked { /* Booked date highlight */ }
.zupr-btn { /* Button base */ }
.zupr-btn-primary { /* Primary action button */ }
.zupr-btn-secondary { /* Secondary button */ }
.zupr-loading { /* Loading spinner */ }
.zupr-error { /* Error message */ }
.zupr-success { /* Success message */ }
.zupr-comparison-toggle { /* JS/Bubble toggle */ }
.zupr-comparison-badge { /* Calculation source badge */ }
```

**Validation:** Styles follow existing z-unit page conventions

---

### Step 9: Run Route Generation

**Command:** `bun run generate-routes`
**Purpose:** Regenerate Cloudflare routing files after route changes

**Details:**
- Execute from app/ directory
- Verify `_redirects` and `_routes.json` are updated
- Check for any validation errors

**Validation:** No errors from generate-routes, new route appears in generated files

---

### Step 10: Test the Implementation

**Purpose:** Verify all functionality works correctly

**Test Scenarios:**
1. Navigate to `/_internal/z-unit-payment-records-js`
2. Verify lease dropdown loads and displays leases
3. Select a lease and verify details load
4. Verify JS calculated payment schedule appears
5. Verify Bubble native payment schedule loads
6. Compare JS vs Bubble values for discrepancies
7. Test regenerate guest payments button
8. Test regenerate host payments button
9. Test calendar navigation (month forward/back, year change)
10. Test reset button
11. Verify error handling for edge cases (no lease selected, API errors)

**Validation:** All 10 test scenarios pass

---

## Edge Cases & Error Handling

| Edge Case | How to Handle |
|-----------|---------------|
| No leases exist | Display "No leases found" message in dropdown |
| Lease has no proposal | Show warning, disable payment calculation |
| Lease has no existing payment records | Show empty tables with "No records" message |
| Edge Function call fails | Display error message, allow retry |
| Invalid date data | Log error, display fallback message |
| Network timeout | Show timeout message, allow retry |
| Missing required fields | Validate before calculation, show field-level errors |

## Testing Considerations

- **Unit Tests:** Calculator functions should be testable in isolation
- **Integration Tests:** Test Edge Function calls with mock responses
- **Visual Verification:** Compare calculated values against known correct outputs
- **Cross-browser:** Test in Chrome and Safari at minimum

## Rollback Strategy

1. Revert route entry in `routes.config.js`
2. Run `bun run generate-routes` to update routing files
3. Delete created files in reverse order:
   - `app/src/islands/pages/ZUnitPaymentRecordsJsPage/`
   - `app/src/z-unit-payment-records-js.jsx`
   - `app/public/z-unit-payment-records-js.html`
   - `app/src/logic/calculators/payments/` (if created)

## Dependencies & Blockers

| Dependency | Status | Notes |
|------------|--------|-------|
| `guest-payment-records` Edge Function | Exists | Required for regeneration |
| `host-payment-records` Edge Function | Exists | Required for regeneration |
| `bookings_leases` table access | Exists | Direct Supabase query |
| `paymentrecords` table access | Exists | Direct Supabase query |
| `proposal` table access | Exists | Direct Supabase query |

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Edge Function API changes | Low | High | Version lock API contract |
| Calculator logic mismatch | Medium | Medium | Test against edge function outputs |
| Database schema changes | Low | High | Reference documentation, handle null fields |
| Performance with many leases | Low | Low | Add pagination if needed |

## File Summary

### Files to Create (8 files)

1. `app/public/z-unit-payment-records-js.html` - HTML entry point
2. `app/src/z-unit-payment-records-js.jsx` - JSX entry point
3. `app/src/islands/pages/ZUnitPaymentRecordsJsPage/ZUnitPaymentRecordsJsPage.jsx` - Page component
4. `app/src/islands/pages/ZUnitPaymentRecordsJsPage/useZUnitPaymentRecordsJsPageLogic.js` - Logic hook
5. `app/src/islands/pages/ZUnitPaymentRecordsJsPage/ZUnitPaymentRecordsJsPage.css` - Styles
6. `app/src/islands/pages/ZUnitPaymentRecordsJsPage/index.js` - Barrel export
7. `app/src/logic/calculators/payments/calculateGuestPaymentSchedule.js` - Guest calculator
8. `app/src/logic/calculators/payments/calculateHostPaymentSchedule.js` - Host calculator

### Files to Modify (1 file)

1. `app/src/routes.config.js` - Add route entry

### Generated Files (auto-updated)

1. `app/public/_redirects` - Cloudflare routing
2. `app/public/_routes.json` - Cloudflare Functions routing

---

**Plan Version:** 1.0
**Created:** 2026-01-26
**Author:** Claude Code (Implementation Planner)
