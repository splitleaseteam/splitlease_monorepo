# Counteroffer Negotiation Summary Integration

**Created**: 2026-02-04 09:05:00
**Status**: Ready for Implementation
**Classification**: BUILD (Bug Fix + Feature Verification)

---

## Summary

When a counteroffer happens, the AI negotiation summary should be displayed to guests in the message and visible on proposal cards and review terms popup. Investigation revealed this functionality **already exists** but is broken due to a CTA name mismatch.

---

## Root Cause Analysis

### The Bug
- `create_counteroffer.ts` (line 460) uses: `'Review Counteroffer'`
- `userProposalQueries.js` (line 536) queries for: `'Respond to Counter Offer'`

When a counteroffer is created, it stores the message with CTA `'Review Counteroffer'`, but the frontend query filters for `'Respond to Counter Offer'`. This mismatch prevents the negotiation summary from being retrieved.

### Existing Implementation (Working Once Bug Fixed)
1. **Message Generation**: `create_counteroffer.ts` already generates messages using `negotiation_summary` field
2. **Proposal Cards**: `CounterofferSummarySection.jsx` renders when `counterofferSummary` data exists
3. **Review Terms Popup**: `NegotiationSummaryBanner` in `CompareTermsModal.jsx` renders when `negotiationSummaries` exists

---

## Implementation Steps

### Step 1: Fix CTA Name Mismatch

**File**: `supabase/functions/proposal/actions/create_counteroffer.ts`
**Line**: ~460

Change:
```typescript
cta_name: 'Review Counteroffer',
```

To:
```typescript
cta_name: 'Respond to Counter Offer',
```

This aligns with:
- `update.ts` line 570: `'Respond to Counter Offer'`
- `userProposalQueries.js` line 536 query filter

### Step 2: Verify Data Flow

After fix, verify the complete data flow:
1. Counteroffer created → message with CTA `'Respond to Counter Offer'` + body containing negotiation summary
2. Frontend queries `_message` table filtering by CTA name
3. `counterofferSummary` populated in proposal data
4. UI components render the summary

---

## Files Involved

| File | Change Type | Purpose |
|------|-------------|---------|
| `supabase/functions/proposal/actions/create_counteroffer.ts` | MODIFY | Fix CTA name |
| `app/src/lib/proposals/userProposalQueries.js` | VERIFY | Ensure query works with fix |
| `app/src/islands/pages/proposals/ExpandableProposalCard.jsx` | VERIFY | Already renders via `CounterofferSummarySection` |
| `app/src/islands/modals/CompareTermsModal.jsx` | VERIFY | Already renders `NegotiationSummaryBanner` |

---

## Testing Considerations

1. Create a new counteroffer and verify the CTA name is correct in database
2. Load proposal as guest and verify negotiation summary appears:
   - On proposal card (via `CounterofferSummarySection`)
   - On review terms popup (via `NegotiationSummaryBanner`)
3. Verify message content includes the AI-generated negotiation summary

---

## Risk Assessment

**Low Risk** - Single line change that aligns with existing patterns (`update.ts` already uses the correct CTA name)

---

## Reminder

After implementing changes to Supabase Edge Functions, manual deployment is required:
```bash
supabase functions deploy proposal
```
