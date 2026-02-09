/**
 * End-to-End Integration Tests: Pricing Workflow
 *
 * Tests the complete pricing system from listing to display.
 * Verifies full stack integration:
 * - Listing data extraction
 * - Calculation pipeline (all four layers)
 * - Persistence to database (mocked)
 * - Display-ready pricing data
 *
 * @intent Verify entire pricing workflow works as integrated system.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  initializePricingListWorkflow,
  savePricingWorkflow,
  recalculatePricingListWorkflow
} from '../../../logic/workflows/pricingList/index.js';
import { PRICING_CONSTANTS } from '../../../logic/constants/pricingConstants.js';

// Mock Edge Function for persistence
vi.mock('../../../lib/supabase.js', () => ({
  supabase: {
    functions: {
      invoke: vi.fn()
    }
  }
}));

describe('End-to-End Pricing Workflow Integration Tests', () => {
  let mockPersistCallback;
  let mockEdgeFunction;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock persistence callback (simulating Edge Function call)
    // Use a simple spy that doesn't modify the data
    mockPersistCallback = vi.fn();

    // Mock Edge Function directly
    mockEdgeFunction = vi.fn().mockResolvedValue({
      data: { success: true },
      error: null
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ========================================
  // COMPLETE NEW LISTING FLOW
  // ========================================
  describe('Complete New Listing Flow', () => {
    const newListing = {
      id: 'new-listing-123',
      'nightly_rate_for_1_night_stay': null,
      'nightly_rate_for_2_night_stay': 120,
      'nightly_rate_for_3_night_stay': 115,
      'nightly_rate_for_4_night_stay': 110,
      'nightly_rate_for_5_night_stay': 105,
      'nightly_rate_for_6_night_stay': 100,
      'nightly_rate_for_7_night_stay': 95,
      'cleaning_fee_amount': 60,
      'damage_deposit_amount': 250,
      'price_override': null,
      'rental type': 'Nightly'
    };

    it('should complete full workflow from listing to pricing display', async () => {
      // Step 1: Initialize empty pricing list (when listing first created)
      const initResult = await initializePricingListWorkflow({
        listingId: newListing.id,
        userId: 'host-user-456'
      });

      expect(initResult.success).toBe(true);
      expect(initResult.isInitialized).toBe(true);
      expect(initResult.pricingList.nightlyPrice.every((p) => p === null)).toBe(true);

      // Step 2: Save pricing (after host sets rates)
      const saveResult = await savePricingWorkflow({
        listing: newListing,
        listingId: newListing.id,
        userId: 'host-user-456',
        onPersist: mockPersistCallback
      });

      expect(saveResult.success).toBe(true);
      expect(saveResult.pricingList.nightlyPrice.some((p) => p !== null)).toBe(true);
      expect(saveResult.pricingList.startingNightlyPrice).toBeGreaterThan(0);

      // Step 3: Verify persistence was called
      expect(mockPersistCallback).toHaveBeenCalledTimes(1);
      const persistedData = mockPersistCallback.mock.calls[0][0];

      // Verify the persisted data has the expected structure
      expect(persistedData.listingId).toBe(newListing.id);
      expect(persistedData.nightlyPrice).toBeDefined();
      expect(Array.isArray(persistedData.nightlyPrice)).toBe(true);

      // Step 4: Verify saveResult data is also correct
      expect(saveResult.pricingList.nightlyPrice).toBeDefined();
      expect(Array.isArray(saveResult.pricingList.nightlyPrice)).toBe(true);
      expect(saveResult.pricingList.nightlyPrice.length).toBe(7);
      expect(saveResult.pricingList.startingNightlyPrice).toBeGreaterThan(0);
    });

    it('should handle realistic host workflow', async () => {
      // Host creates new listing (no rates yet)
      const listingId = 'host-new-listing';
      const hostId = 'host-789';

      // Initialize placeholder
      const initResult = await initializePricingListWorkflow({
        listingId,
        userId: hostId,
        onPersist: mockPersistCallback
      });

      expect(initResult.pricingList.listingId).toBe(listingId);

      // Host sets rates via UI, then save
      const saveResult = await savePricingWorkflow({
        listing: newListing,
        listingId,
        userId: hostId,
        onPersist: mockPersistCallback
      });

      // Verify calculated prices are ready for guest display
      expect(saveResult.pricingList.startingNightlyPrice).toBeDefined();
      expect(saveResult.pricingList.nightlyPrice).toBeDefined();
      expect(saveResult.pricingList.slope).toBeDefined();
    });
  });

  // ========================================
  // LISTING UPDATE FLOW
  // ========================================
  describe('Listing Update Flow', () => {
    const existingListing = {
      id: 'existing-listing-1',
      'nightly_rate_for_2_night_stay': 100,
      'nightly_rate_for_3_night_stay': 95,
      'nightly_rate_for_4_night_stay': 90,
      'nightly_rate_for_5_night_stay': 85,
      'nightly_rate_for_6_night_stay': 80,
      'nightly_rate_for_7_night_stay': 75,
      'rental type': 'Nightly'
    };

    const existingPricing = {
      listingId: 'existing-listing-1',
      hostCompensation: [null, 100, 95, 90, 85, 80, 75],
      nightlyPrice: [null, 117, 111.35, 105.3, 99.45, 93.6, 87.75],
      startingNightlyPrice: 87.75,
      slope: -4.85,
      combinedMarkup: 0.17,
      modifiedDate: '2024-01-01T00:00:00.000Z'
    };

    it('should handle host updating rates', async () => {
      const updatedListing = {
        ...existingListing,
        'nightly_rate_for_2_night_stay': 130, // Increased from 100
        'nightly_rate_for_3_night_stay': 125  // Increased from 95
      };

      // Recalculate with updated rates
      const result = await recalculatePricingListWorkflow({
        listing: updatedListing,
        listingId: existingListing.id,
        existingPricingList: existingPricing,
        force: true,
        onPersist: mockPersistCallback
      });

      expect(result.success).toBe(true);
      expect(result.recalculated).toBe(true);

      // Verify new prices are reflected
      expect(result.pricingList.hostCompensation[1]).toBe(130);
      expect(result.pricingList.hostCompensation[2]).toBe(125);
    });

    it('should skip recalculation when no changes', async () => {
      const result = await recalculatePricingListWorkflow({
        listing: existingListing,
        listingId: existingListing.id,
        existingPricingList: existingPricing,
        force: false
      });

      expect(result.success).toBe(true);
      expect(result.skipped).toBe(true);
    });
  });

  // ========================================
  // FOUR-LAYER INTEGRATION
  // ========================================
  describe('Four-Layer Architecture Integration', () => {
    const testListing = {
      id: 'layer-test-1',
      'nightly_rate_for_2_night_stay': 100,
      'nightly_rate_for_3_night_stay': 95,
      'nightly_rate_for_4_night_stay': 90,
      'rental type': 'Nightly'
    };

    it('should integrate all four layers correctly', async () => {
      const result = await savePricingWorkflow({
        listing: testListing,
        listingId: 'layer-test-1'
      });

      // Layer 1 (Calculators): Mathematical computations
      expect(result.pricingList.nightlyPrice).toBeDefined();
      expect(result.pricingList.slope).toBeDefined();

      // Layer 2 (Rules): Business logic validation
      expect(result.success).toBe(true); // Passed validation

      // Layer 3 (Processors): Data transformation
      expect(result.pricingList.hostCompensation).toBeDefined();
      expect(result.pricingList.hostCompensation[1]).toBe(100);

      // Layer 4 (Workflows): Orchestration
      expect(result.pricingList).toMatchObject({
        listingId: 'layer-test-1',
        modifiedDate: expect.any(String)
      });
    });

    it('should maintain data integrity across layers', async () => {
      const result = await savePricingWorkflow({
        listing: testListing,
        listingId: 'layer-test-1'
      });

      // Verify data flow: listing -> processor -> calculator -> workflow
      const originalRate = testListing.nightly_rate_for_2_night_stay;
      const hostCompensation = result.pricingList.hostCompensation[1];
      const nightlyPrice = result.pricingList.nightlyPrice[1];

      expect(hostCompensation).toBe(originalRate);
      expect(nightlyPrice).toBeGreaterThan(hostCompensation);
    });
  });

  // ========================================
  // DISPLAY DATA PREPARATION
  // ========================================
  describe('Display Data Preparation', () => {
    const displayListing = {
      id: 'display-test-1',
      'nightly_rate_for_2_night_stay': 150,
      'nightly_rate_for_3_night_stay': 140,
      'nightly_rate_for_4_night_stay': 130,
      'nightly_rate_for_5_night_stay': 120,
      'nightly_rate_for_6_night_stay': 110,
      'nightly_rate_for_7_night_stay': 100,
      'rental type': 'Nightly'
    };

    it('should provide data ready for UI display', async () => {
      const result = await savePricingWorkflow({
        listing: displayListing,
        listingId: 'display-test-1'
      });

      // UI component can directly use this data
      const uiProps = {
        listingId: result.pricingList.listingId,
        nightlyPrices: result.pricingList.nightlyPrice,
        startingPrice: result.pricingList.startingNightlyPrice,
        slope: result.pricingList.slope,
        rentalType: result.pricingList.rentalType
      };

      expect(uiProps.nightlyPrices).toHaveLength(7);
      expect(uiProps.startingPrice).toBeGreaterThan(0);
      expect(uiProps.slope).not.toBeNull();
    });

    it('should include all metadata for display formatting', async () => {
      const result = await savePricingWorkflow({
        listing: displayListing,
        listingId: 'display-test-1',
        userId: 'display-user'
      });

      expect(result.pricingList.modifiedDate).toBeDefined();
      expect(result.pricingList.rentalType).toBeDefined();
      expect(result.pricingList.createdBy).toBe('display-user');
    });
  });

  // ========================================
  // ERROR HANDLING ACROSS STACK
  // ========================================
  describe('End-to-End Error Handling', () => {
    it('should handle invalid listing at workflow level', async () => {
      const invalidListing = {
        id: 'invalid',
        'rental type': 'Nightly'
      };

      await expect(
        savePricingWorkflow({
          listing: invalidListing,
          listingId: 'invalid'
        })
      ).rejects.toThrow('does not have valid host rates');
    });

    it('should handle persistence failure gracefully', async () => {
      const failingCallback = vi.fn().mockRejectedValue(
        new Error('Database connection lost')
      );

      const validListing = {
        id: 'valid-1',
        'nightly_rate_for_2_night_stay': 100,
        'rental type': 'Nightly'
      };

      await expect(
        savePricingWorkflow({
          listing: validListing,
          listingId: 'valid-1',
          onPersist: failingCallback
        })
      ).rejects.toThrow('Database connection lost');
    });
  });

  // ========================================
  // REALISTIC SCENARIOS
  // ========================================
  describe('Realistic Usage Scenarios', () => {
    it('should handle new host onboarding flow', async () => {
      const hostId = 'new-host-123';
      const listings = [
        {
          id: 'listing-a',
          'nightly_rate_for_2_night_stay': 100,
          'rental type': 'Nightly'
        },
        {
          id: 'listing-b',
          'nightly_rate_for_2_night_stay': 150,
          'rental type': 'Nightly'
        }
      ];

      // Process all listings for new host
      const results = await Promise.all(
        listings.map((listing) =>
          savePricingWorkflow({
            listing,
            listingId: listing.id,
            userId: hostId,
            onPersist: mockPersistCallback
          })
        )
      );

      results.forEach((result) => {
        expect(result.success).toBe(true);
        expect(result.pricingList.createdBy).toBe(hostId);
      });
    });

    it('should handle admin price parameter update', async () => {
      // Simulating site-wide pricing parameter change
      const allListings = [
        { id: 'l1', 'nightly_rate_for_2_night_stay': 100, 'rental type': 'Nightly' },
        { id: 'l2', 'nightly_rate_for_2_night_stay': 120, 'rental type': 'Nightly' },
        { id: 'l3', 'nightly_rate_for_2_night_stay': 140, 'rental type': 'Nightly' }
      ];

      // Force recalculate all listings
      const results = await Promise.all(
        allListings.map((listing) =>
          recalculatePricingListWorkflow({
            listing,
            listingId: listing.id,
            force: true,
            onPersist: mockPersistCallback
          })
        )
      );

      results.forEach((result) => {
        expect(result.recalculated).toBe(true);
        expect(result.forced).toBe(true);
      });
    });

    it('should handle guest booking flow with pricing', async () => {
      // Guest views listing
      const listing = {
        id: 'bookable-listing',
        'nightly_rate_for_2_night_stay': 100,
        'nightly_rate_for_3_night_stay': 95,
        'rental_rate_4_nights': 90,
        'rental type': 'Nightly'
      };

      // Get pricing for display
      const pricingResult = await savePricingWorkflow({
        listing,
        listingId: 'bookable-listing'
      });

      // Guest sees prices, selects 2 nights (index 1, since 3 nights is not set in listing)
      const selectedNights = 2; // Index 1 = 2 nights
      const priceForNights = pricingResult.pricingList.nightlyPrice[selectedNights];

      expect(priceForNights).toBeGreaterThan(0);
      expect(typeof priceForNights).toBe('number');
      expect(pricingResult.pricingList.startingNightlyPrice).toBeDefined();
    });
  });

  // ========================================
  // PERSISTENCE INTEGRATION
  // ========================================
  describe('Persistence Integration', () => {
    it('should integrate with Edge Function persistence', async () => {
      const listing = {
        id: 'persist-test',
        'nightly_rate_for_2_night_stay': 100,
        'rental type': 'Nightly'
      };

      // Simulate Edge Function call
      const edgeFunctionCallback = vi.fn().mockImplementation(async (data) => {
        // This would call supabase.functions.invoke('pricing', {...})
        return { success: true, id: 'pricing-db-id' };
      });

      const result = await savePricingWorkflow({
        listing,
        listingId: 'persist-test',
        onPersist: edgeFunctionCallback
      });

      expect(edgeFunctionCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          listingId: 'persist-test',
          nightlyPrice: expect.any(Array)
        })
      );
    });

    it('should handle persistence retry scenario', async () => {
      let attempts = 0;
      const retryCallback = vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return { success: true };
      });

      const listing = {
        id: 'retry-test',
        'nightly_rate_for_2_night_stay': 100,
        'rental type': 'Nightly'
      };

      // Note: Workflow itself doesn't retry, but this test verifies
      // the error is properly propagated for caller to handle retry
      await expect(
        savePricingWorkflow({
          listing,
          listingId: 'retry-test',
          onPersist: retryCallback
        })
      ).rejects.toThrow('Temporary failure');

      expect(attempts).toBe(1);
    });
  });

  // ========================================
  // PERFORMANCE CONSIDERATIONS
  // ========================================
  describe('Performance Considerations', () => {
    it('should handle bulk pricing updates efficiently', async () => {
      const listings = Array.from({ length: 50 }, (_, i) => ({
        id: `bulk-${i}`,
        'nightly_rate_for_2_night_stay': 100 + i,
        'rental type': 'Nightly'
      }));

      const startTime = Date.now();

      await Promise.all(
        listings.map((listing) =>
          savePricingWorkflow({
            listing,
            listingId: listing.id
          })
        )
      );

      const duration = Date.now() - startTime;

      // Should complete reasonably fast (adjust threshold as needed)
      expect(duration).toBeLessThan(5000);
    });

    it('should not create unnecessary calculations when skipped', async () => {
      const listing = {
        id: 'skip-test',
        'nightly_rate_for_2_night_stay': 100,
        'rental type': 'Nightly'
      };

      const existingPricing = {
        listingId: 'skip-test',
        hostCompensation: [null, 100, null, null, null, null, null], // Matches listing
        modifiedDate: new Date().toISOString()
      };

      const startTime = Date.now();

      const result = await recalculatePricingListWorkflow({
        listing,
        listingId: 'skip-test',
        existingPricingList: existingPricing,
        force: false
      });

      const duration = Date.now() - startTime;

      expect(result.skipped).toBe(true);
      // Should be much faster than full recalculation
      expect(duration).toBeLessThan(100);
    });
  });
});
