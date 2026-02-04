# Feature Spec: Mode Switch (Date Changes ↔ Pricing Preferences)

## Objective
Implement a mode switcher that toggles the Schedule Dashboard between two views:
1. **Date Change Mode** (default): Calendar, Buy Out, Chat, Transaction History.
2. **Pricing Preferences Mode**: Formula sliders, visualization, settings.

## Requirements

### 1. Mode Switcher UI
- **Location**: Under the co-tenant profile card.
- **Appearance**: Two-option toggle or pill buttons:
    ```
    [ Date Changes ] [ Pricing Settings ]
    ```
- **Default**: "Date Changes" is active.

### 2. Mode State
- **Logic Hook**: Add `dashboardMode` state (`'date_changes' | 'pricing_settings'`).
- **Handler**: `handleSwitchMode(mode)`.

### 3. Conditional Rendering in `index.jsx`

**When `dashboardMode === 'date_changes'` (Default):**
- Show: Calendar, Buy Out Panel, Transaction History (left column).
- Show: Chat (right column under profile).

**When `dashboardMode === 'pricing_settings'`:**
- **Left Column**: Replace Calendar/Buy Out/History with **Pricing Visualization**.
    - Full-width bar chart or calendar heatmap showing suggested prices.
- **Right Column**: Replace Chat with **Pricing Controls**.
    - Sliders: Weekend Premium, Holiday Premium, Last-Minute Discount.
    - Inputs: Floor Price, Ceiling Price.
    - Toggle: Demand Factor On/Off.
    - Save/Reset buttons.

### 4. Component Updates

#### `index.jsx`
```jsx
{dashboardMode === 'date_changes' ? (
  <>
    <ScheduleCalendar ... />
    <BuyOutPanel ... />
    <TransactionHistory ... />
  </>
) : (
  <>
    <BuyoutPriceVisualization prices={computedSuggestedPrices} />
  </>
)}
```

#### `BuyoutFormulaSettings.jsx`
- Contains all the sliders and inputs.
- Takes `preferences` and `onUpdate` from logic hook.

#### `BuyoutPriceVisualization.jsx`
- Receives `prices[]` array.
- Renders bar chart or calendar grid with color-coded prices.

### 5. Visual Continuity
- **Profile Card**: Always visible in both modes.
- **Mode Toggle**: Always visible under profile.
- **Active Tab Styling**: Highlighted background, bold text.

## Tasks for Agent
1. Add `dashboardMode` state and handler to `useScheduleDashboardLogic.js`.
2. Create mode toggle UI component.
3. Update `index.jsx` with conditional rendering.
4. Create `BuyoutFormulaSettings.jsx` (sliders/inputs).
5. Create `BuyoutPriceVisualization.jsx` (chart/grid).
6. Add CSS for toggle and new components.
