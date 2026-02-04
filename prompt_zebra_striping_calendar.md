# Spec: Zebra Striping for Calendar Readability

## 1. Objective
Replace the current border-heavy grid layout with a "Zebra Striped" row layout for the `ScheduleCalendar` component. This improves horizontal readability and reduces visual clutter by using alternating background colors for weeks instead of grid lines.

## 2. Design Requirements
- **Layout**: Week-based rows instead of a flat day grid.
- **Visual Style**:
    - **Stripes**: Alternating background colors for each week.
        - **Odd Weeks**: White / Transparent.
        - **Even Weeks**: Very Light Gray (`#F9FAFB`).
    - **Borders**: Remove all default cell borders.
    - **Grid Lines**: Remove vertical grid lines between days.
- **Scope**:
    - Must apply to **both** "Date Change" and "Pricing Settings" modes.
    - Must preserve existing functionality (selection, status indicators, price displays).

## 3. Implementation Strategy

### A. Component Refactoring (`ScheduleCalendar.jsx`)
The current implementation uses a single CSS Grid container with 7 columns for all days. To apply row-based styles (stripes) robustly, we must restructure the DOM to render explicit **Row Containers**.

**Refactor Logic:**
1.  In `renderMonthPanel`, chunk the `calendarDays` array into groups of 7 (weeks).
2.  Map over these chunks to render `<div className="schedule-calendar__week-row">`.
3.  Apply `data-striped="true"` or generic class to even/odd rows.

### B. CSS Updates (`schedule-dashboard.css`)
1.  **Container**: Change `.schedule-calendar__grid` to a Flex/Block container (wrapping rows).
2.  **Rows**: `.schedule-calendar__week-row` becomes the CSS Grid (7 columns).
    - `background-color`: Apply to even rows.
    - `border-radius`: 4px (optional, for "pill" look) or 0 (for full stripe).
3.  **Cells**: Remove borders from `.schedule-calendar__day`.
    - Ensure cell background is transparent by default so the stripe shows through.
4.  **Pricing Mode Compatibility**:
    - Ensure the "Hide Dots/Borders" logic added previously still works with the new structure.

## 4. Verification Plan
- **Visual Check**: Verify alternating gray/white rows.
- **Alignment**: Ensure columns (Sun-Sat) align perfectly across rows.
- **Integration**: Verify "My Nights" (green blocks) render correctly *on top* of the stripes.
- **Responsiveness**: Ensure the row-based layout breaks down gracefully on mobile (or remains scrollable).

## 5. Task List
- [ ] **Step 1**: Refactor `ScheduleCalendar.jsx` to split days into `weeks` arrays.
- [ ] **Step 2**: Update JSX to render `div.schedule-calendar__week-row` elements.
- [ ] **Step 3**: Implement CSS for `.schedule-calendar__week-row` (grid layout + background colors).
- [ ] **Step 4**: Remove legacy border styles from `.schedule-calendar__day`.
