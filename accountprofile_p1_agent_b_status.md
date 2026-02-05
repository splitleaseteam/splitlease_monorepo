# Agent-B Phase 1 Status: AccountProfilePage Data Layer Exploration

**Date**: 2026-02-05
**Target Files**:
- `app/src/islands/pages/AccountProfilePage/AccountProfilePage.jsx`
- `app/src/islands/pages/AccountProfilePage/useAccountProfilePageLogic.js`

---

## Key Findings

| Category | Count |
|----------|-------|
| Dead imports | 0 |
| Dead code (potentially unused) | 7 |
| Hardcoded Bubble fields | 40 |

---

## Task 1: Dead Imports

### AccountProfilePage.jsx
**Result**: 0 dead imports

All imports are actively used:
- `React, { useState }` - JSX and state management
- `Header`, `Footer`, `ToastProvider` - Layout components
- `NotificationSettingsModal`, `EditPhoneNumberModal` - Modal components
- `useAccountProfilePageLogic` - Logic hook
- `ProfileSidebar`, `EditorView`, `PublicView` - View components
- `FixedSaveBar`, `ReferralBanner`, `ReferralModal` - UI components
- `RentalApplicationWizardModal`, `IdentityVerification` - Feature components
- CSS import - Styles

### useAccountProfilePageLogic.js
**Result**: 0 dead imports

All imports are actively used:
- `useState, useEffect, useCallback, useMemo` - React hooks (all used extensively)
- `supabase` - Database client (used for queries and updates)
- `getSessionId, checkAuthStatus, validateTokenAndFetchUser, checkUrlForAuthError, clearAuthErrorFromUrl` - Auth utilities (all called)
- `isHost` - Rule function (called in lines 379, 746)
- `submitIdentityVerification` - API service (called in line 1408)

---

## Task 2: Dead Code (Unused Variables/Functions)

### AccountProfilePage.jsx
**Result**: 0 dead code

- `LoadingState` component (lines 33-39) - Used in line 79
- `ErrorState` component (lines 45-63) - Used in line 92

### useAccountProfilePageLogic.js
**Result**: 7 potentially unused exports

The following are defined, returned by the hook, but **not used in AccountProfilePage.jsx**:

| Variable | Line | Type | Notes |
|----------|------|------|-------|
| `handleCancel` | 1213 | useCallback | Resets form to original profileData |
| `handleExitPreview` | 1268 | useCallback | Sets previewMode to false |
| `isPublicView` | 370 | useMemo | Inverse of isEditorView |
| `isAuthenticated` | 293 | useState | Auth status boolean |
| `isOwnProfile` | 355 | useMemo | Whether viewing own profile |
| `loggedInUserId` | 291 | useState | Current user's ID |
| `displayName` | 448 | useMemo | Computed "First Last" string |

**Note**: These may be used by child components (`EditorView`, `PublicView`, `ProfileSidebar`). Further investigation of child components recommended before removal.

---

## Task 3: Hardcoded Bubble Fields

### Summary
**Total**: ~40 unique hardcoded Bubble-style field patterns

### In Target Files (31 unique fields)

#### User Table Fields
| Field Name | Occurrences | Files |
|------------|-------------|-------|
| `'Name - First'` | 12 | Both + PublicView |
| `'Name - Last'` | 8 | Both |
| `'Name - Full'` | 1 | Logic hook (save) |
| `'Profile Photo'` | 4 | Both |
| `'Cover Photo'` | 1 | AccountProfilePage |
| `'Email'` | 2 | AccountProfilePage, EditorView |
| `'Phone Number (as text)'` | 3 | AccountProfilePage, EditorView |
| `'Date of Birth'` | 4 | Both |
| `'About Me / Bio'` | 5 | Both + PublicView |
| `'Job Title'` | 3 | Logic hook |
| `'Type - User Signup'` | 2 | Logic hook |
| `'need for Space'` | 4 | Logic hook + PublicView |
| `'special needs'` | 4 | Logic hook + PublicView |
| `'Recent Days Selected'` | 4 | Logic hook + PublicView |
| `'transportation medium'` | 4 | Logic hook + PublicView |
| `'Reasons to Host me'` | 6 | Logic hook |
| `'About - Commonly Stored Items'` | 6 | Logic hook |

#### Verification Fields
| Field Name | Occurrences | Files |
|------------|-------------|-------|
| `'is email confirmed'` | 2 | Logic hook |
| `'Verify - Phone'` | 1 | Logic hook |
| `'user verified?'` | 1 | Logic hook |
| `'Verify - Linked In ID'` | 1 | Logic hook |

#### Referral/Stats Fields
| Field Name | Occurrences | Files |
|------------|-------------|-------|
| `'Referral Code'` | 1 | AccountProfilePage |
| `'Friends Referred'` | 1 | AccountProfilePage |
| `'Rewards Claimed'` | 1 | AccountProfilePage |
| `'Total Rewards'` | 1 | AccountProfilePage |
| `'Response Time'` | 1 | AccountProfilePage |
| `'Response Rate'` | 1 | AccountProfilePage |

#### Metadata Fields
| Field Name | Occurrences | Files |
|------------|-------------|-------|
| `'Created Date'` | 1 | AccountProfilePage |
| `'_created_date'` | 1 | AccountProfilePage |
| `'Modified Date'` | 3 | Logic hook |
| `'Rental Application'` | 3 | Logic hook |

### In Child Components (9 additional fields)

Found in `components/cards/ListingsCard.jsx` and `components/PublicView.jsx`:

| Field Name | File |
|------------|------|
| `'Borough/Region'` | ListingsCard |
| `'Location - Borough'` | Logic hook (listing mapping) |
| `'Features - Photos'` | Logic hook (listing mapping) |
| `'Monthly Host Rate'` | ListingsCard |
| `'Weekly Host Rate'` | ListingsCard |
| `'Start Nightly Price'` | ListingsCard |
| `'Qty of Bedrooms'` | ListingsCard |
| `'Qty of Bathrooms'` | ListingsCard |
| `'Good Guest Reasons'` | PublicView |

---

## Recommendations

### Immediate Actions
1. **Create field constant mappings** - Centralize Bubble field names in a constants file
2. **Verify "dead code" usage** - Check if the 7 potentially unused exports are used by child components

### Future Refactoring
1. **Field adapter layer** - Create processors to transform Bubble fields to internal naming
2. **Type definitions** - Add TypeScript interfaces for profile data shapes
3. **Remove truly dead code** - After verifying child component usage

---

## Files Changed
None - this was a read-only exploration task.
