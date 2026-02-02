/**
 * =====================================================
 * PATTERN 4: BIDDING LOGIC TESTS
 * =====================================================
 * Comprehensive test suite for core bidding logic
 * Run with: deno test --allow-all
 */

import { assertEquals, assert, assertThrows } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import {
    validateBid,
    processAutoBid,
    determineWinner,
    calculateLoserCompensation,
    isSessionExpired,
    shouldFinalizeSession,
    checkBiddingEligibility,
    calculateBidIncrement,
    analyzeBidHistory,
} from '../src/utils/biddingLogic.ts';
import {
    BiddingSession,
    BiddingParticipant,
    Bid,
    BiddingSessionStatus,
    BIDDING_CONSTANTS,
} from '../src/types/bidding.types.ts';

// =====================================================
// TEST FIXTURES
// =====================================================

const createMockSession = (overrides?: Partial<BiddingSession>): BiddingSession => ({
    sessionId: 'test_session_001',
    targetNight: new Date('2026-10-15'),
    propertyId: 'prop_123',
    status: BiddingSessionStatus.ACTIVE,
    startedAt: new Date(),
    expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
    maxRounds: 3,
    roundDurationSeconds: 3600,
    minimumIncrementPercent: 10.0,
    currentRound: 1,
    winningBidAmount: 3000,
    winnerUserId: 'user_123',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
});

const createMockParticipant = (
    userId: string,
    overrides?: Partial<BiddingParticipant>
): BiddingParticipant => ({
    participantId: `part_${userId}`,
    sessionId: 'test_session_001',
    userId,
    userName: `User ${userId}`,
    userArchetype: 'big_spender',
    totalBidsPlaced: 0,
    isWinner: false,
    compensationAmount: 0,
    joinedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
});

const createMockBid = (userId: string, amount: number, overrides?: Partial<Bid>): Bid => ({
    bidId: `bid_${Date.now()}_${Math.random()}`,
    sessionId: 'test_session_001',
    userId,
    amount,
    roundNumber: 1,
    isAutoBid: false,
    wasValid: true,
    placedAt: new Date(),
    createdAt: new Date(),
    ...overrides,
});

// =====================================================
// BID VALIDATION TESTS
// =====================================================

Deno.test('validateBid - should accept valid bid above minimum', () => {
    const session = createMockSession({ winningBidAmount: 3000 });
    const bidHistory: Bid[] = [];

    const result = validateBid(3300, session, 'user_789', bidHistory);

    assertEquals(result.valid, true);
    assertEquals(result.errors.length, 0);
    assertEquals(result.minimumNextBid, 3300); // 3000 * 1.10
});

Deno.test('validateBid - should reject bid below minimum increment', () => {
    const session = createMockSession({ winningBidAmount: 3000 });
    const bidHistory: Bid[] = [];

    const result = validateBid(3100, session, 'user_789', bidHistory);

    assertEquals(result.valid, false);
    assert(result.errors.some(e => e.includes('Minimum bid')));
});

Deno.test('validateBid - should reject bid on own high bid', () => {
    const session = createMockSession({ winningBidAmount: 3000, winnerUserId: 'user_123' });
    const bidHistory: Bid[] = [];

    const result = validateBid(3500, session, 'user_123', bidHistory);

    assertEquals(result.valid, false);
    assert(result.errors.some(e => e.includes('already have the high bid')));
});

Deno.test('validateBid - should reject bid in non-active session', () => {
    const session = createMockSession({
        status: BiddingSessionStatus.COMPLETED,
        winningBidAmount: 3000,
    });
    const bidHistory: Bid[] = [];

    const result = validateBid(3500, session, 'user_789', bidHistory);

    assertEquals(result.valid, false);
    assert(result.errors.some(e => e.includes('completed')));
});

Deno.test('validateBid - should reject bid when max rounds reached', () => {
    const session = createMockSession({ winningBidAmount: 3000, maxRounds: 3 });
    const bidHistory: Bid[] = [
        createMockBid('user_789', 2800),
        createMockBid('user_789', 3000),
        createMockBid('user_789', 3200),
    ];

    const result = validateBid(3500, session, 'user_789', bidHistory);

    assertEquals(result.valid, false);
    assert(result.errors.some(e => e.includes('Maximum 3 bids')));
});

Deno.test('validateBid - should reject bid exceeding maximum', () => {
    const session = createMockSession({ winningBidAmount: 3000 });
    const bidHistory: Bid[] = [];

    const result = validateBid(10000, session, 'user_789', bidHistory); // 2x max

    assertEquals(result.valid, false);
    assert(result.errors.some(e => e.includes('cannot exceed')));
});

// =====================================================
// AUTO-BID TESTS
// =====================================================

Deno.test('processAutoBid - should trigger auto-bid when below max', () => {
    const session = createMockSession({ winningBidAmount: 3000 });
    const participants = [
        createMockParticipant('user_123'),
        createMockParticipant('user_789', { maxAutoBidAmount: 3800 }),
    ];
    const newBid = createMockBid('user_123', 3300);

    const result = processAutoBid(session, participants, newBid);

    assertEquals(result.autoBidTriggered, true);
    assert(result.autoBid !== undefined);
    assertEquals(result.autoBid?.amount, 3630); // 3300 * 1.10
    assertEquals(result.autoBid?.isAutoBid, true);
});

Deno.test('processAutoBid - should not exceed max auto-bid', () => {
    const session = createMockSession({ winningBidAmount: 3000 });
    const participants = [
        createMockParticipant('user_123'),
        createMockParticipant('user_789', { maxAutoBidAmount: 3500 }),
    ];
    const newBid = createMockBid('user_123', 3400);

    const result = processAutoBid(session, participants, newBid);

    assertEquals(result.autoBidTriggered, true);
    assertEquals(result.autoBid?.amount, 3500); // Capped at max
});

Deno.test('processAutoBid - should not trigger if no max set', () => {
    const session = createMockSession({ winningBidAmount: 3000 });
    const participants = [
        createMockParticipant('user_123'),
        createMockParticipant('user_789', { maxAutoBidAmount: undefined }),
    ];
    const newBid = createMockBid('user_123', 3300);

    const result = processAutoBid(session, participants, newBid);

    assertEquals(result.autoBidTriggered, false);
    assert(result.reason?.includes('not set max auto-bid'));
});

Deno.test('processAutoBid - should not trigger if new bid exceeds max', () => {
    const session = createMockSession({ winningBidAmount: 3000 });
    const participants = [
        createMockParticipant('user_123'),
        createMockParticipant('user_789', { maxAutoBidAmount: 3500 }),
    ];
    const newBid = createMockBid('user_123', 3600);

    const result = processAutoBid(session, participants, newBid);

    assertEquals(result.autoBidTriggered, false);
    assert(result.reason?.includes('exceeds max auto-bid'));
});

// =====================================================
// WINNER DETERMINATION TESTS
// =====================================================

Deno.test('determineWinner - should correctly identify winner and calculate compensation', () => {
    const session = createMockSession({
        winningBidAmount: 4000,
        winnerUserId: 'user_123',
    });
    const participants = [
        createMockParticipant('user_123'),
        createMockParticipant('user_789'),
    ];

    const result = determineWinner(session, participants);

    assertEquals(result.winner.userId, 'user_123');
    assertEquals(result.loser.userId, 'user_789');
    assertEquals(result.winningBid, 4000);
    assertEquals(result.loserCompensation, 1000); // 25% of 4000
    assertEquals(result.platformRevenue, 3000); // 4000 - 1000
});

Deno.test('calculateLoserCompensation - should calculate 25% correctly', () => {
    assertEquals(calculateLoserCompensation(4000), 1000);
    assertEquals(calculateLoserCompensation(3600), 900);
    assertEquals(calculateLoserCompensation(5000), 1250);
});

Deno.test('determineWinner - should throw if no winner set', () => {
    const session = createMockSession({
        winningBidAmount: undefined,
        winnerUserId: undefined,
    });
    const participants = [
        createMockParticipant('user_123'),
        createMockParticipant('user_789'),
    ];

    assertThrows(
        () => determineWinner(session, participants),
        Error,
        'No bids in session'
    );
});

// =====================================================
// SESSION STATE TESTS
// =====================================================

Deno.test('isSessionExpired - should detect expired session', () => {
    const expiredSession = createMockSession({
        expiresAt: new Date(Date.now() - 1000), // 1 second ago
    });

    assertEquals(isSessionExpired(expiredSession), true);
});

Deno.test('isSessionExpired - should detect active session', () => {
    const activeSession = createMockSession({
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
    });

    assertEquals(isSessionExpired(activeSession), false);
});

Deno.test('shouldFinalizeSession - should return true if expired', () => {
    const session = createMockSession({
        expiresAt: new Date(Date.now() - 1000),
    });
    const bidHistory: Bid[] = [];

    assertEquals(shouldFinalizeSession(session, bidHistory), true);
});

Deno.test('shouldFinalizeSession - should return true if both users reached max rounds', () => {
    const session = createMockSession({ maxRounds: 3 });
    const bidHistory: Bid[] = [
        createMockBid('user_123', 3000),
        createMockBid('user_789', 3300),
        createMockBid('user_123', 3630),
        createMockBid('user_789', 3993),
        createMockBid('user_123', 4392),
        createMockBid('user_789', 4831),
    ];

    assertEquals(shouldFinalizeSession(session, bidHistory), true);
});

// =====================================================
// ELIGIBILITY TESTS
// =====================================================

Deno.test('checkBiddingEligibility - should allow two Big Spenders', () => {
    const requester = { userId: 'user_123', archetype: 'big_spender' };
    const roommate = { userId: 'user_789', archetype: 'big_spender' };
    const targetNight = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const result = checkBiddingEligibility(requester, roommate, targetNight);

    assertEquals(result.eligible, true);
});

Deno.test('checkBiddingEligibility - should reject if not both Big Spenders', () => {
    const requester = { userId: 'user_123', archetype: 'big_spender' };
    const roommate = { userId: 'user_789', archetype: 'high_flex' };
    const targetNight = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const result = checkBiddingEligibility(requester, roommate, targetNight);

    assertEquals(result.eligible, false);
    assert(result.reason?.includes('Big Spenders'));
});

Deno.test('checkBiddingEligibility - should reject if target too far in future', () => {
    const requester = { userId: 'user_123', archetype: 'big_spender' };
    const roommate = { userId: 'user_789', archetype: 'big_spender' };
    const targetNight = new Date(Date.now() + 40 * 24 * 60 * 60 * 1000); // 40 days

    const result = checkBiddingEligibility(requester, roommate, targetNight);

    assertEquals(result.eligible, false);
    assert(result.reason?.includes('30 days'));
});

// =====================================================
// BID INCREMENT TESTS
// =====================================================

Deno.test('calculateBidIncrement - should calculate increment correctly', () => {
    const result = calculateBidIncrement(3300, 3000);

    assertEquals(result.amount, 300);
    assertEquals(result.percent, 10);
});

Deno.test('calculateBidIncrement - should handle larger increments', () => {
    const result = calculateBidIncrement(4000, 3000);

    assertEquals(result.amount, 1000);
    assertEquals(result.percent, 33.33);
});

// =====================================================
// BID HISTORY ANALYSIS TESTS
// =====================================================

Deno.test('analyzeBidHistory - should analyze bid history correctly', () => {
    const bidHistory: Bid[] = [
        createMockBid('user_123', 3000, { incrementAmount: 500, isAutoBid: false }),
        createMockBid('user_789', 3300, { incrementAmount: 300, isAutoBid: false }),
        createMockBid('user_123', 3630, { incrementAmount: 330, isAutoBid: true }),
        createMockBid('user_789', 4000, { incrementAmount: 370, isAutoBid: false }),
    ];

    const analysis = analyzeBidHistory(bidHistory, 2500);

    assertEquals(analysis.totalBids, 4);
    assertEquals(analysis.manualBids, 3);
    assertEquals(analysis.autoBids, 1);
    assertEquals(analysis.totalPriceIncrease, 1500); // 4000 - 2500
    assertEquals(analysis.priceIncreasePercent, 60);
});

// =====================================================
// EDGE CASES
// =====================================================

Deno.test('validateBid - should handle zero current bid (first bid)', () => {
    const session = createMockSession({ winningBidAmount: 0, winnerUserId: undefined });
    const bidHistory: Bid[] = [];

    const result = validateBid(1000, session, 'user_123', bidHistory);

    assertEquals(result.valid, true);
    assertEquals(result.minimumNextBid, 0);
});

Deno.test('processAutoBid - should handle exact match to max auto-bid', () => {
    const session = createMockSession({ winningBidAmount: 3000 });
    const participants = [
        createMockParticipant('user_123'),
        createMockParticipant('user_789', { maxAutoBidAmount: 3300 }),
    ];
    const newBid = createMockBid('user_123', 3000);

    const result = processAutoBid(session, participants, newBid);

    assertEquals(result.autoBidTriggered, true);
    assertEquals(result.autoBid?.amount, 3300); // Exactly at max
});

// =====================================================
// TEST SUMMARY
// =====================================================

console.log('\n========================================');
console.log('PATTERN 4: BIDDING LOGIC TESTS COMPLETE');
console.log('========================================\n');
