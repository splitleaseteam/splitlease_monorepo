# Toast System Migration Guide

## Summary

The codebase has **two** toast/notification systems. This guide explains which one to use,
and how to migrate from the old system to the new one.

| System | File | Pattern | Status |
|--------|------|---------|--------|
| **Toast.jsx** (canonical) | `islands/shared/Toast.jsx` | React context + global function | **USE THIS** |
| **toastService.js** (legacy) | `lib/toastService.js` | Pub/sub with no subscribers | **DEPRECATED** |
| **toastAdapter.js** (bridge) | `lib/toastAdapter.js` | Wraps Toast.jsx with old API | **Temporary bridge** |

## Why Toast.jsx Wins

- Has a full React context provider (`ToastProvider`) already wrapped around 23+ entry points
- Renders styled toasts with icons, progress bars, title + content, animations
- Supports both a `useToast()` hook (inside components) and a global `showToast` (outside components)
- Already used by ~38 files vs. 5 files using toastService.js
- toastService.js's `subscribeToToasts` pub/sub listener is defined but **never consumed** anywhere

## Three Usage Patterns (Ranked Best to Worst)

### 1. useToast() hook (BEST -- inside React components)

```jsx
import { useToast } from '../../shared/Toast';

function MyComponent() {
  const { showToast } = useToast();

  const handleSave = async () => {
    try {
      await saveData();
      showToast({ title: 'Saved!', content: 'Your changes are live.', type: 'success' });
    } catch (err) {
      showToast({ title: 'Error', content: err.message, type: 'error' });
    }
  };
}
```

### 2. window.showToast (OK -- outside React tree, e.g. utility hooks)

```js
// For code that runs outside the React component tree but inside a page
// that has <ToastProvider>
if (window.showToast) {
  window.showToast({ title: 'Done!', type: 'success' });
}
```

### 3. Global showToast import (OK -- non-component modules)

```js
import { showToast } from 'islands/shared/Toast';

showToast({ title: 'Notification', content: 'Something happened.', type: 'info' });
```

## How to Migrate a File from toastService.js

### Before (old system)

```js
import { toast } from '../../lib/toastService.js';

// In handler:
toast.success('Saved!');
toast.error('Something went wrong');
toast.warning('Check your input');
```

### After (new system -- option A: use the hook)

```jsx
import { useToast } from '../../shared/Toast';

function MyComponent() {
  const { showToast } = useToast();

  // In handler:
  showToast({ title: 'Saved!', type: 'success' });
  showToast({ title: 'Error', content: 'Something went wrong', type: 'error' });
  showToast({ title: 'Warning', content: 'Check your input', type: 'warning' });
}
```

### After (new system -- option B: swap import only, zero code changes)

```js
// Just change the import path -- API is identical
import { toast } from '../../lib/toastAdapter.js';

// These calls work unchanged:
toast.success('Saved!');
toast.error('Something went wrong');
toast.warning('Check your input');
```

Option B is the fastest path. It routes through the adapter to Toast.jsx, so the user
sees the same styled toasts as the rest of the app. Later, you can come back and
refactor to option A for full access to title + content.

## Files Still Using toastService.js (5 files)

These are the files that need migration:

1. **`islands/shared/DocumentChangeRequestModal/useDocumentChangeRequestLogic.js`**
   - Uses: `toast.error(...)`, `toast.success(...)`

2. **`islands/modals/VirtualMeetingModal.jsx`**
   - Uses: `toast.warning(...)`, `toast.success(...)`, `toast.error(...)`

3. **`islands/modals/EditPhoneNumberModal.jsx`**
   - Uses: `toast.warning(...)`, `toast.error(...)`

4. **`islands/pages/WhySplitLeasePage.jsx`**
   - Uses: `toast.warning(...)`

5. **`islands/pages/ViewSplitLeasePage_LEGACY/ViewSplitLeasePage.jsx`**
   - Uses: `toast.warning(...)` (legacy page, low priority)

## Files Using window.showToast (Acceptable but Could Upgrade)

These files use `window.showToast` directly. This works because `ToastProvider` sets
`window.showToast` on mount. It is an acceptable pattern for non-component code, but
components with access to the React tree should prefer `useToast()`.

- `islands/shared/AITools/AudioRecorder.jsx`
- `islands/shared/AITools/WifiPhotoExtractor.jsx`
- `islands/shared/AITools/PhoneCallInterface.jsx`
- `islands/shared/AITools/PdfDocUploader.jsx`
- `islands/shared/AITools/FreeformTextInput.jsx`
- `islands/shared/EditListingDetails/useEditListingDetailsLogic.js`
- `islands/shared/NotificationSettingsIsland/useNotificationSettings.js`
- `islands/pages/AccountProfilePage/useAccountProfilePageLogic.js`
- `islands/pages/HouseManualPage/useHouseManualPageLogic.js`
- `islands/pages/ListingDashboardPage/useListingDashboardPageLogic.js`
- `islands/pages/ListingDashboardPage/components/PricingEditSection.jsx`
- `islands/pages/AccountProfilePage/AccountProfilePage.jsx`

## Checklist for Full Migration

- [ ] Switch 5 toastService.js imports to toastAdapter.js (or directly to useToast)
- [ ] Verify each page's entry point wraps with `<ToastProvider>`
- [ ] Optionally upgrade `window.showToast` calls to `useToast()` where the code is inside a React component
- [ ] Once toastService.js has zero imports, delete `lib/toastService.js`
- [ ] Once toastAdapter.js has zero imports, delete `lib/toastAdapter.js`
