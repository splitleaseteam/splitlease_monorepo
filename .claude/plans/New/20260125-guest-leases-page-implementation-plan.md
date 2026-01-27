# Guest Leases Page - Comprehensive Implementation Plan

**Created**: 2026-01-25
**Classification**: BUILD
**Complexity**: HIGH (Multi-phase, multi-file implementation)
**Estimated Files**: 25-35 new/modified files

---

## Executive Summary

This plan details the implementation of the Guest Leases page, migrating from Bubble.io to the Split Lease React + Supabase architecture. The page allows guests to view their leases, manage stays, handle check-in/checkout flows, request date changes, submit reviews, and view their flexibility scores.

---

## 1. Repository Analysis Summary

The reference repository (`splitleasesharath/guest-leases-page`) provides:

### 1.1 Type Definitions (`src/types/lease.types.ts`)
- **Option Sets**: `LeaseStatus`, `DateChangeRequestStatus`, `StayStatus`, `AlertType`, `PhotoType`
- **Core Types**: `User`, `Host`, `Listing`, `PaymentRecord`, `BookingStay`, `DateChangeRequest`, `BookingLease`
- **UI State Types**: `LeaseCardState`, `StaysTableState`, `CheckInCheckOutFlowState`, `DateChangeRequestsState`

### 1.2 Components Structure
```
components/
├── shared/
│   ├── Header.tsx + Header.css
│   └── Footer.tsx + Footer.css
├── LeaseCard.tsx + LeaseCard.css
├── PaymentRecordsTable.tsx + PaymentRecordsTable.css
├── StaysTable.tsx + StaysTable.css
├── DateChangeRequestsTable.tsx + DateChangeRequestsTable.css
├── FlexibilityScore.tsx + FlexibilityScore.css
└── CheckInCheckOutFlow.tsx + CheckInCheckOutFlow.css
```

### 1.3 Key Workflows (37 total from Bubble)
1. **Page Load**: Calculate current week number
2. **Check-in Flow**: "I'm on my way", "I'm here" notifications
3. **Check-out Flow**: Photo submission, review, leaving property
4. **Date Change Requests**: Create, approve, reject, cancel
5. **Review Management**: Submit and view reviews
6. **Document Access**: Download PDFs (PTA, supplemental, CC auth)
7. **Emergency Assistance**: Report emergencies

---

## 2. Database Schema Mapping

### 2.1 Existing Tables (Supabase)

Based on existing Edge Functions, these tables already exist:

| Bubble Type | Supabase Table | Notes |
|-------------|----------------|-------|
| `Bookings - Leases` | `lease` | Primary lease record |
| `Bookings - Stays` | `stay` | Weekly stays within lease |
| `Date Change Request` | `date_change_request` | Date modification requests |
| `Payment Records` | `payment_record` | Guest/Host payments |
| `User` | `user` | User profiles |
| `Account - Host` | `host_account` | Host business info |
| `Listing` | `listing` | Property listings |

### 2.2 Required New Tables/Fields

**Table: `proof_of_cleaning`** (NEW)
```sql
CREATE TABLE proof_of_cleaning (
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stay_id UUID REFERENCES stay(_id),
  cleaning_photos TEXT[],
  cleaning_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  modified_at TIMESTAMPTZ DEFAULT now()
);
```

**Table: `storage_photos`** (NEW)
```sql
CREATE TABLE storage_photos (
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stay_id UUID REFERENCES stay(_id),
  storage_photos TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  modified_at TIMESTAMPTZ DEFAULT now()
);
```

**Table: `review`** (Verify/Extend)
```sql
-- Ensure review table has:
-- - guest_submitted (reference to review for guest→host)
-- - host_submitted (reference to review for host→guest)
-- - stay_id reference
-- - rating (1-5)
-- - comment TEXT
-- - categories TEXT[]
```

### 2.3 Field Mappings

**`lease` table field mapping:**
| Bubble Field | Supabase Field | Type |
|--------------|----------------|------|
| `Guest` | `guest_id` | UUID FK |
| `Host` | `host_id` | UUID FK |
| `Listing` | `listing_id` | UUID FK |
| `Agreement Number` | `agreement_number` | TEXT |
| `Lease Status` | `lease_status` | TEXT (enum) |
| `Lease signed?` | `lease_signed` | BOOLEAN |
| `Reservation Period : Start` | `reservation_period_start` | DATE |
| `Reservation Period : End` | `reservation_period_end` | DATE |
| `current week number` | `current_week_number` | INTEGER |
| `total week count` | `total_week_count` | INTEGER |
| `Total Rent` | `total_rent` | NUMERIC |
| `Total Compensation` | `total_compensation` | NUMERIC |
| `Reputation Score (GUEST)` | `reputation_score_guest` | NUMERIC |
| `Reputation Score (HOST)` | `reputation_score_host` | NUMERIC |
| `Throttling - guest ability` | `throttling_guest_ability` | BOOLEAN |
| `Throttling - guest NOT show` | `throttling_guest_not_show` | BOOLEAN |
| `Periodic Tenancy Agreement` | `periodic_tenancy_agreement_url` | TEXT |
| `Supplemental Agreement` | `supplemental_agreement_url` | TEXT |
| `Form Credit Card Authorization` | `cc_authorization_form_url` | TEXT |
| `Check-in Code` | `check_in_code` | TEXT |
| `Thread` | `thread_id` | UUID FK |

**`stay` table field mapping:**
| Bubble Field | Supabase Field | Type |
|--------------|----------------|------|
| `Lease` | `lease_id` | UUID FK |
| `Week Number` | `week_number` | INTEGER |
| `Check In (night)` | `check_in_date` | DATE |
| `Check-out day` | `check_out_date` | DATE |
| `Stay Status` | `stay_status` | TEXT (enum) |
| `Review Submitted by Guest` | `review_guest_id` | UUID FK |
| `Review Submitted by Host` | `review_host_id` | UUID FK |
| `Cleaning Photos` | via `proof_of_cleaning` | Relation |
| `Storage Photos` | via `storage_photos` | Relation |

---

## 3. Frontend Implementation

### 3.1 Route Registration

Add to `app/src/routes.config.js`:
```javascript
{
  path: '/guest-leases',
  file: 'guest-leases.html',
  aliases: ['/guest-leases.html', '/my-leases'],
  protected: true,
  cloudflareInternal: true,
  internalName: 'guest-leases-view',
  hasDynamicSegment: true,
  dynamicPattern: '/guest-leases/:userId'
}
```

### 3.2 Files to Create

#### Entry Point
- `app/public/guest-leases.html` - HTML entry point
- `app/src/guest-leases.jsx` - React mount point

#### Page Component
- `app/src/islands/pages/GuestLeasesPage.jsx` - Main page (hollow component)
- `app/src/islands/pages/GuestLeasesPage.css` - Page styles

#### Page Logic Hook
- `app/src/hooks/useGuestLeasesPageLogic.js` - All page logic

#### Components
- `app/src/islands/shared/LeaseCard/LeaseCard.jsx`
- `app/src/islands/shared/LeaseCard/LeaseCard.css`
- `app/src/islands/shared/LeaseCard/LeaseCardHeader.jsx`
- `app/src/islands/shared/LeaseCard/LeaseCardContent.jsx`
- `app/src/islands/shared/PaymentRecordsTable/PaymentRecordsTable.jsx`
- `app/src/islands/shared/PaymentRecordsTable/PaymentRecordsTable.css`
- `app/src/islands/shared/StaysTable/StaysTable.jsx`
- `app/src/islands/shared/StaysTable/StaysTable.css`
- `app/src/islands/shared/DateChangeRequestsTable/DateChangeRequestsTable.jsx`
- `app/src/islands/shared/DateChangeRequestsTable/DateChangeRequestsTable.css`
- `app/src/islands/shared/FlexibilityScore/FlexibilityScore.jsx`
- `app/src/islands/shared/FlexibilityScore/FlexibilityScore.css`
- `app/src/islands/shared/CheckInCheckOutFlow/CheckInCheckOutFlow.jsx`
- `app/src/islands/shared/CheckInCheckOutFlow/CheckInCheckOutFlow.css`

#### Logic Layer (Four-Layer Architecture)
- `app/src/logic/calculators/lease/calculateCurrentWeekNumber.js`
- `app/src/logic/calculators/lease/calculateFlexibilityScore.js`
- `app/src/logic/calculators/lease/calculateNightsUsed.js`
- `app/src/logic/rules/lease/canCheckIn.js`
- `app/src/logic/rules/lease/canCheckOut.js`
- `app/src/logic/rules/lease/canSubmitReview.js`
- `app/src/logic/rules/lease/canRespondToDateChange.js`
- `app/src/logic/processors/lease/adaptLeaseFromSupabase.js`
- `app/src/logic/processors/lease/adaptStayFromSupabase.js`
- `app/src/logic/processors/lease/adaptDateChangeRequestFromSupabase.js`

### 3.3 Component Architecture

```
GuestLeasesPage (hollow)
├── useGuestLeasesPageLogic (hook)
├── Header (existing)
├── LeaseCard (repeated for each lease)
│   ├── LeaseCardHeader
│   │   └── Status badge, week info, expand toggle
│   └── LeaseCardContent (when expanded)
│       ├── HostContactInfo
│       ├── AgreementSection
│       ├── PaymentRecordsTable
│       ├── ActionButtons (PDFs, dates, etc.)
│       ├── StaysTable
│       ├── DateChangeRequestsTable
│       ├── FlexibilityScore
│       └── EmergencyAssistanceButton
├── CheckInCheckOutFlow (modal)
│   ├── StaySelector
│   ├── CheckInSection (I'm on my way, I'm here, message)
│   └── CheckOutSection (photos, review, leaving)
└── Footer (existing)
```

---

## 4. Edge Function Implementation

### 4.1 New Edge Function: `guest-leases`

Create `supabase/functions/guest-leases/index.ts`

**Actions:**
- `get_leases` - Fetch all leases for authenticated guest
- `get_lease_details` - Fetch single lease with all relations
- `send_checkin_message` - Send check-in notification
- `send_checkout_message` - Send checkout notification
- `submit_cleaning_photos` - Upload cleaning photos
- `submit_storage_photos` - Upload storage photos
- `update_stay_status` - Mark arrival/departure

**Handler Files:**
- `supabase/functions/guest-leases/handlers/getLeases.ts`
- `supabase/functions/guest-leases/handlers/getLeaseDetails.ts`
- `supabase/functions/guest-leases/handlers/sendCheckinMessage.ts`
- `supabase/functions/guest-leases/handlers/sendCheckoutMessage.ts`
- `supabase/functions/guest-leases/handlers/submitCleaningPhotos.ts`
- `supabase/functions/guest-leases/handlers/submitStoragePhotos.ts`
- `supabase/functions/guest-leases/handlers/updateStayStatus.ts`

### 4.2 Extend Existing Edge Functions

**`date-change-request`** - Already has:
- `create`, `get`, `accept`, `decline`, `cancel`, `get_throttle_status`

**`lease`** - Extend with:
- `get_guest_leases` - New action for guest-side fetching

### 4.3 API Integration Layer

Create `app/src/lib/api/guestLeases.js`:
```javascript
// Wrapper functions for Edge Function calls
export const fetchGuestLeases = async () => {...}
export const fetchLeaseDetails = async (leaseId) => {...}
export const sendCheckinMessage = async (stayId, message) => {...}
export const sendCheckoutMessage = async (stayId, message) => {...}
export const submitCleaningPhotos = async (stayId, photos) => {...}
export const submitStoragePhotos = async (stayId, photos) => {...}
export const createDateChangeRequest = async (payload) => {...}
export const approveDateChangeRequest = async (requestId) => {...}
export const rejectDateChangeRequest = async (requestId) => {...}
```

---

## 5. Workflow Implementation

### 5.1 Page Load Workflow

**Trigger**: Page loads
**Steps**:
1. Authenticate user (redirect if not logged in)
2. Fetch all leases where `guest_id = current_user_id`
3. For each lease, calculate `current_week_number`:
   ```javascript
   const daysSinceStart = differenceInDays(now, reservationPeriodStart);
   const currentWeekNumber = Math.ceil(daysSinceStart / 7);
   ```
4. Load related data (stays, date change requests, payment records)
5. Set initial expanded state (first lease)

### 5.2 Check-In Flow

**Trigger**: User clicks "I'm on my way" or "I'm here"

**"I'm on my way" Steps**:
1. Set message template: "Hi! I'm on my way to the property."
2. Allow user to edit message
3. On send:
   - Call `guest-leases/send_checkin_message`
   - Send multi-channel notification (SMS, email, in-app)
   - Show success toast
   - Close modal

**"I'm here" Steps**:
1. Set message template: "Hi! I've arrived at the property."
2. Allow user to edit message
3. On send:
   - Call `guest-leases/send_checkin_message`
   - Update stay status to `started` or `in_progress`
   - Send notification
   - Show success toast

### 5.3 Check-Out Flow

**Trigger**: User clicks checkout-related buttons

**Photo Submission**:
1. User selects photo type (cleaning or storage)
2. User uploads photos
3. On submit:
   - Call `guest-leases/submit_cleaning_photos` or `submit_storage_photos`
   - Create `proof_of_cleaning` or `storage_photos` record
   - Link to stay
   - Show success toast

**Review Submission**:
1. Open review modal
2. User selects rating, writes comment
3. On submit:
   - Call `communications/submit_review` (or create new action)
   - Create review record linked to stay
   - Show success toast

**Leaving Property**:
1. Send checkout notification
2. Update stay status to `completed`
3. Show thank you message

### 5.4 Date Change Request Flow

**Create Request**:
1. Open date change modal
2. User selects stay to modify
3. User picks new dates
4. On submit:
   - Call `date-change-request/create`
   - Show pending status

**Approve/Reject Request**:
1. Only show buttons if:
   - Status is `waiting_for_answer`
   - Current user is NOT the requester
2. On approve:
   - Call `date-change-request/accept`
   - Update flexibility scores
   - Refresh data
3. On reject:
   - Call `date-change-request/decline`
   - Update flexibility scores
   - Refresh data

### 5.5 Lease Card Toggle

**Trigger**: Click on lease card header

**Steps**:
1. Toggle `showDetails` state for that lease
2. Animate expand/collapse
3. If expanding, lazy-load detailed data if not already loaded

---

## 6. Conditionals & Visibility Logic

### 6.1 Lease Card Conditionals

| Condition | Action |
|-----------|--------|
| `isExpanded === true` | Show full lease content |
| `isExpanded === false` | Show header only |
| `leaseStatus === 'active'` | Green status badge |
| `leaseStatus === 'completed'` | Gray status badge |
| `leaseStatus === 'terminated'` | Red status badge |

### 6.2 Stays Table Conditionals

| Condition | Action |
|-----------|--------|
| `stayStatus === 'not_started' \|\| 'started'` | Show "I'm on my way", "I'm here" buttons |
| `stayStatus === 'in_progress'` | Show "Leaving Property" button |
| `stayStatus === 'completed' && !reviewSubmittedByGuest` | Show "Submit Review" button |
| `reviewSubmittedByHost` | Show "See Review" button |
| `stays.length > 4 && !showAll` | Show "Show All Stays" link |

### 6.3 Date Change Requests Conditionals

| Condition | Action |
|-----------|--------|
| `requestStatus === 'waiting_for_answer' && requestedBy.id !== currentUserId` | Show Approve/Reject buttons |
| `requestStatus === 'accepted'` | Show green "Accepted" badge |
| `requestStatus === 'rejected'` | Show red "Rejected" badge |
| `requestStatus === 'expired'` | Show gray "Expired" badge |

### 6.4 Document Button Conditionals

| Condition | Action |
|-----------|--------|
| `periodicTenancyAgreement` exists | Enable "PT Agreement (PDF)" button |
| `supplementalAgreement` exists | Enable "Supplemental Terms (PDF)" button |
| `creditCardAuthorizationForm` exists | Enable "CC Auth Form" button |

---

## 7. Design Specifications

### 7.1 Colors
- **Primary Purple**: `#7C3AED`
- **Text Dark**: `#4D4D4D`
- **Background Gray**: `#F7F8F9`
- **Border Gray**: `#6B6B6B`
- **Separator**: `#000000`
- **Success Green**: `#10B981`
- **Warning Yellow**: `#F59E0B`
- **Error Red**: `#EF4444`

### 7.2 Typography
- **Primary Font**: DM Sans
- **Headers**: 18px, weight 700
- **Body**: 14-16px, weight 400
- **Labels**: 12-14px, weight 500

### 7.3 Button Styles

**Primary (Purple Filled)**:
```css
.btn-primary {
  background: #7C3AED;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  font-weight: 500;
}
```

**Outline**:
```css
.btn-outline {
  background: white;
  color: #7C3AED;
  border: 1px solid #7C3AED;
  border-radius: 8px;
  padding: 10px 16px;
}
```

**Emergency (Red)**:
```css
.btn-emergency {
  background: #EF4444;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 20px;
}
```

### 7.4 Card Styles
```css
.lease-card {
  background: white;
  border: 1px solid #6B6B6B;
  border-radius: 8px;
  margin-bottom: 16px;
  overflow: hidden;
}

.lease-card.expanded {
  border-color: #7C3AED;
}
```

---

## 8. Implementation Phases

### Phase 1: Foundation (Day 1-2)
- [ ] Create database migrations for `proof_of_cleaning`, `storage_photos`
- [ ] Add route to `routes.config.js`
- [ ] Create HTML entry point and React mount
- [ ] Create page component structure (hollow)
- [ ] Create `useGuestLeasesPageLogic` hook skeleton

### Phase 2: Data Layer (Day 2-3)
- [ ] Create `guest-leases` Edge Function with `get_leases` action
- [ ] Create API wrapper in `app/src/lib/api/guestLeases.js`
- [ ] Implement data adapters in logic/processors
- [ ] Connect page to data fetching

### Phase 3: Core Components (Day 3-5)
- [ ] Implement LeaseCard component
- [ ] Implement PaymentRecordsTable
- [ ] Implement StaysTable with action buttons
- [ ] Implement DateChangeRequestsTable
- [ ] Implement FlexibilityScore
- [ ] Add all CSS styling

### Phase 4: Workflows (Day 5-7)
- [ ] Implement check-in flow (modal, API calls)
- [ ] Implement check-out flow (photos, review, leaving)
- [ ] Implement date change request management
- [ ] Implement document downloads
- [ ] Implement emergency assistance

### Phase 5: Integration & Polish (Day 7-8)
- [ ] Integrate with existing Header/Footer
- [ ] Add loading states and error handling
- [ ] Add toast notifications
- [ ] Responsive design adjustments
- [ ] Test all workflows end-to-end

### Phase 6: Review & Deploy (Day 8-9)
- [ ] Code review
- [ ] Run `bun run generate-routes`
- [ ] Test on development
- [ ] Deploy Edge Functions
- [ ] Deploy to Cloudflare Pages

---

## 9. Testing Strategy

### 9.1 Unit Tests
- Calculator functions (week number, flexibility score)
- Rule functions (canCheckIn, canSubmitReview)
- Processor functions (data adapters)

### 9.2 Component Tests
- LeaseCard expansion/collapse
- StaysTable conditional rendering
- DateChangeRequestsTable approve/reject buttons
- FlexibilityScore calculations display

### 9.3 Integration Tests
- Page load and data fetching
- Check-in flow end-to-end
- Check-out flow end-to-end
- Date change request workflow

### 9.4 E2E Tests
- Guest can view their leases
- Guest can check in to a stay
- Guest can submit checkout photos
- Guest can approve/reject date change requests

---

## 10. Dependencies

### 10.1 NPM Packages
- `lucide-react` - Already installed for icons
- No new dependencies required

### 10.2 Existing Components to Reuse
- `Header` - Main navigation
- `Footer` - Site footer
- `AuthGuard` - Authentication wrapper
- `Toast` - Notification system
- `Modal` - Base modal component

### 10.3 Existing Edge Functions to Extend
- `date-change-request` - Already complete
- `communications` - For messaging
- `lease` - Add `get_guest_leases` action

---

## 11. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Database schema differences from Bubble | Detailed field mapping above; verify with MCP tools before implementation |
| Missing Edge Function actions | Create comprehensive `guest-leases` Edge Function |
| Complex multi-channel messaging | Leverage existing `communications` Edge Function |
| File upload for photos | Use Supabase Storage with signed URLs |
| Flexibility score calculation complexity | Document algorithm clearly; implement as pure calculator function |

---

## 12. Files Reference Summary

### New Files (Frontend)
```
app/
├── public/guest-leases.html
├── src/
│   ├── guest-leases.jsx
│   ├── hooks/useGuestLeasesPageLogic.js
│   ├── lib/api/guestLeases.js
│   ├── logic/
│   │   ├── calculators/lease/
│   │   ├── rules/lease/
│   │   └── processors/lease/
│   └── islands/
│       ├── pages/
│       │   ├── GuestLeasesPage.jsx
│       │   └── GuestLeasesPage.css
│       └── shared/
│           ├── LeaseCard/
│           ├── PaymentRecordsTable/
│           ├── StaysTable/
│           ├── DateChangeRequestsTable/
│           ├── FlexibilityScore/
│           └── CheckInCheckOutFlow/
```

### New Files (Backend)
```
supabase/
├── functions/guest-leases/
│   ├── index.ts
│   └── handlers/
│       ├── getLeases.ts
│       ├── getLeaseDetails.ts
│       ├── sendCheckinMessage.ts
│       ├── sendCheckoutMessage.ts
│       ├── submitCleaningPhotos.ts
│       ├── submitStoragePhotos.ts
│       └── updateStayStatus.ts
└── migrations/
    └── YYYYMMDD_create_photo_tables.sql
```

### Modified Files
```
app/src/routes.config.js       # Add guest-leases route
supabase/functions/lease/      # Add get_guest_leases handler
```

---

## 13. Acceptance Criteria

1. **Guest can view all their leases** on a dedicated page
2. **Lease cards expand/collapse** to show detailed information
3. **Payment records table** displays all payment history with download options
4. **Stays table** shows all weekly stays with status-appropriate action buttons
5. **Check-in flow** allows sending "I'm on my way" and "I'm here" notifications
6. **Check-out flow** allows submitting cleaning/storage photos and reviews
7. **Date change requests** can be viewed, approved, or rejected
8. **Flexibility score** displays with visual representation
9. **Emergency assistance** button is accessible
10. **Documents** (PTA, supplemental, CC auth) can be downloaded
11. **Page is responsive** for mobile and desktop
12. **All workflows** trigger appropriate Edge Function calls

---

## Appendix A: Type Definitions (for reference)

```typescript
// Copy from repository src/types/lease.types.ts
// All types defined there should be converted to JSDoc for JavaScript implementation
```

## Appendix B: Reference Repository Location

Cloned to: `.claude/temp-guest-leases-page/`

Key files:
- `src/types/lease.types.ts` - Type definitions
- `src/pages/GuestLeasesPage.tsx` - Main page component
- `src/components/*.tsx` - All component implementations
- `src/data/mockData.ts` - Mock data structure

---

**End of Implementation Plan**
