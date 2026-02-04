/**
 * Tests for calculatePricingBreakdown
 *
 * Provides comprehensive price calculation including all fees.
 * Combines nightly rate, 4-week rent, reservation total, and fees.
 * All calculations must succeed or throw - no partial results.
 */
import { describe, it, expect } from 'vitest';
import { calculatePricingBreakdown } from '../calculatePricingBreakdown.js';

describe('calculatePricingBreakdown', () => {
  // ============================================================================
  // Happy Path - Complete Pricing Breakdown
  // ============================================================================
  describe('complete pricing breakdown', () => {
    it('should calculate full breakdown for standard 4-night, 13-week stay', () => {
      const result = calculatePricingBreakdown({
        listing: {
          'nightly_rate_4_nights': 100,
          'cleaning_fee': 50,
          'damage_deposit': 500
        },
        nightsPerWeek: 4,
        reservationWeeks: 13
      });

      expect(result.valid).toBe(true);
      expect(result.nightlyPrice).toBe(100);
      expect(result.fourWeekRent).toBe(1600); // 100 * 4 * 4
      expect(result.reservationTotal).toBe(5200); // 1600 * (13/4)
      expect(result.cleaningFee).toBe(50);
      expect(result.damageDeposit).toBe(500);
      expect(result.grandTotal).toBe(5250); // 5200 + 50
    });

    it('should calculate breakdown for 7-night, 52-week stay (full-time, full year)', () => {
      const result = calculatePricingBreakdown({
        listing: {
          'nightly_rate_7_nights': 80,
          'cleaning_fee': 100,
          'damage_deposit': 1000
        },
        nightsPerWeek: 7,
        reservationWeeks: 52
      });

      expect(result.valid).toBe(true);
      expect(result.nightlyPrice).toBe(80);
      expect(result.fourWeekRent).toBe(2240); // 80 * 7 * 4
      expect(result.reservationTotal).toBe(29120); // 2240 * (52/4)
      expect(result.cleaningFee).toBe(100);
      expect(result.damageDeposit).toBe(1000);
      expect(result.grandTotal).toBe(29220);
    });

    it('should calculate breakdown for minimum stay (2 nights, 4 weeks)', () => {
      const result = calculatePricingBreakdown({
        listing: {
          'nightly_rate_2_nights': 150,
          'cleaning_fee': 25,
          'damage_deposit': 200
        },
        nightsPerWeek: 2,
        reservationWeeks: 4
      });

      expect(result.valid).toBe(true);
      expect(result.nightlyPrice).toBe(150);
      expect(result.fourWeekRent).toBe(1200); // 150 * 2 * 4
      expect(result.reservationTotal).toBe(1200); // 1200 * (4/4)
      expect(result.cleaningFee).toBe(25);
      expect(result.grandTotal).toBe(1225);
    });
  });

  // ============================================================================
  // Missing Optional Fees
  // ============================================================================
  describe('missing optional fees', () => {
    it('should default cleaning fee to 0 when null', () => {
      const result = calculatePricingBreakdown({
        listing: {
          'nightly_rate_4_nights': 100,
          'cleaning_fee': null,
          'damage_deposit': 500
        },
        nightsPerWeek: 4,
        reservationWeeks: 4
      });

      expect(result.cleaningFee).toBe(0);
      expect(result.grandTotal).toBe(1600); // No cleaning fee added
    });

    it('should default cleaning fee to 0 when undefined', () => {
      const result = calculatePricingBreakdown({
        listing: {
          'nightly_rate_4_nights': 100,
          'damage_deposit': 500
        },
        nightsPerWeek: 4,
        reservationWeeks: 4
      });

      expect(result.cleaningFee).toBe(0);
      expect(result.grandTotal).toBe(1600);
    });

    it('should default damage deposit to 0 when null', () => {
      const result = calculatePricingBreakdown({
        listing: {
          'nightly_rate_4_nights': 100,
          'cleaning_fee': 50,
          'damage_deposit': null
        },
        nightsPerWeek: 4,
        reservationWeeks: 4
      });

      expect(result.damageDeposit).toBe(0);
      expect(result.grandTotal).toBe(1650); // 1600 + 50
    });

    it('should default damage deposit to 0 when undefined', () => {
      const result = calculatePricingBreakdown({
        listing: {
          'nightly_rate_4_nights': 100,
          'cleaning_fee': 50
        },
        nightsPerWeek: 4,
        reservationWeeks: 4
      });

      expect(result.damageDeposit).toBe(0);
      expect(result.grandTotal).toBe(1650);
    });

    it('should handle all optional fees missing', () => {
      const result = calculatePricingBreakdown({
        listing: {
          'nightly_rate_4_nights': 100
        },
        nightsPerWeek: 4,
        reservationWeeks: 4
      });

      expect(result.cleaningFee).toBe(0);
      expect(result.damageDeposit).toBe(0);
      expect(result.grandTotal).toBe(1600);
    });
  });

  // ============================================================================
  // Error Handling - Listing Validation
  // ============================================================================
  describe('error handling - listing validation', () => {
    it('should throw error for null listing', () => {
      expect(() => calculatePricingBreakdown({
        listing: null,
        nightsPerWeek: 4,
        reservationWeeks: 13
      })).toThrow('listing must be a valid object');
    });

    it('should throw error for undefined listing', () => {
      expect(() => calculatePricingBreakdown({
        listing: undefined,
        nightsPerWeek: 4,
        reservationWeeks: 13
      })).toThrow('listing must be a valid object');
    });

    it('should throw error for non-object listing', () => {
      expect(() => calculatePricingBreakdown({
        listing: 'not an object',
        nightsPerWeek: 4,
        reservationWeeks: 13
      })).toThrow('listing must be a valid object');
    });

    it('should handle array listing as object (missing fields)', () => {
      // Note: Arrays are objects in JavaScript, so they pass the type check
      // But they won't have the expected price fields, causing downstream error
      expect(() => calculatePricingBreakdown({
        listing: [],
        nightsPerWeek: 4,
        reservationWeeks: 13
      })).toThrow();
    });

    it('should throw error for missing nightly rate', () => {
      expect(() => calculatePricingBreakdown({
        listing: {
          'cleaning_fee': 50
        },
        nightsPerWeek: 4,
        reservationWeeks: 13
      })).toThrow();
    });
  });

  // ============================================================================
  // Error Handling - Parameter Validation
  // ============================================================================
  describe('error handling - parameter validation', () => {
    it('should throw error for null nightsPerWeek', () => {
      expect(() => calculatePricingBreakdown({
        listing: { 'nightly_rate_4_nights': 100 },
        nightsPerWeek: null,
        reservationWeeks: 13
      })).toThrow();
    });

    it('should throw error for undefined nightsPerWeek', () => {
      expect(() => calculatePricingBreakdown({
        listing: { 'nightly_rate_4_nights': 100 },
        nightsPerWeek: undefined,
        reservationWeeks: 13
      })).toThrow();
    });

    it('should throw error for non-number nightsPerWeek', () => {
      expect(() => calculatePricingBreakdown({
        listing: { 'nightly_rate_4_nights': 100 },
        nightsPerWeek: 'four',
        reservationWeeks: 13
      })).toThrow();
    });

    it('should throw error for null reservationWeeks', () => {
      expect(() => calculatePricingBreakdown({
        listing: { 'nightly_rate_4_nights': 100 },
        nightsPerWeek: 4,
        reservationWeeks: null
      })).toThrow();
    });

    it('should throw error for undefined reservationWeeks', () => {
      expect(() => calculatePricingBreakdown({
        listing: { 'nightly_rate_4_nights': 100 },
        nightsPerWeek: 4,
        reservationWeeks: undefined
      })).toThrow();
    });

    it('should throw error for non-number reservationWeeks', () => {
      expect(() => calculatePricingBreakdown({
        listing: { 'nightly_rate_4_nights': 100 },
        nightsPerWeek: 4,
        reservationWeeks: 'thirteen'
      })).toThrow();
    });
  });

  // ============================================================================
  // Error Handling - Fee Validation
  // ============================================================================
  describe('error handling - fee validation', () => {
    it('should throw error for NaN cleaning fee', () => {
      expect(() => calculatePricingBreakdown({
        listing: {
          'nightly_rate_4_nights': 100,
          'cleaning_fee': 'fifty'
        },
        nightsPerWeek: 4,
        reservationWeeks: 13
      })).toThrow('Cleaning Fee has invalid value');
    });

    it('should throw error for negative cleaning fee', () => {
      expect(() => calculatePricingBreakdown({
        listing: {
          'nightly_rate_4_nights': 100,
          'cleaning_fee': -50
        },
        nightsPerWeek: 4,
        reservationWeeks: 13
      })).toThrow('Cleaning Fee cannot be negative');
    });

    it('should throw error for NaN damage deposit', () => {
      expect(() => calculatePricingBreakdown({
        listing: {
          'nightly_rate_4_nights': 100,
          'damage_deposit': 'five hundred'
        },
        nightsPerWeek: 4,
        reservationWeeks: 13
      })).toThrow('Damage Deposit has invalid value');
    });

    it('should throw error for negative damage deposit', () => {
      expect(() => calculatePricingBreakdown({
        listing: {
          'nightly_rate_4_nights': 100,
          'damage_deposit': -500
        },
        nightsPerWeek: 4,
        reservationWeeks: 13
      })).toThrow('Damage Deposit cannot be negative');
    });
  });

  // ============================================================================
  // Output Structure Verification
  // ============================================================================
  describe('output structure verification', () => {
    it('should return all expected properties', () => {
      const result = calculatePricingBreakdown({
        listing: {
          'nightly_rate_4_nights': 100,
          'cleaning_fee': 50,
          'damage_deposit': 500
        },
        nightsPerWeek: 4,
        reservationWeeks: 13
      });

      expect(result).toHaveProperty('nightlyPrice');
      expect(result).toHaveProperty('fourWeekRent');
      expect(result).toHaveProperty('reservationTotal');
      expect(result).toHaveProperty('cleaningFee');
      expect(result).toHaveProperty('damageDeposit');
      expect(result).toHaveProperty('grandTotal');
      expect(result).toHaveProperty('valid');
    });

    it('should return correct types for all properties', () => {
      const result = calculatePricingBreakdown({
        listing: {
          'nightly_rate_4_nights': 100,
          'cleaning_fee': 50,
          'damage_deposit': 500
        },
        nightsPerWeek: 4,
        reservationWeeks: 13
      });

      expect(typeof result.nightlyPrice).toBe('number');
      expect(typeof result.fourWeekRent).toBe('number');
      expect(typeof result.reservationTotal).toBe('number');
      expect(typeof result.cleaningFee).toBe('number');
      expect(typeof result.damageDeposit).toBe('number');
      expect(typeof result.grandTotal).toBe('number');
      expect(typeof result.valid).toBe('boolean');
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================
  describe('edge cases', () => {
    it('should handle minimum nights (2)', () => {
      const result = calculatePricingBreakdown({
        listing: { 'nightly_rate_2_nights': 100 },
        nightsPerWeek: 2,
        reservationWeeks: 4
      });

      expect(result.valid).toBe(true);
      expect(result.nightlyPrice).toBe(100);
      expect(result.fourWeekRent).toBe(800); // 100 * 2 * 4
    });

    it('should handle maximum nights (7)', () => {
      const result = calculatePricingBreakdown({
        listing: { 'nightly_rate_7_nights': 100 },
        nightsPerWeek: 7,
        reservationWeeks: 4
      });

      expect(result.valid).toBe(true);
      expect(result.nightlyPrice).toBe(100);
      expect(result.fourWeekRent).toBe(2800); // 100 * 7 * 4
    });

    it('should handle single week reservation', () => {
      const result = calculatePricingBreakdown({
        listing: { 'nightly_rate_4_nights': 100 },
        nightsPerWeek: 4,
        reservationWeeks: 1
      });

      expect(result.reservationTotal).toBe(400); // 1600 * (1/4)
    });

    it('should handle large reservation (52 weeks)', () => {
      const result = calculatePricingBreakdown({
        listing: { 'nightly_rate_4_nights': 100 },
        nightsPerWeek: 4,
        reservationWeeks: 52
      });

      expect(result.reservationTotal).toBe(20800); // 1600 * (52/4)
    });

    it('should handle decimal/float prices', () => {
      const result = calculatePricingBreakdown({
        listing: {
          'nightly_rate_4_nights': 99.99,
          'cleaning_fee': 49.99
        },
        nightsPerWeek: 4,
        reservationWeeks: 4
      });

      expect(result.nightlyPrice).toBeCloseTo(99.99);
      expect(result.cleaningFee).toBeCloseTo(49.99);
    });

    it('should handle zero cleaning fee explicitly', () => {
      const result = calculatePricingBreakdown({
        listing: {
          'nightly_rate_4_nights': 100,
          'cleaning_fee': 0
        },
        nightsPerWeek: 4,
        reservationWeeks: 4
      });

      expect(result.cleaningFee).toBe(0);
      expect(result.grandTotal).toBe(1600);
    });

    it('should handle string numbers for fees', () => {
      const result = calculatePricingBreakdown({
        listing: {
          'nightly_rate_4_nights': 100,
          'cleaning_fee': '50',
          'damage_deposit': '500'
        },
        nightsPerWeek: 4,
        reservationWeeks: 4
      });

      expect(result.cleaningFee).toBe(50);
      expect(result.damageDeposit).toBe(500);
    });
  });

  // ============================================================================
  // Real-World Scenarios
  // ============================================================================
  describe('real-world scenarios', () => {
    it('should calculate typical Mon-Thu 3-month stay', () => {
      const result = calculatePricingBreakdown({
        listing: {
          'nightly_rate_4_nights': 125,
          'cleaning_fee': 75,
          'damage_deposit': 750
        },
        nightsPerWeek: 4,
        reservationWeeks: 13
      });

      expect(result.nightlyPrice).toBe(125);
      expect(result.fourWeekRent).toBe(2000); // 125 * 4 * 4
      expect(result.reservationTotal).toBe(6500); // 2000 * (13/4)
      expect(result.grandTotal).toBe(6575); // 6500 + 75
    });

    it('should calculate weekend getaway 1-month stay', () => {
      const result = calculatePricingBreakdown({
        listing: {
          'nightly_rate_2_nights': 200,
          'cleaning_fee': 40,
          'damage_deposit': 300
        },
        nightsPerWeek: 2,
        reservationWeeks: 4
      });

      expect(result.nightlyPrice).toBe(200);
      expect(result.fourWeekRent).toBe(1600); // 200 * 2 * 4
      expect(result.reservationTotal).toBe(1600);
      expect(result.grandTotal).toBe(1640);
    });

    it('should calculate full-time year-long stay', () => {
      const result = calculatePricingBreakdown({
        listing: {
          'nightly_rate_7_nights': 70,
          'cleaning_fee': 150,
          'damage_deposit': 1500
        },
        nightsPerWeek: 7,
        reservationWeeks: 52
      });

      expect(result.nightlyPrice).toBe(70);
      expect(result.fourWeekRent).toBe(1960); // 70 * 7 * 4
      expect(result.reservationTotal).toBe(25480); // 1960 * (52/4)
      expect(result.grandTotal).toBe(25630);
    });
  });
});
