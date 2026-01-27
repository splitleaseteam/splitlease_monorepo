# Debug Analysis: House Rules Not Persisted in Counteroffer Flow

**Created**: 2026-01-24T14:15:00Z
**Status**: Analysis Complete - Pending Implementation
**Severity**: High
**Affected Area**: Host Counteroffer Submission / Guest Compare Terms Modal

## 1. System Context (From Onboarding)

### 1.1 Architecture Understanding
- **Architecture Pattern**: Islands Architecture with Hollow Components
- **Tech Stack**: React 18 (Frontend), Supabase Edge Functions (Backend), PostgreSQL (Database)
- **Data Flow**:
  ```
  HostEditingProposal (select house rules)
    -> useHostProposalsPageLogic.handleCounteroffer()
    -> supabase.functions.invoke('proposal', { action: 'update' })
    -> proposal/actions/update.ts (Edge Function)
    -> proposal table UPDATE
  ```

### 1.2 Domain Context
- **Feature Purpose**: Allow hosts to modify proposal terms (including house rules) in a counteroffer
- **Related Documentation**: `.claude/Documentation/Backend(EDGE - Functions)/PROPOSAL.md`
- **Data Model**:
  - `proposal` table stores both original terms and `hc_*` (host counteroffer) fields
  - House rules are stored as arrays of rule IDs
  - `hc house rules` column should store the counteroffer house rules

### 1.3 Relevant Conventions
- **Field Naming**: Database uses space-separated names (e.g., `"hc house rules"`)
- **Edge Function Input**: Uses snake_case (e.g., `hc_house_rules`)
- **Frontend**: Uses camelCase (e.g., `newHouseRules`)
- **Hollow Component Pattern**: Logic hooks handle all business logic, UI components only render

### 1.4 Entry Points & Dependencies
- **Host Entry Point**: `HostProposalsPage` -> `HostEditingProposal` component
- **Guest Entry Point**: `GuestProposalsPage` -> `CompareTermsModal` component
- **Critical Path**:
  1. Host selects house rules in `HostEditingProposal`
  2. Host clicks Submit -> `onCounteroffer` callback fires
  3. `useHostProposalsPageLogic.handleCounteroffer()` transforms data
  4. Edge Function `proposal/actions/update.ts` persists to database
  5. Guest views `CompareTermsModal` which reads from proposal

## 2. Problem Statement

House rules selected by the host during counteroffer submission are NOT being saved to the database, resulting in "None specified" display on the guest's Compare Terms modal.

**Symptoms**:
1. Host selects house rules in the editing UI
2. Logs show "Converted payload with ALL hc_ fields" - but house rules are NOT in the payload
3. Database column `"hc house rules"` remains empty/null
4. Guest sees "None specified" in Compare Terms modal

**Impact**: Guests cannot see which house rules apply to the counteroffer, leading to confusion and potential booking disputes.

## 3. Reproduction Context

- **Environment**: Production (project ref: qzsmhgyojmwvtjmnrdea)
- **Proposal ID**: 1769130751870x21602817865937584
- **Steps to reproduce**:
  1. Host navigates to Host Proposals page
  2. Host clicks on a proposal to review
  3. Host clicks "Edit Proposal" to enter editing mode
  4. Host selects house rules in the House Rules multi-select
  5. Host clicks "Update Proposal" then "Submit"
  6. Guest navigates to Guest Proposals page
  7. Guest opens Compare Terms modal for the counteroffered proposal
  8. House rules show "None specified" despite host selection

- **Expected behavior**: House rules selected by host should appear in the Compare Terms modal
- **Actual behavior**: House rules always show "None specified"

## 4. Investigation Summary

### 4.1 Files Examined

| File | Relevance |
|------|-----------|
| `app/src/islands/shared/HostEditingProposal/HostEditingProposal.jsx` | **ROOT CAUSE 1**: Sends `newHouseRules` to callback (line 269) |
| `app/src/islands/pages/HostProposalsPage/useHostProposalsPageLogic.js` | **ROOT CAUSE 2**: `handleCounteroffer` does NOT extract or map `newHouseRules` (lines 847-986) |
| `supabase/functions/proposal/actions/update.ts` | **ROOT CAUSE 3**: Does NOT handle `hc_house_rules` field (no mapping exists) |
| `app/src/islands/modals/CompareTermsModal.jsx` | Guest UI - displays house rules |
| `app/src/islands/modals/useCompareTermsModalLogic.js` | **ROOT CAUSE 4**: Does NOT read `hc house rules` field (lines 218-222) |

### 4.2 Execution Flow Trace

```
1. HostEditingProposal.handleConfirmProceed() (line 260-271)
   - Builds counteroffer object with `newHouseRules: editedHouseRules`
   - Calls onCounteroffer(counterofferPayload)

2. useHostProposalsPageLogic.handleCounteroffer() (line 847-986)
   - Destructures: { proposal, numberOfWeeks, checkIn, checkOut, nightsSelected, daysSelected, moveInDate }
   - MISSING: Does NOT destructure `newHouseRules` from counterofferData
   - Builds payload with hc_* fields but NO hc_house_rules
   - Sends to Edge Function

3. proposal/actions/update.ts (lines 214-265)
   - Maps hc_* input fields to database columns
   - MISSING: No mapping for hc_house_rules -> "hc house rules"

4. useCompareTermsModalLogic (lines 218-222)
   - Gets house rules: `proposal?.houseRules || proposal?.listing?.houseRules || []`
   - MISSING: Does NOT check for `proposal?.['hc house rules']` counteroffer field
```

### 4.3 Git History Analysis

No recent commits affecting the house rules flow were found. This appears to be an **incomplete feature implementation** rather than a regression.

## 5. Hypotheses

### Hypothesis 1: Missing Field Mapping in Frontend Handler (Likelihood: 100%)

**Theory**: `useHostProposalsPageLogic.handleCounteroffer()` does not extract or map the `newHouseRules` field from the counteroffer data to the Edge Function payload.

**Supporting Evidence**:
- Line 851-858: Destructures counterofferData but does NOT include `newHouseRules`
- Line 907-926: Builds payload with all `hc_*` fields but NO `hc_house_rules`
- Log message says "Converted payload with ALL hc_ fields" but house rules are missing

**Contradicting Evidence**: None

**Verification Steps**:
1. Add `newHouseRules` to destructuring on line 851
2. Add `hc_house_rules` to payload on line 907-926
3. Test counteroffer submission and verify house rules in logs

**Potential Fix**:
```javascript
// Line 851-858: Add newHouseRules to destructuring
const {
  proposal,
  numberOfWeeks,
  checkIn,
  checkOut,
  nightsSelected,
  daysSelected,
  newHouseRules,  // ADD THIS
  moveInDate
} = counterofferData;

// Line 907-926: Add hc_house_rules to payload
const payload = {
  // ... existing fields ...
  hc_house_rules: newHouseRules?.map(rule => rule.id || rule._id) || [],  // ADD THIS
};
```

**Convention Check**: Aligns with existing `hc_*` field pattern in the payload.

---

### Hypothesis 2: Missing Field Handler in Edge Function (Likelihood: 100%)

**Theory**: The Edge Function `proposal/actions/update.ts` does not map `hc_house_rules` input to the database column `"hc house rules"`.

**Supporting Evidence**:
- Lines 214-265 map various `hc_*` fields but NO mapping for `hc_house_rules`
- Database column `"hc house rules"` exists (used in `create.ts` line 469)
- Other `hc_*` fields like `hc_nightly_price`, `hc_days_selected` are mapped

**Contradicting Evidence**: None

**Verification Steps**:
1. Add input type definition for `hc_house_rules` in `lib/types.ts`
2. Add mapping in `update.ts` for `hc_house_rules` -> `"hc house rules"`
3. Test by sending counteroffer with house rules and verify database update

**Potential Fix**:
```typescript
// In update.ts, add after line 264:
if (input.hc_house_rules !== undefined) {
  updates["hc house rules"] = input.hc_house_rules;
  updatedFields.push("hc_house_rules");
}
```

**Convention Check**: Follows exact pattern of other `hc_*` field mappings in the same file.

---

### Hypothesis 3: Missing Field Read in Compare Terms Modal (Likelihood: 100%)

**Theory**: The Compare Terms modal reads house rules from `proposal.houseRules` or `listing.houseRules` but does NOT check the counteroffer field `proposal['hc house rules']`.

**Supporting Evidence**:
- Lines 218-222 in `useCompareTermsModalLogic.js`:
  ```javascript
  const houseRules = useMemo(() => {
    const rules = proposal?.houseRules || proposal?.listing?.houseRules || [];
    return Array.isArray(rules) ? rules : [];
  }, [proposal]);
  ```
- Does NOT check for `proposal?.['hc house rules']`
- Other processors (e.g., `processProposalData.js` line 93-95) DO handle counteroffer house rules

**Contradicting Evidence**: None

**Verification Steps**:
1. Update `useCompareTermsModalLogic.js` to check `proposal['hc house rules']` first
2. Test by viewing Compare Terms modal for a proposal with counteroffer house rules

**Potential Fix**:
```javascript
// Get house rules - prioritize counteroffer if present
const houseRules = useMemo(() => {
  const hasCounteroffer = proposal?.['counter offer happened'];
  const hcRules = proposal?.['hc house rules'] || proposal?.hcHouseRules;

  if (hasCounteroffer && hcRules && Array.isArray(hcRules) && hcRules.length > 0) {
    return hcRules;
  }

  const rules = proposal?.houseRules || proposal?.['House Rules'] || proposal?.listing?.houseRules || [];
  return Array.isArray(rules) ? rules : [];
}, [proposal]);
```

**Convention Check**: Follows pattern used in `processProposalData.js` lines 93-95.

---

### Hypothesis 4: Query Not Selecting hc house rules (Likelihood: 80%)

**Theory**: The `fetchProposalsForListing` query in `useHostProposalsPageLogic.js` may not be selecting the `"hc house rules"` column.

**Supporting Evidence**:
- Lines 491-537 show the SELECT query
- The query selects many `hc_*` fields but does NOT include `"hc house rules"`

**Contradicting Evidence**: Even if added to the query, the other issues (Hypotheses 1-3) would still prevent proper flow.

**Verification Steps**:
1. Add `"hc house rules"` to the SELECT query
2. This is necessary for the guest Compare Terms modal to display the data

**Potential Fix**:
```javascript
// Add to the SELECT statement around line 533:
"hc house rules",
```

**Convention Check**: Follows pattern of other fields in the query.

## 6. Recommended Action Plan

### Priority 1 (Fix All 4 Issues - Complete Chain)

The fix requires changes in 4 files to complete the data flow:

#### Step 1: Frontend Handler (useHostProposalsPageLogic.js)

**File**: `app/src/islands/pages/HostProposalsPage/useHostProposalsPageLogic.js`

1. Add `newHouseRules` to destructuring (around line 858):
   ```javascript
   const {
     proposal,
     numberOfWeeks,
     checkIn,
     checkOut,
     nightsSelected,
     daysSelected,
     newHouseRules,  // ADD THIS
     moveInDate
   } = counterofferData;
   ```

2. Add `hc_house_rules` to payload (around line 926):
   ```javascript
   const payload = {
     // ... existing fields ...

     // House rules - convert to array of IDs
     hc_house_rules: Array.isArray(newHouseRules)
       ? newHouseRules.map(rule => rule.id || rule._id || rule).filter(Boolean)
       : []
   };
   ```

3. Add `"hc house rules"` to SELECT query (around line 533):
   ```javascript
   "hc house rules",
   ```

#### Step 2: Edge Function (update.ts)

**File**: `supabase/functions/proposal/actions/update.ts`

Add mapping after line 264:
```typescript
if (input.hc_house_rules !== undefined) {
  updates["hc house rules"] = input.hc_house_rules;
  updatedFields.push("hc_house_rules");
}
```

Also add to type definitions in `lib/types.ts`:
```typescript
// In UpdateProposalInput interface:
hc_house_rules?: string[];
```

#### Step 3: Compare Terms Modal (useCompareTermsModalLogic.js)

**File**: `app/src/islands/modals/useCompareTermsModalLogic.js`

Update lines 218-222:
```javascript
// Get house rules - prioritize counteroffer values if present
const houseRules = useMemo(() => {
  const hasCounteroffer = proposal?.['counter offer happened'];
  const hcRules = proposal?.['hc house rules'] || proposal?.hcHouseRules;

  if (hasCounteroffer && Array.isArray(hcRules) && hcRules.length > 0) {
    return hcRules;
  }

  const rules = proposal?.houseRules || proposal?.['House Rules'] || proposal?.listing?.houseRules || [];
  return Array.isArray(rules) ? rules : [];
}, [proposal]);
```

### Priority 2 (If Priority 1 Fails)

If the fix does not work after implementing all 4 changes:
1. Check database column `"hc house rules"` exists and has correct type (JSONB array)
2. Check if RLS policies are blocking the update
3. Add extensive logging to trace the exact field values at each step

### Priority 3 (Deeper Investigation)

If still not working:
1. Query the database directly to verify if the data is being written
2. Check Supabase Edge Function logs for any validation errors
3. Verify the house rules format matches what the database expects

## 7. Prevention Recommendations

1. **Add End-to-End Test**: Create a test that submits a counteroffer with house rules and verifies they appear in the Compare Terms modal

2. **Field Mapping Checklist**: When adding new counteroffer fields, ensure:
   - Frontend component sends the field to callback
   - Frontend handler extracts and maps the field
   - Edge Function maps the field to database column
   - Consumer components read the counteroffer field with fallback to original

3. **Document Field Flow**: Add documentation showing the complete data flow for counteroffer fields from UI to database to display

4. **Validation in Edge Function**: Add validation to ensure required counteroffer fields are present when status changes to "Host Counteroffer Submitted"

## 8. Related Files Reference

| File | Purpose | Lines to Modify |
|------|---------|----------------|
| `app/src/islands/pages/HostProposalsPage/useHostProposalsPageLogic.js` | Extract and map newHouseRules | 851-858, 907-926, 533 |
| `supabase/functions/proposal/actions/update.ts` | Add hc_house_rules mapping | After line 264 |
| `supabase/functions/proposal/lib/types.ts` | Add type definition | UpdateProposalInput interface |
| `app/src/islands/modals/useCompareTermsModalLogic.js` | Read hc house rules | 218-222 |
| `app/src/islands/shared/HostEditingProposal/HostEditingProposal.jsx` | Reference (working correctly) | 268-269 |
| `app/src/logic/processors/proposals/processProposalData.js` | Reference pattern for hc fields | 163 |

---

## Summary

The house rules data persistence issue is caused by **incomplete field mapping** across 4 layers:

1. **Frontend handler** does not extract `newHouseRules` from callback data
2. **Frontend handler** does not include `hc_house_rules` in payload
3. **Edge Function** does not map `hc_house_rules` to database column
4. **Compare Terms modal** does not read `hc house rules` counteroffer field

All 4 issues must be fixed to complete the data flow. The `HostEditingProposal` component correctly sends the `newHouseRules` field - the chain is broken after that point.

**Next Steps**: Implement the fixes in Priority 1, deploy Edge Function, and test the complete flow.
