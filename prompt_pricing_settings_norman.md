# Don Norman-Inspired Pricing Settings Redesign

## Design Principles Applied

### 1. Visibility of System Status
**Problem:** User adjusts sliders but doesn't see the impact until looking at calendar.
**Solution:** Show **live computed examples** next to each control.

### 2. Match Between System and Real World
**Problem:** "1.2x" is abstract. Users think in dollars, not multipliers.
**Solution:** Show the **actual dollar result** (e.g., "$175 → $210 on weekends").

### 3. Mapping
**Problem:** Controls are disconnected from the calendar above.
**Solution:** **Highlight affected dates** when hovering/focusing a control.

### 4. Feedback
**Problem:** No confirmation that settings are "good" or within normal ranges.
**Solution:** Add **semantic labels** and **range indicators** (e.g., "Moderate", "Aggressive").

---

## Revised Layout (Wide, 4-Column)

### Column 1: Base & Weekend
```
┌─────────────────────────────┐
│ BASE NIGHTLY RATE           │
│ $175.00                     │
│ From your lease agreement   │
├─────────────────────────────┤
│ WEEKEND PREMIUM       1.2x  │
│ ○━━━━━━●━━━━━━━━━━━━━━━━━○  │
│ 1.0x              Moderate  │
│                             │
│ 💡 Fri/Sat nights: $210     │
└─────────────────────────────┘
```

### Column 2: Holiday & Last-Minute
```
┌─────────────────────────────┐
│ HOLIDAY PREMIUM       1.5x  │
│ ○━━━━━━━━━●━━━━━━━━━━━━━━○  │
│ 1.0x               Standard │
│                             │
│ 💡 Holidays: $262           │
├─────────────────────────────┤
│ LAST-MINUTE DISCOUNT  80%   │
│ ○━━━━━━━━━━━━━●━━━━━━━━━━○  │
│ 50%               Generous  │
│                             │
│ 💡 Within 3 days: $140      │
└─────────────────────────────┘
```

### Column 3: Price Range Visualization
```
┌─────────────────────────────┐
│ YOUR PRICE RANGE            │
│                             │
│ $50 ─────────────────── $300│
│ Floor     ▼ Your Prices ▼   │
│           ░░░█████████░░░   │
│                             │
│ Current Range: $140 - $262  │
│ ✓ All prices within limits  │
└─────────────────────────────┘
```

### Column 4: Demand & Actions
```
┌─────────────────────────────┐
│ DYNAMIC DEMAND        [ON]  │
│ Adjusts prices based on     │
│ local demand patterns       │
│                             │
│ 💡 High demand adds +10%    │
├─────────────────────────────┤
│ QUICK SUMMARY               │
│ • Weeknight: $175           │
│ • Weekend: $210             │
│ • Holiday Weekend: $315     │
│ • Last-Minute: $140         │
├─────────────────────────────┤
│ [Reset]          [Save]     │
└─────────────────────────────┘
```

---

## New UI Elements

### 1. Computed Example (💡 Hints)
Below each slider, show the **calculated price**.
```jsx
<div className="buyout-settings__computed">
  💡 Fri/Sat nights: ${baseRate * weekendPremium}
</div>
```

### 2. Semantic Labels
Instead of just "1.2x", add context:
- 1.0x = "No Premium"
- 1.1x-1.3x = "Moderate"
- 1.4x-1.6x = "Standard"
- 1.7x+ = "Aggressive"

### 3. Range Visualization Bar
Show where current computed prices fall relative to floor/ceiling:
```css
.price-range-bar {
  background: linear-gradient(to right, 
    #fee2e2 0%, /* floor danger zone */
    #d1fae5 20%, /* safe zone */
    #d1fae5 80%, 
    #fee2e2 100% /* ceiling danger zone */
  );
}
```

### 4. Quick Summary Box
A glanceable summary of key price points.

---

## Implementation Tasks

1. Add `computedExamples` object to logic hook (weeknight, weekend, holiday, lastMinute prices).
2. Add semantic label helper function (`getSemanticLabel(value, type)`).
3. Create `PriceRangeVisualization` component showing floor/ceiling with current range.
4. Add `QuickSummary` component.
5. Update `BuyoutFormulaSettings` with new subcomponents.
6. Add CSS for hints, range bar, and summary box.
