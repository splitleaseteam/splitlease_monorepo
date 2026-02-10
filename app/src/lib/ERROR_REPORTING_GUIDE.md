# Error Reporting Guide

## Overview

`lib/errorReporting.js` is the centralized error reporting system for the Split Lease
frontend. It ensures errors are **never silently swallowed** by routing them through
a consistent pipeline:

1. **Console** -- always logged (development and production)
2. **Sentry** -- captured in production (lazy-loaded, filtered)
3. **Slack** -- critical errors trigger immediate Slack alerts
4. **Global handlers** -- unhandled promise rejections and window errors are caught automatically

## What It Exports

### `reportError(error, context)`

The core function. Logs the error and sends it to Sentry/Slack as appropriate.

```js
import { reportError, ErrorSeverity } from '../lib/errorReporting.js';

reportError(error, {
  severity: ErrorSeverity.HIGH,
  component: 'BookingForm',
  action: 'submitProposal',
  metadata: { proposalId: '123', userId: '456' },
});
```

**Context fields:**
| Field | Type | Description |
|-------|------|-------------|
| `severity` | `ErrorSeverity` | `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL` |
| `component` | `string` | Name of the component/module where the error occurred |
| `action` | `string` | User action that triggered the error (e.g. 'submit', 'load', 'delete') |
| `metadata` | `object` | Any additional structured data for debugging |

### `withErrorReporting(fn, context)`

Wraps an async function so that any thrown error is automatically reported before
being re-thrown. The error is **not swallowed** -- callers still need to handle it.

```js
import { withErrorReporting } from '../lib/errorReporting.js';

const safeFetchUser = withErrorReporting(fetchUser, {
  component: 'UserProfile',
  action: 'loadUser',
});

// Errors are reported AND re-thrown
try {
  const user = await safeFetchUser(userId);
} catch (err) {
  // Still need to handle UI feedback here
  showToast({ title: 'Error', content: 'Could not load user.', type: 'error' });
}
```

### `trySafe(fn, context)`

A structured alternative to bare `try/catch`. Returns `{ data, error }` instead of
throwing. The error is reported automatically if one occurs.

```js
import { trySafe } from '../lib/errorReporting.js';

const { data: user, error } = await trySafe(
  () => fetchUser(userId),
  { component: 'UserProfile', action: 'loadUser' }
);

if (error) {
  // Error already reported to Sentry/console -- just handle the UI
  setErrorMessage('Could not load user profile.');
  return;
}

// Use `user` safely
setUser(user);
```

### `ErrorBoundary` (React Component)

Catches rendering errors in the React component tree. Wraps children and reports
the error with component stack trace.

```jsx
import { ErrorBoundary } from '../lib/errorReporting.js';

<ErrorBoundary component="HomePage">
  <HomePage />
</ErrorBoundary>
```

### `ErrorSeverity` (Constants)

```js
import { ErrorSeverity } from '../lib/errorReporting.js';

ErrorSeverity.LOW       // 'low'      -- Sentry level: info
ErrorSeverity.MEDIUM    // 'medium'   -- Sentry level: warning
ErrorSeverity.HIGH      // 'high'     -- Sentry level: error
ErrorSeverity.CRITICAL  // 'critical' -- Sentry level: fatal + Slack alert
```

## Before/After: Bare try/catch vs. Structured Error Reporting

### BEFORE (bare try/catch -- error silently swallowed)

```js
async function loadListings() {
  try {
    const listings = await fetchListings();
    setListings(listings);
  } catch (err) {
    console.log('Error:', err);  // Easy to miss in production
    setError('Something went wrong');
  }
}
```

Problems:
- `console.log` is invisible in production
- No structured context (which component? what action?)
- No Sentry capture, no Slack alert
- Error is swallowed -- no one is notified

### AFTER (with trySafe)

```js
import { trySafe } from '../lib/errorReporting.js';

async function loadListings() {
  const { data: listings, error } = await trySafe(
    () => fetchListings(),
    { component: 'SearchPage', action: 'loadListings', severity: ErrorSeverity.MEDIUM }
  );

  if (error) {
    setError('Something went wrong');
    return;
  }

  setListings(listings);
}
```

Benefits:
- Error automatically logged to console with full context
- Sentry capture in production with component/action tags
- Structured `{ data, error }` return makes the happy/error paths clear
- CRITICAL severity would also trigger Slack

### AFTER (with withErrorReporting)

```js
import { withErrorReporting } from '../lib/errorReporting.js';

const safeLoadListings = withErrorReporting(fetchListings, {
  component: 'SearchPage',
  action: 'loadListings',
});

async function loadListings() {
  try {
    const listings = await safeLoadListings();
    setListings(listings);
  } catch (err) {
    // Error already reported -- just handle UI
    setError('Something went wrong');
  }
}
```

## Current Adoption

### Files Using errorReporting.js: **0 (besides the module itself)**

No files in the codebase currently import from `errorReporting.js`. The module is
defined and ready, but adoption has not started. The global handlers (unhandled
rejection, window.error) are active automatically via the module's self-executing
setup code, but no component or hook explicitly uses `reportError`, `withErrorReporting`,
or `trySafe`.

### Files That Should Adopt It (High Priority)

These files perform async operations with bare `try/catch` and would benefit most
from structured error reporting:

**API/Data Layer:**
- `lib/bubbleAPI.js` -- all Bubble API proxy calls
- `lib/auth.js` -- login, logout, token validation
- `lib/listingDataFetcher.js` -- listing queries
- `lib/proposalDataFetcher.js` -- proposal queries with joins
- `lib/listingService.js` -- listing CRUD operations
- `lib/photoUpload.js` -- photo upload/delete to storage
- `lib/slackService.js` -- Slack notification integration

**Page Logic Hooks (high-traffic pages):**
- `islands/pages/SearchPage.jsx` / `useSearchPageLogic.js`
- `islands/pages/ViewSplitLeasePage/` -- listing detail page
- `islands/pages/GuestProposalsPage/` / `useGuestProposalsPageLogic.js`
- `islands/pages/HostProposalsPage/` / `useHostProposalsPageLogic.js`
- `islands/pages/AccountProfilePage/` / `useAccountProfilePageLogic.js`
- `islands/pages/ListingDashboardPage/` / `useListingDashboardPageLogic.js`
- `islands/pages/SelfListingPage/` -- multi-step listing creation

**Workflow Layer (business-critical operations):**
- `logic/workflows/booking/acceptProposalWorkflow.js`
- `logic/workflows/booking/cancelProposalWorkflow.js`
- `logic/workflows/proposals/counterofferWorkflow.js`
- `logic/workflows/auth/checkAuthStatusWorkflow.js`
- `logic/workflows/auth/validateTokenWorkflow.js`

## Combining with Toast Notifications

Error reporting and toast notifications serve different purposes:
- **errorReporting** -- tells the **development team** something went wrong (Sentry, Slack, console)
- **Toast.jsx** -- tells the **user** something happened (in-app notification)

Best practice is to use both together:

```js
import { trySafe, ErrorSeverity } from '../lib/errorReporting.js';
import { useToast } from '../shared/Toast';

function MyComponent() {
  const { showToast } = useToast();

  const handleSave = async () => {
    const { data, error } = await trySafe(
      () => saveProposal(proposalData),
      { component: 'ProposalForm', action: 'save', severity: ErrorSeverity.HIGH }
    );

    if (error) {
      // User feedback
      showToast({ title: 'Save Failed', content: error.message, type: 'error' });
      return;
    }

    showToast({ title: 'Proposal Saved!', type: 'success' });
  };
}
```

## Severity Guide

| Severity | When to Use | Sentry Level | Slack Alert? |
|----------|------------|--------------|-------------|
| `LOW` | Non-blocking issues, fallback data used | info | No |
| `MEDIUM` | Degraded experience but page still works | warning | No |
| `HIGH` | Feature broken, user action failed | error | No |
| `CRITICAL` | Payment failure, auth broken, data corruption | fatal | **Yes** |

## Auto-Captured Errors (No Import Needed)

The module automatically installs global handlers when loaded:

- **`window.addEventListener('unhandledrejection')`** -- catches any unhandled Promise rejection
- **`window.addEventListener('error')`** -- catches any uncaught synchronous error

These are reported as `HIGH` severity with `component: 'Global'`. They serve as a
safety net but should not be relied upon -- always add explicit error handling in
business-critical code paths.
