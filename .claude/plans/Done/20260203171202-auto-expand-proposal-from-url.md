# Auto-Expand Proposal Details Card from URL Parameter

**Created**: 2026-02-03
**Complexity**: LOW
**Status**: Ready for Implementation

## Summary

Implement auto-expansion of proposal details card on the host-proposals page when a `proposalId` query parameter is present in the URL. The page should detect the query parameter, find the matching proposal in the list, and automatically expand/open its details card.

## Current State Analysis

### How Expansion Works

1. **State Location**: `expandedProposalId` state is managed in `index.jsx` (line 171)
   ```javascript
   const [expandedProposalId, setExpandedProposalId] = useState(null);
   ```

2. **Toggle Handler**: `handleToggleExpand` toggles expansion (lines 272-274)
   ```javascript
   const handleToggleExpand = useCallback((proposalId) => {
     setExpandedProposalId(prev => prev === proposalId ? null : proposalId);
   }, []);
   ```

3. **Card Rendering**: `ProposalListSection` compares `expandedProposalId` with each proposal's ID to determine if expanded
   ```javascript
   const isExpanded = expandedProposalId === proposalId;
   ```

### URL Parameter Pattern

The hook already handles `listingId` URL parameter (lines 425-436 of `useHostProposalsPageLogic.js`):
```javascript
const urlParams = new URLSearchParams(window.location.search);
const preselectedListingId = urlParams.get('listingId');
```

## Implementation Plan

### File to Modify

**`app/src/islands/pages/HostProposalsPage/index.jsx`**

### Changes Required

1. **Read URL parameter on mount** - Check for `proposalId` query parameter
2. **Set initial expanded state** - Use `useEffect` to set `expandedProposalId` once proposals are loaded
3. **Handle timing** - The effect must wait for proposals to be loaded before setting the state

### Implementation Details

Add a `useEffect` hook after the existing state declarations to handle auto-expansion:

```javascript
// Auto-expand proposal from URL parameter
useEffect(() => {
  // Only process when not loading and we have proposals
  if (isLoading || !proposals || proposals.length === 0) {
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const targetProposalId = urlParams.get('proposalId');

  if (targetProposalId) {
    // Find the proposal in the list
    const matchedProposal = proposals.find(p =>
      (p._id || p.id) === targetProposalId
    );

    if (matchedProposal) {
      setExpandedProposalId(targetProposalId);
      console.log('[HostProposalsPage] Auto-expanded proposal from URL:', targetProposalId);
    } else {
      console.warn('[HostProposalsPage] Proposal not found for URL parameter:', targetProposalId);
    }
  }
}, [isLoading, proposals]);
```

### Location in Code

Insert after line 175 (after `selectedGuest` state declaration) and before the destructuring from `useHostProposalsPageLogic`.

## Edge Cases

1. **Proposal not found**: Log warning, don't expand anything
2. **Proposal on different listing**: If the proposal belongs to a different listing than currently selected, we need to consider whether to auto-switch listings. For this LOW complexity implementation, we'll only expand if the proposal is in the current listing's proposals.
3. **Loading state**: Only attempt expansion after `isLoading` is false and proposals exist
4. **DEMO_MODE**: The effect uses `isLoading` and `proposals` which are already overridden for demo mode, so it will work correctly

## Testing Checklist

- [ ] Navigate to `/host-proposals?proposalId=<valid-id>` - card should auto-expand
- [ ] Navigate to `/host-proposals?proposalId=<invalid-id>` - no card expanded, console warning
- [ ] Navigate to `/host-proposals` without parameter - normal behavior (no auto-expand)
- [ ] Navigate with both `listingId` and `proposalId` - both should work together
- [ ] User can still manually expand/collapse cards after auto-expansion

## Files Referenced

- `app/src/islands/pages/HostProposalsPage/index.jsx` - Main page component (TO BE MODIFIED)
- `app/src/islands/pages/HostProposalsPage/useHostProposalsPageLogic.js` - Logic hook (reference only)
- `app/src/islands/pages/HostProposalsPage/CollapsibleProposalCard.jsx` - Card component (reference only)
- `app/src/islands/pages/HostProposalsPage/ProposalListSection.jsx` - Section component (reference only)
