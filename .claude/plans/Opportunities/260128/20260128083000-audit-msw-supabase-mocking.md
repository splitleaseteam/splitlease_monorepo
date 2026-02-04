# MSW Supabase Mocking Opportunity Report

**Generated:** 2026-01-28T08:30:00
**Codebase:** Split Lease

## Executive Summary

| Metric | Status |
|--------|--------|
| MSW installed | No |
| MSW handlers configured | N/A |
| Current mocking approach | vi.mock (Vitest manual mocks) |
| Supabase mock coverage | Partial |

**Overall Status:** The codebase uses Vitest's `vi.mock` for Supabase mocking rather than MSW (Mock Service Worker). This is a valid approach, though MSW would provide more realistic network-level testing.

## Current Mocking Approach

### Integration Tests Using vi.mock

| Test File | Mock Target | Pattern |
|-----------|-------------|---------|
| `auth-flow.test.js` | `lib/supabase.js` | Manual mock factory |
| `booking-flow.test.js` | `lib/supabase.js` | Manual mock factory |
| `property-search.test.js` | `lib/supabase.js` | Manual mock factory |

### Current Mock Pattern

```javascript
// Current approach in integration tests
vi.mock('../../lib/supabase.js', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      setSession: vi.fn(),
      signOut: vi.fn(),
    },
    functions: {
      invoke: vi.fn(),
    },
    schema: vi.fn(() => ({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(),
        })),
      })),
    })),
  },
}));
```

### Mocked Operations by Test

| Test File | Operations Mocked |
|-----------|-------------------|
| `auth-flow.test.js` | `auth.getSession`, `auth.setSession`, `auth.signOut`, `functions.invoke` |
| `booking-flow.test.js` | `functions.invoke` (proposal Edge Function) |
| `property-search.test.js` | `schema().from().select().order()` (listing queries) |

## Components and Hooks That Need Supabase Mocking

Based on codebase analysis, these would need mocking when tested:

### High Priority (Core Functionality)

| File | Supabase Operations | Priority |
|------|---------------------|----------|
| `lib/auth.js` | `auth.getSession`, `auth.signInWithPassword`, `auth.signOut` | P0 |
| `lib/supabase.js` | Client initialization | P0 |
| `lib/listingDataFetcher.js` | `.from('listing').select()` | P0 |
| `lib/proposalDataFetcher.js` | `.from('proposal').select()` | P0 |
| `lib/dataLookups.js` | `.from('zat_*').select()` | P1 |
| `lib/favoritesApi.js` | `.from('favorite').select/insert/delete()` | P1 |

### Medium Priority (Feature Functionality)

| File | Supabase Operations | Priority |
|------|---------------------|----------|
| `lib/listingService.js` | `.from('listing').insert/update()` | P2 |
| `lib/informationalTextsFetcher.js` | `.from('informational_text').select()` | P2 |
| `lib/aiService.js` | `functions.invoke('ai-gateway')` | P2 |
| `lib/photoUpload.js` | `storage.from().upload()` | P2 |

## MSW vs vi.mock Comparison

| Aspect | vi.mock (Current) | MSW (Alternative) |
|--------|-------------------|-------------------|
| **Setup Complexity** | Lower | Higher |
| **Network Reality** | Mocks at module level | Intercepts at network level |
| **Response Simulation** | Limited | Full HTTP response simulation |
| **Error Scenarios** | Manual mocking | Realistic network errors |
| **Browser DevTools** | Not visible | Visible in Network tab |
| **Maintenance** | Per-test mock setup | Centralized handlers |
| **Best For** | Unit tests, simple integration | E2E, complex integration |

## Recommendation

### For Current Codebase State

Given the codebase has minimal test coverage (0.9%), the current `vi.mock` approach is appropriate because:

1. **Lower barrier to entry** - Easier for developers to add tests
2. **Faster test execution** - No service worker overhead
3. **Sufficient for unit tests** - Most tests are unit tests for pure functions
4. **Integration tests work** - Current pattern covers auth/booking/search flows

### When to Consider MSW

Consider adding MSW when:

1. **Test coverage increases** - More complex integration tests needed
2. **E2E testing added** - Playwright tests with API mocking
3. **Multiple API consumers** - Shared mock handlers across test files
4. **Complex error scenarios** - Need to test timeout, retry logic

## If Adopting MSW

### Installation

```bash
bun add msw --dev
```

### Handler Structure

```javascript
// src/mocks/handlers.js
import { http, HttpResponse } from 'msw';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export const handlers = [
  // Auth handlers
  http.post(`${SUPABASE_URL}/auth/v1/token`, () => {
    return HttpResponse.json({
      access_token: 'mock-token',
      user: { id: 'user-123', email: 'test@example.com' }
    });
  }),

  // Database handlers
  http.get(`${SUPABASE_URL}/rest/v1/listing`, ({ request }) => {
    const url = new URL(request.url);
    const select = url.searchParams.get('select');

    return HttpResponse.json([
      { id: 'listing-1', title: 'Mock Listing', price: 100 }
    ]);
  }),

  // Edge Function handlers
  http.post(`${SUPABASE_URL}/functions/v1/proposal`, async ({ request }) => {
    const body = await request.json();

    return HttpResponse.json({
      data: { id: 'proposal-123', status: 'pending' },
      error: null
    });
  }),
];
```

### Server Setup

```javascript
// src/mocks/server.js
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

### Test Setup Integration

```javascript
// vitest.setup.js
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './src/mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Current Gaps in Supabase Mocking

### Missing Mock Coverage

| Area | Files Needing Mocks | Status |
|------|---------------------|--------|
| Storage operations | `lib/photoUpload.js` | No tests |
| Real-time subscriptions | Various | No tests |
| RPC calls | Various | No tests |
| Database triggers | Backend-side | N/A |

### Recommended Mock Utilities

If continuing with `vi.mock`, create reusable mock factories:

```javascript
// src/test/mocks/supabaseMock.js
export const createSupabaseMock = (overrides = {}) => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      setSession: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      ...overrides.auth,
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
      ...overrides.functions,
    },
    from: vi.fn((table) => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    ...overrides,
  },
});
```

## Summary

| Finding | Severity | Recommendation |
|---------|----------|----------------|
| No MSW setup | Low | Keep current approach until coverage increases |
| vi.mock pattern | N/A | Valid and working for current test suite |
| Inconsistent mock factories | Medium | Create reusable mock utilities |
| Missing mock for storage | Low | Add when photo upload tests needed |

## Recommendations

### Immediate Actions

- [ ] Create `src/test/mocks/supabaseMock.js` with reusable factory
- [ ] Document mocking patterns in test documentation
- [ ] Standardize mock setup across integration tests

### Future Considerations

- [ ] Evaluate MSW when adding Playwright E2E tests
- [ ] Consider MSW for testing loading/error states in components
- [ ] Add MSW if complex retry/timeout testing needed

## Conclusion

The codebase's current use of `vi.mock` for Supabase mocking is appropriate for its test coverage level. MSW would add complexity without proportional benefit at this stage. The priority should be increasing test coverage first, then evaluating more sophisticated mocking strategies.

**Severity: Low** - Current approach is valid. Focus on adding tests before changing mocking strategy.
