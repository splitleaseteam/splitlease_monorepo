# Specification: Legend Visibility by Dashboard Mode

## 1. Objective
Ensure the calendar legend (My Nights, Available, Recommended, Pending) is only visible in the **Date Changes** mode and hidden in the **Pricing Settings** mode.

## 2. Current State
The legend was recently moved to the calendar header (between navigation arrows) to save vertical space. However, it should only be visible when the user is in "Date Changes" mode, not "Pricing Settings" mode.

## 3. Rationale
- **Date Changes Mode**: Legend is essential for understanding night ownership and availability states
- **Pricing Settings Mode**: Legend is unnecessary since the user is only viewing their own nights with price overlays

## 4. Implementation

### 4.1 CSS Approach (Recommended)
Update `schedule-dashboard.css`:

```css
/* Hide legend in pricing mode */
.schedule-dashboard__calendar--pricing .schedule-calendar__legend {
  display: none;
}
```

**Current Issue**: The CSS currently has `display: flex;` which keeps it visible. This needs to be changed to `display: none;`.

### 4.2 Component Approach (Alternative)
Pass `dashboardMode` as a prop to `ScheduleCalendar.jsx` and conditionally render the legend:

```jsx
{dashboardMode === 'date_changes' && (
  <div className="schedule-calendar__legend">
    {/* legend items */}
  </div>
)}
```

## 5. Acceptance Criteria
- [ ] Legend is visible in Date Changes mode
- [ ] Legend is hidden in Pricing Settings mode
- [ ] No layout shift when switching between modes

## 6. Files to Modify
- `schedule-dashboard.css` (line ~3038)
  - Change `.schedule-dashboard__calendar--pricing .schedule-calendar__legend` from `display: flex;` to `display: none;`
