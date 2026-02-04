/**
 * Tests for isBoroughAdjacent
 *
 * Check if two NYC boroughs are adjacent.
 * Uses predefined NYC borough adjacency map.
 * Case-insensitive comparison.
 */
import { describe, it, expect } from 'vitest';
import { isBoroughAdjacent } from '../isBoroughAdjacent.js';

describe('isBoroughAdjacent', () => {
  // ============================================================================
  // Manhattan Adjacencies
  // ============================================================================
  describe('Manhattan adjacencies', () => {
    it('should return true for Manhattan and Brooklyn', () => {
      expect(isBoroughAdjacent({ borough1: 'Manhattan', borough2: 'Brooklyn' })).toBe(true);
    });

    it('should return true for Manhattan and Queens', () => {
      expect(isBoroughAdjacent({ borough1: 'Manhattan', borough2: 'Queens' })).toBe(true);
    });

    it('should return true for Manhattan and Bronx', () => {
      expect(isBoroughAdjacent({ borough1: 'Manhattan', borough2: 'Bronx' })).toBe(true);
    });

    it('should return false for Manhattan and Staten Island', () => {
      expect(isBoroughAdjacent({ borough1: 'Manhattan', borough2: 'Staten Island' })).toBe(false);
    });
  });

  // ============================================================================
  // Brooklyn Adjacencies
  // ============================================================================
  describe('Brooklyn adjacencies', () => {
    it('should return true for Brooklyn and Manhattan', () => {
      expect(isBoroughAdjacent({ borough1: 'Brooklyn', borough2: 'Manhattan' })).toBe(true);
    });

    it('should return true for Brooklyn and Queens', () => {
      expect(isBoroughAdjacent({ borough1: 'Brooklyn', borough2: 'Queens' })).toBe(true);
    });

    it('should return true for Brooklyn and Staten Island', () => {
      expect(isBoroughAdjacent({ borough1: 'Brooklyn', borough2: 'Staten Island' })).toBe(true);
    });

    it('should return false for Brooklyn and Bronx', () => {
      expect(isBoroughAdjacent({ borough1: 'Brooklyn', borough2: 'Bronx' })).toBe(false);
    });
  });

  // ============================================================================
  // Queens Adjacencies
  // ============================================================================
  describe('Queens adjacencies', () => {
    it('should return true for Queens and Manhattan', () => {
      expect(isBoroughAdjacent({ borough1: 'Queens', borough2: 'Manhattan' })).toBe(true);
    });

    it('should return true for Queens and Brooklyn', () => {
      expect(isBoroughAdjacent({ borough1: 'Queens', borough2: 'Brooklyn' })).toBe(true);
    });

    it('should return true for Queens and Bronx', () => {
      expect(isBoroughAdjacent({ borough1: 'Queens', borough2: 'Bronx' })).toBe(true);
    });

    it('should return false for Queens and Staten Island', () => {
      expect(isBoroughAdjacent({ borough1: 'Queens', borough2: 'Staten Island' })).toBe(false);
    });
  });

  // ============================================================================
  // Bronx Adjacencies
  // ============================================================================
  describe('Bronx adjacencies', () => {
    it('should return true for Bronx and Manhattan', () => {
      expect(isBoroughAdjacent({ borough1: 'Bronx', borough2: 'Manhattan' })).toBe(true);
    });

    it('should return true for Bronx and Queens', () => {
      expect(isBoroughAdjacent({ borough1: 'Bronx', borough2: 'Queens' })).toBe(true);
    });

    it('should return false for Bronx and Brooklyn', () => {
      expect(isBoroughAdjacent({ borough1: 'Bronx', borough2: 'Brooklyn' })).toBe(false);
    });

    it('should return false for Bronx and Staten Island', () => {
      expect(isBoroughAdjacent({ borough1: 'Bronx', borough2: 'Staten Island' })).toBe(false);
    });
  });

  // ============================================================================
  // Staten Island Adjacencies
  // ============================================================================
  describe('Staten Island adjacencies', () => {
    it('should return true for Staten Island and Brooklyn', () => {
      expect(isBoroughAdjacent({ borough1: 'Staten Island', borough2: 'Brooklyn' })).toBe(true);
    });

    it('should return false for Staten Island and Manhattan', () => {
      expect(isBoroughAdjacent({ borough1: 'Staten Island', borough2: 'Manhattan' })).toBe(false);
    });

    it('should return false for Staten Island and Queens', () => {
      expect(isBoroughAdjacent({ borough1: 'Staten Island', borough2: 'Queens' })).toBe(false);
    });

    it('should return false for Staten Island and Bronx', () => {
      expect(isBoroughAdjacent({ borough1: 'Staten Island', borough2: 'Bronx' })).toBe(false);
    });
  });

  // ============================================================================
  // Case Insensitivity
  // ============================================================================
  describe('case insensitivity', () => {
    it('should handle lowercase borough names', () => {
      expect(isBoroughAdjacent({ borough1: 'manhattan', borough2: 'brooklyn' })).toBe(true);
    });

    it('should handle uppercase borough names', () => {
      expect(isBoroughAdjacent({ borough1: 'MANHATTAN', borough2: 'BROOKLYN' })).toBe(true);
    });

    it('should handle mixed case borough names', () => {
      expect(isBoroughAdjacent({ borough1: 'MaNhAtTaN', borough2: 'bRoOkLyN' })).toBe(true);
    });

    it('should handle lowercase "staten island"', () => {
      expect(isBoroughAdjacent({ borough1: 'brooklyn', borough2: 'staten island' })).toBe(true);
    });

    it('should handle uppercase "STATEN ISLAND"', () => {
      expect(isBoroughAdjacent({ borough1: 'brooklyn', borough2: 'STATEN ISLAND' })).toBe(true);
    });
  });

  // ============================================================================
  // Whitespace Handling
  // ============================================================================
  describe('whitespace handling', () => {
    it('should trim leading whitespace', () => {
      expect(isBoroughAdjacent({ borough1: '  Manhattan', borough2: 'Brooklyn' })).toBe(true);
    });

    it('should trim trailing whitespace', () => {
      expect(isBoroughAdjacent({ borough1: 'Manhattan  ', borough2: 'Brooklyn' })).toBe(true);
    });

    it('should trim whitespace from both boroughs', () => {
      expect(isBoroughAdjacent({ borough1: '  Manhattan  ', borough2: '  Brooklyn  ' })).toBe(true);
    });
  });

  // ============================================================================
  // Invalid Inputs
  // ============================================================================
  describe('invalid inputs', () => {
    it('should return false for null borough1', () => {
      expect(isBoroughAdjacent({ borough1: null, borough2: 'Brooklyn' })).toBe(false);
    });

    it('should return false for undefined borough1', () => {
      expect(isBoroughAdjacent({ borough1: undefined, borough2: 'Brooklyn' })).toBe(false);
    });

    it('should return false for empty string borough1', () => {
      expect(isBoroughAdjacent({ borough1: '', borough2: 'Brooklyn' })).toBe(false);
    });

    it('should return false for null borough2', () => {
      expect(isBoroughAdjacent({ borough1: 'Manhattan', borough2: null })).toBe(false);
    });

    it('should return false for undefined borough2', () => {
      expect(isBoroughAdjacent({ borough1: 'Manhattan', borough2: undefined })).toBe(false);
    });

    it('should return false for empty string borough2', () => {
      expect(isBoroughAdjacent({ borough1: 'Manhattan', borough2: '' })).toBe(false);
    });

    it('should return false for non-string borough1', () => {
      expect(isBoroughAdjacent({ borough1: 123, borough2: 'Brooklyn' })).toBe(false);
    });

    it('should return false for non-string borough2', () => {
      expect(isBoroughAdjacent({ borough1: 'Manhattan', borough2: 123 })).toBe(false);
    });

    it('should return false for array borough1', () => {
      expect(isBoroughAdjacent({ borough1: ['Manhattan'], borough2: 'Brooklyn' })).toBe(false);
    });

    it('should return false for object borough1', () => {
      expect(isBoroughAdjacent({ borough1: { name: 'Manhattan' }, borough2: 'Brooklyn' })).toBe(false);
    });
  });

  // ============================================================================
  // Unknown Boroughs
  // ============================================================================
  describe('unknown boroughs', () => {
    it('should return false for unknown borough1', () => {
      expect(isBoroughAdjacent({ borough1: 'Hoboken', borough2: 'Manhattan' })).toBe(false);
    });

    it('should return false for unknown borough2', () => {
      expect(isBoroughAdjacent({ borough1: 'Manhattan', borough2: 'Jersey City' })).toBe(false);
    });

    it('should return false for misspelled borough', () => {
      expect(isBoroughAdjacent({ borough1: 'Manhatan', borough2: 'Brooklyn' })).toBe(false);
    });

    it('should return false for partial borough name', () => {
      expect(isBoroughAdjacent({ borough1: 'Man', borough2: 'Brooklyn' })).toBe(false);
    });
  });

  // ============================================================================
  // Same Borough (Not Adjacent to Itself)
  // ============================================================================
  describe('same borough', () => {
    it('should return false for Manhattan and Manhattan', () => {
      expect(isBoroughAdjacent({ borough1: 'Manhattan', borough2: 'Manhattan' })).toBe(false);
    });

    it('should return false for Brooklyn and Brooklyn', () => {
      expect(isBoroughAdjacent({ borough1: 'Brooklyn', borough2: 'Brooklyn' })).toBe(false);
    });

    it('should return false for Queens and Queens', () => {
      expect(isBoroughAdjacent({ borough1: 'Queens', borough2: 'Queens' })).toBe(false);
    });
  });

  // ============================================================================
  // Bidirectional Verification
  // ============================================================================
  describe('bidirectional verification', () => {
    it('should be symmetric: Manhattan-Brooklyn same as Brooklyn-Manhattan', () => {
      const result1 = isBoroughAdjacent({ borough1: 'Manhattan', borough2: 'Brooklyn' });
      const result2 = isBoroughAdjacent({ borough1: 'Brooklyn', borough2: 'Manhattan' });
      expect(result1).toBe(result2);
    });

    it('should be symmetric: Queens-Bronx same as Bronx-Queens', () => {
      const result1 = isBoroughAdjacent({ borough1: 'Queens', borough2: 'Bronx' });
      const result2 = isBoroughAdjacent({ borough1: 'Bronx', borough2: 'Queens' });
      expect(result1).toBe(result2);
    });

    it('should be symmetric: Brooklyn-Staten Island same as Staten Island-Brooklyn', () => {
      const result1 = isBoroughAdjacent({ borough1: 'Brooklyn', borough2: 'Staten Island' });
      const result2 = isBoroughAdjacent({ borough1: 'Staten Island', borough2: 'Brooklyn' });
      expect(result1).toBe(result2);
    });
  });

  // ============================================================================
  // Real-World Scenarios
  // ============================================================================
  describe('real-world scenarios', () => {
    it('should confirm Manhattan and Brooklyn are easy commute', () => {
      expect(isBoroughAdjacent({ borough1: 'Manhattan', borough2: 'Brooklyn' })).toBe(true);
    });

    it('should confirm Staten Island is isolated from most boroughs', () => {
      const adjacentToSI = ['Manhattan', 'Queens', 'Bronx'].filter(
        b => isBoroughAdjacent({ borough1: 'Staten Island', borough2: b })
      );
      expect(adjacentToSI).toHaveLength(0);
    });

    it('should confirm Brooklyn is most connected (3 adjacent)', () => {
      const boroughs = ['Manhattan', 'Queens', 'Staten Island', 'Bronx'];
      const adjacentToBrooklyn = boroughs.filter(
        b => isBoroughAdjacent({ borough1: 'Brooklyn', borough2: b })
      );
      expect(adjacentToBrooklyn).toHaveLength(3);
    });
  });
});
