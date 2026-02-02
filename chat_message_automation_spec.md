# Specification: Chat Message Automation for Requests

## 1. Objective
Automatically inject a chat message into the `ChatThread` when the user submits a "Buyout Request" or "Swap Request". This ensures the communication history reflects the transactional actions taken by the user.

## 2. Current Behavior
- Transactions are created in `TransactionHistory`.
- `pendingNights` are updated in `ScheduleCalendar`.
- **No record** appears in the `ChatThread`, leaving the conversation context disconnected from the action.
- User sees "Request Sent" in the panel, but the chat remains silent.

## 3. Implementation Requirements

### 3.1 Buyout Request (`handleBuyOut`)
Modify `useScheduleDashboardLogic.js` -> `handleBuyOut` to append a new message to the `messages` state.

**Message Object Construction:**
```javascript
const requestMessage = {
  id: `msg-${Date.now()}`,
  senderId: 'current-user', // matches logic hook constant
  senderName: 'You',
  text: `Requested to buy out ${formatDate(new Date(selectedNight))} for $${totalPrice.toFixed(2)}`,
  timestamp: new Date(),
  type: 'request', // Renders as a request bubble
  requestData: {
    type: 'buyout',
    nights: [new Date(selectedNight)],
    amount: totalPrice
  }
};
```

**State Update:**
```javascript
setMessages(prev => [...prev, requestMessage]);
```
*Note: Ensure this happens *after* the transaction creation logic.*

### 3.2 Helper Functions
- Ensure `formatDate` or equivalent is available within the hook or imported.
- `useScheduleDashboardLogic.js` currently has `toDateString`. It might need `formatDate` (Month Day) for the text.
- *Recommendation*: Use `new Date(date).toLocaleDateString(...)` locally or extract a helper.

## 4. Verification
- **Visual**: Upon clicking "Buy Out" in the panel:
    1.  The Buy Out panel shows success.
    2.  The Transaction History shows the pending row (previous fix).
    3.  **Chat Thread** immediately shows a new bubble on the right side ("You"):
        - Style: Request Bubble (likely distinct color/border).
        - Text: "Requested to buy out [Date] for $[Amount]".
        - No "Accept/Decline" buttons (since sender is current user).

## 5. Future Considerations (Swap Requests)
- Similar logic should be applied to `handleSwapInstead` -> `handleSwapRequest` when that feature is fully implemented.
- For now, scope is limited to **Buyout Requests**.

## 6. Acceptance Criteria
- [ ] Submitting a buyout request adds a message to the chat.
- [ ] Message type is 'request'.
- [ ] Message text correctly formats the date and amount.
- [ ] Message appears as "Sent" (right-aligned).
