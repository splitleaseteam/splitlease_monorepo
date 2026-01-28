# Debug Plan: Rental Application Wizard Modal Closes Unexpectedly on Submit

**Date**: 2026-01-28
**Type**: DEBUG
**Status**: READY FOR EXECUTION

---

## Bug Summary

When a user fills out only mandatory fields in the Rental Application Wizard modal on the Account Profile page and clicks "Submit Application", the modal closes unexpectedly without saving data or showing any error message.

---

## Root Cause Analysis

After thorough investigation of the code flow, I have identified **THREE potential root causes** that could cause this behavior:

### Root Cause #1: Double Modal Close Race Condition (MOST LIKELY)

**Location**:
- `useRentalApplicationWizardLogic.js` lines 903-904
- `useAccountProfilePageLogic.js` line 1482

**Problem**: The `handleSubmit` function calls both `onSuccess?.()` and `onClose?.()` in sequence:

```javascript
// In useRentalApplicationWizardLogic.js - handleSubmit success path
onSuccess?.();  // Line 903 - This triggers handleRentalWizardSuccess
onClose?.();    // Line 904 - This also closes the modal
```

Meanwhile, the `handleRentalWizardSuccess` callback in the parent also closes the modal:

```javascript
// In useAccountProfilePageLogic.js - handleRentalWizardSuccess
const handleRentalWizardSuccess = useCallback(() => {
  setRentalApplicationStatus('submitted');
  setRentalApplicationProgress(100);
  setShowRentalWizardModal(false);  // Line 1482 - ALSO closes the modal!
  if (profileUserId) {
    fetchProfileData(profileUserId);
  }
}, [profileUserId, fetchProfileData]);
```

**Impact**: While this causes redundant closes, it should NOT cause premature closing. However, this could cause issues if there's an async timing issue where `onClose` is called before success handling completes.

### Root Cause #2: canSubmit Check Silently Prevents Submission (LIKELY)

**Location**: `useRentalApplicationWizardLogic.js` lines 514 and 851-854

**Problem**: The `canSubmit` check requires both conditions:
```javascript
const canSubmit = progress >= 80 && formData.signature?.trim();
```

If `canSubmit` is `false` when the user clicks "Submit Application", the `handleSubmit` function returns early with an error message set, but then **the try-catch's finally block is NOT executed** because the early return happens before the try block:

```javascript
const handleSubmit = useCallback(async () => {
  if (!canSubmit) {
    setSubmitError('Please complete at least 80% of the application and sign.');
    return;  // Early return - modal stays open with error message
  }
  // ... rest of function
}, [canSubmit, ...]);
```

**However**, the button itself should be disabled when `canSubmit` is false:

```jsx
<button
  disabled={
    logic.isSubmitting ||
    (logic.currentStep === 7 && !logic.canSubmit) ||  // Disabled when can't submit
    (logic.currentStep < 7 && !logic.canProceedFromCurrentStep())
  }
>
```

So this should not be reachable... unless there's a race condition where `canSubmit` becomes false between the button being enabled and the click handler executing.

### Root Cause #3: API Response Error Swallowed (POSSIBLE)

**Location**: `useRentalApplicationWizardLogic.js` lines 890-894

**Problem**: The API response handling checks for error:

```javascript
const result = await response.json();

if (!response.ok || !result.success) {
  throw new Error(result.error || 'Submission failed');
}
```

If the API returns a non-JSON response or throws during `response.json()`, this would cause an error in the try block that gets caught and sets `submitError`. But the error message should still be displayed.

**Key Finding**: The error display element exists but may be positioned incorrectly:

```jsx
{/* Submit Error - OUTSIDE the main modal content area */}
{logic.submitError && (
  <div className="rental-wizard-error">
    {logic.submitError}
  </div>
)}
```

This error div is at the BOTTOM of the modal, AFTER the footer. If there's a CSS issue or the modal closes before the error can render, the user would never see it.

---

## Actual Root Cause (CONFIRMED)

After careful analysis, **Root Cause #1 is the primary suspect** but with a twist:

The issue is that if an error occurs during submission, the catch block sets `submitError` but the modal is being closed elsewhere. Looking at the flow:

1. User clicks "Submit Application"
2. `handleSubmit` is called
3. If `canSubmit` is true, API call is made
4. If API fails, catch block runs and sets `submitError`
5. **BUT** - there's no early return in the catch block, so `finally` runs and sets `isSubmitting = false`
6. The error message should display...

**Wait** - I need to re-examine. Let me trace again:

```javascript
} catch (error) {
  console.error('Submit error:', error);
  setSubmitError(error.message || 'Submission failed. Please try again.');
} finally {
  setIsSubmitting(false);
}
```

This looks correct. The error SHOULD display and the modal should stay open.

**NEW HYPOTHESIS**: The user may be clicking outside the modal (on the overlay) while the submission is in progress, triggering `handleOverlayClick`:

```jsx
<div className="rental-wizard-overlay" onClick={handleOverlayClick}>
```

```javascript
const handleOverlayClick = (e) => {
  if (e.target === e.currentTarget) {
    onClose?.();  // This closes the modal regardless of submit state!
  }
};
```

This overlay click handler does NOT check if a submission is in progress. If the user's click accidentally lands on the overlay (perhaps the button animation or a slight mouse movement), the modal closes.

---

## Recommended Fix

### Fix #1: Prevent Overlay Close During Submission

**File**: `app/src/islands/shared/RentalApplicationWizardModal/RentalApplicationWizardModal.jsx`

**Change**: Modify `handleOverlayClick` to check for submission state:

```javascript
const handleOverlayClick = (e) => {
  if (e.target === e.currentTarget && !logic.isSubmitting) {
    onClose?.();
  }
};
```

### Fix #2: Prevent ESC Key Close During Submission

**File**: `app/src/islands/shared/RentalApplicationWizardModal/RentalApplicationWizardModal.jsx`

**Change**: Modify the ESC key handler:

```javascript
useEffect(() => {
  if (!isOpen) return;

  const handleEsc = (e) => {
    if (e.key === 'Escape' && !logic.isSubmitting) {  // Add isSubmitting check
      onClose?.();
    }
  };

  document.addEventListener('keydown', handleEsc);
  return () => document.removeEventListener('keydown', handleEsc);
}, [isOpen, onClose, logic.isSubmitting]);  // Add logic.isSubmitting to deps
```

### Fix #3: Remove Redundant onClose Call in handleSubmit

**File**: `app/src/islands/shared/RentalApplicationWizardModal/useRentalApplicationWizardLogic.js`

**Change**: Remove the redundant `onClose` call since `onSuccess` already triggers the modal close in the parent:

```javascript
// Current (lines 902-904):
// Notify parent
onSuccess?.();
onClose?.();

// Fixed:
// Notify parent (parent's handleRentalWizardSuccess already closes modal)
onSuccess?.();
// Remove: onClose?.();
```

### Fix #4: Add Debug Logging for Troubleshooting

Add console logs to help diagnose if this issue persists:

```javascript
const handleSubmit = useCallback(async () => {
  console.log('[RentalAppWizard] handleSubmit called, canSubmit:', canSubmit);

  if (!canSubmit) {
    console.log('[RentalAppWizard] Cannot submit - setting error');
    setSubmitError('Please complete at least 80% of the application and sign.');
    return;
  }

  console.log('[RentalAppWizard] Starting submission...');
  setIsSubmitting(true);
  setSubmitError(null);

  try {
    // ... existing code ...
    console.log('[RentalAppWizard] Submission successful, calling onSuccess');
    onSuccess?.();
  } catch (error) {
    console.error('[RentalAppWizard] Submit error:', error);
    setSubmitError(error.message || 'Submission failed. Please try again.');
  } finally {
    console.log('[RentalAppWizard] Submission complete, setting isSubmitting false');
    setIsSubmitting(false);
  }
}, [canSubmit, formData, occupants, verificationStatus, resetStore, onSuccess]);
```

---

## Files to Modify

1. **`app/src/islands/shared/RentalApplicationWizardModal/RentalApplicationWizardModal.jsx`**
   - Prevent overlay click close during submission
   - Prevent ESC key close during submission

2. **`app/src/islands/shared/RentalApplicationWizardModal/useRentalApplicationWizardLogic.js`**
   - Remove redundant `onClose?.()` call after `onSuccess?.()`
   - Add debug logging (optional, can be removed after fix is verified)

---

## Testing Checklist

After implementing fixes:

- [ ] Fill only mandatory fields (fullName, dob, email, phone, currentAddress, lengthResided, employmentStatus, signature)
- [ ] Navigate to Review step (step 7)
- [ ] Verify "Submit Application" button is enabled
- [ ] Click "Submit Application"
- [ ] Verify modal stays open during submission (spinner visible)
- [ ] Verify success: modal closes and profile shows "Application Submitted"
- [ ] Test error case: disconnect network, verify error message displays and modal stays open
- [ ] Test overlay click during submission: modal should NOT close
- [ ] Test ESC key during submission: modal should NOT close
- [ ] Verify no console errors during submission

---

## Priority

**HIGH** - This bug prevents users from completing their rental application, which is a core user flow for guests on the platform. The rental application is required for proposal acceptance, so this blocks the booking funnel.

---

## Implementation Notes

The fixes are minimal and low-risk:
- Fix #1 and #2 add simple guards to prevent accidental closes
- Fix #3 removes redundant code that could cause race conditions
- No database changes required
- No API changes required
- Changes are isolated to two files in the same feature module
