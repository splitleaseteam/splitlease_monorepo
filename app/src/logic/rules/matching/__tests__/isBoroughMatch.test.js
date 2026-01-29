/**
 * Tests for isBoroughMatch
 *
 * Check if listing borough matches or is adjacent to proposal borough.
 * Exact matches return true, adjacent boroughs return true (partial scoring).
 */
import { describe, it, expect } from 'vitest';
import { isBoroughMatch } from '../isBoroughMatch.js';

describe('isBoroughMatch', () => {
  // ============================================================================
  // Returns True - Exact Match
  // ============================================================================
  describe('returns true for exact borough match', () => {
    it('should return true when boroughs are identical', () => {
      const result = isBoroughMatch({
        candidateBorough: 'Manhattan',
        proposalBorough: 'Manhattan'
      });
      expect(result).toBe(true);
    });

    it('should return true for Brooklyn exact match', () => {
      const result = isBoroughMatch({
        candidateBorough: 'Brooklyn',
        proposalBorough: 'Brooklyn'
      });
      expect(result).toBe(true);
    });

    it('should return true for Queens exact match', () => {
      const result = isBoroughMatch({
        candidateBorough: 'Queens',
        proposalBorough: 'Queens'
      });
      expect(result).toBe(true);
    });

    it('should return true for Bronx exact match', () => {
      const result = isBoroughMatch({
        candidateBorough: 'Bronx',
        proposalBorough: 'Bronx'
      });
      expect(result).toBe(true);
    });

    it('should return true for Staten Island exact match', () => {
      const result = isBoroughMatch({
        candidateBorough: 'Staten Island',
        proposalBorough: 'Staten Island'
      });
      expect(result).toBe(true);
    });
  });

  // ============================================================================
  // Returns True - Case Insensitive Match
  // ============================================================================
  describe('case insensitive matching', () => {
    it('should match regardless of case - lowercase', () => {
      const result = isBoroughMatch({
        candidateBorough: 'manhattan',
        proposalBorough: 'MANHATTAN'
      });
      expect(result).toBe(true);
    });

    it('should match regardless of case - mixed case', () => {
      const result = isBoroughMatch({
        candidateBorough: 'Brooklyn',
        proposalBorough: 'brooklyn'
      });
      expect(result).toBe(true);
    });

    it('should handle mixed case with whitespace', () => {
      const result = isBoroughMatch({
        candidateBorough: '  Manhattan  ',
        proposalBorough: 'manhattan'
      });
      expect(result).toBe(true);
    });
  });

  // ============================================================================
  // Returns True - Adjacent Borough Match
  // ============================================================================
  describe('returns true for adjacent borough match', () => {
    it('should return true for Manhattan-Brooklyn (adjacent)', () => {
      const result = isBoroughMatch({
        candidateBorough: 'Brooklyn',
        proposalBorough: 'Manhattan'
      });
      expect(result).toBe(true);
    });

    it('should return true for Manhattan-Queens (adjacent)', () => {
      const result = isBoroughMatch({
        candidateBorough: 'Queens',
        proposalBorough: 'Manhattan'
      });
      expect(result).toBe(true);
    });

    it('should return true for Brooklyn-Queens (adjacent)', () => {
      const result = isBoroughMatch({
        candidateBorough: 'Queens',
        proposalBorough: 'Brooklyn'
      });
      expect(result).toBe(true);
    });

    it('should return true for Bronx-Manhattan (adjacent)', () => {
      const result = isBoroughMatch({
        candidateBorough: 'Bronx',
        proposalBorough: 'Manhattan'
      });
      expect(result).toBe(true);
    });
  });

  // ============================================================================
  // Returns False - Non-Adjacent Boroughs
  // ============================================================================
  describe('returns false for non-adjacent boroughs', () => {
    it('should return false for Staten Island-Manhattan (not adjacent)', () => {
      const result = isBoroughMatch({
        candidateBorough: 'Staten Island',
        proposalBorough: 'Manhattan'
      });
      expect(result).toBe(false);
    });

    it('should return false for Staten Island-Queens (not adjacent)', () => {
      const result = isBoroughMatch({
        candidateBorough: 'Staten Island',
        proposalBorough: 'Queens'
      });
      expect(result).toBe(false);
    });

    it('should return false for Staten Island-Bronx (not adjacent)', () => {
      const result = isBoroughMatch({
        candidateBorough: 'Staten Island',
        proposalBorough: 'Bronx'
      });
      expect(result).toBe(false);
    });

    it('should return false for Bronx-Brooklyn (not adjacent)', () => {
      const result = isBoroughMatch({
        candidateBorough: 'Bronx',
        proposalBorough: 'Brooklyn'
      });
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // Returns False - Invalid/Missing Inputs
  // ============================================================================
  describe('returns false for invalid/missing inputs', () => {
    it('should return false when candidateBorough is null', () => {
      const result = isBoroughMatch({
        candidateBorough: null,
        proposalBorough: 'Manhattan'
      });
      expect(result).toBe(false);
    });

    it('should return false when proposalBorough is null', () => {
      const result = isBoroughMatch({
        candidateBorough: 'Manhattan',
        proposalBorough: null
      });
      expect(result).toBe(false);
    });

    it('should return false when candidateBorough is undefined', () => {
      const result = isBoroughMatch({
        candidateBorough: undefined,
        proposalBorough: 'Manhattan'
      });
      expect(result).toBe(false);
    });

    it('should return false when proposalBorough is undefined', () => {
      const result = isBoroughMatch({
        candidateBorough: 'Manhattan',
        proposalBorough: undefined
      });
      expect(result).toBe(false);
    });

    it('should return false when candidateBorough is empty string', () => {
      const result = isBoroughMatch({
        candidateBorough: '',
        proposalBorough: 'Manhattan'
      });
      expect(result).toBe(false);
    });

    it('should return false when proposalBorough is empty string', () => {
      const result = isBoroughMatch({
        candidateBorough: 'Manhattan',
        proposalBorough: ''
      });
      expect(result).toBe(false);
    });

    it('should return false when candidateBorough is not a string', () => {
      const result = isBoroughMatch({
        candidateBorough: 123,
        proposalBorough: 'Manhattan'
      });
      expect(result).toBe(false);
    });

    it('should return false when proposalBorough is not a string', () => {
      const result = isBoroughMatch({
        candidateBorough: 'Manhattan',
        proposalBorough: 123
      });
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================
  describe('edge cases', () => {
    it('should handle unknown borough names', () => {
      const result = isBoroughMatch({
        candidateBorough: 'Unknown Borough',
        proposalBorough: 'Manhattan'
      });
      expect(result).toBe(false);
    });

    it('should handle whitespace-only strings as invalid', () => {
      const result = isBoroughMatch({
        candidateBorough: '   ',
        proposalBorough: 'Manhattan'
      });
      expect(result).toBe(false);
    });

    it('should handle boroughs with extra whitespace', () => {
      const result = isBoroughMatch({
        candidateBorough: '  Staten Island  ',
        proposalBorough: '  Staten Island  '
      });
      expect(result).toBe(true);
    });
  });

  // ============================================================================
  // Real-World Scenarios
  // ============================================================================
  describe('real-world scenarios', () => {
    it('should match listing search in same borough', () => {
      const listing = { borough: 'Manhattan' };
      const searchCriteria = { borough: 'Manhattan' };

      const result = isBoroughMatch({
        candidateBorough: listing.borough,
        proposalBorough: searchCriteria.borough
      });

      expect(result).toBe(true);
    });

    it('should match listing in adjacent borough for broader search', () => {
      const listing = { borough: 'Brooklyn' };
      const searchCriteria = { borough: 'Manhattan' };

      const result = isBoroughMatch({
        candidateBorough: listing.borough,
        proposalBorough: searchCriteria.borough
      });

      expect(result).toBe(true);
    });

    it('should not match listing in far borough', () => {
      const listing = { borough: 'Staten Island' };
      const searchCriteria = { borough: 'Bronx' };

      const result = isBoroughMatch({
        candidateBorough: listing.borough,
        proposalBorough: searchCriteria.borough
      });

      expect(result).toBe(false);
    });
  });
});
