# Revised Pricing Mode Spec: Calendar Overlay + Wide Controls

## Key Clarification
The price bars show on **YOUR nights** (the current user's nights), because these are the suggested prices your **roommate would pay to buy you out**.

## Layout in Pricing Mode

### Top Section: 2-Month Calendar with Price Overlays
- Reuse the existing `ScheduleCalendar` component.
- **On YOUR nights only**: Display a small price bar/indicator inside each cell.
    - Show the calculated price (e.g., "$175", "$210").
    - Bar height or color indicates price tier (green = within range, orange = near limit, red = at ceiling).
- **Roommate's nights**: Show normally (no price bars).
- **Empty/blocked days**: No price bars.

### Bottom Section: Wide Pricing Controls (Replaces Transaction History)
- Full-width horizontal layout of the pricing sliders/inputs.
- **Grid Layout**: 3-4 columns on desktop.
    - Column 1: Base Nightly Rate (display), Weekend Premium slider.
    - Column 2: Holiday Premium slider, Last-Minute Discount slider.
    - Column 3: Floor Price input, Ceiling Price input.
    - Column 4: Dynamic Demand toggle, Save/Reset buttons.

## Component Updates

### `ScheduleCalendar.jsx`
Add prop: `priceOverlays` (object map: `{ 'YYYY-MM-DD': { price: 175, tier: 'within' } }`).

When rendering a day that belongs to `userNights` AND has a price overlay:
```jsx
<div className="schedule-calendar__day schedule-calendar__day--user">
  <span className="schedule-calendar__date">15</span>
  <div className="schedule-calendar__price-bar" data-tier={overlay.tier}>
    ${overlay.price}
  </div>
</div>
```

### `BuyoutFormulaSettings.jsx`
- Add `layout="wide"` prop for horizontal mode.
- CSS Grid: `grid-template-columns: repeat(4, 1fr)`.

### `index.jsx`
When `dashboardMode === 'pricing_settings'`:
- Left Column: `<ScheduleCalendar priceOverlays={computedPriceOverlays} />`
- Below Calendar (full width): `<BuyoutFormulaSettings layout="wide" />`
- Hide: Transaction History, Buy Out Panel.

## CSS Classes

```css
.schedule-calendar__price-bar {
  position: absolute;
  bottom: 2px;
  left: 2px;
  right: 2px;
  height: 18px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  text-align: center;
}

.schedule-calendar__price-bar[data-tier="within"] {
  background: #D1FAE5;
  color: #059669;
}

.schedule-calendar__price-bar[data-tier="near"] {
  background: #FEF3C7;
  color: #D97706;
}

.schedule-calendar__price-bar[data-tier="limit"] {
  background: #FEE2E2;
  color: #DC2626;
}

/* Wide layout for pricing controls */
.buyout-settings--wide {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  padding: 1.5rem;
}
```

## Tasks for Agent
1. Add `priceOverlays` prop to `ScheduleCalendar`.
2. Render price bars inside calendar cells for user's nights.
3. Update `BuyoutFormulaSettings` to support `layout="wide"`.
4. Update `index.jsx` conditional rendering for pricing mode.
5. Add CSS for price bars and wide layout.
