/**
 * Integration tests for calculateHostCompensationArray
 *
 * Tests the mapping of listing host rate fields to standardized pricing array.
 */

import { describe, it, expect } from 'vitest';
import { calculateHostCompensationArray } from '../calculateHostCompensationArray.js';
import { PRICING_CONSTANTS } from '../../../constants/pricingConstants.js';

describe('calculateHostCompensationArray', () => {
  describe('Array Length Validation', () => {
    it('should return array of exactly 7 elements', () => {
      const result = calculateHostCompensationArray({
        hostRates: {
          rate1Night: 100,
          rate2Nights: 95,
          rate3Nights: 90,
          rate4Nights: 85,
          rate5Nights: 80,
          rate6Nights: 75,
          rate7Nights: 70
        }
      });
      expect(result).toHaveLength(PRICING_CONSTANTS.PRICING_LIST_ARRAY_LENGTH);
    });

    it('should match PRICING_LIST_ARRAY_LENGTH constant', () => {
      const result = calculateHostCompensationArray({
        hostRates: {
          rate2Nights: 100,
          rate3Nights: 95,
          rate4Nights: 90,
          rate5Nights: 85,
          rate6Nights: 80,
          rate7Nights: 75
        }
      });
      expect(result.length).toBe(PRICING_CONSTANTS.PRICING_LIST_ARRAY_LENGTH);
    });
  });

  describe('Null Handling', () => {
    it('should handle missing rate1Night', () => {
      const result = calculateHostCompensationArray({
        hostRates: {
          rate2Nights: 100,
          rate3Nights: 95,
          rate4Nights: 90,
          rate5Nights: 85,
          rate6Nights: 80,
          rate7Nights: 75
        }
      });
      expect(result[0]).toBeNull();
    });

    it('should handle missing intermediate rates', () => {
      const result = calculateHostCompensationArray({
        hostRates: {
          rate2Nights: 100,
          rate4Nights: 90,
          rate7Nights: 75
        }
      });
      expect(result[0]).toBeNull(); // rate1Night
      expect(result[1]).toBe(100); // rate2Nights
      expect(result[2]).toBeNull(); // rate3Nights
      expect(result[3]).toBe(90); // rate4Nights
      expect(result[4]).toBeNull(); // rate5Nights
      expect(result[5]).toBeNull(); // rate6Nights
      expect(result[6]).toBe(75); // rate7Nights
    });

    it('should return all nulls for empty hostRates object', () => {
      const result = calculateHostCompensationArray({
        hostRates: {}
      });
      expect(result).toEqual([null, null, null, null, null, null, null]);
    });

    it('should handle explicit null values', () => {
      const result = calculateHostCompensationArray({
        hostRates: {
          rate1Night: null,
          rate2Nights: 100,
          rate3Nights: null,
          rate4Nights: 90,
          rate5Nights: null,
          rate6Nights: null,
          rate7Nights: null
        }
      });
      expect(result[0]).toBeNull();
      expect(result[1]).toBe(100);
      expect(result[2]).toBeNull();
      expect(result[3]).toBe(90);
      expect(result[4]).toBeNull();
      expect(result[5]).toBeNull();
      expect(result[6]).toBeNull();
    });
  });

  describe('Data Normalization', () => {
    it('should convert string numbers to numbers', () => {
      const result = calculateHostCompensationArray({
        hostRates: {
          rate2Nights: '100',
          rate3Nights: '95',
          rate4Nights: '90'
        }
      });
      expect(result[1]).toBe(100);
      expect(result[2]).toBe(95);
      expect(result[3]).toBe(90);
    });

    it('should handle zero values', () => {
      const result = calculateHostCompensationArray({
        hostRates: {
          rate2Nights: 0,
          rate3Nights: 0
        }
      });
      expect(result[1]).toBe(0);
      expect(result[2]).toBe(0);
    });

    it('should return null for negative values', () => {
      const result = calculateHostCompensationArray({
        hostRates: {
          rate2Nights: -100,
          rate3Nights: 95
        }
      });
      expect(result[1]).toBeNull();
      expect(result[2]).toBe(95);
    });

    it('should return null for NaN values', () => {
      const result = calculateHostCompensationArray({
        hostRates: {
          rate2Nights: NaN,
          rate3Nights: 95
        }
      });
      expect(result[1]).toBeNull();
      expect(result[2]).toBe(95);
    });
  });

  describe('Edge Cases', () => {
    it('should handle all nulls gracefully', () => {
      const result = calculateHostCompensationArray({
        hostRates: {
          rate1Night: null,
          rate2Nights: null,
          rate3Nights: null,
          rate4Nights: null,
          rate5Nights: null,
          rate6Nights: null,
          rate7Nights: null
        }
      });
      expect(result).toEqual([null, null, null, null, null, null, null]);
    });

    it('should handle single rate value', () => {
      const result = calculateHostCompensationArray({
        hostRates: {
          rate7Nights: 75
        }
      });
      expect(result).toEqual([null, null, null, null, null, null, 75]);
    });

    it('should handle decimal values', () => {
      const result = calculateHostCompensationArray({
        hostRates: {
          rate2Nights: 100.50,
          rate3Nights: 95.75,
          rate4Nights: 90.25
        }
      });
      expect(result[1]).toBe(100.50);
      expect(result[2]).toBe(95.75);
      expect(result[3]).toBe(90.25);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle typical listing rates (decreasing with more nights)', () => {
      const result = calculateHostCompensationArray({
        hostRates: {
          rate2Nights: 100,
          rate3Nights: 95,
          rate4Nights: 90,
          rate5Nights: 85,
          rate6Nights: 80,
          rate7Nights: 75
        }
      });
      expect(result).toEqual([null, 100, 95, 90, 85, 80, 75]);
    });

    it('should handle premium pricing (higher rates for more nights)', () => {
      const result = calculateHostCompensationArray({
        hostRates: {
          rate2Nights: 100,
          rate3Nights: 105,
          rate4Nights: 110,
          rate5Nights: 115,
          rate6Nights: 120,
          rate7Nights: 125
        }
      });
      expect(result).toEqual([null, 100, 105, 110, 115, 120, 125]);
    });

    it('should handle flat pricing (same rate for all nights)', () => {
      const result = calculateHostCompensationArray({
        hostRates: {
          rate2Nights: 100,
          rate3Nights: 100,
          rate4Nights: 100,
          rate5Nights: 100,
          rate6Nights: 100,
          rate7Nights: 100
        }
      });
      expect(result).toEqual([null, 100, 100, 100, 100, 100, 100]);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for null hostRates', () => {
      expect(() => {
        calculateHostCompensationArray({ hostRates: null });
      }).toThrow('hostRates must be an object');
    });

    it('should throw error for undefined hostRates', () => {
      expect(() => {
        calculateHostCompensationArray({});
      }).toThrow('hostRates must be an object');
    });

    it('should throw error for non-object hostRates', () => {
      expect(() => {
        calculateHostCompensationArray({ hostRates: 'not an object' });
      }).toThrow('hostRates must be an object');
    });

    it('should handle array hostRates (arrays are objects in JS)', () => {
      // Note: In JavaScript, arrays are objects, so this passes validation
      // The function will try to access properties like rate2Nights which will be undefined
      // The normalizeRate function converts undefined to null
      const result = calculateHostCompensationArray({ hostRates: [100, 95, 90] });
      expect(result).toEqual([null, null, null, null, null, null, null]);
    });
  });
});
