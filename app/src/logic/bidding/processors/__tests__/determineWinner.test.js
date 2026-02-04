/**
 * Tests for determineWinner.js
 *
 * Tests for determining the winner and loser of a completed bidding session
 * and calculating associated compensation amounts.
 *
 * Business Rules:
 * - Winner is the user with the highest bid (session.winnerUserId)
 * - Loser is the other participant (not winnerUserId)
 * - Loser receives 25% of winning bid as compensation
 * - Platform revenue is winning bid minus compensation (75%)
 * - Must have exactly 2 participants
 * - Must have winner info in session
 */
import { describe, it, expect } from 'vitest';
import { determineWinner } from '../determineWinner.js';

describe('determineWinner.js', () => {
  // ============================================================================
  // Happy Path - Standard Winner Determination
  // ============================================================================
  describe('happy path - standard winner determination', () => {
    const createValidSession = (winningBid = 1000) => ({
      winnerUserId: 'user1',
      winningBidAmount: winningBid,
      sessionId: 'session1',
      status: 'completed'
    });

    const createValidParticipants = () => [
      { userId: 'user1', userName: 'Alice', participantId: 'p1' },
      { userId: 'user2', userName: 'Bob', participantId: 'p2' }
    ];

    it('should determine winner and loser for $1000 winning bid', () => {
      const session = createValidSession(1000);
      const participants = createValidParticipants();

      const result = determineWinner({ session, participants });

      expect(result.winner.userId).toBe('user1');
      expect(result.loser.userId).toBe('user2');
      expect(result.winningBid).toBe(1000);
      expect(result.loserCompensation).toBe(250); // 25% of 1000
      expect(result.platformRevenue).toBe(750); // 75% of 1000
    });

    it('should determine winner and loser for $2000 winning bid', () => {
      const session = createValidSession(2000);
      const participants = createValidParticipants();

      const result = determineWinner({ session, participants });

      expect(result.winner.userId).toBe('user1');
      expect(result.loser.userId).toBe('user2');
      expect(result.winningBid).toBe(2000);
      expect(result.loserCompensation).toBe(500); // 25% of 2000
      expect(result.platformRevenue).toBe(1500); // 75% of 2000
    });

    it('should determine winner and loser for $2835 winning bid with decimals', () => {
      const session = createValidSession(2835);
      const participants = createValidParticipants();

      const result = determineWinner({ session, participants });

      expect(result.winner.userId).toBe('user1');
      expect(result.loser.userId).toBe('user2');
      expect(result.winningBid).toBe(2835);
      expect(result.loserCompensation).toBe(708.75); // 25% of 2835
      expect(result.platformRevenue).toBe(2126.25); // 75% of 2835
    });

    it('should correctly identify user2 as winner when user2 wins', () => {
      const session = {
        winnerUserId: 'user2',
        winningBidAmount: 1500,
        sessionId: 'session1',
        status: 'completed'
      };
      const participants = createValidParticipants();

      const result = determineWinner({ session, participants });

      expect(result.winner.userId).toBe('user2');
      expect(result.loser.userId).toBe('user1');
      expect(result.winningBid).toBe(1500);
      expect(result.loserCompensation).toBe(375); // 25% of 1500
      expect(result.platformRevenue).toBe(1125); // 75% of 1500
    });

    it('should handle minimum bid amount ($100)', () => {
      const session = createValidSession(100);
      const participants = createValidParticipants();

      const result = determineWinner({ session, participants });

      expect(result.winningBid).toBe(100);
      expect(result.loserCompensation).toBe(25); // 25% of 100
      expect(result.platformRevenue).toBe(75); // 75% of 100
    });

    it('should handle very high bid amount ($10000)', () => {
      const session = createValidSession(10000);
      const participants = createValidParticipants();

      const result = determineWinner({ session, participants });

      expect(result.winningBid).toBe(10000);
      expect(result.loserCompensation).toBe(2500); // 25% of 10000
      expect(result.platformRevenue).toBe(7500); // 75% of 10000
    });
  });

  // ============================================================================
  // Compensation Calculation Integration
  // ============================================================================
  describe('compensation calculation integration', () => {
    const createValidParticipants = () => [
      { userId: 'user1', userName: 'Alice' },
      { userId: 'user2', userName: 'Bob' }
    ];

    it('should calculate 25% compensation accurately for various amounts', () => {
      const testCases = [
        { bid: 100, expectedComp: 25, expectedRev: 75 },
        { bid: 200, expectedComp: 50, expectedRev: 150 },
        { bid: 500, expectedComp: 125, expectedRev: 375 },
        { bid: 1000, expectedComp: 250, expectedRev: 750 },
        { bid: 1500, expectedComp: 375, expectedRev: 1125 },
        { bid: 2000, expectedComp: 500, expectedRev: 1500 },
        { bid: 5000, expectedComp: 1250, expectedRev: 3750 },
      ];

      testCases.forEach(({ bid, expectedComp, expectedRev }) => {
        const session = { winnerUserId: 'user1', winningBidAmount: bid };
        const participants = createValidParticipants();

        const result = determineWinner({ session, participants });

        expect(result.loserCompensation).toBe(expectedComp);
        expect(result.platformRevenue).toBe(expectedRev);
      });
    });

    it('should ensure compensation + revenue equals winning bid', () => {
      const session = { winnerUserId: 'user1', winningBidAmount: 2835 };
      const participants = createValidParticipants();

      const result = determineWinner({ session, participants });

      expect(result.loserCompensation + result.platformRevenue)
        .toBeCloseTo(result.winningBid, 2);
    });

    it('should ensure compensation + revenue equals winning bid for decimals', () => {
      const session = { winnerUserId: 'user1', winningBidAmount: 333.33 };
      const participants = createValidParticipants();

      const result = determineWinner({ session, participants });

      expect(result.loserCompensation + result.platformRevenue)
        .toBeCloseTo(result.winningBid, 2);
    });

    it('should handle decimal precision correctly', () => {
      const session = { winnerUserId: 'user1', winningBidAmount: 666.66 };
      const participants = createValidParticipants();

      const result = determineWinner({ session, participants });

      expect(result.loserCompensation).toBe(166.67); // 666.66 * 0.25 = 166.665 → 166.67
      expect(result.platformRevenue).toBe(499.99); // 666.66 - 166.67 = 499.99
      expect(result.loserCompensation + result.platformRevenue)
        .toBeCloseTo(666.66, 2);
    });
  });

  // ============================================================================
  // Error Handling - Invalid Session
  // ============================================================================
  describe('error handling - invalid session', () => {
    const createValidParticipants = () => [
      { userId: 'user1', userName: 'Alice' },
      { userId: 'user2', userName: 'Bob' }
    ];

    it('should throw error when session has no winnerUserId', () => {
      const session = {
        winningBidAmount: 1000,
        // Missing winnerUserId
      };

      expect(() => determineWinner({ session, participants: createValidParticipants() }))
        .toThrow('Cannot determine winner: No bids in session');
    });

    it('should throw error when session has null winnerUserId', () => {
      const session = {
        winnerUserId: null,
        winningBidAmount: 1000
      };

      expect(() => determineWinner({ session, participants: createValidParticipants() }))
        .toThrow('Cannot determine winner: No bids in session');
    });

    it('should throw error when session has undefined winnerUserId', () => {
      const session = {
        winnerUserId: undefined,
        winningBidAmount: 1000
      };

      expect(() => determineWinner({ session, participants: createValidParticipants() }))
        .toThrow('Cannot determine winner: No bids in session');
    });

    it('should throw error when session has no winningBidAmount', () => {
      const session = {
        winnerUserId: 'user1',
        // Missing winningBidAmount
      };

      expect(() => determineWinner({ session, participants: createValidParticipants() }))
        .toThrow('Cannot determine winner: No bids in session');
    });

    it('should throw error when session has null winningBidAmount', () => {
      const session = {
        winnerUserId: 'user1',
        winningBidAmount: null
      };

      expect(() => determineWinner({ session, participants: createValidParticipants() }))
        .toThrow('Cannot determine winner: No bids in session');
    });

    it('should throw error when session has zero winningBidAmount', () => {
      const session = {
        winnerUserId: 'user1',
        winningBidAmount: 0
      };

      // The implementation checks `!session.winningBidAmount` which is true for 0
      expect(() => determineWinner({ session, participants: createValidParticipants() }))
        .toThrow('Cannot determine winner: No bids in session');
    });
  });

  // ============================================================================
  // Error Handling - Invalid Participants
  // ============================================================================
  describe('error handling - invalid participants', () => {
    const createValidSession = () => ({
      winnerUserId: 'user1',
      winningBidAmount: 1000
    });

    it('should throw error when participants array is empty', () => {
      const session = createValidSession();

      expect(() => determineWinner({ session, participants: [] }))
        .toThrow('Cannot determine winner: Must have exactly 2 participants');
    });

    it('should throw error when only 1 participant', () => {
      const session = createValidSession();
      const participants = [
        { userId: 'user1', userName: 'Alice' }
      ];

      expect(() => determineWinner({ session, participants }))
        .toThrow('Cannot determine winner: Must have exactly 2 participants');
    });

    it('should throw error when more than 2 participants', () => {
      const session = createValidSession();
      const participants = [
        { userId: 'user1', userName: 'Alice' },
        { userId: 'user2', userName: 'Bob' },
        { userId: 'user3', userName: 'Charlie' }
      ];

      expect(() => determineWinner({ session, participants }))
        .toThrow('Cannot determine winner: Must have exactly 2 participants');
    });

    it('should throw error when participants array is null', () => {
      const session = createValidSession();

      expect(() => determineWinner({ session, participants: null }))
        .toThrow(); // Throws "null is not an object (evaluating 'participants.length')"
    });

    it('should throw error when participants array is undefined', () => {
      const session = createValidSession();

      expect(() => determineWinner({ session, participants: undefined }))
        .toThrow(); // Throws "undefined is not an object (evaluating 'participants.length')"
    });

    it('should throw error when winnerUserId not found in participants', () => {
      const session = {
        winnerUserId: 'user3', // Not in participants
        winningBidAmount: 1000
      };
      const participants = [
        { userId: 'user1', userName: 'Alice' },
        { userId: 'user2', userName: 'Bob' }
      ];

      expect(() => determineWinner({ session, participants }))
        .toThrow('Cannot find winner/loser in participants');
    });

    it('should throw error when participants have duplicate userIds', () => {
      const session = {
        winnerUserId: 'user1',
        winningBidAmount: 1000
      };
      const participants = [
        { userId: 'user1', userName: 'Alice' },
        { userId: 'user1', userName: 'Alice (duplicate)' }
      ];

      // With duplicate userIds, the loser logic can't find a participant
      // with userId !== winnerUserId, so loser is undefined
      expect(() => determineWinner({ session, participants }))
        .toThrow('Cannot find winner/loser in participants');
    });
  });

  // ============================================================================
  // Return Value Structure
  // ============================================================================
  describe('return value structure', () => {
    const createValidSession = () => ({
      winnerUserId: 'user1',
      winningBidAmount: 1000
    });

    const createValidParticipants = () => [
      { userId: 'user1', userName: 'Alice', participantId: 'p1' },
      { userId: 'user2', userName: 'Bob', participantId: 'p2' }
    ];

    it('should return object with all required properties', () => {
      const session = createValidSession();
      const participants = createValidParticipants();

      const result = determineWinner({ session, participants });

      expect(result).toHaveProperty('winner');
      expect(result).toHaveProperty('loser');
      expect(result).toHaveProperty('winningBid');
      expect(result).toHaveProperty('loserCompensation');
      expect(result).toHaveProperty('platformRevenue');
    });

    it('should return winner object from participants array', () => {
      const session = createValidSession();
      const participants = createValidParticipants();

      const result = determineWinner({ session, participants });

      expect(result.winner).toBe(participants[0]);
      expect(result.winner.userId).toBe('user1');
      expect(result.winner.userName).toBe('Alice');
    });

    it('should return loser object from participants array', () => {
      const session = createValidSession();
      const participants = createValidParticipants();

      const result = determineWinner({ session, participants });

      expect(result.loser).toBe(participants[1]);
      expect(result.loser.userId).toBe('user2');
      expect(result.loser.userName).toBe('Bob');
    });

    it('should return winningBid as number', () => {
      const session = createValidSession();
      const participants = createValidParticipants();

      const result = determineWinner({ session, participants });

      expect(typeof result.winningBid).toBe('number');
    });

    it('should return loserCompensation as number', () => {
      const session = createValidSession();
      const participants = createValidParticipants();

      const result = determineWinner({ session, participants });

      expect(typeof result.loserCompensation).toBe('number');
    });

    it('should return platformRevenue as number', () => {
      const session = createValidSession();
      const participants = createValidParticipants();

      const result = determineWinner({ session, participants });

      expect(typeof result.platformRevenue).toBe('number');
    });

    it('should not include extra properties', () => {
      const session = createValidSession();
      const participants = createValidParticipants();

      const result = determineWinner({ session, participants });
      const keys = Object.keys(result);

      expect(keys).toEqual([
        'winner',
        'loser',
        'winningBid',
        'loserCompensation',
        'platformRevenue'
      ]);
    });
  });

  // ============================================================================
  // Real-World Scenarios
  // ============================================================================
  describe('real-world bidding scenarios', () => {
    it('should handle typical NYC bidding session', () => {
      const session = {
        winnerUserId: 'alice_123',
        winningBidAmount: 2500,
        sessionId: 'session_nyc_001',
        targetNight: '2024-03-15'
      };
      const participants = [
        { userId: 'alice_123', userName: 'Alice Johnson' },
        { userId: 'bob_456', userName: 'Bob Smith' }
      ];

      const result = determineWinner({ session, participants });

      expect(result.winner.userId).toBe('alice_123');
      expect(result.loser.userId).toBe('bob_456');
      expect(result.winningBid).toBe(2500);
      expect(result.loserCompensation).toBe(625); // 25% of 2500
      expect(result.platformRevenue).toBe(1875); // 75% of 2500
    });

    it('should handle minimum bid session', () => {
      const session = {
        winnerUserId: 'user_min_bid',
        winningBidAmount: 200, // Starting bid
        sessionId: 'session_min_001'
      };
      const participants = [
        { userId: 'user_min_bid', userName: 'Winner' },
        { userId: 'user_loser', userName: 'Loser' }
      ];

      const result = determineWinner({ session, participants });

      expect(result.winningBid).toBe(200);
      expect(result.loserCompensation).toBe(50); // 25% of 200
      expect(result.platformRevenue).toBe(150); // 75% of 200
    });

    it('should handle luxury property bidding', () => {
      const session = {
        winnerUserId: 'luxury_winner',
        winningBidAmount: 7500,
        sessionId: 'session_luxury_001'
      };
      const participants = [
        { userId: 'luxury_winner', userName: 'Winner' },
        { userId: 'luxury_loser', userName: 'Loser' }
      ];

      const result = determineWinner({ session, participants });

      expect(result.winningBid).toBe(7500);
      expect(result.loserCompensation).toBe(1875); // 25% of 7500
      expect(result.platformRevenue).toBe(5625); // 75% of 7500
    });

    it('should handle competitive bidding with multiple rounds', () => {
      // After 3 rounds of competitive bidding
      const session = {
        winnerUserId: 'competitive_winner',
        winningBidAmount: 3650, // Started at 1000, went through 3 rounds
        sessionId: 'session_comp_001',
        currentRound: 3,
        maxRounds: 3
      };
      const participants = [
        { userId: 'competitive_winner', userName: 'Winner', totalBidsPlaced: 4 },
        { userId: 'competitive_loser', userName: 'Loser', totalBidsPlaced: 3 }
      ];

      const result = determineWinner({ session, participants });

      expect(result.winningBid).toBe(3650);
      expect(result.loserCompensation).toBe(912.50); // 25% of 3650
      expect(result.platformRevenue).toBe(2737.50); // 75% of 3650
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================
  describe('edge cases', () => {
    const createValidParticipants = () => [
      { userId: 'user1', userName: 'Alice' },
      { userId: 'user2', userName: 'Bob' }
    ];

    it('should handle decimal winning bid', () => {
      const session = {
        winnerUserId: 'user1',
        winningBidAmount: 1234.56
      };

      const result = determineWinner({ session, participants: createValidParticipants() });

      expect(result.winningBid).toBe(1234.56);
      expect(result.loserCompensation).toBeCloseTo(308.64, 2);
      expect(result.platformRevenue).toBeCloseTo(925.92, 2);
    });

    it('should handle very small winning bid', () => {
      const session = {
        winnerUserId: 'user1',
        winningBidAmount: 0.04
      };

      const result = determineWinner({ session, participants: createValidParticipants() });

      expect(result.winningBid).toBe(0.04);
      expect(result.loserCompensation).toBe(0.01);
      expect(result.platformRevenue).toBe(0.03);
    });

    it('should handle participants with extra properties', () => {
      const session = {
        winnerUserId: 'user1',
        winningBidAmount: 1000
      };
      const participants = [
        { userId: 'user1', userName: 'Alice', extraProp: 'value1', anotherProp: 123 },
        { userId: 'user2', userName: 'Bob', extraProp: 'value2' }
      ];

      const result = determineWinner({ session, participants });

      expect(result.winner.extraProp).toBe('value1');
      expect(result.winner.anotherProp).toBe(123);
      expect(result.loser.extraProp).toBe('value2');
    });
  });
});
