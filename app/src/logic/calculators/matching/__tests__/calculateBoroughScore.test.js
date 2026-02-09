/**
 * Tests for calculateBoroughScore
 *
 * Score geographic proximity between candidate and proposal listings.
 * Same borough = 25 points (full match).
 * Adjacent borough = 15 points (partial match).
 * Different/non-adjacent = 0 points.
 */
import { describe, it, expect } from 'vitest';
import { calculateBoroughScore } from '../calculateBoroughScore.js';

describe('calculateBoroughScore', () => {
  // ============================================================================
  // Happy Path - Exact Borough Match (25 points)
  // ============================================================================
  describe('exact borough match (25 points)', () => {
    it('should return 25 for same borough (Manhattan)', () => {
      const result = calculateBoroughScore({
        candidateListing: { boroughName: 'Manhattan' },
        proposal: { listing: { boroughName: 'Manhattan' } }
      });
      expect(result).toBe(25);
    });

    it('should return 25 for same borough (Brooklyn)', () => {
      const result = calculateBoroughScore({
        candidateListing: { boroughName: 'Brooklyn' },
        proposal: { listing: { boroughName: 'Brooklyn' } }
      });
      expect(result).toBe(25);
    });

    it('should return 25 for same borough (Queens)', () => {
      const result = calculateBoroughScore({
        candidateListing: { boroughName: 'Queens' },
        proposal: { listing: { boroughName: 'Queens' } }
      });
      expect(result).toBe(25);
    });

    it('should return 25 for same borough (Bronx)', () => {
      const result = calculateBoroughScore({
        candidateListing: { boroughName: 'Bronx' },
        proposal: { listing: { boroughName: 'Bronx' } }
      });
      expect(result).toBe(25);
    });

    it('should return 25 for same borough (Staten Island)', () => {
      const result = calculateBoroughScore({
        candidateListing: { boroughName: 'Staten Island' },
        proposal: { listing: { boroughName: 'Staten Island' } }
      });
      expect(result).toBe(25);
    });

    it('should be case-insensitive', () => {
      const result = calculateBoroughScore({
        candidateListing: { boroughName: 'MANHATTAN' },
        proposal: { listing: { boroughName: 'manhattan' } }
      });
      expect(result).toBe(25);
    });

    it('should handle whitespace in borough names', () => {
      const result = calculateBoroughScore({
        candidateListing: { boroughName: '  Manhattan  ' },
        proposal: { listing: { boroughName: 'Manhattan' } }
      });
      expect(result).toBe(25);
    });
  });

  // ============================================================================
  // Adjacent Borough Match (15 points)
  // ============================================================================
  describe('adjacent borough match (15 points)', () => {
    it('should return 15 for Manhattan and Brooklyn (adjacent)', () => {
      const result = calculateBoroughScore({
        candidateListing: { boroughName: 'Brooklyn' },
        proposal: { listing: { boroughName: 'Manhattan' } }
      });
      expect(result).toBe(15);
    });

    it('should return 15 for Manhattan and Queens (adjacent)', () => {
      const result = calculateBoroughScore({
        candidateListing: { boroughName: 'Queens' },
        proposal: { listing: { boroughName: 'Manhattan' } }
      });
      expect(result).toBe(15);
    });

    it('should return 15 for Manhattan and Bronx (adjacent)', () => {
      const result = calculateBoroughScore({
        candidateListing: { boroughName: 'Bronx' },
        proposal: { listing: { boroughName: 'Manhattan' } }
      });
      expect(result).toBe(15);
    });

    it('should return 15 for Brooklyn and Queens (adjacent)', () => {
      const result = calculateBoroughScore({
        candidateListing: { boroughName: 'Queens' },
        proposal: { listing: { boroughName: 'Brooklyn' } }
      });
      expect(result).toBe(15);
    });

    it('should return 15 for Brooklyn and Staten Island (adjacent)', () => {
      const result = calculateBoroughScore({
        candidateListing: { boroughName: 'Staten Island' },
        proposal: { listing: { boroughName: 'Brooklyn' } }
      });
      expect(result).toBe(15);
    });

    it('should return 15 for Queens and Bronx (adjacent)', () => {
      const result = calculateBoroughScore({
        candidateListing: { boroughName: 'Bronx' },
        proposal: { listing: { boroughName: 'Queens' } }
      });
      expect(result).toBe(15);
    });
  });

  // ============================================================================
  // Non-Adjacent Borough (0 points)
  // ============================================================================
  describe('non-adjacent borough (0 points)', () => {
    it('should return 0 for Manhattan and Staten Island (not adjacent)', () => {
      const result = calculateBoroughScore({
        candidateListing: { boroughName: 'Staten Island' },
        proposal: { listing: { boroughName: 'Manhattan' } }
      });
      expect(result).toBe(0);
    });

    it('should return 0 for Bronx and Brooklyn (not adjacent)', () => {
      const result = calculateBoroughScore({
        candidateListing: { boroughName: 'Brooklyn' },
        proposal: { listing: { boroughName: 'Bronx' } }
      });
      expect(result).toBe(0);
    });

    it('should return 0 for Bronx and Staten Island (not adjacent)', () => {
      const result = calculateBoroughScore({
        candidateListing: { boroughName: 'Staten Island' },
        proposal: { listing: { boroughName: 'Bronx' } }
      });
      expect(result).toBe(0);
    });

    it('should return 0 for Queens and Staten Island (not adjacent)', () => {
      const result = calculateBoroughScore({
        candidateListing: { boroughName: 'Staten Island' },
        proposal: { listing: { boroughName: 'Queens' } }
      });
      expect(result).toBe(0);
    });
  });

  // ============================================================================
  // Alternative Field Names
  // ============================================================================
  describe('alternative field names', () => {
    it('should handle "borough" field in candidateListing', () => {
      const result = calculateBoroughScore({
        candidateListing: { borough: 'Manhattan' },
        proposal: { listing: { boroughName: 'Manhattan' } }
      });
      expect(result).toBe(25);
    });

    it('should handle "borough" field in proposal.listing', () => {
      const result = calculateBoroughScore({
        candidateListing: { boroughName: 'Brooklyn' },
        proposal: { listing: { borough: 'Brooklyn' } }
      });
      expect(result).toBe(25);
    });

    it('should handle "borough" field in both candidateListing and proposal.listing', () => {
      const result = calculateBoroughScore({
        candidateListing: { borough: 'Queens' },
        proposal: { listing: { borough: 'Queens' } }
      });
      expect(result).toBe(25);
    });

    it('should prioritize boroughName over borough', () => {
      const result = calculateBoroughScore({
        candidateListing: { boroughName: 'Manhattan', borough: 'Brooklyn' },
        proposal: { listing: { boroughName: 'Manhattan' } }
      });
      expect(result).toBe(25);
    });
  });

  // ============================================================================
  // Missing or Invalid Data
  // ============================================================================
  describe('missing or invalid data', () => {
    it('should return 0 for null candidateListing', () => {
      const result = calculateBoroughScore({
        candidateListing: null,
        proposal: { listing: { boroughName: 'Manhattan' } }
      });
      expect(result).toBe(0);
    });

    it('should return 0 for undefined candidateListing', () => {
      const result = calculateBoroughScore({
        candidateListing: undefined,
        proposal: { listing: { boroughName: 'Manhattan' } }
      });
      expect(result).toBe(0);
    });

    it('should return 0 for null proposal', () => {
      const result = calculateBoroughScore({
        candidateListing: { boroughName: 'Manhattan' },
        proposal: null
      });
      expect(result).toBe(0);
    });

    it('should return 0 for undefined proposal', () => {
      const result = calculateBoroughScore({
        candidateListing: { boroughName: 'Manhattan' },
        proposal: undefined
      });
      expect(result).toBe(0);
    });

    it('should return 0 for missing boroughName in candidateListing', () => {
      const result = calculateBoroughScore({
        candidateListing: {},
        proposal: { listing: { boroughName: 'Manhattan' } }
      });
      expect(result).toBe(0);
    });

    it('should return 0 for missing listing in proposal', () => {
      const result = calculateBoroughScore({
        candidateListing: { boroughName: 'Manhattan' },
        proposal: {}
      });
      expect(result).toBe(0);
    });

    it('should return 0 for missing boroughName in proposal.listing', () => {
      const result = calculateBoroughScore({
        candidateListing: { boroughName: 'Manhattan' },
        proposal: { listing: {} }
      });
      expect(result).toBe(0);
    });

    it('should return 0 for empty string borough', () => {
      const result = calculateBoroughScore({
        candidateListing: { boroughName: '' },
        proposal: { listing: { boroughName: 'Manhattan' } }
      });
      expect(result).toBe(0);
    });

    it('should return 0 for whitespace-only borough', () => {
      const result = calculateBoroughScore({
        candidateListing: { boroughName: '   ' },
        proposal: { listing: { boroughName: 'Manhattan' } }
      });
      expect(result).toBe(0);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================
  describe('edge cases', () => {
    it('should return 0 for unknown borough names', () => {
      const result = calculateBoroughScore({
        candidateListing: { boroughName: 'New Jersey' },
        proposal: { listing: { boroughName: 'Manhattan' } }
      });
      expect(result).toBe(0);
    });

    it('should handle special characters in borough names', () => {
      // Unknown borough with special chars should return 0
      const result = calculateBoroughScore({
        candidateListing: { boroughName: 'Manhattan!' },
        proposal: { listing: { boroughName: 'Manhattan' } }
      });
      expect(result).toBe(0);
    });

    it('should throw error for numeric borough values', () => {
      // Note: The implementation calls .toLowerCase() on the borough,
      // which throws for non-string values
      expect(() => calculateBoroughScore({
        candidateListing: { boroughName: 123 },
        proposal: { listing: { boroughName: 'Manhattan' } }
      })).toThrow();
    });

    it('should handle both listings with extra properties', () => {
      const result = calculateBoroughScore({
        candidateListing: {
          boroughName: 'Manhattan',
          price: 100,
          amenities: ['wifi', 'parking']
        },
        proposal: {
          listing: {
            boroughName: 'Manhattan',
            description: 'Nice place'
          },
          guestId: '123'
        }
      });
      expect(result).toBe(25);
    });
  });

  // ============================================================================
  // Real-World Scenarios
  // ============================================================================
  describe('real-world scenarios', () => {
    it('should score commuter-friendly adjacent boroughs', () => {
      // Guest in Manhattan, listing in Brooklyn (adjacent, easy commute)
      const result = calculateBoroughScore({
        candidateListing: { boroughName: 'Brooklyn' },
        proposal: { listing: { boroughName: 'Manhattan' } }
      });
      expect(result).toBe(15);
    });

    it('should score zero for distant boroughs', () => {
      // Guest in Bronx, listing in Staten Island (very far)
      const result = calculateBoroughScore({
        candidateListing: { boroughName: 'Staten Island' },
        proposal: { listing: { boroughName: 'Bronx' } }
      });
      expect(result).toBe(0);
    });

    it('should handle Supabase column name format', () => {
      const result = calculateBoroughScore({
        candidateListing: { borough: 'Queens' },
        proposal: { listing: { borough: 'Queens' } }
      });
      expect(result).toBe(25);
    });
  });
});
