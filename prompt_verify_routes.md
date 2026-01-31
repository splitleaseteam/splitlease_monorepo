# Verify and Fix Schedule Dashboard Routes

## Objective
Ensure the Schedule Dashboard route (`/schedule/:leaseId`) is correctly configured and working.

## Context
The user is experiencing issues reaching the page (blank page or errors) or believes the route is missing.

## Tasks

1.  **Check `app/src/routes.config.js`**:
    *   Verify there is an entry for the Schedule Dashboard.
    *   It should look like this:
        ```javascript
        {
          path: '/schedule',
          file: 'schedule.html',
          aliases: ['/schedule.html'],
          protected: true, // or false depending on auth requirements
          cloudflareInternal: true,
          internalName: 'schedule-view',
          hasDynamicSegment: true,
          dynamicPattern: '/schedule/:leaseId'
        }
        ```
    *   **Action**: If missing or incorrect, add/fix it.

2.  **Check `app/public/schedule.html`**:
    *   Verify this file exists.
    *   Verify it has `<div id="root"></div>`.
    *   Verify it imports the correct entry point: `<script type="module" src="/src/schedule.jsx"></script>`.
    *   **Action**: Create or fix if missing/broken.

3.  **Check `app/src/schedule.jsx`**:
    *   Verify it exists and renders `ScheduleDashboard`.
    *   Verify it imports the correct CSS (`./styles/components/schedule-dashboard.css`).

4.  **Check `useScheduleDashboardLogic.js`**:
    *   Verify `getLeaseIdFromUrl` correctly parses `/schedule/:leaseId`.
    *   It should likely take `window.location.pathname.split('/')[2]`.

5.  **Manual Test**:
    *   Visit `/schedule/123` (or any dummy ID).
    *   Ensure the page loads and is not blank.

## Troubleshooting
- If the page is blank, check the browser console for errors.
- If getting a 404, check if the server needs a restart after adding the route.
