# Agent 1: Schedule Calendar + Buy Out Panel Implementation

## Context
The scaffolding for `/guest-leases/:leaseId/schedule` (called "ScheduleDashboard") is complete. This prompt focuses on implementing Sections 1 and 3.

**Existing Files (already scaffolded):**
- `app/src/islands/pages/ScheduleDashboard/index.jsx`
- `app/src/islands/pages/ScheduleDashboard/useScheduleDashboardLogic.js`
- `app/src/islands/pages/ScheduleDashboard/components/ScheduleCalendar.jsx`
- `app/src/islands/pages/ScheduleDashboard/components/BuyOutPanel.jsx`

---

## Section 1: ScheduleCalendar.jsx

### Requirements

1. **Monthly Calendar View**
   - Show 4-5 weeks per month
   - Navigation arrows for previous/next month
   - Current month/year header

2. **Color Coding for Nights**
   - 🟢 **Green Background**: User's booked nights
   - ⬜ **White/Light Gray**: Roommate's nights (available to buy out)
   - 🔵 **Blue Dashed Border**: Adjacent nights (recommended to buy)
   - 🟡 **Yellow**: Pending request
   - ❌ **Strikethrough**: Blocked/unavailable

3. **Click Behavior**
   - Clicking a roommate's night → calls `onNightSelect(date)` 
   - Clicking user's own night → optional feedback ("This is your night")
   - Clicking blocked night → no action

4. **Adjacent Night Detection**
   - A night is "adjacent" if it's immediately before or after the user's consecutive stay block
   - Example: User has Mon-Fri → Sunday and Saturday are adjacent

### Props Interface
```jsx
ScheduleCalendar.propTypes = {
  userNights: PropTypes.arrayOf(PropTypes.string), // ['2026-02-14', '2026-02-15']
  roommateNights: PropTypes.arrayOf(PropTypes.string),
  pendingNights: PropTypes.arrayOf(PropTypes.string),
  blockedNights: PropTypes.arrayOf(PropTypes.string),
  selectedNight: PropTypes.string, // Currently selected for buy out
  onNightSelect: PropTypes.func,
  onMonthChange: PropTypes.func,
};
```

---

## Section 3: BuyOutPanel.jsx

### Requirements

1. **Selected Night Display**
   - Show the date in readable format ("Friday, February 14, 2026")
   - Show current owner: "Currently held by [Roommate Name]"
   - If no night selected: "Select a night from the calendar"

2. **Price Breakdown**
   - Use existing fee calculation: `useFeeCalculation` hook
   - Display:
     ```
     Base Price:     $XXX.XX
     Platform Fee:   $X.XX (1.5%)
     ─────────────────────
     Total:          $XXX.XX
     ```

3. **Action Buttons**
   - **[Buy Out Night]** - Primary green button
   - **[Offer Swap Instead]** - Secondary text link
   - **[Cancel]** - Tertiary/ghost button

4. **Optional Message**
   - Text input: "Add a note to your request (optional)"
   - Max 200 characters

5. **Loading/Pending State**
   - Show spinner when submitting
   - After submit: "Request sent! Waiting for [Roommate]'s response"

### Props Interface
```jsx
BuyOutPanel.propTypes = {
  selectedDate: PropTypes.string,
  roommateName: PropTypes.string,
  basePrice: PropTypes.number,
  onBuyOut: PropTypes.func,
  onSwapInstead: PropTypes.func,
  onCancel: PropTypes.func,
  isSubmitting: PropTypes.bool,
};
```

---

## Data Connections (in useScheduleDashboardLogic.js)

Add these data fetches:
```javascript
// Fetch user's nights for this lease
const fetchUserNights = async (leaseId, userId) => {
  // Query calendar_stays where user_id = userId AND lease_id = leaseId
};

// Fetch roommate's nights
const fetchRoommateNights = async (leaseId, roommateId) => {
  // Query calendar_stays where user_id = roommateId AND lease_id = leaseId
};

// Fetch pending date change requests
const fetchPendingRequests = async (leaseId) => {
  // Query date_change_requests where lease_id = leaseId AND status = 'pending'
};
```

---

## DO NOT MODIFY
- `ChatThread.jsx` (Agent 2)
- `TransactionHistory.jsx` (Agent 2)
- `RoommateProfileCard.jsx` (can use placeholder data)
