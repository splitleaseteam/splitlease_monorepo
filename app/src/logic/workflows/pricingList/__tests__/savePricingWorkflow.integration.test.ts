/**
 * Integration Tests: Save Pricing Workflow
 *
 * Tests the complete pricing calculation and persistence workflow.
 * Verifies:
 * - Full workflow step sequencing from listing to pricing list
 * - Integration of calculators, processors, and rules layers
 * - Proper error propagation from each layer
 * - Persistence callback behavior with calculated data
 * - Complete pricing list structure with all fields
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { savePricingWorkflow } from '../savePricingWorkflow.js';
import { PRICING_CONSTANTS } from '../../../constants/pricingConstants.js';

// Mock data for testing
const mockValidListing = {
  id: 'test-listing-1',
  'nightly_rate_1_night': null,
  'nightly_rate_2_nights': 100,
  'nightly_rate_3_nights': 95,
  'nightly_rate_4_nights': 90,
  'nightly_rate_5_nights': 85,
  'nightly_rate_6_nights': 80,
  'nightly_rate_7_nights': 75,
  'cleaning_fee': 50,
  'damage_deposit': 200,
  'price_override': null,
  'rental type': 'Nightly'
};

const mockListingAllNullRates = {
  id: 'test-listing-2',
  'nightly_rate_1_night': null,
  'nightly_rate_2_nights': null,
  'nightly_rate_3_nights': null,
  'nightly_rate_4_nights': null,
  'nightly_rate_5_nights': null,
  'nightly_rate_6_nights': null,
  'nightly_rate_7_nights': null,
  'rental type': 'Nightly'
};

const mockListingPartialRates = {
  id: 'test-listing-3',
  'nightly_rate_1_night': null,
  'nightly_rate_2_nights': 100,
  'nightly_rate_3_nights': null,
  'nightly_rate_4_nights': 90,
  'nightly_rate_5_nights': null,
  'nightly_rate_6_nights': 80,
  'nightly_rate_7_nights': null,
  'rental type': 'Nightly'
};

describe('Save Pricing Workflow Integration Tests', () => {
  let mockPersistCallback;

  beforeEach(() => {
    mockPersistCallback = vi.fn().mockResolvedValue({ success: true });
    vi.clearAllMocks();
  });

  // ========================================
  // WORKFLOW SEQUENCING TESTS
  // ========================================
  describe('Workflow Step Sequencing', () => {
    it('should execute all workflow steps in correct order', async () => {
      const persistCallback = vi.fn().mockImplementation(async (data) => {
        // Verify all calculations are complete before persistence
        expect(data.hostCompensation).toBeDefined();
        expect(data.nightlyPrice).toBeDefined();
        expect(data.startingNightlyPrice).toBeDefined();
        expect(data.slope).toBeDefined();
        return { success: true };
      });

      const result = await savePricingWorkflow({
        listing: mockValidListing,
        listingId: 'test-listing-1',
        onPersist: persistCallback
      });

      expect(result.success).toBe(true);
      expect(result.pricingList).toBeDefined();
    });

    it('should validate listing before calculation', async () => {
      await expect(
        savePricingWorkflow({
          listing: mockListingAllNullRates,
          listingId: 'test-listing-2'
        })
      ).rejects.toThrow(
        'savePricingWorkflow: Listing does not have valid host rates'
      );
    });

    it('should extract host rates from listing', async () => {
      const result = await savePricingWorkflow({
        listing: mockValidListing,
        listingId: 'test-listing-1'
      });

      // Verify host compensation is calculated from listing rates
      expect(result.pricingList.hostCompensation).toBeDefined();
      expect(result.pricingList.hostCompensation).toHaveLength(7);
      // Index 1 (2 nights) should have value from nightly_rate_2_nights
      expect(result.pricingList.hostCompensation[1]).toBe(100);
    });

    it('should calculate combined markup from unit and site markups', async () => {
      const customUnitMarkup = 0.05;

      const result = await savePricingWorkflow({
        listing: mockValidListing,
        listingId: 'test-listing-1',
        unitMarkup: customUnitMarkup
      });

      expect(result.pricingList.unitMarkup).toBe(customUnitMarkup);
      expect(result.pricingList.overallSiteMarkup).toBe(PRICING_CONSTANTS.SITE_MARKUP_RATE);
      // Combined markup is rounded to avoid floating point issues
      expect(result.pricingList.combinedMarkup).toBeCloseTo(
        customUnitMarkup + PRICING_CONSTANTS.SITE_MARKUP_RATE,
        2
      );
    });

    it('should calculate all pricing arrays', async () => {
      const result = await savePricingWorkflow({
        listing: mockValidListing,
        listingId: 'test-listing-1'
      });

      expect(result.pricingList.hostCompensation).toHaveLength(7);
      expect(result.pricingList.markupAndDiscountMultiplier).toHaveLength(7);
      expect(result.pricingList.nightlyPrice).toHaveLength(7);
      expect(result.pricingList.unusedNightsDiscount).toHaveLength(7);
    });

    it('should calculate derived scalar values', async () => {
      const result = await savePricingWorkflow({
        listing: mockValidListing,
        listingId: 'test-listing-1'
      });

      expect(result.pricingList.startingNightlyPrice).toBeDefined();
      expect(result.pricingList.startingNightlyPrice).not.toBeNull();
      expect(result.pricingList.slope).toBeDefined();
      expect(result.pricingList.slope).not.toBeNull();
    });
  });

  // ========================================
  // CALCULATOR INTEGRATION TESTS
  // ========================================
  describe('Calculator Layer Integration', () => {
    it('should use hostCompensation calculator correctly', async () => {
      const result = await savePricingWorkflow({
        listing: mockValidListing,
        listingId: 'test-listing-1'
      });

      // Host compensation should match listing rates
      expect(result.pricingList.hostCompensation[1]).toBe(100); // 2 nights
      expect(result.pricingList.hostCompensation[2]).toBe(95);  // 3 nights
      expect(result.pricingList.hostCompensation[3]).toBe(90);  // 4 nights
    });

    it('should use unusedNightsDiscount calculator correctly', async () => {
      const result = await savePricingWorkflow({
        listing: mockValidListing,
        listingId: 'test-listing-1'
      });

      // unusedNightsDiscount is calculated per unused night (0-6 unused nights)
      // At index 0 (1 night booked): 6 unused * 0.03 = 0.18
      // At index 6 (7 nights booked): 0 unused * 0.03 = 0
      expect(result.pricingList.unusedNightsDiscount[0]).toBe(0.18); // 6 unused nights
      expect(result.pricingList.unusedNightsDiscount[1]).toBe(0.15); // 5 unused nights
      expect(result.pricingList.unusedNightsDiscount[2]).toBe(0.12); // 4 unused nights
      expect(result.pricingList.unusedNightsDiscount[3]).toBe(0.09); // 3 unused nights
      expect(result.pricingList.unusedNightsDiscount[4]).toBe(0.06); // 2 unused nights
      expect(result.pricingList.unusedNightsDiscount[5]).toBe(0.03); // 1 unused night
      expect(result.pricingList.unusedNightsDiscount[6]).toBe(0);    // 0 unused nights
    });

    it('should use markupAndDiscountMultipliers calculator correctly', async () => {
      const result = await savePricingWorkflow({
        listing: mockValidListing,
        listingId: 'test-listing-1'
      });

      // Multipliers should be calculated from combined markup
      result.pricingList.markupAndDiscountMultiplier.forEach((multiplier) => {
        expect(multiplier).toBeGreaterThan(0);
        expect(typeof multiplier).toBe('number');
      });
    });

    it('should use nightlyPrices calculator correctly', async () => {
      const result = await savePricingWorkflow({
        listing: mockValidListing,
        listingId: 'test-listing-1'
      });

      // Nightly prices should be derived from host compensation and multipliers
      expect(result.pricingList.nightlyPrice[1]).toBeGreaterThan(0);
      expect(result.pricingList.nightlyPrice[2]).toBeGreaterThan(0);
    });

    it('should use lowestNightlyPrice calculator correctly', async () => {
      const result = await savePricingWorkflow({
        listing: mockValidListing,
        listingId: 'test-listing-1'
      });

      const minPrice = Math.min(
        ...result.pricingList.nightlyPrice.filter((p) => p !== null)
      );
      expect(result.pricingList.startingNightlyPrice).toBe(minPrice);
    });

    it('should use slope calculator correctly', async () => {
      const result = await savePricingWorkflow({
        listing: mockValidListing,
        listingId: 'test-listing-1'
      });

      // Slope should be calculated (negative for decreasing prices)
      expect(result.pricingList.slope).toBeDefined();
      expect(typeof result.pricingList.slope).toBe('number');
    });
  });

  // ========================================
  // PROCESSOR INTEGRATION TESTS
  // ========================================
  describe('Processor Layer Integration', () => {
    it('should extract host rates using processor', async () => {
      const result = await savePricingWorkflow({
        listing: mockValidListing,
        listingId: 'test-listing-1'
      });

      // Verify processor extracted rates correctly
      expect(result.pricingList.hostCompensation[1]).toBe(
        mockValidListing.nightly_rate_for_2_night_stay
      );
    });

    it('should handle partial rate listings', async () => {
      const result = await savePricingWorkflow({
        listing: mockListingPartialRates,
        listingId: 'test-listing-3'
      });

      expect(result.success).toBe(true);
      // Some indices should be null, some should have values
      expect(result.pricingList.hostCompensation[1]).toBe(100);
      expect(result.pricingList.hostCompensation[2]).toBeNull();
    });
  });

  // ========================================
  // RULE LAYER INTEGRATION TESTS
  // ========================================
  describe('Rule Layer Integration', () => {
    it('should enforce canCalculatePricing rule', async () => {
      await expect(
        savePricingWorkflow({
          listing: mockListingAllNullRates,
          listingId: 'test-listing-2'
        })
      ).rejects.toThrow();
    });

    it('should reject listings with no valid rates', async () => {
      const invalidListing = {
        id: 'invalid-listing',
        'nightly_rate_1_night': null,
        'nightly_rate_2_nights': null,
        'rental type': 'Nightly'
      };

      await expect(
        savePricingWorkflow({
          listing: invalidListing,
          listingId: 'invalid-listing'
        })
      ).rejects.toThrow('does not have valid host rates');
    });
  });

  // ========================================
  // PERSISTENCE CALLBACK TESTS
  // ========================================
  describe('Persistence Callback Behavior', () => {
    it('should call onPersist with complete pricing data', async () => {
      await savePricingWorkflow({
        listing: mockValidListing,
        listingId: 'test-listing-1',
        onPersist: mockPersistCallback
      });

      expect(mockPersistCallback).toHaveBeenCalledTimes(1);

      const persistedData = mockPersistCallback.mock.calls[0][0];
      expect(persistedData).toMatchObject({
        listingId: 'test-listing-1',
        unitMarkup: expect.any(Number),
        overallSiteMarkup: expect.any(Number),
        combinedMarkup: expect.any(Number),
        fullTimeDiscount: expect.any(Number),
        startingNightlyPrice: expect.any(Number),
        slope: expect.any(Number),
        rentalType: 'Nightly',
        modifiedDate: expect.any(String)
      });
    });

    it('should include all arrays in persistence data', async () => {
      await savePricingWorkflow({
        listing: mockValidListing,
        listingId: 'test-listing-1',
        onPersist: mockPersistCallback
      });

      const persistedData = mockPersistCallback.mock.calls[0][0];
      expect(persistedData.hostCompensation).toHaveLength(7);
      expect(persistedData.markupAndDiscountMultiplier).toHaveLength(7);
      expect(persistedData.nightlyPrice).toHaveLength(7);
      expect(persistedData.unusedNightsDiscount).toHaveLength(7);
    });

    it('should not call onPersist when callback not provided', async () => {
      await savePricingWorkflow({
        listing: mockValidListing,
        listingId: 'test-listing-1'
      });

      expect(mockPersistCallback).not.toHaveBeenCalled();
    });

    it('should propagate persistence errors', async () => {
      const failingCallback = vi.fn().mockRejectedValue(
        new Error('Database write failed')
      );

      await expect(
        savePricingWorkflow({
          listing: mockValidListing,
          listingId: 'test-listing-1',
          onPersist: failingCallback
        })
      ).rejects.toThrow('Database write failed');
    });

    it('should include userId in persisted data when provided', async () => {
      await savePricingWorkflow({
        listing: mockValidListing,
        listingId: 'test-listing-1',
        userId: 'user-456',
        onPersist: mockPersistCallback
      });

      const persistedData = mockPersistCallback.mock.calls[0][0];
      expect(persistedData.createdBy).toBe('user-456');
    });
  });

  // ========================================
  // ERROR PROPAGATION TESTS
  // ========================================
  describe('Error Propagation', () => {
    it('should throw clear error for invalid listing', async () => {
      await expect(
        savePricingWorkflow({
          listing: mockListingAllNullRates,
          listingId: 'test-listing-2'
        })
      ).rejects.toThrow(
        'savePricingWorkflow: Listing does not have valid host rates'
      );
    });

    it('should propagate calculator errors', async () => {
      const invalidListing = {
        id: 'invalid',
        'nightly_rate_2_nights': 'not a number',
        'rental type': 'Nightly'
      };

      await expect(
        savePricingWorkflow({
          listing: invalidListing,
          listingId: 'invalid'
        })
      ).rejects.toThrow();
    });

    it('should handle persistence failure gracefully', async () => {
      const networkErrorCallback = vi.fn().mockRejectedValue(
        new Error('Network timeout')
      );

      await expect(
        savePricingWorkflow({
          listing: mockValidListing,
          listingId: 'test-listing-1',
          onPersist: networkErrorCallback
        })
      ).rejects.toThrow('Network timeout');
    });
  });

  // ========================================
  // RESULT STRUCTURE TESTS
  // ========================================
  describe('Result Structure', () => {
    it('should return success flag', async () => {
      const result = await savePricingWorkflow({
        listing: mockValidListing,
        listingId: 'test-listing-1'
      });

      expect(result.success).toBe(true);
    });

    it('should return complete pricing list', async () => {
      const result = await savePricingWorkflow({
        listing: mockValidListing,
        listingId: 'test-listing-1'
      });

      expect(result.pricingList).toBeDefined();
      expect(result.pricingList.listingId).toBe('test-listing-1');
    });

    it('should include metadata in pricing list', async () => {
      const result = await savePricingWorkflow({
        listing: mockValidListing,
        listingId: 'test-listing-1',
        userId: 'user-789'
      });

      expect(result.pricingList.createdBy).toBe('user-789');
      expect(result.pricingList.rentalType).toBe('Nightly');
      expect(result.pricingList.modifiedDate).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  // ========================================
  // LAYER INTEGRATION TESTS
  // ========================================
  describe('Complete Layer Integration', () => {
    it('should integrate all four layers correctly', async () => {
      // Rules layer validates
      const validListing = mockValidListing;

      // Processor layer extracts
      // Calculator layer computes
      // Workflow orchestrates
      const result = await savePricingWorkflow({
        listing: validListing,
        listingId: 'test-listing-1',
        unitMarkup: 0.03
      });

      // Verify all layers contributed
      expect(result.pricingList.hostCompensation).toBeDefined(); // From processor + calculator
      expect(result.pricingList.nightlyPrice).toBeDefined(); // From calculator
      expect(result.pricingList.slope).toBeDefined(); // From calculator
      expect(result.pricingList.combinedMarkup).toBeCloseTo(0.20, 1); // From calculator (0.03 + 0.17)
    });

    it('should maintain data flow integrity through all layers', async () => {
      const result = await savePricingWorkflow({
        listing: mockValidListing,
        listingId: 'test-listing-1'
      });

      // Verify data flow: listing rates -> host compensation -> nightly prices
      const hostRate = mockValidListing.nightly_rate_for_2_night_stay;
      const hostComp = result.pricingList.hostCompensation[1];
      const nightlyPrice = result.pricingList.nightlyPrice[1];

      expect(hostComp).toBe(hostRate);
      expect(nightlyPrice).toBeGreaterThan(hostComp); // Should be marked up
    });
  });

  // ========================================
  // EDGE CASES
  // ========================================
  describe('Edge Cases', () => {
    it('should handle listing with minimum valid rates', async () => {
      const minListing = {
        id: 'min-listing',
        'nightly_rate_2_nights': 50,
        'rental type': 'Nightly'
      };

      const result = await savePricingWorkflow({
        listing: minListing,
        listingId: 'min-listing'
      });

      expect(result.success).toBe(true);
      expect(result.pricingList.hostCompensation[1]).toBe(50);
    });

    it('should handle zero unit markup', async () => {
      const result = await savePricingWorkflow({
        listing: mockValidListing,
        listingId: 'test-listing-1',
        unitMarkup: 0
      });

      expect(result.pricingList.unitMarkup).toBe(0);
      expect(result.pricingList.combinedMarkup).toBe(PRICING_CONSTANTS.SITE_MARKUP_RATE);
    });

    it('should handle high unit markup', async () => {
      const result = await savePricingWorkflow({
        listing: mockValidListing,
        listingId: 'test-listing-1',
        unitMarkup: 0.50
      });

      expect(result.pricingList.unitMarkup).toBe(0.50);
      expect(result.pricingList.combinedMarkup).toBeCloseTo(0.67, 2);
    });
  });
});
