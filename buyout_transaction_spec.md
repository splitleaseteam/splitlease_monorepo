# Specification: Buyout Request Transaction Flow

## 1. Objective
Ensure that when a user submits a "Buyout Request" via the `BuyOutPanel`, a corresponding "Pending" entry is immediately added to the `TransactionHistory` table. This provides immediate feedback and a record of the outgoing request.

## 2. Current Behavior (Bug)
- **User Action**: Clicks "Buy Out" in the panel.
- **System Action**: Calls `handleBuyOut` -> `createBuyoutRequest`.
- **Result**:
    - `pendingNights` state is updated (calendar shows "Pending" status).
    - `transactions` state is **NOT** updated.
    - User sees "Request Sent" success message but valid transaction history shows nothing.

## 3. Implementation Requirements

### 3.1 Data Flow Update (`useScheduleDashboardLogic.js`)
Modify `handleBuyOut` to perform an optimistic update of the `transactions` state.

**Logic Steps:**
1.  **Calculate Total**: Ensure the total price (including fees) is available or calculated. (Currently `BuyOutPanel` calculates it via `useFeeCalculation` hook locally. We might need to pass the *final calculated price* to `handleBuyOut` or re-calculate it).
    - *Decision*: Pass the calculated `totalPrice` from `BuyOutPanel` to `handleBuyOut` to ensure consistency.
2.  **Create Transaction Object**: Construct a new transaction object abiding by the schema.
    ```javascript
    const newTransaction = {
      id: `txn-${Date.now()}`,       // Temporary ID
      date: new Date(),              // Created "Now"
      type: 'buyout',
      nights: [new Date(selectedNight)], // Target Date
      amount: totalPrice,            // Negative for outgoing? No, amount is absolute, direction determines sign.
      direction: 'outgoing',         // User is paying
      status: 'pending',
      counterparty: roommate.firstName // "Sarah"
    };
    ```
3.  **Update State**: Prepend this object to the `transactions` array.
    ```javascript
    setTransactions(prev => [newTransaction, ...prev]);
    ```

### 3.2 Component Interface (`BuyOutPanel.jsx`)
- Update `handleBuyOut` call signature to include the `totalPrice`.
- Currently: `onBuyOut(message)`
- New: `onBuyOut(message, totalPrice)`

## 4. Schema Definition
The new transaction must match the existing `MOCK_TRANSACTIONS` shape defined in `useScheduleDashboardLogic.js`:

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | string | Unique identifier |
| `date` | Date | The date the transaction was created/event occurred |
| `type` | string | 'buyout' \| 'swap' \| 'offer' |
| `nights` | Date[] | Array of Date objects representing the nights involved |
| `amount` | number | Absolute dollar amount |
| `direction` | string | 'outgoing' (User pays) \| 'incoming' (User receives) |
| `status` | string | 'pending' \| 'complete' \| 'declined' \| 'cancelled' |
| `counterparty` | string | Display name of the other user |

## 5. Verification
- **Visual**: Upon clicking "Buy Out", the Transaction History table should immediately gain a top row:
    - Date: Today's date (e.g., "Jan 31")
    - Type: "Buyout"
    - Night(s): The selected calendar date (e.g., "Feb 14")
    - Amount: Red negative amount (e.g., "-$150.00")
    - Status: Yellow "PENDING" badge
- **Persistence**: Since no backend exists, this will reset on reload, which is acceptable for the mock implementation.

## 6. Edge Cases
- **Duplicate Requests**: Logic already prevents selecting pending nights.
- **Fee Calculation**: If `totalPrice` is not passed, fallback to `basePrice` (but this is inaccurate).

## 7. Acceptance Criteria
- [ ] Clicking "Buy Out" creates a new row in Transaction History.
- [ ] The new row has "PENDING" status.
- [ ] The amount matches the calculated total from the panel.
- [ ] Console logs confirm the new transaction object structure.
