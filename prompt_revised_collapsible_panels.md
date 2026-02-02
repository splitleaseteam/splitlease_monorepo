# Revise Collapsible Panels: Independent Drawer Style

## Context
The previous "single collapse bar" design is rejected. The user wants **independent control** for the Buy Out and Chat panels, designed as "drawers" attached to the bottom of the section above them.

## Requirements

### 1. Independent States
Separate the collapse state for the two functionality areas:
- **Left Column:** Calendar + Buy Out Panel
    - `isBuyOutOpen` (boolean)
- **Right Column:** Roommate Profile + Chat
    - `isChatOpen` (boolean)

### 2. Layout & Positioning ("Attached Drawers")
The middle panels (Buy Out / Chat) should positioned **directly underneath** their top counterparts (Calendar / Profile).

**Visual Metaphor:**
A "drawer" or "summary bar" attached to the bottom of the top card.

#### State: Collapsed
- The Buy Out/Chat panel is hidden.
- visible instead is a **Summary Bar** attached to the bottom of the top card (Calendar/Profile).
- **Appearance:** Looks like a footer to the top card.
- **Content:** Summary text (e.g., "Select a night to buy out", "Chat (2 unread)").
- **Action:** Clicking it EXPANDS the panel.

#### State: Expanded
- The panel opens up fully below the top card.
- The Summary Bar transforms into a "Header/Collapse handle" for the panel, OR remains as a footer of the top card that toggles the bottom one.
- **Action:** Clicking the header/handle COLLAPSES the panel.

### 3. Implementation Details

#### Logic Hook (`useScheduleDashboardLogic.js`)
Update to handle independent states:
```javascript
const [isBuyOutOpen, setIsBuyOutOpen] = useState(false);
const [isChatOpen, setIsChatOpen] = useState(false);

// Auto-open logic
// If user selects a date -> setIsBuyOutOpen(true)
// If new message arrives -> setIsChatOpen(true)
```

#### Stylings (`schedule-dashboard.css`)
- Remove the old `schedule-dashboard__middle-row` collapse styles.
- Create new "Drawer" classes.
- **Visual Trick:**
    - **Calendar/Profile Card:** `border-bottom-left-radius: 0; border-bottom-right-radius: 0;` (when drawer is attached).
    - **Summary Bar:** `border-top-left-radius: 0; border-top-right-radius: 0;` (creates the "attached" look).

### 4. Summary Text Logic
- **Buy Out Bar:**
    - Default: "Create a Buyout Request ▼"
    - If night selected: "Buying Out Feb 14 ▼"
- **Chat Bar:**
    - Default: "Chat with Roommate ▼"
    - Unread: "Chat (2 New Messages) ▼"

## Tasks for Agent
1.  Undo the previous "single collapse bar" work if present.
2.  Implement `isBuyOutOpen` and `isChatOpen` in the logic hook.
3.  Modify `index.jsx` to move Buy Out and Chat specific locations:
    - Put `BuyOutPanel` directly after `ScheduleCalendar`.
    - Put `ChatThread` directly after `RoommateProfileCard`.
4.  Wrap them in a new container that handles the "Attached Drawer" styling.
5.  Implement the styling changes in CSS.
