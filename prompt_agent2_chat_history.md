# Agent 2: Chat Thread + Transaction History Implementation

## Context
The scaffolding for `/guest-leases/:leaseId/schedule` (called "ScheduleDashboard") is complete. This prompt focuses on implementing Sections 4 and 5.

**Existing Files (already scaffolded):**
- `app/src/islands/pages/ScheduleDashboard/index.jsx`
- `app/src/islands/pages/ScheduleDashboard/useScheduleDashboardLogic.js`
- `app/src/islands/pages/ScheduleDashboard/components/ChatThread.jsx`
- `app/src/islands/pages/ScheduleDashboard/components/TransactionHistory.jsx`

---

## Section 4: ChatThread.jsx

### Requirements

1. **Message Display**
   - Scrollable container with newest messages at bottom
   - User messages on right (blue bubble)
   - Roommate messages on left (gray bubble)
   - Timestamp below each message

2. **System Messages (Inline)**
   - When a transaction completes, show inline:
     ```
     ────────────────────────
     ✓ Night swapped: You get Feb 14
     ────────────────────────
     ```
   - Different styling than chat bubbles

3. **Quick Response Chips**
   - Row of clickable chips above input:
     - "Sounds good!"
     - "Can we do a different date?"
     - "What nights work for you?"
   - Clicking chip inserts text into input

4. **Input Area**
   - Text input field
   - Send button (icon or text)
   - Disabled state when sending

5. **Request/Counter Actions**
   - If roommate sends a counter-offer, show inline buttons:
     ```
     [Jane] proposed swapping Feb 10 for Feb 14
     [Accept] [Decline] [Counter]
     ```

### Props Interface
```jsx
ChatThread.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    senderId: PropTypes.string,
    text: PropTypes.string,
    timestamp: PropTypes.string,
    type: PropTypes.oneOf(['message', 'system', 'request']),
    requestData: PropTypes.object, // For type='request'
  })),
  currentUserId: PropTypes.string,
  roommateName: PropTypes.string,
  onSendMessage: PropTypes.func,
  onAcceptRequest: PropTypes.func,
  onDeclineRequest: PropTypes.func,
  onCounterRequest: PropTypes.func,
  isSending: PropTypes.bool,
};
```

---

## Section 5: TransactionHistory.jsx

### Requirements

1. **Table Layout**
   | Date | Type | Night(s) | Amount | Status | Actions |
   |------|------|----------|--------|--------|---------|

2. **Type Column**
   - "Buyout" with 💰 icon
   - "Swap" with 🔄 icon
   - "Offer" with 📤 icon

3. **Amount Column**
   - Positive amounts in green: "+$150.00"
   - Negative amounts in red: "-$125.00"
   - Zero/swap: "$0.00"

4. **Status Badges**
   - ✅ Complete (green badge)
   - ⏳ Pending (yellow badge)
   - ❌ Declined (red badge)
   - 🔙 Cancelled (gray badge)

5. **Expand Row for Details**
   - Click row → expand to show:
     - Full message thread for this request
     - Timeline of status changes
     - Cancel button (if pending and user initiated)

6. **Sorting & Filtering**
   - Default sort: newest first
   - Filter dropdown: All / Buyouts / Swaps / Pending

### Props Interface
```jsx
TransactionHistory.propTypes = {
  transactions: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    date: PropTypes.string,
    type: PropTypes.oneOf(['buyout', 'swap', 'offer']),
    nights: PropTypes.arrayOf(PropTypes.string),
    amount: PropTypes.number,
    status: PropTypes.oneOf(['complete', 'pending', 'declined', 'cancelled']),
    counterpartyName: PropTypes.string,
    messages: PropTypes.array, // For expanded view
  })),
  onCancelRequest: PropTypes.func,
  onViewDetails: PropTypes.func,
};
```

---

## Data Connections (in useScheduleDashboardLogic.js)

Add these data fetches:
```javascript
// Fetch chat messages for this lease
const fetchChatMessages = async (leaseId) => {
  // Query messaging_thread where lease_id = leaseId
  // Order by timestamp ASC
};

// Fetch transaction history
const fetchTransactions = async (leaseId) => {
  // Query date_change_requests where lease_id = leaseId
  // Include related payment_records for amounts
  // Order by created_at DESC
};

// Send a chat message
const sendMessage = async (leaseId, text) => {
  // Insert into messaging_thread
};
```

---

## DO NOT MODIFY
- `ScheduleCalendar.jsx` (Agent 1)
- `BuyOutPanel.jsx` (Agent 1)
- `RoommateProfileCard.jsx` (can use placeholder data)
