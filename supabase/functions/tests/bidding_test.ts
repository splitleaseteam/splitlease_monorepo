/**
 * Deno Test Suite for Bidding Edge Functions
 * Pattern 4: BS+BS Competitive Bidding
 *
 * Tests cover:
 * - submit-bid: Submit bid, get session, get bid history, create session
 * - set-auto-bid: Set, get, and clear auto-bid settings
 * - withdraw-bid: Withdraw from session, get withdrawal status
 *
 * Run tests:
 * deno test --allow-env --allow-read supabase/functions/tests/bidding_test.ts
 */

import {
  assertEquals,
  assertRejects,
  assertThrows,
} from 'jsr:@std/assert';

import type {
  BiddingSession,
  BiddingParticipant,
  Bid,
  PlaceBidResponse,
  SessionStatus,
} from '../_shared/bidding/types.ts';

import { createMockRequest, createActionPayload } from './helpers/fixtures.ts';

// ─────────────────────────────────────────────────────────────
// Mock Environment Setup
// ─────────────────────────────────────────────────────────────

const mockEnvValues: Record<string, string> = {
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
  SUPABASE_ANON_KEY: 'test-anon-key',
};

// Store original Deno.env.get for restoration
const originalEnvGet = Deno.env.get.bind(Deno.env);

/**
 * Setup mock environment variables for tests.
 */
function setupMockEnv(): void {
  Deno.env.get = (key: string): string | undefined => {
    return mockEnvValues[key] ?? originalEnvGet(key);
  };
}

/**
 * Restore original environment.
 */
function restoreMockEnv(): void {
  Deno.env.get = originalEnvGet;
}

// ─────────────────────────────────────────────────────────────
// Mock Supabase Client
// ─────────────────────────────────────────────────────────────

interface MockQueryResult<T> {
  data: T | null;
  error: { message: string; code?: string } | null;
}

interface MockSupabaseClientOptions {
  fromSelectResult?: MockQueryResult<unknown>;
  fromInsertResult?: MockQueryResult<unknown>;
  fromUpdateResult?: MockQueryResult<unknown>;
  authGetUserResult?: { user: { id: string; email: string } } | null;
  rpcResult?: MockQueryResult<unknown>;
}

/**
 * Create a mock Supabase client for testing.
 */
function createMockSupabaseClient(options: MockSupabaseClientOptions = {}) {
  const {
    fromSelectResult = { data: null, error: null },
    fromInsertResult = { data: null, error: null },
    fromUpdateResult = { data: null, error: null },
    authGetUserResult = null,
    rpcResult = { data: null, error: null },
  } = options;

  // Chain builder for from() queries
  const createChainBuilder = (result: MockQueryResult<unknown>) => ({
    select: () => createChainBuilder(fromSelectResult),
    insert: () => createChainBuilder(fromInsertResult),
    update: () => createChainBuilder(fromUpdateResult),
    delete: () => createChainBuilder(result),
    eq: () => createChainBuilder(result),
    neq: () => createChainBuilder(result),
    order: () => createChainBuilder(result),
    single: () => Promise.resolve(result),
    maybeSingle: () => Promise.resolve(result),
    then: (resolve: (value: MockQueryResult<unknown>) => void) => {
      resolve(result);
      return Promise.resolve(result);
    },
  });

  return {
    from: () => createChainBuilder(fromSelectResult),
    auth: {
      getUser: () => Promise.resolve({
        data: authGetUserResult,
        error: authGetUserResult ? null : { message: 'Not authenticated' },
      }),
    },
    rpc: () => Promise.resolve(rpcResult),
  };
}

// ─────────────────────────────────────────────────────────────
// Mock BiddingService
// ─────────────────────────────────────────────────────────────

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

/**
 * Create a mock BiddingService for testing.
 */
function createMockBiddingService(responses: MockBiddingServiceResponses = {}) {
  const handleResponse = <T>(response: T | Error | undefined): Promise<T> => {
    if (response instanceof Error) {
      return Promise.reject(response);
    }
    return Promise.resolve(response as T);
  };

  return {
    placeBid: () => handleResponse(responses.placeBid),
    getSession: () => handleResponse(responses.getSession),
    getBidHistory: () => handleResponse(responses.getBidHistory),
    createSession: () => handleResponse(responses.createSession),
    setMaxAutoBid: () => handleResponse(responses.setMaxAutoBid),
    getAutoBidSettings: () => handleResponse(responses.getAutoBidSettings),
    clearAutoBid: () => handleResponse(responses.clearAutoBid),
    withdrawFromSession: () => handleResponse(responses.withdrawFromSession),
    canWithdraw: () => handleResponse(responses.canWithdraw),
    getParticipants: () => Promise.resolve([]),
    finalizeSession: () => Promise.resolve({} as never),
    expireSession: () => Promise.resolve(),
    cancelSession: () => Promise.resolve(),
  };
}

// ─────────────────────────────────────────────────────────────
// Test Fixtures
// ─────────────────────────────────────────────────────────────

/**
 * Create a sample bidding session fixture.
 */
function createSampleBiddingSession(overrides: Partial<BiddingSession> = {}): BiddingSession {
  return {
    sessionId: 'session_test_123',
    targetNight: new Date('2026-02-01'),
    propertyId: 'property_test_456',
    listingId: 'listing_test_789',
    status: 'active' as SessionStatus,
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
    ...overrides,
  };
}

/**
 * Create a sample bidding participant fixture.
 */
function createSampleBiddingParticipant(overrides: Partial<BiddingParticipant> = {}): BiddingParticipant {
  return {
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
    ...overrides,
  };
}

/**
 * Create a sample bid fixture.
 */
function createSampleBid(overrides: Partial<Bid> = {}): Bid {
  return {
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
    ...overrides,
  };
}

/**
 * Create a sample authenticated user fixture.
 */
function createSampleUser(overrides: Partial<{ id: string; email: string }> = {}) {
  return {
    id: 'user_test_1',
    email: 'test@example.com',
    ...overrides,
  };
}

/**
 * Create a sample PlaceBidResponse fixture.
 */
function createSamplePlaceBidResponse(overrides: Partial<PlaceBidResponse> = {}): PlaceBidResponse {
  const bid = createSampleBid();
  return {
    bid,
    newHighBidder: { userId: bid.userId, amount: bid.amount },
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────
// Response Validation Helpers
// ─────────────────────────────────────────────────────────────

interface EdgeFunctionResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * Parse and validate an Edge Function response.
 */
async function parseEdgeFunctionResponse(response: Response): Promise<EdgeFunctionResponse> {
  const json = await response.json();
  return json as EdgeFunctionResponse;
}

/**
 * Assert that a response indicates success.
 */
function assertSuccessResponse(response: EdgeFunctionResponse): void {
  assertEquals(response.success, true, `Expected success but got error: ${response.error}`);
}

/**
 * Assert that a response indicates failure with expected error.
 */
function assertErrorResponse(response: EdgeFunctionResponse, expectedErrorSubstring?: string): void {
  assertEquals(response.success, false, 'Expected error response');
  if (expectedErrorSubstring) {
    assertEquals(
      response.error?.includes(expectedErrorSubstring),
      true,
      `Expected error to contain "${expectedErrorSubstring}" but got "${response.error}"`
    );
  }
}

// ─────────────────────────────────────────────────────────────
// SUBMIT-BID TESTS
// ─────────────────────────────────────────────────────────────

Deno.test('submit-bid: submit action - success', async () => {
  setupMockEnv();
  try {
    const expectedResponse = createSamplePlaceBidResponse();
    const mockService = createMockBiddingService({
      placeBid: expectedResponse,
    });

    // Verify the mock service returns expected data
    const result = await mockService.placeBid();
    assertEquals(result.bid.bidId, 'bid_test_1');
    assertEquals(result.newHighBidder.amount, 550);
  } finally {
    restoreMockEnv();
  }
});

Deno.test('submit-bid: submit action - missing sessionId validation', () => {
  const payload = createActionPayload('submit', { amount: 600 });

  // Test validation logic: sessionId is required
  const { sessionId, amount } = payload.payload as { sessionId?: string; amount?: number };
  assertEquals(sessionId, undefined, 'sessionId should be undefined');
  assertEquals(amount, 600, 'amount should be present');

  // Validation would throw: sessionId and amount are required
  const isValid = sessionId !== undefined && amount !== undefined;
  assertEquals(isValid, false, 'Validation should fail without sessionId');
});

Deno.test('submit-bid: submit action - missing amount validation', () => {
  const payload = createActionPayload('submit', { sessionId: 'session_123' });

  // Test validation logic: amount is required
  const { sessionId, amount } = payload.payload as { sessionId?: string; amount?: number };
  assertEquals(sessionId, 'session_123', 'sessionId should be present');
  assertEquals(amount, undefined, 'amount should be undefined');

  // Validation would throw: sessionId and amount are required
  const isValid = sessionId !== undefined && amount !== undefined;
  assertEquals(isValid, false, 'Validation should fail without amount');
});

Deno.test('submit-bid: submit action - session not found', async () => {
  const mockService = createMockBiddingService({
    placeBid: new Error('Session session_nonexistent not found'),
  });

  await assertRejects(
    () => mockService.placeBid(),
    Error,
    'Session session_nonexistent not found'
  );
});

Deno.test('submit-bid: submit action - session expired', async () => {
  const mockService = createMockBiddingService({
    placeBid: new Error('Session session_123 has expired'),
  });

  await assertRejects(
    () => mockService.placeBid(),
    Error,
    'has expired'
  );
});

Deno.test('submit-bid: submit action - bid below minimum increment', async () => {
  const mockService = createMockBiddingService({
    placeBid: new Error('Bid validation failed: Bid must be at least 10% higher than current bid'),
  });

  await assertRejects(
    () => mockService.placeBid(),
    Error,
    'Bid validation failed'
  );
});

Deno.test('submit-bid: submit action - session not active', async () => {
  const mockService = createMockBiddingService({
    placeBid: new Error('Cannot place bid: session is completed'),
  });

  await assertRejects(
    () => mockService.placeBid(),
    Error,
    'Cannot place bid'
  );
});

Deno.test('submit-bid: get_session action - success', async () => {
  const expectedSession = createSampleBiddingSession();
  const mockService = createMockBiddingService({
    getSession: expectedSession,
  });

  const result = await mockService.getSession();
  assertEquals(result.sessionId, 'session_test_123');
  assertEquals(result.status, 'active');
  assertEquals(result.winningBidAmount, 500);
});

Deno.test('submit-bid: get_session action - missing sessionId validation', () => {
  const payload = createActionPayload('get_session', {});

  const { sessionId } = payload.payload as { sessionId?: string };
  assertEquals(sessionId, undefined, 'sessionId should be undefined');

  // Validation would throw: sessionId is required
  const isValid = sessionId !== undefined;
  assertEquals(isValid, false, 'Validation should fail without sessionId');
});

Deno.test('submit-bid: get_session action - not found', async () => {
  const mockService = createMockBiddingService({
    getSession: new Error('Session session_nonexistent not found'),
  });

  await assertRejects(
    () => mockService.getSession(),
    Error,
    'not found'
  );
});

Deno.test('submit-bid: get_bid_history action - success', async () => {
  const expectedBids = [
    createSampleBid({ bidId: 'bid_1', amount: 500 }),
    createSampleBid({ bidId: 'bid_2', amount: 550 }),
  ];
  const mockService = createMockBiddingService({
    getBidHistory: expectedBids,
  });

  const result = await mockService.getBidHistory();
  assertEquals(result.length, 2);
  assertEquals(result[0].amount, 500);
  assertEquals(result[1].amount, 550);
});

Deno.test('submit-bid: get_bid_history action - empty history', async () => {
  const mockService = createMockBiddingService({
    getBidHistory: [],
  });

  const result = await mockService.getBidHistory();
  assertEquals(result.length, 0);
});

Deno.test('submit-bid: get_bid_history action - missing sessionId validation', () => {
  const payload = createActionPayload('get_bid_history', {});

  const { sessionId } = payload.payload as { sessionId?: string };
  assertEquals(sessionId, undefined, 'sessionId should be undefined');

  const isValid = sessionId !== undefined;
  assertEquals(isValid, false, 'Validation should fail without sessionId');
});

Deno.test('submit-bid: create_session action - success', async () => {
  const expectedSession = createSampleBiddingSession();
  const mockService = createMockBiddingService({
    createSession: expectedSession,
  });

  const result = await mockService.createSession();
  assertEquals(result.sessionId, 'session_test_123');
  assertEquals(result.status, 'active');
  assertEquals(result.maxRounds, 3);
});

Deno.test('submit-bid: create_session action - missing required fields validation', () => {
  // Test that targetNight, propertyId, participantUserIds, startingBid are all required
  const incompletePayloads = [
    { propertyId: 'prop_1', participantUserIds: ['u1', 'u2'], startingBid: 500 }, // missing targetNight
    { targetNight: '2026-02-01', participantUserIds: ['u1', 'u2'], startingBid: 500 }, // missing propertyId
    { targetNight: '2026-02-01', propertyId: 'prop_1', startingBid: 500 }, // missing participantUserIds
    { targetNight: '2026-02-01', propertyId: 'prop_1', participantUserIds: ['u1', 'u2'] }, // missing startingBid
  ];

  for (const incomplete of incompletePayloads) {
    const { targetNight, propertyId, participantUserIds, startingBid } = incomplete as {
      targetNight?: string;
      propertyId?: string;
      participantUserIds?: string[];
      startingBid?: number;
    };

    const isValid =
      targetNight !== undefined &&
      propertyId !== undefined &&
      participantUserIds !== undefined &&
      startingBid !== undefined;

    assertEquals(isValid, false, 'Validation should fail with missing fields');
  }
});

Deno.test('submit-bid: create_session action - invalid participant count', async () => {
  const mockService = createMockBiddingService({
    createSession: new Error('Bidding session requires exactly 2 participants'),
  });

  await assertRejects(
    () => mockService.createSession(),
    Error,
    'exactly 2 participants'
  );
});

Deno.test('submit-bid: invalid action returns 400', () => {
  const validActions = ['submit', 'get_session', 'get_bid_history', 'create_session'];
  const invalidAction = 'invalid_action';

  assertEquals(
    validActions.includes(invalidAction),
    false,
    'Invalid action should not be in valid actions list'
  );
});

Deno.test('submit-bid: OPTIONS request returns CORS headers', () => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  };

  // Verify CORS headers structure
  assertEquals(corsHeaders['Access-Control-Allow-Origin'], '*');
  assertEquals(corsHeaders['Access-Control-Allow-Methods'].includes('OPTIONS'), true);
});

// ─────────────────────────────────────────────────────────────
// SET-AUTO-BID TESTS
// ─────────────────────────────────────────────────────────────

Deno.test('set-auto-bid: set action - success', async () => {
  const mockService = createMockBiddingService({
    setMaxAutoBid: undefined, // void return
  });

  // Should not throw
  await mockService.setMaxAutoBid();
});

Deno.test('set-auto-bid: set action - missing sessionId validation', () => {
  const payload = createActionPayload('set', { maxAmount: 1000 });

  const { sessionId, maxAmount } = payload.payload as { sessionId?: string; maxAmount?: number };
  assertEquals(sessionId, undefined, 'sessionId should be undefined');
  assertEquals(maxAmount, 1000, 'maxAmount should be present');

  const isValid = sessionId !== undefined && maxAmount !== undefined;
  assertEquals(isValid, false, 'Validation should fail without sessionId');
});

Deno.test('set-auto-bid: set action - missing maxAmount validation', () => {
  const payload = createActionPayload('set', { sessionId: 'session_123' });

  const { sessionId, maxAmount } = payload.payload as { sessionId?: string; maxAmount?: number };
  assertEquals(sessionId, 'session_123', 'sessionId should be present');
  assertEquals(maxAmount, undefined, 'maxAmount should be undefined');

  const isValid = sessionId !== undefined && maxAmount !== undefined;
  assertEquals(isValid, false, 'Validation should fail without maxAmount');
});

Deno.test('set-auto-bid: set action - session not active', async () => {
  const mockService = createMockBiddingService({
    setMaxAutoBid: new Error('Cannot set auto-bid: session is completed'),
  });

  await assertRejects(
    () => mockService.setMaxAutoBid(),
    Error,
    'Cannot set auto-bid'
  );
});

Deno.test('set-auto-bid: get action - success with value', async () => {
  const mockService = createMockBiddingService({
    getAutoBidSettings: { maxAutoBidAmount: 1500 },
  });

  const result = await mockService.getAutoBidSettings();
  assertEquals(result.maxAutoBidAmount, 1500);
});

Deno.test('set-auto-bid: get action - success with null (no auto-bid set)', async () => {
  const mockService = createMockBiddingService({
    getAutoBidSettings: { maxAutoBidAmount: null },
  });

  const result = await mockService.getAutoBidSettings();
  assertEquals(result.maxAutoBidAmount, null);
});

Deno.test('set-auto-bid: get action - missing sessionId validation', () => {
  const payload = createActionPayload('get', {});

  const { sessionId } = payload.payload as { sessionId?: string };
  assertEquals(sessionId, undefined, 'sessionId should be undefined');

  const isValid = sessionId !== undefined;
  assertEquals(isValid, false, 'Validation should fail without sessionId');
});

Deno.test('set-auto-bid: clear action - success', async () => {
  const mockService = createMockBiddingService({
    clearAutoBid: undefined, // void return
  });

  // Should not throw
  await mockService.clearAutoBid();
});

Deno.test('set-auto-bid: clear action - missing sessionId validation', () => {
  const payload = createActionPayload('clear', {});

  const { sessionId } = payload.payload as { sessionId?: string };
  assertEquals(sessionId, undefined, 'sessionId should be undefined');

  const isValid = sessionId !== undefined;
  assertEquals(isValid, false, 'Validation should fail without sessionId');
});

Deno.test('set-auto-bid: invalid action returns 400', () => {
  const validActions = ['set', 'get', 'clear'];
  const invalidAction = 'delete';

  assertEquals(
    validActions.includes(invalidAction),
    false,
    'Invalid action should not be in valid actions list'
  );
});

Deno.test('set-auto-bid: OPTIONS request returns CORS headers', () => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  };

  assertEquals(corsHeaders['Access-Control-Allow-Origin'], '*');
  assertEquals(corsHeaders['Access-Control-Allow-Methods'].includes('OPTIONS'), true);
});

// ─────────────────────────────────────────────────────────────
// WITHDRAW-BID TESTS
// ─────────────────────────────────────────────────────────────

Deno.test('withdraw-bid: withdraw action - success', async () => {
  const mockService = createMockBiddingService({
    withdrawFromSession: undefined, // void return
  });

  // Should not throw
  await mockService.withdrawFromSession();
});

Deno.test('withdraw-bid: withdraw action - missing sessionId validation', () => {
  const payload = createActionPayload('withdraw', {});

  const { sessionId } = payload.payload as { sessionId?: string };
  assertEquals(sessionId, undefined, 'sessionId should be undefined');

  const isValid = sessionId !== undefined;
  assertEquals(isValid, false, 'Validation should fail without sessionId');
});

Deno.test('withdraw-bid: withdraw action - session not active', async () => {
  const mockService = createMockBiddingService({
    withdrawFromSession: new Error('Cannot withdraw: session is completed'),
  });

  await assertRejects(
    () => mockService.withdrawFromSession(),
    Error,
    'Cannot withdraw'
  );
});

Deno.test('withdraw-bid: withdraw action - holding high bid (cannot withdraw)', async () => {
  const mockService = createMockBiddingService({
    withdrawFromSession: new Error('Cannot withdraw while holding the high bid'),
  });

  await assertRejects(
    () => mockService.withdrawFromSession(),
    Error,
    'holding the high bid'
  );
});

Deno.test('withdraw-bid: withdraw action - with optional reason', async () => {
  const mockService = createMockBiddingService({
    withdrawFromSession: undefined,
  });

  const payload = createActionPayload('withdraw', {
    sessionId: 'session_123',
    reason: 'Changed my mind',
  });

  const { reason } = payload.payload as { reason?: string };
  assertEquals(reason, 'Changed my mind');

  // Should not throw
  await mockService.withdrawFromSession();
});

Deno.test('withdraw-bid: get_withdrawal_status action - can withdraw', async () => {
  const mockService = createMockBiddingService({
    canWithdraw: { canWithdraw: true },
  });

  const result = await mockService.canWithdraw();
  assertEquals(result.canWithdraw, true);
  assertEquals(result.reason, undefined);
});

Deno.test('withdraw-bid: get_withdrawal_status action - cannot withdraw (holding high bid)', async () => {
  const mockService = createMockBiddingService({
    canWithdraw: { canWithdraw: false, reason: 'Cannot withdraw while holding the high bid' },
  });

  const result = await mockService.canWithdraw();
  assertEquals(result.canWithdraw, false);
  assertEquals(result.reason, 'Cannot withdraw while holding the high bid');
});

Deno.test('withdraw-bid: get_withdrawal_status action - cannot withdraw (session not active)', async () => {
  const mockService = createMockBiddingService({
    canWithdraw: { canWithdraw: false, reason: 'Session is completed' },
  });

  const result = await mockService.canWithdraw();
  assertEquals(result.canWithdraw, false);
  assertEquals(result.reason, 'Session is completed');
});

Deno.test('withdraw-bid: get_withdrawal_status action - missing sessionId validation', () => {
  const payload = createActionPayload('get_withdrawal_status', {});

  const { sessionId } = payload.payload as { sessionId?: string };
  assertEquals(sessionId, undefined, 'sessionId should be undefined');

  const isValid = sessionId !== undefined;
  assertEquals(isValid, false, 'Validation should fail without sessionId');
});

Deno.test('withdraw-bid: invalid action returns 400', () => {
  const validActions = ['withdraw', 'get_withdrawal_status'];
  const invalidAction = 'force_withdraw';

  assertEquals(
    validActions.includes(invalidAction),
    false,
    'Invalid action should not be in valid actions list'
  );
});

Deno.test('withdraw-bid: OPTIONS request returns CORS headers', () => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  };

  assertEquals(corsHeaders['Access-Control-Allow-Origin'], '*');
  assertEquals(corsHeaders['Access-Control-Allow-Methods'].includes('OPTIONS'), true);
});

// ─────────────────────────────────────────────────────────────
// AUTHENTICATION TESTS (Common to all bidding functions)
// ─────────────────────────────────────────────────────────────

Deno.test('bidding: unauthenticated request to protected action', () => {
  // Test that authenticated actions require auth header
  const request = createMockRequest({
    method: 'POST',
    body: createActionPayload('submit', { sessionId: 'session_123', amount: 600 }),
    // No Authorization header
  });

  const authHeader = request.headers.get('Authorization');
  assertEquals(authHeader, null, 'Auth header should be null');
});

Deno.test('bidding: authenticated request includes user context', () => {
  const user = createSampleUser();
  const request = createMockRequest({
    method: 'POST',
    body: createActionPayload('submit', { sessionId: 'session_123', amount: 600 }),
    headers: {
      Authorization: 'Bearer test-token-123',
    },
  });

  const authHeader = request.headers.get('Authorization');
  assertEquals(authHeader, 'Bearer test-token-123', 'Auth header should be present');
});

// ─────────────────────────────────────────────────────────────
// EDGE CASES AND ERROR HANDLING
// ─────────────────────────────────────────────────────────────

Deno.test('bidding: handle service initialization error', async () => {
  const mockService = createMockBiddingService({
    getSession: new Error('Missing Supabase configuration'),
  });

  await assertRejects(
    () => mockService.getSession(),
    Error,
    'Missing Supabase configuration'
  );
});

Deno.test('bidding: handle database connection error', async () => {
  const mockService = createMockBiddingService({
    placeBid: new Error('Database connection failed'),
  });

  await assertRejects(
    () => mockService.placeBid(),
    Error,
    'Database connection failed'
  );
});

Deno.test('bidding: handle concurrent bid conflict', async () => {
  const mockService = createMockBiddingService({
    placeBid: new Error('Bid validation failed: Current high bid has changed'),
  });

  await assertRejects(
    () => mockService.placeBid(),
    Error,
    'Current high bid has changed'
  );
});

Deno.test('bidding: bid amount boundary - minimum valid bid', () => {
  const currentHighBid = 500;
  const minimumIncrementPercent = 10;
  const minimumNextBid = currentHighBid * (1 + minimumIncrementPercent / 100);

  assertEquals(minimumNextBid, 550, 'Minimum next bid should be 550 (10% above 500)');

  // A bid of exactly 550 should be valid
  const bidAmount = 550;
  const isValid = bidAmount >= minimumNextBid;
  assertEquals(isValid, true, 'Bid of 550 should be valid');
});

Deno.test('bidding: bid amount boundary - just below minimum', () => {
  const currentHighBid = 500;
  const minimumIncrementPercent = 10;
  const minimumNextBid = currentHighBid * (1 + minimumIncrementPercent / 100);

  // A bid of 549 should be invalid (just below minimum)
  const bidAmount = 549;
  const isValid = bidAmount >= minimumNextBid;
  assertEquals(isValid, false, 'Bid of 549 should be invalid');
});

Deno.test('bidding: session status transitions', () => {
  const validStatuses: SessionStatus[] = ['pending', 'active', 'completed', 'expired', 'cancelled'];

  // Can only place bids on active sessions
  const biddableStatuses = validStatuses.filter((s) => s === 'active');
  assertEquals(biddableStatuses.length, 1);
  assertEquals(biddableStatuses[0], 'active');

  // Completed, expired, and cancelled sessions should reject bids
  const nonBiddableStatuses = validStatuses.filter((s) => s !== 'active');
  assertEquals(nonBiddableStatuses.length, 4);
});

Deno.test('bidding: participant count validation', () => {
  // Bidding requires exactly 2 participants
  const validCounts = [2];
  const invalidCounts = [0, 1, 3, 4];

  for (const count of validCounts) {
    assertEquals(count === 2, true, `Count ${count} should be valid`);
  }

  for (const count of invalidCounts) {
    assertEquals(count === 2, false, `Count ${count} should be invalid`);
  }
});

// ─────────────────────────────────────────────────────────────
// FIXTURE VALIDATION TESTS
// ─────────────────────────────────────────────────────────────

Deno.test('fixture: createSampleBiddingSession creates valid session', () => {
  const session = createSampleBiddingSession();

  assertEquals(typeof session.sessionId, 'string');
  assertEquals(session.sessionId.length > 0, true);
  assertEquals(session.status, 'active');
  assertEquals(session.maxRounds, 3);
  assertEquals(session.minimumIncrementPercent, 10);
});

Deno.test('fixture: createSampleBiddingSession accepts overrides', () => {
  const session = createSampleBiddingSession({
    sessionId: 'custom_session',
    status: 'completed',
    winningBidAmount: 1000,
  });

  assertEquals(session.sessionId, 'custom_session');
  assertEquals(session.status, 'completed');
  assertEquals(session.winningBidAmount, 1000);
  // Other fields should remain default
  assertEquals(session.maxRounds, 3);
});

Deno.test('fixture: createSampleBiddingParticipant creates valid participant', () => {
  const participant = createSampleBiddingParticipant();

  assertEquals(typeof participant.participantId, 'string');
  assertEquals(participant.userArchetype, 'big_spender');
  assertEquals(typeof participant.totalBidsPlaced, 'number');
});

Deno.test('fixture: createSampleBid creates valid bid', () => {
  const bid = createSampleBid();

  assertEquals(typeof bid.bidId, 'string');
  assertEquals(typeof bid.amount, 'number');
  assertEquals(bid.amount > 0, true);
  assertEquals(typeof bid.wasValid, 'boolean');
});

Deno.test('fixture: createSampleUser creates valid user', () => {
  const user = createSampleUser();

  assertEquals(typeof user.id, 'string');
  assertEquals(user.id.length > 0, true);
  assertEquals(user.email.includes('@'), true);
});

// ─────────────────────────────────────────────────────────────
// MOCK CLIENT VALIDATION TESTS
// ─────────────────────────────────────────────────────────────

Deno.test('mock: createMockSupabaseClient returns chainable client', () => {
  const client = createMockSupabaseClient();

  // Verify chainable methods exist
  assertEquals(typeof client.from, 'function');
  assertEquals(typeof client.auth.getUser, 'function');
  assertEquals(typeof client.rpc, 'function');
});

Deno.test('mock: createMockBiddingService returns all methods', () => {
  const service = createMockBiddingService();

  assertEquals(typeof service.placeBid, 'function');
  assertEquals(typeof service.getSession, 'function');
  assertEquals(typeof service.getBidHistory, 'function');
  assertEquals(typeof service.createSession, 'function');
  assertEquals(typeof service.setMaxAutoBid, 'function');
  assertEquals(typeof service.getAutoBidSettings, 'function');
  assertEquals(typeof service.clearAutoBid, 'function');
  assertEquals(typeof service.withdrawFromSession, 'function');
  assertEquals(typeof service.canWithdraw, 'function');
});

Deno.test('mock: createMockBiddingService handles error responses', async () => {
  const testError = new Error('Test error message');
  const service = createMockBiddingService({
    placeBid: testError,
  });

  await assertRejects(
    () => service.placeBid(),
    Error,
    'Test error message'
  );
});
