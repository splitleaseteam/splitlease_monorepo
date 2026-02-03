/**
 * Integration tests for calculateUnusedNightsDiscountArray
 *
 * Tests the calculation of discount array based on unused nights pattern.
 */

import { describe, it, expect } from 'vitest';
import { calculateUnusedNightsDiscountArray } from '../calculateUnusedNightsDiscountArray.js';
import { PRICING_CONSTANTS } from '../../../constants/pricingConstants.js';

describe('calculateUnusedNightsDiscountArray', () => {
  describe('Array Length Validation', () => {
    it('should return array of exactly 7 elements', () => {
      const result = calculateUnusedNightsDiscountArray({});
      expect(result).toHaveLength(PRICING_CONSTANTS.PRICING_LIST_ARRAY_LENGTH);
    });

    it('should match PRICING_LIST_ARRAY_LENGTH constant', () => {
      const result = calculateUnusedNightsDiscountArray({});
      expect(result.length).toBe(PRICING_CONSTANTS.PRICING_LIST_ARRAY_LENGTH);
    });
  });

  describe('Default Parameters', () => {
    it('should use default UNUSED_NIGHTS_DISCOUNT_MULTIPLIER', () => {
      const result = calculateUnusedNightsDiscountArray({});
      const expectedMultiplier = PRICING_CONSTANTS.UNUSED_NIGHTS_DISCOUNT_MULTIPLIER;
      expect(result[0]).toBe(6 * expectedMultiplier); // 1 night = 6 unused = max discount
      expect(result[6]).toBe(0); // 7 nights = 0 unused = no discount
    });

    it('should use default 0.03 discount when not specified', () => {
      const result = calculateUnusedNightsDiscountArray({});
      expect(result).toEqual([0.18, 0.15, 0.12, 0.09, 0.06, 0.03, 0]);
    });
  });

  describe('Linear Discount Calculation', () => {
    it('should calculate discounts linearly with default multiplier', () => {
      const result = calculateUnusedNightsDiscountArray({});
      // At 1 night: 6 unused * 0.03 = 0.18 (max discount for partial week)
      expect(result[0]).toBe(0.18);
      // At 2 nights: 5 unused * 0.03 = 0.15
      expect(result[1]).toBe(0.15);
      // At 3 nights: 4 unused * 0.03 = 0.12
      expect(result[2]).toBe(0.12);
      // At 4 nights: 3 unused * 0.03 = 0.09
      expect(result[3]).toBe(0.09);
      // At 5 nights: 2 unused * 0.03 = 0.06
      expect(result[4]).toBe(0.06);
      // At 6 nights: 1 unused * 0.03 = 0.03
      expect(result[5]).toBe(0.03);
      // At 7 nights: 0 unused * 0.03 = 0 (full-time gets separate discount)
      expect(result[6]).toBe(0);
    });

    it('should calculate discounts with custom baseDiscount', () => {
      const result = calculateUnusedNightsDiscountArray({ baseDiscount: 0.05 });
      expect(result[0]).toBe(0.30); // 6 * 0.05
      expect(result[1]).toBe(0.25); // 5 * 0.05
      expect(result[2]).toBe(0.20); // 4 * 0.05
      expect(result[3]).toBe(0.15); // 3 * 0.05
      expect(result[4]).toBe(0.10); // 2 * 0.05
      expect(result[5]).toBe(0.05); // 1 * 0.05
      expect(result[6]).toBe(0); // 0 * 0.05
    });

    it('should handle zero discount', () => {
      const result = calculateUnusedNightsDiscountArray({ baseDiscount: 0 });
      expect(result).toEqual([0, 0, 0, 0, 0, 0, 0]);
    });
  });

  describe('Rounding Precision', () => {
    it('should round to 4 decimal places', () => {
      const result = calculateUnusedNightsDiscountArray({ baseDiscount: 0.0333 });
      expect(result[0]).toBe(0.1998); // 6 * 0.0333 = 0.1998
      expect(result[1]).toBe(0.1665); // 5 * 0.0333 = 0.1665
      expect(result[6]).toBe(0);
    });

    it('should handle repeating decimals correctly', () => {
      const result = calculateUnusedNightsDiscountArray({ baseDiscount: 0.01 });
      expect(result[0]).toBe(0.06); // 6 * 0.01 = 0.06
      expect(result[3]).toBe(0.03); // 3 * 0.01 = 0.03
      expect(result[6]).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle boundary value of 1.0 (100% discount)', () => {
      const result = calculateUnusedNightsDiscountArray({ baseDiscount: 1 });
      expect(result).toEqual([6, 5, 4, 3, 2, 1, 0]);
    });

    it('should handle very small discount values', () => {
      const result = calculateUnusedNightsDiscountArray({ baseDiscount: 0.0001 });
      expect(result[0]).toBe(0.0006);
      expect(result[6]).toBe(0);
    });

    it('should handle selectedNights parameter (deprecated but still accepted)', () => {
      const result = calculateUnusedNightsDiscountArray({
        selectedNights: [0, 1, 2],
        baseDiscount: 0.03
      });
      // selectedNights is ignored in current implementation
      expect(result).toEqual([0.18, 0.15, 0.12, 0.09, 0.06, 0.03, 0]);
    });
  });

  describe('Discount Progression', () => {
    it('should decrease discount as nights increase', () => {
      const result = calculateUnusedNightsDiscountArray({ baseDiscount: 0.03 });
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i]).toBeGreaterThan(result[i + 1]);
      }
    });

    it('should have maximum discount at 1 night', () => {
      const result = calculateUnusedNightsDiscountArray({ baseDiscount: 0.03 });
      const maxDiscount = Math.max(...result);
      expect(result[0]).toBe(maxDiscount);
    });

    it('should have zero discount at 7 nights', () => {
      const result = calculateUnusedNightsDiscountArray({ baseDiscount: 0.03 });
      expect(result[6]).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for NaN baseDiscount', () => {
      expect(() => {
        calculateUnusedNightsDiscountArray({ baseDiscount: NaN });
      }).toThrow('baseDiscount must be a number');
    });

    it('should throw error for negative baseDiscount', () => {
      expect(() => {
        calculateUnusedNightsDiscountArray({ baseDiscount: -0.05 });
      }).toThrow('baseDiscount must be between 0 and 1');
    });

    it('should throw error for baseDiscount > 1', () => {
      expect(() => {
        calculateUnusedNightsDiscountArray({ baseDiscount: 1.5 });
      }).toThrow('baseDiscount must be between 0 and 1');
    });

    it('should throw error for non-number baseDiscount', () => {
      expect(() => {
        calculateUnusedNightsDiscountArray({ baseDiscount: '0.03' });
      }).toThrow('baseDiscount must be a number');
    });

    it('should throw error for null baseDiscount', () => {
      expect(() => {
        calculateUnusedNightsDiscountArray({ baseDiscount: null });
      }).toThrow('baseDiscount must be a number');
    });

    it('should use default when baseDiscount is undefined', () => {
      // When baseDiscount is explicitly undefined, the default parameter value is used
      // due to the destructuring with default: baseDiscount = DEFAULT_VALUE
      const result = calculateUnusedNightsDiscountArray({ baseDiscount: undefined });
      expect(result).toEqual([0.18, 0.15, 0.12, 0.09, 0.06, 0.03, 0]);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should calculate standard unused nights discounts', () => {
      const result = calculateUnusedNightsDiscountArray({
        baseDiscount: PRICING_CONSTANTS.UNUSED_NIGHTS_DISCOUNT_MULTIPLIER
      });
      expect(result).toEqual([0.18, 0.15, 0.12, 0.09, 0.06, 0.03, 0]);
    });

    it('should compensate partial-week bookings', () => {
      const result = calculateUnusedNightsDiscountArray({ baseDiscount: 0.03 });
      const oneNightDiscount = result[0];
      const sevenNightDiscount = result[6];
      // 1 night gets MORE unused nights discount (compensation for partial week)
      // 7 nights gets 0 unused discount (but gets separate full-time discount)
      expect(oneNightDiscount).toBeGreaterThan(sevenNightDiscount);
      expect(sevenNightDiscount).toBe(0);
    });
  });
});
