# Calendar Overlap Solutions: 5 Approaches

## Problem
In the 2-month view, the month grids are overlapping or squeezing, likely because the container width is insufficient for two fixed-width 350px calendars side-by-side.

## Solution Options

### 1. The "Responsive Stack" (Flex Wrap)
**Concept:** If the screen isn't wide enough for two months (approx 750px), the second month automatically drops below the first.
- **Pros:** Impossible to overlap; mobile-friendly default.
- **Cons:** Loses the "side-by-side comparison" benefit on mid-sized screens; increases vertical height significantly.

### 2. The "Horizontal Scroll" (Overflow)
**Concept:** Keep the container fixed height but allow horizontal scrolling (`overflow-x: auto`) if the calendars don't fit.
- **Pros:** Preserves the exact size and legibility of date cells.
- **Cons:** Scrollbars within widgets feel clunky on desktop; hides the second month by default if narrow.

### 3. The "Fluid Grid" (Percentage-based)
**Concept:** Stop using fixed pixels for day cells (`36px`). Change them to `aspect-ratio: 1 / 1` and `width: 100%`. Let the grid cells shrink to fit the available space.
- **Pros:** Always keeps months side-by-side; fills space perfectly.
- **Cons:** If it gets too narrow, dates become unreadable tiny slivers.

### 4. The "Zoom Scale" (Transform)
**Concept:** Detect if the container is narrow and apply `transform: scale(0.85)` to shrink the entire calendar UI without reflowing it.
- **Pros:** Keeps the element proportions perfect.
- **Cons:** Text can become blurry or too small; accessibility issues; feels "hacky".

### 5. The "Fixed Sidebar, Fluid Main" (Recommended)
**Concept:** Currently, the main layout is a percentage split (`2.5fr 1fr`). This squeezes the calendar when the screen shrinks.
**Fix:** Change the main layout to give the sidebar a **fixed** width (e.g., `350px`) and let the Left Column take **all remaining space** (`1fr`). Combine this with **Solution #3** (Fluid Cells).
- **Pros:** Sidebar doesn't need to be 33% (it just needs to fit the chat). This gives the calendar maximum breathing room. Fluid cells ensure they fill that room nicely.

---

## Best Solution: Option 5 + 3 (Fluid Main Column + Fluid Cells)

We should:
1.  **Main Layout:** Change grid from `2.5fr 1fr` → `1fr 380px`. This guarantees the calendar column gets the lion's share of space.
2.  **Calendar Layout:** Change `display: flex` → `display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;`.
3.  **Date Cells:** Remove fixed dimensions (`height/width: 40px`). Use `aspect-ratio: 1; width: 100%`.

### Spec for Claude

- **File**: `schedule-dashboard.css`
- **Selector**: `.schedule-dashboard__grid`
  - Change `grid-template-columns: 2.5fr 1fr` to `grid-template-columns: 1fr 380px`.
- **Selector**: `.schedule-calendar__container` (wrapper for both months)
  - `display: grid`
  - `grid-template-columns: 1fr 1fr`
  - `gap: 2rem`
- **Selector**: `.schedule-calendar__day`
  - Remove `width / height` fixed pixels.
  - Add `width: 100%`
  - Add `aspect-ratio: 1`
  - Add `min-width: 32px` (safety to prevent total collapse)
