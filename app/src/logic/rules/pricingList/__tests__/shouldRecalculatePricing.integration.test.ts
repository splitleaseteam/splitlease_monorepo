/**
 * Integration tests for shouldRecalculatePricing rule.
 *
 * Tests change detection between listing rates and stored pricing list,
 * including null/undefined handling, type coercion, and edge cases.
 */

import { describe, it, expect } from 'vitest';
import { shouldRecalculatePricing } from '../shouldRecalculatePricing.js';

describe('shouldRecalculatePricing - Integration Tests', () => {
  describe('recalculation triggers', () => {
    it('should return true when pricingList is null', () => {
      const listing = {
        'nightly_rate_2_nights': 100
      };

      const result = shouldRecalculatePricing({ listing, pricingList: null });

      expect(result).toBe(true);
    });

    it('should return true when pricingList is undefined', () => {
      const listing = {
        'nightly_rate_2_nights': 100
      };

      const result = shouldRecalculatePricing({ listing, pricingList: undefined });

      expect(result).toBe(true);
    });

    it('should return true when any rate field differs', () => {
      const listing = {
        'nightly_rate_2_nights': 110 // Changed from 100
      };

      const pricingList = {
        hostCompensation: [null, 100, 95, 90, 85, 80, 75]
      };

      const result = shouldRecalculatePricing({ listing, pricingList });

      expect(result).toBe(true);
    });

    it('should return true when rate changes from null to value', () => {
      const listing = {
        'nightly_rate_2_nights': 100
      };

      const pricingList = {
        hostCompensation: [null, null, 95, 90, 85, 80, 75]
      };

      const result = shouldRecalculatePricing({ listing, pricingList });

      expect(result).toBe(true);
    });

    it('should return true when rate changes from value to null', () => {
      const listing = {
        'nightly_rate_2_nights': null
      };

      const pricingList = {
        hostCompensation: [null, 100, 95, 90, 85, 80, 75]
      };

      const result = shouldRecalculatePricing({ listing, pricingList });

      expect(result).toBe(true);
    });

    it('should return true when rate changes from value to zero', () => {
      const listing = {
        'nightly_rate_2_nights': 0
      };

      const pricingList = {
        hostCompensation: [null, 100, 95, 90, 85, 80, 75]
      };

      const result = shouldRecalculatePricing({ listing, pricingList });

      expect(result).toBe(true);
    });
  });

  describe('no recalculation needed', () => {
    it('should return false when all rates match', () => {
      const listing = {
        'nightly_rate_1_night': 150,
        'nightly_rate_2_nights': 100,
        'nightly_rate_3_nights': 95,
        'nightly_rate_4_nights': 90,
        'nightly_rate_5_nights': 85,
        'nightly_rate_6_nights': 80,
        'nightly_rate_7_nights': 75
      };

      const pricingList = {
        hostCompensation: [150, 100, 95, 90, 85, 80, 75]
      };

      const result = shouldRecalculatePricing({ listing, pricingList });

      expect(result).toBe(false);
    });

    it('should return false when all rates are null on both sides', () => {
      const listing = {
        'nightly_rate_1_night': null,
        'nightly_rate_2_nights': null,
        'nightly_rate_3_nights': null,
        'nightly_rate_4_nights': null,
        'nightly_rate_5_nights': null,
        'nightly_rate_6_nights': null,
        'nightly_rate_7_nights': null
      };

      const pricingList = {
        hostCompensation: [null, null, null, null, null, null, null]
      };

      const result = shouldRecalculatePricing({ listing, pricingList });

      expect(result).toBe(false);
    });

    it('should return false when rates match including zeros', () => {
      const listing = {
        'nightly_rate_2_nights': 0,
        'nightly_rate_3_nights': 0
      };

      const pricingList = {
        hostCompensation: [null, 0, 0, null, null, null, null]
      };

      const result = shouldRecalculatePricing({ listing, pricingList });

      expect(result).toBe(false);
    });
  });

  describe('type coercion handling', () => {
    it('should compare string numbers with numbers correctly', () => {
      const listing = {
        'nightly_rate_1_night': null,
        'nightly_rate_2_nights': '100',
        'nightly_rate_3_nights': '95',
        'nightly_rate_4_nights': '90',
        'nightly_rate_5_nights': '85',
        'nightly_rate_6_nights': '80',
        'nightly_rate_7_nights': '75'
      };

      const pricingList = {
        hostCompensation: [null, 100, 95, 90, 85, 80, 75]
      };

      const result = shouldRecalculatePricing({ listing, pricingList });

      expect(result).toBe(false); // '100' === 100 after coercion
    });

    it('should detect difference when string number differs from stored number', () => {
      const listing = {
        'nightly_rate_2_nights': '110'
      };

      const pricingList = {
        hostCompensation: [null, 100, 95, 90, 85, 80, 75]
      };

      const result = shouldRecalculatePricing({ listing, pricingList });

      expect(result).toBe(true);
    });

    it('should handle decimal comparisons correctly', () => {
      const listing = {
        'nightly_rate_1_night': null,
        'nightly_rate_2_nights': 100.5,
        'nightly_rate_3_nights': 95,
        'nightly_rate_4_nights': 90,
        'nightly_rate_5_nights': 85,
        'nightly_rate_6_nights': 80,
        'nightly_rate_7_nights': 75
      };

      const pricingList = {
        hostCompensation: [null, 100.5, 95, 90, 85, 80, 75]
      };

      const result = shouldRecalculatePricing({ listing, pricingList });

      expect(result).toBe(false);
    });

    it('should detect difference in decimal values', () => {
      const listing = {
        'nightly_rate_2_nights': 100.6
      };

      const pricingList = {
        hostCompensation: [null, 100.5, 95, 90, 85, 80, 75]
      };

      const result = shouldRecalculatePricing({ listing, pricingList });

      expect(result).toBe(true);
    });

    it('should normalize NaN to null for comparison', () => {
      const listing = {
        'nightly_rate_1_night': null,
        'nightly_rate_2_nights': NaN,
        'nightly_rate_3_nights': 95,
        'nightly_rate_4_nights': 90,
        'nightly_rate_5_nights': 85,
        'nightly_rate_6_nights': 80,
        'nightly_rate_7_nights': 75
      };

      const pricingList = {
        hostCompensation: [null, null, 95, 90, 85, 80, 75]
      };

      const result = shouldRecalculatePricing({ listing, pricingList });

      expect(result).toBe(false); // NaN is normalized to null
    });
  });

  describe('field name handling', () => {
    it('should handle canonical hostCompensation field name', () => {
      const listing = {
        'nightly_rate_1_night': null,
        'nightly_rate_2_nights': 100,
        'nightly_rate_3_nights': 95,
        'nightly_rate_4_nights': 90,
        'nightly_rate_5_nights': 85,
        'nightly_rate_6_nights': 80,
        'nightly_rate_7_nights': 75
      };

      const pricingList = {
        hostCompensation: [null, 100, 95, 90, 85, 80, 75]
      };

      const result = shouldRecalculatePricing({ listing, pricingList });

      expect(result).toBe(false);
    });

    it('should detect changes with canonical field name', () => {
      const listing = {
        'nightly_rate_2_nights': 110
      };

      const pricingList = {
        hostCompensation: [null, 100, 95, 90, 85, 80, 75]
      };

      const result = shouldRecalculatePricing({ listing, pricingList });

      expect(result).toBe(true);
    });

    it('should handle missing hostCompensation array', () => {
      const listing = {
        'nightly_rate_2_nights': 100
      };

      const pricingList = {
        nightlyPrice: [null, 117, 111, 105, 99, 94, 76]
        // hostCompensation missing
      };

      const result = shouldRecalculatePricing({ listing, pricingList });

      expect(result).toBe(true); // Missing array means recalculate
    });
  });

  describe('array index mapping', () => {
    it('should map rate_1_night to index 0', () => {
      const listing = {
        'nightly_rate_1_night': 150,
        'nightly_rate_2_nights': 100,
        'nightly_rate_3_nights': 95,
        'nightly_rate_4_nights': 90,
        'nightly_rate_5_nights': 85,
        'nightly_rate_6_nights': 80,
        'nightly_rate_7_nights': 75
      };

      const pricingList = {
        hostCompensation: [150, 100, 95, 90, 85, 80, 75]
      };

      const result = shouldRecalculatePricing({ listing, pricingList });

      expect(result).toBe(false);
    });

    it('should map rate_2_nights to index 1', () => {
      const listing = {
        'nightly_rate_1_night': null,
        'nightly_rate_2_nights': 100,
        'nightly_rate_3_nights': 95,
        'nightly_rate_4_nights': 90,
        'nightly_rate_5_nights': 85,
        'nightly_rate_6_nights': 80,
        'nightly_rate_7_nights': 75
      };

      const pricingList = {
        hostCompensation: [null, 100, 95, 90, 85, 80, 75]
      };

      const result = shouldRecalculatePricing({ listing, pricingList });

      expect(result).toBe(false);
    });

    it('should map rate_7_nights to index 6', () => {
      const listing = {
        'nightly_rate_1_night': null,
        'nightly_rate_2_nights': 100,
        'nightly_rate_3_nights': 95,
        'nightly_rate_4_nights': 90,
        'nightly_rate_5_nights': 85,
        'nightly_rate_6_nights': 80,
        'nightly_rate_7_nights': 75
      };

      const pricingList = {
        hostCompensation: [null, 100, 95, 90, 85, 80, 75]
      };

      const result = shouldRecalculatePricing({ listing, pricingList });

      expect(result).toBe(false);
    });

    it('should detect change at any index', () => {
      const listing = {
        'nightly_rate_1_night': 150,
        'nightly_rate_2_nights': 100,
        'nightly_rate_3_nights': 95,
        'nightly_rate_4_nights': 90,
        'nightly_rate_5_nights': 85,
        'nightly_rate_6_nights': 80,
        'nightly_rate_7_nights': 70 // Changed from 75
      };

      const pricingList = {
        hostCompensation: [150, 100, 95, 90, 85, 80, 75]
      };

      const result = shouldRecalculatePricing({ listing, pricingList });

      expect(result).toBe(true);
    });
  });

  describe('validation', () => {
    it('should throw error when listing is null', () => {
      expect(() => shouldRecalculatePricing({ listing: null, pricingList: {} })).toThrow(
        'shouldRecalculatePricing: listing is required'
      );
    });

    it('should throw error when listing is undefined', () => {
      expect(() => shouldRecalculatePricing({ listing: undefined, pricingList: {} })).toThrow(
        'shouldRecalculatePricing: listing is required'
      );
    });

    it('should throw error when listing parameter is missing', () => {
      expect(() => shouldRecalculatePricing({ pricingList: {} })).toThrow(
        'shouldRecalculatePricing: listing is required'
      );
    });
  });

  describe('invalid pricing list handling', () => {
    it('should return true for invalid pricing list (empty object)', () => {
      const listing = {
        'nightly_rate_2_nights': 100
      };

      const pricingList = {};

      const result = shouldRecalculatePricing({ listing, pricingList });

      expect(result).toBe(true);
    });

    it('should return true for pricing list with malformed arrays', () => {
      const listing = {
        'nightly_rate_2_nights': 100
      };

      const pricingList = {
        hostCompensation: [1, 2, 3] // Wrong length
      };

      const result = shouldRecalculatePricing({ listing, pricingList });

      expect(result).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty listing with no rate fields', () => {
      const listing = {
        Name: 'Test Listing'
      };

      const pricingList = {
        hostCompensation: [null, null, null, null, null, null, null]
      };

      const result = shouldRecalculatePricing({ listing, pricingList });

      expect(result).toBe(false); // All nulls match
    });

    it('should handle listing with only some rate fields', () => {
      const listing = {
        'nightly_rate_2_nights': 100
      };

      const pricingList = {
        hostCompensation: [null, 100, null, null, null, null, null]
      };

      const result = shouldRecalculatePricing({ listing, pricingList });

      expect(result).toBe(false);
    });

    it('should handle negative rate values', () => {
      const listing = {
        'nightly_rate_1_night': null,
        'nightly_rate_2_nights': -100,
        'nightly_rate_3_nights': 95,
        'nightly_rate_4_nights': 90,
        'nightly_rate_5_nights': 85,
        'nightly_rate_6_nights': 80,
        'nightly_rate_7_nights': 75
      };

      const pricingList = {
        hostCompensation: [null, -100, 95, 90, 85, 80, 75]
      };

      const result = shouldRecalculatePricing({ listing, pricingList });

      expect(result).toBe(false); // Negative values compare directly
    });

    it('should handle very large rate values', () => {
      const listing = {
        'nightly_rate_1_night': null,
        'nightly_rate_2_nights': 999999,
        'nightly_rate_3_nights': 95,
        'nightly_rate_4_nights': 90,
        'nightly_rate_5_nights': 85,
        'nightly_rate_6_nights': 80,
        'nightly_rate_7_nights': 75
      };

      const pricingList = {
        hostCompensation: [null, 999999, 95, 90, 85, 80, 75]
      };

      const result = shouldRecalculatePricing({ listing, pricingList });

      expect(result).toBe(false);
    });

    it('should handle floating point precision', () => {
      const listing = {
        'nightly_rate_1_night': null,
        'nightly_rate_2_nights': 100.0000000001,
        'nightly_rate_3_nights': 95,
        'nightly_rate_4_nights': 90,
        'nightly_rate_5_nights': 85,
        'nightly_rate_6_nights': 80,
        'nightly_rate_7_nights': 75
      };

      const pricingList = {
        hostCompensation: [null, 100.0000000001, 95, 90, 85, 80, 75]
      };

      const result = shouldRecalculatePricing({ listing, pricingList });

      expect(result).toBe(false);
    });

    it('should detect tiny floating point differences', () => {
      const listing = {
        'nightly_rate_1_night': null,
        'nightly_rate_2_nights': 100.0000000001,
        'nightly_rate_3_nights': 95,
        'nightly_rate_4_nights': 90,
        'nightly_rate_5_nights': 85,
        'nightly_rate_6_nights': 80,
        'nightly_rate_7_nights': 75
      };

      const pricingList = {
        hostCompensation: [null, 100.0000000002, 95, 90, 85, 80, 75]
      };

      const result = shouldRecalculatePricing({ listing, pricingList });

      expect(result).toBe(true);
    });
  });

  describe('real-world scenarios', () => {
    it('should detect rate change from host update', () => {
      const listing = {
        'nightly_rate_2_nights': 120, // Host updated from 100
        'nightly_rate_3_nights': 115,
        'nightly_rate_4_nights': 110,
        'nightly_rate_5_nights': 105,
        'nightly_rate_6_nights': 100,
        'nightly_rate_7_nights': 95
      };

      const pricingList = {
        hostCompensation: [null, 100, 95, 90, 85, 80, 75],
        nightlyPrice: [null, 117, 111, 105, 99, 94, 76]
      };

      const result = shouldRecalculatePricing({ listing, pricingList });

      expect(result).toBe(true);
    });

    it('should not recalculate when rates unchanged', () => {
      const listing = {
        'nightly_rate_2_nights': 100,
        'nightly_rate_3_nights': 95,
        'nightly_rate_4_nights': 90,
        'nightly_rate_5_nights': 85,
        'nightly_rate_6_nights': 80,
        'nightly_rate_7_nights': 75
      };

      const pricingList = {
        hostCompensation: [null, 100, 95, 90, 85, 80, 75],
        nightlyPrice: [null, 117, 111, 105, 99, 94, 76],
        combinedMarkup: 0.17
      };

      const result = shouldRecalculatePricing({ listing, pricingList });

      expect(result).toBe(false);
    });

    it('should handle new listing with no pricing list', () => {
      const listing = {
        'nightly_rate_2_nights': 100,
        'nightly_rate_3_nights': 95,
        'nightly_rate_4_nights': 90
      };

      const result = shouldRecalculatePricing({ listing, pricingList: null });

      expect(result).toBe(true);
    });

    it('should handle canonical data format with string numbers', () => {
      const listing = {
        'nightly_rate_1_night': null,
        'nightly_rate_2_nights': '100',
        'nightly_rate_3_nights': '95',
        'nightly_rate_4_nights': '90',
        'nightly_rate_5_nights': '85',
        'nightly_rate_6_nights': '80',
        'nightly_rate_7_nights': '75'
      };

      const pricingList = {
        hostCompensation: [null, 100, 95, 90, 85, 80, 75],
        nightlyPrice: [null, 117, 111, 105, 99, 94, 76]
      };

      const result = shouldRecalculatePricing({ listing, pricingList });

      expect(result).toBe(false);
    });

    it('should detect when host adds new rate tier', () => {
      const listing = {
        'nightly_rate_2_nights': null,
        'nightly_rate_3_nights': 95, // Host just added this
        'nightly_rate_4_nights': 90
      };

      const pricingList = {
        hostCompensation: [null, null, null, 90, 85, 80, 75]
      };

      const result = shouldRecalculatePricing({ listing, pricingList });

      expect(result).toBe(true);
    });

    it('should detect when host removes rate tier', () => {
      const listing = {
        'nightly_rate_2_nights': null, // Host removed this rate
        'nightly_rate_3_nights': 95,
        'nightly_rate_4_nights': 90
      };

      const pricingList = {
        hostCompensation: [null, 100, 95, 90, 85, 80, 75]
      };

      const result = shouldRecalculatePricing({ listing, pricingList });

      expect(result).toBe(true);
    });

    it('should handle mixed valid and invalid rates', () => {
      const listing = {
        'nightly_rate_1_night': null,
        'nightly_rate_2_nights': '100',
        'nightly_rate_3_nights': 'invalid',
        'nightly_rate_4_nights': 90,
        'nightly_rate_5_nights': 85,
        'nightly_rate_6_nights': 80,
        'nightly_rate_7_nights': 75
      };

      const pricingList = {
        hostCompensation: [null, 100, null, 90, 85, 80, 75]
      };

      const result = shouldRecalculatePricing({ listing, pricingList });

      expect(result).toBe(false); // 'invalid' normalizes to null, matches stored null
    });
  });
});
