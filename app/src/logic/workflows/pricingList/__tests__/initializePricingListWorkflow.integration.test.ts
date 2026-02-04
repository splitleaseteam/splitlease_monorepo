/**
 * Integration Tests: Initialize Pricing List Workflow
 *
 * Tests the complete initialization workflow for creating a new pricing list.
 * Verifies:
 * - Default pricing list structure creation
 * - Array initialization with correct values
 * - Persistence callback behavior
 * - Error handling for missing required fields
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initializePricingListWorkflow } from '../initializePricingListWorkflow.js';
import { PRICING_CONSTANTS } from '../../../constants/pricingConstants.js';

describe('Initialize Pricing List Workflow Integration Tests', () => {
  let mockPersistCallback;

  beforeEach(() => {
    // Reset mock before each test
    mockPersistCallback = vi.fn().mockResolvedValue({ success: true });
    vi.clearAllMocks();
  });

  // ========================================
  // BASIC INITIALIZATION TESTS
  // ========================================
  describe('Basic Initialization', () => {
    it('should create pricing list with required fields', async () => {
      const result = await initializePricingListWorkflow({
        listingId: 'test-listing-1'
      });

      expect(result.success).toBe(true);
      expect(result.isInitialized).toBe(true);
      expect(result.pricingList).toBeDefined();
      expect(result.pricingList.listingId).toBe('test-listing-1');
    });

    it('should include userId when provided', async () => {
      const result = await initializePricingListWorkflow({
        listingId: 'test-listing-1',
        userId: 'user-123'
      });

      expect(result.pricingList.createdBy).toBe('user-123');
    });

    it('should set createdBy to undefined when userId not provided', async () => {
      const result = await initializePricingListWorkflow({
        listingId: 'test-listing-1'
      });

      expect(result.pricingList.createdBy).toBeUndefined();
    });
  });

  // ========================================
  // ARRAY INITIALIZATION TESTS
  // ========================================
  describe('Array Initialization', () => {
    it('should initialize hostCompensation with 7 null elements', async () => {
      const result = await initializePricingListWorkflow({
        listingId: 'test-listing-1'
      });

      expect(result.pricingList.hostCompensation).toHaveLength(
        PRICING_CONSTANTS.PRICING_LIST_ARRAY_LENGTH
      );
      expect(result.pricingList.hostCompensation.every((val) => val === null)).toBe(true);
    });

    it('should initialize nightlyPrice with 7 null elements', async () => {
      const result = await initializePricingListWorkflow({
        listingId: 'test-listing-1'
      });

      expect(result.pricingList.nightlyPrice).toHaveLength(
        PRICING_CONSTANTS.PRICING_LIST_ARRAY_LENGTH
      );
      expect(result.pricingList.nightlyPrice.every((val) => val === null)).toBe(true);
    });

    it('should initialize unusedNights with 7 null elements', async () => {
      const result = await initializePricingListWorkflow({
        listingId: 'test-listing-1'
      });

      expect(result.pricingList.unusedNights).toHaveLength(
        PRICING_CONSTANTS.PRICING_LIST_ARRAY_LENGTH
      );
      expect(result.pricingList.unusedNights.every((val) => val === null)).toBe(true);
    });

    it('should initialize markupAndDiscountMultiplier with 7 zeros', async () => {
      const result = await initializePricingListWorkflow({
        listingId: 'test-listing-1'
      });

      expect(result.pricingList.markupAndDiscountMultiplier).toHaveLength(
        PRICING_CONSTANTS.PRICING_LIST_ARRAY_LENGTH
      );
      expect(result.pricingList.markupAndDiscountMultiplier.every((val) => val === 0)).toBe(true);
    });

    it('should initialize unusedNightsDiscount with 7 zeros', async () => {
      const result = await initializePricingListWorkflow({
        listingId: 'test-listing-1'
      });

      expect(result.pricingList.unusedNightsDiscount).toHaveLength(
        PRICING_CONSTANTS.PRICING_LIST_ARRAY_LENGTH
      );
      expect(result.pricingList.unusedNightsDiscount.every((val) => val === 0)).toBe(true);
    });

    it('should initialize numberSelectedNights as empty array', async () => {
      const result = await initializePricingListWorkflow({
        listingId: 'test-listing-1'
      });

      expect(result.pricingList.numberSelectedNights).toEqual([]);
    });
  });

  // ========================================
  // SCALAR VALUE INITIALIZATION TESTS
  // ========================================
  describe('Scalar Value Initialization', () => {
    it('should set unitMarkup to default value', async () => {
      const result = await initializePricingListWorkflow({
        listingId: 'test-listing-1'
      });

      expect(result.pricingList.unitMarkup).toBe(PRICING_CONSTANTS.DEFAULT_UNIT_MARKUP);
    });

    it('should set overallSiteMarkup to site markup rate', async () => {
      const result = await initializePricingListWorkflow({
        listingId: 'test-listing-1'
      });

      expect(result.pricingList.overallSiteMarkup).toBe(PRICING_CONSTANTS.SITE_MARKUP_RATE);
    });

    it('should set combinedMarkup to site markup rate initially', async () => {
      const result = await initializePricingListWorkflow({
        listingId: 'test-listing-1'
      });

      expect(result.pricingList.combinedMarkup).toBe(PRICING_CONSTANTS.SITE_MARKUP_RATE);
    });

    it('should set fullTimeDiscount to full-time discount rate', async () => {
      const result = await initializePricingListWorkflow({
        listingId: 'test-listing-1'
      });

      expect(result.pricingList.fullTimeDiscount).toBe(PRICING_CONSTANTS.FULL_TIME_DISCOUNT_RATE);
    });

    it('should set derived scalars to null', async () => {
      const result = await initializePricingListWorkflow({
        listingId: 'test-listing-1'
      });

      expect(result.pricingList.startingNightlyPrice).toBeNull();
      expect(result.pricingList.slope).toBeNull();
      expect(result.pricingList.weeklyPriceAdjust).toBeNull();
    });
  });

  // ========================================
  // METADATA INITIALIZATION TESTS
  // ========================================
  describe('Metadata Initialization', () => {
    it('should set rentalType to Nightly', async () => {
      const result = await initializePricingListWorkflow({
        listingId: 'test-listing-1'
      });

      expect(result.pricingList.rentalType).toBe('Nightly');
    });

    it('should set modifiedDate to current ISO timestamp', async () => {
      const result = await initializePricingListWorkflow({
        listingId: 'test-listing-1'
      });

      expect(result.pricingList.modifiedDate).toBeDefined();
      expect(() => new Date(result.pricingList.modifiedDate)).not.toThrow();
      expect(result.pricingList.modifiedDate).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  // ========================================
  // PERSISTENCE CALLBACK TESTS
  // ========================================
  describe('Persistence Callback Behavior', () => {
    it('should call onPersist callback with pricing list data', async () => {
      await initializePricingListWorkflow({
        listingId: 'test-listing-1',
        userId: 'user-123',
        onPersist: mockPersistCallback
      });

      expect(mockPersistCallback).toHaveBeenCalledTimes(1);
      expect(mockPersistCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          listingId: 'test-listing-1',
          createdBy: 'user-123'
        })
      );
    });

    it('should not call onPersist when callback not provided', async () => {
      await initializePricingListWorkflow({
        listingId: 'test-listing-1'
      });

      expect(mockPersistCallback).not.toHaveBeenCalled();
    });

    it('should wait for persistence callback to complete before returning', async () => {
      let callbackCompleted = false;

      const slowCallback = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        callbackCompleted = true;
        return { success: true };
      });

      await initializePricingListWorkflow({
        listingId: 'test-listing-1',
        onPersist: slowCallback
      });

      expect(callbackCompleted).toBe(true);
    });

    it('should propagate persistence callback errors', async () => {
      const failingCallback = vi.fn().mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(
        initializePricingListWorkflow({
          listingId: 'test-listing-1',
          onPersist: failingCallback
        })
      ).rejects.toThrow('Database connection failed');
    });
  });

  // ========================================
  // ERROR HANDLING TESTS
  // ========================================
  describe('Error Handling', () => {
    it('should throw error when listingId is missing', async () => {
      await expect(initializePricingListWorkflow({})).rejects.toThrow(
        'initializePricingListWorkflow: listingId is required'
      );
    });

    it('should throw error when listingId is null', async () => {
      await expect(
        initializePricingListWorkflow({ listingId: null })
      ).rejects.toThrow('initializePricingListWorkflow: listingId is required');
    });

    it('should throw error when listingId is empty string', async () => {
      await expect(
        initializePricingListWorkflow({ listingId: '' })
      ).rejects.toThrow('initializePricingListWorkflow: listingId is required');
    });

    it('should handle persistence callback throwing non-Error objects', async () => {
      const throwingCallback = vi.fn().mockRejectedValue('String error');

      await expect(
        initializePricingListWorkflow({
          listingId: 'test-listing-1',
          onPersist: throwingCallback
        })
      ).rejects.toThrow('String error');
    });
  });

  // ========================================
  // IMMUTABILITY TESTS
  // ========================================
  describe('Data Immutability', () => {
    it('should create independent arrays for each pricing list', async () => {
      const result1 = await initializePricingListWorkflow({
        listingId: 'listing-1'
      });

      const result2 = await initializePricingListWorkflow({
        listingId: 'listing-2'
      });

      // Modify first result's array
      result1.pricingList.hostCompensation[0] = 100;

      // Second result should be unaffected
      expect(result2.pricingList.hostCompensation[0]).toBeNull();
    });

    it('should not share array references between different calls', async () => {
      const result1 = await initializePricingListWorkflow({
        listingId: 'listing-1'
      });

      const result2 = await initializePricingListWorkflow({
        listingId: 'listing-2'
      });

      expect(result1.pricingList.nightlyPrice).not.toBe(
        result2.pricingList.nightlyPrice
      );
    });
  });

  // ========================================
  // INTEGRATION SCENARIOS
  // ========================================
  describe('Integration Scenarios', () => {
    it('should support typical new listing creation flow', async () => {
      const newListingId = 'new-listing-' + Date.now();
      const hostUserId = 'host-user-123';

      const persistCallback = vi.fn().mockResolvedValue({
        success: true,
        id: 'pricing-list-' + Date.now()
      });

      const result = await initializePricingListWorkflow({
        listingId: newListingId,
        userId: hostUserId,
        onPersist: persistCallback
      });

      expect(result.success).toBe(true);
      expect(result.isInitialized).toBe(true);
      expect(persistCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          listingId: newListingId,
          createdBy: hostUserId,
          rentalType: 'Nightly'
        })
      );
    });

    it('should create valid structure for subsequent pricing calculation', async () => {
      const result = await initializePricingListWorkflow({
        listingId: 'test-listing-1'
      });

      // Verify structure has all required fields for savePricingWorkflow
      expect(result.pricingList).toHaveProperty('listingId');
      expect(result.pricingList).toHaveProperty('hostCompensation');
      expect(result.pricingList).toHaveProperty('nightlyPrice');
      expect(result.pricingList).toHaveProperty('markupAndDiscountMultiplier');
      expect(result.pricingList).toHaveProperty('unusedNightsDiscount');
      expect(result.pricingList).toHaveProperty('unitMarkup');
      expect(result.pricingList).toHaveProperty('combinedMarkup');
      expect(result.pricingList).toHaveProperty('fullTimeDiscount');
    });

    it('should handle rapid successive initialization requests', async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          initializePricingListWorkflow({
            listingId: `listing-${i}`
          })
        );
      }

      const results = await Promise.all(promises);

      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.pricingList.listingId).toBe(`listing-${index}`);
      });
    });
  });
});
