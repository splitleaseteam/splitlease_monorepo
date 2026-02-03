/**
 * Pricing Boundary Conditions Test Suite
 *
 * Tests boundary values and edge cases that often expose calculation bugs.
 * These test cases focus on minimum, maximum, and threshold values.
 *
 * @intent Catch bugs at boundary conditions in pricing calculations
 * @covers Bug inventory: pricing calculator bugs with boundary values
 */
import { describe, it, expect } from 'vitest';
import { calculateFourWeekRent } from '../calculateFourWeekRent.js';
import { calculateGuestFacingPrice } from '../calculateGuestFacingPrice.js';
import { calculateReservationTotal } from '../calculateReservationTotal.js';
import { getNightlyRateByFrequency } from '../getNightlyRateByFrequency.js';
import { calculatePricingBreakdown } from '../calculatePricingBreakdown.js';

describe('Pricing Boundary Conditions', () => {
  // ============================================================================
  // Night Count Boundaries
  // ============================================================================
  describe('night count boundaries (2-7)', () => {
    it('should handle minimum nights (2)', () => {
      const result = calculateFourWeekRent({
        nightlyRate: 100,
        frequency: 2
      });
      expect(result).toBe(800); // 100 * 2 * 4
    });

    it('should handle maximum nights (7)', () => {
      const result = calculateFourWeekRent({
        nightlyRate: 100,
        frequency: 7
      });
      expect(result).toBe(2800); // 100 * 7 * 4
    });

    it('should reject nights below minimum (1)', () => {
      expect(() => calculateFourWeekRent({
        nightlyRate: 100,
        frequency: 1
      })).toThrow();
    });

    it('should reject nights above maximum (8)', () => {
      expect(() => calculateFourWeekRent({
        nightlyRate: 100,
        frequency: 8
      })).toThrow();
    });

    it('should reject zero nights', () => {
      expect(() => calculateFourWeekRent({
        nightlyRate: 100,
        frequency: 0
      })).toThrow();
    });

    it('should reject negative nights', () => {
      expect(() => calculateFourWeekRent({
        nightlyRate: 100,
        frequency: -2
      })).toThrow();
    });

    it('should handle each valid night count', () => {
      const rates = [2, 3, 4, 5, 6, 7];
      rates.forEach(nights => {
        const result = calculateFourWeekRent({
          nightlyRate: 100,
          frequency: nights
        });
        expect(result).toBe(100 * nights * 4);
      });
    });
  });

  // ============================================================================
  // Full-Time Discount Threshold
  // ============================================================================
  describe('full-time discount threshold (7 nights)', () => {
    it('should NOT apply discount at 6 nights', () => {
      const result = calculateGuestFacingPrice({
        hostNightlyRate: 100,
        nightsCount: 6
      });
      // No discount: 100 * 6 = 600, markup: 600 * 0.17 = 102, total: 702, per night: 117
      expect(result).toBe(117);
    });

    it('should apply discount at 7 nights', () => {
      const result = calculateGuestFacingPrice({
        hostNightlyRate: 100,
        nightsCount: 7
      });
      // With discount: lower than 117
      expect(result).toBeLessThan(117);
      expect(result).toBeCloseTo(101.79, 2);
    });

    it('should have price drop at discount threshold', () => {
      const sixNights = calculateGuestFacingPrice({
        hostNightlyRate: 100,
        nightsCount: 6
      });

      const sevenNights = calculateGuestFacingPrice({
        hostNightlyRate: 100,
        nightsCount: 7
      });

      expect(sevenNights).toBeLessThan(sixNights);
    });

    it('should apply 13% discount correctly at threshold', () => {
      const hostRate = 100;
      const nights = 7;

      const result = calculateGuestFacingPrice({
        hostNightlyRate: hostRate,
        nightsCount: nights
      });

      // Verify 13% discount was applied
      const basePrice = hostRate * nights; // 700
      const discount = basePrice * 0.13; // 91
      const discountedPrice = basePrice - discount; // 609
      const markup = discountedPrice * 0.17; // 103.53
      const total = discountedPrice + markup; // 712.53
      const perNight = total / nights; // 101.79

      expect(result).toBeCloseTo(perNight, 2);
    });
  });

  // ============================================================================
  // Price Boundaries
  // ============================================================================
  describe('price value boundaries', () => {
    it('should handle zero price', () => {
      const result = calculateFourWeekRent({
        nightlyRate: 0,
        frequency: 4
      });
      expect(result).toBe(0);
    });

    it('should handle very small price (0.01)', () => {
      const result = calculateFourWeekRent({
        nightlyRate: 0.01,
        frequency: 7
      });
      expect(result).toBeCloseTo(0.28, 2);
    });

    it('should handle minimum realistic price ($1)', () => {
      const result = calculateFourWeekRent({
        nightlyRate: 1,
        frequency: 7
      });
      expect(result).toBe(28);
    });

    it('should handle high price ($1000/night)', () => {
      const result = calculateFourWeekRent({
        nightlyRate: 1000,
        frequency: 7
      });
      expect(result).toBe(28000);
    });

    it('should handle very high price ($10000/night)', () => {
      const result = calculateFourWeekRent({
        nightlyRate: 10000,
        frequency: 7
      });
      expect(result).toBe(280000);
    });

    it('should reject negative price', () => {
      expect(() => calculateFourWeekRent({
        nightlyRate: -100,
        frequency: 4
      })).toThrow();
    });

    it('should handle luxury pricing boundary', () => {
      const result = calculateFourWeekRent({
        nightlyRate: 500,
        frequency: 7
      });
      expect(result).toBe(14000);
    });
  });

  // ============================================================================
  // Week Count Boundaries
  // ============================================================================
  describe('week count boundaries', () => {
    it('should handle minimum weeks (1)', () => {
      const result = calculateReservationTotal({
        fourWeekRent: 1600,
        totalWeeks: 1
      });
      expect(result).toBe(400); // 1600 * (1/4)
    });

    it('should handle 4 weeks (one cycle)', () => {
      const result = calculateReservationTotal({
        fourWeekRent: 1600,
        totalWeeks: 4
      });
      expect(result).toBe(1600); // 1600 * (4/4) = 1600
    });

    it('should handle 13 weeks (quarter)', () => {
      const result = calculateReservationTotal({
        fourWeekRent: 1600,
        totalWeeks: 13
      });
      expect(result).toBe(5200); // 1600 * 3.25
    });

    it('should handle 26 weeks (half year)', () => {
      const result = calculateReservationTotal({
        fourWeekRent: 1600,
        totalWeeks: 26
      });
      expect(result).toBe(10400); // 1600 * 6.5
    });

    it('should handle 52 weeks (full year)', () => {
      const result = calculateReservationTotal({
        fourWeekRent: 1600,
        totalWeeks: 52
      });
      expect(result).toBe(20800); // 1600 * 13
    });

    it('should reject zero weeks', () => {
      expect(() => calculateReservationTotal({
        fourWeekRent: 1600,
        totalWeeks: 0
      })).toThrow('totalWeeks must be positive');
    });

    it('should reject negative weeks', () => {
      expect(() => calculateReservationTotal({
        fourWeekRent: 1600,
        totalWeeks: -4
      })).toThrow('totalWeeks must be positive');
    });

    it('should handle fractional weeks', () => {
      const result = calculateReservationTotal({
        fourWeekRent: 1600,
        totalWeeks: 2.5
      });
      expect(result).toBe(1000); // 1600 * 0.625
    });
  });

  // ============================================================================
  // Fee Boundaries
  // ============================================================================
  describe('fee boundaries', () => {
    it('should handle zero cleaning fee', () => {
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

    it('should handle zero damage deposit', () => {
      const result = calculatePricingBreakdown({
        listing: {
          'nightly_rate_4_nights': 100,
          'damage_deposit': 0
        },
        nightsPerWeek: 4,
        reservationWeeks: 4
      });
      expect(result.damageDeposit).toBe(0);
    });

    it('should handle maximum realistic cleaning fee', () => {
      const result = calculatePricingBreakdown({
        listing: {
          'nightly_rate_4_nights': 100,
          'cleaning_fee': 500
        },
        nightsPerWeek: 4,
        reservationWeeks: 4
      });
      expect(result.cleaningFee).toBe(500);
    });

    it('should handle maximum realistic damage deposit', () => {
      const result = calculatePricingBreakdown({
        listing: {
          'nightly_rate_4_nights': 100,
          'damage_deposit': 10000
        },
        nightsPerWeek: 4,
        reservationWeeks: 4
      });
      expect(result.damageDeposit).toBe(10000);
    });

    it('should reject negative cleaning fee', () => {
      expect(() => calculatePricingBreakdown({
        listing: {
          'nightly_rate_4_nights': 100,
          'cleaning_fee': -50
        },
        nightsPerWeek: 4,
        reservationWeeks: 4
      })).toThrow('Cleaning Fee cannot be negative');
    });

    it('should reject negative damage deposit', () => {
      expect(() => calculatePricingBreakdown({
        listing: {
          'nightly_rate_4_nights': 100,
          'damage_deposit': -500
        },
        nightsPerWeek: 4,
        reservationWeeks: 4
      })).toThrow('Damage Deposit cannot be negative');
    });
  });

  // ============================================================================
  // Markup Rate Boundaries
  // ============================================================================
  describe('markup rate boundaries', () => {
    it('should handle 17% markup correctly', () => {
      const result = calculateGuestFacingPrice({
        hostNightlyRate: 100,
        nightsCount: 4
      });
      expect(result).toBe(117); // 100 * 1.17 = 117
    });

    it('should handle markup with discount (7 nights)', () => {
      const result = calculateGuestFacingPrice({
        hostNightlyRate: 100,
        nightsCount: 7
      });
      // Net effect: 13% discount then 17% markup
      expect(result).toBeCloseTo(101.79, 2);
    });

    it('should verify markup is always applied', () => {
      const twoNights = calculateGuestFacingPrice({
        hostNightlyRate: 100,
        nightsCount: 2
      });

      const sevenNights = calculateGuestFacingPrice({
        hostNightlyRate: 100,
        nightsCount: 7
      });

      // Both should have markup applied
      expect(twoNights).toBeGreaterThan(100);
      expect(sevenNights).toBeGreaterThan(100);
    });
  });

  // ============================================================================
  // Price Override Boundaries
  // ============================================================================
  describe('price override boundaries', () => {
    it('should use override when present', () => {
      const listing = {
        'nightly_rate_4_nights': 100,
        'price_override': 150
      };

      const result = getNightlyRateByFrequency({
        listing,
        nightsSelected: 4
      });

      expect(result).toBe(150);
    });

    it('should ignore override when zero (falsy)', () => {
      const listing = {
        'nightly_rate_4_nights': 100,
        'price_override': 0
      };

      const result = getNightlyRateByFrequency({
        listing,
        nightsSelected: 4
      });

      expect(result).toBe(100); // Falls back to tiered rate
    });

    it('should reject negative override', () => {
      const listing = {
        'nightly_rate_4_nights': 100,
        'price_override': -50
      };

      expect(() => getNightlyRateByFrequency({
        listing,
        nightsSelected: 4
      })).toThrow('Invalid price override value');
    });

    it('should reject NaN override', () => {
      const listing = {
        'nightly_rate_4_nights': 100,
        'price_override': 'invalid'
      };

      expect(() => getNightlyRateByFrequency({
        listing,
        nightsSelected: 4
      })).toThrow('Invalid price override value');
    });
  });

  // ============================================================================
  // Array Index Boundaries (PricingList)
  // ============================================================================
  describe('pricing list array boundaries', () => {
    it('should handle first element (index 0 = 1 night)', () => {
      // Index 0 represents 1 night (though min is 2 nights in practice)
      const listing = {
        'nightly_rate_1_night': 200
      };

      const result = getNightlyRateByFrequency({
        listing,
        nightsSelected: 1 // This will fail validation, but tests the mapping
      });
      // Note: nightsSelected: 1 is below range, so this throws
      expect(result).toBeUndefined();
    });

    it('should handle last element (index 6 = 7 nights)', () => {
      const listing = {
        'nightly_rate_7_nights': 75
      };

      const result = getNightlyRateByFrequency({
        listing,
        nightsSelected: 7
      });

      expect(result).toBe(75);
    });

    it('should map all night counts to correct fields', () => {
      const listing = {
        'nightly_rate_2_nights': 150,
        'nightly_rate_3_nights': 140,
        'nightly_rate_4_nights': 130,
        'nightly_rate_5_nights': 120,
        'nightly_rate_6_nights': 110,
        'nightly_rate_7_nights': 100
      };

      expect(getNightlyRateByFrequency({ listing, nightsSelected: 2 })).toBe(150);
      expect(getNightlyRateByFrequency({ listing, nightsSelected: 3 })).toBe(140);
      expect(getNightlyRateByFrequency({ listing, nightsSelected: 4 })).toBe(130);
      expect(getNightlyRateByFrequency({ listing, nightsSelected: 5 })).toBe(120);
      expect(getNightlyRateByFrequency({ listing, nightsSelected: 6 })).toBe(110);
      expect(getNightlyRateByFrequency({ listing, nightsSelected: 7 })).toBe(100);
    });
  });

  // ============================================================================
  // Safe Integer Boundaries
  // ============================================================================
  describe('safe integer boundaries', () => {
    it('should not exceed MAX_SAFE_INTEGER for realistic pricing', () => {
      const result = calculateReservationTotal({
        fourWeekRent: 1000000,
        totalWeeks: 52
      });

      expect(result).toBeLessThanOrEqual(Number.MAX_SAFE_INTEGER);
      expect(Number.isSafeInteger(result)).toBe(true);
    });

    it('should handle large values without precision loss', () => {
      const result = calculateFourWeekRent({
        nightlyRate: 100000,
        frequency: 7
      });

      expect(result).toBe(2800000);
      expect(Number.isSafeInteger(result)).toBe(true);
    });
  });

  // ============================================================================
  // Precision Thresholds
  // ============================================================================
  describe('precision threshold boundaries', () => {
    it('should handle .005 rounding threshold', () => {
      const result = calculateGuestFacingPrice({
        hostNightlyRate: 100.005,
        nightsCount: 4
      });

      // Should round to 2 decimal places
      expect(result).toBeCloseTo(117.01, 2);
    });

    it('should handle .995 rounding threshold', () => {
      const result = calculateGuestFacingPrice({
        hostNightlyRate: 99.995,
        nightsCount: 4
      });

      // Should round to 2 decimal places
      expect(result).toBeCloseTo(117, 2);
    });

    it('should handle repeating decimals in division', () => {
      const result = calculateReservationTotal({
        fourWeekRent: 1000,
        totalWeeks: 3
      });

      // 1000 * (3/4) = 750 (exactly)
      expect(result).toBe(750);
    });
  });

  // ============================================================================
  // Combined Boundary Scenarios
  // ============================================================================
  describe('combined boundary scenarios', () => {
    it('should handle minimum values combination', () => {
      const result = calculatePricingBreakdown({
        listing: {
          'nightly_rate_2_nights': 1,
          'cleaning_fee': 0,
          'damage_deposit': 0
        },
        nightsPerWeek: 2,
        reservationWeeks: 1
      });

      expect(result.nightlyPrice).toBe(1);
      expect(result.fourWeekRent).toBe(8); // 1 * 2 * 4
      expect(result.reservationTotal).toBe(2); // 8 * (1/4)
    });

    it('should handle maximum values combination', () => {
      const result = calculatePricingBreakdown({
        listing: {
          'nightly_rate_7_nights': 10000,
          'cleaning_fee': 500,
          'damage_deposit': 10000
        },
        nightsPerWeek: 7,
        reservationWeeks: 52
      });

      expect(result.nightlyPrice).toBe(10000);
      expect(result.fourWeekRent).toBe(280000); // 10000 * 7 * 4
      expect(result.reservationTotal).toBe(3640000); // 280000 * 13
    });

    it('should handle boundary at discount threshold', () => {
      const listing6 = {
        'nightly_rate_6_nights': 100
      };

      const listing7 = {
        'nightly_rate_7_nights': 100
      };

      const price6 = calculateGuestFacingPrice({
        hostNightlyRate: getNightlyRateByFrequency({ listing: listing6, nightsSelected: 6 }),
        nightsCount: 6
      });

      const price7 = calculateGuestFacingPrice({
        hostNightlyRate: getNightlyRateByFrequency({ listing: listing7, nightsSelected: 7 }),
        nightsCount: 7
      });

      // 7 nights should be cheaper due to discount
      expect(price7).toBeLessThan(price6);
    });
  });
});
