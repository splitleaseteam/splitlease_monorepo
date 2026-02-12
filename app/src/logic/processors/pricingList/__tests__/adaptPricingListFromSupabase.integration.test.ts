/**
 * Integration tests for adaptPricingListFromSupabase processor.
 *
 * Tests field name mapping from Bubble-style to camelCase,
 * null/undefined handling with defaults, and array structure preservation.
 */

import { describe, it, expect } from 'vitest';
import { adaptPricingListFromSupabase } from '../adaptPricingListFromSupabase.js';

describe('adaptPricingListFromSupabase - Integration Tests', () => {
  describe('field name mapping - Bubble-style to camelCase', () => {
    it('should map core identifiers from Bubble-style to camelCase', () => {
      const rawPricingList = {
        _id: 'abc123',
        listing: 'listing456',
        'Created By': 'user789'
      };

      const result = adaptPricingListFromSupabase(rawPricingList);

      expect(result.id).toBe('abc123');
      expect(result.listingId).toBe('listing456');
      expect(result.createdBy).toBe('user789');
    });

    it('should map array fields from Bubble-style to camelCase', () => {
      const rawPricingList = {
        'Host Compensation': [null, 100, 95, 90, 85, 80, 75],
        'Markup and Discount Multiplier': [null, 1.1, 1.05, 1.0, 0.95, 0.9, 0.85],
        'Nightly Price': [null, 117, 111, 105, 99, 94, 76],
        'Unused Nights': [false, false, false, false, false, false, true],
        'Unused Nights Discount': [null, 0.03, 0.03, 0.03, 0.03, 0.03, 0]
      };

      const result = adaptPricingListFromSupabase(rawPricingList);

      expect(result.hostCompensation).toEqual([null, 100, 95, 90, 85, 80, 75]);
      expect(result.markupAndDiscountMultiplier).toEqual([null, 1.1, 1.05, 1.0, 0.95, 0.9, 0.85]);
      expect(result.nightlyPrice).toEqual([null, 117, 111, 105, 99, 94, 76]);
      expect(result.unusedNights).toEqual([false, false, false, false, false, false, true]);
      expect(result.unusedNightsDiscount).toEqual([null, 0.03, 0.03, 0.03, 0.03, 0.03, 0]);
    });

    it('should map scalar markup fields from Bubble-style to camelCase', () => {
      const rawPricingList = {
        'Unit Markup': 0,
        'Overall Site Markup': 0.17,
        'Combined Markup': 0.17,
        'Full Time Discount': 0.13
      };

      const result = adaptPricingListFromSupabase(rawPricingList);

      expect(result.unitMarkup).toBe(0);
      expect(result.overallSiteMarkup).toBe(0.17);
      expect(result.combinedMarkup).toBe(0.17);
      expect(result.fullTimeDiscount).toBe(0.13);
    });

    it('should map calculated scalar fields from Bubble-style to camelCase', () => {
      const rawPricingList = {
        'Starting Nightly Price': 76,
        'Slope': -6.83,
        'Weekly Price Adjust': 0.05
      };

      const result = adaptPricingListFromSupabase(rawPricingList);

      expect(result.startingNightlyPrice).toBe(76);
      expect(result.slope).toBe(-6.83);
      expect(result.weeklyPriceAdjust).toBe(0.05);
    });

    it('should map metadata fields from Bubble-style to camelCase', () => {
      const rawPricingList = {
        'rental type': 'Nightly',
        'Number Selected Nights': [true, true, true, true, true, true, true],
        'Modified Date': '2025-01-15T10:30:00Z'
      };

      const result = adaptPricingListFromSupabase(rawPricingList);

      expect(result.rentalType).toBe('Nightly');
      expect(result.numberSelectedNights).toEqual([true, true, true, true, true, true, true]);
      expect(result.modifiedDate).toBe('2025-01-15T10:30:00Z');
    });
  });

  describe('null and undefined handling with defaults', () => {
    it('should provide default empty array for missing array fields', () => {
      const rawPricingList = {
        _id: 'abc123',
        listing: 'listing456'
      };

      const result = adaptPricingListFromSupabase(rawPricingList);

      expect(result.hostCompensation).toEqual([]);
      expect(result.markupAndDiscountMultiplier).toEqual([]);
      expect(result.nightlyPrice).toEqual([]);
      expect(result.unusedNights).toEqual([]);
      expect(result.unusedNightsDiscount).toEqual([]);
    });

    it('should provide default values for scalar markup fields', () => {
      const rawPricingList = {
        _id: 'abc123',
        listing: 'listing456'
      };

      const result = adaptPricingListFromSupabase(rawPricingList);

      expect(result.unitMarkup).toBe(0);
      expect(result.overallSiteMarkup).toBe(0.17);
      expect(result.combinedMarkup).toBe(0.17);
      expect(result.fullTimeDiscount).toBe(0.13);
    });

    it('should provide default for rentalType field', () => {
      const rawPricingList = {
        _id: 'abc123',
        listing: 'listing456'
      };

      const result = adaptPricingListFromSupabase(rawPricingList);

      expect(result.rentalType).toBe('Nightly');
    });

    it('should preserve null for optional scalar fields', () => {
      const rawPricingList = {
        _id: 'abc123',
        listing: 'listing456',
        'Starting Nightly Price': null,
        'Slope': null,
        'Weekly Price Adjust': null,
        'Modified Date': null
      };

      const result = adaptPricingListFromSupabase(rawPricingList);

      expect(result.startingNightlyPrice).toBeNull();
      expect(result.slope).toBeNull();
      expect(result.weeklyPriceAdjust).toBeNull();
      expect(result.modifiedDate).toBeNull();
    });

    it('should preserve null for identifier fields', () => {
      const rawPricingList = {
        _id: 'abc123',
        listing: 'listing456',
        'Created By': null
      };

      const result = adaptPricingListFromSupabase(rawPricingList);

      expect(result.createdBy).toBeNull();
    });
  });

  describe('array structure preservation', () => {
    it('should preserve array structure exactly without modification', () => {
      const rawPricingList = {
        'Host Compensation': [null, 100, 95, 90, 85, 80, 75],
        'Nightly Price': [null, 117, 111, 105, 99, 94, 76],
        'Unused Nights': [false, false, false, false, false, false, true]
      };

      const result = adaptPricingListFromSupabase(rawPricingList);

      expect(Array.isArray(result.hostCompensation)).toBe(true);
      expect(result.hostCompensation).toEqual([null, 100, 95, 90, 85, 80, 75]);
      expect(result.nightlyPrice).toEqual([null, 117, 111, 105, 99, 94, 76]);
      expect(result.unusedNights).toEqual([false, false, false, false, false, false, true]);
    });

    it('should preserve arrays with all null values', () => {
      const rawPricingList = {
        'Host Compensation': [null, null, null, null, null, null, null],
        'Nightly Price': [null, null, null, null, null, null, null]
      };

      const result = adaptPricingListFromSupabase(rawPricingList);

      expect(result.hostCompensation).toEqual([null, null, null, null, null, null, null]);
      expect(result.nightlyPrice).toEqual([null, null, null, null, null, null, null]);
    });

    it('should preserve arrays with mixed null and number values', () => {
      const rawPricingList = {
        'Nightly Price': [null, 117, null, 105, null, 94, 76]
      };

      const result = adaptPricingListFromSupabase(rawPricingList);

      expect(result.nightlyPrice).toEqual([null, 117, null, 105, null, 94, 76]);
    });

    it('should preserve arrays with decimal values', () => {
      const rawPricingList = {
        'Markup and Discount Multiplier': [null, 1.17, 1.12, 1.08, 1.05, 1.02, 0.99]
      };

      const result = adaptPricingListFromSupabase(rawPricingList);

      expect(result.markupAndDiscountMultiplier).toEqual([null, 1.17, 1.12, 1.08, 1.05, 1.02, 0.99]);
    });

    it('should preserve boolean arrays', () => {
      const rawPricingList = {
        'Unused Nights': [false, false, false, false, false, false, true],
        'Number Selected Nights': [true, true, true, true, true, true, true]
      };

      const result = adaptPricingListFromSupabase(rawPricingList);

      expect(result.unusedNights).toEqual([false, false, false, false, false, false, true]);
      expect(result.numberSelectedNights).toEqual([true, true, true, true, true, true, true]);
    });
  });

  describe('validation', () => {
    it('should throw error when rawPricingList is null', () => {
      expect(() => adaptPricingListFromSupabase(null)).toThrow(
        'adaptPricingListFromSupabase: rawPricingList is required'
      );
    });

    it('should throw error when rawPricingList is undefined', () => {
      expect(() => adaptPricingListFromSupabase(undefined)).toThrow(
        'adaptPricingListFromSupabase: rawPricingList is required'
      );
    });
  });

  describe('edge cases', () => {
    it('should handle empty object', () => {
      const result = adaptPricingListFromSupabase({});

      expect(result.id).toBeUndefined();
      expect(result.listingId).toBeUndefined();
      expect(result.hostCompensation).toEqual([]);
      expect(result.nightlyPrice).toEqual([]);
      expect(result.unitMarkup).toBe(0);
      expect(result.combinedMarkup).toBe(0.17);
    });

    it('should handle zero values for numeric fields', () => {
      const rawPricingList = {
        'Unit Markup': 0,
        'Combined Markup': 0,
        'Starting Nightly Price': 0
      };

      const result = adaptPricingListFromSupabase(rawPricingList);

      expect(result.unitMarkup).toBe(0);
      expect(result.combinedMarkup).toBe(0);
      expect(result.startingNightlyPrice).toBe(0);
    });

    it('should handle negative values', () => {
      const rawPricingList = {
        'Slope': -6.83,
        'Weekly Price Adjust': -0.05
      };

      const result = adaptPricingListFromSupabase(rawPricingList);

      expect(result.slope).toBe(-6.83);
      expect(result.weeklyPriceAdjust).toBe(-0.05);
    });

    it('should handle floating point precision', () => {
      const rawPricingList = {
        'Combined Markup': 0.171234567,
        'Slope': -6.834567890
      };

      const result = adaptPricingListFromSupabase(rawPricingList);

      expect(result.combinedMarkup).toBe(0.171234567);
      expect(result.slope).toBe(-6.83456789);
    });
  });

  describe('real-world scenarios', () => {
    it('should handle complete pricing list from database', () => {
      const rawPricingList = {
        _id: 'abc123',
        listing: 'listing456',
        'Created By': 'user789',
        'Host Compensation': [null, 100, 95, 90, 85, 80, 75],
        'Markup and Discount Multiplier': [null, 1.17, 1.12, 1.08, 1.05, 1.02, 0.99],
        'Nightly Price': [null, 117, 111, 105, 99, 94, 76],
        'Unused Nights': [false, false, false, false, false, false, true],
        'Unused Nights Discount': [null, 0.03, 0.03, 0.03, 0.03, 0.03, 0],
        'Unit Markup': 0,
        'Overall Site Markup': 0.17,
        'Combined Markup': 0.17,
        'Full Time Discount': 0.13,
        'Starting Nightly Price': 76,
        'Slope': -6.83,
        'Weekly Price Adjust': 0.05,
        'rental type': 'Nightly',
        'Number Selected Nights': [true, true, true, true, true, true, true],
        'Modified Date': '2025-01-15T10:30:00Z'
      };

      const result = adaptPricingListFromSupabase(rawPricingList);

      expect(result).toEqual({
        id: 'abc123',
        listingId: 'listing456',
        createdBy: 'user789',
        hostCompensation: [null, 100, 95, 90, 85, 80, 75],
        markupAndDiscountMultiplier: [null, 1.17, 1.12, 1.08, 1.05, 1.02, 0.99],
        nightlyPrice: [null, 117, 111, 105, 99, 94, 76],
        unusedNights: [false, false, false, false, false, false, true],
        unusedNightsDiscount: [null, 0.03, 0.03, 0.03, 0.03, 0.03, 0],
        unitMarkup: 0,
        overallSiteMarkup: 0.17,
        combinedMarkup: 0.17,
        fullTimeDiscount: 0.13,
        startingNightlyPrice: 76,
        slope: -6.83,
        weeklyPriceAdjust: 0.05,
        rentalType: 'Nightly',
        numberSelectedNights: [true, true, true, true, true, true, true],
        modifiedDate: '2025-01-15T10:30:00Z'
      });
    });

    it('should handle minimal pricing list from legacy data', () => {
      const rawPricingList = {
        _id: 'abc123',
        listing: 'listing456',
        'Host Compensation': [null, 100, 95, 90, 85, 80, 75],
        'Nightly Price': [null, 117, 111, 105, 99, 94, 76]
      };

      const result = adaptPricingListFromSupabase(rawPricingList);

      expect(result.id).toBe('abc123');
      expect(result.listingId).toBe('listing456');
      expect(result.hostCompensation).toEqual([null, 100, 95, 90, 85, 80, 75]);
      expect(result.nightlyPrice).toEqual([null, 117, 111, 105, 99, 94, 76]);
      expect(result.markupAndDiscountMultiplier).toEqual([]);
      expect(result.unusedNights).toEqual([]);
      expect(result.unusedNightsDiscount).toEqual([]);
    });

    it('should handle new pricing list with defaults', () => {
      const rawPricingList = {
        _id: 'abc123',
        listing: 'listing456'
      };

      const result = adaptPricingListFromSupabase(rawPricingList);

      expect(result.id).toBe('abc123');
      expect(result.listingId).toBe('listing456');
      expect(result.hostCompensation).toEqual([]);
      expect(result.nightlyPrice).toEqual([]);
      expect(result.unitMarkup).toBe(0);
      expect(result.combinedMarkup).toBe(0.17);
      expect(result.fullTimeDiscount).toBe(0.13);
      expect(result.rentalType).toBe('Nightly');
    });

    it('should handle pricing list with partial data', () => {
      const rawPricingList = {
        _id: 'abc123',
        listing: 'listing456',
        'Nightly Price': [null, 120, 115, 110, 105, 100, 95],
        'Combined Markup': 0.18
      };

      const result = adaptPricingListFromSupabase(rawPricingList);

      expect(result.id).toBe('abc123');
      expect(result.listingId).toBe('listing456');
      expect(result.nightlyPrice).toEqual([null, 120, 115, 110, 105, 100, 95]);
      expect(result.combinedMarkup).toBe(0.18);
      expect(result.hostCompensation).toEqual([]);
      expect(result.unitMarkup).toBe(0);
      expect(result.overallSiteMarkup).toBe(0.17);
      expect(result.fullTimeDiscount).toBe(0.13);
    });
  });
});
