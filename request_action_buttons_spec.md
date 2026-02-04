# Specification: Request Action Logic (Accept/Decline/Cancel)

## 1. Objective
Implement the business logic for "Accept", "Decline", and "Cancel" actions for Buyout/Swap requests. These actions must function correctly from both the **Transaction History** (Cancel) and **Chat Thread** (Accept/Decline/Counter).

## 2. Implementation Requirements

### 2.1 Data Structure Updates
To link Chat Messages to Transactions, the `requestMessage` created in `handleBuyOut` (and future handlers) must include the `transactionId`.

**Update `handleBuyOut` (useScheduleDashboardLogic.js):**
```javascript
// ... existing logic ...
const requestMessage = {
  // ...
  requestData: {
    // ...
    transactionId: newTransaction.id // Add this field
  }
};
```

### 2.2 Handler Implementations (`useScheduleDashboardLogic.js`)

#### A. `handleCancelRequest(transactionId)`
*User initiates from Transaction History -> Cancel Button.*
1.  **Find Transaction**: Locate transaction by `id`.
2.  **Update Status**: Set status to `'cancelled'`.
3.  **Update Calendar**: Remove the associated dates from `pendingNights`.
4.  **Chat Notification**: (Optional) Add a "You cancelled the request" system message.

#### B. `handleAcceptRequest(messageId)`
*User initiates from Chat Thread -> Accept Button.*
1.  **Find Message**: Locate the message by `id` to retrieve `requestData.transactionId`.
2.  **Find Transaction**: Locate transaction by `transactionId` (or `requestData` reference).
3.  **Update Status**: Set transaction status to `'complete'`.
4.  **Update Calendar**:
    *   Remove dates from `pendingNights`.
    *   Update `userNights` / `roommateNights` accordingly (Swap ownership).
        *   *For Buyout*: If I accept, I GIVE up the night. Remove from my nights, add to theirs (or vice-versa depending on who requested).
        *   *Logic*: If `direction` is 'incoming' (Roommate requesting to buy from me) and I Accept -> I lose the night.
5.  **Chat Notification**: Add a new message: "You accepted the request."

#### C. `handleDeclineRequest(messageId)`
*User initiates from Chat Thread -> Decline Button.*
1.  **Find Message**: Retrieve `requestData.transactionId`.
2.  **Update Status**: Set transaction status to `'declined'`.
3.  **Update Calendar**: Remove dates from `pendingNights`.
4.  **Chat Notification**: Add a new message: "You declined the request."

## 3. UI Updates

### 3.1 ChatThread.jsx
*   Ensure `onAccept`, `onDecline` pass the `message.id` (Current implementation does this).
*   *Optimization*: If `message.requestData.transactionId` is missing, the handler should fail gracefully or search by content.

### 3.2 TransactionHistory.jsx
*   Ensure "Cancel" button is only visible for `status === 'pending'`. (Current implementation does this).
*   Ensure it calls `onCancelRequest` (prop name check required, logic hook exports `handleCancelRequest`).

## 4. Verification Scenarios
1.  **Cancel Flow**:
    *   Create Buyout Request.
    *   Verify "Pending" in History.
    *   Click "Cancel Request" in History.
    *   Verify Status -> "Cancelled".
    *   Verify Calendar -> "Pending" state removed.
2.  **Accept Flow** (Requires incoming request mock):
    *   Simulate incoming message (e.g., from mock data `msg-1`).
    *   Click "Accept".
    *   Verify Link: Message -> Transaction (Mock data must link valid transaction ID if we test purely on mock).
    *   Verify Transaction Update -> "Complete".
    *   Verify Calendar -> Night ownership changes.

## 5. Acceptance Criteria
- [ ] `handleCancelRequest` updates transaction status and calendar state.
- [ ] `handleAcceptRequest` updates transaction status, calendar state, and swaps night ownership.
- [ ] `handleDeclineRequest` updates transaction status and clears pending flag.
- [ ] Actions are reflected immediately in the UI.
