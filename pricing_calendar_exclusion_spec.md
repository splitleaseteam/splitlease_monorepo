# Specification: Exclude Transacted Dates from Pricing Calendar

## 1. Objective
Ensure that dates involved in completed transactions (Buyouts or Swaps) do not appear as editable "My Nights" in the **Pricing Section** calendar.
*Rationale*: If a user has explicitly bought or swapped for a night, they intended to keep it and likely do not want to set flexible pricing logic (Auto-Offer) on it immediately.

## 2. Logic & Rules

### 2.1 Definition of "Excluded Dates"
A date should be excluded from the Pricing View if:
1.  **Transaction is Complete**: The date is part of a transaction with `status: 'complete'`.
2.  **User Owns It**: The date is currently in the `userNights` array (i.e., it's a night the user *acquired* or *retained* via transaction).
    *   *Note*: Nights the user *lost* (sold/swapped away) are already removed from `userNights` and thus usually hidden, but this check ensures double safety.

### 2.2 Functional Changes

#### A. Data Preparation (`useScheduleDashboardLogic.js`)
- Create a new derived state or memoized array: `excludedPricingDates`.
- **Logic**:
  ```javascript
  const excludedPricingDates = useMemo(() => {
    const dates = new Set();
    transactions.forEach(txn => {
      if (txn.status === 'complete') {
        txn.nights.forEach(date => dates.add(toDateString(date)));
      }
    });
    return Array.from(dates);
  }, [transactions]);
  ```
- Pass `excludedPricingDates` to the `ScheduleCalendar` component.

#### B. Component Rendering (`ScheduleCalendar.jsx`)
- In `renderMonthPanel` (or `renderDay`):
- Check if `dashboardMode === 'pricing_settings'`.
- If `true`:
    - Before applying the `.schedule-calendar__day--mine` class (which triggers the green background and price pill), check exclusion.
    - **Condition**: `isUserNight && !excludedPricingDates.includes(dayString)`
    - **Result**:
        - If excluded, treat as a "Neutral" day (similar to roommate's day or empty day).
        - Do **not** render the Price Pill.
        - Do **not** apply green background/border.
        - Effectively "Invisible" in the Pricing Mode (since non-mine days are hidden via CSS).

## 3. Edge Cases

### 3.1 Pending Transactions
- **Requirement**: Pending transactions (e.g., I requested to buy a night) are NOT yet mine.
- **Current Behavior**: They align with `roommateNights` (or `pendingNights`).
- **Effect**: They naturally don't show in Pricing (since they aren't "Mine" yet).
- **No Change Needed**.

### 3.2 Cancelled/Declined Transactions
- **Requirement**: If a transaction failed, the original ownership stands.
- **Effect**: If I originally owned it and tried to sell (but failed), I still own it.
- **Logic**: Since `status` is NOT `complete`, the date is **NOT** added to `excludedPricingDates`.
- **Result**: It REMAINS visible in Pricing. (Correct).

### 3.3 Multiple Transactions on Same Date
- *Scenario*: User owned Feb 10 -> Sold to Sarah (Txn 1 Complete) -> Bought back from Sarah (Txn 2 Complete).
- *Result*: Txn 1 and Txn 2 are complete. Feb 10 is in `excludedPricingDates`.
- *Outcome*: Feb 10 is Hidden from pricing. (Correct, user just bought it back).

## 4. Verification
- **Test Scenarios**:
    1.  **Baseline**: Verify Feb 10 shows in Pricing (if user owns it).
    2.  **Action**: Complete a Buyout for Feb 10 (User buys from Roommate).
    3.  **Result**: Feb 10 becomes "Mine" in standard calendar.
    4.  **Check**: Feb 10 does **NOT** appear in Pricing Calendar (no green box, no price).
    5.  **Action**: Complete a Swap (User gains Feb 12).
    6.  **Check**: Feb 12 does **NOT** appear in Pricing Calendar.

## 5. Acceptance Criteria
- [ ] `excludedPricingDates` correctly aggregates nights from complete transactions.
- [ ] Pricing Calendar filters out these dates.
- [ ] Standard Calendar (Date Change Mode) still shows them as "Mine" (green).
