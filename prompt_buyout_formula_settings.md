# Feature Spec: Buyout Formula Settings & Visualization

## Objective
Allow users to customize the buyout pricing formula that generates suggested prices for their co-tenant. Include a real-time visualization showing how the formula affects suggested buyout prices across example dates.

## Context
Currently, the buyout calculation uses a fixed formula (e.g., base nightly rate + demand multiplier + service fee). This feature lets the user adjust weights or toggle factors to personalize the suggestions shown to their roommate.

## Requirements

### 0. Entry Point (Trigger)
The settings should NOT be top-level. Location options:

**Option A: Collapsible Drawer Under Co-tenant (Right Column)**
- Add a collapsible section **under the "Splitting With" profile card**.
- Header: "⚙️ Customize Pricing Preferences" (collapsed by default).
- Clicking expands to show sliders and visualization.
- Keeps pricing settings near the person it affects.

**Chosen Approach: Option A**
- Right column layout: Profile → Chat → Pricing Preferences (collapsed).

### 1. New Section: "Your Buyout Pricing Preferences"
- **Location**: Could be a collapsible section on the Schedule Dashboard (under Transaction History) or a settings modal accessible via a gear icon.
- **Header**: "Pricing Preferences" with a ⚙️ icon.

### 2. Formula Controls (Sliders/Toggles)
Allow adjustment of the following factors:

| Factor | Control Type | Default | Range |
|--------|--------------|---------|-------|
| Base Nightly Rate | Display Only | $X (from lease) | — |
| Weekend Premium | Slider | 1.2x | 1.0x – 2.0x |
| Holiday Premium | Slider | 1.5x | 1.0x – 3.0x |
| Last-Minute Discount | Slider (inverse) | 0.8x | 0.5x – 1.0x |
| Demand Factor | Toggle | On | On/Off |
| Your Floor Price | Input | $50 | $0 – $500 |
| Your Ceiling Price | Input | $300 | $50 – $1000 |

### 3. Real-Time Visualization
Display a mini-calendar or bar chart showing:
- **X-Axis**: Next 14 days (or current month).
- **Y-Axis**: Suggested Price.
- **Bars/Cells**: Show the computed suggested price for each day based on current slider values.
- **Color Coding**:
    - Green: Within your preferred range.
    - Yellow: Near floor/ceiling.
    - Red: Outside your acceptable range.

**Live Update**: As the user adjusts sliders, the chart updates instantly.

### 4. Save & Defaults
- **Save Button**: Persists preferences (API call or localStorage for MVP).
- **Reset to Defaults**: Restores factory settings.

## Component Structure

### `BuyoutFormulaSettings.jsx`
- Contains sliders, toggles, and inputs.
- Calls a local calculation function to compute preview prices.
- Passes computed prices to `BuyoutPriceVisualization`.

### `BuyoutPriceVisualization.jsx`
- Receives an array of `{ date, suggestedPrice }`.
- Renders a bar chart or mini-calendar grid.
- Highlights floor/ceiling violations.

## Logic Hook Updates (`useScheduleDashboardLogic.js`)
- **State**: `buyoutPreferences` object.
- **Handler**: `updateBuyoutPreference(key, value)`.
- **Computed**: `computedSuggestedPrices[]` based on preferences.

## Tasks for Agent

1.  **Create `BuyoutFormulaSettings.jsx`** with sliders and inputs.
2.  **Create `BuyoutPriceVisualization.jsx`** with bar chart or mini-calendar.
3.  **Update Logic Hook** with preferences state and computation.
4.  **Add CSS** for the new section and visualization.
5.  **Wire into `index.jsx`** (likely in the left column, after Transaction History, or as a modal).
