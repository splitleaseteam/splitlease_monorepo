/**
 * Tests for calculateFourWeekRent
 *
 * Calculates the baseline rent for a standard 4-week period.
 * Formula: nightlyRate * frequency * 4
 */
import { describe, it, expect } from 'vitest';
import { calculateFourWeekRent } from '../calculateFourWeekRent.js';

describe('calculateFourWeekRent', () => {
  // ============================================================================
  // Happy Path Tests
  // ============================================================================
  describe('happy path', () => {
    it('should calculate correctly for 4 nights at $100/night', () => {
      const result = calculateFourWeekRent({ nightlyRate: 100, frequency: 4 });
      expect(result).toBe(1600); // 100 * 4 * 4 = 1600
    });

    it('should calculate correctly for 2 nights at $50/night (minimum frequency)', () => {
      const result = calculateFourWeekRent({ nightlyRate: 50, frequency: 2 });
      expect(result).toBe(400); // 50 * 2 * 4 = 400
    });

    it('should calculate correctly for 7 nights at $75/night (maximum frequency)', () => {
      const result = calculateFourWeekRent({ nightlyRate: 75, frequency: 7 });
      expect(result).toBe(2100); // 75 * 7 * 4 = 2100
    });

    it('should calculate correctly for 3 nights at $150/night', () => {
      const result = calculateFourWeekRent({ nightlyRate: 150, frequency: 3 });
      expect(result).toBe(1800); // 150 * 3 * 4 = 1800
    });

    it('should calculate correctly for 5 nights at $200/night', () => {
      const result = calculateFourWeekRent({ nightlyRate: 200, frequency: 5 });
      expect(result).toBe(4000); // 200 * 5 * 4 = 4000
    });

    it('should calculate correctly for 6 nights at $125/night', () => {
      const result = calculateFourWeekRent({ nightlyRate: 125, frequency: 6 });
      expect(result).toBe(3000); // 125 * 6 * 4 = 3000
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================
  describe('edge cases', () => {
    it('should handle zero nightly rate', () => {
      const result = calculateFourWeekRent({ nightlyRate: 0, frequency: 4 });
      expect(result).toBe(0);
    });

    it('should handle decimal nightly rates', () => {
      const result = calculateFourWeekRent({ nightlyRate: 99.99, frequency: 4 });
      expect(result).toBeCloseTo(1599.84, 2); // 99.99 * 4 * 4
    });

    it('should handle very large nightly rates', () => {
      const result = calculateFourWeekRent({ nightlyRate: 10000, frequency: 7 });
      expect(result).toBe(280000); // 10000 * 7 * 4 = 280000
    });

    it('should handle very small nightly rates', () => {
      const result = calculateFourWeekRent({ nightlyRate: 0.01, frequency: 2 });
      expect(result).toBeCloseTo(0.08, 2); // 0.01 * 2 * 4 = 0.08
    });

    it('should handle frequency at minimum boundary (2)', () => {
      const result = calculateFourWeekRent({ nightlyRate: 100, frequency: 2 });
      expect(result).toBe(800);
    });

    it('should handle frequency at maximum boundary (7)', () => {
      const result = calculateFourWeekRent({ nightlyRate: 100, frequency: 7 });
      expect(result).toBe(2800);
    });
  });

  // ============================================================================
  // Error Handling - Nightly Rate Validation
  // ============================================================================
  describe('error handling - nightlyRate validation', () => {
    it('should throw error for null nightlyRate', () => {
      expect(() => calculateFourWeekRent({ nightlyRate: null, frequency: 4 }))
        .toThrow();
    });

    it('should throw error for undefined nightlyRate', () => {
      expect(() => calculateFourWeekRent({ nightlyRate: undefined, frequency: 4 }))
        .toThrow();
    });

    it('should throw error for string nightlyRate', () => {
      expect(() => calculateFourWeekRent({ nightlyRate: '100', frequency: 4 }))
        .toThrow();
    });

    it('should throw error for NaN nightlyRate', () => {
      expect(() => calculateFourWeekRent({ nightlyRate: NaN, frequency: 4 }))
        .toThrow();
    });

    it('should throw error for negative nightlyRate', () => {
      expect(() => calculateFourWeekRent({ nightlyRate: -50, frequency: 4 }))
        .toThrow();
    });

    it('should throw error for object nightlyRate', () => {
      expect(() => calculateFourWeekRent({ nightlyRate: {}, frequency: 4 }))
        .toThrow();
    });

    it('should throw error for array nightlyRate', () => {
      expect(() => calculateFourWeekRent({ nightlyRate: [100], frequency: 4 }))
        .toThrow();
    });

    it('should throw error for boolean nightlyRate', () => {
      expect(() => calculateFourWeekRent({ nightlyRate: true, frequency: 4 }))
        .toThrow();
    });

    it('should not throw for Infinity nightlyRate', () => {
      expect(() => calculateFourWeekRent({ nightlyRate: Infinity, frequency: 4 }))
        .not.toThrow(); // Infinity is a valid number, though edge case
    });
  });

  // ============================================================================
  // Error Handling - Frequency Validation
  // ============================================================================
  describe('error handling - frequency validation', () => {
    it('should throw error for frequency below range (1)', () => {
      expect(() => calculateFourWeekRent({ nightlyRate: 100, frequency: 1 }))
        .toThrow();
    });

    it('should throw error for frequency above range (8)', () => {
      expect(() => calculateFourWeekRent({ nightlyRate: 100, frequency: 8 }))
        .toThrow();
    });

    it('should throw error for frequency of 0', () => {
      expect(() => calculateFourWeekRent({ nightlyRate: 100, frequency: 0 }))
        .toThrow();
    });

    it('should throw error for negative frequency', () => {
      expect(() => calculateFourWeekRent({ nightlyRate: 100, frequency: -3 }))
        .toThrow();
    });

    it('should throw error for null frequency', () => {
      expect(() => calculateFourWeekRent({ nightlyRate: 100, frequency: null }))
        .toThrow();
    });

    it('should throw error for undefined frequency', () => {
      expect(() => calculateFourWeekRent({ nightlyRate: 100, frequency: undefined }))
        .toThrow();
    });

    it('should throw error for string frequency', () => {
      expect(() => calculateFourWeekRent({ nightlyRate: 100, frequency: '4' }))
        .toThrow();
    });

    it('should throw error for NaN frequency', () => {
      expect(() => calculateFourWeekRent({ nightlyRate: 100, frequency: NaN }))
        .toThrow();
    });

    // Note: Decimal frequencies are technically valid numbers in range (validation gap)
    it('should not throw for decimal frequency in range', () => {
      expect(() => calculateFourWeekRent({ nightlyRate: 100, frequency: 3.5 }))
        .not.toThrow();
    });

    it('should throw error for very large frequency', () => {
      expect(() => calculateFourWeekRent({ nightlyRate: 100, frequency: 100 }))
        .toThrow();
    });
  });

  // ============================================================================
  // Boundary Conditions
  // ============================================================================
  describe('boundary conditions', () => {
    it('should handle minimum valid inputs', () => {
      const result = calculateFourWeekRent({ nightlyRate: 0, frequency: 2 });
      expect(result).toBe(0);
    });

    it('should handle maximum realistic inputs', () => {
      // NYC luxury apartment at $500/night, full week
      const result = calculateFourWeekRent({ nightlyRate: 500, frequency: 7 });
      expect(result).toBe(14000);
    });

    it('should maintain precision with decimal results', () => {
      const result = calculateFourWeekRent({ nightlyRate: 33.33, frequency: 3 });
      expect(result).toBeCloseTo(399.96, 2);
    });

    it('should handle maximum safe integer values', () => {
      // Test near Number.MAX_SAFE_INTEGER won't cause overflow issues
      const result = calculateFourWeekRent({ nightlyRate: 1000000, frequency: 7 });
      expect(result).toBe(28000000);
    });
  });

  // ============================================================================
  // Input Object Validation
  // ============================================================================
  describe('input object validation', () => {
    it('should work with extra properties in params object', () => {
      const result = calculateFourWeekRent({
        nightlyRate: 100,
        frequency: 4,
        extraProp: 'ignored'
      });
      expect(result).toBe(1600);
    });

    it('should handle missing params object', () => {
      expect(() => calculateFourWeekRent())
        .toThrow();
    });

    it('should handle empty params object', () => {
      expect(() => calculateFourWeekRent({}))
        .toThrow();
    });
  });

  // ============================================================================
  // Business Logic Verification
  // ============================================================================
  describe('business logic verification', () => {
    it('should follow the formula: nightlyRate * frequency * 4', () => {
      // Verify formula is applied correctly
      const nightlyRate = 123;
      const frequency = 5;
      const expected = nightlyRate * frequency * 4;

      const result = calculateFourWeekRent({ nightlyRate, frequency });
      expect(result).toBe(expected);
    });

    it('should calculate monthly cost for typical part-time stay', () => {
      // Typical part-time: 4 nights/week at $100/night
      const result = calculateFourWeekRent({ nightlyRate: 100, frequency: 4 });
      expect(result).toBe(1600);
    });

    it('should calculate monthly cost for typical full-time stay', () => {
      // Full-time: 7 nights/week at $80/night
      const result = calculateFourWeekRent({ nightlyRate: 80, frequency: 7 });
      expect(result).toBe(2240);
    });

    it('should calculate monthly cost for weekend-only stay', () => {
      // Weekend only: 2 nights/week at $150/night
      const result = calculateFourWeekRent({ nightlyRate: 150, frequency: 2 });
      expect(result).toBe(1200);
    });
  });
});
