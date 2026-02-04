# Proposal Flow Bug Fixes - Systematic Plan

**Created:** 2026-01-30
**Related Analysis:** `.claude/plans/Documents/20260130-proposal-flow-bug-hunt-analysis.md`
**Video Reference:** https://www.loom.com/share/17024672bdfa4ada872b5ca33e2f8e8c

## Overview

This plan addresses 18 critical bugs identified in the proposal flow bug hunt session. Bugs are organized into 3 phases based on priority and dependencies:

- **Phase 1 (P0):** Critical infrastructure - messaging, virtual meetings, lease creation
- **Phase 2 (P1):** Data accuracy - calculations, pricing, AI summaries
- **Phase 3 (P2):** UX polish - visual fixes, progress indicators

---

## Phase 1: Critical Infrastructure Fixes (P0)

### Task 1.1: Fix Messaging System Fetching and Display

**Bug:** BUG-01 - Entire messaging functionality broken

**Files to Modify:**
- `supabase/functions/messages/index.ts`
- `app/src/islands/pages/MessagingPage.jsx`
- Header shared island component (locate messaging icon component)

**Steps:**

1. **Investigate Edge Function:**
   ```bash
   # Test messages function locally
   supabase functions serve messages
   ```
   - Review `messages/index.ts` for fetching logic
   - Check if RLS policies are blocking reads
   - Verify return data format matches frontend expectations

2. **Check Database Schema:**
   - Read messages table schema from Supabase
   - Verify RLS policies allow authenticated users to read their messages
   - Test query: `SELECT * FROM messages WHERE user_id = auth.uid()`

3. **Fix Frontend Fetching:**
   - In `MessagingPage.jsx`, locate message fetching API call
   - Add error handling with specific error messages
   - Log errors to console with full details
   - Test with valid proposal ID

4. **Fix Shared Island:**
   - Locate messaging icon shared island component (likely in `app/src/islands/shared/`)
   - Update data fetching to use same corrected API
   - Add loading states
   - Test icon updates when new messages arrive

**Acceptance Criteria:**
- Messages load on `/messages` page without errors
- Message conversations display correctly
- Messaging icon in header shows unread count
- No console errors related to message fetching

---

### Task 1.2: Enable Message Sending

**Bug:** BUG-01 (continued) - Cannot send new messages

**Files to Modify:**
- `supabase/functions/messages/index.ts`
- `app/src/islands/pages/MessagingPage.jsx`

**Steps:**

1. **Review Message Creation Action:**
   - In `messages/index.ts`, locate `create` or `send` action
   - Verify required fields: `sender_id`, `receiver_id`, `proposal_id`, `content`
   - Check RLS policies allow inserts

2. **Test Message Creation:**
   - Use Supabase client to manually create message
   - Verify message appears in database
   - Check if real-time subscriptions work

3. **Fix Frontend Send Button:**
   - In `MessagingPage.jsx`, locate send message handler
   - Add validation for empty messages
   - Add error handling with user-friendly messages
   - Show success feedback (message sent)

4. **Add Real-time Updates:**
   - Subscribe to new messages in conversation
   - Update UI when new message received
   - Mark messages as read when viewed

**Acceptance Criteria:**
- User can type and send messages successfully
- Messages appear in conversation immediately
- Error messages are user-friendly
- Real-time updates work

---

### Task 1.3: Create Automatic Messages on Proposal Actions

**Bug:** BUG-05 - No messages created after proposal actions

**Files to Modify:**
- `supabase/functions/proposal/index.ts`
- `supabase/functions/_shared/messageHelpers.ts` (create if doesn't exist)

**Steps:**

1. **Create Message Helper Function:**
   ```typescript
   // In _shared/messageHelpers.ts
   export async function createProposalActionMessage(
     supabaseClient,
     proposalId: string,
     senderId: string,
     receiverId: string,
     action: 'created' | 'counteroffer' | 'accepted' | 'rejected',
     proposalData: any
   ) {
     const messageTemplates = {
       created: `New proposal received for ${proposalData.listing_name}...`,
       counteroffer: `Counteroffer submitted with updated terms...`,
       accepted: `Proposal accepted! Your lease is being prepared...`,
       rejected: `Proposal has been declined...`
     };

     return await supabaseClient.from('messages').insert({
       proposal_id: proposalId,
       sender_id: senderId,
       receiver_id: receiverId,
       content: messageTemplates[action],
       message_type: 'system'
     });
   }
   ```

2. **Integrate with Proposal Actions:**
   - In `proposal/index.ts`, after successful `create` action:
     ```typescript
     await createProposalActionMessage(client, proposalId, guestId, hostId, 'created', proposalData);
     ```
   - After successful `counteroffer` action:
     ```typescript
     await createProposalActionMessage(client, proposalId, hostId, guestId, 'counteroffer', proposalData);
     ```
   - After successful `accept` action:
     ```typescript
     await createProposalActionMessage(client, proposalId, acceptorId, otherPartyId, 'accepted', proposalData);
     ```

3. **Test Message Creation:**
   - Create proposal → verify host receives message
   - Send counteroffer → verify guest receives message
   - Accept proposal → verify both parties receive message

**Acceptance Criteria:**
- Message created after proposal creation
- Message created after counteroffer
- Message created after acceptance/rejection
- Messages contain relevant proposal details

---

### Task 1.4: Fix Virtual Meeting Creation - "Host User Not Found"

**Bug:** BUG-02 - Virtual meetings fail with "Host user not found"

**Files to Modify:**
- Locate virtual meeting Edge Function (search for "virtual-meeting" or check `proposal/index.ts` for meeting logic)
- `app/src/islands/pages/HostProposalsPage.jsx` (Request Meeting button)
- `app/src/islands/pages/GuestProposalsPage.jsx` (Request Meeting button)

**Steps:**

1. **Locate Virtual Meeting Function:**
   ```bash
   grep -r "virtual.*meeting" supabase/functions/
   grep -r "host.*user.*not.*found" supabase/functions/
   ```

2. **Identify Deleted Table References:**
   - Look for queries referencing `account_host` or `account_guest` tables
   - Example broken query:
     ```sql
     SELECT * FROM account_host WHERE host_id = ?
     ```

3. **Update User Lookup Logic:**
   - Replace deleted table references with Supabase Auth:
     ```typescript
     // OLD (broken):
     const hostUser = await client.from('account_host').select('*').eq('host_id', hostId).single();

     // NEW (fixed):
     const hostUser = await client.auth.getUser(hostId);
     // OR use auth.users if available via admin client
     ```

4. **Test User Lookup:**
   - Verify host user ID resolves correctly
   - Verify guest user ID resolves correctly
   - Test with real authenticated users

5. **Fix Meeting Creation:**
   - Ensure meeting record created with correct user IDs
   - Verify both parties receive notification
   - Test from both host and guest sides

**Acceptance Criteria:**
- Host can create virtual meeting request
- Guest can create virtual meeting request
- No "Host user not found" error
- Meeting appears in calendar for both parties

---

### Task 1.5: Fix Proposal Acceptance - Lease Creation Failure

**Bug:** BUG-03 - Lease not created properly on acceptance

**Files to Modify:**
- `supabase/functions/proposal/index.ts` (accept action)
- Potentially separate lease creation Edge Function

**Steps:**

1. **Review Acceptance Action:**
   - In `proposal/index.ts`, locate `accept` action
   - Identify lease creation logic
   - Check if using transaction (atomic operation)

2. **Add Comprehensive Error Logging:**
   ```typescript
   try {
     // Lease creation logic
   } catch (error) {
     console.error('Lease creation failed:', {
       code: error.code,
       message: error.message,
       details: error.details,
       hint: error.hint,
       proposalId,
       userId: user.id
     });
     throw error; // Re-throw after logging
   }
   ```

3. **Check FK Constraints:**
   - Identify all FK fields on `leases` table
   - Ensure all FKs are satisfied before insert:
     ```typescript
     // Only include fields that have values
     const leaseData = {
       proposal_id: proposalId,
       host_id: hostId,
       guest_id: guestId,
       // ... other required fields
     };

     // Don't include FK fields that are null (legacy data compatibility)
     if (listingId) leaseData.listing_id = listingId;
     ```

4. **Test with Legacy Data:**
   - Create proposal with listing that has null FK values
   - Attempt acceptance
   - Verify lease created successfully

5. **Verify Lease Searchable:**
   - After creation, query lease by proposal ID
   - Ensure all data persisted correctly
   - Test "Manage Lease Payment" search

**Acceptance Criteria:**
- Lease created successfully on acceptance
- All lease data persisted to database
- Lease searchable by proposal ID
- Works with legacy data (null FKs)
- Proper error messages if creation fails

---

## Phase 2: Data Accuracy Fixes (P1)

### Task 2.1: Generate AI Summaries for Counteroffers and Mock-ups

**Bug:** BUG-04 - AI summaries not created after counteroffer
**Bug:** BUG-06 (partial) - Mock-ups missing AI summary

**Files to Modify:**
- `supabase/functions/proposal/index.ts`
- `supabase/functions/ai-gateway/index.ts`

**Steps:**

1. **Locate AI Summary Generation:**
   - Find where AI summaries are currently generated
   - Check `ai-gateway/` function for summary endpoint

2. **Create Summary Helper Function:**
   ```typescript
   async function generateProposalSummary(
     proposalData: any,
     context: 'new' | 'counteroffer' | 'mockup'
   ): Promise<string> {
     const prompt = {
       new: `Summarize this rental proposal for the host: ${JSON.stringify(proposalData)}`,
       counteroffer: `Summarize this counteroffer changes for the guest: ${JSON.stringify(proposalData)}`,
       mockup: `Create a template summary for this mock-up proposal: ${JSON.stringify(proposalData)}`
     };

     // Call OpenAI via ai-gateway
     const response = await fetch(`${EDGE_FUNCTION_URL}/ai-gateway`, {
       method: 'POST',
       body: JSON.stringify({
         action: 'generate-summary',
         prompt: prompt[context]
       })
     });

     return await response.text();
   }
   ```

3. **Trigger on Counteroffer:**
   - In `proposal/index.ts` counteroffer action:
     ```typescript
     const aiSummary = await generateProposalSummary(updatedProposal, 'counteroffer');
     await client.from('proposals').update({ ai_summary: aiSummary }).eq('id', proposalId);
     ```

4. **Trigger on Mock-up Creation:**
   - Locate mock-up proposal creation (likely in listing creation flow)
   - Add AI summary generation:
     ```typescript
     const aiSummary = await generateProposalSummary(mockupData, 'mockup');
     mockupData.ai_summary = aiSummary;
     ```

5. **Verify Display:**
   - Check proposal card component shows `ai_summary` field
   - Test on host proposals page
   - Test on guest proposals page

**Acceptance Criteria:**
- AI summary generated for new proposals
- AI summary generated for counteroffers
- AI summary generated for mock-ups
- Summaries display on proposal cards

---

### Task 2.2: Recalculate Pricing on Counteroffer

**Bug:** BUG-08 - Price per night not updated after counteroffer

**Files to Modify:**
- `supabase/functions/proposal/index.ts`
- `app/src/logic/calculators/pricingCalculator.js` (verify exists)

**Steps:**

1. **Locate Pricing Calculation Logic:**
   - Find pricing list structure calculator
   - Should be same logic as browse listings page uses

2. **Create Pricing Recalculation Function:**
   ```typescript
   import { calculatePricingFromSchedule } from '../_shared/pricingCalculator';

   async function recalculateProposalPricing(
     listingId: string,
     newSchedule: { checkIn: string, checkOut: string, nights: number[] },
     reservationLength: number
   ) {
     // Get listing pricing structure
     const pricingStructure = await getPricingStructure(listingId);

     // Calculate new pricing
     const pricing = calculatePricingFromSchedule(
       pricingStructure,
       newSchedule,
       reservationLength
     );

     return {
       price_per_night_guest: pricing.guestNightly,
       price_per_night_host: pricing.hostNightly,
       four_week_rent: pricing.fourWeekRent,
       total_price: pricing.total
     };
   }
   ```

3. **Trigger on Counteroffer Schedule Change:**
   - In `proposal/index.ts` counteroffer action:
     ```typescript
     if (scheduleChanged) {
       const newPricing = await recalculateProposalPricing(
         proposal.listing_id,
         payload.schedule,
         payload.reservation_length
       );
       updateData = { ...updateData, ...newPricing };
     }
     ```

4. **Test Pricing Updates:**
   - Create proposal with Mon-Wed (3 nights)
   - Send counteroffer changing to Mon-Tue (2 nights)
   - Verify guest sees updated pricing
   - Compare with browse listings page calculation

**Acceptance Criteria:**
- Counteroffer triggers pricing recalculation
- Guest sees updated nightly price
- Guest sees updated 4-week rent
- Guest sees updated total price
- Matches browse listings page logic

---

### Task 2.3: Persist and Display House Rules

**Bug:** BUG-09 - House rules not displayed after counteroffer

**Files to Modify:**
- `supabase/functions/proposal/index.ts`
- `app/src/islands/components/ProposalCard.jsx` (or similar)
- Guest review modal component

**Steps:**

1. **Verify Database Fields:**
   - Check `proposals` table for house rules fields
   - Likely named `hc_*` (e.g., `hc_quiet_hours`, `hc_no_smoking`)

2. **Save House Rules on Counteroffer:**
   - In `proposal/index.ts` counteroffer action:
     ```typescript
     if (payload.house_rules) {
       updateData.hc_quiet_hours = payload.house_rules.quiet_hours;
       updateData.hc_no_smoking = payload.house_rules.no_smoking;
       updateData.hc_no_pets = payload.house_rules.no_pets;
       // ... other rules
     }
     ```

3. **Display on Proposal Card:**
   - In `ProposalCard.jsx`, add house rules section:
     ```jsx
     {proposal.hc_quiet_hours && (
       <div>House Rules: Quiet hours {proposal.hc_quiet_hours}</div>
     )}
     ```

4. **Display in Review Modal:**
   - Add house rules to guest review terms popup
   - Show newly added rules highlighted

**Acceptance Criteria:**
- House rules saved to database on counteroffer
- House rules visible on host proposal card
- House rules visible on guest proposal card
- Rules persist through proposal state changes

---

### Task 2.4: Fix Nights Reserved Calculation

**Bug:** BUG-10 - Nights reserved calculation incorrect

**Files to Modify:**
- `app/src/logic/calculators/nightsCalculator.js` (locate or create)
- `supabase/functions/proposal/index.ts`

**Steps:**

1. **Locate Calculation Logic:**
   ```bash
   grep -r "nights.*reserved" app/src/
   grep -r "nights.*week" app/src/
   ```

2. **Fix Calculation Formula:**
   ```javascript
   // In nightsCalculator.js
   export function calculateTotalNights(nightsPerWeek, reservationLengthWeeks) {
     // nightsPerWeek = number of nights selected each week (e.g., Mon-Wed = 3)
     // reservationLengthWeeks = total duration in weeks (e.g., 16)
     return nightsPerWeek * reservationLengthWeeks;
   }
   ```

3. **Apply in Proposal:**
   - On proposal creation:
     ```javascript
     const nightsPerWeek = selectedNights.length; // e.g., [1,2,3] = 3 nights
     const totalNights = calculateTotalNights(nightsPerWeek, reservationLength);
     proposalData.nights_reserved = totalNights;
     ```

4. **Test Edge Cases:**
   - 1 night/week × 4 weeks = 4 total nights
   - 3 nights/week × 16 weeks = 48 total nights
   - 7 nights/week × 8 weeks = 56 total nights

**Acceptance Criteria:**
- Calculation: nights_per_week × reservation_length_weeks
- Correct on proposal creation
- Correct after counteroffer schedule change
- Displays in review modal

---

### Task 2.5: Show Host Compensation (Not Guest Price) on Host View

**Bug:** BUG-11 - Host proposals page shows guest pricing

**Files to Modify:**
- `app/src/islands/pages/HostProposalsPage.jsx`
- Proposal card component used by host

**Steps:**

1. **Identify Pricing Field:**
   - In `HostProposalsPage.jsx`, find where price is displayed
   - Check if using `price_per_night_guest` vs `price_per_night_host`

2. **Fix to Use Host Compensation:**
   ```jsx
   // OLD (broken):
   <div>Price: ${proposal.price_per_night_guest}</div>

   // NEW (fixed):
   <div>Compensation: ${proposal.price_per_night_host}</div>
   ```

3. **Verify Data Structure:**
   - Ensure proposals fetched include both pricing fields
   - Check database has `price_per_night_host` field

4. **Test Host View:**
   - Create proposal
   - View on host proposals page
   - Verify shows host compensation amount

**Acceptance Criteria:**
- Host sees compensation per night (what they earn)
- Guest sees pricing per night (what they pay)
- Correct calculations for both

---

### Task 2.6: Fix Moving Date Display in Guest Review Popup

**Bug:** BUG-12 - Moving date shows "TBD" instead of actual date

**Files to Modify:**
- Guest review terms popup component

**Steps:**

1. **Locate Review Popup:**
   ```bash
   grep -r "Review.*Terms" app/src/islands/
   grep -r "TBD" app/src/
   ```

2. **Check Data Binding:**
   - Verify `moving_date` field passed to popup
   - Check date formatting

3. **Fix Display:**
   ```jsx
   // OLD (broken):
   <div>Move-in: {proposal.moving_date || 'TBD'}</div>

   // NEW (fixed):
   <div>Move-in: {formatDate(proposal.moving_date) || 'TBD'}</div>
   ```

4. **Verify Data Consistency:**
   - Check host view shows same date
   - Ensure date persists through counteroffer

**Acceptance Criteria:**
- Moving date displays actual date
- "TBD" only if date truly not set
- Consistent across host and guest views

---

## Phase 3: UX Polish Fixes (P2)

### Task 3.1: Update Progress Bar Status on Counteroffer

**Bug:** BUG-07 - Progress bar not updating after counteroffer

**Files to Modify:**
- Progress bar component (locate in shared/components)
- `app/src/islands/pages/HostProposalsPage.jsx`

**Steps:**

1. **Map Proposal Status to Progress States:**
   ```javascript
   const progressStates = {
     'proposal_submitted': {
       steps: ['proposal_submitted'],
       current: 'proposal_submitted'
     },
     'rental_app_submitted': {
       steps: ['proposal_submitted', 'rental_app_submitted'],
       current: 'rental_app_submitted'
     },
     'counteroffer_pending': {
       steps: ['proposal_submitted', 'rental_app_submitted'],
       current: 'reviewing_counteroffer',
       message: 'Guest is reviewing the counteroffer'
     },
     'accepted': {
       steps: ['proposal_submitted', 'rental_app_submitted', 'accepted'],
       current: 'accepted'
     }
   };
   ```

2. **Update Status Text:**
   - Show dynamic message based on current state
   - Indicate who needs to take action (host vs guest)

3. **Highlight Completed Steps:**
   - Completed steps: purple color
   - Current step: highlighted
   - Future steps: grey

**Acceptance Criteria:**
- Progress bar updates on status change
- Completed steps highlighted in purple
- Status text indicates current action needed
- Works for all proposal states

---

### Task 3.2: Add Mock-up Visual Indicators

**Bug:** BUG-06 - Mock-ups not clearly labeled

**Files to Modify:**
- Proposal card component
- `app/src/islands/pages/HostProposalsPage.jsx`

**Steps:**

1. **Add Mock-up Badge:**
   ```jsx
   {proposal.is_mockup && (
     <div className="badge badge-secondary">MOCK-UP</div>
   )}
   ```

2. **Style Differently:**
   - Add subtle background color to mock-up cards
   - Add border or shadow to differentiate

3. **Set Default Progress State:**
   - Mock-ups should show "Rental Application Submitted" as default
   - Highlight in purple

**Acceptance Criteria:**
- Mock-ups have visible badge
- Distinct visual styling
- Default progress state set correctly

---

### Task 3.3: Fix Cleaning Fee Placeholder Visibility

**Bug:** BUG-13 - Cleaning fee placeholder not clear when empty

**Files to Modify:**
- Listing creation financials form component

**Steps:**

1. **Update Input Styling:**
   ```jsx
   <input
     type="number"
     placeholder="0"
     className="input-field"
     style={{
       color: value ? 'black' : '#999',
       fontStyle: value ? 'normal' : 'italic'
     }}
   />
   ```

2. **Or Show Explicit $0:**
   ```jsx
   value={cleaningFee || 0}
   ```

**Acceptance Criteria:**
- Clear distinction between value and placeholder
- User knows when field is empty

---

### Task 3.4: Fix Pricing Unit Test Page Loading

**Bug:** BUG-14 - Pricing unit test page fails to load

**Files to Modify:**
- `app/src/routes.config.js` (verify route exists)
- `app/src/islands/pages/PricingUnitTestPage.jsx`

**Steps:**

1. **Verify Route Configuration:**
   ```javascript
   {
     path: '/pricing-unit-test',
     input: 'src/pricing-unit-test.jsx',
     component: 'PricingUnitTestPage'
   }
   ```

2. **Check Data Fetching:**
   - Verify listing ID passed to page
   - Check pricing structure fetch logic

3. **Fix Component Mounting:**
   - Add error boundaries
   - Add loading states
   - Test with newly created listing

**Acceptance Criteria:**
- Page loads without errors
- Displays pricing structure
- Header renders correctly

---

### Task 3.5: Fix Quick Price Calculator Table

**Bug:** BUG-15 - Multiple display issues on Quick Price table

**Files to Modify:**
- `app/src/islands/pages/QuickPriceCalculatorPage.jsx`
- Quick Price table component (if separate)

**Steps:**

1. **Fix Button Labels:**
   ```jsx
   <button title="Edit pricing">
     <span>Edit</span>  {/* Make text visible, not just tooltip */}
     <PencilIcon />
   </button>
   ```

2. **Fix Location Column:**
   ```css
   .location-column {
     max-width: 200px;
     overflow: hidden;
     text-overflow: ellipsis;
     white-space: nowrap;
   }
   ```

3. **Fix Host Name Display:**
   - Ensure host name fetched from user data
   - Verify join query includes host info

4. **Add Listing ID Search:**
   ```jsx
   <input
     placeholder="Search by name or ID"
     onChange={(e) => handleSearch(e.target.value)}
   />
   ```
   - Search both `listing_name` and `listing_id` fields

**Acceptance Criteria:**
- Button labels visible
- Location column constrained
- Host name displays correctly
- Can search by listing ID or name

---

### Task 3.6: Fix Host Overview Card Button Alignment

**Bug:** BUG-16 - Buttons not horizontally aligned

**Files to Modify:**
- `app/src/islands/pages/HostOverviewPage.jsx`
- Card component

**Steps:**

1. **Fix Layout:**
   ```jsx
   <div className="card">
     <div className="card-content">
       {/* Card content */}
     </div>
     <div className="card-actions" style={{
       display: 'flex',
       flexDirection: 'row',
       justifyContent: 'space-between',
       alignItems: 'center',
       marginTop: 'auto'
     }}>
       <button>Action 1</button>
       <button>Action 2</button>
       <button>Action 3</button>
       <button>Action 4</button>
     </div>
   </div>
   ```

2. **Ensure Card Uses Flexbox:**
   ```css
   .card {
     display: flex;
     flex-direction: column;
     height: 100%;
   }
   ```

**Acceptance Criteria:**
- Four buttons horizontally aligned
- Buttons at bottom of card
- Consistent spacing

---

### Task 3.7: Fix Request Meeting Button

**Bug:** BUG-17 - Request Meeting button poorly styled and non-functional

**Files to Modify:**
- `app/src/islands/pages/MessagingPage.jsx`
- Virtual meeting modal component

**Steps:**

1. **Apply Consistent Styling:**
   ```jsx
   <button className="btn btn-primary">
     <CalendarIcon />
     Request Meeting
   </button>
   ```

2. **Wire to Modal:**
   ```jsx
   const [showMeetingModal, setShowMeetingModal] = useState(false);

   <button onClick={() => setShowMeetingModal(true)}>
     Request Meeting
   </button>

   {showMeetingModal && (
     <VirtualMeetingModal
       onClose={() => setShowMeetingModal(false)}
       proposalId={proposal.id}
     />
   )}
   ```

3. **Reuse Modal Component:**
   - Import same modal used on proposals page
   - Pass proposal context

**Acceptance Criteria:**
- Button styled consistently
- Clicking opens virtual meeting modal
- Modal functions correctly
- Professional appearance

---

### Task 3.8: Fix Messaging Icon Header Updates

**Bug:** BUG-18 - Messaging icon not showing message count

**Files to Modify:**
- Messaging icon shared island component

**Steps:**

1. **Add Real-time Subscription:**
   ```javascript
   useEffect(() => {
     const subscription = supabase
       .from('messages')
       .on('INSERT', (payload) => {
         if (payload.new.receiver_id === user.id) {
           setUnreadCount(prev => prev + 1);
         }
       })
       .subscribe();

     return () => subscription.unsubscribe();
   }, [user.id]);
   ```

2. **Fetch Unread Count:**
   ```javascript
   const { count } = await supabase
     .from('messages')
     .select('*', { count: 'exact', head: true })
     .eq('receiver_id', user.id)
     .eq('read', false);
   ```

3. **Display Badge:**
   ```jsx
   <div className="messaging-icon">
     <MessageIcon />
     {unreadCount > 0 && (
       <span className="badge">{unreadCount}</span>
     )}
   </div>
   ```

**Acceptance Criteria:**
- Icon shows unread message count
- Count updates in real-time
- Badge disappears when no unread messages

---

## Testing Protocol

After implementing all fixes, run complete end-to-end test:

### Test Flow 1: New Proposal
1. Create listing (signed out, prompted to sign up)
2. Verify mock-up created with AI summary and badge
3. Guest creates proposal
4. Verify host receives message
5. Verify messaging icon updates
6. Verify AI summary on host side

### Test Flow 2: Counteroffer
1. Host modifies schedule (changes nights)
2. Host adds house rules
3. Submit counteroffer
4. Verify nights calculation correct
5. Verify pricing recalculated
6. Verify house rules visible
7. Verify guest receives message with AI summary
8. Verify progress bar updated

### Test Flow 3: Acceptance
1. Guest accepts counteroffer
2. Verify lease created
3. Verify lease searchable by proposal ID
4. Verify both parties receive messages
5. Verify all data persisted

### Test Flow 4: Virtual Meetings
1. Host requests meeting from proposals page
2. Verify modal opens
3. Verify meeting created
4. Guest requests meeting
5. Verify works from both sides

### Test Flow 5: Quick Tools
1. Test Quick Price Calculator search by ID
2. Verify table displays correctly
3. Test Pricing Unit Test page loads
4. Verify host overview cards aligned

---

## Deployment Checklist

Before marking complete:

- [ ] All tests pass
- [ ] No console errors
- [ ] Edge Functions deployed to dev
- [ ] Database migrations applied (if any)
- [ ] Tested on local environment
- [ ] Tested on staging/preview
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] Screenshots of fixes captured
- [ ] Regression tests added

---

## Success Metrics

- ✅ 0 messaging errors
- ✅ 0 proposal acceptance failures
- ✅ 100% AI summary generation rate
- ✅ Accurate pricing calculations
- ✅ All visual bugs resolved
- ✅ E2E test suite passes

---

## Notes

- Some bugs may be related to deployment status (local vs production)
- Test thoroughly with legacy data (null FK values)
- Monitor PostgREST error codes: 23503 (FK violation), 23505 (unique violation)
- Add comprehensive error logging throughout

**Estimated Total Effort:** 3-5 days
**Priority Order:** P0 → P1 → P2
**Dependencies:** Phase 1 must complete before Phase 2
