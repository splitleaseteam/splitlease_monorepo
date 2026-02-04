# Layout Adjustments Spec

## Changes

### 1. Transaction History: Move Dropdown Left
- **Current**: "All Transactions" dropdown is right-aligned.
- **Change**: Move it to the **left**, next to the "Transaction History" heading.
- **File**: `TransactionHistory.jsx` or `schedule-dashboard.css`
- **CSS Fix**: Change `.transaction-history__header` from `justify-content: space-between` to `justify-content: flex-start; gap: 1rem;`.

### 2. Move "This Month" Card to Transaction Section Header
- **Current**: "This Month +$125.00" is in the right sidebar (RoommateProfileCard area).
- **Change**: Move it to the **top-right of the Transaction History section**.
- **Implementation**:
    - Remove from `RoommateProfileCard.jsx`.
    - Add to `TransactionHistory.jsx` header area.
    - Position with `position: absolute; top: 0; right: 0;` or flexbox.

### 3. Chat: Move Up & Expand Input
- **Current**: Chat has a gap between the co-tenant card and itself. Message input is small.
- **Changes**:
    - **Remove gap** between Splitting With and Chat. Set `gap: 0` or `margin-top: 0`.
    - **Expand message input**: Increase height of `.chat-thread__input` (e.g., `min-height: 80px` or `100px`).
    - **Visual continuity**: Consider removing top border-radius on Chat so it connects to Profile card above.

## Files to Modify
- `schedule-dashboard.css`
- `TransactionHistory.jsx`
- `RoommateProfileCard.jsx` (remove This Month card)
- `ChatThread.jsx` (expand input)
