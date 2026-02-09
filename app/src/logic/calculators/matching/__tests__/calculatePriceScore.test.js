/**
 * Tests for calculatePriceScore
 *
 * Score how close candidate pricing is to proposal budget.
 * Within 10% = 20 points (full score).
 * Within 20% = 15 points.
 * Within 30% = 10 points.
 * Within 50% = 5 points.
 * Over 50% = 0 points.
 */
import { describe, it, expect } from 'vitest';
import { calculatePriceScore } from '../calculatePriceScore.js';

describe('calculatePriceScore', () => {
  // ============================================================================
  // Happy Path - Within 10% (20 points)
  // ============================================================================
  describe('within 10% (20 points)', () => {
    it('should return 20 for exact price match', () => {
      const result = calculatePriceScore({
        candidateListing: { 'nightly_rate_for_4_night_stay': 100 },
        proposal: { nightlyPrice: 100, nightsPerWeek: 4 }
      });
      expect(result).toBe(20);
    });

    it('should return 20 for 5% difference (candidate higher)', () => {
      const result = calculatePriceScore({
        candidateListing: { 'nightly_rate_for_4_night_stay': 105 },
        proposal: { nightlyPrice: 100, nightsPerWeek: 4 }
      });
      expect(result).toBe(20);
    });

    it('should return 20 for 5% difference (candidate lower)', () => {
      const result = calculatePriceScore({
        candidateListing: { 'nightly_rate_for_4_night_stay': 95 },
        proposal: { nightlyPrice: 100, nightsPerWeek: 4 }
      });
      expect(result).toBe(20);
    });

    it('should return 20 for exactly 10% difference', () => {
      const result = calculatePriceScore({
        candidateListing: { 'nightly_rate_for_4_night_stay': 110 },
        proposal: { nightlyPrice: 100, nightsPerWeek: 4 }
      });
      expect(result).toBe(20);
    });
  });

  // ============================================================================
  // Within 20% (15 points)
  // ============================================================================
  describe('within 20% (15 points)', () => {
    it('should return 15 for 15% difference', () => {
      const result = calculatePriceScore({
        candidateListing: { 'nightly_rate_for_4_night_stay': 115 },
        proposal: { nightlyPrice: 100, nightsPerWeek: 4 }
      });
      expect(result).toBe(15);
    });

    it('should return 15 for exactly 20% difference', () => {
      const result = calculatePriceScore({
        candidateListing: { 'nightly_rate_for_4_night_stay': 120 },
        proposal: { nightlyPrice: 100, nightsPerWeek: 4 }
      });
      expect(result).toBe(15);
    });

    it('should return 15 for 11% difference (just over 10%)', () => {
      const result = calculatePriceScore({
        candidateListing: { 'nightly_rate_for_4_night_stay': 111 },
        proposal: { nightlyPrice: 100, nightsPerWeek: 4 }
      });
      expect(result).toBe(15);
    });
  });

  // ============================================================================
  // Within 30% (10 points)
  // ============================================================================
  describe('within 30% (10 points)', () => {
    it('should return 10 for 25% difference', () => {
      const result = calculatePriceScore({
        candidateListing: { 'nightly_rate_for_4_night_stay': 125 },
        proposal: { nightlyPrice: 100, nightsPerWeek: 4 }
      });
      expect(result).toBe(10);
    });

    it('should return 10 for exactly 30% difference', () => {
      const result = calculatePriceScore({
        candidateListing: { 'nightly_rate_for_4_night_stay': 130 },
        proposal: { nightlyPrice: 100, nightsPerWeek: 4 }
      });
      expect(result).toBe(10);
    });

    it('should return 10 for 21% difference (just over 20%)', () => {
      const result = calculatePriceScore({
        candidateListing: { 'nightly_rate_for_4_night_stay': 121 },
        proposal: { nightlyPrice: 100, nightsPerWeek: 4 }
      });
      expect(result).toBe(10);
    });
  });

  // ============================================================================
  // Within 50% (5 points)
  // ============================================================================
  describe('within 50% (5 points)', () => {
    it('should return 5 for 40% difference', () => {
      const result = calculatePriceScore({
        candidateListing: { 'nightly_rate_for_4_night_stay': 140 },
        proposal: { nightlyPrice: 100, nightsPerWeek: 4 }
      });
      expect(result).toBe(5);
    });

    it('should return 5 for exactly 50% difference', () => {
      const result = calculatePriceScore({
        candidateListing: { 'nightly_rate_for_4_night_stay': 150 },
        proposal: { nightlyPrice: 100, nightsPerWeek: 4 }
      });
      expect(result).toBe(5);
    });

    it('should return 5 for 31% difference (just over 30%)', () => {
      const result = calculatePriceScore({
        candidateListing: { 'nightly_rate_for_4_night_stay': 131 },
        proposal: { nightlyPrice: 100, nightsPerWeek: 4 }
      });
      expect(result).toBe(5);
    });
  });

  // ============================================================================
  // Over 50% (0 points)
  // ============================================================================
  describe('over 50% (0 points)', () => {
    it('should return 0 for 51% difference', () => {
      const result = calculatePriceScore({
        candidateListing: { 'nightly_rate_for_4_night_stay': 151 },
        proposal: { nightlyPrice: 100, nightsPerWeek: 4 }
      });
      expect(result).toBe(0);
    });

    it('should return 0 for 100% difference (double price)', () => {
      const result = calculatePriceScore({
        candidateListing: { 'nightly_rate_for_4_night_stay': 200 },
        proposal: { nightlyPrice: 100, nightsPerWeek: 4 }
      });
      expect(result).toBe(0);
    });

    it('should return 0 for 75% difference', () => {
      const result = calculatePriceScore({
        candidateListing: { 'nightly_rate_for_4_night_stay': 175 },
        proposal: { nightlyPrice: 100, nightsPerWeek: 4 }
      });
      expect(result).toBe(0);
    });
  });

  // ============================================================================
  // Different Night Frequencies
  // ============================================================================
  describe('different night frequencies', () => {
    it('should use correct rate for 2 nights', () => {
      const result = calculatePriceScore({
        candidateListing: { 'nightly_rate_for_2_night_stay': 100 },
        proposal: { nightlyPrice: 100, nightsPerWeek: 2 }
      });
      expect(result).toBe(20);
    });

    it('should use correct rate for 3 nights', () => {
      const result = calculatePriceScore({
        candidateListing: { 'nightly_rate_for_3_night_stay': 90 },
        proposal: { nightlyPrice: 95, nightsPerWeek: 3 }
      });
      expect(result).toBe(20); // ~5% difference
    });

    it('should use correct rate for 5 nights', () => {
      const result = calculatePriceScore({
        candidateListing: { 'nightly_rate_for_5_night_stay': 80 },
        proposal: { nightlyPrice: 80, nightsPerWeek: 5 }
      });
      expect(result).toBe(20);
    });

    it('should use correct rate for 6 nights', () => {
      const result = calculatePriceScore({
        candidateListing: { 'nightly_rate_for_6_night_stay': 70 },
        proposal: { nightlyPrice: 70, nightsPerWeek: 6 }
      });
      expect(result).toBe(20);
    });

    it('should use correct rate for 7 nights (full-time)', () => {
      const result = calculatePriceScore({
        candidateListing: { 'nightly_rate_for_7_night_stay': 60 },
        proposal: { nightlyPrice: 60, nightsPerWeek: 7 }
      });
      expect(result).toBe(20);
    });

    it('should default to 4 nights when nightsPerWeek not specified', () => {
      const result = calculatePriceScore({
        candidateListing: { 'nightly_rate_for_4_night_stay': 100 },
        proposal: { nightlyPrice: 100 }
      });
      expect(result).toBe(20);
    });

    it('should use daysSelected.length when nightsPerWeek not specified', () => {
      const result = calculatePriceScore({
        candidateListing: { 'nightly_rate_for_5_night_stay': 100 },
        proposal: { nightlyPrice: 100, daysSelected: [1, 2, 3, 4, 5] }
      });
      expect(result).toBe(20);
    });
  });

  // ============================================================================
  // Missing or Invalid Data
  // ============================================================================
  describe('missing or invalid data', () => {
    it('should return 0 for null candidateListing', () => {
      const result = calculatePriceScore({
        candidateListing: null,
        proposal: { nightlyPrice: 100, nightsPerWeek: 4 }
      });
      expect(result).toBe(0);
    });

    it('should return 0 for undefined candidateListing', () => {
      const result = calculatePriceScore({
        candidateListing: undefined,
        proposal: { nightlyPrice: 100, nightsPerWeek: 4 }
      });
      expect(result).toBe(0);
    });

    it('should return 0 for null proposal', () => {
      const result = calculatePriceScore({
        candidateListing: { 'nightly_rate_for_4_night_stay': 100 },
        proposal: null
      });
      expect(result).toBe(0);
    });

    it('should return 0 for undefined proposal', () => {
      const result = calculatePriceScore({
        candidateListing: { 'nightly_rate_for_4_night_stay': 100 },
        proposal: undefined
      });
      expect(result).toBe(0);
    });

    it('should return 0 for missing nightlyPrice', () => {
      const result = calculatePriceScore({
        candidateListing: { 'nightly_rate_for_4_night_stay': 100 },
        proposal: { nightsPerWeek: 4 }
      });
      expect(result).toBe(0);
    });

    it('should return 0 for nightlyPrice of 0', () => {
      const result = calculatePriceScore({
        candidateListing: { 'nightly_rate_for_4_night_stay': 100 },
        proposal: { nightlyPrice: 0, nightsPerWeek: 4 }
      });
      expect(result).toBe(0);
    });

    it('should return 0 for negative nightlyPrice', () => {
      const result = calculatePriceScore({
        candidateListing: { 'nightly_rate_for_4_night_stay': 100 },
        proposal: { nightlyPrice: -50, nightsPerWeek: 4 }
      });
      expect(result).toBe(0);
    });

    it('should return 0 when candidate has no rate for frequency', () => {
      const result = calculatePriceScore({
        candidateListing: { 'nightly_rate_for_3_night_stay': 100 },
        proposal: { nightlyPrice: 100, nightsPerWeek: 4 }
      });
      expect(result).toBe(0);
    });

    it('should return 0 when candidate rate is 0', () => {
      const result = calculatePriceScore({
        candidateListing: { 'nightly_rate_for_4_night_stay': 0 },
        proposal: { nightlyPrice: 100, nightsPerWeek: 4 }
      });
      expect(result).toBe(0);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================
  describe('edge cases', () => {
    it('should handle very low prices', () => {
      const result = calculatePriceScore({
        candidateListing: { 'nightly_rate_for_4_night_stay': 10 },
        proposal: { nightlyPrice: 10, nightsPerWeek: 4 }
      });
      expect(result).toBe(20);
    });

    it('should handle very high prices', () => {
      const result = calculatePriceScore({
        candidateListing: { 'nightly_rate_for_4_night_stay': 5000 },
        proposal: { nightlyPrice: 5000, nightsPerWeek: 4 }
      });
      expect(result).toBe(20);
    });

    it('should handle decimal prices', () => {
      const result = calculatePriceScore({
        candidateListing: { 'nightly_rate_for_4_night_stay': 100.50 },
        proposal: { nightlyPrice: 100, nightsPerWeek: 4 }
      });
      expect(result).toBe(20); // ~0.5% difference
    });

    it('should handle price override in listing', () => {
      const result = calculatePriceScore({
        candidateListing: {
          'nightly_rate_for_4_night_stay': 100,
          'price_override': 90  // Correct field name with emoji prefix
        },
        proposal: { nightlyPrice: 90, nightsPerWeek: 4 }
      });
      // Price override takes precedence in getNightlyRateByFrequency
      expect(result).toBe(20);
    });
  });

  // ============================================================================
  // Real-World Scenarios
  // ============================================================================
  describe('real-world scenarios', () => {
    it('should score budget-conscious guest (looking for lower price)', () => {
      const result = calculatePriceScore({
        candidateListing: { 'nightly_rate_for_4_night_stay': 90 },
        proposal: { nightlyPrice: 100, nightsPerWeek: 4 }
      });
      expect(result).toBe(20); // 10% lower = within threshold
    });

    it('should score premium listing vs budget guest', () => {
      const result = calculatePriceScore({
        candidateListing: { 'nightly_rate_for_4_night_stay': 200 },
        proposal: { nightlyPrice: 100, nightsPerWeek: 4 }
      });
      expect(result).toBe(0); // 100% difference
    });

    it('should handle typical weekday stay match', () => {
      const result = calculatePriceScore({
        candidateListing: { 'nightly_rate_for_4_night_stay': 120 },
        proposal: { nightlyPrice: 115, nightsPerWeek: 4 }
      });
      expect(result).toBe(20); // ~4% difference
    });

    it('should handle full-time stay match', () => {
      const result = calculatePriceScore({
        candidateListing: { 'nightly_rate_for_7_night_stay': 80 },
        proposal: { nightlyPrice: 85, nightsPerWeek: 7 }
      });
      expect(result).toBe(20); // ~6% difference
    });
  });
});
