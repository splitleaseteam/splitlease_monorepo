/**
 * Integration Tests for Bidding Compensation Logic
 *
 * End-to-end tests that verify the complete compensation calculation workflow
 * across multiple modules in the bidding system.
 *
 * Tests the integration of:
 * - calculateLoserCompensation (3 implementations)
 * - calculatePlatformRevenue
 * - calculateFinancialBreakdown
 * - determineWinner
 * - calculateBidIncrement
 *
 * Business Rules Verified:
 * - 25% loser compensation is consistent across all implementations
 * - 75% platform revenue (100% - 25%)
 * - Compensation + Revenue = Winning Bid
 * - 10% minimum bid increment enforcement
 * - Maximum 3 rounds per session
 */
import { describe, it, expect } from 'vitest';
import {
  calculateLoserCompensation as calcComp,
  calculatePlatformRevenue,
  calculateFinancialBreakdown,
} from '../calculators/calculateCompensation.js';
import { calculateLoserCompensation as standaloneComp } from '../calculators/calculateLoserCompensation.js';
import { determineWinner } from '../processors/determineWinner.js';
import { calculateBidIncrement } from '../calculators/calculateBidIncrement.js';

describe('Bidding Compensation - Integration Tests', () => {
  // ============================================================================
  // Cross-Module Consistency - 25% Compensation
  // ============================================================================
  describe('cross-module consistency - 25% compensation', () => {
    const testCases = [
      { winningBid: 100, expected: 25 },
      { winningBid: 200, expected: 50 },
      { winningBid: 500, expected: 125 },
      { winningBid: 1000, expected: 250 },
      { winningBid: 1500, expected: 375 },
      { winningBid: 2000, expected: 500 },
      { winningBid: 2835, expected: 708.75 },
      { winningBid: 5000, expected: 1250 },
      { winningBid: 10000, expected: 2500 },
    ];

    it('should return same 25% compensation across all implementations', () => {
      testCases.forEach(({ winningBid, expected }) => {
        const result1 = calcComp({ winningBid });
        const result2 = standaloneComp({ winningBid });
        const result3 = standaloneComp({ winningBid, compensationPercent: 25 });

        expect(result1).toBe(expected);
        expect(result2).toBe(expected);
        expect(result3).toBe(expected);
      });
    });

    it('should handle decimal precision consistently across implementations', () => {
      const decimalCases = [
        { winningBid: 333.33, expected: 83.33 },
        { winningBid: 666.66, expected: 166.67 },
        { winningBid: 999.99, expected: 250 },
        { winningBid: 1234.56, expected: 308.64 },
      ];

      decimalCases.forEach(({ winningBid, expected }) => {
        const result1 = calcComp({ winningBid });
        const result2 = standaloneComp({ winningBid });

        expect(result1).toBe(expected);
        expect(result2).toBe(expected);
      });
    });
  });

  // ============================================================================
  // Financial Breakdown - Compensation + Revenue = Bid
  // ============================================================================
  describe('financial breakdown - compensation + revenue = winning bid', () => {
    const testCases = [
      100, 200, 500, 1000, 1500, 2000, 2835, 5000, 10000,
      333.33, 666.66, 999.99, 1234.56
    ];

    it('should ensure compensation + revenue equals winning bid for all amounts', () => {
      testCases.forEach((winningBid) => {
        const breakdown = calculateFinancialBreakdown({ winningBid });

        expect(breakdown.winningBid).toBe(winningBid);
        expect(breakdown.loserCompensation + breakdown.platformRevenue)
          .toBeCloseTo(winningBid, 2);
      });
    });

    it('should ensure compensation is always 25% and revenue is always 75%', () => {
      testCases.forEach((winningBid) => {
        const breakdown = calculateFinancialBreakdown({ winningBid });

        expect(breakdown.compensationPercent).toBe(25);
        expect(breakdown.revenuePercent).toBe(75);
        expect(breakdown.loserCompensation).toBeCloseTo(winningBid * 0.25, 2);
        expect(breakdown.platformRevenue).toBeCloseTo(winningBid * 0.75, 2);
      });
    });
  });

  // ============================================================================
  // determineWinner Integration with Compensation
  // ============================================================================
  describe('determineWinner integration with compensation', () => {
    const createSession = (winningBid) => ({
      winnerUserId: 'user1',
      winningBidAmount: winningBid
    });

    const createParticipants = () => [
      { userId: 'user1', userName: 'Alice' },
      { userId: 'user2', userName: 'Bob' }
    ];

    it('should calculate compensation using 25% rule via determineWinner', () => {
      const testCases = [100, 500, 1000, 2000, 2835, 5000];

      testCases.forEach((winningBid) => {
        const expectedComp = calcComp({ winningBid });
        const expectedRev = winningBid - expectedComp;

        const result = determineWinner({
          session: createSession(winningBid),
          participants: createParticipants()
        });

        expect(result.winningBid).toBe(winningBid);
        expect(result.loserCompensation).toBe(expectedComp);
        expect(result.platformRevenue).toBe(expectedRev);
      });
    });

    it('should ensure determineWinner compensation matches direct calculation', () => {
      const winningBid = 2835;
      const directComp = calcComp({ winningBid });
      const directRev = calculatePlatformRevenue({ winningBid });

      const result = determineWinner({
        session: createSession(winningBid),
        participants: createParticipants()
      });

      expect(result.loserCompensation).toBe(directComp);
      expect(result.platformRevenue).toBe(directRev);
    });
  });

  // ============================================================================
  // Bid Increment - 10% Minimum Verification
  // ============================================================================
  describe('bid increment - 10% minimum verification', () => {
    it('should identify valid 10% increments', () => {
      const validIncrements = [
        { previous: 100, new: 110 }, // Exactly 10%
        { previous: 200, new: 220 }, // Exactly 10%
        { previous: 500, new: 550 }, // Exactly 10%
        { previous: 1000, new: 1100 }, // Exactly 10%
        { previous: 1000, new: 1110 }, // 11% - above minimum
        { previous: 1000, new: 1150 }, // 15% - above minimum
        { previous: 1000, new: 1200 }, // 20% - above minimum
      ];

      validIncrements.forEach(({ previous, new: newBid }) => {
        const result = calculateBidIncrement({ newBid, previousBid: previous });
        expect(result.percent).toBeGreaterThanOrEqual(10);
      });
    });

    it('should identify invalid increments below 10%', () => {
      const invalidIncrements = [
        { previous: 100, new: 105 }, // 5%
        { previous: 100, new: 109 }, // 9%
        { previous: 1000, new: 1050 }, // 5%
        { previous: 1000, new: 1090 }, // 9%
        { previous: 1000, new: 1099 }, // 9.9%
      ];

      invalidIncrements.forEach(({ previous, new: newBid }) => {
        const result = calculateBidIncrement({ newBid, previousBid: previous });
        expect(result.percent).toBeLessThan(10);
      });
    });

    it('should show compensation for bids meeting 10% minimum', () => {
      // Simulate a bidding session where each bid is 10% above previous
      const bids = [1000, 1100, 1210, 1331]; // 10% increments

      bids.forEach((bid, _index) => {
        const comp = calcComp({ winningBid: bid });
        const expected = bid * 0.25;

        expect(comp).toBe(expected);
      });
    });
  });

  // ============================================================================
  // Maximum 3 Rounds - Compensation at Final Bid
  // ============================================================================
  describe('maximum 3 rounds - compensation at final bid', () => {
    it('should calculate compensation correctly after 3 rounds of bidding', () => {
      // Starting bid: $1000
      // Round 1: $1100 (10% increase)
      // Round 2: $1210 (10% increase)
      // Round 3: $1331 (10% increase) - Final bid

      const startingBid = 1000;
      const round1Bid = 1100;
      const round2Bid = 1210;
      const round3Bid = 1331;

      const comp1 = calcComp({ winningBid: startingBid });
      const comp2 = calcComp({ winningBid: round1Bid });
      const comp3 = calcComp({ winningBid: round2Bid });
      const compFinal = calcComp({ winningBid: round3Bid });

      expect(comp1).toBe(250);
      expect(comp2).toBe(275);
      expect(comp3).toBe(302.50);
      expect(compFinal).toBe(332.75);

      // Verify each is 25% of its respective bid
      expect(comp1).toBe(startingBid * 0.25);
      expect(comp2).toBe(round1Bid * 0.25);
      expect(comp3).toBe(round2Bid * 0.25);
      expect(compFinal).toBe(round3Bid * 0.25);
    });

    it('should track bid increments through 3 rounds', () => {
      const startingBid = 1000;

      // Round 1: 10% increase
      const round1Bid = startingBid * 1.10;
      const increment1 = calculateBidIncrement({ newBid: round1Bid, previousBid: startingBid });

      // Round 2: 10% increase
      const round2Bid = round1Bid * 1.10;
      const increment2 = calculateBidIncrement({ newBid: round2Bid, previousBid: round1Bid });

      // Round 3: 10% increase
      const round3Bid = round2Bid * 1.10;
      const increment3 = calculateBidIncrement({ newBid: round3Bid, previousBid: round2Bid });

      expect(increment1.percent).toBe(10);
      expect(increment2.percent).toBeCloseTo(10, 2);
      expect(increment3.percent).toBeCloseTo(10, 2);

      // Final compensation
      const finalComp = calcComp({ winningBid: round3Bid });
      expect(finalComp).toBeCloseTo(round3Bid * 0.25, 2);
    });

    it('should handle competitive bidding with varying increments', () => {
      // Round 1: 10% increment
      const bid1 = 1000;
      const bid2 = 1100; // +10%

      // Round 2: Aggressive 15% increment
      const bid3 = 1265; // +15%

      // Round 3: Conservative 10% increment
      const bid4 = 1391.50; // +10%

      const inc1 = calculateBidIncrement({ newBid: bid2, previousBid: bid1 });
      const inc2 = calculateBidIncrement({ newBid: bid3, previousBid: bid2 });
      const inc3 = calculateBidIncrement({ newBid: bid4, previousBid: bid3 });

      expect(inc1.percent).toBe(10);
      expect(inc2.percent).toBe(15);
      expect(inc3.percent).toBe(10);

      // Final compensation
      const finalComp = calcComp({ winningBid: bid4 });
      expect(finalComp).toBeCloseTo(347.88, 2);
    });
  });

  // ============================================================================
  // Real-World Bidding Session Simulation
  // ============================================================================
  describe('real-world bidding session simulation', () => {
    it('should simulate complete 2-person bidding session with compensation', () => {
      // Setup
      const startingBid = 1000;
      const participants = [
        { userId: 'alice', userName: 'Alice' },
        { userId: 'bob', userName: 'Bob' }
      ];

      // Alice starts with $1000
      const bid1 = startingBid;

      // Bob counters with 10% increment: $1100
      const bid2 = 1100;
      const increment1 = calculateBidIncrement({ newBid: bid2, previousBid: bid1 });

      // Alice counters with 10% increment: $1210
      const bid3 = 1210;
      const increment2 = calculateBidIncrement({ newBid: bid3, previousBid: bid2 });

      // Bob makes final bid with 10% increment: $1331 (Round 3 - max)
      const finalBid = 1331;
      const increment3 = calculateBidIncrement({ newBid: finalBid, previousBid: bid3 });

      // Determine winner and calculate compensation
      const session = {
        winnerUserId: 'bob',
        winningBidAmount: finalBid,
        currentRound: 3,
        maxRounds: 3
      };

      const result = determineWinner({ session, participants });

      // Verify increments
      expect(increment1.amount).toBe(100);
      expect(increment1.percent).toBe(10);
      expect(increment2.amount).toBe(110);
      expect(increment2.percent).toBe(10);
      expect(increment3.amount).toBe(121);
      expect(increment3.percent).toBeCloseTo(10, 2);

      // Verify compensation
      expect(result.winningBid).toBe(1331);
      expect(result.loserCompensation).toBeCloseTo(332.75, 2);
      expect(result.platformRevenue).toBeCloseTo(998.25, 2);
      expect(result.loserCompensation + result.platformRevenue).toBeCloseTo(1331, 2);
    });

    it('should simulate aggressive bidding session', () => {
      // Aggressive bidding with >10% increments
      const bid1 = 1000;
      const bid2 = 1200; // +20%
      const bid3 = 1500; // +25%
      const finalBid = 1800; // +20%

      const session = {
        winnerUserId: 'alice',
        winningBidAmount: finalBid
      };
      const participants = [
        { userId: 'alice', userName: 'Alice' },
        { userId: 'bob', userName: 'Bob' }
      ];

      const result = determineWinner({ session, participants });

      expect(result.winningBid).toBe(1800);
      expect(result.loserCompensation).toBe(450); // 25% of 1800
      expect(result.platformRevenue).toBe(1350); // 75% of 1800
    });

    it('should simulate minimum valid bidding session', () => {
      // Exactly 10% increments each round
      const bid1 = 200;
      const bid2 = 220; // +10%
      const bid3 = 242; // +10%
      const finalBid = 266.20; // +10%

      const session = {
        winnerUserId: 'alice',
        winningBidAmount: finalBid
      };
      const participants = [
        { userId: 'alice', userName: 'Alice' },
        { userId: 'bob', userName: 'Bob' }
      ];

      const result = determineWinner({ session, participants });

      expect(result.winningBid).toBe(266.20);
      expect(result.loserCompensation).toBeCloseTo(66.55, 2);
      expect(result.platformRevenue).toBeCloseTo(199.65, 2);
    });
  });

  // ============================================================================
  // Edge Cases - Cross-Module Behavior
  // ============================================================================
  describe('edge cases - cross-module behavior', () => {
    it('should handle zero compensation from all implementations consistently', () => {
      const results = {
        calcComp: calcComp({ winningBid: 0 }),
        standaloneComp: standaloneComp({ winningBid: 0 }),
        breakdown: calculateFinancialBreakdown({ winningBid: 0 }),
      };

      expect(results.calcComp).toBe(0);
      expect(results.standaloneComp).toBe(0);
      expect(results.breakdown.loserCompensation).toBe(0);
      expect(results.breakdown.platformRevenue).toBe(0);
    });

    it('should handle negative bids consistently', () => {
      // calcComp doesn't validate, so it calculates negative compensation
      const result1 = calcComp({ winningBid: -100 });
      expect(result1).toBe(-25);

      // standaloneComp validates and returns 0 for negative bids
      const result2 = standaloneComp({ winningBid: -100 });
      expect(result2).toBe(0);
    });

    it('should handle very small bids consistently', () => {
      const bid = 0.04;
      const result1 = calcComp({ winningBid: bid });
      const result2 = standaloneComp({ winningBid: bid });
      const breakdown = calculateFinancialBreakdown({ winningBid: bid });

      expect(result1).toBe(0.01);
      expect(result2).toBe(0.01);
      expect(breakdown.loserCompensation).toBe(0.01);
      expect(breakdown.platformRevenue).toBe(0.03);
    });

    it('should handle decimal precision edge cases consistently', () => {
      const bid = 333.33;
      const result1 = calcComp({ winningBid: bid });
      const result2 = standaloneComp({ winningBid: bid });
      const breakdown = calculateFinancialBreakdown({ winningBid: bid });

      expect(result1).toBe(83.33);
      expect(result2).toBe(83.33);
      expect(breakdown.loserCompensation).toBe(83.33);
      expect(breakdown.platformRevenue).toBe(250);
    });
  });

  // ============================================================================
  // Platform Revenue Verification
  // ============================================================================
  describe('platform revenue verification', () => {
    it('should ensure platform always keeps 75% across all modules', () => {
      const testCases = [100, 500, 1000, 2000, 2835, 5000];

      testCases.forEach((winningBid) => {
        const expectedRev = winningBid * 0.75;
        const expectedComp = winningBid * 0.25;

        // Method 1: Direct calculation
        const rev1 = calculatePlatformRevenue({ winningBid });

        // Method 2: Via breakdown
        const breakdown = calculateFinancialBreakdown({ winningBid });
        const rev2 = breakdown.platformRevenue;
        const comp2 = breakdown.loserCompensation;

        // Method 3: Via determineWinner
        const result = determineWinner({
          session: { winnerUserId: 'u1', winningBidAmount: winningBid },
          participants: [
            { userId: 'u1', userName: 'A' },
            { userId: 'u2', userName: 'B' }
          ]
        });
        const rev3 = result.platformRevenue;
        const comp3 = result.loserCompensation;

        expect(rev1).toBeCloseTo(expectedRev, 2);
        expect(rev2).toBeCloseTo(expectedRev, 2);
        expect(rev3).toBeCloseTo(expectedRev, 2);
        expect(comp2).toBeCloseTo(expectedComp, 2);
        expect(comp3).toBeCloseTo(expectedComp, 2);
      });
    });

    it('should verify platform revenue using bid - compensation', () => {
      const winningBid = 2835;
      const compensation = calcComp({ winningBid });

      const rev1 = calculatePlatformRevenue({ winningBid, compensation });
      const rev2 = calculatePlatformRevenue({ winningBid });

      expect(rev1).toBe(rev2);
      expect(rev1).toBeCloseTo(2126.25, 2);
    });
  });
});
