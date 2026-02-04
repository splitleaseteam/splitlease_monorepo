# Feature Spec: Flexibility Score Breakdown Modal

## Objective
Implement a feature to allow users to view their own Flexibility Score and compare it with their co-tenant's in a detailed breakdown modal.

## Requirements

### 1. UI Updates (`RoommateProfileCard.jsx`)
- **Add "My Score" Display**:
    - Below the roommate's score gauge, add a smaller row:
      `My Score: 8/10` (or similar).
- **Add Info Icon**:
    - Place a clickable ⓘ icon (`InfoIcon`) next to the scores or section header.
    - **Action**: Clicking this opens the `FlexibilityBreakdownModal`.

### 2. New Component (`FlexibilityBreakdownModal.jsx`)
Create a modal that compares the two users.

**Header**: "Flexibility Score Breakdown"

**Section 1: Score Comparison**
- Visual side-by-side bars or gauges.
- **You (8/10)** vs **Sarah (7/10)**.
- Summary text: "You are in the top 10% of flexible roommates!" (Mock).

**Section 2: The Drivers (Why?)**
- A table or list comparing key metrics:
    - **Response Time**: You (<1h) ✅ vs Sarah (2h).
    - **Approval Rate**: You (100%) ✅ vs Sarah (90%).
    - **Nights Offered**: You (5) vs Sarah (2).
    - **Last-Minute Cancels**: You (0) vs Sarah (1) ⚠️.

**Footer**: Close button.

### 3. Logic Hook Updates (`useScheduleDashboardLogic.js`)
- **New State**: `isFlexibilityModalOpen` (boolean).
- **New Data**: `userFlexibilityScore` (mock data, e.g., 8).
- **New Data**: `flexibilityMetrics` (mock object containing the breakdown factors).
- **Handlers**: `openFlexibilityModal`, `closeFlexibilityModal`.

## Data Structure (Mock)

```javascript
const flexibilityMetrics = {
  user: {
    responseTime: '< 1 hour',
    approvalRate: '98%',
    nightsOffered: 12,
    cancellations: 0
  },
  roommate: {
    responseTime: '2 hours',
    approvalRate: '92%',
    nightsOffered: 5,
    cancellations: 1
  }
};
```

## CSS (`schedule-dashboard.css`)
- **Modal Styles**: Center screen overlay, white card, shadow.
- **Comparison Styles**: Green/Red text for better/worse metrics.

## Task for Agent
1.  Create `FlexibilityBreakdownModal.jsx`.
2.  Update `useScheduleDashboardLogic.js` with state and mock data.
3.  Modify `RoommateProfileCard.jsx` to show "My Score" and the Info Icon.
4.  Connect the modal to the logic hook.
