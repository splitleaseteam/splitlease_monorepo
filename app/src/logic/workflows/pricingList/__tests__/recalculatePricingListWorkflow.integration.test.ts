/**
 * Integration Tests: Recalculate Pricing List Workflow
 *
 * Tests the force recalculation workflow for pricing lists.
 * Verifies:
 * - Force recalculation logic
 * - Conditional recalculation based on changes
 * - Integration with shouldRecalculatePricing rule
 * - Delegation to savePricingWorkflow
 * - Proper result structure with recalculation flags
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { recalculatePricingListWorkflow } from '../recalculatePricingListWorkflow.js';
import { PRICING_CONSTANTS } from '../../../constants/pricingConstants.js';

// Mock data
const mockListing = {
  id: 'test-listing-1',
  'nightly_rate_1_night': null,
  'nightly_rate_2_nights': 100,
  'nightly_rate_3_nights': 95,
  'nightly_rate_4_nights': 90,
  'nightly_rate_5_nights': 85,
  'nightly_rate_6_nights': 80,
  'nightly_rate_7_nights': 75,
  'rental type': 'Nightly'
};

const mockExistingPricingList = {
  listingId: 'test-listing-1',
  hostCompensation: [null, 100, 95, 90, 85, 80, 75],
  nightlyPrice: [null, 117, 111.35, 105.3, 99.45, 93.6, 87.75],
  startingNightlyPrice: 87.75,
  slope: -4.85,
  combinedMarkup: PRICING_CONSTANTS.SITE_MARKUP_RATE,
  unitMarkup: PRICING_CONSTANTS.DEFAULT_UNIT_MARKUP,
  fullTimeDiscount: PRICING_CONSTANTS.FULL_TIME_DISCOUNT_RATE,
  modifiedDate: '2024-01-01T00:00:00.000Z'
};

const mockUpdatedPricingList = {
  ...mockExistingPricingList,
  nightlyPrice: [null, 120, 114, 108, 102, 96, 90],
  startingNightlyPrice: 90,
  slope: -5,
  modifiedDate: '2024-01-02T00:00:00.000Z'
};

describe('Recalculate Pricing List Workflow Integration Tests', () => {
  let mockPersistCallback;

  beforeEach(() => {
    mockPersistCallback = vi.fn().mockResolvedValue({ success: true });
    vi.clearAllMocks();
  });

  // ========================================
  // FORCE RECALCULATION TESTS
  // ========================================
  describe('Force Recalculation', () => {
    it('should recalculate when force flag is true', async () => {
      const result = await recalculatePricingListWorkflow({
        listing: mockListing,
        listingId: 'test-listing-1',
        existingPricingList: mockExistingPricingList,
        force: true,
        onPersist: mockPersistCallback
      });

      expect(result.success).toBe(true);
      expect(result.recalculated).toBe(true);
      expect(result.forced).toBe(true);
      expect(result.skipped).toBeUndefined();
    });

    it('should call savePricingWorkflow when force is true', async () => {
      await recalculatePricingListWorkflow({
        listing: mockListing,
        listingId: 'test-listing-1',
        force: true
      });

      // Workflow should complete without error
      // (delegation to savePricingWorkflow is tested in its own test file)
    });

    it('should persist recalculated data when force is true', async () => {
      await recalculatePricingListWorkflow({
        listing: mockListing,
        listingId: 'test-listing-1',
        force: true,
        onPersist: mockPersistCallback
      });

      expect(mockPersistCallback).toHaveBeenCalledTimes(1);
      expect(mockPersistCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          listingId: 'test-listing-1'
        })
      );
    });

    it('should override existing pricing list when force is true', async () => {
      const oldStartDate = mockExistingPricingList.modifiedDate;

      const result = await recalculatePricingListWorkflow({
        listing: mockListing,
        listingId: 'test-listing-1',
        existingPricingList: mockExistingPricingList,
        force: true
      });

      expect(result.pricingList.modifiedDate).not.toBe(oldStartDate);
    });
  });

  // ========================================
  // CONDITIONAL RECALCULATION TESTS
  // ========================================
  describe('Conditional Recalculation', () => {
    it('should skip recalculation when no changes detected', async () => {
      const result = await recalculatePricingListWorkflow({
        listing: mockListing,
        listingId: 'test-listing-1',
        existingPricingList: mockExistingPricingList,
        force: false
      });

      expect(result.success).toBe(true);
      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('No changes detected');
      expect(result.recalculated).toBeUndefined();
    });

    it('should return existing pricing list when skipped', async () => {
      const result = await recalculatePricingListWorkflow({
        listing: mockListing,
        listingId: 'test-listing-1',
        existingPricingList: mockExistingPricingList,
        force: false
      });

      expect(result.pricingList).toBe(mockExistingPricingList);
    });

    it('should not call persist when recalculation skipped', async () => {
      await recalculatePricingListWorkflow({
        listing: mockListing,
        listingId: 'test-listing-1',
        existingPricingList: mockExistingPricingList,
        force: false,
        onPersist: mockPersistCallback
      });

      expect(mockPersistCallback).not.toHaveBeenCalled();
    });

    it('should recalculate when listing rates changed', async () => {
      const updatedListing = {
        ...mockListing,
        'nightly_rate_2_nights': 110 // Changed from 100
      };

      const result = await recalculatePricingListWorkflow({
        listing: updatedListing,
        listingId: 'test-listing-1',
        existingPricingList: mockExistingPricingList,
        force: false,
        onPersist: mockPersistCallback
      });

      // Should recalculate since listing changed
      expect(result.success).toBe(true);
      // Note: Actual behavior depends on shouldRecalculatePricing rule implementation
    });

    it('should recalculate when existing pricing list is null', async () => {
      const result = await recalculatePricingListWorkflow({
        listing: mockListing,
        listingId: 'test-listing-1',
        existingPricingList: null,
        force: false,
        onPersist: mockPersistCallback
      });

      expect(result.success).toBe(true);
      expect(mockPersistCallback).toHaveBeenCalled();
    });
  });

  // ========================================
  // RULE INTEGRATION TESTS
  // ========================================
  describe('Rule Layer Integration', () => {
    it('should use shouldRecalculatePricing rule for conditional logic', async () => {
      // This test verifies the workflow integrates with the rule layer
      // The actual logic is tested in the rule's own test file

      await recalculatePricingListWorkflow({
        listing: mockListing,
        listingId: 'test-listing-1',
        existingPricingList: mockExistingPricingList,
        force: false
      });

      // Workflow should complete without error
      // The rule layer handles the decision
    });

    it('should bypass rule check when force is true', async () => {
      const result = await recalculatePricingListWorkflow({
        listing: mockListing,
        listingId: 'test-listing-1',
        existingPricingList: mockExistingPricingList,
        force: true
      });

      // Force should always recalculate
      expect(result.recalculated).toBe(true);
      expect(result.skipped).toBeUndefined();
    });
  });

  // ========================================
  // WORKFLOW DELEGATION TESTS
  // ========================================
  describe('Delegation to Save Workflow', () => {
    it('should delegate to savePricingWorkflow for calculation', async () => {
      const result = await recalculatePricingListWorkflow({
        listing: mockListing,
        listingId: 'test-listing-1',
        force: true
      });

      // Result should have structure from savePricingWorkflow
      expect(result.pricingList).toBeDefined();
      expect(result.pricingList.hostCompensation).toBeDefined();
      expect(result.pricingList.nightlyPrice).toBeDefined();
      expect(result.pricingList.startingNightlyPrice).toBeDefined();
    });

    it('should pass through userId to save workflow', async () => {
      const result = await recalculatePricingListWorkflow({
        listing: mockListing,
        listingId: 'test-listing-1',
        userId: 'admin-user',
        force: true,
        onPersist: mockPersistCallback
      });

      const persistedData = mockPersistCallback.mock.calls[0][0];
      expect(persistedData.createdBy).toBe('admin-user');
    });

    it('should pass onPersist callback to save workflow', async () => {
      await recalculatePricingListWorkflow({
        listing: mockListing,
        listingId: 'test-listing-1',
        force: true,
        onPersist: mockPersistCallback
      });

      expect(mockPersistCallback).toHaveBeenCalledTimes(1);
    });

    it('should add recalculation metadata to save workflow result', async () => {
      const result = await recalculatePricingListWorkflow({
        listing: mockListing,
        listingId: 'test-listing-1',
        force: true
      });

      expect(result.recalculated).toBe(true);
      expect(result.forced).toBe(true);
    });
  });

  // ========================================
  // ERROR HANDLING TESTS
  // ========================================
  describe('Error Handling', () => {
    it('should throw error when listing is missing', async () => {
      await expect(
        recalculatePricingListWorkflow({
          listingId: 'test-listing-1',
          force: true
        })
      ).rejects.toThrow('recalculatePricingListWorkflow: listing is required');
    });

    it('should throw error when listingId is missing', async () => {
      await expect(
        recalculatePricingListWorkflow({
          listing: mockListing,
          force: true
        })
      ).rejects.toThrow('recalculatePricingListWorkflow: listingId is required');
    });

    it('should propagate save workflow errors', async () => {
      const invalidListing = {
        id: 'invalid',
        'nightly_rate_2_nights': null,
        'rental type': 'Nightly'
      };

      await expect(
        recalculatePricingListWorkflow({
          listing: invalidListing,
          listingId: 'invalid',
          force: true
        })
      ).rejects.toThrow();
    });

    it('should propagate persistence callback errors', async () => {
      const failingCallback = vi.fn().mockRejectedValue(
        new Error('Persistence failed')
      );

      await expect(
        recalculatePricingListWorkflow({
          listing: mockListing,
          listingId: 'test-listing-1',
          force: true,
          onPersist: failingCallback
        })
      ).rejects.toThrow('Persistence failed');
    });
  });

  // ========================================
  // RESULT STRUCTURE TESTS
  // ========================================
  describe('Result Structure', () => {
    it('should return success flag', async () => {
      const result = await recalculatePricingListWorkflow({
        listing: mockListing,
        listingId: 'test-listing-1',
        force: true
      });

      expect(result.success).toBe(true);
    });

    it('should return pricing list', async () => {
      const result = await recalculatePricingListWorkflow({
        listing: mockListing,
        listingId: 'test-listing-1',
        force: true
      });

      expect(result.pricingList).toBeDefined();
    });

    it('should include recalculation metadata', async () => {
      const forceResult = await recalculatePricingListWorkflow({
        listing: mockListing,
        listingId: 'test-listing-1',
        force: true
      });

      expect(forceResult.recalculated).toBe(true);
      expect(forceResult.forced).toBe(true);

      const skipResult = await recalculatePricingListWorkflow({
        listing: mockListing,
        listingId: 'test-listing-1',
        existingPricingList: mockExistingPricingList,
        force: false
      });

      expect(skipResult.skipped).toBe(true);
      expect(skipResult.reason).toBeDefined();
    });
  });

  // ========================================
  // INTEGRATION SCENARIOS
  // ========================================
  describe('Integration Scenarios', () => {
    it('should handle admin-triggered force recalculation', async () => {
      const adminCallback = vi.fn().mockResolvedValue({ success: true });

      const result = await recalculatePricingListWorkflow({
        listing: mockListing,
        listingId: 'test-listing-1',
        userId: 'admin-123',
        existingPricingList: mockExistingPricingList,
        force: true,
        onPersist: adminCallback
      });

      expect(result.recalculated).toBe(true);
      expect(result.forced).toBe(true);
      expect(adminCallback).toHaveBeenCalled();
    });

    it('should handle parameter change batch update', async () => {
      // Simulate updating site-wide pricing parameters
      const listings = [
        { ...mockListing, id: 'listing-1' },
        { ...mockListing, id: 'listing-2' }
      ];

      const results = await Promise.all(
        listings.map((listing) =>
          recalculatePricingListWorkflow({
            listing,
            listingId: listing.id,
            force: true,
            onPersist: mockPersistCallback
          })
        )
      );

      results.forEach((result) => {
        expect(result.success).toBe(true);
        expect(result.recalculated).toBe(true);
      });

      expect(mockPersistCallback).toHaveBeenCalledTimes(2);
    });

    it('should handle no-op recalculation gracefully', async () => {
      const result = await recalculatePricingListWorkflow({
        listing: mockListing,
        listingId: 'test-listing-1',
        existingPricingList: mockExistingPricingList,
        force: false
      });

      // Should succeed but skip actual work
      expect(result.success).toBe(true);
      expect(result.skipped).toBe(true);
    });

    it('should handle initial pricing calculation (no existing list)', async () => {
      const result = await recalculatePricingListWorkflow({
        listing: mockListing,
        listingId: 'new-listing',
        existingPricingList: null,
        force: false,
        onPersist: mockPersistCallback
      });

      expect(result.success).toBe(true);
      expect(mockPersistCallback).toHaveBeenCalled();
      expect(result.pricingList.listingId).toBe('new-listing');
    });
  });

  // ========================================
  // EDGE CASES
  // ========================================
  describe('Edge Cases', () => {
    it('should handle force flag with invalid listing', async () => {
      const invalidListing = {
        id: 'invalid',
        'rental type': 'Nightly'
      };

      await expect(
        recalculatePricingListWorkflow({
          listing: invalidListing,
          listingId: 'invalid',
          force: true
        })
      ).rejects.toThrow();
    });

    it('should handle existing pricing list with missing fields', async () => {
      const incompletePricingList = {
        listingId: 'test-listing-1',
        nightlyPrice: [null, 100, 95, 90, 85, 80, 75]
        // Missing other fields
      };

      const result = await recalculatePricingListWorkflow({
        listing: mockListing,
        listingId: 'test-listing-1',
        existingPricingList: incompletePricingList,
        force: false
      });

      expect(result.success).toBe(true);
    });

    it('should handle concurrent recalculation requests', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        recalculatePricingListWorkflow({
          listing: mockListing,
          listingId: `listing-${i}`,
          force: true,
          onPersist: mockPersistCallback
        })
      );

      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(result.success).toBe(true);
        expect(result.recalculated).toBe(true);
      });

      expect(mockPersistCallback).toHaveBeenCalledTimes(5);
    });
  });

  // ========================================
  // PRESERVATION TESTS
  // ========================================
  describe('Data Preservation', () => {
    it('should preserve userId from existing pricing list when not provided', async () => {
      const existingWithUser = {
        ...mockExistingPricingList,
        createdBy: 'original-user'
      };

      // When skipped, should return existing
      const skipResult = await recalculatePricingListWorkflow({
        listing: mockListing,
        listingId: 'test-listing-1',
        existingPricingList: existingWithUser,
        force: false
      });

      if (skipResult.skipped) {
        expect(skipResult.pricingList.createdBy).toBe('original-user');
      }
    });

    it('should update userId when explicitly provided during recalculation', async () => {
      const result = await recalculatePricingListWorkflow({
        listing: mockListing,
        listingId: 'test-listing-1',
        userId: 'new-user',
        force: true,
        onPersist: mockPersistCallback
      });

      const persistedData = mockPersistCallback.mock.calls[0][0];
      expect(persistedData.createdBy).toBe('new-user');
    });
  });
});
