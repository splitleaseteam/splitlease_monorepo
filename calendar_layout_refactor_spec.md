# Specification: Compact Calendar Layout (Header Legend)

## 1. Objective
Optimize the `ScheduleCalendar` layout by removing the redundant "Month - Month" header text (since individual months have their own headers) and moving the **Legend** into that space. This saves vertical screen real estate.

## 2. Layout Changes

### 2.1 Header Restructuring
**Current**:
`[ < Prev ] [ Centered Month Range Title ] [ Next > ]`

**New**:
`[ < Prev ] [ Horizontal Legend ] [ Next > ]`

### 2.2 Component Updates (`ScheduleCalendar.jsx`)
1.  **Remove Title**: Delete the `<h2>` element displaying `{month1} - {month2}`.
2.  **Relocate Legend**: Move the `.schedule-calendar__legend` div (and its children) from the bottom of the component to the center of the `.schedule-calendar__header`.
3.  **Styles**:
    - Ensure `.schedule-calendar__header` maintains `display: flex; justify-content: space-between; align-items: center;`.
    - Update `.schedule-calendar__legend`:
        - Remove top margins/padding that might have separated it from the grid.
        - Ensure `display: flex; gap: 1.5rem;` for horizontal spacing.
        - Ensure font size is compact (e.g., `0.85rem`).

### 2.3 CSS Adjustments (`schedule-dashboard.css`)
- **Container**: `.schedule-calendar__header` needs robust styling to handle the flexible center content.
- **Legend Items**:
    - Compact styles: Small colored box + Text.
    - Reduce `gap` between color box and text.
- **Responsiveness**:
    - On very small screens (< 400px), the legend might crowd the header.
    - *Fallback*: If buttons + legend don't fit, maybe hide text labels or just stack?
    - *Decision*: For this iteration, assume standard flexible row works. If crowded, `flex-wrap: wrap` in center or hide "Recommended" (least critical) if needed.

## 3. Acceptance Criteria
- [ ] Top centered "Month - Month" text is removed.
- [ ] Legend (My Nights, Available, Recommended, Pending) appears between the navigation arrows.
- [ ] Footer space previously occupied by legend is reclaimed.
- [ ] Navigation arrows remain functional and accessible.
