# Specification: Share Request Feature

## 1. Objective
Implement a "Share Request" transaction type that allows a user to request to **share** a night with their roommate (both occupying the space simultaneously), as an alternative to buying out the entire night. This is intended for non-contiguous nights where a full buyout may not be necessary.

## 2. Business Logic

### 2.1 When to Use Share vs. Buyout
**Adjacency Detection:**
- **Buyout Request**: Default when the selected night is **contiguous** (adjacent) to one of the user's existing night blocks.
    - *Example*: User has Feb 10-14. Selecting Feb 9 or Feb 15 → Buyout.
- **Share Request**: Default when the selected night is **NOT contiguous** to any of the user's blocks.
    - *Example*: User has Feb 10-14. Selecting Feb 21 → Share.

**Rationale**: If you're extending a stay, you likely want exclusive use (buyout). If it's a random isolated night, you may just need access and can share.

### 2.2 Pricing Model
- **Base Price Range**: 50% to 500% of the nightly rate.
- **Default for MVP**: Use **100% of base price** (same as buyout for now).
- **Future**: Add a "Share Multiplier" setting in Pricing Controls (e.g., slider from 0.5x to 5x).

### 2.3 Transaction Schema
```javascript
{
  id: 'txn-xxx',
  date: new Date(), // Request creation date
  type: 'share',    // NEW TYPE
  nights: [new Date(2026, 2, 21)],
  amount: 175,      // Calculated share price
  direction: 'outgoing', // User is paying
  status: 'pending',
  counterparty: 'Sarah C.'
}
```

## 3. Implementation Requirements

### 3.1 Adjacency Detection Logic (`useScheduleDashboardLogic.js`)

**New Helper Function:**
```javascript
/**
 * Check if a night is adjacent to any of the user's blocks
 */
const isNightContiguous = useCallback((nightString) => {
  if (!userNights || userNights.length === 0) return false;
  
  const targetDate = new Date(nightString);
  const dayBefore = toDateString(new Date(targetDate.getTime() - 86400000));
  const dayAfter = toDateString(new Date(targetDate.getTime() + 86400000));
  
  return userNights.includes(dayBefore) || userNights.includes(dayAfter);
}, [userNights]);
```

**Usage in `handleSelectNight`:**
```javascript
const handleSelectNight = useCallback((nightString) => {
  // Validate selection...
  setSelectedNight(nightString);
  
  // Determine default request type
  const isContiguous = isNightContiguous(nightString);
  setDefaultRequestType(isContiguous ? 'buyout' : 'share');
  
  // Open panel
  setIsBuyOutOpen(true);
}, [/* deps */]);
```

### 3.2 State Updates

**New State:**
```javascript
const [requestType, setRequestType] = useState('buyout'); // 'buyout' | 'share' | 'swap'
const [defaultRequestType, setDefaultRequestType] = useState('buyout');
```

**Effect to Sync:**
```javascript
useEffect(() => {
  setRequestType(defaultRequestType);
}, [defaultRequestType]);
```

### 3.3 UI Changes (`BuyOutPanel.jsx`)

**Panel Mode Toggle:**
- Rename component to `RequestPanel.jsx` (or keep as `BuyOutPanel` but support multiple modes).
- Add visual toggle at top:
    ```
    [ Buyout ] [ Share ] [ Swap ]
    ```
- Highlight the active `requestType`.

**Content Variations:**
- **Buyout Mode**:
    - Header: "Buy Out Night"
    - Description: "Request exclusive use of this night"
- **Share Mode**:
    - Header: "Share Night"
    - Description: "Request to share the space with Sarah on this night"
    - Icon: 👥 (people icon)
    - Price breakdown shows "Share fee" instead of "Buyout price"

**Price Calculation:**
```javascript
const { feeBreakdown } = useFeeCalculation(
  basePrice,
  requestType, // 'buyout' | 'share'
  { autoCalculate: true }
);
```

### 3.4 Handler Updates

**`handleShareRequest` (New):**
```javascript
const handleShareRequest = useCallback(async (message, totalPrice) => {
  if (!selectedNight || isSubmitting) return;
  
  try {
    setIsSubmitting(true);
    
    // Same flow as buyout, but type = 'share'
    const newTransaction = {
      id: `txn-${Date.now()}`,
      date: new Date(),
      type: 'share', // Different type
      nights: [new Date(selectedNight)],
      amount: totalPrice,
      direction: 'outgoing',
      status: 'pending',
      counterparty: /* ... */
    };
    
    setTransactions(prev => [newTransaction, ...prev]);
    setPendingNights(prev => [...prev, selectedNight]);
    
    // Chat message
    const requestMessage = {
      /* ... */
      text: `Requested to share ${formattedNight} for $${totalPrice.toFixed(2)}`,
      requestData: {
        type: 'share',
        /* ... */
      }
    };
    setMessages(prev => [...prev, requestMessage]);
    
    return true;
  } finally {
    setIsSubmitting(false);
  }
}, [/* deps */]);
```

### 3.5 Accept/Decline Logic Updates

**`handleAcceptRequest`:**
- No ownership change needed for 'share' type.
- Remove from `pendingNights`.
- Update status to 'complete'.
- **No calendar transfer** (both users keep their nights).

```javascript
if (transaction.type === 'share') {
  // No ownership changes, just mark complete
  // Both parties now have "shared access" to this night
}
```

### 3.6 Calendar Visual Indicator

**New Day Status:**
- `shared`: Night is shared between both users (co-occupancy).
- Style: Half-green, half-white diagonal split? Or special icon overlay?

## 4. Edge Cases

### 4.1 Accept Share Request
- When accepted, the night remains in `roommateNights` (original owner) but is also marked as accessible to the requestor.
- **New State Needed**: `sharedNights` array?
    ```javascript
    const [sharedNights, setSharedNights] = useState([]);
    ```
- On Accept:
    ```javascript
    setSharedNights(prev => [...prev, nightString]);
    ```

### 4.2 Pricing Control (Future)
- Add "Share Multiplier" setting (0.5x - 5.0x).
- Default: 1.0x.

### 4.3 Multiple Shares on Same Night
- Can both users share? Or only one direction?
- *Decision*: For now, one pending share request per night.

## 5. UI Mockup Requirements

**BuyOutPanel Header:**
```
┌─────────────────────────────────────┐
│ [ Buyout ] [ Share ] [ Swap ]       │  ← Toggle tabs
│                                     │
│ Share Night                         │
│ Request to share the space with     │
│ Sarah on this night 👥              │
│                                     │
│ Saturday, March 21, 2026            │
│ Currently held by Sarah             │
│                                     │
│ Base price          $175.00         │
│ Platform fee        $5.00           │
│ ─────────────────────────────       │
│ Total               $180.00         │
│                                     │
│ [Send Share Request]                │
└─────────────────────────────────────┘
```

## 6. Acceptance Criteria
- [ ] Selecting a non-contiguous night defaults to Share Request.
- [ ] Selecting a contiguous night defaults to Buyout Request.
- [ ] User can toggle between Buyout/Share/Swap modes.
- [ ] Share Request creates a `type: 'share'` transaction.
- [ ] Accepting a Share Request does NOT transfer ownership.
- [ ] Calendar indicates shared nights visually.
