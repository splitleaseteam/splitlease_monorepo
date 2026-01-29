/**
 * Tests for supportsWeeklyStays
 *
 * Check if listing supports weekly (7-night) stays.
 * Listing must have minimum nights <= 7 and all 7 days available.
 */
import { describe, it, expect } from 'vitest';
import { supportsWeeklyStays } from '../supportsWeeklyStays.js';

describe('supportsWeeklyStays', () => {
  // ============================================================================
  // Returns True - Supports Weekly Stays
  // ============================================================================
  describe('returns true when listing supports weekly stays', () => {
    it('should return true with all 7 days available and min nights <= 7', () => {
      const result = supportsWeeklyStays({
        listing: {
          'Schedule days available': [0, 1, 2, 3, 4, 5, 6],
          'Minimum Nights': 3
        }
      });
      expect(result).toBe(true);
    });

    it('should return true with all 7 days and min nights exactly 7', () => {
      const result = supportsWeeklyStays({
        listing: {
          'Schedule days available': [0, 1, 2, 3, 4, 5, 6],
          'Minimum Nights': 7
        }
      });
      expect(result).toBe(true);
    });

    it('should return true with all 7 days and min nights is 1', () => {
      const result = supportsWeeklyStays({
        listing: {
          'Schedule days available': [0, 1, 2, 3, 4, 5, 6],
          'Minimum Nights': 1
        }
      });
      expect(result).toBe(true);
    });

    it('should return true with all 7 days and min nights is null', () => {
      const result = supportsWeeklyStays({
        listing: {
          'Schedule days available': [0, 1, 2, 3, 4, 5, 6],
          'Minimum Nights': null
        }
      });
      expect(result).toBe(true);
    });

    it('should return true with all 7 days and min nights is undefined', () => {
      const result = supportsWeeklyStays({
        listing: {
          'Schedule days available': [0, 1, 2, 3, 4, 5, 6]
          // 'Minimum Nights' not set
        }
      });
      expect(result).toBe(true);
    });

    it('should return true regardless of day order in array', () => {
      const result = supportsWeeklyStays({
        listing: {
          'Schedule days available': [6, 4, 2, 0, 5, 3, 1], // Scrambled but 7 days
          'Minimum Nights': 2
        }
      });
      expect(result).toBe(true);
    });
  });

  // ============================================================================
  // Returns False - Less Than 7 Days Available
  // ============================================================================
  describe('returns false when less than 7 days available', () => {
    it('should return false with only 5 days (Mon-Fri)', () => {
      const result = supportsWeeklyStays({
        listing: {
          'Schedule days available': [1, 2, 3, 4, 5],
          'Minimum Nights': 2
        }
      });
      expect(result).toBe(false);
    });

    it('should return false with only 4 days', () => {
      const result = supportsWeeklyStays({
        listing: {
          'Schedule days available': [1, 2, 3, 4],
          'Minimum Nights': 2
        }
      });
      expect(result).toBe(false);
    });

    it('should return false with only 6 days', () => {
      const result = supportsWeeklyStays({
        listing: {
          'Schedule days available': [0, 1, 2, 3, 4, 5],
          'Minimum Nights': 1
        }
      });
      expect(result).toBe(false);
    });

    it('should return false with single day', () => {
      const result = supportsWeeklyStays({
        listing: {
          'Schedule days available': [1],
          'Minimum Nights': 1
        }
      });
      expect(result).toBe(false);
    });

    it('should return false with empty days array', () => {
      const result = supportsWeeklyStays({
        listing: {
          'Schedule days available': [],
          'Minimum Nights': 1
        }
      });
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // Returns False - Minimum Nights > 7
  // ============================================================================
  describe('returns false when minimum nights exceeds 7', () => {
    it('should return false with min nights of 8', () => {
      const result = supportsWeeklyStays({
        listing: {
          'Schedule days available': [0, 1, 2, 3, 4, 5, 6],
          'Minimum Nights': 8
        }
      });
      expect(result).toBe(false);
    });

    it('should return false with min nights of 14 (two weeks)', () => {
      const result = supportsWeeklyStays({
        listing: {
          'Schedule days available': [0, 1, 2, 3, 4, 5, 6],
          'Minimum Nights': 14
        }
      });
      expect(result).toBe(false);
    });

    it('should return false with min nights of 30', () => {
      const result = supportsWeeklyStays({
        listing: {
          'Schedule days available': [0, 1, 2, 3, 4, 5, 6],
          'Minimum Nights': 30
        }
      });
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // Returns False - Invalid/Missing Inputs
  // ============================================================================
  describe('returns false for invalid/missing inputs', () => {
    it('should return false for null listing', () => {
      const result = supportsWeeklyStays({ listing: null });
      expect(result).toBe(false);
    });

    it('should return false for undefined listing', () => {
      const result = supportsWeeklyStays({ listing: undefined });
      expect(result).toBe(false);
    });

    it('should return false when days available is not an array', () => {
      const result = supportsWeeklyStays({
        listing: {
          'Schedule days available': 'Mon-Sun',
          'Minimum Nights': 2
        }
      });
      expect(result).toBe(false);
    });

    it('should return false when days available is null', () => {
      const result = supportsWeeklyStays({
        listing: {
          'Schedule days available': null,
          'Minimum Nights': 2
        }
      });
      expect(result).toBe(false);
    });

    it('should return false when days available is undefined', () => {
      const result = supportsWeeklyStays({
        listing: {
          'Minimum Nights': 2
        }
      });
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================
  describe('edge cases', () => {
    it('should handle duplicate days in array (counts actual length)', () => {
      // Array with duplicates - length is 9 but unique days aren't considered
      const result = supportsWeeklyStays({
        listing: {
          'Schedule days available': [0, 1, 2, 3, 4, 5, 6, 0, 1],
          'Minimum Nights': 2
        }
      });
      // Function checks length === 7, so this returns false (length is 9)
      expect(result).toBe(false);
    });

    it('should return false for object with wrong property names', () => {
      const result = supportsWeeklyStays({
        listing: {
          scheduleDaysAvailable: [0, 1, 2, 3, 4, 5, 6],
          minimumNights: 2
        }
      });
      expect(result).toBe(false);
    });

    it('should handle listing with zero minimum nights', () => {
      const result = supportsWeeklyStays({
        listing: {
          'Schedule days available': [0, 1, 2, 3, 4, 5, 6],
          'Minimum Nights': 0
        }
      });
      expect(result).toBe(true);
    });

    it('should handle negative minimum nights (invalid but <= 7)', () => {
      const result = supportsWeeklyStays({
        listing: {
          'Schedule days available': [0, 1, 2, 3, 4, 5, 6],
          'Minimum Nights': -1
        }
      });
      expect(result).toBe(true);
    });
  });

  // ============================================================================
  // Real-World Scenarios
  // ============================================================================
  describe('real-world scenarios', () => {
    it('should support flexible listing available all week', () => {
      const listing = {
        id: 'listing123',
        title: 'Cozy Manhattan Studio',
        'Schedule days available': [0, 1, 2, 3, 4, 5, 6],
        'Minimum Nights': 2
      };

      const result = supportsWeeklyStays({ listing });
      expect(result).toBe(true);
    });

    it('should not support weekday-only commuter listing', () => {
      const listing = {
        id: 'listing456',
        title: 'Brooklyn Commuter Pad',
        'Schedule days available': [1, 2, 3, 4, 5], // Mon-Fri only
        'Minimum Nights': 1
      };

      const result = supportsWeeklyStays({ listing });
      expect(result).toBe(false);
    });

    it('should not support long-term-only listing', () => {
      const listing = {
        id: 'listing789',
        title: 'Long-Term Queens Apartment',
        'Schedule days available': [0, 1, 2, 3, 4, 5, 6],
        'Minimum Nights': 28 // Monthly minimum
      };

      const result = supportsWeeklyStays({ listing });
      expect(result).toBe(false);
    });

    it('should handle listing with default/unset minimum nights', () => {
      const listing = {
        id: 'listing101',
        title: 'New Listing',
        'Schedule days available': [0, 1, 2, 3, 4, 5, 6]
        // 'Minimum Nights' not yet set by host
      };

      const result = supportsWeeklyStays({ listing });
      expect(result).toBe(true);
    });
  });
});
