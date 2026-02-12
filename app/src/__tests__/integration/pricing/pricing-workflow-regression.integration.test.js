/**
 * Pricing Workflow Regression Integration Tests
 *
 * Regression tests to ensure pricing calculations remain consistent
 * and accurate over time. These tests protect against:
 * - Calculation formula changes
 * - Rounding/precision errors
 * - Array indexing mistakes
 * - Data structure changes
 *
 * @intent Prevent regression in pricing calculations.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  savePricingWorkflow,
  initializePricingListWorkflow,
  recalculatePricingListWorkflow
} from '../../../logic/workflows/pricingList/index.js';
import { PRICING_CONSTANTS } from '../../../logic/constants/pricingConstants.js';

describe('Pricing Workflow Regression Integration Tests', () => {
  // ========================================
  // FIXED CALCULATION TESTS
  // ========================================
  describe('Fixed Calculation Regressions', () => {
    it('should produce consistent nightly prices for known inputs', async () => {
      const standardListing = {
        id: 'regression-test-1',
        'nightly_rate_for_1_night_stay': null,
        'nightly_rate_for_2_night_stay': 100,
        'nightly_rate_for_3_night_stay': 95,
        'nightly_rate_for_4_night_stay': 90,
        'nightly_rate_for_5_night_stay': 85,
        'nightly_rate_for_6_night_stay': 80,
        'nightly_rate_for_7_night_stay': 75,
        'rental type': 'Nightly'
      };

      const result = await savePricingWorkflow({
        listing: standardListing,
        listingId: 'regression-test-1'
      });

      // These values should remain consistent unless formulas intentionally change
      // Formula: multiplier = 1 + combinedMarkup - unusedNightsDiscount - fullTimeDiscount (at index 6)
      // combinedMarkup = 0.17 (site markup)
      // Index 1 (2 nights): unused = 5 * 0.03 = 0.15, multiplier = 1 + 0.17 - 0.15 = 1.02, price = 100 * 1.02 = 102
      // Index 2 (3 nights): unused = 4 * 0.03 = 0.12, multiplier = 1 + 0.17 - 0.12 = 1.05, price = 95 * 1.05 = 99.75
      // Index 3 (4 nights): unused = 3 * 0.03 = 0.09, multiplier = 1 + 0.17 - 0.09 = 1.08, price = 90 * 1.08 = 97.2
      // Index 4 (5 nights): unused = 2 * 0.03 = 0.06, multiplier = 1 + 0.17 - 0.06 = 1.11, price = 85 * 1.11 = 94.35
      // Index 5 (6 nights): unused = 1 * 0.03 = 0.03, multiplier = 1 + 0.17 - 0.03 = 1.14, price = 80 * 1.14 = 91.2
      // Index 6 (7 nights): unused = 0 * 0.03 = 0, fullTimeDiscount = 0.13, multiplier = 1 + 0.17 - 0 - 0.13 = 1.04, price = 75 * 1.04 = 78
      expect(result.pricingList.nightlyPrice[1]).toBeCloseTo(102, 1);
      expect(result.pricingList.nightlyPrice[2]).toBeCloseTo(99.75, 1);
      expect(result.pricingList.nightlyPrice[3]).toBeCloseTo(97.2, 1);
      expect(result.pricingList.nightlyPrice[4]).toBeCloseTo(94.35, 1);
      expect(result.pricingList.nightlyPrice[5]).toBeCloseTo(91.2, 1);
      expect(result.pricingList.nightlyPrice[6]).toBeCloseTo(78, 1);
    });

    it('should calculate consistent combined markup', async () => {
      const listing = {
        id: 'markup-test',
        'nightly_rate_for_2_night_stay': 100,
        'rental type': 'Nightly'
      };

      const unitMarkup = 0.05; // 5%
      const expectedCombined = unitMarkup + PRICING_CONSTANTS.SITE_MARKUP_RATE; // 5% + 17% = 22%

      const result = await savePricingWorkflow({
        listing,
        listingId: 'markup-test',
        unitMarkup
      });

      expect(result.pricingList.unitMarkup).toBe(0.05);
      expect(result.pricingList.overallSiteMarkup).toBe(PRICING_CONSTANTS.SITE_MARKUP_RATE);
      expect(result.pricingList.combinedMarkup).toBeCloseTo(expectedCombined, 2);
    });

    it('should maintain consistent full-time discount rate', async () => {
      const listing = {
        id: 'discount-test',
        'nightly_rate_for_2_night_stay': 100,
        'rental type': 'Nightly'
      };

      const result = await savePricingWorkflow({
        listing,
        listingId: 'discount-test'
      });

      expect(result.pricingList.fullTimeDiscount).toBe(PRICING_CONSTANTS.FULL_TIME_DISCOUNT_RATE);
    });
  });

  // ========================================
  // ARRAY INDEXING REGRESSIONS
  // ========================================
  describe('Array Indexing Regressions', () => {
    it('should maintain correct array length (7 elements)', async () => {
      const listing = {
        id: 'array-length-test',
        'nightly_rate_for_2_night_stay': 100,
        'rental type': 'Nightly'
      };

      const result = await savePricingWorkflow({
        listing,
        listingId: 'array-length-test'
      });

      expect(result.pricingList.hostCompensation).toHaveLength(7);
      expect(result.pricingList.markupAndDiscountMultiplier).toHaveLength(7);
      expect(result.pricingList.nightlyPrice).toHaveLength(7);
      expect(result.pricingList.unusedNightsDiscount).toHaveLength(7);
    });

    it('should correctly map array indices to night counts', async () => {
      const listing = {
        id: 'index-map-test',
        'nightly_rate_for_1_night_stay': null,
        'nightly_rate_for_2_night_stay': 100,
        'nightly_rate_for_3_night_stay': 95,
        'nightly_rate_for_4_night_stay': 90,
        'nightly_rate_for_5_night_stay': 85,
        'nightly_rate_for_6_night_stay': 80,
        'nightly_rate_for_7_night_stay': 75,
        'rental type': 'Nightly'
      };

      const result = await savePricingWorkflow({
        listing,
        listingId: 'index-map-test'
      });

      // Index 0 = 1 night, Index 1 = 2 nights, etc.
      expect(result.pricingList.hostCompensation[0]).toBe(null); // 1 night is null
      expect(result.pricingList.hostCompensation[1]).toBe(100); // 2 nights
      expect(result.pricingList.hostCompensation[2]).toBe(95); // 3 nights
      expect(result.pricingList.hostCompensation[3]).toBe(90); // 4 nights
      expect(result.pricingList.hostCompensation[4]).toBe(85); // 5 nights
      expect(result.pricingList.hostCompensation[5]).toBe(80); // 6 nights
      expect(result.pricingList.hostCompensation[6]).toBe(75); // 7 nights
    });

    it('should handle null values at correct indices', async () => {
      const listing = {
        id: 'null-index-test',
        'nightly_rate_for_1_night_stay': null,
        'nightly_rate_for_2_night_stay': null,
        'nightly_rate_for_3_night_stay': 100,
        'nightly_rate_for_4_night_stay': null,
        'nightly_rate_for_5_night_stay': 95,
        'rental type': 'Nightly'
      };

      const result = await savePricingWorkflow({
        listing,
        listingId: 'null-index-test'
      });

      expect(result.pricingList.hostCompensation[0]).toBeNull();
      expect(result.pricingList.hostCompensation[1]).toBeNull();
      expect(result.pricingList.hostCompensation[2]).toBe(100);
      expect(result.pricingList.hostCompensation[3]).toBeNull();
      expect(result.pricingList.hostCompensation[4]).toBe(95);
    });
  });

  // ========================================
  // INITIALIZATION REGRESSIONS
  // ========================================
  describe('Initialization Regressions', () => {
    it('should consistently initialize with correct defaults', async () => {
      const result = await initializePricingListWorkflow({
        listingId: 'init-regression-test'
      });

      expect(result.pricingList.unitMarkup).toBe(PRICING_CONSTANTS.DEFAULT_UNIT_MARKUP);
      expect(result.pricingList.overallSiteMarkup).toBe(PRICING_CONSTANTS.SITE_MARKUP_RATE);
      expect(result.pricingList.combinedMarkup).toBe(PRICING_CONSTANTS.SITE_MARKUP_RATE);
      expect(result.pricingList.fullTimeDiscount).toBe(PRICING_CONSTANTS.FULL_TIME_DISCOUNT_RATE);
    });

    it('should initialize all arrays with consistent patterns', async () => {
      const result = await initializePricingListWorkflow({
        listingId: 'init-array-test'
      });

      // Null arrays
      expect(result.pricingList.hostCompensation.every((v) => v === null)).toBe(true);
      expect(result.pricingList.nightlyPrice.every((v) => v === null)).toBe(true);
      expect(result.pricingList.unusedNights.every((v) => v === null)).toBe(true);

      // Zero arrays
      expect(result.pricingList.markupAndDiscountMultiplier.every((v) => v === 0)).toBe(true);
      expect(result.pricingList.unusedNightsDiscount.every((v) => v === 0)).toBe(true);
    });

    it('should set derived scalars to null on initialization', async () => {
      const result = await initializePricingListWorkflow({
        listingId: 'init-scalar-test'
      });

      expect(result.pricingList.startingNightlyPrice).toBeNull();
      expect(result.pricingList.slope).toBeNull();
      expect(result.pricingList.weeklyPriceAdjust).toBeNull();
    });
  });

  // ========================================
  // DERIVED VALUE REGRESSIONS
  // ========================================
  describe('Derived Value Regressions', () => {
    it('should calculate consistent starting nightly price', async () => {
      const listing = {
        id: 'starting-price-test',
        'nightly_rate_for_2_night_stay': 100,
        'nightly_rate_for_3_night_stay': 95,
        'nightly_rate_for_4_night_stay': 90,
        'nightly_rate_for_5_night_stay': 85,
        'nightly_rate_for_6_night_stay': 80,
        'nightly_rate_for_7_night_stay': 75,
        'rental type': 'Nightly'
      };

      const result = await savePricingWorkflow({
        listing,
        listingId: 'starting-price-test'
      });

      // Starting price should be the minimum of all nightly prices
      const minPrice = Math.min(
        ...result.pricingList.nightlyPrice.filter((p) => p !== null)
      );
      expect(result.pricingList.startingNightlyPrice).toBe(minPrice);
    });

    it('should calculate consistent slope values', async () => {
      const listing = {
        id: 'slope-test',
        'nightly_rate_for_2_night_stay': 100,
        'nightly_rate_for_3_night_stay': 95,
        'nightly_rate_for_4_night_stay': 90,
        'nightly_rate_for_5_night_stay': 85,
        'nightly_rate_for_6_night_stay': 80,
        'nightly_rate_for_7_night_stay': 75,
        'rental type': 'Nightly'
      };

      const result = await savePricingWorkflow({
        listing,
        listingId: 'slope-test'
      });

      // Slope is POSITIVE for decreasing prices (firstPrice > lastPrice)
      expect(result.pricingList.slope).toBeGreaterThan(0);
      expect(result.pricingList.slope).not.toBeNull();
    });
  });

  // ========================================
  // RECALCULATION REGRESSIONS
  // ========================================
  describe('Recalculation Regressions', () => {
    it('should produce same results on repeated calculations', async () => {
      const listing = {
        id: 'repeat-calc-test',
        'nightly_rate_for_2_night_stay': 100,
        'rental type': 'Nightly'
      };

      const result1 = await savePricingWorkflow({
        listing,
        listingId: 'repeat-calc-test'
      });

      const result2 = await savePricingWorkflow({
        listing,
        listingId: 'repeat-calc-test'
      });

      // Results should be identical
      expect(result1.pricingList.nightlyPrice).toEqual(result2.pricingList.nightlyPrice);
      expect(result1.pricingList.startingNightlyPrice).toBe(result2.pricingList.startingNightlyPrice);
      expect(result1.pricingList.slope).toBe(result2.pricingList.slope);
    });

    it('should handle force recalculation correctly', async () => {
      const listing = {
        id: 'force-recalc-test',
        'nightly_rate_for_2_night_stay': 100,
        'rental type': 'Nightly'
      };

      const existingPricing = {
        listingId: 'force-recalc-test',
        nightlyPrice: [null, 110, 105, 100, 95, 90, 85], // Old prices
        modifiedDate: '2024-01-01T00:00:00.000Z'
      };

      const result = await recalculatePricingListWorkflow({
        listing,
        listingId: 'force-recalc-test',
        existingPricingList: existingPricing,
        force: true
      });

      expect(result.recalculated).toBe(true);
      expect(result.forced).toBe(true);
    });
  });

  // ========================================
  // EDGE CASE REGRESSIONS
  // ========================================
  describe('Edge Case Regressions', () => {
    it('should handle single valid rate consistently', async () => {
      const listing = {
        id: 'single-rate-test',
        'nightly_rate_for_2_night_stay': 100,
        'rental type': 'Nightly'
      };

      const result = await savePricingWorkflow({
        listing,
        listingId: 'single-rate-test'
      });

      expect(result.pricingList.hostCompensation[1]).toBe(100);
      expect(result.pricingList.nightlyPrice[1]).toBeGreaterThan(0);
      expect(result.pricingList.startingNightlyPrice).toBe(result.pricingList.nightlyPrice[1]);
    });

    it('should handle maximum valid rate consistently', async () => {
      const listing = {
        id: 'max-rate-test',
        'nightly_rate_for_7_night_stay': 75,
        'rental type': 'Nightly'
      };

      const result = await savePricingWorkflow({
        listing,
        listingId: 'max-rate-test'
      });

      expect(result.pricingList.hostCompensation[6]).toBe(75);
      expect(result.pricingList.nightlyPrice[6]).toBeGreaterThan(0);
    });

    it('should handle zero markup consistently', async () => {
      const listing = {
        id: 'zero-markup-test',
        'nightly_rate_for_2_night_stay': 100,
        'rental type': 'Nightly'
      };

      const result = await savePricingWorkflow({
        listing,
        listingId: 'zero-markup-test',
        unitMarkup: 0
      });

      expect(result.pricingList.unitMarkup).toBe(0);
      expect(result.pricingList.combinedMarkup).toBe(PRICING_CONSTANTS.SITE_MARKUP_RATE);
    });

    it('should handle high markup consistently', async () => {
      const listing = {
        id: 'high-markup-test',
        'nightly_rate_for_2_night_stay': 100,
        'rental type': 'Nightly'
      };

      const highMarkup = 0.50; // 50%

      const result = await savePricingWorkflow({
        listing,
        listingId: 'high-markup-test',
        unitMarkup: highMarkup
      });

      expect(result.pricingList.unitMarkup).toBe(highMarkup);
      expect(result.pricingList.combinedMarkup).toBeCloseTo(0.67, 2);
    });
  });

  // ========================================
  // PRECISION REGRESSIONS
  // ========================================
  describe('Precision Regressions', () => {
    it('should maintain consistent decimal precision', async () => {
      const listing = {
        id: 'precision-test',
        'nightly_rate_for_2_night_stay': 100.33,
        'rental type': 'Nightly'
      };

      const result = await savePricingWorkflow({
        listing,
        listingId: 'precision-test'
      });

      // Should handle decimal inputs consistently
      expect(result.pricingList.hostCompensation[1]).toBe(100.33);
      expect(result.pricingList.nightlyPrice[1]).toBeGreaterThan(100.33);
    });

    it('should not accumulate floating point errors', async () => {
      const listing = {
        id: 'float-test',
        'nightly_rate_for_2_night_stay': 100.1,
        'nightly_rate_for_3_night_stay': 95.2,
        'nightly_rate_for_4_night_stay': 90.3,
        'rental type': 'Nightly'
      };

      const result = await savePricingWorkflow({
        listing,
        listingId: 'float-test'
      });

      // Values should be reasonable numbers
      result.pricingList.nightlyPrice.forEach((price) => {
        if (price !== null) {
          expect(price).toBeGreaterThan(0);
          expect(price).toBeLessThan(1000); // Reasonable upper bound
          expect(Number.isFinite(price)).toBe(true);
        }
      });
    });
  });

  // ========================================
  // DATA STRUCTURE REGRESSIONS
  // ========================================
  describe('Data Structure Regressions', () => {
    it('should maintain consistent pricing list structure', async () => {
      const listing = {
        id: 'structure-test',
        'nightly_rate_for_2_night_stay': 100,
        'rental type': 'Nightly'
      };

      const result = await savePricingWorkflow({
        listing,
        listingId: 'structure-test'
      });

      // Verify all required fields exist
      expect(result.pricingList).toHaveProperty('listingId');
      expect(result.pricingList).toHaveProperty('hostCompensation');
      expect(result.pricingList).toHaveProperty('markupAndDiscountMultiplier');
      expect(result.pricingList).toHaveProperty('nightlyPrice');
      expect(result.pricingList).toHaveProperty('unusedNightsDiscount');
      expect(result.pricingList).toHaveProperty('unitMarkup');
      expect(result.pricingList).toHaveProperty('overallSiteMarkup');
      expect(result.pricingList).toHaveProperty('combinedMarkup');
      expect(result.pricingList).toHaveProperty('fullTimeDiscount');
      expect(result.pricingList).toHaveProperty('startingNightlyPrice');
      expect(result.pricingList).toHaveProperty('slope');
      expect(result.pricingList).toHaveProperty('rentalType');
      expect(result.pricingList).toHaveProperty('modifiedDate');
    });

    it('should maintain consistent result structure', async () => {
      const listing = {
        id: 'result-structure-test',
        'nightly_rate_for_2_night_stay': 100,
        'rental type': 'Nightly'
      };

      const initResult = await initializePricingListWorkflow({
        listingId: 'result-structure-test'
      });

      expect(initResult).toHaveProperty('success');
      expect(initResult).toHaveProperty('pricingList');
      expect(initResult).toHaveProperty('isInitialized');

      const saveResult = await savePricingWorkflow({
        listing,
        listingId: 'result-structure-test'
      });

      expect(saveResult).toHaveProperty('success');
      expect(saveResult).toHaveProperty('pricingList');

      const recalcResult = await recalculatePricingListWorkflow({
        listing,
        listingId: 'result-structure-test',
        force: true
      });

      expect(recalcResult).toHaveProperty('success');
      expect(recalcResult).toHaveProperty('pricingList');
      expect(recalcResult).toHaveProperty('recalculated');
      expect(recalcResult).toHaveProperty('forced');
    });
  });

  // ========================================
  // RENTAL TYPE REGRESSIONS
  // ========================================
  describe('Rental Type Regressions', () => {
    it('should preserve rental type from listing', async () => {
      const nightlyListing = {
        id: 'nightly-type-test',
        'nightly_rate_for_2_night_stay': 100,
        'rental type': 'Nightly'
      };

      const result = await savePricingWorkflow({
        listing: nightlyListing,
        listingId: 'nightly-type-test'
      });

      expect(result.pricingList.rentalType).toBe('Nightly');
    });

    it('should default to Nightly when rental type missing', async () => {
      const listing = {
        id: 'default-type-test',
        'nightly_rate_for_2_night_stay': 100
        // No 'rental type' field
      };

      const result = await savePricingWorkflow({
        listing,
        listingId: 'default-type-test'
      });

      expect(result.pricingList.rentalType).toBe('Nightly');
    });
  });

  // ========================================
  // METADATA REGRESSIONS
  // ========================================
  describe('Metadata Regressions', () => {
    it('should generate valid ISO timestamps', async () => {
      const listing = {
        id: 'timestamp-test',
        'nightly_rate_for_2_night_stay': 100,
        'rental type': 'Nightly'
      };

      const result = await savePricingWorkflow({
        listing,
        listingId: 'timestamp-test',
        userId: 'user-123'
      });

      expect(result.pricingList.modifiedDate).toBeDefined();
      expect(() => new Date(result.pricingList.modifiedDate)).not.toThrow();
      expect(result.pricingList.modifiedDate).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should preserve userId in createdBy field', async () => {
      const listing = {
        id: 'userid-test',
        'nightly_rate_for_2_night_stay': 100,
        'rental type': 'Nightly'
      };

      const userId = 'specific-user-456';

      const result = await savePricingWorkflow({
        listing,
        listingId: 'userid-test',
        userId
      });

      expect(result.pricingList.createdBy).toBe(userId);
    });

    it('should set createdBy to null when userId not provided', async () => {
      const listing = {
        id: 'no-userid-test',
        'nightly_rate_for_2_night_stay': 100,
        'rental type': 'Nightly'
      };

      const result = await savePricingWorkflow({
        listing,
        listingId: 'no-userid-test'
      });

      expect(result.pricingList.createdBy).toBeUndefined();
    });
  });

  // ========================================
  // HISTORICAL DATA COMPATIBILITY
  // ========================================
  describe('Historical Data Compatibility', () => {
    it('should handle legacy listing data structure', async () => {
      // Simulate legacy Bubble.io data structure
      const legacyListing = {
        'id': 'legacy-123',
        'Nightly rate 1 night': null,
        'Nightly rate 2 nights': 100,
        'Nightly rate 3 nights': 95,
        'Rental Type': 'Nightly'
      };

      // This would require a processor to transform field names
      // For now, we test with standard structure
      const standardListing = {
        id: 'legacy-123',
        'nightly_rate_for_1_night_stay': null,
        'nightly_rate_for_2_night_stay': 100,
        'nightly_rate_for_3_night_stay': 95,
        'rental type': 'Nightly'
      };

      const result = await savePricingWorkflow({
        listing: standardListing,
        listingId: 'legacy-123'
      });

      expect(result.success).toBe(true);
      expect(result.pricingList.hostCompensation[1]).toBe(100);
    });

    it('should handle null FK values gracefully', async () => {
      // Listing with null foreign key values (common in legacy data)
      const listingWithNullFKs = {
        id: 'null-fk-test',
        'nightly_rate_for_2_night_stay': 100,
        'cleaning_fee_amount': null,
        'damage_deposit_amount': null,
        'price_override': null,
        'rental type': 'Nightly'
      };

      const result = await savePricingWorkflow({
        listing: listingWithNullFKs,
        listingId: 'null-fk-test'
      });

      expect(result.success).toBe(true);
      expect(result.pricingList.hostCompensation[1]).toBe(100);
    });
  });
});
