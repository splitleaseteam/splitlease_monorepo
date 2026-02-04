# Implement Collapsible Panels for Schedule Dashboard

## Objective
Implement the collapsible middle sections (Buy Out Panel + Chat) for the Schedule Dashboard, following the detailed specification.

## Reference
The full specification is in: `prompt_collapsible_panels_spec.md`

## Tasks

1.  **Modify `useScheduleDashboardLogic.js`**:
    *   Add state for `panelsCollapsed` and `autoCollapse`.
    *   Add `handleTogglePanels` and `handleToggleAutoCollapse` handlers.
    *   Add `useEffect` hooks to auto-expand panels when `selectedNight` changes or when a new message/transaction arrives (you can mock the message trigger for now or hook into `messages`).
    *   Export these new states and handlers.

2.  **Modify `index.jsx` (ScheduleDashboard)**:
    *   Update the middle row layout to wrap the Buy Out and Chat sections.
    *   Add the "Collapse Bar" UI above the sections.
    *   Implement the conditional rendering/CSS classes for the collapsed state.
        *   When collapsed, the sections should be hidden (or height 0).
        *   The Underlay Bar should show the summary (Selected Night + Unread Message count).
    *   Pass the new state and handlers from the hook.

3.  **Update CSS (`schedule-dashboard.css`)**:
    *   Add the CSS classes defined in the spec:
        *   `.schedule-dashboard__middle-row` (transition, overflow)
        *   `.schedule-dashboard__middle-row--collapsed`
        *   `.schedule-dashboard__collapse-bar`

4.  **Verification**:
    *   Start the app and go to `/schedule/123`.
    *   Verify checking "Auto-collapse" works (optional logic).
    *   Verify clicking the bar toggles the view.
    *   Verify selecting a night auto-expands the view.

## Notes
- Keep the existing functionality intact.
- Ensure the "Underlay Bar" looks good and provides context (e.g. "Buy Out: Feb 13, 2026").
