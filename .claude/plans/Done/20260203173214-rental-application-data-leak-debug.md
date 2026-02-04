# Rental Application Data Leak - Critical Security Bug Analysis

**Date:** 2026-02-03
**Severity:** CRITICAL (Data Privacy Violation)
**Status:** Root Cause Identified
**Reporter:** splitleasefrederick+frederickros@gmail.com

---

## Executive Summary

A **critical data leak vulnerability** exists in the Rental Application Wizard Modal where **another user's personal data** is displayed when a new user opens the modal. The root cause is that the `rentalApplicationLocalStore` uses a **non-user-scoped localStorage key** (`rentalApplicationDraft`) that persists across different user sessions on the same browser/device.

---

## Bug Symptoms Observed

1. User `splitleasefrederick+frederickros@gmail.com` clicks "Fill out Rental Application" CTA from the messaging shared island
2. The rental application modal opens and displays:
   - **Another user's data** (terrence grey, terrencegrey@test.com) prefilled in the form
   - **Progress indicators** showing Personal, Address, Occupants, Work, Details steps as completed
   - This user has **never filled out** a rental application before

---

## Root Cause Analysis

### Primary Issue: Non-User-Scoped localStorage Key

**File:** `app/src/islands/pages/RentalApplicationPage/store/rentalApplicationLocalStore.ts`

```typescript
// Lines 13-16
const STORAGE_KEYS = {
  DRAFT: 'rentalApplicationDraft',        // <-- PROBLEM: No user scoping!
  LAST_SAVED: 'rentalApplicationLastSaved',
} as const;
```

The localStorage keys are **static strings** with no user identification. This means:

1. User A fills out a rental application draft and closes the browser
2. User A logs out (or session expires)
3. User B logs in on the **same browser/device**
4. User B opens the rental application wizard
5. The store loads User A's draft from localStorage into User B's session

### The Data Flow

```
                                    ┌─────────────────────────────────┐
                                    │   localStorage (Browser-Level)   │
                                    │   Key: "rentalApplicationDraft"  │
                                    │   Value: { User A's Form Data }  │
                                    └──────────────┬──────────────────┘
                                                   │
        User B Opens Wizard                        │
              │                                    │
              ▼                                    ▼
┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│  rentalApplicationLocalStore    │◄──│  initialize() loads from        │
│  (Singleton Instance)           │   │  localStorage without checking  │
│                                 │   │  if data belongs to current     │
│  state: { formData: {...} }     │   │  authenticated user             │
└──────────────────┬──────────────┘   └─────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────┐
│  useRentalApplicationStore()    │
│  React Hook                     │
│                                 │
│  Returns User A's data to       │
│  User B's UI                    │
└──────────────────┬──────────────┘
                   │
                   ▼
┌─────────────────────────────────┐
│  RentalApplicationWizardModal   │
│                                 │
│  Displays User A's:             │
│  - Full Name: "terrence grey"   │
│  - Email: "terrencegrey@test..."│
│  - Progress: 5/7 steps complete │
└─────────────────────────────────┘
```

### Secondary Contributing Factors

1. **Singleton Store Pattern** (Line 433):
   ```typescript
   export const rentalApplicationLocalStore = new RentalApplicationLocalStore();
   ```
   The singleton pattern means one store instance serves all users in a browser session.

2. **No User Validation on Load** (Lines 169-202):
   ```typescript
   initialize(): StoreState {
     try {
       const savedDraft = localStorage.getItem(STORAGE_KEYS.DRAFT);
       // No check: Does this draft belong to the current user?
       if (savedDraft) {
         const parsed = JSON.parse(savedDraft);
         this.state.formData = { ...DEFAULT_FORM_DATA, ...parsed.formData };
         // ...
       }
     }
   }
   ```

3. **Store Never Reset on User Change**: The store is not cleared when:
   - A different user logs in
   - Auth state changes
   - User navigates to rental application from different contexts

---

## Files Involved

| File | Line Numbers | Issue |
|------|--------------|-------|
| `app/src/islands/pages/RentalApplicationPage/store/rentalApplicationLocalStore.ts` | 13-16 | Non-user-scoped storage keys |
| `app/src/islands/pages/RentalApplicationPage/store/rentalApplicationLocalStore.ts` | 169-202 | `initialize()` loads data without user validation |
| `app/src/islands/pages/RentalApplicationPage/store/rentalApplicationLocalStore.ts` | 433 | Singleton export enables cross-user data sharing |
| `app/src/islands/pages/RentalApplicationPage/store/useRentalApplicationStore.ts` | 57-69 | Hook initializes store on mount without user context |
| `app/src/islands/shared/RentalApplicationWizardModal/useRentalApplicationWizardLogic.js` | 147-165 | Wizard uses shared store without user validation |

---

## Recommended Fix Approach

### Option 1: User-Scoped Storage Keys (Preferred)

Modify the storage keys to include the user ID:

```typescript
// rentalApplicationLocalStore.ts

// Instead of static keys:
const STORAGE_KEYS = {
  DRAFT: 'rentalApplicationDraft',
  LAST_SAVED: 'rentalApplicationLastSaved',
};

// Use user-scoped keys:
function getStorageKeys(userId: string) {
  return {
    DRAFT: `rentalApplicationDraft_${userId}`,
    LAST_SAVED: `rentalApplicationLastSaved_${userId}`,
  };
}
```

**Changes Required:**
1. Pass `userId` to the store on initialization
2. Modify `initialize()`, `saveDraft()`, and `reset()` to use scoped keys
3. Update `useRentalApplicationStore` to accept and pass `userId`
4. Clear store when `userId` changes

### Option 2: Clear Store on User Change

Add a user verification step before loading:

```typescript
initialize(currentUserId: string): StoreState {
  const savedDraft = localStorage.getItem(STORAGE_KEYS.DRAFT);
  if (savedDraft) {
    const parsed = JSON.parse(savedDraft);

    // Validate ownership before loading
    if (parsed.userId !== currentUserId) {
      // Different user - clear stale data
      this.reset();
      return this.state;
    }

    // Same user - load draft
    this.state.formData = { ...DEFAULT_FORM_DATA, ...parsed.formData };
  }
  return this.state;
}
```

### Option 3: Hybrid Approach (Most Robust)

Combine both approaches:
1. Use user-scoped keys to prevent cross-user data access
2. Store `userId` in the draft for validation
3. Clear other users' drafts when detected (cleanup)

---

## Impact Assessment

| Impact Type | Severity | Details |
|-------------|----------|---------|
| **Data Privacy** | CRITICAL | User PII (name, email, phone, DOB, address, employer) exposed to wrong users |
| **User Trust** | HIGH | Seeing another person's data undermines platform trust |
| **Regulatory** | HIGH | Potential GDPR/CCPA violation for personal data exposure |
| **Scope** | MEDIUM | Requires same browser/device - not a remote attack vector |

---

## Reproduction Steps

1. Log in as User A (e.g., terrencegrey@test.com)
2. Navigate to `/account-profile?section=rental-application&openRentalApp=true`
3. Fill out partial rental application data
4. Close modal (data auto-saved to localStorage)
5. Log out
6. Log in as User B (e.g., frederickros@test.com)
7. Navigate to same URL or click "Fill out Rental Application" CTA
8. **Observe**: User A's data appears in User B's modal

---

## Related Code References

### CTA Navigation (Entry Point)
**File:** `app/src/lib/ctaConfig.js` (Lines 25-28)
```javascript
'fill_out_rental_application': {
  actionType: 'navigate',
  destination: '/account-profile?section=rental-application&openRentalApp=true'
},
```

### URL Parameter Handling
**File:** `app/src/islands/pages/AccountProfilePage/useAccountProfilePageLogic.js` (Lines 857-890)
```javascript
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const section = params.get('section');
  const openRentalApp = params.get('openRentalApp');

  if (section === 'rental-application' && openRentalApp === 'true') {
    setShowRentalWizardModal(true); // Opens wizard which loads shared store
  }
}, [loading, isEditorView, isHostUser]);
```

### Wizard Modal Initialization
**File:** `app/src/islands/shared/RentalApplicationWizardModal/useRentalApplicationWizardLogic.js` (Lines 147-165)
```javascript
export function useRentalApplicationWizardLogic({ ... }) {
  const store = useRentalApplicationStore(); // <-- Uses shared singleton store
  const {
    formData,      // <-- May contain another user's data
    occupants,
    // ...
  } = store;
```

---

## Testing Recommendations

After fix implementation:

1. **Unit Test:** Verify store rejects data from different user IDs
2. **Integration Test:** Multi-user scenario with login/logout cycles
3. **E2E Test:** Full CTA flow from messaging to rental app modal
4. **Cleanup Test:** Verify old drafts are cleared for different users

---

## Priority

**P0 - Fix Immediately**

This is a data privacy bug that exposes personal information (PII) across user sessions. It should be addressed before any other feature work.

---

**Analysis Complete**
