# Implementation Plan: Deno Test Suite for Bidding Edge Functions

**Created**: 2026-01-29
**Type**: BUILD
**Complexity**: Single file (test file creation)
**Context File Used**: miniCLAUDE.md

---

## Objective

Implement comprehensive Deno tests for three bidding-related Supabase Edge Functions:
- `submit-bid` - Test bid submission logic
- `set-auto-bid` - Test automatic bidding configuration
- `withdraw-bid` - Test bid withdrawal functionality

---

## Scope Analysis

### Files to Create
| File | Purpose |
|------|---------|
| `supabase/functions/tests/bidding_test.ts` | Comprehensive test suite for bidding Edge Functions |

### Files Referenced (Read-Only)
| File | Purpose |
|------|---------|
| `supabase/functions/submit-bid/index.ts` | Submit bid Edge Function implementation |
| `supabase/functions/set-auto-bid/index.ts` | Auto-bid Edge Function implementation |
| `supabase/functions/withdraw-bid/index.ts` | Withdraw bid Edge Function implementation |
| `supabase/functions/_shared/bidding/BiddingService.ts` | Core bidding service class |
| `supabase/functions/_shared/bidding/types.ts` | TypeScript interfaces |
| `supabase/functions/_shared/bidding/constants.ts` | Business constants |
| `supabase/functions/tests/helpers/fixtures.ts` | Test data factories |
| `supabase/functions/tests/helpers/assertions.ts` | Custom assertions |
| `supabase/functions/_shared/validation_test.ts` | Pattern reference for test structure |

---

## Implementation Details

### Test Structure Overview

```typescript
// supabase/functions/tests/bidding_test.ts

// 1. Imports
// 2. Mock utilities (Supabase client mock, BiddingService mock)
// 3. Test fixtures (sample data factories)
// 4. Test suites organized by function:
//    - submit-bid tests
//    - set-auto-bid tests
//    - withdraw-bid tests
```

### Mocking Strategy

#### Supabase Client Mock
```typescript
function createMockSupabaseClient(options?: {
  fromSelectResult?: unknown;
  fromInsertResult?: unknown;
  fromUpdateResult?: unknown;
  authGetUserResult?: { user: { id: string; email: string } } | null;
  rpcResult?: unknown;
}): MockSupabaseClient
```

#### BiddingService Response Mocks
```typescript
interface MockBiddingServiceResponses {
  placeBid?: PlaceBidResponse | Error;
  getSession?: BiddingSession | Error;
  getBidHistory?: Bid[] | Error;
  createSession?: BiddingSession | Error;
  setMaxAutoBid?: void | Error;
  getAutoBidSettings?: { maxAutoBidAmount: number | null } | Error;
  clearAutoBid?: void | Error;
  withdrawFromSession?: void | Error;
  canWithdraw?: { canWithdraw: boolean; reason?: string } | Error;
}
```

### Test Suites

#### 1. submit-bid Edge Function Tests

| Test Case | Action | Expected Outcome |
|-----------|--------|------------------|
| Submit bid - success | `submit` | Returns bid with newHighBidder |
| Submit bid - missing sessionId | `submit` | ValidationError (400) |
| Submit bid - missing amount | `submit` | ValidationError (400) |
| Submit bid - unauthenticated | `submit` | Authentication required (401) |
| Submit bid - invalid session | `submit` | Session not found error |
| Submit bid - session expired | `submit` | Session expired error |
| Submit bid - below minimum | `submit` | Bid validation failed |
| Get session - success | `get_session` | Returns session data |
| Get session - missing sessionId | `get_session` | ValidationError (400) |
| Get session - not found | `get_session` | Session not found error |
| Get bid history - success | `get_bid_history` | Returns array of bids |
| Get bid history - empty | `get_bid_history` | Returns empty array |
| Create session - success | `create_session` | Returns new session |
| Create session - missing fields | `create_session` | ValidationError (400) |
| Create session - unauthenticated | `create_session` | Authentication required (401) |
| Invalid action | `invalid` | Invalid action error (400) |
| OPTIONS request | (CORS) | Returns 200 with CORS headers |

#### 2. set-auto-bid Edge Function Tests

| Test Case | Action | Expected Outcome |
|-----------|--------|------------------|
| Set auto-bid - success | `set` | Returns settings confirmation |
| Set auto-bid - missing sessionId | `set` | ValidationError (400) |
| Set auto-bid - missing maxAmount | `set` | ValidationError (400) |
| Set auto-bid - unauthenticated | `set` | Authentication required (401) |
| Set auto-bid - session not active | `set` | Session is completed error |
| Get auto-bid - success | `get` | Returns maxAutoBidAmount |
| Get auto-bid - no settings | `get` | Returns null maxAutoBidAmount |
| Get auto-bid - missing sessionId | `get` | ValidationError (400) |
| Clear auto-bid - success | `clear` | Returns null maxAutoBidAmount |
| Clear auto-bid - missing sessionId | `clear` | ValidationError (400) |
| Invalid action | `invalid` | Invalid action error (400) |
| OPTIONS request | (CORS) | Returns 200 with CORS headers |

#### 3. withdraw-bid Edge Function Tests

| Test Case | Action | Expected Outcome |
|-----------|--------|------------------|
| Withdraw - success | `withdraw` | Returns withdrawn: true |
| Withdraw - missing sessionId | `withdraw` | ValidationError (400) |
| Withdraw - unauthenticated | `withdraw` | Authentication required (401) |
| Withdraw - session not active | `withdraw` | Session is completed error |
| Withdraw - holding high bid | `withdraw` | Cannot withdraw error |
| Withdraw - with reason | `withdraw` | Returns withdrawn: true |
| Get withdrawal status - can withdraw | `get_withdrawal_status` | Returns canWithdraw: true |
| Get withdrawal status - cannot (high bid) | `get_withdrawal_status` | Returns canWithdraw: false with reason |
| Get withdrawal status - missing sessionId | `get_withdrawal_status` | ValidationError (400) |
| Invalid action | `invalid` | Invalid action error (400) |
| OPTIONS request | (CORS) | Returns 200 with CORS headers |

### Test Fixtures

```typescript
// Sample session fixture
const sampleBiddingSession: BiddingSession = {
  sessionId: 'session_test_123',
  targetNight: new Date('2026-02-01'),
  propertyId: 'property_test_456',
  listingId: 'listing_test_789',
  status: 'active',
  startedAt: new Date('2026-01-29T10:00:00Z'),
  expiresAt: new Date('2026-01-29T22:00:00Z'),
  maxRounds: 3,
  roundDurationSeconds: 3600,
  minimumIncrementPercent: 10,
  currentRound: 1,
  winningBidAmount: 500,
  winnerUserId: 'user_1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Sample participant fixture
const sampleBiddingParticipant: BiddingParticipant = {
  participantId: 'participant_test_1',
  sessionId: 'session_test_123',
  userId: 'user_test_1',
  userName: 'Test User',
  userArchetype: 'big_spender',
  currentBidAmount: 500,
  maxAutoBidAmount: 1000,
  totalBidsPlaced: 1,
  joinedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Sample bid fixture
const sampleBid: Bid = {
  bidId: 'bid_test_1',
  sessionId: 'session_test_123',
  userId: 'user_test_1',
  amount: 550,
  roundNumber: 1,
  isAutoBid: false,
  previousHighBid: 500,
  incrementAmount: 50,
  incrementPercent: 10,
  wasValid: true,
  placedAt: new Date(),
  createdAt: new Date(),
};
```

---

## Technical Considerations

### Import Paths
```typescript
// Standard library assertions
import { assertEquals, assertThrows, assertRejects } from 'jsr:@std/assert';

// Bidding types (relative imports)
import type {
  BiddingSession,
  BiddingParticipant,
  Bid,
  PlaceBidRequest,
  PlaceBidResponse,
} from '../_shared/bidding/types.ts';

// Test helpers
import { createMockRequest, createActionPayload } from './helpers/fixtures.ts';
```

### Edge Function Testing Approach

Since Edge Functions use `Deno.serve()`, we cannot directly invoke them in tests. Instead:

1. **Unit test the request handling logic** by simulating:
   - Request parsing (`body.action`, `body.payload`)
   - Validation logic
   - Response formatting

2. **Mock external dependencies**:
   - Supabase client (database operations)
   - BiddingService methods
   - Authentication helper function

3. **Test at the handler level** by extracting handler logic or testing response formatting

### Environment Variables

Tests should work without real env vars by using mocks:
```typescript
// Mock Deno.env.get for tests
const originalEnvGet = Deno.env.get;
Deno.env.get = (key: string) => {
  const mockEnv: Record<string, string> = {
    'SUPABASE_URL': 'https://test.supabase.co',
    'SUPABASE_SERVICE_ROLE_KEY': 'test-service-key',
    'SUPABASE_ANON_KEY': 'test-anon-key',
  };
  return mockEnv[key] ?? originalEnvGet(key);
};
```

---

## Execution Steps

### Step 1: Create test file structure
Create `supabase/functions/tests/bidding_test.ts` with:
- File header comment
- All required imports
- Mock utility functions

### Step 2: Implement Supabase client mock
Create a mock that:
- Returns configurable responses for `.from()`, `.select()`, `.insert()`, `.update()`
- Handles auth.getUser() mocking
- Can be configured per-test

### Step 3: Implement test fixtures
Add bidding-specific fixtures:
- `createSampleBiddingSession()`
- `createSampleBiddingParticipant()`
- `createSampleBid()`
- `createSampleUser()`

### Step 4: Implement submit-bid tests
Write all test cases for the submit-bid function following the test table above.

### Step 5: Implement set-auto-bid tests
Write all test cases for the set-auto-bid function following the test table above.

### Step 6: Implement withdraw-bid tests
Write all test cases for the withdraw-bid function following the test table above.

### Step 7: Verify tests pass
Run `deno test --allow-env --allow-read supabase/functions/tests/bidding_test.ts`

---

## Validation Criteria

- [ ] All tests pass with `deno test`
- [ ] Test file follows project naming convention (`*_test.ts`)
- [ ] Uses `jsr:@std/assert` for assertions
- [ ] Properly mocks Supabase client and BiddingService
- [ ] Covers success paths, error handling, and edge cases
- [ ] Tests are organized by function (submit-bid, set-auto-bid, withdraw-bid)
- [ ] No external dependencies required (all mocked)
- [ ] Test file can run in isolation

---

## Running Tests

```bash
# Run just bidding tests
deno test --allow-env --allow-read supabase/functions/tests/bidding_test.ts

# Run all function tests
cd supabase/functions && deno task test

# Run with verbose output
deno test --allow-env --allow-read --verbose supabase/functions/tests/bidding_test.ts
```

---

## Files Changed Summary

| Action | File |
|--------|------|
| CREATE | `supabase/functions/tests/bidding_test.ts` |

---

## Dependencies

- Deno runtime (already configured)
- `jsr:@std/assert` (standard Deno assertions)
- Existing test helpers in `supabase/functions/tests/helpers/`
- Bidding types from `supabase/functions/_shared/bidding/types.ts`

---

## Notes

- This plan focuses on unit testing the Edge Function logic in isolation
- Integration tests (actual HTTP requests to running functions) are out of scope
- The mocking approach allows tests to run quickly without database connections
- Tests validate the request/response contract and business rule enforcement
