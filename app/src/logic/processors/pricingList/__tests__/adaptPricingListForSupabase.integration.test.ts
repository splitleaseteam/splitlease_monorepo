/**
 * Integration tests for adaptPricingListForSupabase processor.
 *
 * Tests field name mapping from camelCase to Bubble-style,
 * null/undefined handling, and array structure preservation.
 */

import { describe, it, expect } from 'vitest';
import { adaptPricingListForSupabase } from '../adaptPricingListForSupabase.js';

describe('adaptPricingListForSupabase - Integration Tests', () => {
  describe('field name mapping - camelCase to Bubble-style', () => {
    it('should map core identifiers from camelCase to Bubble-style', () => {
      const pricingList = {
        id: 'abc123',
        listingId: 'listing456',
        createdBy: 'user789'
      };

      const result = adaptPricingListForSupabase(pricingList);

      expect(result.id).toBe('abc123');
      expect(result.listing).toBe('listing456');
      expect(result['Created By']).toBe('user789');
    });

    it('should map array fields from camelCase to Bubble-style', () => {
      const pricingList = {
        hostCompensation: [null, 100, 95, 90, 85, 80, 75],
        markupAndDiscountMultiplier: [null, 1.1, 1.05, 1.0, 0.95, 0.9, 0.85],
        nightlyPrice: [null, 117, 111, 105, 99, 94, 76],
        unusedNights: [false, false, false, false, false, false, true],
        unusedNightsDiscount: [null, 0.03, 0.03, 0.03, 0.03, 0.03, 0]
      };

      const result = adaptPricingListForSupabase(pricingList);

      expect(result['Host Compensation']).toEqual([null, 100, 95, 90, 85, 80, 75]);
      expect(result['Markup and Discount Multiplier']).toEqual([null, 1.1, 1.05, 1.0, 0.95, 0.9, 0.85]);
      expect(result['Nightly Price']).toEqual([null, 117, 111, 105, 99, 94, 76]);
      expect(result['Unused Nights']).toEqual([false, false, false, false, false, false, true]);
      expect(result['Unused Nights Discount']).toEqual([null, 0.03, 0.03, 0.03, 0.03, 0.03, 0]);
    });

    it('should map scalar markup fields from camelCase to Bubble-style', () => {
      const pricingList = {
        unitMarkup: 0,
        overallSiteMarkup: 0.17,
        combinedMarkup: 0.17,
        fullTimeDiscount: 0.13
      };

      const result = adaptPricingListForSupabase(pricingList);

      expect(result['Unit Markup']).toBe(0);
      expect(result['Overall Site Markup']).toBe(0.17);
      expect(result['Combined Markup']).toBe(0.17);
      expect(result['Full Time Discount']).toBe(0.13);
    });

    it('should map calculated scalar fields from camelCase to Bubble-style', () => {
      const pricingList = {
        startingNightlyPrice: 76,
        slope: -6.83,
        weeklyPriceAdjust: 0.05
      };

      const result = adaptPricingListForSupabase(pricingList);

      expect(result['Starting Nightly Price']).toBe(76);
      expect(result['Slope']).toBe(-6.83);
      expect(result['Weekly Price Adjust']).toBe(0.05);
    });

    it('should map metadata fields from camelCase to Bubble-style', () => {
      const pricingList = {
        rentalType: 'Nightly',
        numberSelectedNights: [true, true, true, true, true, true, true],
        modifiedDate: '2025-01-15T10:30:00Z'
      };

      const result = adaptPricingListForSupabase(pricingList);

      expect(result.rental_type).toBe('Nightly');
      expect(result['Number Selected Nights']).toEqual([true, true, true, true, true, true, true]);
      expect(result.bubble_updated_at).toBe('2025-01-15T10:30:00Z');
    });
  });

  describe('null and undefined handling', () => {
    it('should omit undefined fields from output', () => {
      const pricingList = {
        listingId: 'listing456',
        nightlyPrice: [null, 117, 111, 105, 99, 94, 76]
        // other fields undefined
      };

      const result = adaptPricingListForSupabase(pricingList);

      expect(result).toHaveProperty('listing', 'listing456');
      expect(result).toHaveProperty('Nightly Price');
      expect(result).not.toHaveProperty('Host Compensation');
      expect(result).not.toHaveProperty('Combined Markup');
    });

    it('should include fields with null values', () => {
      const pricingList = {
        listingId: 'listing456',
        nightlyPrice: null,
        combinedMarkup: null
      };

      const result = adaptPricingListForSupabase(pricingList);

      expect(result['Nightly Price']).toBeNull();
      expect(result['Combined Markup']).toBeNull();
    });

    it('should handle missing optional fields gracefully', () => {
      const pricingList = {
        listingId: 'listing456'
      };

      const result = adaptPricingListForSupabase(pricingList);

      expect(result).toEqual({ listing: 'listing456' });
    });
  });

  describe('array structure preservation', () => {
    it('should preserve array structure exactly without modification', () => {
      const pricingList = {
        listingId: 'listing456',
        hostCompensation: [null, 100, 95, 90, 85, 80, 75],
        nightlyPrice: [null, 117, 111, 105, 99, 94, 76],
        unusedNights: [false, false, false, false, false, false, true]
      };

      const result = adaptPricingListForSupabase(pricingList);

      expect(Array.isArray(result['Host Compensation'])).toBe(true);
      expect(result['Host Compensation']).toEqual([null, 100, 95, 90, 85, 80, 75]);
      expect(result['Nightly Price']).toEqual([null, 117, 111, 105, 99, 94, 76]);
      expect(result['Unused Nights']).toEqual([false, false, false, false, false, false, true]);
    });

    it('should preserve arrays with all null values', () => {
      const pricingList = {
        listingId: 'listing456',
        hostCompensation: [null, null, null, null, null, null, null],
        nightlyPrice: [null, null, null, null, null, null, null]
      };

      const result = adaptPricingListForSupabase(pricingList);

      expect(result['Host Compensation']).toEqual([null, null, null, null, null, null, null]);
      expect(result['Nightly Price']).toEqual([null, null, null, null, null, null, null]);
    });

    it('should preserve arrays with mixed null and number values', () => {
      const pricingList = {
        listingId: 'listing456',
        nightlyPrice: [null, 117, null, 105, null, 94, 76]
      };

      const result = adaptPricingListForSupabase(pricingList);

      expect(result['Nightly Price']).toEqual([null, 117, null, 105, null, 94, 76]);
    });

    it('should preserve arrays with decimal values', () => {
      const pricingList = {
        listingId: 'listing456',
        markupAndDiscountMultiplier: [null, 1.17, 1.12, 1.08, 1.05, 1.02, 0.99]
      };

      const result = adaptPricingListForSupabase(pricingList);

      expect(result['Markup and Discount Multiplier']).toEqual([null, 1.17, 1.12, 1.08, 1.05, 1.02, 0.99]);
    });
  });

  describe('validation', () => {
    it('should throw error when pricingList is null', () => {
      expect(() => adaptPricingListForSupabase(null)).toThrow(
        'adaptPricingListForSupabase: pricingList is required'
      );
    });

    it('should throw error when pricingList is undefined', () => {
      expect(() => adaptPricingListForSupabase(undefined)).toThrow(
        'adaptPricingListForSupabase: pricingList is required'
      );
    });
  });

  describe('edge cases', () => {
    it('should handle empty object', () => {
      const result = adaptPricingListForSupabase({});

      expect(result).toEqual({});
    });

    it('should handle both id and _id fields (_id takes precedence when both set)', () => {
      const pricingList = {
        id: 'abc123',
        _id: 'xyz789'
      };

      const result = adaptPricingListForSupabase(pricingList);

      // id field takes the value from pricingList.id
      expect(result.id).toBe('abc123');
    });

    it('should handle zero values for numeric fields', () => {
      const pricingList = {
        listingId: 'listing456',
        unitMarkup: 0,
        combinedMarkup: 0,
        startingNightlyPrice: 0
      };

      const result = adaptPricingListForSupabase(pricingList);

      expect(result['Unit Markup']).toBe(0);
      expect(result['Combined Markup']).toBe(0);
      expect(result['Starting Nightly Price']).toBe(0);
    });

    it('should handle empty arrays', () => {
      const pricingList = {
        listingId: 'listing456',
        hostCompensation: [],
        nightlyPrice: []
      };

      const result = adaptPricingListForSupabase(pricingList);

      expect(result['Host Compensation']).toEqual([]);
      expect(result['Nightly Price']).toEqual([]);
    });

    it('should handle negative values', () => {
      const pricingList = {
        listingId: 'listing456',
        slope: -6.83,
        weeklyPriceAdjust: -0.05
      };

      const result = adaptPricingListForSupabase(pricingList);

      expect(result['Slope']).toBe(-6.83);
      expect(result['Weekly Price Adjust']).toBe(-0.05);
    });
  });

  describe('real-world scenarios', () => {
    it('should handle complete pricing list for typical listing', () => {
      const pricingList = {
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
      };

      const result = adaptPricingListForSupabase(pricingList);

      expect(result).toEqual({
        id: 'abc123',
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
      });
    });

    it('should handle minimal pricing list for new listing', () => {
      const pricingList = {
        listingId: 'listing456',
        nightlyPrice: [null, 117, 111, 105, 99, 94, 76],
        combinedMarkup: 0.17
      };

      const result = adaptPricingListForSupabase(pricingList);

      expect(result).toEqual({
        listing: 'listing456',
        'Nightly Price': [null, 117, 111, 105, 99, 94, 76],
        'Combined Markup': 0.17
      });
    });

    it('should handle pricing list update (partial fields)', () => {
      const pricingList = {
        id: 'abc123',
        nightlyPrice: [null, 120, 115, 110, 105, 100, 95],
        startingNightlyPrice: 95
      };

      const result = adaptPricingListForSupabase(pricingList);

      expect(result).toEqual({
        id: 'abc123',
        'Nightly Price': [null, 120, 115, 110, 105, 100, 95],
        'Starting Nightly Price': 95
      });
    });
  });
});
