/**
 * Integration tests for calculateMarkupAndDiscountMultipliersArray
 *
 * Tests the calculation of markup and discount multipliers array for pricing.
 */

import { describe, it, expect } from 'vitest';
import { calculateMarkupAndDiscountMultipliersArray } from '../calculateMarkupAndDiscountMultipliersArray.js';
import { PRICING_CONSTANTS } from '../../../constants/pricingConstants.js';

describe('calculateMarkupAndDiscountMultipliersArray', () => {
  describe('Array Length Validation', () => {
    it('should return array of exactly 7 elements', () => {
      const result = calculateMarkupAndDiscountMultipliersArray({
        combinedMarkup: 0.17,
        unusedNightsDiscounts: [0.18, 0.15, 0.12, 0.09, 0.06, 0.03, 0]
      });
      expect(result).toHaveLength(PRICING_CONSTANTS.PRICING_LIST_ARRAY_LENGTH);
    });

    it('should match PRICING_LIST_ARRAY_LENGTH constant', () => {
      const result = calculateMarkupAndDiscountMultipliersArray({
        combinedMarkup: 0.17,
        unusedNightsDiscounts: [0.18, 0.15, 0.12, 0.09, 0.06, 0.03, 0]
      });
      expect(result.length).toBe(PRICING_CONSTANTS.PRICING_LIST_ARRAY_LENGTH);
    });
  });

  describe('Default Parameters', () => {
    it('should use FULL_TIME_DISCOUNT_RATE (0.13) when fullTimeDiscount not specified', () => {
      const result = calculateMarkupAndDiscountMultipliersArray({
        combinedMarkup: 0.17,
        unusedNightsDiscounts: [0.18, 0.15, 0.12, 0.09, 0.06, 0.03, 0]
      });
      const expectedFullTimeDiscount = PRICING_CONSTANTS.FULL_TIME_DISCOUNT_RATE;
      const expectedMultiplier = 1 + 0.17 - 0 - expectedFullTimeDiscount; // Index 6 (7 nights)
      expect(result[6]).toBeCloseTo(expectedMultiplier, 4);
    });
  });

  describe('Multiplier Calculation', () => {
    it('should calculate multipliers correctly for all indices', () => {
      const result = calculateMarkupAndDiscountMultipliersArray({
        combinedMarkup: 0.17,
        unusedNightsDiscounts: [0.18, 0.15, 0.12, 0.09, 0.06, 0.03, 0],
        fullTimeDiscount: 0.13
      });

      // Index 0 (1 night): 1 + 0.17 - 0.18 = 0.99
      expect(result[0]).toBe(0.99);

      // Index 1 (2 nights): 1 + 0.17 - 0.15 = 1.02
      expect(result[1]).toBe(1.02);

      // Index 2 (3 nights): 1 + 0.17 - 0.12 = 1.05
      expect(result[2]).toBe(1.05);

      // Index 3 (4 nights): 1 + 0.17 - 0.09 = 1.08
      expect(result[3]).toBe(1.08);

      // Index 4 (5 nights): 1 + 0.17 - 0.06 = 1.11
      expect(result[4]).toBe(1.11);

      // Index 5 (6 nights): 1 + 0.17 - 0.03 = 1.14
      expect(result[5]).toBe(1.14);

      // Index 6 (7 nights): 1 + 0.17 - 0 - 0.13 = 1.04
      expect(result[6]).toBe(1.04);
    });

    it('should apply full-time discount only at index 6', () => {
      const result = calculateMarkupAndDiscountMultipliersArray({
        combinedMarkup: 0.17,
        unusedNightsDiscounts: [0, 0, 0, 0, 0, 0, 0],
        fullTimeDiscount: 0.13
      });

      // All indices except 6 should have multiplier = 1.17
      for (let i = 0; i < 6; i++) {
        expect(result[i]).toBe(1.17);
      }

      // Index 6 should have multiplier = 1.17 - 0.13 = 1.04
      expect(result[6]).toBe(1.04);
    });
  });

  describe('Rounding Precision', () => {
    it('should round to 4 decimal places', () => {
      const result = calculateMarkupAndDiscountMultipliersArray({
        combinedMarkup: 0.17123,
        unusedNightsDiscounts: [0.18123, 0.15123, 0.12123, 0.09123, 0.06123, 0.03123, 0],
        fullTimeDiscount: 0.13
      });
      expect(result[0]).toBeCloseTo(0.99, 4);
      expect(result[3]).toBeCloseTo(1.08, 4);
    });
  });

  describe('Full-Time Discount Application', () => {
    it('should apply full-time discount at FULL_TIME_NIGHTS_THRESHOLD (7 nights)', () => {
      const result = calculateMarkupAndDiscountMultipliersArray({
        combinedMarkup: 0.17,
        unusedNightsDiscounts: [0.18, 0.15, 0.12, 0.09, 0.06, 0.03, 0],
        fullTimeDiscount: 0.13
      });
      const index6Multiplier = 1 + 0.17 - 0 - 0.13;
      expect(result[6]).toBe(index6Multiplier);
    });

    it('should not apply full-time discount before index 6', () => {
      const result = calculateMarkupAndDiscountMultipliersArray({
        combinedMarkup: 0.17,
        unusedNightsDiscounts: [0.18, 0.15, 0.12, 0.09, 0.06, 0.03, 0],
        fullTimeDiscount: 0.25 // Large discount to verify it's not applied earlier
      });

      for (let i = 0; i < 6; i++) {
        const expected = 1 + 0.17 - (0.18 - i * 0.03);
        expect(result[i]).toBeCloseTo(expected, 4);
      }
    });

    it('should handle zero full-time discount', () => {
      const result = calculateMarkupAndDiscountMultipliersArray({
        combinedMarkup: 0.17,
        unusedNightsDiscounts: [0.18, 0.15, 0.12, 0.09, 0.06, 0.03, 0],
        fullTimeDiscount: 0
      });

      // Index 6 should have no additional discount
      expect(result[6]).toBe(1.17);
    });
  });

  describe('Edge Cases', () => {
    it('should handle all zero discounts', () => {
      const result = calculateMarkupAndDiscountMultipliersArray({
        combinedMarkup: 0.17,
        unusedNightsDiscounts: [0, 0, 0, 0, 0, 0, 0],
        fullTimeDiscount: 0
      });
      expect(result).toEqual([1.17, 1.17, 1.17, 1.17, 1.17, 1.17, 1.17]);
    });

    it('should handle zero combined markup', () => {
      const result = calculateMarkupAndDiscountMultipliersArray({
        combinedMarkup: 0,
        unusedNightsDiscounts: [0.18, 0.15, 0.12, 0.09, 0.06, 0.03, 0],
        fullTimeDiscount: 0.13
      });
      expect(result[0]).toBe(0.82); // 1 - 0.18
      expect(result[6]).toBe(0.87); // 1 - 0 - 0.13
    });

    it('should handle very high discounts', () => {
      const result = calculateMarkupAndDiscountMultipliersArray({
        combinedMarkup: 0.5,
        unusedNightsDiscounts: [0.4, 0.35, 0.3, 0.25, 0.2, 0.15, 0.1],
        fullTimeDiscount: 0.2
      });
      expect(result[0]).toBe(1.1); // 1 + 0.5 - 0.4
      expect(result[6]).toBe(1.2); // 1 + 0.5 - 0.1 - 0.2
    });
  });

  describe('Multiplier Progression', () => {
    it('should generally increase as nights increase (more discounts apply to unused nights)', () => {
      const result = calculateMarkupAndDiscountMultipliersArray({
        combinedMarkup: 0.17,
        unusedNightsDiscounts: [0.18, 0.15, 0.12, 0.09, 0.06, 0.03, 0],
        fullTimeDiscount: 0.13
      });

      // Multipliers should increase from index 0 to 5
      for (let i = 0; i < 5; i++) {
        expect(result[i + 1]).toBeGreaterThan(result[i]);
      }

      // Index 6 might be lower due to full-time discount
      expect(result[6]).toBeLessThan(result[5]);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for NaN combinedMarkup', () => {
      expect(() => {
        calculateMarkupAndDiscountMultipliersArray({
          combinedMarkup: NaN,
          unusedNightsDiscounts: [0.18, 0.15, 0.12, 0.09, 0.06, 0.03, 0]
        });
      }).toThrow('combinedMarkup must be a number');
    });

    it('should throw error for non-array unusedNightsDiscounts', () => {
      expect(() => {
        calculateMarkupAndDiscountMultipliersArray({
          combinedMarkup: 0.17,
          unusedNightsDiscounts: 'not an array'
        });
      }).toThrow('unusedNightsDiscounts must be an array');
    });

    it('should throw error for incorrect array length', () => {
      expect(() => {
        calculateMarkupAndDiscountMultipliersArray({
          combinedMarkup: 0.17,
          unusedNightsDiscounts: [0.18, 0.15, 0.12] // Only 3 elements
        });
      }).toThrow('must have 7 elements');
    });

    it('should throw error for NaN fullTimeDiscount', () => {
      expect(() => {
        calculateMarkupAndDiscountMultipliersArray({
          combinedMarkup: 0.17,
          unusedNightsDiscounts: [0.18, 0.15, 0.12, 0.09, 0.06, 0.03, 0],
          fullTimeDiscount: NaN
        });
      }).toThrow('fullTimeDiscount must be a number');
    });

    it('should throw error for null combinedMarkup', () => {
      expect(() => {
        calculateMarkupAndDiscountMultipliersArray({
          combinedMarkup: null,
          unusedNightsDiscounts: [0.18, 0.15, 0.12, 0.09, 0.06, 0.03, 0]
        });
      }).toThrow('combinedMarkup must be a number');
    });

    it('should throw error for undefined combinedMarkup', () => {
      expect(() => {
        calculateMarkupAndDiscountMultipliersArray({
          unusedNightsDiscounts: [0.18, 0.15, 0.12, 0.09, 0.06, 0.03, 0]
        });
      }).toThrow('combinedMarkup must be a number');
    });
  });

  describe('Real-World Scenarios', () => {
    it('should calculate multipliers for standard pricing', () => {
      const result = calculateMarkupAndDiscountMultipliersArray({
        combinedMarkup: PRICING_CONSTANTS.SITE_MARKUP_RATE,
        unusedNightsDiscounts: [0.18, 0.15, 0.12, 0.09, 0.06, 0.03, 0],
        fullTimeDiscount: PRICING_CONSTANTS.FULL_TIME_DISCOUNT_RATE
      });
      expect(result[0]).toBe(0.99);
      expect(result[6]).toBe(1.04);
    });

    it('should handle scenario with no unused nights discount', () => {
      const result = calculateMarkupAndDiscountMultipliersArray({
        combinedMarkup: 0.17,
        unusedNightsDiscounts: [0, 0, 0, 0, 0, 0, 0],
        fullTimeDiscount: 0.13
      });
      expect(result).toEqual([1.17, 1.17, 1.17, 1.17, 1.17, 1.17, 1.04]);
    });
  });
});
