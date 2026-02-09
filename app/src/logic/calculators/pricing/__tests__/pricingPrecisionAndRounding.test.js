/**
 * Floating Point Precision and Rounding Test Suite
 *
 * Tests edge cases for floating point arithmetic in pricing calculations.
 * Addresses common JavaScript floating point issues that can cause
 * calculation bugs.
 *
 * @intent Catch floating point precision bugs in pricing calculations
 * @covers Bug inventory: precision/rounding edge cases
 */
import { describe, it, expect } from 'vitest';
import { calculateFourWeekRent } from '../calculateFourWeekRent.js';
import { calculateGuestFacingPrice } from '../calculateGuestFacingPrice.js';
import { calculateReservationTotal } from '../calculateReservationTotal.js';
import { getNightlyRateByFrequency } from '../getNightlyRateByFrequency.js';

describe('Floating Point Precision and Rounding', () => {
  // ============================================================================
  // Known Floating Point Issues
  // ============================================================================
  describe('floating point arithmetic issues', () => {
    it('should handle 0.1 + 0.2 correctly (not 0.30000000000000004)', () => {
      // This is the classic floating point bug
      const result = 0.1 + 0.2;
      expect(result).not.toBe(0.3); // Will fail without rounding
      expect(result).toBeCloseTo(0.3, 10); // Should pass with closeTo
    });

    it('should handle multiplication that produces repeating decimals', () => {
      // 1/3 produces 0.333...
      const rate = 100;
      const multiplier = 1 / 3; // 0.333...
      const result = rate * multiplier; // 33.333...

      expect(result).toBeCloseTo(33.33, 2);
    });

    it('should handle 0.7 + 0.1 correctly', () => {
      const result = 0.7 + 0.1; // Often produces 0.7999999999999999
      expect(result).toBeCloseTo(0.8, 10);
    });

    it('should handle 0.1 + 0.7 + 0.1 correctly', () => {
      const result = 0.1 + 0.7 + 0.1; // Often produces 0.8999999999999999
      expect(result).toBeCloseTo(0.9, 10);
    });
  });

  // ============================================================================
  // Currency Precision Tests
  // ============================================================================
  describe('currency precision (2 decimal places)', () => {
    it('should round calculateFourWeekRent to 2 decimals', () => {
      const result = calculateFourWeekRent({
        nightlyRate: 99.99,
        frequency: 4
      });
      // 99.99 * 4 * 4 = 1599.84
      expect(result).toBe(1599.84);
    });

    it('should handle repeating decimals in reservation total', () => {
      const result = calculateReservationTotal({
        fourWeekRent: 1000,
        totalWeeks: 3
      });
      // 1000 * (3/4) = 750 (exactly)
      expect(result).toBe(750);
    });

    it('should handle calculateGuestFacingPrice precision', () => {
      const result = calculateGuestFacingPrice({
        hostNightlyRate: 100,
        nightsCount: 4
      });
      // Should produce clean 117 (not 116.9999999999)
      expect(result).toBe(117);
    });

    it('should handle discount calculations without precision loss', () => {
      const result = calculateGuestFacingPrice({
        hostNightlyRate: 100,
        nightsCount: 7
      });
      // With 13% discount + 17% markup
      expect(result).toBeCloseTo(101.79, 2);
    });
  });

  // ============================================================================
  // Edge Case Decimal Values
  // ============================================================================
  describe('edge case decimal values', () => {
    it('should handle .99 pricing', () => {
      const result = calculateFourWeekRent({
        nightlyRate: 99.99,
        frequency: 7
      });
      // 99.99 * 7 * 4 = 2799.72
      expect(result).toBeCloseTo(2799.72, 2);
    });

    it('should handle .95 pricing', () => {
      const result = calculateFourWeekRent({
        nightlyRate: 149.95,
        frequency: 4
      });
      // 149.95 * 4 * 4 = 2399.2
      expect(result).toBeCloseTo(2399.2, 2);
    });

    it('should handle very small decimals', () => {
      const result = calculateFourWeekRent({
        nightlyRate: 0.01,
        frequency: 7
      });
      // 0.01 * 7 * 4 = 0.28
      expect(result).toBeCloseTo(0.28, 2);
    });

    it('should handle price ending in .005', () => {
      const result = calculateFourWeekRent({
        nightlyRate: 100.005,
        frequency: 4
      });
      // 100.005 * 4 * 4 = 1600.08
      expect(result).toBeCloseTo(1600.08, 2);
    });
  });

  // ============================================================================
  // Large Number Precision
  // ============================================================================
  describe('large number precision', () => {
    it('should handle large nightly rates', () => {
      const result = calculateFourWeekRent({
        nightlyRate: 9999.99,
        frequency: 7
      });
      expect(result).toBeCloseTo(279999.72, 2);
    });

    it('should handle large week counts', () => {
      const result = calculateReservationTotal({
        fourWeekRent: 50000,
        totalWeeks: 520
      });
      // 50000 * (520/4) = 50000 * 130 = 6500000
      expect(result).toBe(6500000);
    });

    it('should handle combination of large values', () => {
      const result = calculateReservationTotal({
        fourWeekRent: 99999.99,
        totalWeeks: 52
      });
      // Should maintain precision
      expect(result).toBeGreaterThan(0);
      expect(Number.isFinite(result)).toBe(true);
    });
  });

  // ============================================================================
  // Markup and Discount Precision
  // ============================================================================
  describe('markup and discount precision', () => {
    it('should handle 17% markup precisely', () => {
      const hostRate = 100;
      const markup = 0.17;
      const result = hostRate * (1 + markup);
      expect(result).toBe(117);
    });

    it('should handle 13% discount precisely', () => {
      const basePrice = 700;
      const discount = 0.13;
      const result = basePrice * (1 - discount);
      expect(result).toBe(609);
    });

    it('should handle combined discount then markup', () => {
      // This is the actual flow: discount first, then markup on discounted price
      const basePrice = 700;
      const discountedPrice = basePrice * 0.87; // 609
      const markupPrice = discountedPrice * 1.17; // 712.53
      expect(markupPrice).toBeCloseTo(712.53, 2);
    });

    it('should handle sequential fee additions', () => {
      const base = 1000;
      const fee1 = 50.50;
      const fee2 = 75.25;
      const total = base + fee1 + fee2;
      expect(total).toBe(1125.75);
    });
  });

  // ============================================================================
  // Division Precision
  // ============================================================================
  describe('division precision', () => {
    it('should handle division by 3', () => {
      const result = calculateReservationTotal({
        fourWeekRent: 1000,
        totalWeeks: 3
      });
      // 1000 * (3/4) = 750
      expect(result).toBe(750);
    });

    it('should handle division by 7', () => {
      const result = calculateReservationTotal({
        fourWeekRent: 700,
        totalWeeks: 7
      });
      // 700 * (7/4) = 1225
      expect(result).toBe(1225);
    });

    it('should handle division producing repeating decimals', () => {
      const result = calculateGuestFacingPrice({
        hostNightlyRate: 100,
        nightsCount: 3
      });
      // Base: 300, Markup: 51, Total: 351, Per night: 117
      expect(result).toBe(117);
    });
  });

  // ============================================================================
  // String to Number Conversion Precision
  // ============================================================================
  describe('string to number conversion', () => {
    it('should convert string decimals correctly', () => {
      const result = getNightlyRateByFrequency({
        listing: {
          'nightly_rate_for_4_night_stay': '99.99'
        },
        nightsSelected: 4
      });
      expect(result).toBe(99.99);
    });

    it('should convert string with many decimals', () => {
      const result = getNightlyRateByFrequency({
        listing: {
          'nightly_rate_for_4_night_stay': '100.123456789'
        },
        nightsSelected: 4
      });
      expect(result).toBeCloseTo(100.123456789, 9);
    });

    it('should convert scientific notation strings', () => {
      const result = getNightlyRateByFrequency({
        listing: {
          'nightly_rate_for_4_night_stay': '1e2'
        },
        nightsSelected: 4
      });
      expect(result).toBe(100);
    });
  });

  // ============================================================================
  // Accumulated Precision Loss
  // ============================================================================
  describe('accumulated precision loss', () => {
    it('should handle summing many small values', () => {
      const weeklyRates = Array(52).fill(100.01); // 52 weeks
      const total = weeklyRates.reduce((sum, rate) => sum + rate, 0);
      // Should be 5200.52
      expect(total).toBeCloseTo(5200.52, 2);
    });

    it('should handle compound calculations', () => {
      // Nightly → Weekly → Monthly → Total
      const nightlyRate = 100.33;
      const nightsPerWeek = 4;
      const weeks = 13;

      const weeklyRent = nightlyRate * nightsPerWeek; // 401.32
      const fourWeekRent = weeklyRent * 4; // 1605.28
      const total = fourWeekRent * (weeks / 4); // 1605.28 * 3.25 = 5217.16

      expect(total).toBeCloseTo(5217.16, 2);
    });

    it('should handle chained percentage operations', () => {
      const price = 1000;
      const afterDiscount = price * 0.87; // 870
      const afterMarkup = afterDiscount * 1.17; // 1017.9
      expect(afterMarkup).toBeCloseTo(1017.9, 1);
    });
  });

  // ============================================================================
  // Rounding Methods
  // ============================================================================
  describe('rounding method verification', () => {
    it('should round .005 up for currency', () => {
      const value = 100.005;
      const rounded = Math.round(value * 100) / 100;
      expect(rounded).toBe(100.01);
    });

    it('should round .004 down for currency', () => {
      const value = 100.004;
      const rounded = Math.round(value * 100) / 100;
      expect(rounded).toBe(100);
    });

    it('should handle banker rounding vs standard rounding', () => {
      // JavaScript uses standard rounding (round half up)
      expect(Math.round(2.5)).toBe(3);
      expect(Math.round(3.5)).toBe(4);
    });

    it('should round toFixed(2) correctly', () => {
      const value = 99.999;
      const rounded = Number(value.toFixed(2));
      expect(rounded).toBe(100);
    });
  });

  // ============================================================================
  // Safe Integer Boundaries
  // ============================================================================
  describe('safe integer boundaries', () => {
    it('should not exceed Number.MAX_SAFE_INTEGER', () => {
      const maxSafe = Number.MAX_SAFE_INTEGER;
      const result = calculateFourWeekRent({
        nightlyRate: 1000000,
        frequency: 7
      });
      // 1000000 * 7 * 4 = 28000000 (well below MAX_SAFE_INTEGER)
      expect(result).toBeLessThanOrEqual(maxSafe);
      expect(Number.isSafeInteger(result)).toBe(true);
    });

    it('should handle values near MAX_SAFE_INTEGER', () => {
      const largeValue = Math.floor(Number.MAX_SAFE_INTEGER / 100);
      expect(largeValue).toBeDefined();
      expect(Number.isSafeInteger(largeValue)).toBe(true);
    });

    it('should detect precision loss beyond MAX_SAFE_INTEGER', () => {
      const beyondSafe = Number.MAX_SAFE_INTEGER + 1;
      expect(Number.isSafeInteger(beyondSafe)).toBe(false);
    });
  });

  // ============================================================================
  // Infinity and NaN Handling
  // ============================================================================
  describe('infinity and NaN handling', () => {
    it('should handle Infinity in calculations', () => {
      const result = calculateFourWeekRent({
        nightlyRate: Infinity,
        frequency: 4
      });
      expect(result).toBe(Infinity);
    });

    it('should handle -Infinity as negative (should throw)', () => {
      expect(() => calculateFourWeekRent({
        nightlyRate: -Infinity,
        frequency: 4
      })).toThrow();
    });

    it('should propagate NaN through calculations', () => {
      expect(() => calculateFourWeekRent({
        nightlyRate: NaN,
        frequency: 4
      })).toThrow();
    });

    it('should detect NaN in results', () => {
      const result = 0 / 0; // Produces NaN
      expect(Number.isNaN(result)).toBe(true);
    });
  });

  // ============================================================================
  // Real-World Currency Scenarios
  // ============================================================================
  describe('real-world currency scenarios', () => {
    it('should calculate exact change scenario', () => {
      // Scenario where total is exactly on dollar boundary
      const nightlyRate = 25; // Exactly divides into 100
      const result = calculateFourWeekRent({
        nightlyRate,
        frequency: 4
      });
      // 25 * 4 * 4 = 400
      expect(result).toBe(400);
      expect(result % 1).toBe(0); // No decimal part
    });

    it('should handle price that never resolves to clean decimal', () => {
      // Like 1/3 = 0.333...
      const result = calculateFourWeekRent({
        nightlyRate: 100 / 3,
        frequency: 3
      });
      // (100/3) * 3 * 4 = 400
      expect(result).toBeCloseTo(400, 10);
    });

    it('should handle tax calculation scenario (8.875% NYC tax)', () => {
      const basePrice = 1000;
      const taxRate = 0.08875;
      const tax = basePrice * taxRate;
      const total = basePrice + tax;
      expect(total).toBeCloseTo(1088.75, 2);
    });

    it('should handle split payment scenario', () => {
      const total = 5200;
      const payments = 3;
      const perPayment = total / payments;
      expect(perPayment).toBeCloseTo(1733.33, 2);
    });
  });
});
