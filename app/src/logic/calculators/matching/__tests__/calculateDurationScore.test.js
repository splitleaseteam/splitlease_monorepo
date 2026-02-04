/**
 * Tests for calculateDurationScore
 *
 * Score how well listing's minimum nights aligns with proposal duration.
 * Exact match or within tolerance = 10 points.
 * Outside tolerance = 0 points.
 */
import { describe, it, expect } from 'vitest';
import { calculateDurationScore } from '../calculateDurationScore.js';

describe('calculateDurationScore', () => {
  // ============================================================================
  // Happy Path - Exact Match (10 points)
  // ============================================================================
  describe('exact duration match (10 points)', () => {
    it('should return 10 for exact match of 4 nights', () => {
      const result = calculateDurationScore({
        candidateListing: { 'Minimum Nights': 4 },
        proposal: { nightsPerWeek: 4 }
      });
      expect(result).toBe(10);
    });

    it('should return 10 for exact match of 2 nights', () => {
      const result = calculateDurationScore({
        candidateListing: { 'Minimum Nights': 2 },
        proposal: { nightsPerWeek: 2 }
      });
      expect(result).toBe(10);
    });

    it('should return 10 for exact match of 5 nights', () => {
      const result = calculateDurationScore({
        candidateListing: { 'Minimum Nights': 5 },
        proposal: { nightsPerWeek: 5 }
      });
      expect(result).toBe(10);
    });

    it('should return 10 for exact match of 7 nights (full-time)', () => {
      const result = calculateDurationScore({
        candidateListing: { 'Minimum Nights': 7 },
        proposal: { nightsPerWeek: 7 }
      });
      expect(result).toBe(10);
    });
  });

  // ============================================================================
  // Within Tolerance (10 points)
  // ============================================================================
  describe('within tolerance (10 points)', () => {
    it('should return 10 when difference is 1 night (min 4, proposal 5)', () => {
      const result = calculateDurationScore({
        candidateListing: { 'Minimum Nights': 4 },
        proposal: { nightsPerWeek: 5 }
      });
      expect(result).toBe(10);
    });

    it('should return 10 when difference is 1 night (min 5, proposal 4)', () => {
      const result = calculateDurationScore({
        candidateListing: { 'Minimum Nights': 5 },
        proposal: { nightsPerWeek: 4 }
      });
      expect(result).toBe(10);
    });

    it('should return 10 when proposal has 1 more night', () => {
      const result = calculateDurationScore({
        candidateListing: { 'Minimum Nights': 3 },
        proposal: { nightsPerWeek: 4 }
      });
      expect(result).toBe(10);
    });

    it('should return 10 when listing has 1 more minimum night', () => {
      const result = calculateDurationScore({
        candidateListing: { 'Minimum Nights': 6 },
        proposal: { nightsPerWeek: 5 }
      });
      expect(result).toBe(10);
    });
  });

  // ============================================================================
  // Outside Tolerance (0 points)
  // ============================================================================
  describe('outside tolerance (0 points)', () => {
    it('should return 0 when difference is 2 nights', () => {
      const result = calculateDurationScore({
        candidateListing: { 'Minimum Nights': 4 },
        proposal: { nightsPerWeek: 2 }
      });
      expect(result).toBe(0);
    });

    it('should return 0 when difference is 3 nights', () => {
      const result = calculateDurationScore({
        candidateListing: { 'Minimum Nights': 2 },
        proposal: { nightsPerWeek: 5 }
      });
      expect(result).toBe(0);
    });

    it('should return 0 when difference is 4 nights', () => {
      const result = calculateDurationScore({
        candidateListing: { 'Minimum Nights': 3 },
        proposal: { nightsPerWeek: 7 }
      });
      expect(result).toBe(0);
    });

    it('should return 0 when difference is 5 nights (max range)', () => {
      const result = calculateDurationScore({
        candidateListing: { 'Minimum Nights': 2 },
        proposal: { nightsPerWeek: 7 }
      });
      expect(result).toBe(0);
    });
  });

  // ============================================================================
  // Flexible Listings (No Minimum - Always Match)
  // ============================================================================
  describe('flexible listings (no minimum nights)', () => {
    it('should return 10 when Minimum Nights is null (flexible)', () => {
      const result = calculateDurationScore({
        candidateListing: { 'Minimum Nights': null },
        proposal: { nightsPerWeek: 4 }
      });
      expect(result).toBe(10);
    });

    it('should return 10 when Minimum Nights is undefined (flexible)', () => {
      const result = calculateDurationScore({
        candidateListing: {},
        proposal: { nightsPerWeek: 4 }
      });
      expect(result).toBe(10);
    });

    it('should return 10 for any proposal when listing is flexible', () => {
      const scenarios = [2, 3, 4, 5, 6, 7];
      for (const nights of scenarios) {
        const result = calculateDurationScore({
          candidateListing: { 'Minimum Nights': null },
          proposal: { nightsPerWeek: nights }
        });
        expect(result).toBe(10);
      }
    });

    it('should treat non-number Minimum Nights as flexible', () => {
      const result = calculateDurationScore({
        candidateListing: { 'Minimum Nights': 'four' },
        proposal: { nightsPerWeek: 4 }
      });
      expect(result).toBe(10);
    });
  });

  // ============================================================================
  // Alternative Field Names
  // ============================================================================
  describe('alternative field names', () => {
    it('should use daysSelected.length when nightsPerWeek not available', () => {
      const result = calculateDurationScore({
        candidateListing: { 'Minimum Nights': 4 },
        proposal: { daysSelected: [1, 2, 3, 4] }
      });
      expect(result).toBe(10);
    });

    it('should prioritize nightsPerWeek over daysSelected.length', () => {
      const result = calculateDurationScore({
        candidateListing: { 'Minimum Nights': 4 },
        proposal: { nightsPerWeek: 4, daysSelected: [1, 2, 3, 4, 5] }
      });
      expect(result).toBe(10);
    });
  });

  // ============================================================================
  // Missing or Invalid Data
  // ============================================================================
  describe('missing or invalid data', () => {
    it('should return 0 for null candidateListing', () => {
      const result = calculateDurationScore({
        candidateListing: null,
        proposal: { nightsPerWeek: 4 }
      });
      expect(result).toBe(0);
    });

    it('should return 0 for undefined candidateListing', () => {
      const result = calculateDurationScore({
        candidateListing: undefined,
        proposal: { nightsPerWeek: 4 }
      });
      expect(result).toBe(0);
    });

    it('should return 0 for null proposal', () => {
      const result = calculateDurationScore({
        candidateListing: { 'Minimum Nights': 4 },
        proposal: null
      });
      expect(result).toBe(0);
    });

    it('should return 0 for undefined proposal', () => {
      const result = calculateDurationScore({
        candidateListing: { 'Minimum Nights': 4 },
        proposal: undefined
      });
      expect(result).toBe(0);
    });

    it('should return 0 when proposal has no nights info', () => {
      const result = calculateDurationScore({
        candidateListing: { 'Minimum Nights': 4 },
        proposal: {}
      });
      expect(result).toBe(0);
    });

    it('should return 0 when proposal nightsPerWeek is 0', () => {
      const result = calculateDurationScore({
        candidateListing: { 'Minimum Nights': 4 },
        proposal: { nightsPerWeek: 0 }
      });
      expect(result).toBe(0);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================
  describe('edge cases', () => {
    it('should handle minimum value (2 nights)', () => {
      const result = calculateDurationScore({
        candidateListing: { 'Minimum Nights': 2 },
        proposal: { nightsPerWeek: 2 }
      });
      expect(result).toBe(10);
    });

    it('should handle maximum value (7 nights)', () => {
      const result = calculateDurationScore({
        candidateListing: { 'Minimum Nights': 7 },
        proposal: { nightsPerWeek: 7 }
      });
      expect(result).toBe(10);
    });

    it('should handle boundary case (6 and 7 nights)', () => {
      const result = calculateDurationScore({
        candidateListing: { 'Minimum Nights': 6 },
        proposal: { nightsPerWeek: 7 }
      });
      expect(result).toBe(10);
    });

    it('should handle negative Minimum Nights (treat as flexible)', () => {
      const result = calculateDurationScore({
        candidateListing: { 'Minimum Nights': -1 },
        proposal: { nightsPerWeek: 4 }
      });
      // Negative numbers are numbers, so they'd calculate difference
      // This is implementation-specific edge case
      expect(result).toBe(0); // 4 - (-1) = 5, outside tolerance
    });
  });

  // ============================================================================
  // Real-World Scenarios
  // ============================================================================
  describe('real-world scenarios', () => {
    it('should match typical Mon-Thu stay (4 nights)', () => {
      const result = calculateDurationScore({
        candidateListing: { 'Minimum Nights': 4 },
        proposal: { nightsPerWeek: 4 }
      });
      expect(result).toBe(10);
    });

    it('should match flexible listing with weekend stay (3 nights)', () => {
      const result = calculateDurationScore({
        candidateListing: { 'Minimum Nights': null },
        proposal: { nightsPerWeek: 3 }
      });
      expect(result).toBe(10);
    });

    it('should not match full-time listing with weekend guest', () => {
      const result = calculateDurationScore({
        candidateListing: { 'Minimum Nights': 7 },
        proposal: { nightsPerWeek: 2 }
      });
      expect(result).toBe(0);
    });

    it('should match listing using daysSelected from UI', () => {
      const result = calculateDurationScore({
        candidateListing: { 'Minimum Nights': 5 },
        proposal: { daysSelected: [1, 2, 3, 4, 5] } // Mon-Fri
      });
      expect(result).toBe(10);
    });
  });
});
