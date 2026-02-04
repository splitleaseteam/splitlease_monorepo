/**
 * Tests for isValidDayCountForPricing
 *
 * Validate if enough days are selected for price calculation.
 * Minimum 2 days (2 nights), Maximum 7 days (full week).
 */
import { describe, it, expect } from 'vitest';
import { isValidDayCountForPricing } from '../isValidDayCountForPricing.js';

describe('isValidDayCountForPricing', () => {
  // ============================================================================
  // Valid Day Counts (2-7) - Returns True
  // ============================================================================
  describe('valid day counts (2-7) - returns true', () => {
    it('should return true for 2 days (minimum)', () => {
      const result = isValidDayCountForPricing({ daysSelected: 2 });
      expect(result).toBe(true);
    });

    it('should return true for 3 days', () => {
      const result = isValidDayCountForPricing({ daysSelected: 3 });
      expect(result).toBe(true);
    });

    it('should return true for 4 days', () => {
      const result = isValidDayCountForPricing({ daysSelected: 4 });
      expect(result).toBe(true);
    });

    it('should return true for 5 days', () => {
      const result = isValidDayCountForPricing({ daysSelected: 5 });
      expect(result).toBe(true);
    });

    it('should return true for 6 days', () => {
      const result = isValidDayCountForPricing({ daysSelected: 6 });
      expect(result).toBe(true);
    });

    it('should return true for 7 days (maximum - full week)', () => {
      const result = isValidDayCountForPricing({ daysSelected: 7 });
      expect(result).toBe(true);
    });
  });

  // ============================================================================
  // Invalid Day Counts (Too Few) - Returns False
  // ============================================================================
  describe('invalid day counts (too few) - returns false', () => {
    it('should return false for 1 day', () => {
      const result = isValidDayCountForPricing({ daysSelected: 1 });
      expect(result).toBe(false);
    });

    it('should return false for 0 days', () => {
      const result = isValidDayCountForPricing({ daysSelected: 0 });
      expect(result).toBe(false);
    });

    it('should return false for negative days', () => {
      const result = isValidDayCountForPricing({ daysSelected: -1 });
      expect(result).toBe(false);
    });

    it('should return false for large negative number', () => {
      const result = isValidDayCountForPricing({ daysSelected: -100 });
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // Invalid Day Counts (Too Many) - Returns False
  // ============================================================================
  describe('invalid day counts (too many) - returns false', () => {
    it('should return false for 8 days', () => {
      const result = isValidDayCountForPricing({ daysSelected: 8 });
      expect(result).toBe(false);
    });

    it('should return false for 10 days', () => {
      const result = isValidDayCountForPricing({ daysSelected: 10 });
      expect(result).toBe(false);
    });

    it('should return false for large number', () => {
      const result = isValidDayCountForPricing({ daysSelected: 100 });
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // Decimal Values
  // ============================================================================
  describe('decimal values', () => {
    it('should return true for 2.0 (valid)', () => {
      const result = isValidDayCountForPricing({ daysSelected: 2.0 });
      expect(result).toBe(true);
    });

    it('should return true for 2.5 (between 2 and 7)', () => {
      const result = isValidDayCountForPricing({ daysSelected: 2.5 });
      expect(result).toBe(true);
    });

    it('should return true for 6.9 (between 2 and 7)', () => {
      const result = isValidDayCountForPricing({ daysSelected: 6.9 });
      expect(result).toBe(true);
    });

    it('should return false for 1.9 (below minimum)', () => {
      const result = isValidDayCountForPricing({ daysSelected: 1.9 });
      expect(result).toBe(false);
    });

    it('should return false for 7.1 (above maximum)', () => {
      const result = isValidDayCountForPricing({ daysSelected: 7.1 });
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // Error Handling - Invalid Input Types
  // ============================================================================
  describe('error handling - invalid input types', () => {
    it('should throw error for null daysSelected', () => {
      expect(() => isValidDayCountForPricing({ daysSelected: null }))
        .toThrow('daysSelected must be a number');
    });

    it('should throw error for undefined daysSelected', () => {
      expect(() => isValidDayCountForPricing({ daysSelected: undefined }))
        .toThrow('daysSelected must be a number');
    });

    it('should throw error for string daysSelected', () => {
      expect(() => isValidDayCountForPricing({ daysSelected: '4' }))
        .toThrow('daysSelected must be a number');
    });

    it('should throw error for NaN', () => {
      expect(() => isValidDayCountForPricing({ daysSelected: NaN }))
        .toThrow('daysSelected must be a number');
    });

    it('should throw error for object daysSelected', () => {
      expect(() => isValidDayCountForPricing({ daysSelected: {} }))
        .toThrow('daysSelected must be a number');
    });

    it('should throw error for array daysSelected', () => {
      expect(() => isValidDayCountForPricing({ daysSelected: [4] }))
        .toThrow('daysSelected must be a number');
    });

    it('should throw error for boolean daysSelected', () => {
      expect(() => isValidDayCountForPricing({ daysSelected: true }))
        .toThrow('daysSelected must be a number');
    });

    it('should throw error for missing params object', () => {
      expect(() => isValidDayCountForPricing()).toThrow();
    });

    it('should throw error for empty params object', () => {
      expect(() => isValidDayCountForPricing({}))
        .toThrow('daysSelected must be a number');
    });
  });

  // ============================================================================
  // Special Numbers
  // ============================================================================
  describe('special numbers', () => {
    it('should return false for Infinity', () => {
      const result = isValidDayCountForPricing({ daysSelected: Infinity });
      expect(result).toBe(false);
    });

    it('should return false for -Infinity', () => {
      const result = isValidDayCountForPricing({ daysSelected: -Infinity });
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // Real-World Scenarios
  // ============================================================================
  describe('real-world scenarios', () => {
    it('should validate typical Mon-Thu split (4 days)', () => {
      const result = isValidDayCountForPricing({ daysSelected: 4 });
      expect(result).toBe(true);
    });

    it('should validate weekend stay (Fri-Sun = 3 days)', () => {
      const result = isValidDayCountForPricing({ daysSelected: 3 });
      expect(result).toBe(true);
    });

    it('should validate full-time stay (7 days)', () => {
      const result = isValidDayCountForPricing({ daysSelected: 7 });
      expect(result).toBe(true);
    });

    it('should reject single-day booking attempt', () => {
      const result = isValidDayCountForPricing({ daysSelected: 1 });
      expect(result).toBe(false);
    });

    it('should validate minimum split (2 days)', () => {
      const result = isValidDayCountForPricing({ daysSelected: 2 });
      expect(result).toBe(true);
    });
  });
});
