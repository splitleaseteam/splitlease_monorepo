# Specification: Counter Request with Swap

## 1. Objective
Enable users to respond to an incoming **Buyout Request** (or Swap Request) by proposing a **Swap** instead of accepting the financial terms. This "Counter Offer" converts the negotiation into a night-exchange.

## 2. User Journey

### 2.1 Trigger
- User views an **Incoming Request** in the **Chat Thread**.
    - Example: "Sarah wants to buy Feb 14 for $150."
- User clicks the **"Counter"** button on the request bubble.

### 2.2 Counter Selection UI
- **Action**: The main Dashboard Panel (BuyOutPanel) opens in **"Counter Mode"**.
- **Context**:
    - **Giving**: The night Sarah requested (e.g., Feb 14). (Fixed, since that's what she wants).
    - **Getting**: User needs to select a night from **Sarah's Schedule** (Roommate's Nights) to ask for in return.
- **UI State**:
    - Header: "Counter with a Swap"
    - Subtitle: "You give Feb 14. Select a night to receive:"
    - **Selection Grid**: Highlight **Roommate's Nights** (white/clickable). User's own nights are disabled.

### 2.3 Submission
- User selects a night (e.g., Feb 28).
- User clicks **"Send Counter Offer"**.
- **System Actions**:
    1.  **Decline Original**: The original Buyout Request transaction is marked `declined`.
    2.  **Create New**: A new Swap Request transaction is created.
        - `nights`: [Feb 14 (My Night), Feb 28 (Their Night)]
        - `type`: 'swap'
        - `status`: 'pending'
    3.  **Chat Update**:
        - System message: "You declined the buyout."
        - New Request message: "You sent a counter-offer: Swap Feb 14 for Feb 28."

## 3. Implementation Requirements

### 3.1 State Management (`useScheduleDashboardLogic.js`)

**New State:**
```javascript
const [isCounterMode, setIsCounterMode] = useState(false);
const [counteringRequestId, setCounteringRequestId] = useState(null); // Reference to original msg/txn
const [counterOriginalNight, setCounterOriginalNight] = useState(null); // The night they wanted
const [counterTargetNight, setCounterTargetNight] = useState(null); // The night I want
```

**Handler: `handleCounterRequest(messageId)`**
```javascript
const handleCounterRequest = useCallback((messageId) => {
  const message = messages.find(m => m.id === messageId);
  if (!message) return;

  // 1. Identify the night they wanted
  // For standard Buyout, message.requestData.nights[0] is the target night
  const nightTheyWant = message.requestData.nights[0]; 
  
  // 2. Set State
  setCounteringRequestId(messageId);
  setCounterOriginalNight(nightTheyWant);
  setIsCounterMode(true);
  
  // 3. Open Panel (if needed) - reusing BuyOutPanel space
  setIsBuyOutOpen(true); 
}, [messages]);
```

**Handler: `handleSubmitCounter`**
```javascript
const handleSubmitCounter = async () => {
   // 1. Decline original (reuse handleDeclineRequest logic)
   await handleDeclineRequest(counteringRequestId);

   // 2. Create New Swap txn
   const newTxn = {
     // ... Standard Swap Txn ...
     nights: [counterOriginalNight, counterTargetNight],
     type: 'swap',
     // ...
   };
   
   // 3. Add to Transactions & Chat
   // ...
   
   // 4. Reset
   setIsCounterMode(false);
   setCounterTargetNight(null);
}
```

### 3.2 UI Component (`BuyOutPanel.jsx` / New `CounterPanel.jsx`?)
*Recommendation*: Extend `BuyOutPanel` again or create a clean wrapper. Given `SwapMode` exists, "Counter Mode" is just `SwapMode` but with strict constraints on the "Giving" side.
*   **Reuse `BuyOutPanel`**:
    *   Prop: `isCounterMode={true}`
    *   Effect:
        *   "My Night" side is locked to `counterOriginalNight`.
        *   "Their Night" side is selectable (displaying `roommateNights`).

## 4. Edge Cases
*   **Availability**: What if the roommate has no nights to swap?
    *   UI should show "No dates available to swap" and disable submission.
*   **Original Request Invalid**: If original request is already cancelled/declined?
    *   `handleCounterRequest` should check status before opening mode.

## 5. Acceptance Criteria
- [ ] Clicking "Counter" in Chat Thread opens the Panel in Counter Mode.
- [ ] Counter Mode locks the "Giving" night and allows selecting "Getting" night (Roommate's nights).
- [ ] Submitting declines the original request and creates a new Swap request.
- [ ] Chat reflects the chain of events (Declined -> Counter Sent).
