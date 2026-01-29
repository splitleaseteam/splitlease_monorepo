/**
 * Tests for isDurationMatch
 *
 * Check if listing's minimum nights closely matches proposal duration.
 * Match if difference between minimum nights and proposal nights <= tolerance.
 * Missing minimum nights treated as match (flexible listing).
 */
import { describe, it, expect } from 'vitest';
import { isDurationMatch } from '../isDurationMatch.js';

describe('isDurationMatch', () => {
  // ============================================================================
  // Exact Match
  // ============================================================================
  describe('exact match', () => {
    it('should return true for exact match of 4 nights', () => {
      expect(isDurationMatch({
        listing: { 'Minimum Nights': 4 },
        proposal: { nightsPerWeek: 4 }
      })).toBe(true);
    });

    it('should return true for exact match of 2 nights', () => {
      expect(isDurationMatch({
        listing: { 'Minimum Nights': 2 },
        proposal: { nightsPerWeek: 2 }
      })).toBe(true);
    });

    it('should return true for exact match of 5 nights', () => {
      expect(isDurationMatch({
        listing: { 'Minimum Nights': 5 },
        proposal: { nightsPerWeek: 5 }
      })).toBe(true);
    });

    it('should return true for exact match of 7 nights', () => {
      expect(isDurationMatch({
        listing: { 'Minimum Nights': 7 },
        proposal: { nightsPerWeek: 7 }
      })).toBe(true);
    });
  });

  // ============================================================================
  // Within Default Tolerance (1 night)
  // ============================================================================
  describe('within default tolerance (1 night)', () => {
    it('should return true when proposal is 1 more than minimum', () => {
      expect(isDurationMatch({
        listing: { 'Minimum Nights': 4 },
        proposal: { nightsPerWeek: 5 }
      })).toBe(true);
    });

    it('should return true when proposal is 1 less than minimum', () => {
      expect(isDurationMatch({
        listing: { 'Minimum Nights': 4 },
        proposal: { nightsPerWeek: 3 }
      })).toBe(true);
    });

    it('should return true for 2 and 3 nights difference of 1', () => {
      expect(isDurationMatch({
        listing: { 'Minimum Nights': 2 },
        proposal: { nightsPerWeek: 3 }
      })).toBe(true);
    });

    it('should return true for 6 and 7 nights difference of 1', () => {
      expect(isDurationMatch({
        listing: { 'Minimum Nights': 6 },
        proposal: { nightsPerWeek: 7 }
      })).toBe(true);
    });
  });

  // ============================================================================
  // Outside Default Tolerance
  // ============================================================================
  describe('outside default tolerance', () => {
    it('should return false when difference is 2', () => {
      expect(isDurationMatch({
        listing: { 'Minimum Nights': 4 },
        proposal: { nightsPerWeek: 2 }
      })).toBe(false);
    });

    it('should return false when difference is 3', () => {
      expect(isDurationMatch({
        listing: { 'Minimum Nights': 2 },
        proposal: { nightsPerWeek: 5 }
      })).toBe(false);
    });

    it('should return false when difference is 4', () => {
      expect(isDurationMatch({
        listing: { 'Minimum Nights': 3 },
        proposal: { nightsPerWeek: 7 }
      })).toBe(false);
    });

    it('should return false when difference is 5 (max range)', () => {
      expect(isDurationMatch({
        listing: { 'Minimum Nights': 2 },
        proposal: { nightsPerWeek: 7 }
      })).toBe(false);
    });
  });

  // ============================================================================
  // Custom Tolerance
  // ============================================================================
  describe('custom tolerance', () => {
    it('should return true for difference of 2 with tolerance of 2', () => {
      expect(isDurationMatch({
        listing: { 'Minimum Nights': 4 },
        proposal: { nightsPerWeek: 2 },
        tolerance: 2
      })).toBe(true);
    });

    it('should return false for difference of 3 with tolerance of 2', () => {
      expect(isDurationMatch({
        listing: { 'Minimum Nights': 2 },
        proposal: { nightsPerWeek: 5 },
        tolerance: 2
      })).toBe(false);
    });

    it('should return true for any match with tolerance of 5', () => {
      expect(isDurationMatch({
        listing: { 'Minimum Nights': 2 },
        proposal: { nightsPerWeek: 7 },
        tolerance: 5
      })).toBe(true);
    });

    it('should return false for any non-exact with tolerance of 0', () => {
      expect(isDurationMatch({
        listing: { 'Minimum Nights': 4 },
        proposal: { nightsPerWeek: 5 },
        tolerance: 0
      })).toBe(false);
    });

    it('should return true for exact match with tolerance of 0', () => {
      expect(isDurationMatch({
        listing: { 'Minimum Nights': 4 },
        proposal: { nightsPerWeek: 4 },
        tolerance: 0
      })).toBe(true);
    });
  });

  // ============================================================================
  // Flexible Listings (No Minimum Nights)
  // ============================================================================
  describe('flexible listings (no minimum nights)', () => {
    it('should return true when Minimum Nights is null', () => {
      expect(isDurationMatch({
        listing: { 'Minimum Nights': null },
        proposal: { nightsPerWeek: 4 }
      })).toBe(true);
    });

    it('should return true when Minimum Nights is undefined', () => {
      expect(isDurationMatch({
        listing: {},
        proposal: { nightsPerWeek: 4 }
      })).toBe(true);
    });

    it('should return true for any nights when listing is flexible', () => {
      const nights = [2, 3, 4, 5, 6, 7];
      for (const n of nights) {
        expect(isDurationMatch({
          listing: { 'Minimum Nights': null },
          proposal: { nightsPerWeek: n }
        })).toBe(true);
      }
    });

    it('should treat non-number Minimum Nights as flexible', () => {
      expect(isDurationMatch({
        listing: { 'Minimum Nights': 'four' },
        proposal: { nightsPerWeek: 4 }
      })).toBe(true);
    });

    it('should treat object Minimum Nights as flexible', () => {
      expect(isDurationMatch({
        listing: { 'Minimum Nights': { value: 4 } },
        proposal: { nightsPerWeek: 4 }
      })).toBe(true);
    });
  });

  // ============================================================================
  // Alternative Proposal Fields
  // ============================================================================
  describe('alternative proposal fields', () => {
    it('should use daysSelected.length when nightsPerWeek not available', () => {
      expect(isDurationMatch({
        listing: { 'Minimum Nights': 4 },
        proposal: { daysSelected: [1, 2, 3, 4] }
      })).toBe(true);
    });

    it('should prioritize nightsPerWeek over daysSelected', () => {
      expect(isDurationMatch({
        listing: { 'Minimum Nights': 4 },
        proposal: { nightsPerWeek: 4, daysSelected: [1, 2, 3, 4, 5, 6, 7] }
      })).toBe(true);
    });

    it('should return false when daysSelected is empty', () => {
      expect(isDurationMatch({
        listing: { 'Minimum Nights': 4 },
        proposal: { daysSelected: [] }
      })).toBe(false);
    });
  });

  // ============================================================================
  // Invalid Inputs
  // ============================================================================
  describe('invalid inputs', () => {
    it('should return false for null listing', () => {
      expect(isDurationMatch({
        listing: null,
        proposal: { nightsPerWeek: 4 }
      })).toBe(false);
    });

    it('should return false for undefined listing', () => {
      expect(isDurationMatch({
        listing: undefined,
        proposal: { nightsPerWeek: 4 }
      })).toBe(false);
    });

    it('should return false for null proposal', () => {
      expect(isDurationMatch({
        listing: { 'Minimum Nights': 4 },
        proposal: null
      })).toBe(false);
    });

    it('should return false for undefined proposal', () => {
      expect(isDurationMatch({
        listing: { 'Minimum Nights': 4 },
        proposal: undefined
      })).toBe(false);
    });

    it('should return false when proposal has no nights info', () => {
      expect(isDurationMatch({
        listing: { 'Minimum Nights': 4 },
        proposal: {}
      })).toBe(false);
    });

    it('should return false when nightsPerWeek is 0', () => {
      expect(isDurationMatch({
        listing: { 'Minimum Nights': 4 },
        proposal: { nightsPerWeek: 0 }
      })).toBe(false);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================
  describe('edge cases', () => {
    it('should handle minimum boundary (2 nights)', () => {
      expect(isDurationMatch({
        listing: { 'Minimum Nights': 2 },
        proposal: { nightsPerWeek: 2 }
      })).toBe(true);
    });

    it('should handle maximum boundary (7 nights)', () => {
      expect(isDurationMatch({
        listing: { 'Minimum Nights': 7 },
        proposal: { nightsPerWeek: 7 }
      })).toBe(true);
    });

    it('should handle negative Minimum Nights (treated as number)', () => {
      // Negative values would create large difference
      expect(isDurationMatch({
        listing: { 'Minimum Nights': -1 },
        proposal: { nightsPerWeek: 4 }
      })).toBe(false);
    });

    it('should handle decimal Minimum Nights', () => {
      // 4.5 - 4 = 0.5, which is <= 1
      expect(isDurationMatch({
        listing: { 'Minimum Nights': 4.5 },
        proposal: { nightsPerWeek: 4 }
      })).toBe(true);
    });

    it('should handle very large Minimum Nights', () => {
      expect(isDurationMatch({
        listing: { 'Minimum Nights': 100 },
        proposal: { nightsPerWeek: 7 }
      })).toBe(false);
    });
  });

  // ============================================================================
  // Real-World Scenarios
  // ============================================================================
  describe('real-world scenarios', () => {
    it('should match Mon-Thu guest with 4-night minimum listing', () => {
      expect(isDurationMatch({
        listing: { 'Minimum Nights': 4 },
        proposal: { nightsPerWeek: 4 }
      })).toBe(true);
    });

    it('should match weekend guest with flexible listing', () => {
      expect(isDurationMatch({
        listing: { 'Minimum Nights': null },
        proposal: { nightsPerWeek: 2 }
      })).toBe(true);
    });

    it('should not match full-time listing with weekend guest', () => {
      expect(isDurationMatch({
        listing: { 'Minimum Nights': 7 },
        proposal: { nightsPerWeek: 2 }
      })).toBe(false);
    });

    it('should match 5-night request with 4-night minimum (within tolerance)', () => {
      expect(isDurationMatch({
        listing: { 'Minimum Nights': 4 },
        proposal: { nightsPerWeek: 5 }
      })).toBe(true);
    });

    it('should not match 7-night request with 4-night minimum', () => {
      expect(isDurationMatch({
        listing: { 'Minimum Nights': 4 },
        proposal: { nightsPerWeek: 7 }
      })).toBe(false);
    });
  });
});
