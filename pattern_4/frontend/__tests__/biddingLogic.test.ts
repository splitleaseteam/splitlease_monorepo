/**
 * BIDDING LOGIC TESTS
 *
 * Comprehensive test suite for core bidding business logic.
 * Tests validation, winner determination, auto-bidding, and edge cases.
 *
 * @version 1.0.0
 */

import {
  validateBid,
  determineWinner,
  processAutoBid,
  calculateCompensation,
  canUserBid,
  isSessionExpired,
  generateBidId
} from '../utils/biddingLogic';

import { BiddingSession, Bid, BiddingParticipant } from '../types/biddingTypes';

// Mock session data
const mockParticipants: BiddingParticipant[] = [
  {
    userId: 'user_123',
    name: 'John',
    archetype: 'big_spender',
    currentBid: 2835,
    maxAutoBid: 3500,
    lastBidAt: new Date('2026-01-28T14:30:00Z'),
    isWinner: false,
    compensation: 0
  },
  {
    userId: 'user_789',
    name: 'Sarah',
    archetype: 'big_spender',
    currentBid: 3100,
    maxAutoBid: null,
    lastBidAt: new Date('2026-01-28T14:45:00Z'),
    isWinner: false,
    compensation: 0
  }
];

const mockBid: Bid = {
  bidId: 'bid_xyz789',
  userId: 'user_789',
  userName: 'Sarah',
  amount: 3100,
  timestamp: new Date('2026-01-28T14:45:00Z'),
  isAutoBid: false,
  round: 2
};

const mockSession: BiddingSession = {
  sessionId: 'bid_abc123',
  targetNight: new Date('2026-10-15'),
  propertyId: 'prop_456',
  participants: mockParticipants,
  currentHighBid: mockBid,
  biddingHistory: [mockBid],
  status: 'active',
  startedAt: new Date('2026-01-28T14:00:00Z'),
  expiresAt: new Date('2026-01-28T17:00:00Z'),
  maxRounds: 3,
  roundDuration: 3600,
  minimumIncrement: 310 // 10% of 3100
};

describe('validateBid', () => {

  test('validates valid bid above minimum', () => {
    const result = validateBid(3410, mockSession, 'user_123');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('rejects bid below current high', () => {
    const result = validateBid(3000, mockSession, 'user_123');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(expect.stringContaining('exceed current high bid'));
  });

  test('rejects bid below minimum increment', () => {
    const result = validateBid(3250, mockSession, 'user_123');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(expect.stringContaining('10% increment required'));
  });

  test('rejects bid from current high bidder', () => {
    const result = validateBid(3500, mockSession, 'user_789');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('You already have the high bid');
  });

  test('rejects bid when max rounds reached', () => {
    const sessionWith3Bids = {
      ...mockSession,
      biddingHistory: [
        { ...mockBid, bidId: 'bid_1', userId: 'user_123', round: 1 },
        { ...mockBid, bidId: 'bid_2', userId: 'user_123', round: 2 },
        { ...mockBid, bidId: 'bid_3', userId: 'user_123', round: 3 }
      ] as Bid[]
    };

    const result = validateBid(3500, sessionWith3Bids, 'user_123');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(expect.stringContaining('Maximum 3 bids'));
  });

  test('rejects excessive bid (>2x current high)', () => {
    const result = validateBid(7000, mockSession, 'user_123');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(expect.stringContaining('cannot exceed'));
  });

  test('provides warning for very high bid', () => {
    const result = validateBid(5000, mockSession, 'user_123');
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('%');
  });

  test('calculates correct minimum next bid', () => {
    const result = validateBid(3410, mockSession, 'user_123');
    expect(result.minimumNextBid).toBe(3410); // 3100 + 310
  });

  test('calculates suggested bid as 15% above current', () => {
    const result = validateBid(3565, mockSession, 'user_123');
    expect(result.suggestedBid).toBe(Math.round(3100 * 1.15));
  });

});

describe('determineWinner', () => {

  test('correctly identifies winner and loser', () => {
    const result = determineWinner(mockSession);

    expect(result.winner.userId).toBe('user_789');
    expect(result.loser.userId).toBe('user_123');
    expect(result.winningBid).toBe(3100);
  });

  test('calculates 25% loser compensation', () => {
    const result = determineWinner(mockSession);
    expect(result.loserCompensation).toBe(775); // 25% of 3100 = 775
  });

  test('calculates platform revenue correctly', () => {
    const result = determineWinner(mockSession);
    expect(result.platformRevenue).toBe(2325); // 3100 - 775
  });

  test('throws error when no high bid exists', () => {
    const sessionNoBid = { ...mockSession, currentHighBid: null };
    expect(() => determineWinner(sessionNoBid)).toThrow('No bids in session');
  });

});

describe('processAutoBid', () => {

  test('triggers auto-bid when new bid below max', () => {
    const newBid: Bid = {
      bidId: 'bid_new',
      userId: 'user_789',
      userName: 'Sarah',
      amount: 3300,
      timestamp: new Date(),
      isAutoBid: false,
      round: 2
    };

    const autoBid = processAutoBid(mockSession, newBid);

    expect(autoBid).not.toBeNull();
    expect(autoBid?.amount).toBe(3610); // 3300 + 310 (min increment)
    expect(autoBid?.isAutoBid).toBe(true);
    expect(autoBid?.userId).toBe('user_123'); // The other participant
  });

  test('does not trigger auto-bid when exceeds max', () => {
    const newBid: Bid = {
      bidId: 'bid_new',
      userId: 'user_789',
      userName: 'Sarah',
      amount: 3600,
      timestamp: new Date(),
      isAutoBid: false,
      round: 2
    };

    const autoBid = processAutoBid(mockSession, newBid);
    expect(autoBid).toBeNull();
  });

  test('does not trigger when no auto-bid set', () => {
    const sessionNoAutoBid = {
      ...mockSession,
      participants: mockSession.participants.map(p => ({
        ...p,
        maxAutoBid: null
      }))
    };

    const newBid: Bid = {
      bidId: 'bid_new',
      userId: 'user_789',
      userName: 'Sarah',
      amount: 3300,
      timestamp: new Date(),
      isAutoBid: false,
      round: 2
    };

    const autoBid = processAutoBid(sessionNoAutoBid, newBid);
    expect(autoBid).toBeNull();
  });

  test('caps auto-bid at max amount', () => {
    const sessionLowMax = {
      ...mockSession,
      participants: [
        { ...mockParticipants[0], maxAutoBid: 3450 },
        mockParticipants[1]
      ]
    };

    const newBid: Bid = {
      bidId: 'bid_new',
      userId: 'user_789',
      userName: 'Sarah',
      amount: 3400,
      timestamp: new Date(),
      isAutoBid: false,
      round: 2
    };

    const autoBid = processAutoBid(sessionLowMax, newBid);
    expect(autoBid?.amount).toBe(3450); // Capped at max
  });

});

describe('calculateCompensation', () => {

  test('calculates 25% compensation correctly', () => {
    expect(calculateCompensation(3100)).toBe(775);
    expect(calculateCompensation(4000)).toBe(1000);
    expect(calculateCompensation(2835)).toBe(709);
  });

  test('rounds to nearest integer', () => {
    expect(calculateCompensation(3333)).toBe(833); // 25% = 833.25, rounded
  });

});

describe('canUserBid', () => {

  test('allows bidding when all conditions met', () => {
    const result = canUserBid(mockSession, 'user_123');
    expect(result.canBid).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  test('prevents bidding when user is high bidder', () => {
    const result = canUserBid(mockSession, 'user_789');
    expect(result.canBid).toBe(false);
    expect(result.reason).toContain('already have the high bid');
  });

  test('prevents bidding when max rounds reached', () => {
    const sessionWith3Bids = {
      ...mockSession,
      biddingHistory: [
        { ...mockBid, bidId: 'bid_1', userId: 'user_123' },
        { ...mockBid, bidId: 'bid_2', userId: 'user_123' },
        { ...mockBid, bidId: 'bid_3', userId: 'user_123' }
      ] as Bid[]
    };

    const result = canUserBid(sessionWith3Bids, 'user_123');
    expect(result.canBid).toBe(false);
    expect(result.reason).toContain('Maximum 3 bids');
  });

  test('prevents bidding when session not active', () => {
    const completedSession = { ...mockSession, status: 'completed' as const };
    const result = canUserBid(completedSession, 'user_123');
    expect(result.canBid).toBe(false);
    expect(result.reason).toContain('ended');
  });

});

describe('isSessionExpired', () => {

  test('returns true for expired session', () => {
    const expiredSession = {
      ...mockSession,
      expiresAt: new Date(Date.now() - 1000) // 1 second ago
    };

    expect(isSessionExpired(expiredSession)).toBe(true);
  });

  test('returns false for active session', () => {
    const activeSession = {
      ...mockSession,
      expiresAt: new Date(Date.now() + 3600000) // 1 hour from now
    };

    expect(isSessionExpired(activeSession)).toBe(false);
  });

});

describe('generateBidId', () => {

  test('generates unique IDs', () => {
    const id1 = generateBidId();
    const id2 = generateBidId();

    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^bid_/);
    expect(id2).toMatch(/^bid_/);
  });

  test('generates valid ID format', () => {
    const id = generateBidId();
    expect(id).toMatch(/^bid_\d+_[a-z0-9]+$/);
  });

});

describe('Edge Cases', () => {

  test('handles tie bids (same amount)', () => {
    const bid1: Bid = {
      bidId: 'bid_1',
      userId: 'user_123',
      userName: 'John',
      amount: 3500,
      timestamp: new Date('2026-01-28T15:00:00Z'),
      isAutoBid: false,
      round: 2
    };

    const bid2: Bid = {
      bidId: 'bid_2',
      userId: 'user_789',
      userName: 'Sarah',
      amount: 3500,
      timestamp: new Date('2026-01-28T15:01:00Z'), // 1 minute later
      isAutoBid: false,
      round: 2
    };

    // First bid wins in case of tie
    const sessionWithTie = {
      ...mockSession,
      currentHighBid: bid1,
      biddingHistory: [bid1, bid2]
    };

    const result = determineWinner(sessionWithTie);
    expect(result.winner.userId).toBe('user_123'); // First bidder
  });

  test('handles session with only one bid', () => {
    const singleBidSession = {
      ...mockSession,
      biddingHistory: [mockBid]
    };

    const result = determineWinner(singleBidSession);
    expect(result.winner.userId).toBe('user_789');
    expect(result.loser.userId).toBe('user_123');
  });

  test('handles minimum bid on first round', () => {
    const emptySession = {
      ...mockSession,
      currentHighBid: null,
      biddingHistory: []
    };

    const result = validateBid(2835, emptySession, 'user_123');
    expect(result.valid).toBe(true);
  });

});

describe('Integration Tests', () => {

  test('complete bidding flow: bid placement → auto-bid → winner', () => {
    // Step 1: Initial bid
    const initialBid: Bid = {
      bidId: 'bid_1',
      userId: 'user_123',
      userName: 'John',
      amount: 3000,
      timestamp: new Date(),
      isAutoBid: false,
      round: 1
    };

    let session: BiddingSession = {
      ...mockSession,
      currentHighBid: initialBid,
      biddingHistory: [initialBid]
    };

    // Step 2: Counter bid triggers auto-bid
    const counterBid: Bid = {
      bidId: 'bid_2',
      userId: 'user_789',
      userName: 'Sarah',
      amount: 3300,
      timestamp: new Date(),
      isAutoBid: false,
      round: 2
    };

    const autoBid = processAutoBid(session, counterBid);
    expect(autoBid).not.toBeNull();
    expect(autoBid!.amount).toBeGreaterThan(counterBid.amount);

    // Step 3: Update session with auto-bid
    session = {
      ...session,
      currentHighBid: autoBid!,
      biddingHistory: [...session.biddingHistory, counterBid, autoBid!]
    };

    // Step 4: Determine winner
    const result = determineWinner(session);
    expect(result.winner.userId).toBe('user_123'); // Has auto-bid
    expect(result.loserCompensation).toBeGreaterThan(0);
  });

});
