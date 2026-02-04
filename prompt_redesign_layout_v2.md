# Major Layout Redesign: 2-Month View & Sidebar

## Objective
Redesign the Schedule Dashboard layout to prioritize a wider 2-month calendar comparison and optimized sidebar for communication.

## New Layout Structure

Switch from a 1:1 Grid to a **2:1 Asymmetric Grid**.

```
┌───────────────────────────────────────┬───────────────────┐
│                                       │                   │
│  [ Calendar Month 1 ] [ Month 2 ]     │  [ Splitting With ]
│       (Wide 2-Month View)             │      (Thinner)    │
│                                       │                   │
├───────────────────────────────────────┤                   │
│ ▼ Buy Out Drawer (Attached)           │                   │
│   [Compact Horizontal Layout]         │  [ Chat Thread ]  │
│                                       │                   │
├───────────────────────────────────────┤     (Very Tall)   │
│ Section 5: Transaction History        │                   │
│ (Moved to Left Column)                │                   │
└───────────────────────────────────────┴───────────────────┘
```

### 1. Grid Configuration (`schedule-dashboard.css`)
- **Main Grid**: Change `grid-template-columns` from `1fr 1fr` to `2.5fr 1fr` (or `minmax(700px, 2fr) 1fr`).
- **Left Column**: Stack of [Calendar, Buy Out, Transaction History].
- **Right Column**: Stack of [Splitting With, Chat].

### 2. Component Updates

#### A. ScheduleCalendar (`ScheduleCalendar.jsx`)
- **Requirement**: Display **2 consecutive months** side-by-side.
- **Logic**:
    - Keep `currentMonth` state.
    - Render Month 1: `currentMonth`.
    - Render Month 2: `addMonths(currentMonth, 1)`.
    - **Header**: Navigation buttons should likely jump by 1 month.
    - **Selection**: Use `month1Props` and `month2Props` or map over `[0, 1]` to render two grids.
- **Styling**:
    - Container should be `display: flex; gap: 2rem;`.
    - Each month grid takes 50%.

#### B. Splitting With (`RoommateProfileCard.jsx`)
- **Requirement**: "Thinner panel".
- **Styling**: Ensure content wraps gracefully in a narrower column.

#### C. Chat Thread (`ChatThread.jsx`)
- **Requirement**: "Even taller".
- **Styling**: Set `min-height: 800px` (or fill remaining vertical height).
- **Position**: Right column, under Splitting With.

#### D. Buy Out Panel
- **Requirement**: "Shorter height, use width better".
- **Layout Change**: Switch from vertical stack to **Horizontal Layout**.
    - **Previous**: [Date] -> [Breakdown] -> [Button] -> [Button]
    - **New**:
        ```
        [ Selected Date & Info  ]  [ Price Breakdown ]
        [ Message Input (Wide)  ]  [ Button 1 ] [ Button 2 ]
        ```
    - Arrange action buttons in a horizontal row to save vertical space.

#### E. Transaction History
- **Position**: Moved to **Left Column**, underneath the Buy Out drawer.

## Tasks for Agent

1.  **Update CSS Grid**: Modify `.schedule-dashboard__grid` to support the asymmetric layout.
2.  **Refactor ScheduleCalendar**: Logic for 2-month view.
3.  **Adjust Sidebar Components**:
    - Make Chat very tall (`min-height: 800px`).
4.  **Refactor BuyOutPanel CSS**:
    - Implement compact/horizontal layout for buttons and content.
5.  **Reorder `index.jsx`**:
    - Move TransactionHistory into the Left Column wrapper.

## Note on "Splitting With" Terminology
Ensure the previous terminology change ("Splitting with") is preserved.
