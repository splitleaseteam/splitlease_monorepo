# Guest Proposal Flow - Detailed Test Reference

## Overview
Complete guest journey from landing page to proposal submission with rental application completion.

## Flow Diagram

```
Landing Page (/)
    ↓
Search/Browse Listings (/search)
    ↓
[Login/Signup Decision Point]
    ├─ Existing Account → Login
    └─ New User → Signup
    ↓
Select Listing
    ↓
View Listing Detail (/view-split-lease/:id)
    ↓
Click "Book" / "Create Proposal"
    ↓
CreateProposalFlowV2 Modal Opens
    ↓
[Flow Type Determined by Page Context]
    ├─ ViewSplitLeasePage → Short Flow (User Details → Review)
    └─ FavoriteListingsPage → Full Flow (User Details → Move-in → Days → Review)
    ↓
Submit Proposal
    ↓
RentalApplicationWizardModal Opens (7 steps)
    ↓
Submit Rental Application
    ↓
Success → Redirect to /guest-proposals
```

## Detailed Step Breakdown

### 1. Landing Page
- **URL**: `http://localhost:8000/`
- **Expected Elements**:
  - Header with navigation
  - Sign In / Sign Up buttons (if logged out)
  - Search bar or listing cards
  - Filter controls
- **Test Actions**:
  - Verify page loads
  - Check for listing cards
  - Take screenshot

### 2. Authentication

#### 2a. Signup (New User)
- **Trigger**: No test credentials available
- **URL**: `/signup` (or modal)
- **Form Fields**:
  - Email (required)
  - Password (required)
  - First Name (required)
  - Last Name (required)
  - Phone (optional)
- **Test Data**:
  - Email: `guest.test.{timestamp}@splitlease.com`
  - Password: `TestPass123!`
  - First Name: "Test"
  - Last Name: "Guest"
  - Phone: "555-0100"
- **Success Criteria**:
  - Account created
  - Auto-login or redirect to login
  - Username appears in header

#### 2b. Login (Existing User)
- **Trigger**: Test credentials available
- **URL**: `/login` (or modal)
- **Form Fields**:
  - Email: Use `TESTGUESTEMAILADDRESS`
  - Password: Use `TESTPASSWORD`
- **Success Criteria**:
  - Successful authentication
  - Redirect to previous page or search
  - Username appears in header
  - "Stay with Us" visible in navigation (guest account)

### 3. Browse Listings
- **URL**: `/search`
- **Expected Elements**:
  - Listing cards with:
    - Property image
    - Property name/address
    - Price information
    - Available days indicator
    - Click target (entire card or "View" button)
- **Test Actions**:
  - Identify first listing
  - Extract listing ID
  - Click on listing card
  - Verify navigation to detail page

### 4. Listing Detail Page
- **URL**: `/view-split-lease/:id`
- **Expected Elements**:
  - Property details
  - `ListingScheduleSelector` component (for selecting days/move-in)
  - Pricing display
  - "Book" or "Create Proposal" button
- **Test Actions**:
  - Select days (if not pre-selected)
  - Select move-in date (if not pre-selected)
  - Verify pricing updates
  - Click "Book" or "Create Proposal" button

### 5. Proposal Creation Flow (CreateProposalFlowV2)

#### Component: `CreateProposalFlowV2.jsx`
**Location**: `app/src/islands/shared/CreateProposalFlowV2.jsx`

#### Flow Variants:

##### Short Flow (ViewSplitLeasePage)
Used when days and move-in date are **already selected** on the listing page.

**Steps**:
1. User Details
2. Review

**Why Short?**: Days and move-in are pre-selected via `ListingScheduleSelector` on the listing page, so only user info needs to be collected.

##### Full Flow (FavoriteListingsPage)
Used when days and move-in date are **NOT pre-selected**.

**Steps**:
1. User Details
2. Move-in (select move-in date and reservation span)
3. Days Selection (select which days of the week)
4. Review

**Why Full?**: User hasn't selected days/move-in yet, so the modal must collect this info.

#### Step: User Details (Section 2)
- **Purpose**: Collect user's reason for needing space and personal info
- **Form Fields**:
  - `needForSpace` (textarea, required, min 10 words)
    - Label: "Need for Space"
    - Placeholder: "Why are you looking for this space?"
  - `aboutYourself` (textarea, required, min 10 words)
    - Label: "About Yourself"
    - Placeholder: "Tell the host about yourself"
  - `hasUniqueRequirements` (checkbox, optional)
    - Label: "I have unique requirements"
  - `uniqueRequirements` (textarea, conditional - only if checkbox checked)
    - Label: "Unique Requirements"
- **Validation**:
  - Both required fields must have at least 10 words
  - If `hasUniqueRequirements` is checked, `uniqueRequirements` must be filled
- **Test Data**:
  - Need for Space: "Looking for a comfortable and affordable place to stay during my work rotation in the city area."
  - About Yourself: "I am a quiet and responsible professional who values clean and peaceful living spaces always."
  - Unique Requirements: (leave unchecked for basic test)
- **Success Criteria**:
  - Validation passes
  - "Next" button enabled
  - Navigates to next section

#### Step: Move-in (Section 3) - Full Flow Only
- **Purpose**: Select move-in date and reservation span
- **Form Fields**:
  - `moveInDate` (date picker, required)
  - `reservationSpan` (dropdown, default 13 weeks)
  - `moveInRange` (optional flexibility field)
- **Test Data**:
  - Move-in Date: 7 days from today
  - Reservation Span: 13 weeks (default)
- **Success Criteria**:
  - Date selected
  - Pricing updates based on reservation span
  - Navigates to Days Selection

#### Step: Days Selection (Section 4) - Full Flow Only
- **Purpose**: Select which days of the week to stay
- **Component**: Embeds `ListingScheduleSelector`
- **Test Actions**:
  - Select days (e.g., Monday through Friday)
  - Verify pricing calculations update
  - Verify nights calculation (days - 1)
- **Success Criteria**:
  - At least 2 days selected (minimum nights)
  - Pricing valid and displayed
  - Navigates to Review

#### Step: Review (Section 1)
- **Purpose**: Confirm all proposal details before submission
- **Displays**:
  - User details (needForSpace, aboutYourself)
  - Move-in date
  - Selected days (with check-in/check-out days)
  - Pricing breakdown:
    - Price per night
    - Total nights (nights per week × reservation span)
    - Price per 4 weeks
    - Total reservation price
    - Damage deposit
    - Maintenance fee
    - First 4 weeks total
- **Edit Capabilities** (Hub-and-Spoke):
  - "Edit" buttons for each section
  - Clicking Edit takes user to that section
  - After editing, "Save & Review" returns to Review
- **Test Actions**:
  - Verify all data is correct
  - Check pricing calculations match expectations
  - Click "Submit Proposal"
- **Success Criteria**:
  - "Submit Proposal" button enabled
  - Submission succeeds without errors
  - Modal closes or transitions to next step

### 6. Rental Application Wizard (RentalApplicationWizardModal)

#### Component: `RentalApplicationWizardModal.jsx`
**Location**: `app/src/islands/shared/RentalApplicationWizardModal/RentalApplicationWizardModal.jsx`

#### Trigger
- May appear automatically after proposal submission
- Or accessible via "Complete Rental Application" button/link
- Navigate from guest proposals page if not automatic

#### 7-Step Wizard

##### Step 1: Personal Info (`PersonalInfoStep.jsx`)
**Fields**:
- First Name (may be pre-filled)
- Last Name (may be pre-filled)
- Email (may be pre-filled)
- Phone (may be pre-filled)

**Pre-fill Source**: User profile data from `user` table

**Test Data** (if empty):
- First Name: "Test"
- Last Name: "Guest"
- Email: `TESTGUESTEMAILADDRESS`
- Phone: "555-0100"

**Validation**: All fields required

##### Step 2: Address (`AddressStep.jsx`)
**Fields**:
- Current Address (with Google Places autocomplete)

**Component Features**:
- Uses `addressInputRef` for autocomplete integration
- May have autocomplete suggestions

**Test Data**:
- Address: "123 Test Street, New York, NY 10001"

**Test Actions**:
- Type address
- Wait for autocomplete (if available)
- Select from suggestions or complete manual entry

**Validation**: Valid address format required

##### Step 3: Occupants (`OccupantsStep.jsx`)
**Purpose**: List additional occupants who will stay

**Fields**:
- Occupant list (dynamic)
- Add/Remove occupant buttons
- For each occupant:
  - Name
  - Relationship (dropdown)
  - Age

**Component Props**:
- `occupants` - Array of occupant objects
- `onAddOccupant` - Handler to add occupant
- `onRemoveOccupant` - Handler to remove occupant
- `onUpdateOccupant` - Handler to update occupant data
- `maxOccupants` - Maximum allowed occupants
- `relationshipOptions` - Dropdown options

**Test Strategy**:
- Skip without adding occupants (optional step)
- Or add 1 test occupant:
  - Name: "Jane Doe"
  - Relationship: "Spouse"
  - Age: "30"

**Navigation**: Click "Skip" or "Continue"

##### Step 4: Employment (`EmploymentStep.jsx`)
**Fields**:
- Employment Status (dropdown)
- Employer Name (conditional - if employed)
- Job Title (conditional)
- Income (conditional)

**Component Props**:
- `employmentStatusOptions` - Dropdown options

**Test Data**:
- Employment Status: "Employed"
- Employer Name: "Test Company Inc."
- Job Title: "Software Engineer"
- Income: "75000"

**Conditional Logic**:
- If status = "Employed" → Show employer fields
- If status = "Self-Employed" → Show business fields
- If status = "Unemployed" → Hide employer fields

**Validation**: Employment status required, conditional fields required if shown

##### Step 5: Requirements (`RequirementsStep.jsx`)
**Purpose**: Special requirements or preferences

**Fields**:
- Requirements text area (optional)

**Test Data** (optional):
- "Non-smoking environment preferred. Quiet neighborhood. Close to public transportation."

**Navigation**: Can skip or fill

##### Step 6: Documents (`DocumentsStep.jsx`)
**Purpose**: Upload supporting documents

**Component Features**:
- File upload controls
- Progress indicators
- Error handling

**Component Props**:
- `uploadedFiles` - Array of uploaded file objects
- `uploadProgress` - Upload progress state
- `uploadErrors` - Upload error state
- `onFileUpload` - Handler for file upload
- `onFileRemove` - Handler for file removal

**Document Types**:
- Government ID
- Proof of Income
- Reference Letters
- Other

**Test Strategy**:
- Skip without uploading (optional step)
- Or upload test file (if upload functionality needs testing)

**Navigation**: Click "Review Application"

##### Step 7: Review & Submit (`ReviewStep.jsx`)
**Purpose**: Review all entered data and submit

**Component Props**:
- `formData` - All wizard form data
- `occupants` - Occupants array
- `fieldErrors` - Validation errors
- `onFieldChange` - Handler for last-minute edits
- `onFieldBlur` - Handler for field blur
- `onGoToStep` - Handler to jump to specific step
- `progress` - Completion progress percentage
- `canSubmit` - Boolean indicating if submission allowed

**Displays**:
- All entered data organized by step
- Edit buttons to jump back to specific steps
- Progress indicator (% complete)
- Validation errors highlighted

**Test Actions**:
- Verify all data matches what was entered
- Check for validation errors
- Verify `canSubmit` is true
- Click "Submit Application"

**Submission Behavior**:
- Button text: "Submit Application" (or "Submitting..." during submission)
- Button disabled while submitting (`isSubmitting` state)
- On success: `onSuccess` callback fires
- May close modal, show success message, or redirect

**Success Criteria**:
- Submission completes without errors
- Success confirmation displayed
- Data saved to database (rental application record created)

### 7. Success Verification

#### Expected Outcomes:
1. **Success Message/Modal**:
   - Toast notification with "Application Submitted" or similar
   - Modal with confirmation message

2. **Redirect**:
   - Navigate to `/guest-proposals` page
   - Or stay on listing page with updated status

3. **Proposals List**:
   - New proposal appears in guest's proposals list
   - Status: "Pending" or "Submitted"
   - Proposal data matches submitted data

4. **Database Verification** (optional):
   - Query `proposals` table to confirm record
   - Verify `rental_applications` table has new record

#### Test Actions:
- Check for success toast/modal
- Verify redirect occurred
- Take snapshot of proposals list page
- Verify new proposal in list
- Confirm proposal status is correct

## Edge Cases to Test

### 1. Existing Draft Data
- **Scenario**: User previously filled User Details but didn't submit
- **Expected**: Data should be loaded from localStorage
- **Test**: Clear localStorage first, then create draft, close modal, reopen

### 2. Returning User (Multiple Proposals)
- **Scenario**: User has submitted proposals before
- **Expected**: Flow should use hub-and-spoke model (start on Review)
- **Test**: Set `isFirstProposal={false}` or use account with existing proposals

### 3. Price Recalculation
- **Scenario**: User changes reservation span during flow
- **Expected**: Prices should recalculate automatically
- **Test**: In Move-in step, change reservation span dropdown

### 4. Validation Errors
- **Scenario**: User tries to proceed without filling required fields
- **Expected**: Toast warning appears, navigation blocked
- **Test**: Leave required fields empty, click Next

### 5. Modal Close During Submission
- **Scenario**: User clicks close (X) while proposal is submitting
- **Expected**: Modal should not close (disabled during submission)
- **Test**: Click submit, then immediately click close button

## Performance Checkpoints

- **Page Load Time**: Landing page should load < 2 seconds
- **Modal Open Time**: CreateProposalFlowV2 should appear < 500ms after button click
- **Pricing Calculation**: Should update < 200ms when days/span changes
- **Form Submission**: Proposal submission should complete < 3 seconds
- **Wizard Submission**: Rental application submission should complete < 3 seconds

## Common Failure Points

1. **Modal Event Propagation**: Clicking inside modal closes it (overlay click bubbling)
2. **Auth Token Expiry**: 401 errors if token expires during flow
3. **Pricing Sync Issues**: Pricing in Review doesn't match ListingScheduleSelector
4. **localStorage Conflicts**: Draft data from different listing IDs conflicting
5. **Wizard Step Navigation**: Can't go back or skip optional steps
6. **File Upload Failures**: Large files timeout or unsupported formats rejected
7. **Form Validation Race Conditions**: Submit button enabled before async validation completes

## Test Data Summary

### Guest Account
- **Email**: `guest.test.{timestamp}@splitlease.com` or `TESTGUESTEMAILADDRESS`
- **Password**: `TestPass123!` or `TESTPASSWORD`
- **First Name**: "Test"
- **Last Name**: "Guest"
- **Phone**: "555-0100"

### Proposal Data
- **Need for Space**: "Looking for a comfortable and affordable place to stay during my work rotation in the city area."
- **About Yourself**: "I am a quiet and responsible professional who values clean and peaceful living spaces always."
- **Move-in Date**: 7 days from today
- **Reservation Span**: 13 weeks
- **Days**: Monday through Friday (for standard 5-day week)

### Rental Application Data
- **Address**: "123 Test Street, New York, NY 10001"
- **Occupants**: (skip or add 1 test occupant)
- **Employment Status**: "Employed"
- **Employer**: "Test Company Inc."
- **Income**: "75000"
- **Requirements**: "Non-smoking environment preferred."
- **Documents**: (skip uploads)

## Success Metrics

- **Test Coverage**: All 7 wizard steps completed
- **Validation**: All required fields validated correctly
- **Data Integrity**: Submitted data matches entered data
- **Navigation**: All step transitions work correctly
- **Error Handling**: Errors displayed appropriately, don't crash app
- **Performance**: All actions complete within performance checkpoints
