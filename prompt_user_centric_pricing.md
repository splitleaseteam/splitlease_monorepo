# User-Centric Pricing Model Spec

## Concept
Replace abstract multipliers with a text-based, scenario-driven configuration.

**The 3 Factors:**
1. **Substitute Cost**: The base "pain" of giving up a night.
2. **Notice**: The disruption cost of last-minute changes.
3. **Edge Preference**: Which part of the week is easier to sacrifice?

## Layout & Components

### Theme
- **Light UI** (Match the rest of the Schedule Dashboard).
- **Background**: White (`#FFFFFF`) with subtle borders.
- **Accents**: Use the dashboard's primary purple (`#5b21b6` or similar) for active states.
- **Cards**: Light gray backgrounds (`#F3F4F6`) for unselected, White with purple border for selected.
- **Typography**: Clean sans-serif (Inter/system), not monospace.
- **Width**: **100% Full Width**. Ensure the container expands to fill the entire available space in the bottom panel. Remove any arbitrary `max-width` constraints.

### Layout
- **Container**: Wide horizontal panel.
- **Grid**: **3 Columns** (Substitute Cost | Notice Adjustment | Edge Preference).
- **Proportions**: Equal width or 1:1.2:1 to give Notice slider more room.
- **Spacing**: Generous padding to let the options breathe.

### Tier 1: Your Substitute Cost
*"If I give up a night, what does it cost me?"*

**UI Component:** Radio Selection Card
- [ ] **Low Cost** (Drive home/Stay with friend) - Base: **$50**
- [ ] **Medium Cost** (Hotel nearby) - Base: **$150**
- [ ] **High Cost** (Change flights/Late booking) - Base: **$300**
- [Custom Input]: Allow manual override.

### Tier 2: Notice-Based Adjustment
*"More notice = easier to adjust my plans"*

**UI Component:** Horizontal Slider with Steps
- **< 48 Hours**: 3.0x (Emergency!)
- **< 7 Days**: 2.0x (Very Disruptive)
- **7-14 Days**: 1.3x (Inconvenient)
- **14-30 Days**: 1.0x (Standard)
- **30+ Days**: 0.7x (I can plan around it)

**Visual**: A timeline slider where dragging left (less notice) increases the multiplier exponentially.

### Tier 3: Stay Edge Preference
*"Would you rather arrive later or leave earlier?"*
- **[ Arrive Later ]** (Mon/Tue cheaper)
- **[ No Preference ]** (Flat)
- **[ Leave Earlier ]** (Thu/Fri cheaper)

*(Note: Mid-week buyouts are handled by system defaults and are not configurable here to avoid suggesting them as a standard option.)*

## Logic Hook Updates (`useScheduleDashboardLogic.js`)
- **New State**: `pricingStrategy`:
    - `baseCostType`: `'low' | 'medium' | 'high' | 'custom'`
    - `baseCostValue`: number
    - `noticeSensitivity`: number (0-1 slider value mapping to curve)
    - `edgePreference`: `'start_cheaper' | 'end_cheaper' | 'neutral'`

- **Calculation**:
    `Price = BaseCost * NoticeMultiplier * EdgeMultiplier`

## Implementation Tasks
1. Update `BuyoutFormulaSettings.jsx` to this new 3-tier UI.
2. Implement new calculation logic in `useScheduleDashboardLogic.js`.
3. Update specific CSS for the "Dark Mode" aesthetic of the settings panel.
4. Ensure `ScheduleCalendar` visualizes these new prices correctly.
