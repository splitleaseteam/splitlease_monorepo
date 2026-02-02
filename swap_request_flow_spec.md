# Specification: "Offer a Swap Instead" Flow

## 1. Objective
Implement the complete "Offer a Swap Instead" user flow, allowing a user to propose exchanging one of their nights for a roommate's night instead of paying for a buyout.

## 2. User Journey

### Step 1: Initiate Swap (Current State)
- User selects a **roommate's night** on the calendar (e.g., Feb 10, 2026 - held by Sarah).
- BuyOutPanel opens showing the selected night.
- User clicks **"Offer a Swap Instead"** button.

### Step 2: Select Night to Offer (New UI Required)
- **BuyOutPanel transforms** into "Swap Mode":
    - Header changes: "Buy Out Night" → "Offer a Swap"
    - **New Section**: "Select a night to offer in exchange"
    - Display a **mini-calendar** or **list** of the user's upcoming nights.
    - User selects one of their own nights to offer (e.g., Feb 12, 2026).
- **Price Breakdown** hides (swaps are $0 cost, optional platform fee could apply).
- **Actions Update**:
    - Primary Button: "Send Swap Request"
    - Secondary: "Back to Buyout"
    - Cancel: Still closes panel.

### Step 3: Confirm & Submit
- User clicks "Send Swap Request".
- System creates:
    1. **Transaction** (type: 'swap', status: 'pending')
    2. **Chat Message** (type: 'request')
    3. **Pending Nights** (both nights marked as pending)
- Success state shows: "Swap Request Sent! Waiting for Sarah's response."

### Step 4: Roommate Response (Existing)
- Roommate sees the request in their Chat Thread.
- They can **Accept**, **Decline**, or **Counter**.
- Handlers already implemented (previous spec).

---

## 3. Implementation Requirements

### 3.1 State Management (`useScheduleDashboardLogic.js`)

**New State Variables:**
```javascript
const [isSwapMode, setIsSwapMode] = useState(false);
const [swapOfferNight, setSwapOfferNight] = useState(null); // User's night to offer
```

**New Handler: `handleSwapInstead`**
```javascript
const handleSwapInstead = useCallback(() => {
  if (!selectedNight) return;
  setIsSwapMode(true);
  // Keep selectedNight as the "requested" night
}, [selectedNight]);
```

**New Handler: `handleSelectSwapOffer(nightString)`**
```javascript
const handleSelectSwapOffer = useCallback((nightString) => {
  // Validate it's the user's night
  if (userNights.includes(nightString)) {
    setSwapOfferNight(nightString);
  }
}, [userNights]);
```

**New Handler: `handleSubmitSwapRequest`**
```javascript
const handleSubmitSwapRequest = useCallback(async (message) => {
  if (!selectedNight || !swapOfferNight || isSubmitting) return;

  try {
    setIsSubmitting(true);

    // 1. Create Transaction
    const newTransaction = {
      id: `txn-${Date.now()}`,
      date: new Date(),
      type: 'swap',
      nights: [new Date(selectedNight), new Date(swapOfferNight)],
      amount: 0,
      direction: null, // Swap has no direction
      status: 'pending',
      counterparty: `${roommate.firstName} ${roommate.lastName?.charAt(0) || ''}.`
    };
    setTransactions(prev => [newTransaction, ...prev]);

    // 2. Mark both nights as pending
    setPendingNights(prev => [...prev, selectedNight, swapOfferNight]);

    // 3. Create Chat Message
    const formattedRequested = new Date(selectedNight).toLocaleDateString(...);
    const formattedOffered = new Date(swapOfferNight).toLocaleDateString(...);
    const requestMessage = {
      id: `msg-${Date.now()}`,
      senderId: 'current-user',
      senderName: 'You',
      text: `Offered to swap ${formattedOffered} for ${formattedRequested}`,
      timestamp: new Date(),
      type: 'request',
      requestData: {
        type: 'swap',
        nights: [new Date(selectedNight), new Date(swapOfferNight)],
        transactionId: newTransaction.id
      }
    };
    setMessages(prev => [...prev, requestMessage]);

    // 4. Reset State
    setSelectedNight(null);
    setSwapOfferNight(null);
    setIsSwapMode(false);

    return true;
  } catch (err) {
    throw err;
  } finally {
    setIsSubmitting(false);
  }
}, [selectedNight, swapOfferNight, isSubmitting, roommate]);
```

**New Handler: `handleCancelSwapMode`**
```javascript
const handleCancelSwapMode = useCallback(() => {
  setIsSwapMode(false);
  setSwapOfferNight(null);
}, []);
```

### 3.2 UI Updates (`BuyOutPanel.jsx`)

**New Props Required:**
- `isSwapMode`
- `swapOfferNight`
- `userNights` (to display available nights to offer)
- `onSelectSwapOffer`
- `onSubmitSwapRequest`
- `onCancelSwapMode`

**Conditional Rendering:**
```jsx
{isSwapMode ? (
  <SwapModeContent
    requestedNight={selectedDate}
    userNights={userNights}
    selectedOfferNight={swapOfferNight}
    onSelectOffer={onSelectSwapOffer}
    onSubmit={onSubmitSwapRequest}
    onBack={onCancelSwapMode}
    isSubmitting={isSubmitting}
  />
) : (
  <BuyoutModeContent ... />
)}
```

**SwapModeContent Sub-Component:**
- Header: "Offer a Swap"
- "Requesting" Card: Shows roommate's night (Feb 10)
- "Offering" Section: List of user's nights with selection UI
- Message Input (optional)
- Buttons: "Send Swap Request" | "Back to Buyout" | "Cancel"

---

## 4. Visual Design Notes
- Use a **two-column** or **arrow** layout to show:
  - [Your Night (Feb 12)] ↔ [Their Night (Feb 10)]
- User's nights should be selectable via radio buttons or clickable cards.
- Highlight the selected "offer" clearly.

## 5. Acceptance Criteria
- [ ] Clicking "Offer a Swap Instead" enters Swap Mode in BuyOutPanel.
- [ ] User can select one of their own nights to offer.
- [ ] Submitting creates a pending transaction (type: 'swap').
- [ ] Both nights are marked as pending on the calendar.
- [ ] Chat thread shows the swap request message.
- [ ] "Accept" on the swap request swaps the ownership of both nights.
