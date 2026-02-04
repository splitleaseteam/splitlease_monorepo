# Bug Analysis Patterns - E2E Testing

## Common Bug Patterns in Split Lease

### 1. Modal Event Propagation Issues

#### Symptoms
- Modal closes unexpectedly when clicking inside it
- Click events on modal content trigger overlay click handler
- Modal disappears immediately after opening

#### Root Cause
- Click event bubbling from child elements to overlay
- Overlay has `onClick={onClose}` that catches all clicks
- Missing `e.stopPropagation()` on modal content container

#### Diagnosis Steps
1. Check if modal has overlay click handler: `onClick={handleOverlayClick}`
2. Verify modal content container has click handler to stop propagation
3. Look for pattern: `<div className="modal-overlay" onClick={handleOverlayClick}>`

#### Typical Fix Locations
- **CreateProposalFlowV2.jsx**: Modal overlay/container click handlers
- **RentalApplicationWizardModal.jsx**: Modal overlay/container click handlers
- Any custom modal components

#### Fix Pattern
```javascript
// Overlay handler - should check if click target is overlay itself
const handleOverlayClick = (e) => {
  if (e.target === e.currentTarget && !isSubmitting) {
    onClose?.();
  }
};

// Modal content container - should stop propagation
<div className="modal-content" onClick={(e) => e.stopPropagation()}>
  {/* Modal content */}
</div>
```

#### Verification
- Click inside modal content → Should NOT close
- Click outside modal (on overlay) → Should close
- Click on close button (X) → Should close

---

### 2. Authentication Errors (401 Unauthorized)

#### Symptoms
- API calls fail with 401 status code
- User suddenly logged out during flow
- "Unauthorized" error messages
- Redirect to login page mid-flow

#### Root Cause
- Auth token expired (default expiry: 1 hour)
- Token not included in request headers
- Token refresh logic not triggered
- Session invalidated on server side

#### Diagnosis Steps
1. Check browser network logs for failing requests
2. Verify `Authorization` header is present: `Bearer {token}`
3. Check token expiry in `localStorage` or `sessionStorage`
4. Review auth token refresh logic in `app/src/lib/auth.js`

#### Typical Fix Locations
- **app/src/lib/auth.js**: Token refresh logic, `getAuthHeaders()`
- **app/src/lib/supabase.js**: Supabase client configuration
- Edge function auth middleware: `supabase/functions/_shared/auth.ts`

#### Fix Pattern
```javascript
// Token refresh before API call
const getAuthHeaders = async () => {
  const session = await supabase.auth.getSession();
  if (session?.data?.session?.access_token) {
    return {
      'Authorization': `Bearer ${session.data.session.access_token}`,
      'Content-Type': 'application/json'
    };
  }
  throw new Error('No active session');
};

// Automatic token refresh (Supabase handles this automatically)
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed:', session);
  }
});
```

#### Verification
- Complete flow without 401 errors
- Check network logs for valid `Authorization` headers
- Test with expired token (wait 1+ hour)

---

### 3. Form Validation State Issues

#### Symptoms
- Submit button disabled despite valid fields
- Submit button enabled when fields are invalid
- Validation errors don't clear after fixing field
- "Next" button stuck in disabled state

#### Root Cause
- Validation state (`fieldValid`, `fieldErrors`) not updating correctly
- Async validation race conditions
- `canProceed` or `canSubmit` logic incorrect
- Form validation not triggered on field change

#### Diagnosis Steps
1. Check component state for `fieldValid`, `fieldErrors` objects
2. Verify validation logic in `handleInputChange`, `handleInputBlur`
3. Check `canProceed`, `canSubmit`, `canProceedFromCurrentStep` functions
4. Look for async validation that may not complete before state check

#### Typical Fix Locations
- **useRentalApplicationWizardLogic.js**: Wizard validation logic
- **CreateProposalFlowV2.jsx**: `validateCurrentSection()` function
- Step components: `PersonalInfoStep.jsx`, `EmploymentStep.jsx`, etc.

#### Fix Pattern
```javascript
// Validation on change
const handleInputChange = (field, value) => {
  // Update form data
  setFormData(prev => ({ ...prev, [field]: value }));

  // Validate field immediately
  const error = validateField(field, value);
  setFieldErrors(prev => ({ ...prev, [field]: error }));
  setFieldValid(prev => ({ ...prev, [field]: !error }));
};

// Validation on blur (for expensive checks)
const handleInputBlur = (field) => {
  const value = formData[field];
  const error = validateField(field, value);
  setFieldErrors(prev => ({ ...prev, [field]: error }));
  setFieldValid(prev => ({ ...prev, [field]: !error }));
};

// Can proceed logic
const canProceedFromCurrentStep = () => {
  const requiredFields = getRequiredFieldsForStep(currentStep);
  return requiredFields.every(field => fieldValid[field]);
};
```

#### Verification
- Fill valid data → Submit button enabled
- Fill invalid data → Submit button disabled
- Fix invalid field → Submit button becomes enabled
- Leave required field empty → Submit button disabled

---

### 4. Pricing Calculation Errors

#### Symptoms
- Price displayed doesn't match expected calculation
- Price shows $0 or NaN
- Price doesn't update when days/span changes
- Four-week rent doesn't match weekly rate × 4

#### Root Cause
- Incorrect night calculation (should be days - 1, not days)
- Missing price tier in listing data
- Reservation span not passed to calculation function
- ZAT config missing or incorrect
- Price override not applied

#### Diagnosis Steps
1. Check `calculatePrice` function inputs: `selectedNights`, `listing`, `reservationSpan`, `zatConfig`
2. Verify `calculateNightsFromDays` output (should be days - 1)
3. Check listing price fields: `💰Nightly Host Rate for X nights`, `💰Weekly Host Rate`
4. Verify `zatConfig` is loaded and valid
5. Check for `💰Price Override` field in listing

#### Typical Fix Locations
- **app/src/lib/scheduleSelector/priceCalculations.js**: `calculatePrice()` function
- **app/src/lib/scheduleSelector/nightCalculations.js**: `calculateNightsFromDays()` function
- **CreateProposalFlowV2.jsx**: Price recalculation `useEffect` hooks
- **ListingScheduleSelector.jsx**: Pricing state updates

#### Fix Pattern
```javascript
// Correct night calculation
const calculateNightsFromDays = (selectedDays) => {
  if (!selectedDays || selectedDays.length < 2) return [];

  // Nights = days - 1 (e.g., Mon-Fri = 5 days = 4 nights)
  const sortedDays = selectedDays.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  const nights = selectedDays.length - 1;

  return Array(nights).fill(null).map((_, index) => ({
    nightNumber: index + 1,
    checkInDay: sortedDays[index],
    checkOutDay: sortedDays[index + 1]
  }));
};

// Price calculation with all inputs
const pricingBreakdown = calculatePrice(
  selectedNights,
  pricingListing,  // Must include all pricing fields
  reservationSpan, // Must be number, default 13
  zatConfig        // Must be loaded from API/context
);
```

#### Verification
- Select 2 days → Price for 1 night
- Select 5 days (Mon-Fri) → Price for 4 nights
- Change reservation span → Price recalculates
- Compare four-week rent to weekly rate × 4

---

### 5. Element Not Found (Playwright)

#### Symptoms
- Playwright fails with "Element not found" error
- Selector doesn't match any elements
- Element exists visually but Playwright can't find it
- Timeout waiting for element

#### Root Cause
- Selector (ref) is incorrect or outdated
- Element not yet rendered (timing issue)
- Element hidden or disabled
- Dynamic content not loaded
- React hydration not complete

#### Diagnosis Steps
1. Take `browser_snapshot` to get current page structure
2. Verify element exists in snapshot output
3. Check if element has correct `ref` value
4. Look for loading states or conditional rendering
5. Check if element is in shadow DOM or iframe

#### Typical Fix Locations
- Playwright MCP commands: Update `ref` from latest snapshot
- React components: Check conditional rendering logic
- Test flow: Add wait/delay before interacting with element

#### Fix Pattern
```javascript
// Always take snapshot before interaction
await mcp_tool_specialist({
  action: 'browser_snapshot'
});
// Read snapshot output to get correct ref value

// Use wait_for to ensure element appears
await mcp_tool_specialist({
  action: 'browser_wait_for',
  params: { text: 'Submit Proposal', time: 5 }
});

// Then interact with element using correct ref
await mcp_tool_specialist({
  action: 'browser_click',
  params: {
    ref: 'button[data-testid="submit-proposal"]', // From snapshot
    element: 'Submit Proposal button'
  }
});
```

#### Verification
- Snapshot shows element with same ref
- Click/type action succeeds without timeout
- Element interaction triggers expected behavior

---

### 6. Network/Edge Function Errors

#### Symptoms
- API calls timeout
- Edge function returns 500 error
- Request fails with network error
- Function execution time exceeds limit

#### Root Cause
- Edge function timeout (default 10 seconds)
- Unhandled exception in function code
- Database query too slow
- Missing error handling
- CORS issues (OPTIONS preflight fails)

#### Diagnosis Steps
1. Check browser network logs: `browser_network_requests`
2. Check function logs: `supabase functions logs {function-name}`
3. Look for error stack traces in logs
4. Verify CORS headers in function response
5. Check database query performance

#### Typical Fix Locations
- **supabase/functions/{name}/index.ts**: Function handler code
- **supabase/functions/_shared/cors.ts**: CORS middleware
- **supabase/functions/_shared/errors.ts**: Error handling utilities
- Database: Optimize slow queries, add indexes

#### Fix Pattern
```typescript
// Proper error handling in edge function
Deno.serve(async (req) => {
  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Your function logic
    const data = await processRequest(req);

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        code: error.code || 'INTERNAL_ERROR'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.status || 500
      }
    );
  }
});
```

#### Verification
- API call completes within timeout
- Response has correct CORS headers
- Error responses have proper error structure
- Function logs show expected execution

---

### 7. Foreign Key Constraint Violations (Database)

#### Symptoms
- Database update fails with code `23503`
- Error message: "violates foreign key constraint"
- 409 Conflict status from Edge Function
- Update operation succeeds for new records but fails for legacy data

#### Root Cause
- Sending unchanged FK fields with null/invalid values in update payload
- Legacy data has null FK values that don't pass validation
- PostgREST validates all FK fields in request, even if unchanged
- Entire `formData` object sent instead of only changed fields

#### Diagnosis Steps
1. Check error code: `23503` = FK violation
2. Check error details for which FK constraint failed
3. Look at update payload - does it include unchanged FK fields?
4. Query database to check if record has null FK values
5. Check if update function sends `changedFields` or full `formData`

#### Typical Fix Locations
- **Update handlers**: Any function sending updates to Supabase
- **Form submit logic**: Extract only changed fields before sending
- **Edge functions**: Validate and filter update payloads

#### Fix Pattern
```javascript
// ❌ BAD - Sends all fields including unchanged FKs
const handleUpdate = async (id, formData) => {
  await updateListing(id, formData);
};

// ✅ GOOD - Only sends changed fields
const handleUpdate = async (id, formData, originalData) => {
  const changedFields = {};
  for (const [key, value] of Object.entries(formData)) {
    if (value !== originalData[key]) {
      changedFields[key] = value;
    }
  }
  await updateListing(id, changedFields);
};
```

#### Verification
- Update succeeds for records with null FK values
- Update only sends changed fields in payload
- No 409/23503 errors on edit flows
- Check database logs for successful updates

**Reference**: `.claude/plans/Documents/20251217091827-edit-listing-409-regression-report.md`

---

### 8. LocalStorage Data Persistence Issues

#### Symptoms
- Form data disappears after navigation
- User details not pre-filled on return visit
- Draft proposal lost after closing modal
- Duplicate data from different listings

#### Root Cause
- localStorage key collision (same key for different listings)
- localStorage not cleared after successful submission
- Data not saved on field change (missing save trigger)
- localStorage read before data is saved

#### Diagnosis Steps
1. Check browser localStorage in DevTools
2. Verify localStorage key includes unique identifier (listing ID)
3. Check when data is saved (on change, on blur, on step transition)
4. Check when data is cleared (on submit success)
5. Look for race conditions (read before write)

#### Typical Fix Locations
- **CreateProposalFlowV2.jsx**: Draft save/load logic
- **useRentalApplicationWizardLogic.js**: Auto-save logic
- Submit handlers: Clear draft on success

#### Fix Pattern
```javascript
// Unique localStorage key
const DRAFT_KEY_PREFIX = 'splitlease_proposal_draft_';
const getDraftKey = (listingId) => `${DRAFT_KEY_PREFIX}${listingId}`;

// Save on change (debounced)
useEffect(() => {
  const timeoutId = setTimeout(() => {
    if (formData.needForSpace || formData.aboutYourself) {
      localStorage.setItem(
        getDraftKey(listingId),
        JSON.stringify(formData)
      );
    }
  }, 500); // Debounce 500ms

  return () => clearTimeout(timeoutId);
}, [formData, listingId]);

// Load on mount
useEffect(() => {
  const savedDraft = localStorage.getItem(getDraftKey(listingId));
  if (savedDraft) {
    setFormData(JSON.parse(savedDraft));
  }
}, [listingId]);

// Clear on success
const handleSubmitSuccess = () => {
  localStorage.removeItem(getDraftKey(listingId));
  onSuccess();
};
```

#### Verification
- Fill form, close modal, reopen → Data restored
- Submit proposal → Draft cleared from localStorage
- Open different listing → No data from previous listing
- Check localStorage keys include listing ID

---

## Bug Analysis Checklist

When analyzing a bug from E2E testing:

- [ ] **Reproduce the bug**: Can you reliably reproduce it?
- [ ] **Capture evidence**: Screenshot, console logs, network logs
- [ ] **Identify category**: Which pattern above does it match?
- [ ] **Check recent changes**: Was this working before? What changed?
- [ ] **Review error details**: Error message, code, stack trace
- [ ] **Locate affected files**: Which components/functions are involved?
- [ ] **Propose fix**: What needs to change?
- [ ] **Estimate impact**: How many users affected? How critical?
- [ ] **Plan verification**: How will you verify the fix?

## Bug Report Template

```markdown
# Bug Report: {Short Title}

## Category
{Modal | Auth | Validation | Pricing | Playwright | Network | Database | LocalStorage}

## Severity
{Critical | High | Medium | Low}

## Description
{1-2 sentence description of the bug}

## Steps to Reproduce
1. {Step 1}
2. {Step 2}
3. ...

## Expected Behavior
{What should happen}

## Actual Behavior
{What actually happened}

## Error Details
- **Error Message**: {message}
- **Error Code**: {code}
- **Status Code**: {HTTP status}
- **Console Logs**:
  ```
  {console output}
  ```
- **Network Logs**:
  ```
  {network request/response}
  ```

## Evidence
- Screenshots: {filenames}
- Test Flow Step: {step number}

## Analysis
{Root cause analysis - reference pattern above if applicable}

## Affected Files
- {file path 1}
- {file path 2}

## Proposed Fix
{Describe the fix}

## Fix Implementation
```javascript
// Code changes
```

## Verification Steps
1. {Verification step 1}
2. {Verification step 2}

## Related Issues
- {Link to similar bugs or related docs}
```

## Debugging Tools Reference

### Browser Console
```javascript
// Check auth state
supabase.auth.getSession()

// Check localStorage
localStorage.getItem('splitlease_proposal_draft_{listingId}')

// Check form state (if using React DevTools)
$r.state  // Current component state
$r.props  // Current component props
```

### Playwright MCP Commands
```javascript
// Console messages
mcp__playwright__browser_console_messages({ level: 'error' })

// Network logs
mcp__playwright__browser_network_requests({ includeStatic: false })

// JavaScript execution
mcp__playwright__browser_evaluate({
  function: '() => localStorage.getItem("key")'
})
```

### Supabase Function Logs
```bash
# View function logs
supabase functions logs proposal --tail

# View function logs with errors only
supabase functions logs proposal | grep ERROR
```

### Database Queries
```sql
-- Check proposal data
SELECT * FROM proposals WHERE id = '{proposal_id}';

-- Check for null FK values
SELECT * FROM listing WHERE user_id IS NULL;

-- Check constraint violations
SELECT * FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY';
```
