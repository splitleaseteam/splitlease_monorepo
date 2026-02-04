# E2E Test Plan: Counteroffer & Proposal Acceptance with Message Thread Validation

**Target Environment:** http://localhost:3000/
**Test Scope:** Dual listing proposal flows with comprehensive message/thread verification
**Test Type:** Fresh account creation (Host + Guest)

---

## Phase 1: Setup & Account Creation

### 1.1 Host Account Creation
- **Actor:** Test automation
- **Action:** Navigate to signup and create new host account
  - Email: `host_test_[timestamp]@example.com`
  - Password: Strong password (save for later use)
  - Account type: Host
- **Expected Outcome:** Host account created and logged in
- **Validation Points:**
  - Successful login confirmation
  - Host dashboard accessible
  - Account profile shows host status

### 1.2 Host Creates Listing A (Property 1)
- **Actor:** Host
- **Action:** Create first listing with distinct properties
  - Title: "Cozy Studio in Manhattan - Test Listing A"
  - Location: Manhattan neighborhood
  - Price: $150/night
  - Availability: Set 30+ days available
  - Days available: All 7 days (0-6)
- **Expected Outcome:** Listing A created successfully
- **Validation Points:**
  - Listing appears in host's dashboard
  - Listing ID captured for later use
  - Listing is live/published

### 1.3 Host Creates Listing B (Property 2)
- **Actor:** Host
- **Action:** Create second listing with different properties
  - Title: "Spacious Brooklyn Loft - Test Listing B"
  - Location: Brooklyn neighborhood
  - Price: $200/night
  - Availability: Set 30+ days available
  - Days available: All 7 days (0-6)
- **Expected Outcome:** Listing B created successfully
- **Validation Points:**
  - Listing appears in host's dashboard
  - Listing ID captured for later use
  - Listing is live/published
  - Host now has 2 active listings

### 1.4 Host Logout
- **Actor:** Host
- **Action:** Log out from host account
- **Expected Outcome:** Logged out successfully
- **Validation Points:**
  - Login page visible
  - No authenticated session

### 1.5 Guest Account Creation
- **Actor:** Test automation
- **Action:** Navigate to signup and create new guest account
  - Email: `guest_test_[timestamp]@example.com`
  - Password: Strong password (save for later use)
  - Account type: Guest
- **Expected Outcome:** Guest account created and logged in
- **Validation Points:**
  - Successful login confirmation
  - Guest dashboard accessible
  - Account profile shows guest status

---

## Phase 2: Proposal Flow #1 - Listing A (Counteroffer Path)

### 2.1 Guest Browses and Finds Listing A
- **Actor:** Guest
- **Action:** Navigate to listings page and search/filter for Listing A
  - Search for "Manhattan" or browse all listings
  - Identify "Cozy Studio in Manhattan - Test Listing A"
- **Expected Outcome:** Listing A visible in search results
- **Validation Points:**
  - Listing A displayed correctly
  - Price, title, location match expected values
  - Listing is bookable

### 2.2 Guest Creates Proposal on Listing A
- **Actor:** Guest
- **Action:** Click on Listing A and create a proposal
  - Select date range: 7 days from tomorrow
  - Select days: All 7 days
  - Offer price: $140/night (below asking price)
  - Add message: "Hi! I'm interested in your Manhattan studio for a week-long stay. Would you consider $140/night?"
  - Submit proposal
- **Expected Outcome:** Proposal created successfully
- **Validation Points:**
  - Success confirmation message displayed
  - Proposal ID captured for later use
  - Guest redirected to proposals dashboard or confirmation page

### 2.3 Verify Initial Message Thread Created (Listing A)
- **Actor:** Test automation (database check)
- **Action:** Query database for messages related to Proposal A
  - Check `messages` table for proposal_id = Proposal A ID
  - Check `message_threads` table for thread associated with Proposal A
- **Expected Outcome:** Thread and initial message exist
- **Validation Points:**
  - **CRITICAL:** 1 message thread exists for Proposal A
  - **CRITICAL:** 1 message exists in thread (guest's initial proposal message)
  - Message content matches: "Hi! I'm interested in your Manhattan studio for a week-long stay. Would you consider $140/night?"
  - Message sender is guest user ID
  - Message timestamp is recent (within last minute)

### 2.4 Guest Logout, Host Login
- **Actor:** Test automation
- **Action:** Log out guest, log in host
- **Expected Outcome:** Host logged in
- **Validation Points:**
  - Host dashboard accessible
  - New proposal notification visible

### 2.5 Host Views Proposal A
- **Actor:** Host
- **Action:** Navigate to proposals/inbox and view Proposal A
- **Expected Outcome:** Proposal A details displayed
- **Validation Points:**
  - Proposal shows guest's offer: $140/night
  - Proposal shows date range and days
  - Guest's message visible: "Hi! I'm interested in your Manhattan studio for a week-long stay. Would you consider $140/night?"
  - Counteroffer option available

### 2.6 Host Sends Counteroffer on Proposal A
- **Actor:** Host
- **Action:** Click "Counteroffer" and submit
  - Counter price: $145/night
  - Add message: "Thanks for your interest! I can offer $145/night instead. Deal?"
  - Submit counteroffer
- **Expected Outcome:** Counteroffer sent successfully
- **Validation Points:**
  - Success confirmation message
  - Proposal status updated to "countered" or similar
  - Counteroffer details captured

### 2.7 Verify Counteroffer Message Created (Listing A)
- **Actor:** Test automation (database check)
- **Action:** Query database for messages related to Proposal A
  - Check `messages` table for proposal_id = Proposal A ID
  - Count total messages
  - Verify latest message is from host
- **Expected Outcome:** New message added to thread
- **Validation Points:**
  - **CRITICAL:** Message thread for Proposal A now has 2 messages
  - **CRITICAL:** Latest message is from host user ID
  - Message content matches: "Thanks for your interest! I can offer $145/night instead. Deal?"
  - Message timestamp is recent (within last minute)
  - Message type/status indicates counteroffer action

### 2.8 Host Logout, Guest Login
- **Actor:** Test automation
- **Action:** Log out host, log in guest
- **Expected Outcome:** Guest logged in
- **Validation Points:**
  - Guest dashboard accessible
  - Counteroffer notification visible

### 2.9 Guest Views Counteroffer on Proposal A
- **Actor:** Guest
- **Action:** Navigate to proposals and view Proposal A
- **Expected Outcome:** Counteroffer details displayed
- **Validation Points:**
  - Proposal shows host's counteroffer: $145/night
  - Host's message visible: "Thanks for your interest! I can offer $145/night instead. Deal?"
  - Accept counteroffer option available

### 2.10 Guest Accepts Counteroffer on Proposal A
- **Actor:** Guest
- **Action:** Click "Accept Counteroffer" and confirm
  - Optionally add message: "Sounds great! I accept $145/night."
  - Submit acceptance
- **Expected Outcome:** Counteroffer accepted successfully
- **Validation Points:**
  - Success confirmation message
  - Proposal status updated to "accepted"
  - Payment or booking confirmation flow initiated (if applicable)

### 2.11 Verify Acceptance Message Created (Listing A)
- **Actor:** Test automation (database check)
- **Action:** Query database for messages related to Proposal A
  - Check `messages` table for proposal_id = Proposal A ID
  - Count total messages
  - Verify latest message is from guest (acceptance)
- **Expected Outcome:** New message added to thread
- **Validation Points:**
  - **CRITICAL:** Message thread for Proposal A now has 3 messages (or 3+ if system messages exist)
  - **CRITICAL:** Latest message is from guest user ID
  - Message content includes acceptance confirmation (either guest's optional message or system-generated)
  - Message timestamp is recent (within last minute)
  - Message type/status indicates acceptance action

---

## Phase 3: Proposal Flow #2 - Listing B (Direct Acceptance Path)

### 3.1 Guest Browses and Finds Listing B
- **Actor:** Guest (already logged in from Phase 2)
- **Action:** Navigate to listings page and search/filter for Listing B
  - Search for "Brooklyn" or browse all listings
  - Identify "Spacious Brooklyn Loft - Test Listing B"
- **Expected Outcome:** Listing B visible in search results
- **Validation Points:**
  - Listing B displayed correctly
  - Price, title, location match expected values
  - Listing is bookable

### 3.2 Guest Creates Proposal on Listing B
- **Actor:** Guest
- **Action:** Click on Listing B and create a proposal
  - Select date range: 5 days starting one week from tomorrow (non-overlapping with Proposal A)
  - Select days: Weekdays only (Mon-Fri: indices 1-5)
  - Offer price: $200/night (match asking price)
  - Add message: "Hello! I'd like to book your Brooklyn loft for Mon-Fri next week at the listed price."
  - Submit proposal
- **Expected Outcome:** Proposal created successfully
- **Validation Points:**
  - Success confirmation message displayed
  - Proposal ID captured for later use (Proposal B ID)
  - Guest redirected to proposals dashboard or confirmation page

### 3.3 Verify Initial Message Thread Created (Listing B)
- **Actor:** Test automation (database check)
- **Action:** Query database for messages related to Proposal B
  - Check `messages` table for proposal_id = Proposal B ID
  - Check `message_threads` table for thread associated with Proposal B
- **Expected Outcome:** Thread and initial message exist
- **Validation Points:**
  - **CRITICAL:** 1 message thread exists for Proposal B
  - **CRITICAL:** 1 message exists in thread (guest's initial proposal message)
  - Message content matches: "Hello! I'd like to book your Brooklyn loft for Mon-Fri next week at the listed price."
  - Message sender is guest user ID
  - Message timestamp is recent (within last minute)

### 3.4 Guest Logout, Host Login
- **Actor:** Test automation
- **Action:** Log out guest, log in host
- **Expected Outcome:** Host logged in
- **Validation Points:**
  - Host dashboard accessible
  - New proposal notification visible (Proposal B)

### 3.5 Host Views Proposal B
- **Actor:** Host
- **Action:** Navigate to proposals/inbox and view Proposal B
- **Expected Outcome:** Proposal B details displayed
- **Validation Points:**
  - Proposal shows guest's offer: $200/night
  - Proposal shows date range (5 days, Mon-Fri)
  - Guest's message visible: "Hello! I'd like to book your Brooklyn loft for Mon-Fri next week at the listed price."
  - Accept proposal option available

### 3.6 Host Accepts Original Proposal B (No Counteroffer)
- **Actor:** Host
- **Action:** Click "Accept Proposal" and confirm
  - Optionally add message: "Perfect! Your booking for Mon-Fri is confirmed."
  - Submit acceptance
- **Expected Outcome:** Proposal accepted successfully
- **Validation Points:**
  - Success confirmation message
  - Proposal status updated to "accepted"
  - Booking confirmation flow initiated (if applicable)

### 3.7 Verify Acceptance Message Created (Listing B)
- **Actor:** Test automation (database check)
- **Action:** Query database for messages related to Proposal B
  - Check `messages` table for proposal_id = Proposal B ID
  - Count total messages
  - Verify latest message is from host (acceptance)
- **Expected Outcome:** New message added to thread
- **Validation Points:**
  - **CRITICAL:** Message thread for Proposal B now has 2 messages
  - **CRITICAL:** Latest message is from host user ID
  - Message content includes acceptance confirmation (either host's optional message or system-generated)
  - Message timestamp is recent (within last minute)
  - Message type/status indicates acceptance action

---

## Phase 4: Comprehensive Validation & Cleanup

### 4.1 Verify Both Proposals Exist in Database
- **Actor:** Test automation (database check)
- **Action:** Query `proposals` table for both Proposal A and Proposal B
- **Expected Outcome:** Both proposals found
- **Validation Points:**
  - Proposal A exists with status "accepted"
  - Proposal A linked to Listing A ID
  - Proposal A linked to host and guest user IDs
  - Proposal A has counteroffer_price = $145
  - Proposal B exists with status "accepted"
  - Proposal B linked to Listing B ID
  - Proposal B linked to host and guest user IDs
  - Proposal B has no counteroffer_price (direct acceptance)

### 4.2 Verify Message Threads for Both Proposals
- **Actor:** Test automation (database check)
- **Action:** Query `message_threads` table for both proposals
- **Expected Outcome:** Both threads exist
- **Validation Points:**
  - **CRITICAL:** Message thread for Proposal A exists
  - **CRITICAL:** Message thread for Proposal B exists
  - Both threads have correct proposal_id references
  - Both threads have correct participant user IDs (host + guest)

### 4.3 Verify Message Counts and Ordering (Proposal A)
- **Actor:** Test automation (database check)
- **Action:** Query `messages` table for Proposal A thread, ordered by created_at ASC
- **Expected Outcome:** 3 messages in correct order
- **Validation Points:**
  - **CRITICAL:** Total message count = 3 (or 3+ if system messages exist)
  - Message 1: From guest, content includes "Hi! I'm interested in your Manhattan studio"
  - Message 2: From host, content includes "Thanks for your interest! I can offer $145/night"
  - Message 3: From guest, content includes acceptance confirmation
  - Messages ordered chronologically (created_at timestamps ascending)

### 4.4 Verify Message Counts and Ordering (Proposal B)
- **Actor:** Test automation (database check)
- **Action:** Query `messages` table for Proposal B thread, ordered by created_at ASC
- **Expected Outcome:** 2 messages in correct order
- **Validation Points:**
  - **CRITICAL:** Total message count = 2 (or 2+ if system messages exist)
  - Message 1: From guest, content includes "Hello! I'd like to book your Brooklyn loft"
  - Message 2: From host, content includes acceptance confirmation
  - Messages ordered chronologically (created_at timestamps ascending)

### 4.5 Host Views All Proposals (Final UI Check)
- **Actor:** Host (logged in)
- **Action:** Navigate to proposals dashboard and verify both proposals visible
- **Expected Outcome:** Both proposals listed
- **Validation Points:**
  - Proposal A (Manhattan) shows "Accepted" status with $145/night
  - Proposal B (Brooklyn) shows "Accepted" status with $200/night
  - Both proposals show correct guest information
  - Both proposals show correct date ranges

### 4.6 Guest Views All Proposals (Final UI Check)
- **Actor:** Guest (login if needed)
- **Action:** Navigate to proposals dashboard and verify both proposals visible
- **Expected Outcome:** Both proposals listed
- **Validation Points:**
  - Proposal A (Manhattan) shows "Accepted" status with $145/night
  - Proposal B (Brooklyn) shows "Accepted" status with $200/night
  - Both proposals show correct host/listing information
  - Both proposals show correct date ranges

### 4.7 Test Data Cleanup (Optional)
- **Actor:** Test automation
- **Action:** Clean up test data if needed
  - Delete test messages (if applicable)
  - Delete test proposals (if applicable)
  - Delete test listings (if applicable)
  - Delete test accounts (if applicable)
- **Expected Outcome:** Test data removed
- **Validation Points:**
  - Database cleaned up
  - No orphaned records

---

## Critical Success Criteria

This test is considered **PASSED** only if:

1. Both proposals created successfully
2. Both proposals accepted (one via counteroffer path, one direct)
3. **Message threads created for BOTH proposals**
4. **Proposal A has 3+ messages** (guest proposal → host counteroffer → guest acceptance)
5. **Proposal B has 2+ messages** (guest proposal → host acceptance)
6. All messages have correct sender IDs and timestamps
7. No errors or exceptions during any step
8. UI displays all proposals and statuses correctly

**FAIL conditions:**
- Any message thread missing
- Incorrect message counts
- Messages out of order
- Proposal status incorrect
- Any database constraint violations
- Any UI errors or broken links

---

## Test Execution Notes

- **Run on:** http://localhost:3000/
- **Total Steps:** 30+ (across 4 phases)
- **Estimated Duration:** 15-20 minutes (manual) / 5-10 minutes (automated)
- **Database Access Required:** Yes (for message/thread validation)
- **Screenshot Capture:** Recommended at key steps (proposal creation, counteroffer, acceptance)
- **Log Monitoring:** Monitor browser console and server logs for errors

---

**Generated:** 2026-02-02
**Test Plan Version:** 1.0
**Target Features:** Proposals, Counteroffers, Messages, Message Threads
