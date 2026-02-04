# Feature Spec: Historical Transactions on Calendar

## Objective
Display historical financial transactions directly on past dates in the calendar. Clicking these should auto-expand the relevant transaction in the Transaction History table.

## Requirements

### 1. Logic Hook Updates (`useScheduleDashboardLogic.js`)
- **Map Transactions to Dates**:
    - Create a helper or memoized value `transactionsByDate`: `{ 'YYYY-MM-DD': transactionObj }`.
    - **Use `transaction.date`**. The user explicitly wants to see "historical transactions on the part of the calendar that's already passed".
    - Example: Transaction on **Jan 20** (for a Feb 7 night) should show `+$125` on **Jan 20**.
- **Selection Handler**:
    - `handleSelectTransaction(txnId)`: Sets a state `activeTransactionId`.

### 2. Calendar Component (`ScheduleCalendar.jsx`)
- **Visuals**:
    - For **past dates**, check if there is a mapped transaction.
    - **Display**: The amount (e.g. `+$125`) centered or in corner.
    - **Style**: "Light" opacity (e.g. `0.7`), but `font-weight: bold`.
    - **Color**: Green for incoming (`+`), Default/Red for outgoing (`-`).
- **Interaction**:
    - If a past date with a transaction is clicked, call `onSelectTransaction(txn.id)`.
    - Prevent default night selection behavior for these past dates? Or do both? (Likely prevent night selection since it's past).

### 3. Transaction History (`TransactionHistory.jsx`)
- **New Prop**: `activeTransactionId`.
- **Behavior**:
    - When `activeTransactionId` changes (and is not null), the component should:
        1.  Set its internal `expandedId` to this ID.
        2.  **Scroll** the specific row into view (using `ref` or `document.getElementById`).
    - Add `id={`txn-${txn.id}`}` to the `<tr>` for easy scrolling.

## Tasks for Agent

1.  **Modify `useScheduleDashboardLogic.js`**:
    - Implement `transactionsByDate` map.
    - Add `activeTransactionId` state and handler.
    - Export these.

2.  **Modify `TransactionHistory.jsx`**:
    - Add `useEffect` to watch `activeTransactionId`.
    - Implement scrolling logic (`scrollIntoView`).

3.  **Modify `ScheduleCalendar.jsx`**:
    - Accept `transactionsByDate` and `onSelectTransaction`.
    - Render the amounts on past days.
    - Add click handlers for past days.

4.  **CSS**:
    - Style the transaction amount on the calendar day.
    - Ensure it doesn't clutter the view too much.
