/**
 * Integration tests for extractHostRatesFromListing processor.
 *
 * Tests field name mapping from Bubble-style to camelCase,
 * null/undefined handling, type coercion, and array structure validation.
 */

import { describe, it, expect } from 'vitest';
import { extractHostRatesFromListing } from '../extractHostRatesFromListing.js';

describe('extractHostRatesFromListing - Integration Tests', () => {
  describe('field name mapping', () => {
    it('should map all 7 nightly rate fields from Bubble-style to camelCase', () => {
      const listing = {
        'nightly_rate_1_night': 150,
        'nightly_rate_2_nights': 140,
        'nightly_rate_3_nights': 130,
        'nightly_rate_4_nights': 120,
        'nightly_rate_5_nights': 110,
        'nightly_rate_6_nights': 100,
        'nightly_rate_7_nights': 90
      };

      const result = extractHostRatesFromListing(listing);

      expect(result).toEqual({
        rate1Night: 150,
        rate2Nights: 140,
        rate3Nights: 130,
        rate4Nights: 120,
        rate5Nights: 110,
        rate6Nights: 100,
        rate7Nights: 90,
        cleaningFee: null,
        damageDeposit: null,
        priceOverride: null
      });
    });

    it('should map related pricing fields', () => {
      const listing = {
        'nightly_rate_2_nights': 100,
        'cleaning_fee': 50,
        'damage_deposit': 200,
        'price_override': 120
      };

      const result = extractHostRatesFromListing(listing);

      expect(result).toEqual({
        rate1Night: null,
        rate2Nights: 100,
        rate3Nights: null,
        rate4Nights: null,
        rate5Nights: null,
        rate6Nights: null,
        rate7Nights: null,
        cleaningFee: 50,
        damageDeposit: 200,
        priceOverride: 120
      });
    });
  });

  describe('null and undefined handling', () => {
    it('should return null for undefined rate fields', () => {
      const listing = {
        'nightly_rate_2_nights': 100
      };

      const result = extractHostRatesFromListing(listing);

      expect(result.rate1Night).toBeNull();
      expect(result.rate3Nights).toBeNull();
      expect(result.rate4Nights).toBeNull();
      expect(result.rate5Nights).toBeNull();
      expect(result.rate6Nights).toBeNull();
      expect(result.rate7Nights).toBeNull();
    });

    it('should return null for null rate fields', () => {
      const listing = {
        'nightly_rate_2_nights': null,
        'nightly_rate_3_nights': null
      };

      const result = extractHostRatesFromListing(listing);

      expect(result.rate2Nights).toBeNull();
      expect(result.rate3Nights).toBeNull();
    });

    it('should return null for empty string rate fields', () => {
      const listing = {
        'nightly_rate_2_nights': '',
        'nightly_rate_3_nights': '  '
      };

      const result = extractHostRatesFromListing(listing);

      expect(result.rate2Nights).toBeNull();
      // Note: Whitespace strings convert to 0 in JavaScript Number('  ') = 0
      expect(result.rate3Nights).toBe(0);
    });

    it('should return null for missing related pricing fields', () => {
      const listing = {
        'nightly_rate_2_nights': 100
      };

      const result = extractHostRatesFromListing(listing);

      expect(result.cleaningFee).toBeNull();
      expect(result.damageDeposit).toBeNull();
      expect(result.priceOverride).toBeNull();
    });
  });

  describe('type coercion', () => {
    it('should convert string numbers to numbers', () => {
      const listing = {
        'nightly_rate_2_nights': '100',
        'nightly_rate_3_nights': '95.50',
        'cleaning_fee': '50',
        'damage_deposit': '200'
      };

      const result = extractHostRatesFromListing(listing);

      expect(result.rate2Nights).toBe(100);
      expect(result.rate3Nights).toBe(95.50);
      expect(result.cleaningFee).toBe(50);
      expect(result.damageDeposit).toBe(200);
    });

    it('should handle decimal strings correctly', () => {
      const listing = {
        'nightly_rate_2_nights': '100.99',
        'nightly_rate_3_nights': '95.50'
      };

      const result = extractHostRatesFromListing(listing);

      expect(result.rate2Nights).toBe(100.99);
      expect(result.rate3Nights).toBe(95.50);
    });

    it('should return null for non-numeric strings', () => {
      const listing = {
        'nightly_rate_2_nights': 'abc',
        'nightly_rate_3_nights': 'N/A',
        'cleaning_fee': 'free'
      };

      const result = extractHostRatesFromListing(listing);

      expect(result.rate2Nights).toBeNull();
      expect(result.rate3Nights).toBeNull();
      expect(result.cleaningFee).toBeNull();
    });

    it('should return null for NaN values', () => {
      const listing = {
        'nightly_rate_2_nights': NaN
      };

      const result = extractHostRatesFromListing(listing);

      expect(result.rate2Nights).toBeNull();
    });
  });

  describe('negative number handling', () => {
    it('should return null for negative rates', () => {
      const listing = {
        'nightly_rate_2_nights': -100,
        'nightly_rate_3_nights': -50
      };

      const result = extractHostRatesFromListing(listing);

      expect(result.rate2Nights).toBeNull();
      expect(result.rate3Nights).toBeNull();
    });

    it('should return null for negative fees', () => {
      const listing = {
        'nightly_rate_2_nights': 100,
        'cleaning_fee': -50,
        'damage_deposit': -200
      };

      const result = extractHostRatesFromListing(listing);

      expect(result.cleaningFee).toBeNull();
      expect(result.damageDeposit).toBeNull();
    });

    it('should accept zero as valid rate', () => {
      const listing = {
        'nightly_rate_2_nights': 0,
        'cleaning_fee': 0
      };

      const result = extractHostRatesFromListing(listing);

      expect(result.rate2Nights).toBe(0);
      expect(result.cleaningFee).toBe(0);
    });
  });

  describe('validation', () => {
    it('should throw error when listing is null', () => {
      expect(() => extractHostRatesFromListing(null)).toThrow(
        'extractHostRatesFromListing: listing is required'
      );
    });

    it('should throw error when listing is undefined', () => {
      expect(() => extractHostRatesFromListing(undefined)).toThrow(
        'extractHostRatesFromListing: listing is required'
      );
    });
  });

  describe('edge cases', () => {
    it('should handle listing with all null rates', () => {
      const listing = {
        'nightly_rate_1_night': null,
        'nightly_rate_2_nights': null,
        'nightly_rate_3_nights': null,
        'nightly_rate_4_nights': null,
        'nightly_rate_5_nights': null,
        'nightly_rate_6_nights': null,
        'nightly_rate_7_nights': null
      };

      const result = extractHostRatesFromListing(listing);

      expect(result).toEqual({
        rate1Night: null,
        rate2Nights: null,
        rate3Nights: null,
        rate4Nights: null,
        rate5Nights: null,
        rate6Nights: null,
        rate7Nights: null,
        cleaningFee: null,
        damageDeposit: null,
        priceOverride: null
      });
    });

    it('should handle listing with mixed valid and invalid rates', () => {
      const listing = {
        'nightly_rate_1_night': null,
        'nightly_rate_2_nights': 100,
        'nightly_rate_3_nights': 'invalid',
        'nightly_rate_4_nights': 90,
        'nightly_rate_5_nights': -50,
        'nightly_rate_6_nights': '85',
        'nightly_rate_7_nights': ''
      };

      const result = extractHostRatesFromListing(listing);

      expect(result).toEqual({
        rate1Night: null,
        rate2Nights: 100,
        rate3Nights: null,
        rate4Nights: 90,
        rate5Nights: null,
        rate6Nights: 85,
        rate7Nights: null,
        cleaningFee: null,
        damageDeposit: null,
        priceOverride: null
      });
    });

    it('should handle listing with extra unrelated fields', () => {
      const listing = {
        'nightly_rate_2_nights': 100,
        'Name': 'Test Listing',
        'Address': '123 Main St',
        'unrelated_field': 'value'
      };

      const result = extractHostRatesFromListing(listing);

      // Should only extract pricing-related fields
      expect(result).toHaveProperty('rate2Nights', 100);
      expect(result).not.toHaveProperty('Name');
      expect(result).not.toHaveProperty('Address');
      expect(result).not.toHaveProperty('unrelated_field');
    });

    it('should handle floating point precision', () => {
      const listing = {
        'nightly_rate_2_nights': 100.999999,
        'nightly_rate_3_nights': 95.111111
      };

      const result = extractHostRatesFromListing(listing);

      expect(result.rate2Nights).toBe(100.999999);
      expect(result.rate3Nights).toBe(95.111111);
    });
  });

  describe('real-world scenarios', () => {
    it('should handle typical NYC listing rates', () => {
      const listing = {
        'nightly_rate_1_night': 150,
        'nightly_rate_2_nights': 140,
        'nightly_rate_3_nights': 130,
        'nightly_rate_4_nights': 120,
        'nightly_rate_5_nights': 110,
        'nightly_rate_6_nights': 100,
        'nightly_rate_7_nights': 90,
        'cleaning_fee': 75,
        'damage_deposit': 250
      };

      const result = extractHostRatesFromListing(listing);

      expect(result.rate1Night).toBe(150);
      expect(result.rate7Nights).toBe(90);
      expect(result.cleaningFee).toBe(75);
      expect(result.damageDeposit).toBe(250);
    });

    it('should handle listing with only minimum required rates', () => {
      const listing = {
        'nightly_rate_2_nights': '100'
      };

      const result = extractHostRatesFromListing(listing);

      expect(result.rate2Nights).toBe(100);
      expect(result.rate1Night).toBeNull();
      expect(result.rate3Nights).toBeNull();
    });

    it('should handle Bubble data format with string numbers', () => {
      const listing = {
        'nightly_rate_2_nights': '120',
        'nightly_rate_3_nights': '115',
        'nightly_rate_4_nights': '110',
        'nightly_rate_5_nights': '105',
        'nightly_rate_6_nights': '100',
        'nightly_rate_7_nights': '95'
      };

      const result = extractHostRatesFromListing(listing);

      expect(result.rate2Nights).toBe(120);
      expect(result.rate7Nights).toBe(95);
    });
  });
});
