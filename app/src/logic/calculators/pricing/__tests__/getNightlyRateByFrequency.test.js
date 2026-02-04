/**
 * Tests for getNightlyRateByFrequency
 *
 * Gets nightly price based on number of nights selected.
 * Maps nights to specific price fields in the listing object.
 * Price override takes precedence over frequency-based rates.
 */
import { describe, it, expect } from 'vitest';
import { getNightlyRateByFrequency } from '../getNightlyRateByFrequency.js';

describe('getNightlyRateByFrequency', () => {
  // ============================================================================
  // Test Data Fixtures
  // ============================================================================
  const fullListing = {
    'nightly_rate_1_night': 150,
    'nightly_rate_2_nights': 140,
    'nightly_rate_3_nights': 130,
    'nightly_rate_4_nights': 120,
    'nightly_rate_5_nights': 110,
    'nightly_rate_6_nights': 100,
    'nightly_rate_7_nights': 90
  };

  const listingWithOverride = {
    ...fullListing,
    'price_override': 200
  };

  const sparseListingWith4Nights = {
    'nightly_rate_4_nights': 100
  };

  // ============================================================================
  // Happy Path Tests - Standard Price Fields
  // ============================================================================
  describe('happy path - standard price fields', () => {
    it('should return rate for 2 nights', () => {
      const result = getNightlyRateByFrequency({
        listing: fullListing,
        nightsSelected: 2
      });
      expect(result).toBe(140);
    });

    it('should return rate for 3 nights', () => {
      const result = getNightlyRateByFrequency({
        listing: fullListing,
        nightsSelected: 3
      });
      expect(result).toBe(130);
    });

    it('should return rate for 4 nights', () => {
      const result = getNightlyRateByFrequency({
        listing: fullListing,
        nightsSelected: 4
      });
      expect(result).toBe(120);
    });

    it('should return rate for 5 nights', () => {
      const result = getNightlyRateByFrequency({
        listing: fullListing,
        nightsSelected: 5
      });
      expect(result).toBe(110);
    });

    it('should return rate for 6 nights', () => {
      const result = getNightlyRateByFrequency({
        listing: fullListing,
        nightsSelected: 6
      });
      expect(result).toBe(100);
    });

    it('should return rate for 7 nights', () => {
      const result = getNightlyRateByFrequency({
        listing: fullListing,
        nightsSelected: 7
      });
      expect(result).toBe(90);
    });
  });

  // ============================================================================
  // Price Override Tests
  // ============================================================================
  describe('price override', () => {
    it('should return price override when present', () => {
      const result = getNightlyRateByFrequency({
        listing: listingWithOverride,
        nightsSelected: 4
      });
      expect(result).toBe(200);
    });

    it('should use override regardless of nights selected', () => {
      const results = [2, 3, 4, 5, 6, 7].map(nights =>
        getNightlyRateByFrequency({
          listing: listingWithOverride,
          nightsSelected: nights
        })
      );
      expect(results.every(r => r === 200)).toBe(true);
    });

    it('should use tiered rate when price override is zero (falsy)', () => {
      // Note: Zero is falsy in JavaScript, so the override check (if (listing['price_override']))
      // will skip it and use the tiered rate instead
      const listingWithZeroOverride = {
        ...fullListing,
        'price_override': 0
      };
      const result = getNightlyRateByFrequency({
        listing: listingWithZeroOverride,
        nightsSelected: 4
      });
      // Falls back to tiered rate since 0 is falsy
      expect(result).toBe(120);
    });

    it('should throw error for negative price override', () => {
      const listingWithNegativeOverride = {
        ...fullListing,
        'price_override': -100
      };
      expect(() => getNightlyRateByFrequency({
        listing: listingWithNegativeOverride,
        nightsSelected: 4
      })).toThrow('Invalid price override value');
    });

    it('should throw error for NaN price override', () => {
      const listingWithNaNOverride = {
        ...fullListing,
        'price_override': 'not a number'
      };
      expect(() => getNightlyRateByFrequency({
        listing: listingWithNaNOverride,
        nightsSelected: 4
      })).toThrow('Invalid price override value');
    });

    it('should convert numeric string override to number', () => {
      const listingWithStringOverride = {
        ...fullListing,
        'price_override': '150'
      };
      const result = getNightlyRateByFrequency({
        listing: listingWithStringOverride,
        nightsSelected: 4
      });
      expect(result).toBe(150);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================
  describe('edge cases', () => {
    it('should handle decimal rate values', () => {
      const listing = {
        'nightly_rate_4_nights': 99.99
      };
      const result = getNightlyRateByFrequency({
        listing,
        nightsSelected: 4
      });
      expect(result).toBe(99.99);
    });

    it('should handle very large rate values', () => {
      const listing = {
        'nightly_rate_4_nights': 10000
      };
      const result = getNightlyRateByFrequency({
        listing,
        nightsSelected: 4
      });
      expect(result).toBe(10000);
    });

    it('should throw error when rate is zero (falsy)', () => {
      // Note: Zero is falsy in JavaScript, so the check (!listing[fieldName])
      // treats 0 as missing - this is intentional as $0/night is invalid
      const listing = {
        'nightly_rate_4_nights': 0
      };
      expect(() => getNightlyRateByFrequency({
        listing,
        nightsSelected: 4
      })).toThrow('No price found for 4 nights in listing');
    });

    it('should convert numeric string rate to number', () => {
      const listing = {
        'nightly_rate_4_nights': '100'
      };
      const result = getNightlyRateByFrequency({
        listing,
        nightsSelected: 4
      });
      expect(result).toBe(100);
    });
  });

  // ============================================================================
  // Error Handling - Listing Validation
  // ============================================================================
  describe('error handling - listing validation', () => {
    it('should throw error for null listing', () => {
      expect(() => getNightlyRateByFrequency({
        listing: null,
        nightsSelected: 4
      })).toThrow('listing must be a valid object');
    });

    it('should throw error for undefined listing', () => {
      expect(() => getNightlyRateByFrequency({
        listing: undefined,
        nightsSelected: 4
      })).toThrow('listing must be a valid object');
    });

    it('should throw error for string listing', () => {
      expect(() => getNightlyRateByFrequency({
        listing: 'not an object',
        nightsSelected: 4
      })).toThrow('listing must be a valid object');
    });

    it('should throw error for number listing', () => {
      expect(() => getNightlyRateByFrequency({
        listing: 123,
        nightsSelected: 4
      })).toThrow('listing must be a valid object');
    });

    it('should handle array listing as object (missing fields)', () => {
      // Note: Arrays are objects in JavaScript, so they pass the type check
      // But they won't have the expected price fields
      expect(() => getNightlyRateByFrequency({
        listing: [],
        nightsSelected: 4
      })).toThrow('No price found for 4 nights in listing');
    });
  });

  // ============================================================================
  // Error Handling - nightsSelected Validation
  // ============================================================================
  describe('error handling - nightsSelected validation', () => {
    it('should throw error for nightsSelected below range (1)', () => {
      expect(() => getNightlyRateByFrequency({
        listing: fullListing,
        nightsSelected: 1
      })).toThrow('nightsSelected must be between 2-7');
    });

    it('should throw error for nightsSelected above range (8)', () => {
      expect(() => getNightlyRateByFrequency({
        listing: fullListing,
        nightsSelected: 8
      })).toThrow('nightsSelected must be between 2-7');
    });

    it('should throw error for nightsSelected of 0', () => {
      expect(() => getNightlyRateByFrequency({
        listing: fullListing,
        nightsSelected: 0
      })).toThrow('nightsSelected must be between 2-7');
    });

    it('should throw error for negative nightsSelected', () => {
      expect(() => getNightlyRateByFrequency({
        listing: fullListing,
        nightsSelected: -3
      })).toThrow('nightsSelected must be between 2-7');
    });

    it('should throw error for null nightsSelected', () => {
      expect(() => getNightlyRateByFrequency({
        listing: fullListing,
        nightsSelected: null
      })).toThrow('nightsSelected must be a number');
    });

    it('should throw error for undefined nightsSelected', () => {
      expect(() => getNightlyRateByFrequency({
        listing: fullListing,
        nightsSelected: undefined
      })).toThrow('nightsSelected must be a number');
    });

    it('should throw error for string nightsSelected', () => {
      expect(() => getNightlyRateByFrequency({
        listing: fullListing,
        nightsSelected: '4'
      })).toThrow('nightsSelected must be a number');
    });

    it('should throw error for NaN nightsSelected', () => {
      expect(() => getNightlyRateByFrequency({
        listing: fullListing,
        nightsSelected: NaN
      })).toThrow('nightsSelected must be a number');
    });

    it('should throw error for object nightsSelected', () => {
      expect(() => getNightlyRateByFrequency({
        listing: fullListing,
        nightsSelected: {}
      })).toThrow('nightsSelected must be a number');
    });
  });

  // ============================================================================
  // Error Handling - Missing Price Fields
  // ============================================================================
  describe('error handling - missing price fields', () => {
    it('should throw error when price field for selected nights is missing', () => {
      const incompleteListing = {
        'nightly_rate_4_nights': 100
        // Missing other night rates
      };
      expect(() => getNightlyRateByFrequency({
        listing: incompleteListing,
        nightsSelected: 3
      })).toThrow('No price found for 3 nights in listing');
    });

    it('should throw error for empty listing object', () => {
      expect(() => getNightlyRateByFrequency({
        listing: {},
        nightsSelected: 4
      })).toThrow('No price found for 4 nights in listing');
    });

    it('should throw error when price field exists but is null', () => {
      const listing = {
        'nightly_rate_4_nights': null
      };
      expect(() => getNightlyRateByFrequency({
        listing,
        nightsSelected: 4
      })).toThrow('No price found for 4 nights in listing');
    });

    it('should throw error when price field exists but is undefined', () => {
      const listing = {
        'nightly_rate_4_nights': undefined
      };
      expect(() => getNightlyRateByFrequency({
        listing,
        nightsSelected: 4
      })).toThrow('No price found for 4 nights in listing');
    });

    it('should throw error for negative rate in listing', () => {
      const listing = {
        'nightly_rate_4_nights': -50
      };
      expect(() => getNightlyRateByFrequency({
        listing,
        nightsSelected: 4
      })).toThrow('Invalid rate value');
    });

    it('should throw error for NaN rate in listing', () => {
      const listing = {
        'nightly_rate_4_nights': 'invalid'
      };
      expect(() => getNightlyRateByFrequency({
        listing,
        nightsSelected: 4
      })).toThrow('Invalid rate value');
    });
  });

  // ============================================================================
  // Boundary Conditions
  // ============================================================================
  describe('boundary conditions', () => {
    it('should handle minimum valid nightsSelected (2)', () => {
      const result = getNightlyRateByFrequency({
        listing: fullListing,
        nightsSelected: 2
      });
      expect(result).toBe(140);
    });

    it('should handle maximum valid nightsSelected (7)', () => {
      const result = getNightlyRateByFrequency({
        listing: fullListing,
        nightsSelected: 7
      });
      expect(result).toBe(90);
    });
  });

  // ============================================================================
  // Price Field Mapping Tests
  // ============================================================================
  describe('price field mapping', () => {
    it('should map nightsSelected 2 to "nightly_rate_2_nights"', () => {
      const listing = { 'nightly_rate_2_nights': 999 };
      const result = getNightlyRateByFrequency({
        listing,
        nightsSelected: 2
      });
      expect(result).toBe(999);
    });

    it('should map nightsSelected 3 to "nightly_rate_3_nights"', () => {
      const listing = { 'nightly_rate_3_nights': 888 };
      const result = getNightlyRateByFrequency({
        listing,
        nightsSelected: 3
      });
      expect(result).toBe(888);
    });

    it('should map nightsSelected 4 to "nightly_rate_4_nights"', () => {
      const listing = { 'nightly_rate_4_nights': 777 };
      const result = getNightlyRateByFrequency({
        listing,
        nightsSelected: 4
      });
      expect(result).toBe(777);
    });

    it('should map nightsSelected 5 to "nightly_rate_5_nights"', () => {
      const listing = { 'nightly_rate_5_nights': 666 };
      const result = getNightlyRateByFrequency({
        listing,
        nightsSelected: 5
      });
      expect(result).toBe(666);
    });

    it('should map nightsSelected 6 to "nightly_rate_6_nights"', () => {
      const listing = { 'nightly_rate_6_nights': 555 };
      const result = getNightlyRateByFrequency({
        listing,
        nightsSelected: 6
      });
      expect(result).toBe(555);
    });

    it('should map nightsSelected 7 to "nightly_rate_7_nights"', () => {
      const listing = { 'nightly_rate_7_nights': 444 };
      const result = getNightlyRateByFrequency({
        listing,
        nightsSelected: 7
      });
      expect(result).toBe(444);
    });
  });

  // ============================================================================
  // Business Logic Verification
  // ============================================================================
  describe('business logic verification', () => {
    it('should show decreasing rates with more nights (typical tiered pricing)', () => {
      // More nights typically means lower per-night rate
      const rates = [2, 3, 4, 5, 6, 7].map(nights =>
        getNightlyRateByFrequency({
          listing: fullListing,
          nightsSelected: nights
        })
      );
      // Each subsequent rate should be less than or equal to previous
      for (let i = 1; i < rates.length; i++) {
        expect(rates[i]).toBeLessThanOrEqual(rates[i - 1]);
      }
    });

    it('should prioritize price override over tiered rates', () => {
      const cheapListing = {
        'nightly_rate_7_nights': 50,
        'price_override': 200
      };
      const result = getNightlyRateByFrequency({
        listing: cheapListing,
        nightsSelected: 7
      });
      // Should return override, not the cheaper 7-night rate
      expect(result).toBe(200);
    });
  });

  // ============================================================================
  // Input Object Validation
  // ============================================================================
  describe('input object validation', () => {
    it('should work with extra properties in listing object', () => {
      const listingWithExtras = {
        ...sparseListingWith4Nights,
        extraProp: 'ignored',
        anotherProp: 123
      };
      const result = getNightlyRateByFrequency({
        listing: listingWithExtras,
        nightsSelected: 4
      });
      expect(result).toBe(100);
    });

    it('should throw error for missing params object', () => {
      expect(() => getNightlyRateByFrequency())
        .toThrow();
    });

    it('should throw error for empty params object', () => {
      expect(() => getNightlyRateByFrequency({}))
        .toThrow();
    });
  });
});
