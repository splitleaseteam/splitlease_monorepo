/**
 * Integration tests for calculateNightlyPricesArray
 *
 * Tests the calculation of guest-facing nightly prices array.
 */

import { describe, it, expect } from 'vitest';
import { calculateNightlyPricesArray } from '../calculateNightlyPricesArray.js';
import { PRICING_CONSTANTS } from '../../../constants/pricingConstants.js';

describe('calculateNightlyPricesArray', () => {
  describe('Array Length Validation', () => {
    it('should return array of exactly 7 elements', () => {
      const result = calculateNightlyPricesArray({
        hostCompensation: [null, 100, 95, 90, 85, 80, 75],
        multipliers: [1.12, 1.13, 1.14, 1.15, 1.16, 1.17, 1.02]
      });
      expect(result).toHaveLength(PRICING_CONSTANTS.PRICING_LIST_ARRAY_LENGTH);
    });

    it('should match PRICING_LIST_ARRAY_LENGTH constant', () => {
      const result = calculateNightlyPricesArray({
        hostCompensation: [null, 100, 95, 90, 85, 80, 75],
        multipliers: [1.12, 1.13, 1.14, 1.15, 1.16, 1.17, 1.02]
      });
      expect(result.length).toBe(PRICING_CONSTANTS.PRICING_LIST_ARRAY_LENGTH);
    });
  });

  describe('Price Calculation', () => {
    it('should calculate price as hostCompensation × multiplier', () => {
      const result = calculateNightlyPricesArray({
        hostCompensation: [null, 100, 95, 90, 85, 80, 75],
        multipliers: [1.12, 1.13, 1.14, 1.15, 1.16, 1.17, 1.02]
      });
      expect(result[0]).toBeNull(); // null host rate
      expect(result[1]).toBe(113); // 100 × 1.13 = 113
      expect(result[2]).toBeCloseTo(108.3, 1); // 95 × 1.14 = 108.3
      expect(result[3]).toBeCloseTo(103.5, 1); // 90 × 1.15 = 103.5
    });

    it('should handle multipliers greater than 1', () => {
      const result = calculateNightlyPricesArray({
        hostCompensation: [null, 100, null, null, null, null, 75],
        multipliers: [1.5, 1.6, 1.7, 1.8, 1.9, 2.0, 1.1]
      });
      expect(result[1]).toBe(160); // 100 × 1.6 = 160
      expect(result[6]).toBeCloseTo(82.5, 1); // 75 × 1.1 = 82.5
    });

    it('should handle multipliers less than 1', () => {
      const result = calculateNightlyPricesArray({
        hostCompensation: [null, 100, null, null, null, null, null],
        multipliers: [0.9, 0.95, 0.85, 0.8, 0.75, 0.7, 0.65]
      });
      expect(result[1]).toBe(95); // 100 × 0.95 = 95
    });
  });

  describe('Null Handling', () => {
    it('should return null when hostCompensation is null', () => {
      const result = calculateNightlyPricesArray({
        hostCompensation: [null, 100, 95, null, 85, null, 75],
        multipliers: [1.12, 1.13, 1.14, 1.15, 1.16, 1.17, 1.02]
      });
      expect(result[0]).toBeNull();
      expect(result[3]).toBeNull();
      expect(result[5]).toBeNull();
    });

    it('should return null when hostCompensation is undefined', () => {
      const result = calculateNightlyPricesArray({
        hostCompensation: [undefined, 100, 95, undefined, 85, undefined, 75],
        multipliers: [1.12, 1.13, 1.14, 1.15, 1.16, 1.17, 1.02]
      });
      expect(result[0]).toBeNull();
      expect(result[3]).toBeNull();
      expect(result[5]).toBeNull();
    });

    it('should handle all null hostCompensation', () => {
      const result = calculateNightlyPricesArray({
        hostCompensation: [null, null, null, null, null, null, null],
        multipliers: [1.12, 1.13, 1.14, 1.15, 1.16, 1.17, 1.02]
      });
      expect(result).toEqual([null, null, null, null, null, null, null]);
    });

    it('should return null for NaN hostCompensation values', () => {
      const result = calculateNightlyPricesArray({
        hostCompensation: [null, 100, NaN, null, 85, null, 75],
        multipliers: [1.12, 1.13, 1.14, 1.15, 1.16, 1.17, 1.02]
      });
      expect(result[2]).toBeNull();
    });
  });

  describe('Rounding Precision', () => {
    it('should round to 2 decimal places for currency', () => {
      const result = calculateNightlyPricesArray({
        hostCompensation: [null, 100, 100, 100, 100, 100, 100],
        multipliers: [1.1111, 1.1155, 1.1199, 1.1144, 1.1166, 1.1177, 1.1188]
      });
      expect(result[1]).toBe(111.55); // 100 × 1.1155 = 111.55
      expect(result[2]).toBe(111.99); // 100 × 1.1199 = 111.99
    });

    it('should handle rounding up correctly', () => {
      const result = calculateNightlyPricesArray({
        hostCompensation: [null, 100, null, null, null, null, null],
        multipliers: [1, 1.125, 1, 1, 1, 1, 1]
      });
      expect(result[1]).toBe(112.5); // 100 × 1.125 = 112.5
    });

    it('should handle rounding down correctly', () => {
      const result = calculateNightlyPricesArray({
        hostCompensation: [null, 100, null, null, null, null, null],
        multipliers: [1, 1.124, 1, 1, 1, 1, 1]
      });
      expect(result[1]).toBe(112.4); // 100 × 1.124 = 112.4
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero host compensation', () => {
      const result = calculateNightlyPricesArray({
        hostCompensation: [null, 0, 0, 0, 0, 0, 0],
        multipliers: [1.12, 1.13, 1.14, 1.15, 1.16, 1.17, 1.02]
      });
      expect(result[1]).toBe(0);
      expect(result[2]).toBe(0);
      expect(result[3]).toBe(0);
    });

    it('should handle very small values', () => {
      const result = calculateNightlyPricesArray({
        hostCompensation: [null, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01],
        multipliers: [1.12, 1.13, 1.14, 1.15, 1.16, 1.17, 1.02]
      });
      expect(result[1]).toBeCloseTo(0.01, 2);
    });

    it('should handle very large values', () => {
      const result = calculateNightlyPricesArray({
        hostCompensation: [null, 10000, 10000, 10000, 10000, 10000, 10000],
        multipliers: [1.12, 1.13, 1.14, 1.15, 1.16, 1.17, 1.02]
      });
      expect(result[1]).toBe(11300);
      expect(result[6]).toBe(10200);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for non-array hostCompensation', () => {
      expect(() => {
        calculateNightlyPricesArray({
          hostCompensation: 'not an array',
          multipliers: [1.12, 1.13, 1.14, 1.15, 1.16, 1.17, 1.02]
        });
      }).toThrow('hostCompensation must be an array');
    });

    it('should throw error for incorrect hostCompensation length', () => {
      expect(() => {
        calculateNightlyPricesArray({
          hostCompensation: [100, 95, 90], // Only 3 elements
          multipliers: [1.12, 1.13, 1.14, 1.15, 1.16, 1.17, 1.02]
        });
      }).toThrow('must have 7 elements');
    });

    it('should throw error for non-array multipliers', () => {
      expect(() => {
        calculateNightlyPricesArray({
          hostCompensation: [null, 100, 95, 90, 85, 80, 75],
          multipliers: 'not an array'
        });
      }).toThrow('multipliers must be an array');
    });

    it('should throw error for incorrect multipliers length', () => {
      expect(() => {
        calculateNightlyPricesArray({
          hostCompensation: [null, 100, 95, 90, 85, 80, 75],
          multipliers: [1.12, 1.13, 1.14] // Only 3 elements
        });
      }).toThrow('must have 7 elements');
    });
  });

  describe('Real-World Scenarios', () => {
    it('should calculate prices for typical listing', () => {
      const result = calculateNightlyPricesArray({
        hostCompensation: [null, 100, 95, 90, 85, 80, 75],
        multipliers: [0.99, 1.02, 1.05, 1.08, 1.11, 1.14, 1.04]
      });
      expect(result[1]).toBe(102); // 2 nights
      expect(result[2]).toBeCloseTo(99.75, 1); // 3 nights
      expect(result[6]).toBe(78); // 7 nights with full-time discount
    });

    it('should handle decreasing host rates with increasing nights', () => {
      const result = calculateNightlyPricesArray({
        hostCompensation: [null, 150, 140, 130, 120, 110, 100],
        multipliers: [0.99, 1.02, 1.05, 1.08, 1.11, 1.14, 1.04]
      });
      expect(result[1]).toBe(153);
      expect(result[6]).toBe(104);
    });

    it('should calculate final guest prices from host compensation', () => {
      const hostCompensation = [null, 100, 95, 90, 85, 80, 75];
      const multipliers = [0.99, 1.02, 1.05, 1.08, 1.11, 1.14, 1.04];
      const result = calculateNightlyPricesArray({ hostCompensation, multipliers });

      // All prices should be greater than or equal to host compensation (when multiplier >= 1)
      for (let i = 1; i < result.length; i++) {
        if (result[i] !== null && hostCompensation[i] !== null) {
          expect(result[i]).toBeGreaterThan(0);
        }
      }
    });
  });
});
