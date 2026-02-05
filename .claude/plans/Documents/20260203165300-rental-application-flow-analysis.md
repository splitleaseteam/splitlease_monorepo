# Rental Application Flow Analysis

**Date**: 2026-02-03
**Status**: Complete Bug Analysis
**Severity**: Multiple Critical Bugs Identified

---

## Executive Summary

The rental application submission flow in Split Lease has multiple critical bugs that prevent users from completing their application. This document provides a complete map of the application flow, identifies all bugs, and traces data flow from frontend to backend.

---

## Application Flow Architecture

### Entry Points

1. **AccountProfilePage** (`app/src/islands/pages/AccountProfilePage/AccountProfilePage.jsx`)
   - Displays `RentalApplicationCard` component for guest users
   - Card shows 3 states: not_started, in_progress, submitted
   - Clicking "Start", "Continue", or "Review & Edit" opens wizard modal

2. **RentalApplicationCard** (`app/src/islands/pages/AccountProfilePage/components/RentalApplicationCard.jsx`)
   - Pure presentational component showing application status
   - Receives: `applicationStatus`, `progress`, `onOpenWizard` handler
   - NO business logic, just displays current state

### Wizard Modal System

**Component**: `RentalApplicationWizardModal.jsx`
**Location**: `app/src/islands/shared/RentalApplicationWizardModal/`

**Business Logic Hook**: `useRentalApplicationWizardLogic.js`
- Manages 7-step wizard flow
- Integrates with localStorage store from `RentalApplicationPage`
- Handles file uploads, validation, and submission

**7 Steps**:
1. **PersonalInfoStep** - Full name, DOB, email, phone (required)
2. **AddressStep** - Current address, length resided (required)
3. **OccupantsStep** - Add co-occupants (optional)
4. **EmploymentStep** - Employment status + conditional fields (required)
5. **RequirementsStep** - Pets, background checks (optional)
6. **DocumentsStep** - File uploads (optional) ⚠️ **BUG HERE**
7. **ReviewStep** - Sign and submit (required)

**Step Completion Logic**:
- Required steps: fields must be filled to show checkmark
- Optional steps: checkmark appears only after user VISITS the step (prevents premature checkmarks)
- Visited steps tracked via `visitedSteps` state array
- Completed steps tracked via `completedSteps` state array

---

## Critical Bug #1: File Upload Error - "loader is not defined"

### Location
`supabase/functions/rental-application/handlers/upload.ts` - **Line 148**

### Root Cause
Variable naming mismatch - TypeScript/JavaScript scoping error.

```typescript
// Line 136 - Variable declared with underscore prefix
const { data: _uploadData, error: uploadError } = await supabase.storage
  .from('rental-applications')
  .upload(storagePath, fileBytes, {
    contentType: input.mimeType,
    upsert: false,
  });

// Line 143-146 - Error check (correct)
if (uploadError) {
  console.error(`[RentalApp:upload] Upload failed:`, uploadError);
  throw new Error(`Failed to upload file: ${uploadError.message}`);
}

// Line 148 - Attempting to access wrong variable name
console.log(`[RentalApp:upload] File uploaded successfully:`, uploadData.path);
//                                                             ^^^^^^^^^^
//                                                        Should be: _uploadData
```

### Why This Breaks
- `_uploadData` is declared but never used
- `uploadData` (without underscore) doesn't exist in scope
- JavaScript throws ReferenceError: "uploadData is not defined"
- Error message says "loader" because this is wrapped in a FileReader context

### Fix Required
Replace `uploadData` with `_uploadData` on line 148:

```typescript
console.log(`[RentalApp:upload] File uploaded successfully:`, _uploadData.path);
```

### Impact
- **Severity**: Critical - Blocks all file uploads
- **User Experience**: Upload appears to hang, then shows cryptic error
- **Data Loss**: No files can be attached to rental application
- **Workaround**: None - file uploads completely broken

---

## Critical Bug #2: Profile Strength Not Updating After Submission

### Current Implementation

**Profile Strength Calculation** (`useAccountProfilePageLogic.js` lines 70-116):
```javascript
const milestones = useMemo(() => {
  return {
    isHost: isHostUser,
    firstListingCreated: hostListings.length > 0,
    rentalAppSubmitted: !!profileData?.['Rental Application']  // ← Checks user.Rental Application FK
  };
}, [isHostUser, hostListings, profileData]);

const profileStrength = useMemo(() => {
  // ... calculations using milestones
  return calculateProfileStrength(profileInfo, verifications, milestones);
}, [profileData, formData, verifications, milestones]);
```

**Rental App Submission** (`useRentalApplicationWizardLogic.js` lines 850-917):
```javascript
const handleSubmit = useCallback(async () => {
  // ... validation checks ...

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rental-application`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({
        action: 'submit',
        payload: {
          ...formData,
          occupants,
          verificationStatus,
          user_id: userId,
        },
      }),
    }
  );

  // Success handling
  resetStore();
  onSuccess?.();  // ← This closes modal and calls parent's handleRentalWizardSuccess
}, [/* deps */]);
```

**AccountProfilePage Success Handler** (`AccountProfilePage.jsx`):
```javascript
const handleRentalWizardSuccess = useCallback(() => {
  setShowRentalWizardModal(false);

  // Fetch updated profile data to reflect rental app submission
  if (profileUserId) {
    fetchProfileData(profileUserId);  // ← Refetches user table
    fetchRentalApplicationStatus(profileUserId); // ← Refetches rental app status
  }

  // Show success toast (temporary visible feedback)
  // ...
}, [profileUserId, fetchProfileData, fetchRentalApplicationStatus]);
```

### The Problem

**Missing Link**: The rental application Edge Function (`submit` action) creates/updates the `rentalapplication` record but does **NOT update** the `user` table's `Rental Application` foreign key field.

**Expected Flow**:
1. User submits rental application
2. Edge Function creates `rentalapplication` record (gets new ID)
3. Edge Function updates `user.Rental Application = rentalApplicationId` ← **THIS STEP IS MISSING**
4. AccountProfilePage refetches user data
5. Profile strength recalculates and shows 25% increase

**Actual Flow**:
1. User submits rental application
2. Edge Function creates `rentalapplication` record
3. **user.Rental Application remains NULL**
4. AccountProfilePage refetches user data (but FK is still NULL)
5. `milestones.rentalAppSubmitted` still evaluates to `false`
6. Profile strength doesn't increase

### Fix Required

**Option A: Update in Edge Function** (Recommended)

Modify `supabase/functions/rental-application/handlers/submit.ts` to update the user table after creating the rental application:

```typescript
// After successfully creating rentalapplication record
const { data: rentalApp, error: insertError } = await supabase
  .from('rentalapplication')
  .insert(payload)
  .select()
  .single();

if (insertError) {
  throw new Error(`Failed to create rental application: ${insertError.message}`);
}

// NEW: Update user.Rental Application FK
const { error: userUpdateError } = await supabase
  .from('user')
  .update({ 'Rental Application': rentalApp._id })
  .eq('_id', userId);

if (userUpdateError) {
  console.error('[RentalApp:submit] Failed to update user FK:', userUpdateError);
  // Non-critical - don't fail the whole operation
}

return rentalApp;
```

**Option B: Database Trigger** (More robust)

Create a PostgreSQL trigger that automatically updates `user.Rental Application` when a new `rentalapplication` record is inserted:

```sql
CREATE OR REPLACE FUNCTION update_user_rental_app_fk()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE "user"
  SET "Rental Application" = NEW._id
  WHERE "_id" = NEW."user id";
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rental_app_created
AFTER INSERT ON rentalapplication
FOR EACH ROW
EXECUTE FUNCTION update_user_rental_app_fk();
```

### Impact
- **Severity**: High - Misleading user feedback
- **User Experience**: Profile strength doesn't update, "Complete rental application" remains in next actions
- **Data Integrity**: Rental application exists but orphaned (no FK link from user)
- **Workaround**: Manual database update

---

## Critical Bug #3: Progress Not Saving / Sections Don't Get Checkmarks

### Current Behavior
- User fills out a step and clicks "Continue"
- Step does NOT show checkmark indicator
- User navigates back and sees fields are filled, but no visual confirmation
- Progress bar on RentalApplicationCard doesn't update

### Root Cause Analysis

**Step Completion Tracking** (`useRentalApplicationWizardLogic.js` lines 516-587):

```javascript
// Track when user LEAVES a step (marks it as visited)
const previousStepRef = useRef(currentStep);

useEffect(() => {
  const previousStep = previousStepRef.current;

  // When step changes, mark PREVIOUS step as visited
  if (previousStep !== currentStep && !visitedSteps.includes(previousStep)) {
    setVisitedSteps(prev => [...prev, previousStep]);
  }

  previousStepRef.current = currentStep;
}, [currentStep, visitedSteps, applicationStatus]);

// Calculate completed steps
useEffect(() => {
  const newCompleted = [];
  for (let step = 1; step <= TOTAL_STEPS; step++) {
    if (checkStepComplete(step, visitedSteps)) {
      newCompleted.push(step);
    }
  }
  setCompletedSteps(prev => {
    const isSame = prev.length === newCompleted.length &&
      prev.every((v, i) => v === newCompleted[i]);
    return isSame ? prev : newCompleted;
  });
}, [formData, visitedSteps, checkStepComplete, applicationStatus]);

// Check if step has required fields filled
const checkStepComplete = useCallback((stepNumber, visitedStepsArray) => {
  let stepFields = [...STEP_FIELDS[stepNumber]];

  // Add conditional employment fields for step 4
  if (stepNumber === 4 && formData.employmentStatus) {
    const conditionalFields = CONDITIONAL_REQUIRED_FIELDS[formData.employmentStatus] || [];
    stepFields = [...stepFields, ...conditionalFields];
  }

  // For optional steps (3, 5, 6): only show complete if visited
  if (stepFields.length === 0) {
    return visitedStepsArray.includes(stepNumber);  // ← PROBLEM HERE
  }

  // Check all required fields have values
  return stepFields.every(field => {
    const value = formData[field];
    return value !== undefined && value !== null && value !== '';
  });
}, [formData]);
```

**The Issue**: Optional steps (3=Occupants, 5=Requirements, 6=Documents) only show as complete if:
1. User has visited them (navigated away)
2. No required fields (since they're optional)

But for **required steps** (1, 2, 4, 7), the checkmark should appear as soon as fields are filled, even if user hasn't left the step yet. Currently, the logic treats all steps the same.

### Expected Behavior

**Checkmark Logic**:
- **Required steps with filled fields**: Show checkmark immediately (don't wait for step navigation)
- **Optional steps that were visited**: Show checkmark after user navigates away (current behavior is correct)
- **Optional steps not visited**: No checkmark (current behavior is correct)

**Progress Persistence**:
- Form data is saved to localStorage automatically via Zustand store
- Progress calculation happens on every field change
- RentalApplicationCard should reflect current progress

### The Real Problem: State Not Syncing Between Components

**Data Flow**:
1. User fills fields in wizard modal → updates `formData` in hook
2. Hook calculates `progress` (0-100%)
3. User closes modal without submitting
4. AccountProfilePage still shows old `progress` value from initial state

**AccountProfilePage State** (`useAccountProfilePageLogic.js`):
```javascript
const [rentalApplicationProgress, setRentalApplicationProgress] = useState(0);

// Fetches rental app status from database (for submitted apps only)
const fetchRentalApplicationStatus = useCallback(async (userId) => {
  // ... fetches from rentalapplication table
  // Only updates if application is submitted
}, []);
```

**The Missing Connection**:
- Wizard calculates progress dynamically from localStorage
- AccountProfilePage only fetches progress from **database** (for submitted apps)
- **No bridge between wizard's runtime progress and AccountProfilePage display**

### Fix Required

**Option A: Pass Progress Back to Parent**

Modify wizard modal to pass progress updates to parent:

```javascript
// RentalApplicationWizardModal.jsx
const RentalApplicationWizardModal = ({ onProgressUpdate, ...props }) => {
  const logic = useRentalApplicationWizardLogic({ ...props });

  // Notify parent when progress changes
  useEffect(() => {
    onProgressUpdate?.(logic.progress);
  }, [logic.progress, onProgressUpdate]);

  // ... rest of component
};

// AccountProfilePage.jsx
const handleProgressUpdate = useCallback((newProgress) => {
  setRentalApplicationProgress(newProgress);
}, []);

<RentalApplicationWizardModal
  onProgressUpdate={handleProgressUpdate}
  // ... other props
/>
```

**Option B: Read from Shared Store**

AccountProfilePage could directly read from the same localStorage store the wizard uses:

```javascript
// useAccountProfilePageLogic.js
import { useRentalApplicationStore } from '../RentalApplicationPage/store/index.ts';

// Inside hook
const rentalAppStore = useRentalApplicationStore();
const calculatedProgress = calculateProgressFromStore(rentalAppStore.formData);
```

**Option C: Real-Time Progress Sync**

Add a database field for draft progress and sync it:

```javascript
// After each step completion
await supabase
  .from('rentalapplication')
  .update({ draft_progress: calculatedProgress })
  .eq('user id', userId);
```

### Impact
- **Severity**: Medium - Confusing UX but doesn't block completion
- **User Experience**: Users don't see visual feedback for completed steps
- **Data Loss**: None - data is saved, just not displayed correctly
- **Workaround**: Check field values directly

---

## Data Flow Diagram

### File Upload Flow (With Bug)

```
┌─────────────────────────────────────────────────────────────────┐
│ DocumentsStep.jsx                                               │
│ User selects file → FileReader converts to base64              │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ useRentalApplicationWizardLogic.js                              │
│ handleFileUpload() - Packages file data                         │
│ → Validates size/type                                           │
│ → Converts to base64                                            │
│ → Sets uploadProgress[uploadKey] = 'uploading'                  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ POST /functions/v1/rental-application                           │
│ Action: upload                                                  │
│ Payload: { fileType, fileName, fileData, mimeType, user_id }   │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ supabase/functions/rental-application/handlers/upload.ts        │
│ 1. Validates file type, MIME type, size                         │
│ 2. Decodes base64 → Uint8Array                                  │
│ 3. Generates storage path: {userId}/{fileType}/{timestamp}_{filename}│
│ 4. Uploads to Supabase Storage bucket 'rental-applications'     │
│    const { data: _uploadData, error } = await storage.upload()  │
│ 5. ⚠️ BUG: console.log(uploadData.path) ← undefined variable   │
│    Should be: _uploadData.path                                  │
│ 6. Creates signed URL (1 year expiry)                           │
│ 7. Returns { url, path, fileType }                              │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ useRentalApplicationWizardLogic.js                              │
│ handleFileUpload() - Handles response                           │
│ → setUploadedFiles({ [uploadKey]: file })                      │
│ → updateFormData({ [urlField]: result.data.url })              │
│ → setUploadProgress({ [uploadKey]: 'complete' })               │
└─────────────────────────────────────────────────────────────────┘
```

### Submission Flow (With FK Bug)

```
┌─────────────────────────────────────────────────────────────────┐
│ ReviewStep.jsx                                                  │
│ User signs application → clicks "Submit Application"            │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ useRentalApplicationWizardLogic.js                              │
│ handleSubmit() - Validates and submits                          │
│ → Checks progress >= 80% and signature present                  │
│ → Packages formData + occupants + verificationStatus            │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ POST /functions/v1/rental-application                           │
│ Action: submit                                                  │
│ Payload: { ...formData, occupants, verificationStatus, user_id }│
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ supabase/functions/rental-application/handlers/submit.ts        │
│ 1. Validates required fields                                    │
│ 2. Creates/updates rentalapplication record                     │
│    INSERT INTO rentalapplication (...) VALUES (...)             │
│    Returns: { _id: newRentalAppId, ... }                        │
│ 3. ⚠️ MISSING: Update user.Rental Application = newRentalAppId │
│ 4. Returns success response                                     │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ useRentalApplicationWizardLogic.js                              │
│ → Transitions SL proposals from "Awaiting Rental App" to "Host Review"│
│ → Clears localStorage store (resetStore())                      │
│ → Calls onSuccess() callback                                    │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ AccountProfilePage (handleRentalWizardSuccess)                  │
│ 1. Closes wizard modal                                          │
│ 2. Refetches user data: fetchProfileData(profileUserId)         │
│    → SELECT * FROM user WHERE _id = userId                      │
│    → ⚠️ user.Rental Application is still NULL (FK not updated)  │
│ 3. Refetches rental app status                                  │
│ 4. Profile strength recalculates:                               │
│    → milestones.rentalAppSubmitted = !!profileData['Rental Application']│
│    → ⚠️ Still evaluates to false (FK is NULL)                   │
│    → Profile strength doesn't increase by 25%                   │
│ 5. Shows success toast (temporary feedback)                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Locations Reference

### Frontend Components
```
app/src/islands/pages/
├── AccountProfilePage/
│   ├── AccountProfilePage.jsx              - Main page component
│   ├── useAccountProfilePageLogic.js       - Business logic hook (profile strength calculation)
│   └── components/
│       └── RentalApplicationCard.jsx       - Card showing rental app status

app/src/islands/shared/RentalApplicationWizardModal/
├── RentalApplicationWizardModal.jsx        - Main wizard modal
├── useRentalApplicationWizardLogic.js      - Wizard business logic (file upload, submission)
├── StepIndicator.jsx                        - Step progress indicator
└── steps/
    ├── PersonalInfoStep.jsx                 - Step 1
    ├── AddressStep.jsx                      - Step 2
    ├── OccupantsStep.jsx                    - Step 3
    ├── EmploymentStep.jsx                   - Step 4
    ├── RequirementsStep.jsx                 - Step 5
    ├── DocumentsStep.jsx                    - Step 6 (file upload UI)
    └── ReviewStep.jsx                       - Step 7 (final review + sign)
```

### Backend Edge Functions
```
supabase/functions/rental-application/
├── index.ts                                 - Main router (action dispatcher)
└── handlers/
    ├── submit.ts                            - Handle rental app submission
    ├── get.ts                               - Fetch existing rental app
    └── upload.ts                            - ⚠️ File upload handler (BUG HERE)
```

### Database Tables
```
public.user
├── _id (PK)
├── Rental Application (FK → rentalapplication._id)  ← MISSING UPDATE
├── Name - First
├── Name - Last
├── Email
├── Phone Number (as text)
├── Date of Birth
├── is email confirmed
├── Verify - Phone
├── user verified?
├── Verify - Linked In ID
└── ... (other fields)

public.rentalapplication
├── _id (PK)
├── user id (FK → user._id)
├── full name
├── dob
├── email
├── phone
├── current address
├── length resided
├── employment status
├── employer name
├── job title
├── monthly income
├── proof of employment url
├── credit score url
├── state id front url
├── government id url
├── signature
└── ... (other fields)
```

---

## Recommended Fix Priority

### 1. CRITICAL - File Upload Bug (upload.ts line 148)
**Effort**: 1 line change
**Impact**: Unblocks all file uploads immediately
**Risk**: None - simple variable rename

### 2. HIGH - Profile Strength Update (submit.ts + user table FK)
**Effort**: 5-10 lines of code OR database trigger
**Impact**: Accurate user feedback, proper milestone tracking
**Risk**: Low - FK update is idempotent

### 3. MEDIUM - Step Completion Visual Feedback
**Effort**: Refactor step completion logic (~50 lines)
**Impact**: Better UX, clear progress indication
**Risk**: Low - only affects UI rendering

### 4. LOW - Progress Sync Between Wizard and Profile Page
**Effort**: Add callback or shared store integration
**Impact**: Real-time progress updates on profile page
**Risk**: Low - non-blocking enhancement

---

## Testing Checklist

### File Upload
- [ ] Upload employment proof PDF (should succeed)
- [ ] Upload government ID image (should succeed)
- [ ] Upload file > 10MB (should fail with clear error)
- [ ] Upload unsupported file type (should fail with clear error)
- [ ] Verify signed URL is returned and accessible

### Submission Flow
- [ ] Submit new application (verify rentalapplication record created)
- [ ] Verify user.Rental Application FK is updated
- [ ] Check profile strength increases by 25%
- [ ] Verify "Complete rental application" is removed from next actions
- [ ] Test proposal status transition (Awaiting Rental App → Host Review)

### Step Completion
- [ ] Fill step 1 fields → verify checkmark appears
- [ ] Navigate to step 3 (optional) → skip → verify checkmark appears
- [ ] Navigate to step 6 → upload file → continue → verify checkmark
- [ ] Close wizard mid-flow → reopen → verify progress preserved

---

## Related Files for Context

### Profile Strength System
- `app/src/islands/pages/AccountProfilePage/useAccountProfilePageLogic.js` (lines 32-202)
  - `PROFILE_STRENGTH_WEIGHTS` - Point values for each criterion
  - `calculateProfileStrength()` - Core calculation function
  - `generateNextActions()` - Suggests missing profile items

### Rental App Store
- `app/src/islands/pages/RentalApplicationPage/store/index.ts`
  - Zustand store for form state persistence
  - Auto-saves to localStorage on every change
  - Shared between standalone RentalApplicationPage and wizard modal

### Field Mapping
- `app/src/islands/pages/RentalApplicationPage/utils/rentalApplicationFieldMapper.ts`
  - Maps between database column names and form field names
  - Used when loading existing application for editing

---

## Additional Notes

### Why Two Rental Application UIs?

1. **Standalone Page** (`/rental-application`)
   - Legacy route, redirects to `/account-profile?section=rental-application`
   - Kept for backward compatibility with old links/bookmarks

2. **Wizard Modal** (embedded in AccountProfilePage)
   - Current implementation, better UX integration
   - Shares same store/logic as standalone page
   - Can be opened from proposal flows, account profile, etc.

### Storage Bucket Configuration

The Edge Function expects a Supabase Storage bucket named `rental-applications`:
- **Public**: No (files are private, accessed via signed URLs)
- **File Size Limit**: 10MB
- **Allowed MIME Types**: image/jpeg, image/png, image/webp, application/pdf
- **Path Structure**: `{userId}/{fileType}/{timestamp}_{filename}`
- **Signed URL Expiry**: 1 year

### Day Indexing Convention

Throughout the codebase, day indices use JavaScript's 0-based standard:
- 0 = Sunday, 1 = Monday, ..., 6 = Saturday
- Database stores days in this format (no conversion needed)
- Bubble API uses 1-based (1=Sunday, 7=Saturday) but rental app doesn't interact with Bubble

---

**End of Analysis**
