/**
 * Integration tests for calculateSlope
 *
 * Tests the calculation of price decay slope from nightly prices array.
 */

import { describe, it, expect } from 'vitest';
import { calculateSlope } from '../calculateSlope.js';

describe('calculateSlope', () => {
  describe('Slope Calculation', () => {
    it('should calculate positive slope for decreasing prices', () => {
      const result = calculateSlope({
        nightlyPrices: [null, 120, 115, 110, 105, 100, 85]
      });
      // Slope = (firstPrice - lastPrice) / (lastIndex - firstIndex)
      // = (120 - 85) / (6 - 1) = 35 / 5 = 7
      expect(result).toBeCloseTo(7, 4);
    });

    it('should calculate zero slope for flat prices', () => {
      const result = calculateSlope({
        nightlyPrices: [100, 100, 100, 100, 100, 100, 100]
      });
      expect(result).toBe(0);
    });

    it('should calculate negative slope for increasing prices', () => {
      const result = calculateSlope({
        nightlyPrices: [null, 80, 85, 90, 95, 100, 115]
      });
      // Slope = (80 - 115) / (6 - 1) = -35 / 5 = -7
      expect(result).toBeCloseTo(-7, 4);
    });
  });

  describe('Null Handling', () => {
    it('should return null when all prices are null', () => {
      const result = calculateSlope({
        nightlyPrices: [null, null, null, null, null, null, null]
      });
      expect(result).toBeNull();
    });

    it('should skip null values when finding first and last valid prices', () => {
      const result = calculateSlope({
        nightlyPrices: [null, 120, null, 110, null, 100, 85]
      });
      // First valid: 120 at index 1, Last valid: 85 at index 6
      // Slope = (120 - 85) / (6 - 1) = 35 / 5 = 7
      expect(result).toBeCloseTo(7, 4);
    });

    it('should handle null at beginning', () => {
      const result = calculateSlope({
        nightlyPrices: [null, 100, 95, 90, 85, 80, 75]
      });
      // First valid: 100 at index 1, Last valid: 75 at index 6
      expect(result).toBeCloseTo(5, 4);
    });

    it('should handle null at end', () => {
      const result = calculateSlope({
        nightlyPrices: [120, 115, 110, 105, 100, 95, null]
      });
      // First valid: 120 at index 0, Last valid: 95 at index 5
      expect(result).toBeCloseTo(5, 4);
    });
  });

  describe('Single Value Edge Case', () => {
    it('should return 0 when only one valid price exists', () => {
      const result = calculateSlope({
        nightlyPrices: [null, null, null, null, null, null, 100]
      });
      expect(result).toBe(0);
    });

    it('should return 0 for single valid price with surrounding nulls', () => {
      const result = calculateSlope({
        nightlyPrices: [null, null, 100, null, null, null, null]
      });
      expect(result).toBe(0);
    });
  });

  describe('Rounding Precision', () => {
    it('should round to 4 decimal places', () => {
      const result = calculateSlope({
        nightlyPrices: [null, 100.1234, 95.5678, 90.9012, 85.3456, 80.789, 76.1234]
      });
      expect(result).toBeDefined();
      // Verify it's rounded to 4 decimal places
      const rounded = Math.round(result * 10000) / 10000;
      expect(result).toBe(rounded);
    });

    it('should handle small slope values', () => {
      const result = calculateSlope({
        nightlyPrices: [null, 100, 99.9, 99.8, 99.7, 99.6, 99.5]
      });
      expect(result).toBeCloseTo(0.1, 4);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty array', () => {
      const result = calculateSlope({
        nightlyPrices: []
      });
      expect(result).toBeNull();
    });

    it('should handle array with only two valid prices at extremes', () => {
      const result = calculateSlope({
        nightlyPrices: [120, null, null, null, null, null, 85]
      });
      // Slope = (120 - 85) / (6 - 0) = 35 / 6 ≈ 5.8333
      expect(result).toBeCloseTo(5.8333, 4);
    });

    it('should handle very small price differences', () => {
      const result = calculateSlope({
        nightlyPrices: [null, 100, 99.99, 99.98, 99.97, 99.96, 99.95]
      });
      expect(result).toBeCloseTo(0.01, 4);
    });

    it('should handle very large price differences', () => {
      const result = calculateSlope({
        nightlyPrices: [null, 10000, 9000, 8000, 7000, 6000, 5000]
      });
      // Slope = (10000 - 5000) / (6 - 1) = 5000 / 5 = 1000
      expect(result).toBe(1000);
    });

    it('should handle zero prices', () => {
      const result = calculateSlope({
        nightlyPrices: [null, 100, 80, 60, 40, 20, 0]
      });
      // Slope = (100 - 0) / (6 - 1) = 100 / 5 = 20
      expect(result).toBe(20);
    });
  });

  describe('Invalid Value Handling', () => {
    it('should ignore NaN values', () => {
      const result = calculateSlope({
        nightlyPrices: [null, 120, NaN, 110, NaN, 100, 85]
      });
      // First valid: 120 at index 1, Last valid: 85 at index 6
      expect(result).toBeCloseTo(7, 4);
    });

    it('should ignore undefined values', () => {
      const result = calculateSlope({
        nightlyPrices: [undefined, 120, undefined, 110, undefined, 100, 85]
      });
      // First valid: 120 at index 1, Last valid: 85 at index 6
      expect(result).toBeCloseTo(7, 4);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for non-array input', () => {
      expect(() => {
        calculateSlope({ nightlyPrices: 'not an array' });
      }).toThrow('nightlyPrices must be an array');
    });

    it('should throw error for null input', () => {
      expect(() => {
        calculateSlope({ nightlyPrices: null });
      }).toThrow('nightlyPrices must be an array');
    });

    it('should throw error for undefined input', () => {
      expect(() => {
        calculateSlope({});
      }).toThrow('nightlyPrices must be an array');
    });

    it('should throw error for object input', () => {
      expect(() => {
        calculateSlope({ nightlyPrices: { price: 100 } });
      }).toThrow('nightlyPrices must be an array');
    });
  });

  describe('Real-World Scenarios', () => {
    it('should calculate slope for typical decreasing price structure', () => {
      const result = calculateSlope({
        nightlyPrices: [null, 150, 140, 130, 120, 110, 100]
      });
      // Slope = (150 - 100) / (6 - 1) = 50 / 5 = 10
      expect(result).toBe(10);
    });

    it('should calculate slope for premium pricing (increasing)', () => {
      const result = calculateSlope({
        nightlyPrices: [null, 100, 110, 120, 130, 140, 150]
      });
      // Slope = (100 - 150) / (6 - 1) = -50 / 5 = -10
      expect(result).toBe(-10);
    });

    it('should calculate slope for mixed pricing pattern', () => {
      const result = calculateSlope({
        nightlyPrices: [null, 120, 110, 130, 100, 140, 90]
      });
      // First: 120 at index 1, Last: 90 at index 6
      // Slope = (120 - 90) / (6 - 1) = 30 / 5 = 6
      expect(result).toBe(6);
    });

    it('should handle actual pricing array output from calculateNightlyPricesArray', () => {
      const nightlyPrices = [null, 113, 108.3, 103.5, 98.6, 93.6, 76.5];
      const result = calculateSlope({ nightlyPrices });
      // First: 113 at index 1, Last: 76.5 at index 6
      // Slope = (113 - 76.5) / (6 - 1) = 36.5 / 5 = 7.3
      expect(result).toBeCloseTo(7.3, 4);
    });
  });
});
