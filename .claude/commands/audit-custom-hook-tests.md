---
name: audit-custom-hook-tests
description: Audit the codebase to find custom React hooks (useBooking, useListings, useAuth) that lack proper test coverage using renderHook. Identifies OPPORTUNITIES for improvement in .claude/plans/Opportunities/ and notifies via Slack webhook.
---

# Custom Hook Testing Audit

You are conducting a comprehensive audit to identify custom React hooks that do not have proper test coverage using `renderHook()` from Testing Library.

## Step 1: Prime the Codebase Context

First, run the `/prime` slash command to get a comprehensive understanding of the codebase structure.

## Step 2: Systematic File Review

After receiving the /prime output, systematically review ALL files to identify:

### Target Files to Find

1. **Data fetching hooks** - Look for:
   - `useListings`, `useBooking`, `useSearch`
   - Hooks with `useQuery`, `useSWR`, or `useEffect` with fetch
   - Hooks returning `{ data, loading, error }`

2. **Form state hooks** - Look for:
   - `useBookingForm`, `useSearchForm`
   - Hooks with validation logic
   - Hooks with computed values (totals, nights)

3. **Auth hooks** - Look for:
   - `useAuth`, `useSession`, `useCurrentUser`
   - Hooks with login/logout functions
   - Hooks reading from context

4. **Utility hooks** - Look for:
   - `useDebounce`, `useThrottle`
   - `useLocalStorage`, `useSessionStorage`
   - `useMediaQuery`, `useWindowSize`

5. **Side effect hooks** - Look for:
   - Hooks with `useEffect` that modify external state
   - Hooks that sync with localStorage/sessionStorage
   - Hooks with cleanup functions

6. **Test files** - Check for:
   - `renderHook()` usage
   - `act()` for state updates
   - `waitFor()` for async operations
   - Provider wrappers for context

### What to Check for Each Target

For each custom hook, check if tests exist for:
- Initial state/return values
- State updates via exposed functions
- Async data fetching (loading, success, error)
- Computed values calculation
- Prop/dependency changes via rerender
- Context dependencies with wrapper
- Cleanup on unmount
- Edge cases and error handling

## Step 3: Create the Audit Document

Create an md file at `.claude/plans/Opportunities/YYMMDD/YYYYMMDDHHMMSS-audit-custom-hook-tests.md` (where YYMMDD is today's date folder) with the following structure:

```markdown
# Custom Hook Testing Opportunity Report
**Generated:** <timestamp>
**Codebase:** <project name>

## Executive Summary
- Custom hooks found: X
- Hooks needing tests: X
- Missing state tests: X
- Missing async tests: X
- Missing context tests: X

## Test Infrastructure Check

### renderHook Setup Status
- [ ] `renderHook` imported from `@testing-library/react`
- [ ] `act` imported for state updates
- [ ] `waitFor` used for async assertions
- [ ] Provider wrappers created for context-dependent hooks
- [ ] MSW handlers set up for data fetching hooks

## Critical Gaps (No Tests)

### 1. [Hook Name]
- **File:** `path/to/useHook.ts`
- **Hook Type:** Data fetching/Form state/Auth/Utility
- **Has Test File:** Yes/No
- **Dependencies:** Context, API, localStorage
- **Missing Tests:**
  - [ ] Initial state test
  - [ ] State update test
  - [ ] Async loading state
  - [ ] Async success state
  - [ ] Async error state
  - [ ] Rerender with new props
  - [ ] Cleanup on unmount

### 2. [Hook Name]
- **File:** `path/to/useHook.ts`
- **Hook Type:** Form state
- **Missing Tests:**
  - [ ] Computed values
  - [ ] Validation errors
  - [ ] Reset functionality

## Data Fetching Hook Gaps

### Hooks Without Async Tests
| Hook | Returns Loading | Returns Error | Has Test |
|------|-----------------|---------------|----------|
| useListings | Yes | Yes | No |
| useBooking | Yes | Yes | No |
| useSearch | Yes | Yes | No |

### Missing Async Test Cases
- [ ] Returns loading state initially
- [ ] Returns data on success
- [ ] Returns error on failure
- [ ] Refetches when dependencies change
- [ ] Handles empty response

## Form State Hook Gaps

### Hooks Without State Tests
| Hook | Has Validation | Has Computed | Has Test |
|------|----------------|--------------|----------|
| useBookingForm | Yes | totalPrice | No |
| useSearchForm | Yes | No | No |

### Missing State Test Cases
- [ ] Initial state values
- [ ] State updates via setters
- [ ] Validation error calculation
- [ ] Computed value calculation
- [ ] Reset to initial state

## Auth Hook Gaps

### Hooks Without Context Tests
| Hook | Context Required | Provider Wrapper | Has Test |
|------|------------------|------------------|----------|
| useAuth | AuthContext | No | No |
| useCurrentUser | AuthContext, QueryClient | No | No |

### Missing Context Test Cases
- [ ] Returns null when not authenticated
- [ ] Returns user when authenticated
- [ ] Login function works
- [ ] Logout function works

## Utility Hook Gaps

### Hooks Without Utility Tests
| Hook | Side Effects | Cleanup | Has Test |
|------|--------------|---------|----------|
| useDebounce | Timer | Yes | No |
| useLocalStorage | localStorage | No | No |

### Missing Utility Test Cases
- [ ] Debounce delays value update
- [ ] Debounce cancels on new value
- [ ] LocalStorage reads initial value
- [ ] LocalStorage writes on update
- [ ] LocalStorage handles removal

## act() Usage Gaps

### Hooks With Missing act() Wrapping
| Hook | State Updates | Wrapped in act() |
|------|---------------|------------------|
| useCounter | increment, decrement | No |
| useBookingForm | setCheckIn, setGuests | No |

## Rerender Test Gaps

### Hooks Without Rerender Tests
| Hook | Has Dependencies | Rerender Test |
|------|------------------|---------------|
| useListings | category, limit | No |
| useDebounce | value, delay | No |

## Cleanup Test Gaps

### Hooks Without Cleanup Tests
| Hook | Has Cleanup | Cleanup Test |
|------|-------------|--------------|
| useWebSocket | Yes | No |
| useDebounce | Yes | No |

## Hooks with Good Coverage (Reference)

List hooks that already have proper test coverage as examples.

## Recommended Test Patterns

### Simple State Hook Test
```typescript
import { renderHook, act } from '@testing-library/react'
import { useCounter } from './useCounter'

describe('useCounter', () => {
  it('starts with initial value', () => {
    const { result } = renderHook(() => useCounter(10))
    expect(result.current.count).toBe(10)
  })

  it('defaults to 0', () => {
    const { result } = renderHook(() => useCounter())
    expect(result.current.count).toBe(0)
  })

  it('increments count', () => {
    const { result } = renderHook(() => useCounter(0))

    act(() => {
      result.current.increment()
    })

    expect(result.current.count).toBe(1)
  })

  it('resets to initial value', () => {
    const { result } = renderHook(() => useCounter(10))

    act(() => {
      result.current.increment()
      result.current.increment()
    })

    expect(result.current.count).toBe(12)

    act(() => {
      result.current.reset()
    })

    expect(result.current.count).toBe(10)
  })
})
```

### Async Data Fetching Hook Test
```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { server } from '@/mocks/server'
import { http, HttpResponse } from 'msw'
import { useListings } from './useListings'

describe('useListings', () => {
  it('returns loading state initially', () => {
    const { result } = renderHook(() => useListings())

    expect(result.current.loading).toBe(true)
    expect(result.current.listings).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('fetches and returns listings', async () => {
    server.use(
      http.get('*/rest/v1/listings', () => {
        return HttpResponse.json([
          { id: '1', title: 'Studio', price: 1000 },
          { id: '2', title: 'Room', price: 800 },
        ])
      })
    )

    const { result } = renderHook(() => useListings())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.listings).toHaveLength(2)
    expect(result.current.listings[0].title).toBe('Studio')
    expect(result.current.error).toBeNull()
  })

  it('handles fetch error', async () => {
    server.use(
      http.get('*/rest/v1/listings', () => {
        return HttpResponse.json({ error: 'Server error' }, { status: 500 })
      })
    )

    const { result } = renderHook(() => useListings())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBeDefined()
    expect(result.current.listings).toEqual([])
  })

  it('refetches when options change', async () => {
    let fetchCount = 0

    server.use(
      http.get('*/rest/v1/listings', () => {
        fetchCount++
        return HttpResponse.json([{ id: '1', title: `Fetch ${fetchCount}` }])
      })
    )

    const { result, rerender } = renderHook(
      ({ category }) => useListings({ category }),
      { initialProps: { category: 'apartment' } }
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(fetchCount).toBe(1)

    rerender({ category: 'house' })

    await waitFor(() => {
      expect(fetchCount).toBe(2)
    })
  })
})
```

### Form State Hook Test
```typescript
import { renderHook, act } from '@testing-library/react'
import { useBookingForm } from './useBookingForm'

describe('useBookingForm', () => {
  const PRICE_PER_NIGHT = 100
  const MAX_GUESTS = 4

  it('initializes with default state', () => {
    const { result } = renderHook(() => useBookingForm(PRICE_PER_NIGHT, MAX_GUESTS))

    expect(result.current.checkIn).toBeNull()
    expect(result.current.checkOut).toBeNull()
    expect(result.current.guests).toBe(1)
    expect(result.current.isValid).toBe(false)
  })

  it('calculates nights correctly', () => {
    const { result } = renderHook(() => useBookingForm(PRICE_PER_NIGHT, MAX_GUESTS))

    act(() => {
      result.current.setCheckIn(new Date('2025-03-01'))
      result.current.setCheckOut(new Date('2025-03-08'))
    })

    expect(result.current.nights).toBe(7)
  })

  it('calculates total price correctly', () => {
    const { result } = renderHook(() => useBookingForm(PRICE_PER_NIGHT, MAX_GUESTS))

    act(() => {
      result.current.setCheckIn(new Date('2025-03-01'))
      result.current.setCheckOut(new Date('2025-03-04'))
    })

    expect(result.current.nights).toBe(3)
    expect(result.current.totalPrice).toBe(300)
  })

  it('validates check-out after check-in', () => {
    const { result } = renderHook(() => useBookingForm(PRICE_PER_NIGHT, MAX_GUESTS))

    act(() => {
      result.current.setCheckIn(new Date('2025-03-05'))
      result.current.setCheckOut(new Date('2025-03-01'))
    })

    expect(result.current.errors.checkOut).toBe('Check-out must be after check-in')
    expect(result.current.isValid).toBe(false)
  })

  it('validates guest count', () => {
    const { result } = renderHook(() => useBookingForm(PRICE_PER_NIGHT, MAX_GUESTS))

    act(() => {
      result.current.setGuests(10)
    })

    expect(result.current.errors.guests).toBe('Maximum 4 guests allowed')
  })

  it('resets form state', () => {
    const { result } = renderHook(() => useBookingForm(PRICE_PER_NIGHT, MAX_GUESTS))

    act(() => {
      result.current.setCheckIn(new Date('2025-06-01'))
      result.current.setGuests(3)
    })

    expect(result.current.guests).toBe(3)

    act(() => {
      result.current.reset()
    })

    expect(result.current.checkIn).toBeNull()
    expect(result.current.guests).toBe(1)
  })
})
```

### Hook with Context Dependencies Test
```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { useCurrentUser } from './useCurrentUser'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </QueryClientProvider>
    )
  }
}

describe('useCurrentUser', () => {
  it('returns null when not authenticated', async () => {
    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.user).toBeNull()
  })

  it('returns user when authenticated', async () => {
    server.use(
      http.get('*/auth/v1/user', () => {
        return HttpResponse.json({
          id: 'user-123',
          email: 'test@example.com',
        })
      })
    )

    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.user).toEqual({
      id: 'user-123',
      email: 'test@example.com',
    })
  })
})
```

### localStorage Hook Test
```typescript
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from './useLocalStorage'

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns initial value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'))

    expect(result.current[0]).toBe('default')
  })

  it('returns stored value from localStorage', () => {
    localStorage.setItem('test-key', JSON.stringify('stored value'))

    const { result } = renderHook(() => useLocalStorage('test-key', 'default'))

    expect(result.current[0]).toBe('stored value')
  })

  it('updates localStorage when value changes', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))

    act(() => {
      result.current[1]('new value')
    })

    expect(result.current[0]).toBe('new value')
    expect(localStorage.getItem('test-key')).toBe('"new value"')
  })

  it('supports function updates', () => {
    const { result } = renderHook(() => useLocalStorage('count', 0))

    act(() => {
      result.current[1](prev => prev + 1)
    })

    expect(result.current[0]).toBe(1)
  })

  it('removes value from localStorage', () => {
    localStorage.setItem('test-key', '"stored"')

    const { result } = renderHook(() => useLocalStorage('test-key', 'default'))

    expect(result.current[0]).toBe('stored')

    act(() => {
      result.current[2]()
    })

    expect(result.current[0]).toBe('default')
    expect(localStorage.getItem('test-key')).toBeNull()
  })
})
```

### Debounced Hook Test
```typescript
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from './useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500))

    expect(result.current).toBe('initial')
  })

  it('debounces value changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    )

    rerender({ value: 'updated' })

    expect(result.current).toBe('initial')

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current).toBe('updated')
  })

  it('cancels pending update on new value', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'first' } }
    )

    rerender({ value: 'second' })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    rerender({ value: 'third' })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current).toBe('first')

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(result.current).toBe('third')
  })
})
```

```

---

## Reference: Custom Hook Testing Patterns

### Core Pattern

```typescript
import { renderHook, act, waitFor } from '@testing-library/react'
import { useMyHook } from './useMyHook'

describe('useMyHook', () => {
  it('returns initial state', () => {
    const { result } = renderHook(() => useMyHook())

    expect(result.current.value).toBe(initialValue)
  })

  it('updates state on action', () => {
    const { result } = renderHook(() => useMyHook())

    act(() => {
      result.current.setValue('new value')
    })

    expect(result.current.value).toBe('new value')
  })
})
```

### Testing Hooks with rerender

```typescript
it('refetches when userId changes', async () => {
  const { result, rerender } = renderHook(
    ({ userId }) => useUserProfile(userId),
    { initialProps: { userId: 'user-1' } }
  )

  await waitFor(() => {
    expect(result.current.data?.id).toBe('user-1')
  })

  rerender({ userId: 'user-2' })

  await waitFor(() => {
    expect(result.current.data?.id).toBe('user-2')
  })
})
```

### Common Mistakes

#### Mistake 1: Forgetting act()
```typescript
// BAD: State update outside act()
it('updates count', () => {
  const { result } = renderHook(() => useCounter())
  result.current.increment() // Warning!
  expect(result.current.count).toBe(1)
})

// GOOD: Wrap in act()
it('updates count', () => {
  const { result } = renderHook(() => useCounter())
  act(() => {
    result.current.increment()
  })
  expect(result.current.count).toBe(1)
})
```

#### Mistake 2: Missing wrapper for context
```typescript
// BAD: Hook needs context but wrapper missing
it('returns user', () => {
  const { result } = renderHook(() => useAuth()) // Error!
})

// GOOD: Provide wrapper
it('returns user', () => {
  const { result } = renderHook(() => useAuth(), {
    wrapper: AuthProvider,
  })
})
```

#### Mistake 3: Not waiting for async
```typescript
// BAD: Assertion before async completes
it('fetches data', () => {
  const { result } = renderHook(() => useData())
  expect(result.current.data).toHaveLength(2) // Fails!
})

// GOOD: Wait for loading to complete
it('fetches data', async () => {
  const { result } = renderHook(() => useData())
  await waitFor(() => {
    expect(result.current.isLoading).toBe(false)
  })
  expect(result.current.data).toHaveLength(2)
})
```

### Anti-Patterns to Flag

| Flag This | Recommend Instead |
|-----------|-------------------|
| Testing hooks inside components | Use `renderHook()` for isolation |
| No `act()` for state updates | Wrap updates in `act()` |
| Missing context wrapper | Create wrapper with providers |
| Sync assertions for async hooks | Use `waitFor()` |
| Testing implementation details | Test return values and behavior |

## Output Requirements

1. Be thorough - review EVERY custom hook
2. Be specific - include exact file paths and hook types
3. Be actionable - provide test templates
4. Only report gaps - do not list tested hooks unless as reference
5. Create the output file in `.claude/plans/Opportunities/YYMMDD/` with timestamp format: `YYYYMMDDHHMMSS-audit-custom-hook-tests.md`

## Post-Audit Actions

After creating the audit document:

1. Commit and push the audit report to the repository
2. Send a webhook POST request to the URL in `TINYTASKAGENT` environment variable (found in root .env) with message: hostname and that the audit process completed
