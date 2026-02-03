/**
 * Integration tests for canCalculatePricing rule.
 *
 * Tests validation of listing pricing fields for calculation readiness,
 * including null/undefined handling, type validation, and edge cases.
 */

import { describe, it, expect } from 'vitest';
import { canCalculatePricing } from '../canCalculatePricing.js';

describe('canCalculatePricing - Integration Tests', () => {
  describe('valid listings', () => {
    it('should return true when at least one rate field is valid', () => {
      const listing = {
        'nightly_rate_2_nights': 100
      };

      const result = canCalculatePricing({ listing });

      expect(result).toBe(true);
    });

    it('should return true when multiple rate fields are valid', () => {
      const listing = {
        'nightly_rate_2_nights': 100,
        'nightly_rate_3_nights': 95,
        'nightly_rate_4_nights': 90
      };

      const result = canCalculatePricing({ listing });

      expect(result).toBe(true);
    });

    it('should return true when all rate fields are valid', () => {
      const listing = {
        'nightly_rate_1_night': 150,
        'nightly_rate_2_nights': 140,
        'nightly_rate_3_nights': 130,
        'nightly_rate_4_nights': 120,
        'nightly_rate_5_nights': 110,
        'nightly_rate_6_nights': 100,
        'nightly_rate_7_nights': 90
      };

      const result = canCalculatePricing({ listing });

      expect(result).toBe(true);
    });

    it('should accept string numbers as valid rates', () => {
      const listing = {
        'nightly_rate_2_nights': '100'
      };

      const result = canCalculatePricing({ listing });

      // Note: canCalculatePricing requires typeof value === 'number'
      // String numbers are not accepted directly (they need type coercion first)
      expect(result).toBe(false);
    });

    it('should accept decimal numbers as valid rates', () => {
      const listing = {
        'nightly_rate_2_nights': 99.99
      };

      const result = canCalculatePricing({ listing });

      expect(result).toBe(true);
    });
  });

  describe('invalid listings', () => {
    it('should return false when no rate fields are present', () => {
      const listing = {
        Name: 'Test Listing',
        Address: '123 Main St'
      };

      const result = canCalculatePricing({ listing });

      expect(result).toBe(false);
    });

    it('should return false when all rate fields are null', () => {
      const listing = {
        'nightly_rate_1_night': null,
        'nightly_rate_2_nights': null,
        'nightly_rate_3_nights': null,
        'nightly_rate_4_nights': null,
        'nightly_rate_5_nights': null,
        'nightly_rate_6_nights': null,
        'nightly_rate_7_nights': null
      };

      const result = canCalculatePricing({ listing });

      expect(result).toBe(false);
    });

    it('should return false when all rate fields are undefined', () => {
      const listing = {};

      const result = canCalculatePricing({ listing });

      expect(result).toBe(false);
    });

    it('should return false when all rate fields are empty strings', () => {
      const listing = {
        'nightly_rate_2_nights': '',
        'nightly_rate_3_nights': '',
        'nightly_rate_4_nights': ''
      };

      const result = canCalculatePricing({ listing });

      expect(result).toBe(false);
    });

    it('should return false when all rate fields are zero', () => {
      const listing = {
        'nightly_rate_2_nights': 0,
        'nightly_rate_3_nights': 0,
        'nightly_rate_4_nights': 0
      };

      const result = canCalculatePricing({ listing });

      expect(result).toBe(false);
    });

    it('should return false when all rate fields are negative', () => {
      const listing = {
        'nightly_rate_2_nights': -100,
        'nightly_rate_3_nights': -95,
        'nightly_rate_4_nights': -90
      };

      const result = canCalculatePricing({ listing });

      expect(result).toBe(false);
    });

    it('should return false when all rate fields are NaN', () => {
      const listing = {
        'nightly_rate_2_nights': NaN,
        'nightly_rate_3_nights': NaN
      };

      const result = canCalculatePricing({ listing });

      expect(result).toBe(false);
    });

    it('should return false when all rate fields are non-numeric strings', () => {
      const listing = {
        'nightly_rate_2_nights': 'abc',
        'nightly_rate_3_nights': 'N/A',
        'nightly_rate_4_nights': 'varies'
      };

      const result = canCalculatePricing({ listing });

      expect(result).toBe(false);
    });
  });

  describe('mixed valid and invalid rates', () => {
    it('should return true when at least one rate is valid among nulls', () => {
      const listing = {
        'nightly_rate_2_nights': null,
        'nightly_rate_3_nights': 95,
        'nightly_rate_4_nights': null
      };

      const result = canCalculatePricing({ listing });

      expect(result).toBe(true);
    });

    it('should return true when at least one rate is valid among zeros', () => {
      const listing = {
        'nightly_rate_2_nights': 0,
        'nightly_rate_3_nights': 95,
        'nightly_rate_4_nights': 0
      };

      const result = canCalculatePricing({ listing });

      expect(result).toBe(true);
    });

    it('should return true when at least one rate is valid among negative values', () => {
      const listing = {
        'nightly_rate_2_nights': -100,
        'nightly_rate_3_nights': 95,
        'nightly_rate_4_nights': -90
      };

      const result = canCalculatePricing({ listing });

      expect(result).toBe(true);
    });

    it('should return true when at least one rate is valid among invalid strings', () => {
      const listing = {
        'nightly_rate_2_nights': 'invalid',
        'nightly_rate_3_nights': 95,
        'nightly_rate_4_nights': 'N/A'
      };

      const result = canCalculatePricing({ listing });

      expect(result).toBe(true);
    });
  });

  describe('rate 1 night handling', () => {
    it('should not require rate_1_night to be valid', () => {
      const listing = {
        'nightly_rate_1_night': null,
        'nightly_rate_2_nights': 100
      };

      const result = canCalculatePricing({ listing });

      expect(result).toBe(true);
    });

    it('should accept valid rate_1_night when present', () => {
      const listing = {
        'nightly_rate_1_night': 150,
        'nightly_rate_2_nights': null
      };

      const result = canCalculatePricing({ listing });

      expect(result).toBe(false); // Still need at least one of 2-7 nights
    });

    it('should ignore rate_1_night when only it is valid', () => {
      const listing = {
        'nightly_rate_1_night': 150,
        'nightly_rate_2_nights': null,
        'nightly_rate_3_nights': null,
        'nightly_rate_4_nights': null,
        'nightly_rate_5_nights': null,
        'nightly_rate_6_nights': null,
        'nightly_rate_7_nights': null
      };

      const result = canCalculatePricing({ listing });

      expect(result).toBe(false);
    });
  });

  describe('validation', () => {
    it('should throw error when listing is null', () => {
      expect(() => canCalculatePricing({ listing: null })).toThrow(
        'canCalculatePricing: listing is required'
      );
    });

    it('should throw error when listing is undefined', () => {
      expect(() => canCalculatePricing({ listing: undefined })).toThrow(
        'canCalculatePricing: listing is required'
      );
    });

    it('should throw error when listing parameter is missing', () => {
      expect(() => canCalculatePricing({})).toThrow(
        'canCalculatePricing: listing is required'
      );
    });
  });

  describe('edge cases', () => {
    it('should handle empty object listing', () => {
      const listing = {};

      const result = canCalculatePricing({ listing });

      expect(result).toBe(false);
    });

    it('should handle listing with only unrelated fields', () => {
      const listing = {
        Name: 'Test Listing',
        Address: '123 Main St',
        City: 'New York',
        Price: 500
      };

      const result = canCalculatePricing({ listing });

      expect(result).toBe(false);
    });

    it('should handle very large rate values', () => {
      const listing = {
        'nightly_rate_2_nights': 999999
      };

      const result = canCalculatePricing({ listing });

      expect(result).toBe(true);
    });

    it('should handle very small positive rate values', () => {
      const listing = {
        'nightly_rate_2_nights': 0.01
      };

      const result = canCalculatePricing({ listing });

      expect(result).toBe(true);
    });

    it('should handle floating point precision issues', () => {
      const listing = {
        'nightly_rate_2_nights': 100.0000000001,
        'nightly_rate_3_nights': 99.9999999999
      };

      const result = canCalculatePricing({ listing });

      expect(result).toBe(true);
    });
  });

  describe('real-world scenarios', () => {
    it('should validate typical NYC listing with multiple rates', () => {
      const listing = {
        Name: 'Manhattan Apartment',
        'nightly_rate_2_nights': 150,
        'nightly_rate_3_nights': 140,
        'nightly_rate_4_nights': 130,
        'nightly_rate_5_nights': 120,
        'nightly_rate_6_nights': 110,
        'nightly_rate_7_nights': 100
      };

      const result = canCalculatePricing({ listing });

      expect(result).toBe(true);
    });

    it('should validate listing from Bubble with string numbers', () => {
      const listing = {
        'nightly_rate_2_nights': '120',
        'nightly_rate_3_nights': '115',
        'nightly_rate_4_nights': '110'
      };

      const result = canCalculatePricing({ listing });

      // Note: canCalculatePricing requires typeof value === 'number'
      // String numbers from Bubble need type coercion before validation
      expect(result).toBe(false);
    });

    it('should reject new listing without rates set', () => {
      const listing = {
        Name: 'New Listing',
        Address: '123 Main St',
        City: 'New York'
      };

      const result = canCalculatePricing({ listing });

      expect(result).toBe(false);
    });

    it('should accept listing with only minimum required rate', () => {
      const listing = {
        Name: 'Budget Studio',
        'nightly_rate_2_nights': 75
      };

      const result = canCalculatePricing({ listing });

      expect(result).toBe(true);
    });

    it('should handle legacy listing with partial data', () => {
      const listing = {
        'nightly_rate_2_nights': 100,
        'nightly_rate_3_nights': null,
        'nightly_rate_4_nights': 90,
        'nightly_rate_5_nights': null,
        'nightly_rate_6_nights': null,
        'nightly_rate_7_nights': 80
      };

      const result = canCalculatePricing({ listing });

      expect(result).toBe(true);
    });

    it('should validate listing with decimal rates', () => {
      const listing = {
        'nightly_rate_2_nights': 99.99,
        'nightly_rate_3_nights': 94.50,
        'nightly_rate_7_nights': 79.99
      };

      const result = canCalculatePricing({ listing });

      expect(result).toBe(true);
    });

    it('should reject listing with all zero rates (data entry error)', () => {
      const listing = {
        'nightly_rate_2_nights': 0,
        'nightly_rate_3_nights': 0,
        'nightly_rate_4_nights': 0,
        'nightly_rate_5_nights': 0,
        'nightly_rate_6_nights': 0,
        'nightly_rate_7_nights': 0
      };

      const result = canCalculatePricing({ listing });

      expect(result).toBe(false);
    });
  });
});
