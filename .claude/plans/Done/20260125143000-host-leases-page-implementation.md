# Implementation Plan: Host Leases Page

## Overview

Migrate the Bubble.io "host-leases" page to the Split Lease React/Vite codebase. This page allows hosts to view and manage their active leases, including viewing payment records, stays, and handling date change requests across all their listings.

## Success Criteria

- [ ] Host can view all leases across their listings organized by listing tabs
- [ ] Each lease card displays guest info, payment records, stays, and date change requests
- [ ] Date change request actions (accept/decline) work correctly
- [ ] PDF document links are functional
- [ ] Guest review submission modal works
- [ ] Page is responsive with 700px mobile breakpoint
- [ ] Authentication enforces host-only access
- [ ] Page follows Islands Architecture and Hollow Component pattern

---

## Context & References

### Relevant Files

| File | Purpose | Changes Needed |
|------|---------|----------------|
| `app/src/routes.config.js` | Route registry | Add `/host-leases` route |
| `app/public/host-leases.html` | HTML entry point | Create new file |
| `app/src/host-leases.jsx` | React entry point | Create new file |
| `app/src/islands/pages/HostLeasesPage/` | Page components | Create directory with components |
| `supabase/functions/lease/index.ts` | Lease Edge Function | Extend with `get_host_leases` action |
| `supabase/functions/date-change-request/index.ts` | DCR Edge Function | Already has accept/decline actions |

### Related Documentation

- [DATABASE_TABLES_DETAILED.md](.claude/Documentation/Database/DATABASE_TABLES_DETAILED.md) - Schema reference
- [supabase/CLAUDE.md](supabase/CLAUDE.md) - Edge Function patterns
- [app/src/islands/pages/CLAUDE.md](app/src/islands/pages/CLAUDE.md) - Page component patterns

### Existing Patterns to Follow

- **HostProposalsPage**: Similar structure with listing tabs and cards
- **useHostProposalsPageLogic.js**: Auth pattern, data normalization, handler patterns
- **date-change-request Edge Function**: Functional programming style with Result types

---

## Database Schema Mapping

### Primary Tables (Bubble to Supabase)

| Bubble Data Type | Supabase Table | Key Fields |
|------------------|----------------|------------|
| Bookings-Leases | `bookings_leases` | `_id`, `Agreement Number`, `Lease Status`, `Listing`, `Guest`, `Host`, `Total Rent`, `Total Compensation` |
| Bookings-Stays | `bookings_stays` | `_id`, `Lease`, `Week Number`, `Check In (night)`, `Last Night (night)`, `Stay Status` |
| Payment Records | `paymentrecords` | `_id`, `Booking - Reservation`, payment fields |
| Date Change Request | `datechangerequest` | `_id`, `Lease`, `Requested by`, `Request receiver`, `status` |

### Field Mapping (Bubble to Camel Case)

```javascript
// bookings_leases normalization
{
  id: data._id,
  agreementNumber: data['Agreement Number'],
  leaseStatus: data['Lease Status'],
  leaseSigned: data['Lease signed?'],
  listing: data.Listing,
  guest: data.Guest,
  host: data.Host,
  proposal: data.Proposal,
  reservationStart: data['Reservation Period : Start'],
  reservationEnd: data['Reservation Period : End'],
  firstPaymentDate: data['First Payment Date'],
  nextPaymentDueDate: data['Next Payment Due Date'],
  totalRent: data['Total Rent'],
  totalCompensation: data['Total Compensation'],
  paidToDate: data['Paid to Date from Guest'],
  listOfStays: data['List of Stays'],  // JSONB array of stay IDs
  paymentRecordsGuestSL: data['Payment Records Guest-SL'],  // JSONB array
  paymentRecordsSLHosts: data['Payment Records SL-Hosts'],  // JSONB array
  dateChangeRequests: data['Date Change Requests'],  // JSONB array
  participants: data.Participants,
  contract: data.Contract,
  supplementalAgreement: data['supplemental agreement'],
  createdDate: data['Created Date'],
  modifiedDate: data['Modified Date']
}

// bookings_stays normalization
{
  id: data._id,
  lease: data.Lease,
  weekNumber: data['Week Number'],
  listing: data.listing,
  guest: data.Guest,
  host: data.Host,
  checkInNight: data['Check In (night)'],
  lastNight: data['Last Night (night)'],
  stayStatus: data['Stay Status'],
  reviewSubmittedByHost: data['Review Submitted by Host'],
  datesInPeriod: data['Dates - List of dates in this period']  // JSONB array
}

// paymentrecords normalization
{
  id: data._id,
  bookingReservation: data['Booking - Reservation'],
  paymentNumber: data['Payment #'],
  scheduledDate: data['Scheduled Date'],
  actualDate: data['Actual Date'],
  rentAmount: data['Rent Amount'],
  maintenanceFee: data['Maintenance Fee'],
  damageDeposit: data['Damage Deposit'],
  totalAmount: data['Total Amount'],
  bankTransactionNumber: data['Bank Transaction Number'],
  paymentReceipt: data['Payment Receipt'],
  isPaid: data['Is Paid'],
  isRefunded: data['Is Refunded']
}

// datechangerequest normalization
{
  id: data._id,
  lease: data.Lease,
  requestedBy: data['Requested by'],
  requestReceiver: data['Request receiver'],
  stayAssociated1: data['Stay Associated 1'],
  stayAssociated2: data['Stay Associated 2'],
  status: data.status,
  requestType: data['Request Type'],
  originalDate: data['Original Date'],
  requestedDate: data['Requested Date'],
  priceAdjustment: data['Price Adjustment'],
  createdDate: data['Created Date']
}
```

### Lease Status Values (from os_lease_status)

```javascript
const LEASE_STATUSES = {
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  PENDING_SIGNATURE: 'Pending Signature',
  PENDING_DOCUMENTS: 'Pending Documents'
};
```

### Stay Status Values (from os_stay_status)

```javascript
const STAY_STATUSES = {
  UPCOMING: 'Upcoming',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
};
```

### Date Change Request Status Values (from os_date_change_request_status)

```javascript
const DATE_CHANGE_REQUEST_STATUSES = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
  CANCELLED: 'Cancelled'
};
```

---

## Edge Function Enhancements

### Lease Edge Function - New Action: `get_host_leases`

**File**: `supabase/functions/lease/handlers/getHostLeases.ts`

```typescript
/**
 * Get all leases for a host user across all their listings
 *
 * @param payload - { hostUserId: string, listingId?: string }
 * @param user - Authenticated user
 * @param supabase - Supabase client
 * @returns Array of leases with related data
 */
export async function handleGetHostLeases(
  payload: { hostUserId: string; listingId?: string },
  user: UserContext | null,
  supabase: SupabaseClient
): Promise<LeaseWithRelations[]>
```

**Query Strategy**:
1. Fetch host's listings via `get_host_listings` RPC (existing pattern from HostProposalsPage)
2. Query `bookings_leases` where `Listing` IN host's listing IDs
3. Join/fetch related data:
   - Guest user info from `user` table
   - Stays from `bookings_stays` where `Lease` matches
   - Payment records from `paymentrecords` where `Booking - Reservation` matches
   - Date change requests from `datechangerequest` where `Lease` matches
4. Return normalized, enriched lease objects

**Index of Lease Edge Function**:
Update `supabase/functions/lease/index.ts` to add `get_host_leases` action.

---

## Implementation Steps

### Step 1: Route Configuration

**Files**: `app/src/routes.config.js`

**Purpose**: Register the new host-leases route

**Details**:
- Add route entry at position after `/host-proposals`
- Configure as protected, host-only page
- Use cloudflareInternal for query param preservation

```javascript
{
  path: '/host-leases',
  file: 'host-leases.html',
  aliases: ['/host-leases.html'],
  protected: true,
  cloudflareInternal: true,
  internalName: 'host-leases-view',
  hasDynamicSegment: false
}
```

**Validation**: Run `bun run generate-routes` and verify `_redirects` updated

---

### Step 2: HTML Entry Point

**Files**: `app/public/host-leases.html`

**Purpose**: Static HTML shell for the page

**Template** (copy from host-proposals.html and modify):
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My Leases | Split Lease</title>
  <link rel="icon" href="/assets/icons/favicon.ico" />
  <link rel="stylesheet" href="/src/styles/variables.css" />
  <link rel="stylesheet" href="/src/styles/main.css" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/host-leases.jsx"></script>
</body>
</html>
```

---

### Step 3: React Entry Point

**Files**: `app/src/host-leases.jsx`

**Purpose**: Mount the HostLeasesPage component

```javascript
import React from 'react';
import { createRoot } from 'react-dom/client';
import HostLeasesPage from './islands/pages/HostLeasesPage';

const root = createRoot(document.getElementById('root'));
root.render(<HostLeasesPage />);
```

---

### Step 4: Edge Function Handler

**Files**: `supabase/functions/lease/handlers/getHostLeases.ts`

**Purpose**: Fetch host's leases with all related data

**Details**:
1. Validate payload (hostUserId required)
2. Fetch host's listings using existing RPC
3. Query leases with nested selects
4. Enrich with stays, payments, date change requests
5. Return normalized data

**Validation**: Test with curl/Postman before frontend integration

---

### Step 5: Update Lease Edge Function Index

**Files**: `supabase/functions/lease/index.ts`

**Purpose**: Register the new action

**Details**:
- Add `'get_host_leases'` to ALLOWED_ACTIONS
- Add to AUTH_REQUIRED_ACTIONS (requires authentication)
- Add case in switch statement to route to handler

---

### Step 6: Page Component Directory Structure

**Files**: Create directory `app/src/islands/pages/HostLeasesPage/`

**Structure**:
```
HostLeasesPage/
├── index.jsx                    # Main page component (hollow)
├── useHostLeasesPageLogic.js    # All business logic
├── HostLeasesPage.css           # Page-specific styles
├── components/
│   ├── ListingTabs.jsx          # Horizontal tabs for listings
│   ├── LeaseCard.jsx            # Individual lease card
│   ├── GuestInfoSection.jsx     # Guest details within card
│   ├── PaymentRecordsTable.jsx  # Payment records table
│   ├── StaysTable.jsx           # Stays table with review action
│   ├── DateChangeSection.jsx    # Date change requests section
│   ├── PdfLinksRow.jsx          # Contract/document PDF links
│   └── EmptyState.jsx           # No leases state
├── modals/
│   ├── GuestReviewModal.jsx     # Submit review for guest
│   └── DateChangeDetailModal.jsx # Date change request details
├── formatters.js                # Date/currency formatters
└── types.js                     # TypeScript interfaces (JSDoc)
```

---

### Step 7: Page Logic Hook

**Files**: `app/src/islands/pages/HostLeasesPage/useHostLeasesPageLogic.js`

**Purpose**: All state, effects, and handlers for the page

**State Structure**:
```javascript
// Auth state
const [authState, setAuthState] = useState({
  isChecking: true,
  isAuthenticated: false,
  shouldRedirect: false,
  userType: null
});

// Data state
const [user, setUser] = useState(null);
const [listings, setListings] = useState([]);
const [selectedListing, setSelectedListing] = useState(null);
const [leases, setLeases] = useState([]);
const [selectedLease, setSelectedLease] = useState(null);

// UI state
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState(null);

// Expansion state (which lease cards have sections expanded)
const [expandedSections, setExpandedSections] = useState({});
// Format: { [leaseId]: { details: bool, allStays: bool, payments: bool, dateChanges: bool } }

// Modal state
const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
const [reviewTargetStay, setReviewTargetStay] = useState(null);
const [isDateChangeModalOpen, setIsDateChangeModalOpen] = useState(false);
const [selectedDateChangeRequest, setSelectedDateChangeRequest] = useState(null);
```

**Key Functions**:
```javascript
// Data loading
loadHostData(userId)
fetchHostListings(userId)  // Reuse pattern from HostProposals
fetchLeasesForListing(listingId)

// Handlers
handleListingChange(listing)
handleExpandSection(leaseId, section)
handleCollapseSection(leaseId, section)
handleToggleShowAllStays(leaseId)
handleToggleShowDetails(leaseId)

// Date change request handlers
handleAcceptDateChangeRequest(requestId)
handleDeclineDateChangeRequest(requestId)

// Review handlers
handleOpenReviewModal(stay)
handleSubmitGuestReview(reviewData)

// PDF handlers
handleOpenDocument(documentType, lease)
```

---

### Step 8: Main Page Component (Hollow)

**Files**: `app/src/islands/pages/HostLeasesPage/index.jsx`

**Purpose**: Pure JSX rendering, delegates all logic to hook

**Structure**:
```jsx
export default function HostLeasesPage() {
  const {
    authState,
    user,
    listings,
    selectedListing,
    leases,
    isLoading,
    error,
    expandedSections,
    // ... all handlers
  } = useHostLeasesPageLogic();

  // Auth checking state
  if (authState.isChecking) {
    return <LoadingState />;
  }

  // Auth redirect
  if (authState.shouldRedirect) {
    return null; // Redirect handled in hook
  }

  return (
    <div className="host-leases-page">
      <Header />
      <main className="host-leases-content">
        <h1>My Leases</h1>

        {/* Listing Tabs */}
        <ListingTabs
          listings={listings}
          selectedListing={selectedListing}
          onListingChange={handleListingChange}
        />

        {/* Content Area */}
        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={handleRetry} />
        ) : leases.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="lease-cards">
            {leases.map(lease => (
              <LeaseCard
                key={lease.id}
                lease={lease}
                expanded={expandedSections[lease.id]}
                onToggleDetails={() => handleToggleShowDetails(lease.id)}
                onToggleAllStays={() => handleToggleShowAllStays(lease.id)}
                onAcceptDateChange={handleAcceptDateChangeRequest}
                onDeclineDateChange={handleDeclineDateChangeRequest}
                onOpenReview={handleOpenReviewModal}
                onOpenDocument={handleOpenDocument}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />

      {/* Modals */}
      <GuestReviewModal
        isOpen={isReviewModalOpen}
        stay={reviewTargetStay}
        onClose={() => setIsReviewModalOpen(false)}
        onSubmit={handleSubmitGuestReview}
      />
    </div>
  );
}
```

---

### Step 9: Listing Tabs Component

**Files**: `app/src/islands/pages/HostLeasesPage/components/ListingTabs.jsx`

**Purpose**: Horizontal scrolling tabs for listing selection

**Pattern**: Follow existing PillSelector pattern from HostProposalsPage

**Props**:
```javascript
{
  listings: Array<{ id, name, thumbnail }>,
  selectedListing: { id },
  leaseCountsByListing: { [listingId]: number },
  onListingChange: (listing) => void
}
```

---

### Step 10: Lease Card Component

**Files**: `app/src/islands/pages/HostLeasesPage/components/LeaseCard.jsx`

**Purpose**: Display a single lease with expandable sections

**Sections**:
1. **Header**: Agreement number, lease status badge
2. **Guest Info Section**: Name, dates, phone, email, verification badges
3. **Payment Records Table**: Collapsible, 7 columns
4. **PDF Links Row**: 4 document links (Contract, Supplemental, etc.)
5. **Stays Table**: Week #, period, status, review action
6. **Date Change Section**: Conditional, shows pending requests

**State Interactions**:
- `showDetails` toggle for guest info expansion
- `showAllStays` toggle for full stays list vs. preview

---

### Step 11: Payment Records Table Component

**Files**: `app/src/islands/pages/HostLeasesPage/components/PaymentRecordsTable.jsx`

**Purpose**: Display payment schedule and history

**Columns**:
| Column | Field |
|--------|-------|
| Payment # | paymentNumber |
| Scheduled Date | scheduledDate |
| Actual Date | actualDate |
| Rent | rentAmount |
| Maintenance Fee | maintenanceFee |
| Damage Deposit | damageDeposit |
| Total | totalAmount |

**Features**:
- Alternating row colors
- Paid/Pending status indicator
- PDF receipt link for paid records

---

### Step 12: Stays Table Component

**Files**: `app/src/islands/pages/HostLeasesPage/components/StaysTable.jsx`

**Purpose**: Display individual stay periods

**Columns**:
| Column | Field |
|--------|-------|
| Week # | weekNumber |
| Period | checkInNight - lastNight formatted |
| Status | stayStatus badge |
| Action | Review Guest button (conditional) |

**Conditional Logic**:
- Show "Review Guest" button only for completed stays without existing review
- Different status badge colors per status

---

### Step 13: Date Change Section Component

**Files**: `app/src/islands/pages/HostLeasesPage/components/DateChangeSection.jsx`

**Purpose**: Display and action date change requests

**Fields**:
| Field | Description |
|-------|-------------|
| Requested by | User name who requested |
| Request | "Change from X to Y" description |
| Status | Badge (Pending/Accepted/Declined) |
| Price | Price adjustment if applicable |
| Action | Accept/Decline buttons for pending |

**Event Handlers**:
```javascript
onAccept(requestId)
onDecline(requestId)
onViewDetails(request)
```

---

### Step 14: Guest Review Modal

**Files**: `app/src/islands/pages/HostLeasesPage/modals/GuestReviewModal.jsx`

**Purpose**: Allow host to submit review for guest after stay

**Form Fields**:
- Overall rating (1-5 stars)
- Rating categories (cleanliness, communication, etc.)
- Written review text
- Would recommend toggle

**API Integration**: POST to existing review endpoint

---

### Step 15: Page Styles

**Files**: `app/src/islands/pages/HostLeasesPage/HostLeasesPage.css`

**Purpose**: Page-specific styling

**Design Tokens** (from provided specs):
```css
:root {
  --lease-success-green: #3135D;
  --lease-white: #FFFFFF;
  --lease-heading-black: #000000;
  --lease-tab-active: #6C7FEB;
  --lease-tab-inactive: #9DA9E8;
  --lease-notification-badge: #E33737;
}
```

**Responsive Breakpoint**: 700px

**Font Stack**:
- Buttons: DM Sans
- Body: Lato
- Links: Inter

---

### Step 16: Workflow to Event Handler Mapping

| Bubble Workflow | React Handler | Location |
|-----------------|---------------|----------|
| Navigate to page | URL navigation | `lib/navigation.js` |
| Show/hide details toggle | `handleToggleShowDetails(leaseId)` | Logic hook |
| Show all stays toggle | `handleToggleShowAllStays(leaseId)` | Logic hook |
| Accept date change | `handleAcceptDateChangeRequest(id)` | Logic hook |
| Decline date change | `handleDeclineDateChangeRequest(id)` | Logic hook |
| Open PDF document | `handleOpenDocument(type, lease)` | Logic hook |
| Submit guest review | `handleSubmitGuestReview(data)` | Logic hook |
| Display alert/toast | `showToast({ title, content, type })` | Shared Toast |
| Tab selection | `handleListingChange(listing)` | Logic hook |
| Schedule selector | N/A - Not used on this page | - |

---

### Step 17: Conditional Visibility Rules

| Element | Condition | Implementation |
|---------|-----------|----------------|
| Date Change Section | `lease.dateChangeRequests.length > 0` | Conditional render |
| Accept/Decline buttons | `request.status === 'Pending'` | Conditional render |
| Review Guest button | `stay.status === 'Completed' && !stay.reviewSubmittedByHost` | Conditional render |
| Notification badge | `listing.pendingDateChangeCount > 0` | Badge component |
| Payment receipt link | `payment.isPaid && payment.paymentReceipt` | Conditional render |

---

## Edge Cases & Error Handling

| Edge Case | Handling |
|-----------|----------|
| No listings | Show empty state with "Create Listing" CTA |
| No leases for listing | Show empty state with informational message |
| Date change request fails | Show toast error, don't change UI state |
| PDF document not available | Disable link, show "Not available" tooltip |
| Network error | Show error state with retry button |
| Session expired mid-action | Show auth modal, retry after re-auth |

---

## Testing Considerations

### Unit Tests
- Data normalizers (lease, stay, payment normalization)
- Conditional visibility rules
- Date formatters

### Integration Tests
- Edge function `get_host_leases` with mock data
- Date change request accept/decline flow

### E2E Tests
- Host login -> navigate to /host-leases
- Tab switching between listings
- Expand/collapse lease details
- Accept date change request
- Submit guest review

---

## Rollback Strategy

1. **Route**: Remove entry from `routes.config.js`, run generate-routes
2. **Files**: Delete `app/public/host-leases.html`, `app/src/host-leases.jsx`, `app/src/islands/pages/HostLeasesPage/`
3. **Edge Function**: Remove handler and action from lease function
4. **No database changes required** - all tables already exist

---

## Dependencies & Blockers

### Prerequisites
- [ ] Existing `get_host_listings` RPC must work (verified in HostProposalsPage)
- [ ] `lease` Edge Function deployed with get action
- [ ] `date-change-request` Edge Function deployed

### External Dependencies
- Supabase database access
- PDF document storage URLs must be accessible

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Large data payload for hosts with many leases | Medium | Medium | Implement pagination, lazy load stays/payments |
| Date change request race condition | Low | High | Use optimistic UI with rollback on error |
| PDF links broken | Medium | Low | Graceful fallback with "unavailable" state |
| Performance with 100+ stays per lease | Low | Medium | Virtual scrolling for stays table |

---

## Implementation Order (Recommended)

1. **Phase 1: Foundation** (Steps 1-3)
   - Route config, HTML, entry point
   - Verification: Page loads with placeholder

2. **Phase 2: Edge Function** (Steps 4-5)
   - Handler implementation
   - Verification: API returns correct data via curl

3. **Phase 3: Core UI** (Steps 6-10)
   - Page structure, hook, main component, tabs
   - Verification: Page renders with listing tabs

4. **Phase 4: Lease Display** (Steps 10-13)
   - LeaseCard, PaymentRecordsTable, StaysTable, DateChangeSection
   - Verification: All lease data displays correctly

5. **Phase 5: Interactions** (Steps 14-16)
   - Modals, event handlers, API calls
   - Verification: Date change and review flows work

6. **Phase 6: Polish** (Steps 15-17)
   - Styling, responsive design, edge cases
   - Verification: Matches design specs, mobile works

---

## Files Summary

### New Files to Create

| Path | Type |
|------|------|
| `app/public/host-leases.html` | HTML |
| `app/src/host-leases.jsx` | JSX Entry |
| `app/src/islands/pages/HostLeasesPage/index.jsx` | JSX Component |
| `app/src/islands/pages/HostLeasesPage/useHostLeasesPageLogic.js` | JS Hook |
| `app/src/islands/pages/HostLeasesPage/HostLeasesPage.css` | CSS |
| `app/src/islands/pages/HostLeasesPage/components/ListingTabs.jsx` | JSX Component |
| `app/src/islands/pages/HostLeasesPage/components/LeaseCard.jsx` | JSX Component |
| `app/src/islands/pages/HostLeasesPage/components/GuestInfoSection.jsx` | JSX Component |
| `app/src/islands/pages/HostLeasesPage/components/PaymentRecordsTable.jsx` | JSX Component |
| `app/src/islands/pages/HostLeasesPage/components/StaysTable.jsx` | JSX Component |
| `app/src/islands/pages/HostLeasesPage/components/DateChangeSection.jsx` | JSX Component |
| `app/src/islands/pages/HostLeasesPage/components/PdfLinksRow.jsx` | JSX Component |
| `app/src/islands/pages/HostLeasesPage/components/EmptyState.jsx` | JSX Component |
| `app/src/islands/pages/HostLeasesPage/modals/GuestReviewModal.jsx` | JSX Component |
| `app/src/islands/pages/HostLeasesPage/modals/DateChangeDetailModal.jsx` | JSX Component |
| `app/src/islands/pages/HostLeasesPage/formatters.js` | JS Utility |
| `app/src/islands/pages/HostLeasesPage/types.js` | JS Types |
| `supabase/functions/lease/handlers/getHostLeases.ts` | TS Handler |

### Files to Modify

| Path | Change |
|------|--------|
| `app/src/routes.config.js` | Add route entry |
| `supabase/functions/lease/index.ts` | Add action routing |

---

**Plan Created**: 2026-01-25 14:30:00
**Estimated Implementation Time**: 3-4 days
**Complexity**: High (multi-component page with Edge Function extension)
