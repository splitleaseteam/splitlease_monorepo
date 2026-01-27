---
name: audit-async-loading-states
description: Audit the codebase to find components with async data fetching that lack proper loading, error, and empty state tests. Identifies OPPORTUNITIES for improvement in .claude/plans/Opportunities/ and notifies via Slack webhook.
---

# Async Loading States Testing Audit

You are conducting a comprehensive audit to identify components with async data fetching that do not have proper test coverage for loading, error, and empty states.

## Step 1: Prime the Codebase Context

First, run the `/prime` slash command to get a comprehensive understanding of the codebase structure.

## Step 2: Systematic File Review

After receiving the /prime output, systematically review ALL files to identify:

### Target Files to Find

1. **Components with data fetching** - Look for:
   - `useQuery()` hooks
   - `useSWR()` hooks
   - `useEffect` with fetch/axios
   - `supabase.from().select()`

2. **Loading indicators** - Look for:
   - Skeleton components
   - Spinner components
   - `isLoading`, `isPending` state

3. **Error handling UI** - Look for:
   - Error boundaries
   - Error message components
   - Retry buttons

4. **Empty states** - Look for:
   - "No results" messages
   - Empty list placeholders
   - Create CTA for empty state

5. **Optimistic updates** - Look for:
   - `useMutation` with `onMutate`
   - Immediate UI updates before server response
   - Rollback logic

### Core Async States to Test

```
IDLE → LOADING → SUCCESS/ERROR → (REVALIDATING)

User sees:
- Idle: Empty or placeholder
- Loading: Spinner/skeleton
- Success: Data rendered
- Error: Error message + retry
- Revalidating: Stale data + subtle indicator
```

### What to Check for Each Target

For each async component, check if tests exist for:
- Loading state (skeleton/spinner visible)
- Success state (data rendered)
- Error state (error message + retry button)
- Empty state (no results message)
- Retry functionality
- Stale-while-revalidate (if applicable)

## Step 3: Create the Audit Document

Create an md file at `.claude/plans/Opportunities/YYMMDD/YYYYMMDDHHMMSS-audit-async-loading-states.md` (where YYMMDD is today's date folder) with the following structure:

```markdown
# Async Loading States Testing Opportunity Report
**Generated:** <timestamp>
**Codebase:** <project name>

## Executive Summary
- Components with async data: X
- Components needing state tests: X
- Missing loading state tests: X
- Missing error state tests: X
- Missing empty state tests: X

## Async State Coverage Matrix

| Component | Loading | Success | Error | Empty | Retry | Revalidate |
|-----------|---------|---------|-------|-------|-------|------------|
| ListingGrid | ? | ? | ? | ? | ? | ? |
| BookingHistory | ? | ? | ? | ? | ? | ? |
| UserProfile | ? | ? | ? | ? | ? | ? |

## Critical Gaps (No State Tests)

### 1. [Component Name]
- **File:** `path/to/component.tsx`
- **Data Source:** `useQuery('listings')`
- **Has Loading UI:** Yes (skeleton at line X)
- **Has Error UI:** Yes (error message at line Y)
- **Has Empty UI:** Yes (no results at line Z)
- **Missing Tests:**
  - [ ] Loading → Success transition
  - [ ] Loading → Error transition
  - [ ] Empty state rendering
  - [ ] Retry after error
  - [ ] Accessible loading announcement

### 2. [Component Name]
- **File:** `path/to/component.tsx`
- **Data Source:** `useSWR('/api/bookings')`
- **Missing Tests:**
  - [ ] Loading state visible
  - [ ] Error state with retry
  - [ ] Stale-while-revalidate indicator

## Loading State Gaps

### Components Without Loading Tests
| Component | Loading UI | Test File | Loading Test |
|-----------|------------|-----------|--------------|
| ListingGrid | Skeleton | ListingGrid.test.tsx | Missing |
| SearchResults | Spinner | None | Missing |

## Error State Gaps

### Components Without Error Tests
| Component | Error UI | Retry Button | Error Test |
|-----------|----------|--------------|------------|
| ListingGrid | Alert | Yes | Missing |
| BookingForm | Toast | No | Missing |

## Empty State Gaps

### Components Without Empty State Tests
| Component | Empty UI | CTA | Empty Test |
|-----------|----------|-----|------------|
| ListingGrid | "No listings" | "Create listing" | Missing |
| SearchResults | "No results" | "Clear filters" | Missing |

## Optimistic Update Gaps

### Components with Optimistic Updates
| Component | Operation | Rollback | Test |
|-----------|-----------|----------|------|
| SaveButton | Save listing | Yes | Missing |
| LikeButton | Like/Unlike | Yes | Missing |

### Missing Optimistic Tests
- [ ] Immediate UI update
- [ ] Server confirmation
- [ ] Rollback on error
- [ ] Error toast shown

## Accessibility Gaps

### Missing Loading Announcements
| Component | aria-busy | role="status" | Announcement |
|-----------|-----------|---------------|--------------|
| ListingGrid | No | No | None |
| SearchResults | Yes | No | None |

## Components with Good Coverage (Reference)

List components that already have proper async state test coverage.

## Recommended Test Patterns

### Loading → Success
```typescript
it('shows loading then data', async () => {
  server.use(
    http.get('*/listings', async () => {
      await new Promise(r => setTimeout(r, 100))
      return HttpResponse.json([{ id: '1', title: 'Test' }])
    })
  )

  render(<ListingGrid />)

  expect(screen.getByTestId('skeleton')).toBeInTheDocument()

  await waitFor(() => {
    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument()
})
```

### Loading → Error
```typescript
it('shows error on failure', async () => {
  server.use(
    http.get('*/listings', () => HttpResponse.json({}, { status: 500 }))
  )

  render(<ListingGrid />)

  await waitFor(() => {
    expect(screen.getByRole('alert')).toHaveTextContent(/failed/i)
  })

  expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
})
```

### Empty State
```typescript
it('shows empty state', async () => {
  server.use(
    http.get('*/listings', () => HttpResponse.json([]))
  )

  render(<ListingGrid />)

  await waitFor(() => {
    expect(screen.getByText(/no listings/i)).toBeInTheDocument()
  })
})
```

### Retry
```typescript
it('retries on button click', async () => {
  const user = userEvent.setup()
  let calls = 0

  server.use(
    http.get('*/listings', () => {
      calls++
      if (calls === 1) return HttpResponse.json({}, { status: 500 })
      return HttpResponse.json([{ id: '1', title: 'Success' }])
    })
  )

  render(<ListingGrid />)

  await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())

  await user.click(screen.getByRole('button', { name: /try again/i }))

  await waitFor(() => expect(screen.getByText('Success')).toBeInTheDocument())
})
```

```

---

## Reference: Async State Testing Patterns

### Core States

- **IDLE**: Empty or placeholder
- **LOADING**: Spinner/skeleton visible
- **SUCCESS**: Data rendered
- **ERROR**: Error message + retry
- **EMPTY**: No results message
- **REVALIDATING**: Stale data + indicator

### Anti-Patterns to Flag

| Flag This | Recommend Instead |
|-----------|-------------------|
| `setTimeout` in tests | `waitFor()` with condition |
| Only testing success | Test loading, error, empty |
| No loading assertion | Assert skeleton visible |
| No retry test | Test retry button works |
| No accessibility | Test aria-busy, role=status |

## Output Requirements

1. Be thorough - review EVERY async component
2. Be specific - include exact file paths and line numbers
3. Be actionable - provide test templates
4. Only report gaps - do not list tested states unless as reference
5. Create the output file in `.claude/plans/Opportunities/YYMMDD/` with timestamp format: `YYYYMMDDHHMMSS-audit-async-loading-states.md`

## Post-Audit Actions

After creating the audit document:

1. Commit and push the audit report to the repository
2. Send a webhook POST request to the URL in `TINYTASKAGENT` environment variable (found in root .env) with message: hostname and that the audit process completed
