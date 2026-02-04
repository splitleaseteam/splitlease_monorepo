# Async Loading States Opportunity Report

**Generated:** 2026-01-28T09:00:00
**Codebase:** Split Lease

## Executive Summary

| Metric | Count |
|--------|-------|
| Components with async data fetching | 60+ |
| LoadingState components | 10 |
| Components with loading state tests | 1 |
| Missing loading state tests | 59+ |

**Overall Status:** The codebase has good LoadingState component coverage but lacks tests for loading/error states in async components.

## LoadingState Component Inventory

### Existing LoadingState Components

| Component | Location | Has Tests | Has Stories |
|-----------|----------|-----------|-------------|
| `LoadingState.jsx` | `AdminThreadsPage/components/` | No | Yes |
| `LoadingState.jsx` | `LeasesOverviewPage/components/` | No | No |
| `LoadingState.jsx` | `ManageVirtualMeetingsPage/components/` | No | No |
| `LoadingState.jsx` | `QuickPricePage/components/` | No | No |
| `LoadingState.jsx` | `SearchPage/components/` | No | No |
| `LoadingState.jsx` | `ViewSplitLeasePage/components/` | No | No |
| `LoadingState.jsx` | `ExperienceResponsesPage/components/` | No | No |
| `LoadingState.jsx` | `ManageLeasesPaymentRecordsPage/components/` | No | No |
| `LoadingState.jsx` | `VisitReviewerHouseManual/components/AccessStates/` | No | No |

### Loading State Pattern Analysis

The codebase uses a consistent pattern for loading states:

```jsx
// Typical pattern in page components
if (isLoading) {
  return <LoadingState />;
}

if (error) {
  return <ErrorState message={error} />;
}

return <PageContent data={data} />;
```

## Components Needing Loading State Tests

### High Priority (Core User Flows)

| Component/Hook | Async Operations | Current Tests | Priority |
|----------------|------------------|---------------|----------|
| `SearchPage.jsx` | Listing fetch | No | P0 |
| `ViewSplitLeasePage.jsx` | Listing details fetch | No | P0 |
| `GuestProposalsPage.jsx` | Proposals fetch | No | P0 |
| `HostProposalsPage.jsx` | Proposals fetch | No | P0 |
| `ListingDashboardPage.jsx` | Listing data fetch | No | P0 |
| `HostOverviewPage.jsx` | Host data fetch | No | P1 |
| `FavoriteListingsPage.jsx` | Favorites fetch | No | P1 |
| `AccountProfilePage.jsx` | User data fetch | No | P1 |

### Medium Priority (Feature Components)

| Component | Async Operations | Current Tests | Priority |
|-----------|------------------|---------------|----------|
| `SignUpLoginModal.jsx` | Auth operations | No | P1 |
| `ImportListingModal.jsx` | Import data | No | P2 |
| `ImportListingReviewsModal.jsx` | Reviews import | No | P2 |
| `AIImportAssistantModal.jsx` | AI processing | No | P2 |
| `EditListingDetails.jsx` | Save operations | No | P2 |
| `BookVirtualMeeting.jsx` | Booking fetch | No | P2 |
| `RespondToVMRequest.jsx` | Response submit | No | P2 |
| `CancelVirtualMeetings.jsx` | Cancel operation | No | P2 |

### Lower Priority (Admin/Utility)

| Component | Async Operations | Priority |
|-----------|------------------|----------|
| `AdminThreadsPage.jsx` | Threads fetch | P3 |
| `ManageVirtualMeetingsPage.jsx` | Meetings fetch | P3 |
| `ManageRentalApplicationsPage.jsx` | Applications fetch | P3 |
| `ModifyListingsPage.jsx` | Listings fetch | P3 |
| `MessageCurationPage.jsx` | Messages fetch | P3 |

## Test Coverage Gaps

### What Should Be Tested

For each component with async data fetching:

1. **Initial loading state** - Component shows loading indicator
2. **Loading to success transition** - Data appears after fetch
3. **Loading to error transition** - Error message appears on failure
4. **Retry functionality** - User can retry failed requests
5. **Empty state** - Appropriate message when no data

### Current Test Coverage

| Test Type | Files | Coverage |
|-----------|-------|----------|
| Loading state shown | 0 | 0% |
| Success transition | 0 | 0% |
| Error transition | 0 | 0% |
| Retry functionality | 0 | 0% |
| Empty state | 0 | 0% |

## Recommended Test Patterns

### Testing Loading States

```jsx
// Example: SearchPage loading state test
import { render, screen, waitFor } from '@testing-library/react';
import SearchPage from './SearchPage';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnValue(new Promise(() => {})) // Never resolves
    }))
  }
}));

describe('SearchPage', () => {
  it('shows loading state while fetching listings', () => {
    render(<SearchPage />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
```

### Testing Success Transition

```jsx
it('shows listings after successful fetch', async () => {
  const mockListings = [
    { id: '1', title: 'Test Listing', price: 100 }
  ];

  supabase.from().select().order.mockResolvedValue({
    data: mockListings,
    error: null
  });

  render(<SearchPage />);

  // Initially shows loading
  expect(screen.getByRole('status')).toBeInTheDocument();

  // Wait for data
  await waitFor(() => {
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  // Shows listing
  expect(screen.getByText('Test Listing')).toBeInTheDocument();
});
```

### Testing Error States

```jsx
it('shows error message when fetch fails', async () => {
  supabase.from().select().order.mockResolvedValue({
    data: null,
    error: { message: 'Network error' }
  });

  render(<SearchPage />);

  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument();
    expect(screen.getByText(/network error/i)).toBeInTheDocument();
  });
});
```

### Testing Retry

```jsx
it('allows retry after error', async () => {
  const mockFetch = vi.fn()
    .mockResolvedValueOnce({ data: null, error: { message: 'Error' } })
    .mockResolvedValueOnce({ data: [{ id: '1' }], error: null });

  supabase.from().select().order = mockFetch;

  render(<SearchPage />);

  // Wait for error
  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });

  // Click retry
  await userEvent.click(screen.getByRole('button', { name: /retry/i }));

  // Wait for success
  await waitFor(() => {
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
  });
});
```

## LoadingState Component Consolidation

### Current Duplication

There are 9 LoadingState components with similar implementations. Consider consolidating:

```jsx
// Recommended: Create shared LoadingState
// src/islands/shared/LoadingState/LoadingState.jsx
export function LoadingState({
  message = 'Loading...',
  size = 'medium',
  fullScreen = false
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`loading-state ${size} ${fullScreen ? 'full-screen' : ''}`}
    >
      <Spinner size={size} />
      <span className="sr-only">{message}</span>
    </div>
  );
}
```

### Benefits of Consolidation

1. **Consistent UX** - Same loading experience everywhere
2. **Easier testing** - One component to test
3. **Accessibility** - Proper ARIA attributes in one place
4. **Maintainability** - Changes in one file

## Accessibility Considerations

### Current Issues

Many LoadingState components may lack proper accessibility:

- Missing `role="status"` or `role="progressbar"`
- Missing `aria-live` announcements
- No screen reader text

### Recommended Improvements

```jsx
// Accessible loading state
<div
  role="status"
  aria-live="polite"
  aria-busy="true"
  aria-label="Loading content"
>
  <Spinner aria-hidden="true" />
  <span className="sr-only">Loading, please wait...</span>
</div>
```

## Summary

| Finding | Severity | Action |
|---------|----------|--------|
| 0 loading state tests | High | Add tests for core pages |
| 9 duplicate LoadingState components | Medium | Consolidate to shared component |
| Missing accessibility attributes | Medium | Add ARIA attributes |
| No error state tests | High | Test error handling |

## Recommendations

### Immediate Actions

- [ ] Create shared LoadingState component
- [ ] Add loading state tests for SearchPage
- [ ] Add loading state tests for ViewSplitLeasePage
- [ ] Ensure LoadingState has proper ARIA attributes

### Short-term (Week 1-2)

- [ ] Add tests for all P0 async components
- [ ] Consolidate duplicate LoadingState components
- [ ] Add Storybook stories for loading/error states

### Medium-term (Week 3-4)

- [ ] Add tests for P1 async components
- [ ] Implement consistent error boundary pattern
- [ ] Add retry functionality tests

## Conclusion

The codebase has LoadingState components but they are:
1. Duplicated across pages (9 copies)
2. Not tested
3. Potentially missing accessibility features

Priority should be:
1. Test the most-used async components (Search, View Listing, Proposals)
2. Consolidate LoadingState to a shared component
3. Add comprehensive loading/error/success transition tests

**Severity: High** - Loading states are critical UX but untested.
